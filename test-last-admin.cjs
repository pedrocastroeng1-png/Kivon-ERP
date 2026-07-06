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

  const { data: adminUser } = await supabaseAdmin.from('users').select('id').eq('full_name', 'Administrador do Sistema').single();
  const userId = adminUser.id;

  // Try to deactivate
  console.log('Attempting to deactivate last admin...');
  const deactRes = await fetch(`http://localhost:3000/api/users/${userId}`, { 
    method: 'PUT', 
    headers,
    body: JSON.stringify({ active: false }) 
  });
  console.log('Deactivate Status:', deactRes.status);
  console.log('Deactivate Response:', await deactRes.json());
  
  // Try to delete
  console.log('Attempting to delete last admin...');
  const delRes = await fetch(`http://localhost:3000/api/users/${userId}`, { 
    method: 'DELETE', 
    headers 
  });
  console.log('Delete Status:', delRes.status);
  console.log('Delete Response:', await delRes.json());
}
runTest();
