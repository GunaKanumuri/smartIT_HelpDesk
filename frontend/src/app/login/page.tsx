'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const { login, loading, error, clearError } = useAuth()
  const [slug, setSlug] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (!slug || !password) return
    try { await login(slug, password); router.push('/dashboard') } catch {}
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <a href="/" className="text-sm text-svk-text-muted hover:text-svk-text mb-8 inline-block">← Back</a>
        <div className="bg-svk-bg-card border border-svk-border rounded-xl shadow-svk-md p-6">
          <h1 className="text-xl font-bold mb-1">Log in</h1>
          <p className="text-sm text-svk-text-secondary mb-6">Enter your workspace ID and password.</p>
          {error && <div className="mb-4 p-3 rounded-lg bg-svk-coral-light text-svk-coral text-sm">{error}</div>}
          <form onSubmit={handleSubmit}>
            <Input label="Workspace ID" placeholder="my-bakery" value={slug} onChange={e => setSlug(e.target.value)} autoComplete="off" />
            <Input label="Password" type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Logging in...' : 'Log in'}</Button>
          </form>
          <div className="mt-4 text-center text-sm text-svk-text-muted">
            New? <a href="/signup" className="text-svk-accent hover:underline">Create workspace</a>
          </div>
        </div>
      </div>
    </div>
  )
}
