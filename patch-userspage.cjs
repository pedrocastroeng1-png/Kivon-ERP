const fs = require('fs');

let content = fs.readFileSync('src/features/users/pages/UsersPage.tsx', 'utf8');

// Update schema
content = content.replace(
  "email: z.string().email('E-mail inválido').optional().or(z.literal('')),",
  "username: z.string().optional().or(z.literal('')),"
);

// Update createdUser state
content = content.replace(
  "email: string;",
  "username: string;"
);

// Update Create flow validation
content = content.replace(
  "if (!data.email) throw new Error(\"E-mail é obrigatório para novos usuários\");",
  "if (!data.username) throw new Error(\"Nome de usuário é obrigatório para novos usuários\");"
);

// Update payload to api
content = content.replace(
  "email: data.email,",
  "username: data.username,"
);

// Update createdUser payload
content = content.replace(
  "email: data.email,",
  "username: data.username,"
);

// Update Input fields in the form
content = content.replace(
  "<Input label=\"E-mail\" type=\"email\" {...register('email')} error={errors.email?.message} className=\"bg-kivon-bg border-kivon-border text-white\" />",
  "<Input label=\"Nome de Usuário\" type=\"text\" {...register('username')} error={errors.username?.message} className=\"bg-kivon-bg border-kivon-border text-white\" />"
);

// Update CreatedUser Modal
content = content.replace(
  "<p className=\"text-kivon-text-sec mb-1\">Email:</p>",
  "<p className=\"text-kivon-text-sec mb-1\">Username:</p>"
);
content = content.replace(
  "<p className=\"text-white\">{createdUser.email}</p>",
  "<p className=\"text-white\">{createdUser.username}</p>"
);

// Update text copy
content = content.replace(
  "Email:\\n${createdUser.email}",
  "Username:\\n${createdUser.username}"
);

fs.writeFileSync('src/features/users/pages/UsersPage.tsx', content);
console.log('Patched UsersPage.tsx');
