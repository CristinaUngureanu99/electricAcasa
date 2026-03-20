'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  User,
} from 'lucide-react';

const tabs = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, activeColor: 'text-gray-900' },
  { href: '/profile', label: 'Profile', icon: User, activeColor: 'text-gray-900' },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-bottom">
      <div className="flex items-center justify-around px-1 py-1.5">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-2.5 rounded-xl min-w-[56px] transition-colors',
                isActive
                  ? tab.activeColor
                  : 'text-gray-400 active:text-gray-600'
              )}
            >
              <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={cn(
                'text-[10px] leading-tight',
                isActive ? 'font-semibold' : 'font-medium'
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
