'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRoutes } from '@/hooks/queries';
import { UploadCloud, CheckCircle2, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { submitPassApplication } from '@/lib/supabase/actions';

export default function ApplyPage() {
  const router = useRouter();
  const { data: routes } = useRoutes();
  const [step, setStep] = useState(1);
  const [routePreference, setRoutePreference] = useState('');
  const [idUploaded, setIdUploaded] = useState(false);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSimulatedUpload = (setter: (v: boolean) => void) => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: 'Uploading document...',
        success: () => {
          setter(true);
          return 'Document uploaded successfully';
        },
        error: 'Upload failed'
      }
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await submitPassApplication(routePreference);
      if (res.success) {
        toast.success('Application submitted successfully!');
        router.push('/student/dashboard');
      } else {
        toast.error(res.error || 'Failed to submit application');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Apply for Pass</h1>
        <p className="text-xs text-text-muted mt-0.5">Submit your documents for review</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-col items-center gap-2 z-10">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
              step > s ? "bg-tertiary text-bg-base" :
              step === s ? "bg-primary text-white glow-primary" : "bg-bg-surface text-text-muted border border-border-subtle"
            )}>
              {step > s ? <CheckCircle2 size={16} /> : s}
            </div>
            <span className="text-[10px] text-text-muted font-medium">
              {s === 1 ? 'Details' : s === 2 ? 'Documents' : 'Review'}
            </span>
          </div>
        ))}
        {/* Connecting line */}
        <div className="absolute left-10 right-10 h-[2px] bg-bg-surface -z-10" style={{ top: '6.5rem' }}>
          <div 
            className="h-full bg-primary transition-all duration-500" 
            style={{ width: `${((step - 1) / 2) * 100}%` }} 
          />
        </div>
      </div>

      {/* Form Steps */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-sm font-semibold text-text-primary">Route Preference</h3>
            <p className="text-xs text-text-secondary">Select the route you intend to travel on.</p>
            
            <div className="space-y-1.5">
              <label className="text-xs text-text-secondary">Preferred Route</label>
              <select 
                value={routePreference}
                onChange={e => setRoutePreference(e.target.value)}
                className="w-full h-11 px-3 bg-bg-base border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary/50"
              >
                <option value="">Select a route</option>
                {routes.filter(r => r.isActive).map(r => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={() => setStep(2)}
              disabled={!routePreference}
              className="w-full h-11 bg-primary text-white rounded-lg font-medium shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 mt-6"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Upload Documents</h3>
              <p className="text-xs text-text-secondary mt-1">Clear photos or PDF scans max 5MB.</p>
            </div>
            
            <div className="space-y-4">
              {/* ID Upload */}
              <div 
                onClick={() => !idUploaded && handleSimulatedUpload(setIdUploaded)}
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-colors",
                  idUploaded ? "border-tertiary/50 bg-tertiary/5" : "border-border-subtle hover:border-primary/50 hover:bg-bg-elevated cursor-pointer"
                )}
              >
                {idUploaded ? (
                  <CheckCircle2 size={28} className="text-tertiary" />
                ) : (
                  <ImageIcon size={28} className="text-text-muted" />
                )}
                <div className="text-center">
                  <p className="text-sm font-medium text-text-primary">University ID Card</p>
                  <p className="text-xs text-text-muted mt-1">{idUploaded ? 'Uploaded successfully' : 'Tap to select file'}</p>
                </div>
              </div>

              {/* Receipt Upload */}
              <div 
                onClick={() => !receiptUploaded && handleSimulatedUpload(setReceiptUploaded)}
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-colors",
                  receiptUploaded ? "border-tertiary/50 bg-tertiary/5" : "border-border-subtle hover:border-primary/50 hover:bg-bg-elevated cursor-pointer"
                )}
              >
                {receiptUploaded ? (
                  <CheckCircle2 size={28} className="text-tertiary" />
                ) : (
                  <FileText size={28} className="text-text-muted" />
                )}
                <div className="text-center">
                  <p className="text-sm font-medium text-text-primary">Transport Fee Receipt</p>
                  <p className="text-xs text-text-muted mt-1">{receiptUploaded ? 'Uploaded successfully' : 'Tap to select file'}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setStep(1)}
                className="w-1/3 h-11 bg-bg-elevated text-text-primary rounded-lg font-medium transition-colors hover:bg-bg-surface"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(3)}
                disabled={!idUploaded || !receiptUploaded}
                className="flex-1 h-11 bg-primary text-white rounded-lg font-medium shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                Review Application
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-sm font-semibold text-text-primary">Review & Submit</h3>
            
            <div className="space-y-3 bg-bg-base p-4 rounded-lg border border-border-subtle">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Route Preference</span>
                <span className="text-text-primary font-medium">{routes.find(r => r._id === routePreference)?.name}</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-border-subtle">
                <span className="text-text-muted">University ID</span>
                <span className="text-tertiary flex items-center gap-1"><CheckCircle2 size={12}/> Attached</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-border-subtle">
                <span className="text-text-muted">Fee Receipt</span>
                <span className="text-tertiary flex items-center gap-1"><CheckCircle2 size={12}/> Attached</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setStep(2)}
                disabled={isSubmitting}
                className="w-1/3 h-11 bg-bg-elevated text-text-primary rounded-lg font-medium transition-colors hover:bg-bg-surface disabled:opacity-50"
              >
                Back
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 h-11 bg-primary text-white rounded-lg font-medium flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><UploadCloud size={16} /> Submit Application</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
