'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AuthError({
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
        <p className="text-gray-500 mb-6">A apărut o eroare. Încearcă din nou.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="px-6 py-2.5 bg-navy text-white font-semibold rounded-full">
            Încearcă din nou
          </button>
          <Link href="/login" className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-full">
            Conectare
          </Link>
        </div>
      </div>
    </div>
  );
}
