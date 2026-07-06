const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function runTest() {
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: process.env.INITIAL_ADMIN_EMAIL || 'pedrotargos@gmail.com',
    password: process.env.INITIAL_ADMIN_PASSWORD || 'KivonAdmin2026!'
  });
  
  const token = authData.session.access_token;
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  const createRes = await fetch('http://localhost:3000/api/users', {
    method: 'POST',
    headers,
    body: JSON.stringify({ email: 'test_hist2_' + Date.now() + '@example.com', fullName: 'History', profileCode: 'operador', password: 'TestPassword123!', active: true })
  });
  const createData = await createRes.json();
  const userId = createData.user?.id;

  // Wait 1 sec for any triggers to finish
  await new Promise(r => setTimeout(r, 1000));

  const insertAuditRes = await supabaseAdmin.from('audit_logs').insert({
    table_name: 'users', record_id: userId, operation: 'update', old_data: {}, new_data: { test: true }, changed_by: userId
  });
  console.log("Audit Insert:", insertAuditRes.error || "Success");

  const delRes = await fetch(`http://localhost:3000/api/users/${userId}`, { method: 'DELETE', headers });
  console.log('Delete Response:', await delRes.json());
  
  const { data: userRec } = await supabaseAdmin.from('users').select('*').eq('id', userId).single();
  console.log('User Record After Delete:', userRec ? `Exists (Active: ${userRec.active})` : 'Does not exist');
}
runTest();
