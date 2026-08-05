'use client'

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Toast {
  id: string
  message: string
  variant: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

interface ToastContextType {
  toast: (message: string, variant?: Toast['variant'], duration?: number) => void
  addToast: (message: string, variant?: Toast['variant'], duration?: number) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, variant: Toast['variant'] = 'info', duration = 4000) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, variant, duration }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast, addToast: toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(t.id), t.duration || 4000)
    return () => clearTimeout(timer)
  }, [t, onDismiss])

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  }

  const colors = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    error: 'border-red-500/30 bg-red-500/10 text-red-300',
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-xl animate-slide-up text-body-sm',
        colors[t.variant]
      )}
    >
      <span className="text-lg">{icons[t.variant]}</span>
      <span className="flex-1">{t.message}</span>
      <button onClick={() => onDismiss(t.id)} className="opacity-50 hover:opacity-100 transition-opacity text-sm">✕</button>
    </div>
  )
}
