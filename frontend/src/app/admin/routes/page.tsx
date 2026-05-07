'use client';

import { useRoutes } from '@/hooks/queries';
import { MapPin, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RoutesPage() {
  const { data: routes } = useRoutes();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Route Management</h1>
          <p className="text-xs text-text-muted mt-0.5">Manage bus routes and stops</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-primary/15 border border-primary/20 rounded-lg text-xs text-primary hover:bg-primary/25 transition-all">
          <Plus size={14} />
          New Route
        </button>
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search routes..."
              className="w-full h-8 pl-9 pr-4 bg-bg-base border border-border-subtle rounded-md text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <span className="text-[10px] font-mono text-text-muted px-2 py-0.5 bg-bg-elevated rounded-full">
            {routes.length} total
          </span>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-2.5">Route Name</th>
              <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-2.5">Stops</th>
              <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-2.5">Distance</th>
              <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium text-left px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {routes.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-text-muted text-sm">No routes defined</td>
              </tr>
            ) : (
              routes.map(route => (
                <tr key={route._id} className="border-b border-border-subtle last:border-0 hover:bg-primary/[0.03] transition-colors group cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-text-muted" />
                      <span className="text-sm font-medium text-text-primary">{route.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-text-secondary">
                        {route.stops.length} stops
                      </span>
                      <span className="text-[10px] text-text-muted truncate max-w-[200px]">
                        {route.stops.map(s => s.name).join(' → ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-text-secondary">{route.distance} km</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('w-2 h-2 rounded-full', route.isActive ? 'bg-tertiary animate-pulse-glow' : 'bg-text-muted')} />
                      <span className={cn('text-xs font-medium', route.isActive ? 'text-tertiary' : 'text-text-muted')}>
                        {route.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
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
