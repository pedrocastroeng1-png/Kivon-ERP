const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'pedro@kivon.local',
    password: '13052008'
  });
  const token = authData.session.access_token;
  
  const resCreate = await fetch('http://localhost:3000/api/users', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'prod_deleteme2',
      fullName: 'Delete Me Prod 2',
      password: 'password123',
      profileCode: 'operador'
    })
  });
  console.log("Create Status:", resCreate.status);
  
  if (resCreate.status === 200) {
    const data = await resCreate.json();
    console.log("Created ID:", data.user.id);
    
    const resDel = await fetch(`http://localhost:3000/api/users/${data.user.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("Delete Status:", resDel.status);
  }
}
run();
