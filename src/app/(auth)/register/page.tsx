'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { site } from '@/config/site';
import { useRouter } from 'next/navigation';
import { createClient, resetAuthState } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!acceptedTerms) {
      setError('Trebuie să accepți termenii și condițiile.');
      return;
    }
    if (phone && !/^(\+?4?0?)?[0-9\s-]{7,15}$/.test(phone.trim())) {
      setError('Numărul de telefon nu este valid.');
      return;
    }
    if (password.length < 8) {
      setError('Parola trebuie să aibă minim 8 caractere.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Parolele nu se potrivesc');
      return;
    }
    setLoading(true);

    try {
      // Clear any corrupt cookies/session before signup
      resetAuthState();
      const supabase = createClient();

      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone,
          },
        },
      });

      if (authError) {
        setError('Înregistrarea a eșuat. Verifică datele și încearcă din nou.');
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Înregistrarea a eșuat. Te rugăm să încerci din nou.');
        setLoading(false);
        return;
      }

      await supabase.from('profiles').update({ phone, full_name: fullName }).eq('id', user.id);

      router.push('/dashboard');
      router.refresh();
    } catch {
      resetAuthState();
      setError('Eroare de conexiune. Te rugăm încearcă din nou.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen mesh-gradient relative flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <Link href="/">
            <Image src="/logo.png" alt={site.logoAlt} width={260} height={104} className="h-28 w-auto mx-auto" />
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-navy/5 p-8">
          <h2 className="text-2xl font-bold text-navy mb-1">Creează cont</h2>
          <p className="text-gray-500 text-sm mb-6">Create your account to get started</p>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <Input
              label="Nume complet"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ion Popescu"
              autoComplete="name"
              maxLength={100}
              required
              aria-required="true"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplu.ro"
              autoComplete="email"
              required
              aria-required="true"
            />
            <Input
              label="Telefon"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0722 123 456"
              autoComplete="tel"
              maxLength={20}
            />
            <Input
              label="Parolă"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minim 8 caractere"
              autoComplete="new-password"
              minLength={8}
              required
              aria-required="true"
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
              aria-required="true"
            />

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                required
                className="mt-1 h-4 w-4 rounded border-gray-300 accent-accent"
              />
              <span className="text-sm text-gray-500">
                Sunt de acord cu{' '}
                <Link href="/terms" className="text-navy font-semibold hover:underline">
                  Termenii și condițiile
                </Link>{' '}
                și{' '}
                <Link href="/privacy" className="text-navy font-semibold hover:underline">
                  Politica de confidențialitate
                </Link>
              </span>
            </label>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="shimmer-btn w-full py-3 text-white font-bold rounded-full text-base transition-all shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? 'Se creează...' : 'Înregistrare'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Ai deja cont?{' '}
            <Link href="/login" className="text-accent font-semibold hover:underline">
              Conectează-te
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
