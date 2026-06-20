'use client';

import React, { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { X, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const iconMap = {
  info: <Info className="w-4 h-4 text-[var(--info)]" />,
  success: <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />,
  warning: <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />,
  error: <XCircle className="w-4 h-4 text-[var(--error)]" />,
};

const bgMap = {
  info: 'border-[var(--info)] bg-[var(--bg-secondary)]',
  success: 'border-[var(--success)] bg-[var(--bg-secondary)]',
  warning: 'border-[var(--warning)] bg-[var(--bg-secondary)]',
  error: 'border-[var(--error)] bg-[var(--bg-secondary)]',
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: { id: string; type: 'info' | 'success' | 'warning' | 'error'; message: string }; onDismiss: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const duration = 4000;
    const exitTimer = setTimeout(() => setExiting(true), duration - 300);
    const removeTimer = setTimeout(onDismiss, duration);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [onDismiss]);

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-lg border-l-4 shadow-lg
        ${bgMap[toast.type]}
        ${exiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}
      `}
    >
      {iconMap[toast.type]}
      <p className="flex-1 text-sm text-[var(--text)]">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-0.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
