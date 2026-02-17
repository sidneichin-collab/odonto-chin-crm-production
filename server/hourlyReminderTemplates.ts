// Hourly Reminder Templates
// TODO: Implement hourly reminder templates

export interface ReminderTemplate {
  id: string;
  name: string;
  message: string;
  hour: number;
}

export const hourlyReminderTemplates: ReminderTemplate[] = [
  {
    id: 'two_days_before',
    name: 'Dos días antes',
    message: 'Hola {{patientName}}! Te recordamos tu cita en Odonto Chin para el {{appointmentDate}} a las {{appointmentTime}}. ¿Confirmas tu asistencia? 😊',
    hour: 10,
  },
  {
    id: 'one_day_before',
    name: 'Un día antes',
    message: 'Hola {{patientName}}! Mañana tienes tu cita en Odonto Chin a las {{appointmentTime}}. ¿Confirmas? 😊',
    hour: 18,
  },
  {
    id: 'day_of',
    name: 'Día de la cita',
    message: 'Hola {{patientName}}! Hoy es tu cita en Odonto Chin a las {{appointmentTime}}. Te esperamos! 😊',
    hour: 9,
  },
];

export function getReminderTemplate(templateId: string): ReminderTemplate | undefined {
  return hourlyReminderTemplates.find(t => t.id === templateId);
}

export function formatReminderMessage(template: ReminderTemplate, data: {
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
}): string {
  return template.message
    .replace('{{patientName}}', data.patientName)
    .replace('{{appointmentDate}}', data.appointmentDate)
    .replace('{{appointmentTime}}', data.appointmentTime);
}
