'use client';

import React, { useState } from 'react';
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
import { mockProcedures } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const [reportPeriod, setReportPeriod] = useState('Este Mês');
  const [isExporting, setIsExporting] = useState(false);
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

  const periods = [
    'Hoje',
    'Ontem',
    'Esta Semana',
    'Mês Passado',
    'Este Mês',
    'Este Ano',
    'Personalizado'
  ];

  // Stats calculation (mocking some data for the charts)
  const totalValue = mockProcedures.reduce((acc, curr) => acc + parseFloat(curr.price), 0);
  const averageValue = totalValue / mockProcedures.length;
  
  const modalityStats = mockProcedures.reduce((acc: any, curr) => {
    acc[curr.modality] = (acc[curr.modality] || 0) + 1;
    return acc;
  }, {});

  const modalityValues = mockProcedures.reduce((acc: any, curr) => {
    acc[curr.modality] = (acc[curr.modality] || 0) + parseFloat(curr.price);
    return acc;
  }, {});

  const sortedModalities = Object.keys(modalityValues).sort((a, b) => modalityValues[b] - modalityValues[a]);

  const exportToPDF = () => {
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
        ['Total de Procedimentos Cadastrados', mockProcedures.length.toString()],
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
      body: mockProcedures.map(p => [
        p.name,
        p.modality,
        `R$ ${parseFloat(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatórios & Dashboards</h1>
          <p className="text-slate-500 font-medium">Análise de desempenho e valores de procedimentos.</p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="relative">
              <button 
                onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all min-w-[140px] justify-between group"
              >
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-600" />
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
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200 dark:shadow-none/50 p-2 z-20 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
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
                            ? "bg-indigo-50 text-indigo-700 font-bold" 
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        {period}
                        {reportPeriod === period && <Check size={14} className="text-indigo-600" />}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
            <DollarSign size={80} className="text-indigo-600" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ticket Médio</p>
              <p className="text-2xl font-black text-slate-900">
                R$ {averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500">
            <TrendingUp size={14} />
            <span>+12.5% em relação ao mês anterior</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
            <Activity size={80} className="text-emerald-600" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Geral</p>
              <p className="text-2xl font-black text-slate-900">
                R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500">
            <TrendingUp size={14} />
            <span>Baseado em {mockProcedures.length} procedimentos</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
            <FileText size={80} className="text-amber-600" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modalidades</p>
              <p className="text-2xl font-black text-slate-900">
                {Object.keys(modalityStats).length} Tipos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
            <span>Variedade de exames cadastrados</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:p-8">
        {/* Main Chart Card */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 sm:p-8 border-b border-slate-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900">Distribuição por Modalidade</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Participação no faturamento simulado</p>
            </div>
            <BarChart3 className="text-indigo-200" size={24} />
          </div>
          
          <div className="p-6 sm:p-8 space-y-6 flex-1">
            {sortedModalities.map((mod) => {
              const percentage = (modalityValues[mod] / totalValue) * 100;
              return (
                <div key={mod} className="space-y-2 group">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">{mod}</span>
                    <span className="text-sm font-black text-slate-900">R$ {modalityValues[mod].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                    <div 
                      className="h-full bg-indigo-500 rounded-full relative group-hover:bg-indigo-600 transition-all duration-1000 ease-out"
                      style={{ width: `${percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 text-right uppercase tracking-tighter">
                    {percentage.toFixed(1)}% do total
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Procedures Card */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 sm:p-8 border-b border-slate-50">
            <h3 className="font-bold text-slate-900">Top 5 Procedimentos (Valor)</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Procedimentos com maior valor sugerido</p>
          </div>
          
          <div className="divide-y divide-slate-50">
            {[...mockProcedures].sort((a,b) => parseFloat(b.price) - parseFloat(a.price)).slice(0, 5).map((proc, index) => (
              <div key={proc.id} className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors group">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700">{proc.name}</p>
                  <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">{proc.modality}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">R$ {parseFloat(proc.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-6 mt-auto bg-slate-50/30 border-t border-slate-50 text-center">
            <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline">Ver todos os procedimentos</button>
          </div>
        </div>
      </div>
    </div>
  );
}
