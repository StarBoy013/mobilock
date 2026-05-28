// ========================================
// UTMS — Mock Pass Code Verification Service (legacy/testing only)
// Production verification happens in actions.ts (Supabase Server Actions)
// ========================================

import { mockPasses } from './mock-data';
import type { ScanResult, VerificationLog } from '@/types';

// In-memory verification log store (mock only)
const verificationLogs: VerificationLog[] = [];

/**
 * Generate a unique manual code in format UTMS-XXXXXX
 */
export function generateManualCode(existingCodes: Set<string>): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code: string;
  let attempts = 0;
  do {
    let suffix = '';
    for (let i = 0; i < 6; i++) suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    code = `UTMS-${suffix}`;
    attempts++;
  } while (existingCodes.has(code) && attempts < 100);
  return code;
}

function normalizeManualCode(input: string): string {
  let code = input.trim().toUpperCase();
  if (!code.startsWith('UTMS-') && code.length === 6) code = `UTMS-${code}`;
  return code;
}

/**
 * Core verification function (mock — uses in-memory mockPasses).
 * Production code uses verifyPassManual() in actions.ts.
 */
export function verifyManualCode(manualCode: string): ScanResult & { _logged?: boolean } {
  const normalized = normalizeManualCode(manualCode);
  const pass = mockPasses.find(p => p.manualCode.toUpperCase() === normalized);

  const logEntry: VerificationLog = {
    _id: `vlog-manual-${Date.now()}`,
    conductor: 'conductor-001',
    bus: pass?.assignedBus || 'unknown',
    result: 'invalid',
    method: 'manual',
    scannedAt: new Date().toISOString(),
  };

  if (!pass) {
    logEntry.reason = 'not_found';
    verificationLogs.push(logEntry);
    return { result: 'invalid', code: 'NOT_FOUND', message: 'Pass not found' };
  }

  logEntry.pass = pass._id;
  logEntry.student = pass.student;
  logEntry.studentName = pass.studentName;
  logEntry.studentUniversityId = pass.studentUniversityId;
  logEntry.busNumber = pass.busNumber;

  if (pass.status === 'expired') {
    logEntry.reason = 'expired';
    verificationLogs.push(logEntry);
    return { result: 'invalid', code: 'EXPIRED', message: 'Pass has expired' };
  }
  if (pass.status === 'suspended') {
    logEntry.reason = 'suspended';
    verificationLogs.push(logEntry);
    return { result: 'invalid', code: 'SUSPENDED', message: 'Pass is suspended' };
  }
  if (pass.status === 'revoked') {
    logEntry.reason = 'revoked';
    verificationLogs.push(logEntry);
    return { result: 'invalid', code: 'REVOKED', message: 'Pass has been revoked' };
  }
  if (pass.status === 'cancelled') {
    logEntry.reason = 'cancelled';
    verificationLogs.push(logEntry);
    return { result: 'invalid', code: 'CANCELLED', message: 'Pass has been cancelled' };
  }

  const CONDUCTOR_ASSIGNED_BUS = 'bus-003';
  if (pass.assignedBus !== CONDUCTOR_ASSIGNED_BUS) {
    logEntry.reason = 'wrong_bus';
    verificationLogs.push(logEntry);
    return {
      result: 'invalid',
      code: 'WRONG_BUS',
      message: 'Student is assigned to a different bus',
      assignedBusNumber: pass.busNumber,
      currentBusNumber: CONDUCTOR_ASSIGNED_BUS,
    };
  }

  if (new Date() > new Date(pass.expiresAt)) {
    logEntry.reason = 'expired';
    verificationLogs.push(logEntry);
    return { result: 'invalid', code: 'EXPIRED', message: 'Pass expiry date has passed' };
  }

  logEntry.result = 'valid';
  verificationLogs.push(logEntry);
  return {
    result: 'valid',
    code: 'VALID',
    student: { name: pass.studentName || 'Unknown', universityId: pass.studentUniversityId || 'Unknown' },
    bus: { busNumber: pass.busNumber || 'Unknown' },
    expiresAt: pass.expiresAt,
  };
}

export function getVerificationLogs(): VerificationLog[] {
  return [...verificationLogs];
}
