'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Users, BarChart3, Settings } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/Skeleton';

export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { count, error: err } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true });

        if (err) {
          console.error('Admin dashboard: users query error', err);
          setError(err.message);
        } else {
          setTotalUsers(count || 0);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
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
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview and statistics</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
              <p className="text-xs text-gray-500">Total Users</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100">
              <BarChart3 size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">--</p>
              <p className="text-xs text-gray-500">Placeholder Stat</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100">
              <Settings size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">--</p>
              <p className="text-xs text-gray-500">Placeholder Stat</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <p className="text-sm text-gray-500">
          Add your business-specific admin widgets and data here. This is a skeleton dashboard ready to be customized.
        </p>
      </Card>
    </div>
  );
}
