'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileBarChart, ChevronDown, Lock, Printer, Download, Eye, FileText, MoveHorizontal, X, Zap, AlertTriangle, ListChecks, Users, Clock } from 'lucide-react';
import { mockDoctors, mockAppointments, mockPatients, mockScheduleBlocks, mockScheduleConfigs, mockUnits, mockProcedures, mockSystemSettings } from '@/lib/mockData';
import { Procedure } from '@/lib/types';
import { cn, normalizeString } from '@/lib/utils';
import { Building2 } from 'lucide-react';
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

export const getDaySchedule = (doctorId: string, unitId: string, date: Date) => {
  const config = mockScheduleConfigs.find(c => c.doctorId === doctorId && c.unitId === unitId);
  if (!config || !config.schedule) return null;
  const dayOfWeek = date.getDay().toString();
  return config.schedule[dayOfWeek];
};

export const isTimeOverbook = (doctorId: string, unitId: string, date: Date, time: string) => {
  const schedule = getDaySchedule(doctorId, unitId, date);
  const config = mockScheduleConfigs.find(c => c.doctorId === doctorId && c.unitId === unitId);
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
  const [selectedDoctor, setSelectedDoctor] = useState(mockDoctors[0]?.id || '');
  const [selectedUnit, setSelectedUnit] = useState(mockUnits[0]?.id || '');
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
  const [showDailyGlobalModal, setShowDailyGlobalModal] = useState(false);
  const [hoverDaily, setHoverDaily] = useState(false);
  const [hoverReport, setHoverReport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const doctorOptions = mockDoctors
    .filter(doc => doc.type !== 'solicitante')
    .map(doc => ({
      id: doc.id,
      name: `Médico: ${doc.name}`
    }));

  const unitOptions = mockUnits.map(unit => ({
    id: unit.id,
    name: `Unidade: ${unit.name}`
  }));

  const doctorConfig = mockScheduleConfigs.find(c => c.doctorId === selectedDoctor && c.unitId === selectedUnit);
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
    if (app.doctorId === selectedDoctor && app.unitId === selectedUnit && formattedRelevantDates.includes(app.date)) {
      timesSet.add(app.time);
    }
  });

  const times = Array.from(timesSet).sort();

  const getAppointment = (date: Date, time: string) => {
    const app = mockAppointments.find(app => 
      app.doctorId === selectedDoctor && 
      app.unitId === selectedUnit &&
      app.date === format(date, 'yyyy-MM-dd') && 
      app.time === time
    );

    if (!app) return null;

    // Filter by search query if provided
    if (searchQuery) {
      const patientName = normalizeString(getPatientName(app.patientId));
      const procedure = normalizeString(app.procedure);
      const search = normalizeString(searchQuery);
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
      block.unitId === selectedUnit &&
      block.date === formattedDate && 
      time >= block.startTime && 
      time < block.endTime
    );
  };

  const checkIsOverbook = (date: Date, time: string) => {
    return isTimeOverbook(selectedDoctor, selectedUnit, date, time);
  };

  const isLunchBreakInternal = (date: Date, time: string) => {
    const schedule = getDaySchedule(selectedDoctor, selectedUnit, date);
    if (!schedule || !schedule.active) return false;
    return time >= schedule.lunchStart && time < schedule.lunchEnd;
  };

  const isInactiveDayInternal = (date: Date) => {
    const schedule = getDaySchedule(selectedDoctor, selectedUnit, date);
    return !schedule || !schedule.active;
  };

  const getOverbookStatus = (date: Date) => {
    const config = mockScheduleConfigs.find(c => c.doctorId === selectedDoctor && c.unitId === selectedUnit);
    if (!config || config.maxOverbooksPerDay === 0) return { allowed: false, max: 0, current: 0 };
    
    const formattedDate = format(date, 'yyyy-MM-dd');
    const dailyAppointments = mockAppointments.filter(app => 
      app.doctorId === selectedDoctor && app.unitId === selectedUnit && app.date === formattedDate
    );
    
    let overbookCount = 0;
    dailyAppointments.forEach(app => {
      const isAppOverbook = app.isOverbook ?? checkIsOverbook(date, app.time);
      if (isAppOverbook) {
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
      const oldStatus = appointment.status;
      appointment.status = newStatus;
      
      if (!appointment.statusHistory) appointment.statusHistory = [];
      appointment.statusHistory.push({
        id: Math.random().toString(36).substr(2, 9),
        status: newStatus,
        timestamp: new Date().toISOString(),
        user: 'Administrador',
        note: `Alteração de status: ${oldStatus} -> ${newStatus}`
      });
      
      // Trigger Integration if status changed to 'realizado'
      if (newStatus === 'realizado' && oldStatus !== 'realizado') {
        const proc = mockProcedures.find((p: Procedure) => p.name === appointment.procedure);
        if (proc?.integraRis) {
          const isGlobalRisEnabled = mockSystemSettings.integracao.risEnabled;
          
          if (!isGlobalRisEnabled) {
            // Error case: Procedure requires RIS but global integration is disabled
            toast.error(
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle size={14} />
                  <span>Erro de Integração RIS</span>
                </div>
                <p className="text-[10px] opacity-90">O procedimento exige integração, mas o módulo RIS global está desativado nas configurações.</p>
              </div>,
              { autoClose: 5000 }
            );
            console.error('❌ RIS Integration Failed: Global RIS module is disabled.');
          } else if (!mockSystemSettings.integracao.pacsUrl) {
             // Error case: Global RIS is enabled but no PACS URL is configured
             toast.error(
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle size={14} />
                  <span>Configuração Incompleta</span>
                </div>
                <p className="text-[10px] opacity-90">A URL do servidor PACS não foi configurada nos parâmetros de integração.</p>
              </div>,
              { autoClose: 5000 }
            );
            console.error('❌ RIS Integration Failed: PACS URL is missing.');
          } else {
            // Success case: Log only, as requested by user
            const patient = mockPatients.find(p => p.id === appointment.patientId);
            const doctor = mockDoctors.find(d => d.id === appointment.doctorId);
            const unit = mockUnits.find(u => u.id === appointment.unitId);
            
            const integrationPayload = {
              event: 'APPOINTMENT_COMPLETED',
              timestamp: new Date().toISOString(),
              data: {
                appointmentId: appointment.id,
                date: appointment.date,
                time: appointment.time,
                status: appointment.status,
                patient: {
                  id: patient?.id,
                  name: patient?.name,
                  cpf: patient?.cpf,
                  recordNumber: patient?.recordNumber
                },
                doctor: {
                  id: doctor?.id,
                  name: doctor?.name,
                  crm: doctor?.crm,
                  specialty: doctor?.specialty
                },
                procedure: {
                  name: proc.name,
                  modality: proc.modality,
                  price: proc.price
                },
                unit: {
                  id: unit?.id,
                  name: unit?.name
                },
                insurance: appointment.insurance
              }
            };
            
            console.log('🚀 RIS Integration Triggered (Silent Success):', integrationPayload);
          }
        }
      }

      setRefreshKey(k => k + 1);
      setSelectedAppointmentForStatus(null);
      toast.success(`Status do agendamento atualizado para "${newStatus}"`);
    }
  };

  const handleTransfer = (appointmentId: string, newDate: string, newTime: string, newDoctorId: string) => {
    const appointment = mockAppointments.find(a => a.id === appointmentId);
    if (appointment) {
      const oldDate = appointment.date;
      const oldTime = appointment.time;
      
      appointment.date = newDate;
      appointment.time = newTime;
      appointment.doctorId = newDoctorId;
      appointment.unitId = selectedUnit; 
      
      if (!appointment.statusHistory) appointment.statusHistory = [];
      appointment.statusHistory.push({
        id: Math.random().toString(36).substr(2, 9),
        status: appointment.status,
        timestamp: new Date().toISOString(),
        user: 'Administrador',
        note: `Transferência: ${oldTime} (${oldDate}) -> ${newTime} (${newDate})`
      });
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
    const unit = mockUnits.find(u => u.id === selectedUnit);
    
    // Dynamic Title based on Period
    const reportTitle = reportPeriod === 'dia' ? 'Lista de Agendamentos do Dia' :
                        reportPeriod === 'semana' ? 'Lista de Agendamentos da Semana' :
                        'Lista de Agendamentos (Personalizado)';

    const periodLabel = reportPeriod === 'dia' ? format(currentDate, 'dd/MM/yyyy') : 
                        reportPeriod === 'semana' ? `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'dd/MM/yyyy')} a ${format(addDays(startOfWeek(currentDate, { weekStartsOn: 0 }), 6), 'dd/MM/yyyy')}` : 
                        `${format(parse(reportDateRange.startDate, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')} a ${format(parse(reportDateRange.endDate, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')}`;

    // Header styling
    doc.setFillColor(0, 155, 219); // #009BDB
    doc.rect(0, 0, 210, 40, 'F');
    
    if (unit?.logo) {
      try {
        const imgProps = doc.getImageProperties(unit.logo);
        const ratio = imgProps.width / imgProps.height;
        const maxHeight = 26;
        const maxWidth = 80;
        let displayWidth = maxHeight * ratio;
        let displayHeight = maxHeight;

        if (displayWidth > maxWidth) {
          displayWidth = maxWidth;
          displayHeight = maxWidth / ratio;
        }

        const yPos = (40 - displayHeight) / 2;
        doc.addImage(unit.logo, 'PNG', 15, yPos, displayWidth, displayHeight);
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        const textX = 15 + displayWidth + 8;
        doc.text(unit?.name || 'ATAgenda', textX, 22);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const now = format(new Date(), 'dd/MM/yyyy HH:mm');
        doc.text(`Gerado em: ${now}`, textX, 30);
        doc.text(`Período: ${periodLabel}`, textX, 35);
      } catch (e) {
        // Fallback if image fails
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(unit?.name || 'Relatório de Atendimentos', 15, 20);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const now = format(new Date(), 'dd/MM/yyyy HH:mm');
        doc.text(`Gerado em: ${now}`, 15, 30);
        doc.text(`Período: ${periodLabel}`, 15, 35);
      }
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(unit?.name || 'Relatório de Atendimentos', 15, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const now = format(new Date(), 'dd/MM/yyyy HH:mm');
      doc.text(`Gerado em: ${now}`, 15, 30);
      doc.text(`Período: ${periodLabel}`, 15, 35);
    }

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(12);
    doc.text(`Médico: ${doctor?.name || 'Não selecionado'}`, 15, 50);
    doc.text(`CRM: ${doctor?.crm || '-'}`, 15, 56);

    // Centralized Dynamic Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const titleWidth = doc.getTextWidth(reportTitle);
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    doc.text(reportTitle, (pageWidth - titleWidth) / 2, 65);

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
      startY: 72, head: [['Data', 'Hora', 'Paciente', 'Procedimento', 'Status']],
      body: tableData,
      headStyles: { 
        fillColor: [0, 155, 219],
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
      },
      didDrawPage: (data) => {
        // Footer
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        
        doc.setFontSize(8);
        doc.setTextColor(150);
        
        // Branding text
        const footerText = 'powered by Alrion Tech • todos os direitos reservados';
        doc.text(footerText, 15, pageHeight - 10);
        
        // Pagination
        const pageNumber = `Página ${data.pageNumber}`;
        const totalPages = doc.getNumberOfPages();
        const pageLabel = `${pageNumber} de ${totalPages}`;
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
        const textWidth = doc.getTextWidth(pageLabel);
        doc.text(pageLabel, pageWidth - textWidth - 15, pageHeight - 10);
      }
    });

    // Final total pages update (jsPDF autoTable pagination fix)
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      const pageSize = doc.internal.pageSize;
      const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      const pageLabel = `Página ${i} de ${totalPages}`;
      const textWidth = doc.getTextWidth(pageLabel);
      
      // Clean previous label area and write final
      doc.setFillColor(255, 255, 255);
      doc.rect(pageWidth - 50, pageHeight - 15, 40, 10, 'F');
      doc.text(pageLabel, pageWidth - textWidth - 15, pageHeight - 10);
    }

    doc.save(`relatorio_atendimentos_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    toast.success('Relatório PDF gerado com sucesso!');
  };

  return (
    <div key={refreshKey} className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
      {/* Filters & Navigation */}
      <div className="p-3 md:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3">
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

            <div id="unit-select">
              <CustomSelect 
                options={unitOptions}
                value={selectedUnit}
                onChange={setSelectedUnit}
                className="w-full sm:w-64"
              />
            </div>

            <div id="view-toggle" className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 shrink-0">
              <button 
                onClick={() => setViewType('dia')}
                className={cn(
                   "px-3 py-1 text-[10px] md:text-xs font-semibold rounded-md transition-all",
                   viewType === 'dia' ? "bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"
                )}
              >
                Dia
              </button>
              <button 
                onClick={() => setViewType('semana')}
                className={cn(
                   "px-3 py-1 text-[10px] md:text-xs font-semibold rounded-md transition-all",
                   viewType === 'semana' ? "bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"
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
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors">
                <CalendarIcon size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span className="text-[11px] md:text-sm font-bold capitalize whitespace-nowrap text-slate-900 dark:text-white">
                  {format(currentDate, viewType === 'dia' ? "dd 'de' MMM" : "MMMM yyyy", { locale: ptBR })}
                </span>
              </div>
              <button 
                onClick={() => setCurrentDate(addDays(currentDate, viewType === 'dia' ? 1 : 7))}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"
              >
                <ChevronRight size={18} />
              </button>
            </div>
              <div className="relative flex items-center">
                <button 
                  onClick={() => setShowDailyGlobalModal(true)}
                  onMouseEnter={() => setHoverDaily(true)}
                  onMouseLeave={() => setHoverDaily(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-900/50 transition-all active:scale-95"
                >
                  <ListChecks size={18} />
                </button>
                <AnimatePresence>
                  {hoverDaily && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      className="absolute top-full mt-2 right-0 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg whitespace-nowrap z-[100] shadow-xl pointer-events-none"
                    >
                      Agendamentos do Dia
                      <div className="absolute bottom-full right-4 border-8 border-transparent border-b-slate-900" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative flex items-center">
                <button 
                  onClick={() => setShowReportModal(true)}
                  onMouseEnter={() => setHoverReport(true)}
                  onMouseLeave={() => setHoverReport(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-all active:scale-95"
                >
                  <FileBarChart size={18} />
                </button>
                <AnimatePresence>
                  {hoverReport && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      className="absolute top-full mt-2 right-0 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg whitespace-nowrap z-[100] shadow-xl pointer-events-none"
                    >
                      Relatório de Atendimentos
                      <div className="absolute bottom-full right-4 border-8 border-transparent border-b-slate-900" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
          <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-r border-slate-200 dark:border-slate-800 h-10"></div>
          {viewType === 'dia' ? (
            <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-10 flex items-center justify-center font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {format(currentDate, "EEEE, dd/MM", { locale: ptBR })}
            </div>
          ) : (
            weekDays.map((day, i) => (
              <div key={i} className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-r border-slate-200 dark:border-slate-800 h-10 flex flex-col items-center justify-center font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span className="text-[10px] md:text-xs">{format(day, "EEE", { locale: ptBR }).replace('.', '')}</span>
                <span className="text-[9px] md:text-[10px] font-normal">{format(day, "dd/MM")}</span>
              </div>
            ))
          )}

          {/* Body */}
          {times.map((time, i) => (
            <React.Fragment key={i}>
              <div className="border-b border-r border-slate-100 dark:border-slate-800 h-12 flex items-center justify-center text-[10px] font-mono text-slate-400 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-900/50">
                {time}
              </div>
              {viewType === 'dia' ? (
                <TimeSlot 
                  date={currentDate}
                  time={time}
                  doctorId={selectedDoctor}
                  unitId={selectedUnit}
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
                    unitId={selectedUnit}
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-xl border border-white dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Remover Bloqueio</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Tem certeza que deseja remover este bloqueio? O horário ficará disponível para agendamentos.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setBlockToRemove(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-xl border border-white dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 whitespace-normal break-words">Limite de Encaixes Atingido</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
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
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-white dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Relatório de Agendamentos</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Selecione o período para visualização e impressão</p>
                </div>
              </div>
              <button 
                onClick={() => setShowReportModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {(['dia', 'semana', 'personalizado'] as const).map((p) => (
                  <button 
                    key={p}
                    onClick={() => setReportPeriod(p)}
                    className={cn(
                      "flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize",
                      reportPeriod === p ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {reportPeriod === 'personalizado' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Data Início</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-slate-100 color-scheme-dark"
                      value={reportDateRange.startDate}
                      onChange={(e) => setReportDateRange({ ...reportDateRange, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Data Fim</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-slate-100 color-scheme-dark"
                      value={reportDateRange.endDate}
                      onChange={(e) => setReportDateRange({ ...reportDateRange, endDate: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Prévia da Lista</h3>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
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
                      <div key={app.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">{app.time}</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{mockPatients.find(p => p.id === app.patientId)?.name}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{app.procedure}</span>
                      </div>
                    ))}
                  {mockAppointments.filter(app => app.doctorId === selectedDoctor && (reportPeriod === 'dia' ? app.date === format(currentDate, 'yyyy-MM-dd') : true)).length === 0 && (
                    <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-4 italic">Nenhum agendamento encontrado para este período.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-xl shadow-slate-200 dark:shadow-none"
                >
                  <Printer size={18} /> Imprimir Lista
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  <Download size={18} /> Exportar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDailyGlobalModal && (
        <DailyAppointmentsModal 
          date={currentDate}
          initialUnitId={selectedUnit}
          onClose={() => setShowDailyGlobalModal(false)}
          onAppointmentClick={setSelectedAppointmentForStatus}
        />
      )}
    </div>
  );
}

function TimeSlot({ 
  date, 
  time, 
  doctorId, 
  unitId,
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
  unitId: string,
  appointment?: any, 
  patientName?: string, 
  block?: any,
  isOverbook?: boolean,
  isLunchBreak?: boolean,
  isInactiveDay?: boolean,
  overbookStatus?: { allowed: boolean, max: number, current: number },
  onNewAppointment?: (date: string, time: string, doctorId: string, unitId: string) => void,
  onBlockClick?: (block: any) => void,
  onAppointmentClick?: (appointment: any) => void,
  onShowOverbookModal?: (max: number) => void
}) {
  const [hoverAdd, setHoverAdd] = useState(false);

  if (isInactiveDay && !appointment) {
    return (
      <div className="border-b border-r border-slate-100 dark:border-slate-800 h-12 p-1 relative bg-slate-50 dark:bg-slate-900/80 flex items-center justify-center">
        <span className="text-[9px] md:text-[10px] text-slate-300 dark:text-slate-600 font-medium text-center leading-tight">Não atende</span>
      </div>
    );
  }

  if (block && !appointment) {
    return (
      <div 
        onClick={() => onBlockClick?.(block)}
        className="border-b border-r border-slate-100 dark:border-slate-800 h-12 p-1 relative bg-red-50/80 dark:bg-red-900/20 flex flex-col items-center justify-center text-red-500 dark:text-red-400 cursor-pointer hover:bg-red-100/80 dark:hover:bg-red-900/30 transition-colors"
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
      <div className="border-b border-r border-slate-100 dark:border-slate-800 h-12 p-1 relative bg-slate-100/50 dark:bg-slate-800/30 flex items-center justify-center">
        <span className="text-[9px] md:text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600 text-center leading-tight">
          <span className="md:hidden">Pausa</span>
          <span className="hidden md:inline">Almoço / Pausa</span>
        </span>
      </div>
    );
  }

  const isOverbookSlot = appointment ? (appointment.isOverbook ?? isOverbook) : isOverbook;
  const showAddButton = !appointment && (!isOverbookSlot || (overbookStatus && overbookStatus.max > 0));

  const handleAddClick = () => {
    if (isOverbookSlot && overbookStatus && !overbookStatus.allowed) {
      if (onShowOverbookModal) onShowOverbookModal(overbookStatus.max);
      return;
    }
    onNewAppointment?.(format(date, 'yyyy-MM-dd'), time, doctorId, unitId);
  };

  return (
    <div 
      onClick={!appointment && showAddButton ? handleAddClick : undefined}
      onMouseEnter={() => !appointment && showAddButton && setHoverAdd(true)}
      onMouseLeave={() => !appointment && showAddButton && setHoverAdd(false)}
      className={cn(
        "border-b border-r border-slate-100 dark:border-slate-800 h-12 p-0.5 relative group transition-colors",
        isOverbookSlot ? "bg-amber-50/30 dark:bg-amber-900/10 hover:bg-amber-50/80 dark:hover:bg-amber-900/20" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/50",
        !appointment && showAddButton && "cursor-pointer"
      )}
    >
      {appointment ? (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onAppointmentClick?.(appointment);
          }}
          className={cn(
            "h-full w-full rounded-md p-1.5 text-[10px] flex flex-col justify-between shadow-sm border-l-4 cursor-pointer hover:brightness-95 active:scale-[0.98] transition-all",
            isOverbookSlot 
              ? "bg-[#FFF9C4] dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 font-medium" 
              : appointment.status === 'agendado' 
                  ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold" 
                  : appointment.status === 'confirmado'
                    ? "bg-sky-50 dark:bg-sky-900/30 border-sky-500 text-sky-700 dark:text-sky-300 font-bold"
                    : appointment.status === 'em-atendimento'
                      ? "bg-violet-50 dark:bg-violet-900/30 border-violet-500 text-violet-700 dark:text-violet-300 font-bold"
                      : appointment.status === 'realizado'
                        ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 font-medium italic"
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
        <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none">
          <div 
            className={cn(
              "w-8 h-8 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all hover:scale-110 active:scale-95",
              isOverbookSlot ? "text-amber-500 bg-amber-50 dark:bg-amber-900/30 rounded-full" : "text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-full"
            )}
          >
            <PlusCircle size={18} />
          </div>
          
          <AnimatePresence>
            {hoverAdd && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[9px] font-bold rounded-md whitespace-nowrap z-[100] shadow-lg"
              >
                {isOverbookSlot ? 'Adicionar Encaixe' : 'Novo Agendamento'}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center">
          <span className="text-[9px] md:text-[10px] text-slate-300 dark:text-slate-600 font-medium text-center leading-tight">
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

function DailyAppointmentsModal({ date, initialUnitId, onClose, onAppointmentClick }: { date: Date, initialUnitId: string, onClose: () => void, onAppointmentClick: (app: any) => void }) {
  const [selectedUnit, setSelectedUnit] = useState(initialUnitId);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const formattedDate = format(date, 'yyyy-MM-dd');

  const unitOptions = mockUnits.map(unit => ({
    id: unit.id,
    name: unit.name
  }));

  const perPageOptions = [
    { id: '20', name: '20 pacientes' },
    { id: '50', name: '50 pacientes' },
    { id: '75', name: '75 pacientes' },
  ];

  const allFilteredApps = mockAppointments.filter(app => 
    app.date === formattedDate && app.unitId === selectedUnit
  ).sort((a, b) => a.time.localeCompare(b.time));

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedUnit, itemsPerPage]);

  const totalItems = allFilteredApps.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedApps = allFilteredApps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-white dark:border-slate-800 animate-in zoom-in-95 duration-300">
        <div className="p-6 sm:p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none shrink-0">
                <ListChecks size={20} />
             </div>
             <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">Agendamentos do Dia</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
             </div>
          </div>
          
          <div className="flex items-center gap-4 shrink-0 min-w-[200px]">
             <CustomSelect 
               options={unitOptions}
               value={selectedUnit}
               onChange={(val) => setSelectedUnit(val)}
             />
             <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                <X size={20} />
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 no-scrollbar scroll-smooth">
           {totalItems === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 italic">
                <Clock size={48} className="mb-4 opacity-20" />
                <p>Nenhum agendamento encontrado para esta unidade nesta data.</p>
             </div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left border-separate border-spacing-y-2">
                 <thead>
                   <tr className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4">
                     <th className="pb-4 pl-4">Hora</th>
                     <th className="pb-4">Médico</th>
                     <th className="pb-4">Paciente</th>
                     <th className="pb-4">Procedimento</th>
                     <th className="pb-4">Status</th>
                   </tr>
                 </thead>
                 <tbody>
                    {paginatedApps.map(app => {
                      const doctor = mockDoctors.find(d => d.id === app.doctorId);
                      const patient = mockPatients.find(p => p.id === app.patientId);
                      return (
                        <tr 
                          key={app.id} 
                          onClick={() => onAppointmentClick(app)}
                          className="bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer"
                        >
                          <td className="py-4 pl-4 rounded-l-2xl">
                             <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800">{app.time}</span>
                          </td>
                          <td className="py-4">
                             <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500">
                                   <Users size={14} />
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">{doctor?.name}</span>
                             </div>
                          </td>
                          <td className="py-4">
                             <span className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{patient?.name}</span>
                          </td>
                          <td className="py-4">
                             <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] truncate block max-w-[200px]">{app.procedure}</span>
                          </td>
                          <td className="py-4 pr-4 rounded-r-2xl">
                             <div className="flex flex-col items-end gap-1">
                               <span className={cn(
                                 "px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap shadow-sm border transition-colors",
                                 app.isOverbook && app.status === 'agendado' ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-black border-amber-200 dark:border-amber-800" :
                                 app.status === 'agendado' ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800" :
                                 app.status === 'confirmado' ? "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800" :
                                 app.status === 'em-atendimento' ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800" :
                                 app.status === 'realizado' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" :
                                 "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                               )}>
                                 {app.status}
                               </span>
                               {app.isOverbook && (
                                 <span className="text-[8px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tighter bg-white dark:bg-slate-800 px-1 border border-amber-100 dark:border-amber-800 rounded">
                                   Encaixe
                                 </span>
                               )}
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                 </tbody>
               </table>
             </div>
           )}
        </div>
        
        <div className="p-6 sm:p-8 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex flex-col md:flex-row items-center gap-6">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">Total de <strong className="text-slate-600 dark:text-slate-300">{totalItems}</strong> agendamentos.</p>
              
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                   <button 
                     disabled={currentPage === 1}
                     onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                     className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                   >
                     <ChevronLeft size={16} />
                   </button>
                   
                   <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button 
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                            currentPage === page 
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none" 
                              : "text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                          )}
                        >
                          {page}
                        </button>
                      ))}
                   </div>

                   <button 
                     disabled={currentPage === totalPages}
                     onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                     className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                   >
                     <ChevronRight size={16} />
                   </button>
                </div>
              )}
           </div>

           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Exibir:</span>
                 <CustomSelect 
                    options={perPageOptions}
                    value={itemsPerPage.toString()}
                    onChange={(val) => setItemsPerPage(parseInt(val))}
                    className="w-40"
                    direction="up"
                 />
              </div>
              <button 
                onClick={onClose}
                className="px-6 sm:px-8 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-xl shadow-slate-200 dark:shadow-none active:scale-[0.98]"
              >
                Fechar
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
