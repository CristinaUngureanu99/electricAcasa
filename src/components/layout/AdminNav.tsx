'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import { site } from '@/config/site';
import {
  LayoutDashboard,
  FolderTree,
  Package,
  LogOut,
  Menu,
  X,
  ArrowLeft,
} from 'lucide-react';
import { useState } from 'react';

const links = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/categorii', label: 'Categorii', icon: FolderTree },
  { href: '/admin/produse', label: 'Produse', icon: Package },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-primary-dark px-4 py-2 flex items-center justify-between">
        <Link href="/admin/dashboard" className="text-lg font-bold text-accent">
          Admin
        </Link>
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-white" aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMenuOpen(false)} />
      )}

      <nav
        className={cn(
          'fixed z-50 top-0 left-0 h-full w-64 bg-primary-dark flex flex-col transition-transform duration-200',
          'md:translate-x-0',
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4">
          <Link href="/admin/dashboard" onClick={() => setMenuOpen(false)}>
            <Image src="/logo.png" alt={site.logoAlt} width={160} height={64} className="h-12 w-auto brightness-0 invert" />
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-accent font-semibold tracking-wider uppercase">Admin Panel</span>
          </div>
        </div>

        <div className="flex-1 px-3 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent/20 text-accent'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                )}
              >
                <link.icon size={20} />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="p-3 pb-6 border-t border-white/10 space-y-1 mb-14 safe-bottom">
          <Link
            href="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/10 hover:text-white w-full transition-colors"
          >
            <ArrowLeft size={20} />
            User View
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/10 hover:text-white w-full transition-colors"
          >
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </nav>
    </>
  );
}
