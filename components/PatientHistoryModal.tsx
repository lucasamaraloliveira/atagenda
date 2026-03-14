'use client';

import React from 'react';
import { X, Calendar, Clock, User, ClipboardList, CheckCircle2, AlertTriangle, PlayCircle, History as HistoryIcon } from 'lucide-react';
import { Appointment, Patient } from '@/lib/types';
import { mockAppointments, mockDoctors } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PatientHistoryModalProps {
  patient: Patient;
  onClose: () => void;
}

export default function PatientHistoryModal({ patient, onClose }: PatientHistoryModalProps) {
  // Filter appointments for this patient
  const patientAppointments = mockAppointments
    .filter(app => app.patientId === patient.id)
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

  const getStatusConfig = (status: Appointment['status']) => {
    switch (status) {
      case 'agendado': return { icon: Clock, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', label: 'Agendado' };
      case 'confirmado': return { icon: User, color: 'text-sky-600 bg-sky-50 border-sky-100', label: 'Na Unidade' };
      case 'em-atendimento': return { icon: PlayCircle, color: 'text-violet-600 bg-violet-50 border-violet-100', label: 'Em Atendimento' };
      case 'realizado': return { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', label: 'Finalizado' };
      case 'cancelado': return { icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-100', label: 'Cancelado' };
      default: return { icon: ClipboardList, color: 'text-slate-600 bg-slate-50 border-slate-100', label: 'Desconhecido' };
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-white animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
              <HistoryIcon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">Histórico do Paciente</h2>
                {patient.recordNumber && (
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    #{patient.recordNumber}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 font-medium">{patient.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[70vh] space-y-4 no-scrollbar">
          {patientAppointments.length > 0 ? (
            patientAppointments.map((app) => {
              const status = getStatusConfig(app.status);
              const doctor = mockDoctors.find(d => d.id === app.doctorId);
              const dateObj = parse(app.date, 'yyyy-MM-dd', new Date());

              return (
                <div key={app.id} className="group p-5 bg-white border border-slate-100 rounded-3xl hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-50/50 transition-colors" />
                  
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg">
                          <Calendar size={14} />
                        </div>
                        <span className="text-sm font-bold text-slate-900">
                          {format(dateObj, "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">•</span>
                        <span className="text-sm text-slate-500 font-mono">{app.time}</span>
                      </div>
                      <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5", status.color)}>
                        <status.icon size={12} />
                        {status.label}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Procedimento</p>
                        <p className="text-sm text-slate-800 font-bold">{app.procedure}</p>
                      </div>
                      <div className="space-y-1 text-left sm:text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Profissional</p>
                        <p className="text-sm text-slate-800 font-bold">Dr. {doctor?.name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                <ClipboardList size={32} />
              </div>
              <p className="text-slate-500 font-medium italic">Nenhum atendimento registrado anteriormente.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 pt-0 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
          >
            Fechar Histórico
          </button>
        </div>
      </div>
    </div>
  );
}
