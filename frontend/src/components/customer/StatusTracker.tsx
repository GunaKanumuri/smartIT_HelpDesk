'use client'

import React from 'react';
import { CheckCircle2, CircleDot } from 'lucide-react';

const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];

export default function StatusTracker({ currentStatus }: { currentStatus: string }) {
  const currentIndex = statuses.findIndex(s => s.toLowerCase() === currentStatus.toLowerCase());
  // fallback if status not found
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full z-0"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#10B981] rounded-full z-0 transition-all duration-500"
          style={{ width: `${(activeIndex / (statuses.length - 1)) * 100}%` }}
        ></div>
        
        {statuses.map((status, index) => {
          const isCompleted = index < activeIndex;
          const isCurrent = index === activeIndex;
          
          return (
            <div key={status} className="relative z-10 flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isCompleted ? 'bg-[#10B981] text-white' : 
                  isCurrent ? 'bg-[#0FA4AF] text-white shadow-[0_0_0_4px_rgba(15,164,175,0.2)]' : 
                  'bg-slate-200 text-slate-400'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <CircleDot className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />}
              </div>
              <span className={`absolute top-10 text-xs font-medium w-24 text-center ${
                isCurrent ? 'text-[#0FA4AF]' : 
                isCompleted ? 'text-[#10B981]' : 
                'text-[#94A3B8]'
              }`}>
                {status}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-10"></div>
    </div>
  );
}
