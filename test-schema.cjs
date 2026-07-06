require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function test() {
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('profiles!inner(code)')
    .limit(1);
    
  console.log("data:", data);
  console.log("error:", error);
}
test();
