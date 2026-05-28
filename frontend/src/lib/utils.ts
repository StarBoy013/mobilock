import type { ApplicationStatus, PassStatus, AlertSeverity } from '@/types';

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

export function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getStatusColor(status: PassStatus | ApplicationStatus): string {
  const colors: Record<string, string> = {
    active: 'text-tertiary', approved: 'text-tertiary',
    expired: 'text-danger', rejected: 'text-danger',
    suspended: 'text-warning', pending: 'text-warning',
    revoked: 'text-danger',
    cancelled: 'text-danger',
    renewed: 'text-info',
  };
  return colors[status] || 'text-text-secondary';
}

export function getStatusBg(status: PassStatus | ApplicationStatus): string {
  const colors: Record<string, string> = {
    active: 'bg-tertiary/10 text-tertiary border-tertiary/20',
    approved: 'bg-tertiary/10 text-tertiary border-tertiary/20',
    expired: 'bg-danger/10 text-danger border-danger/20',
    rejected: 'bg-danger/10 text-danger border-danger/20',
    suspended: 'bg-warning/10 text-warning border-warning/20',
    pending: 'bg-warning/10 text-warning border-warning/20',
    revoked: 'bg-danger/10 text-danger border-danger/20',
    cancelled: 'bg-danger/10 text-danger border-danger/20',
    renewed: 'bg-info/10 text-info border-info/20',
  };
  return colors[status] || '';
}

/**
 * Returns true if the pass expiry date has passed, regardless of the stored status.
 * Use this everywhere instead of relying solely on pass.status === 'expired'.
 */
export function isExpiredByDate(expiresAt: string | undefined | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

export function getAlertColor(severity: AlertSeverity): string {
  const colors: Record<AlertSeverity, string> = {
    critical: 'border-l-danger text-danger',
    warning: 'border-l-warning text-warning',
    info: 'border-l-info text-info',
  };
  return colors[severity];
}

export function getFuelColor(level: number): string {
  if (level > 60) return 'bg-tertiary';
  if (level > 30) return 'bg-warning';
  return 'bg-danger';
}
