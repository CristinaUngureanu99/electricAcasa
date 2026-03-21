import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { ProductCard } from '@/components/ui/ProductCard';
import { getStorageUrl } from '@/lib/utils';
import { ArrowRight, Image as ImageIcon, Truck, FileText, Package, Zap } from 'lucide-react';
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
      {/* Hero — 2 columns on desktop */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-14 md:pt-16 md:pb-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">electricAcasa.ro</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-5">
            Aparataj, iluminat si<br />
            <span className="text-primary">protectii electrice</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Alege usor din catalog, compara specificatii, descarca fise tehnice si comanda cu livrare in toata Romania.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors"
            >
              Vezi catalogul <ArrowRight size={18} />
            </Link>
            <Link
              href="/generator-pachet"
              className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-xl border-2 border-primary/20 hover:border-primary/40 transition-colors"
            >
              Solicita pachet personalizat
            </Link>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Fise tehnice</p>
                <p className="text-xs text-gray-500 mt-0.5">Descarcabile pe fiecare produs</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Produse compatibile</p>
                <p className="text-xs text-gray-500 mt-0.5">Recomandarile potrivite automat</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Pachet personalizat</p>
                <p className="text-xs text-gray-500 mt-0.5">Consultanta gratuita pentru proiect</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Truck size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Livrare nationala</p>
                <p className="text-xs text-gray-500 mt-0.5">Rapid, in toata Romania</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categorii */}
      {categories.length > 0 && (
        <section id="categorii" className="max-w-7xl mx-auto px-4 py-14 md:py-16">
          <div className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Categorii de produse</h2>
            <p className="text-gray-500 mt-2">Alege categoria potrivita pentru proiectul tau</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categorie/${cat.slug}`}
                className="group bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden hover-lift hover:border-primary/20"
              >
                <div className="aspect-[4/3] bg-gray-50 overflow-hidden">
                  {cat.image_url ? (
                    <img
                      src={getStorageUrl('product-images', cat.image_url)}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={32} className="text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-all">
                    {cat.name}
                  </h3>
                  {cat.description ? (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 group-hover:text-gray-600 transition-colors">{cat.description}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1 group-hover:text-primary/60 transition-colors">Vezi produsele →</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Generator pachet CTA */}
      <section className="max-w-7xl mx-auto px-4 pb-14 md:pb-16">
        <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 md:p-12 text-white">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Ai nevoie de un pachet personalizat?</h2>
            <p className="text-white/80 mb-6">
              Spune-ne ce proiect ai si noi iti cream o oferta completa cu toate materialele necesare — rapid si fara bataie de cap.
            </p>
            <Link
              href="/generator-pachet"
              className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Solicita pachet <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Produse noi */}
      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-16 md:pb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Produse recomandate</h2>
              <p className="text-gray-500 mt-2">Selectii populare din catalogul nostru</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
