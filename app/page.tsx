'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Agenda from '@/components/Agenda';
import Patients from '@/components/Patients';
import Doctors from '@/components/Doctors';
import History from '@/components/History';
import NewAppointment from '@/components/NewAppointment';
import SystemSettings from '@/components/SystemSettings';
import Reports from '@/components/Reports';
import UserProfileModal from '@/components/UserProfileModal';
import GuidedTour from '@/components/GuidedTour';
import { ThemeToggle } from '@/components/ThemeToggle';
import { View } from '@/lib/types';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, User, LogIn } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<View>('agenda');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [appointmentData, setAppointmentData] = useState<{ date?: string, time?: string, doctorId?: string, unitId?: string } | null>(null);
  const [isTourOpen, setIsTourOpen] = useState(false);
  
  // Login State
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  const handleNewAppointment = (date?: string, time?: string, doctorId?: string, unitId?: string) => {
    setAppointmentData(date && time ? { date, time, doctorId, unitId } : null);
    setCurrentView('novo-agendamento');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock login
    if (loginForm.username && loginForm.password) {
      setIsLoggedIn(true);
      toast.success('Login realizado com sucesso!');
    } else {
      toast.error('Preencha os campos de usuário e senha.');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 transition-colors font-sans overflow-x-hidden">
        <div className="fixed top-4 right-4 sm:top-8 sm:right-8 z-50">
          <ThemeToggle />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[360px] sm:max-w-[400px] bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.2rem] shadow-2xl shadow-indigo-100/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors my-auto"
        >
          <div className="p-6 sm:p-8 text-center bg-indigo-600 text-white relative overflow-hidden shrink-0">
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl" />
            
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-5 backdrop-blur-md border border-white/30 relative z-10">
              <Lock size={24} className="sm:w-7 sm:h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight relative z-10">ATAgenda</h1>
            <p className="text-indigo-100 text-[10px] sm:text-xs mt-1 relative z-10 opacity-90">Acesse sua conta para continuar</p>
          </div>
          
          <form onSubmit={handleLogin} className="p-6 sm:p-10 space-y-4 sm:space-y-6">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Usuário</label>
              <div className="relative group">
                <input 
                  type="text" 
                  required
                  placeholder="Seu usuário"
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative group">
                <input 
                  type="password" 
                  required
                  placeholder="Sua senha"
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-indigo-600 focus:ring-indigo-500 transition-all" />
                Lembrar senha
              </label>
              <button type="button" className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">Esqueceu a senha?</button>
            </div>

            <button 
              type="submit"
              className="w-full py-3 sm:py-3.5 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-100 dark:shadow-none"
            >
              <LogIn size={20} />
              Entrar no Sistema
            </button>
          </form>
          
          <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-bold">
              © 2026 ALRION TECH • Versão 2026
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginForm({ username: '', password: '' });
    toast.info('Sessão encerrada.');
  };

  const renderView = () => {
    switch (currentView) {
      case 'agenda': return <Agenda onNewAppointment={handleNewAppointment} searchQuery={searchQuery} />;
      case 'pacientes': return <Patients searchQuery={searchQuery} />;
      case 'medicos': return <Doctors searchQuery={searchQuery} />;
      case 'historico': return <History searchQuery={searchQuery} />;
      case 'novo-agendamento': return <NewAppointment initialData={appointmentData} onCancel={() => setCurrentView('agenda')} />;
      case 'configuracoes': return <SystemSettings searchQuery={searchQuery} setView={setCurrentView} />;
      case 'relatorios': return <Reports />;
      default: return <Agenda onNewAppointment={handleNewAppointment} searchQuery={searchQuery} />;
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'agenda': return 'Agenda de Atendimentos';
      case 'pacientes': return 'Gestão de Pacientes';
      case 'medicos': return 'Corpo Clínico';
      case 'historico': return 'Histórico de Atendimentos';
      case 'novo-agendamento': return 'Novo Agendamento';
      case 'configuracoes': return 'Configurações do Sistema';
      case 'relatorios': return 'Relatórios e Dashboards';
      default: return 'Agenda';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          setSidebarOpen={setSidebarOpen} 
          title={getViewTitle()} 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onStartTour={() => setIsTourOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      {isProfileModalOpen && (
        <UserProfileModal 
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
      <GuidedTour 
        isOpen={isTourOpen} 
        onClose={() => setIsTourOpen(false)} 
        onSetView={setCurrentView}
      />
    </div>
  );
}
