'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

interface NewsletterSignupProps {
  compact?: boolean;
}

export function NewsletterSignup({ compact }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Eroare la abonare');
        setStatus('error');
        return;
      }
      setStatus('success');
      setEmail('');
    } catch {
      setErrorMsg('Eroare neasteptata');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
        <CheckCircle size={compact ? 16 : 20} className="text-success shrink-0" />
        <span className={compact ? 'text-gray-300' : 'text-success font-medium'}>
          Te-ai abonat cu succes!
        </span>
      </div>
    );
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setStatus('idle');
          }}
          placeholder="Adresa ta de email"
          required
          className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-gray-500"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-40 shrink-0"
        >
          {status === 'loading' ? '...' : 'Aboneaza-te'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setStatus('idle');
        }}
        placeholder="Adresa ta de email"
        required
        className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-white/30 bg-white/15 text-white placeholder:text-white/60 focus:outline-none focus:bg-white/25 focus:border-white/50 transition-colors"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-6 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-white/90 hover:shadow-md transition-all disabled:opacity-40 shrink-0"
      >
        {status === 'loading' ? 'Se trimite...' : 'Aboneaza-te'}
      </button>
      {status === 'error' && <p className="text-sm text-red-300 sm:col-span-2">{errorMsg}</p>}
    </form>
  );
}
