import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import CereriPachetContent from './CereriPachetContent';

export const metadata: Metadata = {
  title: 'Cererile mele de pachet',
};

export default async function CereriPachetPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: requests } = await supabase
    .from('package_requests')
    .select('*, package_offer_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <CereriPachetContent requests={requests || []} />;
}
