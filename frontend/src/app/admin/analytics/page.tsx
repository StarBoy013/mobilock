'use client';

import { useScanVolume, useOccupancy, usePassStatusData } from '@/hooks/queries';
import { Calendar } from 'lucide-react';
import dynamic from 'next/dynamic';

const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

import NetworkChart from '@/components/admin/NetworkChart';

const COLORS = {
  active: '#10B981',
  expired: '#EF4444',
  suspended: '#F59E0B',
  revoked: '#64748B',
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="bg-bg-elevated/95 backdrop-blur border border-border-subtle rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-mono font-medium" style={{ color: entry.color || entry.fill }}>
          {entry.name || entry.dataKey}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: scanVolume } = useScanVolume();
  const { data: occupancy } = useOccupancy();
  const { data: passStatus } = usePassStatusData();

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">System Analytics</h1>
          <p className="text-xs text-text-muted mt-0.5">Historical data and fleet utilization</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-bg-surface border border-border-subtle rounded-lg">
          <Calendar size={14} className="text-text-muted" />
          <select className="text-xs text-text-primary bg-transparent focus:outline-none cursor-pointer">
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </div>

      <NetworkChart data={scanVolume} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Chart */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Fleet Utilization (Occupancy)</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancy} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="busNumber" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'var(--font-mono)' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'var(--font-mono)' }} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.05)' }} />
                <Bar dataKey="occupancy" name="Occupancy" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pass Status Distribution */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Pass Status Distribution</h3>
          <div className="h-[250px] flex items-center">
            <div className="flex-1 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={passStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    stroke="none"
                  >
                    {passStatus.map((entry) => (
                      <Cell key={entry.status} fill={COLORS[entry.status as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-40 space-y-3">
              {passStatus.map(stat => (
                <div key={stat.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[stat.status as keyof typeof COLORS] }} />
                    <span className="text-xs text-text-secondary capitalize">{stat.status}</span>
                  </div>
                  <span className="text-sm font-mono font-medium text-text-primary">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
