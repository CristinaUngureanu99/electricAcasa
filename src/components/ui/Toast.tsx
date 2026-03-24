'use client';

import { createContext, useCallback, useContext, useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  leaving: boolean;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

const typeStyles: Record<ToastType, string> = {
  success: 'bg-success/90 backdrop-blur-md shadow-success/25 ring-1 ring-white/20',
  error: 'bg-danger/90 backdrop-blur-md shadow-danger/25 ring-1 ring-white/20',
  info: 'bg-navy/90 backdrop-blur-md shadow-navy/25 ring-1 ring-white/20',
};

const icons: Record<ToastType, string> = {
  success: '\u2713',
  error: '\u2715',
  info: '\u2139',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, type, leaving: false }]);
      const timer = setTimeout(() => removeToast(id), 4000);
      timersRef.current.set(id, timer);
    },
    [removeToast],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        role="region"
        aria-live="polite"
        aria-label="Notificări"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              typeStyles[t.type],
              'pointer-events-auto flex items-center gap-2 rounded-2xl px-4 py-3 text-white text-sm font-medium shadow-xl transition-all duration-300',
              t.leaving
                ? 'translate-x-[120%] opacity-0'
                : 'translate-x-0 opacity-100 animate-[slideIn_0.3s_ease-out]',
            )}
            style={{ minWidth: 260 }}
          >
            <span className="text-base font-bold">{icons[t.type]}</span>
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-2 opacity-70 hover:opacity-100 text-base leading-none"
              aria-label="Închide"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
