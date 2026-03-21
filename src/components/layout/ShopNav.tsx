'use client';

import Link from 'next/link';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useCart } from '@/lib/cart';

import { cn } from '@/lib/utils';
import { Menu, X, ShoppingCart, User, ChevronDown } from 'lucide-react';

interface ShopNavProps {
  categories: { id: string; name: string; slug: string }[];
}

export function ShopNav({ categories }: ShopNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { cartCount } = useCart();
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: unknown } }) => {
      setIsLoggedIn(!!user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: { user?: unknown } | null) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-shadow duration-200',
        'bg-gradient-to-r from-primary via-accent to-primary-light',
        scrolled && 'shadow-lg'
      )}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <span className="text-xl md:text-2xl font-bold text-white">electricAcasa<span className="text-white/70 font-normal text-sm">.ro</span></span>
          </Link>

          {/* Desktop: Categories + links */}
          <div className="hidden md:flex items-center gap-6">
            <div className="relative">
              <button
                onClick={() => setCatOpen(!catOpen)}
                className="flex items-center gap-1 text-sm font-medium text-white/90 hover:text-white transition-colors"
              >
                Categorii <ChevronDown size={16} className={cn('transition-transform', catOpen && 'rotate-180')} />
              </button>
              {catOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCatOpen(false)} />
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/categorie/${cat.slug}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                    {categories.length === 0 && (
                      <p className="px-4 py-2 text-sm text-gray-400">Nicio categorie</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Search — visual only, not functional yet */}
          <div className="hidden lg:block flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Cauta produse..."
              disabled
              className="w-full px-4 py-2 rounded-xl border border-white/30 bg-white/15 text-sm text-white/60 placeholder:text-white/50 cursor-not-allowed"
            />
          </div>

          {/* Right: Cart + Account */}
          <div className="flex items-center gap-3">
            <Link
              href="/cos"
              className="relative p-2 rounded-xl text-white/90 hover:bg-white/15 hover:text-white transition-colors"
              aria-label="Cos de cumparaturi"
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-white text-primary text-[10px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            <Link
              href={isLoggedIn ? '/dashboard' : '/login'}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white/90 hover:bg-white/15 hover:text-white transition-colors"
            >
              <User size={18} />
              {isLoggedIn ? 'Contul meu' : 'Autentificare'}
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-xl text-white/90 hover:bg-white/15"
              aria-label={menuOpen ? 'Inchide meniu' : 'Deschide meniu'}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white pb-4 px-4">
            <div className="py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Categorii</p>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categorie/${cat.slug}`}
                  className="block py-2 text-sm text-gray-700 hover:text-primary"
                >
                  {cat.name}
                </Link>
              ))}
              {categories.length === 0 && (
                <p className="py-2 text-sm text-gray-400">Nicio categorie</p>
              )}
            </div>
            <div className="border-t border-gray-100 pt-3">
              <Link
                href={isLoggedIn ? '/dashboard' : '/login'}
                className="flex items-center gap-2 py-2 text-sm text-gray-700 hover:text-primary"
              >
                <User size={18} />
                {isLoggedIn ? 'Contul meu' : 'Autentificare'}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-[57px]" />
    </>
  );
}
