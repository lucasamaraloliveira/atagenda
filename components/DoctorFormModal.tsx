'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, User, CreditCard, Stethoscope, Phone, Mail, ChevronDown } from 'lucide-react';
import { Doctor } from '@/lib/types';
import { cn } from '@/lib/utils';
import CustomSelect from './CustomSelect';

interface DoctorFormModalProps {
  doctor?: Doctor | null;
  onClose: () => void;
  onSave: (doctor: Doctor) => void;
}

export default function DoctorFormModal({ doctor, onClose, onSave }: DoctorFormModalProps) {
  const [formData, setFormData] = useState<Omit<Doctor, 'id'>>({
    name: '',
    crm: '',
    cpf: '',
    specialty: '',
    type: 'executante',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (doctor) {
      setFormData({
        name: doctor.name,
        crm: doctor.crm,
        cpf: doctor.cpf,
        specialty: doctor.specialty,
        type: doctor.type,
        phone: doctor.phone,
        email: doctor.email,
      });
    }
  }, [doctor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(doctor?.id ? { id: doctor.id } : {}),
      ...formData,
    } as Doctor);
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh] border border-white dark:border-slate-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{doctor ? 'Editar Médico' : 'Novo Médico'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Prencha as informações cadastrais do profissional</p>
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
                  placeholder="Nome do médico"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              </div>
            </div>

            {/* CRM & CPF */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">CRM</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    required
                    value={formData.crm}
                    onChange={(e) => setFormData({...formData, crm: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500"
                    placeholder="00000"
                  />
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                </div>
              </div>
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
            </div>

            {/* Especialidade & Tipo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Especialidade</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    required
                    value={formData.specialty}
                    onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500"
                    placeholder="Ex: Cardiologia"
                  />
                  <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Tipo de Atuação</label>
                <CustomSelect 
                  options={[
                    { id: 'executante', name: 'Executante' },
                    { id: 'solicitante', name: 'Solicitante' },
                    { id: 'ambos', name: 'Ambos' },
                  ]}
                  value={formData.type}
                  onChange={(val) => setFormData({...formData, type: val as any})}
                />
              </div>
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
                    placeholder="medico@exemplo.com"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 transition-colors">
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
              {doctor ? 'Salvar Alterações' : 'Cadastrar Médico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
