'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Cta() {
  return (
    <section className="py-32 relative z-10 w-full bg-gradient-to-t from-black/40 to-transparent border-t border-white/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto reveal opacity-0 translate-y-10 transition-all duration-700 ease-out">
          
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 text-white tracking-tight">
            Ready to stop losing tickets?
          </h2>
          
          <p className="text-xl text-gray-400 mb-10">
            Join businesses that resolved support chaos with AI.
          </p>
          
          <Link href="/signup">
            <Button size="lg" className="bg-gradient-to-r from-[#0FA4AF] to-[#0c8a93] hover:from-[#0c8a93] hover:to-[#0a7078] text-white px-10 py-6 text-lg rounded-full shadow-[0_0_30px_rgba(15,164,175,0.4)] hover:shadow-[0_0_50px_rgba(15,164,175,0.6)] transition-all transform hover:scale-105">
              Get Started — It's Free
            </Button>
          </Link>
          
        </div>
      </div>
    </section>
  );
}
