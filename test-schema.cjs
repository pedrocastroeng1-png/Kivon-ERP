const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function check() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  console.log(data, error);
}
check();
