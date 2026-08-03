'use client'

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'default'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, iconRight, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-svk-accent focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none'

    const variants = {
      primary: 'bg-svk-accent text-white hover:bg-svk-accent/90 active:bg-svk-accent/80 shadow-accent-glow hover:shadow-accent-glow-lg',
      default: 'bg-svk-accent text-white hover:bg-svk-accent/90 active:bg-svk-accent/80 shadow-accent-glow hover:shadow-accent-glow-lg',
      secondary: 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20',
      ghost: 'text-current hover:bg-white/5',
      danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
      outline: 'border border-svk-accent/40 text-svk-accent hover:bg-svk-accent/10 hover:border-svk-accent/60',
    }

    const sizes = {
      sm: 'h-8 px-3 text-body-sm',
      md: 'h-10 px-5 text-body-sm',
      lg: 'h-12 px-8 text-body',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : icon}
        {children}
        {iconRight}
      </button>
    )
  }
)

Button.displayName = 'Button'
export { Button }
export default Button
