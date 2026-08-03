'use client'

import { Croissant, Utensils, Wrench, ShoppingCart, LayoutTemplate, Stethoscope, Scale, Home, GraduationCap, Car, Dumbbell, Dog, Camera } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const sectors = [
  { name: "Bakery", icon: Croissant },
  { name: "Restaurant", icon: Utensils },
  { name: "Plumbing", icon: Wrench },
  { name: "E-Commerce", icon: ShoppingCart },
  { name: "SaaS", icon: LayoutTemplate },
  { name: "Healthcare", icon: Stethoscope },
  { name: "Legal", icon: Scale },
  { name: "Real Estate", icon: Home },
  { name: "Education", icon: GraduationCap },
  { name: "Automotive", icon: Car },
  { name: "Fitness", icon: Dumbbell },
  { name: "Pet Services", icon: Dog },
  { name: "Photography", icon: Camera }
];

export default function Industries() {
  return (
    <section id="industries" className="py-24 relative z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="reveal transition-all duration-700 ease-out text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Pre-Tuned for Your Sector</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sectors.map((sector, index) => (
            <div key={index} className="reveal opacity-0 translate-y-5 transition-all duration-500 ease-out" style={{ transitionDelay: `${(index % 4) * 100}ms` }}>
              <Card variant="glass" hover={true} glow={true} className="p-6 flex flex-col items-center justify-center gap-4 bg-white/5 border-white/5 hover:border-[#0FA4AF]/30 group cursor-default">
                <sector.icon className="w-8 h-8 text-gray-400 group-hover:text-[#0FA4AF] transition-colors" />
                <span className="text-sm md:text-base font-medium text-gray-300 group-hover:text-white transition-colors text-center">{sector.name}</span>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
