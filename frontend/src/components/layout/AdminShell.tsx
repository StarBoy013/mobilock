'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Bus, MapPin, BarChart3,
  Settings, Search, Bell, LogOut, ChevronDown, Activity
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/applications', icon: FileText, label: 'Applications' },
  { href: '/admin/buses', icon: Bus, label: 'Buses' },
  { href: '/admin/routes', icon: MapPin, label: 'Routes' },
  { href: '/admin/passes', icon: Activity, label: 'Passes' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
];

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-16 bg-bg-surface border-r border-border-subtle flex flex-col items-center py-4 z-50">
      {/* Logo */}
      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-8">
        <span className="text-primary font-bold font-mono text-sm">UT</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map(item => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
                active
                  ? 'bg-primary/15 text-primary glow-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
              )}
              title={item.label}
            >
              <item.icon size={20} />
              {/* Tooltip */}
              <span className="absolute left-14 px-2 py-1 bg-bg-elevated text-text-primary text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <Link
        href="/admin/settings"
        className="w-10 h-10 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
        title="Settings"
      >
        <Settings size={20} />
      </Link>
    </aside>
  );
}

function TopBar() {
  const { user, clearAuth } = useAuthStore();

  return (
    <header className="h-14 bg-bg-surface/80 backdrop-blur-sm border-b border-border-subtle flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Search */}
      <div className="relative w-72">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search systems..."
          className="w-full h-9 pl-9 pr-4 bg-bg-base border border-border-subtle rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted bg-bg-elevated px-1.5 py-0.5 rounded">⌘K</kbd>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* System Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-tertiary/10 rounded-full border border-tertiary/20">
          <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse-glow" />
          <span className="text-xs text-tertiary font-medium">System Nominal</span>
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2 pl-4 border-l border-border-subtle">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary text-xs font-bold">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-text-primary leading-none">{user?.name}</p>
            <p className="text-xs text-text-muted mt-0.5">Super Admin</p>
          </div>
          <button
            onClick={clearAuth}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-danger hover:bg-danger/10 transition-all ml-1"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-base">
      <Sidebar />
      <div className="ml-16">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
