'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'accent' | 'warning' | 'danger' | 'info';
  trend?: string;
}

export default function StatsCard({ title, value, icon, color, trend }: StatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    
    let totalDuration = 1000;
    let incrementTime = (totalDuration / end) || 10;
    if (incrementTime < 10) incrementTime = 10;
    
    const step = Math.max(1, Math.ceil(end / (totalDuration / incrementTime)));
    
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, incrementTime);
    
    return () => clearInterval(timer);
  }, [value]);

  const colorStyles = {
    accent: "bg-svk-accent/10 text-svk-accent",
    warning: "bg-yellow-500/10 text-yellow-500",
    danger: "bg-red-500/10 text-red-500",
    info: "bg-blue-500/10 text-blue-500",
  };

  return (
    <Card className="bg-admin-surface border-white/[0.06] hover:bg-admin-surface-hover hover:border-white/[0.1] transition-all duration-300 group hover:-translate-y-1">
      <div className="p-6 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-white tracking-tight">{displayValue.toLocaleString()}</h3>
            {trend && (
              <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                {trend}
              </span>
            )}
          </div>
        </div>
        <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", colorStyles[color])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
