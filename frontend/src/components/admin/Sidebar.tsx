'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Ticket, 
  BarChart3, 
  Users, 
  Brain, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (o: boolean) => void;
}

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tickets', href: '/dashboard/tickets', icon: Ticket },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Training', href: '/dashboard/training', icon: Brain },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { workspace, logout } = useAuth();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-admin-sidebar border-r border-white/10">
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-svk-accent flex items-center justify-center shrink-0">
            <span className="font-bold text-white text-lg">S</span>
          </div>
          {!collapsed && (
            <span className="font-bold text-xl tracking-tight text-white whitespace-nowrap">
              SevaKAI
            </span>
          )}
        </div>
        {/* Mobile close button */}
        <button className="md:hidden p-1 rounded-md text-slate-400 hover:text-white" onClick={() => setMobileOpen(false)}>
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-3">
        {navItems.map((item) => {
          const isActive = pathname != null && (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                isActive 
                  ? "bg-svk-accent/10 text-svk-accent border-l-2 border-svk-accent" 
                  : "text-slate-400 hover:text-white hover:bg-white/5",
                collapsed && "justify-center px-0 border-l-0"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon size={20} className={cn("shrink-0", isActive ? "text-svk-accent" : "")} />
              {!collapsed && <span className="font-medium whitespace-nowrap">{item.name}</span>}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/10 shrink-0">
        {!collapsed && workspace && (
          <div className="mb-4 px-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Workspace</p>
            <p className="text-sm font-medium text-slate-300 truncate mt-1">{workspace.name}</p>
          </div>
        )}
        <div className={cn("flex items-center gap-2", collapsed ? "flex-col" : "justify-between")}>
          <button
            onClick={logout}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors",
              collapsed && "justify-center w-full"
            )}
            title="Logout"
          >
            <LogOut size={18} />
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden md:block transition-all duration-300 z-20 shrink-0 h-screen sticky top-0",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="w-[260px] h-full relative shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
