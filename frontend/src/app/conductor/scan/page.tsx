'use client';

import { useState, useRef, useEffect } from 'react';
import ScanOverlay from '@/components/conductor/ScanOverlay';
import ManualEntry from '@/components/conductor/ManualEntry';
import { Camera, QrCode, Keyboard, RefreshCcw, Send, AlertCircle, Loader2 } from 'lucide-react';
import type { ScanResult } from '@/types';
import { verifyPassQR, verifyPassManual } from '@/lib/supabase/actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ScannerPage() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const scanLocked = useRef(false);
  const lastScan = useRef<{ data: string; time: number }>({ data: '', time: 0 });

  // Initialize the HTML5 QR Code Scanner
  useEffect(() => {
    let scanner: any = null;

    // Dynamically import to prevent SSR/Node environments from erroring on document access
    import('html5-qrcode').then((module) => {
      // Configuration
      const config = {
        fps: 10,
        qrbox: (width: number, height: number) => {
          const size = Math.min(width, height) * 0.7;
          return { width: size, height: size };
        },
        aspectRatio: 1.0,
      };

      scanner = new module.Html5QrcodeScanner(
        "reader",
        config,
        /* verbose= */ false
      );

      scanner.render(
        async (decodedText: string) => {
          if (scanLocked.current) return;

          // Prevent double scanning of the same pass within 5 seconds
          const now = Date.now();
          if (lastScan.current.data === decodedText && now - lastScan.current.time < 5000) {
            return;
          }

          scanLocked.current = true;
          lastScan.current = { data: decodedText, time: now };
          setIsVerifying(true);

          try {
            // Call Supabase Server Action to verify QR token
            const result = await verifyPassQR(decodedText);
            setScanResult(result);
          } catch (err: any) {
            console.error('QR code verification failed:', err);
            setScanResult({ result: 'invalid', reason: 'tampered' });
          } finally {
            setIsVerifying(false);
          }
        },
        (errorMessage: string) => {
          // Silent frame read failures (usual behavior for scanner searching for QRs)
        }
      );

      setCameraActive(true);
      setCameraError(null);
    }).catch((err) => {
      console.error('Failed to load html5-qrcode scanner:', err);
      setCameraError('Failed to load camera scanning library.');
    });

    // Cleanup scanner on component unmount
    return () => {
      if (scanner) {
        scanner.clear().catch((error: any) => {
          console.error("Failed to clear scanner on unmount:", error);
        });
      }
    };
  }, []);

  const handleManualTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = manualToken.trim();
    if (!input || isVerifying) return;

    setIsVerifying(true);
    try {
      let result;
      // If it looks like a manual code, roll number, or pass UUID, verify manually
      if (input.length < 50) {
        result = await verifyPassManual(input);
      } else {
        result = await verifyPassQR(input);
      }
      setScanResult(result);
      setManualToken('');
      toast.success('Verification completed');
    } catch (err: any) {
      console.error('Verification error:', err);
      setScanResult({ result: 'invalid', reason: 'tampered' });
      toast.error('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualResult = (result: ScanResult) => {
    setScanResult(result);
    setShowManual(false);
  };

  const handleOverlayDismiss = () => {
    setScanResult(null);
    scanLocked.current = false;
  };

  return (
    <div className="h-full relative bg-black flex flex-col">
      {/* Scanner Viewport */}
      <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center p-4">
        
        {/* Real Camera reader element */}
        <div className="w-full max-w-sm aspect-square relative rounded-2xl overflow-hidden border border-border-subtle bg-bg-surface/20 flex flex-col items-center justify-center">
          <div id="reader" className={`w-full h-full object-cover [&_video]:object-cover ${!cameraActive ? 'hidden' : ''}`} />
          
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 p-6 text-center z-10">
              {cameraError ? (
                <>
                  <AlertCircle size={32} className="text-danger mb-3 animate-pulse" />
                  <p className="text-sm font-semibold text-text-primary mb-1">Webcam Unreachable</p>
                  <p className="text-xs text-text-muted">{cameraError}</p>
                </>
              ) : (
                <>
                  <RefreshCcw size={32} className="animate-spin mb-4" />
                  <p className="text-sm font-mono">Initializing Webcam...</p>
                </>
              )}
            </div>
          )}

          {/* Loading Indicator for Verification */}
          {isVerifying && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center z-30">
              <Loader2 size={36} className="text-primary animate-spin mb-3" />
              <p className="text-xs text-primary font-mono tracking-widest uppercase">Verifying Pass...</p>
            </div>
          )}
        </div>

        {/* Collapsible / Floating Panel for Token Copy-Paste Fallback */}
        <div className="w-full max-w-sm mt-4 bg-bg-surface/80 backdrop-blur rounded-xl p-3.5 border border-border-subtle z-20">
          <p className="text-[10px] text-text-secondary font-mono uppercase mb-2 tracking-wider flex items-center gap-1.5">
            <Camera size={10} className="text-primary" /> Webcam Unavailable? Verify Pass Manually:
          </p>
          <form onSubmit={handleManualTokenSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter manual code, roll number, or paste QR token..."
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              className="flex-1 h-9 px-3 bg-bg-base border border-border-subtle rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50"
              disabled={isVerifying}
            />
            <button
              type="submit"
              disabled={!manualToken.trim() || isVerifying}
              className="h-9 w-9 bg-primary/10 hover:bg-primary/25 border border-primary/20 text-primary rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
              title="Verify Token"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="h-20 bg-bg-base border-t border-border-subtle flex items-center justify-around shrink-0 relative z-30">
        <button 
          onClick={() => setShowManual(false)}
          className={`flex flex-col items-center gap-1 p-2 ${!showManual ? 'text-primary' : 'text-text-secondary'}`}
        >
          <QrCode size={24} />
          <span className="text-[10px] font-medium">Scanner</span>
        </button>
        <button 
          onClick={() => setShowManual(true)}
          className={`flex flex-col items-center gap-1 p-2 ${showManual ? 'text-primary' : 'text-text-secondary'}`}
        >
          <Keyboard size={24} />
          <span className="text-[10px] font-medium">Manual Entry</span>
        </button>
      </div>

      {/* Overlays */}
      {scanResult && (
        <ScanOverlay result={scanResult} onDismiss={handleOverlayDismiss} />
      )}
      
      {showManual && (
        <ManualEntry 
          onResult={handleManualResult} 
          onClose={() => setShowManual(false)} 
        />
      )}
    </div>
  );
}
