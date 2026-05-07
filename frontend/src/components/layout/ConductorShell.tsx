'use client';

import { useAuthStore } from '@/store/authStore';
import { LogOut, Bus } from 'lucide-react';
import { mockBuses } from '@/lib/mock-data';

export default function ConductorShell({ children }: { children: React.ReactNode }) {
  const { user, clearAuth } = useAuthStore();
  const assignedBus = mockBuses.find(b => b._id === user?.assignedBus);

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
      {/* Minimal header */}
      <header className="h-12 bg-bg-base/90 backdrop-blur-sm flex items-center justify-between px-4 shrink-0 z-50 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/15 rounded border border-primary/20">
            <Bus size={14} className="text-primary" />
            <span className="text-xs font-mono font-bold text-primary">
              {assignedBus?.busNumber || 'N/A'}
            </span>
          </div>
          <span className="text-xs text-text-secondary truncate max-w-[150px]">
            {assignedBus?.routeName || 'No Route'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted">{user?.name}</span>
          <button onClick={clearAuth} className="text-text-secondary hover:text-danger transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Full screen content */}
      <main className="flex-1 relative overflow-hidden">
        {children}
      </main>
    </div>
  );
}
