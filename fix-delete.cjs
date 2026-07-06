const fs = require('fs');
let code = fs.readFileSync('src/server/routes.ts', 'utf8');

code = code.replace(
  /const \{ error: deleteError \} = await supabaseAdmin\.auth\.admin\.deleteUser\(id\);/g,
  `
    const { error: dbDeleteError } = await supabaseAdmin.from('users').delete().eq('id', id);
    if (dbDeleteError) throw dbDeleteError;

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);`
);

// also fix error reporting
code = code.replace(/res\.status\(500\)\.json\(\{ error: err\.message \}\);/g, 'res.status(500).json({ error: err.message || err.toString() });');

fs.writeFileSync('src/server/routes.ts', code);
