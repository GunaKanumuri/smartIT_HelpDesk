'use client'

import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-body-sm font-medium mb-1.5 text-inherit opacity-80">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full h-11 rounded-lg bg-white/5 border border-white/10 px-4 pr-10 text-body text-inherit appearance-none',
              'transition-all duration-200',
              'focus:outline-none focus:border-svk-accent/50 focus:ring-2 focus:ring-svk-accent/20 focus:bg-white/[0.07]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500/50',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="bg-admin-surface text-admin-text-muted">
                {placeholder}
              </option>
            )}
            {options.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-admin-surface text-admin-text">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
        {error && <p className="mt-1.5 text-caption text-red-400">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
export { Select }
export default Select

