import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';
import { site } from '@/config/site';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!await rateLimit(`contact:${ip}`, 3, 3600_000)) {
      return NextResponse.json({ error: 'Prea multe mesaje. Incearca din nou mai tarziu.' }, { status: 429 });
    }

    const body = await request.json();
    const { name, email, message, website, loadedAt } = body as {
      name?: string;
      email?: string;
      message?: string;
      website?: string;
      loadedAt?: number;
    };

    // Honeypot: if hidden field is filled, it's a bot
    if (website) {
      // Return success to not reveal the check
      return NextResponse.json({ success: true });
    }

    // Timestamp check: if submitted less than 2s after load, likely a bot
    if (loadedAt && Date.now() - loadedAt < 2000) {
      return NextResponse.json({ success: true });
    }

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Toate campurile sunt obligatorii' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: `Mesajul nu a putut fi trimis momentan. Te rugam sa ne contactezi direct la ${site.contact.email}` },
        { status: 503 }
      );
    }

    await sendEmail(
      site.contact.email,
      `Mesaj de contact de la ${name.trim()}`,
      `<h2>Mesaj nou de pe ${site.name}</h2>
       <p><strong>Nume:</strong> ${escapeHtml(name.trim())}</p>
       <p><strong>Email:</strong> ${escapeHtml(email.trim())}</p>
       <hr />
       <p>${escapeHtml(message.trim()).replace(/\n/g, '<br />')}</p>`
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Eroare la trimiterea mesajului' }, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
