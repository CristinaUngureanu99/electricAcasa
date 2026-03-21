'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatPrice, formatDate } from '@/lib/utils';
import { ShoppingBag, MapPin, User, Shield } from 'lucide-react';
import type { Profile, Order, OrderStatus } from '@/types/database';

interface Props {
  profile: Profile | null;
  recentOrders: Pick<Order, 'id' | 'order_number' | 'status' | 'total' | 'created_at'>[];
  addressCount: number;
}

const statusLabels: Record<OrderStatus, string> = {
  pending: 'In asteptare',
  confirmed: 'Confirmata',
  shipped: 'Expediata',
  delivered: 'Livrata',
  cancelled: 'Anulata',
};

const statusVariants: Record<OrderStatus, 'warning' | 'info' | 'success' | 'danger' | 'neutral'> = {
  pending: 'warning',
  confirmed: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
};

export default function DashboardContent({ profile, recentOrders, addressCount }: Props) {
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="max-w-6xl mx-auto space-y-8 bg-slate-50 -m-4 md:-m-8 lg:-m-10 p-4 md:p-8 lg:p-10 min-h-screen">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bine ai venit, {profile?.full_name?.split(' ')[0] || 'utilizator'}!
          </h1>
          <p className="text-gray-500 mt-1">Contul tau electricAcasa</p>
        </div>
        {isAdmin && (
          <Link href="/admin/dashboard">
            <Button variant="primary" size="md" className="flex items-center gap-2">
              <Shield size={18} />
              Admin Panel
            </Button>
          </Link>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Comenzi recente */}
        <Card>
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-xl bg-blue-50">
              <ShoppingBag size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Comenzi recente</h3>
              <p className="text-sm text-gray-500">
                {recentOrders.length === 0 ? 'Nicio comanda inca' : `${recentOrders.length} comenzi recente`}
              </p>
            </div>
          </div>
          {recentOrders.length > 0 && (
            <div className="space-y-2 mb-3">
              {recentOrders.map((o) => (
                <Link key={o.id} href={`/comenzi/${o.id}`} className="flex items-center justify-between text-sm hover:bg-primary/[0.03] rounded-lg px-2 py-1.5 -mx-2 transition-all">
                  <div>
                    <span className="font-medium text-gray-900">EA-{o.order_number}</span>
                    <span className="text-gray-400 ml-2">{formatDate(o.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariants[o.status as OrderStatus]}>{statusLabels[o.status as OrderStatus]}</Badge>
                    <span className="font-medium text-gray-900">{formatPrice(o.total)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Link href="/comenzi" className="text-sm text-accent hover:underline font-medium">
            Vezi toate comenzile
          </Link>
        </Card>

        {/* Adrese */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-50">
              <MapPin size={24} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Adresele mele</h3>
              <p className="text-sm text-gray-500 mt-1">
                {addressCount === 0 ? 'Nicio adresa salvata' : `${addressCount} ${addressCount === 1 ? 'adresa salvata' : 'adrese salvate'}`}
              </p>
              <Link href="/adrese" className="text-sm text-accent hover:underline font-medium mt-2 inline-block">
                Gestioneaza adresele
              </Link>
            </div>
          </div>
        </Card>

        {/* Profil */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-50">
              <User size={24} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Profilul tau</h3>
              <p className="text-sm text-gray-500 mt-1">
                Actualizeaza numele, telefonul sau parola.
              </p>
              <Link href="/profile" className="text-sm text-accent hover:underline font-medium mt-2 inline-block">
                Editeaza profil
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
