import React, { useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/src/app/providers/AuthProvider';
import { Home, Calendar, LogOut, Loader2, Menu, X, Users, Briefcase, Building, FileText, Settings, Database, Activity, CalendarCheck } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';

export function AppLayout() {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAdmin = profile?.profiles?.code === 'admin';
  const isOperator = profile?.profiles?.code === 'operador';

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Activity, show: isAdmin },
    { name: 'Diárias', href: '/diarias', icon: Calendar, show: isAdmin || isOperator },
    { name: 'Fechamento Diário', href: '/fechamento-diario', icon: CalendarCheck, show: isAdmin || isOperator },
    { name: 'Funcionários', href: '/funcionarios', icon: Users, show: isAdmin },
    { name: 'Obras', href: '/obras', icon: Building, show: isAdmin },
    { name: 'Cargos', href: '/cargos', icon: Briefcase, show: isAdmin },
    { name: 'Relatórios', href: '/relatorios', icon: FileText, show: isAdmin },
    { name: 'Usuários', href: '/usuarios', icon: Settings, show: isAdmin },
  ].filter(item => item.show);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile menu sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative mr-16 flex w-full max-w-xs flex-1 flex-col bg-slate-900 pt-5 pb-4 shadow-2xl">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex shrink-0 items-center px-6 gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                <Database className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">KIVON ERP</span>
            </div>
            <div className="mt-8 h-0 flex-1 overflow-y-auto">
              <nav className="space-y-1 px-3">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      location.pathname === item.href
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white',
                      'group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors'
                    )}
                  >
                    <item.icon
                      className={cn(
                        location.pathname === item.href ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300',
                        'mr-3 h-5 w-5 shrink-0 transition-colors'
                      )}
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="border-t border-slate-800 p-4">
              <div className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                  <span className="text-sm font-medium text-slate-300">
                    {(profile?.full_name || 'Usuário').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{profile?.full_name || 'Usuário'}</p>
                  <p className="text-xs font-medium text-slate-400">{profile?.profiles?.name || 'Carregando...'}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="mt-4 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sair do sistema
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[260px] lg:flex-col shadow-xl z-20">
        <div className="flex min-h-0 flex-1 flex-col bg-slate-900 border-r border-slate-800">
          <div className="flex flex-1 flex-col overflow-y-auto pt-6 pb-4">
            <div className="flex shrink-0 items-center px-6 gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-indigo-500/20 shadow-lg">
                <Database className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">KIVON ERP</span>
            </div>
            
            <div className="mt-8 px-4 mb-2">
              <p className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Menu Principal
              </p>
            </div>
            
            <nav className="flex-1 space-y-1 px-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    location.pathname === item.href
                      ? 'bg-indigo-500/10 text-indigo-400'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white',
                    'group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors'
                  )}
                >
                  <item.icon
                    className={cn(
                      location.pathname === item.href ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300',
                      'mr-3 h-5 w-5 shrink-0 transition-colors'
                    )}
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="border-t border-slate-800 p-4">
            <div className="flex items-center px-2 py-2">
              <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <span className="text-sm font-medium text-slate-300">
                  {(profile?.full_name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3 truncate">
                <p className="truncate text-sm font-medium text-white">{profile?.full_name || 'Usuário'}</p>
                <p className="truncate text-xs font-medium text-slate-400">{profile?.profiles?.name || 'Carregando...'}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair do sistema
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:pl-[260px] min-w-0">
        {/* Top Header (Desktop & Mobile) */}
        <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-slate-700 lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              {/* Optional: Add global search here in the future */}
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Optional: Add notifications or quick actions here */}
            </div>
          </div>
        </header>

        <main className="flex-1 pb-10">
          <div className="py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
