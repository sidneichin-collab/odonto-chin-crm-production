// @ts-nocheck
import { db } from "./db";
import { appointments, defaultRiskAlerts, patients } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

interface RiskPatient {
  patientId: number;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  noShowCount: number;
  overduePaymentsCount: number;
  lastIncidentDate: Date | null;
  reason: string;
  notes: string | null;
}

/**
 * Calcula o score de risco de um paciente baseado em:
 * - Número de faltas (no-shows)
 * - Número de pagamentos vencidos
 * - Histórico de comportamento
 */
export async function calculatePatientRiskScore(patientId: number): Promise<RiskPatient | null> {
  try {
    // Buscar dados do paciente
    const patientResults = await db.select().from(patients).where(eq(patients.id, patientId)).limit(1);
    const patient = patientResults[0];

    if (!patient) return null;

    // Buscar histórico de faltas (no-shows)
    const noShowAppointments = await db.select().from(appointments).where(
      and(
        eq(appointments.patientId, patientId),
        eq(appointments.status, "no_show")
      )
    );

    // Buscar alertas de risco existentes
    const existingAlerts = await db.select().from(defaultRiskAlerts).where(eq(defaultRiskAlerts.patientId, patientId)).limit(1);
    const existingAlert = existingAlerts[0];

    const noShowCount = noShowAppointments.length;
    const overduePaymentsCount = existingAlert?.overduePaymentsCount || 0;

    // Calcular score de risco
    let riskScore = 0;
    const reasons: string[] = [];

    // Faltas: cada falta adiciona 15 pontos
    riskScore += noShowCount * 15;
    if (noShowCount > 0) {
      reasons.push(`${noShowCount} falta(s) registrada(s)`);
    }

    // Pagamentos vencidos: cada pagamento vencido adiciona 10 pontos
    riskScore += overduePaymentsCount * 10;
    if (overduePaymentsCount > 0) {
      reasons.push(`${overduePaymentsCount} pagamento(s) vencido(s)`);
    }

    // Padrão de comportamento: se tem 2+ faltas, adiciona 20 pontos
    if (noShowCount >= 2) {
      riskScore += 20;
      reasons.push("Padrão de faltas recorrentes");
    }

    // Limite máximo de 100 pontos
    riskScore = Math.min(riskScore, 100);

    // Determinar nível de risco
    let riskLevel: "low" | "medium" | "high" | "critical" = "low";
    if (riskScore >= 75) riskLevel = "critical";
    else if (riskScore >= 50) riskLevel = "high";
    else if (riskScore >= 25) riskLevel = "medium";

    const lastIncidentDate = noShowAppointments[0]?.appointmentDate || null;

    return {
      patientId,
      patientName: patient.name,
      patientPhone: patient.phone || "",
      patientEmail: patient.email || "",
      riskScore,
      riskLevel,
      noShowCount,
      overduePaymentsCount,
      lastIncidentDate,
      reason: reasons.join("; "),
      notes: existingAlert?.notes || null,
    };
  } catch (error) {
    console.error(`Erro ao calcular score de risco para paciente ${patientId}:`, error);
    return null;
  }
}

/**
 * Busca todos os pacientes com risco alto ou crítico
 */
export async function getHighRiskPatients(): Promise<RiskPatient[]> {
  try {
    // Buscar todos os pacientes
    const allPatients = await db.select().from(patients);

    const highRiskPatients: RiskPatient[] = [];

    // Calcular score para cada paciente
    for (const patient of allPatients) {
      const riskData = await calculatePatientRiskScore(patient.id);
      if (riskData && riskData.riskScore >= 50) {
        highRiskPatients.push(riskData);
      }
    }

    // Ordenar por score de risco (decrescente)
    return highRiskPatients.sort((a, b) => b.riskScore - a.riskScore);
  } catch (error) {
    console.error("Erro ao buscar pacientes em risco:", error);
    return [];
  }
}

/**
 * Atualiza ou cria alerta de risco para um paciente
 */
export async function updateRiskAlert(
  patientId: number,
  riskLevel: "low" | "medium" | "high" | "critical",
  reason: string,
  noShowCount: number,
  overduePaymentsCount: number,
  notes?: string
): Promise<void> {
  try {
    const existingAlerts = await db.select().from(defaultRiskAlerts).where(eq(defaultRiskAlerts.patientId, patientId)).limit(1);
    const existingAlert = existingAlerts[0];

    if (existingAlert) {
      // Atualizar alerta existente
      await db
        .update(defaultRiskAlerts)
        .set({
          riskLevel,
          reason,
          noShowCount,
          overduePaymentsCount,
          notes: notes || existingAlert.notes,
          updatedAt: new Date(),
        })
        .where(eq(defaultRiskAlerts.patientId, patientId));
    } else {
      // Criar novo alerta
      await db.insert(defaultRiskAlerts).values({
        patientId,
        riskLevel,
        reason,
        noShowCount,
        overduePaymentsCount,
        notes: notes || null,
        isResolved: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error(`Erro ao atualizar alerta de risco para paciente ${patientId}:`, error);
  }
}

/**
 * Marca um alerta de risco como resolvido
 */
export async function resolveRiskAlert(patientId: number, notes?: string): Promise<void> {
  try {
    await db
      .update(defaultRiskAlerts)
      .set({
        isResolved: true,
        resolvedAt: new Date(),
        notes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(defaultRiskAlerts.patientId, patientId));
  } catch (error) {
    console.error(`Erro ao resolver alerta de risco para paciente ${patientId}:`, error);
  }
}

/**
 * Busca pacientes críticos que precisam de ação imediata
 */
export async function getCriticalRiskPatients(): Promise<RiskPatient[]> {
  try {
    const allPatients = await db.select().from(patients);
    const criticalPatients: RiskPatient[] = [];

    for (const patient of allPatients) {
      const riskData = await calculatePatientRiskScore(patient.id);
      if (riskData && riskData.riskScore >= 75) {
        criticalPatients.push(riskData);
      }
    }

    return criticalPatients.sort((a, b) => b.riskScore - a.riskScore);
  } catch (error) {
    console.error("Erro ao buscar pacientes críticos:", error);
    return [];
  }
}

/**
 * Gera relatório de risco para a secretária
 */
export async function generateRiskReport(): Promise<{
  totalPatients: number;
  criticalRisk: number;
  highRisk: number;
  mediumRisk: number;
  topRiskPatients: RiskPatient[];
  recommendations: string[];
}> {
  try {
    const highRiskPatients = await getHighRiskPatients();
    const criticalPatients = highRiskPatients.filter((p) => p.riskScore >= 75);
    const highPatients = highRiskPatients.filter((p) => p.riskScore >= 50 && p.riskScore < 75);
    const mediumPatients = highRiskPatients.filter((p) => p.riskScore >= 25 && p.riskScore < 50);

    const recommendations: string[] = [];

    if (criticalPatients.length > 0) {
      recommendations.push(
        `⚠️ CRÍTICO: ${criticalPatients.length} paciente(s) em risco crítico. Requer ação imediata.`
      );
    }

    if (highPatients.length > 0) {
      recommendations.push(
        `🔴 ALTO: ${highPatients.length} paciente(s) em risco alto. Recomenda-se confirmação dupla e ligação pessoal.`
      );
    }

    if (mediumPatients.length > 0) {
      recommendations.push(
        `🟡 MÉDIO: ${mediumPatients.length} paciente(s) em risco médio. Enviar recordatórios extras.`
      );
    }

    return {
      totalPatients: highRiskPatients.length,
      criticalRisk: criticalPatients.length,
      highRisk: highPatients.length,
      mediumRisk: mediumPatients.length,
      topRiskPatients: highRiskPatients.slice(0, 10),
      recommendations,
    };
  } catch (error) {
    console.error("Erro ao gerar relatório de risco:", error);
    return {
      totalPatients: 0,
      criticalRisk: 0,
      highRisk: 0,
      mediumRisk: 0,
      topRiskPatients: [],
      recommendations: ["Erro ao gerar relatório"],
    };
  }
}
