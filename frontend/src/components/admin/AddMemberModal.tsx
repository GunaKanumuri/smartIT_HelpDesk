'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { addTeamMember } from '@/lib/api';
import type { WorkspaceUser } from '@/types';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (member: WorkspaceUser) => void;
}

export default function AddMemberModal({ isOpen, onClose, onAdded }: AddMemberModalProps) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('agent');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast('Email and password are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const newMember = await addTeamMember({
        email,
        password,
        display_name: displayName,
        role
      });

      onAdded(newMember);
      toast('Member added successfully', 'success');

      // Reset form
      setEmail('');
      setDisplayName('');
      setPassword('');
      setRole('agent');
      onClose();
    } catch (error: any) {
      console.error('Failed to add member:', error);
      toast(error.message || 'An error occurred', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Team Member" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Email Address *</label>
          <Input 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@company.com"
            className="bg-black/20 w-full"
            required
          />
        </div>
        
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Display Name</label>
          <Input 
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="John Doe"
            className="bg-black/20 w-full"
          />
        </div>
        
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Temporary Password *</label>
          <Input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="bg-black/20 w-full"
            required
            minLength={6}
          />
          <p className="text-xs text-slate-500 mt-1">They will need this to log in.</p>
        </div>
        
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-1">Role</label>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-black/20 w-full"
            options={[
              { value: 'agent', label: 'Agent (Can view and manage tickets)' },
              { value: 'admin', label: 'Admin (Full access including settings)' },
            ]}
          />
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <UserPlus size={16} />
            {isSubmitting ? 'Adding...' : 'Add Member'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
