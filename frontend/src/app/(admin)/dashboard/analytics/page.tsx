'use client';

import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { getTickets } from '@/lib/api';
import type { Ticket } from '@/types';

export default function AnalyticsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getTickets();
        setTickets(data);
      } catch (error) {
        console.error('Failed to load tickets for analytics:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 h-full flex flex-col">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Analytics</h2>
          <p className="text-slate-400 mt-1">Insights into your IT support operations.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
          <SkeletonCard className="h-[400px]" />
          <SkeletonCard className="h-[400px]" />
        </div>
      </div>
    );
  }

  // Process data for charts
  const categoryCount: Record<string, number> = {};
  const urgencyCount = { high: 0, medium: 0, low: 0, none: 0 };
  let totalConfidence = 0;
  let confidenceCount = 0;

  tickets.forEach(ticket => {
    // Category distribution
    const cat = ticket.category || 'Uncategorized';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;

    // Urgency breakdown
    if (ticket.urgency === 'high') urgencyCount.high++;
    else if (ticket.urgency === 'medium') urgencyCount.medium++;
    else if (ticket.urgency === 'low') urgencyCount.low++;
    else urgencyCount.none++;

    // Confidence average
    if (ticket.confidence !== null && ticket.confidence !== undefined) {
      totalConfidence += ticket.confidence;
      confidenceCount++;
    }
  });

  const categoryData = Object.entries(categoryCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 categories

  const urgencyData = [
    { name: 'High', value: urgencyCount.high, color: '#ef4444' }, // danger
    { name: 'Medium', value: urgencyCount.medium, color: '#eab308' }, // warning
    { name: 'Low', value: urgencyCount.low, color: '#22c55e' }, // success
  ].filter(d => d.value > 0);
  
  if (urgencyCount.none > 0) {
    urgencyData.push({ name: 'Unassigned', value: urgencyCount.none, color: '#64748b' });
  }

  const avgConfidence = confidenceCount > 0 ? (totalConfidence / confidenceCount) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Analytics</h2>
        <p className="text-slate-400 mt-1">Insights into your IT support operations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-admin-surface border-white/[0.06] p-6 col-span-1 flex flex-col justify-center items-center text-center">
          <p className="text-slate-400 font-medium mb-2">Average AI Confidence</p>
          <div className="text-5xl font-bold text-svk-accent mb-2">
            {Math.round(avgConfidence)}%
          </div>
          <p className="text-xs text-slate-500">Based on {confidenceCount} categorized tickets</p>
        </Card>
        
        <Card className="bg-admin-surface border-white/[0.06] p-6 col-span-1 md:col-span-2">
           <h3 className="text-lg font-medium text-white mb-4">Ticket Volume Summary</h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-black/20 rounded-lg p-4">
               <p className="text-xs text-slate-400 mb-1">Total</p>
               <p className="text-2xl font-semibold text-white">{tickets.length}</p>
             </div>
             <div className="bg-black/20 rounded-lg p-4">
               <p className="text-xs text-slate-400 mb-1">Resolved</p>
               <p className="text-2xl font-semibold text-emerald-400">
                 {tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}
               </p>
             </div>
             <div className="bg-black/20 rounded-lg p-4">
               <p className="text-xs text-slate-400 mb-1">Open</p>
               <p className="text-2xl font-semibold text-blue-400">
                 {tickets.filter(t => t.status === 'open').length}
               </p>
             </div>
             <div className="bg-black/20 rounded-lg p-4">
               <p className="text-xs text-slate-400 mb-1">High Urgency</p>
               <p className="text-2xl font-semibold text-red-400">
                 {urgencyCount.high}
               </p>
             </div>
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-admin-surface border-white/[0.06] p-6">
          <h3 className="text-lg font-medium text-white mb-6">Top Categories</h3>
          <div className="h-[300px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#151A2D', borderColor: '#ffffff10', color: '#fff', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: '#ffffff05' }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">No category data available</div>
            )}
          </div>
        </Card>

        <Card className="bg-admin-surface border-white/[0.06] p-6">
          <h3 className="text-lg font-medium text-white mb-6">Urgency Breakdown</h3>
          <div className="h-[300px]">
            {urgencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={urgencyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {urgencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#151A2D', borderColor: '#ffffff10', color: '#fff', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">No urgency data available</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
