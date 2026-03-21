import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect, notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, formatDate } from '@/lib/utils';
import type { Order, OrderItem, OrderStatus, OrderAddress } from '@/types/database';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata = { title: 'Detalii comanda' };

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

export default async function DetaliiComandaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!order) notFound();
  const o = order as Order;

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', o.id);

  const orderItems = (items as OrderItem[]) || [];
  const shipping = o.shipping_address as OrderAddress;
  const billing = o.billing_address as OrderAddress | null;

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/comenzi" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4">
        <ChevronLeft size={16} /> Inapoi la comenzi
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comanda EA-{o.order_number}</h1>
          <p className="text-sm text-gray-500 mt-1">{formatDate(o.created_at)}</p>
        </div>
        <Badge variant={statusVariants[o.status as OrderStatus]}>
          {statusLabels[o.status as OrderStatus]}
        </Badge>
      </div>

      {/* Produse */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-3">Produse</h2>
        <div className="divide-y divide-gray-100">
          {orderItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                <p className="text-xs text-gray-500">{item.quantity} x {formatPrice(item.unit_price)}</p>
              </div>
              <p className="text-sm font-semibold text-gray-900">{formatPrice(item.unit_price * item.quantity)}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-3 mt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatPrice(o.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Transport</span>
            <span>{o.shipping_cost === 0 ? 'Gratuit' : formatPrice(o.shipping_cost)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
            <span>Total</span>
            <span>{formatPrice(o.total)}</span>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        {/* Adresa livrare */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-2">Adresa livrare</h2>
          <div className="text-sm text-gray-600 space-y-0.5">
            <p className="font-medium">{shipping.name}</p>
            <p>{shipping.street}</p>
            <p>{shipping.city}, {shipping.county} {shipping.postal_code}</p>
            <p>{shipping.phone}</p>
          </div>
        </Card>

        {/* Info plata */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-2">Plata</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Metoda: <span className="font-medium">{o.payment_method === 'card' ? 'Card bancar' : 'Ramburs'}</span></p>
            <p>Status: <span className="font-medium">{o.payment_status === 'paid' ? 'Platita' : o.payment_status === 'pending' ? 'In asteptare' : o.payment_status}</span></p>
          </div>
        </Card>
      </div>

      {/* Adresa facturare */}
      {billing && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-2">Adresa facturare</h2>
          <div className="text-sm text-gray-600 space-y-0.5">
            <p className="font-medium">{billing.name}</p>
            <p>{billing.street}</p>
            <p>{billing.city}, {billing.county} {billing.postal_code}</p>
            <p>{billing.phone}</p>
          </div>
        </Card>
      )}

      {/* Note */}
      {o.notes && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-2">Note</h2>
          <p className="text-sm text-gray-600">{o.notes}</p>
        </Card>
      )}
    </div>
  );
}
