const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'pedro@kivon.local',
    password: '13052008'
  });
  const token = authData.session.access_token;
  
  const delRes = await fetch('http://localhost:3000/api/users/a17b144a-2638-4884-bf9f-24faf08eecfa', {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log("Delete Status:", delRes.status);
  const delText = await delRes.text();
  console.log("Delete Body:", delText.substring(0, 200));
}
run();
