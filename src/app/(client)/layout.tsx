import { ClientNav } from '@/components/layout/ClientNav';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ToastProvider } from '@/components/ui/Toast';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-surface">
        <ClientNav />
        <main className="md:ml-64 pt-16 md:pt-0 min-h-screen">
          <div className="p-4 pb-24 md:p-8 md:pb-8 lg:p-10 lg:pb-10">
            {children}
          </div>
        </main>
        <MobileBottomNav />
      </div>
    </ToastProvider>
  );
}
