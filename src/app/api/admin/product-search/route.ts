import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
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

  const q = request.nextUrl.searchParams.get('q') || '';
  if (q.length < 2) {
    return NextResponse.json({ products: [] });
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, sale_price, stock')
    .eq('is_active', true)
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(10);

  return NextResponse.json({ products: products || [] });
}
