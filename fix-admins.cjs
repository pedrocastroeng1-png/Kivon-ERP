const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function run() {
  // Activate system admin
  await supabaseAdmin.from('users').update({ active: true }).eq('id', 'b855b1ff-ff91-4ae3-b379-2269b6cfb554');
  
  // Physically delete old test admin
  await supabaseAdmin.from('users').delete().eq('id', 'ceba9f51-7563-4c75-bd90-9ba67842aea1');
  await supabaseAdmin.auth.admin.deleteUser('ceba9f51-7563-4c75-bd90-9ba67842aea1');
  
  console.log("Cleanup done.");
}
run();
