'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Ticket as TicketIcon, Clock, AlertTriangle, Users as UsersIcon, ArrowRight, BrainCircuit,
  Activity,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import StatsCard from '@/components/admin/StatsCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton';
import { getDashboardStats, getTickets, TICKETS_KEY } from '@/lib/api';
import type { DashboardStats, Ticket } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import useSWR from 'swr';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Use SWR for shared, cached ticket fetching
  const { data: ticketsData, error: ticketsError, isLoading: ticketsLoading } = useSWR<Ticket[]>(TICKETS_KEY, getTickets, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const recentTickets = ticketsData ? ticketsData.slice(0, 5) : [];

  // Build daily ticket volume trend (last 14 days)
  const trendData = (() => {
    if (!ticketsData?.length) return [];
    const now = new Date();
    const days: { date: string; label: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const full = d.toISOString().slice(0, 10);
      days.push({ date: full, label: key, count: 0 });
    }
    ticketsData.forEach((t) => {
      const dayKey = t.created_at.slice(0, 10);
      const slot = days.find((d) => d.date === dayKey);
      if (slot) slot.count += 1;
    });
    return days;
  })();

  useEffect(() => {
    async function loadStats() {
      try {
        const statsData = await getDashboardStats();
        setStats(statsData);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, []);

  const loading = statsLoading || ticketsLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonCard className="h-32" />
          <SkeletonCard className="h-32" />
          <SkeletonCard className="h-32" />
          <SkeletonCard className="h-32" />
        </div>
        <SkeletonTable rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Overview</h2>
          <p className="text-slate-400 mt-1">Here's what's happening in your workspace today.</p>
        </div>
        
        {stats?.avg_confidence && (
          <div className="flex items-center gap-2 bg-svk-accent/10 text-svk-accent px-4 py-2 rounded-lg border border-svk-accent/20">
            <BrainCircuit size={18} />
            <span className="font-semibold">Model Confidence: {Math.round(stats.avg_confidence * 100)}%</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Tickets"
          value={stats?.total_tickets || 0}
          icon={<TicketIcon size={24} />}
          color="accent"
        />
        <StatsCard
          title="Open Tickets"
          value={stats?.open_tickets || 0}
          icon={<Clock size={24} />}
          color="warning"
        />
        <StatsCard
          title="High Urgency"
          value={stats?.high_urgency || 0}
          icon={<AlertTriangle size={24} />}
          color="danger"
        />
        <StatsCard
          title="Team Members"
          value={stats?.total_users || 0}
          icon={<UsersIcon size={24} />}
          color="info"
        />
      </div>

      <Card className="bg-admin-surface border-white/[0.06] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity size={20} className="text-svk-accent" /> Ticket Volume Trend
            </h3>
            <p className="text-sm text-slate-400">Daily incoming tickets over the last 14 days</p>
          </div>
        </div>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#151A2D', borderColor: '#ffffff10', color: '#fff', borderRadius: '8px' }}
                itemStyle={{ color: '#2DD4BF' }}
                cursor={{ stroke: '#2DD4BF', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area type="monotone" dataKey="count" stroke="#2DD4BF" strokeWidth={2} fillOpacity={1} fill="url(#ticketGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Recent Tickets</h3>
          <Link 
            href="/dashboard/tickets" 
            className="text-sm text-svk-accent hover:text-svk-accent/80 flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight size={16} />
          </Link>
        </div>
        
        <Card className="bg-admin-surface border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-black/20 border-b border-white/[0.06]">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">Issue</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No recent tickets found.
                    </td>
                  </tr>
                ) : (
                  recentTickets.map((ticket) => (
                    <tr 
                      key={ticket.ticket_id} 
                      className="border-b border-white/[0.02] last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-slate-400">
                        {ticket.ticket_id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium line-clamp-1">{ticket.issue_description}</div>
                        <div className="text-slate-500 text-xs mt-1">{ticket.user_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="default" className="text-slate-300 border-white/10">
                          {ticket.category || 'Uncategorized'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {ticket.status === 'open' && <Badge variant="info">Open</Badge>}
                        {ticket.status === 'in_progress' && <Badge variant="warning">In Progress</Badge>}
                        {ticket.status === 'resolved' && <Badge variant="success">Resolved</Badge>}
                        {ticket.status === 'closed' && <Badge variant="default">Closed</Badge>}
                      </td>
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                        {formatRelativeTime(ticket.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
