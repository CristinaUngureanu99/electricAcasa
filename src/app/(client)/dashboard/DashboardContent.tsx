'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { site } from '@/config/site';
import { Sparkles, User, HelpCircle, Shield } from 'lucide-react';
import type { Profile } from '@/types/database';

interface Props {
  profile: Profile | null;
}

export default function DashboardContent({ profile }: Props) {
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="max-w-6xl mx-auto space-y-8 bg-slate-50 -m-4 md:-m-8 lg:-m-10 p-4 md:p-8 lg:p-10 min-h-screen">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {profile?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-gray-500 mt-1">Welcome to {site.name}</p>
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
        <Card>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-50">
              <Sparkles size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Get Started</h3>
              <p className="text-sm text-gray-500 mt-1">
                This is your dashboard. Customize it by adding your own business modules and widgets.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-50">
              <User size={24} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Your Profile</h3>
              <p className="text-sm text-gray-500 mt-1">
                Update your name, phone number, or change your password.
              </p>
              <Link href="/profile" className="text-sm text-accent hover:underline font-medium mt-2 inline-block">
                Edit profile
              </Link>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-50">
              <HelpCircle size={24} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Need Help?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Check the documentation or reach out to support if you have questions.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
