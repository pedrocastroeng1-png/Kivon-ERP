import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/shared/lib/supabase';
import { Button } from '@/src/shared/components/ui/Button';
import { Input } from '@/src/shared/components/ui/Input';
import { Loader2, Download, Search, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Modal } from '@/src/shared/components/ui/Modal';
import { useAuth } from '@/src/app/providers/AuthProvider';

interface PresenceRecord {
  id: string;
  presence_date: string;
  shift: string;
  status: string;
  captured_at: string;
  users: { full_name: string }; // registered_by
  employees: { 
    id: string; 
    full_name: string; 
    job_roles: { name: string; daily_rate: number };
  };
  projects: { id: string; name: string };
  presence_photos?: { storage_path: string } | null;
  photo_url?: string;
}

interface ConsolidatedDailyRecord {
  employee_id: string;
  employee_name: string;
  job_role: string;
  project_name: string;
  status: string;
  diarias: number;
  valor: number;
  captured_at: string; // we'll use the earliest or latest capture
  registered_by: string;
  photo_url: string | null;
}

export default function DailyReportsPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.profiles?.code === 'admin';
  const [data, setData] = useState<ConsolidatedDailyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [projectId, setProjectId] = useState('');
  
  const [projects, setProjects] = useState<any[]>([]);
  
  // Photo modal
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  // Summary State
  const [summary, setSummary] = useState({
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
    if (pRes) setProjects(pRes);
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
        captured_at,
        users!registered_by (full_name),
        employees (id, full_name, job_roles(name, daily_rate)),
        projects (id, name),
        presence_photos (storage_path)
      `)
      .eq('presence_date', dateFilter)
      .eq('active', true)
      .order('captured_at', { ascending: false });

    if (projectId) query = query.eq('project_id', projectId);

    const { data: result, error } = await query;

    if (!error && result) {
      const records = await Promise.all(result.map(async (row: any) => {
        let photo_url = '';
        if (row.presence_photos?.storage_path) {
          const { data: { publicUrl } } = supabase.storage
            .from('presence-photos')
            .getPublicUrl(row.presence_photos.storage_path);
          photo_url = publicUrl;
        }
        return { ...row, photo_url };
      }));

      // Consolidate Data
      const grouped = new Map<string, any[]>();
      records.forEach((r: any) => {
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
          if (r.status === 'FÉRIAS') { cFerias++; sFerias += 0.5; }
          if (r.status === 'FOLGA') { cFolga++; sFolgas += 0.5; }
        });

        const diarias = countPresente * 0.5;
        const baseRate = groupRecords[0].employees.job_roles.daily_rate;
        const valor = diarias * baseRate;

        sTotalDiarias += diarias;
        sValorTotal += valor;

        let finalStatus = Array.from(statuses).join(' / ');
        if (countPresente > 0 && countPresente === groupRecords.length) {
          finalStatus = 'PRESENTE';
        }

        // Get the photo (prefer morning if exists, else whatever)
        const photoRec = groupRecords.find(r => r.photo_url) || groupRecords[0];

        consolidated.push({
          employee_id: empId,
          employee_name: groupRecords[0].employees.full_name,
          job_role: groupRecords[0].employees.job_roles.name,
          project_name: groupRecords[0].projects.name,
          status: finalStatus,
          diarias,
          valor,
          captured_at: groupRecords[0].captured_at, // showing latest time
          registered_by: groupRecords[0].users?.full_name || '',
          photo_url: photoRec.photo_url || null,
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
    setLoading(false);
  }

  function getStatusBadgeClass(status: string) {
    if (status.includes('PRESENTE')) return 'bg-green-50 text-green-700 ring-green-600/20';
    if (status.includes('FALTOU')) return 'bg-red-50 text-red-700 ring-red-600/20';
    if (status.includes('ATESTADO')) return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
    if (status.includes('FÉRIAS')) return 'bg-blue-50 text-blue-800 ring-blue-600/20';
    if (status.includes('FOLGA')) return 'bg-purple-50 text-purple-800 ring-purple-600/20';
    return 'bg-gray-50 text-gray-600 ring-gray-500/10';
  }

  // Filter records with photos to allow navigation
  const photosArray = data.filter(r => r.photo_url).map(r => r.photo_url!);
  
  function openPhoto(url: string) {
    const idx = photosArray.indexOf(url);
    setSelectedPhotoIndex(idx !== -1 ? idx : null);
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Fechamento Diário</h1>
        <p className="mt-1 text-sm text-gray-500">
          Acompanhamento e fechamento diário dos registros individuais.
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input 
            label="Data" 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)} 
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Obra</label>
            <select
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <div className="rounded-lg bg-white p-3 border border-gray-200 shadow-sm text-center">
            <div className="text-xs font-medium text-gray-500">Previstos</div>
            <div className="mt-1 text-xl font-bold text-gray-900">{summary.previstos}</div>
          </div>
          <div className="rounded-lg bg-green-50 p-3 border border-green-100 shadow-sm text-center">
            <div className="text-xs font-medium text-green-800">Presentes</div>
            <div className="mt-1 text-xl font-bold text-green-900">{summary.presentes.toString().replace('.', ',')}</div>
          </div>
          <div className="rounded-lg bg-red-50 p-3 border border-red-100 shadow-sm text-center">
            <div className="text-xs font-medium text-red-800">Faltas</div>
            <div className="mt-1 text-xl font-bold text-red-900">{summary.faltas.toString().replace('.', ',')}</div>
          </div>
          <div className="rounded-lg bg-yellow-50 p-3 border border-yellow-100 shadow-sm text-center">
            <div className="text-xs font-medium text-yellow-800">Atestados</div>
            <div className="mt-1 text-xl font-bold text-yellow-900">{summary.atestados.toString().replace('.', ',')}</div>
          </div>
          <div className="rounded-lg bg-blue-50 p-3 border border-blue-100 shadow-sm text-center">
            <div className="text-xs font-medium text-blue-800">Férias</div>
            <div className="mt-1 text-xl font-bold text-blue-900">{summary.ferias.toString().replace('.', ',')}</div>
          </div>
          <div className="rounded-lg bg-purple-50 p-3 border border-purple-100 shadow-sm text-center">
            <div className="text-xs font-medium text-purple-800">Folgas</div>
            <div className="mt-1 text-xl font-bold text-purple-900">{summary.folgas.toString().replace('.', ',')}</div>
          </div>
          <div className="rounded-lg bg-indigo-50 p-3 border border-indigo-100 shadow-sm text-center">
            <div className="text-xs font-medium text-indigo-800">Tot. Diárias</div>
            <div className="mt-1 text-xl font-bold text-indigo-900">{summary.totalDiarias.toString().replace('.', ',')}</div>
          </div>
          <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-100 shadow-sm text-center">
            <div className="text-xs font-medium text-emerald-800">Valor Total</div>
            <div className="mt-1 text-lg font-bold text-emerald-900">R$ {summary.valorTotal.toFixed(2).replace('.', ',')}</div>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-white shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            Nenhum registro encontrado para esta data.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700 border-b">
                <tr>
                  <th className="px-6 py-3 w-16">Foto</th>
                  <th className="px-6 py-3">Funcionário</th>
                  <th className="px-6 py-3">Cargo</th>
                  <th className="px-6 py-3">Obra</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Diária</th>
                  <th className="px-6 py-3 text-right">Valor</th>
                  <th className="px-6 py-3">Registro</th>
                  <th className="px-6 py-3">Registrado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((row) => (
                  <tr key={row.employee_id} className="bg-white hover:bg-gray-50">
                    <td className="px-6 py-2">
                      {row.photo_url ? (
                        <img 
                          src={row.photo_url} 
                          alt="Foto" 
                          className="h-10 w-10 rounded-md object-cover cursor-pointer border border-gray-200 hover:opacity-80 transition"
                          onClick={() => openPhoto(row.photo_url!)}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900">{row.employee_name}</td>
                    <td className="px-6 py-3">{row.job_role}</td>
                    <td className="px-6 py-3">{row.project_name}</td>
                    <td className="px-6 py-3 text-center">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">{row.diarias.toString().replace('.', ',')}</td>
                    <td className="px-6 py-3 text-right">
                      R$ {row.valor.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-6 py-3">{format(new Date(row.captured_at), 'HH:mm')}</td>
                    <td className="px-6 py-3">{row.registered_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={photoModalOpen} onClose={() => setPhotoModalOpen(false)} title="Evidência do Registro">
        <div className="flex flex-col items-center gap-4">
          {selectedPhotoIndex !== null && photosArray[selectedPhotoIndex] && (
            <div className="relative group flex items-center justify-center w-full">
              <img 
                src={photosArray[selectedPhotoIndex]} 
                alt="Foto Ampliada" 
                className="max-w-full max-h-[65vh] rounded-lg shadow-sm transition-transform duration-300 hover:scale-150 transform-gpu cursor-zoom-in" 
              />
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
          {isAdmin && selectedPhotoIndex !== null && photosArray[selectedPhotoIndex] && (
            <Button onClick={() => window.open(photosArray[selectedPhotoIndex], '_blank')}>
              <Download className="h-4 w-4 mr-2" /> Baixar Imagem
            </Button>
          )}
        </div>
      </Modal>
    </div>
  );
}
