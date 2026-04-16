'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, User, CreditCard, Calendar, Phone, Mail, ChevronDown, Hash } from 'lucide-react';
import { Patient } from '@/lib/types';
import CustomSelect from './CustomSelect';

interface PatientFormModalProps {
  patient?: Patient | null;
  onClose: () => void;
  onSave: (patient: Patient) => void;
}

export default function PatientFormModal({ patient, onClose, onSave }: PatientFormModalProps) {
  const [formData, setFormData] = useState<Omit<Patient, 'id'>>({
    name: '',
    cpf: '',
    birthDate: '',
    gender: 'Feminino',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name,
        cpf: patient.cpf,
        birthDate: patient.birthDate,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
      });
    }
  }, [patient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let recordNumber = patient?.recordNumber;
    if (!recordNumber && !patient) {
      recordNumber = `PR-${Date.now().toString().slice(-6)}`;
    }

    onSave({
      ...(patient?.id ? { id: patient.id } : {}),
      recordNumber,
      ...formData,
    } as Patient);
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    }
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh] border border-white dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{patient ? 'Editar Paciente' : 'Novo Paciente'}</h2>
              {patient?.recordNumber && (
                <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  #{patient.recordNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Prencha as informações cadastrais do paciente</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-4">
          <div className="space-y-4">
            {/* Nome */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
              <div className="relative group">
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500"
                  placeholder="Nome do paciente"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              </div>
            </div>

            {/* CPF & Nascimento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">CPF</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    required
                    value={formData.cpf}
                    onChange={(e) => setFormData({...formData, cpf: formatCPF(e.target.value)})}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500"
                    placeholder="000.000.000-00"
                  />
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Data de Nascimento</label>
                <div className="relative group">
                    <input 
                      type="date" 
                      required
                      value={formData.birthDate}
                      onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-100 dark:[color-scheme:dark]"
                    />
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                </div>
              </div>
            </div>

            {/* Gênero */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Gênero</label>
              <CustomSelect 
                options={[
                  { id: 'Feminino', name: 'Feminino' },
                  { id: 'Masculino', name: 'Masculino' },
                  { id: 'Outro', name: 'Outro' },
                ]}
                value={formData.gender}
                onChange={(val) => setFormData({...formData, gender: val})}
              />
            </div>

            {/* Contato */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Telefone</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: formatPhone(e.target.value)})}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500"
                    placeholder="(00) 00000-0000"
                  />
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                <div className="relative group">
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500"
                    placeholder="paciente@exemplo.com"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex items-center gap-2 px-5 sm:px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all dark:shadow-none"
            >
              <Save size={18} />
              {patient ? 'Salvar Alterações' : 'Cadastrar Paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
