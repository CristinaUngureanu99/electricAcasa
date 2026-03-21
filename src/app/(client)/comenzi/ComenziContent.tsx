'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterBar } from '@/components/ui/filters/FilterBar';
import { FilterSearch } from '@/components/ui/filters/FilterSearch';
import { FilterSelect } from '@/components/ui/filters/FilterSelect';
import { FilterReset } from '@/components/ui/filters/FilterReset';
import { formatPrice, formatDate } from '@/lib/utils';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import type { Order, OrderStatus } from '@/types/database';

interface Props {
  orders: Pick<Order, 'id' | 'order_number' | 'status' | 'payment_status' | 'payment_method' | 'total' | 'created_at'>[];
}

const statusLabels: Record<OrderStatus, string> = {
  pending: 'In asteptare',
  confirmed: 'Confirmata',
  shipped: 'Expediata',
  delivered: 'Livrata',
  cancelled: 'Anulata',
};

const statusVariants: Record<OrderStatus, 'warning' | 'info' | 'success' | 'danger' | 'neutral'> = {
  pending: 'warning',
  confirmed: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'In asteptare' },
  { value: 'confirmed', label: 'Confirmata' },
  { value: 'shipped', label: 'Expediata' },
  { value: 'delivered', label: 'Livrata' },
  { value: 'cancelled', label: 'Anulata' },
];

const METHOD_OPTIONS = [
  { value: 'ramburs', label: 'Ramburs' },
  { value: 'card', label: 'Card' },
];

export default function ComenziContent({ orders }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  if (orders.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Comenzile mele</h1>
        <EmptyState
          icon={ShoppingBag}
          title="Nu ai comenzi inca"
          description="Exploreaza catalogul nostru si plaseaza prima comanda."
          action={<Link href="/" className="text-sm text-accent hover:underline font-medium">Mergi la magazin</Link>}
        />
      </div>
    );
  }

  const hasFilters = search !== '' || statusFilter !== 'all' || methodFilter !== 'all';

  const filtered = orders.filter((o) => {
    if (search) {
      const q = search.toLowerCase();
      if (!`EA-${o.order_number}`.toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (methodFilter !== 'all' && o.payment_method !== methodFilter) return false;
    return true;
  });

  function resetFilters() {
    setSearch('');
    setStatusFilter('all');
    setMethodFilter('all');
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Comenzile mele ({orders.length})</h1>

      <FilterBar>
        <FilterSearch value={search} onChange={setSearch} placeholder="Cauta nr comanda..." />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} allLabel="Toate statusurile" />
        <FilterSelect value={methodFilter} onChange={setMethodFilter} options={METHOD_OPTIONS} allLabel="Toate metodele" />
        <FilterReset onReset={resetFilters} visible={hasFilters} />
      </FilterBar>

      {hasFilters && <p className="text-xs text-gray-500">{filtered.length} din {orders.length} comenzi</p>}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card><p className="text-center text-gray-500 py-4">Nicio comanda gasita</p></Card>
        ) : (
          filtered.map((o) => (
            <Link key={o.id} href={`/comenzi/${o.id}`}>
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-gray-900">EA-{o.order_number}</span>
                      <Badge variant={statusVariants[o.status as OrderStatus]}>
                        {statusLabels[o.status as OrderStatus]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{formatDate(o.created_at)}</span>
                      <span>{o.payment_method === 'card' ? 'Card' : 'Ramburs'}</span>
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
    </div>
  );
}
