'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, MoreVertical, UserPlus, RotateCcw, ChevronUp, ChevronDown, Eye, ChevronLeft, ChevronRight, LayoutGrid, List, Upload } from 'lucide-react';
import { mockPatients as _mockPatients } from '@/lib/mockData';
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load patients from Firebase
  useEffect(() => {
    async function loadPatients() {
      try {
        setLoading(true);
        const data = await firebaseService.getPatients();
        setPatients(data); 
      } catch (err) {
        console.warn('Failed to load patients from Firebase:', err);
        setPatients(_mockPatients);
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

  const handleDeletePatient = async () => {
    if (!patientToDelete) return;
    const idToRemove = patientToDelete.id;
    
    // Optimistic UI update: remove from local state immediately
    setPatients(prev => prev.filter(p => p.id !== idToRemove));
    setPatientToDelete(null);

    try {
      await firebaseService.deletePatient(idToRemove);
      toast.success('Paciente removido com sucesso');
      // Still trigger a background refresh to be safe and synced
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Error deleting patient:', err);
      toast.error('Erro ao excluir no servidor. Recarregando...');
      setRefreshKey(prev => prev + 1); // Re-sync to restore if failed
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
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-slate-800 rounded-xl text-sm font-bold hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-[0.98]"
          >
            <Upload size={18} />
            Importar
          </button>
          <button 
            onClick={() => setSelectedPatientForForm('new')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm active:scale-[0.98]"
          >
            <UserPlus size={18} />
            Novo Paciente
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedPatients.map((patient) => (
            <div key={patient.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-bl-[3rem] -mr-8 -mt-8" />
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                  {patient.name.charAt(0)}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => setPatientForHistory(patient)} className="p-2 hover:bg-indigo-50 dark:hover:bg-slate-800 text-emerald-600 rounded-lg"><Eye size={16} /></button>
                  <button onClick={() => setSelectedPatientForForm(patient)} className="p-2 hover:bg-indigo-50 dark:hover:bg-slate-800 text-indigo-600 rounded-lg"><Edit2 size={16} /></button>
                  <button onClick={() => setPatientToDelete(patient)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg truncate">{patient.name}</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest mb-4">Prontuário: {patient.recordNumber || 'N/A'}</p>
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between text-xs"><span className="text-slate-400">CPF</span><span className="font-bold dark:text-slate-200">{patient.cpf}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-400">Nasc.</span><span className="font-bold dark:text-slate-200">{patient.birthDate.split('-').reverse().join('/')}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-400">WhatsApp</span><span className="font-bold text-emerald-600">{patient.phone}</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden overflow-x-auto shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('name')}>Paciente</th>
                <th className="px-6 py-4">Prontuário</th>
                <th className="px-6 py-4">CPF</th>
                <th className="px-6 py-4">Nasc.</th>
                <th className="px-6 py-4">Ações</th>
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
                  <td className="px-6 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
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
        <ImportPatientsModal onClose={() => setShowImportModal(false)} onImport={(data) => { setPatients(prev => [...prev, ...data]); setShowImportModal(false); }} existingPatients={patients} />
      )}
      {patientToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] max-w-sm w-full">
            <h3 className="text-xl font-bold mb-2">Excluir Paciente?</h3>
            <p className="text-sm text-slate-500 mb-6">Deseja realmente remover {patientToDelete.name}?</p>
            <div className="flex gap-3">
              <button onClick={() => setPatientToDelete(null)} className="flex-1 py-3 text-slate-500 font-bold">Cancelar</button>
              <button onClick={handleDeletePatient} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
