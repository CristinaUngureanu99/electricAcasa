'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/cart';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { getStorageUrl, formatPrice } from '@/lib/utils';
import { site } from '@/config/site';
import { ShoppingCart, Trash2, Minus, Plus, Image as ImageIcon, ArrowRight } from 'lucide-react';

export default function CosPage() {
  const {
    cartItems,
    cartCount,
    subtotal,
    shippingCost,
    total,
    loading,
    updateQuantity,
    removeItem,
  } = useCart();

  if (loading)
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <PageSkeleton />
      </div>
    );

  if (cartItems.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <EmptyState
          icon={ShoppingCart}
          title="Cosul tau e gol"
          description="Exploreaza catalogul nostru si adauga produse in cos."
          action={
            <div className="flex flex-col items-center gap-4">
              <Link href="/catalog">
                <Button>
                  Vezi catalogul <ArrowRight size={16} className="ml-1" />
                </Button>
              </Link>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                <Link href="/generator-pachet" className="text-sm text-primary hover:underline">
                  Solicita pachet personalizat
                </Link>
                <span className="text-gray-300">|</span>
                <Link href="/contact" className="text-sm text-primary hover:underline">
                  Contacteaza-ne
                </Link>
              </div>
            </div>
          }
        />
      </div>
    );
  }

  const freeShippingDiff = site.shipping.freeThreshold - subtotal;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Cos de cumparaturi ({cartCount} {cartCount === 1 ? 'produs' : 'produse'})
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Items */}
        <div className="flex-1 space-y-3">
          {cartItems.map(({ productId, quantity, product }) => {
            const thumb = product.images[0];
            const unitPrice = product.sale_price ?? product.price;
            const lineTotal = unitPrice * quantity;

            return (
              <div
                key={productId}
                className="flex gap-4 bg-white rounded-2xl border border-gray-100 p-4"
              >
                {/* Image */}
                <Link href={`/produs/${product.slug}`} className="shrink-0">
                  {thumb ? (
                    <Image
                      src={getStorageUrl('product-images', thumb)}
                      alt={product.name}
                      width={80}
                      height={80}
                      quality={70}
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                      <ImageIcon size={24} className="text-gray-300" />
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/produs/${product.slug}`}
                    className="text-sm font-medium text-gray-900 hover:text-primary line-clamp-2"
                  >
                    {product.name}
                  </Link>
                  {product.brand_name && (
                    <p className="text-xs text-gray-400 mt-0.5">{product.brand_name}</p>
                  )}
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {formatPrice(unitPrice)}
                  </p>

                  {/* Quantity + Remove */}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(productId, quantity - 1)}
                        disabled={quantity <= 1}
                        className="px-3 py-2 text-gray-500 hover:bg-primary/5 active:bg-primary/10 disabled:opacity-40 disabled:active:bg-transparent transition-all"
                        aria-label="Scade cantitatea"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-3 py-2 text-sm font-medium tabular-nums">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(productId, quantity + 1)}
                        disabled={quantity >= product.stock}
                        className="px-3 py-2 text-gray-500 hover:bg-primary/5 active:bg-primary/10 disabled:opacity-40 disabled:active:bg-transparent transition-all"
                        aria-label="Creste cantitatea"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(productId)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Sterge produsul"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Line total */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">{formatPrice(lineTotal)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:sticky lg:top-20">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sumar comanda</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Transport</span>
                <span className="font-medium">
                  {shippingCost === 0 ? (
                    <span className="text-success">Gratuit</span>
                  ) : (
                    formatPrice(shippingCost)
                  )}
                </span>
              </div>
              {freeShippingDiff > 0 && (
                <p className="text-xs text-accent">
                  Mai adauga {formatPrice(freeShippingDiff)} pentru transport gratuit
                </p>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900">{formatPrice(total)}</span>
              </div>
            </div>

            <Link href="/checkout">
              <Button size="lg" className="w-full mt-6">
                Spre checkout
              </Button>
            </Link>

            <Link
              href="/catalog"
              className="block text-sm text-center text-primary hover:underline mt-4"
            >
              Continua cumparaturile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
