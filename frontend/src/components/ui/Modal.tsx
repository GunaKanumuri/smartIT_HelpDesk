'use client'

import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  const handleKey = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }, [onClose])
  useEffect(() => { if (open) { document.addEventListener('keydown', handleKey); document.body.style.overflow = 'hidden' } return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = 'unset' } }, [open, handleKey])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg bg-[#024950] border border-white/10 rounded-2xl shadow-2xl animate-fade-in">
        {title && <div className="flex items-center justify-between p-6 pb-0"><h3 className="text-body-lg font-display font-semibold text-[#E8E4DC]">{title}</h3><button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-[#6B7280]"><X size={14} /></button></div>}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
