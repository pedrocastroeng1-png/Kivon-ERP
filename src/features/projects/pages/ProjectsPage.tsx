import toast from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/shared/lib/supabase';
import { Button } from '@/src/shared/components/ui/Button';
import { Input } from '@/src/shared/components/ui/Input';
import { Modal } from '@/src/shared/components/ui/Modal';
import { Plus, Edit2, Trash2, Search, Loader2, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';

const projectSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  code: z.string().optional(),
  client_name: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  started_at: z.string().optional(),
  finished_at: z.string().optional(),
});

type ProjectForm = z.infer<typeof projectSchema>;

interface Project {
  id: string;
  name: string;
  code: string;
  client_name: string;
  city: string;
  address: string;
  started_at: string;
  finished_at: string;
  active: boolean;
}

interface Employee {
  id: string;
  full_name: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Project Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Allocation Modal
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [allocatedEmployeeIds, setAllocatedEmployeeIds] = useState<string[]>([]);
  const [savingAllocation, setSavingAllocation] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema)
  });

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      if (data) {
        setProjects(data);
      }
    } catch (err: any) {
      console.error('Erro ao buscar obras:', err);
      toast.error(err.message || 'Erro ao carregar obras.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEmployees() {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name')
        .eq('active', true)
        .order('full_name');
      if (error) throw error;
      if (data) {
        setEmployees(data);
      }
    } catch (err: any) {
      console.error('Erro ao buscar funcionários:', err);
      toast.error(err.message || 'Erro ao carregar funcionários.');
    }
  }

  function openModal(project?: Project) {
    if (project) {
      setEditingId(project.id);
      reset({
        name: project.name,
        code: project.code || '',
        client_name: project.client_name || '',
        city: project.city || '',
        address: project.address || '',
        started_at: project.started_at || '',
        finished_at: project.finished_at || '',
      });
    } else {
      setEditingId(null);
      reset({ name: '', code: '', client_name: '', city: '', address: '', started_at: '', finished_at: '' });
    }
    setIsModalOpen(true);
  }

  async function openAllocationModal(projectId: string) {
    setSelectedProjectId(projectId);
    setAllocatedEmployeeIds([]);
    setIsAllocationModalOpen(true);
    
    const { data, error } = await supabase
      .from('project_employees')
      .select('employee_id')
      .eq('project_id', projectId)
      .eq('active', true);
      
    if (!error && data) {
      setAllocatedEmployeeIds(data.map(d => d.employee_id));
    }
  }

  async function onSubmit(data: ProjectForm) {
    const payload = {
      ...data,
      started_at: data.started_at || null,
      finished_at: data.finished_at || null,
    };

    if (editingId) {
      await supabase.from('projects').update(payload).eq('id', editingId);
    } else {
      await supabase.from('projects').insert([payload]);
    }
    setIsModalOpen(false);
    fetchProjects();
  }

  async function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja inativar esta obra?')) {
      await supabase.from('projects').update({ active: false }).eq('id', id);
      fetchProjects();
    }
  }

  async function saveAllocations() {
    if (!selectedProjectId) return;
    setSavingAllocation(true);
    
    // Deactivate all first (simplest approach for V1)
    await supabase
      .from('project_employees')
      .update({ active: false, unassigned_at: new Date().toISOString() })
      .eq('project_id', selectedProjectId)
      .eq('active', true);
      
    // Insert new ones
    if (allocatedEmployeeIds.length > 0) {
      const payloads = allocatedEmployeeIds.map(empId => ({
        project_id: selectedProjectId,
        employee_id: empId,
        active: true,
        assigned_at: new Date().toISOString()
      }));
      
      // Upsert to handle unique constraint
      await supabase
        .from('project_employees')
        .upsert(payloads, { onConflict: 'project_id, employee_id' });
        
      // Ensure they are active if upserted over existing
      await supabase
        .from('project_employees')
        .update({ active: true, unassigned_at: null })
        .eq('project_id', selectedProjectId)
        .in('employee_id', allocatedEmployeeIds);
    }
    
    setSavingAllocation(false);
    setIsAllocationModalOpen(false);
  }

  const toggleEmployee = (empId: string) => {
    setAllocatedEmployeeIds(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.code && p.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-kivon-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Obras</h1>
          <p className="mt-2 text-sm text-kivon-text-sec">Gerencie as obras ativas e seus dados.</p>
        </div>
        <Button onClick={() => openModal()} className="w-full sm:w-auto bg-kivon-primary hover:bg-kivon-primary-hover text-black shadow-lg shadow-kivon-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Nova Obra
        </Button>
      </div>

      <div className="rounded-xl bg-kivon-card border border-kivon-border shadow-xl p-6">
        <div className="mb-6 flex items-center rounded-lg border border-kivon-border bg-kivon-bg px-3 focus-within:ring-1 focus-within:ring-kivon-primary focus-within:border-kivon-primary transition-all">
          <Search className="mr-2 h-5 w-5 text-kivon-text-sec" />
          <input
            type="text"
            placeholder="Pesquisar obras..."
            className="w-full border-0 bg-transparent py-2.5 text-white placeholder-kivon-text-sec focus:ring-0 outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-kivon-primary" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12 text-kivon-text-sec bg-kivon-bg/50 rounded-lg border border-kivon-border border-dashed">
            Nenhuma obra encontrada.
          </div>
        ) : (
          <>
          <div className="block lg:hidden space-y-4">
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
          </div>
          </>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Obra' : 'Nova Obra'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Código" {...register('code')} className="bg-kivon-bg border-kivon-border text-white" />
            <Input label="Nome da Obra" {...register('name')} error={errors.name?.message} className="bg-kivon-bg border-kivon-border text-white" />
          </div>
          <Input label="Cliente" {...register('client_name')} className="bg-kivon-bg border-kivon-border text-white" />
          <Input label="Cidade" {...register('city')} className="bg-kivon-bg border-kivon-border text-white" />
          <Input label="Endereço Completo" {...register('address')} className="bg-kivon-bg border-kivon-border text-white" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Data de Início" type="date" {...register('started_at')} className="bg-kivon-bg border-kivon-border text-white" style={{ colorScheme: 'dark' }} />
            <Input label="Data de Término" type="date" {...register('finished_at')} className="bg-kivon-bg border-kivon-border text-white" style={{ colorScheme: 'dark' }} />
          </div>
          <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-kivon-border">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="bg-transparent border border-kivon-border text-white hover:bg-kivon-hover">Cancelar</Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-kivon-primary hover:bg-kivon-primary-hover text-black shadow-lg shadow-kivon-primary/20">Salvar</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isAllocationModalOpen} onClose={() => setIsAllocationModalOpen(false)} title="Alocar Funcionários">
        <div className="space-y-5 mt-2">
          <p className="text-sm text-kivon-text-sec">Selecione os funcionários que farão parte desta obra.</p>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-kivon-border bg-kivon-bg divide-y divide-kivon-border">
            {employees.map(emp => (
              <label key={emp.id} className="flex cursor-pointer items-center space-x-3 p-3 hover:bg-kivon-hover transition-colors">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-kivon-border bg-kivon-card text-kivon-primary focus:ring-kivon-primary focus:ring-offset-kivon-bg"
                  checked={allocatedEmployeeIds.includes(emp.id)}
                  onChange={() => toggleEmployee(emp.id)}
                />
                <span className="text-sm font-medium text-white">{emp.full_name}</span>
              </label>
            ))}
            {employees.length === 0 && (
              <p className="p-4 text-center text-sm text-kivon-text-sec">Nenhum funcionário ativo encontrado.</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-kivon-border">
            <Button type="button" variant="secondary" onClick={() => setIsAllocationModalOpen(false)} className="bg-transparent border border-kivon-border text-white hover:bg-kivon-hover">Cancelar</Button>
            <Button type="button" isLoading={savingAllocation} onClick={saveAllocations} className="bg-kivon-primary hover:bg-kivon-primary-hover text-black shadow-lg shadow-kivon-primary/20">Salvar Alocações</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
