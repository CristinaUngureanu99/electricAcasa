'use client';

import { useEffect, useState } from 'react';
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
        const [usersRes, productsRes, ordersRes, requestsRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('total, status'),
          supabase.from('package_requests').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        ]);

        const orders = ordersRes.data || [];
        const revenue = orders
          .filter((o: { status: string; payment_status: string }) => o.payment_status === 'paid')
          .reduce((sum: number, o: { total: number }) => sum + (o.total || 0), 0);

        setStats({
          users: usersRes.count || 0,
          products: productsRes.count || 0,
          orders: orders.length,
          revenue,
          pendingRequests: requestsRes.count || 0,
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
        <h1 className="text-3xl font-bold text-white">Panou de control</h1>
        <p className="text-gray-500 mt-1">Prezentare generala</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100"><ShoppingBag size={20} className="text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.orders}</p>
              <p className="text-xs text-gray-500">Comenzi</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100"><Package size={20} className="text-emerald-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.products}</p>
              <p className="text-xs text-gray-500">Produse</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100"><Users size={20} className="text-amber-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
              <p className="text-xs text-gray-500">Utilizatori</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100"><FileText size={20} className="text-purple-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
              <p className="text-xs text-gray-500">Cereri noi</p>
            </div>
          </div>
        </Card>
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
