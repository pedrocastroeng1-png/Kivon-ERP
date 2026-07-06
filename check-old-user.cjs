const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function run() {
  const { data: p } = await supabaseAdmin.from('profiles').select('id').eq('code', 'admin').single();
  const { data: oldUser } = await supabaseAdmin.from('users').select('*, profiles(code)').eq('profile_id', p.id).limit(1).single();
  console.log(oldUser.profiles);
}
run();
