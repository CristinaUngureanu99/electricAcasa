import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase-server';
import { ProductCard } from '@/components/ui/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { getStorageUrl } from '@/lib/utils';
import { ChevronRight, Package, SlidersHorizontal } from 'lucide-react';
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
  const supabase = getServiceSupabase();
  const { data: category } = await supabase
    .from('categories')
    .select('name')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  return {
    title: category ? `${category.name} | electricAcasa` : 'Categorie',
  };
}

export default async function CategoriePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const supabase = getServiceSupabase();

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

  // Fetch parent if subcategory
  let parent: Category | null = null;
  if (cat.parent_id) {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('id', cat.parent_id)
      .single();
    parent = data as Category | null;
  }

  // Fetch subcategories
  const { data: subcategories } = await supabase
    .from('categories')
    .select('id, name, slug, image_url')
    .eq('parent_id', cat.id)
    .eq('is_active', true)
    .order('sort_order')
    .order('name');

  const subs = (subcategories || []) as Pick<Category, 'id' | 'name' | 'slug' | 'image_url'>[];

  // Collect all category IDs (current + subcategories) for inclusive product fetch
  const allCategoryIds = [cat.id, ...subs.map((s) => s.id)];

  // Parse search params
  const page = Math.max(1, parseInt(sp.page || '1'));
  const sort = sp.sort || 'newest';
  const brandFilter = sp.brand || '';
  const minPrice = sp.min ? parseFloat(sp.min) : undefined;
  const maxPrice = sp.max ? parseFloat(sp.max) : undefined;
  const inStockOnly = sp.stoc === '1';

  // Build product query
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .in('category_id', allCategoryIds)
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

  const { data: products, count } = await query;
  const prods = (products as Product[]) || [];
  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  // Get unique brands for filter (from ALL products in these categories, unfiltered)
  const { data: brandRows } = await supabase
    .from('products')
    .select('brand_name')
    .in('category_id', allCategoryIds)
    .eq('is_active', true)
    .neq('brand_name', '');

  const brands = [...new Set((brandRows || []).map((r: { brand_name: string }) => r.brand_name))].sort();

  // Build filter URL helper
  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { page: sp.page, sort: sp.sort, brand: sp.brand, min: sp.min, max: sp.max, stoc: sp.stoc, ...overrides };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) p.set(k, v);
    });
    // Reset page when filters change (unless page itself is being set)
    if (!overrides.page && Object.keys(overrides).length > 0) {
      p.delete('page');
    }
    const qs = p.toString();
    return `/categorie/${slug}${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary">Acasa</Link>
        <ChevronRight size={14} />
        {parent && (
          <>
            <Link href={`/categorie/${parent.slug}`} className="hover:text-primary">{parent.name}</Link>
            <ChevronRight size={14} />
          </>
        )}
        <span className="text-gray-900 font-medium">{cat.name}</span>
      </nav>

      {/* Category header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{cat.name}</h1>
        {count !== null && (
          <p className="text-gray-500 mt-1">{count} {count === 1 ? 'produs' : 'produse'}</p>
        )}
      </div>

      {/* Subcategories */}
      {subs.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-8">
          {subs.map((sub) => (
            <Link
              key={sub.id}
              href={`/categorie/${sub.slug}`}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary transition-colors"
            >
              {sub.image_url && (
                <img src={getStorageUrl('product-images', sub.image_url)} alt="" className="w-6 h-6 rounded object-cover" />
              )}
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
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
                        brandFilter === brand ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'
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
              <form className="flex gap-2">
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
                  formAction={`/categorie/${slug}`}
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
                  inStockOnly ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'
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
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {/* Sort bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sorteaza:</span>
              <div className="flex gap-1">
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
                      sort === opt.key ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary'
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
    </div>
  );
}
