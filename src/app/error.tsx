'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function GlobalError({
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
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ceva nu a mers bine</h2>
        <p className="text-gray-500 mb-6">A apărut o eroare neașteptată. Încearcă din nou.</p>
        <Button onClick={reset}>Încearcă din nou</Button>
      </div>
    </div>
  );
}
