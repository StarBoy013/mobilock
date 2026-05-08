// ========================================
// UTMS — Manual Pass Code Verification Service
// ========================================

import { mockPasses } from './mock-data';
import type { ScanResult, VerificationLog, InvalidReason } from '@/types';

// In-memory verification log store (would be DB in production)
const verificationLogs: VerificationLog[] = [];

/**
 * Generate a unique manual code in format UTMS-XXXXXX
 * where X is uppercase alphanumeric (A-Z, 0-9).
 */
export function generateManualCode(existingCodes: Set<string>): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excludes I/O/0/1 to avoid confusion
  let code: string;
  let attempts = 0;

  do {
    let suffix = '';
    for (let i = 0; i < 6; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code = `UTMS-${suffix}`;
    attempts++;
  } while (existingCodes.has(code) && attempts < 100);

  return code;
}

/**
 * Normalize manual code input:
 * - trim whitespace
 * - uppercase
 * - ensure UTMS- prefix
 */
function normalizeManualCode(input: string): string {
  let code = input.trim().toUpperCase();
  // If user typed without prefix, add it
  if (!code.startsWith('UTMS-') && code.length === 6) {
    code = `UTMS-${code}`;
  }
  return code;
}

/**
 * Core verification function.
 * Looks up the pass by manual code, validates status and expiry.
 * Creates a VerificationLog entry for every attempt.
 */
export function verifyManualCode(manualCode: string): ScanResult & { _logged?: boolean } {
  const normalized = normalizeManualCode(manualCode);

  // Find pass by manualCode (case-insensitive after normalization)
  const pass = mockPasses.find(
    (p) => p.manualCode.toUpperCase() === normalized
  );

  // Build log entry
  const logEntry: VerificationLog = {
    _id: `vlog-manual-${Date.now()}`,
    conductor: 'conductor-001', // would come from auth context in production
    bus: pass?.assignedBus || 'unknown',
    result: 'invalid',
    method: 'manual',
    scannedAt: new Date().toISOString(),
  };

  // Pass not found
  if (!pass) {
    logEntry.reason = 'not_found';
    verificationLogs.push(logEntry);
    return {
      result: 'invalid',
      reason: 'not_found',
    };
  }

  // Attach student/pass info to log
  logEntry.pass = pass._id;
  logEntry.student = pass.student;
  logEntry.studentName = pass.studentName;
  logEntry.studentUniversityId = pass.studentUniversityId;
  logEntry.busNumber = pass.busNumber;

  // Check status
  if (pass.status === 'expired') {
    logEntry.reason = 'expired';
    verificationLogs.push(logEntry);
    return { result: 'invalid', reason: 'expired' };
  }

  if (pass.status === 'suspended') {
    logEntry.reason = 'suspended';
    verificationLogs.push(logEntry);
    return { result: 'invalid', reason: 'suspended' };
  }

  if (pass.status === 'revoked') {
    logEntry.reason = 'revoked';
    verificationLogs.push(logEntry);
    return { result: 'invalid', reason: 'revoked' };
  }

  // Check expiry date
  const now = new Date();
  const expiresAt = new Date(pass.expiresAt);
  if (now > expiresAt) {
    logEntry.reason = 'expired';
    verificationLogs.push(logEntry);
    return { result: 'invalid', reason: 'expired' };
  }

  // Pass is valid
  logEntry.result = 'valid';
  verificationLogs.push(logEntry);

  return {
    result: 'valid',
    student: {
      name: pass.studentName || 'Unknown',
      universityId: pass.studentUniversityId || 'Unknown',
    },
    bus: {
      busNumber: pass.busNumber || 'Unknown',
    },
    expiresAt: pass.expiresAt,
  };
}

/**
 * Retrieve all verification logs (for testing/debugging).
 */
export function getVerificationLogs(): VerificationLog[] {
  return [...verificationLogs];
}
