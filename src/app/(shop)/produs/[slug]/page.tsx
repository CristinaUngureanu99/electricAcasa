import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { ProductGallery } from '@/components/ui/ProductGallery';
import { ProductCard } from '@/components/ui/ProductCard';
import { Button } from '@/components/ui/Button';
import { getStorageUrl, formatPrice } from '@/lib/utils';
import { ChevronRight, Download, ShoppingCart, CheckCircle, XCircle } from 'lucide-react';
import type { Metadata } from 'next';
import type { Product, Category, ProductSpec } from '@/types/database';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: product } = await supabase
    .from('products')
    .select('name, description, images')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!product) return { title: 'Produs negasit' };

  const p = product as Pick<Product, 'name' | 'description' | 'images'>;
  const ogImage = p.images[0] ? getStorageUrl('product-images', p.images[0]) : undefined;

  return {
    title: `${p.name} | electricAcasa`,
    description: p.description?.slice(0, 160) || `${p.name} - electricAcasa.ro`,
    openGraph: ogImage ? { images: [{ url: ogImage }] } : undefined,
  };
}

export default async function ProdusPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch product
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!product) notFound();
  const p = product as Product;

  // Fetch category for breadcrumbs
  let category: Category | null = null;
  if (p.category_id) {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('id', p.category_id)
      .single();
    category = data as Category | null;
  }

  // Fetch compatible products
  const { data: relations } = await supabase
    .from('product_relations')
    .select('related_product_id')
    .eq('product_id', p.id);

  let compatibleProducts: Product[] = [];
  if (relations && relations.length > 0) {
    const relatedIds = relations.map((r: { related_product_id: string }) => r.related_product_id);
    const { data: related } = await supabase
      .from('products')
      .select('*')
      .in('id', relatedIds)
      .eq('is_active', true);
    compatibleProducts = (related as Product[]) || [];
  }

  const hasDiscount = p.sale_price !== null && p.sale_price < p.price;
  const displayPrice = hasDiscount ? p.sale_price! : p.price;
  const inStock = p.stock > 0;
  const specs = (p.specs as ProductSpec[]) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary">Acasa</Link>
        <ChevronRight size={14} />
        {category && (
          <>
            <Link href={`/categorie/${category.slug}`} className="hover:text-primary">{category.name}</Link>
            <ChevronRight size={14} />
          </>
        )}
        <span className="text-gray-900 font-medium line-clamp-1">{p.name}</span>
      </nav>

      {/* Product layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Gallery */}
        <ProductGallery images={p.images} productName={p.name} />

        {/* Info */}
        <div>
          {p.brand_name && (
            <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">{p.brand_name}</p>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{p.name}</h1>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className={`text-3xl font-bold ${hasDiscount ? 'text-red-600' : 'text-gray-900'}`}>
              {formatPrice(displayPrice)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-gray-400 line-through">{formatPrice(p.price)}</span>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 mb-6">
            {inStock ? (
              <>
                <CheckCircle size={18} className="text-success" />
                <span className="text-sm font-medium text-success">In stoc ({p.stock} buc)</span>
              </>
            ) : (
              <>
                <XCircle size={18} className="text-red-500" />
                <span className="text-sm font-medium text-red-500">Stoc epuizat</span>
              </>
            )}
          </div>

          {/* SKU */}
          {p.sku && (
            <p className="text-xs text-gray-400 mb-6">SKU: {p.sku}</p>
          )}

          {/* Add to cart — placeholder disabled, functional in Step 5 */}
          <Button size="lg" disabled className="w-full sm:w-auto mb-6">
            <ShoppingCart size={18} className="mr-2" />
            {inStock ? 'Adauga in cos' : 'Indisponibil'}
          </Button>
          {inStock && (
            <p className="text-xs text-gray-400 mb-6">Cosul de cumparaturi va fi disponibil in curand.</p>
          )}

          {/* Datasheet */}
          {p.datasheet_url && (
            <a
              href={getStorageUrl('datasheets', p.datasheet_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Download size={16} /> Descarca fisa tehnica (PDF)
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      {p.description && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Descriere</h2>
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{p.description}</p>
          </div>
        </section>
      )}

      {/* Specs */}
      {specs.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Specificatii</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {specs.map((spec, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50/50' : ''}>
                    <td className="px-6 py-3 font-medium text-gray-600 w-1/3">{spec.key}</td>
                    <td className="px-6 py-3 text-gray-900">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Compatible products */}
      {compatibleProducts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Produse compatibile</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {compatibleProducts.map((cp) => (
              <ProductCard key={cp.id} product={cp} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
