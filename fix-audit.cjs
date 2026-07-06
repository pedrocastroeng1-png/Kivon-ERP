const fs = require('fs');
let code = fs.readFileSync('src/server/routes.ts', 'utf8');

code = code.replace(/action: 'INSERT'/g, "operation: 'insert'");
code = code.replace(/action: 'UPDATE'/g, "operation: 'update'");
code = code.replace(/action: 'DELETE'/g, "operation: 'delete'");

fs.writeFileSync('src/server/routes.ts', code);
