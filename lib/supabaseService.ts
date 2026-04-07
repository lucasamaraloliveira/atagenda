import { supabase } from './supabase';
import { Appointment, Patient, Doctor, Unit, ScheduleConfig, ScheduleBlock, Procedure } from './types';

export const supabaseService = {
  // Units
  async getUnits() {
    const { data, error } = await supabase.from('units').select('*').order('name');
    if (error) throw error;
    return data as Unit[];
  },

  // Doctors
  async getDoctors() {
    const { data, error } = await supabase.from('doctors').select('*').order('name');
    if (error) throw error;
    return data as Doctor[];
  },

  // Patients
  async getPatients(search?: string) {
    let query = supabase.from('patients').select('*').order('name');
    if (search) {
      query = query.or(`name.ilike.%${search}%,cpf.ilike.%${search}%,record_number.ilike.%${search}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data as Patient[];
  },

  async createPatient(patient: Omit<Patient, 'id'>) {
    const { data, error } = await supabase.from('patients').insert(patient).select().single();
    if (error) throw error;
    return data as Patient;
  },

  // Appointments
  async getAppointments(filters: { doctorId?: string, unitId?: string, date?: string, startDate?: string, endDate?: string }) {
    let query = supabase.from('appointments').select('*').order('time');
    
    if (filters.doctorId) query = query.eq('doctor_id', filters.doctorId);
    if (filters.unitId) query = query.eq('unit_id', filters.unitId);
    if (filters.date) query = query.eq('date', filters.date);
    if (filters.startDate) query = query.gte('date', filters.startDate);
    if (filters.endDate) query = query.lte('date', filters.endDate);

    const { data, error } = await query;
    if (error) throw error;
    
    // Map snake_case to camelCase if needed, but the types.ts likely expects camelCase.
    // Let's assume some mapping is needed or the DB uses snake_case and code uses camelCase.
    return data.map(app => ({
        ...app,
        doctorId: app.doctor_id,
        patientId: app.patient_id,
        unitId: app.unit_id,
        procedureName: app.procedure_name,
        isOverbook: app.is_overbook,
        statusHistory: app.status_history
    })) as Appointment[];
  },

  async createAppointment(appointment: Omit<Appointment, 'id'>) {
    const payload = {
        patient_id: appointment.patientId,
        doctor_id: appointment.doctorId,
        unit_id: appointment.unitId,
        date: appointment.date,
        time: appointment.time,
        procedure_name: appointment.procedure,
        status: appointment.status,
        insurance: appointment.insurance,
        is_overbook: appointment.isOverbook,
        price: appointment.price,
        status_history: appointment.statusHistory || []
    };

    const { data, error } = await supabase.from('appointments').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async updateAppointmentStatus(id: string, status: string, history: any[]) {
    const { data, error } = await supabase
        .from('appointments')
        .update({ status, status_history: history })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
  },

  // Schedule Configs
  async getScheduleConfig(doctorId: string, unitId: string) {
    const { data, error } = await supabase
        .from('schedule_configs')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('unit_id', unitId)
        .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is code for no rows returned
    
    if (!data) return null;

    return {
        ...data,
        doctorId: data.doctor_id,
        unitId: data.unit_id,
        maxOverbooksPerDay: data.max_overbooks_per_day,
        slotDuration: data.slot_duration,
        multiProcedureStrategy: data.multi_procedure_strategy
    } as ScheduleConfig;
  },

  // Schedule Blocks
  async getScheduleBlocks(doctorId: string, unitId: string, date?: string) {
    let query = supabase.from('schedule_blocks').select('*').eq('doctor_id', doctorId).eq('unit_id', unitId);
    if (date) query = query.eq('date', date);
    
    const { data, error } = await query;
    if (error) throw error;

    return data.map(block => ({
        ...block,
        doctorId: block.doctor_id,
        unitId: block.unit_id,
        startTime: block.start_time,
        endTime: block.end_time
    })) as ScheduleBlock[];
  },

  async createBlock(block: Omit<ScheduleBlock, 'id'>) {
    const payload = {
        doctor_id: block.doctorId,
        unit_id: block.unitId,
        date: block.date,
        start_time: block.startTime,
        end_time: block.endTime,
        reason: block.reason
    };
    const { data, error } = await supabase.from('schedule_blocks').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async deleteBlock(id: string) {
    const { error } = await supabase.from('schedule_blocks').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // Procedures
  async getProcedures() {
    const { data, error } = await supabase.from('procedures').select('*').order('name');
    if (error) throw error;
    return data as Procedure[];
  },

  // System Settings
  async getSettings() {
    const { data, error } = await supabase.from('system_settings').select('*');
    if (error) throw error;
    
    const settings: any = {};
    data.forEach(item => {
        settings[item.key] = item.value;
    });
    return settings;
  },

  async updateSetting(key: string, value: any) {
    const { error } = await supabase.from('system_settings').upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
    return true;
  }
};
