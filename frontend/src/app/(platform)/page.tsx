/**
 * =============================================================================
 * page.tsx — Frontend / Src / App
 *
 * AUDIENCE: SevakAI Platform (Us)
 *
 * TABLE OF CONTENTS
 * -----------------
 * 1. IMPORTS            — React, UI primitives, API client, types
 * 2. STATE & LOADING    — Data fetching, filters, sort, modal state
 * 3. FILTER / SORT LOGIC — Derived view of fetched data
 * 4. RENDER             — Layout, table, empty states
 * =============================================================================
 */

'use client'

import { useEffect, useRef } from 'react';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import Industries from '@/components/landing/Industries';
import Pricing from '@/components/landing/Pricing';
import Cta from '@/components/landing/Cta';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: { x: number; y: number; vx: number; vy: number; radius: number; color: string }[] = [];
    const colors = ['rgba(15,164,175,0.3)', 'rgba(150,71,52,0.3)'];
    const numParticles = 50;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    let animationFrameId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-landing-bg text-landing-text relative overflow-hidden flex flex-col">
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,rgba(15,164,175,0.05)_0%,transparent_70%)]" />
      
      {/* Floating geometric shapes */}
      <div className="fixed top-1/4 left-10 w-32 h-32 bg-[rgba(15,164,175,0.1)] backdrop-blur-3xl rounded-full blur-2xl pointer-events-none z-0 mix-blend-screen animate-pulse" />
      <div className="fixed bottom-1/4 right-10 w-48 h-48 bg-[rgba(150,71,52,0.1)] backdrop-blur-3xl rounded-full blur-2xl pointer-events-none z-0 mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="fixed top-1/2 right-1/4 w-24 h-24 bg-[rgba(15,164,175,0.1)] backdrop-blur-3xl rounded-lg rotate-45 blur-xl pointer-events-none z-0 mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 flex-grow flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Hero />
          <Features />
          <HowItWorks />
          <Industries />
          <Pricing />
          <Cta />
        </main>
        <Footer />
      </div>
    </div>
  );
}
