import { createClient } from "@supabase/supabase-js";

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

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    return res.status(500).json({ error: 'Missing Supabase Admin credentials' });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

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
