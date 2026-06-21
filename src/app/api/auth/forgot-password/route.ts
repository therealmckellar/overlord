import { NextRequest, NextResponse } from 'next/server';
import { findByEmail } from '@/lib/auth/users';
import { createResetToken } from '@/lib/auth/resetTokens';

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Always returns 200 (don't leak whether email exists)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await findByEmail(email);

    // Always return success (don't leak whether email exists)
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with that email, a reset link has been generated.',
      });
    }

    const token = createResetToken(user.id);
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9125'}/reset-password?token=${token}`;

    return NextResponse.json({
      message: 'If an account exists with that email, a reset link has been generated.',
      // Only include token details in development
      ...(process.env.NODE_ENV === 'development' && { resetUrl, token }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
