'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { site } from '@/config/site';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Mail, Phone, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [loadedAt, setLoadedAt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLoadedAt(Date.now());
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast('Completeaza toate campurile', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim(), website, loadedAt }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error || 'Eroare la trimiterea mesajului', 'error');
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      toast('Eroare neasteptata', 'error');
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <Card>
          <div className="text-center space-y-4">
            <CheckCircle size={48} className="mx-auto text-success" />
            <h1 className="text-xl font-bold text-gray-900">Mesaj trimis!</h1>
            <p className="text-sm text-gray-500">Multumim ca ne-ai contactat. Vom reveni cu un raspuns cat mai curand.</p>
            <Link href="/" className="inline-block text-sm text-primary font-semibold hover:underline">
              Inapoi la magazin
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact</h1>
      <p className="text-gray-500 text-sm mb-10">Ai o intrebare sau ai nevoie de ajutor? Scrie-ne.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact info */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Mail size={20} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Email</p>
              <a href={`mailto:${site.contact.email}`} className="text-sm text-gray-600 hover:text-primary">
                {site.contact.email}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone size={20} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Telefon</p>
              <a href={`tel:${site.contact.phone}`} className="text-sm text-gray-600 hover:text-primary">
                {site.contact.phone}
              </a>
            </div>
          </div>
          <p className="text-xs text-gray-400 pt-2">
            Program: Luni — Vineri, 09:00 — 18:00
          </p>
        </div>

        {/* Contact form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Nume *" value={name} onChange={(e) => setName(e.target.value)} required />
                  <Input label="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                {/* Honeypot — hidden from real users */}
                <div className="absolute opacity-0 h-0 overflow-hidden" aria-hidden="true" tabIndex={-1}>
                  <input
                    type="text"
                    name="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    autoComplete="off"
                    tabIndex={-1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj *</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y text-sm"
                    placeholder="Descrie intrebarea sau problema ta..."
                  />
                </div>
              </div>
            </Card>
            <Button type="submit" size="lg" loading={submitting} className="w-full">
              Trimite mesajul
            </Button>
          </form>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200">
        <Link href="/" className="text-gray-900 font-semibold hover:underline">
          &larr; Inapoi la magazin
        </Link>
      </div>
    </div>
  );
}
