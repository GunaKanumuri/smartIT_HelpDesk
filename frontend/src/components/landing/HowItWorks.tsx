'use client'

import { Inbox, Brain, CheckCircle } from 'lucide-react';

const steps = [
  {
    num: "01",
    title: "Intake",
    description: "Customer submits via your branded form, embed widget, or API.",
    icon: Inbox
  },
  {
    num: "02",
    title: "Classify",
    description: "AI instantly categorizes urgency, topic, and routes appropriately.",
    icon: Brain
  },
  {
    num: "03",
    title: "Resolve",
    description: "Your team sees a prioritized queue. No more guessing.",
    icon: CheckCircle
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative z-10 bg-black/20 border-y border-white/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        
        <div className="reveal opacity-0 translate-y-10 transition-all duration-700 ease-out text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">How It Works</h2>
          <p className="text-xl text-gray-400">Three steps to support clarity.</p>
        </div>

        <div className="relative">
          {/* Vertical dashed line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px border-l-2 border-dashed border-white/10 md:-translate-x-px" />

          <div className="space-y-12 md:space-y-24">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              return (
                <div key={index} className="reveal opacity-0 translate-y-10 transition-all duration-700 ease-out relative flex flex-col md:flex-row items-start md:items-center">
                  
                  {/* Timeline node */}
                  <div className="absolute left-8 md:left-1/2 w-16 h-16 -translate-x-1/2 flex items-center justify-center bg-[#0FA4AF] text-white rounded-full font-bold text-xl shadow-[0_0_20px_rgba(15,164,175,0.4)] z-10 border-4 border-[#0a0a0a]">
                    {step.num}
                  </div>

                  {/* Content (Desktop: alternating left/right, Mobile: right of line) */}
                  <div className={`w-full md:w-1/2 pl-24 md:pl-0 ${isEven ? 'md:pr-24 md:text-right' : 'md:pl-24 md:ml-auto'}`}>
                    <div className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors duration-300 relative group overflow-hidden`}>
                       <div className="absolute inset-0 bg-gradient-to-r from-[#0FA4AF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                       <div className={`flex items-center gap-4 mb-4 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                         <div className="p-3 bg-white/5 rounded-xl text-[#0FA4AF]">
                           <step.icon size={24} />
                         </div>
                         <h3 className="text-2xl font-semibold text-white">{step.title}</h3>
                       </div>
                       <p className="text-gray-400 leading-relaxed">{step.description}</p>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
