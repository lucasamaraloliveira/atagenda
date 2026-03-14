'use client';

import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, MoreVertical, UserPlus, RotateCcw, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { mockPatients, mockAppointments } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Patient } from '@/lib/types';
import PatientFormModal from './PatientFormModal';
import PatientHistoryModal from './PatientHistoryModal';
import { toast } from 'react-toastify';

export default function Patients({ searchQuery = '' }: { searchQuery?: string }) {
  const [selectedPatientForForm, setSelectedPatientForForm] = useState<Patient | null | 'new'>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [patientForHistory, setPatientForHistory] = useState<Patient | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0); 
  const [sortConfig, setSortConfig] = useState<{ key: keyof Patient; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: keyof Patient) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  const filteredPatients = mockPatients.filter(p => {
    const search = searchQuery.toLowerCase();
    const [year, month, day] = p.birthDate.split('-');
    const formattedDob = `${day}/${month}/${year}`;
    return p.name.toLowerCase().includes(search) || 
           p.cpf.includes(search) ||
           (p.recordNumber && p.recordNumber.toLowerCase().includes(search)) ||
           formattedDob.includes(search);
  }).sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const valA = a[key] || '';
    const valB = b[key] || '';
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSavePatient = (patientData: Patient) => {
    // Check for duplicate CPF
    const duplicateCPF = mockPatients.find(p => p.cpf === patientData.cpf && p.id !== patientData.id);
    if (duplicateCPF) {
      toast.error(`Já existe um paciente cadastrado com este CPF (${duplicateCPF.name})`);
      return;
    }

    const index = mockPatients.findIndex(p => p.id === patientData.id);
    if (index >= 0) {
      mockPatients[index] = patientData;
      toast.success('Dados do paciente atualizados!');
    } else {
      mockPatients.push(patientData);
      toast.success('Novo paciente cadastrado com sucesso!');
    }
    setSelectedPatientForForm(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleDeletePatient = () => {
    if (!patientToDelete) return;
    
    // Capture data for undo
    const patient = { ...patientToDelete };
    const appointments = mockAppointments.filter(app => app.patientId === patient.id);

    // 1. Remove from mockPatients
    const pIndex = mockPatients.findIndex(p => p.id === patient.id);
    if (pIndex >= 0) mockPatients.splice(pIndex, 1);
    
    // 2. Remove Appointments
    for (let i = mockAppointments.length - 1; i >= 0; i--) {
      if (mockAppointments[i].patientId === patient.id) {
        mockAppointments.splice(i, 1);
      }
    }
    
    toast.success(
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-bold">Paciente removido</p>
          <p className="text-[10px] opacity-80">{patient.name} e histórico excluídos.</p>
        </div>
        <button 
          onClick={() => {
            mockPatients.push(patient);
            mockAppointments.push(...appointments);
            setRefreshKey(prev => prev + 1);
            toast.info('Exclusão do paciente desfeita!');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-50 transition-colors shrink-0"
        >
          <RotateCcw size={14} /> Desfazer
        </button>
      </div>,
      { autoClose: 8000 }
    );

    setPatientToDelete(null);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6" key={refreshKey}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        <button 
          onClick={() => setSelectedPatientForForm('new')}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-[0.98]"
        >
          <UserPlus size={18} />
          Novo Paciente
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th 
                  className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Paciente
                    {sortConfig?.key === 'name' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('recordNumber')}
                >
                  <div className="flex items-center gap-2">
                    Prontuário
                    {sortConfig?.key === 'recordNumber' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('cpf')}
                >
                  <div className="flex items-center gap-2">
                    CPF
                    {sortConfig?.key === 'cpf' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('birthDate')}
                >
                  <div className="flex items-center gap-2">
                    Nascimento
                    {sortConfig?.key === 'birthDate' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('phone')}
                >
                  <div className="flex items-center gap-2">
                    Contato
                    {sortConfig?.key === 'phone' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-4 py-4 min-w-[200px]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                        {patient.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate text-sm">{patient.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{patient.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-indigo-600 font-mono whitespace-nowrap">
                    <span className="bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">{patient.recordNumber || '-'}</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600 font-mono whitespace-nowrap">
                    <span className="bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">{patient.cpf}</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500 font-medium whitespace-nowrap">
                    {patient.birthDate.split('-').reverse().join('/')}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500 font-medium whitespace-nowrap">{patient.phone}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <button 
                        onClick={() => setPatientForHistory(patient)}
                        className="p-2.5 hover:bg-white text-emerald-600 rounded-xl transition-all hover:shadow-md border border-transparent hover:border-emerald-100"
                        title="Ver Histórico"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => setSelectedPatientForForm(patient)}
                        className="p-2.5 hover:bg-white text-indigo-600 rounded-xl transition-all hover:shadow-md border border-transparent hover:border-indigo-100"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => setPatientToDelete(patient)}
                        className="p-2.5 hover:bg-white text-red-600 rounded-xl transition-all hover:shadow-md border border-transparent hover:border-red-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredPatients.map((patient) => (
            <div key={patient.id} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl">
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">{patient.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest bg-slate-50 px-2 py-0.5 rounded-md inline-block">
                        {patient.cpf}
                      </p>
                      <p className="text-[10px] text-indigo-600 uppercase font-bold tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
                        {patient.recordNumber}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPatientForHistory(patient)}
                    className="p-3 bg-emerald-50 text-emerald-600 rounded-xl active:scale-90 transition-all font-bold flex items-center gap-1"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    onClick={() => setSelectedPatientForForm(patient)}
                    className="p-3 bg-slate-50 text-indigo-600 rounded-xl active:scale-90 transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => setPatientToDelete(patient)}
                    className="p-3 bg-slate-50 text-red-600 rounded-xl active:scale-90 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1">Nascimento</p>
                  <p className="text-sm text-slate-700 font-bold">{patient.birthDate.split('-').reverse().join('/')}</p>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1">Telefone</p>
                  <p className="text-sm text-slate-700 font-bold">{patient.phone}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredPatients.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
              <UserPlus size={32} />
            </div>
            <p className="text-slate-500 font-medium italic">Nenhum paciente encontrado na sua busca.</p>
          </div>
        )}
      </div>

      {selectedPatientForForm && (
        <PatientFormModal 
          patient={selectedPatientForForm === 'new' ? null : selectedPatientForForm}
          onClose={() => setSelectedPatientForForm(null)}
          onSave={handleSavePatient}
        />
      )}

      {patientForHistory && (
        <PatientHistoryModal 
          patient={patientForHistory}
          onClose={() => setPatientForHistory(null)}
        />
      )}

      {/* Delete Confirmation */}
      {patientToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-white">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 text-red-500">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Excluir Paciente?</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-8">
              Esta ação removerá permanentemente o paciente <strong>{patientToDelete.name}</strong> e todos os seus históricos de agendamentos.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setPatientToDelete(null)}
                className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Manter
              </button>
              <button 
                onClick={handleDeletePatient}
                className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-100 transition-all active:scale-[0.98]"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
