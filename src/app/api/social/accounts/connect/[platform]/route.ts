import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// ─── /api/social/accounts/connect/[platform] ──────────────────────

type Params = { params: Promise<{ platform: string }> };

const OAUTH_CONFIGS: Record<string, {
  authUrl: string;
  clientIdEnv: string;
  scope: string;
  extraParams?: Record<string, string>;
}> = {
  x: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    clientIdEnv: 'X_CLIENT_ID',
    scope: 'tweet.read users.read offline.access',
    extraParams: { code_challenge_method: 'plain' },
  },
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    clientIdEnv: 'LINKEDIN_CLIENT_ID',
    scope: 'r_liteprofile r_emailaddress w_member_social',
  },
  instagram: {
    authUrl: 'https://www.facebook.com/v17.0/dialog/oauth',
    clientIdEnv: 'INSTAGRAM_CLIENT_ID',
    scope: 'instagram_basic,instagram_content_publish',
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v17.0/dialog/oauth',
    clientIdEnv: 'FACEBOOK_CLIENT_ID',
    scope: 'pages_manage_posts,pages_read_engagement',
  },
  tiktok: {
    authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    clientIdEnv: 'TIKTOK_CLIENT_ID',
    scope: 'user.info.basic,video.list',
  },
  youtube: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientIdEnv: 'YOUTUBE_CLIENT_ID',
    scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload profile email',
    extraParams: { access_type: 'offline', prompt: 'consent' },
  },
  reddit: {
    authUrl: 'https://www.reddit.com/api/v1/authorize',
    clientIdEnv: 'REDDIT_CLIENT_ID',
    scope: 'identity submit read',
    extraParams: { duration: 'permanent' },
  },
};

export async function GET(req: Request, { params }: Params) {
  const { platform } = await params;
  const config = OAUTH_CONFIGS[platform];

  // Try platform-specific key or a generic fallback (like GOOGLE_CLIENT_ID for YouTube)
  const clientId = config 
    ? (process.env[config.clientIdEnv] || (platform === 'youtube' ? process.env.GOOGLE_CLIENT_ID : null))
    : null;

  if (!config || !clientId) {
    // If not configured, redirect to simulated OAuth page
    const requestUrl = new URL(req.url);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${requestUrl.protocol}//${requestUrl.host}`;
    return NextResponse.redirect(`${baseUrl}/social/connect/simulate?platform=${platform}`);
  }

  // Real OAuth initiation flow
  const state = crypto.randomBytes(16).toString('hex');
  const requestUrl = new URL(req.url);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${requestUrl.protocol}//${requestUrl.host}`;
  const redirectUri = `${baseUrl}/api/social/accounts/connect/${platform}/callback`;

  const cookieStore = await cookies();
  cookieStore.set(`oauth_state_${platform}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
  });

  const url = new URL(config.authUrl);
  url.searchParams.set('response_type', 'code');
  
  if (platform === 'tiktok') {
    url.searchParams.set('client_key', clientId);
  } else {
    url.searchParams.set('client_id', clientId);
  }
  
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', config.scope);
  url.searchParams.set('state', state);

  if (platform === 'x') {
    // For Twitter OAuth 2.0 PKCE challenge method
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    cookieStore.set(`oauth_pkce_${platform}`, codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600,
      path: '/',
      sameSite: 'lax',
    });
    url.searchParams.set('code_challenge', codeVerifier);
    url.searchParams.set('code_challenge_method', 'plain');
  }

  if (config.extraParams) {
    for (const [k, v] of Object.entries(config.extraParams)) {
      url.searchParams.set(k, v);
    }
  }

  return NextResponse.redirect(url.toString());
}

export async function POST(req: Request, { params }: Params) {
  const { platform } = await params;
  const { account_name, platform_user_id, access_token } = await req.json();

  const db = getDb();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  db.prepare(
    `INSERT INTO social_accounts 
     (id, platform, platform_user_id, account_name, access_token, status, last_sync, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, 
    platform, 
    platform_user_id || null, 
    account_name || null, 
    access_token || null, 
    'connected', 
    Date.now(), 
    Date.now()
  );

  revalidatePath('/api/social/accounts');
  return NextResponse.json({ id, platform, status: 'connected' });
}
