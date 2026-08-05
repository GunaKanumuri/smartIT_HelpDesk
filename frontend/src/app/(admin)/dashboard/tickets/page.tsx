'use client';

import { useState } from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SkeletonTable } from '@/components/ui/Skeleton';
import TicketDetailModal from '@/components/admin/TicketDetailModal';
import { getTickets, TICKETS_KEY } from '@/lib/api';
import type { Ticket } from '@/types';
import { formatDate } from '@/lib/utils';
import useSWR from 'swr';

export default function TicketsPage() {
  const { data: ticketsData, error, isLoading: loading, mutate } = useSWR<Ticket[]>(TICKETS_KEY, getTickets, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const tickets = ticketsData || [];

  // Filtering and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof Ticket>('created_at');
  const [sortDesc, setSortDesc] = useState(true);

  // Modal state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSort = (field: keyof Ticket) => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  const openTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleTicketUpdated = (updatedTicket: Ticket) => {
    const updated = tickets.map(t => t.ticket_id === updatedTicket.ticket_id ? updatedTicket : t);
    mutate(updated, false);
  };

  // Filter and sort logic
  const filteredTickets = tickets
    .filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (urgencyFilter !== 'all' && t.urgency !== urgencyFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          t.ticket_id.toLowerCase().includes(query) ||
          t.issue_description.toLowerCase().includes(query) ||
          t.user_email.toLowerCase().includes(query) ||
          (t.category && t.category.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      
      const comparison = valA < valB ? -1 : 1;
      return sortDesc ? -comparison : comparison;
    });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Tickets</h2>
        <p className="text-slate-400 mt-1">Manage and resolve support requests.</p>
      </div>

      <Card className="bg-admin-surface border-white/[0.06] p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search tickets..." 
            className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-slate-500 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-[140px] bg-black/20 border-white/10 text-white"
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'open', label: 'Open' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' },
            ]}
          />

          <Select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="w-[140px] bg-black/20 border-white/10 text-white"
            options={[
              { value: 'all', label: 'All Urgency' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
          />
        </div>
      </Card>

      <Card className="bg-admin-surface border-white/[0.06] flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-4"><SkeletonTable rows={10} /></div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left relative">
              <thead className="text-xs text-slate-400 uppercase bg-black/20 border-b border-white/[0.06] sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('ticket_id')}>
                    <div className="flex items-center gap-1">ID <ArrowUpDown size={14} /></div>
                  </th>
                  <th className="px-6 py-4 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center gap-1">Created <ArrowUpDown size={14} /></div>
                  </th>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('category')}>
                    <div className="flex items-center gap-1">Category <ArrowUpDown size={14} /></div>
                  </th>
                  <th className="px-6 py-4 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('urgency')}>
                    <div className="flex items-center gap-1">Urgency <ArrowUpDown size={14} /></div>
                  </th>
                  <th className="px-6 py-4 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">Status <ArrowUpDown size={14} /></div>
                  </th>
                  <th className="px-6 py-4 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('confidence')}>
                    <div className="flex items-center gap-1">Confidence <ArrowUpDown size={14} /></div>
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-3">
                        <Filter size={32} className="text-slate-600" />
                        <p>No tickets found matching your filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr 
                      key={ticket.ticket_id} 
                      className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => openTicket(ticket)}
                    >
                      <td className="px-6 py-4 font-mono text-slate-400">
                        {ticket.ticket_id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                        {formatDate(ticket.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium truncate max-w-[150px]">{ticket.user_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-300">{ticket.category || 'Uncategorized'}</span>
                      </td>
                      <td className="px-6 py-4">
                        {ticket.urgency === 'high' && <Badge variant="danger">High</Badge>}
                        {ticket.urgency === 'medium' && <Badge variant="warning">Medium</Badge>}
                        {ticket.urgency === 'low' && <Badge variant="success">Low</Badge>}
                        {!ticket.urgency && <span className="text-slate-500">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        {ticket.status === 'open' && <Badge variant="info">Open</Badge>}
                        {ticket.status === 'in_progress' && <Badge variant="warning">In Progress</Badge>}
                        {ticket.status === 'resolved' && <Badge variant="success">Resolved</Badge>}
                        {ticket.status === 'closed' && <Badge variant="default">Closed</Badge>}
                      </td>
                      <td className="px-6 py-4">
                        {ticket.confidence ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-black/40 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-svk-accent rounded-full" 
                                style={{ width: `${ticket.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400">{Math.round(ticket.confidence * 100)}%</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); openTicket(ticket); }}
                          className="text-slate-400 hover:text-white"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedTicket && (
        <TicketDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          ticket={selectedTicket}
          onUpdated={handleTicketUpdated}
        />
      )}
    </div>
  );
}
