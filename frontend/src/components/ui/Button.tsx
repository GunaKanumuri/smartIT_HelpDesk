'use client'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-body font-semibold transition-all duration-200 cursor-pointer'
  const variants = {
    primary: 'bg-[#0FA4AF] text-black hover:brightness-110 shadow-[0_0_15px_rgba(15,164,175,0.3)] hover:shadow-[0_0_25px_rgba(15,164,175,0.5)]',
    outline: 'bg-transparent text-[#E8E4DC] border border-white/20 hover:bg-white/10 hover:border-white/30',
    ghost: 'bg-transparent text-[#6B7280] hover:text-[#E8E4DC] hover:bg-white/5',
  }
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-5 py-2.5 text-sm', lg: 'px-7 py-3 text-base' }
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>
}
