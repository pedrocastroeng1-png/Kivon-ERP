const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function run() {
  const { data: p } = await supabaseAdmin.from('profiles').select('id').eq('code', 'admin').single();
  const { data } = await supabaseAdmin.from('users').select('*').eq('profile_id', p.id);
  console.log(data.map(u => ({ id: u.id, name: u.full_name, active: u.active })));
}
run();
