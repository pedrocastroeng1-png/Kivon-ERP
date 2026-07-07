const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SECRET_KEY);
  
  // 1. Sign in as admin
  console.log("Logging in...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'pedrotargos@gmail.com',
    password: 'KivonAdmin2026!'
  });
  
  if (authError) {
    console.error("Login failed:", authError.message);
    process.exit(1);
  }
  
  const token = authData.session.access_token;
  console.log("Got token");
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  // Create User
  console.log("Testing Create User...");
  const createRes = await fetch('http://localhost:3000/api/users', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      username: 'testuser123',
      fullName: 'Test User',
      profileCode: 'operador',
      password: 'TestPassword123!',
      active: true
    })
  });
  console.log("POST /api/users Status:", createRes.status);
  const createText = await createRes.text();
  console.log("Body:", createText);
  let userId;
  if (createRes.ok) {
    const data = JSON.parse(createText);
    userId = data.user.id;
  }
  
  // Edit User
  if (userId) {
    console.log("Testing Edit User...");
    const editRes = await fetch(`http://localhost:3000/api/users/${userId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        fullName: 'Test User Edited',
      })
    });
    console.log("PUT /api/users/:id Status:", editRes.status);
    console.log("Body:", await editRes.text());
    
    // Change Password
    console.log("Testing Change Password...");
    const cpRes = await fetch(`http://localhost:3000/api/users/${userId}/reset-password`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        password: 'NewTestPassword123!'
      })
    });
    console.log("POST /api/users/:id/reset-password Status:", cpRes.status);
    console.log("Body:", await cpRes.text());
    
    // Delete User
    console.log("Testing Delete User...");
    const delRes = await fetch(`http://localhost:3000/api/users/${userId}`, {
      method: 'DELETE',
      headers
    });
    console.log("DELETE /api/users/:id Status:", delRes.status);
    console.log("Body:", await delRes.text());
  }
}
run();
