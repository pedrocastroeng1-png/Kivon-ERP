const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function run() {
  const { data, error } = await supabaseAdmin.from('users').select('*, profile_id(code)').limit(1);
  console.log("profile_id(code)", error || "Success");

  const { data: d2, error: e2 } = await supabaseAdmin.from('users').select('*, profiles(code)').limit(1);
  console.log("profiles(code)", e2 || "Success");
}
run();
