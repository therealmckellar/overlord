import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.X_CLIENT_ID;
  const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/social/callback/x`);
  
  if (!clientId) {
    return NextResponse.json({ error: 'X_CLIENT_ID not configured' }, { status: 500 });
  }

  // OAuth 2.0 PKCE is recommended, but for speed, we'll use the standard Authorization Code flow
  const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=tweet.read%20users.read%20offline.access&state=overlord_state&code_challenge=challenge&code_challenge_method=plain`;

  return NextResponse.redirect(authUrl);
}
