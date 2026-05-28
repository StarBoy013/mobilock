// Supabase Migration Integration Test Runner
// Runs 10 test cases to validate connection, tables, auth, RLS, and Actions.

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually to load environment variables safely
const envPath = path.resolve(__dirname, './.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log('==================================================');
  console.log('MobiLock (UTMS) Supabase Integration Test Suite');
  console.log('==================================================\n');

  let testCount = 0;
  let passedCount = 0;

  async function assertTest(name, fn) {
    testCount++;
    console.log(`[TEST ${testCount}] Running: ${name}...`);
    try {
      await fn();
      console.log(`\x1b[32m✔ Passed\x1b[0m\n`);
      passedCount++;
    } catch (err) {
      console.log(`\x1b[31m✘ Failed: ${err.message || err}\x1b[0m\n`);
    }
  }

  // --------------------------------------------------
  // TEST 1: Supabase Connection & Config
  // --------------------------------------------------
  await assertTest('Supabase Client Configuration', async () => {
    if (!supabaseUrl.startsWith('https://')) throw new Error('Invalid URL format');
    if (!supabaseAnonKey) throw new Error('Anon Key is missing');
    console.log(`Connected to: ${supabaseUrl}`);
  });

  // --------------------------------------------------
  // TEST 2: Check Database Tables Existence
  // --------------------------------------------------
  await assertTest('Table Schema Audit (Check profiles table)', async () => {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      if (error.message.includes('does not exist')) {
        throw new Error('Database tables have not been created yet. Please execute the 20260524000000_init.sql script in your Supabase SQL Editor first.');
      }
      throw error;
    }
    console.log('Database tables detected and accessible.');
  });

  // --------------------------------------------------
  // TEST 3: Register / Create Auth User (Student)
  // --------------------------------------------------
  const studentEmail = `student_${Date.now()}@utms.edu`;
  let studentId = null;

  await assertTest('User Registration: Student Signup', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: studentEmail,
      password: 'password123',
      options: {
        data: {
          name: 'Aarav Sharma Test',
          role: 'student',
          enrollment_number: `U-2026-${Math.floor(Math.random() * 10000)}`,
        }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('User object not returned');
    studentId = data.user.id;
    console.log(`Registered Student UID: ${studentId}`);
  });

  // --------------------------------------------------
  // TEST 4: Register / Create Auth User (Admin)
  // --------------------------------------------------
  const adminEmail = `admin_${Date.now()}@utms.edu`;
  let adminId = null;

  await assertTest('User Registration: Admin Signup', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: adminEmail,
      password: 'password123',
      options: {
        data: {
          name: 'Super Admin Test',
          role: 'super_admin',
        }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('Admin user object not returned');
    adminId = data.user.id;
    console.log(`Registered Admin UID: ${adminId}`);
  });

  // --------------------------------------------------
  // TEST 5: Verify Auth Sync Trigger (Profiles Table)
  // --------------------------------------------------
  await assertTest('SQL Trigger Verification: Profile Creation', async () => {
    if (!studentId) throw new Error('Student sign-up was skipped or failed');
    
    // Wait for the trigger database function to execute
    await sleep(2000);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Profile record was not created by trigger');
    if (data.role !== 'student') throw new Error(`Incorrect role mapped: ${data.role}`);
    console.log(`Trigger created profile record: ${data.name} (${data.role})`);
  });

  // --------------------------------------------------
  // TEST 6: Fetch Routes
  // --------------------------------------------------
  await assertTest('Fetch Routes Table Query', async () => {
    const { data, error } = await supabase.from('routes').select('*');
    if (error) throw error;
    console.log(`Found ${data ? data.length : 0} routes in database.`);
  });

  // --------------------------------------------------
  // TEST 7: Fetch Buses
  // --------------------------------------------------
  await assertTest('Fetch Buses Table Query', async () => {
    const { data, error } = await supabase.from('buses').select('*');
    if (error) throw error;
    console.log(`Found ${data ? data.length : 0} buses in database.`);
  });

  // --------------------------------------------------
  // TEST 8: Submit Pass Application
  // --------------------------------------------------
  let applicationId = null;
  await assertTest('Submit Pass Application Flow', async () => {
    if (!studentId) throw new Error('Student sign-up failed');
    
    // Authenticate client as the created student
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: studentEmail,
      password: 'password123',
    });
    if (signInError) throw signInError;

    // Fetch any active route to apply
    const { data: routes } = await supabase.from('routes').select('id').limit(1);
    if (!routes || routes.length === 0) {
      throw new Error('No active routes found. Seed routes first before executing application tests.');
    }
    const routeId = routes[0].id;

    // Call submit applications endpoint (inserts record)
    const { data, error } = await supabase
      .from('pass_applications')
      .insert({
        student_id: studentId,
        requested_route_id: routeId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    applicationId = data.id;
    console.log(`Submitted Application ID: ${applicationId}`);
  });

  // --------------------------------------------------
  // TEST 9: Admin Access and RLS Restrictions Check
  // --------------------------------------------------
  await assertTest('RLS Policies Security Check (Student access limits)', async () => {
    if (!applicationId) throw new Error('No application generated');
    
    // Attempt to select pass_applications for another user (should be restricted by RLS)
    const { data, error } = await supabase
      .from('pass_applications')
      .select('*')
      .neq('student_id', studentId);
      
    if (error) throw error;
    if (data && data.length > 0) {
      throw new Error('RLS Breach: Student is able to read pass applications belonging to other users!');
    }
    console.log('Security RLS policies working. Access is isolated.');
  });

  // --------------------------------------------------
  // TEST 10: Sign Out Flow
  // --------------------------------------------------
  await assertTest('Session Termination: User Sign Out', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    console.log('Client session signed out successfully.');
  });

  // --------------------------------------------------
  // SUMMARY
  // --------------------------------------------------
  console.log('==================================================');
  console.log(`TEST RUN COMPLETED: ${passedCount} / ${testCount} PASSED`);
  console.log('==================================================');

  if (passedCount === testCount) {
    console.log('\x1b[32m✔ All integration tests completed successfully!\x1b[0m');
  } else {
    console.log('\x1b[31m✘ Some integration tests failed. Please review outputs above.\x1b[0m');
  }
}

runTests().catch(err => {
  console.error('Runner error:', err);
  process.exit(1);
});
