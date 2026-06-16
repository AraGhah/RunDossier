import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { config } from '../config.js';

export type AppRole = 'admin' | 'pilot';

export interface AppJwtClaims extends JWTPayload {
  role?: AppRole;
}

function secretKey(): Uint8Array {
  return new TextEncoder().encode(config.jwtSecret);
}

export async function signAppToken(
  claims: AppJwtClaims,
  expiresIn: string
): Promise<string> {
  const builder = new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn);

  if (claims.sub) builder.setSubject(claims.sub);
  if (claims.aud) {
    const aud = Array.isArray(claims.aud) ? claims.aud[0] : claims.aud;
    if (aud) builder.setAudience(String(aud));
  }

  return builder.sign(secretKey());
}

export async function verifyAppToken(
  token: string,
  expected?: { role?: AppRole; audience?: string }
): Promise<AppJwtClaims> {
  const { payload } = await jwtVerify(token, secretKey(), {
    audience: expected?.audience,
  });

  const claims = payload as AppJwtClaims;
  if (expected?.role && claims.role !== expected.role) {
    throw new Error('Invalid token role');
  }

  return claims;
}
