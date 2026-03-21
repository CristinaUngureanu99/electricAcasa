'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface Props {
  orderId: string;
}

export function CancelOrderButton({ orderId }: Props) {
  const [cancelling, setCancelling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleCancel() {
    setCancelling(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast('Comanda a fost anulata', 'success');
        router.refresh();
      } else {
        toast(data.error || 'Eroare la anulare', 'error');
      }
    } catch {
      toast('Eroare neasteptata', 'error');
    } finally {
      setCancelling(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
        Anuleaza comanda
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-red-600">Esti sigur ca vrei sa anulezi comanda?</p>
      <Button variant="danger" size="sm" onClick={handleCancel} loading={cancelling}>
        Da, anuleaza
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Nu
      </Button>
    </div>
  );
}
