import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceSupabase } from '@/lib/supabase-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const newsletterSchema = z.object({
  email: z
    .string()
    .email('Adresa de email invalida')
    .transform((s) => s.trim().toLowerCase()),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    if (!(await rateLimit(`newsletter:${ip}`, 5, 60_000))) {
      return NextResponse.json(
        { error: 'Prea multe incercari. Asteapta un minut.' },
        { status: 429 },
      );
    }

    const parsed = newsletterSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Adresa de email invalida' }, { status: 400 });
    }
    const { email } = parsed.data;

    const supabase = getServiceSupabase();
    // ON CONFLICT DO NOTHING — don't reveal if email already exists (privacy)
    await supabase
      .from('newsletter_subscriptions')
      .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Eroare la abonare' }, { status: 500 });
  }
}
