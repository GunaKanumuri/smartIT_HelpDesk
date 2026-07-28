'use client'

import { useEffect, useRef } from 'react'

const sectors = [
  { icon: '🥐', name: 'Bakery', desc: 'Order tracking & custom quotes' },
  { icon: '🔧', name: 'Plumbing', desc: 'Emergency dispatch & quotes' },
  { icon: '🍽️', name: 'Restaurant', desc: 'Reservations & feedback' },
  { icon: '🛒', name: 'E-Commerce', desc: 'Returns, shipping, defects' },
  { icon: '⚖️', name: 'Legal', desc: 'Consultations & document reqs' },
  { icon: '⚕️', name: 'Medical', desc: 'Appointments & general info' },
  { icon: '☁️', name: 'SaaS', desc: 'Bugs, billing & feature reqs' },
  { icon: '🏠', name: 'Real Estate', desc: 'Viewings & maintenance' },
  { icon: '🚗', name: 'Automotive', desc: 'Service scheduling & parts' },
  { icon: '✂️', name: 'Salon', desc: 'Booking & modifications' },
  { icon: '💪', name: 'Fitness', desc: 'Memberships & schedules' },
  { icon: '🎓', name: 'Education', desc: 'Enrollment & tech support' },
  { icon: '✨', name: 'Other', desc: 'Custom trained models' },
]

export default function Industries() {
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!gridRef.current) return
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('active'); observer.unobserve(e.target) } }) },
      { threshold: 0.1 }
    )
    gridRef.current.querySelectorAll('.sector-card').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="py-20" id="sectors">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-16 reveal">
          <h2 className="text-heading md:text-heading-md font-display mb-4">Tailored for your industry</h2>
          <p className="text-body-lg text-[#6B7280] font-body">Our models understand the specific terminology of your business.</p>
        </div>
        <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sectors.map((s, i) => (
            <div key={i} className="glass rounded-2xl p-6 text-center hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg hover:border-[#AFDDE5]/30 transition-all duration-300 cursor-pointer sector-card reveal" style={{ transitionDelay: `${(i % 5) * 0.1}s` }}>
              <div className="text-3xl mb-3">{s.icon}</div>
              <h4 className="font-display font-bold text-body-sm mb-1">{s.name}</h4>
              <p className="text-caption text-[#6B7280] font-body">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
