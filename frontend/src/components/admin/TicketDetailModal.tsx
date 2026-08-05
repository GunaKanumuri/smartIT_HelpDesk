'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { X, Save, Clock, User, Tag, AlertTriangle, MessageSquare, BrainCircuit } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { updateTicket } from '@/lib/api';
import type { Ticket } from '@/types';

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  onUpdated: (ticket: Ticket) => void;
}

export default function TicketDetailModal({ isOpen, onClose, ticket, onUpdated }: TicketDetailModalProps) {
  const [status, setStatus] = useState(ticket.status);
  const [actionTaken, setActionTaken] = useState(ticket.action_taken || '');
  const [reassignedTo, setReassignedTo] = useState(ticket.reassigned_to || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const updated = await updateTicket(ticket.ticket_id, {
        status,
        action_taken: actionTaken,
        reassigned_to: reassignedTo || undefined,
        updated_by: 'Admin' // Should use actual user name/ID in real app
      });
      
      onUpdated(updated);
      toast('Ticket updated', 'success');
      onClose();
    } catch (error) {
      console.error('Failed to update ticket:', error);
      toast('Failed to update ticket', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyBadge = (urgency: string | null) => {
    if (urgency === 'high') return <Badge variant="danger">High Urgency</Badge>;
    if (urgency === 'medium') return <Badge variant="warning">Medium Urgency</Badge>;
    if (urgency === 'low') return <Badge variant="success">Low Urgency</Badge>;
    return null;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'open') return <Badge variant="info">Open</Badge>;
    if (status === 'in_progress') return <Badge variant="warning">In Progress</Badge>;
    if (status === 'resolved') return <Badge variant="success">Resolved</Badge>;
    if (status === 'closed') return <Badge variant="default">Closed</Badge>;
    return null;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Ticket #${ticket.ticket_id.slice(0, 8)}`} size="lg">
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex flex-wrap gap-2 items-center pb-4 border-b border-white/10">
          {getStatusBadge(ticket.status)}
          {getUrgencyBadge(ticket.urgency)}
          <div className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
            <Clock size={14} />
            Created {formatDate(ticket.created_at)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2 mb-2">
                <MessageSquare size={16} /> Issue Description
              </h3>
              <div className="bg-black/20 p-4 rounded-lg border border-white/5 text-white whitespace-pre-wrap">
                {ticket.issue_description}
              </div>
            </div>

            <div className="bg-svk-accent/5 p-4 rounded-lg border border-svk-accent/20">
              <h3 className="text-sm font-medium text-svk-accent flex items-center gap-2 mb-3">
                <BrainCircuit size={16} /> AI Analysis
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Predicted Category</p>
                  <p className="font-medium text-white">{ticket.category || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Confidence</p>
                  <p className="font-medium text-white">
                    {ticket.confidence ? `${Math.round(ticket.confidence * 100)}%` : 'N/A'}
                  </p>
                </div>
                {ticket.secondary_category && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Secondary Category</p>
                    <p className="font-medium text-slate-300">{ticket.secondary_category}</p>
                  </div>
                )}
                {ticket.raw_category && ticket.raw_category !== ticket.category && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Raw Intent</p>
                    <p className="font-medium text-slate-300">{ticket.raw_category}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Meta & Actions */}
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2 mb-2">
                <User size={16} /> User Details
              </h3>
              <div className="text-sm">
                <p className="text-white break-all">{ticket.user_email}</p>
                <p className="text-slate-500 text-xs mt-1">ID: {ticket.user_id || 'Anonymous'}</p>
              </div>
            </div>
            
            {ticket.duplicate_count > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} className="text-yellow-500" /> Duplicates
                </h3>
                <p className="text-sm text-slate-300">
                  {ticket.duplicate_count} similar requests
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-white/10 space-y-4">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Update Ticket</h3>
              
              <div>
                <label className="text-xs text-slate-500 block mb-1">Status</label>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-black/20"
                  options={[
                    { value: 'open', label: 'Open' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'resolved', label: 'Resolved' },
                    { value: 'closed', label: 'Closed' },
                  ]}
                />
              </div>
              
              <div>
                <label className="text-xs text-slate-500 block mb-1">Reassign To (Email)</label>
                <Input 
                  placeholder="agent@example.com"
                  value={reassignedTo}
                  onChange={(e) => setReassignedTo(e.target.value)}
                  className="bg-black/20"
                />
              </div>
              
              <div>
                <label className="text-xs text-slate-500 block mb-1">Action Taken / Notes</label>
                <Textarea 
                  placeholder="What was done to resolve this?"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  className="bg-black/20 min-h-[100px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSave} 
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
