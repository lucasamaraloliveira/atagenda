'use client';

import React, { useState } from 'react';
import { Search, Filter, Download, Calendar, User, Stethoscope } from 'lucide-react';
import { mockAppointments, mockPatients, mockDoctors } from '@/lib/mockData';
import { cn, normalizeString } from '@/lib/utils';

export default function History({ searchQuery = '' }: { searchQuery?: string }) {

  const getPatientName = (id: string) => mockPatients.find(p => p.id === id)?.name || 'Paciente';
  const getDoctorName = (id: string) => mockDoctors.find(d => d.id === id)?.name || 'Médico';

  const filteredAppointments = mockAppointments.filter(app => {
    const search = normalizeString(searchQuery);
    const patientName = normalizeString(getPatientName(app.patientId));
    const doctorName = normalizeString(getDoctorName(app.doctorId));
    return patientName.includes(search) || 
           doctorName.includes(search) || 
           normalizeString(app.procedure).includes(search);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 max-w-2xl">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input type="date" className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none shadow-sm" />
            <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">até</span>
            <input type="date" className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none shadow-sm" />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm">
            <Filter size={18} />
            Filtros
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm">
            <Download size={18} />
            Exportar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Data/Hora</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Paciente</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Médico</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Procedimento</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Convênio</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(app.date).toLocaleDateString('pt-BR')} {app.time}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <User size={14} className="text-slate-400" />
                      {getPatientName(app.patientId)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Stethoscope size={14} className="text-slate-400" />
                      {getDoctorName(app.doctorId)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{app.procedure}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{app.insurance}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      app.status === 'agendado' ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                    )}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredAppointments.map((app) => (
            <div key={app.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Calendar size={14} className="text-indigo-600" />
                  {new Date(app.date).toLocaleDateString('pt-BR')} {app.time}
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                  app.status === 'agendado' ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                )}>
                  {app.status}
                </span>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">{getPatientName(app.patientId)}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Stethoscope size={12} />
                  {getDoctorName(app.doctorId)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Procedimento</p>
                  <p className="text-xs text-slate-700 font-medium truncate">{app.procedure}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Convênio</p>
                  <p className="text-xs text-slate-700 font-medium">{app.insurance}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
