'use client';

import React, { useState } from 'react';
import { Search, Plus, Save, X, User, Phone, Stethoscope, ClipboardList, Clock, ChevronDown, UserPlus } from 'lucide-react';
import { mockPatients, mockDoctors, mockAppointments, mockScheduleConfigs, mockProcedures } from '@/lib/mockData';
import CustomSelect from './CustomSelect';
import { toast } from 'react-toastify';
import { isTimeOverbook } from './Agenda';
import { parse } from 'date-fns';

interface NewAppointmentProps {
  initialData?: { date?: string, time?: string, doctorId?: string } | null;
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
    birthDate: '',
    cpf: ''
  });

  const [isVerifyingPatient, setIsVerifyingPatient] = useState(false);
  const [showOverbookModal, setShowOverbookModal] = useState<number | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showProcedureDropdown, setShowProcedureDropdown] = useState(false);

  const sanitizeStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  React.useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        date: initialData.date || prev.date,
        time: initialData.time || prev.time,
        executingDoctor: initialData.doctorId || prev.executingDoctor
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find or create patient
    let patientId = mockPatients.find(p => p.name === formData.patientName)?.id;
    if (!patientId) {
      patientId = Math.random().toString(36).substr(2, 9);
      mockPatients.push({
        id: patientId,
        name: formData.patientName,
        cpf: formData.cpf,
        birthDate: formData.birthDate,
        gender: '',
        phone: formData.phone,
        email: ''
      });
    }

    // Find or create procedure
    let procedure = mockProcedures.find(p => sanitizeStr(p.name) === sanitizeStr(formData.procedure));
    if (!procedure) {
      procedure = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.procedure,
        category: 'Geral', // Default
        modality: formData.modality || 'Não Definida',
        price: '0.00'
      };
      mockProcedures.push(procedure);
    }

    // Check for overbook limit
    const appDate = parse(formData.date, 'yyyy-MM-dd', new Date());
    const isOverbook = isTimeOverbook(formData.executingDoctor, appDate, formData.time);
    
    if (isOverbook) {
      const config = mockScheduleConfigs.find(c => c.doctorId === formData.executingDoctor);
      const limit = config?.maxOverbooksPerDay || 0;
      
      const dailyOverbooks = mockAppointments.filter(app => 
        app.doctorId === formData.executingDoctor && 
        app.date === formData.date &&
        isTimeOverbook(app.doctorId, parse(app.date, 'yyyy-MM-dd', new Date()), app.time)
      ).length;

      if (dailyOverbooks >= limit) {
        setShowOverbookModal(limit);
        return;
      }
    }

    // Create appointment
    const newAppointment = {
      id: Math.random().toString(36).substr(2, 9),
      patientId,
      doctorId: formData.executingDoctor,
      date: formData.date,
      time: formData.time,
      procedure: formData.procedure || 'Consulta',
      insurance: formData.insurance || 'Particular',
      status: 'agendado' as const
    };

    mockAppointments.push(newAppointment);
    
    toast.success('Agendamento criado com sucesso!');

    if (onCancel) {
      onCancel(); // Go back to agenda
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
    setFormData({...formData, patientName: value});
    setShowPatientDropdown(true);
  };

  const filteredPatients = mockPatients.filter(p => {
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

  const handlePatientSelect = (patient: typeof mockPatients[0]) => {
    setFormData({
      ...formData,
      patientName: patient.name,
      phone: patient.phone || '',
      birthDate: patient.birthDate || '',
      cpf: patient.cpf || ''
    });
    setShowPatientDropdown(false);
  };

  const filteredProcedures = mockProcedures.filter(p => {
    const matchesModality = !formData.modality || p.modality === formData.modality;
    if (!matchesModality) return false;

    if (!formData.procedure) return true;
    const query = sanitizeStr(formData.procedure);
    return sanitizeStr(p.name).includes(query);
  });

  const handleProcedureSelect = (proc: typeof mockProcedures[0]) => {
    setFormData({
      ...formData,
      procedure: proc.name,
      modality: proc.modality
    });
    setShowProcedureDropdown(false);
  };

  const doctorOptions = mockDoctors.map(d => ({ id: d.id, name: d.name }));
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900">Formulário de Agendamento</h2>
          <p className="text-sm text-slate-500">Preencha os dados abaixo para realizar um novo agendamento.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Patient Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <User size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Dados do Paciente</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Paciente</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Nome ou data de nascimento (DD/MM/AAAA)"
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    value={formData.patientName}
                    onChange={handlePatientNameChange}
                    onFocus={() => setShowPatientDropdown(true)}
                    onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)}
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
                
                {showPatientDropdown && formData.patientName && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {isVerifyingPatient ? (
                      <div className="p-8 text-center animate-in fade-in duration-200">
                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-sm text-slate-600 font-bold">Consultando base de dados...</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Verificando disponibilidade</p>
                      </div>
                    ) : filteredPatients.length > 0 ? (
                      filteredPatients.map(patient => (
                        <div 
                          key={patient.id}
                          className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors group"
                          onClick={() => handlePatientSelect(patient)}
                        >
                          <div className="font-medium text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{patient.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">DN: {formatDate(patient.birthDate)}</span>
                            {patient.cpf && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">CPF: {patient.cpf}</span>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="relative w-16 h-16 mx-auto mb-4">
                          <div className="absolute inset-0 bg-indigo-600 rounded-2xl rotate-6 opacity-10 animate-pulse" />
                          <div className="absolute inset-0 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm relative z-10">
                            <UserPlus size={28} className="text-indigo-600" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center z-20">
                            <Plus size={10} className="text-white" />
                          </div>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">Novo Paciente Identificado</h4>
                        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed max-w-[220px] mx-auto px-2">
                          Não localizamos este nome em nossa base. <span className="font-bold text-indigo-600/80">Fique tranquilo:</span> ao salvar, criaremos o cadastro automaticamente para você.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Data de Nascimento</label>
                <div className="relative">
                  <input 
                    type="date" 
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                  />
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    value={formData.cpf}
                    onChange={(e) => setFormData({...formData, cpf: formatCPF(e.target.value)})}
                  />
                  <ClipboardList className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Telefone para Contato</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: formatPhone(e.target.value)})}
                  />
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Médico Solicitante</label>
                <input 
                  type="text" 
                  placeholder="Nome do médico ou CRM"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.referringDoctor}
                  onChange={(e) => setFormData({...formData, referringDoctor: e.target.value})}
                />
              </div>
              <CustomSelect 
                label="Convênio"
                placeholder="Selecione o convênio"
                options={insuranceOptions}
                value={formData.insurance}
                onChange={(val) => setFormData({...formData, insurance: val})}
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
                onChange={(val) => setFormData({...formData, executingDoctor: val})}
              />
              <CustomSelect 
                label="Modalidade"
                placeholder="Selecione"
                options={modalityOptions}
                value={formData.modality}
                onChange={(val) => setFormData({...formData, modality: val, procedure: ''})}
              />
              <div className="relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Procedimento</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Ex: US Abdome Total"
                    className="w-full px-4 h-[41px] bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    value={formData.procedure}
                    onChange={(e) => {
                      setFormData({...formData, procedure: e.target.value});
                      setShowProcedureDropdown(true);
                    }}
                    onFocus={() => setShowProcedureDropdown(true)}
                    onBlur={() => setTimeout(() => setShowProcedureDropdown(false), 200)}
                  />
                </div>

                {showProcedureDropdown && (formData.procedure || formData.modality) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {filteredProcedures.length > 0 ? (
                      filteredProcedures.map(proc => (
                        <div 
                          key={proc.id}
                          className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                          onClick={() => handleProcedureSelect(proc)}
                        >
                          <div className="font-medium text-slate-900 text-sm">{proc.name}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">{proc.modality}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-500 italic">
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Data</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Horário</label>
                <input 
                  type="time" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
              </div>
            </div>
          </section>

          <div className="pt-6 flex items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={onCancel}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button type="submit" className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200">
              <Save size={18} />
              Salvar Agendamento
            </button>
          </div>
        </form>
      </div>

      {/* Overbook limit modal */}
      {showOverbookModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Limite de Encaixes Atingido</h3>
            <p className="text-sm text-slate-600 mb-6">
              O limite de {showOverbookModal} encaixe(s) por dia já foi atingido para este médico.
            </p>
            <div className="flex justify-end">
              <button 
                onClick={() => setShowOverbookModal(null)}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
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
