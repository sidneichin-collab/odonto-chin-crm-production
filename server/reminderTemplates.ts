/**
 * Reminder Message Templates
 * Based on FAASEDERECORDATORIOSEKANBAN document - ABSOLUTE RULES
 */

export interface ReminderVariables {
  nome: string;
  data: string;
  hora: string;
  clinica: string;
  pais: string; // "Paraguay" or other
}

/**
 * Get greeting based on time and country
 */
function getGreeting(hour: number, country: string): string {
  if (country.toLowerCase() === "paraguay") {
    if (hour >= 5 && hour < 12) return "Buenos días";
    if (hour >= 12 && hour < 19) return "Buenas tardes";
    return "Buenas noches";
  }
  // Default for other countries
  if (hour >= 5 && hour < 12) return "Buen día";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

/**
 * Replace variables in template
 */
function replaceVariables(template: string, vars: ReminderVariables): string {
  const hour = new Date().getHours();
  const greeting = getGreeting(hour, vars.pais);
  
  return template
    .replace(/{{saudacao}}/g, greeting)
    .replace(/{{nome}}/g, vars.nome)
    .replace(/{{data}}/g, vars.data)
    .replace(/{{hora}}/g, vars.hora)
    .replace(/{{clinica}}/g, vars.clinica);
}

/**
 * 2 DAYS BEFORE - Message 1 (10h) - Educational tone with greeting
 */
export const REMINDER_2DAYS_10H = (vars: ReminderVariables) => replaceVariables(
  `{{saudacao}} {{nome}}! 😊

Soy de la clínica {{clinica}} y quería recordarte que tienes una cita programada con la Dra. para el {{data}} a las {{hora}}.

Es muy importante que asistas a tu consulta para mantener tu salud bucal en óptimas condiciones. 🦷✨

¿Puedes confirmar tu asistencia? Responde con "Sí" para confirmar. 

¡Te esperamos! 💙`,
  vars
);

/**
 * 2 DAYS BEFORE - Message 2 (15h) - Reinforcement about treatment importance
 */
export const REMINDER_2DAYS_15H = (vars: ReminderVariables) => replaceVariables(
  `{{saudacao}} {{nome}}! 🌟

Te recordamos tu cita con la Dra. en {{clinica}} el {{data}} a las {{hora}}.

Tu tratamiento es fundamental para prevenir problemas mayores y mantener tu sonrisa saludable. 😊

Por favor, confírmanos tu asistencia respondiendo "Sí".

¡Gracias! 💚`,
  vars
);

/**
 * 2 DAYS BEFORE - Message 3 (19h) - Emphasis on Dra and date importance
 */
export const REMINDER_2DAYS_19H = (vars: ReminderVariables) => replaceVariables(
  `{{saudacao}} {{nome}}! 🌙

La Dra. de {{clinica}} te espera el {{data}} a las {{hora}} para tu consulta.

Es muy importante que no faltes, ya que tu salud bucal lo requiere. 🦷

¿Confirmas tu asistencia? Responde "Sí" para confirmar.

¡Te esperamos! 💙`,
  vars
);

/**
 * 1 DAY BEFORE - Message 1 (7h) - Firmer tone (IF NOT CONFIRMED)
 */
export const REMINDER_1DAY_07H = (vars: ReminderVariables) => replaceVariables(
  `{{saudacao}} {{nome}}! ⏰

Mañana {{data}} a las {{hora}} tienes tu cita con la Dra. en {{clinica}}.

Aún no hemos recibido tu confirmación. Es muy importante que confirmes para reservar tu espacio.

Por favor, responde "Sí" para confirmar tu asistencia.

¡Gracias! 🙏`,
  vars
);

/**
 * 1 DAY BEFORE - Message 2 (8h) - Last confirmation (IF NOT CONFIRMED)
 */
export const REMINDER_1DAY_08H = (vars: ReminderVariables) => replaceVariables(
  `{{nome}}, tu cita es mañana {{data}} a las {{hora}} con la Dra. en {{clinica}}. ⏰

Necesitamos tu confirmación urgente para asegurar tu lugar.

Responde "Sí" ahora para confirmar. 

¡No pierdas tu cita! 💙`,
  vars
);

/**
 * 1 DAY BEFORE - Messages 3-7 (10h, 12h, 14h, 16h, 18h) - Progressively persuasive (IF NOT CONFIRMED)
 */
export const REMINDER_1DAY_10H = (vars: ReminderVariables) => replaceVariables(
  `{{nome}}, ¿confirmas tu cita de mañana {{data}} a las {{hora}} con la Dra. en {{clinica}}? 🦷

Tu salud bucal es importante. Responde "Sí" para confirmar.`,
  vars
);

export const REMINDER_1DAY_12H = (vars: ReminderVariables) => replaceVariables(
  `{{nome}}, la Dra. te espera mañana {{data}} a las {{hora}} en {{clinica}}. ⏰

¿Puedes confirmar tu asistencia? Responde "Sí".`,
  vars
);

export const REMINDER_1DAY_14H = (vars: ReminderVariables) => replaceVariables(
  `{{nome}}, tu cita es mañana {{data}} a las {{hora}}. 🦷

Por favor, confirma respondiendo "Sí" para que la Dra. te espere en {{clinica}}.`,
  vars
);

export const REMINDER_1DAY_16H = (vars: ReminderVariables) => replaceVariables(
  `{{nome}}, mañana {{data}} a las {{hora}} tienes cita con la Dra. en {{clinica}}. ⏰

¿Confirmas? Responde "Sí".`,
  vars
);

export const REMINDER_1DAY_18H = (vars: ReminderVariables) => replaceVariables(
  `{{nome}}, última oportunidad para confirmar tu cita de mañana {{data}} a las {{hora}} con la Dra. en {{clinica}}. 🙏

Responde "Sí" ahora.`,
  vars
);

/**
 * DAY OF APPOINTMENT - Message 1 (7h) - Final warning (IF NOT CONFIRMED)
 */
export const REMINDER_SAME_DAY_07H = (vars: ReminderVariables) => replaceVariables(
  `{{saudacao}} {{nome}}! 🌅

HOY {{data}} a las {{hora}} tienes tu cita con la Dra. en {{clinica}}.

Aún no hemos recibido tu confirmación. Por favor, responde "Sí" si vas a asistir.

¡Te esperamos! 💙`,
  vars
);

/**
 * DAY OF APPOINTMENT - Message 2 (2h before) - Last chance (IF NOT CONFIRMED)
 */
export const REMINDER_SAME_DAY_2H_BEFORE = (vars: ReminderVariables) => replaceVariables(
  `{{nome}}, en 2 horas ({{hora}}) tienes tu cita con la Dra. en {{clinica}}. ⏰

Esta es tu última oportunidad para confirmar. Responde "Sí" si vas a venir.

¡Te esperamos! 🦷`,
  vars
);

/**
 * FOR CONFIRMED PATIENTS - Reinforcement (day after confirmation, 10h)
 */
export const REMINDER_CONFIRMED_REINFORCEMENT = (vars: ReminderVariables) => replaceVariables(
  `{{saudacao}} {{nome}}! 😊

¡Gracias por confirmar tu cita del {{data}} a las {{hora}} con la Dra. en {{clinica}}!

Recuerda que tu salud bucal es muy importante. Te esperamos puntualmente. 🦷✨

¡Hasta pronto! 💙`,
  vars
);

/**
 * FOR CONFIRMED PATIENTS - Day of appointment (7h) - Motivational
 */
export const REMINDER_CONFIRMED_SAME_DAY = (vars: ReminderVariables) => replaceVariables(
  `{{saudacao}} {{nome}}! 🌅

¡HOY es tu cita! {{data}} a las {{hora}} con la Dra. en {{clinica}}.

Te esperamos puntualmente. ¡Vamos a cuidar tu sonrisa! 😊🦷

¡Nos vemos pronto! 💙`,
  vars
);

/**
 * Get appropriate reminder message based on days before and time
 */
export function getReminderMessage(
  daysBefore: number,
  hour: number,
  isConfirmed: boolean,
  vars: ReminderVariables
): string | null {
  // For confirmed patients
  if (isConfirmed) {
    if (daysBefore === 0 && hour === 7) {
      return REMINDER_CONFIRMED_SAME_DAY(vars);
    }
    // Reinforcement message (day after confirmation)
    // This should be sent separately when confirmation is detected
    return null;
  }

  // For NOT confirmed patients
  if (daysBefore === 2) {
    if (hour === 10) return REMINDER_2DAYS_10H(vars);
    if (hour === 15) return REMINDER_2DAYS_15H(vars);
    if (hour === 19) return REMINDER_2DAYS_19H(vars);
  }

  if (daysBefore === 1) {
    if (hour === 7) return REMINDER_1DAY_07H(vars);
    if (hour === 8) return REMINDER_1DAY_08H(vars);
    if (hour === 10) return REMINDER_1DAY_10H(vars);
    if (hour === 12) return REMINDER_1DAY_12H(vars);
    if (hour === 14) return REMINDER_1DAY_14H(vars);
    if (hour === 16) return REMINDER_1DAY_16H(vars);
    if (hour === 18) return REMINDER_1DAY_18H(vars);
  }

  if (daysBefore === 0) {
    if (hour === 7) return REMINDER_SAME_DAY_07H(vars);
    // 2h before - needs to be calculated dynamically
    // This should be handled separately in the cron service
  }

  return null;
}
