/**
 * Email Service - Stub
 * TODO: Implement email sending functionality
 */

export interface EmailResult {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
}

/**
 * Send reminder email to patient
 * TODO: Implement with actual email provider
 */
export async function sendReminderEmail(
  to: string,
  patientName: string,
  appointmentDate: string,
  appointmentTime: string,
  appointmentType: string
): Promise<EmailResult> {
  console.log('[Email Service] Sending reminder email to:', to);
  console.log('[Email Service] Patient:', patientName);
  console.log('[Email Service] Appointment:', appointmentDate, appointmentTime);
  console.log('[Email Service] Type:', appointmentType);
  
  // TODO: Implement actual email sending
  return {
    success: true,
    message: 'Email reminder sent (stub)',
    messageId: `stub-${Date.now()}`,
  };
}

/**
 * Alias for sendReminderEmail (for compatibility)
 */
export const sendAppointmentReminderEmail = sendReminderEmail;

/**
 * Send general email
 * TODO: Implement with actual email provider
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  html?: string
): Promise<EmailResult> {
  console.log('[Email Service] Sending email to:', to);
  console.log('[Email Service] Subject:', subject);
  
  // TODO: Implement actual email sending
  return {
    success: true,
    message: 'Email sent (stub)',
    messageId: `stub-${Date.now()}`,
  };
}
