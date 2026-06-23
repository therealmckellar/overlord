import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials, toSafeUser } from '@/lib/auth/users';
import { signTokenPair } from '@/lib/auth/jwt';
import { serialize } from 'cookie';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await validateCredentials(email, password);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const tokens = signTokenPair({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const accessTokenCookie = serialize('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600,
    });

    const refreshTokenCookie = serialize('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: 60 * 60 * 24 * 7,
    });

    const response = NextResponse.json({
      user: toSafeUser(user),
      expiresAt: tokens.expiresAt,
    });
    response.headers.append('Set-Cookie', accessTokenCookie);
    response.headers.append('Set-Cookie', refreshTokenCookie);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
