import React, { useState, useMemo } from 'react';
import { X, Calendar, Clock, AlertCircle, Save, Plus, Check, Trash2, RotateCcw } from 'lucide-react';
import { Doctor, DaySchedule } from '@/lib/types';
import { cn } from '@/lib/utils';
import CustomSelect from './CustomSelect';
import { mockScheduleConfigs, mockScheduleBlocks } from '@/lib/mockData';
import { toast } from 'react-toastify';

interface DoctorScheduleModalProps {
  doctor: Doctor;
  onClose: () => void;
}

type Tab = 'escala' | 'bloqueio' | 'encaixe';

const defaultDaySchedule: DaySchedule = {
  active: false,
  startTime: '08:00',
  endTime: '18:00',
  lunchStart: '12:00',
  lunchEnd: '13:00'
};

export default function DoctorScheduleModal({ doctor, onClose }: DoctorScheduleModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('escala');

  // Load existing config if available
  const existingConfig = mockScheduleConfigs.find(c => c.doctorId === doctor.id);

  // Escala State
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(
    existingConfig?.schedule || {
      '0': { ...defaultDaySchedule },
      '1': { ...defaultDaySchedule, active: true },
      '2': { ...defaultDaySchedule, active: true },
      '3': { ...defaultDaySchedule, active: true },
      '4': { ...defaultDaySchedule, active: true },
      '5': { ...defaultDaySchedule, active: true },
      '6': { ...defaultDaySchedule },
    }
  );
  const [selectedDay, setSelectedDay] = useState<string>('1');
  const [slotDuration, setSlotDuration] = useState(existingConfig?.slotDuration?.toString() || '15');

  const getPreset = () => {
    const activeDays = Object.keys(schedule).filter(day => schedule[day].active);
    if (activeDays.length === 5 && ['1', '2', '3', '4', '5'].every(d => activeDays.includes(d))) return 'weekdays';
    if (activeDays.length === 7) return 'everyday';
    if (activeDays.length === 0) return 'none';
    return 'custom';
  };

  const handlePresetChange = (preset: string) => {
    if (preset === 'custom') return;
    
    const newSchedule = { ...schedule };
    Object.keys(newSchedule).forEach(day => {
      if (preset === 'weekdays') {
        newSchedule[day] = { ...newSchedule[day], active: ['1', '2', '3', '4', '5'].includes(day) };
      } else if (preset === 'everyday') {
        newSchedule[day] = { ...newSchedule[day], active: true };
      } else if (preset === 'none') {
        newSchedule[day] = { ...newSchedule[day], active: false };
      }
    });
    setSchedule(newSchedule);
  };

  // Encaixe State
  const [maxOverbooks, setMaxOverbooks] = useState(existingConfig?.maxOverbooksPerDay?.toString() || '2');

  // Bloqueio State
  const [blockDate, setBlockDate] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('');
  const [blockEndTime, setBlockEndTime] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [localBlocks, setLocalBlocks] = useState([...mockScheduleBlocks.filter(b => b.doctorId === doctor.id)]);
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const daysOfWeek = [
    { id: '0', label: 'Dom' },
    { id: '1', label: 'Seg' },
    { id: '2', label: 'Ter' },
    { id: '3', label: 'Qua' },
    { id: '4', label: 'Qui' },
    { id: '5', label: 'Sex' },
    { id: '6', label: 'Sáb' },
  ];

  const handleAddBlock = () => {
    if (!blockDate || !blockStartTime || !blockEndTime) {
      toast.error('Preencha os campos obrigatórios do bloqueio.');
      return;
    }
    
    const newBlock = {
      id: Math.random().toString(36).substr(2, 9),
      doctorId: doctor.id,
      date: blockDate,
      startTime: blockStartTime,
      endTime: blockEndTime,
      reason: blockReason || 'Bloqueado'
    };
    
    setLocalBlocks(prev => [...prev, newBlock]);
    setBlockDate('');
    setBlockStartTime('');
    setBlockEndTime('');
    setBlockReason('');
    toast.info('Bloqueio adicionado à lista local.');
  };

  const handleConfirmDeleteBlock = (id: string) => {
    setBlockToDelete(id);
  };

  const deleteBlock = () => {
    if (!blockToDelete) return;
    const block = localBlocks.find(b => b.id === blockToDelete);
    if (!block) return;

    setLocalBlocks(prev => prev.filter(b => b.id !== blockToDelete));
    setBlockToDelete(null);

    toast.success(
      <div className="flex items-center justify-between gap-2">
        <span>Bloqueio removido.</span>
        <button 
          onClick={() => {
            setLocalBlocks(prev => [...prev, block]);
            toast.info('Bloqueio restaurado.');
          }}
          className="flex items-center gap-1 font-bold underline"
        >
          <RotateCcw size={14} /> Desfazer
        </button>
      </div>,
      { autoClose: 5000 }
    );
  };

  const handleSave = () => {
    // 1. Save Config (Escala & Encaixes)
    const configIndex = mockScheduleConfigs.findIndex(c => c.doctorId === doctor.id);
    const newConfig = {
      doctorId: doctor.id,
      maxOverbooksPerDay: parseInt(maxOverbooks),
      slotDuration: parseInt(slotDuration),
      schedule: schedule
    };

    if (configIndex >= 0) {
      mockScheduleConfigs[configIndex] = newConfig;
    } else {
      mockScheduleConfigs.push(newConfig);
    }

    // 2. Save Blocks
    // Remove all existing blocks for this doctor from mockData first
    for (let i = mockScheduleBlocks.length - 1; i >= 0; i--) {
      if (mockScheduleBlocks[i].doctorId === doctor.id) {
        mockScheduleBlocks.splice(i, 1);
      }
    }
    // Add local blocks back
    mockScheduleBlocks.push(...localBlocks);

    toast.success('Todas as configurações foram salvas com sucesso!');
    onClose();
  };

  const updateSelectedDay = (field: keyof DaySchedule, value: any) => {
    setSchedule(prev => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [field]: value
      }
    }));
  };

  const currentDaySchedule = schedule[selectedDay];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Configuração de Agenda</h2>
            <p className="text-sm text-slate-500 mt-1">Dr(a). {doctor.name} • CRM {doctor.crm}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('escala')}
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
              activeTab === 'escala' 
                ? "border-indigo-600 text-indigo-600" 
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            Criar Escala
          </button>
          <button
            onClick={() => setActiveTab('bloqueio')}
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
              activeTab === 'bloqueio' 
                ? "border-indigo-600 text-indigo-600" 
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            Bloqueio de Agenda
          </button>
          <button
            onClick={() => setActiveTab('encaixe')}
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
              activeTab === 'encaixe' 
                ? "border-indigo-600 text-indigo-600" 
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            Encaixes
          </button>
        </div>

        {/* Content */}
        <div className={cn(
          "p-6 overflow-y-auto flex-1",
          activeTab === 'encaixe' && "min-h-[350px]"
        )}>
          {activeTab === 'escala' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Configuração Rápida</h3>
                <CustomSelect
                  options={[
                    { id: 'weekdays', name: 'Dias da semana (Segunda a Sexta)' },
                    { id: 'everyday', name: 'Todos os dias (Domingo a Domingo)' },
                    { id: 'none', name: 'Nenhum (Limpar todos)' },
                    { id: 'custom', name: 'Personalizada' }
                  ]}
                  value={getPreset()}
                  onChange={handlePresetChange}
                  className="w-full sm:w-80"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Selecione o Dia da Semana</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <button
                      key={day.id}
                      onClick={() => setSelectedDay(day.id)}
                      className={cn(
                        "w-12 h-12 rounded-xl text-sm font-bold flex items-center justify-center transition-all border-2",
                        selectedDay === day.id
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200",
                        schedule[day.id].active && selectedDay !== day.id && "bg-indigo-100/50 text-indigo-600"
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">
                    Horários para {daysOfWeek.find(d => d.id === selectedDay)?.label}
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className={cn(
                      "w-5 h-5 rounded flex items-center justify-center border transition-colors",
                      currentDaySchedule.active ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300"
                    )}>
                      {currentDaySchedule.active && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-sm font-medium text-slate-700">Atender neste dia</span>
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={currentDaySchedule.active}
                      onChange={(e) => updateSelectedDay('active', e.target.checked)}
                    />
                  </label>
                </div>

                {currentDaySchedule.active ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expediente</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Início</label>
                          <div className="relative">
                            <input 
                              type="time" 
                              value={currentDaySchedule.startTime}
                              onChange={(e) => updateSelectedDay('startTime', e.target.value)}
                              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fim</label>
                          <div className="relative">
                            <input 
                              type="time" 
                              value={currentDaySchedule.endTime}
                              onChange={(e) => updateSelectedDay('endTime', e.target.value)}
                              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Almoço / Pausa</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Início</label>
                          <div className="relative">
                            <input 
                              type="time" 
                              value={currentDaySchedule.lunchStart}
                              onChange={(e) => updateSelectedDay('lunchStart', e.target.value)}
                              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fim</label>
                          <div className="relative">
                            <input 
                              type="time" 
                              value={currentDaySchedule.lunchEnd}
                              onChange={(e) => updateSelectedDay('lunchEnd', e.target.value)}
                              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-sm">
                    O médico não atende neste dia da semana.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="max-w-xs space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Duração Padrão da Consulta</label>
                  <CustomSelect 
                    options={[
                      { id: '10', name: '10 minutos' },
                      { id: '15', name: '15 minutos' },
                      { id: '20', name: '20 minutos' },
                      { id: '30', name: '30 minutos' },
                      { id: '60', name: '1 hora' },
                    ]}
                    value={slotDuration}
                    onChange={setSlotDuration}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bloqueio' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p className="text-sm">
                  O bloqueio de agenda impede novos agendamentos no período selecionado. 
                  Agendamentos já existentes não serão cancelados automaticamente.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5 md:col-span-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Data do Bloqueio</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={blockDate}
                      onChange={(e) => setBlockDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Horário Inicial</label>
                  <div className="relative">
                    <input 
                      type="time" 
                      value={blockStartTime}
                      onChange={(e) => setBlockStartTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Horário Final</label>
                  <div className="relative">
                    <input 
                      type="time" 
                      value={blockEndTime}
                      onChange={(e) => setBlockEndTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Motivo do Bloqueio</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Férias, Congresso, Reunião..."
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={handleAddBlock}
                    className="w-full py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold border border-indigo-200 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    Adicionar Bloqueio
                  </button>
                </div>
              </div>

              {/* Blocks List */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-600" />
                  Bloqueios Ativos
                </h4>
                
                {localBlocks.length > 0 ? (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    {localBlocks.sort((a,b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).map((block) => (
                      <div key={block.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl group hover:border-indigo-200 transition-colors">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">
                             {new Date(block.date + 'T00:00:00').toLocaleDateString('pt-BR')} • {block.startTime} às {block.endTime}
                          </span>
                          <span className="text-[10px] text-slate-500">{block.reason}</span>
                        </div>
                        <button 
                          onClick={() => handleConfirmDeleteBlock(block.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-xs text-slate-500 italic">Nenhum bloqueio cadastrado para este médico.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'encaixe' && (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex gap-3 text-indigo-800">
                <Plus className="shrink-0 mt-0.5" size={18} />
                <p className="text-sm">
                  Defina o limite de encaixes permitidos por dia para este médico. 
                  Os encaixes podem ser agendados fora dos horários regulares da escala.
                </p>
              </div>

              <div className="max-w-xs space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Limite de Encaixes por Dia</label>
                <CustomSelect 
                  options={[
                    { id: '0', name: 'Não permitir encaixes' },
                    { id: '1', name: '1 encaixe' },
                    { id: '2', name: '2 encaixes' },
                    { id: '3', name: '3 encaixes' },
                    { id: '4', name: '4 encaixes' },
                    { id: '5', name: '5 encaixes' },
                    { id: '10', name: '10 encaixes' },
                  ]}
                  value={maxOverbooks}
                  onChange={setMaxOverbooks}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
          >
            <Save size={18} />
            Salvar Configurações
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {blockToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 mb-2 whitespace-normal break-words">Excluir Bloqueio</h3>
              <p className="text-sm text-slate-600 mb-6">
                Tem certeza que deseja remover este bloqueio? O horário voltará a ficar disponível na agenda após salvar.
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setBlockToDelete(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Manter
                </button>
                <button 
                  onClick={deleteBlock}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
