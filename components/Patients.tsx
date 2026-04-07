'use client';

import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, MoreVertical, UserPlus, RotateCcw, ChevronUp, ChevronDown, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockPatients as _mockPatients, mockAppointments as _mockAppointments } from '@/lib/mockData';
import { firebaseService } from '@/lib/firebaseService';
import { cn, normalizeString } from '@/lib/utils';
import { Patient } from '@/lib/types';
import PatientFormModal from './PatientFormModal';
import PatientHistoryModal from './PatientHistoryModal';
import ImportPatientsModal from './ImportPatientsModal';
import { toast } from 'react-toastify';
import { Upload } from 'lucide-react';

export default function Patients({ searchQuery = '' }: { searchQuery?: string }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientForForm, setSelectedPatientForForm] = useState<Patient | null | 'new'>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [patientForHistory, setPatientForHistory] = useState<Patient | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0); 
  const [sortConfig, setSortConfig] = useState<{ key: keyof Patient; direction: 'asc' | 'desc' } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load patients from Firebase Firestore
  React.useEffect(() => {
    async function loadPatients() {
      try {
        setLoading(true);
        const data = await firebaseService.getPatients();
        setPatients(data.length > 0 ? data : _mockPatients);
      } catch (err) {
        console.warn('Failed to load patients from Firebase:', err);
        setPatients(_mockPatients);
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, [refreshKey]);

  const currentPatients = patients;

  const handleSort = (key: keyof Patient) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  const filteredPatients = currentPatients.filter(p => {
    const search = normalizeString(searchQuery);
    const [year, month, day] = p.birthDate.split('-');
    const formattedDob = `${day}/${month}/${year}`;
    return normalizeString(p.name).includes(search) || 
           p.cpf.includes(search) ||
           (p.recordNumber && normalizeString(p.recordNumber).includes(search)) ||
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

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when searching
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSavePatient = (patientData: Patient) => {
    // Check for duplicate CPF
    const duplicateCPF = currentPatients.find((p: Patient) => p.cpf === patientData.cpf && p.id !== patientData.id);
    if (duplicateCPF) {
      toast.error(`Já existe um paciente cadastrado com este CPF (${duplicateCPF.name})`);
      return;
    }

    const index = currentPatients.findIndex(p => p.id === patientData.id);
    if (index >= 0) {
      // Update logic Firebase
      firebaseService.updatePatient(patientData.id, patientData)
        .then(() => {
          toast.success('Paciente atualizado com sucesso!');
          setRefreshKey(prev => prev + 1);
        })
        .catch(err => toast.error('Erro ao atualizar paciente.'));
    } else {
      firebaseService.createPatient(patientData as any)
        .then(() => {
            toast.success('Paciente salvo com sucesso!');
            setRefreshKey(prev => prev + 1);
        })
        .catch((err) => {
            console.error('Erro detalhado Firebase (Patient):', err);
            toast.error(`Falha ao salvar: ${err.message}`);
        });
    }
    setSelectedPatientForForm(null);
  };

  const handleImportPatients = (importedPatients: Patient[]) => {
    _mockPatients.push(...importedPatients);
    setRefreshKey(prev => prev + 1);
  };

  const handleDeletePatient = async () => {
    if (!patientToDelete) return;
    
    const patient = { ...patientToDelete };
    
    try {
        // 1. Exclusão no Firebase
        await firebaseService.deletePatient(patient.id);
        
        toast.success(
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="font-bold">Paciente removido</p>
                    <p className="text-[10px] opacity-80">{patient.name} e histórico excluídos.</p>
                </div>
                <button 
                    onClick={async () => {
                        try {
                            await firebaseService.createPatient(patient as any);
                            setRefreshKey(prev => prev + 1);
                            toast.info('Paciente restaurado com sucesso!');
                        } catch (e) {
                            toast.error('Falha ao restaurar paciente.');
                        }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-50 transition-colors shrink-0"
                >
                    <RotateCcw size={14} /> Desfazer
                </button>
            </div>,
            { autoClose: 8000 }
        );

    } catch (err) {
        // Fallback para Mock se a exclusão no Firebase falhar
        const pIndex = _mockPatients.findIndex(p => p.id === patient.id);
        if (pIndex >= 0) {
            _mockPatients.splice(pIndex, 1);
            toast.success('Mock removido (Sem conexão com Firebase)');
        } else {
            toast.error('Erro ao excluir paciente no banco.');
        }
    } finally {
        setPatientToDelete(null);
        setRefreshKey(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-6" key={refreshKey}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3">
        <button 
          onClick={() => setShowImportModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-slate-800 rounded-xl text-sm font-bold hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-[0.98]"
        >
          <Upload size={18} />
          Importar Lista
        </button>
        <button 
          onClick={() => setSelectedPatientForForm('new')}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all dark:shadow-none active:scale-[0.98]"
        >
          <UserPlus size={18} />
          Novo Paciente
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <th 
                  className="px-2 py-4 text-[9px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Paciente
                    {sortConfig?.key === 'name' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                    )}
                  </div>
                </th>
                <th 
                  className="px-2 py-4 text-[9px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('recordNumber')}
                >
                  <div className="flex items-center gap-1">
                    Pront.
                    {sortConfig?.key === 'recordNumber' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                    )}
                  </div>
                </th>
                <th 
                  className="px-2 py-4 text-[9px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('cpf')}
                >
                  <div className="flex items-center gap-1">
                    CPF
                    {sortConfig?.key === 'cpf' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                    )}
                  </div>
                </th>
                <th 
                  className="px-2 py-4 text-[9px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('birthDate')}
                >
                  <div className="flex items-center gap-1">
                    Nasc.
                    {sortConfig?.key === 'birthDate' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                    )}
                  </div>
                </th>
                <th 
                  className="px-2 py-4 text-[9px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('phone')}
                >
                  <div className="flex items-center gap-1">
                    Contato
                    {sortConfig?.key === 'phone' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                    )}
                  </div>
                </th>
                <th className="px-2 py-4 text-[9px] font-bold uppercase tracking-wider text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {paginatedPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                  <td className="px-2 py-3 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                        {patient.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate text-[12px]">{patient.name}</p>
                        <a 
                          href={`mailto:${patient.email}`}
                          className="text-[9px] text-slate-400 truncate hover:text-indigo-600 transition-colors flex items-center gap-1"
                        >
                          {patient.email}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 font-mono whitespace-nowrap">
                    <span className="bg-indigo-50 dark:bg-indigo-900/30 px-1 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-800">{patient.recordNumber || '-'}</span>
                  </td>
                  <td className="px-2 py-3 text-[11px] text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
                    <span className="bg-slate-50 dark:bg-slate-800/50 px-1 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800">{patient.cpf}</span>
                  </td>
                  <td className="px-2 py-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                    {patient.birthDate.split('-').reverse().join('/')}
                  </td>
                  <td className="px-2 py-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <a 
                        href={`https://wa.me/${patient.phone.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-indigo-600 hover:text-emerald-600 transition-all group/wa w-fit"
                        title="Enviar WhatsApp"
                      >
                        <div className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover/wa:scale-110 group-hover/wa:bg-emerald-500 dark:group-hover/wa:bg-emerald-600 group-hover/wa:text-white transition-all">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.626 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                        </div>
                        <span className="font-bold font-mono tracking-tighter text-slate-700 dark:text-slate-300 group-hover/wa:text-emerald-600 dark:group-hover/wa:text-emerald-400 transition-colors text-[10px] uppercase">{patient.phone}</span>
                      </a>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
                      <button 
                        onClick={() => setPatientForHistory(patient)}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-500 rounded-lg transition-all hover:shadow-md border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/50"
                        title="Ver Histórico"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        onClick={() => setSelectedPatientForForm(patient)}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg transition-all hover:shadow-md border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => setPatientToDelete(patient)}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-800 text-red-600 dark:text-red-400 rounded-lg transition-all hover:shadow-md border border-transparent hover:border-red-100 dark:hover:border-red-900/50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {paginatedPatients.map((patient) => (
            <div key={patient.id} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl">
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100 leading-tight">{patient.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md inline-block">
                        {patient.cpf}
                      </p>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-bold tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md inline-block">
                        {patient.recordNumber}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPatientForHistory(patient)}
                    className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 rounded-xl active:scale-90 transition-all font-bold flex items-center gap-1"
                  >
                    <Eye size={18} />
                  </button>
                  <button 
                    onClick={() => setSelectedPatientForForm(patient)}
                    className="p-3 bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl active:scale-90 transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => setPatientToDelete(patient)}
                    className="p-3 bg-slate-50 dark:bg-slate-800 text-red-600 dark:text-red-400 rounded-xl active:scale-90 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1">Nascimento</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-bold">{patient.birthDate.split('-').reverse().join('/')}</p>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1">Telefone</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-bold">{patient.phone}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-slate-50 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-900/50 transition-colors">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
              Mostrando <span className="text-slate-600 dark:text-slate-300">{paginatedPatients.length}</span> de <span className="text-slate-600 dark:text-slate-300">{filteredPatients.length}</span> pacientes
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
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="text-slate-300 dark:text-slate-600 px-1 font-bold">...</span>
                      )}
                      <button 
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "w-10 h-10 rounded-xl text-xs font-bold transition-all",
                          currentPage === page 
                            ? "bg-indigo-600 text-white dark:shadow-none" 
                            : "text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                        )}
                      >
                        {page}
                      </button>
                    </React.Fragment>
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

        {filteredPatients.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
              <UserPlus size={32} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium italic">Nenhum paciente encontrado na sua busca.</p>
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

      {showImportModal && (
        <ImportPatientsModal 
          onClose={() => setShowImportModal(false)}
          onImport={handleImportPatients}
          existingPatients={currentPatients}
        />
      )}

      {/* Delete Confirmation */}
      {patientToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-white dark:border-slate-800 transition-colors">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-6 text-red-500 dark:text-red-400">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Excluir Paciente?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
              Esta ação removerá permanentemente o paciente <strong>{patientToDelete.name}</strong> e todos os seus históricos de agendamentos.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setPatientToDelete(null)}
                className="flex-1 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Manter
              </button>
              <button 
                onClick={handleDeletePatient}
                className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-100 dark:shadow-none transition-all active:scale-[0.98]"
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
