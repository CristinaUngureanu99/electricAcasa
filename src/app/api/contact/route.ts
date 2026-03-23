import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';
import { contactFormEmail } from '@/lib/email-templates';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { site } from '@/config/site';

const contactSchema = z.object({
  name: z
    .string()
    .min(1, 'Numele este obligatoriu')
    .transform((s) => s.trim()),
  email: z
    .string()
    .email('Adresa de email invalida')
    .transform((s) => s.trim()),
  message: z
    .string()
    .min(1, 'Mesajul este obligatoriu')
    .transform((s) => s.trim()),
  website: z.string().optional(),
  loadedAt: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    if (!(await rateLimit(`contact:${ip}`, 3, 3600_000))) {
      return NextResponse.json(
        { error: 'Prea multe mesaje. Incearca din nou mai tarziu.' },
        { status: 429 },
      );
    }

    const parsed = contactSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { name, email, message, website, loadedAt } = parsed.data;

    // Honeypot: if hidden field is filled, it's a bot
    if (website) {
      return NextResponse.json({ success: true });
    }

    // Timestamp check: if submitted less than 2s after load, likely a bot
    if (loadedAt && Date.now() - loadedAt < 2000) {
      return NextResponse.json({ success: true });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          error: `Mesajul nu a putut fi trimis momentan. Te rugam sa ne contactezi direct la ${site.contact.email}`,
        },
        { status: 503 },
      );
    }

    const emailData = contactFormEmail(name.trim(), email.trim(), message.trim());
    await sendEmail(site.contact.email, emailData.subject, emailData.html);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Eroare la trimiterea mesajului' }, { status: 500 });
  }
}
