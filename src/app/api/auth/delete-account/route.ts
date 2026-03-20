import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-server';
import { rateLimit } from '@/lib/rate-limit';

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 3 attempts per hour
    if (!await rateLimit(`delete-account:${user.id}`, 3, 3600_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Delete profile (add more table deletions here as you add business tables)
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', user.id);
    if (profileError) {
      console.error('Failed to delete profile:', profileError);
      return NextResponse.json({ error: 'Account deletion failed' }, { status: 500 });
    }

    // Delete auth user (using admin API)
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
    if (authError) {
      console.error('Failed to delete auth user:', authError);
      return NextResponse.json({ error: 'Account deletion partially failed' }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error('Delete account error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
