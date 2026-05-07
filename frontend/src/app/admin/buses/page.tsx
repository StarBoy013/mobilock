'use client';

import { useBuses } from '@/hooks/queries';
import { Plus, Search, MapPin, Users, Fuel, Activity } from 'lucide-react';
import { cn, getFuelColor } from '@/lib/utils';

export default function BusesPage() {
  const { data: buses } = useBuses();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Bus Fleet Management</h1>
          <p className="text-xs text-text-muted mt-0.5">Monitor and manage transport vehicles</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-primary/15 border border-primary/20 rounded-lg text-xs text-primary hover:bg-primary/25 transition-all">
          <Plus size={14} />
          Add Bus
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by bus number or route..."
            className="w-full h-8 pl-9 pr-4 bg-bg-surface border border-border-subtle rounded-md text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {buses.map(bus => {
          const occ = bus.currentOccupancy || 0;
          const pct = Math.round((occ / bus.capacity) * 100);
          
          return (
            <div key={bus._id} className="bg-bg-surface border border-border-subtle rounded-xl p-4 hover:border-primary/30 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center border border-border-subtle group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                    <span className="text-sm font-bold font-mono text-text-primary group-hover:text-primary transition-colors">
                      {bus.busNumber.split('-')[1] || bus.busNumber}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-mono text-primary">{bus.busNumber}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-text-secondary">
                      <span className={cn('w-1.5 h-1.5 rounded-full', bus.isActive ? 'bg-tertiary animate-pulse-glow' : 'bg-danger')} />
                      <span className="text-xs font-medium">{bus.isActive ? 'Active' : 'Offline'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted flex items-center gap-1.5"><MapPin size={12} /> Route</span>
                  <span className="text-text-primary truncate max-w-[150px]" title={bus.routeName}>{bus.routeName || 'Unassigned'}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted flex items-center gap-1.5"><Users size={12} /> Occupancy</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-text-primary">{occ}/{bus.capacity}</span>
                    <span className="text-text-muted">({pct}%)</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-bg-base rounded-full overflow-hidden">
                  <div 
                    className={cn('h-full rounded-full', pct > 90 ? 'bg-danger' : pct > 70 ? 'bg-warning' : 'bg-tertiary')} 
                    style={{ width: `${pct}%` }} 
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-text-muted flex items-center gap-1.5"><Fuel size={12} /> Fuel Level</span>
                  <span className="font-mono text-text-primary">{bus.fuelLevel || 0}%</span>
                </div>
                <div className="h-1.5 w-full bg-bg-base rounded-full overflow-hidden">
                  <div 
                    className={cn('h-full rounded-full transition-all', getFuelColor(bus.fuelLevel || 0))} 
                    style={{ width: `${bus.fuelLevel || 0}%` }} 
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-text-muted block mb-0.5">Driver</span>
                  <span className="text-text-primary font-medium">{bus.driverName}</span>
                </div>
                <button className="px-3 py-1.5 bg-bg-elevated hover:bg-primary/20 hover:text-primary rounded text-[10px] uppercase tracking-wider font-medium text-text-secondary transition-colors">
                  Details
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
