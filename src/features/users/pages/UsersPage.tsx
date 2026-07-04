import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/shared/lib/supabase';
import { Button } from '@/src/shared/components/ui/Button';
import { Loader2 } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  active: boolean;
  profiles: {
    name: string;
    code: string;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

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

  async function toggleActive(userId: string, currentStatus: boolean) {
    if (confirm(`Deseja ${currentStatus ? 'inativar' : 'ativar'} este usuário?`)) {
      await supabase.from('users').update({ active: !currentStatus }).eq('id', userId);
      fetchUsers();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Usuários</h1>
        <p className="mt-1 text-sm text-gray-500">Gerencie o acesso ao sistema (Administradores e Operadores).</p>
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
                      <Button variant="secondary" size="sm" onClick={() => toggleActive(user.id, user.active)}>
                        {user.active ? 'Inativar' : 'Ativar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
