import { UserModel } from './user.model';
import { IUser } from './user.types';

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