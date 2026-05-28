'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ArrowRight, Loader2, Terminal } from 'lucide-react';
import type { ScanResult } from '@/types';
import { verifyPassManual } from '@/lib/supabase/actions';

export default function ManualEntry({ 
  onResult,
  onClose 
}: { 
  onResult: (result: ScanResult) => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleVerify = async () => {
    const trimmed = code.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    try {
      const data = await verifyPassManual(trimmed);
      if (data.result === 'invalid' && data.errorMessage) {
        setError(data.errorMessage);
      } else {
        onResult(data);
        setCode('');
      }
    } catch (err: any) {
      setError(err.message || 'Verification error. Please try again.');
      console.error('Manual verification failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify();
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-bg-base flex flex-col animate-fade-in">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border-subtle bg-bg-surface/50 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-text-primary tracking-wide">MANUAL VERIFICATION</h3>
        </div>
        <button 
          onClick={onClose} 
          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto flex flex-col items-center">
          {/* Prompt Label */}
          <div className="mb-6 text-center">
            <p className="text-xs text-text-muted uppercase tracking-[0.2em] mb-1">Enter Verification Code</p>
            <p className="text-[10px] text-text-muted">Format: UTMS-XXXXXX</p>
          </div>

          {/* Code Input */}
          <div className="w-full relative mb-4">
            <input
              ref={inputRef}
              type="text"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="UTMS-______"
              maxLength={50}
              className="w-full h-20 bg-bg-surface border-2 border-border-subtle rounded-2xl text-center text-3xl font-mono font-bold text-text-primary placeholder:text-text-muted/30 focus:outline-none focus:border-primary transition-colors tracking-[0.15em] uppercase"
              disabled={loading}
            />
            {/* Blinking cursor effect via border glow */}
            {!loading && code.length === 0 && (
              <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 animate-pulse-glow pointer-events-none" />
            )}
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-xs text-danger mb-4 animate-fade-in">{error}</p>
          )}

          {/* Verify Button */}
          <button
            type="submit"
            disabled={!code.trim() || loading}
            className="w-full h-14 bg-primary text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-40 disabled:shadow-none transition-all active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Verifying…
              </>
            ) : (
              <>
                Verify Code <ArrowRight size={20} />
              </>
            )}
          </button>

          {/* Hint */}
          <p className="text-[10px] text-text-muted mt-4">
            Press <kbd className="px-1.5 py-0.5 bg-bg-elevated rounded text-text-secondary font-mono text-[9px]">Enter</kbd> to verify
          </p>
        </form>
      </div>
    </div>
  );
}
