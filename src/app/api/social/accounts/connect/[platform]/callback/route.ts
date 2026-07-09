import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

type Params = { params: Promise<{ platform: string }> };

const TOKEN_URLS: Record<string, string> = {
  x: 'https://api.twitter.com/2/oauth2/token',
  linkedin: 'https://www.linkedin.com/oauth/v2/accessToken',
  instagram: 'https://graph.facebook.com/v17.0/oauth/access_token',
  facebook: 'https://graph.facebook.com/v17.0/oauth/access_token',
  tiktok: 'https://open.tiktokapis.com/v2/oauth/token/',
  youtube: 'https://oauth2.googleapis.com/token',
  reddit: 'https://www.reddit.com/api/v1/access_token',
};

const CLIENT_SECRET_ENVS: Record<string, string> = {
  x: 'X_CLIENT_SECRET',
  linkedin: 'LINKEDIN_CLIENT_SECRET',
  instagram: 'INSTAGRAM_CLIENT_SECRET',
  facebook: 'FACEBOOK_CLIENT_SECRET',
  tiktok: 'TIKTOK_CLIENT_SECRET',
  youtube: 'YOUTUBE_CLIENT_SECRET',
  reddit: 'REDDIT_CLIENT_SECRET',
};

const CLIENT_ID_ENVS: Record<string, string> = {
  x: 'X_CLIENT_ID',
  linkedin: 'LINKEDIN_CLIENT_ID',
  instagram: 'INSTAGRAM_CLIENT_ID',
  facebook: 'FACEBOOK_CLIENT_ID',
  tiktok: 'TIKTOK_CLIENT_ID',
  youtube: 'YOUTUBE_CLIENT_ID',
  reddit: 'REDDIT_CLIENT_ID',
};

export async function GET(req: Request, { params }: Params) {
  const { platform } = await params;
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const requestUrl = new URL(req.url);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${requestUrl.protocol}//${requestUrl.host}`;

  // Error page helper
  const renderError = (msg: string) => {
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>Connection Error</title>
        <style>
          body { background: #0d1117; color: #f0f6fc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #161b22; border: 1px border #30363d; padding: 24px; border-radius: 12px; max-width: 400px; text-align: center; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
          h2 { color: #f85149; margin-top: 0; }
          p { color: #8b949e; font-size: 14px; line-height: 1.5; }
          .btn { background: #1f6feb; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 16px; font-size: 14px; }
          .btn:hover { background: #388bfd; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Connection Failed</h2>
          <p>${msg}</p>
          <button onclick="window.close()" class="btn">Close Window</button>
        </div>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  };

  if (error) {
    return renderError(`Social provider returned error: ${error}`);
  }

  if (!code) {
    return renderError('Authorization code is missing from request.');
  }

  // CSRF validation
  const cookieStore = await cookies();
  const savedState = cookieStore.get(`oauth_state_${platform}`)?.value;
  if (!savedState || savedState !== state) {
    return renderError('CSRF State mismatch. Session may have expired. Please try again.');
  }

  // Clear state cookie
  cookieStore.delete(`oauth_state_${platform}`);

  const clientIdEnv = CLIENT_ID_ENVS[platform];
  const clientSecretEnv = CLIENT_SECRET_ENVS[platform];
  
  const clientId = process.env[clientIdEnv] || (platform === 'youtube' ? process.env.GOOGLE_CLIENT_ID : null);
  const clientSecret = process.env[clientSecretEnv] || (platform === 'youtube' ? process.env.GOOGLE_CLIENT_SECRET : null);

  if (!clientId || !clientSecret) {
    return renderError(`Client configuration missing in environment variable (${clientIdEnv}/${clientSecretEnv}).`);
  }

  const tokenUrl = TOKEN_URLS[platform];
  const redirectUri = `${baseUrl}/api/social/accounts/connect/${platform}/callback`;

  try {
    let accessToken = '';
    let refreshToken = '';
    let expiresIn = 0;
    let username = '';
    let accountName = '';

    // Token Exchange & User Profile Fetching
    if (platform === 'youtube') {
      const tokenRes = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenRes.ok) throw new Error(await tokenRes.text());
      const data = await tokenRes.json();
      accessToken = data.access_token;
      refreshToken = data.refresh_token || '';
      expiresIn = data.expires_in || 0;

      // Get profile
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userRes.ok) {
        const u = await userRes.json();
        username = u.email || u.id;
        accountName = u.name || username;
      }
    } else if (platform === 'x') {
      const codeVerifier = cookieStore.get(`oauth_pkce_${platform}`)?.value || '';
      cookieStore.delete(`oauth_pkce_${platform}`);

      const tokenRes = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),
      });

      if (!tokenRes.ok) throw new Error(await tokenRes.text());
      const data = await tokenRes.json();
      accessToken = data.access_token;
      refreshToken = data.refresh_token || '';
      expiresIn = data.expires_in || 0;

      // Get X user info
      const userRes = await fetch('https://api.twitter.com/2/users/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userRes.ok) {
        const u = await userRes.json();
        username = `@${u.data?.username}`;
        accountName = u.data?.name || username;
      }
    } else if (platform === 'reddit') {
      const tokenRes = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
          'User-Agent': 'OverlordSocialApp/0.1.0'
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenRes.ok) throw new Error(await tokenRes.text());
      const data = await tokenRes.json();
      accessToken = data.access_token;
      refreshToken = data.refresh_token || '';
      expiresIn = data.expires_in || 0;

      // Get profile
      const userRes = await fetch('https://oauth.reddit.com/api/v1/me', {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'OverlordSocialApp/0.1.0'
        },
      });
      if (userRes.ok) {
        const u = await userRes.json();
        username = u.name;
        accountName = `u/${u.name}`;
      }
    } else if (platform === 'linkedin') {
      const tokenRes = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!tokenRes.ok) throw new Error(await tokenRes.text());
      const data = await tokenRes.json();
      accessToken = data.access_token;
      expiresIn = data.expires_in || 0;

      // Get LinkedIn profile
      const userRes = await fetch('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userRes.ok) {
        const u = await userRes.json();
        username = u.id;
        accountName = `${u.localizedFirstName} ${u.localizedLastName}`;
      }
    } else {
      // Generic OAuth fallback/simulation helper
      throw new Error(`Token exchange details for ${platform} are under sandbox setup.`);
    }

    // Default fallbacks if profiles failed but we got a token
    if (!username) {
      username = `user_${Date.now()}`;
      accountName = `${platform.toUpperCase()} Account`;
    }

    // Insert into database
    const db = getDb();
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : null;

    db.prepare(
      `INSERT INTO social_accounts 
       (id, platform, platform_user_id, account_name, access_token, refresh_token, token_expires_at, status, last_sync, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      platform,
      username,
      accountName,
      accessToken,
      refreshToken || null,
      expiresAt,
      'connected',
      Date.now(),
      Date.now()
    );

    revalidatePath('/api/social/accounts');

    // Return gorgeous successful authorization page
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>Connected Successful</title>
        <style>
          body { background: #0d1117; color: #0ea5e9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #161b22; border: 1px solid #30363d; padding: 32px; border-radius: 16px; text-align: center; box-shadow: 0 10px 30px rgba(14, 165, 233, 0.15); }
          .icon { font-size: 48px; margin-bottom: 16px; animation: pulse 2s infinite; }
          h2 { color: #f0f6fc; margin: 0 0 8px 0; font-size: 20px; font-weight: 600; }
          p { color: #8b949e; font-size: 14px; margin: 0; }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.08); }
            100% { transform: scale(1); }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">⚡</div>
          <h2>Connected Successfully</h2>
          <p>Saving authentication credentials and syncing profile...</p>
        </div>
        <script>
          window.opener?.postMessage({ type: 'social_connected', platform: '${platform}' }, '*');
          setTimeout(() => {
            window.close();
          }, 1500);
        </script>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );

  } catch (err: any) {
    return renderError(`Failed to exchange token or retrieve profile: ${err.message || err}`);
  }
}
