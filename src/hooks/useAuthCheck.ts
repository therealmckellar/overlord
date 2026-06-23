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

  // Track whether a fresh login just happened (survives effect re-runs)
  const justLoggedInRef = useRef(false);
  try {
    if (sessionStorage.getItem('ol_just_logged_in') === '1') {
      justLoggedInRef.current = true;
      sessionStorage.removeItem('ol_just_logged_in');
    }
  } catch { /* ignore */ }

  // Check auth on mount and when auth state changes
  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        // If LoginForm just logged in, trust the store — skip getMe() to avoid
        // any cookie-timing edge effects.
        if (justLoggedInRef.current && isAuthenticated) {
          justLoggedInRef.current = false;
          setLoading(false);
          return;
        }

        // Not authenticated — don't call getMe, just settle loading.
        if (!isAuthenticated) {
          setLoading(false);
          return;
        }

        // Authenticated — validate session with getMe.
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
