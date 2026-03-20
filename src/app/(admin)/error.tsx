'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function AdminError({
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
    <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Eroare</h2>
        <p className="text-gray-500 mb-6">A aparut o eroare. Incearca din nou.</p>
        <Button onClick={reset}>Incearca din nou</Button>
      </div>
    </div>
  );
}
