import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, TokenPayload } from '@/lib/auth/jwt';
import { findById, toSafeUser } from '@/lib/auth/users';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const payload = await verifyToken(token);
      const user = await findById(payload.userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({ user: toSafeUser(user) });
    } catch (error: unknown) {
      if (error instanceof Error && (error as any).code === 'ERR_JWT_EXPIRED') {
        // Access token expired - try to auto-refresh if refresh token exists
        const refreshToken = req.cookies.get('refreshToken')?.value;
        if (!refreshToken) {
          return NextResponse.json({ error: 'Token expired' }, { status: 401 });
        }
        
        // Note: In a real Next.js app, you can't easily call another API route 
        // and set cookies in a single GET request without a redirect or client-side loop.
        // However, we can implement the logic here or signal the client to refresh.
        // For this task, we'll return a specific error code so the client knows to call /refresh.
        return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, { status: 401 });
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also export the token payload type for use in other routes
export type { TokenPayload };
