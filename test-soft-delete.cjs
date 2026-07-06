const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function runTest() {
  console.log('--- Starting Soft Delete Test ---');
  
  // Login as admin
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: process.env.INITIAL_ADMIN_EMAIL || 'pedrotargos@gmail.com',
    password: process.env.INITIAL_ADMIN_PASSWORD || 'KivonAdmin2026!'
  });
  
  const token = authData.session.access_token;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 1. Create User
  const createRes = await fetch('http://localhost:3000/api/users', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: 'test_user_history_' + Date.now() + '@example.com',
      fullName: 'History User',
      profileCode: 'operador',
      password: 'TestPassword123!',
      active: true
    })
  });
  
  const createData = await createRes.json();
  const userId = createData.user?.id;

  // Add historical data (audit log)
  await supabaseAdmin.from('audit_logs').insert({
    table_name: 'users',
    record_id: userId,
    action: 'UPDATE',
    old_data: {},
    new_data: { test: true },
    changed_by: userId
  });

  // 7. Delete User
  console.log('Attempting to delete user with history...');
  const delRes = await fetch(`http://localhost:3000/api/users/${userId}`, {
    method: 'DELETE',
    headers
  });
  const delData = await delRes.json();
  console.log('Delete Response:', delData);
  
  // Verify in database
  const { data: userRec } = await supabaseAdmin.from('users').select('*').eq('id', userId).single();
  console.log('User Record After Delete:', userRec ? `Exists (Active: ${userRec.active})` : 'Does not exist');

  // Verify in auth
  const { data: authRec } = await supabaseAdmin.auth.admin.getUserById(userId);
  console.log('Auth Record After Delete:', authRec.user ? 'Exists' : 'Does not exist');
}

runTest();
