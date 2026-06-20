import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_EXPIRES_IN: string = process.env.REFRESH_EXPIRES_IN || '7d';

export interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export function signAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function signRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}

export function signTokenPair(user: { id: string; email: string; name: string; role: string }): TokenPair {
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  const refreshToken = signRefreshToken({ userId: user.id });

  const decoded = decodeToken(accessToken);
  const expiresAt = decoded?.exp ? decoded.exp * 1000 : Date.now() + 3600000;

  return { accessToken, refreshToken, expiresAt };
}
