'use client';

import { useState, useRef, useEffect } from 'react';
import ScanOverlay from '@/components/conductor/ScanOverlay';
import ManualEntry from '@/components/conductor/ManualEntry';
import { Camera, QrCode, Keyboard, RefreshCcw } from 'lucide-react';
import type { ScanResult } from '@/types';

// Mock QR Data representing what the camera would decode
const MOCK_QR_PAYLOADS = [
  { type: 'valid', data: '{"passId":"pass-001","studentId":"student-001","busId":"bus-003","exp":1761936000}', label: 'Valid Pass (Aarav)' },
  { type: 'expired', data: '{"passId":"pass-004","studentId":"student-010","busId":"bus-001","exp":1733011200}', label: 'Expired Pass' },
  { type: 'wrong_bus', data: '{"passId":"pass-002","studentId":"student-005","busId":"bus-999","exp":1761936000}', label: 'Wrong Bus' },
  { type: 'tampered', data: 'tampered_or_invalid_string', label: 'Tampered QR' }
];

export default function ScannerPage() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  
  const scanLocked = useRef(false);
  const lastScan = useRef<{ data: string; time: number }>({ data: '', time: 0 });

  // Simulate camera initialization
  useEffect(() => {
    const timer = setTimeout(() => setCameraActive(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleSimulatedScan = (payload: string, type: string) => {
    if (scanLocked.current) return;
    
    // Dedup: prevent same scan within 5 seconds
    const now = Date.now();
    if (lastScan.current.data === payload && now - lastScan.current.time < 5000) {
      console.log('Ignoring duplicate scan');
      return;
    }
    
    scanLocked.current = true;
    lastScan.current = { data: payload, time: now };

    // Mock Backend Verification Logic based on type
    let result: ScanResult;
    if (type === 'valid') result = { result: 'valid', student: { name: 'Aarav Sharma', universityId: 'U-2024-0042' } };
    else if (type === 'expired') result = { result: 'invalid', reason: 'expired' };
    else if (type === 'wrong_bus') result = { result: 'invalid', reason: 'wrong_bus' };
    else result = { result: 'invalid', reason: 'tampered' };

    setScanResult(result);
  };

  const handleManualSubmit = (id: string) => {
    // Mock manual ID check
    setScanResult({ result: 'valid', student: { name: 'Student Name', universityId: id } });
    setShowManual(false);
  };

  const handleOverlayDismiss = () => {
    setScanResult(null);
    scanLocked.current = false;
  };

  return (
    <div className="h-full relative bg-black flex flex-col">
      {/* Camera Viewport Simulation */}
      <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center">
        {cameraActive ? (
          <>
            <div className="absolute inset-0 bg-bg-surface/20" />
            
            {/* Scanner Reticle */}
            <div className="relative w-64 h-64 border-2 border-primary/50 rounded-xl">
              {/* Corner accents */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
              
              {/* Scanning laser animation */}
              <div className="absolute left-0 right-0 h-0.5 bg-primary/80 glow-primary top-1/2 animate-[pulse-glow_1.5s_ease-in-out_infinite]" />
            </div>
            
            <p className="absolute bottom-16 text-xs font-mono text-white/70 tracking-widest uppercase">
              Align QR code within frame
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center text-white/50">
            <RefreshCcw size={32} className="animate-spin mb-4" />
            <p className="text-sm font-mono">Initializing Camera...</p>
          </div>
        )}

        {/* Mock Scan Buttons (Frontend Demo Only) */}
        <div className="absolute top-4 left-4 right-4 bg-bg-surface/80 backdrop-blur rounded-xl p-3 border border-border-subtle z-20">
          <p className="text-[10px] text-text-muted uppercase mb-2 text-center">Simulation Controls</p>
          <div className="grid grid-cols-2 gap-2">
            {MOCK_QR_PAYLOADS.map((mock) => (
              <button
                key={mock.label}
                onClick={() => handleSimulatedScan(mock.data, mock.type)}
                className="text-[10px] py-1.5 bg-bg-elevated hover:bg-bg-base text-text-primary border border-border-subtle rounded transition-colors"
              >
                {mock.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
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
          onSubmit={handleManualSubmit} 
          onClose={() => setShowManual(false)} 
        />
      )}
    </div>
  );
}
