import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/shared/lib/supabase';
import { 
  Users, 
  HardHat, 
  CalendarCheck, 
  Briefcase,
  DollarSign
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    activeEmployees: 0,
    activeProjects: 0,
    presenceToday: 0,
    presenceMonth: 0,
    diariasHoje: 0,
    diariasMes: 0
  });
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const startOfMonth = format(new Date(new Date().setDate(1)), 'yyyy-MM-dd');

    // Counts
    const { count: empCount } = await supabase.from('employees').select('*', { count: 'exact', head: true }).eq('active', true);
    const { count: projCount } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('active', true);
    
    // Fetch presences to calculate total values
    const { data: presences } = await supabase
      .from('presence')
      .select('presence_date, status, shift, employees(job_roles(daily_rate))')
      .gte('presence_date', startOfMonth)
      .eq('active', true);

    let pTodayCount = 0;
    let pMonthCount = 0;
    let valHoje = 0;
    let valMes = 0;

    if (presences) {
      presences.forEach((p: any) => {
        if (p.status === 'PRESENTE') {
          pMonthCount++;
          const rate = p.employees?.job_roles?.daily_rate || 0;
          valMes += (rate * 0.5);

          if (p.presence_date === today) {
            pTodayCount++;
            valHoje += (rate * 0.5);
          }
        }
      });
    }

    setStats({
      activeEmployees: empCount || 0,
      activeProjects: projCount || 0,
      presenceToday: pTodayCount,
      presenceMonth: pMonthCount,
      diariasHoje: valHoje,
      diariasMes: valMes
    });

    // Chart Data (Last 7 days presence)
    if (presences) {
      const agg: Record<string, { manha: number, tarde: number }> = {};
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        agg[dateStr] = { manha: 0, tarde: 0 };
      }

      presences.forEach((p: any) => {
        if (agg[p.presence_date] && p.status === 'PRESENTE') {
          if (p.shift === 'manha') agg[p.presence_date].manha += 0.5;
          if (p.shift === 'tarde') agg[p.presence_date].tarde += 0.5;
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-lg"></div>)}
          </div>
          <div className="h-96 bg-slate-200 rounded-lg"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            
            <div className="overflow-hidden rounded-lg bg-emerald-50 border border-emerald-100 shadow-sm">
              <div className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-xs font-medium text-emerald-800">Diárias Hoje</dt>
                      <dd className="mt-1 text-xl font-bold text-emerald-900">R$ {stats.diariasHoje.toFixed(2).replace('.', ',')}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg bg-blue-50 border border-blue-100 shadow-sm">
              <div className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-xs font-medium text-blue-800">Diárias no Mês</dt>
                      <dd className="mt-1 text-xl font-bold text-blue-900">R$ {stats.diariasMes.toFixed(2).replace('.', ',')}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CalendarCheck className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-xs font-medium text-slate-500">Presenças Hoje</dt>
                      <dd className="mt-1 text-xl font-bold text-slate-900">{stats.presenceToday}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Briefcase className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-xs font-medium text-slate-500">Presenças Mês</dt>
                      <dd className="mt-1 text-xl font-bold text-slate-900">{stats.presenceMonth}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-xs font-medium text-slate-500">Funcionários</dt>
                      <dd className="mt-1 text-xl font-bold text-slate-900">{stats.activeEmployees}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <HardHat className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-xs font-medium text-slate-500">Obras</dt>
                      <dd className="mt-1 text-xl font-bold text-slate-900">{stats.activeProjects}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="overflow-hidden rounded-lg bg-white border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 bg-white px-5 py-4">
              <h3 className="text-base font-semibold leading-6 text-slate-900">
                Evolução de Diárias (Últimos 7 Dias)
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
                    <Bar dataKey="Manhã" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} stackId="a" />
                    <Bar dataKey="Tarde" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} stackId="a" />
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
