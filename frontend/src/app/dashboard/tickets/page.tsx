'use client'

import { useEffect, useState } from 'react'
import * as api from '@/lib/api'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]); const [loading, setLoading] = useState(true)
  const [fStatus, setFStatus] = useState(''); const [fUrgency, setFUrgency] = useState('')
  const [selected, setSelected] = useState<any>(null); const [uStatus, setUStatus] = useState(''); const [uAction, setUAction] = useState(''); const [uBy, setUBy] = useState('')

  const load = () => { setLoading(true); api.getTickets().then(d => { setTickets(d); setLoading(false) }).catch(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const filtered = tickets
    .filter(t => !fStatus || t.status === fStatus).filter(t => !fUrgency || t.urgency === fUrgency)
    .sort((a, b) => { const o = ['High', 'Medium', 'Low']; const u = o.indexOf(a.urgency) - o.indexOf(b.urgency); return u !== 0 ? u : new Date(b.created_at).getTime() - new Date(a.created_at).getTime() })

  const update = async () => { if (!selected) return; await api.updateTicket(selected.ticket_id, { status: uStatus, action_taken: uAction, updated_by: uBy }); setSelected(null); load() }

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-svk-border border-t-svk-accent rounded-full animate-spin" /></div>

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Tickets</h1>
      <p className="text-sm text-svk-text-muted mb-4">{filtered.length} of {tickets.length}</p>
      {tickets.length === 0 ? <div className="text-center py-16 text-svk-text-muted text-sm bg-svk-bg-card border border-svk-border rounded-xl">No tickets yet.</div> : (
        <>
          <div className="flex gap-2 mb-4">
            <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="bg-svk-bg-card border border-svk-border rounded-lg px-3 py-1.5 text-xs text-svk-text outline-none">
              <option value="">All status</option><option value="Open">Open</option><option value="Pending">Pending</option><option value="Closed">Closed</option>
            </select>
            <select value={fUrgency} onChange={e => setFUrgency(e.target.value)} className="bg-svk-bg-card border border-svk-border rounded-lg px-3 py-1.5 text-xs text-svk-text outline-none">
              <option value="">All urgency</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
            </select>
          </div>
          <div className="bg-svk-bg-card border border-svk-border rounded-xl shadow-svk-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-svk-border text-svk-text-muted text-xs uppercase tracking-wider">
                <th className="text-left p-3 font-medium">ID</th><th className="text-left p-3 font-medium">Issue</th><th className="text-left p-3 font-medium">Category</th>
                <th className="text-left p-3 font-medium">Urgency</th><th className="text-left p-3 font-medium">Status</th><th className="text-right p-3 font-medium">Action</th>
              </tr></thead>
              <tbody>{filtered.slice(0, 50).map((t: any) => (
                <tr key={t.ticket_id} className="border-b border-svk-border/50 hover:bg-svk-bg-hover transition-colors">
                  <td className="p-3 font-mono text-xs text-svk-accent">{t.ticket_id}</td>
                  <td className="p-3 text-svk-text-secondary max-w-[200px] truncate">{t.issue_description}</td>
                  <td className="p-3">{t.category === 'Needs Review' ? <Badge variant="warning">Review</Badge> : <span className="text-xs">{t.category}</span>}</td>
                  <td className="p-3"><Badge variant={t.urgency === 'High' ? 'danger' : t.urgency === 'Medium' ? 'warning' : 'success'}>{t.urgency}</Badge></td>
                  <td className="p-3"><Badge variant={t.status === 'Open' ? 'accent' : t.status === 'Closed' ? 'success' : 'warning'}>{t.status}</Badge></td>
                  <td className="p-3 text-right"><button onClick={() => { setSelected(t); setUStatus(t.status); setUAction(t.action_taken || ''); setUBy(t.updated_by || '') }} className="text-svk-accent hover:underline text-xs">Edit</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Ticket ${selected?.ticket_id}`}>
        {selected && <div className="space-y-3">
          <div className="p-3 rounded-lg bg-svk-bg text-sm text-svk-text-secondary">{selected.issue_description}</div>
          <div><label className="text-xs text-svk-text-muted block mb-1">Status</label><select value={uStatus} onChange={e => setUStatus(e.target.value)} className="w-full bg-white border border-svk-border rounded-lg px-3 py-2 text-sm outline-none">{['Open', 'Pending', 'Closed', 'Resolved'].map(s => <option key={s}>{s}</option>)}</select></div>
          <div><label className="text-xs text-svk-text-muted block mb-1">Action taken</label><input value={uAction} onChange={e => setUAction(e.target.value)} className="w-full bg-white border border-svk-border rounded-lg px-3 py-2 text-sm outline-none" /></div>
          <div><label className="text-xs text-svk-text-muted block mb-1">Updated by</label><input value={uBy} onChange={e => setUBy(e.target.value)} className="w-full bg-white border border-svk-border rounded-lg px-3 py-2 text-sm outline-none" /></div>
          <div className="flex gap-2 pt-2"><Button onClick={update} className="flex-1">Save</Button><Button variant="ghost" onClick={() => setSelected(null)} className="flex-1">Cancel</Button></div>
        </div>}
      </Modal>
    </div>
  )
}
