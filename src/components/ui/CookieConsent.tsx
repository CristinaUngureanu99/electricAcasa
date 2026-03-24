'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookie-consent');
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem('cookie-consent', 'true');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 animate-slide-up">
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 relative">
        <p className="text-sm text-gray-600 text-center sm:text-left pr-6 sm:pr-0">
          Folosim cookie-uri esentiale pentru functionarea site-ului.{' '}
          <Link href="/cookies" className="text-navy font-semibold hover:underline">
            Politica de cookies
          </Link>
          {' · '}
          <Link href="/privacy" className="text-navy font-semibold hover:underline">
            Confidentialitate
          </Link>
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAccept}
            className="shimmer-btn px-6 py-2.5 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5 whitespace-nowrap"
          >
            Acceptă
          </button>
          <button
            onClick={handleAccept}
            aria-label="Închide"
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-all rounded-full hover:bg-gray-200/60"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
