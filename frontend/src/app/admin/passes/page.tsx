'use client';

import { useState } from 'react';
import { usePasses } from '@/hooks/queries';
import { Search, Filter, QrCode } from 'lucide-react';
import { cn, formatDate, getStatusBg } from '@/lib/utils';
import type { PassStatus } from '@/types';

export default function PassesPage() {
  const [statusFilter, setStatusFilter] = useState<PassStatus | ''>('');
  const [search, setSearch] = useState('');
  
  const { data: passes } = usePasses({ 
    status: statusFilter || undefined, 
    search 
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Pass Monitoring</h1>
          <p className="text-xs text-text-muted mt-0.5">Track and manage active student passes</p>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-xl flex flex-col h-[calc(100vh-10rem)]">
        {/* Toolbar */}
        <div className="p-4 border-b border-border-subtle flex items-center justify-between gap-4 shrink-0">
          <div className="relative w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search student or bus..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-8 pl-9 pr-4 bg-bg-base border border-border-subtle rounded-md text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-text-muted" />
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as PassStatus | '')}
              className="h-8 pl-2 pr-6 bg-bg-base border border-border-subtle rounded-md text-xs text-text-primary focus:outline-none focus:border-primary/50 cursor-pointer appearance-none"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-bg-surface border-b border-border-subtle z-10">
              <tr>
                <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-2.5">Student</th>
                <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-2.5">Route & Bus</th>
                <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-2.5">Issued / Expires</th>
                <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-2.5">Last Scanned</th>
                <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-2.5">Status</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {passes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-muted text-sm">
                    No passes found
                  </td>
                </tr>
              ) : (
                passes.map(pass => (
                  <tr key={pass._id} className="border-b border-border-subtle last:border-0 hover:bg-primary/[0.03] transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
                          {pass.studentName}
                        </span>
                        <span className="text-xs font-mono text-text-secondary mt-0.5">
                          {pass.studentUniversityId}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-text-primary truncate max-w-[200px]">
                          {pass.routeName}
                        </span>
                        <span className="text-xs font-mono font-bold text-primary mt-0.5">
                          {pass.busNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-mono text-text-secondary">{formatDate(pass.issuedAt)}</span>
                        <span className="text-[10px] font-mono text-text-muted">to {formatDate(pass.expiresAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {pass.lastScannedAt ? (
                        <span className="text-xs font-mono text-text-primary">{formatDate(pass.lastScannedAt)}</span>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', getStatusBg(pass.status))}>
                        {pass.status.charAt(0).toUpperCase() + pass.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="w-8 h-8 rounded flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-colors" title="View QR Data">
                        <QrCode size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
