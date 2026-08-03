export default function Badge({ variant = 'default', className = '', children }: { variant?: 'default' | 'accent' | 'success' | 'warning'; className?: string; children: React.ReactNode }) {
  const styles = {
    default: 'bg-white/5 text-[#6B7280]',
    accent: 'bg-[#0FA4AF]/10 text-[#0FA4AF] border border-[#0FA4AF]/20',
    success: 'bg-[#0FA4AF]/10 text-[#AFDDE5]',
    warning: 'bg-[#964734]/10 text-[#964734]',
  }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-medium font-body ${styles[variant]} ${className}`}>{children}</span>
}
