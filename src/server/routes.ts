import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const apiRouter = express.Router();

apiRouter.use(cors());
apiRouter.use(express.json());

// Middleware to verify if the requesting user is an admin
const verifyAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.warn(`[Auth] ${req.method} ${req.originalUrl} - Missing Authorization header`);
    return res.status(401).json({ error: 'Missing Authorization header' });
  }
  
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  
  if (error || !user) {
    console.warn(`[Auth] ${req.method} ${req.originalUrl} - Invalid token`);
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Set user id in headers for subsequent use (like clear-password-flag)
  req.headers['x-user-id'] = user.id;

  // Fetch user profile using the correct relationship
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('profiles!inner(code)')
    .eq('id', user.id)
    .single();

  const profileCode = (userData as any)?.profiles?.code;

  if (userError || profileCode !== 'admin') {
    console.warn(`[Auth] ${req.method} ${req.originalUrl} - Access Denied. User ID: ${user.id}, Profile: ${profileCode || 'Unknown'}, Reason: Not an admin`);
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }

  next();
};

const verifyAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.warn(`[Auth] ${req.method} ${req.originalUrl} - Missing Authorization header`);
    return res.status(401).json({ error: 'Missing Authorization header' });
  }
  
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  
  if (error || !user) {
    console.warn(`[Auth] ${req.method} ${req.originalUrl} - Invalid token`);
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.headers['x-user-id'] = user.id;
  next();
};

// Clear force password flag (Authenticated User)
apiRouter.post('/users/clear-force-password', verifyAuth, async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ force_password_change: false })
      .eq('id', userId);
      
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create new user (Admin only)
apiRouter.post('/users', verifyAdmin, async (req, res) => {
  const { email, fullName, profileCode, password, forcePasswordChange = true, active = true } = req.body;
  
  try {
    // Create user via Supabase Auth admin API directly (no invite email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
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
        active: active,
        force_password_change: forcePasswordChange
      });

    if (userInsertError) throw userInsertError;

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      table_name: 'users',
      record_id: userId,
      action: 'INSERT',
      old_data: {},
      new_data: { full_name: fullName, profile_code: profileCode, active },
      changed_by: req.headers['x-user-id'] || null
    });

    res.json({ success: true, user: authData.user });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update user profile/status
apiRouter.put('/users/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { fullName, profileCode, active, forcePasswordChange } = req.body;
  
  try {
    const updates: any = {};
    if (fullName !== undefined) updates.full_name = fullName;
    if (active !== undefined) updates.active = active;
    if (forcePasswordChange !== undefined) updates.force_password_change = forcePasswordChange;

    let profileObj = null;
    if (profileCode) {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('code', profileCode)
        .single();
      if (data) {
        profileObj = data;
        updates.profile_id = data.id;
      }
    }

    const { data: oldUser } = await supabaseAdmin.from('users').select('*').eq('id', id).single();

    const { error: userUpdateError } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id);

    if (userUpdateError) throw userUpdateError;

    // also update auth metadata if full name changed
    if (fullName) {
      await supabaseAdmin.auth.admin.updateUserById(id, { user_metadata: { full_name: fullName } });
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      table_name: 'users',
      record_id: id,
      action: 'UPDATE',
      old_data: oldUser || {},
      new_data: updates,
      changed_by: req.headers['x-user-id'] || null
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete user
apiRouter.delete('/users/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { data: userRec } = await supabaseAdmin.from('users').select('*, profile_id(code)').eq('id', id).single();
    
    // Prevent deleting last admin
    if (userRec?.profile_id?.code === 'admin') {
      const { count: adminCount, error: countError } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userRec.profile_id.id)
        .eq('active', true);
        
      if (adminCount === 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user.' });
      }
    }

    const { data: oldUser } = await supabaseAdmin.from('users').select('*').eq('id', id).single();

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (deleteError) throw deleteError;
    
    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      table_name: 'users',
      record_id: id,
      action: 'DELETE',
      old_data: oldUser || {},
      new_data: {},
      changed_by: req.headers['x-user-id'] || null
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Reset password by admin (directly set a new password)
apiRouter.post('/users/:id/reset-password', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  try {
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(id);
    if (userError) throw userError;
    
    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: password
    });
    
    if (resetError) throw resetError;
    
    // Set force password change
    await supabaseAdmin.from('users').update({ force_password_change: true }).eq('id', id);

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      table_name: 'users',
      record_id: id,
      action: 'UPDATE',
      old_data: {},
      new_data: { event: 'password_reset_by_admin' },
      changed_by: req.headers['x-user-id'] || null
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
