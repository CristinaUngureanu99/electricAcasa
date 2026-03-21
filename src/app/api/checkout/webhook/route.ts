import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-server';
import { sendEmail } from '@/lib/email';
import { site } from '@/config/site';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: Request) {
  let event: Stripe.Event;

  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.order_id;
  if (!orderId) {
    return NextResponse.json({ error: 'Missing order_id in metadata' }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  // Fetch order
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, payment_status, stripe_session_id, user_id, order_number, total')
    .eq('id', orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Cancelled order: no-op
  if (order.status === 'cancelled') {
    return NextResponse.json({ received: true });
  }

  // Already paid: no-op
  if (order.payment_status === 'paid') {
    return NextResponse.json({ received: true });
  }

  // Verify session matches current session_id (reject old sessions)
  if (order.stripe_session_id && order.stripe_session_id !== session.id) {
    return NextResponse.json({ received: true });
  }

  // Update order FIRST (mark as paid before side effects)
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'confirmed',
      stripe_session_id: session.id,
    })
    .eq('id', orderId);

  if (updateError) {
    // Return non-2xx so Stripe retries
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }

  // Email confirmation (best-effort)
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', order.user_id)
      .single();

    if (profile?.email) {
      await sendEmail(
        profile.email,
        `Comanda #EA-${order.order_number} confirmata`,
        `<h2>Multumim pentru comanda!</h2><p>Plata ta a fost procesata cu succes.</p><p>Comanda #EA-${order.order_number}</p><p>Total: ${order.total} RON</p><p>${site.team}</p>`
      );
    }
  } catch { /* best-effort */ }

  return NextResponse.json({ received: true });
}
