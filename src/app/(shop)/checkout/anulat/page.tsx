'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { XCircle, Loader2, AlertTriangle } from 'lucide-react';

export default function AnulatPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [status, setStatus] = useState<'loading' | 'cancelled' | 'error' | 'already'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function cancelOrder() {
      if (!orderId) {
        setStatus('error');
        setMessage('Comanda negasita');
        return;
      }
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus('error');
        setMessage('Trebuie sa fii autentificat');
        return;
      }

      const res = await fetch('/api/checkout/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus(data.alreadyCancelled ? 'already' : 'cancelled');
      } else if (res.status === 409) {
        setStatus('error');
        setMessage('Plata a fost deja procesata. Verifica pagina de confirmare.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Eroare la anularea comenzii');
      }
    }

    cancelOrder();
  }, [orderId]);

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <Card>
        <div className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 size={48} className="mx-auto text-gray-400 animate-spin" />
              <h1 className="text-xl font-bold text-gray-900">Se anuleaza comanda...</h1>
            </>
          )}

          {status === 'cancelled' && (
            <>
              <XCircle size={48} className="mx-auto text-gray-400" />
              <h1 className="text-xl font-bold text-gray-900">Comanda a fost anulata</h1>
              <p className="text-sm text-gray-500">Stocul a fost restaurat. Poti adauga din nou produsele in cos.</p>
            </>
          )}

          {status === 'already' && (
            <>
              <XCircle size={48} className="mx-auto text-gray-400" />
              <h1 className="text-xl font-bold text-gray-900">Comanda era deja anulata</h1>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertTriangle size={48} className="mx-auto text-amber-500" />
              <h1 className="text-xl font-bold text-gray-900">Nu s-a putut anula comanda</h1>
              <p className="text-sm text-gray-500">{message}</p>
            </>
          )}

          {status !== 'loading' && (
            <div className="pt-2">
              <Link href="/">
                <Button variant="secondary">Inapoi la magazin</Button>
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
