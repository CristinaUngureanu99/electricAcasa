'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { ProductCard } from '@/components/ui/ProductCard';
import type { Product } from '@/types/database';

const STORAGE_KEY = 'ea-recently-viewed';
const MAX_ITEMS = 10;

export function trackProductView(slug: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const slugs: string[] = raw ? JSON.parse(raw) : [];
    const updated = [slug, ...slugs.filter((s) => s !== slug)].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

interface RecentlyViewedProps {
  currentSlug: string;
}

export function RecentlyViewed({ currentSlug }: RecentlyViewedProps) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const slugs: string[] = JSON.parse(raw);
        const filtered = slugs.filter((s) => s !== currentSlug).slice(0, 4);
        if (filtered.length === 0) return;

        const supabase = createClient();
        const { data } = await supabase
          .from('products')
          .select('*')
          .in('slug', filtered)
          .eq('is_active', true);

        if (data && data.length > 0) {
          // Sort by the order in localStorage
          const sorted = filtered
            .map((slug) => (data as Product[]).find((p) => p.slug === slug))
            .filter((p): p is Product => p !== undefined);
          setProducts(sorted);
        }
      } catch { /* ignore */ }
    }
    load();
  }, [currentSlug]);

  if (products.length === 0) return null;

  return (
    <section className="mb-14">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Ai vizualizat recent</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
