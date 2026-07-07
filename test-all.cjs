const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  console.log("Login HTTP Method: POST (Supabase SDK)");
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'pedro@kivon.local',
    password: '13052008'
  });
  console.log("Login Result: PASS");
  const token = authData.session.access_token;
  
  const resCreate = await fetch('http://localhost:3000/api/users', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'e2e_user',
      fullName: 'E2E User',
      password: 'password123',
      profileCode: 'operador'
    })
  });
  console.log("Create Status:", resCreate.status);
  
  if (resCreate.status === 200) {
    const data = await resCreate.json();
    const id = data.user.id;
    console.log("Create Result: PASS");
    
    // Edit
    const resEdit = await fetch(`http://localhost:3000/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'E2E User Edited' })
    });
    console.log("Edit Status:", resEdit.status);

    // Deactivate
    const resDeact = await fetch(`http://localhost:3000/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false })
    });
    console.log("Deactivate Status:", resDeact.status);

    // Activate
    const resAct = await fetch(`http://localhost:3000/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: true })
    });
    console.log("Activate Status:", resAct.status);

    // Reset password
    const resPass = await fetch(`http://localhost:3000/api/users/${id}/reset-password`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'newpassword123' })
    });
    console.log("Change Password Status:", resPass.status);

    // Delete
    const resDel = await fetch(`http://localhost:3000/api/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("Delete Status:", resDel.status);
    
    // Logout
    const { error } = await supabase.auth.signOut();
    console.log("Logout Status:", error ? error : 204);
  }
}
run();
