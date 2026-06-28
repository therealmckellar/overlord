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

  // Track whether a fresh login just happened (persists across effect re-runs)
  const justLoggedInRef = useRef(false);
  try {
    if (sessionStorage.getItem('ol_just_logged_in') === '1') {
      justLoggedInRef.current = true;
      sessionStorage.removeItem('ol_just_logged_in');
    }
  } catch { /* ignore */ }

  // Track whether we've already validated to avoid repeated getMe calls
  const hasValidatedRef = useRef(false);

  // Check auth on mount only — use a ref to track auth state for the effect
  const isAuthenticatedRef = useRef(isAuthenticated);
  isAuthenticatedRef.current = isAuthenticated;

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        // If LoginForm just logged in, trust the store — skip getMe() to avoid
        // any cookie-timing edge effects.
        if (justLoggedInRef.current && isAuthenticatedRef.current) {
          setLoading(false);
          return;
        }

        // Not authenticated — don't call getMe, just settle loading.
        if (!isAuthenticatedRef.current) {
          setLoading(false);
          return;
        }

        // Already validated this session — skip
        if (hasValidatedRef.current) {
          return;
        }

        // Authenticated — validate session with getMe.
        const data = await getMe();
        hasValidatedRef.current = true;
        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        // Token expired/invalid — only clear if we were actually authenticated
        if (!cancelled && isAuthenticatedRef.current) {
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
    // Only run on mount — auth state changes are handled by the store directly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
