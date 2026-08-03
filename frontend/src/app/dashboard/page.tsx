'use client'

import { useEffect, useState } from 'react'
import * as api from '@/lib/api'
import { Ticket, AlertTriangle, Users } from 'lucide-react'

export default function DashboardOverview() {
  const [stats, setStats] = useState<any>(null); const [loading, setLoading] = useState(true); const [tickets, setTickets] = useState<any[]>([])
  useEffect(() => { Promise.all([api.getDashboardStats().catch(() => null), api.getTickets().catch(() => [])]).then(([s, t]) => { setStats(s); setTickets(t); setLoading(false) }) }, [])
  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-svk-border border-t-svk-accent rounded-full animate-spin" /></div>

  const cards = [
    { l: 'Total', v: stats?.total_tickets ?? tickets.length, icon: Ticket, c: 'text-svk-accent', b: 'bg-svk-accent-light' },
    { l: 'Open', v: tickets.filter((t: any) => t.status === 'Open').length, icon: Ticket, c: 'text-blue-600', b: 'bg-blue-50' },
    { l: 'High Urgency', v: tickets.filter((t: any) => t.urgency === 'High').length, icon: AlertTriangle, c: 'text-svk-coral', b: 'bg-svk-coral-light' },
    { l: 'Team', v: stats?.total_users ?? 1, icon: Users, c: 'text-svk-green', b: 'bg-svk-green-light' },
  ]

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Dashboard</h1>
      <p className="text-sm text-svk-text-muted mb-6">Overview of {tickets.length} tickets</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {cards.map(c => (
          <div key={c.l} className="bg-svk-bg-card border border-svk-border rounded-xl p-4 shadow-svk-sm">
            <div className={`w-9 h-9 rounded-lg ${c.b} flex items-center justify-center mb-2.5`}><c.icon size={16} className={c.c} /></div>
            <div className="text-xl font-bold">{c.v}</div>
            <div className="text-xs text-svk-text-muted">{c.l}</div>
          </div>
        ))}
      </div>
      <div className="bg-svk-bg-card border border-svk-border rounded-xl p-5 shadow-svk-sm">
        <h2 className="font-semibold text-sm mb-3">Recent tickets</h2>
        {tickets.length === 0 ? (
          <div className="text-center py-8 text-svk-text-muted text-sm">No tickets yet.</div>
        ) : (
          <div className="space-y-1.5">
            {tickets.slice(0, 5).map((t: any) => (
              <div key={t.ticket_id} className="flex items-center justify-between p-3 rounded-lg bg-svk-bg text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-svk-accent shrink-0">{t.ticket_id}</span>
                  <span className="truncate text-svk-text-secondary">{t.issue_description?.slice(0, 50)}</span>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${t.urgency === 'High' ? 'bg-svk-coral-light text-svk-coral' : t.urgency === 'Medium' ? 'bg-svk-amber-light text-svk-amber' : 'bg-svk-green-light text-svk-green'}`}>{t.urgency}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${t.status === 'Open' ? 'bg-svk-accent-light text-svk-accent' : t.status === 'Closed' ? 'bg-svk-green-light text-svk-green' : 'bg-svk-amber-light text-svk-amber'}`}>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
