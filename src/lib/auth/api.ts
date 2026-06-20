'use client';

/**
 * Client-side auth API helper.
 * Calls /api/auth/* routes. JWT is in httpOnly cookie (not JS-accessible).
 */

import type { AuthUser } from '@/stores/authStore';

interface AuthResponse {
  user: AuthUser;
  expiresAt: number;
}

interface ApiError {
  error: string;
}

const BASE = '/api/auth';

async function authFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error((data as ApiError).error || `Auth error: ${res.status}`);
  }

  return data as T;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(
  email: string,
  name: string,
  password: string
): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/register', {
    method: 'POST',
    body: JSON.stringify({ email, name, password }),
  });
}

export async function logout(): Promise<void> {
  await authFetch('/logout', { method: 'POST' });
}

export async function getMe(): Promise<{ user: AuthUser }> {
  return authFetch<{ user: AuthUser }>('/me');
}

export async function refreshToken(): Promise<{ expiresAt: number }> {
  return authFetch<{ expiresAt: number }>('/refresh', { method: 'POST' });
}
