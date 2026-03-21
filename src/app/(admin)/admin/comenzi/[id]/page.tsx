import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect, notFound } from 'next/navigation';
import OrderAdminContent from './OrderAdminContent';
import type { Order, OrderItem } from '@/types/database';

export const metadata = { title: 'Detalii comanda - Admin' };

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [orderRes, itemsRes] = await Promise.all([
    supabase.from('orders').select('*').eq('id', id).single(),
    supabase.from('order_items').select('*').eq('order_id', id),
  ]);

  if (!orderRes.data) notFound();
  const order = orderRes.data as Order;

  const { data: clientProfile } = await supabase
    .from('profiles')
    .select('email, full_name, phone')
    .eq('id', order.user_id)
    .single();

  return (
    <OrderAdminContent
      order={order}
      items={(itemsRes.data as OrderItem[]) || []}
      client={clientProfile || { email: '', full_name: '', phone: null }}
    />
  );
}
