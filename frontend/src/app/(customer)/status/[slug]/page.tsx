'use client'

import React, { useEffect, useState, Suspense } from 'react';
import { getTicketStatus } from '@/lib/api';
import BrandedHeader from '@/components/customer/BrandedHeader';
import StatusTracker from '@/components/customer/StatusTracker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Search } from 'lucide-react';

function StatusContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ticketParam = searchParams?.get('ticket') || '';
  
  const [ticketId, setTicketId] = useState(ticketParam || '');
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStatus = async (id: string) => {
    if (!id) return;
    
    setLoading(true);
    setError('');
    
    try {
      const data = await getTicketStatus(slug, id);
      setStatusData(data);
    } catch (err: any) {
      setError(err.message || 'Ticket not found. Please check your ID and try again.');
      setStatusData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketParam) {
      fetchStatus(ticketParam);
    }
  }, [ticketParam, slug]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketId) {
      router.push(`/status/${slug}?ticket=${ticketId}`);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <BrandedHeader 
        workspaceName={statusData?.workspace_name || slug} 
        sectorName={statusData ? undefined : 'Support Portal'} 
      />
      
      {!statusData && (
        <Card className="bg-white border border-slate-200 shadow-sm mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-[#1E293B] mb-4">Check Ticket Status</h2>
            <form onSubmit={handleSearch} className="flex gap-3">
              <Input 
                value={ticketId}
                onChange={e => setTicketId(e.target.value)}
                placeholder="Enter Ticket ID (e.g. TKT-1234)"
                className="bg-white border-slate-200 text-[#1E293B] focus:border-[#0FA4AF] focus:ring-[#0FA4AF]/20"
              />
              <Button type="submit" disabled={!ticketId || loading} className="bg-[#0FA4AF] hover:bg-[#0d8c96] text-white shrink-0">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                {loading ? '' : 'Lookup'}
              </Button>
            </form>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {statusData && (
        <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <div>
              <p className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider mb-1">Ticket ID</p>
              <h3 className="text-xl font-bold font-mono text-[#1E293B]">{statusData.ticket_id}</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider mb-1">Created</p>
              <p className="text-sm font-medium text-[#1E293B]">
                {new Date(statusData.created_at).toLocaleDateString(undefined, { 
                  month: 'short', day: 'numeric', year: 'numeric' 
                })}
              </p>
            </div>
          </div>
          
          <CardContent className="p-6 sm:p-8">
            <div className="mb-10">
              <StatusTracker currentStatus={statusData.status} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
              <div>
                <p className="text-sm text-[#94A3B8] mb-2">Category</p>
                <Badge variant="default" className="bg-slate-50 text-slate-700 border-slate-200">
                  {statusData.category || 'Uncategorized'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-[#94A3B8] mb-2">Urgency</p>
                <Badge variant="default" className={`
                  ${statusData.urgency?.toLowerCase() === 'high' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                  ${statusData.urgency?.toLowerCase() === 'medium' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                  ${statusData.urgency?.toLowerCase() === 'low' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                  ${!statusData.urgency ? 'bg-slate-50 text-slate-700 border-slate-200' : ''}
                `}>
                  {statusData.urgency || 'Normal'}
                </Badge>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setStatusData(null);
                  router.push(`/status/${slug}`);
                }}
                className="text-[#94A3B8] hover:text-[#1E293B]"
              >
                Lookup another ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function StatusPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0FA4AF]" />
      </div>
    }>
      <StatusContent slug={params.slug} />
    </Suspense>
  );
}
