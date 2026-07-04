import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/shared/lib/supabase';
import { useAuth } from '@/src/app/providers/AuthProvider';
import { Users, HardHat, Briefcase, CalendarCheck } from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    activeEmployees: 0,
    activeProjects: 0,
    presenceToday: 0,
    presenceMonth: 0,
  });
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    
    // 1. Active Employees
    const { count: empCount } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    // 2. Active Projects
    const { count: projCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    // 3. Presence Today
    const today = format(new Date(), 'yyyy-MM-dd');
    const { count: presenceTodayCount } = await supabase
      .from('presence')
      .select('*', { count: 'exact', head: true })
      .eq('presence_date', today)
      .eq('active', true)
      .eq('status', 'PRESENTE');

    // 4. Presence This Month
    const startOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
    const { count: presenceMonthCount } = await supabase
      .from('presence')
      .select('*', { count: 'exact', head: true })
      .gte('presence_date', startOfMonth)
      .eq('active', true)
      .eq('status', 'PRESENTE');

    setStats({
      activeEmployees: empCount || 0,
      activeProjects: projCount || 0,
      presenceToday: presenceTodayCount || 0,
      presenceMonth: presenceMonthCount || 0,
    });

    // Chart Data (Last 7 days presence)
    const d = new Date();
    d.setDate(d.getDate() - 6);
    const last7Days = format(d, 'yyyy-MM-dd');
    
    const { data: chartPresence } = await supabase
      .from('presence')
      .select('presence_date, shift')
      .gte('presence_date', last7Days)
      .eq('active', true)
      .eq('status', 'PRESENTE');

    if (chartPresence) {
      // Aggregate by date
      const agg: Record<string, { manha: number, tarde: number }> = {};
      
      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        agg[dateStr] = { manha: 0, tarde: 0 };
      }

      chartPresence.forEach(p => {
        if (agg[p.presence_date]) {
          if (p.shift === 'manha') agg[p.presence_date].manha++;
          if (p.shift === 'tarde') agg[p.presence_date].tarde++;
        }
      });

      const formattedChartData = Object.keys(agg).map(date => ({
        name: format(new Date(date), 'dd/MM'),
        Manhã: agg[date].manha,
        Tarde: agg[date].tarde,
      }));

      setChartData(formattedChartData);
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Visão Geral</h1>
          <p className="mt-1 text-sm text-slate-500">
            Métricas e informações em tempo real do sistema.
          </p>
        </div>
      </div>
      
      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-200 rounded-lg"></div>)}
          </div>
          <div className="h-96 bg-slate-200 rounded-lg"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="overflow-hidden rounded-lg bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-indigo-50 border border-indigo-100">
                      <Users className="h-5 w-5 text-indigo-600" />
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-slate-500">Funcionários Ativos</dt>
                      <dd className="mt-1 flex items-baseline">
                        <div className="text-2xl font-bold text-slate-900">{stats.activeEmployees}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-50 border border-slate-200">
                      <HardHat className="h-5 w-5 text-slate-700" />
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-slate-500">Obras Ativas</dt>
                      <dd className="mt-1 flex items-baseline">
                        <div className="text-2xl font-bold text-slate-900">{stats.activeProjects}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 border border-emerald-100">
                      <CalendarCheck className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-slate-500">Presenças Hoje (Turnos)</dt>
                      <dd className="mt-1 flex items-baseline">
                        <div className="text-2xl font-bold text-slate-900">{stats.presenceToday}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 border border-blue-100">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-sm font-medium text-slate-500">Presenças no Mês</dt>
                      <dd className="mt-1 flex items-baseline">
                        <div className="text-2xl font-bold text-slate-900">{stats.presenceMonth}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 bg-white px-5 py-4">
              <h3 className="text-base font-semibold leading-6 text-slate-900">
                Evolução de Presenças (Últimos 7 Dias)
              </h3>
            </div>
            <div className="p-5">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      dy={10} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="Manhã" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Tarde" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
