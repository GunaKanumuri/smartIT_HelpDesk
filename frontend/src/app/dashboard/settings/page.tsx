'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import * as api from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'

export default function SettingsPage() {
  const { workspace } = useAuth()
  const [email, setEmail] = useState(workspace?.escalation_email || '')
  const [saved, setSaved] = useState(false)
  const [escs, setEscs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.getEscalations().then(d => { setEscs(d); setLoading(false) }).catch(() => setLoading(false)) }, [])

  const save = async () => { await api.setEscalationEmail(email || null); setSaved(true); setTimeout(() => setSaved(false), 2000) }
  const slug = workspace?.slug || 'your-workspace'

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Settings</h1>
      <p className="text-sm text-svk-text-muted mb-6">Integration and escalation</p>

      <div className="bg-svk-bg-card border border-svk-border rounded-xl p-5 shadow-svk-sm mb-4">
        <h2 className="font-semibold text-sm mb-4">🔗 Integration</h2>
        <div className="space-y-4 text-sm">
          <div><div className="text-xs text-svk-text-muted mb-1">Direct link</div><div className="bg-svk-bg p-2.5 rounded-lg border border-svk-border font-mono text-xs text-svk-text-secondary break-all">/submit/{slug}</div></div>
          <div><div className="text-xs text-svk-text-muted mb-1">Embed widget</div><div className="bg-svk-bg p-2.5 rounded-lg border border-svk-border font-mono text-xs text-svk-text-secondary break-all">{`<script src="/embed.js" data-workspace="${slug}"></script>`}</div></div>
          <div><div className="text-xs text-svk-text-muted mb-1">API</div><div className="bg-svk-bg p-2.5 rounded-lg border border-svk-border font-mono text-xs text-svk-text-secondary">{`POST /api/submit { "workspace": "${slug}", "name": "...", "message": "..." }`}</div></div>
        </div>
      </div>

      <div className="bg-svk-bg-card border border-svk-border rounded-xl p-5 shadow-svk-sm mb-4">
        <h2 className="font-semibold text-sm mb-1">🔔 Escalation email</h2>
        <p className="text-xs text-svk-text-muted mb-3">High-urgency tickets alert this address.</p>
        <div className="flex gap-2 items-end"><div className="flex-1"><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="manager@example.com" /></div><Button onClick={save} size="sm" className="mb-3">{saved ? '✓ Saved' : 'Save'}</Button></div>
      </div>

      <div className="bg-svk-bg-card border border-svk-border rounded-xl p-5 shadow-svk-sm">
        <h2 className="font-semibold text-sm mb-1">📋 Escalation history</h2>
        {loading ? <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-svk-border border-t-svk-accent rounded-full animate-spin" /></div> : escs.length === 0 ? <p className="text-xs text-svk-text-muted py-4 text-center">None yet.</p> : (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-svk-border text-svk-text-muted uppercase tracking-wider"><th className="text-left p-2 font-medium">Date</th><th className="text-left p-2 font-medium">Ticket</th><th className="text-left p-2 font-medium">Reason</th><th className="text-left p-2 font-medium">Status</th></tr></thead>
              <tbody>{escs.map((e: any, i: number) => (
                <tr key={i} className="border-b border-svk-border/50"><td className="p-2 text-svk-text-muted">{e.created_at?.slice(0, 10)}</td><td className="p-2 font-mono text-svk-accent">{e.ticket_id}</td><td className="p-2 text-svk-text-secondary">{e.reason}</td><td className="p-2"><Badge variant={e.status === 'sent' ? 'success' : e.status === 'failed' ? 'danger' : 'warning'}>{e.status}</Badge></td></tr>))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
