'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, resetAuthState } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatDate } from '@/lib/utils';
import { KeyRound, CalendarDays, Eye, EyeOff, Pencil, Mail, Phone, Trash2 } from 'lucide-react';
import type { Profile } from '@/types/database';

interface Props {
  initialProfile: Profile;
}

export default function ProfileContent({ initialProfile }: Props) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [fullName, setFullName] = useState(initialProfile.full_name);
  const [phone, setPhone] = useState(initialProfile.phone || '');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isSuccess = (msg: string) => msg.includes('succes');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setMessage('Numele nu poate fi gol.');
      setLoading(false);
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone && !/^(\+?[0-9\s-]{7,20})$/.test(trimmedPhone)) {
      setMessage('Numarul de telefon nu este valid.');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: trimmedName, phone: trimmedPhone })
      .eq('id', profile.id);

    if (error) {
      setMessage('Eroare la salvare. Incearca din nou.');
    } else {
      setProfile((prev) => ({ ...prev, full_name: trimmedName, phone }));
      setMessage('Profil actualizat cu succes!');
      setEditing(false);
      setTimeout(() => setMessage(''), 3000);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 bg-slate-50 -m-4 md:-m-8 lg:-m-10 p-4 md:p-8 lg:p-10 min-h-screen">
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-gray-900">Profilul meu</h1>
        <p className="text-gray-500 mt-1">Datele tale personale</p>
      </div>

      {message && (
        <div
          className={`text-sm px-4 py-3 rounded-xl ${isSuccess(message) ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}
        >
          {message}
        </div>
      )}

      {!editing ? (
        <Card>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-xl font-bold shrink-0">
              {(profile.full_name || '?')
                .split(' ')
                .map((w) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900">{profile.full_name}</h2>
              {profile.created_at && (
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <CalendarDays size={12} />
                  Membru din {formatDate(profile.created_at)}
                </p>
              )}

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Mail size={18} className="text-gray-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{profile.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Phone size={18} className="text-gray-500 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Telefon</p>
                    <p className="text-sm font-medium text-gray-900">
                      {profile.phone || 'Nesetat'}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditing(true)}
                className="mt-4 flex items-center gap-1.5"
              >
                <Pencil size={14} />
                Editeaza profil
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Editeaza profil</h2>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setFullName(profile.full_name || '');
                  setPhone(profile.phone || '');
                }}
                className="text-sm text-gray-500 hover:text-gray-600"
              >
                Anuleaza
              </button>
            </div>

            <Input label="Email" value={profile.email || ''} disabled />
            <Input
              label="Nume complet"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={100}
              required
            />
            <Input
              label="Telefon"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={20}
              placeholder="+40 700 123 456"
            />
            <Button type="submit" loading={loading}>
              Salveaza
            </Button>
          </form>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gray-100">
              <KeyRound size={18} className="text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Parola</p>
              <p className="text-xs text-gray-500">Schimba parola contului</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowPasswordForm(!showPasswordForm);
              setPasswordMessage('');
            }}
          >
            {showPasswordForm ? 'Anuleaza' : 'Schimba'}
          </Button>
        </div>

        {showPasswordForm && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (newPassword.length < 8) {
                setPasswordMessage('Parola trebuie sa aiba cel putin 8 caractere.');
                return;
              }
              if (newPassword !== confirmPassword) {
                setPasswordMessage('Parolele nu coincid.');
                return;
              }
              setPasswordLoading(true);
              setPasswordMessage('');
              const supabase = createClient();

              const { error } = await supabase.auth.updateUser({ password: newPassword });
              setPasswordLoading(false);
              if (error) {
                setPasswordMessage('Eroare la schimbarea parolei. Incearca din nou.');
              } else {
                setPasswordMessage('Parola schimbata cu succes!');
                await supabase.auth.signOut({ scope: 'others' });
                setNewPassword('');
                setConfirmPassword('');
                setShowPasswordForm(false);
                setTimeout(() => setPasswordMessage(''), 3000);
              }
            }}
            className="mt-4 pt-4 border-t border-gray-100 space-y-3"
          >
            <div className="relative">
              <Input
                label="Parola noua"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                placeholder="Minim 8 caractere"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-8 text-gray-500"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="relative">
              <Input
                label="Confirma parola"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-8 text-gray-500"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordMessage && (
              <div
                className={`text-sm px-4 py-3 rounded-xl ${isSuccess(passwordMessage) ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}
              >
                {passwordMessage}
              </div>
            )}
            <Button type="submit" loading={passwordLoading} size="sm">
              Schimba parola
            </Button>
          </form>
        )}
      </Card>

      {passwordMessage && !showPasswordForm && (
        <div
          className={`text-sm px-4 py-3 rounded-xl ${isSuccess(passwordMessage) ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}
        >
          {passwordMessage}
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-50">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Sterge contul</p>
              <p className="text-xs text-gray-500">Toate datele tale vor fi sterse permanent</p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            loading={deleteLoading}
            onClick={() => setShowDeleteConfirm(true)}
          >
            Sterge contul
          </Button>
        </div>
      </Card>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onConfirm={async () => {
          setShowDeleteConfirm(false);
          setDeleteLoading(true);
          try {
            const supabase = createClient();
            const {
              data: { session },
            } = await supabase.auth.getSession();
            const res = await fetch('/api/auth/delete-account', {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${session?.access_token}` },
            });
            if (res.ok) {
              resetAuthState();
              router.push('/');
              router.refresh();
            } else {
              setMessage('Eroare la stergerea contului. Contacteaza suportul.');
              setDeleteLoading(false);
            }
          } catch {
            setMessage('Eroare la stergerea contului. Contacteaza suportul.');
            setDeleteLoading(false);
          }
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Sterge contul permanent"
        message="Esti sigur ca vrei sa stergi contul? Toate datele tale vor fi sterse permanent. Aceasta actiune nu poate fi anulata."
        confirmText="Sterge permanent"
        variant="danger"
      />
    </div>
  );
}
