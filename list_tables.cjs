const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function run() {
  const { data, error } = await supabase.from('users').select('*, presence(id)').limit(1);
  console.log(error);
}
run();
