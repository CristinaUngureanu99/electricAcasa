import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import ProduseContent from './ProduseContent';
import type { Product, Category } from '@/types/database';

export const metadata = { title: 'Produse' };

export default async function ProdusePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [productsRes, categoriesRes] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('id, name')
      .order('name'),
  ]);

  return (
    <ProduseContent
      initialProducts={(productsRes.data as Product[]) || []}
      categories={(categoriesRes.data as Pick<Category, 'id' | 'name'>[]) || []}
    />
  );
}
