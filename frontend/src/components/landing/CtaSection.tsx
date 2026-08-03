export default function CtaSection() {
  return (
    <section className="py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="glass rounded-2xl text-center py-16 px-6 reveal" style={{ background: 'linear-gradient(180deg, transparent, rgba(15,164,175,0.05))' }}>
          <h2 className="text-heading md:text-heading-md font-display mb-4">Stop reading tickets just to find the urgent one.</h2>
          <p className="text-body-lg text-[#6B7280] font-body mb-8">Join thousands of teams resolving issues faster.</p>
          <a href="#pricing" onClick={e => { e.preventDefault(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }) }}>
            <button className="px-8 py-4 rounded-lg bg-[#0FA4AF] text-black font-bold text-body-lg font-display shadow-[0_0_15px_rgba(15,164,175,0.3)] hover:shadow-[0_0_25px_rgba(15,164,175,0.6)] hover:-translate-y-0.5 transition-all">Get Started for Free</button>
          </a>
        </div>
      </div>
    </section>
  )
}
