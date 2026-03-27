'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PillItem {
  href: string;
  label: string;
}

interface Props {
  items: PillItem[];
}

export function ScrollablePills({ items }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  function scroll(direction: 'left' | 'right') {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  }

  return (
    <div className="relative group">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white/90 border border-gray-200 rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all"
          aria-label="Scroll left"
        >
          <ChevronLeft size={18} className="text-gray-600" />
        </button>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 px-4 scrollbar-hide scroll-smooth"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-sm font-medium text-gray-700 rounded-xl border border-gray-200 hover:border-primary hover:text-primary transition-colors shrink-0"
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Right arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-white/90 border border-gray-200 rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all"
          aria-label="Scroll right"
        >
          <ChevronRight size={18} className="text-gray-600" />
        </button>
      )}

      {/* Fade hints */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-2 w-10 bg-gradient-to-r from-[var(--color-bg-page,#f8fafc)] to-transparent pointer-events-none" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-[var(--color-bg-page,#f8fafc)] to-transparent pointer-events-none" />
      )}
    </div>
  );
}
