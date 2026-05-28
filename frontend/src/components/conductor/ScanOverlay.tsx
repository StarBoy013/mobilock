'use client';

import { useEffect } from 'react';
import type { ScanResult } from '@/types';
import { CheckCircle2, XCircle, Bus } from 'lucide-react';

const REASON_MESSAGES: Record<string, string> = {
  expired: 'Pass Expired',
  suspended: 'Pass Suspended',
  wrong_bus: 'Wrong Bus Assigned',
  tampered: 'Invalid / Tampered QR',
  revoked: 'Pass Revoked',
  not_found: 'Pass Not Found'
};

export default function ScanOverlay({ 
  result, 
  onDismiss 
}: { 
  result: ScanResult;
  onDismiss: () => void;
}) {
  const isValid = result.result === 'valid';

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 animate-fade-in">
      {/* Full screen flash background */}
      <div className={`absolute inset-0 ${isValid ? 'bg-tertiary' : 'bg-danger'} animate-scan-flash pointer-events-none`} />
      
      {/* Content Card */}
      <div className="relative z-10 w-full max-w-sm bg-bg-surface/95 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-col items-center text-center animate-scale-in">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${isValid ? 'bg-tertiary/20 text-tertiary' : 'bg-danger/20 text-danger'}`}>
          {isValid ? <CheckCircle2 size={56} /> : <XCircle size={56} />}
        </div>

        {isValid ? (
          <>
            <h2 className="text-3xl font-bold text-text-primary mb-2">VALID</h2>
            <div className="w-full h-px bg-white/10 my-4" />
            <p className="text-xl font-medium text-text-primary mb-1">
              {result.student?.name}
            </p>
            <p className="text-lg font-mono text-text-secondary">
              {result.student?.universityId}
            </p>
            {result.bus?.busNumber && (
              <div className="mt-3 flex items-center gap-2 text-sm text-primary">
                <Bus size={16} />
                <span className="font-mono font-bold">{result.bus.busNumber}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-danger mb-2">INVALID</h2>
            <div className="w-full h-px bg-white/10 my-4" />
            <p className="text-xl font-bold text-text-primary mb-2">
              {(result as any).errorMessage || (result.reason === 'wrong_bus' ? 'WRONG BUS ROUTE' : (result.reason ? REASON_MESSAGES[result.reason] : 'Unknown Error'))}
            </p>
            {result.reason === 'wrong_bus' && (
              <div className="w-full bg-danger/10 border border-danger/20 rounded-xl p-4 text-xs font-mono space-y-1.5 text-text-secondary text-left mt-2">
                <p className="flex justify-between">
                  <span>Assigned Bus:</span>
                  <span className="font-bold text-danger">{(result as any).assignedBusNumber}</span>
                </p>
                <p className="flex justify-between">
                  <span>Current Bus:</span>
                  <span className="font-bold text-primary">{(result as any).currentBusNumber}</span>
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
