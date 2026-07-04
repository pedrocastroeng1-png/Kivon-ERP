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
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (!error && data) {
      setProjects(data);
    }
    setLoading(false);
  }

  async function fetchEmployees() {
    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name')
      .eq('active', true)
      .order('full_name');
    if (!error && data) {
      setEmployees(data);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Obras</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie as obras ativas e seus dados.</p>
        </div>
        <Button onClick={() => openModal()} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Nova Obra
        </Button>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-6 flex items-center rounded-md border border-gray-300 px-3">
          <Search className="mr-2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar obras..."
            className="w-full border-0 bg-transparent py-2 focus:ring-0 outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Nenhuma obra encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-3">Código</th>
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Cidade</th>
                  <th className="px-6 py-3">Início</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="border-b bg-white hover:bg-gray-50">
                    <td className="px-6 py-4">{project.code || '-'}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{project.name}</td>
                    <td className="px-6 py-4">{project.client_name || '-'}</td>
                    <td className="px-6 py-4">{project.city || '-'}</td>
                    <td className="px-6 py-4">{project.started_at ? format(parseISO(project.started_at), 'dd/MM/yyyy') : '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openAllocationModal(project.id)} className="mr-3 text-emerald-600 hover:text-emerald-900" title="Alocar Funcionários">
                        <Users className="h-4 w-4 inline" />
                      </button>
                      <button onClick={() => openModal(project)} className="mr-3 text-indigo-600 hover:text-indigo-900" title="Editar">
                        <Edit2 className="h-4 w-4 inline" />
                      </button>
                      <button onClick={() => handleDelete(project.id)} className="text-red-600 hover:text-red-900" title="Inativar">
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Obra' : 'Nova Obra'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Código" {...register('code')} />
            <Input label="Nome da Obra" {...register('name')} error={errors.name?.message} />
          </div>
          <Input label="Cliente" {...register('client_name')} />
          <Input label="Cidade" {...register('city')} />
          <Input label="Endereço Completo" {...register('address')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Data de Início" type="date" {...register('started_at')} />
            <Input label="Data de Término" type="date" {...register('finished_at')} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSubmitting}>Salvar</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isAllocationModalOpen} onClose={() => setIsAllocationModalOpen(false)} title="Alocar Funcionários">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Selecione os funcionários que farão parte desta obra.</p>
          <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200">
            {employees.map(emp => (
              <label key={emp.id} className="flex cursor-pointer items-center space-x-3 border-b p-3 hover:bg-gray-50">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={allocatedEmployeeIds.includes(emp.id)}
                  onChange={() => toggleEmployee(emp.id)}
                />
                <span className="text-sm font-medium text-gray-900">{emp.full_name}</span>
              </label>
            ))}
            {employees.length === 0 && (
              <p className="p-4 text-center text-sm text-gray-500">Nenhum funcionário ativo encontrado.</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsAllocationModalOpen(false)}>Cancelar</Button>
            <Button type="button" isLoading={savingAllocation} onClick={saveAllocations}>Salvar Alocações</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
