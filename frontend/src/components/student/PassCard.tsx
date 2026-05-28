'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Pass } from '@/types';
import { Bus, MapPin, Clock, Copy, Check } from 'lucide-react';
import { cn, daysUntil, getStatusBg, formatDate } from '@/lib/utils';

export default function PassCard({ pass }: { pass: Pass }) {
  const daysLeft = daysUntil(pass.expiresAt);
  const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pass.manualCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {

      const textArea = document.createElement('textarea');
      textArea.value = pass.manualCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto bg-bg-surface rounded-2xl border border-border-subtle overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-50 pointer-events-none" />

      <div className="p-5 pb-4 flex items-start justify-between border-b border-border-subtle relative z-10">
        <div>
          <h3 className="text-lg font-bold text-text-primary">{pass.studentName}</h3>
          <p className="text-xs font-mono text-text-secondary mt-0.5">{pass.studentUniversityId}</p>
        </div>
        <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full border', getStatusBg(pass.status))}>
          {pass.status.toUpperCase()}
        </span>
      </div>

      <div className="p-6 flex flex-col items-center justify-center bg-white/5 relative z-10">
        <div className={cn(
          "p-3 rounded-xl bg-white shadow-xl transition-all duration-300",
          pass.status === 'active' ? "glow-primary" : "opacity-50 grayscale"
        )}>
          <QRCodeSVG
            value={pass.qrToken}
            size={180}
            level="H"
            includeMargin={false}
          />
        </div>
        <p className="text-[10px] font-mono text-text-muted mt-4 uppercase tracking-widest">
          {pass.status === 'active' ? 'Ready to Scan' : 'Scan Disabled'}
        </p>
      </div>

      <div className="mx-5 p-3 bg-bg-base/80 border border-border-subtle rounded-xl relative z-10">
        <p className="text-[10px] text-text-muted uppercase tracking-wider text-center mb-2">
          Manual Verification Code
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-xl font-mono font-bold text-primary tracking-[0.2em] select-all">
            {pass.manualCode}
          </span>
          <button
            onClick={handleCopy}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-lg border transition-all duration-200",
              copied
                ? "bg-tertiary/10 border-tertiary/30 text-tertiary"
                : "bg-bg-surface border-border-subtle text-text-muted hover:text-primary hover:border-primary/30"
            )}
            title="Copy code"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      <div className="p-5 pt-4 space-y-4 relative z-10 border-t border-border-subtle bg-bg-base/50 mt-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-text-muted uppercase tracking-wider flex items-center gap-1.5"><Bus size={10} /> Bus Number</span>
            <p className="text-sm font-mono font-bold text-primary">{pass.busNumber}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-text-muted uppercase tracking-wider flex items-center gap-1.5"><MapPin size={10} /> Route</span>
            <p className="text-xs text-text-primary truncate" title={pass.routeName}>{pass.routeName}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
          <div className="space-y-1">
            <span className="text-[10px] text-text-muted uppercase tracking-wider flex items-center gap-1.5"><Clock size={10} /> Valid Until</span>
            <p className="text-xs font-mono text-text-primary">{formatDate(pass.expiresAt)}</p>
          </div>
          {pass.status === 'active' && (
            <div className="text-right">
              <span className={cn(
                "text-xs font-bold",
                isExpiringSoon ? "text-warning" : "text-tertiary"
              )}>
                {daysLeft} Days Left
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}