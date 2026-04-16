'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, ClipboardList, CheckCircle2, AlertTriangle, PlayCircle, History as HistoryIcon } from 'lucide-react';
import { Appointment, Patient, Doctor } from '@/lib/types';
import { firebaseService } from '@/lib/firebaseService';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PatientHistoryModalProps {
  patient: Patient;
  onClose: () => void;
}

export default function PatientHistoryModal({ patient, onClose }: PatientHistoryModalProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [appts, docs] = await Promise.all([
          firebaseService.getAppointments({ patientId: patient.id }),
          firebaseService.getDoctors()
        ]);
        setAppointments(appts.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)));
        setDoctors(docs);
      } catch (err) {
        console.error('Failed to load patient history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [patient.id]);

  const getStatusConfig = (status: Appointment['status']) => {
    switch (status) {
      case 'agendado': return { icon: Clock, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800', label: 'Agendado' };
      case 'confirmado': return { icon: User, color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 border-sky-100 dark:border-sky-800', label: 'Na Unidade' };
      case 'em-atendimento': return { icon: PlayCircle, color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 border-violet-100 dark:border-violet-800', label: 'Em Atendimento' };
      case 'realizado': return { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800', label: 'Finalizado' };
      case 'cancelado': return { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800', label: 'Cancelado' };
      default: return { icon: ClipboardList, color: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700', label: 'Desconhecido' };
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh] border border-white dark:border-slate-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3 sm:px-6 sm:py-4 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center dark:shadow-none">
              <HistoryIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Histórico do Paciente</h2>
                {patient.recordNumber && (
                   <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    #{patient.recordNumber}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{patient.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-500">Buscando histórico...</p>
            </div>
          ) : appointments.length > 0 ? (
            appointments.map((app) => {
              const status = getStatusConfig(app.status);
              const doctor = doctors.find(d => d.id === app.doctorId);
              const dateObj = parse(app.date, 'yyyy-MM-dd', new Date());

              return (
                <div key={app.id} className="group p-5 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-3xl hover:border-indigo-200 dark:hover:border-indigo-500 shadow-sm hover:shadow-lg hover:shadow-indigo-500/5 dark:shadow-none transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 dark:bg-slate-700/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-50/50 dark:group-hover:bg-indigo-900/20 transition-colors" />
                  
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-1.5 rounded-lg">
                          <Calendar size={14} />
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {format(dateObj, "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-600 font-medium">•</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">{app.time}</span>
                      </div>
                      <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5", status.color)}>
                        <status.icon size={12} />
                        {status.label}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Procedimento</p>
                        <p className="text-sm text-slate-800 dark:text-slate-200 font-bold">{app.procedure}</p>
                      </div>
                      <div className="space-y-1 text-left sm:text-right">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Profissional</p>
                        <p className="text-sm text-slate-800 dark:text-slate-200 font-bold">Dr. {doctor?.name || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
                <ClipboardList size={32} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium italic">Nenhum atendimento registrado anteriormente.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 sm:px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all dark:shadow-none active:scale-95"
          >
            Fechar Histórico
          </button>
        </div>
      </div>
    </div>
  );
}
