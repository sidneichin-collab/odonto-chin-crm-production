/**
 * Advanced Reminder Templates with Persuasion Psychology
 * 
 * Templates educacionais sobre ortodoncia con persuasión, 
 * basados en principios de Cialdini y técnicas de ventas
 * 
 * TODAS LAS MENSAJES EN ESPAÑOL
 */

export interface AdvancedTemplate {
  templateId: string;
  name: string;
  triggerType: "after_confirmation" | "day_before_evening" | "day_of_appointment";
  sendTime: string; // HH:mm format
  messageContent: string;
  persuasionTechniques: string[];
  emotionalTriggers: string[];
  educationalContent?: string | null;
  urgencyLevel: number; // 1-10
  language: "es";
}

export const advancedTemplates: Record<string, AdvancedTemplate> = {
  // ============ DESPUÉS DE CONFIRMACIÓN (Día siguiente a las 15h) ============
  
  "post_confirmation_educational_brackets": {
    templateId: "post_confirmation_educational_brackets",
    name: "Educación sobre Brackets - Día siguiente",
    triggerType: "after_confirmation",
    sendTime: "15:00",
    messageContent: `¡Hola {patientName}! 😊

¡Qué emoción! Confirmaste tu cita y estás a punto de comenzar tu transformación. 

Hoy queremos compartirte algo importante sobre los brackets:

🦷 **¿Qué son los brackets?**
Son pequeños aparatos que la Dra {doctorName} colocará en tus dientes. Trabajan lentamente pero de forma constante, moviendo tus dientes a la posición perfecta.

✨ **¿Cuándo verás cambios?**
- Semana 1: Primeros ajustes
- Mes 1: Ya notarás diferencias
- Mes 3: Transformación visible
- Mes 6: Cambio significativo
- Mes 18: ¡Tu sonrisa perfecta!

💪 **Lo mejor:** Cada día que pases con brackets, te acercas más a la sonrisa de tus sueños.

La Dra {doctorName} te espera el {appointmentDate} a las {appointmentTime}. 

¡Nos vemos pronto! 🌟`,
    persuasionTechniques: ["prova_social", "autoridad", "anticipacion"],
    emotionalTriggers: ["transformacion", "esperanza", "confianza"],
    educationalContent: "Fases del tratamiento, timeline de cambios visibles",
    urgencyLevel: 3,
    language: "es",
  },

  "post_confirmation_social_proof": {
    templateId: "post_confirmation_social_proof",
    name: "Prova Social - Historias de Éxito",
    triggerType: "after_confirmation",
    sendTime: "15:00",
    messageContent: `¡{patientName}, mira esto! 👀

Queremos mostrarte algo que te emocionará: cientos de pacientes como tú ya tienen sonrisas hermosas gracias a la Dra {doctorName}.

📸 **Historias reales:**
- María: "En 18 meses pasé de estar avergonzada a sonreír sin miedo"
- Carlos: "Ahora tengo la confianza que siempre quise"
- Ana: "Mi sonrisa cambió mi vida, ¡en serio!"

🌟 **¿Qué tienen en común?**
Todos confirmaron su cita (como tú) y tomaron la decisión de transformarse.

Tu historia de éxito comienza el {appointmentDate} a las {appointmentTime}.

¿Listo para brillar? ✨`,
    persuasionTechniques: ["prova_social", "consistencia", "simpatia"],
    emotionalTriggers: ["autoestima", "confianza", "transformacion"],
    educationalContent: "Testimonios de pacientes, resultados comprobados",
    urgencyLevel: 4,
    language: "es",
  },

  "post_confirmation_health_benefits": {
    templateId: "post_confirmation_health_benefits",
    name: "Beneficios de Salud - Educación",
    triggerType: "after_confirmation",
    sendTime: "15:00",
    messageContent: `¡Hola {patientName}! 🦷

Sabías que los brackets no solo te dan una sonrisa hermosa, sino que también cuidan tu salud?

💪 **Beneficios que no ves pero SÍ sientes:**

✓ Mejor masticación = Mejor digestión
✓ Dientes alineados = Menos caries y enfermedades de encías
✓ Posición correcta = Menos dolor de cabeza y mandíbula
✓ Sonrisa perfecta = Más confianza en tu salud

🎯 **Lo importante:** Cada cita con la Dra {doctorName} es un paso hacia una boca más sana.

Tu cita es el {appointmentDate} a las {appointmentTime}. ¡No la pierdas!

Porque tu salud es lo más importante. 💚`,
    persuasionTechniques: ["autoridad", "beneficio_funcional", "escasez"],
    emotionalTriggers: ["salud", "bienestar", "responsabilidad"],
    educationalContent: "Beneficios funcionales y de salud de la ortodoncia",
    urgencyLevel: 3,
    language: "es",
  },

  // ============ DÍA ANTERIOR A LAS 15h (Refuerzo educacional) ============

  "day_before_confidence_message": {
    templateId: "day_before_confidence_message",
    name: "Mensaje de Confianza - Día Anterior",
    triggerType: "day_before_evening",
    sendTime: "15:00",
    messageContent: `¡{patientName}! 🌟

Mañana es el gran día. Sabemos que puede haber nervios, ¡pero escúchanos!

La Dra {doctorName} es una especialista con años de experiencia transformando sonrisas. Cientos de pacientes han pasado por esto y hoy están felicísimos.

💭 **¿Nervios?** Es normal. Pero recuerda:
- La Dra te explicará cada paso
- El proceso es seguro y probado
- En 18 meses tendrás la sonrisa que siempre quisiste

🎯 **Mañana a las {appointmentTime} comienza tu transformación.**

Ven con confianza. La Dra y su equipo te cuidarán.

¡Nos vemos mañana! 💪✨`,
    persuasionTechniques: ["autoridad", "prova_social", "reciprocidad"],
    emotionalTriggers: ["confianza", "esperanza", "seguridad"],
    educationalContent: "Tranquilización sobre el proceso",
    urgencyLevel: 6,
    language: "es",
  },

  "day_before_final_motivation": {
    templateId: "day_before_final_motivation",
    name: "Motivación Final - Noche Anterior",
    triggerType: "day_before_evening",
    sendTime: "19:00",
    messageContent: `{patientName}, una última cosa antes de dormir... 😊

Mañana empieza tu viaje hacia la sonrisa que SIEMPRE quisiste.

Imagina:
🌟 Sonriendo sin miedo en fotos
🌟 Confianza al hablar con otros
🌟 Esa sensación de "me amo a mí mismo"
🌟 Todos notando tu cambio

TODO eso comienza MAÑANA a las {appointmentTime}.

La Dra {doctorName} está lista para ti. Tu equipo está listo.

¿Tú estás listo? 💪

¡Nos vemos mañana! Que duermas bien. 🌙✨`,
    persuasionTechniques: ["visualizacion", "urgencia", "autoridad"],
    emotionalTriggers: ["transformacion", "autoestima", "anticipacion"],
    educationalContent: "Visualización de resultados",
    urgencyLevel: 7,
    language: "es",
  },

  // ============ DÍA DE LA CITA - MAÑANA TEMPRANO ============

  "day_of_morning_urgency": {
    templateId: "day_of_morning_urgency",
    name: "Urgencia Matutina - Día de la Cita",
    triggerType: "day_of_appointment",
    sendTime: "06:30",
    messageContent: `¡{patientName}! ⏰ ¡HOY ES EL DÍA!

Tu cita con la Dra {doctorName} es HOY a las {appointmentTime}.

🎯 **Recuerda:**
- Dirección: {clinicAddress}
- Hora: {appointmentTime}
- Llega 10 minutos antes

Este es el primer paso de tu transformación. Cada minuto que pases en la clínica hoy te acerca a la sonrisa de tus sueños.

La Dra te espera. No faltes. 💪

¡Nos vemos en {appointmentTime}! ✨`,
    persuasionTechniques: ["urgencia", "especificidad", "autoridad"],
    emotionalTriggers: ["urgencia", "responsabilidad", "anticipacion"],
    educationalContent: "Detalles prácticos de la cita",
    urgencyLevel: 9,
    language: "es",
  },

  "day_of_final_emotional_appeal": {
    templateId: "day_of_final_emotional_appeal",
    name: "Apelo Emocional Final - Día de la Cita",
    triggerType: "day_of_appointment",
    sendTime: "08:00",
    messageContent: `{patientName}, falta poco... 🌟

Hoy es el día en que decides transformar tu vida.

Leo, un gran paso más para tener tus dientes lindos y alineados. La Dra {doctorName} está aquí esperándote para hacer que eso suceda.

En este momento:
✨ Estás tomando la mejor decisión
💪 Estás siendo valiente
🎯 Estás invirtiendo en ti mismo

Eso es lo que hacen las personas que se aman.

La Dra y su equipo te esperan a las {appointmentTime}.

¡Vamos! Tu sonrisa perfecta te espera. 💎`,
    persuasionTechniques: ["apelo_emocional", "autoridad", "transformacion"],
    emotionalTriggers: ["autoestima", "confianza", "transformacion_personal"],
    educationalContent: "Refuerzo de decisión y autoestima",
    urgencyLevel: 10,
    language: "es",
  },

  "day_of_last_minute_reminder": {
    templateId: "day_of_last_minute_reminder",
    name: "Recordatorio Último Minuto",
    triggerType: "day_of_appointment",
    sendTime: "09:30", // 30 minutos antes
    messageContent: `¡{patientName}! ⏰

Tu cita es en 30 minutos a las {appointmentTime}.

La Dra {doctorName} está lista para ti.

¿Ya estás en camino? 🚗

¡Nos vemos en la clínica! 💪✨`,
    persuasionTechniques: ["urgencia_extrema", "especificidad"],
    emotionalTriggers: ["urgencia", "responsabilidad"],
    educationalContent: null,
    urgencyLevel: 10,
    language: "es",
  },
};

/**
 * Format message with patient data
 */
export function formatAdvancedMessage(
  template: AdvancedTemplate,
  data: {
    patientName: string;
    doctorName: string;
    appointmentDate: string;
    appointmentTime: string;
    clinicAddress?: string;
  }
): string {
  let message = template.messageContent;

  message = message.replace("{patientName}", data.patientName);
  message = message.replace("{doctorName}", data.doctorName);
  message = message.replace("{appointmentDate}", data.appointmentDate);
  message = message.replace("{appointmentTime}", data.appointmentTime);
  message = message.replace("{clinicAddress}", data.clinicAddress || "");

  return message;
}

/**
 * Get templates by trigger type
 */
export function getTemplatesByTrigger(
  triggerType: "after_confirmation" | "day_before_evening" | "day_of_appointment"
): AdvancedTemplate[] {
  return Object.values(advancedTemplates).filter((t) => t.triggerType === triggerType);
}

/**
 * Get templates by urgency level
 */
export function getTemplatesByUrgency(minLevel: number): AdvancedTemplate[] {
  return Object.values(advancedTemplates).filter((t) => t.urgencyLevel >= minLevel);
}

/**
 * Get templates by emotional trigger
 */
export function getTemplatesByEmotionalTrigger(trigger: string): AdvancedTemplate[] {
  return Object.values(advancedTemplates).filter((t) =>
    t.emotionalTriggers.includes(trigger)
  );
}

/**
 * Get all persuasion techniques used
 */
export function getAllPersuasionTechniques(): string[] {
  const techniques = new Set<string>();
  Object.values(advancedTemplates).forEach((t) => {
    t.persuasionTechniques.forEach((p) => techniques.add(p));
  });
  return Array.from(techniques);
}

/**
 * Get template statistics
 */
export function getTemplateStatistics() {
  const templates = Object.values(advancedTemplates);
  
  return {
    totalTemplates: templates.length,
    byTriggerType: {
      after_confirmation: templates.filter((t) => t.triggerType === "after_confirmation").length,
      day_before_evening: templates.filter((t) => t.triggerType === "day_before_evening").length,
      day_of_appointment: templates.filter((t) => t.triggerType === "day_of_appointment").length,
    },
    averageUrgencyLevel: Math.round(
      templates.reduce((sum, t) => sum + t.urgencyLevel, 0) / templates.length
    ),
    persuasionTechniques: getAllPersuasionTechniques(),
    emotionalTriggers: Array.from(
      new Set(templates.flatMap((t) => t.emotionalTriggers))
    ),
  };
}
