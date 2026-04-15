import { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { ApiResponse } from '../../core/utils/apiResponse';
import { ApiError } from '../../core/utils/apiError';
import { UserModel } from '../users/user.model';
import { getAllUsers, updateUserRole, toggleUserActive } from '../users/user.service';
import { assignRealmRole, removeRealmRole } from '../auth/auth.controller';
import { env } from '../../config/env';

const KEYCLOAK_BASE = env.keycloakIssuerBaseUrl;
const TOKEN_URL = `${KEYCLOAK_BASE}/protocol/openid-connect/token`;
const ADMIN_BASE = env.keycloakIssuerBaseUrl.replace(/\/realms\/.*$/, '');
const REALM = env.keycloakIssuerBaseUrl.split('/realms/')[1];

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
  if (!response.ok) throw new ApiError(500, 'Failed to obtain admin token');
  return (data as any).access_token;
}

// --- Stats ---

export const getUserStatsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const [totalUsers, admins, organizators, voters, activeUsers, recentUsers] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ role: 'admin' }),
    UserModel.countDocuments({ role: 'organizator' }),
    UserModel.countDocuments({ role: 'voter' }),
    UserModel.countDocuments({ isActive: true }),
    UserModel.find().sort({ createdAt: -1 }).limit(5).lean()
  ]);

  res.json(new ApiResponse('Admin stats retrieved', {
    totalUsers,
    admins,
    organizators,
    voters,
    activeUsers,
    inactiveUsers: totalUsers - activeUsers,
    recentUsers: recentUsers.map(u => ({
      keycloakId: u.keycloakId,
      username: u.username,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt
    }))
  }));
});

// --- List users ---

export const getAllUsersHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const role = req.query.role as string | undefined;
  const search = req.query.search as string | undefined;

  const filter: any = {};
  if (role && ['admin', 'organizator', 'voter'].includes(role)) {
    filter.role = role;
  }
  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [
      { username: regex },
      { email: regex },
      { firstName: regex },
      { lastName: regex }
    ];
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    UserModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    UserModel.countDocuments(filter)
  ]);

  res.json(new ApiResponse('Users retrieved', {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }));
});

// --- Create user (admin/organizator) ---

const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(['admin', 'organizator'])
});

export const createUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const { email, firstName, lastName, password, role } = createUserSchema.parse(req.body);
  const username = email;

  const adminToken = await getAdminToken();

  // Create user in Keycloak
  const createRes = await fetch(
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
        credentials: [{ type: 'password', value: password, temporary: false }]
      })
    }
  );

  if (!createRes.ok) {
    const errorText = await createRes.text().catch(() => '');
    if (createRes.status === 409) {
      throw new ApiError(409, 'Ya existe un usuario con ese email o nombre de usuario');
    }
    let msg = 'Error al crear usuario en Keycloak';
    try {
      const parsed = JSON.parse(errorText);
      msg = parsed.errorMessage || parsed.error || msg;
    } catch {}
    throw new ApiError(400, msg);
  }

  // Get Keycloak user ID
  const searchRes = await fetch(
    `${ADMIN_BASE}/admin/realms/${REALM}/users?username=${encodeURIComponent(username)}&exact=true`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const kcUsers: any[] = await searchRes.json() as any[];
  if (!kcUsers.length) throw new ApiError(500, 'User created but could not be found in Keycloak');
  const kcUserId = kcUsers[0].id;

  // Assign role in Keycloak
  await assignRealmRole(adminToken, kcUserId, role);

  // Create user in MongoDB
  const user = await UserModel.create({
    keycloakId: kcUserId,
    email,
    firstName,
    lastName,
    username,
    role,
    location: {},
    eligibilityTags: [],
    isActive: true
  });

  res.status(201).json(new ApiResponse('Usuario creado exitosamente', user));
});

// --- Update role ---

export const updateUserRoleHandler = asyncHandler(async (req: Request, res: Response) => {
  const { role } = z.object({ role: z.enum(['admin', 'organizator']) }).parse(req.body);
  const keycloakId = req.params.keycloakId as string;

  // Prevent self-demotion
  if (keycloakId === req.authUser?.sub) {
    throw new ApiError(400, 'No puedes cambiar tu propio rol');
  }

  // Prevent changing voter roles
  const targetUser = await UserModel.findOne({ keycloakId });
  if (targetUser?.role === 'voter') {
    throw new ApiError(400, 'No se puede cambiar el rol de un votante');
  }

  const adminToken = await getAdminToken();

  const allRoles = ['admin', 'organizator', 'voter'] as const;
  for (const r of allRoles) {
    if (r !== role) await removeRealmRole(adminToken, keycloakId, r);
  }
  await assignRealmRole(adminToken, keycloakId, role);

  const user = await updateUserRole(keycloakId, role);
  res.json(new ApiResponse('Rol actualizado', user));
});

// --- Toggle active ---

export const toggleUserActiveHandler = asyncHandler(async (req: Request, res: Response) => {
  const keycloakId = req.params.keycloakId as string;

  if (keycloakId === req.authUser?.sub) {
    throw new ApiError(400, 'No puedes desactivar tu propia cuenta');
  }

  const user = await toggleUserActive(keycloakId);
  res.json(new ApiResponse(`Usuario ${user.isActive ? 'activado' : 'desactivado'}`, user));
});
