import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getServiceSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
  }

  const { requestId } = (await request.json()) as { requestId: string };
  if (!requestId) {
    return NextResponse.json({ error: 'requestId lipseste' }, { status: 400 });
  }

  const { data: pkgRequest, error: reqError } = await supabase
    .from('package_requests')
    .select('id, user_id, offer_status, offer_total')
    .eq('id', requestId)
    .single();

  if (reqError || !pkgRequest) {
    return NextResponse.json({ error: 'Cerere negasita' }, { status: 404 });
  }

  if (pkgRequest.user_id !== user.id) {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  if (pkgRequest.offer_status !== 'pending') {
    return NextResponse.json({ error: 'Oferta nu mai este disponibila' }, { status: 400 });
  }

  const { data: offerItems, error: itemsError } = await supabase
    .from('package_offer_items')
    .select('product_id, product_name, quantity, unit_price')
    .eq('request_id', requestId);

  if (itemsError || !offerItems || offerItems.length === 0) {
    return NextResponse.json({ error: 'Oferta nu contine produse' }, { status: 400 });
  }

  const catalogItems = offerItems.filter((i) => i.product_id);
  if (catalogItems.length > 0) {
    const productIds = catalogItems.map((i) => i.product_id!);
    const { data: products } = await supabase
      .from('products')
      .select('id, name, stock')
      .in('id', productIds);

    const stockMap = new Map((products || []).map((p) => [p.id, p]));
    const outOfStock: string[] = [];

    for (const item of catalogItems) {
      const product = stockMap.get(item.product_id!);
      if (!product || product.stock < item.quantity) {
        outOfStock.push(item.product_name);
      }
    }

    if (outOfStock.length > 0) {
      return NextResponse.json(
        {
          error: `Stoc insuficient pentru: ${outOfStock.join(', ')}. Contacteaza-ne pentru actualizarea ofertei.`,
        },
        { status: 400 },
      );
    }
  }

  // Use service role for order creation (no INSERT RLS policy on orders)
  const serviceSupabase = getServiceSupabase();

  const decremented: { productId: string; quantity: number }[] = [];
  for (const item of catalogItems) {
    const { data: ok } = await serviceSupabase.rpc('decrement_stock', {
      p_product_id: item.product_id!,
      p_quantity: item.quantity,
    });
    if (!ok) {
      for (const dec of decremented) {
        await serviceSupabase.rpc('increment_stock', {
          p_product_id: dec.productId,
          p_quantity: dec.quantity,
        });
      }
      return NextResponse.json(
        { error: 'Stoc insuficient. Te rugam sa ne contactezi.' },
        { status: 400 },
      );
    }
    decremented.push({ productId: item.product_id!, quantity: item.quantity });
  }

  const { data: order, error: orderError } = await serviceSupabase
    .from('orders')
    .insert({
      user_id: user.id,
      status: 'confirmed',
      subtotal: pkgRequest.offer_total,
      shipping_cost: 0,
      total: pkgRequest.offer_total,
      shipping_address: {},
      payment_method: 'ramburs',
      payment_status: 'pending',
      shipping_method: 'curier',
      package_request_id: requestId,
      notes: 'Comanda din oferta de pachet personalizat',
    })
    .select('id, order_number')
    .single();

  if (orderError || !order) {
    for (const dec of decremented) {
      await serviceSupabase.rpc('increment_stock', {
        p_product_id: dec.productId,
        p_quantity: dec.quantity,
      });
    }
    return NextResponse.json({ error: 'Eroare la crearea comenzii' }, { status: 500 });
  }

  const orderItems = offerItems.map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    product_name: i.product_name,
    quantity: i.quantity,
    unit_price: i.unit_price,
  }));

  const { error: orderItemsError } = await serviceSupabase.from('order_items').insert(orderItems);

  if (orderItemsError) {
    await serviceSupabase.from('orders').delete().eq('id', order.id);
    for (const dec of decremented) {
      await serviceSupabase.rpc('increment_stock', {
        p_product_id: dec.productId,
        p_quantity: dec.quantity,
      });
    }
    return NextResponse.json({ error: 'Eroare la salvarea produselor' }, { status: 500 });
  }

  await serviceSupabase
    .from('package_requests')
    .update({ offer_status: 'accepted' })
    .eq('id', requestId);

  return NextResponse.json({ success: true, orderId: order.id, orderNumber: order.order_number });
}
