import Link from 'next/link';
import NextImage from 'next/image';
import { notFound } from 'next/navigation';
import { getPublicSupabase } from '@/lib/supabase-server';
import { ProductCard } from '@/components/ui/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getStorageUrl } from '@/lib/utils';
import { Package, SlidersHorizontal, Image as ImageIcon } from 'lucide-react';
import type { Metadata } from 'next';
import type { Product, Category } from '@/types/database';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getPublicSupabase();
  const { data: category } = await supabase
    .from('categories')
    .select('name, image_url, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!category) return { title: 'Categorie' };

  const ogImage = category.image_url
    ? getStorageUrl('product-images', category.image_url)
    : undefined;

  return {
    title: `${category.name} | electricAcasa`,
    description: category.description || `${category.name} — electricAcasa.ro`,
    openGraph: ogImage ? { images: [{ url: ogImage }] } : undefined,
    alternates: { canonical: `/categorie/${slug}` },
  };
}

export default async function CategoriePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const supabase = getPublicSupabase();

  // Fetch category
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (categoryError && categoryError.code !== 'PGRST116') {
    throw new Error(`Category query failed: ${categoryError.message}`);
  }

  if (!category) notFound();
  const cat = category as Category;

  // Build full ancestor chain for breadcrumbs
  const ancestors: Category[] = [];
  let currentParentId = cat.parent_id;
  while (currentParentId) {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('id', currentParentId)
      .single();
    if (!data) break;
    ancestors.unshift(data as Category);
    currentParentId = (data as Category).parent_id;
  }

  // Fetch subcategories
  const { data: subcategories } = await supabase
    .from('categories')
    .select('id, name, slug, image_url, description')
    .eq('parent_id', cat.id)
    .eq('is_active', true)
    .order('sort_order')
    .order('name');

  const subs = (subcategories || []) as Pick<
    Category,
    'id' | 'name' | 'slug' | 'image_url' | 'description'
  >[];
  const isLeaf = subs.length === 0;

  // If not leaf: count products per subcategory
  let subCounts: Record<string, number> = {};
  if (!isLeaf) {
    const subIds = subs.map((s) => s.id);
    const { data: countRows } = await supabase
      .from('products')
      .select('category_id')
      .in('category_id', subIds)
      .eq('is_active', true);
    for (const r of (countRows || []) as { category_id: string }[]) {
      subCounts[r.category_id] = (subCounts[r.category_id] || 0) + 1;
    }
  }

  // Only fetch products + filters for leaf categories
  let prods: Product[] = [];
  let count: number | null = null;
  let totalPages = 0;
  let brands: string[] = [];

  const page = Math.max(1, parseInt(sp.page || '1'));
  const sort = sp.sort || 'newest';
  const brandFilter = sp.brand || '';
  const minPriceRaw = sp.min ? parseFloat(sp.min) : undefined;
  const maxPriceRaw = sp.max ? parseFloat(sp.max) : undefined;
  const minPrice = minPriceRaw !== undefined && minPriceRaw >= 0 ? minPriceRaw : undefined;
  const maxPrice = maxPriceRaw !== undefined && maxPriceRaw >= 0 ? maxPriceRaw : undefined;
  const inStockOnly = sp.stoc === '1';

  if (isLeaf) {
    // Build product query
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('category_id', cat.id)
      .eq('is_active', true);

    if (brandFilter) {
      query = query.eq('brand_name', brandFilter);
    }
    if (minPrice !== undefined) {
      query = query.gte('price', minPrice);
    }
    if (maxPrice !== undefined) {
      query = query.lte('price', maxPrice);
    }
    if (inStockOnly) {
      query = query.gt('stock', 0);
    }

    // Sort
    switch (sort) {
      case 'price-asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price-desc':
        query = query.order('price', { ascending: false });
        break;
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Paginate
    const from = (page - 1) * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);

    const { data: products, count: productCount } = await query;
    prods = (products as Product[]) || [];
    count = productCount;
    totalPages = Math.ceil((count || 0) / PAGE_SIZE);

    // Get unique brands for filter
    const { data: brandRows } = await supabase
      .from('products')
      .select('brand_name')
      .eq('category_id', cat.id)
      .eq('is_active', true)
      .neq('brand_name', '');

    brands = [
      ...new Set((brandRows || []).map((r: { brand_name: string }) => r.brand_name)),
    ].sort();
  }

  // Build filter URL helper
  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = {
      page: sp.page,
      sort: sp.sort,
      brand: sp.brand,
      min: sp.min,
      max: sp.max,
      stoc: sp.stoc,
      ...overrides,
    };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) p.set(k, v);
    });
    if (!overrides.page && Object.keys(overrides).length > 0) {
      p.delete('page');
    }
    const qs = p.toString();
    return `/categorie/${slug}${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Acasa', href: '/' },
          ...ancestors.map((a) => ({ label: a.name, href: `/categorie/${a.slug}` })),
          { label: cat.name },
        ]}
      />

      {/* Category header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{cat.name}</h1>
        {cat.description && <p className="text-gray-500 mt-1">{cat.description}</p>}
      </div>

      {/* Non-leaf: show subcategory cards */}
      {!isLeaf ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {subs.map((sub) => (
            <Link
              key={sub.id}
              href={`/categorie/${sub.slug}`}
              className="group bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden hover-lift hover:border-primary/20"
            >
              <div className="aspect-[4/3] relative bg-gray-50 overflow-hidden">
                {sub.image_url ? (
                  <NextImage
                    src={getStorageUrl('product-images', sub.image_url)}
                    alt={sub.name}
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
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-all">
                    {sub.name}
                  </h3>
                  {subCounts[sub.id] > 0 && (
                    <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {subCounts[sub.id]}
                    </span>
                  )}
                </div>
                {sub.description ? (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 group-hover:text-gray-600 transition-colors">
                    {sub.description}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1 group-hover:text-primary/60 transition-colors">
                    Vezi produsele →
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Leaf: show filters + products */
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            <details
              className="lg:[&>summary]:hidden lg:open bg-white rounded-2xl border border-gray-100 p-4 space-y-5"
              open
            >
              <summary className="lg:hidden flex items-center justify-between cursor-pointer text-sm font-semibold text-gray-900 mb-3 list-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  <SlidersHorizontal size={16} /> Filtre
                </span>
                <span className="text-xs text-primary">Deschide</span>
              </summary>
              <div className="hidden lg:flex items-center gap-2 text-sm font-semibold text-gray-900">
                <SlidersHorizontal size={16} /> Filtre
              </div>

              {/* Brand filter */}
              {brands.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Brand</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {brands.map((brand) => (
                      <Link
                        key={brand}
                        href={buildUrl({ brand: brandFilter === brand ? undefined : brand })}
                        className={`block text-sm px-2 py-1 rounded-lg transition-colors ${
                          brandFilter === brand
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-gray-600 hover:bg-primary/5 hover:text-gray-900'
                        }`}
                      >
                        {brand}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Price filter */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Pret (RON)</p>
                <form action={`/categorie/${slug}`} className="flex gap-2">
                  {brandFilter && <input type="hidden" name="brand" value={brandFilter} />}
                  {sp.stoc && <input type="hidden" name="stoc" value={sp.stoc} />}
                  {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
                  <input
                    type="number"
                    name="min"
                    placeholder="Min"
                    defaultValue={sp.min || ''}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="number"
                    name="max"
                    placeholder="Max"
                    defaultValue={sp.max || ''}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark"
                  >
                    Ok
                  </button>
                </form>
              </div>

              {/* In stock filter */}
              <div>
                <Link
                  href={buildUrl({ stoc: inStockOnly ? undefined : '1' })}
                  className={`text-sm px-2 py-1 rounded-lg block transition-colors ${
                    inStockOnly
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-600 hover:bg-primary/5 hover:text-gray-900'
                  }`}
                >
                  Doar in stoc
                </Link>
              </div>

              {/* Reset */}
              {(brandFilter || minPrice !== undefined || maxPrice !== undefined || inStockOnly) && (
                <Link
                  href={`/categorie/${slug}`}
                  className="block text-xs text-center text-red-500 hover:underline"
                >
                  Reseteaza filtrele
                </Link>
              )}
            </details>
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            {/* Count + Sort bar */}
            <div className="flex items-center justify-between gap-4 mb-6">
              {count !== null && (
                <p className="text-sm text-gray-500 shrink-0">
                  {count} {count === 1 ? 'produs' : 'produse'}
                </p>
              )}
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-sm text-gray-500 shrink-0">Sorteaza:</span>
                <div className="flex gap-1.5 shrink-0">
                  {[
                    { key: 'newest', label: 'Cele mai noi' },
                    { key: 'price-asc', label: 'Pret crescator' },
                    { key: 'price-desc', label: 'Pret descrescator' },
                    { key: 'name', label: 'Nume A-Z' },
                  ].map((opt) => (
                    <Link
                      key={opt.key}
                      href={buildUrl({ sort: opt.key, page: undefined })}
                      className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                        sort === opt.key
                          ? 'bg-primary text-white'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {opt.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid */}
            {prods.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {prods.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Package}
                title="Nu am gasit produse"
                description="Incearca sa schimbi filtrele sau sa explorezi alte categorii."
              />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                {page > 1 && (
                  <Link
                    href={buildUrl({ page: String(page - 1) })}
                    className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-xl hover:border-primary hover:text-primary transition-colors"
                  >
                    Inapoi
                  </Link>
                )}
                <span className="text-sm text-gray-500">
                  Pagina {page} din {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={buildUrl({ page: String(page + 1) })}
                    className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-xl hover:border-primary hover:text-primary transition-colors"
                  >
                    Inainte
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
