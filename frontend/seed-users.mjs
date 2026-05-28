/**
 * Seed Users via Supabase Admin API
 * This creates seed users properly (with identities) so login works.
 * Run ONCE: node seed-users.mjs
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load env vars
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const SEED_USERS = [
  {
    email: 'admin@utms.edu',
    password: 'Admin@123',
    user_metadata: { name: 'Dr. Rajesh Kumar', role: 'super_admin' },
  },
  {
    email: 'conductor@utms.edu',
    password: 'Conductor@123',
    user_metadata: { name: 'Vikram Singh', role: 'conductor' },
  },
  {
    email: 'student@utms.edu',
    password: 'Student@123',
    user_metadata: { name: 'Aarav Sharma', role: 'student', enrollment_number: 'U-2024-0042' },
  },
  {
    email: 'student_expired@utms.edu',
    password: 'Student@123',
    user_metadata: { name: 'Tanvi Deshmukh', role: 'student', enrollment_number: 'U-2023-0189' },
  },
  {
    email: 'student_wrong_bus@utms.edu',
    password: 'Student@123',
    user_metadata: { name: 'Arjun Patel', role: 'student', enrollment_number: 'U-2024-0056' },
  },
];

console.log('\n🌱 Seeding users via Supabase Admin API...\n');

// Step 1: Delete any existing seed users
console.log('🗑  Cleaning up existing seed users...');
const { data: existingData } = await admin.auth.admin.listUsers();
const existingUsers = existingData?.users || [];

for (const seedUser of SEED_USERS) {
  const existing = existingUsers.find(u => u.email === seedUser.email);
  if (existing) {
    // First clean up dependent data in public schema
    await admin.from('verification_logs').delete().or(`conductor_id.eq.${existing.id}`);
    await admin.from('passes').delete().eq('student_id', existing.id);
    await admin.from('pass_applications').delete().eq('student_id', existing.id);
    await admin.from('renewal_requests').delete().eq('student_id', existing.id);
    await admin.from('notifications').delete().eq('user_id', existing.id);
    await admin.from('profiles').delete().eq('id', existing.id);
    
    const { error } = await admin.auth.admin.deleteUser(existing.id);
    if (error) {
      console.log(`   ⚠️  Could not delete ${seedUser.email}: ${error.message}`);
    } else {
      console.log(`   🗑  Deleted ${seedUser.email}`);
    }
  }
}

// Step 2: Create fresh seed users via Admin API
console.log('\n👥 Creating seed users...');
const userIdMap = {};

for (const seedUser of SEED_USERS) {
  const { data, error } = await admin.auth.admin.createUser({
    email: seedUser.email,
    password: seedUser.password,
    email_confirm: true,
    user_metadata: seedUser.user_metadata,
  });

  if (error) {
    console.log(`   ❌ ${seedUser.email}: ${error.message}`);
  } else {
    console.log(`   ✅ ${seedUser.email} → id: ${data.user.id}`);
    userIdMap[seedUser.email] = data.user.id;
  }
}

// Wait for triggers to create profiles
console.log('\n⏳ Waiting for profile triggers...');
await new Promise(r => setTimeout(r, 2000));

// Step 3: Verify profiles were created
console.log('\n📋 Verifying profiles...');
for (const [email, userId] of Object.entries(userIdMap)) {
  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, name, email, role')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    console.log(`   ❌ No profile for ${email}: ${error?.message || 'not found'}`);
  } else {
    console.log(`   ✅ ${email} → role: ${profile.role}, name: ${profile.name}`);
  }
}

// Step 4: Seed operational data using the new user IDs
console.log('\n🚌 Seeding operational data...');

const adminId = userIdMap['admin@utms.edu'];
const conductorId = userIdMap['conductor@utms.edu'];
const studentId = userIdMap['student@utms.edu'];
const studentExpiredId = userIdMap['student_expired@utms.edu'];
const studentWrongBusId = userIdMap['student_wrong_bus@utms.edu'];

if (!adminId || !conductorId || !studentId || !studentExpiredId || !studentWrongBusId) {
  console.log('   ⚠️  Some users were not created, skipping operational data.');
} else {
  // Clean existing operational data
  await admin.from('verification_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('passes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('pass_applications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('buses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('stops').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('routes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('renewal_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Routes
  const route1Id = '11111111-1111-1111-1111-111111111111';
  const route2Id = '11111111-1111-1111-1111-111111111112';

  const { error: routeErr } = await admin.from('routes').upsert([
    { id: route1Id, name: 'Campus Express — North Gate', start_point: 'Main Gate', end_point: 'North Gate', distance: 4.20, is_active: true },
    { id: route2Id, name: 'Metro Link — Sector 15', start_point: 'Metro Station', end_point: 'Sector 15', distance: 8.70, is_active: true },
  ]);
  console.log(routeErr ? `   ❌ Routes: ${routeErr.message}` : '   ✅ Routes seeded');

  // Stops
  const { error: stopErr } = await admin.from('stops').insert([
    { route_id: route1Id, name: 'Main Gate', stop_order: 1, latitude: 28.613900, longitude: 77.209000 },
    { route_id: route1Id, name: 'Library', stop_order: 2, latitude: 28.614500, longitude: 77.209500 },
    { route_id: route1Id, name: 'North Gate', stop_order: 3, latitude: 28.615500, longitude: 77.210000 },
    { route_id: route2Id, name: 'Metro Station', stop_order: 1, latitude: 28.620000, longitude: 77.215000 },
    { route_id: route2Id, name: 'Hostel Block A', stop_order: 2, latitude: 28.621000, longitude: 77.216000 },
    { route_id: route2Id, name: 'Sector 15', stop_order: 3, latitude: 28.623000, longitude: 77.218000 },
  ]);
  console.log(stopErr ? `   ❌ Stops: ${stopErr.message}` : '   ✅ Stops seeded');

  // Buses
  const bus1Id = '22222222-2222-2222-2222-222222222221';
  const bus2Id = '22222222-2222-2222-2222-222222222222';
  const bus3Id = '22222222-2222-2222-2222-222222222223';

  const { error: busErr } = await admin.from('buses').upsert([
    { id: bus1Id, bus_number: 'UNI-001', capacity: 56, route_id: route1Id, driver_name: 'Ramesh Yadav', driver_contact: '+91-9812345001', fuel_level: 78, current_occupancy: 42, is_active: true, conductor_id: conductorId },
    { id: bus2Id, bus_number: 'UNI-002', capacity: 48, route_id: route2Id, driver_name: 'Suresh Patel', driver_contact: '+91-9812345002', fuel_level: 45, current_occupancy: 35, is_active: true, conductor_id: null },
    { id: bus3Id, bus_number: 'UNI-003', capacity: 50, route_id: route1Id, driver_name: 'Manoj Kumar', driver_contact: '+91-9812345003', fuel_level: 92, current_occupancy: 12, is_active: true, conductor_id: null },
  ]);
  console.log(busErr ? `   ❌ Buses: ${busErr.message}` : '   ✅ Buses seeded');

  // Passes (without QR tokens for now — they need HMAC signing)
  const crypto = await import('crypto');
  const QR_SECRET = env.QR_SECRET || 'super_secret_qr_token_signing_key_change_in_production';

  function makeQrToken(passId, studentUid, busUid, expiryMs) {
    const payload = { passId, studentId: studentUid, busId: busUid, exp: expiryMs };
    const hmac = crypto.createHmac('sha256', QR_SECRET).update(JSON.stringify(payload)).digest('hex');
    return Buffer.from(JSON.stringify({ ...payload, hmac })).toString('base64url');
  }

  const pass1Id = crypto.randomUUID();
  const pass2Id = crypto.randomUUID();
  const pass3Id = crypto.randomUUID();

  const futureExpiry = new Date();
  futureExpiry.setMonth(futureExpiry.getMonth() + 6);
  const pastExpiry = new Date('2026-05-01T12:00:00Z');

  const { error: passErr } = await admin.from('passes').insert([
    {
      id: pass1Id, student_id: studentId, route_id: route1Id, bus_id: bus1Id,
      status: 'active', manual_code: 'UTMS-4F8K92', expiry: futureExpiry.toISOString(),
      qr_token: makeQrToken(pass1Id, studentId, bus1Id, futureExpiry.getTime()),
    },
    {
      id: pass2Id, student_id: studentExpiredId, route_id: route1Id, bus_id: bus1Id,
      status: 'expired', manual_code: 'UTMS-D9WL47', expiry: pastExpiry.toISOString(),
      qr_token: makeQrToken(pass2Id, studentExpiredId, bus1Id, pastExpiry.getTime()),
    },
    {
      id: pass3Id, student_id: studentWrongBusId, route_id: route2Id, bus_id: bus2Id,
      status: 'active', manual_code: 'UTMS-R7XN3P', expiry: futureExpiry.toISOString(),
      qr_token: makeQrToken(pass3Id, studentWrongBusId, bus2Id, futureExpiry.getTime()),
    },
  ]);
  console.log(passErr ? `   ❌ Passes: ${passErr.message}` : '   ✅ Passes seeded');

  // Pass Applications
  const { error: appErr } = await admin.from('pass_applications').insert([
    { student_id: studentId, requested_route_id: route1Id, status: 'approved', payment_reference: 'PAY-SEED-01', admin_remarks: 'Approved automatically' },
    { student_id: studentExpiredId, requested_route_id: route1Id, status: 'approved', payment_reference: 'PAY-SEED-02', admin_remarks: 'Approved in seed' },
    { student_id: studentWrongBusId, requested_route_id: route2Id, status: 'approved', payment_reference: 'PAY-SEED-03', admin_remarks: 'Approved in seed' },
  ]);
  console.log(appErr ? `   ❌ Applications: ${appErr.message}` : '   ✅ Applications seeded');

  // Notifications
  const { error: notifErr } = await admin.from('notifications').insert([
    { user_id: null, severity: 'critical', message: 'Bus UNI-003 fuel sensor malfunction detected', source: 'Fleet Engine' },
    { user_id: null, severity: 'warning', message: 'High route utilization on Route 1 (85%+ peak load)', source: 'Telemetry' },
    { user_id: null, severity: 'info', message: 'Database replication completed successfully', source: 'Infrastructure' },
  ]);
  console.log(notifErr ? `   ❌ Notifications: ${notifErr.message}` : '   ✅ Notifications seeded');

  // Verification Logs
  const { error: logErr } = await admin.from('verification_logs').insert([
    { conductor_id: conductorId, pass_id: pass1Id, manual_code_used: 'UTMS-4F8K92', result: 'VALID', reason: null, method: 'qr' },
    { conductor_id: conductorId, pass_id: pass1Id, manual_code_used: 'UTMS-4F8K92', result: 'VALID', reason: null, method: 'manual' },
    { conductor_id: conductorId, pass_id: pass2Id, manual_code_used: 'UTMS-D9WL47', result: 'INVALID', reason: 'expired', method: 'qr' },
    { conductor_id: conductorId, pass_id: pass3Id, manual_code_used: 'UTMS-R7XN3P', result: 'INVALID', reason: 'wrong_bus', method: 'qr' },
  ]);
  console.log(logErr ? `   ❌ Verification Logs: ${logErr.message}` : '   ✅ Verification Logs seeded');
}

// Step 5: Final login test
console.log('\n🧪 Final login verification...');
const anonClient = createClient(SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

for (const seedUser of SEED_USERS) {
  const { data, error } = await anonClient.auth.signInWithPassword({
    email: seedUser.email,
    password: seedUser.password,
  });
  if (error) {
    console.log(`   ❌ ${seedUser.email}: ${error.message}`);
  } else {
    console.log(`   ✅ ${seedUser.email}: login OK (role: ${seedUser.user_metadata.role})`);
  }
}

console.log('\n✨ Seeding complete!\n');
