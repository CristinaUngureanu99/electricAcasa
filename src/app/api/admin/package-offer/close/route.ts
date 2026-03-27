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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
  }

  const { requestId } = (await request.json()) as { requestId: string };
  if (!requestId) {
    return NextResponse.json({ error: 'requestId lipseste' }, { status: 400 });
  }

  const { error } = await supabase
    .from('package_requests')
    .update({ offer_status: 'closed' })
    .eq('id', requestId)
    .in('offer_status', ['pending']);

  if (error) {
    return NextResponse.json({ error: 'Eroare la inchiderea ofertei' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
