'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Package, Upload, CheckCircle } from 'lucide-react';

export default function GeneratorPachetPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('full_name, email, phone').eq('id', user.id).single();
        if (profile) {
          setName(profile.full_name || '');
          setEmail(profile.email || '');
          setPhone(profile.phone || '');
        }
      }
    }
    checkAuth();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !description.trim()) {
      toast('Completeaza numele, emailul si descrierea', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim());
      formData.append('phone', phone.trim());
      formData.append('description', description.trim());
      if (file) formData.append('file', file);

      const headers: Record<string, string> = {};
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/package-request', {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error || 'Eroare la trimiterea cererii', 'error');
        setSubmitting(false);
        return;
      }

      if (data.attachmentError) {
        toast('Cererea a fost trimisa, dar atasamentul nu a putut fi incarcat', 'info');
      } else {
        toast('Cererea a fost trimisa cu succes!', 'success');
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
            <h1 className="text-xl font-bold text-gray-900">Cerere trimisa!</h1>
            <p className="text-sm text-gray-500">Vom analiza cererea ta si te vom contacta in cel mai scurt timp.</p>
            <Button variant="secondary" onClick={() => { setSubmitted(false); setDescription(''); setFile(null); }}>
              Trimite o alta cerere
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <Package size={48} className="mx-auto text-primary mb-3" />
        <h1 className="text-3xl font-bold text-gray-900">Generator pachet</h1>
        <p className="text-gray-500 mt-2">Descrie-ne ce ai nevoie si iti pregatim un pachet personalizat de materiale electrice.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nume *" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Telefon" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descriere proiect *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
              placeholder="Descrie proiectul tau: ce tip de instalatie, cati metri patrati, cate camere, ce echipamente ai nevoie etc. Poti atasa si un plan/schita."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan / schita (optional)</label>
            {isLoggedIn ? (
              <>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {file && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Upload size={12} /> {file.name}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">Imagini sau PDF, max 10MB.</p>
              </>
            ) : (
              <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
                Autentifica-te pentru a putea atasa un plan sau o schita.
              </p>
            )}
          </div>

          <Button type="submit" size="lg" loading={submitting} className="w-full">
            Trimite cererea
          </Button>
        </form>
      </Card>
    </div>
  );
}
