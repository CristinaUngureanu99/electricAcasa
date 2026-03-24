'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient, resetAuthState } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Clear any corrupt cookies/session before login
      resetAuthState();
      const supabase = createClient();

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError('Email sau parolă incorectă.');
        setLoading(false);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      resetAuthState();
      setError('Eroare de conexiune. Încearcă din nou.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen mesh-gradient relative flex items-center justify-center px-4">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <Link href="/">
            <span className="text-3xl font-bold text-primary">
              electricAcasa<span className="text-primary/60 font-normal text-lg">.ro</span>
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-navy/5 p-8">
          <h2 className="text-2xl font-bold text-navy mb-1">Bine ai revenit</h2>
          <p className="text-gray-500 text-sm mb-6">Conectează-te la contul tău</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplu.ro"
              autoComplete="email"
              required
            />
            <Input
              label="Parolă"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />

            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-accent hover:underline">
                Ai uitat parola?
              </Link>
            </div>

            {error && <p className="text-sm text-danger bg-danger/10 p-3 rounded-xl">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="shimmer-btn w-full py-3 text-white font-bold rounded-full text-base transition-all shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? 'Se conectează...' : 'Conectare'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Nu ai cont?{' '}
            <Link href="/register" className="text-accent font-semibold hover:underline">
              Înregistrează-te
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
