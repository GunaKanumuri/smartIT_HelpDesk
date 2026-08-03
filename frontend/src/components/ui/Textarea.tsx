'use client'

import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  showCount?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, showCount, maxLength, value, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const charCount = typeof value === 'string' ? value.length : 0

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-body-sm font-medium mb-1.5 text-inherit opacity-80">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          maxLength={maxLength}
          className={cn(
            'w-full min-h-[120px] rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-body text-inherit placeholder:text-current placeholder:opacity-30 resize-y',
            'transition-all duration-200',
            'focus:outline-none focus:border-svk-accent/50 focus:ring-2 focus:ring-svk-accent/20 focus:bg-white/[0.07]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        <div className="flex justify-between mt-1.5">
          {error && <p className="text-caption text-red-400">{error}</p>}
          {hint && !error && <p className="text-caption opacity-50">{hint}</p>}
          {!error && !hint && <span />}
          {showCount && maxLength && (
            <span className={cn('text-caption opacity-40', charCount > maxLength * 0.9 && 'text-amber-400 opacity-100')}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
export { Textarea }
export default Textarea

