export type View = 'agenda' | 'pacientes' | 'medicos' | 'historico' | 'novo-agendamento' | 'configuracoes' | 'relatorios';

export interface Unit {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  logo?: string;
}

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

export interface StatusHistory {
  id: string;
  status: Appointment['status'];
  timestamp: string;
  user: string;
  note?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  unitId: string;
  date: string;
  time: string;
  procedure: string;
  procedureName?: string;
  procedures?: string[];
  insurance: string;
  status: 'agendado' | 'confirmado' | 'em-atendimento' | 'realizado' | 'cancelado';
  isOverbook?: boolean;
  statusHistory?: StatusHistory[];
  price?: string;
}

export interface ScheduleBlock {
  id: string;
  doctorId: string;
  unitId: string;
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
  unitId: string;
  maxOverbooksPerDay: number;
  slotDuration: number;
  schedule: Record<string, DaySchedule>;
  multiProcedureStrategy?: 'next_minute' | 'next_slot';
}

export interface PreparationTemplate {
  id: string;
  name: string;
  header?: string;
  footer?: string;
  css?: string; // For customized styling of the print view
}

export interface Procedure {
  id: string;
  name: string;
  category?: string;
  modality: string;
  price: string;
  preparation?: string;
  preparationText?: string; // New field for detailed instructions
  preparationTemplateId?: string; // Link to a layout model
  integraRis?: boolean;
  insuranceIds?: string[];
}

export interface Insurance {
  id: string;
  name: string;
  status: 'Ativo' | 'Inativo';
  patients?: number;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  profile: string;
  avatar?: string;
  allowed_units?: string;
  active: boolean;
  permissions: string[];
}
