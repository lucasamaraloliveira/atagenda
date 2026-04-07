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
import { mockSystemSettings } from '@/lib/mockData';
import { supabase } from '@/lib/supabase';
import { supabaseService } from '@/lib/supabaseService';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, User, LogIn, AlertTriangle } from 'lucide-react';
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Login/Register State
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [isEmailInUse, setIsEmailInUse] = useState(false);

  const handleNewAppointment = (date?: string, time?: string, doctorId?: string, unitId?: string) => {
    setAppointmentData(date && time ? { date, time, doctorId, unitId } : null);
    setCurrentView('novo-agendamento');
  };

  // Persistence Check & Auth State Change Listener
  React.useEffect(() => {
    // 1. Check current session
    supabaseService.getCurrentUser().then(async (user) => {
      if (user) {
        const profile = await supabaseService.getUserProfile(user.id);
        if (profile) {
          setCurrentUser(profile);
          setIsLoggedIn(true);
        }
      }
    });

    // 2. Listen for auth changes (Confirmation Emails, Logouts, etc)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await supabaseService.getUserProfile(session.user.id);
        if (profile) {
          setCurrentUser(profile);
          setIsLoggedIn(true);
        }
      }
      if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailInput = loginForm.email?.trim().toLowerCase();
    const passwordInput = loginForm.password;

    console.log('🔍 Tentativa de Login/Cadastro:', { email: emailInput, hasPassword: !!passwordInput });

    if (!emailInput || !passwordInput) {
      toast.error('Informe e-mail e senha!');
      return;
    }

    if (isRegistering) {
      if (passwordInput !== loginForm.confirmPassword) {
        toast.error('As senhas não coincidem!');
        return;
      }
      
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: emailInput,
          password: passwordInput,
        });

        if (authError) throw authError;

        if (authData.user) {
          await supabaseService.createProfile({
            id: authData.user.id,
            name: loginForm.username || 'Admin',
            email: emailInput,
            profile: 'Administrador',
            permissions: ['Total']
          });
          
          toast.success('Cadastro realizado! Verifique seu e-mail ou faça login.');
          setIsRegistering(false);
        }
      } catch (err: any) {
        toast.error(err.message || 'Erro ao realizar cadastro.');
      }
    } else {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailInput,
          password: passwordInput,
        });

        if (error) throw error;

        if (data.user) {
          const profile = await supabaseService.getUserProfile(data.user.id);
          if (profile) {
            setCurrentUser(profile);
            setIsLoggedIn(true);
            toast.success(`Bem-vindo, ${profile.name}!`);
          } else {
            // Se o perfil não existir por algum motivo, cria um básico
            const newProfile = await supabaseService.createProfile({
               id: data.user.id,
               name: data.user.email?.split('@')[0] || 'Usuário',
               email: data.user.email || '',
               profile: 'Administrador',
               permissions: ['Total']
            });
            setCurrentUser(newProfile);
            setIsLoggedIn(true);
            toast.success('Perfil criado e acesso liberado!');
          }
        }
      } catch (err: any) {
        toast.error(err.message || 'E-mail ou senha incorretos.');
      }
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex lg:grid lg:grid-cols-2 items-center justify-center transition-colors font-sans overflow-hidden">
        <div className="fixed top-4 right-4 sm:top-8 sm:right-8 z-[60]">
          <ThemeToggle />
        </div>
        
        {/* Left Side - Visual (Desktop Only) */}
        <div className="hidden lg:flex flex-col items-center justify-center bg-indigo-600 h-full p-8 xl:p-12 text-white relative overflow-hidden">
             {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 max-w-sm xl:max-w-md text-center">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 xl:w-24 xl:h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 xl:mb-8 backdrop-blur-xl border border-white/30"
                >
                    <Lock size={40} className="xl:w-12 xl:h-12" />
                </motion.div>
                <h1 className="text-4xl xl:text-5xl font-black tracking-tight mb-4">ATAgenda</h1>
                <p className="text-lg xl:text-xl text-indigo-100 font-medium opacity-90 leading-relaxed">
                   A plataforma inteligente para gestão de clínicas e centros de imagem.
                </p>
                
                <div className="mt-8 xl:mt-12 grid grid-cols-2 gap-4">
                    <div className="p-3 xl:p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <p className="text-xl xl:text-2xl font-bold">100%</p>
                        <p className="text-[9px] xl:text-[10px] uppercase font-bold tracking-widest opacity-70">Seguro</p>
                    </div>
                    <div className="p-3 xl:p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <p className="text-xl xl:text-2xl font-bold">Cloud</p>
                        <p className="text-[9px] xl:text-[10px] uppercase font-bold tracking-widest opacity-70">Supabase</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="w-full flex items-center justify-center p-4 lg:p-6 xl:p-12">
            <motion.div 
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full max-w-[360px] xl:max-w-[420px] bg-white dark:bg-slate-900 rounded-3xl xl:rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transition-all"
            >
              <div className={cn(
                "text-center bg-indigo-600 lg:bg-transparent lg:text-slate-900 dark:lg:text-white text-white relative overflow-hidden shrink-0 transition-all",
                isRegistering ? "p-3 xl:p-6" : "p-5 xl:p-8"
              )}>
                <div className="lg:hidden">
                    {!isRegistering && (
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2 backdrop-blur-md border border-white/30 relative z-10">
                            <Lock size={20} />
                        </div>
                    )}
                    <h1 className={cn("font-bold tracking-tight relative z-10", isRegistering ? "text-base" : "text-lg")}>ATAgenda</h1>
                </div>

                <div className="hidden lg:block text-left">
                    <h2 className={cn("font-black tracking-tight transition-all", isRegistering ? "text-lg xl:text-2xl" : "text-xl xl:text-2xl")}>
                        {isRegistering ? 'Nova Conta' : 'Painel de Acesso'}
                    </h2>
                    {!isRegistering && (
                        <p className="hidden xl:block text-slate-500 dark:text-slate-400 text-xs mt-1">Insira suas credenciais.</p>
                    )}
                </div>
              </div>
              
              <form onSubmit={handleLogin} className={cn(
                "p-5 xl:p-8 lg:pt-0 transition-all",
                isRegistering ? "space-y-2 xl:space-y-4 pt-1" : "space-y-3 xl:space-y-5 pt-2"
              )}>
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Usuário</label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      required
                      placeholder="Nome"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                    />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
                  </div>
                </div>

                {isRegistering && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1 text-left">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                        <div className="relative group">
                            <input 
                            type="email" 
                            required
                            placeholder="seu@email.com"
                            className={cn(
                              "w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs focus:ring-2 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500",
                              isEmailInUse 
                                ? "border-red-500 focus:ring-red-500 ring-red-500/20" 
                                : "border-slate-200 dark:border-slate-700 focus:ring-indigo-500"
                            )}
                            value={loginForm.email}
                            onChange={(e) => {
                                const email = e.target.value;
                                setLoginForm({...loginForm, email});
                                // A validação em tempo real via Supabase poderia ser feita aqui,
                                // mas por economia de chamadas, vamos deixar para o momento do submit
                                // por enquanto desativamos o alerta de 'em uso' imediato via mock
                                setIsEmailInUse(false);
                            }}
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                            </div>
                            {isEmailInUse && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 animate-in fade-in zoom-in duration-200">
                                <AlertTriangle size={14} />
                              </div>
                            )}
                        </div>
                        {isEmailInUse && (
                          <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 animate-in slide-in-from-top-1 duration-200">Este e-mail já está em uso!</p>
                        )}
                    </div>
                  </div>
                )}
    
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                  <div className="relative group">
                    <input 
                      type="password" 
                      required
                      placeholder="Senha"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
                  </div>
                </div>

                {isRegistering && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1 text-left">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirmar</label>
                        <div className="relative group">
                            <input 
                            type="password" 
                            required
                            placeholder="Repita"
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-500"
                            value={loginForm.confirmPassword}
                            onChange={(e) => setLoginForm({...loginForm, confirmPassword: e.target.value})}
                            />
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
                        </div>
                    </div>
                  </div>
                )}
    
                {!isRegistering && (
                    <div className="flex items-center justify-between px-1">
                    <label className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer" />
                        Manter conectado
                    </label>
                    <button type="button" className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">Esqueceu a senha?</button>
                    </div>
                )}
    
                <button 
                  type="submit"
                  className={cn(
                    "w-full bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-100 dark:shadow-none",
                    isRegistering ? "py-2.5" : "py-3 xl:py-4"
                  )}
                >
                  {isRegistering ? (
                    <>Criar Minha Conta</>
                  ) : (
                    <>
                        <LogIn size={20} />
                        Entrar no Sistema
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {isRegistering ? 'Já possui uma conta?' : 'Ainda não tem conta?'} 
                        <button 
                            type="button"
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="ml-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                        >
                            {isRegistering ? 'Fazer Login' : 'Cadastre-se agora'}
                        </button>
                    </p>
                </div>
              </form>
              
              <div className="p-4 xl:p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-[8px] xl:text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-bold">
                  © 2026 ALRION TECH • Cloud 1.0
                </p>
              </div>
            </motion.div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    toast.info('Sessão encerrada.');
  };

  const renderView = () => {
    switch (currentView) {
      case 'agenda': return <Agenda onNewAppointment={handleNewAppointment} searchQuery={searchQuery} user={currentUser} />;
      case 'pacientes': return <Patients searchQuery={searchQuery} />;
      case 'medicos': return <Doctors searchQuery={searchQuery} />;
      case 'historico': return <History searchQuery={searchQuery} />;
      case 'novo-agendamento': return <NewAppointment initialData={appointmentData} onCancel={() => setCurrentView('agenda')} />;
      case 'configuracoes': return <SystemSettings searchQuery={searchQuery} setView={setCurrentView} />;
      case 'relatorios': return <Reports />;
      default: return <Agenda onNewAppointment={handleNewAppointment} searchQuery={searchQuery} user={currentUser} />;
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
        user={currentUser}
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
          user={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdate={async (newData) => {
            const updatedUser = { ...currentUser, ...newData };
            setCurrentUser(updatedUser);
            // Sync with Supabase table 'profiles'
            const { error } = await supabase.from('profiles').update(newData).eq('id', currentUser.id);
            if (error) toast.error('Erro ao salvar no banco.');
          }}
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
