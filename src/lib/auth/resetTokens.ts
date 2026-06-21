/**
 * Shared reset token store.
 * In production, replace with Redis or a database table.
 */

interface ResetTokenData {
  userId: string;
  expiresAt: number;
}

const tokens = new Map<string, ResetTokenData>();

// Clean up expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of tokens) {
    if (data.expiresAt < now) {
      tokens.delete(token);
    }
  }
}, 5 * 60 * 1000);

export function createResetToken(userId: string, ttlMs = 60 * 60 * 1000): string {
  const token = require('crypto').randomBytes(32).toString('hex');
  tokens.set(token, { userId, expiresAt: Date.now() + ttlMs });
  return token;
}

export function validateResetToken(token: string): string | null {
  const data = tokens.get(token);
  if (!data) return null;
  if (data.expiresAt < Date.now()) {
    tokens.delete(token);
    return null;
  }
  return data.userId;
}

export function consumeResetToken(token: string): string | null {
  const userId = validateResetToken(token);
  if (userId) {
    tokens.delete(token);
  }
  return userId;
}
