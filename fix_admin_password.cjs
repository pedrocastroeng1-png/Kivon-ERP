const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
  const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
  
  const email = 'pedrotargos@gmail.com';
  const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  const user = users.users.find(u => u.email === email);
  if (user) {
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: 'KivonAdmin2026!' });
    if (updateError) console.error("Update error:", updateError);
    else console.log("Password updated");
  } else {
    console.log("Admin user not found");
  }
}
run();
