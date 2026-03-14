export type View = 'agenda' | 'pacientes' | 'medicos' | 'historico' | 'novo-agendamento' | 'configuracoes' | 'relatorios';

export interface Patient {
  id: string;
  recordNumber?: string;
  name: string;
  cpf: string;
  birthDate: string;
  gender: string;
  phone: string;
  email: string;
}

export interface Doctor {
  id: string;
  name: string;
  crm: string;
  cpf: string;
  specialty: string;
  type: 'executante' | 'solicitante' | 'ambos';
  phone: string;
  email: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  procedure: string;
  insurance: string;
  status: 'agendado' | 'confirmado' | 'em-atendimento' | 'realizado' | 'cancelado';
  isOverbook?: boolean;
}

export interface ScheduleBlock {
  id: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  reason: string;
}

export interface DaySchedule {
  active: boolean;
  startTime: string;
  endTime: string;
  lunchStart: string;
  lunchEnd: string;
}

export interface ScheduleConfig {
  doctorId: string;
  maxOverbooksPerDay: number;
  slotDuration: number;
  schedule: Record<string, DaySchedule>;
}

export interface Procedure {
  id: string;
  name: string;
  category?: string;
  modality: string;
  price: string;
  preparation?: string;
}
