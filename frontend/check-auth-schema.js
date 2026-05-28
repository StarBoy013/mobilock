const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Querying auth schema information...');
  // We can query custom functions or view tables from pg_catalog if we have permissions, 
  // or we can just try to run a simple select.
  // Actually, we can run a query via RPC or check if profiles are correct.
  // Let's do a simple query to see if we can read from public profiles.
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log('Public Profiles check:', { data, error });
}

check().catch(console.error);
