import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
  const clearAccess = serialize('accessToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });

  const clearRefresh = serialize('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: 0,
  });

  const response = NextResponse.json({ success: true });
  response.headers.append('Set-Cookie', clearAccess);
  response.headers.append('Set-Cookie', clearRefresh);

  return response;
}
