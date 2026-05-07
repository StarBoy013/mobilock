'use client';

import { useAuthStore } from '@/store/authStore';
import { useMyPass, useMyApplication } from '@/hooks/queries';
import PassCard from '@/components/student/PassCard';
import ApplicationTracker from '@/components/student/ApplicationTracker';
import Link from 'next/link';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const { data: pass } = useMyPass(user?._id || '');
  const { data: app } = useMyApplication(user?._id || '');

  return (
    <div className="p-4 space-y-6">
      <div className="mb-2">
        <h1 className="text-xl font-bold text-text-primary">Welcome, {user?.name?.split(' ')[0]}</h1>
        <p className="text-xs text-text-muted mt-1 font-mono">ID: {user?.universityId}</p>
      </div>

      {pass ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Active Pass</h2>
            <Link href="/student/pass" className="text-xs text-primary hover:underline flex items-center gap-1">
              View details <ArrowRight size={12} />
            </Link>
          </div>
          <PassCard pass={pass} />
        </div>
      ) : app ? (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">Application Status</h2>
          <ApplicationTracker application={app} />
        </div>
      ) : (
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mb-4">
            <ShieldAlert size={24} className="text-warning" />
          </div>
          <h2 className="text-base font-semibold text-text-primary mb-2">No Active Pass</h2>
          <p className="text-xs text-text-secondary mb-6 max-w-[250px]">
            You need a valid transport pass to board university buses.
          </p>
          <Link 
            href="/student/apply"
            className="w-full flex items-center justify-center h-11 bg-primary text-white rounded-lg font-medium shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-transform hover:scale-[1.02]"
          >
            Apply for Pass
          </Link>
        </div>
      )}
    </div>
  );
}
