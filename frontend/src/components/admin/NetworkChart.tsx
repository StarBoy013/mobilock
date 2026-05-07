'use client';

import dynamic from 'next/dynamic';
import type { ScanVolumePoint } from '@/types';

const LineChart = dynamic(
  () => import('recharts').then(mod => mod.LineChart),
  { ssr: false }
);
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => mod.ResponsiveContainer),
  { ssr: false }
);

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="bg-bg-elevated/95 backdrop-blur border border-border-subtle rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-mono font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function NetworkChart({ data }: { data: ScanVolumePoint[] }) {
  const formatted = data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
  }));

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Network Throughput</h3>
          <p className="text-xs text-text-muted mt-0.5">Scan Volume — 7 Day Window</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded bg-primary" />
            <span className="text-[10px] text-text-muted">Total Scans</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded bg-secondary" />
            <span className="text-[10px] text-text-muted">Valid Scans</span>
          </div>
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="scans"
              name="Total Scans"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#3B82F6', stroke: '#0F172A', strokeWidth: 2 }}
              style={{ filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.4))' }}
            />
            <Line
              type="monotone"
              dataKey="validScans"
              name="Valid Scans"
              stroke="#06B6D4"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#06B6D4', stroke: '#0F172A', strokeWidth: 2 }}
              style={{ filter: 'drop-shadow(0 0 6px rgba(6, 182, 212, 0.4))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function NetworkChartSkeleton() {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
      <div className="skeleton h-4 w-40 mb-1" />
      <div className="skeleton h-3 w-52 mb-4" />
      <div className="skeleton h-[280px] w-full rounded-lg" />
    </div>
  );
}
