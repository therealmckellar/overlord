export type SafetyAction = 'allow' | 'warn' | 'block';

export interface SafetyRule {
  id: string;
  pattern: RegExp;
  action: SafetyAction;
  reason: string;
  enabled: boolean;
}

export const DEFAULT_SAFETY_RULES: SafetyRule[] = [
  {
    id: 'destructive-delete',
    pattern: /\brm\s+-rf\s+(\/|\/home\b)/,
    action: 'block',
    reason: 'Destructive recursive deletion of root or home directories is strictly blocked.',
    enabled: true,
  },
  {
    id: 'db-destruction',
    pattern: /\b(DROP\s+TABLE|DROP\s+DATABASE|TRUNCATE\s+TABLE)\b/i,
    action: 'block',
    reason: 'Database destruction commands (DROP/TRUNCATE) are strictly blocked.',
    enabled: true,
  },
  {
    id: 'force-push',
    pattern: /\bgit\s+push\s+(--force|-f)\b/,
    action: 'block',
    reason: 'Force pushing to shared branches is blocked to prevent history loss.',
    enabled: true,
  },
  {
    id: 'remote-exec',
    pattern: /\b(curl|wget)\b.*\|.*\b(bash|sh)\b/,
    action: 'block',
    reason: 'Piping remote content directly into a shell is a critical security risk.',
    enabled: true,
  },
  {
    id: 'over-permission',
    pattern: /\bchmod\s+777\b/,
    action: 'warn',
    reason: 'Setting 777 permissions is generally unsafe. Please verify this is necessary.',
    enabled: true,
  },
  {
    id: 'privileged-destruction',
    pattern: /\bsudo\s+rm\b/,
    action: 'block',
    reason: 'Privileged deletion of files via sudo is blocked.',
    enabled: true,
  },
  {
    id: 'disk-ops',
    pattern: /\bdd\s+if=/,
    action: 'warn',
    reason: 'Direct disk writing (dd) can lead to permanent data loss. Proceed with caution.',
    enabled: true,
  },
  {
    id: 'filesystem-format',
    pattern: /\bmkfs\b/,
    action: 'block',
    reason: 'Filesystem formatting commands are strictly blocked.',
    enabled: true,
  },
  {
    id: 'env-sensitive',
    pattern: /\b(production|staging)\b/i,
    action: 'warn',
    reason: 'Command references a production or staging environment. Double-check before executing.',
    enabled: true,
  },
  {
    id: 'npm-publish',
    pattern: /\bnpm\s+publish\b/,
    action: 'warn',
    reason: 'Publishing packages to a registry. Ensure the version and code are correct.',
    enabled: true,
  },
];

export function checkSafety(command: string, rules: SafetyRule[] = DEFAULT_SAFETY_RULES) {
  for (const rule of rules) {
    if (rule.enabled && rule.pattern.test(command)) {
      return {
        action: rule.action,
        matchedRule: rule.id,
        reason: rule.reason,
      };
    }
  }
  return { action: 'allow' as SafetyAction, matchedRule: null, reason: null };
}
