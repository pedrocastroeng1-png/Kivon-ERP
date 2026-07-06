import { supabaseAdmin, requireAdmin } from "../src/server/auth";

export default async function handler(req: any, res: any) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authPassed = await requireAdmin(req, res);
  if (authPassed !== null) {
    return; // Response already sent
  }

  const { email, fullName, profileCode } = req.body;

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName }
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    const { data: profileObj, error: profileObjError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('code', profileCode)
      .single();

    if (profileObjError || !profileObj) {
      throw new Error('Profile not found: ' + profileCode);
    }

    const { error: userInsertError } = await supabaseAdmin
      .from('users')
      .insert({ 
        id: userId,
        profile_id: profileObj.id,
        full_name: fullName,
        active: true
      });

    if (userInsertError) throw userInsertError;

    return res.status(200).json({ success: true, user: authData.user });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
