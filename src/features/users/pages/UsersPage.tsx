import toast from 'react-hot-toast';
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
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, profiles(name, code)')
        .order('full_name');
      
      if (error) throw error;
      if (data) {
        setUsers(data);
      }
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err);
      toast.error(err.message || 'Erro ao carregar usuários.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
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
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const res = await fetch(`${apiUrl}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro na requisição da API');
      }
      return data;
    } else {
      if (!res.ok) {
        throw new Error(`Erro na API (${res.status}): O endpoint ${url} não retornou JSON. Isso ocorre se a API não estiver rodando ou a rota estiver incorreta.`);
      }
      return null;
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-kivon-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Usuários</h1>
          <p className="mt-2 text-sm text-kivon-text-sec">Gerencie o acesso ao sistema (Administradores e Operadores).</p>
        </div>
        <Button onClick={() => openModal()} className="w-full sm:w-auto bg-kivon-primary hover:bg-kivon-primary-hover text-black shadow-lg shadow-kivon-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      <div className="rounded-xl bg-kivon-card border border-kivon-border shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-kivon-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-kivon-text-sec">
            Nenhum usuário encontrado.
          </div>
        ) : (
          <>
          <div className="block lg:hidden space-y-4 p-4">
            {users.map((user) => (
              <div key={user.id} className="bg-kivon-card border border-kivon-border rounded-lg p-4 space-y-3 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-white text-base">{user.full_name}</h4>
                    <p className="text-sm text-kivon-text-sec">{user.profiles?.name || '-'}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${user.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {user.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-kivon-border/50 mt-2">
                  <Button variant="secondary" size="sm" onClick={() => openModal(user)} className="h-10 border-kivon-border bg-kivon-bg text-kivon-primary">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => toggleActive(user.id, user.active)}
                    isLoading={actionLoading === user.id}
                    className="h-10 border-kivon-border bg-kivon-bg text-white"
                  >
                    {user.active ? 'Inativar' : 'Ativar'}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => resendInvite(user.id)} disabled={actionLoading === `invite-${user.id}`} className="h-10 border-kivon-border bg-kivon-bg text-kivon-primary">
                    {actionLoading === `invite-${user.id}` ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                    Convite
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => sendResetPassword(user.id)} disabled={actionLoading === `reset-${user.id}`} className="h-10 border-kivon-border bg-kivon-bg text-kivon-primary">
                    {actionLoading === `reset-${user.id}` ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
                    Senha
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-sm text-kivon-text-sec">
              <thead className="bg-kivon-bg/50 text-xs uppercase text-kivon-text-sec">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nome</th>
                  <th className="px-6 py-4 font-semibold">Perfil</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kivon-border">
                {users.map((user) => (
                  <tr key={user.id} className="bg-kivon-card hover:bg-kivon-hover transition-colors group">
                    <td className="px-6 py-4 font-medium text-white">{user.full_name}</td>
                    <td className="px-6 py-4">{user.profiles?.name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${user.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {user.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(user)}
                          className="p-1 text-kivon-text-sec hover:text-kivon-primary transition-colors"
                          title="Editar perfil"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => resendInvite(user.id)}
                          disabled={actionLoading === `invite-${user.id}`}
                          className="p-1 text-kivon-text-sec hover:text-kivon-primary disabled:opacity-50 transition-colors"
                          title="Reenviar convite"
                        >
                          {actionLoading === `invite-${user.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => sendResetPassword(user.id)}
                          disabled={actionLoading === `reset-${user.id}`}
                          className="p-1 text-kivon-text-sec hover:text-kivon-primary disabled:opacity-50 transition-colors"
                          title="Redefinir senha"
                        >
                          {actionLoading === `reset-${user.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                        </button>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => toggleActive(user.id, user.active)}
                          isLoading={actionLoading === user.id}
                          className="bg-kivon-bg text-kivon-text-sec hover:text-white border border-kivon-border"
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
          </>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Perfil' : 'Novo Usuário'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          <Input label="Nome Completo" {...register('fullName')} error={errors.fullName?.message} className="bg-kivon-bg border-kivon-border text-white" />
          {!editingId && (
            <Input label="E-mail" type="email" {...register('email')} error={errors.email?.message} className="bg-kivon-bg border-kivon-border text-white" />
          )}
          
          <div>
            <label className="mb-1.5 block text-sm font-medium text-kivon-text-sec">Perfil</label>
            <select
              {...register('profileCode')}
              className="flex h-12 sm:h-10 w-full rounded-md border border-kivon-border bg-kivon-bg px-3 py-2 text-base sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-kivon-primary focus:border-kivon-primary transition-all"
            >
              <option value="operador">Operador (Acesso restrito)</option>
              <option value="admin">Administrador (Acesso total)</option>
            </select>
            {errors.profileCode && <p className="mt-1 text-sm text-red-400">{errors.profileCode.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-kivon-border">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="bg-transparent border border-kivon-border text-white hover:bg-kivon-hover">
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-kivon-primary hover:bg-kivon-primary-hover text-black shadow-lg shadow-kivon-primary/20">
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
