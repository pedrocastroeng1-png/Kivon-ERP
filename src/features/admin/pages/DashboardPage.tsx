import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/shared/lib/supabase';
import { 
  Users, 
  HardHat, 
  CalendarCheck, 
  Briefcase,
  DollarSign,
  Activity
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-kivon-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Visão Geral</h1>
          <p className="mt-2 text-sm text-kivon-text-sec">
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
            
            <div className="overflow-hidden rounded-xl bg-gradient-to-br from-kivon-card to-[#1a1a1a] border border-kivon-primary/30 shadow-lg shadow-kivon-primary/10 transition-transform hover:-translate-y-1 duration-300">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-kivon-primary/20 p-2 rounded-lg">
                    <DollarSign className="h-5 w-5 text-kivon-primary" />
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-xs font-semibold text-kivon-primary uppercase tracking-wider">Diárias Hoje</dt>
                      <dd className="mt-1 text-2xl font-bold text-white tracking-tight">R$ {stats.diariasHoje.toFixed(2).replace('.', ',')}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl bg-gradient-to-br from-kivon-card to-[#1a1a1a] border border-kivon-border shadow-lg transition-transform hover:-translate-y-1 duration-300">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                    <DollarSign className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-xs font-semibold text-kivon-text-sec uppercase tracking-wider">Diárias no Mês</dt>
                      <dd className="mt-1 text-2xl font-bold text-white tracking-tight">R$ {stats.diariasMes.toFixed(2).replace('.', ',')}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl bg-kivon-card border border-kivon-border shadow-lg transition-transform hover:-translate-y-1 duration-300">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                    <CalendarCheck className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-xs font-semibold text-kivon-text-sec uppercase tracking-wider">Presenças Hoje</dt>
                      <dd className="mt-1 text-2xl font-bold text-white tracking-tight">{stats.presenceToday}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl bg-kivon-card border border-kivon-border shadow-lg transition-transform hover:-translate-y-1 duration-300">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-500/10 p-2 rounded-lg border border-purple-500/20">
                    <Briefcase className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-xs font-semibold text-kivon-text-sec uppercase tracking-wider">Presenças Mês</dt>
                      <dd className="mt-1 text-2xl font-bold text-white tracking-tight">{stats.presenceMonth}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl bg-kivon-card border border-kivon-border shadow-lg transition-transform hover:-translate-y-1 duration-300">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                    <Users className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-xs font-semibold text-kivon-text-sec uppercase tracking-wider">Funcionários</dt>
                      <dd className="mt-1 text-2xl font-bold text-white tracking-tight">{stats.activeEmployees}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl bg-kivon-card border border-kivon-border shadow-lg transition-transform hover:-translate-y-1 duration-300">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    <HardHat className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="truncate text-xs font-semibold text-kivon-text-sec uppercase tracking-wider">Obras</dt>
                      <dd className="mt-1 text-2xl font-bold text-white tracking-tight">{stats.activeProjects}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="overflow-hidden rounded-xl bg-kivon-card border border-kivon-border shadow-xl">
            <div className="border-b border-kivon-border bg-kivon-bg/50 px-6 py-5 flex items-center justify-between">
              <h3 className="text-base font-semibold leading-6 text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-kivon-primary" />
                Evolução de Diárias (Últimos 7 Dias)
              </h3>
            </div>
            <div className="p-6">
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#B3B3B3', fontSize: 12 }} 
                      dy={10} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#B3B3B3', fontSize: 12 }} 
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#151515', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="Manhã" fill="#D4AF37" radius={[4, 4, 0, 0]} maxBarSize={40} stackId="a" />
                    <Bar dataKey="Tarde" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} stackId="a" />
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
