import toast from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/shared/lib/supabase';
import { Button } from '@/src/shared/components/ui/Button';
import { Input } from '@/src/shared/components/ui/Input';
import { Modal } from '@/src/shared/components/ui/Modal';
import { Plus, Edit2, Trash2, Search, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';

const employeeSchema = z.object({
  full_name: z.string().min(1, 'Nome é obrigatório'),
  document_number: z.string().optional(),
  phone: z.string().optional(),
  job_role_id: z.string().min(1, 'Cargo é obrigatório'),
  admission_date: z.string().optional(),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

interface Employee {
  id: string;
  full_name: string;
  document_number: string;
  phone: string;
  job_role_id: string;
  admission_date: string;
  active: boolean;
  job_roles?: {
    name: string;
  };
}

interface JobRole {
  id: string;
  name: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema)
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [employeesResponse, jobRolesResponse] = await Promise.all([
      supabase
        .from('employees')
        .select('*, job_roles(name)')
        .eq('active', true)
        .order('full_name'),
      supabase
        .from('job_roles')
        .select('id, name')
        .eq('active', true)
        .order('name')
    ]);
    
    if (!employeesResponse.error && employeesResponse.data) {
      setEmployees(employeesResponse.data);
    }
    if (!jobRolesResponse.error && jobRolesResponse.data) {
      setJobRoles(jobRolesResponse.data);
    }
    setLoading(false);
  }

  function openModal(employee?: Employee) {
    if (employee) {
      setEditingId(employee.id);
      reset({
        full_name: employee.full_name,
        document_number: employee.document_number || '',
        phone: employee.phone || '',
        job_role_id: employee.job_role_id,
        admission_date: employee.admission_date || '',
      });
    } else {
      setEditingId(null);
      reset({ full_name: '', document_number: '', phone: '', job_role_id: '', admission_date: '' });
    }
    setIsModalOpen(true);
  }

  async function onSubmit(data: EmployeeForm) {
    const payload = {
      ...data,
      admission_date: data.admission_date || null,
    };

    if (editingId) {
      await supabase.from('employees').update(payload).eq('id', editingId);
    } else {
      await supabase.from('employees').insert([payload]);
    }
    setIsModalOpen(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja inativar este funcionário?')) {
      await supabase.from('employees').update({ active: false }).eq('id', id);
      fetchData();
    }
  }

  const filteredEmployees = employees.filter(e => 
    e.full_name.toLowerCase().includes(search.toLowerCase()) || 
    (e.document_number && e.document_number.includes(search))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-kivon-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Funcionários</h1>
          <p className="mt-2 text-sm text-kivon-text-sec">Gerencie os funcionários da empresa e suas alocações.</p>
        </div>
        <Button onClick={() => openModal()} className="w-full sm:w-auto bg-kivon-primary hover:bg-kivon-primary-hover text-black shadow-lg shadow-kivon-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Novo Funcionário
        </Button>
      </div>

      <div className="rounded-xl bg-kivon-card border border-kivon-border shadow-xl p-6">
        <div className="mb-6 flex items-center rounded-lg border border-kivon-border bg-kivon-bg px-3 focus-within:ring-1 focus-within:ring-kivon-primary focus-within:border-kivon-primary transition-all">
          <Search className="mr-2 h-5 w-5 text-kivon-text-sec" />
          <input
            type="text"
            placeholder="Pesquisar funcionários..."
            className="w-full border-0 bg-transparent py-2.5 text-white placeholder-kivon-text-sec focus:ring-0 outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-kivon-primary" />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12 text-kivon-text-sec bg-kivon-bg/50 rounded-lg border border-kivon-border border-dashed">
            Nenhum funcionário encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-kivon-border">
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
                        <button onClick={() => openModal(emp)} className="p-1 text-kivon-text-sec hover:text-kivon-primary transition-colors" title="Editar">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(emp.id)} className="p-1 text-kivon-text-sec hover:text-red-400 transition-colors" title="Inativar">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Funcionário' : 'Novo Funcionário'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          <Input label="Nome Completo" {...register('full_name')} error={errors.full_name?.message} className="bg-kivon-bg border-kivon-border text-white" />
          
          <div>
            <label className="mb-1.5 block text-sm font-medium text-kivon-text-sec">Cargo</label>
            <select
              {...register('job_role_id')}
              className="flex h-10 w-full rounded-lg border border-kivon-border bg-kivon-bg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-kivon-primary focus:border-kivon-primary transition-all"
            >
              <option value="">Selecione um cargo...</option>
              {jobRoles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
            {errors.job_role_id && <p className="mt-1 text-sm text-red-400">{errors.job_role_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Documento (CPF/RG)" {...register('document_number')} className="bg-kivon-bg border-kivon-border text-white" />
            <Input label="Telefone" {...register('phone')} className="bg-kivon-bg border-kivon-border text-white" />
          </div>
          
          <Input label="Data de Admissão" type="date" {...register('admission_date')} className="bg-kivon-bg border-kivon-border text-white" style={{ colorScheme: 'dark' }} />
          
          <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-kivon-border">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="bg-transparent border border-kivon-border text-white hover:bg-kivon-hover">Cancelar</Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-kivon-primary hover:bg-kivon-primary-hover text-black shadow-lg shadow-kivon-primary/20">Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
