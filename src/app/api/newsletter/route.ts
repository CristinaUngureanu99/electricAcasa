import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-server';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!await rateLimit(`newsletter:${ip}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Prea multe incercari. Asteapta un minut.' }, { status: 429 });
    }

    const { email } = await request.json() as { email?: string };

    if (!email?.trim() || !email.includes('@')) {
      return NextResponse.json({ error: 'Adresa de email invalida' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    // ON CONFLICT DO NOTHING — don't reveal if email already exists (privacy)
    await supabase
      .from('newsletter_subscriptions')
      .upsert({ email: email.trim().toLowerCase() }, { onConflict: 'email', ignoreDuplicates: true });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Eroare la abonare' }, { status: 500 });
  }
}
