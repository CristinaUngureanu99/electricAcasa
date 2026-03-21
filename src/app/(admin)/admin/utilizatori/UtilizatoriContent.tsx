'use client';

import { useState } from 'react';
import { AdminPageShell } from '@/components/ui/AdminPageShell';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import type { Profile } from '@/types/database';

interface Props {
  profiles: Profile[];
}

export default function UtilizatoriContent({ profiles }: Props) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? profiles.filter((p) =>
        p.full_name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase()) ||
        (p.phone && p.phone.includes(search))
      )
    : profiles;

  type Row = Record<string, unknown>;
  const p = (r: Row) => r as unknown as Profile;

  const columns: { key: string; label: string; render?: (item: Row) => React.ReactNode }[] = [
    {
      key: 'full_name',
      label: 'Nume',
      render: (r) => {
        const profile = p(r);
        return (
          <div>
            <p className="font-medium text-gray-900">{profile.full_name || '—'}</p>
            <p className="text-xs text-gray-500">{profile.email}</p>
          </div>
        );
      },
    },
    {
      key: 'phone',
      label: 'Telefon',
      render: (r) => <span className="text-sm text-gray-600">{p(r).phone || '—'}</span>,
    },
    {
      key: 'role',
      label: 'Rol',
      render: (r) => {
        const profile = p(r);
        return (
          <Badge variant={profile.role === 'admin' ? 'info' : 'neutral'}>
            {profile.role === 'admin' ? 'Admin' : 'Client'}
          </Badge>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Inregistrat',
      render: (r) => <span className="text-sm text-gray-500">{formatDate(p(r).created_at)}</span>,
    },
  ];

  return (
    <AdminPageShell
      title="Utilizatori"
      description={`${profiles.length} utilizatori inregistrati`}
      search={{
        value: search,
        onChange: setSearch,
        placeholder: 'Cauta dupa nume, email sau telefon...',
      }}
    >
      <Card>
        <DataTable
          columns={columns}
          data={filtered as unknown as Row[]}
          emptyMessage="Niciun utilizator gasit."
        />
      </Card>
    </AdminPageShell>
  );
}
