import { useIdentityStore, SCOPE_LEVELS, type AuthorityScope } from '@/stores/identityStore';

export interface AuthorityCheck {
  agentId: string;
  action: string;
  requiredScope: AuthorityScope;
}

export const authorityGuard = {
  check: (check: AuthorityCheck) => {
    const { agentId, action, requiredScope } = check;
    const { identities } = useIdentityStore.getState();
    const identity = identities.find((i) => i.id === agentId);

    if (!identity) {
      const reason = 'Agent identity not found';
      console.error("[AuthGuard] " + reason);
      return { allowed: false, reason };
    }

    if (identity.revoked) {
      const reason = 'Agent identity has been revoked';
      console.error("[AuthGuard] " + reason);
      return { allowed: false, reason };
    }

    const agentLevel = SCOPE_LEVELS[identity.scope];
    const requiredLevel = SCOPE_LEVELS[requiredScope];

    const isAllowed = agentLevel >= requiredLevel;
    const reason = isAllowed ? 'Authorized' : "Authority level " + identity.scope + " is insufficient for " + requiredScope;

    console.log("[AuthGuard] Agent " + identity.name + " (" + identity.scope + ") -> " + action + ": " + (isAllowed ? 'ALLOWED' : 'BLOCKED') + " (" + reason + ")");
    
    useIdentityStore.getState().logSession(agentId, action, isAllowed ? 'allowed' : 'blocked', reason);

    return { allowed: isAllowed, reason };
  },

  authorize: async <T>(check: AuthorityCheck, action: () => Promise<T>) => {
    const result = authorityGuard.check(check);
    if (!result.allowed) {
      throw new Error("Unauthorized: " + result.reason);
    }
    return action();
  },
};
