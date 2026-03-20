import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import ProductForm from '../ProductForm';
import type { Category } from '@/types/database';

export const metadata = { title: 'Produs nou' };

export default async function ProdusNouPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, is_active')
    .order('name');

  return (
    <ProductForm
      categories={(categories as Pick<Category, 'id' | 'name' | 'is_active'>[]) || []}
    />
  );
}
