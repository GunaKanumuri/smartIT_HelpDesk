'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import * as api from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'

export default function SubmitPage() {
  const { slug } = useParams() as { slug: string }
  const [ws, setWs] = useState<any>(null); const [loading, setLoading] = useState(true); const [err, setErr] = useState<string | null>(null)
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false); const [status, setStatus] = useState<{ t: string; h: string } | null>(null)

  useEffect(() => { if (!slug) { setErr('No workspace.'); setLoading(false); return }; api.getWorkspaceInfo(slug).then(d => { setWs(d); setLoading(false) }).catch(() => { setErr('Not found.'); setLoading(false) }) }, [slug])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!name || !msg) return; setBusy(true); setStatus(null)
    try {
      const r = await api.submitTicket({ workspace: slug, name, email, message: msg })
      if (r.relevant === false) setStatus({ t: 'warning', h: r.message })
      else if (r.duplicate) setStatus({ t: 'warning', h: `This matches an existing request.` })
      else setStatus({ t: 'success', h: `✅ Logged as <strong>${r.category}</strong>.<br/><span class="font-mono text-sm font-semibold">${r.ticket_id}</span><br/><a href="/status/${slug}/${r.ticket_id}" class="text-svk-accent underline text-sm">Check status →</a>` })
      setName(''); setEmail(''); setMsg('')
    } catch (e: any) { setStatus({ t: 'error', h: e.message || 'Failed.' }) }
    setBusy(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-svk-border border-t-svk-accent rounded-full animate-spin" /></div>
  if (err) return <div className="min-h-screen flex items-center justify-center text-sm text-svk-text-muted">{err}</div>

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <span className="text-xs font-medium text-svk-accent bg-svk-accent-light px-2.5 py-1 rounded-full">{ws?.sector_name}</span>
          <h1 className="text-xl font-bold mt-2">{ws?.name}</h1>
          {ws?.business_description && <p className="text-sm text-svk-text-muted mt-1">{ws.business_description}</p>}
        </div>
        <div className="bg-svk-bg-card border border-svk-border rounded-xl shadow-svk-sm p-5">
          <h2 className="font-semibold text-sm mb-4">Submit a request</h2>
          <form onSubmit={submit}>
            <Input label="Name" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
            <Input label="Email" optional placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            <Textarea label="Message" placeholder="What's the issue?" value={msg} onChange={e => setMsg(e.target.value)} required />
            <Button type="submit" disabled={busy} className="w-full">{busy ? 'Submitting...' : 'Submit'}</Button>
          </form>
          {status && <div className={`mt-4 p-3 rounded-lg text-sm ${status.t === 'success' ? 'bg-svk-green-light text-svk-green' : status.t === 'warning' ? 'bg-svk-amber-light text-svk-amber' : 'bg-svk-coral-light text-svk-coral'}`} dangerouslySetInnerHTML={{ __html: status.h }} />}
        </div>
        <div className="text-center text-xs text-svk-text-muted mt-6">Powered by <a href="/" className="font-medium hover:text-svk-accent">SevakAI</a></div>
      </div>
    </div>
  )
}
