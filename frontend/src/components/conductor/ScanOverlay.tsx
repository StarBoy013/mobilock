'use client';

import { useEffect } from 'react';
import type { ScanResult, VerificationCode } from '@/types';
import {
  CheckCircle2,
  XCircle,
  Bus,
  Clock,
  ShieldAlert,
  ShieldOff,
  Ban,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';

interface CodeConfig {
  label: string;
  sublabel: string;
  bgFlash: string;
  iconBg: string;
  iconColor: string;
  Icon: React.ElementType;
  badgeClass: string;
}

const CODE_CONFIG: Record<Exclude<VerificationCode, 'VALID'>, CodeConfig> = {
  EXPIRED: {
    label: 'PASS EXPIRED',
    sublabel: 'This pass is no longer valid',
    bgFlash: 'bg-orange-500',
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-400',
    Icon: Clock,
    badgeClass: 'bg-orange-500/10 border border-orange-500/30 text-orange-400',
  },
  SUSPENDED: {
    label: 'PASS SUSPENDED',
    sublabel: 'This pass has been temporarily suspended',
    bgFlash: 'bg-warning',
    iconBg: 'bg-warning/20',
    iconColor: 'text-warning',
    Icon: ShieldOff,
    badgeClass: 'bg-warning/10 border border-warning/30 text-warning',
  },
  REVOKED: {
    label: 'PASS REVOKED',
    sublabel: 'This pass has been permanently revoked',
    bgFlash: 'bg-danger',
    iconBg: 'bg-danger/20',
    iconColor: 'text-danger',
    Icon: Ban,
    badgeClass: 'bg-danger/10 border border-danger/30 text-danger',
  },
  CANCELLED: {
    label: 'PASS CANCELLED',
    sublabel: 'This pass has been cancelled',
    bgFlash: 'bg-danger',
    iconBg: 'bg-danger/20',
    iconColor: 'text-danger',
    Icon: XCircle,
    badgeClass: 'bg-danger/10 border border-danger/30 text-danger',
  },
  RENEWED: {
    label: 'PASS RENEWED',
    sublabel: 'Please use your new pass',
    bgFlash: 'bg-info',
    iconBg: 'bg-info/20',
    iconColor: 'text-info',
    Icon: RefreshCw,
    badgeClass: 'bg-info/10 border border-info/30 text-info',
  },
  WRONG_BUS: {
    label: 'WRONG BUS',
    sublabel: 'Student is assigned to a different bus',
    bgFlash: 'bg-amber-500',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    Icon: Bus,
    badgeClass: 'bg-amber-500/10 border border-amber-500/30 text-amber-400',
  },
  NOT_FOUND: {
    label: 'PASS NOT FOUND',
    sublabel: 'No matching pass record found',
    bgFlash: 'bg-slate-600',
    iconBg: 'bg-slate-600/20',
    iconColor: 'text-slate-400',
    Icon: HelpCircle,
    badgeClass: 'bg-slate-600/10 border border-slate-600/30 text-slate-400',
  },
  TAMPERED: {
    label: 'INVALID / TAMPERED QR',
    sublabel: 'QR signature verification failed',
    bgFlash: 'bg-danger',
    iconBg: 'bg-danger/20',
    iconColor: 'text-danger',
    Icon: ShieldAlert,
    badgeClass: 'bg-danger/10 border border-danger/30 text-danger',
  },
  NO_BUS_ASSIGNED: {
    label: 'NO BUS ASSIGNED',
    sublabel: 'Your conductor account has no bus',
    bgFlash: 'bg-slate-600',
    iconBg: 'bg-slate-600/20',
    iconColor: 'text-slate-400',
    Icon: AlertTriangle,
    badgeClass: 'bg-slate-600/10 border border-slate-600/30 text-slate-400',
  },
  SYSTEM_ERROR: {
    label: 'SYSTEM ERROR',
    sublabel: 'An internal error occurred',
    bgFlash: 'bg-slate-600',
    iconBg: 'bg-slate-600/20',
    iconColor: 'text-slate-400',
    Icon: AlertTriangle,
    badgeClass: 'bg-slate-600/10 border border-slate-600/30 text-slate-400',
  },
};

export default function ScanOverlay({
  result,
  onDismiss,
}: {
  result: ScanResult;
  onDismiss: () => void;
}) {
  const isValid = result.result === 'valid';

  useEffect(() => {
    const timer = setTimeout(onDismiss, isValid ? 4000 : 5000);
    return () => clearTimeout(timer);
  }, [onDismiss, isValid]);

  if (isValid) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center p-6 animate-fade-in">
        <div className="absolute inset-0 bg-tertiary animate-scan-flash pointer-events-none" />
        <div className="relative z-10 w-full max-w-sm bg-bg-surface/95 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-col items-center text-center animate-scale-in">
          <div className="w-24 h-24 rounded-full bg-tertiary/20 text-tertiary flex items-center justify-center mb-6">
            <CheckCircle2 size={56} />
          </div>
          <h2 className="text-3xl font-bold text-text-primary mb-2">VALID</h2>
          <div className="w-full h-px bg-white/10 my-4" />
          <p className="text-xl font-medium text-text-primary mb-1">{result.student.name}</p>
          <p className="text-lg font-mono text-text-secondary">{result.student.universityId}</p>
          <div className="mt-3 flex items-center gap-2 text-sm text-primary">
            <Bus size={16} />
            <span className="font-mono font-bold">{result.bus.busNumber}</span>
          </div>
        </div>
      </div>
    );
  }

  const code = result.code;
  const config = CODE_CONFIG[code] || CODE_CONFIG.SYSTEM_ERROR;
  const { Icon } = config;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 animate-fade-in">
      <div className={`absolute inset-0 ${config.bgFlash} animate-scan-flash pointer-events-none`} />
      <div className="relative z-10 w-full max-w-sm bg-bg-surface/95 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-col items-center text-center animate-scale-in">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${config.iconBg} ${config.iconColor}`}>
          <Icon size={56} />
        </div>

        <h2 className={`text-2xl font-bold mb-1 ${config.iconColor}`}>{config.label}</h2>
        <p className="text-sm text-text-muted mb-4">{config.sublabel}</p>

        <span className={`text-[10px] font-mono font-semibold px-3 py-1 rounded-full uppercase tracking-widest ${config.badgeClass}`}>
          {code}
        </span>

        {code === 'WRONG_BUS' && result.assignedBusNumber && (
          <div className="w-full mt-5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs font-mono space-y-1.5 text-text-secondary text-left">
            <p className="flex justify-between">
              <span>Assigned Bus:</span>
              <span className="font-bold text-amber-400">{result.assignedBusNumber}</span>
            </p>
            <p className="flex justify-between">
              <span>Current Bus:</span>
              <span className="font-bold text-primary">{result.currentBusNumber}</span>
            </p>
          </div>
        )}

        {result.student && code !== 'WRONG_BUS' && (
          <div className="mt-4 text-center">
            <p className="text-sm font-medium text-text-primary">{result.student.name}</p>
            <p className="text-xs font-mono text-text-muted">{result.student.universityId}</p>
          </div>
        )}

        <p className="text-xs text-text-muted mt-4 leading-relaxed">{result.message}</p>
      </div>
    </div>
  );
}