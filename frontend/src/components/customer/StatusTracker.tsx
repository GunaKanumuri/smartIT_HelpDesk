'use client'

import React from 'react';
import { CheckCircle2, CircleDot } from 'lucide-react';

const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];

export default function StatusTracker({ currentStatus }: { currentStatus: string }) {
  const currentIndex = statuses.findIndex(s => s.toLowerCase() === currentStatus.toLowerCase());
  // fallback if status not found
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;
  const progress = (activeIndex / (statuses.length - 1)) * 100;

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-200 rounded-full z-0"></div>
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-[#10B981] rounded-full z-0 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        ></div>

        {statuses.map((status, index) => {
          const isCompleted = index < activeIndex;
          const isCurrent = index === activeIndex;

          return (
            <div key={status} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isCompleted ? 'bg-[#10B981] text-white' :
                  isCurrent ? 'bg-[#0FA4AF] text-white shadow-[0_0_0_4px_rgba(15,164,175,0.25)] ring-2 ring-[#0FA4AF]/40' :
                  'bg-slate-200 text-slate-400'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <CircleDot className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />}
              </div>
              <span className={`absolute top-10 text-xs font-medium w-24 text-center ${
                isCurrent ? 'text-[#0FA4AF] font-semibold' :
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

      {/* Status description */}
      <div className="text-center mt-2">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F0F9FF] border border-[#BAE6FD] text-[#0369A1] text-xs font-medium">
          <CircleDot className="w-3.5 h-3.5" />
          {activeIndex === 0 && 'Your ticket is awaiting review.'}
          {activeIndex === 1 && 'A support agent is working on your ticket.'}
          {activeIndex === 2 && 'Your issue has been resolved.'}
          {activeIndex === 3 && 'This ticket has been closed.'}
        </span>
      </div>
    </div>
  );
}
