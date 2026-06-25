import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, signAccessToken, signRefreshToken, decodeToken } from '@/lib/auth/jwt';
import { findById } from '@/lib/auth/users';
import { verifySession, createSession, invalidateSession, invalidateAllUserSessions } from '@/lib/auth/sessions';
import { serialize } from 'cookie';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refreshToken')?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    // 1. Verify JWT signature and expiry
    const payload = await verifyToken(refreshToken);

    // 2. Verify session exists and is valid (Rotation/Reuse check)
    const session = await verifySession(refreshToken);
    if (!session) {
      // If JWT is valid but session is missing, this is a potential reuse attack
      await invalidateAllUserSessions(payload.userId);
      return NextResponse.json({ error: 'Session invalid or reused' }, { status: 401 });
    }

    // 3. Get user
    const user = await findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // 4. Rotate tokens: Issue new access token AND new refresh token
    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const newRefreshToken = await signRefreshToken({ userId: user.id });

    // 5. Update session store (Invalidate old, create new)
    await invalidateSession(refreshToken);
    await createSession(user.id, newRefreshToken, 60 * 60 * 24 * 7);

    const decoded = decodeToken(accessToken);
    const expiresAt = decoded?.exp ? decoded.exp * 1000 : Date.now() + 15 * 60 * 1000;

    const accessTokenCookie = serialize('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });

    const refreshTokenCookie = serialize('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    const response = NextResponse.json({ expiresAt });
    response.headers.append('Set-Cookie', accessTokenCookie);
    response.headers.append('Set-Cookie', refreshTokenCookie);

    return response;
  } catch (error) {
    const clearAccess = serialize('accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    const clearRefresh = serialize('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    const response = NextResponse.json(
      { error: 'Invalid refresh token' },
      { status: 401 }
    );
    response.headers.append('Set-Cookie', clearAccess);
    response.headers.append('Set-Cookie', clearRefresh);
    return response;
  }
}
