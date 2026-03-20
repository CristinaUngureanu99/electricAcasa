'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { createClient } from '@/lib/supabase';
import { site } from '@/config/site';

export default function LandingNav() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    }
    check();

    function onScroll() {
      setScrolled(window.scrollY > 60);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-10 py-4">
        <div className={`rounded-2xl px-5 sm:px-6 py-3 flex items-center justify-between transition-all duration-300 ${
          scrolled
            ? 'bg-white shadow-lg shadow-black/5 border border-gray-100'
            : 'bg-black/20 border border-white/[0.08]'
        }`}>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="cursor-pointer">
            <Image
              src="/logo.png"
              alt={site.logoAlt}
              width={140}
              height={56}
              className={`h-8 sm:h-9 w-auto transition-all duration-300 ${
                scrolled ? '' : 'brightness-0 invert'
              }`}
            />
          </button>
          <div className="flex items-center gap-1.5 sm:gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className={`px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-full transition-all hover:-translate-y-0.5 whitespace-nowrap ${
                  scrolled
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-white text-gray-900 hover:bg-gray-100'
                }`}
              >
                My Account
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
                    scrolled ? 'text-gray-900 hover:text-gray-600' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-full transition-all hover:-translate-y-0.5 whitespace-nowrap ${
                    scrolled
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-white text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
