import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthorityScope = 'READ_ONLY' | 'SUGGEST' | 'WRITE' | 'DEPLOY' | 'ADMIN' | 'OWNER';

export const SCOPE_LEVELS: Record<AuthorityScope, number> = {
  READ_ONLY: 1,
  SUGGEST: 2,
  WRITE: 3,
  DEPLOY: 4,
  ADMIN: 5,
  OWNER: 6,
};

export interface AgentIdentity {
  id: string;
  name: string;
  description: string;
  token: string;
  scope: AuthorityScope;
  capabilities: string[];
  createdAt: number;
  updatedAt: number;
  revoked: boolean;
  sessionHistory: {
    timestamp: string;
    action: string;
    status: 'allowed' | 'blocked';
    reason?: string;
  }[];
}

interface IdentityState {
  identities: AgentIdentity[];
  createIdentity: (data: { name: string; description: string; scope: AuthorityScope; capabilities: string[] }) => AgentIdentity;
  updateIdentity: (id: string, updates: Partial<AgentIdentity>) => void;
  rotateToken: (id: string) => void;
  revokeIdentity: (id: string) => void;
  logSession: (id: string, action: string, status: 'allowed' | 'blocked', reason?: string) => void;
}

export const useIdentityStore = create<IdentityState>()(
  persist(
    (set) => ({
      identities: [],
      createIdentity: (data) => {
        const newIdentity: AgentIdentity = {
          id: Math.random().toString(36).substr(2, 9),
          ...data,
          token: Math.random().toString(36).substr(2, 32),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          revoked: false,
          sessionHistory: [],
        };
        set((state) => ({ identities: [...state.identities, newIdentity] }));
        return newIdentity;
      },
      updateIdentity: (id, updates) =>
        set((state) => ({
          identities: state.identities.map((i) =>
            i.id === id ? { ...i, ...updates, updatedAt: Date.now() } : i
          ),
        })),
      rotateToken: (id) =>
        set((state) => ({
          identities: state.identities.map((i) =>
            i.id === id ? { ...i, token: Math.random().toString(36).substr(2, 32), updatedAt: Date.now() } : i
          ),
        })),
      revokeIdentity: (id) =>
        set((state) => ({
          identities: state.identities.map((i) =>
            i.id === id ? { ...i, revoked: true, updatedAt: Date.now() } : i
          ),
        })),
      logSession: (id, action, status, reason) =>
        set((state) => ({
          identities: state.identities.map((i) =>
            i.id === id
              ? {
                  ...i,
                  sessionHistory: [
                    { timestamp: new Date().toISOString(), action, status, reason },
                    ...i.sessionHistory.slice(0, 99),
                  ],
                }
              : i
          ),
        })),
    }),
    {
      name: 'overlord-identity',
    }
  )
);
