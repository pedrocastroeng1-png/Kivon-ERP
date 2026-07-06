import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/shared/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/src/shared/components/ui/Input';
import { Button } from '@/src/shared/components/ui/Button';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a session. If not, redirect to login.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
      }
    });
  }, [navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('Sessão expirada. Faça login novamente.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Clear force_password_change flag via API
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        await fetch(`${apiUrl}/api/users/clear-force-password`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
      } catch (e) {
        console.error("Failed to clear force_password_change", e);
      }
      
      alert('Senha atualizada com sucesso!');
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-kivon-bg px-4 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-kivon-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-kivon-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 rounded-2xl bg-kivon-card border border-kivon-border p-10 shadow-2xl relative z-10 backdrop-blur-xl">
        <div className="text-center">
          <img src="/logo-kivon-white.png" alt="KIVON ERP" className="h-16 mx-auto mb-6" />
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Atualizar Senha
          </h2>
          <p className="mt-2 text-sm text-kivon-text-sec">
            Defina sua nova senha para acessar o KIVON ERP.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleUpdate}>
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Nova Senha"
              id="password"
              type="password"
              required
              minLength={6}
              className="bg-kivon-bg border-kivon-border text-white"
              placeholder="Nova senha (mínimo 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-kivon-primary hover:bg-kivon-primary-hover text-black font-semibold shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            >
              {loading ? 'Salvando...' : 'Salvar Senha e Entrar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
