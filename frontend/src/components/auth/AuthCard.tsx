'use client'

import React from 'react'

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ title, subtitle, children, className = '' }: AuthCardProps) {
  return (
    <div className={`w-full bg-[#111827]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl p-8 transition-all duration-500 ease-in-out ${className}`}>
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-400 text-sm">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}
