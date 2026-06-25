import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, TokenPayload } from '@/lib/auth/jwt';

// Routes that don't require authentication
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api/health',
  '/_next',
  '/favicon.ico',
];

// API routes that require authentication
const PROTECTED_API_PREFIXES = [
  '/api/chat',
  '/api/export',
  '/api/models',
  '/api/pipeline',
  '/api/sessions',
  '/api/stt',
  '/api/upload',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
}

function isProtectedApi(pathname: string): boolean {
  return PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Allow static assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  // Check auth for protected API routes
  if (isProtectedApi(pathname)) {
    const token = req.cookies.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      const payload = await verifyToken(token);
      // Attach user info to request headers for downstream use
      const response = NextResponse.next();
      response.headers.set('x-user-id', payload.userId);
      response.headers.set('x-user-email', payload.email);
      response.headers.set('x-user-role', payload.role);
      return response;
    } catch (error: any) {
      // Token expired or invalid — clear cookie and 401
      const response = NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
      response.cookies.delete('accessToken');
      return response;
    }
  }

  // For non-API routes (pages), let the page handle auth client-side
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
