'use client';

import type { PassApplication } from '@/types';
import { CheckCircle2, Clock, XCircle, FileText, Upload } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function ApplicationTracker({ application }: { application: PassApplication }) {
  const steps = [
    { id: 'submitted', label: 'Application Submitted', completed: true, icon: FileText, date: application.createdAt },
    { id: 'review', label: 'Under Review', completed: application.status !== 'pending', active: application.status === 'pending', icon: Clock },
    { 
      id: 'final', 
      label: application.status === 'rejected' ? 'Application Rejected' : 'Approved & Pass Generated', 
      completed: application.status !== 'pending', 
      icon: application.status === 'rejected' ? XCircle : CheckCircle2,
      isError: application.status === 'rejected',
      date: application.reviewedAt
    }
  ];

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute left-4 top-5 bottom-5 w-px bg-border-subtle" />

        <div className="space-y-8 relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex gap-4">
                <div className={cn(
                  "relative w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors",
                  step.completed && !step.isError ? "bg-tertiary/20 text-tertiary border border-tertiary/30" : 
                  step.isError ? "bg-danger/20 text-danger border border-danger/30" :
                  step.active ? "bg-primary/20 text-primary border border-primary/30 animate-pulse-glow" : 
                  "bg-bg-elevated text-text-muted border border-border-subtle"
                )}>
                  <Icon size={14} />
                </div>
                
                <div className="flex-1 pt-1.5">
                  <h4 className={cn(
                    "text-sm font-medium",
                    step.completed && !step.isError ? "text-text-primary" :
                    step.isError ? "text-danger" :
                    step.active ? "text-primary" : "text-text-muted"
                  )}>
                    {step.label}
                  </h4>
                  {step.date && (
                    <p className="text-[10px] font-mono text-text-muted mt-1">{formatDate(step.date)}</p>
                  )}
                  
                  {/* Rejection Note */}
                  {step.id === 'final' && step.isError && application.reviewNote && (
                    <div className="mt-3 p-3 bg-danger/5 border border-danger/20 rounded-lg">
                      <p className="text-xs text-danger mb-2 font-medium">Reviewer Note:</p>
                      <p className="text-xs text-text-secondary leading-relaxed">{application.reviewNote}</p>
                      <Link 
                        href="/student/apply"
                        className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-text-primary bg-bg-elevated hover:bg-bg-base px-3 py-1.5 rounded-md border border-border-subtle transition-colors"
                      >
                        <Upload size={12} /> Resubmit Documents
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
