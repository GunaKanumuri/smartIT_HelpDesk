'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export default function ResetPasswordPage() {
  const { token } = useParams(); const router = useRouter()
  const [pw, setPw] = useState(''); const [confirm, setConfirm] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null); const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw !== confirm) { setError('Passwords do not match.'); return }
    if (pw.length < 8) { setError('At least 8 characters.'); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password: pw }) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Failed') }
      setDone(true)
    } catch (err: any) { setError(err.message) }
    setLoading(false)
  }

  if (done) return <div className="min-h-screen flex items-center justify-center"><div className="bg-svk-bg-card border border-svk-border rounded-xl shadow-svk-md p-6 max-w-sm text-center"><h1 className="text-xl font-bold mb-2">Password reset!</h1><p className="text-sm text-svk-text-secondary mb-4">Log in with your new password.</p><Button onClick={() => router.push('/login')}>Go to login</Button></div></div>

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="bg-svk-bg-card border border-svk-border rounded-xl shadow-svk-md p-6">
          <h1 className="text-xl font-bold mb-1">New password</h1>
          <p className="text-sm text-svk-text-secondary mb-6">Enter your new password.</p>
          {error && <div className="mb-4 p-3 rounded-lg bg-svk-coral-light text-svk-coral text-sm">{error}</div>}
          <form onSubmit={handleSubmit}>
            <Input label="Password" type="password" placeholder="Min 8 chars" value={pw} onChange={e => setPw(e.target.value)} required />
            <Input label="Confirm" type="password" placeholder="Repeat" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            <Button type="submit" disabled={loading || !pw || !confirm} className="w-full">{loading ? 'Resetting...' : 'Reset password'}</Button>
          </form>
        </div>
      </div>
    </div>
  )
}
