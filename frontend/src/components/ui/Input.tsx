'use client'

import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; optional?: boolean }

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, optional, className = '', ...props }, ref) => (
  <div className="mb-3">
    {label && <label className="block text-body-sm font-medium text-[#6B7280] mb-1 font-body">{label}{optional && <span className="font-normal text-[#6B7280] text-caption ml-1">(optional)</span>}</label>}
    <input ref={ref} className={`w-full bg-[#0A0E1A] border border-white/10 rounded-xl px-4 py-2.5 text-body-sm text-[#E8E4DC] font-body outline-none placeholder:text-[#6B7280] focus:border-[#0FA4AF]/50 focus:shadow-[0_0_0_3px_rgba(15,164,175,0.1)] transition-all ${className}`} {...props} />
  </div>
))
Input.displayName = 'Input'
export default Input
