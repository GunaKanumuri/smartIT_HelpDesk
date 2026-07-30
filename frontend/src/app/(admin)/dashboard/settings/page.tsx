'use client';

import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Mail, Copy, Check, Terminal, ExternalLink, Code2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { getEscalations, setEscalationEmail } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Escalation } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

export default function SettingsPage() {
  const { workspace } = useAuth();
  const { addToast } = useToast();
  
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  useEffect(() => {
    if (workspace?.escalation_email) {
      setEmailInput(workspace.escalation_email);
    }
  }, [workspace]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getEscalations();
        setEscalations(data);
      } catch (error) {
        console.error('Failed to load escalations:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveEmail = async () => {
    setIsSaving(true);
    try {
      await setEscalationEmail(emailInput || null);
      addToast('Escalation email updated', 'success');
      // Note: In a real app, we might need to refresh the workspace auth context here
    } catch (error) {
      addToast('Failed to update email', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  if (!workspace) return <SkeletonCard className="h-screen" />;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sevakai.com';
  const directLink = `${origin}/submit/${workspace.slug}`;
  const embedCode = `<script src="${origin}/widget.js" data-workspace="${workspace.slug}"></script>`;
  const curlCode = `curl -X POST ${origin}/api/v1/tickets \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"issue": "Cannot connect to VPN", "email": "user@example.com"}'`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="text-svk-accent" /> Workspace Settings
        </h2>
        <p className="text-slate-400 mt-1">Configure your IT support environment and integrations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - General Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-admin-surface border-white/[0.06] p-6">
            <h3 className="text-lg font-medium text-white mb-4">Workspace Profile</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Workspace Name</label>
                <div className="text-white font-medium bg-black/20 p-2.5 rounded-lg border border-white/5">
                  {workspace.name}
                </div>
              </div>
              
              <div>
                <label className="text-xs text-slate-500 block mb-1">URL Slug</label>
                <div className="text-slate-300 font-mono text-sm bg-black/20 p-2.5 rounded-lg border border-white/5">
                  {workspace.slug}
                </div>
              </div>
              
              <div>
                <label className="text-xs text-slate-500 block mb-1">Sector</label>
                <Badge variant="outline" className="text-slate-300 border-white/10 capitalize">
                  {workspace.sector || 'N/A'}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="bg-admin-surface border-white/[0.06] p-6">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Mail size={18} className="text-svk-accent" /> Escalate to Human
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              When the AI cannot classify a ticket or when urgency is critical, send an immediate notification to this email address.
            </p>
            
            <div className="space-y-3">
              <Input 
                type="email"
                placeholder="support-team@company.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="bg-black/20 w-full"
              />
              <Button 
                variant="primary" 
                className="w-full"
                onClick={handleSaveEmail}
                disabled={isSaving || emailInput === workspace.escalation_email}
              >
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column - Integrations */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-admin-surface border-white/[0.06] p-6">
            <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
              <Code2 size={20} className="text-svk-accent" /> Integration Snippets
            </h3>
            
            <div className="space-y-6">
              {/* Direct Link */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex justify-between mb-2">
                  <span>Direct Submission Portal Link</span>
                  <a href={directLink} target="_blank" rel="noopener noreferrer" className="text-svk-accent text-xs flex items-center gap-1 hover:underline">
                    Test Link <ExternalLink size={12} />
                  </a>
                </label>
                <div className="relative group">
                  <pre className="bg-black/40 p-4 rounded-lg border border-white/10 text-emerald-400 font-mono text-sm overflow-x-auto">
                    {directLink}
                  </pre>
                  <button 
                    onClick={() => handleCopy(directLink, 'link')}
                    className="absolute top-2 right-2 p-2 rounded-md bg-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
                  >
                    {copiedSection === 'link' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Embed Code */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Website Embed Widget
                </label>
                <div className="relative group">
                  <pre className="bg-black/40 p-4 rounded-lg border border-white/10 text-blue-400 font-mono text-sm overflow-x-auto">
                    {embedCode}
                  </pre>
                  <button 
                    onClick={() => handleCopy(embedCode, 'embed')}
                    className="absolute top-2 right-2 p-2 rounded-md bg-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
                  >
                    {copiedSection === 'embed' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* REST API */}
              <div>
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2">
                  <Terminal size={16} /> REST API (cURL)
                </label>
                <div className="relative group">
                  <pre className="bg-black/40 p-4 rounded-lg border border-white/10 text-pink-400 font-mono text-sm overflow-x-auto">
                    {curlCode}
                  </pre>
                  <button 
                    onClick={() => handleCopy(curlCode, 'api')}
                    className="absolute top-2 right-2 p-2 rounded-md bg-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
                  >
                    {copiedSection === 'api' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Escalation History */}
      <Card className="bg-admin-surface border-white/[0.06] overflow-hidden">
        <div className="p-6 border-b border-white/[0.06]">
          <h3 className="text-lg font-medium text-white">Recent Escalations</h3>
          <p className="text-sm text-slate-400 mt-1">Tickets that required human intervention.</p>
        </div>
        
        {loading ? (
          <div className="p-6"><SkeletonTable rows={3} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-black/20 border-b border-white/[0.06]">
                <tr>
                  <th className="px-6 py-4 font-semibold">Ticket ID</th>
                  <th className="px-6 py-4 font-semibold">Time</th>
                  <th className="px-6 py-4 font-semibold">Reason</th>
                  <th className="px-6 py-4 font-semibold">Recipient</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {escalations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No escalations recorded yet.
                    </td>
                  </tr>
                ) : (
                  escalations.map((esc, i) => (
                    <tr key={i} className="border-b border-white/[0.02] last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-400">
                        {esc.ticket_id?.slice(0, 8) || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                        {formatRelativeTime(esc.created_at)}
                      </td>
                      <td className="px-6 py-4 text-white">
                        {esc.reason}
                        {esc.detail && <span className="block text-xs text-slate-500 mt-1 truncate max-w-xs">{esc.detail}</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {esc.recipient}
                      </td>
                      <td className="px-6 py-4">
                        {esc.status === 'sent' && <Badge variant="success">Sent</Badge>}
                        {esc.status === 'failed' && <Badge variant="danger">Failed</Badge>}
                        {esc.status === 'pending' && <Badge variant="warning">Pending</Badge>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
