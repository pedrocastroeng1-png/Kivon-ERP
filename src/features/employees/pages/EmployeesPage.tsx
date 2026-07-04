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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Funcionários</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie os funcionários da empresa e suas alocações.</p>
        </div>
        <Button onClick={() => openModal()} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Novo Funcionário
        </Button>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-6 flex items-center rounded-md border border-gray-300 px-3">
          <Search className="mr-2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar funcionários..."
            className="w-full border-0 bg-transparent py-2 focus:ring-0 outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Nenhum funcionário encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">Cargo</th>
                  <th className="px-6 py-3">Documento</th>
                  <th className="px-6 py-3">Telefone</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="border-b bg-white hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{emp.full_name}</td>
                    <td className="px-6 py-4">{emp.job_roles?.name || '-'}</td>
                    <td className="px-6 py-4">{emp.document_number || '-'}</td>
                    <td className="px-6 py-4">{emp.phone || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openModal(emp)} className="mr-3 text-indigo-600 hover:text-indigo-900">
                        <Edit2 className="h-4 w-4 inline" />
                      </button>
                      <button onClick={() => handleDelete(emp.id)} className="text-red-600 hover:text-red-900">
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Funcionário' : 'Novo Funcionário'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome Completo" {...register('full_name')} error={errors.full_name?.message} />
          
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Cargo</label>
            <select
              {...register('job_role_id')}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecione um cargo...</option>
              {jobRoles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
            {errors.job_role_id && <p className="mt-1 text-sm text-red-500">{errors.job_role_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Documento (CPF/RG)" {...register('document_number')} />
            <Input label="Telefone" {...register('phone')} />
          </div>
          
          <Input label="Data de Admissão" type="date" {...register('admission_date')} />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSubmitting}>Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
