import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect, notFound } from 'next/navigation';
import ProductForm from '../ProductForm';
import type { Product, Category, ProductRelation } from '@/types/database';

export const metadata = { title: 'Editeaza produs' };

export default async function EditProdusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [productRes, categoriesRes, relationsRes, allProductsRes] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('categories').select('id, name, is_active').order('name'),
    supabase.from('product_relations').select('*').eq('product_id', id),
    supabase.from('products').select('id, name').neq('id', id).order('name'),
  ]);

  if (!productRes.data) notFound();

  return (
    <ProductForm
      initialProduct={productRes.data as Product}
      categories={(categoriesRes.data as Pick<Category, 'id' | 'name' | 'is_active'>[]) || []}
      initialRelations={(relationsRes.data as ProductRelation[]) || []}
      allProducts={(allProductsRes.data as Pick<Product, 'id' | 'name'>[]) || []}
    />
  );
}
