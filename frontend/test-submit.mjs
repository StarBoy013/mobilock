import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load .env.local
const envPath = '.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
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

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
  console.log('Logging in as student@utms.edu...');
  const { data: authData, error: authErr } = await client.auth.signInWithPassword({
    email: 'student@utms.edu',
    password: 'Student@123'
  });

  if (authErr) {
    console.error('Login failed:', authErr.message);
    return;
  }

  const userId = authData.user.id;
  console.log('Logged in successfully. User ID:', userId);

  // Check if profile exists
  const { data: profile } = await client.from('profiles').select('*').eq('id', userId).single();
  console.log('Student Profile:', JSON.stringify(profile));

  // Get active route
  const { data: routes } = await client.from('routes').select('*').eq('is_active', true).limit(1);
  if (!routes || routes.length === 0) {
    console.error('No active routes found!');
    return;
  }
  const routeId = routes[0].id;
  console.log('Using Route ID:', routeId);

  // Clean up any existing pending applications for this student first to isolate the test
  await serviceClient.from('pass_applications').delete().eq('student_id', userId).eq('status', 'pending');

  console.log('Inserting application via client (simulating submitPassApplication)...');
  const { data: app, error: insertErr } = await client
    .from('pass_applications')
    .insert({
      student_id: userId,
      requested_route_id: routeId,
      status: 'pending'
    })
    .select()
    .maybeSingle();

  if (insertErr) {
    console.error('❌ Insert failed:', insertErr);
  } else {
    console.log('✅ Insert worked! App details:', JSON.stringify(app));
    // Clean up
    await serviceClient.from('pass_applications').delete().eq('id', app.id);
  }
}

run().catch(console.error);
