import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import ComenziAdminContent from './ComenziAdminContent';

export const metadata = { title: 'Comenzi - Admin' };

export default async function AdminComenziPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, payment_status, payment_method, total, created_at, user_id')
    .order('created_at', { ascending: false });

  // Get user emails
  const userIds = [...new Set((orders || []).map((o: { user_id: string }) => o.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, email, full_name').in('id', userIds)
    : { data: [] };

  const profileMap = new Map((profiles || []).map((p: { id: string; email: string; full_name: string }) => [p.id, p]));

  const enriched = (orders || []).map((o: { id: string; order_number: number; status: string; payment_status: string; payment_method: string; total: number; created_at: string; user_id: string }) => ({
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    payment_status: o.payment_status,
    payment_method: o.payment_method,
    total: o.total,
    created_at: o.created_at,
    client_email: profileMap.get(o.user_id)?.email || '',
    client_name: profileMap.get(o.user_id)?.full_name || '',
  }));

  return <ComenziAdminContent orders={enriched} />;
}
