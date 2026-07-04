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

  async function fetchProjects() {
    const { data } = await supabase
      .from('projects')
      .select('id, name')
      .eq('active', true)
      .order('name');
    if (data) setProjects(data);
  }

  async function loadEmployeesForProject(projectId: string) {
    setLoading(true);
    
    // 1. Get employees from RPC
    const { data: emps, error: rpcError } = await supabase
      .rpc('obter_funcionarios_da_obra', { p_project_id: projectId });

    if (rpcError || !emps) {
      console.error(rpcError);
      setLoading(false);
      return;
    }

    // 2. Get today's presence for this project
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: presences } = await supabase
      .from('presence')
      .select('employee_id, shift, photo_id')
      .eq('project_id', projectId)
      .eq('presence_date', today)
      .eq('active', true);

    const presenceMap: Record<string, { manha?: any, tarde?: any }> = {};
    if (presences) {
      presences.forEach(p => {
        if (!presenceMap[p.employee_id]) presenceMap[p.employee_id] = {};
        if (p.shift === 'manha') presenceMap[p.employee_id].manha = p;
        if (p.shift === 'tarde') presenceMap[p.employee_id].tarde = p;
      });
    }

    // Merge
    const merged = emps.map((e: any) => ({
      ...e,
      presence_morning: presenceMap[e.employee_id]?.manha,
      presence_afternoon: presenceMap[e.employee_id]?.tarde,
    }));

    setEmployees(merged);
    setLoading(false);
  }

  async function handleRegisterClick(employeeId: string, shift: 'manha' | 'tarde') {
    const emp = employees.find(e => e.employee_id === employeeId);
    if (!emp) return;

    if (shift === 'manha' && !emp.presence_morning) {
      // Check if photo exists for today
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: photos } = await supabase
        .from('presence_photos')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('project_id', selectedProjectId)
        .eq('presence_date', today)
        .eq('active', true)
        .limit(1);

      if (!photos || photos.length === 0) {
        // Need photo
        setPendingPresence({ employeeId, shift });
        setIsCameraOpen(true);
        return;
      } else {
        // Has photo, register directly
        registerPresenceRPC(employeeId, shift, photos[0].id);
        return;
      }
    }

    if (shift === 'tarde') {
      // Tarde does not need new photo
      registerPresenceRPC(employeeId, shift);
    }
  }

  async function registerPresenceRPC(employeeId: string, shift: 'manha' | 'tarde', photoId?: string) {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Since registrar_presenca RPC is a stub, we will do it directly via insert to avoid RPC error.
      // In a real scenario, the backend migration would have the full RPC logic.
      
      // Insert via standard insert
      let finalPhotoId = photoId;
      if (!finalPhotoId && shift === 'tarde') {
         const { data: photos } = await supabase
          .from('presence_photos')
          .select('id')
          .eq('employee_id', employeeId)
          .eq('project_id', selectedProjectId)
          .eq('presence_date', today)
          .eq('active', true)
          .limit(1);
         if (photos && photos.length > 0) finalPhotoId = photos[0].id;
      }

      const { data: userSession } = await supabase.auth.getSession();
      
      const { error } = await supabase.from('presence').insert({
        project_id: selectedProjectId,
        employee_id: employeeId,
        shift: shift,
        presence_date: today,
        photo_id: finalPhotoId,
        registered_by: userSession.session?.user.id
      });

      if (error) throw error;
      
      // Reload
      loadEmployeesForProject(selectedProjectId);
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar presença.');
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Cadastro de Diárias</h1>
        <p className="mt-1 text-sm text-gray-500">Registre a presença dos funcionários nas obras.</p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-6 max-w-sm">
          <label className="mb-1 block text-sm font-medium text-gray-700">Selecione a Obra</label>
          <select
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <div className="mb-6 flex items-center rounded-md border border-gray-300 px-3 max-w-sm">
              <Search className="mr-2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar funcionário..."
                className="w-full border-0 bg-transparent py-2 focus:ring-0 outline-none text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                Nenhum funcionário encontrado nesta obra.
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map(emp => (
                  <div key={emp.employee_id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
                    <div>
                      <h3 className="font-medium text-gray-900">{emp.full_name}</h3>
                      <p className="text-sm text-gray-500">{emp.job_role_name} • R$ {emp.daily_rate?.toFixed(2) || '0.00'}/dia</p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex gap-2">
                      <Button
                        variant={emp.presence_morning ? 'secondary' : 'primary'}
                        size="sm"
                        disabled={!!emp.presence_morning}
                        onClick={() => handleRegisterClick(emp.employee_id, 'manha')}
                        className={emp.presence_morning ? 'bg-green-50 text-green-700 border-green-200' : ''}
                      >
                        {emp.presence_morning ? <><Check className="mr-1 h-4 w-4" /> Manhã</> : 'Manhã'}
                      </Button>
                      <Button
                        variant={emp.presence_afternoon ? 'secondary' : 'primary'}
                        size="sm"
                        disabled={!!emp.presence_afternoon}
                        onClick={() => handleRegisterClick(emp.employee_id, 'tarde')}
                        className={emp.presence_afternoon ? 'bg-green-50 text-green-700 border-green-200' : ''}
                      >
                        {emp.presence_afternoon ? <><Check className="mr-1 h-4 w-4" /> Tarde</> : 'Tarde'}
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
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg bg-black">
            {/* @ts-ignore - react-webcam missing optional props in its typedef */}
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
              className="w-full h-auto"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsCameraOpen(false)} disabled={isUploading}>Cancelar</Button>
            <Button onClick={captureAndUpload} isLoading={isUploading}>
              <Camera className="mr-2 h-4 w-4" /> Capturar e Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
