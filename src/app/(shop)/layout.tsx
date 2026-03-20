import { createServerSupabaseClient } from '@/lib/supabase-server';
import { ShopNav } from '@/components/layout/ShopNav';
import { ShopFooter } from '@/components/layout/ShopFooter';
import type { Category } from '@/types/database';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .is('parent_id', null)
    .eq('is_active', true)
    .order('sort_order')
    .order('name');

  const cats = (categories as Pick<Category, 'id' | 'name' | 'slug'>[]) || [];

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <ShopNav categories={cats} />
      <main className="flex-1">
        {children}
      </main>
      <ShopFooter categories={cats} />
    </div>
  );
}
