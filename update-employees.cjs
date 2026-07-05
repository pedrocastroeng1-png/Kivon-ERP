const fs = require('fs');
let content = fs.readFileSync('src/features/employees/pages/EmployeesPage.tsx', 'utf8');

const searchRegex = /<div className="mb-6 flex items-center rounded-lg border border-kivon-border bg-kivon-bg px-3 focus-within:ring-1 focus-within:ring-kivon-primary focus-within:border-kivon-primary transition-all">/;
content = content.replace(searchRegex, `<div className="mb-6 flex items-center rounded-lg border border-kivon-border bg-kivon-bg px-3 focus-within:ring-1 focus-within:ring-kivon-primary focus-within:border-kivon-primary transition-all h-12 sm:h-10">`);

content = content.replace(
  'className="w-full border-0 bg-transparent py-2.5 text-white placeholder-kivon-text-sec focus:ring-0 outline-none text-sm"',
  'className="w-full border-0 bg-transparent py-2.5 text-white placeholder-kivon-text-sec focus:ring-0 outline-none text-base sm:text-sm h-full"'
);

const tableRegex = /<div className="overflow-x-auto rounded-lg border border-kivon-border">([\s\S]*?)<\/table>\s*<\/div>/;

const responsiveTable = `<div className="block lg:hidden space-y-4">
            {filteredEmployees.map((emp) => (
              <div key={emp.id} className="bg-kivon-card border border-kivon-border rounded-lg p-4 space-y-3 relative">
                <div>
                  <h4 className="font-medium text-white text-base">{emp.full_name}</h4>
                  <span className="inline-flex mt-1 items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400 border border-indigo-500/20">
                    {emp.job_roles?.name || '-'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-kivon-border/50">
                  <div>
                    <span className="text-kivon-text-sec block text-xs">Documento</span>
                    <span className="text-white font-medium">{emp.document_number || '-'}</span>
                  </div>
                  <div>
                    <span className="text-kivon-text-sec block text-xs">Telefone</span>
                    <span className="text-white font-medium">{emp.phone || '-'}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2 border-t border-kivon-border/50 mt-2">
                  <Button variant="secondary" size="sm" onClick={() => openModal(emp)} className="flex-1 h-10 border-kivon-border bg-kivon-bg text-kivon-primary">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleDelete(emp.id)} className="flex-1 h-10 border-kivon-border bg-kivon-bg text-red-400">
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
                  <th className="px-6 py-4 font-semibold">Cargo</th>
                  <th className="px-6 py-4 font-semibold">Documento</th>
                  <th className="px-6 py-4 font-semibold">Telefone</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kivon-border">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="bg-kivon-card hover:bg-kivon-hover transition-colors group">
                    <td className="px-6 py-4 font-medium text-white">{emp.full_name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400 border border-indigo-500/20">
                        {emp.job_roles?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{emp.document_number || '-'}</td>
                    <td className="px-6 py-4">{emp.phone || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(emp)} className="p-2 text-kivon-text-sec hover:text-kivon-primary transition-colors" title="Editar">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(emp.id)} className="p-2 text-kivon-text-sec hover:text-red-400 transition-colors" title="Inativar">
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

// Fix select height in modal
content = content.replace(
  'className="flex h-10 w-full rounded-lg border border-kivon-border bg-kivon-bg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-kivon-primary focus:border-kivon-primary transition-all"',
  'className="flex h-12 sm:h-10 w-full rounded-lg border border-kivon-border bg-kivon-bg px-3 py-2 text-base sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-kivon-primary focus:border-kivon-primary transition-all"'
);

fs.writeFileSync('src/features/employees/pages/EmployeesPage.tsx', content);
