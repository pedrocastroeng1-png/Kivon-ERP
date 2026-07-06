const fs = require('fs');
let code = fs.readFileSync('src/server/routes.ts', 'utf8');

code = code.replace(/force_password_change: forcePasswordChange/g, '// force_password_change: forcePasswordChange');
code = code.replace(/if \(forcePasswordChange !== undefined\) updates\.force_password_change = forcePasswordChange;/g, '// if (forcePasswordChange !== undefined) updates.force_password_change = forcePasswordChange;');
code = code.replace(/await supabaseAdmin\.from\('users'\)\.update\(\{ force_password_change: true \}\)\.eq\('id', id\);/g, '// await supabaseAdmin.from(\'users\').update({ force_password_change: true }).eq(\'id\', id);');

fs.writeFileSync('src/server/routes.ts', code);
