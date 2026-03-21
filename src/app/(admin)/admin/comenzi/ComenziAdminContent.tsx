'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AdminPageShell } from '@/components/ui/AdminPageShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, formatDate } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
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

const statusLabels: Record<OrderStatus, string> = {
  pending: 'In asteptare', confirmed: 'Confirmata', shipped: 'Expediata', delivered: 'Livrata', cancelled: 'Anulata',
};
const statusVariants: Record<OrderStatus, 'warning' | 'info' | 'success' | 'danger' | 'neutral'> = {
  pending: 'warning', confirmed: 'info', shipped: 'info', delivered: 'success', cancelled: 'danger',
};

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function ComenziAdminContent({ orders }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = orders.filter((o) => {
    const matchesSearch = search === '' ||
      `EA-${o.order_number}`.toLowerCase().includes(search.toLowerCase()) ||
      o.client_email.toLowerCase().includes(search.toLowerCase()) ||
      o.client_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminPageShell
      title="Comenzi"
      description={`${orders.length} comenzi total`}
      search={{ value: search, onChange: setSearch, placeholder: 'Cauta dupa nr comanda, email sau nume...' }}
    >
      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
            }`}
          >
            {s === 'all' ? 'Toate' : statusLabels[s as OrderStatus]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card><p className="text-center text-gray-500 py-4">Nicio comanda gasita</p></Card>
        ) : (
          filtered.map((o) => (
            <Link key={o.id} href={`/admin/comenzi/${o.id}`}>
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-gray-900">EA-{o.order_number}</span>
                      <Badge variant={statusVariants[o.status as OrderStatus]}>{statusLabels[o.status as OrderStatus]}</Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {o.client_name || o.client_email} &middot; {formatDate(o.created_at)} &middot; {o.payment_method === 'card' ? 'Card' : 'Ramburs'}
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
