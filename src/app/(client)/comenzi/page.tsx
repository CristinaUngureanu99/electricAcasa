import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import ComenziContent from './ComenziContent';
import type { Order } from '@/types/database';

export const metadata = { title: 'Comenzile mele' };

export default async function ComenziPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, payment_status, payment_method, total, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <ComenziContent orders={(orders as Pick<Order, 'id' | 'order_number' | 'status' | 'payment_status' | 'payment_method' | 'total' | 'created_at'>[]) || []} />;
}
