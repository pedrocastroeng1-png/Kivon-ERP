import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runSeed() {
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error("Please set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD in .env");
    process.exit(1);
  }

  try {
    // Check if user already exists
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) throw usersError;

    const existingUser = usersData.users.find((u: any) => u.email === adminEmail);

    let userId = existingUser?.id;

    if (!existingUser) {
      console.log(`Creating initial admin user: ${adminEmail}`);
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Administrador do Sistema'
        }
      });

      if (authError) throw authError;
      userId = authData.user.id;
    } else {
      console.log(`Admin user ${adminEmail} already exists.`);
    }

    // Get Admin Profile ID
    const { data: profileObj, error: profileObjError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('code', 'admin')
      .single();

    if (profileObjError || !profileObj) {
       throw new Error('Admin profile not found in database! Ensure profiles are seeded.');
    }

    // Ensure it exists in `users`
    const { data: userRec } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!userRec) {
      console.log("Inserting user into public.users...");
      const { error: userInsertError } = await supabaseAdmin
        .from('users')
        .insert({ 
          id: userId,
          profile_id: profileObj.id,
          full_name: 'Administrador do Sistema',
          active: true
        });

      if (userInsertError) throw userInsertError;
    } else {
      console.log("User already linked in public.users.");
    }

    console.log("Bootstrap success.");
  } catch (err: any) {
    console.error("Bootstrap failed:", err.message);
    process.exit(1);
  }
}

runSeed();
