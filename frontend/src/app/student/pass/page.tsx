'use client';

import { useAuthStore } from '@/store/authStore';
import { useMyPass } from '@/hooks/queries';
import PassCard from '@/components/student/PassCard';
import { ShieldAlert, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export default function PassPage() {
  const { user } = useAuthStore();
  const { data: pass } = useMyPass(user?._id || '');

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Digital Pass</h1>
          <p className="text-xs text-text-muted mt-0.5">Your active access card</p>
        </div>
        {pass && (
          <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-surface border border-border-subtle text-text-secondary hover:text-primary transition-colors">
            <RefreshCcw size={14} />
          </button>
        )}
      </div>

      {pass ? (
        <div className="flex flex-col items-center">
          <PassCard pass={pass} />
          
          <div className="w-full max-w-sm mt-6 p-4 bg-bg-surface border border-border-subtle rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Auto-Renewal</p>
              <p className="text-[10px] text-text-muted mt-0.5">Automatically apply before expiry</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked={pass.autoRenew} />
              <div className="w-9 h-5 bg-bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"></div>
            </label>
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
