'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatPrice, formatDate } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import type { Order, OrderItem, OrderStatus, OrderAddress } from '@/types/database';

interface Props {
  order: Order;
  items: OrderItem[];
  client: { email: string; full_name: string; phone: string | null };
}

const statusLabels: Record<OrderStatus, string> = {
  pending: 'In asteptare', confirmed: 'Confirmata', shipped: 'Expediata', delivered: 'Livrata', cancelled: 'Anulata',
};
const statusVariants: Record<OrderStatus, 'warning' | 'info' | 'success' | 'danger' | 'neutral'> = {
  pending: 'warning', confirmed: 'info', shipped: 'info', delivered: 'success', cancelled: 'danger',
};

// Allowed transitions per current status
const NEXT_STATUSES: Record<string, { value: string; label: string }[]> = {
  pending: [{ value: 'cancelled', label: 'Anuleaza' }],
  confirmed: [{ value: 'shipped', label: 'Marcheaza expediata' }, { value: 'cancelled', label: 'Anuleaza' }],
  shipped: [{ value: 'delivered', label: 'Marcheaza livrata' }],
};

export default function OrderAdminContent({ order: initialOrder, items, client }: Props) {
  const [order, setOrder] = useState(initialOrder);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const shipping = order.shipping_address as OrderAddress;
  const nextStatuses = NEXT_STATUSES[order.status] || [];

  async function handleStatusChange(newStatus: string) {
    setUpdating(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: order.id, newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrder((prev) => ({ ...prev, status: newStatus as OrderStatus }));
        toast(`Status actualizat: ${statusLabels[newStatus as OrderStatus]}`, 'success');
      } else {
        toast(data.error || 'Eroare la actualizare', 'error');
      }
    } catch {
      toast('Eroare neasteptata', 'error');
    }
    setUpdating(false);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <Link href="/admin/comenzi" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4">
          <ChevronLeft size={16} /> Inapoi la comenzi
        </Link>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Comanda EA-{order.order_number}</h1>
            <p className="text-sm text-gray-400 mt-1">{formatDate(order.created_at)}</p>
          </div>
          <Badge variant={statusVariants[order.status as OrderStatus]}>
            {statusLabels[order.status as OrderStatus]}
          </Badge>
        </div>
      </div>

      {/* Status actions */}
      {nextStatuses.length > 0 && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-3">Schimba status</h2>
          <div className="flex gap-3">
            {nextStatuses.map((ns) => (
              <Button
                key={ns.value}
                variant={ns.value === 'cancelled' ? 'danger' : 'primary'}
                size="sm"
                onClick={() => handleStatusChange(ns.value)}
                loading={updating}
              >
                {ns.label}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Client */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-3">Client</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p className="font-medium">{client.full_name || client.email}</p>
          <p>{client.email}</p>
          {client.phone && <p>{client.phone}</p>}
        </div>
      </Card>

      {/* Products */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4">Produse</h2>
        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.quantity} x {formatPrice(item.unit_price)}</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">{formatPrice(item.unit_price * item.quantity)}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-4 mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Transport</span>
            <span>{order.shipping_cost === 0 ? 'Gratuit' : formatPrice(order.shipping_cost)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 pt-3 border-t border-gray-100">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        <Card>
          <h2 className="font-semibold text-gray-900 mb-3">Adresa livrare</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium">{shipping.name}</p>
            <p>{shipping.street}</p>
            <p>{shipping.city}, {shipping.county} {shipping.postal_code}</p>
            <p>{shipping.phone}</p>
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold text-gray-900 mb-3">Plata</h2>
          <div className="text-sm text-gray-600 space-y-1.5">
            <p>Metoda: <span className="font-medium">{order.payment_method === 'card' ? 'Card' : 'Ramburs'}</span></p>
            <p>Status: <span className="font-medium">{order.payment_status === 'paid' ? 'Platita' : 'In asteptare'}</span></p>
          </div>
        </Card>
      </div>

      {order.notes && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-3">Note</h2>
          <p className="text-sm text-gray-600">{order.notes}</p>
        </Card>
      )}
    </div>
  );
}
