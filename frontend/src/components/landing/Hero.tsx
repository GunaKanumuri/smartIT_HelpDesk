'use client'

import { useState, useRef } from 'react'

const RULES = [
  { lane: 'Billing', keywords: ['charge', 'charged', 'bill', 'invoice', 'payment', 'card', 'price', 'subscription'], urgency: 'med' },
  { lane: 'Shipping', keywords: ['ship', 'deliver', 'delivery', 'arrive', 'tracking', 'package', 'order'], urgency: 'med' },
  { lane: 'Product', keywords: ['broken', 'defective', 'wrong item', 'damaged', 'not working', "doesn't work", 'refund', 'unacceptable', 'return'], urgency: 'high' },
]

function classify(text: string) {
  const lower = text.toLowerCase()
  const urgentWords = ['urgent', 'asap', 'immediately', 'unacceptable', 'angry', 'furious', 'now']
  const isUrgent = urgentWords.some(w => lower.includes(w))
  for (const rule of RULES) {
    if (rule.keywords.some(k => lower.includes(k))) return { lane: rule.lane, urgency: isUrgent ? 'high' : rule.urgency }
  }
  return { lane: 'Product', urgency: isUrgent ? 'high' : 'low' }
}

export default function Hero() {
  const [input, setInput] = useState('')
  const [tickets, setTickets] = useState<Record<string, { text: string; urgency: string }[]>>({ Billing: [], Shipping: [], Product: [] })
  const [activeLane, setActiveLane] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const add = (text: string) => {
    if (!text.trim()) return
    const r = classify(text); setActiveLane(r.lane); setTimeout(() => setActiveLane(null), 1000)
    setTickets(p => ({ ...p, [r.lane]: [{ text, urgency: r.urgency }, ...p[r.lane]].slice(0, 3) }))
    setInput('')
  }

  // 3D tilt
  const onMove = (e: React.MouseEvent) => {
    const card = cardRef.current; if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    const cx = rect.width / 2, cy = rect.height / 2
    card.style.transform = `perspective(1000px) rotateX(${((y - cy) / cy) * -5}deg) rotateY(${((x - cx) / cx) * 5}deg)`
  }
  const onLeave = () => { if (cardRef.current) cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)' }

  return (
    <section className="min-h-screen flex items-center pt-28 pb-20 relative" id="home">
      <div className="max-w-[1200px] mx-auto px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="reveal">
            <span className="inline-block px-3 py-1 rounded-full bg-[#0FA4AF]/10 text-[#0FA4AF] border border-[#0FA4AF]/20 text-caption font-semibold uppercase tracking-wider mb-6 font-body">Intelligent Triage</span>
            <h1 className="text-4xl md:text-5xl lg:text-display-md font-display font-bold leading-[1.05] mb-6">
              Every message sorted <span className="text-[#0FA4AF]">before</span> it reaches your team.
            </h1>
            <p className="text-body-lg text-[#6B7280] mb-10 max-w-md font-body">
              Automate your support workflow with AI that reads, classifies, and routes tickets instantly based on urgency and topic.
            </p>
            <div className="flex gap-4">
              <a href="#demo" onClick={e => { e.preventDefault(); document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' }) }}>
                <button className="px-6 py-3 rounded-lg bg-[#0FA4AF] text-black font-semibold font-body shadow-[0_0_15px_rgba(15,164,175,0.3)] hover:shadow-[0_0_25px_rgba(15,164,175,0.6)] hover:-translate-y-0.5 transition-all">Try the Demo</button>
              </a>
              <a href="#how-it-works" onClick={e => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }) }}>
                <button className="px-6 py-3 rounded-lg border border-white/8 text-[#E8E4DC] font-body font-semibold hover:bg-white/10 hover:-translate-y-0.5 transition-all">Learn More</button>
              </a>
            </div>
          </div>

          <div className="reveal" id="demo">
            <div ref={cardRef} className="glass rounded-2xl p-6 shadow-svk-card transition-transform duration-100"
              onMouseMove={onMove} onMouseLeave={onLeave} style={{ transformStyle: 'preserve-3d' }}>
              <div className="flex items-center justify-between pb-4 border-b border-white/8 mb-4">
                <h3 className="font-bold text-lg font-display">Live Sorter Demo</h3>
                <span className="text-caption text-[#6B7280] font-body">Try typing a message</span>
              </div>
              <div className="flex gap-4 mb-4">
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add(input) } }}
                  className="flex-1 bg-black/20 border border-white/8 rounded-lg px-4 py-3 text-sm text-[#E8E4DC] resize-none h-20 outline-none focus:border-[#0FA4AF] transition-colors placeholder:text-[#6B7280] font-body"
                  placeholder="e.g. 'My package is damaged and I need an urgent refund!'" />
                <button onClick={() => add(input)} className="px-6 rounded-lg bg-[#0FA4AF] text-black font-semibold font-body shadow-[0_0_15px_rgba(15,164,175,0.3)] hover:shadow-[0_0_25px_rgba(15,164,175,0.6)] hover:-translate-y-0.5 transition-all h-20">Sort</button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {['Billing', 'Shipping', 'Product'].map(lane => (
                  <div key={lane} className={`rounded-lg p-4 min-h-[120px] transition-all duration-300 ${activeLane === lane ? 'bg-[#0FA4AF]/5 border-[#0FA4AF] shadow-[0_0_15px_rgba(15,164,175,0.1)_inset]' : 'bg-black/30 border border-dashed border-white/8'}`}>
                    <div className="text-body-sm font-semibold text-[#6B7280] text-center mb-4 font-body">{lane}</div>
                    {tickets[lane].map((t, i) => (
                      <div key={i} className={`bg-white/3 border border-white/8 rounded p-2 text-xs mb-2 animate-slide-in break-words font-body ${t.urgency === 'high' ? 'border-l-4 border-l-[#964734]' : t.urgency === 'med' ? 'border-l-4 border-l-[#AFDDE5]' : 'border-l-4 border-l-[#0FA4AF]'}`}>
                        <strong className="text-[10px] uppercase font-bold">{t.urgency}</strong>: {t.text}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
