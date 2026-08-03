'use client'

import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'bordered' | 'ghost'
  hover?: boolean
  glow?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'glass', hover = false, glow = false, padding = 'md', children, ...props }, ref) => {
    const variants = {
      glass: 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]',
      solid: 'bg-admin-surface border border-white/[0.06]',
      bordered: 'bg-transparent border border-white/[0.1]',
      ghost: 'bg-transparent',
    }

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-300',
          variants[variant],
          paddings[padding],
          hover && 'hover:bg-white/[0.06] hover:border-white/[0.15] hover:-translate-y-0.5 hover:shadow-card-dark-hover cursor-pointer',
          glow && 'hover:shadow-accent-glow',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

Card.displayName = 'Card'
export { Card, CardContent }
export default Card

