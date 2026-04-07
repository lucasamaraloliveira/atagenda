'use client';

import React, { useState, useMemo } from 'react';
import { Search, Plus, Save, X, User, Phone, Stethoscope, ClipboardList, Clock, ChevronDown, UserPlus, LayoutGrid, Calendar, AlertCircle, Check, Trash2, RotateCcw } from 'lucide-react';
import { mockPatients as _mockPatients, mockDoctors as _mockDoctors, mockAppointments as _mockAppointments, mockScheduleConfigs as _mockScheduleConfigs, mockProcedures as _mockProcedures } from '@/lib/mockData';
import { firebaseService } from '@/lib/firebaseService';
import { Patient, Doctor, Procedure, ScheduleConfig } from '@/lib/types';
import CustomSelect from './CustomSelect';
import { toast } from 'react-toastify';
import { isTimeOverbook } from './Agenda';
import { parse } from 'date-fns';

interface NewAppointmentProps {
  initialData?: { date?: string, time?: string, doctorId?: string, unitId?: string } | null;
  onCancel?: () => void;
}

export default function NewAppointment({ initialData, onCancel }: NewAppointmentProps) {
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    referringDoctor: '',
    insurance: '',
    executingDoctor: initialData?.doctorId || '',
    modality: '',
    procedure: '',
    date: initialData?.date || '',
    time: initialData?.time || '',
    unitId: initialData?.unitId || '1',
    birthDate: '',
    cpf: '',
    selectedProcedures: [] as any[]
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVerifyingPatient, setIsVerifyingPatient] = useState(false);
  const [showOverbookModal, setShowOverbookModal] = useState<number | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showProcedureDropdown, setShowProcedureDropdown] = useState(false);

  // Load baseline data from Firebase
  React.useEffect(() => {
    async function loadData() {
      try {
        const [p, d, proc] = await Promise.all([
          firebaseService.getPatients(),
          firebaseService.getDoctors(),
          firebaseService.getProcedures()
        ]);
        setPatients(p);
        setDoctors(d);
        setProcedures(proc);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const sanitizeStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  React.useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        date: initialData.date || prev.date,
        time: initialData.time || prev.time,
        executingDoctor: initialData.doctorId || prev.executingDoctor,
        unitId: initialData.unitId || prev.unitId
      }));
    }
  }, [initialData]);

  React.useEffect(() => {
    if (formData.patientName.length > 0) {
      setIsVerifyingPatient(true);
      const timer = setTimeout(() => {
        setIsVerifyingPatient(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsVerifyingPatient(false);
    }
  }, [formData.patientName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 1. Find or create patient in Firebase
      let patient = patients.find(p => p.name === formData.patientName);

      if (!patient && formData.cpf) {
        patient = patients.find(p => p.cpf === formData.cpf);
      }

      let patientId = patient?.id;

      if (!patientId) {
        const nextRecordNumber = `PR-${(patients.length + 1001).toString()}`;
        const newPatient = await firebaseService.createPatient({
          recordNumber: nextRecordNumber,
          name: formData.patientName,
          cpf: formData.cpf,
          birthDate: formData.birthDate,
          gender: '',
          phone: formData.phone,
          email: ''
        });
        patientId = newPatient.id;
      }

      // 2. Prepare appointments
      const proceduresToSchedule = formData.selectedProcedures.length > 0
        ? formData.selectedProcedures
        : (formData.procedure ? [procedures.find(p => sanitizeStr(p.name) === sanitizeStr(formData.procedure)) || { name: formData.procedure }] : []);

      if (proceduresToSchedule.length === 0) {
        toast.error('Selecione ao menos um procedimento.');
        return;
      }

      // 3. Strategy & Overbook verification
      const config = await firebaseService.getScheduleConfig(formData.executingDoctor, formData.unitId);
      const strategy = config?.multiProcedureStrategy || 'next_minute';
      const slotDuration = config?.slotDuration || 20;
      const limit = config?.maxOverbooksPerDay || 0;

      const appDate = parse(formData.date, 'yyyy-MM-dd', new Date());
      const isInitialTimeOverbook = isTimeOverbook(formData.executingDoctor, formData.unitId, appDate, formData.time, config ? [config] : []);

      let currentTimeStr = formData.time;
      const appointmentsToCreate: any[] = [];

      for (let i = 0; i < proceduresToSchedule.length; i++) {
        const proc = proceduresToSchedule[i];
        let appointmentTime = currentTimeStr;
        let finalIsOverbook = false;

        if (i > 0) {
          if (strategy === 'next_minute') {
            const [h, m] = appointmentTime.split(':').map(Number);
            const nextDate = new Date();
            nextDate.setHours(h, m + 1);
            appointmentTime = `${nextDate.getHours().toString().padStart(2, '0')}:${nextDate.getMinutes().toString().padStart(2, '0')}`;
            finalIsOverbook = isInitialTimeOverbook;
          } else {
            const [h, m] = appointmentTime.split(':').map(Number);
            const nextDate = new Date();
            nextDate.setHours(h, m + slotDuration);
            appointmentTime = `${nextDate.getHours().toString().padStart(2, '0')}:${nextDate.getMinutes().toString().padStart(2, '0')}`;
            finalIsOverbook = isTimeOverbook(formData.executingDoctor, formData.unitId, appDate, appointmentTime, config ? [config] : []);
          }
          currentTimeStr = appointmentTime;
        } else {
          finalIsOverbook = isInitialTimeOverbook;
        }

        appointmentsToCreate.push({
          patientId,
          doctorId: formData.executingDoctor,
          unitId: formData.unitId,
          date: formData.date,
          time: appointmentTime,
          procedure: proc.name,
          insurance: formData.insurance || 'Particular',
          status: 'agendado',
          isOverbook: finalIsOverbook,
          statusHistory: [
            {
              id: Math.random().toString(36).substr(2, 9),
              status: 'agendado',
              timestamp: new Date().toISOString(),
              user: 'Sistema',
              note: 'Agendamento Criado (Firebase)'
            }
          ]
        });
      }

      // 4. Persistence
      await Promise.all(appointmentsToCreate.map(a => firebaseService.createAppointment(a)));
      
      toast.success('Agendamento criado com sucesso!');
      if (onCancel) onCancel();
    } catch (err: any) {
      toast.error(`Falha ao agendar: ${err.message}`);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatPhone = (value: string) => {
    if (!value) return '';
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const handlePatientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Se estiver digitando apenas números e barras, aplica máscara de data (DD/MM/AAAA)
    if (/^[\d/]+$/.test(value)) {
      const numbers = value.replace(/\D/g, '');
      if (numbers.length <= 2) value = numbers;
      else if (numbers.length <= 4) value = `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
      else value = `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
    setFormData({ ...formData, patientName: value });
    setShowPatientDropdown(true);
  };

  const filteredPatients = patients.filter(p => {
    if (!formData.patientName) return false;
    const query = sanitizeStr(formData.patientName);
    const originalQuery = formData.patientName.toLowerCase();

    // Name match (normalized)
    const nameMatch = sanitizeStr(p.name).includes(query);

    // Numeric/Date match - only if query contains numbers or slashes
    const hasNumbers = /[\d]/.test(originalQuery);
    const numbersOnly = originalQuery.replace(/\D/g, '');

    const dobMatch = (hasNumbers && p.birthDate) ? formatDate(p.birthDate).includes(originalQuery) : false;
    const cpfMatch = (numbersOnly.length > 2) ? p.cpf.replace(/\D/g, '').includes(numbersOnly) : false;

    return nameMatch || dobMatch || cpfMatch;
  });

  const handlePatientSelect = (patient: Patient) => {
    setFormData({
      ...formData,
      patientName: patient.name,
      phone: patient.phone || '',
      birthDate: patient.birthDate || '',
      cpf: patient.cpf || ''
    });
    setShowPatientDropdown(false);
  };

  const filteredProcedures = procedures.filter(p => {
    const matchesModality = !formData.modality || p.modality === formData.modality;
    if (!matchesModality) return false;

    if (!formData.procedure) return true;
    const query = sanitizeStr(formData.procedure);
    return sanitizeStr(p.name).includes(query);
  });

  const handleProcedureSelect = (proc: Procedure) => {
    setFormData({
      ...formData,
      procedure: proc.name,
      modality: proc.modality
    });
    setShowProcedureDropdown(false);
  };

  const doctorOptions = doctors
    .filter(d => d.type !== 'solicitante')
    .map(d => ({ id: d.id, name: d.name }));
  const insuranceOptions = [
    { id: 'bradesco', name: 'Bradesco' },
    { id: 'unimed', name: 'Unimed' },
    { id: 'sulamerica', name: 'SulAmérica' },
    { id: 'particular', name: 'Particular' },
  ];
  const modalityOptions = [
    { id: 'US', name: 'US (Ultrassom)' },
    { id: 'CR', name: 'CR (Raio-X)' },
    { id: 'CT', name: 'CT (Tomografia)' },
    { id: 'MG', name: 'MG (Mamografia)' },
    { id: 'MR', name: 'MR (Ressonância)' },
    { id: 'CONSULTA', name: 'Consulta' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Formulário de Agendamento</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Preencha os dados abaixo para realizar um novo agendamento.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {/* Patient Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <User size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Dados do Paciente</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Paciente</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nome ou data de nascimento (DD/MM/AAAA)"
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500"
                    value={formData.patientName}
                    onChange={handlePatientNameChange}
                    onFocus={() => setShowPatientDropdown(true)}
                    onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)}
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                </div>

                {showPatientDropdown && formData.patientName && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
                    {isVerifyingPatient ? (
                      <div className="p-6 sm:p-8 text-center animate-in fade-in duration-200">
                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-bold">Consultando base de dados...</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">Verificando disponibilidade</p>
                      </div>
                    ) : filteredPatients.length > 0 ? (
                      filteredPatients.map(patient => (
                        <div
                          key={patient.id}
                          className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors group"
                          onClick={() => handlePatientSelect(patient)}
                        >
                          <div className="font-medium text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{patient.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">DN: {formatDate(patient.birthDate)}</span>
                            {patient.cpf && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">CPF: {patient.cpf}</span>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 sm:p-8 text-center animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="relative w-16 h-16 mx-auto mb-4">
                          <div className="absolute inset-0 bg-indigo-600 rounded-2xl rotate-6 opacity-10 animate-pulse" />
                          <div className="absolute inset-0 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30 shadow-sm relative z-10">
                            <UserPlus size={28} className="text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center z-20">
                            <Plus size={10} className="text-white" />
                          </div>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Novo Paciente Identificado</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-[220px] mx-auto px-2">
                          Não localizamos este nome em nossa base. <span className="font-bold text-indigo-600 dark:text-indigo-400">Fique tranquilo:</span> ao salvar, criaremos o cadastro automaticamente para você.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Data de Nascimento</label>
                <div className="relative">
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-100 color-scheme-dark"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">CPF</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                  />
                  <ClipboardList className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Telefone para Contato</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                  />
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                </div>
              </div>
            </div>
          </section>

          {/* Medical Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Stethoscope size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Dados Médicos</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Médico Solicitante</label>
                <input
                  type="text"
                  placeholder="Nome do médico ou CRM"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500"
                  value={formData.referringDoctor}
                  onChange={(e) => setFormData({ ...formData, referringDoctor: e.target.value })}
                />
              </div>
              <CustomSelect
                label="Convênio"
                placeholder="Selecione o convênio"
                options={insuranceOptions}
                value={formData.insurance}
                onChange={(val) => setFormData({ ...formData, insurance: val })}
              />
            </div>
          </section>

          {/* Procedure Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <ClipboardList size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Procedimento</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <CustomSelect
                label="Médico Executante"
                placeholder="Selecione o médico"
                options={doctorOptions}
                value={formData.executingDoctor}
                onChange={(val) => setFormData({ ...formData, executingDoctor: val })}
              />
              <CustomSelect
                label="Modalidade"
                placeholder="Selecione"
                options={modalityOptions}
                value={formData.modality}
                onChange={(val) => setFormData({ ...formData, modality: val, procedure: '' })}
              />
              <div className="relative">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Procedimento</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ex: US Abdome Total"
                    className="w-full pl-4 pr-12 h-[41px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500"
                    value={formData.procedure}
                    onChange={(e) => {
                      setFormData({ ...formData, procedure: e.target.value });
                      setShowProcedureDropdown(true);
                    }}
                    onFocus={() => setShowProcedureDropdown(true)}
                    onBlur={() => setTimeout(() => setShowProcedureDropdown(false), 200)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.procedure) {
                        const proc = procedures.find(p => sanitizeStr(p.name) === sanitizeStr(formData.procedure)) || {
                          id: Math.random().toString(36).substr(2, 9),
                          name: formData.procedure,
                          modality: formData.modality || '---'
                        };
                        if (!formData.selectedProcedures.some(p => p.name === proc.name)) {
                          setFormData({
                            ...formData,
                            selectedProcedures: [...formData.selectedProcedures, proc],
                            procedure: ''
                          });
                        }
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Selected Procedures List */}
                {formData.selectedProcedures.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.selectedProcedures.map((proc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30 group animate-in slide-in-from-left-2 duration-200">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-500" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{proc.name}</span>
                          <span className="text-[9px] text-indigo-500 dark:text-indigo-400 uppercase font-black bg-indigo-100 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded">{proc.modality}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            selectedProcedures: formData.selectedProcedures.filter((_, i) => i !== idx)
                          })}
                          className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {showProcedureDropdown && (formData.procedure || formData.modality) && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
                    {filteredProcedures.length > 0 ? (
                      filteredProcedures.map(proc => (
                        <div
                          key={proc.id}
                          className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                          onClick={() => {
                            if (!formData.selectedProcedures.some(p => p.id === proc.id)) {
                              setFormData({
                                ...formData,
                                selectedProcedures: [...formData.selectedProcedures, proc],
                                procedure: ''
                              });
                            }
                            setShowProcedureDropdown(false);
                          }}
                        >
                          <div className="font-medium text-slate-900 dark:text-white text-sm">{proc.name}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold mt-0.5">{proc.modality}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 italic">
                        Novo procedimento será cadastrado.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Schedule Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Clock size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Data e Horário</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Data</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-100 color-scheme-dark"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Horário</label>
                <input
                  type="time"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-100 color-scheme-dark"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>
          </section>

          <div className="pt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button type="submit" className="flex items-center gap-2 px-6 sm:px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 dark:shadow-none">
              <Save size={18} />
              Salvar Agendamento
            </button>
          </div>
        </form>
      </div>

      {/* Overbook limit modal */}
      {showOverbookModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-white dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 mb-6 mx-auto">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">Limite de Encaixes Atingido</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 text-center leading-relaxed">
              O limite de <strong>{showOverbookModal} encaixe(s)</strong> por dia já foi atingido para este médico.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowOverbookModal(null)}
                className="w-full py-4 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all dark:shadow-none active:scale-[0.98]"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
