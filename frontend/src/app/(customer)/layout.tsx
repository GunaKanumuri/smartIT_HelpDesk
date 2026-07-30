'use client'

import React from 'react';
import Link from 'next/link';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#1E293B]">
      <main className="flex-grow flex flex-col items-center py-12 px-4 sm:px-6">
        {children}
      </main>
      <footer className="mt-auto py-6 border-t border-slate-200 bg-white">
        <div className="text-center text-sm text-[#94A3B8]">
          Powered by{' '}
          <Link href="/" className="font-semibold text-[#1E293B] hover:text-[#0FA4AF] transition-colors">
            Seva<span className="text-[#0FA4AF]">KAI</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
