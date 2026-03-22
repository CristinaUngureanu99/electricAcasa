import Link from 'next/link';
import { getPublicSupabase } from '@/lib/supabase-server';
import { ProductCard } from '@/components/ui/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Package, SlidersHorizontal } from 'lucide-react';
import type { Metadata } from 'next';
import type { Product, Category } from '@/types/database';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Catalog produse | electricAcasa',
  description: 'Catalog complet de materiale electrice — aparataj, iluminat, protectii, cabluri, smart home si accesorii.',
};

const PAGE_SIZE = 16;

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function CatalogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = getPublicSupabase();

  // Fetch categories for filter sidebar
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('id, name, slug')
    .is('parent_id', null)
    .eq('is_active', true)
    .order('sort_order')
    .order('name');

  const categories = (categoriesData as Pick<Category, 'id' | 'name' | 'slug'>[]) || [];

  // Parse search params
  const page = Math.max(1, parseInt(sp.page || '1'));
  const sort = sp.sort || 'newest';
  const categoryFilter = sp.categorie || '';
  const brandFilter = sp.brand || '';
  const minPrice = sp.min ? parseFloat(sp.min) : undefined;
  const maxPrice = sp.max ? parseFloat(sp.max) : undefined;
  const inStockOnly = sp.stoc === '1';
  const hasDiscount = sp.discount === '1';
  const searchQuery = sp.q || '';

  // Build product query
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  if (categoryFilter) {
    query = query.eq('category_id', categoryFilter);
  }
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
  if (hasDiscount) {
    query = query.not('sale_price', 'is', null);
  }
  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`);
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

  const { data: products, count } = await query;
  const prods = (products as Product[]) || [];
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  // Get unique brands for filter
  let brandQuery = supabase
    .from('products')
    .select('brand_name')
    .eq('is_active', true)
    .neq('brand_name', '');

  if (categoryFilter) {
    brandQuery = brandQuery.eq('category_id', categoryFilter);
  }

  const { data: brandRows } = await brandQuery;
  const brands = [...new Set((brandRows || []).map((r: { brand_name: string }) => r.brand_name))].sort();

  // Build filter URL helper
  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = {
      page: sp.page, sort: sp.sort, categorie: sp.categorie, brand: sp.brand,
      min: sp.min, max: sp.max, stoc: sp.stoc, discount: sp.discount, q: sp.q,
      ...overrides,
    };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) p.set(k, v);
    });
    if (!overrides.page && Object.keys(overrides).length > 0) {
      p.delete('page');
    }
    const qs = p.toString();
    return `/catalog${qs ? `?${qs}` : ''}`;
  }

  const activeCategoryName = categoryFilter
    ? categories.find((c) => c.id === categoryFilter)?.name
    : null;

  const hasAnyFilter = categoryFilter || brandFilter || minPrice !== undefined || maxPrice !== undefined || inStockOnly || hasDiscount || searchQuery;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumbs items={[
        { label: 'Acasa', href: '/' },
        { label: 'Catalog', href: activeCategoryName ? '/catalog' : undefined },
        ...(activeCategoryName ? [{ label: activeCategoryName }] : []),
      ]} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {activeCategoryName || 'Catalog produse'}
        </h1>
        {count !== null && (
          <p className="text-gray-500 mt-1">{count} {count === 1 ? 'produs' : 'produse'}</p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar — collapsed on mobile */}
        <aside className="w-full lg:w-64 shrink-0">
          <details className="lg:[&>summary]:hidden lg:open bg-white rounded-2xl border border-gray-100 p-4 space-y-5" open>
            <summary className="lg:hidden flex items-center justify-between cursor-pointer text-sm font-semibold text-gray-900 mb-3 list-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2"><SlidersHorizontal size={16} /> Filtre</span>
              <span className="text-xs text-primary">{hasAnyFilter ? 'Filtre active' : 'Deschide'}</span>
            </summary>
            <div className="hidden lg:flex items-center gap-2 text-sm font-semibold text-gray-900">
              <SlidersHorizontal size={16} /> Filtre
            </div>

            {/* Search */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Cauta</p>
              <form action="/catalog">
                {categoryFilter && <input type="hidden" name="categorie" value={categoryFilter} />}
                {brandFilter && <input type="hidden" name="brand" value={brandFilter} />}
                {sp.stoc && <input type="hidden" name="stoc" value={sp.stoc} />}
                {sp.discount && <input type="hidden" name="discount" value={sp.discount} />}
                {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
                <input
                  type="text"
                  name="q"
                  placeholder="Nume produs..."
                  defaultValue={searchQuery}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </form>
            </div>

            {/* Category filter */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Categorie</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {categoryFilter && (
                  <Link
                    href={buildUrl({ categorie: undefined })}
                    className="block text-sm px-2 py-1 rounded-lg text-primary font-medium bg-primary/10"
                  >
                    Toate categoriile
                  </Link>
                )}
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={buildUrl({ categorie: categoryFilter === cat.id ? undefined : cat.id })}
                    className={`block text-sm px-2 py-1 rounded-lg transition-colors ${
                      categoryFilter === cat.id ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-primary/5 hover:text-gray-900'
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Brand filter */}
            {brands.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Brand</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {brands.map((brand) => (
                    <Link
                      key={brand}
                      href={buildUrl({ brand: brandFilter === brand ? undefined : brand })}
                      className={`block text-sm px-2 py-1 rounded-lg transition-colors ${
                        brandFilter === brand ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-primary/5 hover:text-gray-900'
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
              <form action="/catalog" className="flex gap-2">
                {categoryFilter && <input type="hidden" name="categorie" value={categoryFilter} />}
                {brandFilter && <input type="hidden" name="brand" value={brandFilter} />}
                {sp.stoc && <input type="hidden" name="stoc" value={sp.stoc} />}
                {sp.discount && <input type="hidden" name="discount" value={sp.discount} />}
                {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
                {searchQuery && <input type="hidden" name="q" value={searchQuery} />}
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

            {/* Quick filters */}
            <div className="space-y-1">
              <Link
                href={buildUrl({ stoc: inStockOnly ? undefined : '1' })}
                className={`text-sm px-2 py-1 rounded-lg block transition-colors ${
                  inStockOnly ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-primary/5 hover:text-gray-900'
                }`}
              >
                Doar in stoc
              </Link>
              <Link
                href={buildUrl({ discount: hasDiscount ? undefined : '1' })}
                className={`text-sm px-2 py-1 rounded-lg block transition-colors ${
                  hasDiscount ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-primary/5 hover:text-gray-900'
                }`}
              >
                Cu reducere
              </Link>
            </div>

            {/* Reset */}
            {hasAnyFilter && (
              <Link
                href="/catalog"
                className="block text-xs text-center text-red-500 hover:underline"
              >
                Reseteaza filtrele
              </Link>
            )}
          </details>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {/* Sort bar */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto">
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
                      sort === opt.key ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {opt.label}
                  </Link>
                ))}
            </div>
          </div>

          {/* Grid */}
          {prods.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
    </div>
  );
}
