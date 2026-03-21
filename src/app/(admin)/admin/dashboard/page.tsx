'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Users, Package, ShoppingBag, FileText } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { formatPrice } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0, revenue: 0, pendingRequests: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: dbStats } = await supabase.rpc('get_dashboard_stats');
        const s = dbStats as { users_count: number; products_count: number; orders_count: number; revenue: number; pending_requests: number } | null;

        setStats({
          users: s?.users_count || 0,
          products: s?.products_count || 0,
          orders: s?.orders_count || 0,
          revenue: s?.revenue || 0,
          pendingRequests: s?.pending_requests || 0,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Eroare necunoscuta';
        setError(message);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panou de control</h1>
        <p className="text-gray-500 mt-1">Prezentare generala</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/comenzi" className="block">
          <Card className="hover:ring-2 hover:ring-blue-300 cursor-pointer transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100"><ShoppingBag size={20} className="text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.orders}</p>
                <p className="text-xs text-gray-500">Comenzi</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/produse" className="block">
          <Card className="hover:ring-2 hover:ring-emerald-300 cursor-pointer transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100"><Package size={20} className="text-emerald-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.products}</p>
                <p className="text-xs text-gray-500">Produse</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/utilizatori" className="block">
          <Card className="hover:ring-2 hover:ring-amber-300 cursor-pointer transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100"><Users size={20} className="text-amber-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
                <p className="text-xs text-gray-500">Utilizatori</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/cereri-pachet" className="block">
          <Card className="hover:ring-2 hover:ring-purple-300 cursor-pointer transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100"><FileText size={20} className="text-purple-600" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
                <p className="text-xs text-gray-500">Cereri noi</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Venituri incasate (comenzi platite)</p>
          <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.revenue)}</p>
        </div>
      </Card>
    </div>
  );
}
