'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { AuthCard } from '@/components/auth/AuthCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { SectorSelector, Sector } from '@/components/auth/SectorSelector'

const SECTORS: Sector[] = [
  { id: 'bakery', name: 'Bakery', emoji: '🍞' },
  { id: 'restaurant', name: 'Restaurant', emoji: '🍽️' },
  { id: 'plumbing', name: 'Plumbing', emoji: '🔧' },
  { id: 'ecommerce', name: 'E-Commerce', emoji: '🛒' },
  { id: 'saas', name: 'SaaS', emoji: '💻' },
  { id: 'healthcare', name: 'Healthcare', emoji: '🏥' },
  { id: 'legal', name: 'Legal', emoji: '⚖️' },
  { id: 'realestate', name: 'Real Estate', emoji: '🏠' },
  { id: 'education', name: 'Education', emoji: '📚' },
  { id: 'automotive', name: 'Automotive', emoji: '🚗' },
  { id: 'fitness', name: 'Fitness', emoji: '💪' },
  { id: 'pets', name: 'Pets', emoji: '🐾' },
  { id: 'photography', name: 'Photography', emoji: '📸' },
  { id: 'general', name: 'General', emoji: '🌐' },
];

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const { signup, loading, error, clearError } = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    business_description: '',
    sector: '',
    profile: '',
    contact_email: '',
    contact_phone: '',
    password: '',
    confirmPassword: ''
  })

  // Auto-generate slug from name
  useEffect(() => {
    if (step === 1 && formData.name) {
      setFormData(prev => ({
        ...prev,
        slug: prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      }))
    }
  }, [formData.name, step])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (formData.password !== formData.confirmPassword) {
      return;
    }

    try {
      await signup({
        slug: formData.slug,
        name: formData.name,
        profile: formData.profile,
        password: formData.password,
        sector: formData.sector,
        business_description: formData.business_description,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email
      })
      router.push('/dashboard')
    } catch (err) {
      // Error handled by useAuth
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto relative">
      <AuthCard 
        title="Create your workspace" 
        subtitle="Get started with SevaKAI in minutes"
        className="min-h-[550px] flex flex-col"
      >
        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${
                step === i ? 'w-8 bg-teal-400' : step > i ? 'w-4 bg-teal-400/50' : 'w-4 bg-white/10'
              }`} 
            />
          ))}
        </div>

        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="flex-1 relative overflow-hidden">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div 
            className="transition-transform duration-500 ease-in-out absolute inset-0 w-full"
            style={{ transform: `translateX(${(1 - step) * 100}%)`, opacity: step === 1 ? 1 : 0, pointerEvents: step === 1 ? 'auto' : 'none' }}
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Business Name</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Acme Corp"
                  className="mt-1 bg-black/20 border-white/[0.1] focus:border-teal-400 text-white"
                  required={step === 1}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Workspace ID</label>
                <Input
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="acme-corp"
                  className="mt-1 bg-black/20 border-white/[0.1] focus:border-teal-400 text-white"
                  required={step === 1}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Business Description</label>
                <Textarea
                  name="business_description"
                  value={formData.business_description}
                  onChange={handleChange}
                  placeholder="What does your business do?"
                  className="mt-1 bg-black/20 border-white/[0.1] focus:border-teal-400 text-white min-h-[80px]"
                />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 pt-4 bg-[#111827]">
              <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-400 text-white">
                Next
              </Button>
            </div>
          </div>

          <div 
            className="transition-transform duration-500 ease-in-out absolute inset-0 w-full flex flex-col"
            style={{ transform: `translateX(${(2 - step) * 100}%)`, opacity: step === 2 ? 1 : 0, pointerEvents: step === 2 ? 'auto' : 'none' }}
          >
            <div className="space-y-6 flex-1 overflow-y-auto pr-2 pb-20 scrollbar-hide">
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-3">Select your Sector</label>
                <SectorSelector
                  value={formData.sector}
                  onChange={(val) => setFormData(prev => ({ ...prev, sector: val }))}
                  sectors={SECTORS}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">Profile Type</label>
                <Select
                  name="profile"
                  value={formData.profile}
                  onChange={(e) => setFormData(prev => ({ ...prev, profile: e.target.value }))}
                  className="bg-black/20 border-white/[0.1] text-white w-full h-10 rounded-md px-3"
                  required={step === 2}
                  placeholder="Select profile type"
                  options={[
                    { value: "customer_support", label: "Customer Support" },
                    { value: "it_support", label: "Technical Support" },
                    { value: "Sales", label: "Sales" },
                    { value: "Operations", label: "Operations" },
                    { value: "Other", label: "Other" },
                  ]}
                />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 flex gap-3 pt-4 bg-[#111827] border-t border-white/[0.05]">
              <Button type="button" variant="outline" onClick={handleBack} className="w-1/3 border-white/[0.1] text-gray-300 hover:bg-white/5">
                Back
              </Button>
              <Button type="submit" className="w-2/3 bg-teal-500 hover:bg-teal-400 text-white">
                Next
              </Button>
            </div>
          </div>

          <div 
            className="transition-transform duration-500 ease-in-out absolute inset-0 w-full"
            style={{ transform: `translateX(${(3 - step) * 100}%)`, opacity: step === 3 ? 1 : 0, pointerEvents: step === 3 ? 'auto' : 'none' }}
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Contact Email</label>
                <Input
                  name="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  placeholder="admin@acme.com"
                  className="mt-1 bg-black/20 border-white/[0.1] focus:border-teal-400 text-white"
                  required={step === 3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Contact Phone (Optional)</label>
                <Input
                  name="contact_phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="mt-1 bg-black/20 border-white/[0.1] focus:border-teal-400 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Password</label>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="mt-1 bg-black/20 border-white/[0.1] focus:border-teal-400 text-white"
                  required={step === 3}
                  minLength={8}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Confirm Password</label>
                <Input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="mt-1 bg-black/20 border-white/[0.1] focus:border-teal-400 text-white"
                  required={step === 3}
                  minLength={8}
                />
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                )}
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 flex gap-3 pt-4 bg-[#111827]">
              <Button type="button" variant="outline" onClick={handleBack} className="w-1/3 border-white/[0.1] text-gray-300 hover:bg-white/5" disabled={loading}>
                Back
              </Button>
              <Button type="submit" className="w-2/3 bg-teal-500 hover:bg-teal-400 text-white shadow-[0_0_15px_rgba(20,184,166,0.3)]" disabled={loading || (formData.password !== formData.confirmPassword)}>
                {loading ? 'Creating...' : 'Create Workspace'}
              </Button>
            </div>
          </div>
        </form>
      </AuthCard>
      
      <div className="mt-8 text-center text-sm text-gray-400">
        Already have a workspace?{' '}
        <Link href="/login" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  )
}
