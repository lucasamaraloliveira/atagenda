'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Calendar, User, Stethoscope } from 'lucide-react';
import { firebaseService } from '@/lib/firebaseService';
import { cn, normalizeString } from '@/lib/utils';
import { Appointment, Patient, Doctor } from '@/lib/types';

export default function History({ searchQuery = '' }: { searchQuery?: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [appts, pts, docs] = await Promise.all([
          firebaseService.getAppointments({}), // Fetch all
          firebaseService.getPatients(),
          firebaseService.getDoctors()
        ]);
        setAppointments(appts);
        setPatients(pts);
        setDoctors(docs);
      } catch (err) {
        console.error('Failed to load history data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'Paciente';
  const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.name || 'Médico';

  const filteredAppointments = appointments.filter(app => {
    const search = normalizeString(searchQuery);
    const patientName = normalizeString(getPatientName(app.patientId));
    const doctorName = normalizeString(getDoctorName(app.doctorId));
    return patientName.includes(search) || 
           doctorName.includes(search) || 
           normalizeString(app.procedure).includes(search);
  }).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500">Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 max-w-2xl">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input type="date" className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none shadow-sm dark:text-slate-100 dark:[color-scheme:dark]" />
            <span className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest">até</span>
            <input type="date" className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none shadow-sm dark:text-slate-100 dark:[color-scheme:dark]" />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            <Filter size={18} />
            Filtros
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            <Download size={18} />
            Exportar
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-slate-400">Nenhum agendamento encontrado no histórico.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Data/Hora</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Paciente</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Médico</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Procedimento</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Convênio</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAppointments.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                          <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                          {new Date(app.date).toLocaleDateString('pt-BR')} {app.time}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <User size={14} className="text-slate-400 dark:text-slate-500" />
                          {getPatientName(app.patientId)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <Stethoscope size={14} className="text-slate-400 dark:text-slate-500" />
                          {getDoctorName(app.doctorId)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{app.procedure}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{app.insurance}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          app.status === 'agendado' ? "bg-indigo-100 text-indigo-700" : 
                          app.status === 'realizado' ? "bg-emerald-100 text-emerald-700" :
                          "bg-slate-100 text-slate-700"
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
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAppointments.map((app) => (
                <div key={app.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                      <Calendar size={14} className="text-indigo-600 dark:text-indigo-400" />
                      {new Date(app.date).toLocaleDateString('pt-BR')} {app.time}
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                      app.status === 'agendado' ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : 
                      app.status === 'realizado' ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" :
                      "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    )}>
                      {app.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{getPatientName(app.patientId)}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Stethoscope size={12} />
                      {getDoctorName(app.doctorId)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold">Procedimento</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">{app.procedure}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold">Convênio</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{app.insurance}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
