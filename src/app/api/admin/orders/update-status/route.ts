import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-server';
import { getStripe } from '@/lib/stripe';
import { sendEmail } from '@/lib/email';
import { site } from '@/config/site';
// OrderStatus type used in TRANSITIONS keys

// Transition matrix: current status → allowed next statuses
const TRANSITIONS: Record<string, string[]> = {
  pending: ['cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
};

const STATUS_EMAIL: Record<string, { subject: string; body: string }> = {
  confirmed: { subject: 'Comanda ta a fost confirmata', body: 'Comanda ta a fost confirmata si urmeaza sa fie pregatita pentru expediere.' },
  shipped: { subject: 'Comanda ta a fost expediata', body: 'Comanda ta a fost expediata! O vei primi in curand.' },
  delivered: { subject: 'Comanda ta a fost livrata', body: 'Comanda ta a fost livrata cu succes. Multumim ca ai cumparat de la electricAcasa!' },
  cancelled: { subject: 'Comanda ta a fost anulata', body: 'Comanda ta a fost anulata.' },
};

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getServiceSupabase();
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (adminProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { orderId, newStatus } = await request.json();
    if (!orderId || !newStatus) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    // Fetch order
    const { data: order } = await supabase
      .from('orders')
      .select('id, status, payment_status, payment_method, stripe_session_id, user_id, order_number, total')
      .eq('id', orderId)
      .single();

    if (!order) return NextResponse.json({ error: 'Comanda negasita' }, { status: 404 });

    // Validate transition
    const allowed = TRANSITIONS[order.status as string];
    if (!allowed || !allowed.includes(newStatus)) {
      return NextResponse.json({ error: `Tranzitie nepermisa: ${order.status} -> ${newStatus}` }, { status: 400 });
    }

    // Card unpaid: only cancellation allowed, with Stripe expire + stock restore
    if (order.status === 'pending' && order.payment_method === 'card' && order.payment_status === 'pending') {
      if (newStatus !== 'cancelled') {
        return NextResponse.json({ error: 'Comanda card neplatita poate fi doar anulata' }, { status: 400 });
      }

      // Expire Stripe session (fail-closed)
      if (order.stripe_session_id) {
        try {
          const stripe = getStripe();
          const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
          if (session.status === 'complete') {
            return NextResponse.json({ error: 'Plata a fost deja procesata' }, { status: 409 });
          }
          await stripe.checkout.sessions.expire(order.stripe_session_id);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '';
          if (!msg.includes('expired')) {
            return NextResponse.json({ error: 'Nu se poate invalida sesiunea Stripe' }, { status: 500 });
          }
        }
      }

      // Atomic cancel + restore stock (for pending orders)
      const { data: cancelled, error: rpcError } = await supabase.rpc('cancel_order_and_restore_stock', { p_order_id: order.id });
      if (rpcError) {
        return NextResponse.json({ error: 'Eroare la anularea comenzii' }, { status: 500 });
      }
      if (!cancelled) {
        return NextResponse.json({ error: 'Comanda a fost deja procesata' }, { status: 409 });
      }
    } else if (newStatus === 'cancelled' && order.status === 'confirmed') {
      // Atomic cancel + restore stock (for confirmed orders)
      const { data: cancelled, error: rpcError } = await supabase.rpc('cancel_confirmed_order', { p_order_id: order.id });
      if (rpcError) {
        return NextResponse.json({ error: 'Eroare la anularea comenzii' }, { status: 500 });
      }
      if (!cancelled) {
        return NextResponse.json({ error: 'Comanda a fost deja procesata' }, { status: 409 });
      }
    } else {
      // Normal transition (no side effects beyond status change)
      const { error: updateErr } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
      if (updateErr) return NextResponse.json({ error: 'Eroare la actualizare' }, { status: 500 });
    }

    // Send email (best-effort)
    const emailTemplate = STATUS_EMAIL[newStatus as string];
    if (emailTemplate) {
      try {
        const { data: profile } = await supabase.from('profiles').select('email').eq('id', order.user_id).single();
        if (profile?.email) {
          await sendEmail(
            profile.email,
            `${emailTemplate.subject} - EA-${order.order_number}`,
            `<h2>${emailTemplate.subject}</h2><p>${emailTemplate.body}</p><p>Comanda #EA-${order.order_number}</p><p>${site.team}</p>`
          );
        }
      } catch { /* best-effort */ }
    }

    return NextResponse.json({ success: true, newStatus });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
