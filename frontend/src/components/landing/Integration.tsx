'use client'

import { useState } from 'react'

export default function Integration() {
  const [tab, setTab] = useState('link')
  const code: Record<string, string> = {
    link: '<a href="https://sevak.ai/your-company">Contact Support</a>',
    widget: '<script src="https://cdn.sevak.ai/widget.js" data-id="YOUR_ID"></script>',
    api: `fetch('https://api.sevak.ai/v1/classify', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer API_KEY' },
  body: JSON.stringify({ text: "Where is my order?" })
});`,
  }
  const labels: Record<string, string> = {
    link: 'Just link to your hosted SevakAI portal.',
    widget: 'Add a floating widget with one script tag.',
    api: 'Full control for custom experiences.',
  }
  return (
    <section className="py-20" id="developers">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="glass rounded-2xl p-10 reveal">
          <div className="text-center mb-8">
            <h2 className="text-heading md:text-heading-md font-display mb-4">For Website Owners</h2>
            <p className="text-body-lg text-[#6B7280] font-body">Integrate in minutes, not months.</p>
          </div>
          <div className="flex gap-4 mb-8 pb-4 border-b border-white/8">
            {Object.keys(code).map(id => (
              <button key={id} onClick={() => setTab(id)}
                className={`px-4 py-2 rounded text-body-sm font-semibold font-body transition-all ${tab === id ? 'text-[#0FA4AF] bg-[#0FA4AF]/10' : 'text-[#6B7280] hover:text-[#E8E4DC]'}`}>{id === 'link' ? 'Simple Link' : id === 'widget' ? 'Embed Widget' : 'REST API'}</button>
            ))}
          </div>
          <p className="text-[#6B7280] mb-4 text-body-sm font-body">{labels[tab]}</p>
          <div className="bg-black/50 p-4 rounded-lg border border-white/8 font-mono text-body-sm text-[#A6ACCD] overflow-x-auto leading-relaxed">{code[tab]}</div>
        </div>
      </div>
    </section>
  )
}
