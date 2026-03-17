import React, { useState, useMemo } from 'react';
import { X, Calendar, Clock, AlertCircle, Save, Plus, Check, Trash2, RotateCcw, LayoutGrid } from 'lucide-react';
import { Doctor, DaySchedule } from '@/lib/types';
import { cn } from '@/lib/utils';
import CustomSelect from './CustomSelect';
import { mockScheduleConfigs, mockScheduleBlocks, mockUnits } from '@/lib/mockData';
import { Building2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface DoctorScheduleModalProps {
  doctor: Doctor;
  onClose: () => void;
}

type Tab = 'escala' | 'bloqueio' | 'encaixe' | 'multi';

const defaultDaySchedule: DaySchedule = {
  active: false,
  startTime: '08:00',
  endTime: '18:00',
  lunchStart: '12:00',
  lunchEnd: '13:00'
};

export default function DoctorScheduleModal({ doctor, onClose }: DoctorScheduleModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('escala');
  const [selectedUnit, setSelectedUnit] = useState(mockUnits[0]?.id || '');

  // Load existing config if available
  const existingConfig = useMemo(() =>
    mockScheduleConfigs.find(c => c.doctorId === doctor.id && c.unitId === selectedUnit),
    [doctor.id, selectedUnit]);

  // Escala State
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>({
    '0': { ...defaultDaySchedule },
    '1': { ...defaultDaySchedule },
    '2': { ...defaultDaySchedule },
    '3': { ...defaultDaySchedule },
    '4': { ...defaultDaySchedule },
    '5': { ...defaultDaySchedule },
    '6': { ...defaultDaySchedule },
  });
  const [selectedDay, setSelectedDay] = useState<string>('1');
  const [slotDuration, setSlotDuration] = useState('15');

  // Encaixe State
  const [maxOverbooks, setMaxOverbooks] = useState(existingConfig?.maxOverbooksPerDay?.toString() || '2');

  // Update schedule when config changes (on unit change)
  React.useEffect(() => {
    if (existingConfig) {
      setSchedule(existingConfig.schedule);
      setSlotDuration(existingConfig.slotDuration.toString());
      setMaxOverbooks(existingConfig.maxOverbooksPerDay.toString());
    } else {
      setSchedule({
        '0': { ...defaultDaySchedule },
        '1': { ...defaultDaySchedule, active: true },
        '2': { ...defaultDaySchedule, active: true },
        '3': { ...defaultDaySchedule, active: true },
        '4': { ...defaultDaySchedule, active: true },
        '5': { ...defaultDaySchedule, active: true },
        '6': { ...defaultDaySchedule },
      });
      setSlotDuration('15');
      setMaxOverbooks('2');
    }
  }, [existingConfig, selectedUnit]);

  const [multiStrategy, setMultiStrategy] = useState<'next_minute' | 'next_slot'>(existingConfig?.multiProcedureStrategy || 'next_minute');

  React.useEffect(() => {
    if (existingConfig) {
      setMultiStrategy(existingConfig.multiProcedureStrategy || 'next_minute');
    } else {
      setMultiStrategy('next_minute');
    }
  }, [existingConfig, selectedUnit]);

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

  // Bloqueio State
  const [blockDate, setBlockDate] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('');
  const [blockEndTime, setBlockEndTime] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [localBlocks, setLocalBlocks] = useState([...mockScheduleBlocks.filter(b => b.doctorId === doctor.id && b.unitId === selectedUnit)]);
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Update local blocks when unit changes
  React.useEffect(() => {
    setLocalBlocks([...mockScheduleBlocks.filter(b => b.doctorId === doctor.id && b.unitId === selectedUnit)]);
  }, [selectedUnit]);

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
      unitId: selectedUnit,
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
    const configIndex = mockScheduleConfigs.findIndex(c => c.doctorId === doctor.id && c.unitId === selectedUnit);
    const newConfig = {
      doctorId: doctor.id,
      unitId: selectedUnit,
      maxOverbooksPerDay: parseInt(maxOverbooks),
      slotDuration: parseInt(slotDuration),
      schedule: schedule,
      multiProcedureStrategy: multiStrategy
    };

    if (configIndex >= 0) {
      mockScheduleConfigs[configIndex] = newConfig;
    } else {
      mockScheduleConfigs.push(newConfig);
    }

    // 2. Save Blocks
    // Remove all existing blocks for this doctor AND this unit from mockData first
    for (let i = mockScheduleBlocks.length - 1; i >= 0; i--) {
      if (mockScheduleBlocks[i].doctorId === doctor.id && mockScheduleBlocks[i].unitId === selectedUnit) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh] border border-white dark:border-slate-800 animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Configuração de Agenda</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Dr(a). {doctor.name} • CRM {doctor.crm}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto no-scrollbar">
          {[
            { id: 'escala', label: 'Escala' },
            { id: 'bloqueio', label: 'Bloqueio' },
            { id: 'multi', label: 'Múltiplos' },
            { id: 'encaixe', label: 'Encaixes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                "px-3 sm:px-4 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Unit Selection Header */}
        <div className="px-4 sm:px-6 py-2.5 bg-indigo-50/30 dark:bg-indigo-900/10 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Building2 size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Unidade:</span>
          </div>
          <CustomSelect
            options={mockUnits.map(u => ({ id: u.id, name: u.name }))}
            value={selectedUnit}
            onChange={setSelectedUnit}
            className="flex-1 max-w-xs"
          />
        </div>

        {/* Content */}
        <div className={cn(
          "px-4 py-4 sm:px-6 sm:py-5 overflow-y-auto flex-1",
          activeTab === 'encaixe' && "min-h-[250px]"
        )}>
          {activeTab === 'encaixe' && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 flex gap-3 text-amber-800 dark:text-amber-200">
                <AlertCircle className="shrink-0 text-amber-500" size={20} />
                <p className="text-sm leading-relaxed font-medium">
                  Defina o limite de encaixes permitidos por dia para este médico. 
                  Os encaixes podem ser agendados fora dos horários regulares da escala.
                </p>
              </div>

              <div className="max-w-xs space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Limite de Encaixes por Dia</label>
                <CustomSelect 
                  options={[
                    { id: '0', name: 'Não permitir encaixes' },
                    { id: '1', name: '1 encaixe' },
                    { id: '2', name: '2 encaixes' },
                    { id: '3', name: '3 encaixes' },
                    { id: '5', name: '5 encaixes' },
                    { id: '10', name: '10 encaixes' },
                  ]}
                  value={maxOverbooks}
                  onChange={setMaxOverbooks}
                />
              </div>
            </div>
          )}

          {activeTab === 'multi' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 mb-4">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-indigo-50 dark:border-indigo-900/50">
                    <LayoutGrid size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg dark:text-white">Estratégia de Agendamento Múltiplo</h3>
                    <p className="text-[10px] text-indigo-400 uppercase font-bold tracking-widest mt-0.5">Defina como o sistema deve comportar múltiplos procedimentos</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'next_minute', label: 'Próximo Minuto', desc: 'Procedimentos agendados sequencialmente (ex: 08:00, 08:01). Ideal para faturamento agrupado.' },
                    { id: 'next_slot', label: 'Próximo Horário Livre', desc: 'Procedimentos nos próximos slots livres (ex: 08:00, 08:20). Respeita o fluxo de atendimento.' }
                  ].map((strat) => (
                    <button
                      key={strat.id}
                      onClick={() => setMultiStrategy(strat.id as any)}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all",
                        multiStrategy === strat.id
                          ? "bg-white dark:bg-slate-800 border-indigo-600 dark:border-indigo-500 shadow-md dark:shadow-none"
                          : "bg-transparent border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 opacity-60 hover:opacity-100"
                      )}
                    >
                      <div className={cn(
                        "mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                        multiStrategy === strat.id 
                          ? "border-indigo-600 dark:border-indigo-500 bg-indigo-600 dark:bg-indigo-500" 
                          : "border-slate-300 dark:border-slate-700"
                      )}>
                        {multiStrategy === strat.id && <Check size={14} className="text-white" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1">{strat.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">{strat.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex gap-3 text-slate-500 dark:text-slate-400">
                  <AlertCircle size={20} className="shrink-0 text-slate-400 dark:text-slate-500" />
                  <p className="text-[11px] leading-relaxed font-medium">
                    Esta configuração afeta apenas a criação de agendamentos no módulo <strong>Novo Agendamento</strong>.
                    Agendamentos diretos pela grade da agenda ignoram esta regra.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'escala' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Configuração Rápida</h3>
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
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2">Dia da Semana</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <button
                      key={day.id}
                      onClick={() => setSelectedDay(day.id)}
                      className={cn(
                        "w-11 h-11 sm:w-12 sm:h-12 rounded-xl text-xs font-bold flex items-center justify-center transition-all border-2",
                        selectedDay === day.id
                          ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-lg shadow-indigo-100 dark:shadow-none"
                          : "border-transparent bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
                        schedule[day.id].active && selectedDay !== day.id && "bg-indigo-100/50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100/50 dark:border-indigo-900/50"
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Horários para {daysOfWeek.find(d => d.id === selectedDay)?.label}
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Defina o expediente e pausas de almoço</p>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all",
                      currentDaySchedule.active 
                        ? "bg-indigo-600 border-indigo-600 dark:border-indigo-500 text-white shadow-lg shadow-indigo-100 dark:shadow-none" 
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:group-hover:border-slate-600"
                    )}>
                      {currentDaySchedule.active && <Check size={14} strokeWidth={3} />}
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Atender neste dia</span>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={currentDaySchedule.active}
                      onChange={(e) => updateSelectedDay('active', e.target.checked)}
                    />
                  </label>
                </div>

                {currentDaySchedule.active ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="text-indigo-500" size={14} />
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Expediente</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Início</label>
                          <input
                            type="time"
                            value={currentDaySchedule.startTime}
                            onChange={(e) => updateSelectedDay('startTime', e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100 dark:[color-scheme:dark]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Fim</label>
                          <input
                            type="time"
                            value={currentDaySchedule.endTime}
                            onChange={(e) => updateSelectedDay('endTime', e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100 dark:[color-scheme:dark]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <RotateCcw className="text-amber-500" size={14} />
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Almoço / Pausa</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Início</label>
                          <input
                            type="time"
                            value={currentDaySchedule.lunchStart}
                            onChange={(e) => updateSelectedDay('lunchStart', e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100 dark:[color-scheme:dark]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Fim</label>
                          <input
                            type="time"
                            value={currentDaySchedule.lunchEnd}
                            onChange={(e) => updateSelectedDay('lunchEnd', e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100 dark:[color-scheme:dark]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <AlertCircle className="mx-auto mb-2 text-slate-300 dark:text-slate-700" size={28} />
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Agenda não habilitada para este dia</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="max-w-xs space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Duração Padrão da Consulta</label>
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
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 flex gap-3 text-amber-800 dark:text-amber-200">
                <AlertCircle className="shrink-0 text-amber-500" size={20} />
                <p className="text-sm leading-relaxed font-medium">
                  O bloqueio de agenda impede novos agendamentos no período selecionado.
                  Agendamentos já existentes não serão cancelados automaticamente.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Data do Bloqueio</label>
                  <div className="relative group">
                    <input
                      type="date"
                      value={blockDate}
                      onChange={(e) => setBlockDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100 dark:[color-scheme:dark]"
                    />
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Horário Inicial</label>
                  <div className="relative group">
                    <input
                      type="time"
                      value={blockStartTime}
                      onChange={(e) => setBlockStartTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100 dark:[color-scheme:dark]"
                    />
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Horário Final</label>
                  <div className="relative group">
                    <input
                      type="time"
                      value={blockEndTime}
                      onChange={(e) => setBlockEndTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100 dark:[color-scheme:dark]"
                    />
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Motivo do Bloqueio</label>
                  <input
                    type="text"
                    placeholder="Ex: Férias, Congresso, Reunião..."
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-100 dark:placeholder-slate-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    onClick={handleAddBlock}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all dark:shadow-none flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <Plus size={20} />
                    Adicionar Bloqueio à Lista
                  </button>
                </div>
              </div>

              {/* Blocks List */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
                  <Calendar size={14} className="text-indigo-600 dark:text-indigo-400" />
                  Bloqueios Agendados
                </h4>

                {localBlocks.length > 0 ? (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    {localBlocks.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).map((block) => (
                      <div key={block.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl group hover:border-indigo-100 dark:hover:border-indigo-900 transition-all shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-700">
                             <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">{new Date(block.date + 'T00:00:00').getDate()}</span>
                             <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">{new Date(block.date + 'T00:00:00').toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              {block.startTime} às {block.endTime}
                            </span>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">{block.reason}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleConfirmDeleteBlock(block.id)}
                          className="p-3 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <Calendar className="mx-auto mb-2 text-slate-200 dark:text-slate-700" size={32} />
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nenhum bloqueio cadastrado</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3 transition-colors">
          <button
            onClick={onClose}
            className="px-5 sm:px-6 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 sm:px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all dark:shadow-none active:scale-[0.98]"
          >
            <Save size={20} />
            Salvar Todas as Configurações
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {blockToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-white dark:border-slate-800 animate-in zoom-in-95 duration-200 text-center">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Excluir Bloqueio</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-medium">
                Tem certeza que deseja remover este bloqueio? O horário voltará a ficar disponível na agenda após salvar as alterações.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setBlockToDelete(null)}
                  className="py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Manter
                </button>
                <button
                  onClick={deleteBlock}
                  className="py-3 bg-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-100 dark:shadow-none hover:bg-red-600 transition-colors"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
