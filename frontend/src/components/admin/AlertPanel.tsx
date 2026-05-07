'use client';

import type { SystemAlert } from '@/types';
import { AlertTriangle, AlertCircle, Info, Shield } from 'lucide-react';
import { cn, formatTimestamp, getAlertColor } from '@/lib/utils';

const severityIcons = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const severityBg = {
  critical: 'bg-danger/5',
  warning: 'bg-warning/5',
  info: 'bg-info/5',
};

export default function AlertPanel({ alerts }: { alerts: SystemAlert[] }) {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary">System Alerts</h3>
        </div>
        <span className="text-[10px] font-mono text-text-muted px-2 py-0.5 bg-bg-elevated rounded-full">
          {alerts.length} events
        </span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-border-subtle">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <Shield size={24} className="mb-2 text-tertiary" />
            <p className="text-xs">No system alerts</p>
          </div>
        ) : (
          alerts.map((alert, i) => {
            const Icon = severityIcons[alert.severity];
            return (
              <div
                key={alert.id}
                className={cn(
                  'flex gap-3 p-3 border-l-2 animate-fade-in',
                  getAlertColor(alert.severity),
                  severityBg[alert.severity]
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Icon size={14} className="shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-primary leading-relaxed">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-text-muted">
                      {formatTimestamp(alert.timestamp)}
                    </span>
                    {alert.source && (
                      <span className="text-[10px] text-text-muted bg-bg-elevated px-1.5 py-0.5 rounded">
                        {alert.source}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
