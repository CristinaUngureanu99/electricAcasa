import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import CategoriiContent from './CategoriiContent';
import type { Category } from '@/types/database';

export const metadata = { title: 'Categorii' };

export default async function CategoriiPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  return <CategoriiContent initialCategories={(categories as Category[]) || []} />;
}
