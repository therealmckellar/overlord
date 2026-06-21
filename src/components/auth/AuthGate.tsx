'use client';

import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export function AuthGate({ children }: { children?: React.ReactNode }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg)]">
      <div className="flex flex-col items-center gap-6 p-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center">
            <span className="text-white font-bold text-lg">O</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]">Overlord</h1>
            <p className="text-xs text-[var(--text-muted)]">Agent OS</p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-sm p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mb-6">
            {mode === 'login'
              ? 'Sign in to access your workspace'
              : 'Get started with your free account'}
          </p>

          {mode === 'login' ? (
            <LoginForm
              onSuccess={() => {
                // Auth state is already set by LoginForm — no reload needed
              }}
              onSwitchToRegister={() => setMode('register')}
            />
          ) : (
            <RegisterForm
              onSuccess={() => {
                // Auth state is already set by RegisterForm — no reload needed
              }}
              onSwitchToLogin={() => setMode('login')}
            />
          )}
        </div>

        {/* Footer hint */}
        <p className="text-[10px] text-[var(--text-muted)]">
          Secured with JWT • httpOnly cookies • SameSite=Strict
        </p>
      </div>
    </div>
  );
}
