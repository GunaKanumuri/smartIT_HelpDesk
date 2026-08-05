'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300",
      isScrolled ? "bg-landing-bg/80 backdrop-blur-md border-b border-white/10 shadow-lg" : "bg-transparent"
    )}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-display font-bold text-xl tracking-wide flex items-center">
                <span className="text-[#0FA4AF] drop-shadow-[0_0_8px_rgba(15,164,175,0.5)]">Seva</span>
                <span className="text-[#E8E4DC]">KAI</span>
              </span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <button onClick={() => scrollTo('features')} className="text-gray-300 hover:text-white transition-colors">Features</button>
              <button onClick={() => scrollTo('how-it-works')} className="text-gray-300 hover:text-white transition-colors">How It Works</button>
              <button onClick={() => scrollTo('industries')} className="text-gray-300 hover:text-white transition-colors">Industries</button>
              <button onClick={() => scrollTo('pricing')} className="text-gray-300 hover:text-white transition-colors">Pricing</button>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/signup">
              <Button variant="primary" className="bg-[#0FA4AF] hover:bg-[#0FA4AF]/90 text-white shadow-[0_0_15px_rgba(15,164,175,0.4)] transition-all hover:shadow-[0_0_25px_rgba(15,164,175,0.6)]">
                Get Started
              </Button>
            </Link>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-white p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <div className={cn(
        "fixed inset-y-0 right-0 w-64 bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-white/10 p-6 transform transition-transform duration-300 ease-in-out z-40 md:hidden",
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col space-y-6 mt-16">
          <button onClick={() => scrollTo('features')} className="text-left text-lg text-gray-300 hover:text-white transition-colors">Features</button>
          <button onClick={() => scrollTo('how-it-works')} className="text-left text-lg text-gray-300 hover:text-white transition-colors">How It Works</button>
          <button onClick={() => scrollTo('industries')} className="text-left text-lg text-gray-300 hover:text-white transition-colors">Industries</button>
          <button onClick={() => scrollTo('pricing')} className="text-left text-lg text-gray-300 hover:text-white transition-colors">Pricing</button>
          <div className="pt-6 border-t border-white/10">
            <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full bg-[#0FA4AF] hover:bg-[#0FA4AF]/90 text-white">Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
