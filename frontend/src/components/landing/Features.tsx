export default function Features() {
  const items = [
    { icon: '🏢', title: 'Multi-tenant workspaces', desc: 'Manage multiple brands or departments from a single dashboard.' },
    { icon: '🧠', title: 'Sector-aware intelligence', desc: 'Models pre-trained on industry-specific terminology.' },
    { icon: '🚨', title: 'Urgency detection', desc: 'Automatically flags angry customers and SLA-risk tickets.' },
    { icon: '🛡️', title: 'Duplicate/spam detection', desc: 'Filters out noise before it reaches your metrics.' },
    { icon: '🔔', title: 'Escalation alerts', desc: 'Custom rules to notify managers of high-risk interactions.' },
    { icon: '✍️', title: 'Suggested replies', desc: 'Agents get AI-drafted responses based on previous resolutions.' },
    { icon: '📊', title: 'SLA analytics', desc: 'Track resolution times across different ticket categories.' },
    { icon: '⚙️', title: 'Admin dashboard', desc: 'Intuitive interface to tweak rules and monitor performance.' },
    { icon: '📈', title: 'Train on your data', desc: 'The model improves continuously based on how you handle edge cases.' },
  ]
  return (
    <section className="py-20" id="features">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-16 reveal">
          <h2 className="text-heading md:text-heading-md font-display">Everything you need to scale</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((f, i) => (
            <div key={i} className="glass rounded-2xl p-8 hover:-translate-y-1 hover:border-white/20 transition-all duration-300 reveal">
              <div className="text-3xl mb-4" style={{ color: '#0FA4AF' }}>{f.icon}</div>
              <h3 className="text-subheading font-display font-semibold mb-3">{f.title}</h3>
              <p className="text-body text-[#6B7280] font-body leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
