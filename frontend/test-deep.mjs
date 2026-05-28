/**
 * Deep diagnostic: test if the issue is specifically with the seed email addresses
 * or a broader database schema problem
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

console.log('\n🔬 Deep Auth Schema Diagnostic\n');

// Test 1: Can we list users at all?
console.log('[1] Listing all auth users...');
const { data: listData, error: listErr } = await admin.auth.admin.listUsers();
if (listErr) {
  console.log(`   ❌ Cannot list users: ${listErr.message}`);
  console.log('   → This means the auth schema is corrupted.');
} else {
  console.log(`   ✅ Listed ${listData.users.length} users`);
  listData.users.forEach(u => {
    console.log(`      - ${u.email} (id: ${u.id}, identities: ${u.identities?.length || 0})`);
  });
}

// Test 2: Try to directly query the auth schema via SQL (RPC)
console.log('\n[2] Checking auth.users via direct query...');
const { data: rpcData, error: rpcErr } = await admin.rpc('get_auth_user_role');
console.log(rpcErr ? `   Result: ${rpcErr.message}` : `   Result: ${JSON.stringify(rpcData)}`);

// Test 3: Check if the corrupted seed users still exist in auth.users
console.log('\n[3] Checking for orphaned seed users in profiles...');
const seedEmails = ['admin@utms.edu', 'conductor@utms.edu', 'student@utms.edu', 'student_expired@utms.edu', 'student_wrong_bus@utms.edu'];
const seedIds = [
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005',
];

for (const sid of seedIds) {
  const { data: prof, error: profErr } = await admin
    .from('profiles')
    .select('id, email, role')
    .eq('id', sid)
    .maybeSingle();
  if (prof) {
    console.log(`   Found orphaned profile: ${prof.email} (${prof.role}) — id=${sid}`);
  }
}

// Test 4: Create a completely fresh user with a unique email
console.log('\n[4] Creating fresh user with unique email...');
const uniqueEmail = `fresh_${Date.now()}@test.com`;
const { data: freshUser, error: freshErr } = await admin.auth.admin.createUser({
  email: uniqueEmail,
  password: 'Test@12345',
  email_confirm: true,
  user_metadata: { name: 'Fresh Test', role: 'student' },
});
if (freshErr) {
  console.log(`   ❌ Cannot create ANY user: ${freshErr.message}`);
  console.log('   → AUTH SCHEMA IS FUNDAMENTALLY BROKEN');
} else {
  console.log(`   ✅ Created ${uniqueEmail} → id=${freshUser.user.id}`);
  
  // Test login
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: loginData, error: loginErr } = await anonClient.auth.signInWithPassword({
    email: uniqueEmail,
    password: 'Test@12345',
  });
  console.log(loginErr ? `   ❌ Login: ${loginErr.message}` : `   ✅ Login works!`);
  
  // Cleanup
  await admin.auth.admin.deleteUser(freshUser.user.id);
  console.log(`   🗑  Cleaned up ${uniqueEmail}`);
}

// Test 5: Try to delete seed users by fixed IDs directly
console.log('\n[5] Attempting to delete old seed users by ID...');
for (let i = 0; i < seedIds.length; i++) {
  const { error: delErr } = await admin.auth.admin.deleteUser(seedIds[i]);
  console.log(delErr 
    ? `   ${seedEmails[i]}: ${delErr.message}` 
    : `   ✅ Deleted ${seedEmails[i]} (${seedIds[i]})`);
}

// Also clean orphaned profiles
console.log('\n[6] Cleaning orphaned profiles...');
for (const email of seedEmails) {
  const { error: delErr } = await admin.from('profiles').delete().eq('email', email);
  console.log(delErr ? `   ${email}: ${delErr.message}` : `   ✅ Cleaned profile ${email}`);
}

// Test 6: Try creating seed users AGAIN after cleanup
console.log('\n[7] Re-creating seed users after cleanup...');
const results = [];
for (const seedUser of [
  { email: 'admin@utms.edu', password: 'Admin@123', user_metadata: { name: 'Dr. Rajesh Kumar', role: 'super_admin' } },
  { email: 'conductor@utms.edu', password: 'Conductor@123', user_metadata: { name: 'Vikram Singh', role: 'conductor' } },
  { email: 'student@utms.edu', password: 'Student@123', user_metadata: { name: 'Aarav Sharma', role: 'student', enrollment_number: 'U-2024-0042' } },
]) {
  const { data, error } = await admin.auth.admin.createUser({
    email: seedUser.email,
    password: seedUser.password,
    email_confirm: true,
    user_metadata: seedUser.user_metadata,
  });
  if (error) {
    console.log(`   ❌ ${seedUser.email}: ${error.message}`);
  } else {
    console.log(`   ✅ ${seedUser.email} → id=${data.user.id}, identities=${data.user.identities?.length}`);
    results.push({ email: seedUser.email, id: data.user.id, password: seedUser.password });
  }
}

// Test 7: Login with newly created users
if (results.length > 0) {
  console.log('\n[8] Login test with re-created users...');
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  for (const r of results) {
    const { error: loginErr } = await anonClient.auth.signInWithPassword({
      email: r.email,
      password: r.password,
    });
    console.log(loginErr ? `   ❌ ${r.email}: ${loginErr.message}` : `   ✅ ${r.email}: LOGIN OK`);
  }
}

console.log('\n✨ Diagnostic complete.\n');
