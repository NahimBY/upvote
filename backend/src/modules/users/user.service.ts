import { UserModel } from './user.model';
import { IUser, UserRole } from './user.types';
import { ApiError } from '../../core/utils/apiError';

export async function findUserByKeycloakId(keycloakId: string) {
  return UserModel.findOne({ keycloakId });
}

export async function createUser(data: IUser) {
  return UserModel.create(data);
}

export async function findOrCreateUserFromToken(data: IUser) {
  const existing = await UserModel.findOne({ keycloakId: data.keycloakId });
  if (existing) return existing;
  return UserModel.create(data);
}

export async function getAllUsers(page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    UserModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    UserModel.countDocuments()
  ]);
  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updateUserRole(keycloakId: string, role: UserRole) {
  const user = await UserModel.findOneAndUpdate({ keycloakId }, { role }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function toggleUserActive(keycloakId: string) {
  const user = await UserModel.findOne({ keycloakId });
  if (!user) throw new ApiError(404, 'User not found');
  user.isActive = !user.isActive;
  return user.save();
}
