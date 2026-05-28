'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useMyPass, useMyRenewalRequest } from '@/hooks/queries';
import PassCard from '@/components/student/PassCard';
import { ShieldAlert, RefreshCcw, CalendarClock, Hourglass, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { requestPassRenewal } from '@/lib/supabase/actions';
import { daysUntil } from '@/lib/utils';

export default function PassPage() {
  const { user } = useAuthStore();
  const { data: pass } = useMyPass(user?._id || '');
  const { data: renewalRequest } = useMyRenewalRequest(pass?._id || '');
  const [isRenewing, setIsRenewing] = useState(false);

  const handleRenewalRequest = async () => {
    if (!pass) return;
    setIsRenewing(true);

    try {
      const res = await requestPassRenewal(pass._id);
      if (res.success) {
        toast.success('Renewal request submitted successfully!');
      } else {
        toast.error(res.error || 'Failed to submit renewal request.');
      }
    } catch (err: any) {
      console.error('Failed to request renewal:', err);
      toast.error(err.message || 'Failed to submit renewal request.');
    } finally {
      setIsRenewing(false);
    }
  };

  const daysLeft = pass ? daysUntil(pass.expiresAt) : 0;
  const isEligibleForRenewal = pass && (pass.status === 'expired' || daysLeft <= 30);

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Digital Pass</h1>
          <p className="text-xs text-text-muted mt-0.5">Your active access card</p>
        </div>
      </div>

      {pass ? (
        <div className="flex flex-col items-center space-y-4">
          <PassCard pass={pass} />
          
          {/* Renewal Status Tracker / Button */}
          <div className="w-full max-w-sm p-4 bg-bg-surface border border-border-subtle rounded-xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">Pass Renewal</p>
                <p className="text-[10px] text-text-muted mt-0.5">Extend pass validity by 6 months</p>
              </div>
              
              {renewalRequest ? (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                  renewalRequest.status === 'pending' ? 'bg-warning/10 border-warning/20 text-warning' :
                  renewalRequest.status === 'approved' ? 'bg-success/10 border-success/20 text-success' :
                  'bg-danger/10 border-danger/20 text-danger'
                }`}>
                  {renewalRequest.status === 'pending' && <Hourglass size={10} />}
                  {renewalRequest.status === 'approved' && <CheckCircle size={10} />}
                  {renewalRequest.status.toUpperCase()}
                </span>
              ) : (
                <span className="text-[10px] text-text-muted font-mono">
                  {isEligibleForRenewal ? 'ELIGIBLE' : 'LOCKED'}
                </span>
              )}
            </div>

            {/* If there is a pending request */}
            {renewalRequest && renewalRequest.status === 'pending' && (
              <div className="p-3 bg-warning/5 border border-warning/10 rounded-lg text-xs text-warning flex items-start gap-2">
                <Hourglass size={14} className="shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <p className="font-semibold">Request Under Review</p>
                  <p className="text-[10px] opacity-80 mt-0.5">Your renewal request was submitted on {new Date(renewalRequest.created_at).toLocaleDateString()} and is pending operations review.</p>
                </div>
              </div>
            )}

            {/* If eligible and no pending request */}
            {isEligibleForRenewal && (!renewalRequest || renewalRequest.status !== 'pending') && (
              <button
                onClick={handleRenewalRequest}
                disabled={isRenewing}
                className="w-full h-10 bg-primary text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:bg-primary/95 transition-all disabled:opacity-50"
              >
                {isRenewing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <CalendarClock size={14} />
                    Submit Renewal Request
                  </>
                )}
              </button>
            )}

            {/* If NOT eligible for renewal yet */}
            {!isEligibleForRenewal && (
              <p className="text-[10px] text-text-muted text-center pt-1 font-mono">
                Renewal requests unlock 30 days before expiry date.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 text-center flex flex-col items-center mt-10">
          <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mb-4">
            <ShieldAlert size={24} className="text-danger" />
          </div>
          <h2 className="text-base font-semibold text-text-primary mb-2">No Active Pass Found</h2>
          <p className="text-xs text-text-secondary mb-6 max-w-[250px]">
            You do not currently have a valid pass. If you have applied, please check the dashboard for application status.
          </p>
          <Link 
            href="/student/apply"
            className="w-full flex items-center justify-center h-11 bg-primary text-white rounded-lg font-medium"
          >
            Apply for Pass
          </Link>
        </div>
      )}
    </div>
  );
}
