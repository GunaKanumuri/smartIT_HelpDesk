'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const SECTORS: Record<string, string> = {
  bakery: 'Bakery', plumbing: 'Plumbing', restaurant: 'Restaurant', ecommerce: 'E-Commerce',
  legal: 'Legal', medical: 'Medical', saas: 'SaaS', real_estate: 'Real Estate',
  automotive: 'Automotive', salon: 'Salon', fitness: 'Fitness', education: 'Education', other: 'Other',
}
const PROFILES = { it_support: 'IT Support', customer_support: 'Customer Support' }
const slugify = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'workspace'

export default function SignupPage() {
  const router = useRouter()
  const { signup, loading, error, clearError } = useAuth()
  const [name, setName] = useState(''); const [sid, setSid] = useState('other'); const [pid, setPid] = useState('customer_support')
  const [desc, setDesc] = useState(''); const [phone, setPhone] = useState(''); const [email, setEmail] = useState(''); const [pw, setPw] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); clearError()
    if (!name || !pw) return
    try { await signup({ slug: slugify(name), name, profile: pid, password: pw, sector: sid, business_description: desc, contact_phone: phone, contact_email: email }); router.push('/dashboard') } catch {}
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-sm">
        <a href="/" className="text-sm text-svk-text-muted hover:text-svk-text mb-6 inline-block">← Back</a>
        <div className="bg-svk-bg-card border border-svk-border rounded-xl shadow-svk-md p-6">
          <h1 className="text-xl font-bold mb-1">Create workspace</h1>
          <p className="text-sm text-svk-text-secondary mb-6">Free. No credit card.</p>
          {error && <div className="mb-4 p-3 rounded-lg bg-svk-coral-light text-svk-coral text-sm">{error}</div>}
          <form onSubmit={handleSubmit}>
            <Input label="Business name" placeholder="My Bakery" value={name} onChange={e => setName(e.target.value)} autoComplete="off" />
            <div className="mb-3">
              <label className="block text-sm font-medium text-svk-text-secondary mb-1">Sector</label>
              <select value={sid} onChange={e => setSid(e.target.value)} className="w-full bg-svk-bg-card border border-svk-border rounded-lg px-3 py-2 text-sm text-svk-text outline-none">
                {Object.entries(SECTORS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <Input label="Password" type="password" placeholder="Choose a password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" />
            <Button type="submit" disabled={loading || !name || !pw} className="w-full">{loading ? 'Creating...' : 'Create workspace'}</Button>
          </form>
          <p className="text-center text-sm text-svk-text-muted mt-4">Have a workspace? <a href="/login" className="text-svk-accent hover:underline">Log in</a></p>
        </div>
      </div>
    </div>
  )
}
