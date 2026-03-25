'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { useCart } from '@/lib/cart';

import { cn } from '@/lib/utils';
import { Menu, X, ShoppingCart, User, ChevronDown, Search } from 'lucide-react';

interface ShopNavProps {
  categories: { id: string; name: string; slug: string }[];
  categoryCounts?: Record<string, number>;
}

export function ShopNav({ categories, categoryCounts }: ShopNavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { cartCount } = useCart();
  const [cartPop, setCartPop] = useState(false);
  const prevCartCount = useRef(cartCount);

  useEffect(() => {
    if (cartCount > prevCartCount.current) {
      setCartPop(true);
      const t = setTimeout(() => setCartPop(false), 400);
      return () => clearTimeout(t);
    }
    prevCartCount.current = cartCount;
  }, [cartCount]);

  const closeMenus = useCallback(() => {
    setCatOpen(false);
    setMenuOpen(false);
    setMobileSearchOpen(false);
  }, []);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: unknown } }) => {
      setIsLoggedIn(!!user);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: { user?: unknown } | null) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCatOpen(false);
        setMobileSearchOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-shadow duration-200',
          'bg-gradient-to-r from-primary via-accent to-primary-light',
          scrolled && 'shadow-lg',
        )}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="shrink-0" onClick={closeMenus}>
            <span className="text-xl md:text-2xl font-bold text-white">
              electricAcasa<span className="text-white/70 font-normal text-sm">.ro</span>
            </span>
          </Link>

          {/* Desktop: Catalog + Categories + Pachet */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/catalog"
              onClick={closeMenus}
              className={cn(
                'nav-link text-sm font-medium hover:text-white',
                pathname === '/catalog' ? 'text-white' : 'text-white/90',
              )}
            >
              Catalog
            </Link>
            <div className="relative">
              <button
                onClick={() => setCatOpen(!catOpen)}
                className={cn(
                  'nav-link flex items-center gap-1 text-sm font-medium hover:text-white',
                  pathname.startsWith('/categorie') ? 'text-white' : 'text-white/90',
                )}
              >
                Categorii{' '}
                <ChevronDown
                  size={16}
                  className={cn('transition-transform', catOpen && 'rotate-180')}
                />
              </button>
              {catOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCatOpen(false)} />
                  <div className="absolute top-full left-0 mt-2 w-60 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-black/12 ring-1 ring-primary/10 border border-gray-100 py-1.5 z-50 animate-[fadeIn_0.15s_ease-out]">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/categorie/${cat.slug}`}
                        onClick={() => setCatOpen(false)}
                        className="group/item flex items-center gap-2.5 mx-1.5 px-3 py-2.5 text-sm text-gray-600 rounded-lg hover:bg-primary/5 hover:text-gray-900 transition-all"
                      >
                        <span className="w-1 h-4 rounded-full bg-gray-200 group-hover/item:bg-primary transition-colors" />
                        <span className="flex-1">{cat.name}</span>
                        {categoryCounts?.[cat.id] ? (
                          <span className="text-[10px] text-gray-400 font-medium">
                            {categoryCounts[cat.id]}
                          </span>
                        ) : null}
                      </Link>
                    ))}
                    {categories.length === 0 && (
                      <p className="px-4 py-2 text-sm text-gray-400">Nicio categorie</p>
                    )}
                  </div>
                </>
              )}
            </div>
            <Link
              href="/generator-pachet"
              onClick={closeMenus}
              className={cn(
                'nav-link text-sm font-medium hover:text-white',
                pathname === '/generator-pachet' ? 'text-white' : 'text-white/90',
              )}
            >
              Pachet personalizat
            </Link>
          </div>

          {/* Search */}
          <div className="hidden lg:block flex-1 max-w-xs">
            <form action="/catalog" className="relative">
              <input
                type="text"
                name="q"
                placeholder="Cauta produse..."
                className="w-full pl-4 pr-10 py-2 rounded-xl border border-white/30 bg-white/15 text-sm text-white placeholder:text-white/50 focus:outline-none focus:bg-white/25 focus:border-white/50 transition-colors"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                <Search size={16} />
              </button>
            </form>
          </div>

          {/* Right: Cart + Search (mobile) + Account + Hamburger */}
          <div className="flex items-center gap-3">
            {/* Mobile search toggle */}
            <button
              onClick={() => {
                setMobileSearchOpen(!mobileSearchOpen);
                setMenuOpen(false);
              }}
              className="lg:hidden p-2 rounded-xl text-white/90 hover:bg-white/15 hover:text-white transition-all"
              aria-label="Cauta produse"
            >
              <Search size={22} />
            </button>

            <Link
              href="/cos"
              onClick={closeMenus}
              className="relative p-2 rounded-xl text-white/90 hover:bg-white/15 hover:text-white hover:scale-105 transition-all"
              aria-label="Cos de cumparaturi"
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span
                  className={`absolute -top-0.5 -right-0.5 bg-white text-primary text-[10px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full ${cartPop ? 'cart-pop' : ''}`}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            <Link
              href={isLoggedIn ? '/dashboard' : '/login'}
              onClick={closeMenus}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white/90 hover:bg-white/15 hover:text-white transition-all"
            >
              <User size={18} />
              {isLoggedIn ? 'Contul meu' : 'Autentificare'}
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => {
                setMenuOpen(!menuOpen);
                setMobileSearchOpen(false);
              }}
              className="md:hidden p-2 rounded-xl text-white/90 hover:bg-white/15"
              aria-label={menuOpen ? 'Inchide meniu' : 'Deschide meniu'}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md pb-4 px-4 animate-[fadeIn_0.15s_ease-out]">
            <div className="py-3">
              {/* Mobile search */}
              <form action="/catalog" className="mb-3">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    name="q"
                    placeholder="Cauta produse..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </form>
              <Link
                href="/catalog"
                onClick={closeMenus}
                className="flex items-center gap-2 py-2.5 px-2 -mx-2 text-sm font-semibold text-primary rounded-lg hover:bg-primary/5 transition-all"
              >
                Catalog complet
              </Link>
              <Link
                href="/generator-pachet"
                onClick={closeMenus}
                className="flex items-center gap-2 py-2.5 px-2 -mx-2 text-sm font-semibold text-primary rounded-lg hover:bg-primary/5 transition-all"
              >
                Pachet personalizat
              </Link>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 mt-4">
                Categorii
              </p>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categorie/${cat.slug}`}
                  onClick={closeMenus}
                  className="block py-2 px-2 -mx-2 text-sm text-gray-700 rounded-lg hover:bg-primary/5 hover:text-primary transition-all"
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
                onClick={closeMenus}
                className="flex items-center gap-2 py-2.5 px-2 -mx-2 text-sm text-gray-700 rounded-lg hover:bg-primary/5 hover:text-primary transition-all"
              >
                <User size={18} />
                {isLoggedIn ? 'Contul meu' : 'Autentificare'}
              </Link>
            </div>
          </div>
        )}
        {/* Mobile search bar (expandable) */}
        {mobileSearchOpen && (
          <div className="lg:hidden border-t border-white/20 bg-white/10 px-4 py-3 animate-[fadeIn_0.15s_ease-out]">
            <form action="/catalog" className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60"
              />
              <input
                type="text"
                name="q"
                placeholder="Cauta produse..."
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/30 bg-white/15 text-sm text-white placeholder:text-white/50 focus:outline-none focus:bg-white/25 focus:border-white/50 transition-colors"
              />
            </form>
          </div>
        )}
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-[57px]" />
    </>
  );
}
