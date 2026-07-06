const fs = require('fs');
let code = fs.readFileSync('src/server/routes.ts', 'utf8');

const deleteMatch = `// Delete user
apiRouter.delete('/users/:id', requireAdmin, async (req, res) => {
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
    
    const { error: dbDeleteError } = await supabaseAdmin.from('users').delete().eq('id', id);
    if (dbDeleteError) throw dbDeleteError;

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
    res.status(500).json({ error: err.message || err.toString() });
  }
});`;

const deleteReplacement = `// Delete user
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
        action: 'UPDATE',
        old_data: userRec,
        new_data: { active: false, _reason: 'Soft delete due to existing history' },
        changed_by: req.headers['x-user-id'] || null
      });

      return res.json({ success: true, message: 'User deactivated because they have historical records.' });
    }

    // If no history, physically delete
    const { error: dbDeleteError } = await supabaseAdmin.from('users').delete().eq('id', id);
    if (dbDeleteError) throw dbDeleteError;

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (deleteError) throw deleteError;
    
    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      table_name: 'users',
      record_id: id,
      action: 'DELETE',
      old_data: userRec || {},
      new_data: {},
      changed_by: req.headers['x-user-id'] || null
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || err.toString() });
  }
});`;

code = code.replace(deleteMatch, deleteReplacement);
fs.writeFileSync('src/server/routes.ts', code);
