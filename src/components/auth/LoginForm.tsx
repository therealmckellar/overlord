'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { login: loginApi } = await import('../../lib/auth/api');
      const data = await loginApi(email, password);
      // Set auth store directly — avoids race condition with reload
      setUser(data.user, data.expiresAt);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
      </div>

      {error && (
        <p className="text-xs text-[var(--error)] bg-[var(--error)]/10 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <p className="text-xs text-center text-[var(--text-muted)]">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-[var(--accent)] hover:underline"
        >
          Register
        </button>
      </p>
    </form>
  );
}
