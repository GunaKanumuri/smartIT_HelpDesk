'use client'

import React from 'react'

export interface Sector {
  id: string;
  name: string;
  emoji: string;
}

interface SectorSelectorProps {
  value: string;
  onChange: (value: string) => void;
  sectors: Sector[];
}

export function SectorSelector({ value, onChange, sectors }: SectorSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {sectors.map((sector) => (
        <button
          key={sector.id}
          type="button"
          onClick={() => onChange(sector.id)}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 ${
            value === sector.id 
              ? 'border-teal-400 bg-teal-400/10 shadow-[0_0_15px_rgba(45,212,191,0.2)] scale-105' 
              : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.2] hover:scale-105'
          }`}
        >
          <span className="text-2xl mb-2 block">{sector.emoji}</span>
          <span className="text-xs font-medium text-gray-300 text-center">{sector.name}</span>
        </button>
      ))}
    </div>
  )
}
