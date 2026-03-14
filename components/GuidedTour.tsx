'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, X, Play, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { View } from '@/lib/types';

interface Step {
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  view?: View;
}

const tourSteps: Step[] = [
  {
    target: 'nav-agenda',
    title: 'Agenda de Atendimentos',
    content: 'O coração do sistema. Aqui você gerencia seus horários, visualiza agendamentos e realiza encaixes.',
    position: 'right',
    view: 'agenda'
  },
  {
    target: 'header-search',
    title: 'Busca Inteligente',
    content: 'Economize tempo pesquisando pacientes, CPFs ou procedimentos diretamente na barra superior.',
    position: 'bottom'
  },
  {
    target: 'nav-pacientes',
    title: 'Gestão de Pacientes',
    content: 'Acesse o cadastro completo, histórico clínico e dados de contato de todos os seus pacientes.',
    position: 'right',
    view: 'pacientes'
  },
  {
    target: 'nav-medicos',
    title: 'Corpo Clínico',
    content: 'Gerencie os profissionais da clínica, suas especialidades e configurações de agenda.',
    position: 'right',
    view: 'medicos'
  },
  {
    target: 'nav-historico',
    title: 'Histórico Completo',
    content: 'Consulte cronologicamente todos os atendimentos realizados e o status de cada um.',
    position: 'right',
    view: 'historico'
  },
  {
    target: 'nav-relatorios',
    title: 'Relatórios & Dashboards',
    content: 'Analise o desempenho da sua clínica com métricas detalhadas e gráficos intuitivos.',
    position: 'right',
    view: 'relatorios'
  },
  {
    target: 'nav-configuracoes',
    title: 'Configurações Avançadas',
    content: 'Customize o sistema: gerencie convênios, procedimentos, perfis de acesso e muito mais.',
    position: 'right',
    view: 'configuracoes'
  },
  {
    target: 'user-profile-button',
    title: 'Seu Perfil',
    content: 'Personalize suas informações, altere sua senha e gerencie suas preferências de uso.',
    position: 'right'
  }
];

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onSetView: (view: View) => void;
}

export default function GuidedTour({ isOpen, onClose, onSetView }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = tourSteps[currentStep];

  const updateTargetRect = useCallback(() => {
    if (!isOpen) return;
    const element = document.getElementById(step.target);
    if (element) {
      setTargetRect(element.getBoundingClientRect());
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setTargetRect(null);
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    // Auto-switch view if required by step
    if (step.view) {
      onSetView(step.view);
    }

    // Small delay to allow new view to render before calculating rect
    const timeoutInitial = setTimeout(updateTargetRect, step.view ? 100 : 0);
    
    // Polling for 1s after step change to catch scroll/layout transitions
    const interval = setInterval(updateTargetRect, 50);
    const timeout = setTimeout(() => clearInterval(interval), 1000);

    const handleEvents = () => updateTargetRect();
    window.addEventListener('resize', handleEvents);
    window.addEventListener('scroll', handleEvents, true);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      clearTimeout(timeoutInitial);
      window.removeEventListener('resize', handleEvents);
      window.removeEventListener('scroll', handleEvents, true);
    };
  }, [isOpen, updateTargetRect, currentStep, step.view, onSetView]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getCardPosition = () => {
    if (!targetRect || step.position === 'center') {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const gap = 24;
    switch (step.position) {
      case 'right':
        return { 
          top: Math.max(20, Math.min(window.innerHeight - 300, targetRect.top)), 
          left: Math.min(window.innerWidth - 420, targetRect.right + gap) 
        };
      case 'bottom':
        return { 
          top: Math.min(window.innerHeight - 300, targetRect.bottom + gap), 
          left: Math.max(20, Math.min(window.innerWidth - 420, targetRect.left + (targetRect.width / 2) - 200)) 
        };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
      {/* Dim Overlay (using shadow from highlight component) */}
      <div className="absolute inset-0 pointer-events-auto overflow-hidden">
        {targetRect && (
          <motion.div
            layoutId="tour-highlight"
            className="absolute bg-transparent shadow-[0_0_0_9999px_rgba(15,23,42,0.7)] rounded-2xl z-10"
            initial={false}
            animate={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          >
            {/* Visual pulse border */}
            <div className="absolute inset-0 rounded-2xl ring-4 ring-indigo-500/50 animate-pulse" />
            <div className="absolute inset-0 rounded-2xl border-2 border-indigo-400" />
          </motion.div>
        )}
      </div>

      {/* Tour Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute pointer-events-auto w-[calc(100vw-32px)] sm:w-[400px] bg-white rounded-[2.5rem] shadow-2xl border border-white overflow-hidden p-8 flex flex-col z-[210] transition-all duration-500 shadow-indigo-500/10"
          style={getCardPosition()}
        >
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                <Sparkles size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">Tour ATAgenda</span>
                <h3 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">{step.title}</h3>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all rounded-full"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-8">
            {step.content}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <div className="flex gap-1.5">
              {tourSteps.map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === currentStep ? "w-6 bg-indigo-600" : "w-1.5 bg-slate-200"
                  )}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <button 
                  onClick={handleBack}
                  className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
              >
                {currentStep === tourSteps.length - 1 ? 'Finalizar' : 'Próximo'}
                {currentStep < tourSteps.length - 1 && <ChevronRight size={18} />}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
