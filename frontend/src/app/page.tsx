'use client'

import { useEffect, useRef } from 'react'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Problem from '@/components/landing/Problem'
import HowItWorks from '@/components/landing/HowItWorks'
import Features from '@/components/landing/Features'
import Integration from '@/components/landing/Integration'
import Industries from '@/components/landing/Industries'
import Pricing from '@/components/landing/Pricing'
import CtaSection from '@/components/landing/CtaSection'
import Footer from '@/components/landing/Footer'

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Particle canvas
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)
    resize()

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const particles: { x: number; y: number; size: number; speedX: number; speedY: number; color: string }[] = []
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: Math.random() * 0.5 - 0.25, speedY: Math.random() * 0.5 - 0.25,
        color: Math.random() > 0.5 ? 'rgba(15,164,175,0.3)' : 'rgba(150,71,52,0.3)',
      })
    }

    let animId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.speedX; p.y += p.speedY
        if (p.x > canvas.width) p.x = 0; else if (p.x < 0) p.x = canvas.width
        if (p.y > canvas.height) p.y = 0; else if (p.y < 0) p.y = canvas.height
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill()
      })
      animId = requestAnimationFrame(animate)
    }
    animate()

    // Scroll reveal observer
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('active'); observer.unobserve(e.target) } }) },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))

    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId); observer.disconnect() }
  }, [])

  return (
    <>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-[-2]"
        style={{
          background: 'radial-gradient(circle at 15% 50%, rgba(15,164,175,0.08) 0%, transparent 50%), radial-gradient(circle at 85% 30%, rgba(150,71,52,0.05) 0%, transparent 50%)'
        }}
      />
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[-1]" />

      {/* 3D floating shapes */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden perspective-[1000px]">
        <div className="absolute w-[100px] h-[100px] top-[20%] left-[10%] rounded-xl bg-gradient-to-br from-[#0FA4AF]/10 to-[#964734]/10 border border-white/5 backdrop-blur-[5px] animate-float" style={{ animationDuration: '25s' }} />
        <div className="absolute w-[150px] h-[150px] top-[60%] right-[5%] rounded-full bg-gradient-to-br from-[#0FA4AF]/10 to-[#964734]/10 border border-white/5 backdrop-blur-[5px] animate-float" style={{ animationDuration: '30s', animationDirection: 'reverse' }} />
        <div className="absolute w-[80px] h-[80px] top-[80%] left-[20%] rotate-45 bg-gradient-to-br from-[#0FA4AF]/10 to-[#964734]/10 border border-white/5 backdrop-blur-[5px] animate-float" style={{ animationDuration: '20s' }} />
      </div>

      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <Features />
      <Integration />
      <Industries />
      <Pricing />
      <CtaSection />
      <Footer />
    </>
  )
}
