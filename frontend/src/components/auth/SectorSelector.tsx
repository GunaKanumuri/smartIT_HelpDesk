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
              ? 'border-violet-400 bg-violet-400/15 shadow-[0_0_15px_rgba(139,92,246,0.2)] scale-105'
              : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:scale-105'
          }`}
        >
          <span className="text-2xl mb-2 block">{sector.emoji}</span>
          <span className="text-xs font-medium text-gray-700 text-center">{sector.name}</span>
        </button>
      ))}
    </div>
  )
}
