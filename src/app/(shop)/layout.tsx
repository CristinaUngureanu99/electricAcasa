import { getPublicSupabase } from '@/lib/supabase-server';
import { ShopShell } from './ShopShell';
import type { Category } from '@/types/database';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const supabase = getPublicSupabase();

  const [catRes, countRes] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('sort_order')
      .order('name'),
    supabase
      .from('products')
      .select('category_id')
      .eq('is_active', true),
  ]);

  const cats = (catRes.data as Pick<Category, 'id' | 'name' | 'slug'>[]) || [];

  const countRows = (countRes.data as { category_id: string | null }[]) || [];
  const counts = new Map<string, number>();
  for (const r of countRows) {
    if (r.category_id) counts.set(r.category_id, (counts.get(r.category_id) || 0) + 1);
  }
  const categoryCounts: Record<string, number> = {};
  for (const [k, v] of counts) categoryCounts[k] = v;

  return <ShopShell categories={cats} categoryCounts={categoryCounts}>{children}</ShopShell>;
}
