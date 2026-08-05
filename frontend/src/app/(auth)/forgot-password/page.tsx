'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Check, Mail } from 'lucide-react'
import { AuthCard } from '@/components/auth/AuthCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { forgotPassword } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await forgotPassword(email)
      setIsSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <AuthCard 
        title={isSubmitted ? "Check your email" : "Reset your password"} 
        subtitle={isSubmitted ? "We've sent a password reset link to your email." : "Enter your workspace email and we'll send you a reset link."}
      >
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-16 h-16 bg-teal-400/20 rounded-full flex items-center justify-center mb-6">
              <Check className="w-8 h-8 text-teal-400" />
            </div>
            <Link href="/login" className="w-full block">
              <Button className="w-full bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.1]">
                Back to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Mail size={18} />
                </div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@acme.com"
                  className="pl-10 bg-black/20 border-white/[0.1] focus:border-teal-400 text-white"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-teal-500 hover:bg-teal-400 text-white shadow-[0_0_15px_rgba(20,184,166,0.3)]"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <div className="text-center mt-6">
              <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </AuthCard>
    </div>
  )
}
