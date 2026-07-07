const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'pedrotargos@gmail.com',
    password: 'KivonAdmin2026!'
  });
  if (error) console.error(error);
  else console.log(data.session.access_token);
}
run();
