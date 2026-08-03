'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Ticket as TicketIcon, Clock, AlertTriangle, Users as UsersIcon, ArrowRight, BrainCircuit } from 'lucide-react';
import StatsCard from '@/components/admin/StatsCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton';
import { getDashboardStats, getTickets } from '@/lib/api';
import type { DashboardStats, Ticket } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, ticketsData] = await Promise.all([
          getDashboardStats(),
          getTickets(),
        ]);
        setStats(statsData);
        setRecentTickets(ticketsData.slice(0, 5));
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

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
                        <Badge variant="outline" className="text-slate-300 border-white/10">
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
