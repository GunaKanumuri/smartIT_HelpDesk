'use client'

import React from 'react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0E1A] relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Animated gradient orbs */}
      <div 
        className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-[rgba(15,164,175,0.15)] blur-[120px] pointer-events-none animate-pulse" 
        style={{ animationDuration: '8s' }} 
      />
      <div 
        className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[rgba(150,71,52,0.1)] blur-[120px] pointer-events-none animate-pulse" 
        style={{ animationDuration: '10s' }} 
      />
      
      {/* Subtle grid pattern overlay */}
      <div 
        className="absolute inset-0 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* SevaKAI text logo */}
      <div className="z-10 mb-8 mt-4 animate-fade-in-down" style={{ animation: 'fadeInDown 0.6s ease-out forwards' }}>
        <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-2">
          Seva<span className="text-teal-400">KAI</span>
        </h1>
      </div>

      <div className="z-10 w-full flex justify-center animate-fade-in-up" style={{ animation: 'fadeInUp 0.6s ease-out forwards' }}>
        {children}
      </div>

      <style jsx>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
