require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedAdmin() {
  const email = 'pedrotargos@gmail.com';
  const password = '13052008';
  const fullName = 'Pedro';

  const { data: profileObj } = await supabase
    .from('profiles')
    .select('id')
    .eq('code', 'admin')
    .single();

  const { data: listData } = await supabase.auth.admin.listUsers();
  const existingUser = listData.users.find(u => u.email === email);
  
  if (existingUser) {
    console.log('User already exists, updating password...');
    await supabase.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });
    
    await supabase.from('users').upsert({
      id: existingUser.id,
      profile_id: profileObj.id,
      full_name: fullName,
      active: true,
      force_password_change: false
    });
    console.log('Admin user updated successfully.');
  } else {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });
    if (authError) {
      console.error(authError);
      return;
    }
    await supabase.from('users').insert({
      id: authData.user.id,
      profile_id: profileObj.id,
      full_name: fullName,
      active: true,
      force_password_change: false
    });
    console.log('Admin user created successfully.');
  }
}

seedAdmin();
