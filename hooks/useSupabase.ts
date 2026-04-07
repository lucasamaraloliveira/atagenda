import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '@/lib/supabaseService';
import { Appointment, Doctor, Unit, Patient, Procedure, ScheduleBlock, ScheduleConfig } from '@/lib/types';
import { toast } from 'react-toastify';

export function useSupabase() {
  const [loading, setLoading] = useState(false);

  const getUnits = useCallback(async () => {
    try {
      return await supabaseService.getUnits();
    } catch (e) {
      toast.error('Erro ao buscar unidades');
      return [];
    }
  }, []);

  const getDoctors = useCallback(async () => {
    try {
      return await supabaseService.getDoctors();
    } catch (e) {
      toast.error('Erro ao buscar médicos');
      return [];
    }
  }, []);

  const getAppointments = useCallback(async (filters: any) => {
    try {
      return await supabaseService.getAppointments(filters);
    } catch (e) {
      toast.error('Erro ao buscar agendamentos');
      return [];
    }
  }, []);

  const updateStatus = useCallback(async (id: string, status: string, history: any[]) => {
    try {
      return await supabaseService.updateAppointmentStatus(id, status, history);
    } catch (e) {
      toast.error('Erro ao atualizar status');
      throw e;
    }
  }, []);

  return {
    loading,
    getUnits,
    getDoctors,
    getAppointments,
    updateStatus,
    service: supabaseService
  };
}
