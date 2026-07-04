import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/shared/lib/supabase';
import { Button } from '@/src/shared/components/ui/Button';
import { Input } from '@/src/shared/components/ui/Input';
import { Loader2, Download, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ConsolidatedRecord {
  key: string;
  presence_date: string;
  project_name: string;
  employee_name: string;
  employee_id: string;
  diarias: number;
  value: number;
  status: string;
}

export default function ReportsPage() {
  const [data, setData] = useState<ConsolidatedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Totals
  const [totals, setTotals] = useState({
    diarias: 0,
    reais: 0,
    employees: 0,
    faltas: 0,
    atestados: 0,
    ferias: 0,
    folgas: 0
  });

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
        status,
        employee_id,
        project_id,
        employees (id, full_name, document_number, job_roles(name, daily_rate)),
        projects (id, name, code)
      `)
      .gte('presence_date', startDate)
      .lte('presence_date', endDate)
      .eq('active', true)
      .order('presence_date', { ascending: false });

    if (projectId) query = query.eq('project_id', projectId);
    if (employeeId) query = query.eq('employee_id', employeeId);

    const { data: result, error } = await query;

    if (!error && result) {
      // Consolidate data
      const groups = new Map<string, any>();
      
      let tDiarias = 0;
      let tReais = 0;
      let tFaltas = 0;
      let tAtestados = 0;
      let tFerias = 0;
      let tFolgas = 0;
      const uniqueEmployees = new Set<string>();

      result.forEach((row: any) => {
        const key = `${row.presence_date}_${row.employee_id}_${row.project_id}`;
        if (!groups.has(key)) {
          groups.set(key, {
            key,
            presence_date: row.presence_date,
            project_name: row.projects?.name || '',
            employee_name: row.employees?.full_name || '',
            employee_id: row.employee_id,
            base_rate: row.employees?.job_roles?.daily_rate || 0,
            records: []
          });
        }
        groups.get(key).records.push(row);
      });

      const consolidated: ConsolidatedRecord[] = Array.from(groups.values()).map(g => {
        let countPresente = 0;
        const statuses = new Set<string>();

        g.records.forEach((r: any) => {
          statuses.add(r.status);
          uniqueEmployees.add(g.employee_id);
          
          if (r.status === 'PRESENTE') { countPresente++; tDiarias += 0.5; }
          if (r.status === 'FALTOU') tFaltas += 0.5;
          if (r.status === 'ATESTADO') tAtestados += 0.5;
          if (r.status === 'FÉRIAS') tFerias += 0.5;
          if (r.status === 'FOLGA') tFolgas += 0.5;
        });

        const diarias = countPresente * 0.5;
        const value = diarias * g.base_rate;
        tReais += value;
        
        let finalStatus = Array.from(statuses).join(' / ');
        if (countPresente > 0 && countPresente === g.records.length) {
          finalStatus = 'PRESENTE';
        }

        return {
          key: g.key,
          presence_date: g.presence_date,
          project_name: g.project_name,
          employee_name: g.employee_name,
          employee_id: g.employee_id,
          diarias,
          value,
          status: finalStatus
        };
      });

      // Sort consolidated
      consolidated.sort((a, b) => new Date(b.presence_date).getTime() - new Date(a.presence_date).getTime() || a.employee_name.localeCompare(b.employee_name));

      setData(consolidated);
      setTotals({
        diarias: tDiarias,
        reais: tReais,
        employees: uniqueEmployees.size,
        faltas: tFaltas,
        attestados: tAtestados,
        ferias: tFerias,
        folgas: tFolgas
      });
    }

    setLoading(false);
  }

  function exportCSV() {
    if (data.length === 0) return;
    
    const headers = ['Data', 'Funcionário', 'Obra', 'Diárias', 'Valor (R$)', 'Status'];
    const rows = data.map(row => [
      format(parseISO(row.presence_date), 'dd/MM/yyyy'),
      `"${row.employee_name}"`,
      `"${row.project_name}"`,
      row.diarias.toString().replace('.', ','),
      row.value.toFixed(2).replace('.', ','),
      row.status
    ]);
    
    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(["\uFEFF"+csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_diarias_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportExcel() {
    if (data.length === 0) return;
    const wsData = [
      ['Data', 'Funcionário', 'Obra', 'Diárias', 'Valor (R$)', 'Status'],
      ...data.map(row => [
        format(parseISO(row.presence_date), 'dd/MM/yyyy'),
        row.employee_name,
        row.project_name,
        row.diarias,
        row.value,
        row.status
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Diárias");
    XLSX.writeFile(wb, `relatorio_diarias_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  }

  function exportPDF() {
    if (data.length === 0) return;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Relatório de Diárias KIVON', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Período: ${format(parseISO(startDate), 'dd/MM/yyyy')} a ${format(parseISO(endDate), 'dd/MM/yyyy')}`, 14, 28);
    
    const tableData = data.map(row => [
      format(parseISO(row.presence_date), 'dd/MM/yyyy'),
      row.employee_name,
      row.project_name,
      row.diarias.toString().replace('.', ','),
      `R$ ${row.value.toFixed(2).replace('.', ',')}`,
      row.status
    ]);

    (doc as any).autoTable({
      startY: 35,
      head: [['Data', 'Funcionário', 'Obra', 'Diárias', 'Valor', 'Status']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 35;
    
    doc.setFontSize(10);
    doc.text(`Resumo:`, 14, finalY + 10);
    doc.text(`Total de Diárias: ${totals.diarias}`, 14, finalY + 16);
    doc.text(`Total em Reais: R$ ${totals.reais.toFixed(2).replace('.', ',')}`, 14, finalY + 22);

    doc.save(`relatorio_diarias_${format(new Date(), 'yyyyMMdd')}.pdf`);
  }

  function getStatusBadgeClass(status: string) {
    if (status.includes('PRESENTE')) return 'bg-green-50 text-green-700 ring-green-600/20';
    if (status.includes('FALTOU')) return 'bg-red-50 text-red-700 ring-red-600/20';
    if (status.includes('ATESTADO')) return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
    if (status.includes('FÉRIAS')) return 'bg-blue-50 text-blue-800 ring-blue-600/20';
    if (status.includes('FOLGA')) return 'bg-purple-50 text-purple-800 ring-purple-600/20';
    return 'bg-gray-50 text-gray-600 ring-gray-500/10';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Relatório de Diárias</h1>
        <p className="mt-1 text-sm text-gray-500">
          Acompanhamento consolidado de diárias e valores por obra ou funcionário.
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
        
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Button onClick={generateReport} isLoading={loading}>Gerar Relatório</Button>
          <Button variant="secondary" onClick={exportCSV} disabled={data.length === 0 || loading}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button variant="secondary" onClick={exportExcel} disabled={data.length === 0 || loading}>
            <Download className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="secondary" onClick={exportPDF} disabled={data.length === 0 || loading}>
            <FileText className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {data.length > 0 && (
        <div className="space-y-6">
          {/* Totals cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-lg bg-indigo-50 p-4 border border-indigo-100">
              <div className="text-sm font-medium text-indigo-800">Total de Diárias</div>
              <div className="mt-1 text-2xl font-bold text-indigo-900">{totals.diarias.toString().replace('.', ',')}</div>
            </div>
            <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-100">
              <div className="text-sm font-medium text-emerald-800">Valor Total</div>
              <div className="mt-1 text-2xl font-bold text-emerald-900">R$ {totals.reais.toFixed(2).replace('.', ',')}</div>
            </div>
            <div className="rounded-lg bg-white p-4 border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500">Funcionários</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{totals.employees}</div>
            </div>
            <div className="rounded-lg bg-red-50 p-4 border border-red-100">
              <div className="text-sm font-medium text-red-800">Faltas</div>
              <div className="mt-1 text-2xl font-bold text-red-900">{totals.faltas.toString().replace('.', ',')}</div>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-100">
              <div className="text-sm font-medium text-yellow-800">Atestados</div>
              <div className="mt-1 text-2xl font-bold text-yellow-900">{totals.atestados.toString().replace('.', ',')}</div>
            </div>
            <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
              <div className="text-sm font-medium text-blue-800">Férias/Folgas</div>
              <div className="mt-1 text-2xl font-bold text-blue-900">{(totals.ferias + totals.folgas).toString().replace('.', ',')}</div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Funcionário</th>
                  <th className="px-6 py-3">Obra</th>
                  <th className="px-6 py-3 text-right">Diárias</th>
                  <th className="px-6 py-3 text-right">Valor</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.key} className="border-b bg-white hover:bg-gray-50">
                    <td className="px-6 py-4">{format(parseISO(row.presence_date), 'dd/MM/yyyy')}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{row.employee_name}</td>
                    <td className="px-6 py-4">{row.project_name}</td>
                    <td className="px-6 py-4 text-right">{row.diarias.toString().replace('.', ',')}</td>
                    <td className="px-6 py-4 text-right">R$ {row.value.toFixed(2).replace('.', ',')}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
