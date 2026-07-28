export default function Card({ className = '', children, hover = false }: { className?: string; children: React.ReactNode; hover?: boolean }) {
  return (
    <div className={`bg-[rgba(255,255,255,0.03)] backdrop-blur-[16px] border border-white/8 rounded-2xl ${hover ? 'hover:border-white/20 hover:bg-[rgba(255,255,255,0.05)] transition-all duration-300' : ''} ${className}`}>
      {children}
    </div>
  )
}
