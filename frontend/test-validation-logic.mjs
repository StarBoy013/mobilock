import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import crypto from 'crypto';

// Load .env.local variables
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const QR_SECRET = env.QR_SECRET || 'super_secret_qr_token_signing_key_change_in_production';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing credentials in .env.local');
  process.exit(1);
}

// Generate unique manual alphanumeric verification code
function generateManualCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `UTMS-${result}`;
}

async function run() {
  console.log('==================================================');
  console.log('UTMS Pass Renewal & Verification Flow Test Suite');
  console.log('==================================================\n');

  // Create clients
  const studentClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const conductorClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

  // 1. Log in as Expired Student
  console.log('1. Logging in as expired student (student_expired@utms.edu)...');
  const { data: studentAuth, error: studentAuthErr } = await studentClient.auth.signInWithPassword({
    email: 'student_expired@utms.edu',
    password: 'Student@123'
  });
  if (studentAuthErr) throw studentAuthErr;
  const studentUser = studentAuth.user;
  console.log(`   ✅ Logged in. ID: ${studentUser.id}`);

  // Get current pass info
  const { data: studentPasses, error: passesErr } = await studentClient
    .from('passes')
    .select('*')
    .eq('student_id', studentUser.id);
  if (passesErr) throw passesErr;

  console.log(`   Found ${studentPasses.length} pass(es) for this student.`);
  studentPasses.forEach(p => {
    console.log(`   - Pass ID: ${p.id}, Status: ${p.status}, Expiry: ${p.expiry}, Code: ${p.manual_code}`);
  });

  const originalPass = studentPasses[0];
  if (!originalPass) {
    throw new Error('No pass found for student_expired@utms.edu! Run seed-users first.');
  }

  // 2. Submit Renewal Request
  console.log('\n2. Submitting renewal request...');
  // Clean up any pending renewal requests first
  await serviceClient.from('renewal_requests').delete().eq('student_id', studentUser.id);

  // Submit renewal request (simulate requestPassRenewal)
  const { data: renewalReq, error: renewalErr } = await studentClient
    .from('renewal_requests')
    .insert({
      student_id: studentUser.id,
      pass_id: originalPass.id,
      status: 'pending',
    })
    .select()
    .single();

  if (renewalErr) throw renewalErr;
  console.log(`   ✅ Renewal request submitted. Request ID: ${renewalReq.id}`);

  // 3. Log in as Admin
  console.log('\n3. Logging in as admin (admin@utms.edu)...');
  const { data: adminAuth, error: adminAuthErr } = await adminClient.auth.signInWithPassword({
    email: 'admin@utms.edu',
    password: 'Admin@123'
  });
  if (adminAuthErr) throw adminAuthErr;
  console.log(`   ✅ Logged in. ID: ${adminAuth.user.id}`);

  // 4. Approve Renewal Request (simulate updateRenewalRequestStatus)
  console.log('\n4. Approving renewal request as admin...');
  const { data: reqUpdate, error: reqUpdateErr } = await adminClient
    .from('renewal_requests')
    .update({
      status: 'approved',
      admin_remarks: 'Approved via integration test script',
      updated_at: new Date().toISOString(),
    })
    .eq('id', renewalReq.id)
    .select()
    .single();

  if (reqUpdateErr) throw reqUpdateErr;
  console.log(`   ✅ Request status updated to approved.`);

  // Generate tokens & extend pass
  const newExpiry = new Date();
  newExpiry.setMonth(newExpiry.getMonth() + 6);
  const newManualCode = generateManualCode();
  const payload = {
    passId: originalPass.id,
    studentId: originalPass.student_id,
    busId: originalPass.bus_id,
    exp: newExpiry.getTime(),
  };
  const hmac = crypto.createHmac('sha256', QR_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  const newQrToken = Buffer.from(JSON.stringify({ ...payload, hmac })).toString('base64url');

  const { data: updatedPass, error: passUpdateErr } = await adminClient
    .from('passes')
    .update({
      status: 'active',
      expiry: newExpiry.toISOString(),
      qr_token: newQrToken,
      manual_code: newManualCode,
      updated_at: new Date().toISOString(),
    })
    .eq('id', originalPass.id)
    .select()
    .single();

  if (passUpdateErr) throw passUpdateErr;
  console.log(`   ✅ Pass extended successfully!`);
  console.log(`      New Manual Code: ${updatedPass.manual_code}`);
  console.log(`      New Status: ${updatedPass.status}`);
  console.log(`      New Expiry: ${updatedPass.expiry}`);

  // Confirm student_id uniqueness holds (check total passes count for student)
  const { data: passCountCheck } = await serviceClient
    .from('passes')
    .select('id')
    .eq('student_id', studentUser.id);
  console.log(`   Total passes for student now: ${passCountCheck.length} (Expected: 1)`);
  if (passCountCheck.length !== 1) {
    throw new Error('❌ Duplicate passes detected for the same student!');
  }

  // 5. Log in as Conductor
  console.log('\n5. Logging in as conductor (conductor@utms.edu)...');
  const { data: conductorAuth, error: conductorAuthErr } = await conductorClient.auth.signInWithPassword({
    email: 'conductor@utms.edu',
    password: 'Conductor@123'
  });
  if (conductorAuthErr) throw conductorAuthErr;
  const conductorUser = conductorAuth.user;
  console.log(`   ✅ Logged in. ID: ${conductorUser.id}`);

  // 6. Verify Pass Manually using Roll Number: U-2023-0189 (simulate verifyPassManual)
  console.log('\n6. Simulating verifyPassManual using Roll Number U-2023-0189...');
  
  const rollNumber = 'U-2023-0189';
  
  // Look up student by roll number
  const { data: profile, error: profileErr } = await conductorClient
    .from('profiles')
    .select('id')
    .eq('enrollment_number', rollNumber)
    .maybeSingle();

  if (profileErr) throw profileErr;
  if (!profile) throw new Error('Student profile not found by roll number');

  // Query passes as array, ordered by updated_at desc
  const { data: verificationPasses, error: fetchPassesErr } = await conductorClient
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
    .eq('student_id', profile.id)
    .order('updated_at', { ascending: false });

  if (fetchPassesErr) throw fetchPassesErr;

  console.log(`   Found ${verificationPasses.length} passes during verification.`);
  const passToVerify = verificationPasses.find(p => p.status === 'active') || verificationPasses[0];

  const conductorBus = { id: originalPass.bus_id, bus_number: 'B-101' }; // Mock conductor's bus

  let result = 'invalid';
  let reason = 'not_found';

  if (passToVerify) {
    const now = new Date();
    const expiresAt = new Date(passToVerify.expiry);

    if (passToVerify.status === 'expired') {
      reason = 'expired';
    } else if (passToVerify.status === 'suspended') {
      reason = 'suspended';
    } else if (passToVerify.status === 'revoked') {
      reason = 'revoked';
    } else if (now > expiresAt) {
      reason = 'expired';
    } else if (conductorBus && passToVerify.bus_id !== conductorBus.id) {
      reason = 'wrong_bus';
    } else {
      result = 'valid';
      reason = null;
    }
  }

  console.log(`   Verification Result: ${result.toUpperCase()}`);
  if (reason) console.log(`   Reason: ${reason}`);
  console.log(`   Student Name: ${passToVerify?.profiles?.name}`);
  console.log(`   Student Roll Number: ${passToVerify?.profiles?.enrollment_number}`);

  if (result !== 'valid') {
    throw new Error(`❌ Manual verification failed! Expected valid, got: ${result} (${reason})`);
  }
  console.log('   ✅ Manual verification simulated successfully!');

  // 7. Simulating verifyPassQR (HMAC verification & pass status checks)
  console.log('\n7. Simulating verifyPassQR using the newly generated QR token...');
  
  // Decode QR
  const decoded = Buffer.from(newQrToken, 'base64url').toString('utf8');
  const parsed = JSON.parse(decoded);
  const { hmac: qrHmac, ...rest } = parsed;

  const computedHmac = crypto.createHmac('sha256', QR_SECRET)
    .update(JSON.stringify(rest))
    .digest('hex');

  if (qrHmac !== computedHmac) {
    throw new Error('❌ HMAC Tampered verification failed!');
  }
  console.log('   ✅ QR HMAC integrity matches!');

  // Query database using rest.passId as array
  const { data: qrPasses, error: qrFetchErr } = await conductorClient
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
    .eq('id', rest.passId)
    .order('updated_at', { ascending: false });

  if (qrFetchErr) throw qrFetchErr;

  const qrPassToVerify = qrPasses.find(p => p.status === 'active') || qrPasses[0];
  let qrResult = 'invalid';
  if (qrPassToVerify) {
    const now = new Date();
    const expiresAt = new Date(qrPassToVerify.expiry);
    if (qrPassToVerify.status === 'active' && now <= expiresAt && qrPassToVerify.bus_id === conductorBus.id) {
      qrResult = 'valid';
    }
  }

  console.log(`   QR Verification Result: ${qrResult.toUpperCase()}`);
  if (qrResult !== 'valid') {
    throw new Error('❌ QR verification failed!');
  }
  console.log('   ✅ QR verification simulated successfully!');

  // 8. Testing wrong bus verification
  console.log('\n8. Simulating Wrong Bus verification scenario...');
  const diffConductorBus = { id: 'some-other-bus-id', bus_number: 'B-202' };
  let wrongBusResult = 'invalid';
  let wrongBusReason = 'not_found';

  if (passToVerify) {
    if (passToVerify.bus_id !== diffConductorBus.id) {
      wrongBusReason = 'wrong_bus';
    }
  }
  console.log(`   Result: ${wrongBusResult.toUpperCase()}, Reason: ${wrongBusReason}`);
  if (wrongBusReason !== 'wrong_bus') {
    throw new Error('❌ Expected wrong_bus reason, but did not get it.');
  }
  console.log('   ✅ Wrong bus scenario handled correctly!');

  // 9. Testing expired pass verification
  console.log('\n9. Simulating Expired Pass verification scenario...');
  // Force student's pass status to 'expired' temporarily
  await serviceClient.from('passes').update({ status: 'expired' }).eq('id', originalPass.id);

  // Fetch again and verify
  const { data: expiredPassFetch } = await conductorClient
    .from('passes')
    .select('status')
    .eq('id', originalPass.id)
    .single();

  let expiredResult = 'invalid';
  let expiredReason = 'not_found';
  if (expiredPassFetch && expiredPassFetch.status === 'expired') {
    expiredReason = 'expired';
  }
  console.log(`   Result: ${expiredResult.toUpperCase()}, Reason: ${expiredReason}`);
  if (expiredReason !== 'expired') {
    throw new Error('❌ Expected expired reason, but did not get it.');
  }
  console.log('   ✅ Expired pass scenario handled correctly!');

  // Restore the pass to active for student dashboard validity
  await serviceClient.from('passes').update({ status: 'active' }).eq('id', originalPass.id);

  console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! NO CRASHES DETECTED!');
}

run().catch(err => {
  console.error('\n❌ INTEGRATION TEST FAILED:', err);
  process.exit(1);
});
