'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Package, Upload, CheckCircle } from 'lucide-react';

const PROJECT_TYPES = [
  { value: '', label: 'Selecteaza...' },
  { value: 'apartament', label: 'Apartament' },
  { value: 'casa', label: 'Casa' },
  { value: 'comercial', label: 'Spatiu comercial' },
  { value: 'renovare', label: 'Renovare' },
];

const INSTALLATION_TYPES = [
  { value: 'iluminat', label: 'Iluminat' },
  { value: 'prize-aparataj', label: 'Prize si aparataj' },
  { value: 'tablou-protectii', label: 'Tablou / protectii' },
  { value: 'smart-home', label: 'Smart home' },
  { value: 'cabluri-accesorii', label: 'Cabluri si accesorii' },
  { value: 'statie-ev', label: 'Statie incarcare EV' },
  { value: 'hvac-control', label: 'HVAC / control' },
];

const BUDGET_LEVELS = [
  { value: '', label: 'Selecteaza...' },
  { value: 'economic', label: 'Economic' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'nu-stiu', label: 'Nu stiu inca' },
];

export default function GeneratorPachetPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [projectType, setProjectType] = useState('');
  const [area, setArea] = useState('');
  const [rooms, setRooms] = useState('');
  const [installations, setInstallations] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
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

  function toggleInstallation(value: string) {
    setInstallations((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function buildDescription(): string {
    const parts: string[] = [];
    if (projectType) {
      const label = PROJECT_TYPES.find((t) => t.value === projectType)?.label;
      parts.push(`Tip proiect: ${label}`);
    }
    if (area) parts.push(`Suprafata: ${area} mp`);
    if (rooms) parts.push(`Numar camere: ${rooms}`);
    if (installations.length > 0) {
      const labels = installations.map((v) => INSTALLATION_TYPES.find((t) => t.value === v)?.label).filter(Boolean);
      parts.push(`Instalatii: ${labels.join(', ')}`);
    }
    if (budget) {
      const label = BUDGET_LEVELS.find((b) => b.value === budget)?.label;
      parts.push(`Buget estimativ: ${label}`);
    }
    if (notes.trim()) parts.push(`\nDetalii suplimentare:\n${notes.trim()}`);
    return parts.join('\n');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast('Completeaza numele si emailul', 'error');
      return;
    }
    if (!projectType) {
      toast('Selecteaza tipul de proiect', 'error');
      return;
    }
    if (installations.length === 0) {
      toast('Selecteaza cel putin un tip de instalatie', 'error');
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
      formData.append('description', buildDescription());
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
            <p className="text-sm text-gray-500">Vom analiza cererea ta si te vom contacta in cel mai scurt timp cu o oferta personalizata.</p>
            <Button variant="secondary" onClick={() => { setSubmitted(false); setProjectType(''); setInstallations([]); setBudget(''); setArea(''); setRooms(''); setNotes(''); setFile(null); }}>
              Trimite o alta cerere
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const selectClass = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <Package size={48} className="mx-auto text-primary mb-3" />
        <h1 className="text-3xl font-bold text-gray-900">Pachet personalizat</h1>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">Spune-ne ce proiect ai si iti pregatim o oferta completa cu toate materialele necesare.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Date de contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nume *" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Telefon" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
          </div>
        </Card>

        {/* Project details */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalii proiect</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tip proiect *</label>
              <select value={projectType} onChange={(e) => setProjectType(e.target.value)} className={selectClass}>
                {PROJECT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buget estimativ</label>
              <select value={budget} onChange={(e) => setBudget(e.target.value)} className={selectClass}>
                {BUDGET_LEVELS.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <Input label="Suprafata (mp)" type="number" min="1" value={area} onChange={(e) => setArea(e.target.value)} placeholder="ex: 80" />
            <Input label="Numar camere" type="number" min="1" value={rooms} onChange={(e) => setRooms(e.target.value)} placeholder="ex: 3" />
          </div>
        </Card>

        {/* Installation types */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ce tip de instalatie ai nevoie? *</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {INSTALLATION_TYPES.map((type) => {
              const selected = installations.includes(type.value);
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggleInstallation(type.value)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    selected
                      ? 'bg-primary text-white shadow-sm shadow-primary/20'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-primary/30 hover:bg-primary/5'
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Notes + file */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informatii suplimentare</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Detalii sau cerinte speciale</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y text-sm"
                placeholder="Alte informatii utile: preferinte branduri, cerinte speciale, termen dorit..."
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
          </div>
        </Card>

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Trimite cererea
        </Button>
      </form>
    </div>
  );
}
