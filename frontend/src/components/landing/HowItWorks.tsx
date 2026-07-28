export default function HowItWorks() {
  const steps = [
    { n: '1', title: 'Intake', desc: 'Connect your existing support channels. We ingest messages securely via API or webhook.' },
    { n: '2', title: 'Classify', desc: 'Our AI analyzes sentiment, keywords, and context to determine the topic and urgency.' },
    { n: '3', title: 'Route', desc: 'Tickets are instantly assigned to the right team or agent with context attached.' },
  ]
  return (
    <section className="py-20" id="how-it-works">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-16 reveal">
          <h2 className="text-heading md:text-heading-md font-display mb-4">How It Works</h2>
          <p className="text-body-lg text-[#6B7280] font-body">Three simple steps to an organized inbox.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          {steps.map((s, i) => (
            <div key={i} className="glass rounded-2xl p-8 text-center relative z-10 reveal">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#0A0E1A] border-2 border-[#0FA4AF] flex items-center justify-center text-2xl font-bold text-[#0FA4AF] mb-6 font-display shadow-[0_0_20px_rgba(15,164,175,0.2)]">{s.n}</div>
              <h3 className="text-heading font-display mb-4">{s.title}</h3>
              <p className="text-body text-[#6B7280] font-body leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
