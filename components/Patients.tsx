'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, MoreVertical, UserPlus, RotateCcw, ChevronUp, ChevronDown, Eye, ChevronLeft, ChevronRight, LayoutGrid, List, Upload } from 'lucide-react';
import { firebaseService } from '@/lib/firebaseService';
import { cn, normalizeString } from '@/lib/utils';
import { Patient } from '@/lib/types';
import PatientFormModal from './PatientFormModal';
import PatientHistoryModal from './PatientHistoryModal';
import ImportPatientsModal from './ImportPatientsModal';
import { toast } from 'react-toastify';

export default function Patients({ searchQuery = '' }: { searchQuery?: string }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientForForm, setSelectedPatientForForm] = useState<Patient | null | 'new'>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [patientForHistory, setPatientForHistory] = useState<Patient | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0); 
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Patient; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showImportModal, setShowImportModal] = useState(false);

  // Load patients from Firebase
  useEffect(() => {
    async function loadPatients() {
      try {
        setLoading(true);
        const data = await firebaseService.getPatients();
        setPatients(data);
      } catch (err) {
        console.error('Failed to load patients:', err);
        toast.error('Erro ao carregar pacientes');
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, [refreshKey]);

  const handleSort = (key: keyof Patient) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredPatients = patients.filter(p => {
    const search = normalizeString(searchQuery);
    return normalizeString(p.name).includes(search) || 
           p.cpf.includes(search) ||
           (p.recordNumber && normalizeString(p.recordNumber).includes(search));
  }).sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const valA = a[key] || '';
    const valB = b[key] || '';
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSavePatient = async (patientData: Patient) => {
    const duplicateCPF = patients.find(p => p.cpf === patientData.cpf && p.id !== patientData.id);
    if (duplicateCPF) {
      toast.error(`Já existe um paciente cadastrado com este CPF (${duplicateCPF.name})`);
      return;
    }

    try {
      if (patientData.id) {
        await firebaseService.updatePatient(patientData.id, patientData);
        toast.success('Paciente atualizado!');
      } else {
        await firebaseService.createPatient(patientData as any);
        toast.success('Paciente salvo!');
      }
      setRefreshKey(prev => prev + 1);
      setSelectedPatientForForm(null);
    } catch (err) {
      toast.error('Erro ao salvar paciente.');
    }
  };

  const handleImportPatients = async (importedPatients: Patient[]) => {
    try {
      for (const p of importedPatients) {
        await firebaseService.createPatient(p as any);
      }
      toast.success(`${importedPatients.length} pacientes importados com sucesso!`);
      const data = await firebaseService.getPatients();
      setPatients(data);
    } catch (err) {
      toast.error('Erro ao importar lista de pacientes.');
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  // Set grid as default on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setViewMode('grid');
    }
  }, []);
  const handleDeletePatient = async () => {
    if (!patientToDelete || isDeleting) return;
    const idToRemove = patientToDelete.id;
    const previousPatients = [...patients];
    
    setIsDeleting(true);

    try {
      // 1. OPTIMISTIC UI: Remove from list immediately
      setPatients(prev => prev.filter(p => p.id !== idToRemove));
      setPatientToDelete(null);

      // 2. Perform deletion on server
      await firebaseService.deletePatient(idToRemove);
      
      toast.success('Paciente removido com sucesso!');
      
      // 3. DO NOT re-fetch immediately. The local state is already correct.
      // Re-fetching too soon can sometimes return stale data from Firestore query indexes.
    } catch (err) {
      console.error('Error deleting patient:', err);
      toast.error('Falha ao excluir paciente no servidor. Restaurando...');
      // Rollback if failed
      setPatients(previousPatients);
    } finally {
      setIsDeleting(false);
      setPatientToDelete(null);
    }
  };

  return (
    <div className="space-y-6" key={refreshKey}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 border border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-2 rounded-lg transition-all",
              viewMode === 'grid' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
            title="Visualização em Blocos"
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={cn(
              "p-2 rounded-lg transition-all",
              viewMode === 'list' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
            title="Visualização em Lista"
          >
            <List size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 shadow-sm rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
          >
            <Upload size={16} />
            Importar
          </button>
          <button 
            onClick={() => setSelectedPatientForForm('new')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none active:scale-[0.98]"
          >
            <UserPlus size={16} />
            Novo Paciente
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedPatients.map((patient) => (
            <div key={patient.id} className="bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-bl-[3rem] -mr-8 -mt-8" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-100 dark:shadow-none">
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-slate-100 text-base leading-tight truncate max-w-[150px] sm:max-w-none">{patient.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{patient.recordNumber || 'PR-000'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setPatientForHistory(patient)} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors"><Eye size={16} /></button>
                  <button onClick={() => setSelectedPatientForForm(patient)} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => setPatientToDelete(patient)} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-red-600 rounded-xl hover:bg-red-50 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="relative z-10 pt-4 border-t border-slate-50 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">CPF</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{patient.cpf}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nascimento</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{patient.birthDate.split('-').reverse().join('/')}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
          {/* Mobile List View */}
          <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedPatients.map((patient) => (
              <div key={patient.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{patient.name}</p>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest">{patient.recordNumber || 'PR-000'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setPatientForHistory(patient)} className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"><Eye size={16} /></button>
                    <button onClick={() => setSelectedPatientForForm(patient)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={() => setPatientToDelete(patient)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="flex gap-4 pl-[52px]">
                  <div className="space-y-0.5">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">CPF</p>
                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono">{patient.cpf}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Nascimento</p>
                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{patient.birthDate.split('-').reverse().join('/')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <table className="hidden sm:table w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('name')}>Paciente</th>
                <th className="px-6 py-4">Prontuário</th>
                <th className="px-6 py-4">CPF</th>
                <th className="px-6 py-4">Nasc.</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {paginatedPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 group transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">{patient.name.charAt(0)}</div>
                      <span className="font-bold text-slate-700 dark:text-slate-200 text-sm whitespace-nowrap">{patient.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-xs font-bold text-indigo-600 dark:text-indigo-400">{patient.recordNumber || '-'}</td>
                  <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-400 font-mono">{patient.cpf}</td>
                  <td className="px-6 py-3 text-xs text-slate-500 dark:text-slate-400">{patient.birthDate.split('-').reverse().join('/')}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => setPatientForHistory(patient)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg"><Eye size={14} /></button>
                      <button onClick={() => setSelectedPatientForForm(patient)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"><Edit2 size={14} /></button>
                      <button onClick={() => setPatientToDelete(patient)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 bg-white dark:bg-slate-800 border rounded-lg disabled:opacity-50">Anterior</button>
          <span className="px-4 py-2 font-bold">{currentPage} / {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 bg-white dark:bg-slate-800 border rounded-lg disabled:opacity-50">Próximo</button>
        </div>
      )}

      {selectedPatientForForm && (
        <PatientFormModal 
          patient={selectedPatientForForm === 'new' ? null : selectedPatientForForm}
          onClose={() => setSelectedPatientForForm(null)}
          onSave={handleSavePatient}
        />
      )}
      {patientForHistory && (
        <PatientHistoryModal patient={patientForHistory} onClose={() => setPatientForHistory(null)} />
      )}

      {showImportModal && (
        <ImportPatientsModal 
          onClose={() => setShowImportModal(false)}
          onImport={handleImportPatients}
          existingPatients={patients}
        />
      )}
      {patientToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] max-w-sm w-full">
            <h3 className="text-xl font-bold mb-2">Excluir Paciente?</h3>
            <p className="text-sm text-slate-500 mb-6">Deseja realmente remover {patientToDelete.name}?</p>
            <div className="flex gap-3">
              <button onClick={() => setPatientToDelete(null)} className="flex-1 py-3 text-slate-500 font-bold" disabled={isDeleting}>Cancelar</button>
              <button onClick={handleDeletePatient} disabled={isDeleting} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isDeleting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Excluindo...</>
                ) : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
