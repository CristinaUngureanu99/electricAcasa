import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-server';
import { rateLimit } from '@/lib/rate-limit';
import { getStripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getServiceSupabase();
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!await rateLimit(`checkout-cancel:${user.id}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Prea multe incercari. Asteapta un minut.' }, { status: 429 });
    }

    const { orderId } = await request.json();
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

    // Fetch order and verify ownership
    const { data: order } = await supabase
      .from('orders')
      .select('id, status, user_id, stripe_session_id, payment_method')
      .eq('id', orderId)
      .single();

    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ error: 'Comanda negasita' }, { status: 404 });
    }

    // Idempotency: already not pending → no-op
    if (order.status !== 'pending') {
      return NextResponse.json({ success: true, alreadyCancelled: true });
    }

    if (order.payment_method !== 'card' || !order.stripe_session_id) {
      return NextResponse.json({ error: 'Doar comenzile card pot fi anulate' }, { status: 400 });
    }

    // Fail-closed: check Stripe session status first
    try {
      const session = await getStripe().checkout.sessions.retrieve(order.stripe_session_id);
      if (session.status === 'complete') {
        return NextResponse.json({ error: 'Plata a fost deja procesata' }, { status: 409 });
      }
    } catch {
      // Cannot retrieve session — fail-closed, abort
      return NextResponse.json({ error: 'Nu se poate verifica starea platii' }, { status: 500 });
    }

    // Expire session (fail-closed: if expire fails, abort)
    try {
      await getStripe().checkout.sessions.expire(order.stripe_session_id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      // "already expired" is ok
      if (!msg.includes('already expired') && !msg.includes('has already been expired')) {
        return NextResponse.json({ error: 'Nu se poate anula sesiunea de plata' }, { status: 500 });
      }
    }

    // Atomic cancel: set cancelled + restore stock in one DB transaction
    const { data: cancelled } = await supabase.rpc('cancel_order_and_restore_stock', {
      p_order_id: order.id,
    });

    if (!cancelled) {
      return NextResponse.json({ success: true, alreadyCancelled: true });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
