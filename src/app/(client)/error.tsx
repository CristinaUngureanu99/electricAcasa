'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function ClientError({
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Eroare la incarcarea contului</h2>
        <p className="text-gray-500 mb-6">Nu am putut incarca datele contului tau. Verifica conexiunea si incearca din nou.</p>
        <Button onClick={reset}>Încearcă din nou</Button>
      </div>
    </div>
  );
}
