import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/shared/lib/supabase';
import { Button } from '@/src/shared/components/ui/Button';
import { Input } from '@/src/shared/components/ui/Input';
import { Loader2, Download, Search, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Modal } from '@/src/shared/components/ui/Modal';
import { useAuth } from '@/src/app/providers/AuthProvider';
import { cn } from '@/src/shared/lib/utils';
import { imageService } from '@/src/shared/services/ImageService';
import toast from 'react-hot-toast';

interface ProjectRecord {
  id: string;
  name: string;
}

interface PresenceRecord {
  id: string;
  presence_date: string;
  shift: string;
  status: string;
  registered_at: string;
  users: { full_name: string } | null; // registered_by
  employees: { 
    id: string; 
    full_name: string; 
    job_roles: { name: string; daily_rate: number } | null;
  } | null;
  projects: ProjectRecord | null;
  presence_photos?: { storage_path: string } | null;
  photo_url?: string;
  photo_error?: boolean;
}

interface ConsolidatedDailyRecord {
  employee_id: string;
  employee_name: string;
  job_role: string;
  project_name: string;
  status: string;
  diarias: number;
  valor: number;
  registered_at: string; // we'll use the earliest or latest capture
  registered_by: string;
  photo_url: string | null;
  photo_error?: boolean;
}

interface DailyReportSummary {
  previstos: number;
  presentes: number;
  faltas: number;
  atestados: number;
  ferias: number;
  folgas: number;
  totalDiarias: number;
  valorTotal: number;
}

export default function DailyReportsPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.profiles?.code === 'admin';
  const [data, setData] = useState<ConsolidatedDailyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [projectId, setProjectId] = useState('');
  
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  
  // Photo modal
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  // Summary State
  const [summary, setSummary] = useState<DailyReportSummary>({
    previstos: 0,
    presentes: 0,
    faltas: 0,
    atestados: 0,
    ferias: 0,
    folgas: 0,
    totalDiarias: 0,
    valorTotal: 0
  });

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchData();
  }, [dateFilter, projectId]);

  async function fetchFilters() {
    const { data: pRes } = await supabase.from('projects').select('id, name').order('name');
    if (pRes) setProjects(pRes as unknown as ProjectRecord[]);
  }

  async function fetchData() {
    setLoading(true);

    let query = supabase
      .from('presence')
      .select(`
        id,
        presence_date,
        shift,
        status,
        registered_at,
        users!registered_by (full_name),
        employees (id, full_name, job_roles(name, daily_rate)),
        projects (id, name),
        presence_photos (storage_path)
      `)
      .eq('presence_date', dateFilter)
      .eq('active', true)
      .order('registered_at', { ascending: false });

    try {
      if (projectId) query = query.eq('project_id', projectId);

      const { data: rawResult, error } = await query;
      const result = rawResult as unknown as PresenceRecord[] | null;

      if (error) {
        throw error;
      }

      if (result) {
        const records = await Promise.all(result.map(async (row) => {
          let photo_url: string | null = '';
          let photo_error = false;
          if (row.presence_photos?.storage_path) {
            photo_url = await imageService.getPresencePhoto(row.presence_photos.storage_path);
            if (!photo_url) {
              photo_error = true;
            }
          }
          return { ...row, photo_url, photo_error };
        }));

        // Consolidate Data
        const grouped = new Map<string, PresenceRecord[]>();
        records.forEach((r) => {
          if (!r.employees || !r.employees.job_roles) {
             throw new Error('Falha de permissão ao carregar dados de funcionários ou cargos. Verifique com um administrador.');
          }
          if (!r.projects) {
             throw new Error('Falha de permissão ao carregar dados de projetos. Verifique com um administrador.');
          }
          const key = r.employees.id;
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key)!.push(r);
        });

        const consolidated: ConsolidatedDailyRecord[] = [];
        let previstos = grouped.size;
        let sPresentes = 0;
        let sFaltas = 0;
        let sAtestados = 0;
        let sFerias = 0;
        let sFolgas = 0;
        let sTotalDiarias = 0;
        let sValorTotal = 0;

        grouped.forEach((groupRecords, empId) => {
          let countPresente = 0;
          let cFaltou = 0, cAtestado = 0, cFerias = 0, cFolga = 0;
          const statuses = new Set<string>();

          groupRecords.forEach(r => {
            statuses.add(r.status);
            if (r.status === 'PRESENTE') { countPresente++; sPresentes += 0.5; }
            if (r.status === 'FALTOU') { cFaltou++; sFaltas += 0.5; }
            if (r.status === 'ATESTADO') { cAtestado++; sAtestados += 0.5; }
            if (r.status === 'FERIAS') { cFerias++; sFerias += 0.5; }
            if (r.status === 'FOLGA') { cFolga++; sFolgas += 0.5; }
          });

          const diarias = countPresente * 0.5;
          const baseRate = groupRecords[0].employees!.job_roles!.daily_rate || 0;
          const valor = diarias * baseRate;

          sTotalDiarias += diarias;
          sValorTotal += valor;

          let finalStatus = '';
          const morning = groupRecords.find(r => r.shift === 'manha');
          const afternoon = groupRecords.find(r => r.shift === 'tarde');

          if (morning && afternoon) {
            if (morning.status === afternoon.status) {
              finalStatus = `${morning.status} (Manhã e Tarde)`;
            } else {
              finalStatus = `${morning.status} (Manhã) / ${afternoon.status} (Tarde)`;
            }
          } else if (morning) {
            finalStatus = `${morning.status} (Manhã)`;
          } else if (afternoon) {
            finalStatus = `${afternoon.status} (Tarde)`;
          }

          // Get the photo (prefer morning if exists, else whatever)
          const photoRecWithUrl = groupRecords.find(r => r.photo_url);
          const photoRecWithError = groupRecords.find(r => r.photo_error);

          consolidated.push({
            employee_id: empId,
            employee_name: groupRecords[0].employees!.full_name,
            job_role: groupRecords[0].employees!.job_roles!.name,
            project_name: groupRecords[0].projects!.name,
            status: finalStatus,
            diarias,
            valor,
            registered_at: groupRecords[0].registered_at, // showing latest time
            registered_by: groupRecords[0].users?.full_name || '',
            photo_url: photoRecWithUrl ? photoRecWithUrl.photo_url : null,
            photo_error: photoRecWithError ? photoRecWithError.photo_error : false,
          });
        });

        // Sort by name
        consolidated.sort((a, b) => a.employee_name.localeCompare(b.employee_name));

        setData(consolidated);
        setSummary({
          previstos,
          presentes: sPresentes,
          faltas: sFaltas,
          atestados: sAtestados,
          ferias: sFerias,
          folgas: sFolgas,
          totalDiarias: sTotalDiarias,
          valorTotal: sValorTotal
        });
      }
    } catch (err: unknown) {
      console.error('Erro ao buscar registros:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar o fechamento diário.';
      toast.error(errorMessage);
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadgeClass(status: string) {
    if (status.includes('PRESENTE')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (status.includes('FALTOU')) return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (status.includes('ATESTADO')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (status.includes('FERIAS')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (status.includes('FOLGA')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    return 'bg-kivon-bg text-kivon-text-sec border-kivon-border';
  }

  // Filter records with photos to allow navigation
  const photosArray = data.filter(r => r.photo_url || r.photo_error).map(r => ({ url: r.photo_url, error: r.photo_error }));
  
  function openPhoto(index: number) {
    setSelectedPhotoIndex(index);
    setPhotoModalOpen(true);
  }

  function nextPhoto() {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < photosArray.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  }

  function prevPhoto() {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  }

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-kivon-border">
        <h1 className="text-3xl font-bold tracking-tight text-white">Fechamento Diário</h1>
        <p className="mt-2 text-sm text-kivon-text-sec">
          Acompanhamento e fechamento diário dos registros individuais.
        </p>
      </div>

      <div className="rounded-xl bg-kivon-card border border-kivon-border shadow-xl p-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input 
            label="Data" 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)} 
            className="bg-kivon-bg border-kivon-border text-white" style={{ colorScheme: 'dark' }}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-kivon-text-sec">Obra</label>
            <select
              className="flex h-12 sm:h-10 w-full rounded-lg border border-kivon-border bg-kivon-bg px-3 py-2 text-base sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-kivon-primary focus:border-kivon-primary transition-all"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Todas as Obras</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          <div className="rounded-xl bg-kivon-card p-4 border border-kivon-border shadow-lg text-center">
            <div className="text-xs font-medium text-kivon-text-sec">Previstos</div>
            <div className="mt-2 text-xl font-bold text-white">{summary.previstos}</div>
          </div>
          <div className="rounded-xl bg-kivon-card p-4 border border-emerald-500/20 shadow-lg text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-500/5"></div>
            <div className="text-xs font-medium text-emerald-400 relative z-10">Presentes</div>
            <div className="mt-2 text-xl font-bold text-emerald-400 relative z-10">{summary.presentes.toString().replace('.', ',')}</div>
          </div>
          <div className="rounded-xl bg-kivon-card p-4 border border-red-500/20 shadow-lg text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/5"></div>
            <div className="text-xs font-medium text-red-400 relative z-10">Faltas</div>
            <div className="mt-2 text-xl font-bold text-red-400 relative z-10">{summary.faltas.toString().replace('.', ',')}</div>
          </div>
          <div className="rounded-xl bg-kivon-card p-4 border border-amber-500/20 shadow-lg text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-amber-500/5"></div>
            <div className="text-xs font-medium text-amber-400 relative z-10">Atestados</div>
            <div className="mt-2 text-xl font-bold text-amber-400 relative z-10">{summary.atestados.toString().replace('.', ',')}</div>
          </div>
          <div className="rounded-xl bg-kivon-card p-4 border border-blue-500/20 shadow-lg text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/5"></div>
            <div className="text-xs font-medium text-blue-400 relative z-10">Férias</div>
            <div className="mt-2 text-xl font-bold text-blue-400 relative z-10">{summary.ferias.toString().replace('.', ',')}</div>
          </div>
          <div className="rounded-xl bg-kivon-card p-4 border border-purple-500/20 shadow-lg text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-purple-500/5"></div>
            <div className="text-xs font-medium text-purple-400 relative z-10">Folgas</div>
            <div className="mt-2 text-xl font-bold text-purple-400 relative z-10">{summary.folgas.toString().replace('.', ',')}</div>
          </div>
          <div className="rounded-xl bg-kivon-card p-4 border border-indigo-500/20 shadow-lg text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-indigo-500/5"></div>
            <div className="text-xs font-medium text-indigo-400 relative z-10">Tot. Diárias</div>
            <div className="mt-2 text-xl font-bold text-indigo-400 relative z-10">{summary.totalDiarias.toString().replace('.', ',')}</div>
          </div>
          <div className="rounded-xl bg-kivon-primary/10 p-4 border border-kivon-primary/20 shadow-lg text-center relative overflow-hidden">
            <div className="text-xs font-medium text-kivon-primary relative z-10">Valor Total</div>
            <div className="mt-2 text-lg font-bold text-kivon-primary relative z-10">R$ {summary.valorTotal.toFixed(2).replace('.', ',')}</div>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-kivon-card border border-kivon-border shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-kivon-primary" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 text-kivon-text-sec">
            Nenhum registro encontrado para esta data.
          </div>
        ) : (
          <>
          <div className="block lg:hidden">
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
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${getStatusBadgeClass(row.status)}`}>
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
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${getStatusBadgeClass(row.status)}`}>
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
          </div>
          </>
        )}
      </div>

      <Modal isOpen={photoModalOpen} onClose={() => setPhotoModalOpen(false)} title="Evidência do Registro">
        <div className="flex flex-col items-center gap-4">
          {selectedPhotoIndex !== null && photosArray[selectedPhotoIndex] && (
            <div className="relative group flex items-center justify-center w-full min-h-[200px]">
              {photosArray[selectedPhotoIndex].error ? (
                <div className="flex flex-col items-center justify-center text-kivon-text-sec p-8 bg-kivon-bg rounded-lg border border-kivon-border w-full">
                  <ImageIcon className="h-16 w-16 mb-4 opacity-50 text-red-400" />
                  <p className="text-lg font-medium text-white mb-2">Evidência indisponível.</p>
                  <p className="text-sm text-center">Não foi possível carregar a imagem. A assinatura da URL pode ter expirado ou o arquivo foi removido.</p>
                </div>
              ) : (
                <img 
                  src={photosArray[selectedPhotoIndex].url || ''} 
                  alt="Foto Ampliada" 
                  className="max-w-full max-h-[65vh] rounded-lg shadow-sm transition-transform duration-300 hover:scale-150 transform-gpu cursor-zoom-in" 
                />
              )}
              {selectedPhotoIndex > 0 && (
                <button 
                  onClick={prevPhoto}
                  className="absolute left-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}
              {selectedPhotoIndex < photosArray.length - 1 && (
                <button 
                  onClick={nextPhoto}
                  className="absolute right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
            </div>
          )}
          {isAdmin && selectedPhotoIndex !== null && photosArray[selectedPhotoIndex] && !photosArray[selectedPhotoIndex].error && (
            <Button onClick={() => window.open(photosArray[selectedPhotoIndex].url || '', '_blank')}>
              <Download className="h-4 w-4 mr-2" /> Baixar Imagem
            </Button>
          )}
        </div>
      </Modal>
    </div>
  );
}
