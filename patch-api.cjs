const fs = require('fs');

const files = [
  'api/users/[id]/resend-invite.ts',
  'api/users/[id]/reset-password.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  const buggyAuth = `  // Fetch user profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('code')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.code !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }`;

  const fixedAuth = `  // Fetch user profile using the correct relationship
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('profiles!inner(code)')
    .eq('id', user.id)
    .single();

  const profileCodeFromJoin = (userData as any)?.profiles?.code;

  if (userError || profileCodeFromJoin !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }`;
  
  content = content.replace(buggyAuth, fixedAuth);
  fs.writeFileSync(file, content);
  console.log('Patched', file);
}
