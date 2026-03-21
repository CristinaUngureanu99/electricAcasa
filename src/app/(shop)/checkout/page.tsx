'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useCart } from '@/lib/cart';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';
import { CreditCard, Banknote, ShieldCheck } from 'lucide-react';

export default function CheckoutPage() {
  const { cartItems, subtotal, shippingCost, total, loading: cartLoading } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'ramburs'>('card');

  // Address fields
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/checkout');
        return;
      }
      setIsLoggedIn(true);

      // Check for pending card order
      const { data: pending } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .eq('payment_method', 'card')
        .limit(1);

      if (pending && pending.length > 0) {
        setPendingOrderId(pending[0].id);
      }
    }
    check();
  }, [router]);

  if (isLoggedIn === null || cartLoading) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">Se incarca...</div>;
  }

  // Pending card order UI
  if (pendingOrderId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <Card>
          <div className="text-center space-y-4">
            <ShieldCheck size={48} className="mx-auto text-accent" />
            <h1 className="text-xl font-bold text-gray-900">Ai o plata in asteptare</h1>
            <p className="text-sm text-gray-500">Ai deja o comanda card in curs de procesare. Alege ce vrei sa faci:</p>
            <div className="flex flex-col gap-3">
              <Button onClick={handleResume} loading={submitting}>Reia plata</Button>
              <Button variant="danger" onClick={handleCancelPending} loading={submitting}>Anuleaza comanda</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (cartItems.length === 0) {
    router.push('/cos');
    return null;
  }

  async function getAuthHeaders() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  async function handleResume() {
    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/checkout/resume', {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderId: pendingOrderId }),
      });
      const data = await res.json();
      if (res.ok && data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        toast(data.error || 'Eroare la reluarea platii', 'error');
        if (res.status === 409) {
          // Payment already processed, redirect to confirmation
          router.push(`/checkout/confirmare?order_id=${pendingOrderId}`);
        }
      }
    } catch {
      toast('Eroare neasteptata', 'error');
    }
    setSubmitting(false);
  }

  async function handleCancelPending() {
    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/checkout/cancel', {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderId: pendingOrderId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast('Comanda anulata', 'success');
        setPendingOrderId(null);
      } else {
        toast(data.error || 'Eroare la anulare', 'error');
      }
    } catch {
      toast('Eroare neasteptata', 'error');
    }
    setSubmitting(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !street.trim() || !city.trim() || !county.trim() || !postalCode.trim() || !phone.trim()) {
      toast('Completeaza toate campurile adresei', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          shippingAddress: { name: name.trim(), street: street.trim(), city: city.trim(), county: county.trim(), postal_code: postalCode.trim(), phone: phone.trim() },
          billingAddress: null,
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.pendingOrderId) {
          setPendingOrderId(data.pendingOrderId);
        } else {
          toast(data.error || 'Eroare la procesarea comenzii', 'error');
        }
        setSubmitting(false);
        return;
      }

      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else if (data.redirectUrl) {
        router.push(data.redirectUrl);
      }
    } catch {
      toast('Eroare neasteptata', 'error');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Address + Payment */}
          <div className="flex-1 space-y-6">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Adresa de livrare</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nume complet *" value={name} onChange={(e) => setName(e.target.value)} required />
                <Input label="Telefon *" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                <div className="col-span-full">
                  <Input label="Strada, numar, bloc, scara, apt *" value={street} onChange={(e) => setStreet(e.target.value)} required />
                </div>
                <Input label="Oras *" value={city} onChange={(e) => setCity(e.target.value)} required />
                <Input label="Judet *" value={county} onChange={(e) => setCounty(e.target.value)} required />
                <Input label="Cod postal *" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Metoda de plata</h2>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
                  <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="sr-only" />
                  <CreditCard size={20} className={paymentMethod === 'card' ? 'text-primary' : 'text-gray-400'} />
                  <div>
                    <p className="font-medium text-gray-900">Card bancar</p>
                    <p className="text-xs text-gray-500">Plata securizata prin Stripe</p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === 'ramburs' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
                  <input type="radio" name="payment" value="ramburs" checked={paymentMethod === 'ramburs'} onChange={() => setPaymentMethod('ramburs')} className="sr-only" />
                  <Banknote size={20} className={paymentMethod === 'ramburs' ? 'text-primary' : 'text-gray-400'} />
                  <div>
                    <p className="font-medium text-gray-900">Ramburs</p>
                    <p className="text-xs text-gray-500">Platesti la livrare</p>
                  </div>
                </label>
              </div>
            </Card>
          </div>

          {/* Right: Summary */}
          <div className="lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-20">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sumar comanda</h2>

              <div className="space-y-2 mb-4">
                {cartItems.map(({ productId, quantity, product }) => (
                  <div key={productId} className="flex justify-between text-sm">
                    <span className="text-gray-600 line-clamp-1 flex-1 mr-2">{product.name} x{quantity}</span>
                    <span className="font-medium shrink-0">{formatPrice((product.sale_price ?? product.price) * quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transport</span>
                  <span className="font-medium">{shippingCost === 0 ? <span className="text-success">Gratuit</span> : formatPrice(shippingCost)}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">{formatPrice(total)}</span>
                </div>
              </div>

              <Button type="submit" size="lg" loading={submitting} className="w-full mt-6">
                {paymentMethod === 'card' ? 'Plateste cu card' : 'Plaseaza comanda'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
