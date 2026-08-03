'use client'

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

/* Mapping of keywords to categories with matching colors/icons */
type Category = 'Billing' | 'Product' | 'Shipping';

const categoryConfig: Record<Category, { color: string; bg: string; border: string; text: string; icon: string }> = {
  Billing: { color: '#F59E0B', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: '💰' },
  Product: { color: '#8B5CF6', bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', icon: '📦' },
  Shipping: { color: '#10B981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: '🚚' },
};

/* Keywords per category */
const categoryKeywords: Record<Category, string[]> = {
  Billing: ['invoice', 'invoice', 'billing', 'charge', 'charged', 'pay', 'payment', 'refund', 'billing', 'overcharge', 'undercharge', 'bill', 'price', 'pricing', 'receipt', 'transaction', 'fee', 'fees', 'cost', 'billing problem'],
  Product: ['product', 'broken', 'defective', 'quality', 'warranty', 'return', 'exchange', 'damaged', 'missing', 'wrong item', 'defect', 'not working', 'malfunction', 'feature request'],
  Shipping: ['deliver', 'delay', 'late', 'tracking', 'shipped', 'shipment', 'arrive', 'arrival', 'not delivered', 'lost package', 'missing delivery', 'tracking', 'carrier', 'courier', 'delivery', 'undelivered', 'order not arrived'],
};

function classifyMessage(text: string): Category {
  const lower = text.toLowerCase();
  let best: Category = 'Shipping';
  let bestCount = 0;
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    const count = keywords.filter(kw => lower.includes(kw)).length;
    if (count > bestCount) {
      bestCount = count;
      best = cat as Category;
    }
  }
  return bestCount > 0 ? best : 'Shipping';
}

export default function Hero() {
  const [demoMessage, setDemoMessage] = useState('My order has not been delivered yet.');
  const [classification, setClassification] = useState<Category>('Shipping');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setClassification(classifyMessage(demoMessage));
    }, 300);
    return () => clearTimeout(timer);
  }, [demoMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDemoMessage(e.target.value);
  };

  const presets = [
    'I need a refund for the overcharge on my last order #4521',
    'The product arrived damaged, I need a replacement',
    'Where is my order? The tracking shows nothing updated',
  ];

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative pt-24 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
      {/* Warm golden background glow */}
      <div className="absolute top-0 left-1/4 w-[60vw] h-[40vw] bg-amber-400/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[50vw] h-[35vw] bg-violet-400/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] bg-teal-400/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">

          {/* LEFT: Text */}
          <div className="reveal transition-all duration-1000 ease-out">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight text-gray-900">
              <span className="block">AI That Sorts Your</span>
              <span className="block mt-2 bg-gradient-to-r from-amber-500 via-violet-500 to-teal-500 bg-clip-text text-transparent">
                Support Tickets
              </span>
            </h1>

            <p className="mt-6 text-lg text-gray-600 max-w-xl leading-relaxed">
              Every message classified, prioritized, and routed — before it reaches your team.
              Built for businesses that refuse to let good tickets get lost.
            </p>

            {/* Interactive demo box */}
            <div className="mt-8 bg-white border border-gray-200 rounded-2xl shadow-lg shadow-gray-200/50 p-6 max-w-lg">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Try it out &mdash; type a support message</h3>
              <input
                ref={inputRef}
                type="text"
                value={demoMessage}
                onChange={handleInputChange}
                placeholder="e.g. My order has not been delivered..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all placeholder-gray-400"
              />
              {/* Preset chips */}
              <div className="mt-3 flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => { setDemoMessage(preset); inputRef.current?.focus(); }}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all"
                  >
                    {preset.length > 42 ? preset.slice(0, 42) + '...' : preset}
                  </button>
                ))}
              </div>
              {/* Classification result */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm text-gray-500">AI Classification:</span>
                <Badge
                  variant="outline"
                  className={`${classification === 'Billing' ? 'bg-amber-50 text-amber-700 border-amber-200' : classification === 'Product' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'} text-sm px-3 py-1 rounded-full border`}
                >
                  <span className="mr-1">{classification === 'Billing' ? '💰' : classification === 'Product' ? '📦' : '🚚'}</span>
                  {classification}
                </Badge>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all">
                  Start Free
                </Button>
              </Link>
              <Button size="lg" variant="outline" onClick={scrollToHowItWorks} className="w-full sm:w-auto border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 shadow-sm">
                See How It Works →
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-gray-500 font-medium">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                Real-time Classification
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                Multi-Sector AI
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-400" />
                Zero Setup Required
              </div>
            </div>
          </div>

          {/* RIGHT: Stats highlight card */}
          <div className="reveal transition-all duration-1000 delay-300 ease-out relative">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-200/40 p-8 space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Why teams choose SevaKAI</h3>
                <p className="text-sm text-gray-500 mt-1">AI-powered triage that actually works</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Accuracy', value: '97.3%', color: 'from-amber-400 to-amber-600', textColor: 'text-amber-600' },
                  { label: 'Speed', value: '0.2s', color: 'from-violet-400 to-violet-600', textColor: 'text-violet-600' },
                  { label: 'Tickets', value: '1.2M+', color: 'from-teal-400 to-teal-600', textColor: 'text-teal-600' },
                  { label: 'Sectors', value: '14', color: 'from-pink-400 to-pink-600', textColor: 'text-pink-600' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 text-center">
                    <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
