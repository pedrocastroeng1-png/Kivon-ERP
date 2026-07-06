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
const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
    console.warn(`[Auth] Forbidden - Endpoint: ${req.method} ${req.originalUrl}, User ID: ${user.id}, Email: ${user.email || 'Unknown'}, Profile: ${profileCode || 'Unknown'}, Reason: Not an admin`);
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
};

const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
apiRouter.post('/users/clear-force-password', requireAuth, async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ force_password_change: false })
      .eq('id', userId);
      
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || err.toString() });
  }
});

// Create new user (Admin only)
apiRouter.post('/users', requireAdmin, async (req, res) => {
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
        // force_password_change: forcePasswordChange
      });

    if (userInsertError) throw userInsertError;

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      table_name: 'users',
      record_id: userId,
      operation: 'insert',
      old_data: {},
      new_data: { full_name: fullName, profile_code: profileCode, active },
      changed_by: req.headers['x-user-id'] || null
    });

    res.json({ success: true, user: authData.user });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || err.toString() });
  }
});

// Update user profile/status
apiRouter.put('/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { fullName, profileCode, active, forcePasswordChange } = req.body;
  
  try {
    const { data: oldUser } = await supabaseAdmin.from('users').select('*, profiles(code)').eq('id', id).single();
    
    // Prevent removing the last active admin
    if (oldUser?.profiles?.code === 'admin' && oldUser?.active === true) {
      const isBeingDeactivated = active === false;
      const isProfileChanged = profileCode && profileCode !== 'admin';
      
      if (isBeingDeactivated || isProfileChanged) {
        const { count: adminCount } = await supabaseAdmin
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('profile_id', oldUser.profile_id)
          .eq('active', true);
          
        if (adminCount === 1) {
          return res.status(409).json({ error: 'The system must always have at least one active administrator.' });
        }
      }
    }
    const updates: any = {};
    if (fullName !== undefined) updates.full_name = fullName;
    if (active !== undefined) updates.active = active;
    // if (forcePasswordChange !== undefined) updates.force_password_change = forcePasswordChange;

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
      operation: 'update',
      old_data: oldUser || {},
      new_data: updates,
      changed_by: req.headers['x-user-id'] || null
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || err.toString() });
  }
});

// Delete user
apiRouter.delete('/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { data: userRec } = await supabaseAdmin.from('users').select('*, profiles(code)').eq('id', id).single();
    
    // Prevent deleting last admin
    if (userRec?.profiles?.code === 'admin' && userRec?.active === true) {
      const { count: adminCount } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userRec.profile_id)
        .eq('active', true);
        
      if (adminCount === 1) {
        return res.status(409).json({ error: 'The system must always have at least one active administrator.' });
      }
    }

    // Check for historical business data
    const [
      { count: auditCount },
      { count: presenceCount },
      { count: photosCount },
      { count: notifCreatedCount },
      { count: notifResolvedCount }
    ] = await Promise.all([
      supabaseAdmin.from('audit_logs').select('*', { count: 'exact', head: true }).eq('changed_by', id),
      supabaseAdmin.from('presence').select('*', { count: 'exact', head: true }).eq('registered_by', id),
      supabaseAdmin.from('presence_photos').select('*', { count: 'exact', head: true }).eq('captured_by', id),
      supabaseAdmin.from('notifications').select('*', { count: 'exact', head: true }).eq('created_by', id),
      supabaseAdmin.from('notifications').select('*', { count: 'exact', head: true }).eq('resolved_by', id)
    ]);

    const hasHistory = (auditCount || 0) > 0 || 
                       (presenceCount || 0) > 0 || 
                       (photosCount || 0) > 0 || 
                       (notifCreatedCount || 0) > 0 || 
                       (notifResolvedCount || 0) > 0;

    if (hasHistory) {
      const { error: deactivateError } = await supabaseAdmin.from('users').update({ active: false }).eq('id', id);
      if (deactivateError) throw deactivateError;
      
      // Audit log for deactivation
      await supabaseAdmin.from('audit_logs').insert({
        table_name: 'users',
        record_id: id,
        operation: 'update',
        old_data: userRec,
        new_data: { active: false, _reason: 'Soft delete due to existing history' },
        changed_by: req.headers['x-user-id'] || null
      });

      return res.json({ success: true, message: 'User deactivated because they have historical records.' });
    }

    const { data: oldUser } = await supabaseAdmin.from('users').select('*').eq('id', id).single();
    
    const { error: dbDeleteError } = await supabaseAdmin.from('users').delete().eq('id', id);
    if (dbDeleteError) throw dbDeleteError;

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (deleteError) throw deleteError;
    
    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      table_name: 'users',
      record_id: id,
      operation: 'delete',
      old_data: oldUser || {},
      new_data: {},
      changed_by: req.headers['x-user-id'] || null
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || err.toString() });
  }
});

// Reset password by admin (directly set a new password)
apiRouter.post('/users/:id/reset-password', requireAdmin, async (req, res) => {
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
    // await supabaseAdmin.from('users').update({ force_password_change: true }).eq('id', id);

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      table_name: 'users',
      record_id: id,
      operation: 'update',
      old_data: {},
      new_data: { event: 'password_reset_by_admin' },
      changed_by: req.headers['x-user-id'] || null
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || err.toString() });
  }
});
