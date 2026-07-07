const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
  let log = "";
  const appendLog = (msg) => {
    console.log(msg);
    log += msg + "\n";
  };
  
  try {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SECRET_KEY);
    
    appendLog("Login HTTP Method: POST (Supabase SDK)");
    appendLog("Login URL: /auth/v1/token?grant_type=password");
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'pedrotargos@gmail.com',
      password: 'KivonAdmin2026!'
    });
    
    if (authError) {
      appendLog("Login Result: FAIL - " + authError.message);
      return;
    }
    appendLog("Login Response Status: 200");
    appendLog("Login Result: PASS\n");
    
    const token = authData.session.access_token;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    appendLog("Create User HTTP Method: POST");
    appendLog("Create User URL: /api/users");
    const createRes = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        username: 'e2euser123',
        fullName: 'E2E Test User',
        profileCode: 'operador',
        password: 'TestPassword123!',
        active: true
      })
    });
    appendLog("Create User Response Status: " + createRes.status);
    const createText = await createRes.text();
    appendLog("Create User Response Body: " + createText);
    appendLog("Create User Result: " + (createRes.ok ? "PASS" : "FAIL") + "\n");
    
    let userId;
    if (createRes.ok) {
      userId = JSON.parse(createText).user.id;
    }
    
    if (userId) {
      appendLog("Edit User HTTP Method: PUT");
      appendLog("Edit User URL: /api/users/" + userId);
      const editRes = await fetch(`http://localhost:3000/api/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ fullName: 'E2E Test User Edited' })
      });
      appendLog("Edit User Response Status: " + editRes.status);
      appendLog("Edit User Response Body: " + await editRes.text());
      appendLog("Edit User Result: " + (editRes.ok ? "PASS" : "FAIL") + "\n");
      
      appendLog("Change Password HTTP Method: POST");
      appendLog("Change Password URL: /api/users/" + userId + "/reset-password");
      const cpRes = await fetch(`http://localhost:3000/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ password: 'NewTestPassword123!' })
      });
      appendLog("Change Password Response Status: " + cpRes.status);
      appendLog("Change Password Response Body: " + await cpRes.text());
      appendLog("Change Password Result: " + (cpRes.ok ? "PASS" : "FAIL") + "\n");
      
      appendLog("Delete User HTTP Method: DELETE");
      appendLog("Delete User URL: /api/users/" + userId);
      const delRes = await fetch(`http://localhost:3000/api/users/${userId}`, {
        method: 'DELETE',
        headers
      });
      appendLog("Delete User Response Status: " + delRes.status);
      appendLog("Delete User Response Body: " + await delRes.text());
      appendLog("Delete User Result: " + (delRes.ok ? "PASS" : "FAIL") + "\n");
    }
    
    appendLog("Logout HTTP Method: POST (Supabase SDK)");
    appendLog("Logout URL: /auth/v1/logout");
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) {
      appendLog("Logout Result: FAIL - " + logoutError.message);
    } else {
      appendLog("Logout Response Status: 204");
      appendLog("Logout Result: PASS\n");
    }
    
    const fs = require('fs');
    fs.writeFileSync('test-all-results.txt', log);
  } catch (e) {
    console.error(e);
  }
}
run();
