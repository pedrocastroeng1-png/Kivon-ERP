import express from "express";
import cors from "cors";
import { supabaseAdmin, requireAdmin, requireAuth } from "./auth";

export const apiRouter = express.Router();
apiRouter.use(cors());
apiRouter.use(express.json());

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
  const { username, fullName, profileCode, password, forcePasswordChange = true, active = true } = req.body;
  
  try {
    // Create user via Supabase Auth admin API directly (no invite email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: `${username}@kivon.local`,
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

    // Check for historical business data (soft delete disabled as we now use DB cascades)
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
