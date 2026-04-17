'use client';

import React from 'react';
import { 
  Calendar, 
  Users, 
  UserRound, 
  PlusCircle,
  Settings,
  History,
  BarChart3
} from 'lucide-react';
import { View } from '@/lib/types';
import { cn } from '@/lib/utils';

interface BottomNavBarProps {
  currentView: View;
  setView: (view: View) => void;
  user: any;
}

export default function BottomNavBar({ currentView, setView, user }: BottomNavBarProps) {
  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.profile === 'Administrador' || (user.permissions && user.permissions.includes('Total'))) return true;
    if (!user.permissions) return false;
    return user.permissions.some((p: string) => p.toLowerCase().includes(permission.toLowerCase()));
  };

  const navItems = [
    { id: 'agenda', label: 'Agenda', icon: Calendar, perm: 'Agenda' },
    { id: 'pacientes', label: 'Pacientes', icon: Users, perm: 'Pacientes' },
    { id: 'novo-agendamento', label: 'Novo', icon: PlusCircle, primary: true, perm: 'Agendar' },
    { id: 'medicos', label: 'Médicos', icon: UserRound, perm: 'Profissionais' },
    { id: 'configuracoes', label: 'Ajustes', icon: Settings, perm: 'Configurações' },
  ].filter(item => {
    const permKey = item.perm || '';
    if (!permKey) return true;
    return hasPermission(permKey);
  });

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as View)}
            className={cn(
              "flex flex-col items-center justify-center transition-all duration-200 min-w-[64px]",
              currentView === item.id 
                ? "text-indigo-600 dark:text-indigo-400" 
                : "text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400"
            )}
          >
            <div className={cn(
              "relative flex items-center justify-center p-2 rounded-xl transition-all",
              item.primary 
                ? "bg-indigo-600 text-white -mt-8 shadow-lg shadow-indigo-200 dark:shadow-none scale-110 active:scale-95 border-4 border-white dark:border-slate-950" 
                : currentView === item.id ? "bg-indigo-50 dark:bg-indigo-900/30" : ""
            )}>
              <item.icon size={item.primary ? 24 : 20} strokeWidth={currentView === item.id ? 2.5 : 2} />
              
              {currentView === item.id && !item.primary && (
                <span className="absolute -bottom-1 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </div>
            
            {!item.primary && (
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-widest mt-0.5",
                currentView === item.id ? "opacity-100" : "opacity-60"
              )}>
                {item.label}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
