'use client'

import React from 'react';

export default function BrandedHeader({ workspaceName, sectorName }: { workspaceName: string, sectorName?: string }) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8 text-center bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
      <div className="absolute top-2 right-3 text-[10px] text-slate-400 font-medium tracking-wider">
        SevaKAI
      </div>
      <h1 className="text-3xl font-bold text-[#1E293B] mb-2">{workspaceName}</h1>
      {sectorName && (
        <p className="text-[#94A3B8] font-medium tracking-wide uppercase text-sm">{sectorName}</p>
      )}
    </div>
  );
}
