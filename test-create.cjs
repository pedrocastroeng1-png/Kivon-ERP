require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

async function test() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'pedrotargos@gmail.com',
    password: 'KivonAdmin2026!'
  });
  
  if (authError) {
    console.error("Login failed:", authError);
    return;
  }
  
  const token = authData.session.access_token;
  console.log("Logged in!");
  
  const res = await fetch('http://localhost:3000/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      email: 'test_admin_2@example.com',
      fullName: 'Test Admin 2',
      profileCode: 'admin',
      password: 'Password123!',
      active: true
    })
  });
  
  console.log("Status:", res.status);
  const body = await res.json();
  console.log("Response:", body);
}
test();
