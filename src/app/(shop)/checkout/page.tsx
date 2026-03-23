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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'ramburs'>('ramburs');

  // Address fields
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');

  // Validation errors (shown on blur)
  const [errors, setErrors] = useState<Record<string, string>>({});

  function getFieldError(field: string, value: string): string {
    const v = value.trim();
    switch (field) {
      case 'name': return v.length > 0 && v.length < 3 ? 'Minim 3 caractere' : '';
      case 'phone': return v.length > 0 && !/^(\+?40|0)[237]\d{8}$/.test(v.replace(/[\s\-().]/g, '')) ? 'Format invalid (ex: 07xx xxx xxx)' : '';
      case 'postalCode': return v.length > 0 && !/^\d{6}$/.test(v) ? 'Codul postal are 6 cifre' : '';
      case 'street': return v.length > 0 && v.length < 5 ? 'Minim 5 caractere' : '';
      case 'city': return v.length > 0 && v.length < 2 ? 'Minim 2 caractere' : '';
      case 'county': return v.length > 0 && v.length < 2 ? 'Minim 2 caractere' : '';
      default: return '';
    }
  }

  function validateField(field: string, value: string) {
    setErrors((prev) => ({ ...prev, [field]: getFieldError(field, value) }));
  }

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
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-3 text-gray-500">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Se pregateste checkout-ul...</span>
        </div>
      </div>
    );
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
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-sm text-gray-500">Cosul este gol, te redirectionam...</p>
      </div>
    );
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
    const fields: Record<string, string> = { name, street, city, county, postalCode, phone };
    // Validate all fields synchronously
    const freshErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(fields)) freshErrors[k] = getFieldError(k, v);
    setErrors(freshErrors);
    if (!name.trim() || !street.trim() || !city.trim() || !county.trim() || !postalCode.trim() || !phone.trim()) {
      toast('Completeaza toate campurile adresei', 'error');
      return;
    }
    if (Object.values(freshErrors).some((e) => e)) {
      toast('Corecteaza erorile din formular', 'error');
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
                <Input label="Nume complet *" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => validateField('name', name)} error={errors.name} required />
                <Input label="Telefon *" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => validateField('phone', phone)} error={errors.phone} required />
                <div className="col-span-full">
                  <Input label="Strada, numar, bloc, scara, apt *" value={street} onChange={(e) => setStreet(e.target.value)} onBlur={() => validateField('street', street)} error={errors.street} required />
                </div>
                <Input label="Oras *" value={city} onChange={(e) => setCity(e.target.value)} onBlur={() => validateField('city', city)} error={errors.city} required />
                <Input label="Judet *" value={county} onChange={(e) => setCounty(e.target.value)} onBlur={() => validateField('county', county)} error={errors.county} required />
                <Input label="Cod postal *" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} onBlur={() => validateField('postalCode', postalCode)} error={errors.postalCode} required />
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Metoda de plata</h2>
              <div className="space-y-3">
                <div
                  className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 opacity-50 cursor-not-allowed"
                  title="Plata cu card nu este configurata inca"
                >
                  <CreditCard size={20} className="text-gray-300" />
                  <div>
                    <p className="font-medium text-gray-400">Card bancar</p>
                    <p className="text-xs text-gray-400">Plata cu card nu este configurata inca</p>
                  </div>
                </div>
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'ramburs' ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10' : 'border-gray-200 hover:border-gray-300'}`}>
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
            <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:sticky lg:top-20">
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
