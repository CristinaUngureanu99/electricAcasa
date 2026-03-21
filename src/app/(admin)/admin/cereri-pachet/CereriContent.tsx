'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { AdminPageShell } from '@/components/ui/AdminPageShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { FilterBar } from '@/components/ui/filters/FilterBar';
import { FilterSearch } from '@/components/ui/filters/FilterSearch';
import { FilterSelect } from '@/components/ui/filters/FilterSelect';
import { FilterReset } from '@/components/ui/filters/FilterReset';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import type { PackageRequest, PackageRequestStatus } from '@/types/database';

interface Props {
  requests: PackageRequest[];
}

const statusLabels: Record<PackageRequestStatus, string> = {
  new: 'Noua', in_review: 'In analiza', answered: 'Raspuns', closed: 'Inchisa',
};
const statusVariants: Record<PackageRequestStatus, 'warning' | 'info' | 'success' | 'neutral'> = {
  new: 'warning', in_review: 'info', answered: 'success', closed: 'neutral',
};
const STATUS_OPTIONS: PackageRequestStatus[] = ['new', 'in_review', 'answered', 'closed'];

const FILTER_OPTIONS = [
  { value: 'new', label: 'Noua' },
  { value: 'in_review', label: 'In analiza' },
  { value: 'answered', label: 'Raspuns' },
  { value: 'closed', label: 'Inchisa' },
];

export default function CereriContent({ requests: initialRequests }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<PackageRequestStatus>('new');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const hasFilters = search !== '' || filter !== 'all';

  const filtered = requests.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      if (!r.name.toLowerCase().includes(q) && !r.email.toLowerCase().includes(q) && !(r.phone || '').includes(q)) return false;
    }
    if (filter !== 'all' && r.status !== filter) return false;
    return true;
  });

  function resetFilters() {
    setSearch('');
    setFilter('all');
  }

  function expand(req: PackageRequest) {
    if (expandedId === req.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(req.id);
    setEditStatus(req.status);
    setEditNotes(req.admin_notes || '');
  }

  async function handleSave(reqId: string) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('package_requests')
      .update({ status: editStatus, admin_notes: editNotes.trim() || null })
      .eq('id', reqId);

    if (error) {
      toast(`Eroare: ${error.message}`, 'error');
    } else {
      toast('Cerere actualizata', 'success');
      setRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, status: editStatus, admin_notes: editNotes.trim() || null } : r));
    }
    setSaving(false);
  }

  async function downloadAttachment(reqId: string) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/admin/attachment-url?requestId=${reqId}`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    if (res.ok && data.url) {
      window.open(data.url, '_blank');
    } else {
      toast(data.error || 'Eroare la descarcare', 'error');
    }
  }

  return (
    <AdminPageShell title="Cereri pachet" description={`${requests.length} cereri total`}>
      <FilterBar>
        <FilterSearch value={search} onChange={setSearch} placeholder="Cauta nume, email, telefon..." />
        <FilterSelect value={filter} onChange={setFilter} options={FILTER_OPTIONS} allLabel="Toate statusurile" />
        <FilterReset onReset={resetFilters} visible={hasFilters} />
      </FilterBar>

      {hasFilters && <p className="text-xs text-gray-500">{filtered.length} din {requests.length} cereri</p>}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card><p className="text-center text-gray-500 py-4">Nicio cerere gasita</p></Card>
        ) : (
          filtered.map((req) => (
            <Card key={req.id}>
              <button onClick={() => expand(req)} className="w-full text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-gray-900">{req.name}</span>
                      <Badge variant={statusVariants[req.status]}>{statusLabels[req.status]}</Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {req.email} {req.phone && `· ${req.phone}`} · {formatDate(req.created_at)}
                    </div>
                  </div>
                  {expandedId === req.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </div>
              </button>

              {expandedId === req.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Descriere</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{req.description}</p>
                  </div>

                  {req.attachment_url && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Atasament</p>
                      <button onClick={() => downloadAttachment(req.id)} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                        <Download size={14} /> Descarca atasament
                      </button>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Status</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as PackageRequestStatus)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{statusLabels[s]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Note admin</label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                        placeholder="Raspuns / note interne..."
                      />
                    </div>
                  </div>

                  <Button size="sm" onClick={() => handleSave(req.id)} loading={saving}>Salveaza</Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </AdminPageShell>
  );
}
