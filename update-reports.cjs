const fs = require('fs');
let content = fs.readFileSync('src/features/daily-reports/pages/DailyReportsPage.tsx', 'utf8');

// The Table is wrapped in `<div className="overflow-x-auto">`
// We'll replace it with responsive cards.
const tableRegex = /<div className="overflow-x-auto">([\s\S]*?)<\/table>\s*<\/div>/;

const responsiveTable = `<div className="block lg:hidden">
            <div className="space-y-4 p-4">
              {data.map((row) => {
                const hasEvidence = row.photo_url || row.photo_error;
                const photoIndex = hasEvidence ? photosArray.findIndex(p => p.url === row.photo_url && p.error === row.photo_error) : -1;
                return (
                  <div key={row.employee_id} className="bg-kivon-card border border-kivon-border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {hasEvidence ? (
                          <div 
                            className={cn(
                              "h-12 w-12 rounded-md cursor-pointer border flex items-center justify-center overflow-hidden hover:opacity-80 transition relative shrink-0",
                              row.photo_error ? "bg-red-500/10 border-red-500/20" : "border-kivon-border bg-kivon-bg"
                            )}
                            onClick={() => photoIndex !== -1 && openPhoto(photoIndex)}
                          >
                            {row.photo_url ? (
                               <img src={row.photo_url} alt="Foto" className="w-full h-full object-cover" />
                            ) : (
                               <ImageIcon className="h-5 w-5 text-red-400 opacity-80" />
                            )}
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-md bg-kivon-bg border border-kivon-border flex items-center justify-center text-kivon-text-sec shrink-0">
                            <ImageIcon className="h-6 w-6 opacity-50" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium text-white text-base">{row.employee_name}</h4>
                          <p className="text-sm text-kivon-text-sec">{row.job_role}</p>
                        </div>
                      </div>
                      <span className={\`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border \${getStatusBadgeClass(row.status)}\`}>
                        {row.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-kivon-border/50">
                      <div>
                        <span className="text-kivon-text-sec block text-xs">Diária</span>
                        <span className="text-white font-medium">{row.diarias.toString().replace('.', ',')}</span>
                      </div>
                      <div>
                        <span className="text-kivon-text-sec block text-xs">Valor</span>
                        <span className="text-emerald-400 font-medium">R$ {row.valor.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-sm text-kivon-text-sec">
              <thead className="bg-kivon-bg/80 text-xs uppercase text-kivon-text-sec">
                <tr>
                  <th className="px-6 py-4 font-semibold w-16">Foto</th>
                  <th className="px-6 py-4 font-semibold">Funcionário</th>
                  <th className="px-6 py-4 font-semibold">Cargo</th>
                  <th className="px-6 py-4 font-semibold">Obra</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Diária</th>
                  <th className="px-6 py-4 font-semibold text-right">Valor</th>
                  <th className="px-6 py-4 font-semibold">Registro</th>
                  <th className="px-6 py-4 font-semibold">Registrado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kivon-border">
                {data.map((row) => {
                  const hasEvidence = row.photo_url || row.photo_error;
                  const photoIndex = hasEvidence ? photosArray.findIndex(p => p.url === row.photo_url && p.error === row.photo_error) : -1;
                  return (
                  <tr key={row.employee_id} className="bg-kivon-card hover:bg-kivon-hover transition-colors">
                    <td className="px-6 py-3">
                      {hasEvidence ? (
                        <div 
                          className={cn(
                            "h-10 w-10 rounded-md cursor-pointer border flex items-center justify-center overflow-hidden hover:opacity-80 transition relative",
                            row.photo_error ? "bg-red-500/10 border-red-500/20" : "border-kivon-border bg-kivon-bg"
                          )}
                          onClick={() => photoIndex !== -1 && openPhoto(photoIndex)}
                        >
                          {row.photo_url ? (
                             <img src={row.photo_url} alt="Foto" className="w-full h-full object-cover" />
                          ) : (
                             <ImageIcon className="h-5 w-5 text-red-400 opacity-80" />
                          )}
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-kivon-bg border border-kivon-border flex items-center justify-center text-kivon-text-sec">
                          <ImageIcon className="h-5 w-5 opacity-50" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{row.employee_name}</td>
                    <td className="px-6 py-4">{row.job_role}</td>
                    <td className="px-6 py-4">{row.project_name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={\`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border \${getStatusBadgeClass(row.status)}\`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">{row.diarias.toString().replace('.', ',')}</td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-400">
                      R$ {row.valor.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-6 py-4 text-kivon-text-sec">{format(new Date(row.registered_at), 'HH:mm')}</td>
                    <td className="px-6 py-4 text-kivon-text-sec">{row.registered_by}</td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>`;

content = content.replace(tableRegex, responsiveTable);
fs.writeFileSync('src/features/daily-reports/pages/DailyReportsPage.tsx', content);
