import React, { useState } from 'react';
import { supabase } from '@/src/shared/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const logoUrl = `${supabaseUrl}/storage/v1/object/public/company-assets/logo-kivon-white.png`;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-kivon-bg px-4 relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-kivon-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 rounded-2xl bg-kivon-card/80 backdrop-blur-xl p-10 shadow-2xl border border-kivon-border relative z-10">
        
        <div className="text-center flex flex-col items-center">
          <img 
            src={logoUrl} 
            alt="KIVON ERP" 
            className="h-16 object-contain mb-4 drop-shadow-lg" 
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }} 
          />
          <div className="hidden text-3xl font-bold tracking-tight text-white mb-4">
            KIVON ERP
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Bem-vindo de volta
          </h2>
          <p className="mt-2 text-sm text-kivon-text-sec">
            Acesse o sistema com suas credenciais corporativas
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
              {successMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-kivon-text-sec mb-1" htmlFor="email">Email Corporativo</label>
              <input
                id="email"
                type="email"
                required
                className="w-full rounded-lg border border-kivon-border bg-kivon-bg/50 px-4 py-3 text-white placeholder-kivon-text-sec/50 focus:border-kivon-primary focus:outline-none focus:ring-1 focus:ring-kivon-primary sm:text-sm transition-all"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-kivon-text-sec mb-1" htmlFor="password">Senha de Acesso</label>
              <input
                id="password"
                type="password"
                required
                className="w-full rounded-lg border border-kivon-border bg-kivon-bg/50 px-4 py-3 text-white placeholder-kivon-text-sec/50 focus:border-kivon-primary focus:outline-none focus:ring-1 focus:ring-kivon-primary sm:text-sm transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-kivon-border bg-kivon-bg text-kivon-primary focus:ring-kivon-primary focus:ring-offset-kivon-bg"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-kivon-text-sec">
                Lembrar de mim
              </label>
            </div>

            <div className="text-sm">
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    setError('Digite seu email para redefinir a senha.');
                    return;
                  }
                  setLoading(true);
                  setError('');
                  setSuccessMsg('');
                  const { error } = await supabase.auth.resetPasswordForEmail(email);
                  if (error) {
                    setError('Erro: ' + error.message);
                  } else {
                    setSuccessMsg('Um link de redefinição foi enviado para seu e-mail.');
                  }
                  setLoading(false);
                }}
                className="font-medium text-kivon-primary hover:text-kivon-primary-hover transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center items-center rounded-lg bg-kivon-primary px-4 py-3 text-sm font-bold text-black hover:bg-kivon-primary-hover focus:outline-none focus:ring-2 focus:ring-kivon-primary focus:ring-offset-2 focus:ring-offset-kivon-bg disabled:opacity-50 transition-all shadow-lg shadow-kivon-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                'Acessar Sistema'
              )}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-8 text-center relative z-10">
        <p className="text-xs text-kivon-text-sec opacity-60 tracking-wider">
          KIVON ERP V 1.0.0 (BUILD 42) &copy; 2026
        </p>
      </div>
    </div>
  );
}
