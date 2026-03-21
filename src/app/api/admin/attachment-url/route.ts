import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getServiceSupabase();
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const url = new URL(request.url);
    const requestId = url.searchParams.get('requestId');
    if (!requestId) return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });

    // Fetch attachment_url from package_requests
    const { data: req } = await supabase
      .from('package_requests')
      .select('attachment_url')
      .eq('id', requestId)
      .single();

    if (!req || !req.attachment_url) {
      return NextResponse.json({ error: 'Atasament negasit' }, { status: 404 });
    }

    // Generate signed URL for the specific path
    const { data: signed, error: signError } = await supabase.storage
      .from('package-attachments')
      .createSignedUrl(req.attachment_url, 300); // 5 minutes

    if (signError || !signed) {
      return NextResponse.json({ error: 'Nu se poate genera URL-ul' }, { status: 500 });
    }

    return NextResponse.json({ url: signed.signedUrl });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
