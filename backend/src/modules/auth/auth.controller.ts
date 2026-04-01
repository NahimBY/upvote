import { Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { ApiResponse } from '../../core/utils/apiResponse';
import { ApiError } from '../../core/utils/apiError';
import { env } from '../../config/env';
import { findOrCreateUserFromToken } from '../users/user.service';

const KEYCLOAK_BASE = env.keycloakIssuerBaseUrl; // http://localhost:8080/realms/upvote
const TOKEN_URL = `${KEYCLOAK_BASE}/protocol/openid-connect/token`;
const USERINFO_URL = `${KEYCLOAK_BASE}/protocol/openid-connect/userinfo`;
const LOGOUT_URL = `${KEYCLOAK_BASE}/protocol/openid-connect/logout`;
const ADMIN_BASE = env.keycloakIssuerBaseUrl.replace(/\/realms\/.*$/, ''); // http://localhost:8080
const REALM = env.keycloakIssuerBaseUrl.split('/realms/')[1]; // upvote

// --- Helpers ---

function decodeJwtPayload(token: string): any {
  const base64 = token.split('.')[1];
  const json = Buffer.from(base64, 'base64url').toString('utf-8');
  return JSON.parse(json);
}

async function keycloakTokenRequest(params: URLSearchParams) {
  params.append('client_id', env.keycloakClientId);
  if (env.keycloakClientSecret) {
    params.append('client_secret', env.keycloakClientSecret);
  }

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const data = await response.json();

  if (!response.ok) {
    const msg = (data as any).error_description || (data as any).error || 'Authentication failed';
    throw new ApiError(response.status === 401 ? 401 : 400, msg);
  }

  return data;
}

async function getOrganizatorToken(): Promise<string> {
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', env.keycloakClientId);
  if (env.keycloakClientSecret) {
    params.append('client_secret', env.keycloakClientSecret);
  }

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Failed to get organizator token:', data);
    throw new ApiError(500, 'Failed to obtain organizator token');
  }
  return (data as any).access_token;
}

async function getKeycloakUserId(organizatorToken: string, username: string): Promise<string> {
  const res = await fetch(
    `${ADMIN_BASE}/admin/realms/${REALM}/users?username=${encodeURIComponent(username)}&exact=true`,
    { headers: { Authorization: `Bearer ${organizatorToken}` } }
  );
  const users: any[] = await res.json() as any[];
  if (!users.length) throw new ApiError(404, 'User not found in Keycloak');
  return users[0].id;
}

export async function assignRealmRole(organizatorToken: string, userId: string, roleName: string): Promise<void> {
  // Get the role representation
  const roleRes = await fetch(
    `${ADMIN_BASE}/admin/realms/${REALM}/roles/${encodeURIComponent(roleName)}`,
    { headers: { Authorization: `Bearer ${organizatorToken}` } }
  );
  if (!roleRes.ok) throw new ApiError(400, `Realm role '${roleName}' not found in Keycloak`);
  const role = await roleRes.json();

  // Assign the role to the user
  const assignRes = await fetch(
    `${ADMIN_BASE}/admin/realms/${REALM}/users/${userId}/role-mappings/realm`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${organizatorToken}`
      },
      body: JSON.stringify([role])
    }
  );
  if (!assignRes.ok) {
    const err = await assignRes.text().catch(() => '');
    throw new ApiError(500, `Failed to assign role in Keycloak: ${err}`);
  }
}

export async function removeRealmRole(organizatorToken: string, userId: string, roleName: string): Promise<void> {
  const roleRes = await fetch(
    `${ADMIN_BASE}/admin/realms/${REALM}/roles/${encodeURIComponent(roleName)}`,
    { headers: { Authorization: `Bearer ${organizatorToken}` } }
  );
  if (!roleRes.ok) return; // Role doesn't exist, nothing to remove
  const role = await roleRes.json();

  await fetch(
    `${ADMIN_BASE}/admin/realms/${REALM}/users/${userId}/role-mappings/realm`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${organizatorToken}`
      },
      body: JSON.stringify([role])
    }
  );
}

// --- Schemas ---

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1)
});

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(6)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6)
});

const RESET_SECRET = env.keycloakClientSecret + '_reset';

const mailTransporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: false,
  ...(env.smtpUser && {
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  }),
});

function buildResetEmail(resetLink: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background-color:#1e293b;border-radius:16px;border:1px solid rgba(51,65,85,0.5);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(51,65,85,0.5);">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">UpVote</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#ffffff;">Recuperar contraseña</h2>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#94a3b8;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón de abajo para crear una nueva contraseña.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:4px 0 24px;">
                    <a href="${resetLink}" target="_blank" style="display:inline-block;padding:12px 32px;background-color:#10b981;color:#0f172a;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
                      Restablecer contraseña
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#64748b;">
                Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña no será modificada.
              </p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
                Este enlace expira en <strong style="color:#94a3b8;">30 minutos</strong>.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;text-align:center;border-top:1px solid rgba(51,65,85,0.5);">
              <p style="margin:0;font-size:12px;color:#475569;">
                &copy; ${new Date().getFullYear()} UpVote. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// --- Handlers ---

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('username', email);
  params.append('password', password);

  const tokenData: any = await keycloakTokenRequest(params);

  // Decode JWT and sync user to MongoDB
  const payload = decodeJwtPayload(tokenData.access_token);
  const roles = payload.realm_access?.roles || [];

  console.log('JWT payload sub:', payload.sub);
  console.log('JWT payload email:', payload.email);
  console.log('JWT payload username:', payload.preferred_username);

  const user = await findOrCreateUserFromToken({
    keycloakId: payload.sub,
    email: payload.email || email,
    firstName: payload.given_name || '',
    lastName: payload.family_name || '',
    username: payload.preferred_username || email,
    role: roles.includes('admin') ? 'admin' : roles.includes('organizator') ? 'organizator' : 'voter',
    location: {},
    eligibilityTags: [],
    isActive: true
  });

  console.log('MongoDB user saved:', user?._id, user?.keycloakId);

  res.json(new ApiResponse('Login successful', {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    tokenType: tokenData.token_type
  }));
});

export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, username, firstName, lastName, password } = registerSchema.parse(req.body);

  // Get organizator token to create user via Keycloak Admin API
  const organizatorToken = await getOrganizatorToken();

  // Create user in Keycloak
  const createUserRes = await fetch(
    `${ADMIN_BASE}/admin/realms/${REALM}/users`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${organizatorToken}`
      },
      body: JSON.stringify({
        email,
        username,
        firstName,
        lastName,
        enabled: true,
        emailVerified: true,
        credentials: [
          {
            type: 'password',
            value: password,
            temporary: false
          }
        ]
      })
    }
  );

  if (!createUserRes.ok) {
    const errorText = await createUserRes.text().catch(() => '');
    console.error(`Keycloak register failed [${createUserRes.status}]:`, errorText);
    if (createUserRes.status === 409) {
      throw new ApiError(409, 'User with this email or username already exists');
    }
    let msg = 'Failed to create user in Keycloak';
    try {
      const parsed = JSON.parse(errorText);
      msg = parsed.errorMessage || parsed.error || msg;
    } catch {}
    throw new ApiError(400, msg);
  }

  // Assign 'voter' realm role in Keycloak
  const kcUserId = await getKeycloakUserId(organizatorToken, username);
  await assignRealmRole(organizatorToken, kcUserId, 'voter');

  // Auto-login after registration
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('username', username);
  params.append('password', password);

  const tokenData: any = await keycloakTokenRequest(params);

  // Decode JWT and sync to MongoDB
  const payload = decodeJwtPayload(tokenData.access_token);

  await findOrCreateUserFromToken({
    keycloakId: payload.sub,
    email,
    firstName,
    lastName,
    username,
    role: 'voter',
    location: {},
    eligibilityTags: [],
    isActive: true
  });

  res.status(201).json(new ApiResponse('Registration successful', {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    tokenType: tokenData.token_type
  }));
});

export const refreshTokenHandler = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = refreshSchema.parse(req.body);

  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);

  const tokenData: any = await keycloakTokenRequest(params);

  res.json(new ApiResponse('Token refreshed', {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    tokenType: tokenData.token_type
  }));
});

export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = refreshSchema.parse(req.body);

  const params = new URLSearchParams();
  params.append('client_id', env.keycloakClientId);
  if (env.keycloakClientSecret) {
    params.append('client_secret', env.keycloakClientSecret);
  }
  params.append('refresh_token', refreshToken);

  await fetch(LOGOUT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  res.json(new ApiResponse('Logout successful'));
});

// --- Existing handlers ---

export const getMeHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json(
    new ApiResponse('Authenticated user retrieved', {
      sub: req.authUser?.sub,
      email: req.authUser?.email,
      username: req.authUser?.username,
      firstName: req.authUser?.firstName,
      lastName: req.authUser?.lastName,
      roles: req.authUser?.realmRoles || []
    })
  );
});

export const checkSessionHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.json(new ApiResponse('Session is valid'));
});

export const organizatorOnlyHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.json(new ApiResponse('Organizator access granted'));
});

export const forgotPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email } = forgotPasswordSchema.parse(req.body);

  const organizatorToken = await getOrganizatorToken();

  // Search user by email in Keycloak
  const searchRes = await fetch(
    `${ADMIN_BASE}/admin/realms/${REALM}/users?email=${encodeURIComponent(email)}&exact=true`,
    { headers: { Authorization: `Bearer ${organizatorToken}` } }
  );
  const users: any[] = await searchRes.json() as any[];

  if (!users.length) {
    // Return success even if user not found to prevent email enumeration
    res.json(new ApiResponse('Si el correo está registrado, recibirás un enlace para restablecer tu contraseña'));
    return;
  }

  const keycloakUserId = users[0].id;

  // Generate a short-lived JWT for the reset link
  const resetToken = jwt.sign(
    { sub: keycloakUserId, email, purpose: 'password-reset' },
    RESET_SECRET,
    { expiresIn: '30m' }
  );

  const resetLink = `${env.clientUrl}/reset-password?token=${resetToken}`;

  await mailTransporter.sendMail({
    from: '"UpVote Team" <alex.mtz.rv17@gmail.com>',
    to: email,
    subject: 'Recuperar contraseña - UpVote',
    html: buildResetEmail(resetLink),
  });

  res.json(new ApiResponse('Si el correo está registrado, recibirás un enlace para restablecer tu contraseña'));
});

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = resetPasswordSchema.parse(req.body);

  let payload: any;
  try {
    payload = jwt.verify(token, RESET_SECRET);
  } catch {
    throw new ApiError(400, 'El enlace de recuperación es inválido o ha expirado');
  }

  if (payload.purpose !== 'password-reset') {
    throw new ApiError(400, 'Token inválido');
  }

  const organizatorToken = await getOrganizatorToken();

  // Reset password via Keycloak Admin API
  const resetRes = await fetch(
    `${ADMIN_BASE}/admin/realms/${REALM}/users/${payload.sub}/reset-password`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${organizatorToken}`
      },
      body: JSON.stringify({
        type: 'password',
        value: password,
        temporary: false
      })
    }
  );

  if (!resetRes.ok) {
    const errorText = await resetRes.text().catch(() => '');
    console.error(`Keycloak reset-password failed [${resetRes.status}]:`, errorText);
    throw new ApiError(500, 'Error al restablecer la contraseña');
  }

  res.json(new ApiResponse('Contraseña restablecida exitosamente'));
});
