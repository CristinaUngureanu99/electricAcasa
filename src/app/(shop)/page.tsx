import Link from 'next/link';
import NextImage from 'next/image';
import { getPublicSupabase } from '@/lib/supabase-server';
import { ProductCard } from '@/components/ui/ProductCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { getStorageUrl } from '@/lib/utils';
import { site } from '@/config/site';
import { NewsletterSignup } from '@/components/ui/NewsletterSignup';
import {
  ArrowRight,
  Image as ImageIcon,
  Truck,
  FileText,
  Package,
  Zap,
  ShoppingCart,
  CreditCard,
} from 'lucide-react';
import { FadeIn } from '@/components/ui/FadeIn';
import { ScrollablePills } from '@/components/ui/ScrollablePills';
import type { Product, Category } from '@/types/database';

export const revalidate = 60; // ISR: re-generate every 60s

export default async function HomePage() {
  const supabase = getPublicSupabase();

  const [categoriesRes, featuredRes, recentRes, productCatsRes] = await Promise.all([
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
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(16),
    supabase.from('products').select('category_id').eq('is_active', true),
  ]);

  const categories = (categoriesRes.data as Category[]) || [];
  const featured = (featuredRes.data as Product[]) || [];
  const recent = (recentRes.data as Product[]) || [];

  // Count products per category
  const productCats = (productCatsRes.data as { category_id: string | null }[]) || [];
  const categoryCounts: Record<string, number> = {};
  for (const p of productCats) {
    if (p.category_id) categoryCounts[p.category_id] = (categoryCounts[p.category_id] || 0) + 1;
  }

  // Featured first, fill remaining slots with recent (no duplicates)
  const featuredIds = new Set(featured.map((p) => p.id));
  const filler = recent.filter((p) => !featuredIds.has(p.id));
  const products = [...featured, ...filler].slice(0, 8);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: site.name,
          url: site.url,
          description: site.tagline,
          contactPoint: {
            '@type': 'ContactPoint',
            email: site.contact.email,
            telephone: site.contact.phone,
            contactType: 'customer service',
            availableLanguage: 'Romanian',
          },
        }}
      />
      {/* Category quick-access pills — right below header */}
      {categories.length > 0 && (
        <div className="max-w-7xl mx-auto pt-2 pb-2 md:pt-3 md:pb-3">
          <ScrollablePills
            items={categories.map((cat) => ({
              href: `/categorie/${cat.slug}`,
              label: cat.name,
            }))}
          />
        </div>
      )}

      {/* Hero heading */}
      <section className="max-w-7xl mx-auto pt-4 pb-6 md:pt-6 md:pb-8 px-4">
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-5">
          Aparataj, iluminat si <span className="text-primary">protectii electrice</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          Alege usor din{' '}
          <Link href="/catalog" className="text-primary font-semibold hover:underline">
            catalogul nostru
          </Link>
          , compara specificatii, descarca fise tehnice si comanda cu livrare in toata Romania. Ai
          nevoie de ajutor?{' '}
          <Link href="/generator-pachet" className="text-primary font-semibold hover:underline">
            Solicita un pachet personalizat
          </Link>
          .
        </p>
      </section>

      {/* Categorii */}
      {categories.length > 0 && (
        <section id="categorii" className="max-w-7xl mx-auto px-4 pt-0 pb-14 md:pb-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {categories.map((cat, i) => (
              <FadeIn key={cat.id} delay={i * 60}>
                <Link
                  href={`/categorie/${cat.slug}`}
                  className="group flex flex-col h-full bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden hover-lift hover:border-primary/20"
                >
                  <div className="aspect-[4/3] relative bg-gray-50 overflow-hidden">
                    {cat.image_url ? (
                      <NextImage
                        src={getStorageUrl('product-images', cat.image_url)}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        quality={80}
                        className="object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={32} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 md:p-4 flex flex-col flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm md:text-base font-semibold text-gray-900 group-hover:text-primary transition-all line-clamp-1">
                        {cat.name}
                      </h3>
                      {categoryCounts[cat.id] > 0 && (
                        <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full shrink-0">
                          {categoryCounts[cat.id]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1 group-hover:text-gray-600 transition-colors">
                      {cat.description || 'Vezi produsele →'}
                    </p>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </section>
      )}

      {/* Generator pachet CTA */}
      <section className="max-w-7xl mx-auto px-4 pb-14 md:pb-16">
        <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 md:p-12 text-white hover:shadow-xl hover:shadow-primary/20 transition-shadow duration-500">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Ai nevoie de un pachet personalizat?
            </h2>
            <p className="text-white/80 mb-6">
              Spune-ne ce proiect ai si noi iti cream o oferta completa cu toate materialele
              necesare — rapid si fara bataie de cap.
            </p>
            <Link
              href="/generator-pachet"
              className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-xl hover:bg-white/90 hover:shadow-md transition-all"
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
            {products.map((product, i) => (
              <FadeIn key={product.id} delay={i * 50}>
                <ProductCard product={product} />
              </FadeIn>
            ))}
          </div>
        </section>
      )}

      {/* Cum functioneaza */}
      <section className="border-y border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-14 md:py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Cum functioneaza?</h2>
            <p className="text-gray-500 mt-2">
              3 pasi simpli pana la materialele de care ai nevoie
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart size={24} className="text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Alege produsele</h3>
              <p className="text-sm text-gray-500">
                Navigheaza in catalog, compara specificatii si adauga in cos.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CreditCard size={24} className="text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Plaseaza comanda</h3>
              <p className="text-sm text-gray-500">
                Plateste cu cardul sau ramburs. Rapid si sigur.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Truck size={24} className="text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Livrare rapida</h3>
              <p className="text-sm text-gray-500">
                Primesti coletul acasa. Gratuit pentru comenzi peste {site.shipping.freeThreshold}{' '}
                RON.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-7xl mx-auto px-4 py-14 md:py-16">
        <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 md:p-12 text-white hover:shadow-xl hover:shadow-primary/20 transition-shadow duration-500">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Fii la curent cu noutatile</h2>
            <p className="text-white/80 mb-6">
              Aboneaza-te si primesti primii ofertele speciale, produse noi si promotii exclusive.
            </p>
            <NewsletterSignup />
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
    </>
  );
}
