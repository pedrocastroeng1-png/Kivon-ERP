import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/shared/lib/supabase';
import { Button } from '@/src/shared/components/ui/Button';
import { Input } from '@/src/shared/components/ui/Input';
import { Modal } from '@/src/shared/components/ui/Modal';
import { Plus, Edit2, Trash2, Search, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const jobRoleSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  daily_rate: z.string().min(1, 'Valor é obrigatório'),
  description: z.string().optional(),
});

type JobRoleForm = z.infer<typeof jobRoleSchema>;

interface JobRole {
  id: string;
  name: string;
  daily_rate: number;
  description: string;
  active: boolean;
}

export default function JobRolesPage() {
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<JobRoleForm>({
    resolver: zodResolver(jobRoleSchema),
    defaultValues: {
      name: '',
      daily_rate: '0',
      description: ''
    }
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  async function fetchRoles() {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_roles')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (!error && data) {
      setRoles(data);
    }
    setLoading(false);
  }

  function openModal(role?: JobRole) {
    if (role) {
      setEditingId(role.id);
      reset({ name: role.name, daily_rate: role.daily_rate.toString(), description: role.description || '' });
    } else {
      setEditingId(null);
      reset({ name: '', daily_rate: '0', description: '' });
    }
    setIsModalOpen(true);
  }

  async function onSubmit(data: JobRoleForm) {
    const payload = {
      ...data,
      daily_rate: Number(data.daily_rate)
    };
    if (editingId) {
      await supabase.from('job_roles').update(payload).eq('id', editingId);
    } else {
      await supabase.from('job_roles').insert([payload]);
    }
    setIsModalOpen(false);
    fetchRoles();
  }

  async function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja inativar este cargo?')) {
      await supabase.from('job_roles').update({ active: false }).eq('id', id);
      fetchRoles();
    }
  }

  const filteredRoles = roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Cargos</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie os cargos e os valores das diárias.</p>
        </div>
        <Button onClick={() => openModal()} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Novo Cargo
        </Button>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-6 flex items-center rounded-md border border-gray-300 px-3">
          <Search className="mr-2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar cargos..."
            className="w-full border-0 bg-transparent py-2 focus:ring-0 outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Nenhum cargo encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">Valor da Diária</th>
                  <th className="px-6 py-3">Descrição</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="border-b bg-white hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{role.name}</td>
                    <td className="px-6 py-4">R$ {role.daily_rate.toFixed(2)}</td>
                    <td className="px-6 py-4">{role.description || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openModal(role)} className="mr-3 text-indigo-600 hover:text-indigo-900">
                        <Edit2 className="h-4 w-4 inline" />
                      </button>
                      <button onClick={() => handleDelete(role.id)} className="text-red-600 hover:text-red-900">
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Cargo' : 'Novo Cargo'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome do Cargo" {...register('name')} error={errors.name?.message} />
          <Input label="Valor da Diária (R$)" type="number" step="0.01" {...register('daily_rate')} error={errors.daily_rate?.message} />
          <Input label="Descrição" {...register('description')} error={errors.description?.message} />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSubmitting}>Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
