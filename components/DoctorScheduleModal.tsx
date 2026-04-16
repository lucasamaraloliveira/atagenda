'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, AlertCircle, Save, Plus, Check, Trash2, RotateCcw, LayoutGrid, Building2 } from 'lucide-react';
import { Doctor, DaySchedule, Unit, ScheduleConfig, ScheduleBlock } from '@/lib/types';
import { cn } from '@/lib/utils';
import CustomSelect from './CustomSelect';
import { firebaseService } from '@/lib/firebaseService';
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
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data States
  const [existingConfig, setExistingConfig] = useState<ScheduleConfig | null>(null);
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
  const [maxOverbooks, setMaxOverbooks] = useState('2');
  const [multiStrategy, setMultiStrategy] = useState<'next_minute' | 'next_slot'>('next_minute');
  const [localBlocks, setLocalBlocks] = useState<ScheduleBlock[]>([]);
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);

  // New Block Form
  const [blockDate, setBlockDate] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('');
  const [blockEndTime, setBlockEndTime] = useState('');
  const [blockReason, setBlockReason] = useState('');

  // Initial load: Units
  useEffect(() => {
    async function loadUnits() {
      try {
        const data = await firebaseService.getUnits();
        setUnits(data);
        if (data.length > 0) setSelectedUnit(data[0].id);
      } catch (err) {
        console.error('Failed to load units:', err);
      }
    }
    loadUnits();
  }, []);

  // Load Config & Blocks when Unit changes
  useEffect(() => {
    if (!selectedUnit) return;
    
    async function loadConfigAndBlocks() {
      try {
        setLoading(true);
        const [config, blocks] = await Promise.all([
          firebaseService.getScheduleConfig(doctor.id, selectedUnit),
          firebaseService.getScheduleBlocks(doctor.id, selectedUnit)
        ]);
        
        setExistingConfig(config);
        setLocalBlocks(blocks);
        
        if (config) {
          setSchedule(config.schedule);
          setSlotDuration(config.slotDuration.toString());
          setMaxOverbooks(config.maxOverbooksPerDay.toString());
          setMultiStrategy(config.multiProcedureStrategy || 'next_minute');
        } else {
          // Reset to defaults
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
          setMultiStrategy('next_minute');
        }
      } catch (err) {
        console.error('Failed to load doctor config:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConfigAndBlocks();
  }, [doctor.id, selectedUnit]);

  const handlePresetChange = (preset: string) => {
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

  const updateSelectedDay = (field: keyof DaySchedule, value: any) => {
    setSchedule(prev => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [field]: value
      }
    }));
  };

  const handleAddBlock = () => {
    if (!blockDate || !blockStartTime || !blockEndTime) {
      toast.error('Preencha os campos obrigatórios do bloqueio.');
      return;
    }

    const newBlock: ScheduleBlock = {
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
  };

  const handleSave = async () => {
    if (saving) return;
    try {
      setSaving(true);
      
      // 1. Save Config
      const newConfig: Omit<ScheduleConfig, 'id'> = {
        doctorId: doctor.id,
        unitId: selectedUnit,
        maxOverbooksPerDay: parseInt(maxOverbooks),
        slotDuration: parseInt(slotDuration),
        schedule: schedule,
        multiProcedureStrategy: multiStrategy
      };
      
      await firebaseService.saveScheduleConfig(newConfig as ScheduleConfig);

      // 2. Save Blocks (Full Replace for this doctor/unit)
      await firebaseService.saveScheduleBlocks(doctor.id, selectedUnit, localBlocks);

      toast.success('Configurações salvas com sucesso!');
      onClose();
    } catch (err: any) {
      toast.error(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const daysOfWeek = [
    { id: '0', label: 'Dom' },
    { id: '1', label: 'Seg' },
    { id: '2', label: 'Ter' },
    { id: '3', label: 'Qua' },
    { id: '4', label: 'Qui' },
    { id: '5', label: 'Sex' },
    { id: '6', label: 'Sáb' },
  ];

  const currentDaySchedule = schedule[selectedDay];

  if (loading && units.length > 0) {
    return (
       <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando Configurações...</p>
          </div>
       </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh] border border-white dark:border-slate-800 animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Configuração de Agenda</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Dr(a). {doctor.name} • CRM {doctor.crm}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
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
            options={units.map(u => ({ id: u.id, name: u.name }))}
            value={selectedUnit}
            onChange={setSelectedUnit}
            className="flex-1 max-w-xs"
          />
        </div>

        {/* Content */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 overflow-y-auto flex-1">
          {activeTab === 'escala' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 ml-1">Configuração Rápida</h3>
                <div className="flex flex-wrap gap-2">
                   {['weekdays', 'everyday', 'none'].map(preset => (
                     <button 
                        key={preset}
                        onClick={() => handlePresetChange(preset)}
                        className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:border-indigo-500 transition-all dark:text-slate-100"
                     >
                       {preset === 'weekdays' ? 'Seg a Sex' : preset === 'everyday' ? 'Todos os dias' : 'Limpar'}
                     </button>
                   ))}
                </div>
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
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                          : "border-transparent bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
                        schedule[day.id].active && selectedDay !== day.id && "bg-indigo-100/50 text-indigo-600 border-indigo-100/50"
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
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Horários para {daysOfWeek.find(d => d.id === selectedDay)?.label}</h3>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={currentDaySchedule.active} onChange={(e) => updateSelectedDay('active', e.target.checked)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Ativo</span>
                  </label>
                </div>

                {currentDaySchedule.active ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Início</label>
                        <input type="time" value={currentDaySchedule.startTime} onChange={(e) => updateSelectedDay('startTime', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Fim</label>
                        <input type="time" value={currentDaySchedule.endTime} onChange={(e) => updateSelectedDay('endTime', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Início Almoço</label>
                        <input type="time" value={currentDaySchedule.lunchStart} onChange={(e) => updateSelectedDay('lunchStart', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Fim Almoço</label>
                        <input type="time" value={currentDaySchedule.lunchEnd} onChange={(e) => updateSelectedDay('lunchEnd', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase">Folga</div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="max-w-xs space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duração Consulta (minutos)</label>
                  <input type="number" value={slotDuration} onChange={(e) => setSlotDuration(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bloqueio' && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4 text-xs font-medium text-amber-800 dark:text-amber-200">
                Bloqueios impedem agendamentos no período selecionado.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white" />
                 <div className="grid grid-cols-2 gap-2">
                    <input type="time" value={blockStartTime} onChange={(e) => setBlockStartTime(e.target.value)} className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white" />
                    <input type="time" value={blockEndTime} onChange={(e) => setBlockEndTime(e.target.value)} className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white" />
                 </div>
                 <input type="text" placeholder="Motivo" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} className="md:col-span-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white" />
                 <button onClick={handleAddBlock} className="md:col-span-2 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold">Adicionar Bloqueio</button>
              </div>

              <div className="space-y-2 mt-4">
                {localBlocks.map(block => (
                  <div key={block.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="text-xs">
                      <span className="font-bold">{new Date(block.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span> • {block.startTime} às {block.endTime}
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{block.reason}</p>
                    </div>
                    <button onClick={() => setLocalBlocks(prev => prev.filter(b => b.id !== block.id))} className="p-2 text-red-500"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'encaixe' && (
             <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Limite de Encaixes por Dia</label>
                <CustomSelect 
                  options={[
                    { id: '0', name: '0' }, { id: '1', name: '1' }, { id: '2', name: '2' }, { id: '3', name: '3' }, { id: '5', name: '5' }
                  ]}
                  value={maxOverbooks}
                  onChange={setMaxOverbooks}
                />
             </div>
          )}

          {activeTab === 'multi' && (
             <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estratégia de Agendamento Múltiplo</label>
                <div className="grid grid-cols-1 gap-3">
                   {[{ id: 'next_minute', label: 'Próximo Minuto' }, { id: 'next_slot', label: 'Próximo Horário Livre' }].map(strat => (
                     <button 
                        key={strat.id}
                        onClick={() => setMultiStrategy(strat.id as any)}
                        className={cn("p-4 rounded-xl border-2 text-left font-bold transition-all", multiStrategy === strat.id ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700" : "border-slate-100 dark:border-slate-800 dark:text-slate-400")}
                     >
                       {strat.label}
                     </button>
                   ))}
                </div>
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 sm:px-6 sm:py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">
            {saving ? 'Salvando...' : <><Save size={20} /> Salvar Tudo</>}
          </button>
        </div>

      </div>
    </div>
  );
}
