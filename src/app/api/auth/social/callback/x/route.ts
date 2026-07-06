import { NextResponse } from 'next/server';
import sqlite3 from 'better-sqlite3';

const DB_PATH = '/home/rmckellar/overlord/data/overlord.db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/social/callback/x`),
        client_id: process.env.X_CLIENT_ID!,
        client_secret: process.env.X_CLIENT_SECRET!,
        code_verifier: 'challenge', // Matches the plain challenge in the connect route
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twitter Token Error:', data);
      return NextResponse.json({ error: 'Failed to exchange code for token' }, { status: 400 });
    }

    // Update or Insert the social account into the DB
    const db = new sqlite3(DB_PATH);
    const upsertAccount = db.prepare(`
      INSERT INTO social_accounts (id, platform, platform_user_id, account_name, access_token, refresh_token, token_expires_at, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        access_token = excluded.access_token, 
        refresh_token = excluded.refresh_token, 
        token_expires_at = excluded.token_expires_at, 
        status = 'connected'
    `);

    // In a real scenario, we'd fetch the user's profile to get platform_user_id and account_name
    // For speed, we'll use a generic ID for the owner
    const accountId = 'rich_owner_x'; 
    const now = Date.now();
    
    upsertAccount.run(
      accountId, 
      'x', 
      'unknown', 
      'Rich', 
      data.access_token, 
      data.refresh_token, 
      now + (data.expires_in * 1000), 
      'connected', 
      now
    );

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?connected=true`);
  } catch (error) {
    console.error('Callback Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
