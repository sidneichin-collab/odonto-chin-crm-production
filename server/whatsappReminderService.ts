// WhatsApp Reminder Service
// TODO: Implement WhatsApp reminder functionality

export interface ReminderConfig {
  patientId: number;
  appointmentId: number;
  reminderType: 'two_days_before' | 'one_day_before' | 'day_of';
  messageTemplate: string;
}

export async function sendWhatsAppReminder(config: ReminderConfig): Promise<boolean> {
  // TODO: Implement WhatsApp API integration
  console.log('[WhatsApp Reminder] Sending reminder:', config);
  return true;
}

export async function scheduleReminder(config: ReminderConfig, scheduledTime: Date): Promise<void> {
  // TODO: Implement reminder scheduling
  console.log('[WhatsApp Reminder] Scheduling reminder for:', scheduledTime);
}

export async function sendReminderMessage(phoneNumber: string, message: string): Promise<boolean> {
  // TODO: Implement WhatsApp message sending
  console.log('[WhatsApp Reminder] Sending message to:', phoneNumber);
  return true;
}

export function getGreetingByHour(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

export function isOrthodonticAppointment(appointmentType: string): boolean {
  return appointmentType.toLowerCase().includes('ortodoncia') || 
         appointmentType.toLowerCase().includes('ortodontico');
}

export function getConfirmationDelay(appointmentType: string): number {
  // Retorna delay em minutos
  return isOrthodonticAppointment(appointmentType) ? 60 : 30;
}
