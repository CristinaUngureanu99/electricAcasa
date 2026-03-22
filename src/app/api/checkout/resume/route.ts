import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-server';
import { rateLimit } from '@/lib/rate-limit';
import { site } from '@/config/site';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getServiceSupabase();
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!await rateLimit(`checkout-resume:${user.id}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Prea multe incercari. Asteapta un minut.' }, { status: 429 });
    }

    const { orderId } = await request.json();
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

    // Fetch order + items
    const { data: order } = await supabase
      .from('orders')
      .select('id, status, user_id, stripe_session_id, payment_method')
      .eq('id', orderId)
      .single();

    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ error: 'Comanda negasita' }, { status: 404 });
    }

    if (order.status !== 'pending' || order.payment_method !== 'card') {
      return NextResponse.json({ error: 'Comanda nu poate fi reluata' }, { status: 400 });
    }

    // Expire old session first (fail-closed)
    if (order.stripe_session_id) {
      try {
        const oldSession = await getStripe().checkout.sessions.retrieve(order.stripe_session_id);
        if (oldSession.status === 'complete') {
          return NextResponse.json({ error: 'Plata e deja in procesare' }, { status: 409 });
        }
        await getStripe().checkout.sessions.expire(order.stripe_session_id);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        if (!msg.includes('already expired') && !msg.includes('has already been expired')) {
          return NextResponse.json({ error: 'Nu se poate invalida sesiunea veche' }, { status: 500 });
        }
      }
    }

    // Fetch order items for new session
    const { data: items } = await supabase
      .from('order_items')
      .select('product_name, quantity, unit_price')
      .eq('order_id', order.id);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Comanda nu are produse' }, { status: 400 });
    }

    // Calc shipping from order
    const { data: orderFull } = await supabase
      .from('orders')
      .select('shipping_cost')
      .eq('id', order.id)
      .single();

    const shippingCost = orderFull?.shipping_cost || 0;

    // Create new Stripe session
    let session: Stripe.Checkout.Session;
    try {
      session = await getStripe().checkout.sessions.create({
        mode: 'payment',
        line_items: items.map((i: { product_name: string; quantity: number; unit_price: number }) => ({
          price_data: {
            currency: 'ron',
            product_data: { name: i.product_name },
            unit_amount: Math.round(i.unit_price * 100),
          },
          quantity: i.quantity,
        })),
        ...(shippingCost > 0 ? {
          shipping_options: [{
            shipping_rate_data: {
              type: 'fixed_amount' as const,
              fixed_amount: { amount: Math.round(shippingCost * 100), currency: 'ron' },
              display_name: 'Transport standard',
            },
          }],
        } : {}),
        metadata: { order_id: order.id },
        success_url: `${site.url}/checkout/confirmare?order_id=${order.id}`,
        cancel_url: `${site.url}/checkout/anulat?order_id=${order.id}`,
      });
    } catch {
      return NextResponse.json({ error: 'Eroare la crearea sesiunii de plata' }, { status: 500 });
    }

    // Persist new session_id (same lifecycle rule)
    const { error: updateError } = await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    if (updateError) {
      // Expire the session we just created
      try {
        await getStripe().checkout.sessions.expire(session.id);
      } catch {
        // Cannot expire: order stays pending with old/no session (recoverable)
      }
      return NextResponse.json({ error: 'Eroare la salvarea sesiunii' }, { status: 500 });
    }

    return NextResponse.json({ sessionUrl: session.url });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
