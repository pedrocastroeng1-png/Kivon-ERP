const fs = require('fs');
let content = fs.readFileSync('src/features/job-roles/pages/JobRolesPage.tsx', 'utf8');

const searchRegex = /<div className="mb-6 flex items-center rounded-lg border border-kivon-border bg-kivon-bg px-3 focus-within:ring-1 focus-within:ring-kivon-primary focus-within:border-kivon-primary transition-all">/;
content = content.replace(searchRegex, `<div className="mb-6 flex items-center rounded-lg border border-kivon-border bg-kivon-bg px-3 focus-within:ring-1 focus-within:ring-kivon-primary focus-within:border-kivon-primary transition-all h-12 sm:h-10">`);

content = content.replace(
  'className="w-full border-0 bg-transparent py-2.5 text-white placeholder-kivon-text-sec focus:ring-0 outline-none text-sm"',
  'className="w-full border-0 bg-transparent py-2.5 text-white placeholder-kivon-text-sec focus:ring-0 outline-none text-base sm:text-sm h-full"'
);

const tableRegex = /<div className="overflow-x-auto rounded-lg border border-kivon-border">([\s\S]*?)<\/table>\s*<\/div>/;

const responsiveTable = `<div className="block lg:hidden space-y-4">
            {filteredRoles.map((role) => (
              <div key={role.id} className="bg-kivon-card border border-kivon-border rounded-lg p-4 space-y-3 relative">
                <div>
                  <h4 className="font-medium text-white text-base">{role.name}</h4>
                  <p className="text-sm text-emerald-400 mt-1 font-medium">R$ {role.daily_rate.toFixed(2)} / dia</p>
                </div>
                
                {role.description && (
                  <div className="text-sm text-kivon-text-sec border-t border-kivon-border/50 pt-2">
                    {role.description}
                  </div>
                )}
                
                <div className="flex gap-2 pt-2 border-t border-kivon-border/50 mt-2">
                  <Button variant="secondary" size="sm" onClick={() => openModal(role)} className="flex-1 h-10 border-kivon-border bg-kivon-bg text-kivon-primary">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleDelete(role.id)} className="flex-1 h-10 border-kivon-border bg-kivon-bg text-red-400">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Inativar
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden lg:block overflow-x-auto rounded-lg border border-kivon-border">
            <table className="w-full text-left text-sm text-kivon-text-sec">
              <thead className="bg-kivon-bg/80 text-xs uppercase text-kivon-text-sec">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nome</th>
                  <th className="px-6 py-4 font-semibold">Valor da Diária</th>
                  <th className="px-6 py-4 font-semibold">Descrição</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kivon-border">
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="bg-kivon-card hover:bg-kivon-hover transition-colors group">
                    <td className="px-6 py-4 font-medium text-white">{role.name}</td>
                    <td className="px-6 py-4 font-medium text-emerald-400">R$ {role.daily_rate.toFixed(2)}</td>
                    <td className="px-6 py-4">{role.description || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(role)} className="p-2 text-kivon-text-sec hover:text-kivon-primary transition-colors" title="Editar">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(role.id)} className="p-2 text-kivon-text-sec hover:text-red-400 transition-colors" title="Inativar">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>`;

content = content.replace(tableRegex, responsiveTable);

fs.writeFileSync('src/features/job-roles/pages/JobRolesPage.tsx', content);
