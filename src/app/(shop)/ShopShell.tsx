'use client';

import { ToastProvider } from '@/components/ui/Toast';
import { CartProvider } from '@/lib/cart';
import { ShopNav } from '@/components/layout/ShopNav';
import { ShopFooter } from '@/components/layout/ShopFooter';

interface ShopShellProps {
  categories: { id: string; name: string; slug: string }[];
  categoryCounts?: Record<string, number>;
  children: React.ReactNode;
}

export function ShopShell({ categories, categoryCounts, children }: ShopShellProps) {
  return (
    <ToastProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col bg-surface">
          <ShopNav categories={categories} categoryCounts={categoryCounts} />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <ShopFooter categories={categories} />
        </div>
      </CartProvider>
    </ToastProvider>
  );
}
