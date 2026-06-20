import { NextRequest, NextResponse } from 'next/server';
import { createUser, findByEmail, toSafeUser } from '@/lib/auth/users';
import { signTokenPair } from '@/lib/auth/jwt';
import { serialize } from 'cookie';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existing = await findByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    const user = await createUser({ email, name, password });
    const tokens = signTokenPair({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const accessTokenCookie = serialize('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 3600, // 1 hour
    });

    const refreshTokenCookie = serialize('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    const response = NextResponse.json({
      user: toSafeUser(user),
      expiresAt: tokens.expiresAt,
    });
    response.headers.append('Set-Cookie', accessTokenCookie);
    response.headers.append('Set-Cookie', refreshTokenCookie);

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
