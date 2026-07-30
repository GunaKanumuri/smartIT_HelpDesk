'use client'

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-white/10 pt-16 pb-8 relative z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block mb-6">
              <span className="font-display font-bold text-2xl tracking-wide flex items-center">
                <span className="text-[#0FA4AF]">Seva</span>
                <span className="text-[#E8E4DC]">KAI</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              AI-powered support triage platform. Classify, prioritize, and resolve faster.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Product</h4>
            <ul className="space-y-4">
              <li><a href="#features" className="text-sm text-gray-400 hover:text-[#0FA4AF] transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-sm text-gray-400 hover:text-[#0FA4AF] transition-colors">Pricing</a></li>
              <li><a href="#industries" className="text-sm text-gray-400 hover:text-[#0FA4AF] transition-colors">Industries</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Company</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-sm text-gray-400 hover:text-[#0FA4AF] transition-colors">About</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-[#0FA4AF] transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Legal</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-sm text-gray-400 hover:text-[#0FA4AF] transition-colors">Privacy</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-[#0FA4AF] transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600">
            © 2024 SevaKAI. All rights reserved.
          </p>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            Built with AI by Guna Kanumuri
          </p>
        </div>
        
      </div>
    </footer>
  );
}
