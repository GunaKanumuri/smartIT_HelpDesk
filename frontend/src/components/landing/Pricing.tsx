export default function Pricing() {
  return (
    <section className="py-20" id="pricing">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-16 reveal">
          <h2 className="text-heading md:text-heading-md font-display">Simple, transparent pricing</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 items-center">
          {[
            { name: 'Free', price: '$0', desc: 'For small teams getting started.', features: ['Up to 1,000 tickets/mo', 'Basic classification', 'Email integration', 'Community support'], popular: false },
            { name: 'Pro', price: '$29', desc: 'For growing businesses.', features: ['Up to 10,000 tickets/mo', 'Urgency detection', 'All integrations', 'Custom routing rules', 'Priority support'], popular: true },
            { name: 'Enterprise', price: 'Custom', desc: 'For high-volume operations.', features: ['Unlimited tickets', 'Custom AI model training', 'Dedicated manager', 'SLA guarantees', 'On-premise option'], popular: false },
          ].map((p, i) => (
            <div key={i} className={`glass rounded-2xl p-8 text-center flex flex-col h-full reveal ${p.popular ? 'border-[#AFDDE5]/40 shadow-[0_0_30px_rgba(175,221,229,0.15)] scale-105 hover:scale-110' : 'hover:-translate-y-1'}`} style={{ transitionDelay: `${i * 0.2}s` }}>
              {p.popular && <div className="inline-block px-3 py-1 rounded-full bg-[#0A0E1A] text-[#AFDDE5] text-caption font-semibold uppercase tracking-wider font-body mb-4 -mt-12">Most Popular</div>}
              <h3 className={`text-2xl font-display font-bold ${p.popular ? 'text-[#AFDDE5]' : ''}`}>{p.name}</h3>
              <div className="text-4xl font-mono font-bold my-6">{p.price}<span className="text-body-sm text-[#6B7280] font-normal font-body">{p.name !== 'Enterprise' ? '/mo' : ''}</span></div>
              <p className="text-body-sm text-[#6B7280] font-body">{p.desc}</p>
              <ul className="text-left mt-6 mb-8 flex-1 space-y-3">
                {p.features.map(f => <li key={f} className="flex items-center gap-2 text-body-sm text-[#6B7280] font-body"><span className={`font-bold ${p.popular ? 'text-[#AFDDE5]' : 'text-[#0FA4AF]'}`}>✓</span> {f}</li>)}
              </ul>
              <button className={`w-full px-6 py-3 rounded-lg font-semibold font-body transition-all ${
                p.popular ? 'bg-[#964734] text-white hover:brightness-110' : 'bg-white/5 text-[#E8E4DC] border border-white/8 hover:bg-white/10'
              }`}>{p.name === 'Free' ? 'Get Started' : p.name === 'Pro' ? 'Start Free Trial' : 'Contact Sales'}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
