'use client';

import { Download, Zap } from 'lucide-react';
import KpiModule from '@/components/admin/KpiModule';
import NetworkChart from '@/components/admin/NetworkChart';
import AlertPanel from '@/components/admin/AlertPanel';
import FleetTable from '@/components/admin/FleetTable';
import { useKpis, useAlerts, useScanVolume, useBuses } from '@/hooks/queries';

const kpiColors = ['#3B82F6', '#06B6D4', '#10B981', '#F59E0B'];

export default function AdminDashboard() {
  const { data: kpis } = useKpis();
  const { data: alerts } = useAlerts();
  const { data: scanVolume } = useScanVolume();
  const { data: buses } = useBuses();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Operations Control</h1>
          <p className="text-xs text-text-muted mt-0.5 font-mono">
            LIVE MONITORING — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-bg-surface border border-border-subtle rounded-lg text-xs text-text-secondary hover:text-text-primary hover:border-primary/30 transition-all">
            <Download size={14} />
            Export Logs
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-primary/15 border border-primary/20 rounded-lg text-xs text-primary hover:bg-primary/25 transition-all">
            <Zap size={14} />
            Initiate Protocol
          </button>
        </div>
      </div>

      {/* KPI Strip + Alert Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((kpi, i) => (
              <KpiModule key={kpi.label} kpi={kpi} accentColor={kpiColors[i]} />
            ))}
          </div>

          {/* Network Chart */}
          <NetworkChart data={scanVolume} />
        </div>

        {/* Alert Panel */}
        <AlertPanel alerts={alerts} />
      </div>

      {/* Fleet Table */}
      <FleetTable buses={buses} />
    </div>
  );
}
