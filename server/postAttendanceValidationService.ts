/**
 * Post-Attendance Validation Service
 * 
 * Validates that post-attendance messages are sent ONLY to:
 * 1. Patients who CONFIRMED their appointment (status = 'confirmed')
 * 2. On the DAY OF THE APPOINTMENT (appointmentDate = today)
 * 3. Exactly 2 hours AFTER the appointment time
 * 
 * This prevents errors like Iris receiving messages she shouldn't have.
 */

// Appointment type from schema
type Appointment = any;

export interface ValidationResult {
  isValid: boolean;
  reason: string;
  blockedReason?: string;
  details: {
    confirmationCheck: boolean;
    dayCheck: boolean;
    timeCheck: boolean;
  };
}

/**
 * VALIDATION 1: Check if patient confirmed (status = 'confirmed')
 */
export function validateConfirmation(appointment: Appointment): { passed: boolean; reason: string } {
  if (appointment.status !== 'confirmed') {
    return {
      passed: false,
      reason: `❌ BLOQUEADO: Paciente não confirmou (status = "${appointment.status}", esperado "confirmed")`,
    };
  }

  return {
    passed: true,
    reason: `✅ Confirmação OK: status = "confirmed"`,
  };
}

/**
 * VALIDATION 2: Check if today is the appointment day (DATE(appointmentDate) = DATE(now))
 */
export function validateAppointmentDay(appointment: Appointment): { passed: boolean; reason: string } {
  const appointmentDate = new Date(appointment.appointmentDate);
  appointmentDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (appointmentDate.getTime() !== today.getTime()) {
    const appointmentDateStr = appointmentDate.toLocaleDateString('es-ES');
    const todayStr = today.toLocaleDateString('es-ES');
    return {
      passed: false,
      reason: `❌ BLOQUEADO: Não é o dia da consulta (consulta: ${appointmentDateStr}, hoje: ${todayStr})`,
    };
  }

  return {
    passed: true,
    reason: `✅ Dia OK: É o dia da consulta (${today.toLocaleDateString('es-ES')})`,
  };
}

/**
 * VALIDATION 3: Check if it's 2 hours after appointment time (with 30-minute margin)
 */
export function validateTwoHoursAfter(appointment: Appointment): { passed: boolean; reason: string } {
  const appointmentDate = new Date(appointment.appointmentDate);
  const twoHoursAfter = new Date(appointmentDate.getTime() + 2 * 60 * 60 * 1000);
  const now = new Date();

  const timeDiff = Math.abs(now.getTime() - twoHoursAfter.getTime());
  const marginMs = 30 * 60 * 1000; // 30 minutes

  if (timeDiff > marginMs) {
    const appointmentTimeStr = appointmentDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const twoHoursAfterStr = twoHoursAfter.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const nowStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    return {
      passed: false,
      reason: `❌ BLOQUEADO: Não é 2h após a consulta (consulta: ${appointmentTimeStr}, esperado: ${twoHoursAfterStr}, agora: ${nowStr})`,
    };
  }

  return {
    passed: true,
    reason: `✅ Timing OK: É 2h após a consulta (±30 min)`,
  };
}

/**
 * MAIN VALIDATION: Run all 3 checks
 * 
 * Returns true ONLY if ALL 3 checks pass
 */
export function validatePostAttendanceEligibility(appointment: Appointment): ValidationResult {
  console.log(`\n🔍 Validando pós-atendimento para ${appointment.id}...`);

  // Validation 1: Confirmation
  const confirmationCheck = validateConfirmation(appointment);
  console.log(`  ${confirmationCheck.reason}`);

  // Validation 2: Day
  const dayCheck = validateAppointmentDay(appointment);
  console.log(`  ${dayCheck.reason}`);

  // Validation 3: Time (2 hours after)
  const timeCheck = validateTwoHoursAfter(appointment);
  console.log(`  ${timeCheck.reason}`);

  // All checks must pass
  const allChecksPassed = confirmationCheck.passed && dayCheck.passed && timeCheck.passed;

  if (allChecksPassed) {
    console.log(`✅ LIBERADO: Enviar pós-atendimento\n`);
    return {
      isValid: true,
      reason: 'Passou em TODAS as 3 validações',
      details: {
        confirmationCheck: true,
        dayCheck: true,
        timeCheck: true,
      },
    };
  }

  // At least one check failed
  const blockedReasons = [
    !confirmationCheck.passed ? confirmationCheck.reason : null,
    !dayCheck.passed ? dayCheck.reason : null,
    !timeCheck.passed ? timeCheck.reason : null,
  ].filter(Boolean);

  console.log(`❌ BLOQUEADO: ${blockedReasons.length} validação(ões) falharam\n`);

  return {
    isValid: false,
    reason: 'Falhou em uma ou mais validações',
    blockedReason: blockedReasons.join(' | '),
    details: {
      confirmationCheck: confirmationCheck.passed,
      dayCheck: dayCheck.passed,
      timeCheck: timeCheck.passed,
    },
  };
}

/**
 * Helper to get validation summary for logging
 */
export function getValidationSummary(appointment: Appointment): string {
  const validation = validatePostAttendanceEligibility(appointment);
  return `[${validation.isValid ? '✅' : '❌'}] ${validation.reason}${validation.blockedReason ? ` - ${validation.blockedReason}` : ''}`;
}
