const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function run() {
  const { data, error } = await supabase.rpc('query_schema_not_a_real_rpc'); // We know this fails
}
run();
