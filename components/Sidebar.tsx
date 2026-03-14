'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Users, 
  UserRound, 
  User,
  History, 
  PlusCircle,
  Menu,
  X,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  CreditCard,
  ClipboardList,
  Mail,
  Megaphone,
  ChevronDown,
  BarChart3
} from 'lucide-react';
import { View } from '@/lib/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  onOpenProfile: () => void;
}

export default function Sidebar({ 
  currentView, 
  setView, 
  isOpen, 
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
  onOpenProfile
}: SidebarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuItems = [
    { id: 'novo-agendamento', label: 'Novo Agendamento', icon: PlusCircle, primary: true },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'pacientes', label: 'Pacientes', icon: Users },
    { id: 'medicos', label: 'Médicos', icon: UserRound },
    { id: 'historico', label: 'Histórico', icon: History },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-2xl lg:shadow-none flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-20" : "w-64"
      )}>
        {/* Header */}
        <div className={cn(
          "p-4 md:p-6 border-b border-slate-100 flex items-center shrink-0 transition-all duration-300",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <div className="flex items-center gap-2 shrink-0 overflow-hidden">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-indigo-100">
              AT
            </div>
            {!isCollapsed && (
              <span className="font-bold text-lg md:text-xl tracking-tight text-slate-900 animate-in fade-in slide-in-from-left-2 duration-300">
                ATAgenda
              </span>
            )}
          </div>
          
          <button 
            onClick={() => isCollapsed ? setIsCollapsed(false) : setIsCollapsed(true)}
            className="hidden lg:flex p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>

          <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav id="sidebar-nav" className="flex-1 px-2 py-6 space-y-2 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => {
                setView(item.id as View);
                if (window.innerWidth < 1024) setIsOpen(false);
              }}
              className={cn(
                "w-full flex transition-all group relative duration-200",
                isCollapsed 
                  ? "flex-col items-center justify-center py-3 rounded-xl gap-1" 
                  : "flex-row items-center gap-3 px-3 py-3 rounded-xl",
                currentView === item.id 
                  ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-50/50" 
                  : item.primary 
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 mb-6 shadow-md shadow-indigo-100 active:scale-[0.98]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className={cn(
                "shrink-0 transition-transform duration-200 group-hover:scale-110",
                item.primary && !isCollapsed && "mr-1"
              )}>
                <item.icon size={isCollapsed ? 18 : 20} />
              </div>
              
              <span className={cn(
                "truncate transition-all duration-300",
                isCollapsed 
                  ? "text-[9px] font-bold uppercase tracking-tight text-center w-full px-1" 
                  : "text-sm font-semibold animate-in fade-in slide-in-from-left-2"
              )}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white/50 backdrop-blur-sm relative">
          {/* User Tray Menu */}
          <AnimatePresence>
            {isUserMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={cn(
                  "absolute bottom-full left-4 right-4 mb-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[60]",
                  isCollapsed && "left-2 right-2 w-48 left-full -ml-2 bottom-4"
                )}
              >
                <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sua Conta</p>
                </div>
                <div className="p-2">
                  <button 
                    onClick={() => {
                      onOpenProfile();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-all"
                  >
                    <User size={18} />
                    Meu Perfil
                  </button>
                  <div className="h-px bg-slate-100 my-2" />
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <LogOut size={18} />
                    Sair do Sistema
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isCollapsed ? (
            <div className="flex flex-col gap-3">
              <button 
                id="user-profile-button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={cn(
                  "flex items-center gap-3 px-2 py-2 rounded-2xl transition-all text-left group",
                  isUserMenuOpen ? "bg-slate-50 ring-1 ring-slate-100" : "hover:bg-slate-50"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold shrink-0 shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                  <img src="https://ui-avatars.com/api/?name=Lucas+Silva&background=EEF2FF&color=4F46E5" alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold text-slate-900 truncate text-sm leading-tight">Lucas Silva</p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider truncate">Admin</p>
                </div>
                <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-300", isUserMenuOpen && "rotate-180")} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-2">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={cn(
                  "w-10 h-10 rounded-xl border flex items-center justify-center text-indigo-600 transition-all shadow-sm group overflow-hidden",
                  isUserMenuOpen ? "bg-indigo-600 border-indigo-600 text-white" : "bg-indigo-50 border-indigo-100 hover:bg-indigo-100"
                )}
              >
                <img src="https://ui-avatars.com/api/?name=Lucas+Silva&background=EEF2FF&color=4F46E5" alt="Avatar" className="w-full h-full object-cover" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
