'use client';

import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  User, 
  Mail, 
  Lock, 
  Check,
  Eye,
  EyeOff,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';

interface UserProfileModalProps {
  onClose: () => void;
  onUpdate: (data: any) => void;
  user: any;
}

export default function UserProfileModal({ onClose, onUpdate, user }: UserProfileModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || 'Lucas Silva',
    email: user?.email || 'lucas.silva@atagenda.com',
    currentPassword: '',
    newPassword: '',
    avatar: user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=EEF2FF&color=4F46E5&size=128`
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ name: formData.name, avatar: formData.avatar });
    toast.success('Perfil atualizado com sucesso!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[96vh] sm:max-h-[92vh] overflow-hidden flex flex-col border border-white dark:border-slate-800 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:px-5 py-3 sm:px-6 sm:py-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">Perfil do Usuário</h2>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Gerencie suas informações pessoais</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-6 sm:p-8 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden group-hover:brightness-90 transition-all">
                <img 
                  src={formData.avatar} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 text-white rounded-xl sm:rounded-2xl border-4 border-white dark:border-slate-800 flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all hover:scale-110 active:scale-95"
              >
                <Camera size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">{user?.profile || 'Administrador'}</p>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-slate-100"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Seu nome"
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
              <div className="relative">
                <input 
                  type="email" 
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none"
                  value={formData.email}
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Check size={14} className="text-emerald-500" />
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="pt-2">
              <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] sm:rounded-xl border border-slate-100 dark:border-slate-800 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Lock size={16} className="text-slate-400" />
                  <h4 className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Alterar Senha</h4>
                </div>

                <div className="space-y-1.5">
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="w-full px-4 py-2 sm:py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-slate-100"
                      placeholder="Senha Atual"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="w-full px-4 py-2 sm:py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg sm:rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-slate-100"
                    placeholder="Nova Senha"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  />
                </div>
                
                <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium px-1">
                  A senha deve conter pelo menos 8 caracteres, incluindo letras e números.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2 shrink-0">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 sm:py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl sm:rounded-2xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-[2] py-3 sm:py-4 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-bold text-sm hover:bg-indigo-700 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2 px-6 sm:px-6 sm:px-8"
            >
              <Save size={18} /> Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
