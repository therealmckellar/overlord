'use client';

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getMe, logout as logoutApi, refreshToken } from '@/lib/auth/api';

/**
 * Checks auth status on mount and sets up token refresh interval.
 * Call this once at the app root (layout or main page).
 */
export function useAuthCheck() {
  const { user, isAuthenticated, isLoading, setUser, clearAuth, setLoading, refreshExpiry } =
    useAuthStore();

  // Check auth on mount
  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const data = await getMe();
        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        // Not authenticated — that's fine, show login
        if (!cancelled) {
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
  }, [setUser, clearAuth, setLoading]);

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
