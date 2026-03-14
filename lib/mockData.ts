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
  return new Proxy(data, {
    set(target, prop, value) {
      const res = Reflect.set(target, prop, value);
      saveToStorage(key, target);
      return res;
    },
    deleteProperty(target, prop) {
      const res = Reflect.deleteProperty(target, prop);
      saveToStorage(key, target);
      return res;
    },
    apply(target, thisArg, argumentsList) {
      const res = Reflect.apply(target as any, thisArg, argumentsList);
      saveToStorage(key, target);
      return res;
    }
  });
};

const createPersistentObject = <T extends object>(key: string, initialData: T): T => {
  const data = loadFromStorage(key, initialData);
  return new Proxy(data, {
    set(target, prop, value) {
      const res = Reflect.set(target, prop, value);
      saveToStorage(key, target);
      return res;
    }
  });
};

export const mockUnits: Unit[] = createPersistentArray('atagenda_units', [
  { id: '1', name: 'Unidade Principal - Jardins', address: 'Rua das Flores, 123', phone: '(11) 3333-4444', isActive: true },
  { id: '2', name: 'Unidade Brooklin', address: 'Av. das Nações, 500', phone: '(11) 4444-5555', isActive: true },
]);

export const mockPatients: Patient[] = createPersistentArray('atagenda_patients', [
  { id: '1', recordNumber: 'PR-1001', name: 'Maria Aparecida da Silva', cpf: '123.456.789-00', birthDate: '1978-05-13', gender: 'Feminino', phone: '(11) 98888-7777', email: 'maria@example.com' },
  { id: '2', recordNumber: 'PR-1002', name: 'José Adair Pereira Magalhães', cpf: '234.567.890-11', birthDate: '1965-10-22', gender: 'Masculino', phone: '(11) 97777-6666', email: 'jose@example.com' },
  { id: '3', recordNumber: 'PR-1003', name: 'Eliane Silva Marra', cpf: '345.678.901-22', birthDate: '1982-03-05', gender: 'Feminino', phone: '(11) 96666-5555', email: 'eliane@eliane.com' },
  { id: '4', recordNumber: 'PR-1004', name: 'Angelica Correia Costa', cpf: '456.789.012-33', birthDate: '1990-12-15', gender: 'Feminino', phone: '(11) 95555-4444', email: 'angelica@angelica.com' },
]);

export const mockDoctors: Doctor[] = createPersistentArray('atagenda_doctors', [
  { id: '1', name: 'Moacir Bricola', crm: '50678', cpf: '111.222.333-44', specialty: 'Cardiologia', type: 'executante', phone: '(11) 99999-1111', email: 'moacir@atagenda.com' },
  { id: '2', name: 'Andre Yutaka Muta', crm: '96100', cpf: '222.333.444-55', specialty: 'Ortopedia', type: 'executante', phone: '(11) 99999-2222', email: 'andre@atagenda.com' },
  { id: '3', name: 'Dr. Reinaldo Wady Farah', crm: '12345', cpf: '345.678.901-22', specialty: 'Clínico Geral', type: 'ambos', phone: '(11) 99999-3333', email: 'reinaldo@atagenda.com' },
  { id: '4', name: 'Dr. Solicitante Exemplo', crm: '99999', cpf: '999.888.777-66', specialty: 'Clínico Geral', type: 'solicitante', phone: '(11) 99999-4444', email: 'solicitante@atagenda.com' },
]);

export const mockAppointments: Appointment[] = createPersistentArray('atagenda_appointments', []);

export const mockScheduleBlocks: ScheduleBlock[] = createPersistentArray('atagenda_blocks', []);

const defaultSchedule = {
  '0': { active: false, startTime: '08:00', endTime: '12:00', lunchStart: '12:00', lunchEnd: '13:00' },
  '1': { active: true, startTime: '08:00', endTime: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  '2': { active: true, startTime: '08:00', endTime: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  '3': { active: true, startTime: '08:00', endTime: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  '4': { active: true, startTime: '08:00', endTime: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  '5': { active: true, startTime: '08:00', endTime: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  '6': { active: false, startTime: '08:00', endTime: '12:00', lunchStart: '12:00', lunchEnd: '13:00' },
};

export const mockScheduleConfigs: ScheduleConfig[] = createPersistentArray('atagenda_configs', [
  { doctorId: '1', unitId: '1', maxOverbooksPerDay: 2, slotDuration: 15, schedule: JSON.parse(JSON.stringify(defaultSchedule)), multiProcedureStrategy: 'next_minute' },
  { doctorId: '2', unitId: '1', maxOverbooksPerDay: 0, slotDuration: 20, schedule: JSON.parse(JSON.stringify(defaultSchedule)), multiProcedureStrategy: 'next_minute' },
  { doctorId: '3', unitId: '1', maxOverbooksPerDay: 1, slotDuration: 30, schedule: JSON.parse(JSON.stringify(defaultSchedule)), multiProcedureStrategy: 'next_minute' },
]);

export const mockProcedures: Procedure[] = createPersistentArray('atagenda_procedures', [
  { id: '1', name: 'Consulta Médica', category: 'Consulta', modality: 'CONSULTA', price: '250.00', preparation: 'Não há preparo necessário.', integraRis: false },
  { id: '2', name: 'US Abdome Total', category: 'Exame', modality: 'US', price: '380.00', preparation: 'Jejum de 8 horas. Beber 4 copos de água 1 hora antes do exame e não urinar.', integraRis: true },
  { id: '3', name: 'RX Tórax PA/Perfil', category: 'Exame', modality: 'CR', price: '150.00', preparation: 'Retirar objetos metálicos do pescoço e tórax.', integraRis: true },
  { id: '4', name: 'Mamografia Digital', category: 'Exame', modality: 'MG', price: '450.00', preparation: 'Não utilizar desodorante, talco ou cremes nas mamas e axilas no dia do exame.', integraRis: true },
  { id: '5', name: 'Tomografia de Crânio', category: 'Exame', modality: 'CT', price: '600.00', preparation: 'Caso utilize contraste, jejum de 4 horas.', integraRis: true },
]);

export const mockInsurances: Insurance[] = createPersistentArray('atagenda_insurances', [
  { id: '1', name: 'Unimed', status: 'Ativo', patients: 142 },
  { id: '2', name: 'Bradesco Saúde', status: 'Ativo', patients: 89 },
  { id: '3', name: 'SulAmérica', status: 'Ativo', patients: 56 },
  { id: '4', name: 'Particular', status: 'Ativo', patients: 210 },
]);

export const mockSystemSettings = createPersistentObject('atagenda_settings', {
  geral: {
    unitName: 'Clínica Alrion Tech',
    language: 'Português (Brasil)',
    timezone: 'GMT-3 (Brasília)',
    autoLogout: '30 min',
  },
  agenda: {
    requiredFields: ['Paciente', 'Procedimento', 'Médico', 'Telefone'],
    slotDuration: '20',
    startTime: '08:00',
    endTime: '19:00',
    allowOverlapping: false,
    retroactiveBooking: false,
  },
  pacientes: {
    requiredFields: ['Nome Completo', 'CPF', 'Data de Nascimento', 'Telefone'],
    autoPatientId: true,
    cpfValidation: true,
    showDebtAlert: true,
  },
  profissionais: {
    showCrmOnCalendar: true,
    multiRoomScale: false,
    requiredFields: ['Nome', 'CRM', 'Especialidade'],
  },
  financeiro: {
    currency: 'BRL',
    defaultPaymentMethod: 'Cartão de Crédito',
    billingAlert: true,
  },
  integracao: {
    risEnabled: false,
    pacsUrl: '',
    reportCenterApiKey: '',
    hl7Enabled: false,
    dicomServer: '',
  }
});
