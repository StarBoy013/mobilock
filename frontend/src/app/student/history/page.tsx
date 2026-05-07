'use client';

import { useAuthStore } from '@/store/authStore';
import { useScanHistory } from '@/hooks/queries';
import { History, CheckCircle2, XCircle, MapPin } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

export default function ScanHistoryPage() {
  const { user } = useAuthStore();
  const { data: logs } = useScanHistory(user?._id || '');

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Scan History</h1>
        <p className="text-xs text-text-muted mt-0.5">Recent boarding activity</p>
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex items-center gap-2">
          <History size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Scan Log</h3>
        </div>

        <div className="divide-y divide-border-subtle">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <p className="text-sm">No scan history found</p>
            </div>
          ) : (
            logs.map(log => (
              <div key={log._id} className="p-4 flex items-center gap-4 hover:bg-bg-base/50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${log.result === 'valid' ? 'bg-tertiary/10 text-tertiary' : 'bg-danger/10 text-danger'}`}>
                  {log.result === 'valid' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-text-primary flex items-center gap-1.5">
                      Bus {log.busNumber}
                    </p>
                    <span className="text-[10px] font-mono text-text-muted">{formatTime(log.scannedAt)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-text-secondary flex items-center gap-1">
                      <MapPin size={10} /> {formatDate(log.scannedAt)}
                    </p>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${log.result === 'valid' ? 'text-tertiary' : 'text-danger'}`}>
                      {log.result} {log.reason && `— ${log.reason}`}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
