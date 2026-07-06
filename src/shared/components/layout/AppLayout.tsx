import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { SmartCenterDrawer } from '@/src/features/smart-center/components/SmartCenterDrawer';
import { SmartCenterHeaderBadge } from '@/src/features/smart-center/components/SmartCenterHeaderBadge';
import { useNotificationStore } from '@/src/features/smart-center/store/notificationStore';
import { useAuth } from '@/src/app/providers/AuthProvider';
import { Home, Calendar, LogOut, Loader2, Menu, X, Users, Briefcase, Building, FileText, Settings, Database, Activity, CalendarCheck, Download, WifiOff, Search, Bell, MenuSquare, Megaphone } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';
import { ReloadPrompt } from '@/src/shared/components/ReloadPrompt';
import { motion, AnimatePresence } from 'motion/react';

export function AppLayout() {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { isOpen: isSmartCenterOpen, setIsOpen: setIsSmartCenterOpen } = useNotificationStore();
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const logoUrl = `${supabaseUrl}/storage/v1/object/public/company-assets/logo-kivon-white.png`;
  const iconUrl = `${supabaseUrl}/storage/v1/object/public/company-assets/icon-192.png`;

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-kivon-bg">
        <Loader2 className="h-8 w-8 animate-spin text-kivon-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Force password change check
  if (profile?.force_password_change) {
    return <Navigate to="/update-password" replace />;
  }

  const isAdmin = profile?.profiles?.code === 'admin';
  const isOperator = profile?.profiles?.code === 'operador';

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Activity, show: isAdmin },
    { name: 'Obras', href: '/obras', icon: Building, show: isAdmin },
    { name: 'Funcionários', href: '/funcionarios', icon: Users, show: isAdmin },
    { name: 'Presença', href: '/diarias', icon: Calendar, show: isAdmin || isOperator },
    { name: 'Fechamento', href: '/fechamento-diario', icon: CalendarCheck, show: isAdmin || isOperator },
    { name: 'Relatórios', href: '/relatorios', icon: FileText, show: isAdmin },
    { name: 'Usuários', href: '/usuarios', icon: Settings, show: isAdmin },
    { name: 'Cargos', href: '/cargos', icon: Briefcase, show: isAdmin },
    { name: 'Central Inteligente', href: '/central-inteligente', icon: Megaphone, show: isAdmin },
    { name: 'App Mobile', href: '/downloads', icon: Download, show: true },
  ].filter(item => item.show);

  const breadcrumbs = navigation.find(item => location.pathname === item.href) || { name: 'Painel', href: '/' };

  return (
    <div className="flex h-screen w-full bg-kivon-bg overflow-hidden text-kivon-text">
      
      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 0.2 }}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.x < -50 || velocity.x < -500) {
                  setMobileMenuOpen(false);
                }
              }}
              className="relative flex w-full max-w-[280px] flex-1 flex-col bg-kivon-card border-r border-kivon-border pt-5 pb-4 shadow-2xl"
            >
              <div className="flex shrink-0 items-center px-6 gap-3">
                <img src={logoUrl} alt="KIVON" className="h-8 object-contain" onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo-kivon-white.png';
                    (e.target as HTMLImageElement).onerror = null;
                  }} />
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
                          ? 'bg-kivon-hover text-kivon-primary border-l-2 border-kivon-primary'
                          : 'text-kivon-text-sec hover:bg-kivon-hover hover:text-white border-l-2 border-transparent',
                        'group flex items-center px-3 py-4 text-[15px] font-medium transition-all duration-200 ease-in-out min-h-[48px]'
                      )}
                    >
                      <item.icon
                        className={cn(
                          location.pathname === item.href ? 'text-kivon-primary' : 'text-kivon-text-sec group-hover:text-white',
                          'mr-4 h-6 w-6 shrink-0 transition-colors'
                        )}
                      />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
              
              <div className="border-t border-kivon-border p-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-kivon-hover flex items-center justify-center border border-kivon-border">
                    <span className="text-base font-medium text-white">
                      {(profile?.full_name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">{profile?.full_name || 'Usuário'}</p>
                    <p className="text-xs font-medium text-kivon-text-sec">{profile?.profiles?.name || 'Carregando...'}</p>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="mt-4 flex w-full items-center gap-2 rounded-md px-3 py-3 text-[15px] font-medium text-kivon-text-sec hover:bg-kivon-hover hover:text-white transition-colors min-h-[48px]"
                >
                  <LogOut className="h-5 w-5" />
                  Sair do sistema
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[280px] lg:flex-col shadow-2xl z-20 transition-all duration-300">
        <div className="flex min-h-0 flex-1 flex-col bg-kivon-card border-r border-kivon-border">
          <div className="flex flex-1 flex-col overflow-y-auto pt-6 pb-4">
            <div className="flex shrink-0 items-center px-6 gap-3 justify-center mb-2">
              <img src={logoUrl} alt="KIVON ERP" className="h-10 object-contain" onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo-kivon-white.png';
                  (e.target as HTMLImageElement).onerror = null;
                }} />
              <div className="hidden h-10 w-10 rounded-lg bg-kivon-primary flex items-center justify-center">
                <Database className="h-6 w-6 text-black" />
              </div>
            </div>
            
            <div className="mt-8 px-6 mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-kivon-text-sec opacity-70">
                Menu Principal
              </p>
            </div>
            
            <nav className="flex-1 space-y-1 px-3 mt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    location.pathname === item.href
                      ? 'bg-kivon-hover text-kivon-primary border-l-2 border-kivon-primary'
                      : 'text-kivon-text-sec hover:bg-kivon-hover hover:text-white border-l-2 border-transparent',
                    'group flex items-center px-3 py-2.5 text-sm font-medium transition-all duration-200'
                  )}
                >
                  <item.icon
                    className={cn(
                      location.pathname === item.href ? 'text-kivon-primary' : 'text-kivon-text-sec group-hover:text-white',
                      'mr-3 h-5 w-5 shrink-0 transition-colors'
                    )}
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="border-t border-kivon-border p-4 bg-kivon-card">
            <div className="flex items-center px-2 py-2">
              <div className="h-9 w-9 rounded-full bg-kivon-bg flex items-center justify-center border border-kivon-border overflow-hidden">
                <span className="text-sm font-medium text-white">
                  {(profile?.full_name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3 truncate">
                <p className="truncate text-sm font-medium text-white">{profile?.full_name || 'Usuário'}</p>
                <p className="truncate text-xs font-medium text-kivon-text-sec">{profile?.profiles?.name || 'Carregando...'}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-kivon-text-sec hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair do sistema
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:pl-[280px] min-w-0 transition-all duration-300">
        
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-kivon-border bg-kivon-bg/95 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-ml-2 p-2 text-kivon-text-sec lg:hidden hover:text-white"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Menu</span>
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 items-center justify-between">
            
            <div className="flex items-center gap-2 text-base font-medium text-white">
               <span className="lg:hidden">{breadcrumbs.name}</span>
               <div className="hidden lg:flex items-center gap-2 text-sm text-kivon-text-sec">
                 <span>KIVON</span> 
                 <span className="text-kivon-border">/</span>
                 <span className="font-medium text-white">{breadcrumbs.name}</span>
               </div>
            </div>

            <div className="flex-1 flex justify-center max-w-md mx-auto hidden md:flex">
               <div className="relative w-full">
                 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                   <Search className="h-4 w-4 text-kivon-text-sec" />
                 </div>
                 <input
                   type="text"
                   placeholder="Pesquisar..."
                   className="block w-full rounded-md border border-kivon-border bg-kivon-card py-1.5 pl-10 pr-3 text-white placeholder:text-kivon-text-sec focus:ring-1 focus:ring-inset focus:ring-kivon-primary focus:border-kivon-primary sm:text-sm sm:leading-6"
                 />
               </div>
            </div>

            <div className="flex items-center gap-x-3 lg:gap-x-6">
              <div className="block">
                <SmartCenterHeaderBadge />
              </div>
              
              <div className="hidden sm:block h-6 w-px bg-kivon-border" />
              
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-kivon-card flex items-center justify-center border border-kivon-border overflow-hidden">
                  <span className="text-sm font-medium text-white">
                    {(profile?.full_name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {isOffline && (
          <div className="bg-yellow-500/10 p-3 sm:px-6 lg:px-8 flex items-center gap-3 border-b border-yellow-500/20">
            <WifiOff className="h-5 w-5 text-yellow-500" />
            <p className="text-sm font-medium text-yellow-500">
              Você está offline. O aplicativo continuará funcionando com dados locais.
            </p>
          </div>
        )}

        <main className="flex-1 pb-10 overflow-auto bg-kivon-bg">
          <div className="py-6 sm:py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
      <ReloadPrompt />
      <SmartCenterDrawer isOpen={isSmartCenterOpen} onClose={() => setIsSmartCenterOpen(false)} />
    </div>
  );
}
