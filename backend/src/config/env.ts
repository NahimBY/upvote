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
  keycloakAudience: required('KEYCLOAK_AUDIENCE'),
  keycloakClientId: required('KEYCLOAK_CLIENT_ID'),
  keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
  smtpHost: process.env.SMTP_HOST || 'localhost',
  smtpPort: Number(process.env.SMTP_PORT || 1025),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
};