'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { site } from '@/config/site';
import { createClient, resetAuthState } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const startCooldown = useCallback(() => {
    setCooldown(60);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      resetAuthState();
      const supabase = createClient();

      const baseUrl = site.url.replace(/^http:/, 'https:');
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: baseUrl + '/api/auth/callback?next=/reset-password',
      });

      if (authError) {
        setError('A apărut o eroare. Încearcă din nou.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      startCooldown();
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
            <Image src="/logo.png" alt={site.logoAlt} width={260} height={104} className="h-28 w-auto mx-auto" />
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-navy/5 p-8">
          <h2 className="text-2xl font-bold text-navy mb-1">Resetare parola</h2>
          <p className="text-gray-500 text-sm mb-6">Introdu emailul pentru a primi linkul de resetare</p>

          {success ? (
            <p className="text-sm text-green-700 bg-green-50 p-3 rounded-xl">
              Verifică-ți emailul pentru linkul de resetare. Linkul expiră în 1 oră. Verifică și folderul de spam.
            </p>
          ) : (
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

              {error && (
                <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || cooldown > 0}
                className="shimmer-btn w-full py-3 text-white font-bold rounded-full text-base transition-all shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5 disabled:opacity-50"
              >
                {loading ? 'Se trimite...' : cooldown > 0 ? `Reîncearcă în ${cooldown}s` : 'Trimite link de resetare'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link href="/login" className="text-accent font-semibold hover:underline">
              Înapoi la conectare
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
