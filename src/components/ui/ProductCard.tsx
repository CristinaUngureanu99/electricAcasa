import Link from 'next/link';
import Image from 'next/image';
import { getStorageUrl, formatPrice } from '@/lib/utils';
import { site } from '@/config/site';
import { Image as ImageIcon } from 'lucide-react';
import type { Product } from '@/types/database';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const thumb = product.images[0];
  const hasDiscount = product.sale_price !== null && product.sale_price < product.price;
  const displayPrice = hasDiscount ? product.sale_price! : product.price;
  const discountPercent =
    hasDiscount && product.price > 0
      ? Math.round((1 - product.sale_price! / product.price) * 100)
      : 0;
  const outOfStock = product.stock === 0;
  const lowStock = !outOfStock && product.stock > 0 && product.stock <= site.lowStockThreshold;

  return (
    <Link
      href={`/produs/${product.slug}`}
      className="group block bg-white rounded-2xl border border-gray-100/80 shadow-sm overflow-hidden hover-lift hover:border-primary/20"
    >
      <div className="aspect-square relative bg-gray-50 overflow-hidden">
        {thumb ? (
          <Image
            src={getStorageUrl('product-images', thumb)}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            quality={80}
            className="object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={48} className="text-gray-300" />
          </div>
        )}
        {outOfStock && (
          <span className="absolute top-2 left-2 bg-danger text-white text-xs font-semibold px-2 py-1 rounded-full">
            Stoc epuizat
          </span>
        )}
        {hasDiscount && !outOfStock && discountPercent > 0 && (
          <span className="absolute top-2 left-2 bg-accent text-white text-xs font-semibold px-2 py-1 rounded-full">
            -{discountPercent}%
          </span>
        )}
        {lowStock && (
          <span className="absolute top-2 right-2 bg-warning text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            Ultimele {product.stock}!
          </span>
        )}
      </div>
      <div className="p-4">
        {product.brand_name && (
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 group-hover:text-gray-600 transition-colors">
            {product.brand_name}
          </p>
        )}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-primary transition-all">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className={`text-lg font-bold ${hasDiscount ? 'text-danger' : 'text-gray-900'}`}>
            {formatPrice(displayPrice)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
