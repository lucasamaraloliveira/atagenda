import { Patient, Doctor, Appointment, ScheduleBlock, ScheduleConfig, Procedure, Unit, Insurance } from './types';

// Persistence Helper
const isClient = typeof window !== 'undefined';
const loadFromStorage = (key: string, defaultValue: any) => {
  if (!isClient) return defaultValue;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const saveToStorage = (key: string, value: any) => {
  if (isClient) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// Proxified arrays to auto-save on modification
const createPersistentArray = <T>(key: string, initialData: T[]): T[] => {
  const data = loadFromStorage(key, initialData);
  return new Proxy(data || [], {
    get(target, prop, receiver) {
        const val = Reflect.get(target, prop, receiver);
        if (typeof val === 'function' && ['push', 'pop', 'splice', 'shift', 'unshift', 'reverse', 'sort'].includes(prop as string)) {
            return (...args: any[]) => {
                const result = val.apply(target, args);
                saveToStorage(key, target);
                return result;
            };
        }
        return val;
    },
    set(target, prop, value) {
      const res = Reflect.set(target, prop, value);
      saveToStorage(key, target);
      return res;
    }
  });
};

const createPersistentObject = <T extends object>(key: string, initialData: T): T => {
  const data = loadFromStorage(key, initialData);
  return new Proxy(data || initialData, {
    set(target, prop, value) {
      const res = Reflect.set(target, prop, value);
      saveToStorage(key, target);
      return res;
    }
  });
};

// FINAL SYSTEM RESET - VERSION 7
export const mockUnits: Unit[] = createPersistentArray('atagenda_units_v7', [
  { id: '1', name: 'Unidade Principal - Jardins', address: 'Rua das Flores, 123', phone: '(11) 3333-4444', isActive: true },
]);

export const mockUsers: any[] = createPersistentArray('atagenda_users_v7', []); // LIMPO V7

export const mockPatients: Patient[] = createPersistentArray('atagenda_patients_v7', []);
export const mockDoctors: Doctor[] = createPersistentArray('atagenda_doctors_v7', []);
export const mockAppointments: Appointment[] = createPersistentArray('atagenda_appointments_v7', []);
export const mockScheduleBlocks: ScheduleBlock[] = createPersistentArray('atagenda_blocks_v7', []);

export const mockScheduleConfigs: ScheduleConfig[] = createPersistentArray('atagenda_configs_v7', []);
export const mockProcedures: Procedure[] = createPersistentArray('atagenda_procedures_v7', []);
export const mockInsurances: Insurance[] = createPersistentArray('atagenda_insurances_v7', []);

export const mockSystemSettings = createPersistentObject('atagenda_settings_v7', {
  geral: { unitName: 'Minha Clínica', language: 'Português (Brasil)', timezone: 'GMT-3 (Brasília)', autoLogout: '30 min' },
  agenda: { requiredFields: ['Paciente', 'Procedimento', 'Médico', 'Telefone'], slotDuration: '20', startTime: '08:00', endTime: '19:00', allowOverlapping: false, retroactiveBooking: false },
  pacientes: { requiredFields: ['Nome Completo', 'CPF', 'Data de Nascimento', 'Telefone'], autoPatientId: true, cpfValidation: true, showDebtAlert: true },
  profissionais: { showCrmOnCalendar: true, multiRoomScale: false, requiredFields: ['Nome', 'CRM', 'Especialidade'] },
  financeiro: { currency: 'BRL', defaultPaymentMethod: 'Cartão de Crédito', billingAlert: true },
  integracao: { risEnabled: false, pacsUrl: '', reportCenterApiKey: '', hl7Enabled: false, dicomServer: '' },
  perfis: [
    { id: 1, name: 'Administrador', permissions: ['Total'], color: 'bg-indigo-500' },
    { id: 2, name: 'Médico', permissions: ['Agenda', 'Histórico'], color: 'bg-emerald-500' },
    { id: 3, name: 'Recepção', permissions: ['Agenda', 'Pacientes'], color: 'bg-sky-500' },
    { id: 4, name: 'Enfermagem', permissions: ['Agenda', 'Procedimentos'], color: 'bg-rose-500' },
  ]
});
