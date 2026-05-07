'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, FileText, History, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/student/dashboard', icon: CreditCard, label: 'Pass' },
  { href: '/student/apply', icon: FileText, label: 'Apply' },
  { href: '/student/history', icon: History, label: 'History' },
];

export default function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Minimal header */}
      <header className="h-12 bg-bg-surface border-b border-border-subtle flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold font-mono text-[10px]">UT</span>
          </div>
          <span className="text-sm font-medium text-text-primary">UTMS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">{user?.name}</span>
          <button onClick={clearAuth} className="text-text-secondary hover:text-danger transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom tab bar — mobile first */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-bg-surface/95 backdrop-blur-sm border-t border-border-subtle flex items-center justify-around z-50 safe-area-inset-bottom">
        {tabs.map(tab => {
          const active = pathname === tab.href || pathname?.startsWith(tab.href + '/');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all',
                active
                  ? 'text-primary'
                  : 'text-text-secondary'
              )}
            >
              <tab.icon size={20} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
