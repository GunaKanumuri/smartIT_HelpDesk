'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Hero() {
  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          <div className="reveal opacity-0 translate-y-10 transition-all duration-1000 ease-out">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              <span className="block text-white">AI That Sorts Your</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#0FA4AF] to-[#964734] animate-gradient-x">
                Support Tickets
              </span>
            </h1>
            
            <p className="mt-6 text-xl text-gray-400 max-w-2xl leading-relaxed">
              Every message classified, prioritized, and routed — before it reaches your team. Built for businesses that refuse to let good support tickets get lost.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto bg-[#0FA4AF] hover:bg-[#0FA4AF]/90 text-white shadow-[0_0_20px_rgba(15,164,175,0.4)] hover:shadow-[0_0_30px_rgba(15,164,175,0.6)] transition-all">
                  Start Free
                </Button>
              </Link>
              <Button size="lg" variant="outline" onClick={scrollToHowItWorks} className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 backdrop-blur-sm">
                See How It Works
              </Button>
            </div>
            
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 text-sm text-gray-500 font-medium">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#0FA4AF] animate-pulse" />
                Real-time Classification
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#964734]" />
                Multi-Sector AI
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white/50" />
                Zero Setup Required
              </div>
            </div>

            {/* Social proof strip */}
            <div className="mt-12 pt-8 border-t border-white/[0.06]">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex -space-x-2">
                  {['AK', 'JB', 'SR', 'MZ'].map((initials, i) => (
                    <div
                      key={initials}
                      className="w-9 h-9 rounded-full border-2 border-[#0A0E1A] bg-gradient-to-br from-[#0FA4AF]/30 to-[#964734]/30 flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ zIndex: 4 - i }}
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-400">
                  Trusted by <span className="text-white font-semibold">500+</span> support teams
                </p>
              </div>
            </div>
          </div>

          {/* Interactive demo visual */}
          <div className="reveal opacity-0 translate-y-10 transition-all duration-1000 delay-300 ease-out relative h-[400px] lg:h-[500px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 overflow-hidden flex flex-col shadow-[0_0_50px_rgba(15,164,175,0.1)]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0FA4AF]/10 to-transparent pointer-events-none" />
            
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="text-xs text-gray-500 font-mono">AI Triage Engine Active</div>
            </div>

            <div className="flex-grow relative flex gap-6">
              {/* Incoming stream */}
              <div className="w-1/3 border-r border-white/10 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-white/10 rounded-lg animate-[slideDown_3s_linear_infinite]" />
                <div className="absolute top-24 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-white/5 rounded-lg animate-[slideDown_3s_linear_infinite_1s]" />
                <div className="absolute top-48 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-white/10 rounded-lg animate-[slideDown_3s_linear_infinite_2s]" />
              </div>

              {/* AI Processing Node */}
              <div className="absolute left-1/3 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#0FA4AF] blur-xl opacity-40 animate-pulse rounded-full" />
                  <div className="w-16 h-16 bg-gray-900 border border-[#0FA4AF]/50 rounded-2xl flex items-center justify-center relative z-10 shadow-[0_0_15px_rgba(15,164,175,0.5)]">
                    <div className="w-8 h-8 rounded-full border-2 border-t-[#0FA4AF] border-r-[#0FA4AF] border-b-transparent border-l-transparent animate-spin" />
                  </div>
                </div>
              </div>

              {/* Classified outputs */}
              <div className="w-2/3 pl-8 flex flex-col gap-4 justify-center">
                <div className="h-14 bg-red-500/10 border border-red-500/20 rounded-xl relative overflow-hidden flex items-center px-4 gap-3">
                  <div className="w-2 h-8 bg-red-500 rounded-full" />
                  <div className="flex-grow h-2 bg-red-500/20 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 w-full animate-[pulse_2s_ease-in-out_infinite]" />
                  </div>
                </div>
                <div className="h-14 bg-yellow-500/10 border border-yellow-500/20 rounded-xl relative overflow-hidden flex items-center px-4 gap-3">
                  <div className="w-2 h-8 bg-yellow-500 rounded-full" />
                  <div className="flex-grow h-2 bg-yellow-500/20 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 w-3/4 animate-[pulse_3s_ease-in-out_infinite]" />
                  </div>
                </div>
                <div className="h-14 bg-green-500/10 border border-green-500/20 rounded-xl relative overflow-hidden flex items-center px-4 gap-3">
                  <div className="w-2 h-8 bg-green-500 rounded-full" />
                  <div className="flex-grow h-2 bg-green-500/20 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-1/2 animate-[pulse_4s_ease-in-out_infinite]" />
                  </div>
                </div>
              </div>
            </div>
            
            <style jsx>{`
              @keyframes slideDown {
                0% { transform: translate(-50%, -100%); opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 1; }
                100% { transform: translate(-50%, 400px); opacity: 0; }
              }
            `}</style>
          </div>
        </div>
      </div>
    </section>
  );
}
