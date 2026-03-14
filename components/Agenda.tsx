'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileBarChart, ChevronDown, Lock, Printer, Download, Eye, FileText, MoveHorizontal, X } from 'lucide-react';
import { mockDoctors, mockAppointments, mockPatients, mockScheduleBlocks, mockScheduleConfigs } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CustomSelect from './CustomSelect';
import { toast } from 'react-toastify';
import AppointmentStatusModal from './AppointmentStatusModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AgendaProps {
  onNewAppointment?: (date: string, time: string, doctorId: string) => void;
  searchQuery?: string;
}

export const getDaySchedule = (doctorId: string, date: Date) => {
  const config = mockScheduleConfigs.find(c => c.doctorId === doctorId);
  if (!config || !config.schedule) return null;
  const dayOfWeek = date.getDay().toString();
  return config.schedule[dayOfWeek];
};

export const isTimeOverbook = (doctorId: string, date: Date, time: string) => {
  const schedule = getDaySchedule(doctorId, date);
  const config = mockScheduleConfigs.find(c => c.doctorId === doctorId);
  const slotDuration = config?.slotDuration || 15;

  if (!schedule || !schedule.active) return true;
  
  // 1. Outside start/end range
  if (time < schedule.startTime || time >= schedule.endTime) return true;
  
  // 2. During lunch break
  if (time >= schedule.lunchStart && time < schedule.lunchEnd) return true;
  
  // 3. Not on a standard slot (e.g. 08:10 when slots are 15m)
  const [h, m] = time.split(':').map(Number);
  const [sh, sm] = schedule.startTime.split(':').map(Number);
  const diff = (h * 60 + m) - (sh * 60 + sm);
  if (diff % slotDuration !== 0) return true;

  return false;
};

export default function Agenda({ onNewAppointment, searchQuery = '' }: AgendaProps) {
  const [selectedDoctor, setSelectedDoctor] = useState(mockDoctors[0].id);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'dia' | 'semana'>('dia');
  const [blockToRemove, setBlockToRemove] = useState<any>(null);
  const [selectedAppointmentForStatus, setSelectedAppointmentForStatus] = useState<any | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<'dia' | 'semana' | 'personalizado'>('dia');
  const [reportDateRange, setReportDateRange] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const doctorOptions = mockDoctors.map(doc => ({
    id: doc.id,
    name: `Médico: ${doc.name}`
  }));

  const doctorConfig = mockScheduleConfigs.find(c => c.doctorId === selectedDoctor);
  const slotDuration = doctorConfig?.slotDuration || 15;

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 0 }),
    end: addDays(startOfWeek(currentDate, { weekStartsOn: 0 }), 6),
  });

  const relevantDates = viewType === 'dia' ? [currentDate] : weekDays;
  const formattedRelevantDates = relevantDates.map(d => format(d, 'yyyy-MM-dd'));

  let minTime = '23:59';
  let maxTime = '00:00';
  
  if (doctorConfig?.schedule) {
    relevantDates.forEach(date => {
      const dayOfWeek = date.getDay().toString();
      const daySchedule = doctorConfig.schedule[dayOfWeek];
      if (daySchedule?.active) {
        if (daySchedule.startTime < minTime) minTime = daySchedule.startTime;
        if (daySchedule.endTime > maxTime) maxTime = daySchedule.endTime;
      }
    });
  }

  if (minTime === '23:59') minTime = '08:00';
  if (maxTime === '00:00') maxTime = '18:00';

  const startHour = parseInt(minTime.split(':')[0]);
  const endHour = parseInt(maxTime.split(':')[0]);

  const timesSet = new Set<string>();
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += slotDuration) {
      const hourStr = h.toString().padStart(2, '0');
      const minStr = m.toString().padStart(2, '0');
      const timeStr = `${hourStr}:${minStr}`;
      if (timeStr >= minTime && timeStr < maxTime) {
        timesSet.add(timeStr);
      }
    }
  }
  
  mockAppointments.forEach(app => {
    if (app.doctorId === selectedDoctor && formattedRelevantDates.includes(app.date)) {
      timesSet.add(app.time);
    }
  });

  const times = Array.from(timesSet).sort();

  const getAppointment = (date: Date, time: string) => {
    const app = mockAppointments.find(app => 
      app.doctorId === selectedDoctor && 
      app.date === format(date, 'yyyy-MM-dd') && 
      app.time === time
    );

    if (!app) return null;

    // Filter by search query if provided
    if (searchQuery) {
      const patientName = getPatientName(app.patientId).toLowerCase();
      const procedure = app.procedure.toLowerCase();
      const search = searchQuery.toLowerCase();
      if (!patientName.includes(search) && !procedure.includes(search)) {
        return null;
      }
    }

    return app;
  };

  const getPatientName = (id: string) => {
    return mockPatients.find(p => p.id === id)?.name || 'Paciente Desconhecido';
  };

  const getBlock = (date: Date, time: string) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return mockScheduleBlocks.find(block => 
      block.doctorId === selectedDoctor && 
      block.date === formattedDate && 
      time >= block.startTime && 
      time < block.endTime
    );
  };

  const checkIsOverbook = (date: Date, time: string) => {
    return isTimeOverbook(selectedDoctor, date, time);
  };

  const isLunchBreakInternal = (date: Date, time: string) => {
    const schedule = getDaySchedule(selectedDoctor, date);
    if (!schedule || !schedule.active) return false;
    return time >= schedule.lunchStart && time < schedule.lunchEnd;
  };

  const isInactiveDayInternal = (date: Date) => {
    const schedule = getDaySchedule(selectedDoctor, date);
    return !schedule || !schedule.active;
  };

  const getOverbookStatus = (date: Date) => {
    const config = mockScheduleConfigs.find(c => c.doctorId === selectedDoctor);
    if (!config || config.maxOverbooksPerDay === 0) return { allowed: false, max: 0, current: 0 };
    
    const formattedDate = format(date, 'yyyy-MM-dd');
    const dailyAppointments = mockAppointments.filter(app => 
      app.doctorId === selectedDoctor && app.date === formattedDate
    );
    
    let overbookCount = 0;
    dailyAppointments.forEach(app => {
      if (checkIsOverbook(date, app.time)) {
        overbookCount++;
      }
    });
    
    return { 
      allowed: overbookCount < config.maxOverbooksPerDay, 
      max: config.maxOverbooksPerDay, 
      current: overbookCount 
    };
  };

  const handleBlockClick = (block: any) => {
    setBlockToRemove(block);
  };

  const [overbookModalLimit, setOverbookModalLimit] = useState<number | null>(null);

  const confirmRemoveBlock = () => {
    if (!blockToRemove) return;
    const index = mockScheduleBlocks.findIndex(b => b.id === blockToRemove.id);
    if (index > -1) {
      const removedBlock = mockScheduleBlocks.splice(index, 1)[0];
      toast.success(
        <div>
          Bloqueio removido.{' '}
          <button 
            onClick={() => {
              mockScheduleBlocks.push(removedBlock);
              setRefreshKey(k => k + 1);
              toast.info('Bloqueio restaurado.');
            }}
            className="font-bold underline ml-2"
          >
            Desfazer
          </button>
        </div>
      );
      setRefreshKey(k => k + 1);
    }
    setBlockToRemove(null);
  };

  const handleStatusUpdate = (appointmentId: string, newStatus: any) => {
    const appointment = mockAppointments.find(a => a.id === appointmentId);
    if (appointment) {
      appointment.status = newStatus;
      setRefreshKey(k => k + 1);
      setSelectedAppointmentForStatus(null);
      toast.success(`Status do agendamento atualizado para "${newStatus}"`);
    }
  };

  const handleTransfer = (appointmentId: string, newDate: string, newTime: string, newDoctorId: string) => {
    const appointment = mockAppointments.find(a => a.id === appointmentId);
    if (appointment) {
      appointment.date = newDate;
      appointment.time = newTime;
      appointment.doctorId = newDoctorId;
      setRefreshKey(k => k + 1);
      setSelectedAppointmentForStatus(null);
      toast.success('Agendamento transferido com sucesso!', {
        icon: <MoveHorizontal className="text-indigo-600" />
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const doctor = mockDoctors.find(d => d.id === selectedDoctor);
    const periodLabel = reportPeriod === 'dia' ? format(currentDate, 'dd/MM/yyyy') : 
                        reportPeriod === 'semana' ? 'Semanal' : 
                        `${format(parse(reportDateRange.startDate, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')} - ${format(parse(reportDateRange.endDate, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')}`;

    // Header styling
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ATAgenda - Relatório de Atendimentos', 15, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const now = format(new Date(), 'dd/MM/yyyy HH:mm');
    doc.text(`Gerado em: ${now}`, 15, 30);
    doc.text(`Período: ${periodLabel}`, 15, 35);

    // Doctor info
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(12);
    doc.text(`Médico: ${doctor?.name || 'Não selecionado'}`, 15, 50);
    doc.text(`CRM: ${doctor?.crm || '-'}`, 15, 56);

    const filteredApps = mockAppointments
      .filter(app => {
        if (app.doctorId !== selectedDoctor) return false;
        if (reportPeriod === 'dia') return app.date === format(currentDate, 'yyyy-MM-dd');
        if (reportPeriod === 'semana') {
          const start = format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'yyyy-MM-dd');
          const end = format(addDays(startOfWeek(currentDate, { weekStartsOn: 0 }), 6), 'yyyy-MM-dd');
          return app.date >= start && app.date <= end;
        }
        if (reportPeriod === 'personalizado') {
          return app.date >= reportDateRange.startDate && app.date <= reportDateRange.endDate;
        }
        return true;
      })
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

    const tableData = filteredApps.map(app => [
      format(parse(app.date, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy'),
      app.time,
      mockPatients.find(p => p.id === app.patientId)?.name || 'Paciente',
      app.procedure,
      app.status.toUpperCase()
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['Data', 'Hora', 'Paciente', 'Procedimento', 'Status']],
      body: tableData,
      headStyles: { 
        fillColor: [79, 70, 229],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 25 },
        1: { halign: 'center', cellWidth: 20 },
        4: { fontStyle: 'bold' }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });

    doc.save(`relatorio_atendimentos_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    toast.success('Relatório PDF gerado com sucesso!');
  };

  return (
    <div key={refreshKey} className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Filters & Navigation */}
      <div className="p-3 md:p-4 border-b border-slate-200 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <div id="doctor-select">
              <CustomSelect 
                options={doctorOptions}
                value={selectedDoctor}
                onChange={setSelectedDoctor}
                className="w-full sm:w-64"
              />
            </div>

            <div id="view-toggle" className="flex items-center bg-slate-100 rounded-lg p-1 shrink-0">
              <button 
                onClick={() => setViewType('dia')}
                className={cn(
                  "px-3 py-1 text-[10px] md:text-xs font-semibold rounded-md transition-all",
                  viewType === 'dia' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"
                )}
              >
                Dia
              </button>
              <button 
                onClick={() => setViewType('semana')}
                className={cn(
                  "px-3 py-1 text-[10px] md:text-xs font-semibold rounded-md transition-all",
                  viewType === 'semana' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"
                )}
              >
                Semana
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentDate(addDays(currentDate, viewType === 'dia' ? -1 : -7))}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                <CalendarIcon size={14} className="text-indigo-600" />
                <span className="text-[11px] md:text-sm font-bold capitalize whitespace-nowrap">
                  {format(currentDate, viewType === 'dia' ? "dd 'de' MMM" : "MMMM yyyy", { locale: ptBR })}
                </span>
              </div>
              <button 
                onClick={() => setCurrentDate(addDays(currentDate, viewType === 'dia' ? 1 : 7))}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              >
                <ChevronRight size={18} />
              </button>
            </div>
              <button 
                onClick={() => setShowReportModal(true)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                title="Relatório de Atendimentos"
              >
                <FileBarChart size={18} />
              </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div id="agenda-grid" className="flex-1 overflow-auto">
        <div className={cn(
          "grid min-w-[500px] md:min-w-[800px]",
          viewType === 'dia' 
            ? "grid-cols-[60px_1fr] md:grid-cols-[100px_1fr]" 
            : "grid-cols-[60px_repeat(7,1fr)] md:grid-cols-[100px_repeat(7,1fr)]"
        )}>
          {/* Header */}
          <div className="sticky top-0 z-10 bg-slate-50 border-b border-r border-slate-200 h-10"></div>
          {viewType === 'dia' ? (
            <div className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 h-10 flex items-center justify-center font-bold text-xs uppercase tracking-wider text-slate-500">
              {format(currentDate, "EEEE, dd/MM", { locale: ptBR })}
            </div>
          ) : (
            weekDays.map((day, i) => (
              <div key={i} className="sticky top-0 z-10 bg-slate-50 border-b border-r border-slate-200 h-10 flex flex-col items-center justify-center font-bold uppercase tracking-wider text-slate-500">
                <span className="text-[10px] md:text-xs">{format(day, "EEE", { locale: ptBR }).replace('.', '')}</span>
                <span className="text-[9px] md:text-[10px] font-normal">{format(day, "dd/MM")}</span>
              </div>
            ))
          )}

          {/* Body */}
          {times.map((time, i) => (
            <React.Fragment key={i}>
              <div className="border-b border-r border-slate-100 h-12 flex items-center justify-center text-[10px] font-mono text-slate-400 bg-slate-50/50">
                {time}
              </div>
              {viewType === 'dia' ? (
                <TimeSlot 
                  date={currentDate}
                  time={time}
                  doctorId={selectedDoctor}
                  appointment={getAppointment(currentDate, time)} 
                  patientName={getAppointment(currentDate, time) ? getPatientName(getAppointment(currentDate, time)!.patientId) : ''}
                  block={getBlock(currentDate, time)}
                  isOverbook={checkIsOverbook(currentDate, time)}
                  isLunchBreak={isLunchBreakInternal(currentDate, time)}
                  isInactiveDay={isInactiveDayInternal(currentDate)}
                  overbookStatus={getOverbookStatus(currentDate)}
                  onNewAppointment={onNewAppointment}
                  onBlockClick={handleBlockClick}
                  onAppointmentClick={setSelectedAppointmentForStatus}
                  onShowOverbookModal={setOverbookModalLimit}
                />
              ) : (
                weekDays.map((day, j) => (
                  <TimeSlot 
                    key={j} 
                    date={day}
                    time={time}
                    doctorId={selectedDoctor}
                    appointment={getAppointment(day, time)} 
                    patientName={getAppointment(day, time) ? getPatientName(getAppointment(day, time)!.patientId) : ''}
                    block={getBlock(day, time)}
                    isOverbook={checkIsOverbook(day, time)}
                    isLunchBreak={isLunchBreakInternal(day, time)}
                    isInactiveDay={isInactiveDayInternal(day)}
                    overbookStatus={getOverbookStatus(day)}
                    onNewAppointment={onNewAppointment}
                    onBlockClick={handleBlockClick}
                    onAppointmentClick={setSelectedAppointmentForStatus}
                    onShowOverbookModal={setOverbookModalLimit}
                  />
                ))
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {blockToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Remover Bloqueio</h3>
            <p className="text-sm text-slate-600 mb-6">
              Tem certeza que deseja remover este bloqueio? O horário ficará disponível para agendamentos.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setBlockToRemove(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmRemoveBlock}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overbook limit modal */}
      {overbookModalLimit !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2 whitespace-normal break-words">Limite de Encaixes Atingido</h3>
            <p className="text-sm text-slate-600 mb-6">
              O limite de {overbookModalLimit} encaixe(s) por dia já foi atingido para este médico.
            </p>
            <div className="flex justify-end">
              <button 
                onClick={() => setOverbookModalLimit(null)}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAppointmentForStatus && (
        <AppointmentStatusModal
          appointment={selectedAppointmentForStatus}
          patient={mockPatients.find(p => p.id === selectedAppointmentForStatus.patientId)!}
          onClose={() => setSelectedAppointmentForStatus(null)}
          onUpdateStatus={handleStatusUpdate}
          onTransfer={handleTransfer}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-white animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Relatório de Agendamentos</h2>
                  <p className="text-xs text-slate-500 font-medium">Selecione o período para visualização e impressão</p>
                </div>
              </div>
              <button 
                onClick={() => setShowReportModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {(['dia', 'semana', 'personalizado'] as const).map((p) => (
                  <button 
                    key={p}
                    onClick={() => setReportPeriod(p)}
                    className={cn(
                      "flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize",
                      reportPeriod === p ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {reportPeriod === 'personalizado' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Data Início</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={reportDateRange.startDate}
                      onChange={(e) => setReportDateRange({ ...reportDateRange, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Data Fim</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={reportDateRange.endDate}
                      onChange={(e) => setReportDateRange({ ...reportDateRange, endDate: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">Prévia da Lista</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {mockDoctors.find(d => d.id === selectedDoctor)?.name}
                  </span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                  {mockAppointments
                    .filter(app => {
                      if (app.doctorId !== selectedDoctor) return false;
                      if (reportPeriod === 'dia') return app.date === format(currentDate, 'yyyy-MM-dd');
                      if (reportPeriod === 'semana') {
                        const start = format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'yyyy-MM-dd');
                        const end = format(addDays(startOfWeek(currentDate, { weekStartsOn: 0 }), 6), 'yyyy-MM-dd');
                        return app.date >= start && app.date <= end;
                      }
                      if (reportPeriod === 'personalizado') {
                        return app.date >= reportDateRange.startDate && app.date <= reportDateRange.endDate;
                      }
                      return true;
                    })
                    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
                    .map(app => (
                      <div key={app.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{app.time}</span>
                          <span className="text-xs font-bold text-slate-700">{mockPatients.find(p => p.id === app.patientId)?.name}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{app.procedure}</span>
                      </div>
                    ))}
                  {mockAppointments.filter(app => app.doctorId === selectedDoctor && (reportPeriod === 'dia' ? app.date === format(currentDate, 'yyyy-MM-dd') : true)).length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-4 italic">Nenhum agendamento encontrado para este período.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                  <Printer size={18} /> Imprimir Lista
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all"
                >
                  <Download size={18} /> Exportar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimeSlot({ 
  date, 
  time, 
  doctorId, 
  appointment, 
  patientName, 
  block,
  isOverbook,
  isLunchBreak,
  isInactiveDay,
  overbookStatus,
  onNewAppointment,
  onBlockClick,
  onAppointmentClick,
  onShowOverbookModal
}: { 
  date: Date, 
  time: string, 
  doctorId: string, 
  appointment?: any, 
  patientName?: string, 
  block?: any,
  isOverbook?: boolean,
  isLunchBreak?: boolean,
  isInactiveDay?: boolean,
  overbookStatus?: { allowed: boolean, max: number, current: number },
  onNewAppointment?: (date: string, time: string, doctorId: string) => void,
  onBlockClick?: (block: any) => void,
  onAppointmentClick?: (appointment: any) => void,
  onShowOverbookModal?: (max: number) => void
}) {
  if (isInactiveDay && !appointment) {
    return (
      <div className="border-b border-r border-slate-100 h-12 p-1 relative bg-slate-50 flex items-center justify-center">
        <span className="text-[9px] md:text-[10px] text-slate-300 font-medium text-center leading-tight">Não atende</span>
      </div>
    );
  }

  if (block && !appointment) {
    return (
      <div 
        onClick={() => onBlockClick?.(block)}
        className="border-b border-r border-slate-100 h-12 p-1 relative bg-red-50/80 flex flex-col items-center justify-center text-red-500 cursor-pointer hover:bg-red-100/80 transition-colors"
        title="Clique para remover o bloqueio"
      >
        <Lock size={14} className="mb-0.5 opacity-60" />
        <span className="text-[9px] font-semibold uppercase tracking-wider truncate w-full text-center px-1">
          {block.reason || 'Bloqueado'}
        </span>
      </div>
    );
  }

  if (isLunchBreak && !appointment) {
    return (
      <div className="border-b border-r border-slate-100 h-12 p-1 relative bg-slate-100/50 flex items-center justify-center">
        <span className="text-[9px] md:text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-center leading-tight">
          <span className="md:hidden">Pausa</span>
          <span className="hidden md:inline">Almoço / Pausa</span>
        </span>
      </div>
    );
  }

  const isOverbookSlot = isOverbook;
  const showAddButton = !appointment && (!isOverbookSlot || (overbookStatus && overbookStatus.max > 0));

  const handleAddClick = () => {
    if (isOverbookSlot && overbookStatus && !overbookStatus.allowed) {
      if (onShowOverbookModal) onShowOverbookModal(overbookStatus.max);
      return;
    }
    onNewAppointment?.(format(date, 'yyyy-MM-dd'), time, doctorId);
  };

  return (
    <div className={cn(
      "border-b border-r border-slate-100 h-12 p-0.5 relative group transition-colors",
      isOverbookSlot ? "bg-amber-50/30 hover:bg-amber-50/80" : "hover:bg-slate-50/50"
    )}>
      {appointment ? (
        <div 
          onClick={() => onAppointmentClick?.(appointment)}
          className={cn(
            "h-full w-full rounded-md p-1.5 text-[10px] flex flex-col justify-between shadow-sm border-l-4 cursor-pointer hover:brightness-95 active:scale-[0.98] transition-all",
            isOverbookSlot 
              ? "bg-[#FFF9C4] border-yellow-400 text-yellow-800 font-medium" 
              : appointment.status === 'agendado' 
                  ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold" 
                  : appointment.status === 'confirmado'
                    ? "bg-sky-50 border-sky-500 text-sky-700 font-bold"
                    : appointment.status === 'em-atendimento'
                      ? "bg-violet-50 border-violet-500 text-violet-700 font-bold"
                      : appointment.status === 'realizado'
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold"
                        : "bg-slate-50 border-slate-300 text-slate-400 font-medium italic"
          )}
        >
          <div className="flex justify-between items-start gap-1">
            <p className="truncate uppercase flex-1">{patientName}</p>
            {appointment.status === 'confirmado' && (
              <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-sm animate-pulse shrink-0 mt-1" />
            )}
            {appointment.status === 'em-atendimento' && (
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-sm animate-pulse shrink-0 mt-1" />
            )}
          </div>
          <p className="opacity-70 truncate">{appointment.procedure}</p>
        </div>
      ) : showAddButton ? (
        <button 
          onClick={handleAddClick}
          className={cn(
            "absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer",
            isOverbookSlot ? "text-amber-500" : "text-indigo-400"
          )}
          title={isOverbookSlot ? "Adicionar Encaixe" : "Novo Agendamento"}
        >
          <PlusCircle size={16} />
        </button>
      ) : (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center">
          <span className="text-[9px] md:text-[10px] text-slate-300 font-medium text-center leading-tight">
            <span className="md:hidden">Indisp.</span>
            <span className="hidden md:inline">Não disponível</span>
          </span>
        </div>
      )}
    </div>
  );
}

function PlusCircle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}
