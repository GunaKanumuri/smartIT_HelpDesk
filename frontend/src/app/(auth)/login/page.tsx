'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Lock } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { AuthCard } from '@/components/auth/AuthCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const [slug, setSlug] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error, clearError } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    try {
      await login(slug, password)
      router.push('/dashboard')
    } catch (err) {
      // Error is handled by useAuth hook
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <AuthCard 
        title="Welcome back" 
        subtitle="Sign in to your workspace"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300">Workspace ID</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Building2 size={18} />
              </div>
              <Input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-workspace"
                className="pl-10 bg-black/20 border-white/[0.1] focus:border-teal-400 text-white placeholder-gray-600"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <Link href="/forgot-password" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Lock size={18} />
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 bg-black/20 border-white/[0.1] focus:border-teal-400 text-white placeholder-gray-600"
                required
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-600 bg-black/20 text-teal-400 focus:ring-teal-400 focus:ring-offset-gray-900"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
              Remember me
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-teal-500 hover:bg-teal-400 text-white shadow-[0_0_15px_rgba(20,184,166,0.3)] transition-all"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Don't have a workspace?{' '}
          <Link href="/signup" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
            Sign up
          </Link>
        </div>
      </AuthCard>
    </div>
  )
}
