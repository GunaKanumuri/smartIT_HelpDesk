'use client';

import { Menu, Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/Badge';

interface TopBarProps {
  toggleMobile: () => void;
}

export default function TopBar({ toggleMobile }: TopBarProps) {
  const pathname = usePathname();
  const { workspace } = useAuth();
  
  // Format breadcrumb based on pathname
  const getPageName = () => {
    if (!pathname) return 'Dashboard';
    if (pathname === '/dashboard') return 'Overview';
    if (pathname.includes('/tickets')) return 'Tickets';
    if (pathname.includes('/analytics')) return 'Analytics';
    if (pathname.includes('/team')) return 'Team';
    if (pathname.includes('/training')) return 'Training';
    if (pathname.includes('/settings')) return 'Settings';
    return 'Dashboard';
  };

  return (
    <header className="h-16 border-b border-white/10 bg-admin-surface/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleMobile}
          className="md:hidden text-slate-400 hover:text-white transition-colors"
        >
          <Menu size={24} />
        </button>
        
        <h1 className="text-lg font-semibold text-white tracking-tight">
          {getPageName()}
        </h1>
      </div>
      
      <div className="flex items-center gap-5">
        {workspace && (
          <Badge variant="secondary" className="hidden sm:inline-flex bg-svk-accent/10 text-svk-accent border-svk-accent/20">
            {workspace.name}
          </Badge>
        )}
        
        <button className="text-slate-400 hover:text-white transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-admin-surface"></span>
        </button>
        
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-svk-accent to-blue-500 flex items-center justify-center text-white font-medium shadow-md">
          {workspace?.name?.charAt(0).toUpperCase() || 'A'}
        </div>
      </div>
    </header>
  );
}
