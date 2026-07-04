import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Middleware to verify if the requesting user is an admin
  const verifyAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('code')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.code !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }

    next();
  };

  // Create new user (Admin only)
  app.post('/api/users', verifyAdmin, async (req, res) => {
    const { email, fullName, profileCode } = req.body;
    
    try {
      // Create user via Supabase Auth admin API. It will send an invite email by default
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName
        }
      });
      
      if (authError) throw authError;

      const userId = authData.user.id;

      // Find profile id
      const { data: profileObj, error: profileObjError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('code', profileCode)
        .single();

      if (profileObjError || !profileObj) {
         throw new Error('Profile not found: ' + profileCode);
      }

      // Update users table - insert if new
      const { error: userInsertError } = await supabaseAdmin
        .from('users')
        .insert({ 
          id: userId,
          profile_id: profileObj.id,
          full_name: fullName,
          active: true
        });

      if (userInsertError) throw userInsertError;

      res.json({ success: true, user: authData.user });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Resend invite
  app.post('/api/users/:id/resend-invite', verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(id);
      if (userError) throw userError;
      
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(userData.user.email!);
      if (inviteError) throw inviteError;
      
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Reset password email
  app.post('/api/users/:id/reset-password', verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(id);
      if (userError) throw userError;
      
      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(userData.user.email!);
      if (resetError) throw resetError;
      
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bootstrap initial admin
  async function bootstrapAdmin() {
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'pedrotargos@gmail.com';
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'KivonAdmin2026!';

    try {
      const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      if (usersError) {
        console.warn("Skipping bootstrap: Unable to fetch users. Ensure SUPABASE_SECRET_KEY is valid.");
        return;
      }

      const existingUser = usersData.users.find((u: any) => u.email === adminEmail);
      let userId = existingUser?.id;

      if (!existingUser) {
        console.log(`Creating initial admin user: ${adminEmail}`);
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: { full_name: 'Administrador do Sistema' }
        });

        if (authError) throw authError;
        userId = authData.user.id;
      } else {
        console.log(`Initial admin user ${adminEmail} already exists.`);
      }

      const { data: profileObj, error: profileObjError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('code', 'admin')
        .single();

      if (profileObjError || !profileObj) {
        console.warn("Skipping bootstrap link: Admin profile not found in database.");
        return;
      }

      const { data: userRec } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (!userRec) {
        console.log("Linking initial admin to public.users...");
        const { error: userInsertError } = await supabaseAdmin
          .from('users')
          .insert({ 
            id: userId,
            profile_id: profileObj.id,
            full_name: 'Administrador do Sistema',
            active: true
          });

        if (userInsertError) throw userInsertError;
      }
    } catch (err: any) {
      console.error("Admin bootstrap failed:", err.message);
    }
  }

  await bootstrapAdmin();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
