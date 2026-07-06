const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function run() {
  const { data: p } = await supabaseAdmin.from('profiles').select('id').eq('code', 'admin').single();
  const { count } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('profile_id', p.id).eq('active', true);
  console.log("Active admins count:", count);
}
run();
