import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: required('MONGODB_URI'),
  clientUrl: required('CLIENT_URL'),
  keycloakIssuerBaseUrl: required('KEYCLOAK_ISSUER_BASE_URL'),
  keycloakAudience: required('KEYCLOAK_AUDIENCE')
};