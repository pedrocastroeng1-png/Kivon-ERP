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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-kivon-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Cargos</h1>
          <p className="mt-2 text-sm text-kivon-text-sec">Gerencie os cargos e os valores das diárias.</p>
        </div>
        <Button onClick={() => openModal()} className="w-full sm:w-auto bg-kivon-primary hover:bg-kivon-primary-hover text-black shadow-lg shadow-kivon-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Novo Cargo
        </Button>
      </div>

      <div className="rounded-xl bg-kivon-card border border-kivon-border shadow-xl p-6">
        <div className="mb-6 flex items-center rounded-lg border border-kivon-border bg-kivon-bg px-3 focus-within:ring-1 focus-within:ring-kivon-primary focus-within:border-kivon-primary transition-all">
          <Search className="mr-2 h-5 w-5 text-kivon-text-sec" />
          <input
            type="text"
            placeholder="Pesquisar cargos..."
            className="w-full border-0 bg-transparent py-2.5 text-white placeholder-kivon-text-sec focus:ring-0 outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-kivon-primary" />
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="text-center py-12 text-kivon-text-sec bg-kivon-bg/50 rounded-lg border border-kivon-border border-dashed">
            Nenhum cargo encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-kivon-border">
            <table className="w-full text-left text-sm text-kivon-text-sec">
              <thead className="bg-kivon-bg/80 text-xs uppercase text-kivon-text-sec">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nome</th>
                  <th className="px-6 py-4 font-semibold">Valor da Diária</th>
                  <th className="px-6 py-4 font-semibold">Descrição</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kivon-border">
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="bg-kivon-card hover:bg-kivon-hover transition-colors group">
                    <td className="px-6 py-4 font-medium text-white">{role.name}</td>
                    <td className="px-6 py-4 font-medium text-emerald-400">R$ {role.daily_rate.toFixed(2)}</td>
                    <td className="px-6 py-4">{role.description || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(role)} className="p-1 text-kivon-text-sec hover:text-kivon-primary transition-colors" title="Editar">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(role.id)} className="p-1 text-kivon-text-sec hover:text-red-400 transition-colors" title="Inativar">
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Cargo' : 'Novo Cargo'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          <Input label="Nome do Cargo" {...register('name')} error={errors.name?.message} className="bg-kivon-bg border-kivon-border text-white" />
          <Input label="Valor da Diária (R$)" type="number" step="0.01" {...register('daily_rate')} error={errors.daily_rate?.message} className="bg-kivon-bg border-kivon-border text-white" />
          <Input label="Descrição" {...register('description')} error={errors.description?.message} className="bg-kivon-bg border-kivon-border text-white" />
          
          <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-kivon-border">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="bg-transparent border border-kivon-border text-white hover:bg-kivon-hover">Cancelar</Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-kivon-primary hover:bg-kivon-primary-hover text-black shadow-lg shadow-kivon-primary/20">Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
