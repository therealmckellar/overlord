import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, signAccessToken, decodeToken } from '@/lib/auth/jwt';
import { findById } from '@/lib/auth/users';
import { serialize } from 'cookie';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refreshToken')?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    // Verify the refresh token
    const payload = verifyToken(refreshToken);

    // Get user
    const user = await findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Issue new access token
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const decoded = decodeToken(accessToken);
    const expiresAt = decoded?.exp ? decoded.exp * 1000 : Date.now() + 3600000;

    const accessTokenCookie = serialize('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 3600,
    });

    const response = NextResponse.json({ expiresAt });
    response.headers.append('Set-Cookie', accessTokenCookie);

    return response;
  } catch (error) {
    // Clear cookies on error
    const clearAccess = serialize('accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    const response = NextResponse.json(
      { error: 'Invalid refresh token' },
      { status: 401 }
    );
    response.headers.append('Set-Cookie', clearAccess);
    return response;
  }
}
