'use server';

import { createClient } from './server';
import type { ScanResult } from '@/types';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const QR_SECRET = process.env.QR_SECRET || 'super_secret_qr_token_signing_key_change_in_production';

// Helper to write logs to server-error.log
function logError(actionName: string, error: any) {
  try {
    const logFilePath = path.join(process.cwd(), 'server-error.log');
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ACTION: ${actionName}\n` +
      `Error Message: ${error.message}\n` +
      `Details/Code: ${error.code || 'N/A'}\n` +
      `Stack Trace:\n${error.stack || 'No stack trace'}\n` +
      `----------------------------------------\n\n`;
    fs.appendFileSync(logFilePath, logMessage, 'utf8');
  } catch (err) {
    console.error('Failed to write to server-error.log:', err);
  }
}

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );
}

// Helper to generate a unique manual alphanumeric verification code
function generateManualCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `UTMS-${result}`;
}

/**
 * Student submits a new pass application
 */
export async function submitPassApplication(routeId: string) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthenticated');

    // Check if a pending application already exists for this student
    const { data: existing } = await supabase
      .from('pass_applications')
      .select('id')
      .eq('student_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      throw new Error('You already have a pending pass application.');
    }

    // Block if the student already has a genuinely active pass (status=active AND not yet expired by date).
    // We check both status AND expiry to handle stale-active passes correctly.
    const { data: activePass } = await supabase
      .from('passes')
      .select('id, expiry')
      .eq('student_id', user.id)
      .eq('status', 'active')
      .gt('expiry', new Date().toISOString())  // truly active: not yet expired by date
      .maybeSingle();

    if (activePass) {
      throw new Error('You already have an active pass. Please request a renewal instead.');
    }

    const { data, error } = await supabase
      .from('pass_applications')
      .insert({
        student_id: user.id,
        requested_route_id: routeId,
        status: 'pending',
      })
      .select()
      .maybeSingle();  // use maybeSingle to avoid crash on constraint violation

    if (error) {
      console.error('Failed to submit application:', error.message);
      throw error;
    }
    
    return { success: true, data };
  } catch (err: any) {
    logError('submitPassApplication', err);
    return { success: false, error: err.message || 'Failed to submit application' };
  }
}

/**
 * Admin updates application status (Approves/Rejects)
 * If status is 'approved', it atomically issues a dynamic Pass record with a signed QR token.
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: 'approved' | 'rejected',
  busId?: string,
  routeId?: string,
  adminRemarks?: string
) {
  try {
    const supabase = await createClient();

    // Enforce role permission check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthenticated');
    
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileErr) throw profileErr;
    if (profile?.role !== 'super_admin') {
      throw new Error('Forbidden: Insufficient permissions');
    }

    // Update application status
    const { data: app, error: appError } = await supabase
      .from('pass_applications')
      .update({
        status,
        admin_remarks: adminRemarks,
      })
      .eq('id', applicationId)
      .select()
      .maybeSingle();

    if (appError) {
      console.error('Failed to update application status:', appError.message);
      throw appError;
    }
    if (!app) throw new Error('Application not found');

    if (status === 'approved') {
      if (!busId || !routeId) {
        throw new Error('Bus and Route must be assigned to approve.');
      }

      const manualCode = generateManualCode();
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 6); // 6 months validity

      const crypto = await import('crypto');
      const passId = crypto.randomUUID();
      
      // Create HMAC-signed QR token payload
      const payload = {
        passId,
        studentId: app.student_id,
        busId,
        exp: expiry.getTime(),
      };

      const hmac = crypto.createHmac('sha256', QR_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

      const qrToken = Buffer.from(JSON.stringify({ ...payload, hmac })).toString('base64url');

      // Check if a pass already exists for the student
      const { data: existingPass, error: checkError } = await supabase
        .from('passes')
        .select('id')
        .eq('student_id', app.student_id)
        .maybeSingle();

      if (checkError) throw checkError;

      let passError;
      if (existingPass) {
        // UPDATE existing record.
        // CRITICAL: QR payload must use the EXISTING row id (not a new UUID),
        // otherwise verifyPassQR looks up passId and finds nothing → NOT_FOUND.
        const renewPayload = {
          passId: existingPass.id,  // use existing DB id
          studentId: app.student_id,
          busId,
          exp: expiry.getTime(),
        };
        const renewHmac = crypto.createHmac('sha256', QR_SECRET)
          .update(JSON.stringify(renewPayload))
          .digest('hex');
        const renewedQrToken = Buffer.from(JSON.stringify({ ...renewPayload, hmac: renewHmac })).toString('base64url');

        const { error } = await supabase
          .from('passes')
          .update({
            route_id: routeId,
            bus_id: busId,
            status: 'active',
            manual_code: manualCode,
            expiry: expiry.toISOString(),
            qr_token: renewedQrToken,  // QR built with correct existing id
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPass.id);
        passError = error;
      } else {
        // INSERT fresh record — passId matches the new row's id
        const { error } = await supabase
          .from('passes')
          .insert({
            id: passId,
            student_id: app.student_id,
            route_id: routeId,
            bus_id: busId,
            status: 'active',
            manual_code: manualCode,
            expiry: expiry.toISOString(),
            qr_token: qrToken,  // built with passId which equals the inserted id
          });
        passError = error;
      }

      if (passError) {
        console.error('Failed to generate pass:', passError.message);
        throw passError;
      }
    }

    return { success: true, data: app };
  } catch (err: any) {
    logError('updateApplicationStatus', err);
    return { success: false, error: err.message || 'Failed to update application status' };
  }
}

/**
 * Conductor verifies student pass manual code
 * Inspects validity status, expires logs, checks conductor bus assignment, and inserts audit logs.
 */
export async function verifyPassManual(manualCode: string): Promise<ScanResult> {
  try {
    const supabase = await createClient();

    const { data: { user: conductorUser } } = await supabase.auth.getUser();
    if (!conductorUser) throw new Error('Unauthenticated');

    const normalized = manualCode.trim().toUpperCase();
    
    // Log inputs
    console.log(`[verifyPassManual] Raw Input: "${manualCode}"`);
    console.log(`[verifyPassManual] Normalized Input: "${normalized}"`);

    // Normalize manual code format (prepend UTMS- if omitted by conductor)
    let queryValue = normalized;
    if (normalized.length === 6 && !normalized.startsWith('UTMS-')) {
      queryValue = `UTMS-${normalized}`;
    }
    console.log(`[verifyPassManual] Final Query Value: "${queryValue}"`);

    // Query passes as an array, ordering by updated_at DESC to prevent multiple rows .single() crash
    let passesList: any[] = [];

    // 1. Check if the input is a UUID (Pass ID)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalized);
    if (isUuid) {
      console.log(`[verifyPassManual] Querying passes by ID (UUID): "${normalized}"`);
      const response = await supabase
        .from('passes')
        .select(`
          id,
          status,
          expiry,
          student_id,
          bus_id,
          manual_code,
          updated_at,
          profiles:student_id (name, enrollment_number),
          buses:bus_id (bus_number)
        `)
        .eq('id', normalized)
        .order('updated_at', { ascending: false });
        
      console.log(`[verifyPassManual] Supabase UUID query response:`, {
        data: response.data,
        error: response.error,
        status: response.status,
        statusText: response.statusText,
      });

      if (response.error) throw response.error;
      if (response.data) passesList = response.data;
    }

    // 2. Try by manual_code
    if (passesList.length === 0) {
      console.log(`[verifyPassManual] Querying passes by manual_code: "${queryValue}"`);
      const response = await supabase
        .from('passes')
        .select(`
          id,
          status,
          expiry,
          student_id,
          bus_id,
          manual_code,
          updated_at,
          profiles:student_id (name, enrollment_number),
          buses:bus_id (bus_number)
        `)
        .eq('manual_code', queryValue)
        .order('updated_at', { ascending: false });

      console.log(`[verifyPassManual] Supabase manual_code query response:`, {
        data: response.data,
        error: response.error,
        status: response.status,
        statusText: response.statusText,
      });

      if (response.error) throw response.error;
      if (response.data) passesList = response.data;
    }

    // 3. Try by student enrollment_number (Roll Number)
    if (passesList.length === 0) {
      console.log(`[verifyPassManual] Querying profiles by enrollment_number: "${normalized}"`);
      const profileResponse = await supabase
        .from('profiles')
        .select('id')
        .eq('enrollment_number', normalized)
        .limit(1)
        .maybeSingle();

      console.log(`[verifyPassManual] Supabase profiles query response:`, {
        data: profileResponse.data,
        error: profileResponse.error,
        status: profileResponse.status,
        statusText: profileResponse.statusText,
      });

      if (profileResponse.error) throw profileResponse.error;

      if (profileResponse.data) {
        console.log(`[verifyPassManual] Found profile ID: ${profileResponse.data.id}. Querying passes...`);
        const response = await supabase
          .from('passes')
          .select(`
            id,
            status,
            expiry,
            student_id,
            bus_id,
            manual_code,
            updated_at,
            profiles:student_id (name, enrollment_number),
            buses:bus_id (bus_number)
          `)
          .eq('student_id', profileResponse.data.id)
          .order('updated_at', { ascending: false });

        console.log(`[verifyPassManual] Supabase passes by student_id response:`, {
          data: response.data,
          error: response.error,
          status: response.status,
          statusText: response.statusText,
        });

        if (response.error) throw response.error;
        if (response.data) passesList = response.data;
      }
    }

    // Pass selection priority:
    // 1. status=active AND not yet expired by date (truly valid pass)
    // 2. Any pass with status=active (may be stale-active; expiry check runs later)
    // 3. Most recently updated pass (handles suspended/revoked/expired states)
    let pass: any = null;
    if (passesList.length > 0) {
      const now = new Date();
      const trulyActive = passesList.find(
        p => p.status?.toLowerCase() === 'active' && new Date(p.expiry) > now
      );
      const statusActive = passesList.find(p => p.status?.toLowerCase() === 'active');
      pass = trulyActive || statusActive || passesList[0];
      console.log(`[verifyPassManual] Selected pass: ${pass?.id} (status=${pass?.status}, expiry=${pass?.expiry})`);
    }

    // Query the bus assigned to this conductor safely
    console.log(`[verifyPassManual] Querying bus for conductor: "${conductorUser.id}"`);
    let conductorBus;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', conductorUser.id)
      .maybeSingle();

    if (profile?.role === 'super_admin') {
      const busResponse = await supabase
        .from('buses')
        .select('id, bus_number')
        .eq('bus_number', 'UNI-001')
        .maybeSingle();
      conductorBus = busResponse.data;
    } else {
      const busResponse = await supabase
        .from('buses')
        .select('id, bus_number')
        .eq('conductor_id', conductorUser.id)
        .limit(1)
        .maybeSingle();

      console.log(`[verifyPassManual] Supabase buses query response:`, {
        data: busResponse.data,
        error: busResponse.error,
        status: busResponse.status,
        statusText: busResponse.statusText,
      });

      if (busResponse.error) throw busResponse.error;
      conductorBus = busResponse.data;
    }

    // Bug 3 Fix: Reject if conductor has no bus assigned
    if (!conductorBus) {
      return { result: 'invalid', code: 'NO_BUS_ASSIGNED', message: 'No bus is assigned to your conductor account.' };
    }

    let verificationCode: any = null;
    let verificationMessage = '';
    let finalResult: 'valid' | 'invalid' = 'invalid';

    const logEntry: any = {
      conductor_id: conductorUser.id,
      manual_code_used: normalized,
      method: 'manual',
    };

    if (!pass) {
      verificationCode = 'NOT_FOUND';
      verificationMessage = 'No pass record found for this code';
    } else {
      logEntry.pass_id = pass.id;
      const now = new Date();
      const expiresAt = new Date(pass.expiry);
      const statusNormalized = pass.status?.toLowerCase();

      // Structured diagnostic log for every verification
      console.log('[verifyPassManual] DECISION LOG:', JSON.stringify({
        passId: pass.id,
        storedStatus: statusNormalized,
        expiry: pass.expiry,
        now: now.toISOString(),
        isExpiredByDate: now >= expiresAt,
        conductorBusId: conductorBus.id,
        passBusId: pass.bus_id,
        isBusMismatch: pass.bus_id !== conductorBus.id,
      }));

      // Stage 3: Status checks (in priority order)
      if (statusNormalized === 'expired') {
        verificationCode = 'EXPIRED'; verificationMessage = 'Pass has expired';
      } else if (statusNormalized === 'suspended') {
        verificationCode = 'SUSPENDED'; verificationMessage = 'Pass is temporarily suspended';
      } else if (statusNormalized === 'revoked') {
        verificationCode = 'REVOKED'; verificationMessage = 'Pass has been permanently revoked';
      } else if (statusNormalized === 'cancelled') {
        verificationCode = 'CANCELLED'; verificationMessage = 'Pass has been cancelled';
      } else if (statusNormalized === 'renewed') {
        verificationCode = 'RENEWED'; verificationMessage = 'Pass has been renewed — use your new pass';
      } else if (now >= expiresAt) {
        // Expiry date check — runs even if DB status is still 'active' (handles stale status)
        verificationCode = 'EXPIRED'; verificationMessage = 'Pass expiry date has passed';
        // Sync DB status to avoid this branch on next scan
        await supabase.from('passes').update({
          status: 'expired',
          status_updated_at: now.toISOString(),
        }).eq('id', pass.id);
      } else if (pass.bus_id !== conductorBus.id) {
        // Stage 4: Bus mismatch — distinct from tampered
        verificationCode = 'WRONG_BUS'; verificationMessage = 'Student is assigned to a different bus';
      } else {
        // Stage 5: All checks passed
        finalResult = 'valid';
        verificationCode = 'VALID';
      }
    }

    logEntry.result = finalResult.toUpperCase();
    logEntry.reason = verificationCode?.toLowerCase();

    // Insert verification log record
    await supabase.from('verification_logs').insert(logEntry);

    if (finalResult === 'invalid' || !pass) {
      if (verificationCode === 'WRONG_BUS' && pass) {
        const assignedBusNumber = (pass.buses as any)?.bus_number || 'Unknown';
        return {
          result: 'invalid',
          code: 'WRONG_BUS',
          message: verificationMessage,
          student: {
            name: (pass.profiles as any)?.name || 'Unknown',
            universityId: (pass.profiles as any)?.enrollment_number || 'Unknown',
          },
          assignedBusNumber,
          currentBusNumber: conductorBus.bus_number,
        };
      }
      return { result: 'invalid', code: verificationCode || 'NOT_FOUND', message: verificationMessage || 'Pass not found' };
    }

    return {
      result: 'valid',
      code: 'VALID',
      student: {
        name: (pass.profiles as any)?.name || 'Unknown',
        universityId: (pass.profiles as any)?.enrollment_number || 'Unknown',
      },
      bus: { busNumber: (pass.buses as any)?.bus_number || 'Unknown' },
      expiresAt: pass.expiry,
    };
  } catch (err: any) {
    logError('verifyPassManual', err);
    return { result: 'invalid', code: 'SYSTEM_ERROR', message: err.message || 'Verification system error' };
  }
}

/**
 * Conductor verifies student pass QR token
 * Decodes base64 payload, checks HMAC signature, validates expiry and status.
 */
export async function verifyPassQR(qrToken: string): Promise<ScanResult> {
  try {
    const supabase = await createClient();

    const { data: { user: conductorUser } } = await supabase.auth.getUser();
    if (!conductorUser) throw new Error('Unauthenticated');

    let payload: any = null;
    try {
      const decoded = Buffer.from(qrToken, 'base64url').toString('utf8');
      const parsed = JSON.parse(decoded);
      const { hmac, ...rest } = parsed;

      // Verify HMAC signature
      const crypto = await import('crypto');
      const computedHmac = crypto.createHmac('sha256', QR_SECRET)
        .update(JSON.stringify(rest))
        .digest('hex');

      if (hmac !== computedHmac) {
        console.error('QR Verification: HMAC mismatch');
        await supabase.from('verification_logs').insert({
          conductor_id: conductorUser.id,
          manual_code_used: 'TAMPERED_QR',
          result: 'INVALID',
          reason: 'tampered',
          method: 'qr',
        });
        return { result: 'invalid', code: 'TAMPERED', message: 'QR signature is invalid or the code has been tampered with' };
      }

      // Verify signed expiry timestamp in the QR payload
      if (rest.exp && Date.now() >= rest.exp) {
        console.error('QR Verification: Token payload expired');
        await supabase.from('verification_logs').insert({
          conductor_id: conductorUser.id,
          manual_code_used: 'EXPIRED_QR',
          result: 'INVALID',
          reason: 'expired',
          method: 'qr',
        });
        return { result: 'invalid', code: 'EXPIRED', message: 'QR token has expired. Student needs a renewed pass.' };
      }

      payload = rest;
    } catch (err: any) {
      console.error('QR Decryption failed:', err.message);
      await supabase.from('verification_logs').insert({
        conductor_id: conductorUser.id,
        manual_code_used: 'MALFORMED_QR',
        result: 'INVALID',
        reason: 'tampered',
        method: 'qr',
      });
      return { result: 'invalid', code: 'TAMPERED', message: 'Malformed QR code — could not decode' };
    }

    // Retrieve passes from database as array, ordering by updated_at DESC to prevent multiple rows .single() crash
    console.log(`[verifyPassQR] Querying passes by ID: "${payload.passId}"`);
    const passResponse = await supabase
      .from('passes')
      .select(`
        id,
        status,
        expiry,
        student_id,
        bus_id,
        manual_code,
        updated_at,
        profiles:student_id (name, enrollment_number),
        buses:bus_id (bus_number)
      `)
      .eq('id', payload.passId)
      .order('updated_at', { ascending: false });

    console.log(`[verifyPassQR] Supabase passes response:`, {
      data: passResponse.data,
      error: passResponse.error,
      status: passResponse.status,
      statusText: passResponse.statusText,
    });

    if (passResponse.error) throw passResponse.error;
    const passes = passResponse.data;

    // Find the latest active pass. If none, get the latest pass overall.
    let pass: any = null;
    if (passes && passes.length > 0) {
      pass = passes.find(p => p.status?.toLowerCase() === 'active') || passes[0];
    }

    // Query the bus assigned to this conductor safely
    console.log(`[verifyPassQR] Querying bus for conductor: "${conductorUser.id}"`);
    let conductorBus;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', conductorUser.id)
      .maybeSingle();

    if (profile?.role === 'super_admin') {
      const busResponse = await supabase
        .from('buses')
        .select('id, bus_number')
        .eq('bus_number', 'UNI-001')
        .maybeSingle();
      conductorBus = busResponse.data;
    } else {
      const busResponse = await supabase
        .from('buses')
        .select('id, bus_number')
        .eq('conductor_id', conductorUser.id)
        .limit(1)
        .maybeSingle();

      console.log(`[verifyPassQR] Supabase buses response:`, {
        data: busResponse.data,
        error: busResponse.error,
        status: busResponse.status,
        statusText: busResponse.statusText,
      });

      if (busResponse.error) throw busResponse.error;
      conductorBus = busResponse.data;
    }

    // Bug 3 Fix: Reject if conductor has no bus assigned
    if (!conductorBus) {
      return { result: 'invalid', code: 'NO_BUS_ASSIGNED', message: 'No bus is assigned to your conductor account.' };
    }

    let qrFinalResult: 'valid' | 'invalid' = 'invalid';
    let qrCode: any = null;
    let qrMessage = '';

    const logEntry: any = {
      conductor_id: conductorUser.id,
      method: 'qr',
    };

    if (!pass) {
      qrCode = 'NOT_FOUND';
      qrMessage = 'No pass record matches this QR code';
      logEntry.manual_code_used = 'UNKNOWN_QR_ID';
    } else {
      logEntry.pass_id = pass.id;
      logEntry.manual_code_used = pass.manual_code;
      const now = new Date();
      const expiresAt = new Date(pass.expiry);
      const statusNormalized = pass.status?.toLowerCase();

      console.log('[verifyPassQR] DECISION LOG:', JSON.stringify({
        passId: pass.id,
        storedStatus: statusNormalized,
        expiry: pass.expiry,
        now: now.toISOString(),
        isExpiredByDate: now >= expiresAt,
        conductorBusId: conductorBus.id,
        passBusId: pass.bus_id,
        isBusMismatch: pass.bus_id !== conductorBus.id,
      }));

      if (statusNormalized === 'expired') {
        qrCode = 'EXPIRED'; qrMessage = 'Pass has expired';
      } else if (statusNormalized === 'suspended') {
        qrCode = 'SUSPENDED'; qrMessage = 'Pass is temporarily suspended';
      } else if (statusNormalized === 'revoked') {
        qrCode = 'REVOKED'; qrMessage = 'Pass has been permanently revoked';
      } else if (statusNormalized === 'cancelled') {
        qrCode = 'CANCELLED'; qrMessage = 'Pass has been cancelled';
      } else if (statusNormalized === 'renewed') {
        qrCode = 'RENEWED'; qrMessage = 'Pass has been renewed — use your new pass';
      } else if (now >= expiresAt) {
        qrCode = 'EXPIRED'; qrMessage = 'Pass expiry date has passed';
        await supabase.from('passes').update({
          status: 'expired',
          status_updated_at: now.toISOString(),
        }).eq('id', pass.id);
      } else if (pass.bus_id !== conductorBus.id) {
        qrCode = 'WRONG_BUS'; qrMessage = 'Student is assigned to a different bus';
      } else {
        qrFinalResult = 'valid';
        qrCode = 'VALID';
      }
    }

    logEntry.result = qrFinalResult.toUpperCase();
    logEntry.reason = qrCode?.toLowerCase();

    // Log verification attempt
    await supabase.from('verification_logs').insert(logEntry);

    if (qrFinalResult === 'invalid' || !pass) {
      if (qrCode === 'WRONG_BUS' && pass) {
        const assignedBusNumber = (pass.buses as any)?.bus_number || 'Unknown';
        return {
          result: 'invalid',
          code: 'WRONG_BUS',
          message: qrMessage,
          student: {
            name: (pass.profiles as any)?.name || 'Unknown',
            universityId: (pass.profiles as any)?.enrollment_number || 'Unknown',
          },
          assignedBusNumber,
          currentBusNumber: conductorBus.bus_number,
        };
      }
      return { result: 'invalid', code: qrCode || 'NOT_FOUND', message: qrMessage || 'Pass not found' };
    }

    return {
      result: 'valid',
      code: 'VALID',
      student: {
        name: (pass.profiles as any)?.name || 'Unknown',
        universityId: (pass.profiles as any)?.enrollment_number || 'Unknown',
      },
      bus: { busNumber: (pass.buses as any)?.bus_number || 'Unknown' },
      expiresAt: pass.expiry,
    };
  } catch (err: any) {
    logError('verifyPassQR', err);
    return { result: 'invalid', code: 'SYSTEM_ERROR', message: err.message || 'Verification system error' };
  }
}

/**
 * Student requests a pass renewal before or after expiry
 */
export async function requestPassRenewal(passId: string) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthenticated');

    // Verify pass belongs to student (replace fragile .single() with .maybeSingle())
    const { data: pass, error: passErr } = await supabase
      .from('passes')
      .select('id, student_id')
      .eq('id', passId)
      .eq('student_id', user.id)
      .maybeSingle();

    if (passErr) throw passErr;
    if (!pass) throw new Error('Pass not found or access denied');

    // Verify no pending renewal request exists
    const { data: existing, error: existingErr } = await supabase
      .from('renewal_requests')
      .select('id')
      .eq('pass_id', passId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingErr) throw existingErr;
    if (existing) throw new Error('A renewal request is already pending for this pass.');

    const { data, error } = await supabase
      .from('renewal_requests')
      .insert({
        student_id: user.id,
        pass_id: passId,
        status: 'pending',
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Failed to submit renewal request:', error.message);
      throw error;
    }

    return { success: true, data };
  } catch (err: any) {
    logError('requestPassRenewal', err);
    return { success: false, error: err.message || 'Failed to submit renewal request' };
  }
}

/**
 * Admin approves/rejects renewal requests
 */
export async function updateRenewalRequestStatus(
  requestId: string,
  status: 'approved' | 'rejected',
  adminRemarks?: string
) {
  try {
    const supabase = await createClient();

    // Enforce role permission check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthenticated');

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileErr) throw profileErr;
    if (profile?.role !== 'super_admin') {
      throw new Error('Forbidden: Insufficient permissions');
    }

    // Update request status
    const { data: req, error: reqError } = await supabase
      .from('renewal_requests')
      .update({
        status,
        admin_remarks: adminRemarks,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .maybeSingle();

    if (reqError) {
      console.error('Failed to update renewal status:', reqError.message);
      throw reqError;
    }
    if (!req) throw new Error('Renewal request not found');

    if (status === 'approved') {
      // Get corresponding pass details
      const { data: pass, error: passFetchErr } = await supabase
        .from('passes')
        .select('*')
        .eq('id', req.pass_id)
        .maybeSingle();

      if (passFetchErr) throw passFetchErr;
      if (!pass) throw new Error('Associated pass not found');

      const newExpiry = new Date();
      newExpiry.setMonth(newExpiry.getMonth() + 6); // Extend for another 6 months

      // Regenerate manual_code and qr_token on renewal approval.
      // The passId in the QR payload MUST match pass.id (the existing DB row id).
      const newManualCode = generateManualCode();
      const crypto = await import('crypto');
      const payload = {
        passId: pass.id,          // same row id — critical for QR lookup
        studentId: pass.student_id,
        busId: pass.bus_id,       // keep same bus unless admin changes it
        exp: newExpiry.getTime(),
      };

      console.log('[updateRenewalRequestStatus] Renewal payload:', JSON.stringify({
        passId: payload.passId,
        busId: payload.busId,
        newExpiry: newExpiry.toISOString(),
        newManualCode,
      }));

      const hmac = crypto.createHmac('sha256', QR_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

      const newQrToken = Buffer.from(JSON.stringify({ ...payload, hmac })).toString('base64url');

      const now = new Date();
      // Update the pass: reset status to active, new expiry, new QR, new manual code
      const { error: passError } = await supabase
        .from('passes')
        .update({
          status: 'active',
          expiry: newExpiry.toISOString(),
          qr_token: newQrToken,
          manual_code: newManualCode,
          status_reason: 'Renewed by admin',
          status_updated_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', pass.id);

      if (passError) {
        console.error('Failed to update pass during renewal approval:', passError.message);
        throw passError;
      }

      console.log('[updateRenewalRequestStatus] Pass renewed successfully. New code:', newManualCode);

    }

    return { success: true, data: req };
  } catch (err: any) {
    logError('updateRenewalRequestStatus', err);
    return { success: false, error: err.message || 'Failed to update renewal request status' };
  }
}

/**
 * Admin adds a new pass holder directly
 */
export async function addPassHolder(data: {
  name: string;
  rollNumber: string;
  department: string;
  routeId: string;
  busId: string;
  expiry: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked' | 'cancelled' | 'renewed';
  photoUrl?: string;
}) {
  try {
    const supabase = await createClient();

    // Check permissions
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) throw new Error('Unauthenticated');

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', adminUser.id)
      .maybeSingle();

    if (profileErr) throw profileErr;
    if (profile?.role !== 'super_admin') {
      throw new Error('Forbidden: Insufficient permissions');
    }

    const { name, rollNumber, department, routeId, busId, expiry, status, photoUrl } = data;

    // Generate unique email based on roll number
    const email = `${rollNumber.toLowerCase().replace(/[^a-z0-9]/g, '_')}@utms.edu`;

    const adminClient = createAdminClient();

    // Create the student user in Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: 'Student@123',
      email_confirm: true,
      user_metadata: {
        name,
        role: 'student',
        enrollment_number: rollNumber,
        department,
        photo_url: photoUrl || '',
      }
    });

    if (authError) {
      console.error('Failed to create auth user:', authError.message);
      throw authError;
    }

    const studentId = authData.user.id;

    // Insert an approved pass application
    const { error: appError } = await adminClient
      .from('pass_applications')
      .insert({
        student_id: studentId,
        requested_route_id: routeId,
        status: 'approved',
        admin_remarks: 'Added directly by Admin',
      });

    if (appError) {
      console.error('Failed to create pass application for new holder:', appError.message);
      throw appError;
    }

    // Generate Pass credentials
    const manualCode = generateManualCode();
    const crypto = await import('crypto');
    const passId = crypto.randomUUID();

    // Create HMAC-signed QR token payload
    const payload = {
      passId,
      studentId,
      busId,
      exp: new Date(expiry).getTime(),
    };

    const hmac = crypto.createHmac('sha256', QR_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    const qrToken = Buffer.from(JSON.stringify({ ...payload, hmac })).toString('base64url');

    // Check if a pass already exists for this student
    const { data: existingPass, error: checkError } = await adminClient
      .from('passes')
      .select('id')
      .eq('student_id', studentId)
      .maybeSingle();

    if (checkError) throw checkError;

    let passData;
    let passError;

    if (existingPass) {
      // UPDATE existing record instead of inserting a duplicate
      const { data, error } = await adminClient
        .from('passes')
        .update({
          route_id: routeId,
          bus_id: busId,
          status,
          manual_code: manualCode,
          expiry: new Date(expiry).toISOString(),
          qr_token: qrToken,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPass.id)
        .select()
        .maybeSingle();
      passData = data;
      passError = error;
    } else {
      // INSERT new record
      const { data, error } = await adminClient
        .from('passes')
        .insert({
          id: passId,
          student_id: studentId,
          route_id: routeId,
          bus_id: busId,
          status,
          manual_code: manualCode,
          expiry: new Date(expiry).toISOString(),
          qr_token: qrToken,
        })
        .select()
        .maybeSingle();
      passData = data;
      passError = error;
    }

    if (passError) {
      console.error('Failed to generate/update pass for new holder:', passError.message);
      throw passError;
    }

    return { success: true, data: passData };
  } catch (err: any) {
    logError('addPassHolder', err);
    return { success: false, error: err.message || 'Failed to add pass holder' };
  }
}

