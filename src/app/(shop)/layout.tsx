import { getPublicSupabase } from '@/lib/supabase-server';
import { ShopShell } from './ShopShell';
import type { Category } from '@/types/database';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const supabase = getPublicSupabase();

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .is('parent_id', null)
    .eq('is_active', true)
    .order('sort_order')
    .order('name');

  const cats = (categories as Pick<Category, 'id' | 'name' | 'slug'>[]) || [];

  return <ShopShell categories={cats}>{children}</ShopShell>;
}
