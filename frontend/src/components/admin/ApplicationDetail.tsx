'use client';

import { useState } from 'react';
import { useApplications, useBuses, useRoutes } from '@/hooks/queries';
import { X, Check, XCircle, FileText, Image as ImageIcon, MapPin, Bus } from 'lucide-react';
import { cn, formatDate, getStatusBg } from '@/lib/utils';
import { toast } from 'sonner';
import { updateApplicationStatus } from '@/lib/supabase/actions';

export default function ApplicationDetail({ 
  applicationId,
  onClose
}: { 
  applicationId: string;
  onClose: () => void;
}) {
  const { data: apps } = useApplications();
  const { data: buses } = useBuses();
  const { data: routes } = useRoutes();
  
  const app = apps.find(a => a._id === applicationId);
  
  const [assignedBus, setAssignedBus] = useState(app?.assignedBus || '');
  const [assignedRoute, setAssignedRoute] = useState(app?.assignedRoute || '');
  const [reviewNote, setReviewNote] = useState(app?.reviewNote || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!app) return null;

  const handleApprove = async () => {
    if (!assignedBus || !assignedRoute) {
      toast.error('Bus and route must be assigned to approve.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await updateApplicationStatus(applicationId, 'approved', assignedBus, assignedRoute, reviewNote);
      if (res.success) {
        toast.success('Application approved successfully');
        onClose();
      } else {
        toast.error(res.error || 'Failed to approve application');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reviewNote.trim()) {
      toast.error('Review note required for rejection.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await updateApplicationStatus(applicationId, 'rejected', undefined, undefined, reviewNote);
      if (res.success) {
        toast.success('Application rejected');
        onClose();
      } else {
        toast.error(res.error || 'Failed to reject application');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl flex flex-col h-full lg:sticky lg:top-6 animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Application Details</h3>
          <p className="text-xs text-text-muted mt-0.5 font-mono">ID: {app._id}</p>
        </div>
        <button 
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Student Info */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs uppercase tracking-wider text-text-muted font-medium">Student Info</h4>
            <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', getStatusBg(app.status))}>
              {app.status.toUpperCase()}
            </span>
          </div>
          <div className="bg-bg-base rounded-lg p-3 border border-border-subtle">
            <p className="text-sm font-medium text-text-primary">{app.studentName}</p>
            <p className="text-xs font-mono text-text-secondary mt-1">{app.studentUniversityId}</p>
            <p className="text-xs text-text-muted mt-2">Applied: {formatDate(app.createdAt)}</p>
          </div>
        </div>

        {/* Documents */}
        <div>
          <h4 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-3">Documents</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="group relative aspect-[4/3] bg-bg-base border border-border-subtle rounded-lg overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
              <ImageIcon size={24} className="text-text-muted mb-2 group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-medium text-text-secondary">University ID</span>
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="group relative aspect-[4/3] bg-bg-base border border-border-subtle rounded-lg overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:primary/50 transition-colors">
              <FileText size={24} className="text-text-muted mb-2 group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-medium text-text-secondary">Fee Receipt</span>
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Assignment (Only if pending or approved) */}
        {app.status !== 'rejected' && (
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-wider text-text-muted font-medium">Assignment</h4>
            
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-text-secondary flex items-center gap-1.5">
                  <MapPin size={12} /> Assign Route
                </label>
                <select 
                  value={assignedRoute}
                  onChange={e => setAssignedRoute(e.target.value)}
                  disabled={app.status !== 'pending'}
                  className="w-full h-9 px-3 bg-bg-base border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary/50 disabled:opacity-50"
                >
                  <option value="">Select Route</option>
                  {routes.filter(r => r.isActive).map(r => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-text-secondary flex items-center gap-1.5">
                  <Bus size={12} /> Assign Bus
                </label>
                <select 
                  value={assignedBus}
                  onChange={e => setAssignedBus(e.target.value)}
                  disabled={app.status !== 'pending'}
                  className="w-full h-9 px-3 bg-bg-base border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary/50 disabled:opacity-50"
                >
                  <option value="">Select Bus</option>
                  {buses.filter(b => b.isActive).map(b => (
                    <option key={b._id} value={b._id}>{b.busNumber} ({b.currentOccupancy}/{b.capacity})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Review Note */}
        <div className="space-y-1.5">
          <label className="text-xs text-text-secondary">Review Note</label>
          <textarea 
            value={reviewNote}
            onChange={e => setReviewNote(e.target.value)}
            disabled={app.status !== 'pending'}
            placeholder="Add a note (required for rejection)"
            className="w-full h-24 p-3 bg-bg-base border border-border-subtle rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 resize-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Actions */}
      {app.status === 'pending' && (
        <div className="p-4 border-t border-border-subtle grid grid-cols-2 gap-3 shrink-0 bg-bg-surface/50 backdrop-blur">
          <button 
            onClick={handleReject}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 h-10 bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <XCircle size={16} /> Reject
          </button>
          <button 
            onClick={handleApprove}
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
