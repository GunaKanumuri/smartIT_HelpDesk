'use client';

import { useEffect, useState } from 'react';
import { Plus, MoreVertical, Trash2, Shield, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import AddMemberModal from '@/components/admin/AddMemberModal';
import { getTeam, updateTeamMember, removeTeamMember } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { WorkspaceUser } from '@/types';

export default function TeamPage() {
  const [members, setMembers] = useState<WorkspaceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { addToast } = useToast();
  const { workspace } = useAuth();
  
  // Active dropdown state
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Convert any numeric IDs to strings for consistency
  const safeMembers = members.map(m => ({
    ...m,
    id: String(m.id)
  }));

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const data = await getTeam();
      setMembers(data);
    } catch (error) {
      console.error('Failed to load team:', error);
      addToast({ title: 'Failed to load team', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleMemberAdded = (newMember: WorkspaceUser) => {
    setMembers(prev => [...prev, newMember]);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean | number) => {
    setActiveDropdown(null);
    const boolStatus = Boolean(currentStatus);
    try {
      await updateTeamMember(String(id), { is_active: !boolStatus });
      setMembers(prev => prev.map(m => m.id === id ? { ...m, is_active: !boolStatus } : m));
      addToast(`Member ${!boolStatus ? 'activated' : 'deactivated'}`, 'success');
    } catch (error) {
      addToast('Failed to update member status', 'error');
    }
  };

  const handleToggleRole = async (id: string, currentRole: string) => {
    setActiveDropdown(null);
    const newRole = currentRole === 'admin' ? 'agent' : 'admin';
    try {
      await updateTeamMember(String(id), { role: newRole });
      setMembers(prev => prev.map(m => m.id === id ? { ...m, role: newRole } : m));
      addToast({ title: `Role changed to ${newRole}`, type: 'success' });
    } catch (error) {
      addToast({ title: 'Failed to update member role', type: 'error' });
    }
  };

  const handleRemove = async (id: string) => {
    setActiveDropdown(null);
    if (!confirm('Are you sure you want to remove this member? This action cannot be undone.')) return;

    try {
      await removeTeamMember(String(id));
      setMembers(prev => prev.filter(m => m.id !== id));
      addToast({ title: 'Member removed', type: 'success' });
    } catch (error) {
      addToast({ title: 'Failed to remove member', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col" onClick={() => setActiveDropdown(null)}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Team Management</h2>
          <p className="text-slate-400 mt-1">Manage who has access to {workspace?.name || 'this workspace'}.</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add Member
        </Button>
      </div>

      <Card className="bg-admin-surface border-white/[0.06] flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-4"><SkeletonTable rows={5} /></div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-black/20 border-b border-white/[0.06]">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Joined</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {safeMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No team members found.
                    </td>
                  </tr>
                ) : (
                  safeMembers.map((member) => (
                    <tr 
                      key={member.id} 
                      className="border-b border-white/[0.02] last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-medium shrink-0">
                            {(member.display_name || member.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-white font-medium">{member.display_name || 'No Name'}</div>
                            <div className="text-slate-400 text-xs">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={member.role === 'admin' ? 'info' : 'default'}
                          className="flex items-center gap-1 w-max"
                        >
                          {member.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                          <span className="capitalize">{member.role}</span>
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={member.is_active ? 'success' : 'default'}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                        {formatDate(member.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-slate-400 hover:text-white p-1 h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === member.id ? null : member.id);
                          }}
                        >
                          <MoreVertical size={16} />
                        </Button>
                        
                        {activeDropdown === member.id && (
                          <div 
                            className="absolute right-8 top-10 bg-admin-surface border border-white/10 rounded-lg shadow-xl z-10 w-40 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button 
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors"
                              onClick={() => handleToggleRole(member.id, member.role)}
                            >
                              Make {member.role === 'admin' ? 'Agent' : 'Admin'}
                            </button>
                            <button 
                              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors"
                              onClick={() => handleToggleActive(member.id, member.is_active)}
                            >
                              {Boolean(member.is_active) ? 'Deactivate' : 'Activate'}
                            </button>
                            <div className="h-px bg-white/10 my-1"></div>
                            <button 
                              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-between"
                              onClick={() => handleRemove(member.id)}
                            >
                              Remove <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={handleMemberAdded}
      />
    </div>
  );
}
