'use client';

import type { Bus } from '@/types';
import { cn, getFuelColor } from '@/lib/utils';
import { MapPin, Fuel, Users, Radio } from 'lucide-react';

const statusConfig: Record<string, { color: string; label: string; dot: string }> = {
  active: { color: 'text-tertiary', label: 'Active', dot: 'bg-tertiary' },
  maintenance: { color: 'text-warning', label: 'Maintenance', dot: 'bg-warning' },
  offline: { color: 'text-danger', label: 'Offline', dot: 'bg-danger' },
};

function getStatus(bus: Bus) {
  if (!bus.isActive) return 'offline';
  if ((bus.fuelLevel || 0) < 20) return 'maintenance';
  return 'active';
}

export default function FleetTable({ buses }: { buses: Bus[] }) {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Fleet Telemetry</h3>
        </div>
        <span className="text-[10px] font-mono text-text-muted px-2 py-0.5 bg-bg-elevated rounded-full">
          {buses.filter(b => b.isActive).length}/{buses.length} online
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              {['Bus ID', 'Coordinates', 'Route', 'Fuel', 'Occupancy', 'Status'].map(h => (
                <th key={h} className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-2.5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {buses.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-text-muted text-sm">
                  No buses registered
                </td>
              </tr>
            ) : (
              buses.map((bus) => {
                const status = getStatus(bus);
                const cfg = statusConfig[status];
                const occ = bus.currentOccupancy || 0;
                const pct = Math.round((occ / bus.capacity) * 100);

                return (
                  <tr
                    key={bus._id}
                    className="border-b border-border-subtle last:border-0 hover:bg-primary/[0.03] transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono font-bold text-primary">{bus.busNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-text-muted" />
                        <span className="text-xs font-mono text-text-secondary">
                          {bus.coordinates
                            ? `${bus.coordinates.lat.toFixed(4)}, ${bus.coordinates.lng.toFixed(4)}`
                            : '—'
                          }
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-text-primary truncate block max-w-[180px]">
                        {bus.routeName || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <div className="flex-1 h-1.5 bg-bg-base rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', getFuelColor(bus.fuelLevel || 0))}
                            style={{ width: `${bus.fuelLevel || 0}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-text-secondary w-8 text-right">
                          {bus.fuelLevel || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-[90px]">
                        <Users size={12} className="text-text-muted" />
                        <span className="text-xs font-mono text-text-primary">{occ}/{bus.capacity}</span>
                        <div className="flex-1 h-1.5 bg-bg-base rounded-full overflow-hidden max-w-[50px]">
                          <div
                            className={cn('h-full rounded-full', pct > 90 ? 'bg-danger' : pct > 70 ? 'bg-warning' : 'bg-tertiary')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('w-2 h-2 rounded-full', cfg.dot, status === 'active' && 'animate-pulse-glow')} />
                        <span className={cn('text-xs font-medium', cfg.color)}>{cfg.label}</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
