'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Download, 
  Filter, 
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Search,
  Check
} from 'lucide-react';
import { firebaseService } from '@/lib/firebaseService';
import { Procedure } from '@/lib/types';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState('Este Mês');
  const [isExporting, setIsExporting] = useState(false);
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    async function loadProcedures() {
      try {
        setLoading(true);
        const data = await firebaseService.getProcedures();
        setProcedures(data);
      } catch (err) {
        console.error('Failed to load procedures for reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProcedures();
  }, []);

  const periods = [
    'Hoje',
    'Ontem',
    'Esta Semana',
    'Mês Passado',
    'Este Mês',
    'Este Ano',
    'Personalizado'
  ];

  // Stats calculation
  const totalValue = procedures.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
  const averageValue = procedures.length > 0 ? totalValue / procedures.length : 0;
  
  const modalityStats = procedures.reduce((acc: any, curr) => {
    acc[curr.modality] = (acc[curr.modality] || 0) + 1;
    return acc;
  }, {});

  const modalityValues = procedures.reduce((acc: any, curr) => {
    acc[curr.modality] = (acc[curr.modality] || 0) + (parseFloat(curr.price) || 0);
    return acc;
  }, {});

  const sortedModalities = Object.keys(modalityValues).sort((a, b) => modalityValues[b] - modalityValues[a]);

  const exportToPDF = () => {
    if (procedures.length === 0) return;
    setIsExporting(true);
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.text('Relatório de Procedimentos - ATAgenda', 15, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 15, 28);
    const periodText = reportPeriod === 'Personalizado' 
      ? `Período: ${new Date(customStartDate).toLocaleDateString('pt-BR')} até ${new Date(customEndDate).toLocaleDateString('pt-BR')}`
      : `Período: ${reportPeriod}`;
    doc.text(periodText, 15, 33);

    // Summary Cards
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text('Resumo Executivo', 15, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total de Procedimentos Cadastrados', procedures.length.toString()],
        ['Ticket Médio dos Procedimentos', `R$ ${averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Valor Total Simulado', `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    });

    // Details Table
    doc.text('Detalhamento por Procedimento', 15, (doc as any).lastAutoTable.finalY + 15);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Procedimento', 'Modalidade', 'Valor sugerido']],
      body: procedures.map(p => [
        p.name,
        p.modality,
        `R$ ${parseFloat(p.price || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], textColor: 255 },
      columnStyles: {
        2: { halign: 'right' }
      }
    });

    doc.save(`relatorio_procedimentos_${new Date().getTime()}.pdf`);
    setIsExporting(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500">Carregando relatórios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Relatórios & Dashboards</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium font-sans">Análise de desempenho e valores de procedimentos.</p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="relative">
              <button 
                onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all min-w-[140px] justify-between group"
              >
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <span>{reportPeriod}</span>
                </div>
                <ChevronDown size={14} className={cn("transition-transform duration-300", isPeriodDropdownOpen ? "rotate-180" : "")} />
              </button>

              {isPeriodDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsPeriodDropdownOpen(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200 dark:shadow-none/50 p-2 z-20 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    {periods.map((period) => (
                      <button
                        key={period}
                        onClick={() => {
                          setReportPeriod(period);
                          setIsPeriodDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 rounded-xl text-sm transition-all flex items-center justify-between group",
                          reportPeriod === period 
                            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold" 
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                        )}
                      >
                        {period}
                        {reportPeriod === period && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <button 
              onClick={exportToPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Download size={18} /> 
              {isExporting ? 'Exportando...' : 'Exportar PDF'}
            </button>
          </div>

          {reportPeriod === 'Personalizado' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1">Início</label>
                <input 
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                />
              </div>
              <div className="h-px w-3 bg-slate-200 mt-5" />
              <div className="flex flex-col">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1">Fim</label>
                <input 
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {procedures.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-20 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 text-center shadow-sm">
          <Activity size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhum dado disponível</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Cadastre procedimentos para visualizar os relatórios.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Ticket Médio Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                <DollarSign size={80} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <DollarSign size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ticket Médio</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    R$ {averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 dark:text-emerald-400">
                <TrendingUp size={14} />
                <span>Estatística baseada em {procedures.length} tipos</span>
              </div>
            </div>

            {/* Total Geral Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                <Activity size={80} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Valor Potencial</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 dark:text-emerald-400">
                <TrendingUp size={14} />
                <span>Soma de todos os valores sugeridos</span>
              </div>
            </div>

            {/* Modalidades Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                <FileText size={80} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <FileText size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Modalidades</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {Object.keys(modalityStats).length} Tipos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 font-sans">
                <span>Variedade de exames cadastrados</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Chart Card - Distribuição por Modalidade */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 sm:p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/10 dark:bg-slate-900/10">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Distribuição por Modalidade</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Participação no faturamento potencial</p>
                </div>
                <BarChart3 className="text-indigo-200 dark:text-indigo-900/50" size={24} />
              </div>
              
              <div className="p-6 sm:p-8 space-y-6 flex-1">
                {sortedModalities.map((mod) => {
                  const percentage = totalValue > 0 ? (modalityValues[mod] / totalValue) * 100 : 0;
                  return (
                    <div key={mod} className="space-y-2 group">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{mod}</span>
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100">R$ {modalityValues[mod].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="h-3 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-700 p-0.5">
                        <div 
                          className="h-full bg-indigo-500 dark:bg-indigo-600 rounded-full relative group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 transition-all duration-1000 ease-out"
                          style={{ width: `${percentage}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 dark:bg-black/10 animate-pulse" />
                        </div>
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 text-right uppercase tracking-tighter">
                        {percentage.toFixed(1)}% do total
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Procedures Card - Top 5 Procedimentos (Valor) */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 sm:p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-900/10">
                <h3 className="font-bold text-slate-900 dark:text-white">Top 5 Procedimentos (Valor)</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Procedimentos com maior valor sugerido</p>
              </div>
              
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {[...procedures].sort((a,b) => (parseFloat(b.price || '0') - parseFloat(a.price || '0'))).slice(0, 5).map((proc, index) => (
                  <div key={proc.id} className="p-4 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-400 dark:text-slate-600 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{proc.name}</p>
                      <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-widest">{proc.modality}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 dark:text-white">R$ {parseFloat(proc.price || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-6 mt-auto bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-50 dark:border-slate-800 text-center">
                <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline">Análise estatística completa</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
