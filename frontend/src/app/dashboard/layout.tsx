'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { LayoutDashboard, Ticket, BarChart3, Users, Settings, GraduationCap, LogOut } from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/tickets', label: 'Tickets', icon: Ticket },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/users', label: 'Team', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/train', label: 'Train', icon: GraduationCap },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter(); const pathname = usePathname(); const { workspace, token, loading, logout } = useAuth()
  useEffect(() => { if (!loading && !token) router.push('/login') }, [loading, token, router])
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-svk-border border-t-svk-accent rounded-full animate-spin" /></div>
  if (!token || !workspace) return null

  return (
    <div className="min-h-screen flex bg-svk-bg">
      <aside className="w-56 bg-svk-bg-card border-r border-svk-border shrink-0 hidden md:flex flex-col">
        <div className="p-4 border-b border-svk-border">
          <Link href="/dashboard" className="flex items-center gap-2.5 no-underline">
            <img src="/sevak-ai-logo.jpg" alt="" className="w-7 h-7 rounded-md object-cover" />
            <div><div className="font-semibold text-sm text-svk-text leading-tight">{workspace.name}</div><div className="text-[10px] text-svk-text-muted uppercase tracking-wider">{workspace.profile}</div></div>
          </Link>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {nav.map(item => {
            const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all no-underline ${active ? 'bg-svk-accent-light text-svk-accent font-medium' : 'text-svk-text-secondary hover:bg-svk-bg-hover hover:text-svk-text'}`}>
                <item.icon size={16} /> {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-2 border-t border-svk-border">
          <button onClick={async () => { await logout(); router.push('/') }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-svk-text-muted hover:bg-svk-bg-hover hover:text-svk-coral w-full transition-all">
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><div className="max-w-5xl mx-auto p-5 md:p-8">{children}</div></main>
    </div>
  )
}
