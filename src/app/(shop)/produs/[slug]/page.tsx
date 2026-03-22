import { notFound } from 'next/navigation';
import { getPublicSupabase } from '@/lib/supabase-server';
import { ProductGallery } from '@/components/ui/ProductGallery';
import { ProductCard } from '@/components/ui/ProductCard';
import { AddToCartButton } from '@/components/ui/AddToCartButton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { getStorageUrl, formatPrice } from '@/lib/utils';
import { site } from '@/config/site';
import { Download, CheckCircle, XCircle } from 'lucide-react';
import type { Metadata } from 'next';
import type { Product, Category, ProductSpec } from '@/types/database';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getPublicSupabase();
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
  const supabase = getPublicSupabase();

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

  const breadcrumbItems = [
    { label: 'Acasa', href: '/' },
    ...(category ? [{ label: category.name, href: `/categorie/${category.slug}` }] : []),
    { label: p.name },
  ];

  const productImage = p.images[0] ? getStorageUrl('product-images', p.images[0]) : undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 md:py-12">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.name,
          description: p.description || undefined,
          sku: p.sku || undefined,
          brand: p.brand_name ? { '@type': 'Brand', name: p.brand_name } : undefined,
          image: productImage,
          url: `${site.url}/produs/${p.slug}`,
          offers: {
            '@type': 'Offer',
            price: displayPrice,
            priceCurrency: 'RON',
            availability: inStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            url: `${site.url}/produs/${p.slug}`,
          },
        }}
      />
      <Breadcrumbs items={breadcrumbItems} />

      {/* Product layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 mb-14">
        {/* Gallery */}
        <ProductGallery images={p.images} productName={p.name} />

        {/* Info */}
        <div>
          {p.brand_name && (
            <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">{p.brand_name}</p>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5">{p.name}</h1>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-5">
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

          {/* Add to cart */}
          <div className="mb-8">
            <AddToCartButton productId={p.id} stock={p.stock} productName={p.name} />
          </div>

          {/* Datasheet */}
          {p.datasheet_url && (
            <a
              href={getStorageUrl('datasheets', p.datasheet_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <Download size={16} /> Descarca fisa tehnica (PDF)
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      {p.description && (
        <section className="mb-14">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Descriere</h2>
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{p.description}</p>
          </div>
        </section>
      )}

      {/* Specs */}
      {specs.length > 0 && (
        <section className="mb-14">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Specificatii</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {specs.map((spec, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50/50' : ''}>
                    <td className="px-4 md:px-6 py-3 font-medium text-gray-600 w-1/3 text-sm">{spec.key}</td>
                    <td className="px-4 md:px-6 py-3 text-gray-900 text-sm">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Compatible products */}
      {compatibleProducts.length > 0 && (
        <section className="mb-14">
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
