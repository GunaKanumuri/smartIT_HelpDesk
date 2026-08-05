'use client'

import { Brain, Shield, BarChart3, Users, Cpu, Globe, Code, Bell, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const features = [
  { icon: Brain, title: "Instant Classification", description: "Messages sorted by AI the moment they arrive." },
  { icon: Shield, title: "Smart Escalation", description: "Critical issues routed to the right person, every time." },
  { icon: BarChart3, title: "Live Analytics", description: "Track patterns, spot trends, measure what matters." },
  { icon: Users, title: "Team Management", description: "Assign roles, manage access, stay in control." },
  { icon: Cpu, title: "Custom AI Training", description: "Train models on your data for pinpoint accuracy." },
  { icon: Globe, title: "Multi-Sector", description: "Pre-tuned for bakeries, SaaS, plumbing, and more." },
  { icon: Code, title: "Easy Integration", description: "One line embed. REST API. Direct links." },
  { icon: Bell, title: "Smart Alerts", description: "Get notified when tickets need attention." },
  { icon: Lock, title: "Secure by Default", description: "Your data stays yours. Always." }
];

export default function Features() {
  return (
    <section id="features" className="py-24 relative z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="reveal opacity-0 translate-y-10 transition-all duration-700 ease-out text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Built Different</h2>
          <p className="text-xl text-gray-400">Everything you need to transform support chaos into clarity.</p>
        </div>

        <div className="stagger-children grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="reveal opacity-0 translate-y-10 transition-all duration-500 ease-out" style={{ transitionDelay: `${index * 100}ms` }}>
              <Card variant="glass" hover={true} glow={true} className="h-full p-6 border-white/5 bg-white/5 backdrop-blur-sm relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0FA4AF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-[#0FA4AF]/50 group-hover:shadow-[0_0_15px_rgba(15,164,175,0.3)] transition-all duration-300">
                    <feature.icon className="w-6 h-6 text-[#0FA4AF]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed flex-grow">{feature.description}</p>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
