import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

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

  const { data: pkgRequest } = await supabase
    .from('package_requests')
    .select('id, user_id, offer_status')
    .eq('id', requestId)
    .single();

  if (!pkgRequest) {
    return NextResponse.json({ error: 'Cerere negasita' }, { status: 404 });
  }

  if (pkgRequest.user_id !== user.id) {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  if (pkgRequest.offer_status !== 'pending') {
    return NextResponse.json({ error: 'Oferta nu mai este disponibila' }, { status: 400 });
  }

  const { error } = await supabase
    .from('package_requests')
    .update({ offer_status: 'rejected' })
    .eq('id', requestId);

  if (error) {
    return NextResponse.json({ error: 'Eroare la refuzarea ofertei' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
