'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import * as api from '@/lib/api'
import Badge from '@/components/ui/Badge'

export default function TicketStatusPage() {
  const { slug, ticketId } = useParams() as { slug: string; ticketId: string }
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [lookup, setLookup] = useState('')

  useEffect(() => { if (ticketId) fetchStatus(ticketId) }, [ticketId])

  const fetchStatus = async (tid: string) => {
    setLoading(true); setErr(null)
    try { setTicket(await api.getTicketStatus(slug, tid)) } catch (e: any) { setErr(e.message || 'Not found.'); setTicket(null) }
    setLoading(false)
  }

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-sm mx-auto">
        <h1 className="text-xl font-bold text-center mb-6">Ticket status</h1>
        {loading && <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-svk-border border-t-svk-accent rounded-full animate-spin" /></div>}
        {err && (
          <div className="bg-svk-bg-card border border-svk-border rounded-xl p-6 text-center shadow-svk-sm">
            <p className="text-sm text-svk-text-muted mb-4">{err}</p>
            <div className="flex gap-2"><input value={lookup} onChange={e => setLookup(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchStatus(lookup)} placeholder="TCK1001" className="flex-1 bg-white border border-svk-border rounded-lg px-3 py-2 text-xs font-mono outline-none" /><button onClick={() => fetchStatus(lookup)} className="px-4 py-2 bg-svk-accent text-white rounded-lg text-sm font-medium hover:bg-svk-accent-dark">Check</button></div>
          </div>
        )}
        {ticket && (
          <div className="bg-svk-bg-card border border-svk-border rounded-xl shadow-svk-sm p-5">
            <div className="text-center font-mono text-lg font-semibold text-svk-accent mb-4">{ticket.ticket_id}</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-svk-bg rounded-lg p-3"><div className="text-[10px] uppercase tracking-wider text-svk-text-muted mb-1">Status</div><Badge variant={ticket.status === 'Open' ? 'accent' : ticket.status === 'Closed' ? 'success' : 'warning'}>{ticket.status}</Badge></div>
              <div className="bg-svk-bg rounded-lg p-3"><div className="text-[10px] uppercase tracking-wider text-svk-text-muted mb-1">Urgency</div><Badge variant={ticket.urgency === 'High' ? 'danger' : ticket.urgency === 'Medium' ? 'warning' : 'success'}>{ticket.urgency}</Badge></div>
              <div className="bg-svk-bg rounded-lg p-3"><div className="text-[10px] uppercase tracking-wider text-svk-text-muted mb-1">Category</div><div className="text-sm">{ticket.category}</div></div>
              <div className="bg-svk-bg rounded-lg p-3"><div className="text-[10px] uppercase tracking-wider text-svk-text-muted mb-1">Submitted</div><div className="text-sm">{ticket.created_at?.slice(0, 10)}</div></div>
            </div>
          </div>
        )}
        <div className="text-center text-xs text-svk-text-muted mt-6">Powered by <a href="/" className="font-medium hover:text-svk-accent">SevakAI</a></div>
      </div>
    </div>
  )
}
