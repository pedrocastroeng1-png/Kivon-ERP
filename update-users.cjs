const fs = require('fs');
let content = fs.readFileSync('src/features/users/pages/UsersPage.tsx', 'utf8');

const tableRegex = /<div className="overflow-x-auto">([\s\S]*?)<\/table>\s*<\/div>/;

const responsiveTable = `<div className="block lg:hidden space-y-4 p-4">
            {users.map((user) => (
              <div key={user.id} className="bg-kivon-card border border-kivon-border rounded-lg p-4 space-y-3 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-white text-base">{user.full_name}</h4>
                    <p className="text-sm text-kivon-text-sec">{user.profiles?.name || '-'}</p>
                  </div>
                  <span className={\`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 \${user.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}\`}>
                    {user.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-kivon-border/50 mt-2">
                  <Button variant="secondary" size="sm" onClick={() => openModal(user)} className="h-10 border-kivon-border bg-kivon-bg text-kivon-primary">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => toggleActive(user.id, user.active)}
                    isLoading={actionLoading === user.id}
                    className="h-10 border-kivon-border bg-kivon-bg text-white"
                  >
                    {user.active ? 'Inativar' : 'Ativar'}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => resendInvite(user.id)} disabled={actionLoading === \`invite-\${user.id}\`} className="h-10 border-kivon-border bg-kivon-bg text-kivon-primary">
                    {actionLoading === \`invite-\${user.id}\` ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                    Convite
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => sendResetPassword(user.id)} disabled={actionLoading === \`reset-\${user.id}\`} className="h-10 border-kivon-border bg-kivon-bg text-kivon-primary">
                    {actionLoading === \`reset-\${user.id}\` ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
                    Senha
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-sm text-kivon-text-sec">
              <thead className="bg-kivon-bg/50 text-xs uppercase text-kivon-text-sec">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nome</th>
                  <th className="px-6 py-4 font-semibold">Perfil</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kivon-border">
                {users.map((user) => (
                  <tr key={user.id} className="bg-kivon-card hover:bg-kivon-hover transition-colors group">
                    <td className="px-6 py-4 font-medium text-white">{user.full_name}</td>
                    <td className="px-6 py-4">{user.profiles?.name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={\`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 \${user.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}\`}>
                        {user.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(user)}
                          className="p-1 text-kivon-text-sec hover:text-kivon-primary transition-colors"
                          title="Editar perfil"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => resendInvite(user.id)}
                          disabled={actionLoading === \`invite-\${user.id}\`}
                          className="p-1 text-kivon-text-sec hover:text-kivon-primary disabled:opacity-50 transition-colors"
                          title="Reenviar convite"
                        >
                          {actionLoading === \`invite-\${user.id}\` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => sendResetPassword(user.id)}
                          disabled={actionLoading === \`reset-\${user.id}\`}
                          className="p-1 text-kivon-text-sec hover:text-kivon-primary disabled:opacity-50 transition-colors"
                          title="Redefinir senha"
                        >
                          {actionLoading === \`reset-\${user.id}\` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                        </button>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => toggleActive(user.id, user.active)}
                          isLoading={actionLoading === user.id}
                          className="bg-kivon-bg text-kivon-text-sec hover:text-white border border-kivon-border"
                        >
                          {user.active ? 'Inativar' : 'Ativar'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>`;

content = content.replace(tableRegex, responsiveTable);

// Fix select height in modal
content = content.replace(
  'className="flex h-10 w-full rounded-md border border-kivon-border bg-kivon-bg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-kivon-primary focus:border-kivon-primary transition-all"',
  'className="flex h-12 sm:h-10 w-full rounded-md border border-kivon-border bg-kivon-bg px-3 py-2 text-base sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-kivon-primary focus:border-kivon-primary transition-all"'
);

fs.writeFileSync('src/features/users/pages/UsersPage.tsx', content);
