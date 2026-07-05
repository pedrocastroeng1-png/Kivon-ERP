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
      
      {/* Watermark Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <img 
          src={logoUrl} 
          alt="" 
          className="h-[80vh] w-auto opacity-5 object-contain select-none"
        />
      </div>

      <div className="w-full max-w-md space-y-10 rounded-3xl bg-[#151515]/80 backdrop-blur-md p-10 sm:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] border border-white/[0.05] relative z-10">
        
        <div className="text-center flex flex-col items-center">
          <img 
            src={logoUrl} 
            alt="KIVON ERP" 
            className="h-24 object-contain mb-8 drop-shadow-md"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }} 
          />
          <h2 className="text-[22px] font-semibold tracking-tight text-white/90 leading-snug">
            Construindo eficiência.<br/>Gerenciando o futuro.
          </h2>
          <p className="mt-4 text-[13px] text-white/40 font-medium tracking-wide">
            Plataforma inteligente para gestão completa de obras e equipes.
          </p>
        </div>

        <form className="mt-10 space-y-6" onSubmit={handleLogin}>
          
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-400">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-400">
              {successMsg}
            </div>
          )}

          <div className="space-y-5">
            <div className="group">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-2 transition-colors group-focus-within:text-white/70" htmlFor="email">Email Corporativo</label>
              <input
                id="email"
                type="email"
                required
                className="w-full rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3.5 text-white/90 placeholder-white/20 focus:border-white/20 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-white/20 sm:text-sm transition-all duration-300"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="group">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/40 transition-colors group-focus-within:text-white/70" htmlFor="password">Senha de Acesso</label>
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
                  className="text-[10px] font-medium tracking-wide text-white/30 hover:text-white/70 transition-colors duration-300"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <input
                id="password"
                type="password"
                required
                className="w-full rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3.5 text-white/90 placeholder-white/20 focus:border-white/20 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-white/20 sm:text-sm transition-all duration-300"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center mt-2">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-white/10 bg-black/30 text-kivon-primary focus:ring-kivon-primary focus:ring-offset-black transition-colors"
            />
            <label htmlFor="remember-me" className="ml-2.5 block text-[11px] font-medium tracking-wide text-white/40">
              Manter conectado
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center items-center rounded-xl bg-kivon-primary px-4 py-4 text-[12px] uppercase tracking-[0.15em] font-bold text-black hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-kivon-primary focus:ring-offset-2 focus:ring-offset-[#151515] disabled:opacity-50 disabled:hover:scale-100 transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_30px_rgba(212,175,55,0.3)] overflow-hidden"
            >
              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-150%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(150%)]">
                <div className="relative h-full w-12 bg-white/30" />
              </div>

              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                <span className="relative z-10">Acessar Plataforma</span>
              )}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-12 text-center relative z-10">
        <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-light">
          KIVON ERP &bull; V 1.0.0 (BUILD 42) &bull; &copy; 2026
        </p>
      </div>
    </div>
  );
}
