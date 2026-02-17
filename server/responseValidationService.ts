export interface ResponseValidation {
  isConfirmed: boolean;
  isCancelled: boolean;
  isRescheduleRequest: boolean;
  detectedIntent: 'confirmed' | 'cancelled' | 'reschedule' | 'unknown';
  confidence: number;
}

/**
 * Validate patient response and detect intent
 */
export async function validatePatientResponse(
  messageText: string,
  patientPhone: string,
  appointmentId: string
): Promise<ResponseValidation> {
  const normalizedMessage = messageText.toLowerCase().trim();

  // Confirmation keywords (Spanish)
  const confirmationKeywords = ['sí', 'si', 'confirmo', 'confirmó', 'yes', 'claro', 'dale', 'ok', 'okey', 'perfecto'];
  
  // Cancellation keywords (Spanish)
  const cancellationKeywords = ['no', 'cancelar', 'no voy', 'no puedo ir', 'no podré', 'no voy a poder', 'cancel', 'no asisto'];
  
  // Reschedule keywords (Spanish)
  const rescheduleKeywords = ['remarcar', 'reagendar', 'cambiar', 'cambio', 'no puedo', 'no podr', 'reprogramar', 'otra hora', 'otro día', 'otro horario'];

  let detectedIntent: 'confirmed' | 'cancelled' | 'reschedule' | 'unknown' = 'unknown';
  let confidence = 0;

  // Check for confirmation
  if (confirmationKeywords.some(keyword => normalizedMessage.includes(keyword))) {
    detectedIntent = 'confirmed';
    confidence = 0.95;
  }
  // Check for cancellation
  else if (cancellationKeywords.some(keyword => normalizedMessage.includes(keyword))) {
    detectedIntent = 'cancelled';
    confidence = 0.9;
  }
  // Check for reschedule
  else if (rescheduleKeywords.some(keyword => normalizedMessage.includes(keyword))) {
    detectedIntent = 'reschedule';
    confidence = 0.85;
  }

  return {
    isConfirmed: detectedIntent === 'confirmed',
    isCancelled: detectedIntent === 'cancelled',
    isRescheduleRequest: detectedIntent === 'reschedule',
    detectedIntent,
    confidence,
  };
}

/**
 * Track response time from reminder to confirmation
 */
export async function calculateResponseTime(
  reminderSentAt: Date,
  confirmationReceivedAt: Date
): Promise<number> {
  // Return response time in minutes
  const diffMs = confirmationReceivedAt.getTime() - reminderSentAt.getTime();
  return Math.floor(diffMs / (1000 * 60));
}

/**
 * Check if message contains confirmation keyword
 */
export function isConfirmationMessage(messageText: string): boolean {
  const normalizedMessage = messageText.toLowerCase().trim();
  const confirmationKeywords = ['sí', 'si', 'confirmo', 'confirmó', 'yes', 'claro', 'dale', 'ok', 'okey', 'perfecto'];
  return confirmationKeywords.some(keyword => normalizedMessage.includes(keyword));
}

/**
 * Check if message contains cancellation keyword
 */
export function isCancellationMessage(messageText: string): boolean {
  const normalizedMessage = messageText.toLowerCase().trim();
  const cancellationKeywords = ['no', 'cancelar', 'no voy', 'no puedo ir', 'no podré', 'no voy a poder', 'cancel', 'no asisto'];
  return cancellationKeywords.some(keyword => normalizedMessage.includes(keyword));
}

/**
 * Check if message contains reschedule keyword
 */
export function isRescheduleMessage(messageText: string): boolean {
  const normalizedMessage = messageText.toLowerCase().trim();
  const rescheduleKeywords = ['remarcar', 'reagendar', 'cambiar', 'cambio', 'no puedo', 'no podr', 'reprogramar', 'otra hora', 'outro día', 'otro horario'];
  return rescheduleKeywords.some(keyword => normalizedMessage.includes(keyword));
}
