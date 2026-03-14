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
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';

type SettingTab = 'perfis' | 'convenios' | 'procedimentos' | 'mala-direta' | 'campanha';

export default function SystemSettings({ searchQuery = '' }: { searchQuery?: string }) {
  const [activeTab, setActiveTab] = useState<SettingTab>('perfis');

  const tabs: { id: SettingTab; label: string; icon: any }[] = [
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
      case 'convenios':
        return <Insurances searchQuery={searchQuery} />;
      case 'procedimentos':
        return <Procedures searchQuery={searchQuery} />;
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

  const filteredProfiles = profiles.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

function Insurances({ searchQuery = '' }: { searchQuery: string }) {
  const [insurances, setInsurances] = useState([
    { id: 1, name: 'Unimed', status: 'Ativo' as const, patients: 142 },
    { id: 2, name: 'Bradesco Saúde', status: 'Ativo' as const, patients: 89 },
    { id: 3, name: 'SulAmérica', status: 'Ativo' as const, patients: 56 },
    { id: 4, name: 'Particular', status: 'Ativo' as const, patients: 210 },
  ]);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredInsurances = insurances.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a: any, b: any) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const handleSave = (data: any) => {
    if (editingInsurance) {
      setInsurances(insurances.map(i => i.id === editingInsurance.id ? { ...i, ...data } : i));
      toast.success('Convênio atualizado!');
    } else {
      setInsurances([...insurances, { id: Date.now(), ...data, patients: 0 }]);
      toast.success('Convênio criado com sucesso!');
    }
    setModalOpen(false);
    setEditingInsurance(null);
  };

  const confirmDelete = () => {
    const itemToRemove = itemToDelete;
    const previousInsurances = [...insurances];
    setInsurances(insurances.filter(i => i.id !== itemToRemove.id));
    
    toast.info(
      <div className="flex items-center justify-between gap-2 w-full overflow-hidden">
        <span className="text-[11px] font-medium truncate min-w-0">
          Convênio <strong>{itemToRemove.name}</strong> excluído
        </span>
        <button 
          onClick={() => {
            setInsurances(previousInsurances);
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

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
        <h3 className="font-bold text-slate-900">Convênios Ativos</h3>
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
            {filteredInsurances.map((ins) => (
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
    </div>
  );
}

function Procedures({ searchQuery = '' }: { searchQuery: string }) {
  const [procedures, setProcedures] = useState([
    { id: 1, name: 'Consulta Médica', modality: 'CONSULTA', price: '250.00', preparation: 'Sem preparo.' },
    { id: 2, name: 'US Abdome Total', modality: 'US', price: '380.00', preparation: 'Jejum de 8h.' },
    { id: 3, name: 'RX Tórax PA/Perfil', modality: 'CR', price: '150.00', preparation: 'Sem joias.' },
    { id: 4, name: 'Mamografia Digital', modality: 'MG', price: '450.00', preparation: 'Sem desodorante.' },
    { id: 5, name: 'Tomografia de Crânio', modality: 'CT', price: '600.00', preparation: 'Contraste: jejum 4h.' },
  ]);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sanitizeStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredProcedures = procedures.filter(p => {
    const search = sanitizeStr(searchQuery);
    return sanitizeStr(p.name).includes(search) ||
           sanitizeStr(p.modality).includes(search);
  }).sort((a: any, b: any) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const valA = key === 'price' ? parseFloat(a[key]) : a[key];
    const valB = key === 'price' ? parseFloat(b[key]) : b[key];
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const handleSave = (data: any) => {
    if (editingProcedure) {
      setProcedures(procedures.map(p => p.id === editingProcedure.id ? { ...p, ...data } : p));
      toast.success('Procedimento atualizado!');
    } else {
      setProcedures([...procedures, { id: Date.now(), ...data }]);
      toast.success('Procedimento criado!');
    }
    setModalOpen(false);
    setEditingProcedure(null);
  };

  const confirmDelete = () => {
    const itemToRemove = itemToDelete;
    const previousProcedures = [...procedures];
    setProcedures(procedures.filter(p => p.id !== itemToRemove.id));
    
    toast.info(
      <div className="flex items-center justify-between gap-2 w-full overflow-hidden">
        <span className="text-[11px] font-medium truncate min-w-0">
          Procedimento <strong>{itemToRemove.name}</strong> excluído
        </span>
        <button 
          onClick={() => {
            setProcedures(previousProcedures);
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Procedimentos</h3>
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
              {filteredProcedures.map((proc) => (
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
        </div>
      </div>

      {modalOpen && (
        <ProcedureModal 
          procedure={editingProcedure}
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
      preparation: preparation
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
