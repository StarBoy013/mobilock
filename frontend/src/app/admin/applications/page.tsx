'use client';

import { useState } from 'react';
import type { PassApplication } from '@/types';
import ApplicationTable from '@/components/admin/ApplicationTable';
import ApplicationDetail from '@/components/admin/ApplicationDetail';
import { useApplications, useRenewalRequests } from '@/hooks/queries';
import { updateRenewalRequestStatus } from '@/lib/supabase/actions';
import { cn, formatDate, getStatusBg } from '@/lib/utils';
import { CalendarClock, XCircle, Check, Hourglass, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState<'applications' | 'renewals'>('applications');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedRenewalId, setSelectedRenewalId] = useState<string | null>(null);

  // Fetch pending counts for badges
  const { data: pendingApps } = useApplications({ status: 'pending' });
  const { data: pendingRenewals } = useRenewalRequests({ status: 'pending' });

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Header & Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between shrink-0 gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Operations Moderation</h1>
          <p className="text-xs text-text-muted mt-0.5">Review student pass applications and extension requests</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-bg-surface border border-border-subtle p-1 rounded-xl w-fit">
          <button
            onClick={() => {
              setActiveTab('applications');
              setSelectedAppId(null);
            }}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all",
              activeTab === 'applications'
                ? "bg-primary text-white shadow"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            Pass Applications
            {pendingApps.length > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                activeTab === 'applications' ? "bg-white text-primary" : "bg-primary text-white"
              )}>
                {pendingApps.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => {
              setActiveTab('renewals');
              setSelectedRenewalId(null);
            }}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all",
              activeTab === 'renewals'
                ? "bg-primary text-white shadow"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            Renewal Requests
            {pendingRenewals.length > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                activeTab === 'renewals' ? "bg-white text-primary" : "bg-primary text-white"
              )}>
                {pendingRenewals.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'applications' ? (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          {/* Table Panel */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden flex flex-col">
            <ApplicationTable 
              selectedId={selectedAppId} 
              onSelect={setSelectedAppId} 
            />
          </div>

          {/* Detail Panel */}
          {selectedAppId ? (
            <ApplicationDetail 
              applicationId={selectedAppId} 
              onClose={() => setSelectedAppId(null)} 
            />
          ) : (
            <div className="bg-bg-surface border border-border-subtle rounded-xl hidden lg:flex flex-col items-center justify-center text-text-muted">
              <p className="text-sm">Select an application to review</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          {/* Renewals Table */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden flex flex-col">
            <RenewalRequestTable
              selectedId={selectedRenewalId}
              onSelect={setSelectedRenewalId}
            />
          </div>

          {/* Renewals Detail Panel */}
          {selectedRenewalId ? (
            <RenewalRequestDetail
              requestId={selectedRenewalId}
              onClose={() => setSelectedRenewalId(null)}
            />
          ) : (
            <div className="bg-bg-surface border border-border-subtle rounded-xl hidden lg:flex flex-col items-center justify-center text-text-muted">
              <p className="text-sm">Select a renewal request to review</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================
   Helper Subcomponents: RenewalRequestTable
   ========================================== */
function RenewalRequestTable({
  selectedId,
  onSelect
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { data: renewals, isLoading } = useRenewalRequests();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-bg-surface border-b border-border-subtle z-10">
          <tr>
            <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-3">Student</th>
            <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-3">Current Route & Bus</th>
            <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-3">Pass Code</th>
            <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {renewals.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-12 text-text-muted text-sm">
                No renewal requests found
              </td>
            </tr>
          ) : (
            renewals.map((req) => (
              <tr
                key={req._id}
                onClick={() => onSelect(req._id)}
                className={cn(
                  "border-b border-border-subtle last:border-0 hover:bg-primary/[0.02] transition-colors cursor-pointer group",
                  selectedId === req._id && "bg-primary/[0.04]"
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
                      {req.studentName}
                    </span>
                    <span className="text-xs font-mono text-text-secondary mt-0.5">
                      {req.studentUniversityId}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-text-primary truncate max-w-[200px]">
                      {req.routeName}
                    </span>
                    <span className="text-xs font-mono font-bold text-primary mt-0.5">
                      {req.busNumber}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                  {req.manualCode}
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', getStatusBg(req.status))}>
                    {req.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ==========================================
   Helper Subcomponents: RenewalRequestDetail
   ========================================== */
function RenewalRequestDetail({
  requestId,
  onClose
}: {
  requestId: string;
  onClose: () => void;
}) {
  const { data: renewals } = useRenewalRequests();
  const req = renewals.find(r => r._id === requestId);
  const [reviewNote, setReviewNote] = useState(req?.reviewNote || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!req) return null;

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !reviewNote.trim()) {
      toast.error('Remarks/notes are required to reject a renewal.');
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await updateRenewalRequestStatus(requestId, status, reviewNote.trim());
      if (res.success) {
        toast.success(status === 'approved' ? 'Renewal approved and pass extended!' : 'Renewal rejected successfully');
        onClose();
      } else {
        toast.error(res.error || 'Failed to update renewal request');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update renewal request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl flex flex-col h-full lg:sticky lg:top-6 animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <CalendarClock size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Renewal Details</h3>
        </div>
        <button 
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Student details */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs uppercase tracking-wider text-text-muted font-medium">Student Info</h4>
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', getStatusBg(req.status))}>
              {req.status.toUpperCase()}
            </span>
          </div>
          <div className="bg-bg-base rounded-lg p-3 border border-border-subtle">
            <p className="text-sm font-medium text-text-primary">{req.studentName}</p>
            <p className="text-xs font-mono text-text-secondary mt-1">{req.studentUniversityId}</p>
            <p className="text-xs text-text-muted mt-2">Requested: {formatDate(req.createdAt)}</p>
          </div>
        </div>

        {/* Current Pass Information */}
        <div>
          <h4 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-3">Current Pass Configuration</h4>
          <div className="bg-bg-base rounded-lg p-3 border border-border-subtle space-y-2.5">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Pass Code</span>
              <span className="font-mono font-bold text-text-primary">{req.manualCode}</span>
            </div>
            <div className="flex justify-between text-xs pt-2 border-t border-border-subtle">
              <span className="text-text-muted">Assigned Route</span>
              <span className="text-text-primary font-medium text-right truncate max-w-[200px]">{req.routeName}</span>
            </div>
            <div className="flex justify-between text-xs pt-2 border-t border-border-subtle">
              <span className="text-text-muted">Assigned Bus</span>
              <span className="font-mono text-primary font-bold">{req.busNumber}</span>
            </div>
          </div>
        </div>

        {/* Review Note */}
        <div className="space-y-1.5">
          <label className="text-xs text-text-secondary">Review Remarks</label>
          <textarea 
            value={reviewNote}
            onChange={e => setReviewNote(e.target.value)}
            disabled={req.status !== 'pending'}
            placeholder="Add comments or rejection remarks here..."
            className="w-full h-24 p-3 bg-bg-base border border-border-subtle rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 resize-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Actions */}
      {req.status === 'pending' && (
        <div className="p-4 border-t border-border-subtle grid grid-cols-2 gap-3 shrink-0 bg-bg-surface/50 backdrop-blur">
          <button 
            onClick={() => handleAction('rejected')}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 h-10 bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <XCircle size={16} /> Reject
          </button>
          <button 
            onClick={() => handleAction('approved')}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 h-10 bg-tertiary/10 text-tertiary border border-tertiary/20 hover:bg-tertiary/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Check size={16} /> Approve
          </button>
        </div>
      )}
    </div>
  );
}
