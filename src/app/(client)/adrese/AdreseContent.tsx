'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { FilterBar } from '@/components/ui/filters/FilterBar';
import { FilterSearch } from '@/components/ui/filters/FilterSearch';
import { FilterSelect } from '@/components/ui/filters/FilterSelect';
import { FilterReset } from '@/components/ui/filters/FilterReset';
import { MapPin, Pencil, Trash2, Star, Plus, X } from 'lucide-react';
import type { Address, AddressType } from '@/types/database';

interface Props {
  initialAddresses: Address[];
}

interface AddressForm {
  id: string;
  type: AddressType;
  name: string;
  street: string;
  city: string;
  county: string;
  postal_code: string;
  phone: string;
  is_default: boolean;
}

const emptyForm = (): AddressForm => ({
  id: crypto.randomUUID(),
  type: 'shipping',
  name: '',
  street: '',
  city: '',
  county: '',
  postal_code: '',
  phone: '',
  is_default: false,
});

export default function AdreseContent({ initialAddresses }: Props) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [form, setForm] = useState<AddressForm | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const hasFilters = search !== '' || typeFilter !== 'all';

  const filteredAddresses = addresses.filter((a) => {
    if (search) {
      const q = search.toLowerCase();
      if (!a.name.toLowerCase().includes(q) && !a.city.toLowerCase().includes(q) && !a.county.toLowerCase().includes(q)) return false;
    }
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    return true;
  });

  function resetFilters() {
    setSearch('');
    setTypeFilter('all');
  }

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setAddresses(data as Address[]);
  }

  function startCreate() {
    setForm(emptyForm());
    setEditing(false);
  }

  function startEdit(addr: Address) {
    setForm({
      id: addr.id,
      type: addr.type,
      name: addr.name,
      street: addr.street,
      city: addr.city,
      county: addr.county,
      postal_code: addr.postal_code,
      phone: addr.phone,
      is_default: addr.is_default,
    });
    setEditing(true);
  }

  async function handleSave() {
    if (!form) return;
    if (!form.name.trim() || !form.street.trim() || !form.city.trim() || !form.county.trim() || !form.postal_code.trim() || !form.phone.trim()) {
      toast('Completeaza toate campurile', 'error');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();

      // If setting as default, clear existing default of same type first
      if (form.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('type', form.type)
          .eq('is_default', true);
      }

      const record = {
        type: form.type,
        name: form.name.trim(),
        street: form.street.trim(),
        city: form.city.trim(),
        county: form.county.trim(),
        postal_code: form.postal_code.trim(),
        phone: form.phone.trim(),
        is_default: form.is_default,
      };

      if (editing) {
        const { error } = await supabase.from('addresses').update(record).eq('id', form.id);
        if (error) { toast(`Eroare: ${error.message}`, 'error'); setSaving(false); return; }
        toast('Adresa actualizata', 'success');
      } else {
        const { error } = await supabase.from('addresses').insert(record);
        if (error) { toast(`Eroare: ${error.message}`, 'error'); setSaving(false); return; }
        toast('Adresa adaugata', 'success');
      }

      setForm(null);
      await refresh();
      router.refresh();
    } catch {
      toast('Eroare neasteptata', 'error');
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const supabase = createClient();
    const { error } = await supabase.from('addresses').delete().eq('id', deleteTarget.id);
    if (error) {
      toast(`Eroare: ${error.message}`, 'error');
    } else {
      toast('Adresa stearsa', 'success');
      await refresh();
      router.refresh();
    }
    setDeleteTarget(null);
  }

  async function setDefault(addr: Address) {
    const supabase = createClient();
    // Clear existing default of same type
    await supabase.from('addresses').update({ is_default: false }).eq('type', addr.type).eq('is_default', true);
    // Set new default
    const { error } = await supabase.from('addresses').update({ is_default: true }).eq('id', addr.id);
    if (error) {
      toast(`Eroare: ${error.message}`, 'error');
    } else {
      toast('Adresa setata ca implicita', 'success');
      await refresh();
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Adresele mele</h1>
        {!form && (
          <Button size="sm" onClick={startCreate}>
            <Plus size={16} className="mr-1" /> Adresa noua
          </Button>
        )}
      </div>

      {/* Form */}
      {form && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editing ? 'Editeaza adresa' : 'Adresa noua'}
            </h2>
            <button onClick={() => setForm(null)} className="p-1 rounded hover:bg-gray-100">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tip adresa</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => f ? { ...f, type: e.target.value as AddressType } : f)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="shipping">Livrare</option>
                <option value="billing">Facturare</option>
              </select>
            </div>
            <Input label="Nume complet *" value={form.name} onChange={(e) => setForm((f) => f ? { ...f, name: e.target.value } : f)} />
            <div className="col-span-full">
              <Input label="Strada, numar, bloc *" value={form.street} onChange={(e) => setForm((f) => f ? { ...f, street: e.target.value } : f)} />
            </div>
            <Input label="Oras *" value={form.city} onChange={(e) => setForm((f) => f ? { ...f, city: e.target.value } : f)} />
            <Input label="Judet *" value={form.county} onChange={(e) => setForm((f) => f ? { ...f, county: e.target.value } : f)} />
            <Input label="Cod postal *" value={form.postal_code} onChange={(e) => setForm((f) => f ? { ...f, postal_code: e.target.value } : f)} />
            <Input label="Telefon *" type="tel" value={form.phone} onChange={(e) => setForm((f) => f ? { ...f, phone: e.target.value } : f)} />
            <div className="flex items-center gap-2 col-span-full">
              <input
                type="checkbox"
                id="addr-default"
                checked={form.is_default}
                onChange={(e) => setForm((f) => f ? { ...f, is_default: e.target.checked } : f)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="addr-default" className="text-sm text-gray-700">Adresa implicita</label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleSave} loading={saving}>{editing ? 'Salveaza' : 'Adauga'}</Button>
            <Button variant="ghost" onClick={() => setForm(null)}>Anuleaza</Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      {addresses.length > 0 && !form && (
        <>
          <FilterBar>
            <FilterSearch value={search} onChange={setSearch} placeholder="Cauta dupa nume, oras, judet..." />
            <FilterSelect
              value={typeFilter}
              onChange={setTypeFilter}
              options={[{ value: 'shipping', label: 'Livrare' }, { value: 'billing', label: 'Facturare' }]}
              allLabel="Toate tipurile"
            />
            <FilterReset onReset={resetFilters} visible={hasFilters} />
          </FilterBar>
          {hasFilters && <p className="text-xs text-gray-500">{filteredAddresses.length} din {addresses.length} adrese</p>}
        </>
      )}

      {/* List */}
      {addresses.length === 0 && !form ? (
        <EmptyState
          icon={MapPin}
          title="Nu ai adrese salvate"
          description="Adauga o adresa pentru a simplifica checkout-ul."
        />
      ) : (
        <div className="space-y-3 mt-4">
          {filteredAddresses.map((addr) => (
            <Card key={addr.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={addr.type === 'shipping' ? 'info' : 'neutral'}>
                      {addr.type === 'shipping' ? 'Livrare' : 'Facturare'}
                    </Badge>
                    {addr.is_default && <Badge variant="success">Implicita</Badge>}
                  </div>
                  <p className="font-medium text-gray-900">{addr.name}</p>
                  <p className="text-sm text-gray-600">{addr.street}</p>
                  <p className="text-sm text-gray-600">{addr.city}, {addr.county} {addr.postal_code}</p>
                  <p className="text-sm text-gray-500">{addr.phone}</p>
                </div>
                <div className="flex gap-1">
                  {!addr.is_default && (
                    <button onClick={() => setDefault(addr)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-amber-500" title="Seteaza ca implicita">
                      <Star size={16} />
                    </button>
                  )}
                  <button onClick={() => startEdit(addr)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700" title="Editeaza">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => setDeleteTarget(addr)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600" title="Sterge">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Sterge adresa"
        message={`Esti sigur ca vrei sa stergi adresa "${deleteTarget?.name}"?`}
        confirmText="Sterge"
        variant="danger"
      />
    </div>
  );
}
