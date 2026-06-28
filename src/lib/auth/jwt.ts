import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-in-production');
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPayload extends jose.JWTPayload {
  userId: string;
  username: string;
  email: string;
  name: string;
  role: string;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export async function signAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function signRefreshToken(payload: { userId: string }): Promise<string> {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jose.jwtVerify(token, JWT_SECRET);
  return payload as unknown as TokenPayload;
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jose.decodeJwt(token) as TokenPayload;
  } catch {
    return null;
  }
}

export async function signTokenPair(user: { id: string; username: string; email: string; name: string; role: string }): Promise<TokenPair> {
  const accessToken = await signAccessToken({
    userId: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  const refreshToken = await signRefreshToken({ userId: user.id });

  const decoded = decodeToken(accessToken);
  const expiresAt = decoded?.exp ? decoded.exp * 1000 : Date.now() + 15 * 60 * 1000;

  return { accessToken, refreshToken, expiresAt };
}
