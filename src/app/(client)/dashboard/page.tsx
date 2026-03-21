import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import DashboardContent from './DashboardContent';
import type { Order } from '@/types/database';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profileRes, ordersRes, addressCountRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('orders').select('id, order_number, status, total, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('addresses').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);

  if (profileRes.error) {
    console.error('Dashboard: profile query failed', profileRes.error);
  }

  return (
    <DashboardContent
      profile={profileRes.data}
      recentOrders={(ordersRes.data as Pick<Order, 'id' | 'order_number' | 'status' | 'total' | 'created_at'>[]) || []}
      addressCount={addressCountRes.count || 0}
    />
  );
}
