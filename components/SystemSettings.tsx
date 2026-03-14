'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CreditCard, 
  ClipboardList, 
  Mail, 
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Lock,
  Eye,
  Settings as SettingsIcon,
  Users as UsersIcon,
  Calendar as CalendarIcon,
  CreditCard as CreditCardIcon,
  Save,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Building2,
  MapPin,
  Phone as PhoneIcon,
  Search,
  ExternalLink,
  Info,
  Image as ImageIcon,
  History,
  CheckCircle,
  Calendar,
  Upload,
  Zap,
  Activity,
  Globe,
  Database,
  Link2,
  ChevronLeft,
  ChevronRight,
  Filter,
  UserPlus
} from 'lucide-react';
import { format, differenceInMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, normalizeString } from '@/lib/utils';
import { mockUnits, mockAppointments, mockScheduleConfigs, mockScheduleBlocks, mockPatients, mockProcedures, mockSystemSettings, mockDoctors, mockInsurances } from '@/lib/mockData';
import { View } from '@/lib/types';
import { toast } from 'react-toastify';
import ImportProceduresModal from './ImportProceduresModal';
import ImportInsurancesModal from './ImportInsurancesModal';

type SettingTab = 'perfis' | 'convenios' | 'procedimentos' | 'parametros' | 'mala-direta' | 'campanha';

export default function SystemSettings({ searchQuery = '', setView }: { searchQuery?: string, setView?: (view: View) => void }) {
  const [activeTab, setActiveTab] = useState<SettingTab>('parametros');
  
  // Persistent state for modules
  const [procedures, setProcedures] = useState<any[]>([...mockProcedures]);
  const [globalSettings, setGlobalSettings] = useState({
    ...JSON.parse(JSON.stringify(mockSystemSettings)),
    unidades: [...mockUnits]
  });
  const [insurances, setInsurances] = useState([...mockInsurances]);

  const handleProceduresSave = (data: any, editingProcedure?: any) => {
    if (editingProcedure) {
      const newProcedures = procedures.map(p => p.id === editingProcedure.id ? { ...p, ...data } : p);
      setProcedures(newProcedures);
      // Synchronize with mockData
      mockProcedures.length = 0;
      mockProcedures.push(...newProcedures);
      toast.success('Procedimento atualizado!');
    } else {
      const newProcedure = { id: Date.now().toString(), ...data };
      const newProcedures = [...procedures, newProcedure];
      setProcedures(newProcedures);
      // Synchronize with mockData
      mockProcedures.length = 0;
      mockProcedures.push(...newProcedures);
      toast.success('Procedimento criado!');
    }
  };

  const handleProceduresDelete = (itemToRemove: any) => {
    const newProcedures = procedures.filter(p => p.id !== itemToRemove.id);
    setProcedures(newProcedures);
    mockProcedures.length = 0;
    mockProcedures.push(...newProcedures);
  };

  const handleImportProcedures = (imported: any[]) => {
    const newProcedures = [...procedures, ...imported];
    setProcedures(newProcedures);
    mockProcedures.length = 0;
    mockProcedures.push(...newProcedures);
  };

  const handleImportInsurances = (imported: any[]) => {
    const newInsurances = [...insurances, ...imported];
    setInsurances(newInsurances);
    mockInsurances.length = 0;
    mockInsurances.push(...newInsurances);
  };

  const handleInsurancesSave = (data: any, editingInsurance?: any) => {
    let newInsurances;
    if (editingInsurance) {
      newInsurances = insurances.map(i => i.id === editingInsurance.id ? { ...i, ...data } : i);
      toast.success('Convênio atualizado!');
    } else {
      const newInsurance = { id: Date.now(), ...data, patients: 0 };
      newInsurances = [...insurances, newInsurance];
      toast.success('Convênio criado com sucesso!');
    }
    setInsurances(newInsurances);
    mockInsurances.length = 0;
    mockInsurances.push(...newInsurances);
  };

  const handleInsurancesDelete = (itemToRemove: any) => {
    const newInsurances = insurances.filter(i => i.id !== itemToRemove.id);
    setInsurances(newInsurances);
    mockInsurances.length = 0;
    mockInsurances.push(...newInsurances);
  };

  const tabs: { id: SettingTab; label: string; icon: any }[] = [
    { id: 'parametros', label: 'Parâmetros', icon: SettingsIcon },
    { id: 'perfis', label: 'Perfis de Acesso', icon: ShieldCheck },
    { id: 'convenios', label: 'Convênios', icon: CreditCard },
    { id: 'procedimentos', label: 'Procedimentos', icon: ClipboardList },
    { id: 'mala-direta', label: 'Mala Direta', icon: Mail },
    { id: 'campanha', label: 'Campanha', icon: Megaphone },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'perfis':
        return <AccessProfiles searchQuery={searchQuery} />;
      case 'procedimentos':
        return <Procedures 
          searchQuery={searchQuery} 
          procedures={procedures} 
          onSave={handleProceduresSave}
          onDelete={handleProceduresDelete}
          onImport={handleImportProcedures}
        />;
      case 'convenios':
        return <Insurances 
          searchQuery={searchQuery} 
          insurances={insurances}
          onSave={handleInsurancesSave}
          onDelete={handleInsurancesDelete}
          onImport={handleImportInsurances}
        />;
      case 'parametros':
        return <SystemParameters 
          setView={setView} 
          settings={globalSettings}
          setSettings={setGlobalSettings}
        />;
      case 'mala-direta':
        return <MalaDireta searchQuery={searchQuery} />;
      case 'campanha':
        return <Campanhas searchQuery={searchQuery} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
              {React.createElement(tabs.find(t => t.id === activeTab)?.icon, { size: 32 })}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Em breve</h3>
            <p className="text-sm text-slate-500 max-w-xs text-center">
              Esta funcionalidade de {tabs.find(t => t.id === activeTab)?.label} está em desenvolvimento e estará disponível em breve.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 bg-white/50 p-2 rounded-2xl border border-slate-200/60 backdrop-blur-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === tab.id 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                : "text-slate-500 hover:bg-white hover:text-slate-900"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {renderContent()}
      </div>
    </div>
  );
}

function AccessProfiles({ searchQuery = '' }: { searchQuery: string }) {
  const [profiles, setProfiles] = useState([
    { id: 1, name: 'Administrador', permissions: ['Total'], color: 'bg-indigo-500' },
    { id: 2, name: 'Médico', permissions: ['Agenda', 'Histórico'], color: 'bg-emerald-500' },
    { id: 3, name: 'Recepção', permissions: ['Agenda', 'Pacientes'], color: 'bg-sky-500' },
    { id: 4, name: 'Enfermagem', permissions: ['Agenda', 'Procedimentos'], color: 'bg-rose-500' },
  ]);

  const filteredProfiles = profiles.filter(p => {
    const search = normalizeString(searchQuery);
    return normalizeString(p.name).includes(search);
  });

  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [profileFormOpen, setProfileFormOpen] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState<any>(null);

  const confirmDelete = () => {
    const itemToRemove = itemToDelete;
    const previousProfiles = [...profiles];
    setProfiles(profiles.filter(p => p.id !== itemToRemove.id));
    
    toast.info(
      <div className="flex items-center justify-between gap-2 w-full overflow-hidden">
        <span className="text-[11px] font-medium truncate min-w-0">
          Perfil <strong>{itemToRemove.name}</strong> excluído
        </span>
        <button 
          onClick={() => {
            setProfiles(previousProfiles);
            toast.dismiss();
            toast.success('Exclusão desfeita!');
          }}
          className="shrink-0 px-3 py-1 bg-white text-indigo-600 rounded-lg text-[10px] font-bold shadow-sm hover:bg-indigo-50 transition-colors whitespace-nowrap"
        >
          DESFAZER
        </button>
      </div>,
      { 
        icon: Trash2,
        autoClose: 5000,
        closeOnClick: false
      }
    );
    setItemToDelete(null);
  };

  const handleSavePermissions = (profileId: number, newPermissions: string[]) => {
    setProfiles(profiles.map(p => p.id === profileId ? { ...p, permissions: newPermissions } : p));
    toast.success('Permissões atualizadas com sucesso!');
    setSelectedProfile(null);
  };

  const handleSaveProfile = (data: any) => {
    if (profileToEdit) {
      setProfiles(profiles.map(p => p.id === profileToEdit.id ? { ...p, ...data } : p));
      toast.success('Perfil atualizado com sucesso!');
    } else {
      const newProfile = {
        id: Date.now(),
        ...data,
        permissions: ['Agenda'] // Default permission
      };
      setProfiles([...profiles, newProfile]);
      toast.success('Novo perfil de acesso criado!');
    }
    setProfileFormOpen(false);
    setProfileToEdit(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {filteredProfiles.map((profile) => (
        <div key={profile.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="flex gap-4 items-center">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-black/5", profile.color)}>
                {profile.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg">{profile.name}</h4>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-0.5">Perfil de Acesso</p>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => {
                  setProfileToEdit(profile);
                  setProfileFormOpen(true);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                title="Editar Nome/Cor"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => setItemToDelete({ id: profile.id, name: profile.name, type: 'perfil' })}
                className="p-2 hover:bg-red-50 rounded-xl text-red-400 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Permissões Habilitadas</p>
            <div className="flex flex-wrap gap-2">
              {profile.permissions.map((perm, i) => (
                <span key={i} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-100 flex items-center gap-1.5">
                  <Check size={12} className="text-emerald-500" /> {perm}
                </span>
              ))}
              <button 
                onClick={() => setSelectedProfile(profile)}
                className="px-3 py-1.5 bg-white text-indigo-600 border border-indigo-100 rounded-lg text-[10px] font-bold hover:bg-indigo-50 transition-colors"
              >
                + Editar Permissões
              </button>
            </div>
          </div>
        </div>
      ))}
      {filteredProfiles.length === 0 && (
        <div className="md:col-span-2 p-12 text-center bg-white rounded-3xl border border-slate-100 italic text-slate-400 text-sm">
          Nenhum perfil encontrado para "{searchQuery}"
        </div>
      )}
      <button 
        onClick={() => {
          setProfileToEdit(null);
          setProfileFormOpen(true);
        }}
        className="group relative flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-indigo-400 transition-all bg-white hover:bg-indigo-50/30 min-h-[160px]"
      >
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-all">
          <Plus size={24} />
        </div>
        <p className="text-sm font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">Novo Perfil de Acesso</p>
      </button>

      {selectedProfile && (
        <PermissionsModal 
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onSave={handleSavePermissions}
        />
      )}

      {profileFormOpen && (
        <ProfileModal 
          profile={profileToEdit}
          onClose={() => setProfileFormOpen(false)}
          onSave={handleSaveProfile}
        />
      )}

      {itemToDelete && (
        <DeleteConfirmationModal 
          itemName={itemToDelete.name}
          itemType={itemToDelete.type}
          onClose={() => setItemToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function PermissionsModal({ profile, onClose, onSave }: { profile: any, onClose: () => void, onSave: (id: number, perms: string[]) => void }) {
  const categories = [
    {
      id: 'agenda',
      label: 'Agenda',
      icon: CalendarIcon,
      perms: [
        { id: 'view_agenda', label: 'Visualizar Agenda' },
        { id: 'create_apt', label: 'Agendar Pacientes' },
        { id: 'edit_apt', label: 'Editar Agendamentos' },
        { id: 'cancel_apt', label: 'Cancelar Agendamentos' },
        { id: 'transfer_apt', label: 'Transferir Atendimento' },
        { id: 'manage_blocks', label: 'Bloquear Agenda' },
        { id: 'view_reports', label: 'Ver Relatórios' },
      ]
    },
    {
      id: 'pacientes',
      label: 'Pacientes',
      icon: UsersIcon,
      perms: [
        { id: 'view_patients', label: 'Visualizar Pacientes' },
        { id: 'create_patient', label: 'Cadastrar Novo Paciente' },
        { id: 'edit_patient', label: 'Editar Dados cadastrais' },
        { id: 'view_history', label: 'Ver Prontuário/Histórico' },
        { id: 'delete_patient', label: 'Excluir Paciente' },
      ]
    },
    {
      id: 'profissionais',
      label: 'Corpo Clínico',
      icon: ShieldCheck,
      perms: [
        { id: 'view_docs', label: 'Visualizar Médicos' },
        { id: 'create_doc', label: 'Cadastrar Novo Médico' },
        { id: 'edit_doc', label: 'Editar Escalas' },
        { id: 'delete_doc', label: 'Excluir Profissional' },
      ]
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      icon: CreditCardIcon,
      perms: [
        { id: 'view_billing', label: 'Ver Faturamento' },
        { id: 'manage_insurances', label: 'Gerenciar Convênios' },
        { id: 'manage_procedures', label: 'Gerenciar Procedimentos' },
      ]
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: SettingsIcon,
      perms: [
        { id: 'system_settings', label: 'Configurações do Sistema' },
        { id: 'access_profiles', label: 'Gerenciar Perfis de Acesso' },
        { id: 'audit_logs', label: 'Ver Logs de Auditoria' },
      ]
    }
  ];

  const [selectedPerms, setSelectedPerms] = useState<string[]>(
    profile.permissions.includes('Total') 
      ? categories.flatMap(c => c.perms.map(p => p.label))
      : profile.permissions
  );

  const togglePerm = (label: string) => {
    if (selectedPerms.includes(label)) {
      setSelectedPerms(selectedPerms.filter(p => p !== label));
    } else {
      setSelectedPerms([...selectedPerms, label]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg", profile.color)}>
              {profile.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Editar Permissões: {profile.name}</h2>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">Defina o que este perfil pode acessar</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-8">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const allSelected = cat.perms.every(p => selectedPerms.includes(p.label));
            
            return (
              <div key={cat.id} className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Icon size={16} />
                    </div>
                    <h3 className="font-bold text-slate-800 uppercase tracking-widest text-[11px]">{cat.label}</h3>
                  </div>
                  <button 
                    onClick={() => {
                      if (allSelected) {
                        setSelectedPerms(selectedPerms.filter(p => !cat.perms.map(cp => cp.label).includes(p)));
                      } else {
                        const newPerms = [...selectedPerms];
                        cat.perms.forEach(p => {
                          if (!newPerms.includes(p.label)) newPerms.push(p.label);
                        });
                        setSelectedPerms(newPerms);
                      }
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:underline"
                  >
                    {allSelected ? 'Desmarcar Todos' : 'Marcar Todos'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cat.perms.map((perm) => (
                    <label 
                      key={perm.id}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all",
                        selectedPerms.includes(perm.label)
                          ? "bg-indigo-50/50 border-indigo-200 text-indigo-700" 
                          : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                        selectedPerms.includes(perm.label) ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300"
                      )}>
                        {selectedPerms.includes(perm.label) && <Check size={12} className="text-white" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={selectedPerms.includes(perm.label)}
                        onChange={() => togglePerm(perm.label)}
                      />
                      <span className="text-xs font-bold">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-8 border-t border-slate-50 bg-slate-50/10 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all">
            Cancelar
          </button>
          <button 
            onClick={() => onSave(profile.id, selectedPerms)}
            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}

function Insurances({ 
  searchQuery = '',
  insurances,
  onSave,
  onDelete,
  onImport
}: { 
  searchQuery: string,
  insurances: any[],
  onSave: (data: any, editingInsurance?: any) => void,
  onDelete: (item: any) => void,
  onImport: (imported: any[]) => void
}) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredInsurances = insurances.filter(i => {
    const search = normalizeString(searchQuery);
    return normalizeString(i.name).includes(search);
  }).sort((a: any, b: any) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(filteredInsurances.length / itemsPerPage);
  const paginatedInsurances = filteredInsurances.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when searching
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const handleSave = (data: any) => {
    onSave(data, editingInsurance);
    setModalOpen(false);
    setEditingInsurance(null);
  };

  const confirmDelete = () => {
    onDelete(itemToDelete);
    setItemToDelete(null);
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
        <h3 className="font-bold text-slate-900">Convênios Ativos</h3>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-indigo-600 border border-indigo-100 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-all shadow-sm active:scale-[0.98]"
          >
            <Upload size={14} />
            Importar Lista
          </button>
          <button 
            onClick={() => {
              setEditingInsurance(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
          >
            <Plus size={16} /> Novo Convênio
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th 
                className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Nome do Convênio
                  {sortConfig?.key === 'name' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">
                  Status
                  {sortConfig?.key === 'status' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors"
                onClick={() => handleSort('patients')}
              >
                <div className="flex items-center gap-2">
                  Pacientes
                  {sortConfig?.key === 'patients' && (
                    sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedInsurances.map((ins) => (
              <tr key={ins.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-700 text-sm">{ins.name}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase",
                    ins.status === 'Ativo' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                  )}>
                    {ins.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500 font-medium">{ins.patients} pacientes vinculados</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button 
                      onClick={() => {
                        setEditingInsurance(ins);
                        setModalOpen(true);
                      }}
                      className="p-2 hover:bg-white rounded-lg text-slate-400 transition-all border border-transparent hover:border-slate-100"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => setItemToDelete({ id: ins.id, name: ins.name, type: 'convênio' })}
                      className="p-2 hover:bg-white rounded-lg text-red-400 transition-all border border-transparent hover:border-slate-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredInsurances.length === 0 && (
          <div className="p-12 text-center text-slate-400 italic text-sm">
            Nenhum convênio encontrado para "{searchQuery}"
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-slate-50 bg-slate-50/10">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Mostrando <span className="text-slate-600">{paginatedInsurances.length}</span> de <span className="text-slate-600">{filteredInsurances.length}</span> convênios
            </p>
            
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-sm"
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
                        <span className="text-slate-300 px-1 font-bold">...</span>
                      )}
                      <button 
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "w-10 h-10 rounded-xl text-xs font-bold transition-all",
                          currentPage === page 
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                            : "text-slate-400 hover:bg-white hover:text-slate-600 border border-slate-100 hover:border-slate-200"
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
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <InsuranceModal 
          insurance={editingInsurance}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {itemToDelete && (
        <DeleteConfirmationModal 
          itemName={itemToDelete.name}
          itemType={itemToDelete.type}
          onClose={() => setItemToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}

      {showImportModal && (
        <ImportInsurancesModal 
          onClose={() => setShowImportModal(false)}
          onImport={onImport}
          existingInsurances={insurances}
        />
      )}
    </div>
  );
}

function Procedures({ 
  searchQuery = '', 
  procedures, 
  onSave, 
  onDelete,
  onImport
}: { 
  searchQuery: string, 
  procedures: any[], 
  onSave: (data: any, editingProcedure?: any) => void,
  onDelete: (item: any) => void,
  onImport: (imported: any[]) => void
}) {
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredProcedures = procedures.filter(p => {
    const search = normalizeString(searchQuery);
    return normalizeString(p.name).includes(search) ||
           normalizeString(p.modality).includes(search);
  }).sort((a: any, b: any) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const valA = key === 'price' ? parseFloat(a[key]) : a[key];
    const valB = key === 'price' ? parseFloat(b[key]) : b[key];
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(filteredProcedures.length / itemsPerPage);
  const paginatedProcedures = filteredProcedures.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when searching
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const handleSave = (data: any) => {
    onSave(data, editingProcedure);
    setModalOpen(false);
    setEditingProcedure(null);
  };

  const confirmDelete = () => {
    onDelete(itemToDelete);
    setItemToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Procedimentos</h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-indigo-600 border border-indigo-100 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-all shadow-sm active:scale-[0.98]"
            >
              <Upload size={14} />
              Importar Lista
            </button>
            <button 
              onClick={() => {
                setEditingProcedure(null);
                setModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
            >
              <Plus size={16} /> Novo Procedimento
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th 
                  className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Procedimento
                    {sortConfig?.key === 'name' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('modality')}
                >
                  <div className="flex items-center gap-2">
                    Modalidade
                    {sortConfig?.key === 'modality' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center gap-2">
                    Valor
                    {sortConfig?.key === 'price' && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedProcedures.map((proc) => (
                <tr key={proc.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-sm">{proc.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all",
                      proc.modality === 'CONSULTA' ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-50" :
                      proc.modality === 'US' ? "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm shadow-indigo-50" :
                      proc.modality === 'CT' ? "bg-amber-50 text-amber-600 border-amber-100 shadow-sm shadow-amber-50" :
                      proc.modality === 'CR' ? "bg-sky-50 text-sky-600 border-sky-100 shadow-sm shadow-sky-50" :
                      "bg-slate-50 text-slate-600 border-slate-100"
                    )}>
                      {proc.modality}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-700">
                      R$ {parseFloat(proc.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => {
                          setEditingProcedure(proc);
                          setModalOpen(true);
                        }}
                        className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => setItemToDelete({ id: proc.id, name: proc.name, type: 'procedimento' })}
                        className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-red-500 transition-all border border-transparent hover:border-slate-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProcedures.length === 0 && (
            <div className="p-12 text-center text-slate-400 italic text-sm">
              Nenhum procedimento encontrado para "{searchQuery}"
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-slate-50 bg-slate-50/10">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Mostrando <span className="text-slate-600">{paginatedProcedures.length}</span> de <span className="text-slate-600">{filteredProcedures.length}</span> procedimentos
              </p>
              
              <div className="flex items-center gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-sm"
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
                          <span className="text-slate-300 px-1 font-bold">...</span>
                        )}
                        <button 
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            "w-10 h-10 rounded-xl text-xs font-bold transition-all",
                            currentPage === page 
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                              : "text-slate-400 hover:bg-white hover:text-slate-600 border border-slate-100 hover:border-slate-200"
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
                  className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all shadow-sm"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <ProcedureModal 
          procedure={editingProcedure}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {showImportModal && (
        <ImportProceduresModal 
          onClose={() => setShowImportModal(false)}
          onImport={onImport}
          existingProcedures={procedures}
        />
      )}

      {itemToDelete && (
        <DeleteConfirmationModal 
          itemName={itemToDelete.name}
          itemType={itemToDelete.type}
          onClose={() => setItemToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function InsuranceModal({ insurance, onClose, onSave }: { insurance: any, onClose: () => void, onSave: (data: any) => void }) {
  const [name, setName] = useState(insurance?.name || '');
  const [status, setStatus] = useState(insurance?.status || 'Ativo');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-white animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h2 className="text-xl font-bold text-slate-900">{insurance ? 'Editar Convênio' : 'Novo Convênio'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ name, status }); }} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Convênio</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Unimed"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
            <select 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Cancelar</button>
            <button type="submit" className="flex-3 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 px-8">
              <Save size={18} /> Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProcedureModal({ procedure, onClose, onSave }: { procedure: any, onClose: () => void, onSave: (data: any) => void }) {
  const [name, setName] = useState(procedure?.name || '');
  const [modality, setModality] = useState(procedure?.modality || 'US');
  const [customModality, setCustomModality] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [price, setPrice] = useState(procedure?.price || '');
  const [preparation, setPreparation] = useState(procedure?.preparation || '');
  const [integraRis, setIntegraRis] = useState(procedure?.integraRis || false);

  const standardModalities = [
    { code: 'US', label: 'Ultrassom', color: 'indigo' },
    { code: 'CR', label: 'Raio-X', color: 'sky' },
    { code: 'CT', label: 'Tomografia', color: 'amber' },
    { code: 'MG', label: 'Mamografia', color: 'rose' },
    { code: 'MR', label: 'Ressonância', color: 'violet' },
    { code: 'CONSULTA', label: 'Consulta', color: 'emerald' },
  ];

  // If initial modality is not in standard, it's custom
  React.useEffect(() => {
    if (procedure?.modality) {
      const isStandard = standardModalities.some(m => m.code === procedure.modality);
      if (!isStandard) {
        setModality('OUTRO');
        setCustomModality(procedure.modality);
        setShowCustomInput(true);
      }
    }
  }, [procedure]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalModality = modality === 'OUTRO' ? customModality.toUpperCase() : modality;
    onSave({ 
      name: sanitize(name), 
      modality: finalModality, 
      price,
      preparation: preparation,
      integraRis: integraRis
    });
  };

  const sanitize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const formatCurrencyValue = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = (parseFloat(numbers) / 100).toFixed(2);
    if (isNaN(parseFloat(amount))) return '';
    return amount.replace('.', ',');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (!value) {
      setPrice('');
      return;
    }
    const amount = (parseFloat(value) / 100).toFixed(2);
    setPrice(amount);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col border border-white animate-in zoom-in-95 duration-300 max-h-[90vh]">
        <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div>
            <h2 className="text-2xl font-black text-slate-900">{procedure ? 'Editar Procedimento' : 'Novo Procedimento'}</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Configure os detalhes e modalidade técnica</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-10 space-y-10 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descrição do Procedimento</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Ultrassom de Abdome Total"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Valor Sugerido (R$)</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <span className="text-slate-400 font-black text-base group-focus-within:text-indigo-600 transition-colors">R$</span>
                    <div className="w-px h-5 bg-slate-200 group-focus-within:bg-indigo-300 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    required
                    className="w-full pl-24 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 focus:bg-white outline-none transition-all"
                    value={price ? parseFloat(price).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                    onChange={handlePriceChange}
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Modelo de Preparo</label>
                <textarea 
                  rows={4}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 focus:bg-white outline-none transition-all placeholder:text-slate-300 resize-none"
                  value={preparation}
                  onChange={(e) => setPreparation(e.target.value)}
                  placeholder="Instruções de preparo para o paciente..."
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                <label className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", integraRis ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-300")}>
                      <Activity size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-700">Integra RIS</span>
                      <p className="text-[9px] text-slate-400 font-medium">Habilitar exportação automática para o RIS/PACS.</p>
                    </div>
                  </div>
                  <div 
                    onClick={() => setIntegraRis(!integraRis)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      integraRis ? "bg-indigo-600" : "bg-slate-200"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                      integraRis ? "left-7" : "left-1"
                    )} />
                  </div>
                </label>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Modalidade Técnica</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {standardModalities.map((m) => {
                    const colorMap: Record<string, string> = {
                      indigo: modality === m.code ? "bg-indigo-50 border-indigo-500 shadow-indigo-100 text-indigo-600" : "text-slate-400 border-slate-100",
                      sky: modality === m.code ? "bg-sky-50 border-sky-500 shadow-sky-100 text-sky-600" : "text-slate-400 border-slate-100",
                      amber: modality === m.code ? "bg-amber-50 border-amber-500 shadow-amber-100 text-amber-600" : "text-slate-400 border-slate-100",
                      rose: modality === m.code ? "bg-rose-50 border-rose-500 shadow-rose-100 text-rose-600" : "text-slate-400 border-slate-100",
                      violet: modality === m.code ? "bg-violet-50 border-violet-500 shadow-violet-100 text-violet-600" : "text-slate-400 border-slate-100",
                      emerald: modality === m.code ? "bg-emerald-50 border-emerald-500 shadow-emerald-100 text-emerald-600" : "text-slate-400 border-slate-100",
                    };
                    
                    const dotColorMap: Record<string, string> = {
                      indigo: "bg-indigo-500",
                      sky: "bg-sky-500",
                      amber: "bg-amber-500",
                      rose: "bg-rose-500",
                      violet: "bg-violet-500",
                      emerald: "bg-emerald-500",
                    };

                    return (
                      <button
                        key={m.code}
                        type="button"
                        onClick={() => {
                          setModality(m.code);
                          setShowCustomInput(false);
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all group relative overflow-hidden",
                          colorMap[m.color],
                          modality === m.code ? "shadow-lg" : "bg-white hover:border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        <span className={cn(
                          "text-lg font-black mb-1 transition-transform group-active:scale-90",
                        )}>{m.code}</span>
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-widest opacity-80 text-center",
                        )}>{m.label}</span>
                        
                        {modality === m.code && (
                          <div className={cn("absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse", dotColorMap[m.color])} />
                        )}
                      </button>
                    );
                  })}
                  
                  {/* Option for New Modality */}
                  <button
                    type="button"
                    onClick={() => {
                      setModality('OUTRO');
                      setShowCustomInput(true);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all group relative",
                      modality === 'OUTRO' 
                        ? "bg-slate-900 border-slate-900 text-white shadow-xl" 
                        : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    <Plus size={20} className="mb-1" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Nova Modl.</span>
                  </button>
                </div>

                {showCustomInput && (
                  <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Especificar Nova Modalidade</label>
                    <input 
                      type="text"
                      placeholder="DIX, PET, etc..."
                      className="w-full px-4 py-3 mt-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all uppercase"
                      value={customModality}
                      onChange={(e) => setCustomModality(e.target.value)}
                      required={modality === 'OUTRO'}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm">Cancelar</button>
            <button type="submit" className="flex-3 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 px-8">
              <Save size={18} /> Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmationModal({ itemName, itemType, onClose, onConfirm }: { itemName: string, itemType: string, onClose: () => void, onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-white animate-in zoom-in-95 duration-300 p-8 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Excluir {itemType}?</h3>
        <p className="text-sm text-slate-500 mb-8 px-4">
          Tem certeza que deseja excluir <strong>{itemName}</strong>? Esta ação não poderá ser desfeita.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose} className="py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">Não, Manter</button>
          <button onClick={onConfirm} className="py-3 bg-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-100">Sim, Excluir</button>
        </div>
      </div>
    </div>
  );
}

function ProfileModal({ profile, onClose, onSave }: { profile: any, onClose: () => void, onSave: (data: any) => void }) {
  const [name, setName] = useState(profile?.name || '');
  const [color, setColor] = useState(profile?.color || 'bg-indigo-500');

  const colors = [
    { name: 'Índigo', class: 'bg-indigo-500' },
    { name: 'Esmeralda', class: 'bg-emerald-500' },
    { name: 'Céu', class: 'bg-sky-500' },
    { name: 'Rosa', class: 'bg-rose-500' },
    { name: 'Âmbar', class: 'bg-amber-500' },
    { name: 'Violeta', class: 'bg-violet-500' },
    { name: 'Slate', class: 'bg-slate-600' },
    { name: 'Orange', class: 'bg-orange-500' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-white animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h2 className="text-xl font-bold text-slate-900">{profile ? 'Editar Perfil' : 'Novo Perfil de Acesso'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-100">
            <X size={20} />
          </button>
        </div>
        <form 
          onSubmit={(e) => { 
            e.preventDefault(); 
            if (!name.trim()) return;
            onSave({ name, color }); 
          }} 
          className="p-8 space-y-6"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Perfil</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Financeiro, TI, etc..."
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cor de Identificação</label>
              <div className="grid grid-cols-4 gap-3 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                {colors.map((c) => (
                  <button
                    key={c.class}
                    type="button"
                    onClick={() => setColor(c.class)}
                    className={cn(
                      "w-10 h-10 rounded-xl transition-all flex items-center justify-center relative",
                      c.class,
                      color === c.class ? "ring-4 ring-offset-2 ring-indigo-500 scale-90" : "hover:scale-105"
                    )}
                    title={c.name}
                  >
                    {color === c.class && <Check size={16} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 mt-2">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm", color)}>
                  {name ? name.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{name || 'Nome do Perfil'}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Visualização Prévia</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={!name.trim()}
              className="flex-3 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 px-8 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Save size={18} /> {profile ? 'Salvar Alterações' : 'Criar Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SystemParameters({ 
  setView, 
  settings, 
  setSettings 
}: { 
  setView?: (view: View) => void,
  settings: any,
  setSettings: React.Dispatch<React.SetStateAction<any>>
}) {
  const [activeModule, setActiveModule] = useState('agenda');
  const [unitToDelete, setUnitToDelete] = useState<any>(null);
  const [unitLinks, setUnitLinks] = useState<any[]>([]);
  const [unitToEdit, setUnitToEdit] = useState<any>(null);
  const [isAddingUnit, setIsAddingUnit] = useState(false);

  const modules = [
    { id: 'geral', label: 'Geral', icon: SettingsIcon },
    { id: 'unidades', label: 'Unidades', icon: Building2 },
    { id: 'agenda', label: 'Agenda', icon: CalendarIcon },
    { id: 'pacientes', label: 'Pacientes', icon: UsersIcon },
    { id: 'profissionais', label: 'Profissionais', icon: ShieldCheck },
    { id: 'financeiro', label: 'Financeiro', icon: CreditCardIcon },
    { id: 'integracao', label: 'Integração', icon: Zap },
  ];

  const handleSave = () => {
    // Persist to mockData (simulation of backend save)
    if (settings.unidades) {
      mockUnits.length = 0;
      mockUnits.push(...settings.unidades);
    }
    
    // Persist all other settings to mockSystemSettings
    Object.keys(mockSystemSettings).forEach(key => {
      (mockSystemSettings as any)[key] = JSON.parse(JSON.stringify(settings[key as keyof typeof mockSystemSettings]));
    });
    
    toast.success('Parâmetros salvos com sucesso!');
  };

  const toggleRequiredField = (module: string, field: string) => {
    const currentFields = (settings as any)[module].requiredFields;
    const newFields = currentFields.includes(field)
      ? currentFields.filter((f: string) => f !== field)
      : [...currentFields, field];
    
    setSettings({
      ...settings,
      [module]: {
        ...(settings as any)[module],
        requiredFields: newFields
      }
    });
  };

  const updateSetting = (module: string, key: string, value: any) => {
    setSettings((prev: any) => {
      // Create a copy of the previous state
      const newState = { ...prev };
      
      if (key === '') {
        (newState as any)[module] = value;
      } else {
        (newState as any)[module] = {
          ...(prev as any)[module],
          [key]: value
        };
      }
      
      return newState;
    });
  };

  const checkUnitLinks = (unitId: string) => {
    const links = [];
    
    // Check appointments
    const appointmentsCount = mockAppointments.filter(app => app.unitId === unitId).length;
    if (appointmentsCount > 0) {
      links.push({
        type: 'Agendamentos',
        count: appointmentsCount,
        icon: CalendarIcon,
        view: 'agenda',
        label: `${appointmentsCount} agendamento(s) vinculado(s)`
      });
    }

    // Check schedule configs (grades)
    const schedulesCount = mockScheduleConfigs.filter(conf => conf.unitId === unitId).length;
    if (schedulesCount > 0) {
      links.push({
        type: 'Grades de Horários',
        count: schedulesCount,
        icon: ClipboardList,
        view: 'medicos',
        label: `${schedulesCount} grade(s) de horários vinculada(s)`
      });
    }

    // Check blocks
    const blocksCount = mockScheduleBlocks.filter(block => block.unitId === unitId).length;
    if (blocksCount > 0) {
      links.push({
        type: 'Bloqueios de Agenda',
        count: blocksCount,
        icon: Lock,
        view: 'medicos',
        label: `${blocksCount} bloqueio(s) de horário`
      });
    }

    return links;
  };

  const handleTryDeleteUnit = (unit: any) => {
    const links = checkUnitLinks(unit.id);
    setUnitLinks(links);
    setUnitToDelete(unit);
  };

  const confirmDeleteUnit = () => {
    if (!unitToDelete) return;
    
    const oldUnits = [...settings.unidades];
    const newUnits = settings.unidades.filter((u: any) => u.id !== unitToDelete.id);
    updateSetting('unidades', '', newUnits);
    
    toast.success(
      <div className="flex flex-col gap-1">
        <span className="font-bold">Unidade removida com sucesso!</span>
        <button 
          onClick={() => {
            updateSetting('unidades', '', oldUnits);
            toast.info('Exclusão desfeita.');
          }}
          className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:underline text-left"
        >
          Desfazer Exclusão
        </button>
      </div>,
      { autoClose: 5000 }
    );
    
    setUnitToDelete(null);
    setUnitLinks([]);
  };

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'geral':
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome da Unidade</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={settings.geral.unitName}
                  onChange={(e) => updateSetting('geral', 'unitName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Idioma do Sistema</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  value={settings.geral.language}
                  onChange={(e) => updateSetting('geral', 'language', e.target.value)}
                >
                  <option>Português (Brasil)</option>
                  <option>English</option>
                  <option>Español</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tempo para Logoff Automático</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  value={settings.geral.autoLogout}
                  onChange={(e) => updateSetting('geral', 'autoLogout', e.target.value)}
                >
                  <option>15 min</option>
                  <option>30 min</option>
                  <option>1 hora</option>
                  <option>Nunca</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 'unidades':
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-6">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Gerenciamento de Unidades</h4>
                <p className="text-xs text-slate-500">Cadastre e configure os locais de atendimento da clínica.</p>
              </div>
              <button 
                onClick={() => setIsAddingUnit(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
              >
                <Plus size={16} /> Adicionar Unidade
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {settings.unidades.map((unit: any, index: number) => (
                <div key={unit.id} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-100 transition-all group flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 overflow-hidden border border-slate-100">
                        {unit.logo ? (
                          <img src={unit.logo} alt={unit.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 size={24} />
                        )}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-slate-800">{unit.name}</h5>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">ID: {unit.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setUnitToEdit(unit)}
                        className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleTryDeleteUnit(unit)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{unit.address || 'Endereço não informado'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <PhoneIcon size={12} className="text-slate-400 shrink-0" />
                      <span>{unit.phone || 'Telefone não informado'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                       <div className="flex items-center gap-2">
                         <div className={cn("w-2 h-2 rounded-full", unit.isActive ? "bg-emerald-500" : "bg-slate-300")} />
                         <span className={cn("text-[10px] font-bold uppercase tracking-widest", unit.isActive ? "text-emerald-600" : "text-slate-400")}>
                           {unit.isActive ? 'Unidade Ativa' : 'Unidade Inativa'}
                         </span>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'agenda':
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-4">Campos Obrigatórios no Agendamento</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Paciente', 'Procedimento', 'Médico', 'Convênio', 'Telefone', 'Motivo'].map((field) => (
                  <label key={field} className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all",
                    settings.agenda.requiredFields.includes(field) ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                  )}>
                    <div className={cn(
                      "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                      settings.agenda.requiredFields.includes(field) ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300"
                    )}>
                      {settings.agenda.requiredFields.includes(field) && <Check size={12} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" onChange={() => toggleRequiredField('agenda', field)} />
                    <span className="text-xs font-bold">{field}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-50">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Duração Padrão (Slot)</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  value={settings.agenda.slotDuration}
                  onChange={(e) => updateSetting('agenda', 'slotDuration', e.target.value)}
                >
                  <option value="10">10 minutos</option>
                  <option value="15">15 minutos</option>
                  <option value="20">20 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="60">60 minutos</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Início do Expediente</label>
                <input 
                  type="time" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={settings.agenda.startTime}
                  onChange={(e) => updateSetting('agenda', 'startTime', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fim do Expediente</label>
                <input 
                  type="time" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={settings.agenda.endTime}
                  onChange={(e) => updateSetting('agenda', 'endTime', e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4 border-t border-slate-50">
              <label className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">Permitir Conflito de Horário</p>
                  <p className="text-[10px] text-slate-400 font-medium">Habilita o agendamento de múltiplos pacientes no mesmo slot.</p>
                </div>
                <div 
                  onClick={() => updateSetting('agenda', 'allowOverlapping', !settings.agenda.allowOverlapping)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    settings.agenda.allowOverlapping ? "bg-indigo-600" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    settings.agenda.allowOverlapping ? "left-7" : "left-1"
                  )} />
                </div>
              </label>
              <label className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">Bloqueio de Agendamento Retroativo</p>
                  <p className="text-[10px] text-slate-400 font-medium">Impede a criação de agendamentos em datas ou horários passados.</p>
                </div>
                <div 
                  onClick={() => updateSetting('agenda', 'retroactiveBooking', !settings.agenda.retroactiveBooking)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    settings.agenda.retroactiveBooking ? "bg-indigo-600" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    settings.agenda.retroactiveBooking ? "left-7" : "left-1"
                  )} />
                </div>
              </label>
            </div>
          </div>
        );
      case 'pacientes':
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-4">Campos Obrigatórios no Cadastro</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Nome Completo', 'CPF', 'RG', 'Data de Nascimento', 'Telefone', 'Email', 'Endereço', 'Nome da Mãe'].map((field) => (
                  <label key={field} className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all",
                    settings.pacientes.requiredFields.includes(field) ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                  )}>
                    <div className={cn(
                      "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                      settings.pacientes.requiredFields.includes(field) ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300"
                    )}>
                      {settings.pacientes.requiredFields.includes(field) && <Check size={12} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" onChange={() => toggleRequiredField('pacientes', field)} />
                    <span className="text-xs font-bold">{field}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4 border-t border-slate-50">
              <label className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">Auto-gerar prontuário sequencial</p>
                  <p className="text-[10px] text-slate-400 font-medium">O sistema gera um número de controle automático para novos pacientes.</p>
                </div>
                <div 
                  onClick={() => updateSetting('pacientes', 'autoPatientId', !settings.pacientes.autoPatientId)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    settings.pacientes.autoPatientId ? "bg-indigo-600" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    settings.pacientes.autoPatientId ? "left-7" : "left-1"
                  )} />
                </div>
              </label>
              <label className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">Validação rigorosa de CPF</p>
                  <p className="text-[10px] text-slate-400 font-medium">Impede o salvamento do cadastro se o número de CPF for inválido.</p>
                </div>
                <div 
                  onClick={() => updateSetting('pacientes', 'cpfValidation', !settings.pacientes.cpfValidation)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    settings.pacientes.cpfValidation ? "bg-indigo-600" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    settings.pacientes.cpfValidation ? "left-7" : "left-1"
                  )} />
                </div>
              </label>
              <label className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">Alerta de Inadimplência na Seleção</p>
                  <p className="text-[10px] text-slate-400 font-medium">Exibe um aviso ao recepcionista quando o paciente possui débitos em aberto.</p>
                </div>
                <div 
                  onClick={() => updateSetting('pacientes', 'showDebtAlert', !settings.pacientes.showDebtAlert)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    settings.pacientes.showDebtAlert ? "bg-indigo-600" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    settings.pacientes.showDebtAlert ? "left-7" : "left-1"
                  )} />
                </div>
              </label>
            </div>
          </div>
        );
      case 'profissionais':
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-4">Campos Obrigatórios (Médicos/Técnicos)</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Nome', 'CRM', 'CPF', 'Especialidade', 'Telefone', 'Email'].map((field) => (
                  <label key={field} className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all",
                    settings.profissionais.requiredFields.includes(field) ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                  )}>
                    <div className={cn(
                      "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                      settings.profissionais.requiredFields.includes(field) ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300"
                    )}>
                      {settings.profissionais.requiredFields.includes(field) && <Check size={12} className="text-white" />}
                    </div>
                    <input type="checkbox" className="hidden" onChange={() => toggleRequiredField('profissionais', field)} />
                    <span className="text-xs font-bold">{field}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4 border-t border-slate-50">
              <label className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">Exibir CRM/Registro na Agenda</p>
                  <p className="text-[10px] text-slate-400 font-medium">Mostra o número do registro profissional abaixo do nome na visualização diária.</p>
                </div>
                <div 
                  onClick={() => updateSetting('profissionais', 'showCrmOnCalendar', !settings.profissionais.showCrmOnCalendar)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    settings.profissionais.showCrmOnCalendar ? "bg-indigo-600" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    settings.profissionais.showCrmOnCalendar ? "left-7" : "left-1"
                  )} />
                </div>
              </label>
              <label className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">Escala Multi-Sala Simultânea</p>
                  <p className="text-[10px] text-slate-400 font-medium">Permite que um mesmo profissional seja alocado em salas diferentes no mesmo horário.</p>
                </div>
                <div 
                  onClick={() => updateSetting('profissionais', 'multiRoomScale', !settings.profissionais.multiRoomScale)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    settings.profissionais.multiRoomScale ? "bg-indigo-600" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    settings.profissionais.multiRoomScale ? "left-7" : "left-1"
                  )} />
                </div>
              </label>
            </div>
          </div>
        );
      case 'financeiro':
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Moeda Padrão</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  value={settings.financeiro.currency}
                  onChange={(e) => updateSetting('financeiro', 'currency', e.target.value)}
                >
                  <option value="BRL">BRL (R$)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Forma de Pagamento Padrão</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  value={settings.financeiro.defaultPaymentMethod}
                  onChange={(e) => updateSetting('financeiro', 'defaultPaymentMethod', e.target.value)}
                >
                  <option>Dinheiro</option>
                  <option>Pix</option>
                  <option>Cartão de Crédito</option>
                  <option>Cartão de Débito</option>
                  <option>Convênio</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4 border-t border-slate-50">
              <label className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">Alerta de Cobertura (Glosa)</p>
                  <p className="text-[10px] text-slate-400 font-medium">Avisar se o procedimento selecionado não possui cobertura pelo convênio do paciente.</p>
                </div>
                <div 
                  onClick={() => updateSetting('financeiro', 'billingAlert', !settings.financeiro.billingAlert)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    settings.financeiro.billingAlert ? "bg-indigo-600" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    settings.financeiro.billingAlert ? "left-7" : "left-1"
                  )} />
                </div>
              </label>
            </div>
          </div>
        );
      case 'integracao':
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 mb-6">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                <Globe size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Conectividade Externa</h4>
                <p className="text-xs text-slate-500">Configure a comunicação entre a ATAgenda e sistemas de diagnóstico ou laudos.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-4">Módulo de Imagem (RIS/PACS)</h5>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                      <div className="flex items-center gap-3">
                        <Activity className="text-indigo-600" size={18} />
                        <span className="text-xs font-bold text-slate-700">Ativar Integração RIS</span>
                      </div>
                      <div 
                        onClick={() => updateSetting('integracao', 'risEnabled', !settings.integracao.risEnabled)}
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative",
                          settings.integracao.risEnabled ? "bg-indigo-600" : "bg-slate-200"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                          settings.integracao.risEnabled ? "left-7" : "left-1"
                        )} />
                      </div>
                    </label>

                    <div className="space-y-2 opacity-90">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Servidor PACS (URL)</label>
                      <div className="relative">
                        <Database className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="text" 
                          placeholder="https://pacs.servidor.com:8080"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                          value={settings.integracao.pacsUrl}
                          onChange={(e) => updateSetting('integracao', 'pacsUrl', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 opacity-90">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">DICOM AE Title</label>
                      <input 
                        type="text" 
                        placeholder="ATAGENDA_AE"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                        value={settings.integracao.dicomServer}
                        onChange={(e) => updateSetting('integracao', 'dicomServer', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-4">Portal de Laudos</h5>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">API Key do Centro de Laudos</label>
                      <div className="relative">
                        <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="password" 
                          placeholder="••••••••••••••••"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                          value={settings.integracao.reportCenterApiKey}
                          onChange={(e) => updateSetting('integracao', 'reportCenterApiKey', e.target.value)}
                        />
                      </div>
                    </div>

                    <label className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                      <div className="flex items-center gap-3">
                        <Database className="text-emerald-600" size={18} />
                        <span className="text-xs font-bold text-slate-700">Protocolo HL7 Ativo</span>
                      </div>
                      <div 
                        onClick={() => updateSetting('integracao', 'hl7Enabled', !settings.integracao.hl7Enabled)}
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative",
                          settings.integracao.hl7Enabled ? "bg-emerald-600" : "bg-slate-200"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                          settings.integracao.hl7Enabled ? "left-7" : "left-1"
                        )} />
                      </div>
                    </label>

                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                      <Info className="text-amber-500 shrink-0" size={18} />
                      <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                        Algumas integrações requerem configurações específicas de firewall e VPN no servidor de aplicação. Contate o suporte técnico se tiver dúvidas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
      {/* Side Menu */}
      <div className="w-full md:w-64 bg-slate-50/50 border-r border-slate-100 p-6 space-y-2">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-4">Módulos do Sistema</h3>
        {modules.map((mod) => (
          <button
            key={mod.id}
            onClick={() => setActiveModule(mod.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
              activeModule === mod.id 
                ? "bg-white text-indigo-600 shadow-sm border border-slate-100" 
                : "text-slate-500 hover:bg-white/50"
            )}
          >
            <mod.icon size={18} className={activeModule === mod.id ? "text-indigo-600" : "text-slate-400"} />
            {mod.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-white">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Parâmetros de {modules.find(m => m.id === activeModule)?.label}</h3>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">Configurações globais do sistema</p>
          </div>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
          >
            <Save size={18} /> Salvar Tudo
          </button>
        </div>

        <div className="p-8">
          {renderModuleContent()}
        </div>
      </div>

      {/* Delete Unit Confirmation Modal */}
      {unitToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-white animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-red-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-100">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Excluir Unidade</h2>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">{unitToDelete.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setUnitToDelete(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {unitLinks.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                    <Info className="text-amber-600 shrink-0" size={18} />
                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                      Esta unidade possui vínculos ativos no sistema. Para excluí-la, você deve primeiro remover os itens abaixo ou reatribuí-los a outra unidade.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Vínculos Encontrados</h4>
                    {unitLinks.map((link, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-indigo-200 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                            <link.icon size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">{link.type}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{link.label}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setUnitToDelete(null);
                            if (setView) setView(link.view);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-indigo-600 rounded-lg text-[10px] font-bold hover:border-indigo-600 transition-all shadow-sm"
                        >
                          Ir para Módulo <ExternalLink size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-slate-400 text-center italic px-4">
                    A exclusão direta não é permitida para garantir a integridade dos dados históricos.
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-4 py-4">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600 mb-2">
                    <Trash2 size={40} />
                  </div>
                  <p className="text-sm text-slate-600 font-medium">
                    Tem certeza que deseja excluir esta unidade? <br/>
                    Esta ação poderá ser desfeita imediatamente após a confirmação.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setUnitToDelete(null)}
                  className="py-3.5 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDeleteUnit}
                  disabled={unitLinks.length > 0}
                  className={cn(
                    "py-3.5 text-white rounded-2xl text-sm font-bold transition-all shadow-xl shadow-red-100",
                    unitLinks.length > 0 ? "bg-slate-300 cursor-not-allowed shadow-none" : "bg-red-600 hover:bg-red-700 active:scale-[0.98]"
                  )}
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Unit Modal */}
      {(isAddingUnit || unitToEdit) && (
        <UnitFormModal 
          unit={unitToEdit}
          onClose={() => {
            setIsAddingUnit(false);
            setUnitToEdit(null);
          }}
          onSave={(unitData) => {
            if (unitToEdit) {
              const newUnits = settings.unidades.map((u: any) => u.id === unitToEdit.id ? { ...u, ...unitData } : u);
              updateSetting('unidades', '', newUnits);
              toast.success('Unidade atualizada com sucesso!');
            } else {
              const newUnit = {
                id: Math.random().toString(36).substr(2, 9),
                ...unitData,
                isActive: true
              };
              updateSetting('unidades', '', [...settings.unidades, newUnit]);
              toast.success('Unidade cadastrada com sucesso!');
            }
            setIsAddingUnit(false);
            setUnitToEdit(null);
          }}
        />
      )}
    </div>
  );
}

function UnitFormModal({ unit, onClose, onSave }: { unit?: any, onClose: () => void, onSave: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: unit?.name || '',
    address: unit?.address || '',
    phone: unit?.phone || '',
    isActive: unit ? unit.isActive : true,
    logo: unit?.logo || ''
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-white animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
              {unit ? <Edit2 size={20} /> : <Plus size={20} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{unit ? 'Editar Unidade' : 'Nova Unidade'}</h2>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">Configurações da clínica</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-5">
          {/* Logo Upload */}
          <div className="flex flex-col items-center gap-4 mb-4">
            <div className="relative group">
              <div className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-300">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="text-slate-300" size={32} />
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-indigo-700 transition-all border-2 border-white">
                <Upload size={14} />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logo da Unidade</p>
            <div className="flex items-start gap-2 max-w-[200px] text-center">
              <Info className="text-amber-500 shrink-0 mt-0.5" size={12} />
              <p className="text-[9px] text-slate-400 leading-relaxed italic">
                Dimensões ideais: <strong className="text-slate-500">300x300px</strong> (1:1) ou <strong className="text-slate-500">600x160px</strong> (proporção horizontal) para evitar distorções na impressão do PDF.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome da Unidade</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Ex: Unidade Centro"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Endereço</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Rua, Número, Bairro, Cidade"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Telefone</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="(00) 0000-0000"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
              <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <div>
               <p className="text-xs font-bold text-slate-800">Unidade Ativa</p>
               <p className="text-[10px] text-slate-400 font-medium">Define se a unidade estará disponível na agenda.</p>
             </div>
             <div 
               onClick={() => setFormData({...formData, isActive: !formData.isActive})}
               className={cn(
                 "w-12 h-6 rounded-full transition-colors relative cursor-pointer",
                 formData.isActive ? "bg-emerald-500" : "bg-slate-200"
               )}
             >
               <div className={cn(
                 "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                 formData.isActive ? "left-7" : "left-1"
               )} />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button 
              onClick={onClose}
              className="py-3.5 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={() => onSave(formData)}
              disabled={!formData.name}
              className="py-3.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {unit ? 'Salvar Alterações' : 'Cadastrar Unidade'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MalaDireta({ searchQuery }: { searchQuery: string }) {
  const filteredPatients = mockPatients.filter(p => {
    const search = normalizeString(searchQuery);
    return normalizeString(p.name).includes(search);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Lista de Contatos para Mala Direta</h4>
            <p className="text-[10px] text-slate-400 font-medium">Selecione um paciente para iniciar uma comunicação direta.</p>
          </div>
          <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold">
            {filteredPatients.length} Pacientes Encontrados
          </span>
        </div>
        <div className="divide-y divide-slate-50">
          {filteredPatients.map((patient: any) => (
            <div key={patient.id} className="p-4 hover:bg-slate-50/50 transition-all flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm">
                  {patient.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{patient.name}</p>
                  <p className="text-[10px] text-slate-400">{patient.email} • {patient.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <a 
                  href={`mailto:${patient.email}`} 
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                  title="Enviar Email"
                >
                  <Mail size={16} />
                </a>
                <a 
                  href={`https://wa.me/${patient.phone.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                  title="Enviar WhatsApp"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.626 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Campanhas({ searchQuery }: { searchQuery: string }) {
  const [campaigns, setCampaigns] = useState([
    { id: 1, title: 'Aniversariantes do Mês', desc: 'Envie felicitações e descontos especiais.', icon: Calendar, color: 'indigo', status: 'Ativo', patientsReached: 124, type: 'aniversario', audienceId: '2' },
    { id: 2, title: 'Reativar Inativos', desc: 'Pacientes que não agendam há mais de 6 meses.', icon: History, color: 'amber', status: 'Ativação Pendente', patientsReached: 0, type: 'reativacao', audienceId: '3' },
    { id: 3, title: 'Confirmação de Agenda', desc: 'Lembretes automáticos via WhatsApp/Email.', icon: CheckCircle, color: 'emerald', status: 'Ativo', patientsReached: 856, type: 'confirmacao', audienceId: '1' },
  ]);

  const [customAudiences, setCustomAudiences] = useState<any[]>([
    { id: '1', name: 'Todos os Pacientes', type: 'all' },
    { id: '2', name: 'Aniversariantes', type: 'birthday' },
    { id: '3', name: 'Inativos (> 6 meses)', type: 'inactive', months: 6 },
    { id: '4', name: 'Convênio Bradesco', type: 'insurance', insuranceName: 'Bradesco Saúde' },
  ]);

  const [activeConfig, setActiveConfig] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingAudience, setIsCreatingAudience] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedAudienceId, setSelectedAudienceId] = useState('1');
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [editingAudience, setEditingAudience] = useState<any>(null);
  const [audienceToDelete, setAudienceToDelete] = useState<any>(null);

  const handleSaveAudience = (data: any) => {
    if (editingAudience) {
      const newAudiences = customAudiences.map(a => a.id === editingAudience.id ? { ...a, ...data } : a);
      setCustomAudiences(newAudiences);
      if (selectedAudienceId === editingAudience.id) {
         setFormData(prev => ({ ...prev, audienceId: editingAudience.id }));
      }
      toast.success(`Público-alvo "${data.name}" atualizado com sucesso!`);
    } else {
      const id = Math.random().toString(36).substr(2, 9);
      const audienceWithId = { ...data, id };
      setCustomAudiences([...customAudiences, audienceWithId]);
      setSelectedAudienceId(id);
      setFormData(prev => ({ ...prev, audienceId: id }));
      toast.success(`Público-alvo "${data.name}" criado com sucesso!`);
    }
    setIsCreatingAudience(false);
    setEditingAudience(null);
  };

  const confirmDeleteAudience = () => {
    const itemToRemove = audienceToDelete;
    const previousAudiences = [...customAudiences];
    const newAudiences = customAudiences.filter(a => a.id !== itemToRemove.id);
    
    setCustomAudiences(newAudiences);
    if (selectedAudienceId === itemToRemove.id) {
      setSelectedAudienceId('1');
      setFormData(prev => ({ ...prev, audienceId: '1' }));
    }
    
    toast.info(
      <div className="flex items-center justify-between gap-2 w-full overflow-hidden">
        <span className="text-[11px] font-medium truncate min-w-0">
          Público <strong>{itemToRemove.name}</strong> excluído
        </span>
        <button 
          onClick={() => {
            setCustomAudiences(previousAudiences);
            toast.dismiss();
            toast.success('Exclusão desfeita!');
          }}
          className="shrink-0 px-3 py-1 bg-white text-indigo-600 rounded-lg text-[10px] font-bold shadow-sm hover:bg-indigo-50 transition-colors whitespace-nowrap"
        >
          DESFAZER
        </button>
      </div>,
      { 
        icon: Trash2,
        autoClose: 5000,
        closeOnClick: false
      }
    );
    setAudienceToDelete(null);
  };

  const [formData, setFormData] = useState({
    title: '',
    desc: '',
    message: '',
    audienceId: '1'
  });

  React.useEffect(() => {
    if (activeConfig) {
      setFormData({
        title: activeConfig.title,
        desc: activeConfig.desc,
        message: activeConfig.message || (activeConfig.type === 'aniversario' ? "Olá {nome}, a equipe da ATAgenda deseja um feliz aniversário! Temos um presente especial para você..." : ""),
        audienceId: activeConfig.audienceId || '1'
      });
      setSelectedAudienceId(activeConfig.audienceId || '1');
    } else if (isCreating) {
      setFormData({
        title: '',
        desc: 'Nova campanha customizada',
        message: '',
        audienceId: '1'
      });
      setSelectedAudienceId('1');
    }
  }, [activeConfig, isCreating]);

  const getFilteredPatients = (audienceId: string) => {
    const audience = customAudiences.find(a => a.id === audienceId) || customAudiences[0];
    const today = new Date();
    
    switch (audience.type) {
      case 'birthday':
        return mockPatients.filter(p => {
          const birthDate = new Date(p.birthDate);
          return birthDate.getMonth() === today.getMonth();
        });
      case 'inactive':
        const months = audience.months || 6;
        return mockPatients.filter(p => {
          const patientApps = mockAppointments.filter(app => app.patientId === p.id);
          if (patientApps.length === 0) return true;
          const lastApp = [...patientApps].sort((a,b) => b.date.localeCompare(a.date))[0];
          const lastDate = new Date(lastApp.date);
          return differenceInMonths(today, lastDate) >= months;
        });
      case 'insurance':
        return mockPatients.filter(p => {
          return mockAppointments.some(app => app.patientId === p.id && app.insurance === audience.insuranceName);
        });
      default:
        return mockPatients;
    }
  };

  const handleRunCampaign = (campaign: any) => {
    const targetPatients = getFilteredPatients(campaign.audience);
    
    if (targetPatients.length === 0) {
      toast.warning('Nenhum paciente encontrado para este público-alvo.');
      return;
    }

    setIsSending(true);
    setSendProgress(0);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        setSendProgress(100);
        
        // Finalize after a short delay to show 100% completion
          setTimeout(() => {
            setIsSending(false);
            setCampaigns(prevCampaigns => prevCampaigns.map(c => 
              c.id === campaign.id 
                ? { ...c, patientsReached: c.patientsReached + targetPatients.length, status: 'Ativo' } 
                : c
            ));
            toast.success(`Campanha executada! ${targetPatients.length} mensagens enviadas.`);
          }, 300);
      } else {
        setSendProgress(currentProgress);
      }
    }, 200);
  };

  const handleSaveCampaign = (data: any) => {
    const finalData = { ...data, status: 'Ativo' };
    if (activeConfig?.id) {
      setCampaigns(campaigns.map(c => c.id === activeConfig.id ? { ...c, ...finalData } : c));
      toast.success('Campanha atualizada e ativada com sucesso!');
    } else {
      setCampaigns([...campaigns, { ...finalData, id: Date.now(), patientsReached: 0, icon: Megaphone, color: 'indigo' }]);
      toast.success('Nova campanha criada e ativada!');
    }
    setActiveConfig(null);
    setIsCreating(false);
  };

  const filteredCampaigns = campaigns.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isSending) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-indigo-50/50 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <Megaphone size={40} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Enviando Campanha...</h3>
        <p className="text-sm text-slate-500 mb-8 max-w-xs text-center">Processando disparo de mensagens para o público selecionado via WhatsApp e E-mail.</p>
        
        <div className="w-full max-w-md bg-slate-100 h-3 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${sendProgress}%` }}
          />
        </div>
        <p className="mt-4 text-sm font-bold text-indigo-600">{sendProgress}% Concluído</p>
      </div>
    );
  }

  if (activeConfig || isCreating) {
    return (
      <>
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h4 className="text-xl font-bold text-slate-900">{isCreating ? 'Nova Campanha' : `Configurar: ${activeConfig.title}`}</h4>
            <p className="text-sm text-slate-500">Defina os parâmetros e a mensagem para esta campanha.</p>
          </div>
          <button 
            onClick={() => { setActiveConfig(null); setIsCreating(false); }}
            className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Título da Campanha</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Promoção de Verão"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Público-Alvo</label>
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium flex items-center justify-between group"
                >
                  <span className="text-slate-700">{customAudiences.find(a => a.id === selectedAudienceId)?.name}</span>
                  <ChevronDown className={cn("text-slate-400 transition-transform duration-300", isDropdownOpen ? "rotate-180" : "")} size={18} />
                </button>

                {isDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 p-2 z-20 animate-in fade-in zoom-in-95 duration-200 origin-top">
                      <div className="max-h-60 overflow-y-auto p-1">
                        {customAudiences.map((audience) => (
                          <div key={audience.id} className="relative flex items-center group/item hover:bg-slate-50 rounded-xl">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAudienceId(audience.id);
                                setFormData({ ...formData, audienceId: audience.id });
                                setIsDropdownOpen(false);
                              }}
                              className="flex-1 text-left px-3 py-2.5 text-sm transition-all flex items-center justify-between group rounded-xl"
                            >
                              <span className={cn(selectedAudienceId === audience.id ? "text-indigo-700 font-bold" : "text-slate-600")}>
                                {audience.name}
                              </span>
                              {selectedAudienceId === audience.id && <Check size={14} className="text-indigo-600 mr-2" />}
                            </button>
                            {audience.id !== '1' && (
                              <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 pr-2 transition-opacity">
                                <button type="button" onClick={(e) => { e.stopPropagation(); setEditingAudience(audience); setIsCreatingAudience(true); setIsDropdownOpen(false); }} className="p-1.5 hover:bg-white text-slate-400 hover:text-indigo-600 border border-transparent hover:border-slate-200 rounded-lg shadow-sm transition-all"><Edit2 size={14}/></button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setAudienceToDelete(audience); setIsDropdownOpen(false); }} className="p-1.5 hover:bg-white text-slate-400 hover:text-red-500 border border-transparent hover:border-slate-200 rounded-lg shadow-sm transition-all"><Trash2 size={14}/></button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-50">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingAudience(true);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-indigo-600 font-bold hover:bg-indigo-50 transition-all flex items-center gap-2"
                        >
                          <Plus size={14} />
                          Criar Novo Público-Alvo
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Canal de Envio</label>
              <div className="flex gap-4">
                <label className="flex-1 flex items-center justify-center gap-2 p-4 border border-emerald-100 bg-emerald-50/50 rounded-2xl cursor-pointer hover:bg-emerald-50 transition-colors">
                  <input type="checkbox" defaultChecked className="accent-emerald-500" />
                  <span className="text-xs font-bold text-emerald-700">WhatsApp</span>
                </label>
                <label className="flex-1 flex items-center justify-center gap-2 p-4 border border-indigo-100 bg-indigo-50/50 rounded-2xl cursor-pointer hover:bg-indigo-50 transition-colors">
                  <input type="checkbox" defaultChecked className="accent-indigo-500" />
                  <span className="text-xs font-bold text-indigo-700">E-mail</span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Template da Mensagem</label>
              <textarea 
                rows={6}
                placeholder="Escreva sua mensagem aqui... Use {nome} para personalizar."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium resize-none"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
              <p className="text-[10px] text-slate-400 italic">Variáveis disponíveis: {'{nome}'}, {'{data}'}, {'{unidade}'}</p>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl">
              <div className="flex gap-3">
                <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  <strong>Atenção:</strong> Mensagens automáticas via WhatsApp requerem que o sistema esteja pareado. Certifique-se de que sua conta está ativa.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-slate-50">
          <button 
            onClick={() => { setActiveConfig(null); setIsCreating(false); }}
            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all font-sans"
          >
            Cancelar
          </button>
          <button 
            onClick={() => handleSaveCampaign(formData)}
            disabled={!formData.title}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100 font-sans disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Salvar e Ativar
          </button>
        </div>
      </div>
      {isCreatingAudience && (
        <AudienceFormModal 
          audienceToEdit={editingAudience}
          onClose={() => {
            setIsCreatingAudience(false);
            setEditingAudience(null);
          }}
          onSave={handleSaveAudience}
        />
      )}
      {audienceToDelete && (
        <DeleteConfirmationModal
          itemName={audienceToDelete.name}
          itemType="público-alvo"
          onClose={() => setAudienceToDelete(null)}
          onConfirm={confirmDeleteAudience}
        />
      )}
      </>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Suas Campanhas</h4>
          <p className="text-[10px] text-slate-400 font-medium">Gerencie suas automações e comunicações em massa.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95"
        >
          <Plus size={16} />
          Nova Campanha
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.filter(c => 
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.desc.toLowerCase().includes(searchQuery.toLowerCase())
        ).map((item: any) => (
          <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all cursor-pointer group relative overflow-hidden">
            <div className={cn("absolute top-6 right-6 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest",
              item.status === 'Ativo' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
              {item.status}
            </div>
            
            <div className={cn("w-14 h-14 rounded-[1.25rem] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform", 
              item.color === 'indigo' ? "bg-indigo-50/50 text-indigo-600" : 
              item.color === 'amber' ? "bg-amber-50/50 text-amber-600" : "bg-emerald-50/50 text-emerald-600")}>
              {React.createElement(item.icon, { size: 28 })}
            </div>
            
            <h4 className="font-bold text-slate-800 mb-2 text-base">{item.title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-6 h-8 line-clamp-2">{item.desc}</p>
            
            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Impacto</span>
                <span className="text-sm font-bold text-slate-900">{item.patientsReached} Pacientes</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleRunCampaign(item); }}
                  className={cn("p-2 rounded-xl text-white hover:brightness-95 transition-all flex items-center gap-2",
                    item.color === 'indigo' ? "bg-indigo-600" : 
                    item.color === 'amber' ? "bg-amber-600" : "bg-emerald-600")}
                  title="Executar Campanha agora"
                >
                  <Plus size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveConfig(item); }}
                  className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[11px] font-bold hover:bg-slate-100 transition-all flex items-center gap-2 border border-slate-200"
                >
                  <SettingsIcon size={14} />
                  Configurar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-indigo-50/50 via-white to-slate-50/50 rounded-[3rem] p-10 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
            <Megaphone size={20} />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-800">Métricas de Engajamento</h4>
            <p className="text-xs text-slate-400">Resultados consolidados das campanhas nos últimos 30 dias.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Emails Enviados', value: '1.240', trend: '+12%', color: 'indigo' },
            { label: 'Taxa de Abertura', value: '42%', trend: '+5%', color: 'emerald' },
            { label: 'Cliques no Link', value: '18%', trend: '-2%', color: 'amber' },
            { label: 'Novos Agendamentos', value: '156', trend: '+24%', color: 'indigo' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative group overflow-hidden">
              <div className={cn("absolute bottom-0 left-0 w-full h-1 transition-all", 
                stat.color === 'indigo' ? "bg-indigo-600" : 
                stat.color === 'emerald' ? "bg-emerald-600" : "bg-amber-600")} />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-slate-900 leading-none">{stat.value}</p>
                <p className={cn("text-[10px] font-bold", stat.trend.startsWith('+') ? "text-emerald-500" : "text-amber-500")}>
                  {stat.trend}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function AudienceFormModal({ onClose, onSave, audienceToEdit }: { onClose: () => void, onSave: (data: any) => void, audienceToEdit?: any }) {
  const [formData, setFormData] = useState({
    name: audienceToEdit?.name || '',
    type: audienceToEdit?.type || 'inactive',
    months: audienceToEdit?.months || 12,
    insuranceName: audienceToEdit?.insuranceName || mockInsurances[0]?.name || ''
  });

  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isInsuranceDropdownOpen, setIsInsuranceDropdownOpen] = useState(false);

  const filterTypes = [
    { value: 'inactive', label: 'Inatividade (Meses)' },
    { value: 'birthday', label: 'Aniversariantes' },
    { value: 'insurance', label: 'Por Convênio' }
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-white animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{audienceToEdit ? 'Editar Público-Alvo' : 'Novo Público-Alvo'}</h2>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">Defina as regras de filtragem</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Público</label>
            <input 
              type="text" 
              placeholder="Ex: Inativos 1 ano"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo de Filtro</label>
            <div className="relative">
              <button 
                type="button"
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium flex items-center justify-between group"
              >
                <span className="text-slate-700">{filterTypes.find(t => t.value === formData.type)?.label}</span>
                <ChevronDown className={cn("text-slate-400 transition-transform duration-300", isTypeDropdownOpen ? "rotate-180" : "")} size={18} />
              </button>

              {isTypeDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setIsTypeDropdownOpen(false)}
                  />
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 p-2 z-30 animate-in fade-in zoom-in-95 duration-200 origin-top">
                    {filterTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          setFormData({...formData, type: type.value as any});
                          setIsTypeDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between group",
                          formData.type === type.value 
                            ? "bg-indigo-50 text-indigo-700 font-bold" 
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        {type.label}
                        {formData.type === type.value && <Check size={14} className="text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {formData.type === 'inactive' && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Meses de Inatividade</label>
              <input 
                type="number" 
                min="1"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={formData.months}
                onChange={(e) => setFormData({...formData, months: parseInt(e.target.value)})}
              />
            </div>
          )}

          {formData.type === 'insurance' && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Selecionar Convênio</label>
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setIsInsuranceDropdownOpen(!isInsuranceDropdownOpen)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium flex items-center justify-between group"
                >
                  <span className="text-slate-700">{formData.insuranceName || 'Selecione...'}</span>
                  <ChevronDown className={cn("text-slate-400 transition-transform duration-300", isInsuranceDropdownOpen ? "rotate-180" : "")} size={18} />
                </button>

                {isInsuranceDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-20" 
                      onClick={() => setIsInsuranceDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 p-2 z-30 animate-in fade-in zoom-in-95 duration-200 origin-top">
                      <div className="max-h-60 overflow-y-auto p-1">
                        {mockInsurances.map((ins) => (
                          <button
                            key={ins.id}
                            type="button"
                            onClick={() => {
                              setFormData({...formData, insuranceName: ins.name});
                              setIsInsuranceDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between group mt-1 first:mt-0",
                              formData.insuranceName === ins.name 
                                ? "bg-indigo-50 text-indigo-700 font-bold" 
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                          >
                            {ins.name}
                            {formData.insuranceName === ins.name && <Check size={14} className="text-indigo-600" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button 
              onClick={onClose}
              className="py-3.5 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all font-sans"
            >
              Cancelar
            </button>
            <button 
              onClick={() => onSave(formData)}
              disabled={!formData.name}
              className="py-3.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 font-sans"
            >
              {audienceToEdit ? 'Salvar Alterações' : 'Criar Público'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
