const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function runTest() {
  const { data, error } = await supabaseAdmin.from('audit_logs').insert({
    table_name: 'users',
    record_id: 'c56795b7-5e8e-4612-96e9-84ccaf29d09d',
    action: 'UPDATE',
    old_data: {},
    new_data: { test: true },
    changed_by: 'c56795b7-5e8e-4612-96e9-84ccaf29d09d' // doesn't exist anymore, so maybe it failed because FK?
  });
  console.log(error);
}
runTest();
