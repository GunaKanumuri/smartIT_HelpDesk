'use client'

import { useEffect, useState } from 'react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handle)
    return () => window.removeEventListener('scroll', handle)
  }, [])

  return (
    <nav className={`fixed top-0 w-full z-50 py-4 transition-all duration-300 ${scrolled ? 'bg-[#0A0E1A]/80 backdrop-blur-md border-b border-white/8' : ''}`}>
      <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 text-[#E8E4DC] no-underline text-xl font-bold font-display">
          <span className="w-6 h-6 rounded-md bg-[#0FA4AF] inline-block" /> SevakAI
        </a>
        <div className="flex items-center gap-8">
          <a href="#how-it-works" className="text-[#E8E4DC] no-underline font-medium hover:text-[#0FA4AF] transition-colors text-sm font-body">How it works</a>
          <a href="#sectors" className="text-[#E8E4DC] no-underline font-medium hover:text-[#0FA4AF] transition-colors text-sm font-body">Sectors</a>
          <a href="#pricing" className="text-[#E8E4DC] no-underline font-medium hover:text-[#0FA4AF] transition-colors text-sm font-body">Pricing</a>
          <a href="/login" className="px-4 py-2 text-sm rounded-lg border border-white/8 text-[#E8E4DC] no-underline font-medium font-body hover:bg-white/10 transition-all">Log in</a>
        </div>
      </div>
    </nav>
  )
}
