'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
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

export default function ComenziContent({ orders }: Props) {
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

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Comenzile mele ({orders.length})</h1>
      <div className="space-y-3">
        {orders.map((o) => (
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
        ))}
      </div>
    </div>
  );
}
