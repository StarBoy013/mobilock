'use client';

import { useState } from 'react';
import type { PassApplication } from '@/types';
import ApplicationTable from '@/components/admin/ApplicationTable';
import ApplicationDetail from '@/components/admin/ApplicationDetail';

export default function ApplicationsPage() {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-text-primary">Application Moderation</h1>
        <p className="text-xs text-text-muted mt-0.5">Review and approve student pass requests</p>
      </div>

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
    </div>
  );
}
