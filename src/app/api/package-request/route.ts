import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { generateSlug } from '@/lib/utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

export async function POST(request: Request) {
  try {
    const supabase = getServiceSupabase();

    // Optional auth
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const rateLimitKey = userId ? `pkg-req:${userId}` : `pkg-req:${getClientIp(request)}`;
    if (!(await rateLimit(rateLimitKey, 3, 3600_000))) {
      return NextResponse.json(
        { error: 'Prea multe cereri. Incearca din nou mai tarziu.' },
        { status: 429 },
      );
    }

    const formData = await request.formData();
    const name = ((formData.get('name') as string) || '').trim();
    const email = ((formData.get('email') as string) || '').trim();
    const phone = ((formData.get('phone') as string) || '').trim();
    const description = ((formData.get('description') as string) || '').trim();
    const file = formData.get('file') as File | null;

    if (!name || !email || !description) {
      return NextResponse.json(
        { error: 'Nume, email si descriere sunt obligatorii' },
        { status: 400 },
      );
    }

    // File with no auth → 400
    if (file && !userId) {
      return NextResponse.json(
        { error: 'Autentificare necesara pentru atasament' },
        { status: 400 },
      );
    }

    // Validate file server-side
    if (file) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: 'Tip fisier nepermis. Acceptam imagini si PDF.' },
          { status: 400 },
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'Fisierul depaseste 10MB' }, { status: 400 });
      }
    }

    // Insert package request
    const { data: req, error: insertError } = await supabase
      .from('package_requests')
      .insert({
        user_id: userId,
        name,
        email,
        phone: phone || null,
        description,
        status: 'new',
      })
      .select('id')
      .single();

    if (insertError || !req) {
      return NextResponse.json({ error: 'Eroare la trimiterea cererii' }, { status: 500 });
    }

    let attachmentError = false;

    // Upload attachment if file + auth
    if (file && userId) {
      // Sanitize filename server-side
      const ext = file.name.split('.').pop() || 'bin';
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const sanitized = generateSlug(baseName) || 'fisier';
      const path = `${userId}/${req.id}/${sanitized}.${ext}`;

      const buffer = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('package-attachments')
        .upload(path, buffer, { contentType: file.type });

      if (uploadError) {
        attachmentError = true;
      } else {
        // Update attachment_url
        const { error: updateError } = await supabase
          .from('package_requests')
          .update({ attachment_url: path })
          .eq('id', req.id);

        if (updateError) {
          // Cleanup orphan file
          await supabase.storage.from('package-attachments').remove([path]);
          attachmentError = true;
        }
      }
    }

    return NextResponse.json({ success: true, requestId: req.id, attachmentError });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
