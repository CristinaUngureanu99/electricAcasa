'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error?.message, 'Digest:', error?.digest);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Eroare la incarcarea paginii</h2>
      <p className="text-gray-500 mb-6">Nu am putut incarca produsele. Verifica conexiunea si incearca din nou.</p>
      <div className="flex gap-3 justify-center">
        <Button onClick={reset}>Incearca din nou</Button>
        <Link href="/" className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">
          Acasa
        </Link>
      </div>
    </div>
  );
}
