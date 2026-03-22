'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Inapoi sus"
      className="fixed bottom-6 right-6 z-40 p-3 bg-primary text-white rounded-full shadow-lg shadow-primary/25 hover:bg-primary-dark hover:shadow-xl transition-all"
    >
      <ArrowUp size={20} />
    </button>
  );
}
