import { Request, Response } from 'express';
import { z } from 'zod';
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

async function getAdminToken(): Promise<string> {
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
    console.error('Failed to get admin token:', data);
    throw new ApiError(500, 'Failed to obtain admin token');
  }
  console.log('Admin API URL:', `${ADMIN_BASE}/admin/realms/${REALM}/users`);
  return (data as any).access_token;
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
    role: roles.includes('admin') ? 'admin' : 'voter',
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

  // Get admin token to create user via Keycloak Admin API
  const adminToken = await getAdminToken();

  // Create user in Keycloak
  const createUserRes = await fetch(
    `${ADMIN_BASE}/admin/realms/${REALM}/users`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
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

export const adminOnlyHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.json(new ApiResponse('Admin access granted'));
});
