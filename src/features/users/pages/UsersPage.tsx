import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/shared/lib/supabase';
import { Button } from '@/src/shared/components/ui/Button';
import { Input } from '@/src/shared/components/ui/Input';
import { Modal } from '@/src/shared/components/ui/Modal';
import { Loader2, Plus, Mail, Key, Edit2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface UserProfile {
  id: string;
  full_name: string;
  active: boolean;
  profiles: {
    name: string;
    code: string;
  };
}

const userSchema = z.object({
  fullName: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  profileCode: z.enum(['admin', 'operador']),
});

type UserForm = z.infer<typeof userSchema>;

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { profileCode: 'operador' }
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, active, profiles(name, code)')
      .order('full_name');
    
    if (!error && data) {
      setUsers(data as any);
    }
    setLoading(false);
  }

  function openModal(user?: UserProfile) {
    if (user) {
      setEditingId(user.id);
      reset({
        fullName: user.full_name,
        profileCode: user.profiles?.code as 'admin' | 'operador',
        email: ''
      });
    } else {
      setEditingId(null);
      reset({ fullName: '', email: '', profileCode: 'operador' });
    }
    setIsModalOpen(true);
  }

  async function toggleActive(userId: string, currentStatus: boolean) {
    if (confirm(`Deseja ${currentStatus ? 'inativar' : 'ativar'} este usuário?`)) {
      setActionLoading(userId);
      await supabase.from('users').update({ active: !currentStatus }).eq('id', userId);
      await fetchUsers();
      setActionLoading(null);
    }
  }

  async function callApi(url: string, method: string = 'POST', body?: any) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'API request failed');
    }
    return res.json();
  }

  async function onSubmit(data: UserForm) {
    try {
      if (editingId) {
        // Edit flow
        const { data: profileObj } = await supabase.from('profiles').select('id').eq('code', data.profileCode).single();
        if (profileObj) {
          await supabase.from('users').update({
            full_name: data.fullName,
            profile_id: profileObj.id
          }).eq('id', editingId);
        }
        alert('Usuário atualizado com sucesso.');
      } else {
        // Create flow
        if (!data.email) throw new Error("E-mail é obrigatório para novos usuários");
        await callApi('/api/users', 'POST', data);
        alert('Usuário criado com sucesso. Um e-mail de convite foi enviado.');
      }
      setIsModalOpen(false);
      reset();
      fetchUsers();
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  }

  async function resendInvite(userId: string) {
    try {
      setActionLoading(`invite-${userId}`);
      await callApi(`/api/users/${userId}/resend-invite`);
      alert('Convite reenviado com sucesso.');
    } catch (err: any) {
      alert('Erro ao reenviar convite: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function sendResetPassword(userId: string) {
    try {
      setActionLoading(`reset-${userId}`);
      await callApi(`/api/users/${userId}/reset-password`);
      alert('E-mail de redefinição de senha enviado com sucesso.');
    } catch (err: any) {
      alert('Erro ao redefinir senha: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Usuários</h1>
          <p className="mt-1 text-sm text-gray-500">Gerencie o acesso ao sistema (Administradores e Operadores).</p>
        </div>
        <Button onClick={() => openModal()} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Nenhum usuário encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">Perfil</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b bg-white hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{user.full_name}</td>
                    <td className="px-6 py-4">{user.profiles?.name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(user)}
                          className="text-slate-500 hover:text-indigo-600"
                          title="Editar perfil"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => resendInvite(user.id)}
                          disabled={actionLoading === `invite-${user.id}`}
                          className="text-slate-500 hover:text-indigo-600 disabled:opacity-50"
                          title="Reenviar convite"
                        >
                          {actionLoading === `invite-${user.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => sendResetPassword(user.id)}
                          disabled={actionLoading === `reset-${user.id}`}
                          className="text-slate-500 hover:text-indigo-600 disabled:opacity-50"
                          title="Redefinir senha"
                        >
                          {actionLoading === `reset-${user.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                        </button>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => toggleActive(user.id, user.active)}
                          isLoading={actionLoading === user.id}
                        >
                          {user.active ? 'Inativar' : 'Ativar'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Perfil' : 'Novo Usuário'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome Completo" {...register('fullName')} error={errors.fullName?.message} />
          {!editingId && (
            <Input label="E-mail" type="email" {...register('email')} error={errors.email?.message} />
          )}
          
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Perfil</label>
            <select
              {...register('profileCode')}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="operador">Operador (Acesso restrito)</option>
              <option value="admin">Administrador (Acesso total)</option>
            </select>
            {errors.profileCode && <p className="mt-1 text-sm text-red-500">{errors.profileCode.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSubmitting}>Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
