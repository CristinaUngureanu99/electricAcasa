'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { site } from '@/config/site';
import { useRouter } from 'next/navigation';
import { createClient, resetAuthState } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Parolele nu coincid.');
      return;
    }

    if (password.length < 8) {
      setError('Parola trebuie să aibă cel puțin 8 caractere.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.updateUser({
        password,
      });

      if (authError) {
        setError('Eroare la resetarea parolei. Încearcă din nou.');
        setLoading(false);
        return;
      }

      // Sign out all other sessions for security
      await supabase.auth.signOut({ scope: 'others' });

      router.push('/dashboard');
      router.refresh();
    } catch {
      resetAuthState();
      setError('Eroare de conexiune. Te rugăm încearcă din nou.');
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
          <h2 className="text-2xl font-bold text-navy mb-1">Parolă nouă</h2>
          <p className="text-gray-500 text-sm mb-6">Introdu noua ta parolă</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Parolă nouă"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minim 8 caractere"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <Input
              label="Confirmă parola"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repetă parola"
              autoComplete="new-password"
              minLength={8}
              required
            />

            {error && (
              <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="shimmer-btn w-full py-3 text-white font-bold rounded-full text-base transition-all shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? 'Se salvează...' : 'Salvează parola'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
