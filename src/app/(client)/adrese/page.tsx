import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import AdreseContent from './AdreseContent';
import type { Address } from '@/types/database';

export const metadata = { title: 'Adresele mele' };

export default async function AdresePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <AdreseContent initialAddresses={(addresses as Address[]) || []} />;
}
