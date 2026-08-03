'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'card' | 'circle' | 'rect'
}

export function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  const variants = {
    text: 'h-4 w-full rounded',
    card: 'h-32 w-full rounded-xl',
    circle: 'h-10 w-10 rounded-full',
    rect: 'h-20 w-full rounded-lg',
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-white/5',
        variants[variant],
        className
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-white/[0.06] p-6 space-y-4', className)}>
      <Skeleton variant="text" className="w-1/3 h-5" />
      <Skeleton variant="text" className="w-2/3" />
      <Skeleton variant="text" className="w-1/2" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 px-4 py-2">
        <Skeleton className="w-1/4 h-4" />
        <Skeleton className="w-1/4 h-4" />
        <Skeleton className="w-1/4 h-4" />
        <Skeleton className="w-1/4 h-4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-t border-white/[0.04]">
          <Skeleton className="w-1/4 h-4" />
          <Skeleton className="w-1/4 h-4" />
          <Skeleton className="w-1/4 h-4" />
          <Skeleton className="w-1/4 h-4" />
        </div>
      ))}
    </div>
  )
}
