'use client';

import React from 'react';
import { Menu, Bell, Search, Settings, HelpCircle, Sparkles, Play, LifeBuoy, MessageSquare, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
  title: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onStartTour: () => void;
}

export default function Header({ setSidebarOpen, title, searchQuery, setSearchQuery, onStartTour }: HeaderProps) {
  const [showHelpTray, setShowHelpTray] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const notifications = [
    { id: 1, title: 'Agenda Confirmada', desc: 'Paciente Lucas Silva confirmado para às 14:00', time: 'Há 2 min', icon: History, color: 'text-emerald-500' },
    { id: 2, title: 'Novo Cadastro', desc: 'Novo paciente identificado e cadastrado via agenda', time: 'Há 15 min', icon: Sparkles, color: 'text-indigo-500' },
    { id: 3, title: 'Sistema Atualizado', desc: 'Novas melhorias na busca de pacientes aplicadas', time: 'Hoje', icon: Settings, color: 'text-slate-400' },
  ];
  return (
    <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 md:px-6 sm:px-8 sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-600 dark:text-slate-400 shrink-0"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-sm md:text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <div id="header-search" className="hidden md:flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg px-3 py-1.5 transition-all">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="bg-transparent border-none focus:ring-0 focus:outline-none outline-none text-sm w-48 lg:w-64 ml-2 dark:text-slate-100 dark:placeholder-slate-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <ThemeToggle />
        
        <div className="relative">
          <button 
            onClick={() => {
              setShowHelpTray(!showHelpTray);
              setShowNotifications(false);
            }}
            className={cn(
              "p-2 rounded-lg transition-all",
              showHelpTray ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400" : "hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
            )}
            title="Ajuda e Suporte"
          >
            <HelpCircle size={20} />
          </button>

          <AnimatePresence>
            {showHelpTray && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 p-2"
              >
                <button 
                  onClick={() => {
                    onStartTour();
                    setShowHelpTray(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Tour do Sistema</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Conheça as ferramentas</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all group text-left">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Suporte Técnico</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Abra um chamado</p>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowHelpTray(false);
            }}
            className={cn(
              "p-2 rounded-lg relative transition-all",
              showNotifications ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400" : "hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
            )}
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950"></span>
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 text-left"
              >
                <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Últimas Ações</p>
                  <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-bold">RECENTE</span>
                </div>
                <div className="max-h-96 overflow-y-auto p-2 space-y-1">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all flex gap-3 group cursor-default">
                      <div className={cn("w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0", n.color)}>
                        <n.icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-[12px] font-bold text-slate-900 dark:text-slate-100 truncate">{n.title}</p>
                          <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{n.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-slate-50 dark:border-slate-800 text-center">
                  <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline px-4 py-2">VER TODO O HISTÓRICO</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
