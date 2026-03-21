import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import CereriContent from './CereriContent';
import type { PackageRequest } from '@/types/database';

export const metadata = { title: 'Cereri pachet - Admin' };

export default async function AdminCereriPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: requests } = await supabase
    .from('package_requests')
    .select('*')
    .order('created_at', { ascending: false });

  return <CereriContent requests={(requests as PackageRequest[]) || []} />;
}
