'use client'

import React, { useEffect, useState } from 'react';
import { getWorkspaceInfo, submitTicket } from '@/lib/api';
import BrandedHeader from '@/components/customer/BrandedHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function SubmitPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [workspaceInfo, setWorkspaceInfo] = useState<any>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchWorkspace() {
      try {
        const info = await getWorkspaceInfo(slug);
        setWorkspaceInfo(info);
      } catch (err) {
        console.error(err);
        setWorkspaceInfo(null);
      } finally {
        setLoadingWorkspace(false);
      }
    }
    fetchWorkspace();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.length < 20) {
      setError('Message must be at least 20 characters.');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const res = await submitTicket({ workspace: slug, name, email, message });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setMessage('');
  };

  if (loadingWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0FA4AF]" />
      </div>
    );
  }

  if (!workspaceInfo) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center mt-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[#1E293B]">Workspace Not Found</h2>
        <p className="text-[#94A3B8] mt-2">The support portal you are looking for does not exist.</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <BrandedHeader workspaceName={workspaceInfo.name} sectorName={workspaceInfo.sector_name} />
        
        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden border-t-4 border-t-[#10B981]">
          <CardContent className="pt-8 pb-8 text-center px-8">
            <CheckCircle className="w-16 h-16 text-[#10B981] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#1E293B] mb-2">Request Submitted</h2>
            <p className="text-[#94A3B8] mb-6">Your ticket has been received and classified by our AI.</p>
            
            <div className="bg-[#F8FAFC] rounded-lg p-6 mb-8 border border-slate-100">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <p className="text-sm text-[#94A3B8] mb-1">Ticket ID</p>
                  <p className="font-mono font-bold text-lg text-[#1E293B]">{result.ticket_id || result.existing_ticket_id}</p>
                </div>
                <div className="flex gap-2">
                  {result.category && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{result.category}</Badge>
                  )}
                  {result.urgency && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">{result.urgency}</Badge>
                  )}
                </div>
              </div>
              
              {result.duplicate && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded flex items-start text-left">
                  <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                  <p>This appears to be a duplicate of an existing request. We've linked it to the original ticket.</p>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/status/${slug}?ticket=${result.ticket_id || result.existing_ticket_id}`}>
                <Button className="w-full sm:w-auto bg-[#0FA4AF] hover:bg-[#0d8c96] text-white">
                  Check Status
                </Button>
              </Link>
              <Button variant="outline" onClick={resetForm} className="w-full sm:w-auto border-slate-200 text-[#1E293B] hover:bg-slate-50">
                Submit Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <BrandedHeader workspaceName={workspaceInfo.name} sectorName={workspaceInfo.sector_name} />
      
      <Card className="bg-white border border-slate-200 shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-[#1E293B] mb-6">How can we help you?</h2>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2 text-left">
                <label className="text-sm font-medium text-[#1E293B]">Full Name</label>
                <Input 
                  required 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Jane Doe"
                  className="bg-white border-slate-200 text-[#1E293B] focus:border-[#0FA4AF] focus:ring-[#0FA4AF]/20 placeholder:text-[#94A3B8]"
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-sm font-medium text-[#1E293B]">Email Address</label>
                <Input 
                  required 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="jane@example.com"
                  className="bg-white border-slate-200 text-[#1E293B] focus:border-[#0FA4AF] focus:ring-[#0FA4AF]/20 placeholder:text-[#94A3B8]"
                />
              </div>
            </div>
            
            <div className="space-y-2 text-left">
              <label className="text-sm font-medium text-[#1E293B]">Message</label>
              <Textarea 
                required 
                value={message} 
                onChange={e => setMessage(e.target.value)} 
                placeholder="Describe your issue in detail..."
                className="min-h-[150px] bg-white border-slate-200 text-[#1E293B] focus:border-[#0FA4AF] focus:ring-[#0FA4AF]/20 placeholder:text-[#94A3B8]"
              />
              <p className="text-xs text-[#94A3B8] text-right">{message.length}/20 min chars</p>
            </div>
            
            <Button 
              type="submit" 
              disabled={submitting} 
              className="w-full bg-[#0FA4AF] hover:bg-[#0d8c96] text-white font-medium py-2.5 h-auto transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                </>
              ) : 'Submit Request'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
