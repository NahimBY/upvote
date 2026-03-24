import { auth } from 'express-oauth2-jwt-bearer';
import { env } from './env';

export const checkJwt = auth({
  audience: env.keycloakAudience,
  issuerBaseURL: env.keycloakIssuerBaseUrl,
  tokenSigningAlg: 'RS256'
});