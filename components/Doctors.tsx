'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, UserRound, Stethoscope, RotateCcw, LayoutGrid, List, ChevronUp, ChevronDown, Settings, Upload, Info, FileDown, X, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { firebaseService } from '@/lib/firebaseService';
import { cn, normalizeString } from '@/lib/utils';
import { Doctor } from '@/lib/types';
import DoctorScheduleModal from './DoctorScheduleModal';
import DoctorFormModal from './DoctorFormModal';
import ImportDoctorsModal from './ImportDoctorsModal';
import { toast } from 'react-toastify';

export default function Doctors({ searchQuery = '' }: { searchQuery?: string }) {
  const [selectedDoctorForSchedule, setSelectedDoctorForSchedule] = useState<Doctor | null>(null);
  const [selectedDoctorForForm, setSelectedDoctorForForm] = useState<Doctor | null | 'new'>(null);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Doctor; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showImportModal, setShowImportModal] = useState(false);

  // Load doctors from Firebase
  React.useEffect(() => {
    async function loadDoctors() {
      try {
        setLoading(true);
        const data = await firebaseService.getDoctors();
        setDoctors(data); 
      } catch (err) {
        console.warn('Failed to load doctors from Firebase:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDoctors();
  }, [refreshKey]);

  const handleSort = (key: keyof Doctor) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const filteredDoctors = doctors.filter(d => {
    const search = normalizeString(searchQuery);
    return normalizeString(d.name).includes(search) ||
           d.crm.includes(searchQuery) ||
           normalizeString(d.specialty).includes(search);
  }).sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const paginatedDoctors = filteredDoctors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when searching
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSaveDoctor = async (doctorData: Doctor) => {
    try {
      const index = doctors.findIndex(d => d.id === doctorData.id);
      if (index >= 0) {
        await firebaseService.updateDoctor(doctorData.id, doctorData);
        toast.success('Informações do médico atualizadas!');
      } else {
        await firebaseService.createDoctor(doctorData as any);
        toast.success('Novo médico cadastrado com sucesso!');
      }
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      toast.error(`Falha ao salvar: ${err.message}`);
    }
    setSelectedDoctorForForm(null);
  };

  const handleImportDoctors = async (importedDoctors: Doctor[]) => {
    try {
      for (const doc of importedDoctors) {
        await firebaseService.createDoctor(doc as any);
      }
      toast.success(`${importedDoctors.length} médicos importados com sucesso!`);
      const data = await firebaseService.getDoctors();
      setDoctors(data);
    } catch (err) {
      toast.error('Erro ao importar alguns médicos.');
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  // Set grid as default on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setViewMode('grid');
    }
  }, []);
  const handleDeleteDoctor = async () => {
    if (!doctorToDelete || isDeleting) return;
    const idToRemove = doctorToDelete.id;
    const previousDoctors = [...doctors];
    
    setIsDeleting(true);

    try {
      // 1. OPTIMISTIC UI: Remove from list immediately
      setDoctors(prev => prev.filter(d => d.id !== idToRemove));
      setDoctorToDelete(null);

      // 2. Perform deletion on server
      await firebaseService.deleteDoctor(idToRemove);
      
      toast.success('Médico removido com sucesso!');
      
      // 3. DO NOT re-fetch immediately.
    } catch (err) {
      console.error('Error deleting doctor:', err);
      toast.error('Falha ao excluir médico no servidor. Restaurando...');
      // Rollback if failed
      setDoctors(previousDoctors);
    } finally {
      setIsDeleting(false);
      setDoctorToDelete(null);
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
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-3 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 shadow-sm rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
          >
            <Upload size={16} />
            Importar
          </button>
          <button 
            onClick={() => setSelectedDoctorForForm('new')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none active:scale-[0.98]"
          >
            <Plus size={16} />
            Novo Médico
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paginatedDoctors.map((doctor) => (
            <div key={doctor.id} className="bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-indigo-500/10 dark:shadow-none transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-bl-[3rem] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-100 dark:shadow-none">
                    <UserRound size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-slate-100 text-base leading-tight truncate max-w-[150px] sm:max-w-none">{doctor.name}</h3>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest">{doctor.specialty}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setSelectedDoctorForForm(doctor)} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => setDoctorToDelete(doctor)} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-red-600 rounded-xl hover:bg-red-50 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
              
              <div className="relative z-10 pt-4 border-t border-slate-50 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">CRM</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{doctor.crm}</p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Atuação</p>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">{doctor.type}</p>
                  </div>
                </div>
              </div>

              {doctor.type !== 'solicitante' && (
                <button 
                  onClick={() => setSelectedDoctorForSchedule(doctor)}
                  className="w-full mt-6 py-4 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all relative z-10"
                >
                  Configurar Grade de Horários
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all mb-8">
          {/* Mobile List View */}
          <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedDoctors.map((doctor) => (
              <div key={doctor.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-inner">
                      <UserRound size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{doctor.name}</p>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest">{doctor.specialty}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {doctor.type !== 'solicitante' && (
                      <button onClick={() => setSelectedDoctorForSchedule(doctor)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 rounded-lg transition-colors"><Settings size={16} /></button>
                    )}
                    <button onClick={() => setSelectedDoctorForForm(doctor)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={() => setDoctorToDelete(doctor)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="flex gap-4 pl-[52px]">
                  <div className="space-y-0.5">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">CRM</p>
                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono">{doctor.crm}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Atuação</p>
                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">{doctor.type}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <table className="hidden sm:table w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th 
                  className="px-6 sm:px-8 py-5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Médico
                    {sortConfig?.key === 'name' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 sm:px-8 py-5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  onClick={() => handleSort('specialty')}
                >
                  <div className="flex items-center gap-2">
                    Especialidade
                    {sortConfig?.key === 'specialty' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 sm:px-8 py-5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  onClick={() => handleSort('crm')}
                >
                  <div className="flex items-center gap-2">
                    CRM
                    {sortConfig?.key === 'crm' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th className="px-6 sm:px-8 py-5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Atuação</th>
                <th className="px-6 sm:px-8 py-5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {paginatedDoctors.map((doctor) => (
                <tr key={doctor.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                  <td className="px-6 sm:px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-inner">
                        <UserRound size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{doctor.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{doctor.cpf}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 sm:px-8 py-4">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg uppercase tracking-wider">
                      {doctor.specialty}
                    </span>
                  </td>
                  <td className="px-6 sm:px-8 py-4">
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
                      {doctor.crm}
                    </span>
                  </td>
                  <td className="px-6 sm:px-8 py-4">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md shrink-0">
                      {doctor.type}
                    </span>
                  </td>
                  <td className="px-6 sm:px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      {doctor.type !== 'solicitante' && (
                        <button 
                          onClick={() => setSelectedDoctorForSchedule(doctor)}
                          className="p-2.5 hover:bg-white dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all hover:shadow-md border border-transparent hover:border-indigo-100 dark:hover:border-slate-700"
                          title="Escala de Horários"
                        >
                          <Settings size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedDoctorForForm(doctor)}
                        className="p-2.5 hover:bg-white dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all hover:shadow-md border border-transparent hover:border-indigo-100 dark:hover:border-slate-700"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => setDoctorToDelete(doctor)}
                        className="p-2.5 hover:bg-white dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all hover:shadow-md border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                        title="Excluir"
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
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
            Mostrando <strong>{paginatedDoctors.length}</strong> de <strong>{filteredDoctors.length}</strong> médicos.
          </p>
          
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "w-10 h-10 rounded-xl text-xs font-bold transition-all",
                    currentPage === page 
                      ? "bg-indigo-600 text-white dark:shadow-none" 
                      : "text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                  )}
                >
                  {page}
                </button>
              ))}
            </div>

            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
      
      {filteredDoctors.length === 0 && (
        <div className="bg-white dark:bg-slate-900 p-20 text-center rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-inner">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
            <UserRound size={32} />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium italic">Nenhum médico encontrado na sua busca.</p>
        </div>
      )}

      {selectedDoctorForSchedule && (
        <DoctorScheduleModal 
          doctor={selectedDoctorForSchedule} 
          onClose={() => setSelectedDoctorForSchedule(null)} 
        />
      )}

      {selectedDoctorForForm && (
        <DoctorFormModal 
          doctor={selectedDoctorForForm === 'new' ? null : selectedDoctorForForm}
          onClose={() => setSelectedDoctorForForm(null)}
          onSave={handleSaveDoctor}
        />
      )}

      {showImportModal && (
        <ImportDoctorsModal 
          onClose={() => setShowImportModal(false)}
          onImport={handleImportDoctors}
          existingDoctors={doctors}
        />
      )}

      {/* Delete Confirmation */}
      {doctorToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-white dark:border-slate-800">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 text-red-500 dark:text-red-400">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Excluir Médico?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
              Esta ação é <span className="text-red-600 dark:text-red-400 font-bold underline">irreversível</span>. 
              Ao excluir o <strong>Dr(a). {doctorToDelete.name}</strong>, todos os agendamentos, escalas e bloqueios vinculados também serão removidos permanentemente.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDoctorToDelete(null)}
                className="flex-1 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                disabled={isDeleting}
              >
                Manter
              </button>
              <button 
                onClick={handleDeleteDoctor}
                disabled={isDeleting}
                className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-100 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Excluindo...</>
                ) : 'Excluir Tudo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
