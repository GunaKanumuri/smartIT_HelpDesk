'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
const ENABLED = true

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try { await fetch(`${API_BASE}/api/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }) } catch {}
    setSubmitted(true); setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <a href="/login" className="text-sm text-svk-text-muted hover:text-svk-text mb-8 inline-block">← Back</a>
        <div className="bg-svk-bg-card border border-svk-border rounded-xl shadow-svk-md p-6">
          <h1 className="text-xl font-bold mb-1">Reset password</h1>
          <p className="text-sm text-svk-text-secondary mb-6">Enter your email and we&apos;ll send a reset link.</p>
          {submitted ? (
            <div className="p-4 rounded-lg bg-svk-green-light text-svk-green text-sm text-center">If that email exists, a reset link has been sent.</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              <Button type="submit" disabled={loading || !email} className="w-full">{loading ? 'Sending...' : 'Send reset link'}</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
