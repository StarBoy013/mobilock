'use client';

import { useState } from 'react';
import { useApplications } from '@/hooks/queries';
import { Search, Filter, Clock } from 'lucide-react';
import { cn, formatDate, getStatusBg } from '@/lib/utils';
import type { ApplicationStatus } from '@/types';

export default function ApplicationTable({ 
  selectedId, 
  onSelect 
}: { 
  selectedId: string | null; 
  onSelect: (id: string) => void; 
}) {
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');
  const [search, setSearch] = useState('');
  
  const { data: apps } = useApplications({ 
    status: statusFilter || undefined, 
    search 
  });

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-4 border-b border-border-subtle flex items-center justify-between gap-4 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-8 pl-9 pr-4 bg-bg-base border border-border-subtle rounded-md text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-text-muted" />
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as ApplicationStatus | '')}
            className="h-8 pl-2 pr-6 bg-bg-base border border-border-subtle rounded-md text-xs text-text-primary focus:outline-none focus:border-primary/50 cursor-pointer appearance-none"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <table className="w-full">
          <thead className="sticky top-0 bg-bg-surface border-b border-border-subtle z-10">
            <tr>
              <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-2.5">Student</th>
              <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-2.5">Date</th>
              <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {apps.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-12 text-text-muted text-sm">
                  No applications found
                </td>
              </tr>
            ) : (
              apps.map(app => (
                <tr 
                  key={app._id}
                  onClick={() => onSelect(app._id)}
                  className={cn(
                    "border-b border-border-subtle last:border-0 cursor-pointer transition-colors group",
                    selectedId === app._id ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-primary/[0.03] border-l-2 border-l-transparent"
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
                        {app.studentName}
                      </span>
                      <span className="text-xs font-mono text-text-secondary">
                        {app.studentUniversityId}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <Clock size={12} />
                      <span className="text-xs font-mono">{formatDate(app.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', getStatusBg(app.status))}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
