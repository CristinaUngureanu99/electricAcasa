'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AdminPageShell } from '@/components/ui/AdminPageShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/filters/FilterBar';
import { FilterSearch } from '@/components/ui/filters/FilterSearch';
import { FilterSelect } from '@/components/ui/filters/FilterSelect';
import { FilterReset } from '@/components/ui/filters/FilterReset';
import { formatPrice, formatDate } from '@/lib/utils';
import { orderStatusLabels, orderStatusVariants } from '@/lib/order-helpers';
import { ChevronRight, Download } from 'lucide-react';
import type { OrderStatus } from '@/types/database';

interface OrderRow {
  id: string;
  order_number: number;
  status: string;
  payment_status: string;
  payment_method: string;
  total: number;
  created_at: string;
  client_email: string;
  client_name: string;
}

interface Props {
  orders: OrderRow[];
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'In asteptare' },
  { value: 'confirmed', label: 'Confirmata' },
  { value: 'shipped', label: 'Expediata' },
  { value: 'delivered', label: 'Livrata' },
  { value: 'cancelled', label: 'Anulata' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'ramburs', label: 'Ramburs' },
  { value: 'card', label: 'Card' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'In asteptare' },
  { value: 'paid', label: 'Platita' },
  { value: 'failed', label: 'Esuata' },
  { value: 'refunded', label: 'Rambursata' },
];

export default function ComenziAdminContent({ orders }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  const hasFilters =
    search !== '' ||
    statusFilter !== 'all' ||
    methodFilter !== 'all' ||
    paymentStatusFilter !== 'all';

  const filtered = orders.filter((o) => {
    if (search) {
      const q = search.toLowerCase();
      const matchesSearch =
        `EA-${o.order_number}`.toLowerCase().includes(q) ||
        o.client_email.toLowerCase().includes(q) ||
        o.client_name.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (methodFilter !== 'all' && o.payment_method !== methodFilter) return false;
    if (paymentStatusFilter !== 'all' && o.payment_status !== paymentStatusFilter) return false;
    return true;
  });

  function resetFilters() {
    setSearch('');
    setStatusFilter('all');
    setMethodFilter('all');
    setPaymentStatusFilter('all');
  }

  function exportCsv() {
    const header = 'Numar comanda,Client,Email,Status,Metoda plata,Status plata,Total,Data\n';
    const rows = filtered
      .map((o) =>
        [
          `EA-${o.order_number}`,
          `"${o.client_name.replace(/"/g, '""')}"`,
          o.client_email,
          o.status,
          o.payment_method,
          o.payment_status,
          o.total,
          o.created_at.slice(0, 10),
        ].join(','),
      )
      .join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comenzi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminPageShell title="Comenzi" description={`${orders.length} comenzi total`}>
      <FilterBar>
        <FilterSearch
          value={search}
          onChange={setSearch}
          placeholder="Cauta nr comanda, email, nume..."
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
          allLabel="Toate statusurile"
        />
        <FilterSelect
          value={methodFilter}
          onChange={setMethodFilter}
          options={PAYMENT_METHOD_OPTIONS}
          allLabel="Toate metodele"
        />
        <FilterSelect
          value={paymentStatusFilter}
          onChange={setPaymentStatusFilter}
          options={PAYMENT_STATUS_OPTIONS}
          allLabel="Toate platile"
        />
        <FilterReset onReset={resetFilters} visible={hasFilters} />
      </FilterBar>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {filtered.length} din {orders.length} comenzi
        </p>
        {filtered.length > 0 && (
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 py-4">Nicio comanda gasita</p>
          </Card>
        ) : (
          filtered.map((o) => (
            <Link key={o.id} href={`/admin/comenzi/${o.id}`}>
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-gray-900">EA-{o.order_number}</span>
                      <Badge variant={orderStatusVariants[o.status as OrderStatus]}>
                        {orderStatusLabels[o.status as OrderStatus]}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {o.client_name || o.client_email} &middot; {formatDate(o.created_at)} &middot;{' '}
                      {o.payment_method === 'card' ? 'Card' : 'Ramburs'}
                      {o.payment_status === 'paid' && (
                        <span className="text-green-600 ml-1">&middot; Platita</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">{formatPrice(o.total)}</span>
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </AdminPageShell>
  );
}
