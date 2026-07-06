const fs = require('fs');

let content = fs.readFileSync('src/features/auth/pages/LoginPage.tsx', 'utf8');

// Change state
content = content.replace(
  "const [email, setEmail] = useState('');",
  "const [username, setUsername] = useState('');"
);

// Change signInWithPassword call
content = content.replace(
  "email,",
  "email: `${username}@kivon.local`,"
);

// Change label and input
content = content.replace(
  "<label className=\"block text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2 transition-colors group-focus-within:text-white/70\" htmlFor=\"email\">Email Corporativo</label>",
  "<label className=\"block text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2 transition-colors group-focus-within:text-white/70\" htmlFor=\"username\">Nome de Usuário</label>"
);

content = content.replace(
  "id=\"email\"\n                type=\"email\"",
  "id=\"username\"\n                type=\"text\""
);

content = content.replace(
  "placeholder=\"nome@empresa.com\"",
  "placeholder=\"usuario\""
);

content = content.replace(
  "value={email}\n                onChange={(e) => setEmail(e.target.value)}",
  "value={username}\n                onChange={(e) => setUsername(e.target.value)}"
);

fs.writeFileSync('src/features/auth/pages/LoginPage.tsx', content);
console.log('Patched LoginPage.tsx');
