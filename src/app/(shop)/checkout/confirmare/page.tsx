import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { CheckCircle, Clock, Package, Truck, CreditCard } from 'lucide-react';
import type { Order, OrderItem } from '@/types/database';

export const metadata = { title: 'Confirmare comanda' };

export default async function ConfirmarePage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id } = await searchParams;
  if (!order_id) redirect('/');

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .eq('user_id', user.id)
    .single();

  if (!order) notFound();
  const o = order as Order;

  const { data: items } = await supabase.from('order_items').select('*').eq('order_id', o.id);

  const orderItems = (items as OrderItem[]) || [];

  const isPaid = o.payment_status === 'paid' || o.payment_method === 'ramburs';
  const statusLabel =
    o.status === 'confirmed'
      ? 'Confirmata'
      : o.status === 'pending'
        ? 'In asteptare plata'
        : o.status;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-8">
        {isPaid ? (
          <CheckCircle size={48} className="mx-auto text-success mb-3" />
        ) : (
          <Clock size={48} className="mx-auto text-accent mb-3" />
        )}
        <h1 className="text-2xl font-bold text-gray-900">
          {isPaid ? 'Comanda a fost plasata!' : 'Comanda in asteptare'}
        </h1>
        <p className="text-gray-500 mt-1">Comanda #{`EA-${o.order_number}`}</p>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className="font-medium">{statusLabel}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Metoda plata</span>
            <span className="font-medium">
              {o.payment_method === 'card' ? 'Card bancar' : 'Ramburs'}
            </span>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Produse</h3>
            {orderItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm py-1">
                <span className="text-gray-600">
                  {item.product_name} x{item.quantity}
                </span>
                <span className="font-medium">{formatPrice(item.unit_price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
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
        </div>
      </Card>

      {/* Ce urmeaza */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Ce urmeaza?</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Procesare comanda</p>
              <p className="text-xs text-gray-500">
                Comanda ta va fi pregatita in 1-2 zile lucratoare.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Truck size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Livrare</p>
              <p className="text-xs text-gray-500">
                {o.shipping_method === 'easybox'
                  ? 'Vei primi un SMS cand coletul ajunge in EasyBox.'
                  : 'Curierul te va contacta inainte de livrare. Termen estimat: 2-5 zile lucratoare.'}
              </p>
            </div>
          </div>
          {o.payment_method === 'ramburs' && (
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <CreditCard size={16} className="text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Plata la livrare</p>
                <p className="text-xs text-gray-500">
                  Pregateste suma de {formatPrice(o.total)} — platesti curierului la primire.
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Poti urmari statusul comenzii oricand din{' '}
            <Link href="/comenzi" className="text-primary hover:underline">
              Comenzile mele
            </Link>
            .
          </p>
        </div>
      </Card>

      <div className="text-center mt-8">
        <Link href="/">
          <Button variant="secondary">Inapoi la magazin</Button>
        </Link>
      </div>
    </div>
  );
}
