import toast from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/shared/lib/supabase';
import { Button } from '@/src/shared/components/ui/Button';
import { Input } from '@/src/shared/components/ui/Input';
import { Modal } from '@/src/shared/components/ui/Modal';
import { Loader2, Plus, Edit2, Key, Trash2 } from 'lucide-react';
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
  username: z.string().optional().or(z.literal('')),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional().or(z.literal('')),
  profileCode: z.enum(['admin', 'operador']),
  active: z.boolean(),
});

type UserForm = z.infer<typeof userSchema>;

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<{
    fullName: string;
    username: string;
    password?: string;
    profile: string;
  } | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { profileCode: 'operador', active: true }
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
        username: '',
        password: '',
        active: user.active
      });
    } else {
      setEditingId(null);
      reset({ fullName: '', username: '', password: '', profileCode: 'operador', active: true });
    }
    setIsModalOpen(true);
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
        throw new Error(`Erro na API (${res.status}): O endpoint ${url} não retornou JSON.`);
      }
      return null;
    }
  }

  async function onSubmit(data: UserForm) {
    try {
      if (editingId) {
        // Edit flow
        await callApi(`/api/users/${editingId}`, 'PUT', {
          fullName: data.fullName,
          profileCode: data.profileCode,
          active: data.active
        });
        toast.success('Usuário atualizado com sucesso.');
      } else {
        // Create flow
        if (!data.username) throw new Error("Nome de usuário é obrigatório para novos usuários");
        if (!data.password) throw new Error("Senha temporária é obrigatória para novos usuários");
        
        await callApi('/api/users', 'POST', {
          fullName: data.fullName,
          username: data.username,
          password: data.password,
          profileCode: data.profileCode,
          active: data.active,
          forcePasswordChange: true
        });
        toast.success('Usuário criado com sucesso.');
        setCreatedUser({
          fullName: data.fullName,
          username: data.username,
          password: data.password,
          profile: data.profileCode === 'admin' ? 'Administrador' : 'Operador'
        });
      }
      setIsModalOpen(false);
      reset();
      fetchUsers();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  }

  async function sendResetPassword(userId: string) {
    const newPassword = prompt("Digite a nova senha temporária para este usuário:");
    if (!newPassword) return;
    if (newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    try {
      setActionLoading(`reset-${userId}`);
      await callApi(`/api/users/${userId}/reset-password`, 'POST', { password: newPassword });
      toast.success('Senha redefinida com sucesso.');
    } catch (err: any) {
      toast.error('Erro ao redefinir senha: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteUser(userId: string) {
    if (confirm("Tem certeza que deseja EXCLUIR este usuário? Esta ação não pode ser desfeita e os registros vinculados podem ser afetados.")) {
      try {
        setActionLoading(`delete-${userId}`);
        await callApi(`/api/users/${userId}`, 'DELETE');
        toast.success('Usuário excluído com sucesso.');
        fetchUsers();
      } catch (err: any) {
        toast.error('Erro ao excluir usuário: ' + err.message);
      } finally {
        setActionLoading(null);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-kivon-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Usuários</h1>
          <p className="mt-2 text-sm text-kivon-text-sec">Gerencie os acessos ao sistema.</p>
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
                  <Button variant="secondary" size="sm" onClick={() => sendResetPassword(user.id)} disabled={actionLoading === `reset-${user.id}`} className="h-10 border-kivon-border bg-kivon-bg text-kivon-primary">
                    {actionLoading === `reset-${user.id}` ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
                    Senha
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => deleteUser(user.id)} disabled={actionLoading === `delete-${user.id}`} className="col-span-2 h-10 border-red-500/20 bg-kivon-bg text-red-400 hover:bg-red-500/10">
                    {actionLoading === `delete-${user.id}` ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Excluir
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
                          onClick={() => sendResetPassword(user.id)}
                          disabled={actionLoading === `reset-${user.id}`}
                          className="p-1 text-kivon-text-sec hover:text-kivon-primary disabled:opacity-50 transition-colors"
                          title="Redefinir senha"
                        >
                          {actionLoading === `reset-${user.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          disabled={actionLoading === `delete-${user.id}`}
                          className="p-1 text-kivon-text-sec hover:text-red-400 disabled:opacity-50 transition-colors"
                          title="Excluir usuário"
                        >
                          {actionLoading === `delete-${user.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Usuário' : 'Novo Usuário'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          <Input label="Nome Completo" {...register('fullName')} error={errors.fullName?.message} className="bg-kivon-bg border-kivon-border text-white" />
          
          {!editingId && (
            <>
              <Input label="Nome de Usuário" type="text" {...register('username')} error={errors.username?.message} className="bg-kivon-bg border-kivon-border text-white" />
              <Input label="Senha Temporária" type="text" {...register('password')} error={errors.password?.message} className="bg-kivon-bg border-kivon-border text-white" />
            </>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-kivon-text-sec">Perfil</label>
              <select
                {...register('profileCode')}
                className="flex h-12 sm:h-10 w-full rounded-md border border-kivon-border bg-kivon-bg px-3 py-2 text-base sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-kivon-primary focus:border-kivon-primary transition-all"
              >
                <option value="operador">Operador</option>
                <option value="admin">Administrador</option>
              </select>
              {errors.profileCode && <p className="mt-1 text-sm text-red-400">{errors.profileCode.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-kivon-text-sec">Status</label>
              <select
                {...register('active', { setValueAs: v => v === 'true' })}
                className="flex h-12 sm:h-10 w-full rounded-md border border-kivon-border bg-kivon-bg px-3 py-2 text-base sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-kivon-primary focus:border-kivon-primary transition-all"
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
              {errors.active && <p className="mt-1 text-sm text-red-400">{errors.active.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-kivon-border">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="bg-transparent border border-kivon-border text-white hover:bg-kivon-hover">
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-kivon-primary hover:bg-kivon-primary-hover text-black shadow-lg shadow-kivon-primary/20">
              {editingId ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!createdUser} onClose={() => setCreatedUser(null)} title="Usuário Criado com Sucesso">
        {createdUser && (
          <div className="space-y-4 mt-4">
            <div className="bg-kivon-bg rounded-lg p-4 border border-kivon-border space-y-4 text-sm font-mono">
              <p className="text-center font-bold text-white mb-4">KIVON ERP</p>
              <p className="text-emerald-400 mb-6 text-center">User created successfully.</p>
              <div>
                <p className="text-kivon-text-sec mb-1">Name:</p>
                <p className="text-white">{createdUser.fullName}</p>
              </div>
              <div>
                <p className="text-kivon-text-sec mb-1">Username:</p>
                <p className="text-white">{createdUser.username}</p>
              </div>
              <div>
                <p className="text-kivon-text-sec mb-1">Password:</p>
                <p className="text-white">{createdUser.password}</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-kivon-border">
              <Button type="button" variant="secondary" onClick={() => setCreatedUser(null)} className="bg-transparent border border-kivon-border text-white hover:bg-kivon-hover">
                Fechar
              </Button>
              <Button type="button" onClick={() => {
                const text = `KIVON ERP\n\nName:\n${createdUser.fullName}\n\nUsername:\n${createdUser.username}\n\nPassword:\n${createdUser.password}`;
                navigator.clipboard.writeText(text);
                toast.success("Credenciais copiadas para a área de transferência.");
              }} className="bg-kivon-primary hover:bg-kivon-primary-hover text-black shadow-lg shadow-kivon-primary/20">
                Copiar Credenciais
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
