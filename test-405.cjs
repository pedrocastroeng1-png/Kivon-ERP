const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'pedro@kivon.local',
    password: '13052008'
  });
  const token = authData.session.access_token;

  console.log("Creating user...");
  const resCreate = await fetch('http://localhost:3000/api/users', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'deleteme2',
      fullName: 'Delete Me 2',
      password: 'password123',
      profileCode: 'operador'
    })
  });
  console.log("Create Status:", resCreate.status);
  const createText = await resCreate.text();
  console.log("Create Body:", createText.substring(0, 200));
}
run();
