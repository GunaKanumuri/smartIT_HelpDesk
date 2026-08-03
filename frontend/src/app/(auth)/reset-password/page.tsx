'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import { AuthCard } from '@/components/auth/AuthCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    
    // Simulate API call since backend doesn't have this yet
    setTimeout(() => {
      setLoading(false)
      router.push('/login')
    }, 1000)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <AuthCard 
        title="Set new password" 
        subtitle="Please enter your new password below."
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Lock size={18} />
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 bg-black/20 border-white/[0.1] focus:border-teal-400 text-white"
                required
                minLength={8}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Lock size={18} />
              </div>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 bg-black/20 border-white/[0.1] focus:border-teal-400 text-white"
                required
                minLength={8}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-teal-500 hover:bg-teal-400 text-white shadow-[0_0_15px_rgba(20,184,166,0.3)] mt-2"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </AuthCard>
    </div>
  )
}
