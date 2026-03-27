import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { sendEmail } from '@/lib/email';
import { packageOfferEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const body = await request.json();
  const { requestId, items, offerNotes } = body as {
    requestId: string;
    items: { productId?: string; productName: string; quantity: number; unitPrice: number }[];
    offerNotes?: string;
  };

  if (!requestId || !items || items.length === 0) {
    return NextResponse.json({ error: 'Date incomplete' }, { status: 400 });
  }

  for (const item of items) {
    if (!item.productName || item.quantity < 1 || item.unitPrice < 0) {
      return NextResponse.json({ error: 'Produs invalid in oferta' }, { status: 400 });
    }
  }

  const { data: pkgRequest, error: reqError } = await supabase
    .from('package_requests')
    .select('id, user_id, name, email, offer_status')
    .eq('id', requestId)
    .single();

  if (reqError || !pkgRequest) {
    return NextResponse.json({ error: 'Cerere negasita' }, { status: 404 });
  }

  if (pkgRequest.offer_status === 'accepted') {
    return NextResponse.json({ error: 'Oferta a fost deja acceptata' }, { status: 400 });
  }

  const offerTotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  await supabase.from('package_offer_items').delete().eq('request_id', requestId);

  const offerItems = items.map((i) => ({
    request_id: requestId,
    product_id: i.productId || null,
    product_name: i.productName,
    quantity: i.quantity,
    unit_price: i.unitPrice,
  }));

  const { error: insertError } = await supabase.from('package_offer_items').insert(offerItems);
  if (insertError) {
    return NextResponse.json({ error: 'Eroare la salvarea ofertei' }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from('package_requests')
    .update({
      offer_total: offerTotal,
      offer_status: 'pending',
      offer_created_at: new Date().toISOString(),
      offer_notes: offerNotes?.trim() || null,
      status: 'answered',
    })
    .eq('id', requestId);

  if (updateError) {
    return NextResponse.json({ error: 'Eroare la actualizarea cererii' }, { status: 500 });
  }

  try {
    const { subject, html } = packageOfferEmail({
      clientName: pkgRequest.name,
      items: items.map((i) => ({
        name: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      total: offerTotal,
      offerNotes: offerNotes?.trim() || null,
    });
    await sendEmail(pkgRequest.email, subject, html);
  } catch {
    console.error('Failed to send offer email');
  }

  return NextResponse.json({ success: true, offerTotal });
}
