import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import type { Profile } from '@/types/database';
import UtilizatoriContent from './UtilizatoriContent';

export const metadata = { title: 'Utilizatori | Admin' };

export default async function UtilizatoriPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return <UtilizatoriContent profiles={(profiles as Profile[]) || []} />;
}
