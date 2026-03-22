import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-server';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getServiceSupabase();
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!await rateLimit(`order-cancel:${user.id}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Prea multe incercari. Asteapta un minut.' }, { status: 429 });
    }

    const { orderId } = await request.json();
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

    const { data: order } = await supabase
      .from('orders')
      .select('id, status, user_id, payment_method, payment_status')
      .eq('id', orderId)
      .single();

    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ error: 'Comanda negasita' }, { status: 404 });
    }

    if (order.status === 'cancelled') {
      return NextResponse.json({ success: true, alreadyCancelled: true });
    }

    // Only pending or confirmed can be cancelled
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      return NextResponse.json({ error: 'Comanda nu poate fi anulata in statusul curent' }, { status: 400 });
    }

    // Block: pending + card must go through /api/checkout/cancel (Stripe session expiry)
    if (order.status === 'pending' && order.payment_method === 'card') {
      return NextResponse.json({ error: 'Foloseste optiunea de anulare din pagina de checkout pentru comenzi card' }, { status: 400 });
    }

    // Block: confirmed + card + paid needs admin refund, not self-cancel
    if (order.status === 'confirmed' && order.payment_method === 'card' && order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Comenzile platite cu card pot fi anulate doar de catre echipa noastra. Te rugam sa ne contactezi.' }, { status: 400 });
    }

    // Safe to cancel: pending ramburs or confirmed ramburs
    const rpcName = order.status === 'pending'
      ? 'cancel_order_and_restore_stock'
      : 'cancel_confirmed_order';

    const { data: cancelled } = await supabase.rpc(rpcName, {
      p_order_id: order.id,
    });

    if (!cancelled) {
      return NextResponse.json({ error: 'Nu s-a putut anula comanda' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
