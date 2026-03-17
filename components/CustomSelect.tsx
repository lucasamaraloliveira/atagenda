'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface Option {
  id: string;
  name: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  direction?: 'up' | 'down';
}

export default function CustomSelect({ options, value, onChange, placeholder = "Selecione...", label, className, direction = 'down' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && (
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm transition-all outline-none dark:text-slate-100",
          isOpen ? "ring-2 ring-indigo-500 bg-white dark:bg-slate-900 border-transparent" : "hover:border-slate-300 dark:hover:border-slate-700"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-slate-400 dark:text-slate-500")}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={cn("text-slate-400 dark:text-slate-500 transition-transform duration-200", isOpen && "rotate-180 text-indigo-500 dark:text-indigo-400")} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: direction === 'up' ? -4 : 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: direction === 'up' ? -4 : 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-50 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200 dark:shadow-none/50 dark:shadow-none overflow-hidden py-1.5",
              direction === 'up' ? "bottom-full mb-2" : "top-full mt-2"
            )}
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 text-center italic">
                  Nenhuma opção disponível
                </div>
              ) : (
                options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onChange(option.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left",
                      value === option.id 
                        ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 font-semibold" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                    )}
                  >
                    <span className="truncate">{option.name}</span>
                    {value === option.id && <Check size={14} className="shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
