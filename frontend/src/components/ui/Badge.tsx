'use client'

import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'accent' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
  dot?: boolean
}

export default function Badge({ className, variant = 'default', size = 'sm', dot = false, children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-white/10 text-white/70',
    secondary: 'bg-white/5 text-white/70 border border-white/10',
    outline: 'border border-svk-accent/40 text-svk-accent bg-transparent',
    accent: 'bg-svk-accent/15 text-svk-accent',
    success: 'bg-emerald-500/15 text-emerald-400',
    warning: 'bg-amber-500/15 text-amber-400',
    danger: 'bg-red-500/15 text-red-400',
    info: 'bg-blue-500/15 text-blue-400',
  }

  const dotColors = {
    default: 'bg-white/50',
    secondary: 'bg-white/50',
    outline: 'bg-svk-accent',
    accent: 'bg-svk-accent',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    info: 'bg-blue-400',
  }

  const sizes = {
    sm: 'text-[0.6875rem] px-2 py-0.5',
    md: 'text-caption px-2.5 py-1',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  )
}

export { Badge }

