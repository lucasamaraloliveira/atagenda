'use client';

import React, { useState, useEffect } from 'react';
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
import { View, Profile } from '@/lib/types';
import { auth } from '@/lib/firebase';
import { firebaseService } from '@/lib/firebaseService';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
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
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Login/Register State
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [isEmailInUse, setIsEmailInUse] = useState(false);

  const handleNewAppointment = (date?: string, time?: string, doctorId?: string, unitId?: string) => {
    setAppointmentData(date && time ? { date, time, doctorId, unitId } : null);
    setCurrentView('novo-agendamento');
  };

  // Auth State Change Listener
  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;
      if (user) {
        let profile = await firebaseService.getUserProfile(user.uid);
        if (!profile) {
           profile = await firebaseService.createProfile({
              id: user.uid,
              name: user.displayName || user.email?.split('@')[0] || 'Usuário',
              email: user.email || '',
              profile: 'Administrador',
              active: true,
              permissions: ['Total']
           });
        }
        setCurrentUser(profile);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailInput = loginForm.email?.trim().toLowerCase();
    const passwordInput = loginForm.password;

    if (!emailInput || !passwordInput) {
      toast.error('Informe e-mail e senha!');
      return;
    }

    try {
      if (isRegistering) {
        if (passwordInput !== loginForm.confirmPassword) {
          toast.error('As senhas não coincidem!');
          return;
        }
        const { user } = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
        if (user) {
          const newProfile: Profile = {
            id: user.uid,
            name: loginForm.username || 'Admin',
            email: emailInput,
            profile: 'Administrador',
            active: true,
            permissions: ['Total']
          };
          await firebaseService.createProfile(newProfile);
          toast.success('Cadastro realizado com sucesso!');
          setIsRegistering(false);
        }
      } else {
        const { user } = await signInWithEmailAndPassword(auth, emailInput, passwordInput);
        if (user) {
          const profile = await firebaseService.getUserProfile(user.uid);
          if (profile) {
            setCurrentUser(profile);
            setIsLoggedIn(true);
            toast.success(`Bem-vindo, ${profile.name}!`);
          }
        }
      }
    } catch (err: any) {
      toast.error(err.code === 'auth/email-already-in-use' ? 'E-mail em uso!' : 'Erro na autenticação.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { profile } = await firebaseService.signInWithGoogle();
      if (profile) {
        setCurrentUser(profile);
        setIsLoggedIn(true);
        toast.success(`Bem-vindo, ${profile.name}!`);
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error('Erro ao entrar com Google.');
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsLoggedIn(false);
    toast.info('Sessão encerrada.');
  };

  const handleProfileUpdate = async (newData: any) => {
    if (currentUser) {
      await firebaseService.updateProfile(currentUser.id, newData);
      setCurrentUser({ ...currentUser, ...newData });
    }
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 animate-pulse font-medium">Validando acesso...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex lg:grid lg:grid-cols-2 items-center justify-center transition-colors font-sans overflow-hidden">
        <div className="fixed top-4 right-4 sm:top-8 sm:right-8 z-[60]">
          <ThemeToggle />
        </div>

        <div className="hidden lg:flex flex-col items-center justify-center bg-indigo-600 h-full p-8 text-white relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="relative z-10 max-w-sm text-center">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-xl border border-white/30">
              <Lock size={40} />
            </div>
            <h1 className="text-5xl font-black mb-4">ATAgenda</h1>
            <p className="text-xl text-indigo-100 opacity-90 leading-relaxed">
              Gestão inteligente para sua clínica.
            </p>
          </div>
        </div>

        <div className="w-full flex items-center justify-center p-4">
          <motion.div layout className="w-full max-w-[400px] bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800">
            <h2 className="text-2xl font-black mb-6 text-slate-800 dark:text-white text-center">
              {isRegistering ? 'Nova Conta' : 'Acesso ao Sistema'}
            </h2>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase ml-1">E-mail</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase ml-1">Senha</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
              </div>

              {isRegistering && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase ml-1">Confirmar Senha</label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white"
                    value={loginForm.confirmPassword}
                    onChange={(e) => setLoginForm({ ...loginForm, confirmPassword: e.target.value })}
                  />
                </div>
              )}

              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-[0.98]">
                {isRegistering ? 'Criar Conta' : 'Entrar'}
              </button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest px-2 bg-white dark:bg-slate-900 text-slate-400">
                  Ou continue com
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.98] transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Google
              </button>

              <p className="text-center text-sm text-slate-500 pt-2">
                {isRegistering ? 'Já tem conta?' : 'Não tem conta?'}
                <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="ml-1 text-indigo-600 font-bold hover:underline">
                  {isRegistering ? 'Entrar' : 'Cadastre-se'}
                </button>
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950 transition-colors">
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
          user={currentUser}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
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
          onUpdate={handleProfileUpdate}
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
