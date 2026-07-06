const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function run() {
  const { data } = await supabaseAdmin.from('users').select('*').eq('id', 'ceba9f51-7563-4c75-bd90-9ba67842aea1');
  console.log(data);
}
run();
