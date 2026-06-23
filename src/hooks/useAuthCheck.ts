'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getMe, logout as logoutApi, refreshToken } from '@/lib/auth/api';

/**
 * Checks auth status on mount and sets up token refresh interval.
 * Call this once at the app root (layout or main page).
 */
export function useAuthCheck() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setLoading = useAuthStore((s) => s.setLoading);
  const refreshExpiry = useAuthStore((s) => s.refreshExpiry);

  // Check auth on mount and when auth state rehydrates
  useEffect(() => {

    let cancelled = false;

    async function check() {
      try {
        // If LoginForm just set this flag, skip getMe() — the cookie may not be
        // readable yet and the store is already up to date from the login call.
        let justLoggedIn = false;
        try { justLoggedIn = sessionStorage.getItem('ol_just_logged_in') === '1'; } catch { /* ignore */ }
        if (justLoggedIn && isAuthenticated) {
          try { sessionStorage.removeItem('ol_just_logged_in'); } catch { /* ignore */ }
          setLoading(false);
          return;
        }

        // Skip getMe() if Zustand persist hasn't rehydrated yet — isAuthenticated
        // will be false from the initial state, not from a real auth check.
        // Calling getMe() now would 401 and incorrectly clear auth.
        if (!isAuthenticated) {
          setLoading(false);
          return;
        }

        const data = await getMe();
        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        // Token expired/invalid — only clear if we were actually authenticated
        if (!cancelled && isAuthenticated) {
          clearAuth();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [setUser, clearAuth, setLoading, isAuthenticated]);

  // Set up token refresh (proactive, before expiry)
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(
      async () => {
        try {
          const { expiresAt } = await refreshToken();
          refreshExpiry(expiresAt);
        } catch {
          clearAuth();
        }
      },
      15 * 60 * 1000 // refresh every 15 min
    );

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, refreshExpiry, clearAuth]);

  const handleLogout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore logout errors
    }
    clearAuth();
  }, [clearAuth]);

  return { user, isAuthenticated, isLoading, logout: handleLogout };
}
