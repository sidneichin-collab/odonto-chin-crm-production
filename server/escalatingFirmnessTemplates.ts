// Escalating Firmness Templates
// Templates de mensagens com firmeza crescente

export interface FirmnessTemplate {
  id: string;
  name: string;
  level: number; // 1-5 (1 = suave, 5 = muito firme)
  message: string;
}

export const escalatingFirmnessTemplates: FirmnessTemplate[] = [
  {
    id: 'level_1',
    name: 'Suave - Primeiro recordatório',
    level: 1,
    message: 'Hola {{patientName}}! Te recordamos tu cita para el {{appointmentDate}} a las {{appointmentTime}}. ¿Confirmas tu asistencia? 😊',
  },
  {
    id: 'level_2',
    name: 'Moderado - Segundo recordatório',
    level: 2,
    message: 'Hola {{patientName}}! Aún no confirmaste tu cita del {{appointmentDate}} a las {{appointmentTime}}. Por favor confirma para mantener tu horario. 🙏',
  },
  {
    id: 'level_3',
    name: 'Firme - Tercer recordatório',
    level: 3,
    message: '{{patientName}}, tu cita del {{appointmentDate}} a las {{appointmentTime}} necesita confirmación URGENTE. Si no confirmas, perderás tu horario. ⚠️',
  },
  {
    id: 'level_4',
    name: 'Muy firme - Último aviso',
    level: 4,
    message: 'ÚLTIMA OPORTUNIDAD {{patientName}}: Tu cita es el {{appointmentDate}} a las {{appointmentTime}}. Si no confirmas AHORA, tu horario será cancelado. 🔴',
  },
  {
    id: 'level_5',
    name: 'Crítico - Cancelación inminente',
    level: 5,
    message: '{{patientName}}, tu cita del {{appointmentDate}} a las {{appointmentTime}} será CANCELADA en los próximos minutos si no confirmas INMEDIATAMENTE. Esta es tu última oportunidad. 🚨',
  },
];

export function getTemplateByLevel(level: number): FirmnessTemplate | undefined {
  return escalatingFirmnessTemplates.find(t => t.level === level);
}

export function formatTemplate(template: FirmnessTemplate, data: {
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
}): string {
  return template.message
    .replace(/{{patientName}}/g, data.patientName)
    .replace(/{{appointmentDate}}/g, data.appointmentDate)
    .replace(/{{appointmentTime}}/g, data.appointmentTime);
}
