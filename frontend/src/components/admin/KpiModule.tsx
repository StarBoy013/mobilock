'use client';

import type { KpiData } from '@/types';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 80 - 10}`)
    .join(' ');

  return (
    <svg viewBox="0 0 100 100" className="w-20 h-8" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

export default function KpiModule({ kpi, accentColor = '#3B82F6' }: { kpi: KpiData; accentColor?: string }) {
  const TrendIcon = trendIcons[kpi.trendDirection];
  const trendColor = kpi.trendDirection === 'up' ? 'text-tertiary' : kpi.trendDirection === 'down' ? 'text-danger' : 'text-text-muted';

  return (
    <div className="group relative bg-bg-surface border border-border-subtle rounded-xl p-4 hover:border-primary/20 transition-all duration-300 hover:scale-[1.02]">
      {/* Top glow line */}
      <div className="absolute top-0 left-4 right-4 h-px opacity-50" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] uppercase tracking-wider text-text-muted font-medium mb-2">
            {kpi.label}
          </p>
          <p className="text-2xl font-bold font-mono text-text-primary leading-none">
            {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
          </p>
          {kpi.unit && (
            <p className="text-[10px] text-text-muted mt-1">{kpi.unit}</p>
          )}
          <div className={cn('flex items-center gap-1 mt-2', trendColor)}>
            <TrendIcon size={12} />
            <span className="text-xs font-mono font-medium">
              {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
            </span>
          </div>
        </div>
        <Sparkline data={kpi.sparklineData} color={accentColor} />
      </div>
    </div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-4">
      <div className="skeleton h-3 w-20 mb-3" />
      <div className="skeleton h-7 w-24 mb-2" />
      <div className="skeleton h-3 w-16" />
    </div>
  );
}
