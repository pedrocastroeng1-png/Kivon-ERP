const fs = require('fs');
let content = fs.readFileSync('src/features/projects/pages/ProjectsPage.tsx', 'utf8');

const tableRegex = /<div className="overflow-x-auto rounded-lg border border-kivon-border">([\s\S]*?)<\/table>\s*<\/div>/;

const responsiveTable = `<div className="block lg:hidden space-y-4">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-kivon-card border border-kivon-border rounded-lg p-4 space-y-3 relative">
                <div>
                  <h4 className="font-medium text-white text-base pr-20">{project.name}</h4>
                  <p className="text-sm text-kivon-text-sec">{project.code || 'Sem código'} • {project.client_name || 'Sem cliente'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-kivon-border/50">
                  <div>
                    <span className="text-kivon-text-sec block text-xs">Cidade</span>
                    <span className="text-white font-medium">{project.city || '-'}</span>
                  </div>
                  <div>
                    <span className="text-kivon-text-sec block text-xs">Início</span>
                    <span className="text-white font-medium">{project.started_at ? format(parseISO(project.started_at), 'dd/MM/yyyy') : '-'}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" size="sm" onClick={() => openAllocationModal(project.id)} className="flex-1 h-10 border-kivon-border bg-kivon-bg">
                    <Users className="h-4 w-4 mr-2" />
                    Alocar
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => openModal(project)} className="flex-1 h-10 border-kivon-border bg-kivon-bg text-kivon-primary">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden lg:block overflow-x-auto rounded-lg border border-kivon-border">
            <table className="w-full text-left text-sm text-kivon-text-sec">
              <thead className="bg-kivon-bg/80 text-xs uppercase text-kivon-text-sec">
                <tr>
                  <th className="px-6 py-4 font-semibold">Código</th>
                  <th className="px-6 py-4 font-semibold">Nome</th>
                  <th className="px-6 py-4 font-semibold">Cliente</th>
                  <th className="px-6 py-4 font-semibold">Cidade</th>
                  <th className="px-6 py-4 font-semibold">Início</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kivon-border">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="bg-kivon-card hover:bg-kivon-hover transition-colors group">
                    <td className="px-6 py-4">{project.code || '-'}</td>
                    <td className="px-6 py-4 font-medium text-white">{project.name}</td>
                    <td className="px-6 py-4">{project.client_name || '-'}</td>
                    <td className="px-6 py-4">{project.city || '-'}</td>
                    <td className="px-6 py-4">{project.started_at ? format(parseISO(project.started_at), 'dd/MM/yyyy') : '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openAllocationModal(project.id)} className="p-2 text-kivon-text-sec hover:text-emerald-400 transition-colors" title="Alocar Funcionários">
                          <Users className="h-4 w-4" />
                        </button>
                        <button onClick={() => openModal(project)} className="p-2 text-kivon-text-sec hover:text-kivon-primary transition-colors" title="Editar">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(project.id)} className="p-2 text-kivon-text-sec hover:text-red-400 transition-colors" title="Inativar">
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
fs.writeFileSync('src/features/projects/pages/ProjectsPage.tsx', content);
