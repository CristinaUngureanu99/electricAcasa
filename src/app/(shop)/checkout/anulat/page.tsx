'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { XCircle, Loader2, AlertTriangle } from 'lucide-react';

export default function AnulatPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [status, setStatus] = useState<'confirm' | 'loading' | 'cancelled' | 'error' | 'already'>(
    'confirm',
  );
  const [message, setMessage] = useState('');

  async function handleCancel() {
    if (!orderId) {
      setStatus('error');
      setMessage('Comanda negasita');
      return;
    }
    setStatus('loading');
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setStatus('error');
      setMessage('Trebuie sa fii autentificat');
      return;
    }

    try {
      const res = await fetch('/api/checkout/cancel', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
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
    } catch {
      setStatus('error');
      setMessage('Eroare de retea. Incearca din nou.');
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <Card>
        <div className="text-center space-y-4">
          {status === 'confirm' && (
            <>
              <AlertTriangle size={48} className="mx-auto text-warning" />
              <h1 className="text-xl font-bold text-gray-900">Vrei sa anulezi comanda?</h1>
              <p className="text-sm text-gray-500">
                Produsele vor fi scoase din comanda si stocul va fi restaurat.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button variant="danger" onClick={handleCancel}>
                  Da, anuleaza comanda
                </Button>
                <Link href={orderId ? `/checkout/confirmare?order_id=${orderId}` : '/'}>
                  <Button variant="secondary">Nu, pastreaza comanda</Button>
                </Link>
              </div>
            </>
          )}

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
              <p className="text-sm text-gray-500">
                Stocul a fost restaurat. Poti adauga din nou produsele in cos.
              </p>
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

          {(status === 'cancelled' || status === 'already' || status === 'error') && (
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
