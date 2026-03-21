import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { ProductCard } from '@/components/ui/ProductCard';
import { getStorageUrl } from '@/lib/utils';
import { ArrowRight, Image as ImageIcon } from 'lucide-react';
import type { Product, Category } from '@/types/database';

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  const [categoriesRes, productsRes] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('sort_order')
      .order('name'),
    supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const categories = (categoriesRes.data as Category[]) || [];
  const products = (productsRes.data as Product[]) || [];

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary-light to-accent text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Materiale electrice de calitate
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8">
              Tot ce ai nevoie pentru instalatii electrice, iluminat, smart home si multe altele. Livrate rapid la tine acasa.
            </p>
            <Link
              href="#categorii"
              className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Vezi catalogul <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface to-transparent" />
      </section>

      {/* Categorii */}
      {categories.length > 0 && (
        <section id="categorii" className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Categorii de produse</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categorie/${cat.slug}`}
                className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover-lift"
              >
                <div className="aspect-[4/3] bg-gray-50">
                  {cat.image_url ? (
                    <img
                      src={getStorageUrl('product-images', cat.image_url)}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={32} className="text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-semibold text-gray-900 text-sm group-hover:text-primary transition-colors">
                    {cat.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Produse noi */}
      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Produse noi</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
