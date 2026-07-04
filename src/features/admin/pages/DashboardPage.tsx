import { useAuth } from '@/src/app/providers/AuthProvider';

export default function DashboardPage() {
  const { profile } = useAuth();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Bem-vindo ao KIVON ERP, {profile?.full_name || 'Usuário'}.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder cards */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <dt className="truncate text-sm font-medium text-gray-500">Obras Ativas</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">-</dd>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <dt className="truncate text-sm font-medium text-gray-500">Funcionários Ativos</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">-</dd>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-5">
            <dt className="truncate text-sm font-medium text-gray-500">Presenças Hoje</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">-</dd>
          </div>
        </div>
      </div>
    </div>
  );
}
