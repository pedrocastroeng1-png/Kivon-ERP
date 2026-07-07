import { supabaseAdmin } from '../auth.js';

export class UserService {
  static async createUser({ username, fullName, profileCode, password, active = true, changedBy }: any) {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: `${username}@kivon.local`,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    const { data: profileObj, error: profileObjError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('code', profileCode)
      .single();

    if (profileObjError || !profileObj) {
       throw { status: 404, message: 'Profile not found: ' + profileCode };
    }

    const { error: userInsertError } = await supabaseAdmin
      .from('users')
      .insert({ 
        id: userId,
        profile_id: profileObj.id,
        full_name: fullName,
        active: active,
      });

    if (userInsertError) throw userInsertError;

    await supabaseAdmin.from('audit_logs').insert({
      table_name: 'users',
      record_id: userId,
      operation: 'insert',
      old_data: {},
      new_data: { full_name: fullName, profile_code: profileCode, active },
      changed_by: changedBy
    });

    return authData.user;
  }

  static async updateUser(id: string, { fullName, profileCode, active, changedBy }: any) {
    const { data: oldUser } = await supabaseAdmin.from('users').select('*, profiles(code)').eq('id', id).single();

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
          throw { status: 409, message: 'The system must always have at least one active administrator.' };
        }
      }
    }

    const updates: any = {};
    if (fullName !== undefined) updates.full_name = fullName;
    if (active !== undefined) updates.active = active;

    if (profileCode) {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('code', profileCode)
        .single();
      if (data) {
        updates.profile_id = data.id;
      }
    }

    const { error: userUpdateError } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id);

    if (userUpdateError) throw userUpdateError;

    if (fullName) {
      await supabaseAdmin.auth.admin.updateUserById(id, { user_metadata: { full_name: fullName } });
    }

    await supabaseAdmin.from('audit_logs').insert({
      table_name: 'users',
      record_id: id,
      operation: 'update',
      old_data: oldUser || {},
      new_data: updates,
      changed_by: changedBy
    });
  }

  static async deleteUser(id: string, changedBy: string | null) {
    const { data: userRec, error: userRecError } = await supabaseAdmin.from('users').select('*, profiles(code)').eq('id', id).single();
    if (userRecError) {
      console.log('[DELETE] userRecError:', JSON.stringify(userRecError, null, 2));
    }
    
    if (userRec?.profiles?.code === 'admin' && userRec?.active === true) {
      const { count: adminCount } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userRec.profile_id)
        .eq('active', true);
        
      if (adminCount === 1) {
        throw { status: 409, message: 'The system must always have at least one active administrator.' };
      }
    }

    const { data: oldUser } = await supabaseAdmin.from('users').select('*').eq('id', id).single();
    
    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      table_name: 'users',
      record_id: id,
      operation: 'delete',
      old_data: oldUser || {},
      new_data: {},
      changed_by: changedBy
    });

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (deleteError) throw deleteError;
  }

  static async resetPassword(id: string, password: string, changedBy: string | null) {
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(id);
    if (userError) throw userError;
    
    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: password
    });
    
    if (resetError) throw resetError;
    
    await supabaseAdmin.from('audit_logs').insert({
      table_name: 'users',
      record_id: id,
      operation: 'update',
      old_data: {},
      new_data: { event: 'password_reset_by_admin' },
      changed_by: changedBy
    });
  }

  static async clearForcePassword(userId: string) {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ force_password_change: false })
      .eq('id', userId);
      
    if (error) throw error;
  }
}
