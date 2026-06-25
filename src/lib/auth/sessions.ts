import crypto from 'crypto';

export interface Session {
  userId: string;
  refreshTokenHash: string;
  expiresAt: number;
}

// Simple in-memory session store
// Key: hashedRefreshToken, Value: Session
const sessions = new Map<string, Session>();

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string, refreshToken: string, expiresInSeconds: number): Promise<void> {
  const hash = hashToken(refreshToken);
  sessions.set(hash, {
    userId,
    refreshTokenHash: hash,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  });
}

export async function verifySession(refreshToken: string): Promise<Session | null> {
  const hash = hashToken(refreshToken);
  const session = sessions.get(hash);

  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    sessions.delete(hash);
    return null;
  }

  return session;
}

export async function invalidateSession(refreshToken: string): Promise<void> {
  const hash = hashToken(refreshToken);
  sessions.delete(hash);
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  for (const [hash, session] of sessions.entries()) {
    if (session.userId === userId) {
      sessions.delete(hash);
    }
  }
}
