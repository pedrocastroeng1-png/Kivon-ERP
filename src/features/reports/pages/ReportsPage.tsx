import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/shared/lib/supabase';
import { Button } from '@/src/shared/components/ui/Button';
import { Input } from '@/src/shared/components/ui/Input';
import { Loader2, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface PresenceReport {
  id: string;
  presence_date: string;
  shift: string;
  employees: {
    full_name: string;
    document_number: string;
  };
  projects: {
    name: string;
    code: string;
  };
}

export default function ReportsPage() {
  const [data, setData] = useState<PresenceReport[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [startDate, setStartDate] = useState(format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [projectId, setProjectId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetchFilters();
  }, []);

  async function fetchFilters() {
    const [pRes, eRes] = await Promise.all([
      supabase.from('projects').select('id, name').order('name'),
      supabase.from('employees').select('id, full_name').order('full_name')
    ]);
    if (pRes.data) setProjects(pRes.data);
    if (eRes.data) setEmployees(eRes.data);
  }

  async function generateReport() {
    setLoading(true);
    let query = supabase
      .from('presence')
      .select(`
        id,
        presence_date,
        shift,
        employees (full_name, document_number),
        projects (name, code)
      `)
      .gte('presence_date', startDate)
      .lte('presence_date', endDate)
      .eq('active', true)
      .order('presence_date', { ascending: false });

    if (projectId) query = query.eq('project_id', projectId);
    if (employeeId) query = query.eq('employee_id', employeeId);

    const { data: result, error } = await query;
    if (!error && result) {
      setData(result as any);
    }
    setLoading(false);
  }

  function exportCSV() {
    if (data.length === 0) return;
    
    const headers = ['Data', 'Turno', 'Obra', 'Funcionário', 'Documento'];
    const rows = data.map(row => [
      format(parseISO(row.presence_date), 'dd/MM/yyyy'),
      row.shift.toUpperCase(),
      `"${row.projects?.name || ''}"`,
      `"${row.employees?.full_name || ''}"`,
      row.employees?.document_number || ''
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_presenca_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Relatórios</h1>
        <p className="mt-1 text-sm text-gray-500">
          Emissão de relatórios de presença, por obra ou por funcionário.
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input 
            label="Data Inicial" 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
          />
          <Input 
            label="Data Final" 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Obra</label>
            <select
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Todas as Obras</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Funcionário</label>
            <select
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">Todos os Funcionários</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-2">
          <Button onClick={generateReport} isLoading={loading}>Gerar Relatório</Button>
          <Button variant="secondary" onClick={exportCSV} disabled={data.length === 0 || loading}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      {data.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Obra</th>
                <th className="px-6 py-3">Funcionário</th>
                <th className="px-6 py-3">Turno</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b bg-white hover:bg-gray-50">
                  <td className="px-6 py-4">{format(parseISO(row.presence_date), 'dd/MM/yyyy')}</td>
                  <td className="px-6 py-4">{row.projects?.name}</td>
                  <td className="px-6 py-4">{row.employees?.full_name}</td>
                  <td className="px-6 py-4 uppercase">{row.shift}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
