'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-body-sm font-medium mb-1.5 text-inherit opacity-80">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-current opacity-40 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-11 rounded-lg bg-white/5 border border-white/10 px-4 text-body text-inherit placeholder:text-current placeholder:opacity-30',
              'transition-all duration-200',
              'focus:outline-none focus:border-svk-accent/50 focus:ring-2 focus:ring-svk-accent/20 focus:bg-white/[0.07]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              icon && 'pl-10',
              error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-caption text-red-400">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-caption opacity-50">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export { Input }
export default Input

