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
  User,
  ShieldCheck,
  Activity,
  ArrowRight
} from 'lucide-react';
import { Appointment, Patient, Doctor } from '@/lib/types';
import { mockDoctors } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';
import CustomSelect from './CustomSelect';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [activeTab, setActiveTab] = useState<'status' | 'transfer' | 'audit'>('status');
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
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
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-slate-500 font-medium">{appointment.procedure} • {appointment.time}</p>
                  <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                    <a 
                      href={`https://wa.me/${patient.phone.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                      title="WhatsApp"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.626 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </a>
                  </div>
                </div>
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
              <MoveHorizontal size={14} /> Transferir
            </button>
            <button 
              onClick={() => setActiveTab('audit')}
              className={cn(
                "flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                activeTab === 'audit' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              < ShieldCheck size={14} /> Auditoria
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
          ) : activeTab === 'transfer' ? (
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

                    <div className="space-y-1.5 doctor-select-transfer">
                      <CustomSelect 
                        label="Médico Executante"
                        options={mockDoctors.map(d => ({ id: d.id, name: d.name }))}
                        value={transferData.doctorId}
                        onChange={(val) => setTransferData({ ...transferData, doctorId: val })}
                        className="w-full"
                      />
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
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between ml-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest uppercase">Linha do Tempo</h3>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                  <Activity size={10} /> ATIVO
                </span>
              </div>
              
              <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {appointment.statusHistory && appointment.statusHistory.length > 0 ? (
                  appointment.statusHistory.map((item, idx) => (
                    <div key={item.id} className="relative">
                      <div className={cn(
                        "absolute -left-[20px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ring-4",
                        idx === 0 ? "bg-indigo-600 ring-indigo-50" : "bg-indigo-400 ring-indigo-50"
                      )} />
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.note || 'Interação de Status'}</p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {format(new Date(item.timestamp), 'dd/MM/yy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-800">{item.user}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded font-bold capitalize">{item.status}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="relative">
                      <div className="absolute -left-[20px] top-1 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white shadow-sm ring-4 ring-indigo-50" />
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Agendamento Criado</p>
                      <p className="text-sm font-bold text-slate-800">Recepcionista: Maria Silva</p>
                      <p className="text-xs text-slate-500 mt-1">Status inicial definido como <strong>Agendado</strong>.</p>
                      <p className="text-[10px] text-slate-400 mt-1 italic">Histórico legado (sem data/hora precisa)</p>
                    </div>

                    {appointment.status !== 'agendado' && (
                      <div className="relative">
                        <div className="absolute -left-[20px] top-1 w-3 h-3 rounded-full bg-indigo-400 border-2 border-white shadow-sm ring-4 ring-indigo-50" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Alteração de Status</p>
                        <p className="text-sm font-bold text-slate-800">Ação do Sistema</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-bold">Agendado</span>
                          <ArrowRight size={12} className="text-slate-300" />
                          <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded font-bold capitalize">{appointment.status}</span>
                        </div>
                      </div>
                    )}

                    {(appointment.date !== transferData.date || appointment.time !== transferData.time) && (
                      <div className="relative border-l-2 border-amber-400 pl-4 py-1 -ml-[2px]">
                          <div className="absolute -left-[20px] top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-sm ring-4 ring-amber-50" />
                          <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Transferência Realizada</p>
                          <p className="text-sm font-bold text-slate-800">Motivo: Solicitação do Paciente</p>
                          <p className="text-[11px] text-slate-500 mt-1">Horário anterior: {appointment.time} em {appointment.date.split('-').reverse().join('/')}</p>
                      </div>
                    )}
                  </>
                )}
                
                <div className="pt-4">
                  <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest text-center italic">
                    Fim do log de auditoria
                  </p>
                </div>
              </div>
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
