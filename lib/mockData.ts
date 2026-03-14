import { Patient, Doctor, Appointment, ScheduleBlock, ScheduleConfig, Procedure } from './types';

export const mockPatients: Patient[] = [
  { id: '1', recordNumber: 'PR-1001', name: 'Maria Aparecida da Silva', cpf: '123.456.789-00', birthDate: '1978-05-13', gender: 'Feminino', phone: '(11) 98888-7777', email: 'maria@example.com' },
  { id: '2', recordNumber: 'PR-1002', name: 'José Adair Pereira Magalhães', cpf: '234.567.890-11', birthDate: '1965-10-22', gender: 'Masculino', phone: '(11) 97777-6666', email: 'jose@example.com' },
  { id: '3', recordNumber: 'PR-1003', name: 'Eliane Silva Marra', cpf: '345.678.901-22', birthDate: '1982-03-05', gender: 'Feminino', phone: '(11) 96666-5555', email: 'eliane@eliane.com' },
  { id: '4', recordNumber: 'PR-1004', name: 'Angelica Correia Costa', cpf: '456.789.012-33', birthDate: '1990-12-15', gender: 'Feminino', phone: '(11) 95555-4444', email: 'angelica@angelica.com' },
];

export const mockDoctors: Doctor[] = [
  { id: '1', name: 'Moacir Bricola', crm: '50678', cpf: '111.222.333-44', specialty: 'Cardiologia', type: 'executante', phone: '(11) 99999-1111', email: 'moacir@atagenda.com' },
  { id: '2', name: 'Andre Yutaka Muta', crm: '96100', cpf: '222.333.444-55', specialty: 'Ortopedia', type: 'executante', phone: '(11) 99999-2222', email: 'andre@atagenda.com' },
  { id: '3', name: 'Dr. Reinaldo Wady Farah', crm: '12345', cpf: '345.678.901-22', specialty: 'Clínico Geral', type: 'ambos', phone: '(11) 99999-3333', email: 'reinaldo@atagenda.com' },
];

export const mockAppointments: Appointment[] = [];

export const mockScheduleBlocks: ScheduleBlock[] = [];

const defaultSchedule = {
  '0': { active: false, startTime: '08:00', endTime: '12:00', lunchStart: '12:00', lunchEnd: '13:00' },
  '1': { active: true, startTime: '08:00', endTime: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  '2': { active: true, startTime: '08:00', endTime: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  '3': { active: true, startTime: '08:00', endTime: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  '4': { active: true, startTime: '08:00', endTime: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  '5': { active: true, startTime: '08:00', endTime: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  '6': { active: false, startTime: '08:00', endTime: '12:00', lunchStart: '12:00', lunchEnd: '13:00' },
};

export const mockScheduleConfigs: ScheduleConfig[] = [
  { doctorId: '1', maxOverbooksPerDay: 2, slotDuration: 15, schedule: JSON.parse(JSON.stringify(defaultSchedule)) },
  { doctorId: '2', maxOverbooksPerDay: 0, slotDuration: 20, schedule: JSON.parse(JSON.stringify(defaultSchedule)) },
  { doctorId: '3', maxOverbooksPerDay: 1, slotDuration: 30, schedule: JSON.parse(JSON.stringify(defaultSchedule)) },
];

export const mockProcedures: Procedure[] = [
  { id: '1', name: 'Consulta Médica', category: 'Consulta', modality: 'CONSULTA', price: '250.00', preparation: 'Não há preparo necessário.' },
  { id: '2', name: 'US Abdome Total', category: 'Exame', modality: 'US', price: '380.00', preparation: 'Jejum de 8 horas. Beber 4 copos de água 1 hora antes do exame e não urinar.' },
  { id: '3', name: 'RX Tórax PA/Perfil', category: 'Exame', modality: 'CR', price: '150.00', preparation: 'Retirar objetos metálicos do pescoço e tórax.' },
  { id: '4', name: 'Mamografia Digital', category: 'Exame', modality: 'MG', price: '450.00', preparation: 'Não utilizar desodorante, talco ou cremes nas mamas e axilas no dia do exame.' },
  { id: '5', name: 'Tomografia de Crânio', category: 'Exame', modality: 'CT', price: '600.00', preparation: 'Caso utilize contraste, jejum de 4 horas.' },
];
