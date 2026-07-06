const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTest() {
  console.log('--- Starting Auth Flow Validation ---');
  
  // 0. Login as admin
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: process.env.INITIAL_ADMIN_EMAIL || 'pedrotargos@gmail.com',
    password: process.env.INITIAL_ADMIN_PASSWORD || 'KivonAdmin2026!'
  });
  
  if (authError) {
    console.error('Login Failed:', authError.message);
    return;
  }
  
  const token = authData.session.access_token;
  console.log('Admin logged in. Token acquired.');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  let userId;

  // 1. Create User
  console.log('\n1. Create User');
  const createRes = await fetch('http://localhost:3000/api/users', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: 'test_user_' + Date.now() + '@example.com',
      fullName: 'Test User',
      profileCode: 'operador',
      password: 'TestPassword123!',
      active: true,
      forcePasswordChange: true
    })
  });
  
  console.log('Create Status:', createRes.status);
  const createData = await createRes.json();
  console.log('Create Response:', createData);
  
  if (createRes.status !== 200) {
    console.error('Create Failed');
    return;
  }
  
  userId = createData.user?.id || createData.id;
  if(!userId) {
     console.log('Could not find userId in response.');
     return;
  }

  // 2. Edit User & 3. Change Profile
  console.log('\n2. Edit User & 3. Change Profile');
  const editRes = await fetch(`http://localhost:3000/api/users/${userId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      fullName: 'Test User Updated',
      profileCode: 'admin'
    })
  });
  
  console.log('Edit Status:', editRes.status);
  const editData = await editRes.json();
  console.log('Edit Response:', editData);

  // 4. Reset Password
  console.log('\n4. Reset Password');
  const resetRes = await fetch(`http://localhost:3000/api/users/${userId}/reset-password`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      password: 'NewTestPassword123!'
    })
  });
  console.log('Reset Password Status:', resetRes.status);
  const resetData = await resetRes.json();
  console.log('Reset Password Response:', resetData);

  // 5. Deactivate User
  console.log('\n5. Deactivate User');
  const deactRes = await fetch(`http://localhost:3000/api/users/${userId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      active: false
    })
  });
  console.log('Deactivate Status:', deactRes.status);
  const deactData = await deactRes.json();
  console.log('Deactivate Response:', deactData);
  
  // 6. Activate User
  console.log('\n6. Activate User');
  const actRes = await fetch(`http://localhost:3000/api/users/${userId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      active: true
    })
  });
  console.log('Activate Status:', actRes.status);
  const actData = await actRes.json();
  console.log('Activate Response:', actData);

  // 7. Delete User
  console.log('\n7. Delete User');
  const delRes = await fetch(`http://localhost:3000/api/users/${userId}`, {
    method: 'DELETE',
    headers
  });
  console.log('Delete Status:', delRes.status);
  const delData = await delRes.json();
  console.log('Delete Response:', delData);
  
  console.log('\n--- Test Completed ---');
}

runTest();
