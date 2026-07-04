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
        
        let finalStatus = '';
        const morning = g.records.find((r: any) => r.shift === 'manha');
        const afternoon = g.records.find((r: any) => r.shift === 'tarde');

        if (morning && afternoon) {
          if (morning.status === afternoon.status) {
            finalStatus = `${morning.status} (Manhã e Tarde)`;
          } else {
            finalStatus = `${morning.status} (Manhã) / ${afternoon.status} (Tarde)`;
          }
        } else if (morning) {
          finalStatus = `${morning.status} (Manhã)`;
        } else if (afternoon) {
          finalStatus = `${afternoon.status} (Tarde)`;
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
    if (status.includes('PRESENTE')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (status.includes('FALTOU')) return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (status.includes('ATESTADO')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (status.includes('FÉRIAS')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (status.includes('FOLGA')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    return 'bg-kivon-bg text-kivon-text-sec border-kivon-border';
  }

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-kivon-border">
        <h1 className="text-3xl font-bold tracking-tight text-white">Relatório de Diárias</h1>
        <p className="mt-2 text-sm text-kivon-text-sec">
          Acompanhamento consolidado de diárias e valores por obra ou funcionário.
        </p>
      </div>

      <div className="rounded-xl bg-kivon-card border border-kivon-border shadow-xl p-6 space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input 
            label="Data Inicial" 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            className="bg-kivon-bg border-kivon-border text-white" style={{ colorScheme: 'dark' }}
          />
          <Input 
            label="Data Final" 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            className="bg-kivon-bg border-kivon-border text-white" style={{ colorScheme: 'dark' }}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-kivon-text-sec">Obra</label>
            <select
              className="flex h-10 w-full rounded-lg border border-kivon-border bg-kivon-bg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-kivon-primary focus:border-kivon-primary transition-all"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Todas as Obras</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-kivon-text-sec">Funcionário</label>
            <select
              className="flex h-10 w-full rounded-lg border border-kivon-border bg-kivon-bg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-kivon-primary focus:border-kivon-primary transition-all"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">Todos os Funcionários</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-kivon-border">
          <Button onClick={generateReport} isLoading={loading} className="bg-kivon-primary hover:bg-kivon-primary-hover text-black shadow-lg shadow-kivon-primary/20">Gerar Relatório</Button>
          <Button variant="secondary" onClick={exportCSV} disabled={data.length === 0 || loading} className="bg-transparent border border-kivon-border text-white hover:bg-kivon-hover">
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button variant="secondary" onClick={exportExcel} disabled={data.length === 0 || loading} className="bg-transparent border border-kivon-border text-white hover:bg-kivon-hover">
            <Download className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="secondary" onClick={exportPDF} disabled={data.length === 0 || loading} className="bg-transparent border border-kivon-border text-white hover:bg-kivon-hover">
            <FileText className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {data.length > 0 && (
        <div className="space-y-6">
          {/* Totals cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl bg-indigo-500/10 p-4 border border-indigo-500/20 shadow-lg relative overflow-hidden">
              <div className="text-sm font-medium text-indigo-400 relative z-10">Total de Diárias</div>
              <div className="mt-2 text-2xl font-bold text-indigo-400 relative z-10">{totals.diarias.toString().replace('.', ',')}</div>
            </div>
            <div className="rounded-xl bg-kivon-primary/10 p-4 border border-kivon-primary/20 shadow-lg relative overflow-hidden">
              <div className="text-sm font-medium text-kivon-primary relative z-10">Valor Total</div>
              <div className="mt-2 text-2xl font-bold text-kivon-primary relative z-10">R$ {totals.reais.toFixed(2).replace('.', ',')}</div>
            </div>
            <div className="rounded-xl bg-kivon-card p-4 border border-kivon-border shadow-lg">
              <div className="text-sm font-medium text-kivon-text-sec">Funcionários</div>
              <div className="mt-2 text-2xl font-bold text-white">{totals.employees}</div>
            </div>
            <div className="rounded-xl bg-red-500/10 p-4 border border-red-500/20 shadow-lg relative overflow-hidden">
              <div className="text-sm font-medium text-red-400 relative z-10">Faltas</div>
              <div className="mt-2 text-2xl font-bold text-red-400 relative z-10">{totals.faltas.toString().replace('.', ',')}</div>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-4 border border-amber-500/20 shadow-lg relative overflow-hidden">
              <div className="text-sm font-medium text-amber-400 relative z-10">Atestados</div>
              <div className="mt-2 text-2xl font-bold text-amber-400 relative z-10">{totals.atestados.toString().replace('.', ',')}</div>
            </div>
            <div className="rounded-xl bg-blue-500/10 p-4 border border-blue-500/20 shadow-lg relative overflow-hidden">
              <div className="text-sm font-medium text-blue-400 relative z-10">Férias/Folgas</div>
              <div className="mt-2 text-2xl font-bold text-blue-400 relative z-10">{(totals.ferias + totals.folgas).toString().replace('.', ',')}</div>
            </div>
          </div>

          <div className="rounded-xl bg-kivon-card border border-kivon-border shadow-xl overflow-x-auto">
            <table className="w-full text-left text-sm text-kivon-text-sec">
              <thead className="bg-kivon-bg/80 text-xs uppercase text-kivon-text-sec">
                <tr>
                  <th className="px-6 py-4 font-semibold">Data</th>
                  <th className="px-6 py-4 font-semibold">Funcionário</th>
                  <th className="px-6 py-4 font-semibold">Obra</th>
                  <th className="px-6 py-4 font-semibold text-right">Diárias</th>
                  <th className="px-6 py-4 font-semibold text-right">Valor</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kivon-border">
                {data.map((row) => (
                  <tr key={row.key} className="bg-kivon-card hover:bg-kivon-hover transition-colors">
                    <td className="px-6 py-4">{format(parseISO(row.presence_date), 'dd/MM/yyyy')}</td>
                    <td className="px-6 py-4 font-medium text-white">{row.employee_name}</td>
                    <td className="px-6 py-4">{row.project_name}</td>
                    <td className="px-6 py-4 text-right">{row.diarias.toString().replace('.', ',')}</td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-400">R$ {row.value.toFixed(2).replace('.', ',')}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${getStatusBadgeClass(row.status)}`}>
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
