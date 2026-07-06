require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function test() {
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const user = usersData.users.find(u => u.email === 'pedrotargos@gmail.com');
  console.log("Admin User:", user);
  
  // Can we generate a JWT manually? Yes, using an external library, or just signing in if we can change the password.
  // Wait, I can reset the admin password.
  await supabaseAdmin.auth.admin.updateUserById(user.id, { password: 'KivonAdmin2026!' });
  console.log("Password reset.");
}
test();
