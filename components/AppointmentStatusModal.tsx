import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  PlayCircle, 
  UserMinus, 
  AlertTriangle,
  MoveHorizontal,
  Calendar as CalendarIcon,
  User
} from 'lucide-react';
import { Appointment, Patient, Doctor } from '@/lib/types';
import { mockDoctors } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';

interface AppointmentStatusModalProps {
  appointment: Appointment;
  patient: Patient;
  onClose: () => void;
  onUpdateStatus: (appointmentId: string, newStatus: Appointment['status']) => void;
  onTransfer: (appointmentId: string, newDate: string, newTime: string, newDoctorId: string) => void;
}

export default function AppointmentStatusModal({ 
  appointment, 
  patient, 
  onClose, 
  onUpdateStatus,
  onTransfer
}: AppointmentStatusModalProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'transfer'>('status');
  const [transferData, setTransferData] = useState({
    date: appointment.date,
    time: appointment.time,
    doctorId: appointment.doctorId
  });
  
  const statuses: { id: Appointment['status']; label: string; icon: any; color: string; description: string }[] = [
    { 
      id: 'agendado', 
      label: 'Agendado', 
      icon: Clock, 
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      description: 'Paciente possui um horário reservado.'
    },
    { 
      id: 'confirmado', 
      label: 'Paciente na Unidade', 
      icon: UserCheck, 
      color: 'text-sky-600 bg-sky-50 border-sky-200',
      description: 'Paciente chegou à clínica e confirmou presença.'
    },
    { 
      id: 'em-atendimento', 
      label: 'Em Atendimento', 
      icon: PlayCircle, 
      color: 'text-violet-600 bg-violet-50 border-violet-200',
      description: 'O profissional iniciou o procedimento/consulta.'
    },
    { 
      id: 'realizado', 
      label: 'Finalizado', 
      icon: CheckCircle2, 
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      description: 'O atendimento foi concluído com sucesso.'
    },
    { 
      id: 'cancelado', 
      label: 'Cancelado', 
      icon: UserMinus, 
      color: 'text-slate-500 bg-slate-50 border-slate-200',
      description: 'O agendamento foi cancelado.'
    }
  ];

  const canCancel = appointment.status === 'agendado' || appointment.status === 'confirmado';
  const isCompleted = appointment.status === 'realizado';

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTransfer(appointment.id, transferData.date, transferData.time, transferData.doctorId);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-white animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-8 pb-4 border-b border-slate-50 bg-slate-50/30">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-100">
                {patient.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">{patient.name}</h2>
                <p className="text-sm text-slate-500 font-medium">{appointment.procedure} • {appointment.time}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all shadow-sm border border-transparent hover:border-slate-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
            <button 
              onClick={() => setActiveTab('status')}
              className={cn(
                "flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                activeTab === 'status' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <CheckCircle2 size={14} /> Etapas do Status
            </button>
            <button 
              onClick={() => setActiveTab('transfer')}
              className={cn(
                "flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                activeTab === 'transfer' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <MoveHorizontal size={14} /> Transferência
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-[60vh] p-8 pt-6">
          {activeTab === 'status' ? (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Status Atual</h3>
              <div className="grid gap-3">
                {statuses.map((status) => {
                  const Icon = status.icon;
                  const isActive = appointment.status === status.id;
                  const isStatusCancel = status.id === 'cancelado';
                  
                  if (isStatusCancel && !canCancel && !isActive) return null;
                  if (isCompleted && !isActive) return null;

                  return (
                    <button
                      key={status.id}
                      disabled={isActive || (isCompleted && !isActive)}
                      onClick={() => onUpdateStatus(appointment.id, status.id)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group",
                        isActive 
                          ? status.color 
                          : "bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50 text-slate-600"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        isActive ? "bg-white" : "bg-slate-50 group-hover:bg-white"
                      )}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{status.label}</p>
                        <p className="text-[10px] opacity-70 truncate">{status.description}</p>
                      </div>
                      {!isActive && !isCompleted && (
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlayCircle size={16} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {isCompleted && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Este atendimento já foi <strong>Realizado</strong>. Não é possível alterar o status ou transferir.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Reagendamento</h3>
              {isCompleted ? (
                <div className="mt-4 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-center">
                  <AlertTriangle className="mx-auto text-slate-400 mb-4" size={32} />
                  <p className="text-sm text-slate-500 font-medium">
                    Atendimentos já realizados não podem ser transferidos para outra data.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleTransferSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nova Data</label>
                      <div className="relative">
                        <input 
                          type="date" 
                          required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={transferData.date}
                          onChange={(e) => setTransferData({...transferData, date: e.target.value})}
                        />
                        <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Novo Horário</label>
                      <div className="relative">
                        <input 
                          type="time" 
                          required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={transferData.time}
                          onChange={(e) => setTransferData({...transferData, time: e.target.value})}
                        />
                        <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Médico Executante</label>
                      <div className="relative">
                        <select 
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                          value={transferData.doctorId}
                          onChange={(e) => setTransferData({...transferData, doctorId: e.target.value})}
                        >
                          {mockDoctors.map(doctor => (
                            <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                          ))}
                        </select>
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-100"
                  >
                    <MoveHorizontal size={18} />
                    Confirmar Transferência
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 pt-0 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-50 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-all border border-slate-200"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
