import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/src/app/providers/AuthProvider';
import { Home, Calendar, LogOut, Loader2, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/src/shared/lib/utils';

export function AppLayout() {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
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
    { name: 'Dashboard', href: '/', icon: Home, show: isAdmin },
    { name: 'Diárias', href: '/diarias', icon: Calendar, show: isAdmin || isOperator },
  ].filter(item => item.show);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative mr-16 flex w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex shrink-0 items-center px-4 font-bold text-xl text-indigo-600">
              KIVON ERP
            </div>
            <div className="mt-5 h-0 flex-1 overflow-y-auto">
              <nav className="space-y-1 px-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      location.pathname === item.href
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center rounded-md px-2 py-2 text-base font-medium'
                    )}
                  >
                    <item.icon
                      className={cn(
                        location.pathname === item.href ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                        'mr-4 h-6 w-6 shrink-0'
                      )}
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{profile?.full_name}</p>
                  <p className="text-xs font-medium text-gray-500">{profile?.profiles?.name}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="mt-4 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                <LogOut className="h-5 w-5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex shrink-0 items-center px-4 font-bold text-2xl text-indigo-600">
              KIVON
            </div>
            <nav className="mt-8 flex-1 space-y-1 bg-white px-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    location.pathname === item.href
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center rounded-md px-2 py-2 text-sm font-medium'
                  )}
                >
                  <item.icon
                    className={cn(
                      location.pathname === item.href ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 h-5 w-5 shrink-0'
                    )}
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{profile?.full_name}</p>
                <p className="text-xs font-medium text-gray-500">{profile?.profiles?.name}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="mt-4 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <LogOut className="h-5 w-5 text-gray-400" />
              Sair
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:pl-64">
        <div className="sticky top-0 z-10 bg-white pl-1 pt-1 sm:pl-3 sm:pt-3 lg:hidden shadow-sm">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
