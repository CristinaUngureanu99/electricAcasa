import { AdminNav } from '@/components/layout/AdminNav';
import { ToastProvider } from '@/components/ui/Toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-950">
        <AdminNav />
        <main className="md:ml-64 pt-16 md:pt-0 p-4 md:p-8">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
