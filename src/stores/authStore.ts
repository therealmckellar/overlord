/**
 * Zustand Store — Authentication State
 * Manages user session on the client side.
 * JWT lives in httpOnly cookie (not accessible here).
 * This store tracks: user info, auth status, token expiry.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: number;
  lastLoginAt?: number;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  expiresAt: number | null;

  // Actions
  setUser: (user: AuthUser, expiresAt?: number) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  refreshExpiry: (expiresAt: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      expiresAt: null,

      setUser: (user, expiresAt) =>
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          expiresAt: expiresAt || null,
        }),

      clearAuth: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          expiresAt: null,
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      refreshExpiry: (expiresAt) => set({ expiresAt }),
    }),
    {
      name: 'agent-os-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        expiresAt: state.expiresAt,
        // Don't persist isLoading
      }),
    }
  )
);
