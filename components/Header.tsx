'use client';

import React from 'react';
import { Menu, Bell, Search, Settings } from 'lucide-react';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
  title: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function Header({ setSidebarOpen, title, searchQuery, setSearchQuery }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600 shrink-0"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-sm md:text-lg font-semibold text-slate-900 truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <div className="hidden md:flex items-center bg-slate-100 rounded-lg px-3 py-1.5 transition-all">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="bg-transparent border-none focus:ring-0 focus:outline-none outline-none text-sm w-48 lg:w-64 ml-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </div>
    </header>
  );
}
