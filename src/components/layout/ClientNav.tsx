'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import { site } from '@/config/site';
import {
  LayoutDashboard,
  ShoppingBag,
  MapPin,
  User,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, activeClass: 'bg-gray-900 text-white' },
  { href: '/comenzi', label: 'Comenzi', icon: ShoppingBag, activeClass: 'bg-gray-900 text-white' },
  { href: '/adrese', label: 'Adrese', icon: MapPin, activeClass: 'bg-gray-900 text-white' },
  { href: '/profile', label: 'Profil', icon: User, activeClass: 'bg-gray-900 text-white' },
];

export function ClientNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminAccess, setAdminAccess] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (data?.role === 'admin') setAdminAccess(true);
      } catch {
        // Silently fail - admin button just won't show
      }
    }
    checkAdmin();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-between">
        <Link href="/">
          <Image src="/logo.png" alt={site.logoAlt} width={120} height={48} className="h-9 w-auto" />
        </Link>
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-900" aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <nav
        className={cn(
          'fixed z-50 top-0 left-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-out',
          'md:translate-x-0',
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-5 border-b border-gray-50">
          <Link href="/" onClick={() => setMenuOpen(false)}>
            <Image src="/logo.png" alt={site.logoAlt} width={180} height={72} className="h-14 w-auto" />
          </Link>
        </div>

        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? link.activeClass
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <link.icon size={20} />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="p-3 pb-6 border-t border-gray-100 space-y-1 mb-14 safe-bottom">
          {adminAccess && (
            <Link
              href="/admin/dashboard"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-accent bg-accent/10 hover:bg-accent/20 w-full transition-colors"
            >
              <Shield size={20} />
              Admin Panel
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
          >
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </nav>
    </>
  );
}
