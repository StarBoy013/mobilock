/**
 * Diagnostic Test Suite for Supabase Auth
 * Tests 10 different aspects of the authentication pipeline
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load env vars from .env.local
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

let passed = 0;
let failed = 0;

function result(name, pass, detail) {
  if (pass) {
    passed++;
    console.log(`  ✅ PASS: ${name}`);
  } else {
    failed++;
    console.log(`  ❌ FAIL: ${name}`);
  }
  if (detail) console.log(`     ↳ ${detail}`);
}

console.log('\n🔍 UTMS Supabase Auth Diagnostic Tests');
console.log('='.repeat(55));

// --------------------------------------------------
// TEST 1: Environment variables are set
// --------------------------------------------------
console.log('\n[Test 1] Environment Variables');
const urlOk = !!SUPABASE_URL && SUPABASE_URL.startsWith('https://');
const anonOk = !!SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.startsWith('eyJ');
const serviceOk = !!SUPABASE_SERVICE_KEY && SUPABASE_SERVICE_KEY.startsWith('eyJ');
result('SUPABASE_URL is valid', urlOk, SUPABASE_URL || 'MISSING');
result('ANON_KEY is a JWT', anonOk, anonOk ? `${SUPABASE_ANON_KEY.substring(0, 30)}...` : (SUPABASE_ANON_KEY || 'MISSING'));
result('SERVICE_ROLE_KEY is a JWT', serviceOk, serviceOk ? `${SUPABASE_SERVICE_KEY.substring(0, 30)}...` : 'MISSING or invalid');

if (!urlOk || !anonOk) {
  console.log('\n💀 Cannot continue without valid URL and ANON_KEY.');
  process.exit(1);
}

// --------------------------------------------------
// TEST 2: Supabase REST endpoint reachable
// --------------------------------------------------
console.log('\n[Test 2] Supabase REST API Reachability');
try {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: { 'apikey': SUPABASE_ANON_KEY }
  });
  result('REST /rest/v1/ reachable', res.ok, `status=${res.status}`);
} catch (e) {
  result('REST /rest/v1/ reachable', false, e.message);
}

// --------------------------------------------------
// TEST 3: Auth health endpoint
// --------------------------------------------------
console.log('\n[Test 3] GoTrue Auth Health');
try {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/health`);
  const body = await res.text();
  result('Auth health endpoint', res.ok, `status=${res.status} body=${body.substring(0, 100)}`);
} catch (e) {
  result('Auth health endpoint', false, e.message);
}

// --------------------------------------------------
// TEST 4: Direct signInWithPassword (admin@utms.edu)
// --------------------------------------------------
console.log('\n[Test 4] signInWithPassword - admin@utms.edu');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
try {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@utms.edu',
    password: 'Admin@123',
  });
  if (error) {
    result('Admin login', false, `${error.name}: ${error.message} (status: ${error.status})`);
  } else {
    result('Admin login', !!data.session, `user_id=${data.user?.id}`);
  }
} catch (e) {
  result('Admin login', false, e.message);
}

// --------------------------------------------------
// TEST 5: Raw GoTrue token endpoint (bypass JS client)
// --------------------------------------------------
console.log('\n[Test 5] Raw POST to /auth/v1/token?grant_type=password');
try {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: 'admin@utms.edu',
      password: 'Admin@123',
    }),
  });
  const body = await res.json();
  result('Raw auth POST', res.ok, res.ok 
    ? `access_token starts: ${body.access_token?.substring(0, 20)}...` 
    : `status=${res.status} error=${JSON.stringify(body)}`);
} catch (e) {
  result('Raw auth POST', false, e.message);
}

// --------------------------------------------------
// TEST 6: Check if auth.users exist (via service role)
// --------------------------------------------------
console.log('\n[Test 6] Check auth.users via Admin API');
if (serviceOk) {
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  try {
    const { data, error } = await adminClient.auth.admin.listUsers();
    if (error) {
      result('List auth users', false, `${error.message}`);
    } else {
      const seedEmails = ['admin@utms.edu', 'conductor@utms.edu', 'student@utms.edu'];
      const found = data.users?.filter(u => seedEmails.includes(u.email)) || [];
      result('List auth users', found.length > 0, `Total users: ${data.users?.length}, Seed users found: ${found.length}`);
      
      // Check identities on first seed user found
      if (found.length > 0) {
        const user = found[0];
        const hasIdentities = user.identities && user.identities.length > 0;
        result('Seed user has identities', hasIdentities, 
          hasIdentities 
            ? `identities: ${JSON.stringify(user.identities.map(i => i.provider))}` 
            : `User ${user.email} has NO identities — THIS IS THE PROBLEM`);
      }
    }
  } catch (e) {
    result('List auth users', false, e.message);
  }
} else {
  result('List auth users', false, 'SERVICE_ROLE_KEY missing — skipped');
  result('Seed user has identities', false, 'SERVICE_ROLE_KEY missing — skipped');
}

// --------------------------------------------------
// TEST 7: Check profiles table is accessible
// --------------------------------------------------
console.log('\n[Test 7] Profiles Table Accessibility');
try {
  const { data, error } = await supabase.from('profiles').select('id, email, role').limit(5);
  if (error) {
    result('Query profiles', false, `${error.message} (code: ${error.code})`);
  } else {
    result('Query profiles', true, `Returned ${data.length} rows`);
  }
} catch (e) {
  result('Query profiles', false, e.message);
}

// --------------------------------------------------
// TEST 8: Check routes table
// --------------------------------------------------
console.log('\n[Test 8] Routes Table Accessibility');
try {
  const { data, error } = await supabase.from('routes').select('id, name').limit(5);
  if (error) {
    result('Query routes', false, `${error.message} (code: ${error.code})`);
  } else {
    result('Query routes', true, `Returned ${data.length} rows`);
  }
} catch (e) {
  result('Query routes', false, e.message);
}

// --------------------------------------------------
// TEST 9: Try creating a user via admin API & login
// --------------------------------------------------
console.log('\n[Test 9] Create fresh test user via Admin API & Login');
if (serviceOk) {
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const testEmail = `test_diag_${Date.now()}@utms.edu`;
  try {
    // Delete if exists
    const { data: listData } = await adminClient.auth.admin.listUsers();
    const existing = listData?.users?.find(u => u.email === testEmail);
    if (existing) await adminClient.auth.admin.deleteUser(existing.id);

    // Create via admin API (this properly creates identities)
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: 'TestDiag@123',
      email_confirm: true,
      user_metadata: { name: 'Test Diagnostic', role: 'student' },
    });

    if (createErr) {
      result('Create test user via Admin API', false, createErr.message);
    } else {
      result('Create test user via Admin API', true, `id=${created.user.id}`);

      // Now try to login with this fresh user
      const freshClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: loginData, error: loginErr } = await freshClient.auth.signInWithPassword({
        email: testEmail,
        password: 'TestDiag@123',
      });

      if (loginErr) {
        result('Login with fresh test user', false, `${loginErr.name}: ${loginErr.message}`);
      } else {
        result('Login with fresh test user', true, `session=${!!loginData.session}`);
      }

      // Cleanup
      await adminClient.auth.admin.deleteUser(created.user.id);
    }
  } catch (e) {
    result('Create test user via Admin API', false, e.message);
  }
} else {
  result('Create test user via Admin API', false, 'SERVICE_ROLE_KEY missing');
  result('Login with fresh test user', false, 'SERVICE_ROLE_KEY missing');
}

// --------------------------------------------------
// TEST 10: Check get_auth_user_role() function exists
// --------------------------------------------------
console.log('\n[Test 10] Database Function & RLS Check');
if (serviceOk) {
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  try {
    const { data, error } = await adminClient.rpc('get_auth_user_role');
    // When called without auth, should return null but not error
    result('get_auth_user_role() callable', !error, 
      error ? `${error.message}` : `returned: ${JSON.stringify(data)}`);
  } catch (e) {
    result('get_auth_user_role() callable', false, e.message);
  }
} else {
  result('get_auth_user_role() callable', false, 'SERVICE_ROLE_KEY missing');
}

// --------------------------------------------------
// Summary
// --------------------------------------------------
console.log('\n' + '='.repeat(55));
console.log(`📊 Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
if (failed > 0) {
  console.log('⚠️  Check the FAIL entries above for the root cause.');
}
console.log('');
