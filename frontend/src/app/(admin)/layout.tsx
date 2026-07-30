'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Sidebar from '@/components/admin/Sidebar';
import TopBar from '@/components/admin/TopBar';
import { ToastProvider } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !token) {
      router.push('/login');
    }
  }, [loading, token, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-admin-bg text-admin-text">
        <Skeleton className="w-16 h-16 rounded-full" />
      </div>
    );
  }

  if (!token) return null;

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-admin-bg text-admin-text font-sans selection:bg-svk-accent/30">
        <Sidebar
          collapsed={isSidebarCollapsed}
          setCollapsed={setIsSidebarCollapsed}
          mobileOpen={isMobileOpen}
          setMobileOpen={setIsMobileOpen}
        />
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          <TopBar 
            toggleMobile={() => setIsMobileOpen(true)} 
          />
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
