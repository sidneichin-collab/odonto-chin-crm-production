// @ts-nocheck
/**
 * Risk Analysis Service
 * 
 * Analisa comportamento de pacientes para identificar risco de inadimplência
 * Baseado em:
 * - Histórico de agendamentos não comparecidos (no-shows)
 * - Padrão de cancelamentos de última hora
 * - Histórico de atrasos em pagamentos (se disponível via Veretech)
 * - Frequência de reagendamentos
 */

export interface RiskScore {
  patientId: number;
  score: number; // 0-100 (0 = sem risco, 100 = risco máximo)
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  lastUpdated: Date;
}

export interface RiskFactor {
  type: 'no_show' | 'late_cancel' | 'payment_delay' | 'frequent_reschedule';
  description: string;
  impact: number; // Pontos adicionados ao score
  occurrences: number;
}

/**
 * Calcula score de risco de um paciente
 */
export function calculateRiskScore(patientData: {
  noShowCount: number;
  lateCancelCount: number;
  totalAppointments: number;
  rescheduleCount: number;
  paymentDelayDays?: number;
}): RiskScore {
  let score = 0;
  const factors: RiskFactor[] = [];

  // Fator 1: No-shows (peso alto)
  if (patientData.noShowCount > 0) {
    const noShowRate = patientData.noShowCount / Math.max(patientData.totalAppointments, 1);
    const noShowImpact = Math.min(noShowRate * 50, 40); // Máximo 40 pontos
    score += noShowImpact;
    
    factors.push({
      type: 'no_show',
      description: `${patientData.noShowCount} citas perdidas sin aviso`,
      impact: noShowImpact,
      occurrences: patientData.noShowCount,
    });
  }

  // Fator 2: Cancelamentos de última hora (peso médio)
  if (patientData.lateCancelCount > 0) {
    const lateCancelRate = patientData.lateCancelCount / Math.max(patientData.totalAppointments, 1);
    const lateCancelImpact = Math.min(lateCancelRate * 30, 25); // Máximo 25 pontos
    score += lateCancelImpact;
    
    factors.push({
      type: 'late_cancel',
      description: `${patientData.lateCancelCount} cancelaciones de último momento`,
      impact: lateCancelImpact,
      occurrences: patientData.lateCancelCount,
    });
  }

  // Fator 3: Reagendamentos frequentes (peso baixo)
  if (patientData.rescheduleCount > 3) {
    const rescheduleImpact = Math.min((patientData.rescheduleCount - 3) * 3, 15); // Máximo 15 pontos
    score += rescheduleImpact;
    
    factors.push({
      type: 'frequent_reschedule',
      description: `${patientData.rescheduleCount} reagendamientos solicitados`,
      impact: rescheduleImpact,
      occurrences: patientData.rescheduleCount,
    });
  }

  // Fator 4: Atrasos em pagamentos (peso muito alto)
  if (patientData.paymentDelayDays && patientData.paymentDelayDays > 0) {
    const paymentImpact = Math.min(patientData.paymentDelayDays * 2, 30); // Máximo 30 pontos
    score += paymentImpact;
    
    factors.push({
      type: 'payment_delay',
      description: `${patientData.paymentDelayDays} días de atraso en pagos`,
      impact: paymentImpact,
      occurrences: 1,
    });
  }

  // Determinar nível de risco
  let level: RiskScore['level'];
  if (score >= 70) level = 'critical';
  else if (score >= 50) level = 'high';
  else if (score >= 30) level = 'medium';
  else level = 'low';

  return {
    patientId: 0, // Será preenchido pelo caller
    score: Math.min(Math.round(score), 100),
    level,
    factors,
    lastUpdated: new Date(),
  };
}

/**
 * Determina se um paciente deve ser marcado como "em risco"
 */
export function shouldFlagAsRisk(riskScore: RiskScore): boolean {
  return riskScore.level === 'high' || riskScore.level === 'critical';
}

/**
 * Gera mensagem de alerta para a equipe
 */
export function generateRiskAlert(patientName: string, riskScore: RiskScore): string {
  const levelText = {
    low: 'Bajo',
    medium: 'Medio',
    high: 'Alto',
    critical: 'Crítico',
  }[riskScore.level];

  const factorsText = riskScore.factors
    .map(f => `• ${f.description}`)
    .join('\n');

  return `⚠️ ALERTA DE RIESGO: ${patientName}

Nivel de Riesgo: ${levelText} (${riskScore.score}/100)

Factores Identificados:
${factorsText}

Acción Recomendada:
${riskScore.level === 'critical' 
  ? '🔴 Contactar URGENTEMENTE antes de próxima cita. Considerar solicitar pago anticipado.'
  : riskScore.level === 'high'
  ? '🟠 Enviar recordatorio con 48h de anticipación. Confirmar presencia.'
  : '🟡 Monitorear comportamiento en próximas citas.'
}`;
}
