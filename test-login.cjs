require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

async function test() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const username = 'pedro';
  const email = `${username}@kivon.local`;

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password: '13052008'
  });
  
  if (authError) {
    console.error("Login failed:", authError.message);
    return;
  }
  
  console.log("Logged in successfully! User ID:", authData.user.id);
}
test();
