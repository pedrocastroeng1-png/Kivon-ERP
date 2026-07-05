import toast from 'react-hot-toast';
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/src/shared/lib/supabase';
import { Button } from '@/src/shared/components/ui/Button';
import { Modal } from '@/src/shared/components/ui/Modal';
import { Loader2, Camera, Check, Search } from 'lucide-react';
import Webcam from 'react-webcam';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
}

interface EmployeeWithPresence {
  employee_id: string;
  full_name: string;
  job_role_name: string;
  daily_rate: number;
  presence_morning?: any;
  presence_afternoon?: any;
}

export default function DailyRegisterPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [employees, setEmployees] = useState<EmployeeWithPresence[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Camera modal state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [pendingPresence, setPendingPresence] = useState<{ employeeId: string; shift: 'manha' | 'tarde' } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const webcamRef = useRef<Webcam>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadEmployeesForProject(selectedProjectId);
    } else {
      setEmployees([]);
    }
  }, [selectedProjectId]);

  const today = format(new Date(), 'yyyy-MM-dd');

  async function fetchProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      if (data) {
        setProjects(data);
      }
    } catch (err: any) {
      console.error('Erro ao buscar obras:', err);
      toast.error(err.message || 'Erro ao carregar obras.');
    }
  }

  async function loadEmployeesForProject(projectId: string) {
    setLoading(true);
    try {
      const { data: projEmps, error: empErr } = await supabase
        .from('project_employees')
        .select('employee_id, employees(full_name, job_roles(name, daily_rate))')
        .eq('project_id', projectId)
        .eq('active', true);
      
      if (empErr) throw empErr;

      const { data: presences, error: presErr } = await supabase
        .from('presence')
        .select('employee_id, shift, photo_id')
        .eq('project_id', projectId)
        .eq('presence_date', today)
        .eq('active', true);

      if (presErr) throw presErr;

      const mapped = (projEmps || []).map((pe: any) => {
        const empPresences = (presences || []).filter(p => p.employee_id === pe.employee_id);
        const hasManha = empPresences.some(p => p.shift === 'manha');
        const hasTarde = empPresences.some(p => p.shift === 'tarde');
        return {
          employee_id: pe.employee_id,
          full_name: pe.employees.full_name,
          job_role_name: pe.employees.job_roles.name,
          daily_rate: pe.employees.job_roles.daily_rate,
          presence_morning: hasManha,
          presence_afternoon: hasTarde,
        };
      }).sort((a, b) => a.full_name.localeCompare(b.full_name));

      setEmployees(mapped);
    } catch (err: any) {
      console.error('Erro ao carregar funcionários:', err);
      toast.error(err.message || 'Erro ao carregar funcionários.');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterClick(employeeId: string, shift: 'manha' | 'tarde') {
    if (shift === 'manha') {
      setPendingPresence({ employeeId, shift });
      setIsCameraOpen(true);
    } else {
      await registerPresenceRPC(employeeId, shift);
    }
  }

  async function registerPresenceRPC(employeeId: string, shift: 'manha' | 'tarde', photoId?: string) {
    let finalPhotoId = photoId;
    try {
      // If no photoId is passed, maybe the user uploaded one previously for today?
      if (!finalPhotoId) {
        const { data: existingPhotos, error: photoCheckErr } = await supabase
          .from('presence_photos')
          .select('id')
          .eq('project_id', selectedProjectId)
          .eq('employee_id', employeeId)
          .eq('presence_date', today)
          .limit(1);
          
        if (photoCheckErr) throw photoCheckErr;
        
        if (existingPhotos && existingPhotos.length > 0) {
          finalPhotoId = existingPhotos[0].id;
        }
      }

      const { error } = await supabase.rpc('registrar_presenca', {
        p_project_id: selectedProjectId,
        p_employee_id: employeeId,
        p_presence_date: today,
        p_shift: shift,
        p_photo_id: finalPhotoId || null,
        p_status: 'PRESENTE',
        p_presence_time: null
      });

      if (error) throw error;
      toast.success('Presença registrada com sucesso!');
      loadEmployeesForProject(selectedProjectId);
    } catch (err: any) {
      console.error('Erro ao registrar presença:', err);
      toast.error(err.message || 'Erro ao registrar presença.');
    }
  }

  async function captureAndUpload() {
    if (!webcamRef.current || !pendingPresence) return;
    
    setIsUploading(true);
    const imageSrc = webcamRef.current.getScreenshot();
    
    if (imageSrc) {
      try {
        // Convert base64 to blob
        const res = await fetch(imageSrc);
        const blob = await res.blob();
        
        const today = format(new Date(), 'yyyy-MM-dd');
        const fileName = `${selectedProjectId}/employees/${pendingPresence.employeeId}/${today}/${Date.now()}.jpg`;

        // Upload to bucket
        const { error: uploadError } = await supabase.storage
          .from('presence-photos')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        const { data: userSession } = await supabase.auth.getSession();

        // Register in presence_photos
        const { data: photoData, error: photoError } = await supabase.from('presence_photos').insert({
          project_id: selectedProjectId,
          employee_id: pendingPresence.employeeId,
          presence_date: today,
          captured_by: userSession.session?.user.id,
          storage_path: fileName,
          mime_type: 'image/jpeg',
          file_size_bytes: blob.size
        }).select('id').single();

        if (photoError) throw photoError;

        // Register presence
        await registerPresenceRPC(pendingPresence.employeeId, pendingPresence.shift, photoData.id);

        setIsCameraOpen(false);
        setPendingPresence(null);
      } catch (err) {
        console.error('Upload falhou', err);
        alert('Falha ao salvar a foto.');
      }
    }
    setIsUploading(false);
  }

  const filtered = employees.filter(e => e.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-kivon-border">
        <h1 className="text-3xl font-bold tracking-tight text-white">Cadastro de Diárias</h1>
        <p className="mt-2 text-sm text-kivon-text-sec">Registre a presença dos funcionários nas obras.</p>
      </div>

      <div className="rounded-xl bg-kivon-card border border-kivon-border shadow-xl p-6">
        <div className="mb-6 max-w-sm">
          <label className="mb-1.5 block text-sm font-medium text-kivon-text-sec">Selecione a Obra</label>
          <select
            className="flex h-10 w-full rounded-lg border border-kivon-border bg-kivon-bg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-kivon-primary focus:border-kivon-primary transition-all"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">Selecione...</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {selectedProjectId && (
          <>
            <div className="mb-6 flex items-center rounded-lg border border-kivon-border bg-kivon-bg px-3 max-w-sm focus-within:ring-1 focus-within:ring-kivon-primary focus-within:border-kivon-primary transition-all">
              <Search className="mr-2 h-5 w-5 text-kivon-text-sec" />
              <input
                type="text"
                placeholder="Pesquisar funcionário..."
                className="w-full border-0 bg-transparent py-2.5 text-white placeholder-kivon-text-sec focus:ring-0 outline-none text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-kivon-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-kivon-text-sec bg-kivon-bg/50 rounded-lg border border-kivon-border border-dashed">
                Nenhum funcionário encontrado nesta obra.
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map(emp => (
                  <div key={emp.employee_id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-kivon-border bg-kivon-card p-5 hover:bg-kivon-hover transition-colors">
                    <div>
                      <h3 className="font-medium text-white text-base">{emp.full_name}</h3>
                      <p className="text-sm text-kivon-text-sec mt-0.5">{emp.job_role_name} • R$ {emp.daily_rate?.toFixed(2) || '0.00'}/dia</p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex gap-3">
                      <Button
                        variant={emp.presence_morning ? 'secondary' : 'primary'}
                        size="sm"
                        disabled={!!emp.presence_morning}
                        onClick={() => handleRegisterClick(emp.employee_id, 'manha')}
                        className={emp.presence_morning ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-kivon-bg text-kivon-text hover:text-white border border-kivon-border hover:bg-kivon-hover'}
                      >
                        {emp.presence_morning ? <><Check className="mr-2 h-4 w-4" /> Manhã</> : 'Manhã'}
                      </Button>
                      <Button
                        variant={emp.presence_afternoon ? 'secondary' : 'primary'}
                        size="sm"
                        disabled={!!emp.presence_afternoon}
                        onClick={() => handleRegisterClick(emp.employee_id, 'tarde')}
                        className={emp.presence_afternoon ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-kivon-bg text-kivon-text hover:text-white border border-kivon-border hover:bg-kivon-hover'}
                      >
                        {emp.presence_afternoon ? <><Check className="mr-2 h-4 w-4" /> Tarde</> : 'Tarde'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={isCameraOpen} onClose={() => !isUploading && setIsCameraOpen(false)} title="Capturar Foto">
        <div className="space-y-5 mt-2">
          <div className="overflow-hidden rounded-lg bg-black border border-kivon-border">
            {/* @ts-ignore - react-webcam missing optional props in its typedef */}
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              className="w-full h-auto"
            />
          </div>
          <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-kivon-border">
            <Button variant="secondary" onClick={() => setIsCameraOpen(false)} disabled={isUploading} className="bg-transparent border border-kivon-border text-white hover:bg-kivon-hover">Cancelar</Button>
            <Button onClick={captureAndUpload} isLoading={isUploading} className="bg-kivon-primary hover:bg-kivon-primary-hover text-black shadow-lg shadow-kivon-primary/20">
              <Camera className="mr-2 h-4 w-4" /> Capturar e Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
