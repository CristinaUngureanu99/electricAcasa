import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-server';
import { sendEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';
import { site } from '@/config/site';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import type { Product } from '@/types/database';

interface CheckoutBody {
  shippingAddress: { name: string; street: string; city: string; county: string; postal_code: string; phone: string };
  billingAddress: { name: string; street: string; city: string; county: string; postal_code: string; phone: string } | null;
  paymentMethod: 'card' | 'ramburs';
  notes?: string;
}

async function verifyUser(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const supabase = getServiceSupabase();
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

export async function POST(request: Request) {
  try {
    const user = await verifyUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!await rateLimit(`checkout:${user.id}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Prea multe incercari. Asteapta un minut.' }, { status: 429 });
    }

    const supabase = getServiceSupabase();
    const body: CheckoutBody = await request.json();

    if (!body.shippingAddress || !body.paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Guard: check for existing pending card order
    if (body.paymentMethod === 'card') {
      const { data: pending } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .eq('payment_method', 'card')
        .limit(1);
      if (pending && pending.length > 0) {
        return NextResponse.json({ error: 'Ai deja o comanda card in asteptare', pendingOrderId: pending[0].id }, { status: 409 });
      }
    }

    // Fetch cart items + products
    const { data: cartRows } = await supabase
      .from('cart_items')
      .select('product_id, quantity')
      .eq('user_id', user.id);

    if (!cartRows || cartRows.length === 0) {
      return NextResponse.json({ error: 'Cosul e gol' }, { status: 400 });
    }

    const productIds = cartRows.map((r: { product_id: string }) => r.product_id);
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('is_active', true);

    const productMap = new Map((products as Product[] || []).map((p) => [p.id, p]));

    // Validate all products exist and build line items
    const lineItems: { productId: string; productName: string; quantity: number; unitPrice: number }[] = [];
    for (const row of cartRows) {
      const prod = productMap.get(row.product_id);
      if (!prod) {
        return NextResponse.json({ error: `Produsul nu mai e disponibil` }, { status: 400 });
      }
      lineItems.push({
        productId: prod.id,
        productName: prod.name,
        quantity: row.quantity,
        unitPrice: prod.sale_price ?? prod.price,
      });
    }

    // Decrement stock atomically
    const decremented: { productId: string; quantity: number }[] = [];
    for (const item of lineItems) {
      const { data: ok } = await supabase.rpc('decrement_stock', {
        p_product_id: item.productId,
        p_quantity: item.quantity,
      });
      if (!ok) {
        // Rollback already decremented
        for (const dec of decremented) {
          await supabase.rpc('increment_stock', { p_product_id: dec.productId, p_quantity: dec.quantity });
        }
        return NextResponse.json({ error: `Stoc insuficient pentru ${item.productName}` }, { status: 400 });
      }
      decremented.push({ productId: item.productId, quantity: item.quantity });
    }

    // Calculate totals
    const subtotal = lineItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const shippingCost = subtotal >= site.shipping.freeThreshold ? 0 : site.shipping.fixedCost;
    const total = subtotal + shippingCost;

    // Insert order
    const isRamburs = body.paymentMethod === 'ramburs';
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        status: isRamburs ? 'confirmed' : 'pending',
        subtotal,
        shipping_cost: shippingCost,
        total,
        shipping_address: body.shippingAddress,
        billing_address: body.billingAddress,
        payment_method: body.paymentMethod,
        payment_status: 'pending',
        notes: body.notes || null,
      })
      .select('id, order_number')
      .single();

    if (orderError || !order) {
      // Rollback stock
      for (const dec of decremented) {
        await supabase.rpc('increment_stock', { p_product_id: dec.productId, p_quantity: dec.quantity });
      }
      return NextResponse.json({ error: 'Eroare la crearea comenzii' }, { status: 500 });
    }

    // Insert order items
    const orderItems = lineItems.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      product_name: i.productName,
      quantity: i.quantity,
      unit_price: i.unitPrice,
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

    if (itemsError) {
      // Rollback: delete order + restore stock
      await supabase.from('orders').delete().eq('id', order.id);
      for (const dec of decremented) {
        await supabase.rpc('increment_stock', { p_product_id: dec.productId, p_quantity: dec.quantity });
      }
      return NextResponse.json({ error: 'Eroare la salvarea produselor comenzii' }, { status: 500 });
    }

    // Card: create Stripe session
    if (!isRamburs) {
      let session: Stripe.Checkout.Session;
      try {
        session = await getStripe().checkout.sessions.create({
          mode: 'payment',
          line_items: lineItems.map((i) => ({
            price_data: {
              currency: 'ron',
              product_data: { name: i.productName },
              unit_amount: Math.round(i.unitPrice * 100),
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
        // Stripe fail: delete order + rollback stock
        await supabase.from('order_items').delete().eq('order_id', order.id);
        await supabase.from('orders').delete().eq('id', order.id);
        for (const dec of decremented) {
          await supabase.rpc('increment_stock', { p_product_id: dec.productId, p_quantity: dec.quantity });
        }
        return NextResponse.json({ error: 'Eroare la initializarea platii' }, { status: 500 });
      }

      // Persist stripe_session_id
      const { error: updateError } = await supabase
        .from('orders')
        .update({ stripe_session_id: session.id })
        .eq('id', order.id);

      if (updateError) {
        // Expire the session we just created
        try {
          await getStripe().checkout.sessions.expire(session.id);
          // Expire succeeded: safe to rollback
          await supabase.rpc('cancel_order_and_restore_stock', { p_order_id: order.id });
        } catch {
          // Expire failed: order stays pending (recoverable via resume/cancel)
        }
        return NextResponse.json({ error: 'Eroare la salvarea sesiunii de plata' }, { status: 500 });
      }

      // Atomic cart cleanup
      const cartCleanupItems = lineItems.map((i) => ({ product_id: i.productId, quantity: i.quantity }));
      const { error: cleanupError } = await supabase.rpc('subtract_cart_items', {
        p_user_id: user.id,
        p_items: cartCleanupItems,
      });

      if (cleanupError) {
        // Cart cleanup failed: try to expire session and cancel
        try {
          await getStripe().checkout.sessions.expire(session.id);
          await supabase.rpc('cancel_order_and_restore_stock', { p_order_id: order.id });
        } catch {
          // Cannot expire: order stays pending (recoverable)
        }
        return NextResponse.json({ error: 'Eroare la procesarea cosului' }, { status: 500 });
      }

      return NextResponse.json({ sessionUrl: session.url });
    }

    // Ramburs: cart cleanup first (fatal if fails)
    const cartCleanupItems = lineItems.map((i) => ({ product_id: i.productId, quantity: i.quantity }));
    const { error: cleanupError } = await supabase.rpc('subtract_cart_items', {
      p_user_id: user.id,
      p_items: cartCleanupItems,
    });

    if (cleanupError) {
      // Ramburs rollback: order is 'confirmed' so cancel_order_and_restore_stock won't work
      // Manual rollback: delete items, delete order, restore stock
      await supabase.from('order_items').delete().eq('order_id', order.id);
      await supabase.from('orders').delete().eq('id', order.id);
      for (const dec of decremented) {
        await supabase.rpc('increment_stock', { p_product_id: dec.productId, p_quantity: dec.quantity });
      }
      return NextResponse.json({ error: 'Eroare la procesarea cosului' }, { status: 500 });
    }

    // Send email (best-effort)
    try {
      await sendEmail(
        user.email!,
        `Comanda #EA-${order.order_number} confirmata`,
        `<h2>Multumim pentru comanda!</h2><p>Comanda ta #EA-${order.order_number} a fost confirmata.</p><p>Total: ${total.toFixed(2)} RON</p><p>Metoda plata: Ramburs</p><p>${site.team}</p>`
      );
    } catch { /* best-effort */ }

    return NextResponse.json({ redirectUrl: `/checkout/confirmare?order_id=${order.id}` });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
