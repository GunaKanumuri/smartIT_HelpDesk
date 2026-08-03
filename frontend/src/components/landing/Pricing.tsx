'use client'

import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 relative z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="reveal transition-all duration-700 ease-out text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Simple, Transparent Pricing</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">

          {/* Free Tier */}
          <div className="reveal transition-all duration-500 ease-out h-full">
            <Card variant="glass" className="h-full p-8 border-white/10 bg-white/5 flex flex-col">
              <h3 className="text-xl font-medium text-gray-300 mb-2">Free</h3>
              <div className="text-4xl font-bold text-white mb-2">$0<span className="text-xl text-gray-500 font-normal">/mo</span></div>
              <p className="text-sm text-gray-400 mb-8 h-10">Get started with AI triage</p>
              
              <ul className="space-y-4 mb-8 flex-grow">
                {['Up to 100 tickets/mo', 'AI classification', '1 team member', 'Community support'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className="w-5 h-5 text-[#0FA4AF] shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Link href="/signup" className="mt-auto block">
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/5">Start Free</Button>
              </Link>
            </Card>
          </div>

          {/* Pro Tier */}
          <div className="reveal transition-all duration-500 delay-100 ease-out md:-mt-8 md:-mb-8 relative z-20">
            <Card variant="glass" className="h-full p-8 border-[#0FA4AF]/30 bg-white/10 shadow-[0_0_30px_rgba(15,164,175,0.2)] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#0FA4AF] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
              <div className="absolute inset-0 bg-gradient-to-b from-[#0FA4AF]/10 to-transparent pointer-events-none" />
              
              <div className="relative z-10">
                <h3 className="text-xl font-medium text-[#0FA4AF] mb-2">Pro</h3>
                <div className="text-5xl font-bold text-white mb-2">$49<span className="text-xl text-gray-500 font-normal">/mo</span></div>
                <p className="text-sm text-gray-300 mb-8 h-10">Scale your support</p>
                
                <ul className="space-y-4 mb-8">
                  {['Unlimited tickets', 'Custom AI training', '10 team members', 'Priority support', 'Analytics'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-white">
                      <Check className="w-5 h-5 text-[#0FA4AF] shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Link href="/signup" className="mt-auto block">
                  <Button className="w-full bg-[#0FA4AF] hover:bg-[#0FA4AF]/90 text-white shadow-[0_0_15px_rgba(15,164,175,0.4)]">Get Started</Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Enterprise Tier */}
          <div className="reveal transition-all duration-500 delay-200 ease-out h-full">
            <Card variant="glass" className="h-full p-8 border-white/10 bg-white/5 flex flex-col">
              <h3 className="text-xl font-medium text-gray-300 mb-2">Enterprise</h3>
              <div className="text-4xl font-bold text-white mb-2">Custom</div>
              <p className="text-sm text-gray-400 mb-8 h-10">For large teams</p>
              
              <ul className="space-y-4 mb-8 flex-grow">
                {['Everything in Pro', 'Unlimited team', 'Custom integrations', 'Dedicated support', 'SLA'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="w-5 h-5 text-gray-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Link href="/contact" className="mt-auto block">
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/5">Contact Sales</Button>
              </Link>
            </Card>
          </div>

        </div>
      </div>
    </section>
  );
}
