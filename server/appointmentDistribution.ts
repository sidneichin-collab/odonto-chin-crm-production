// @ts-nocheck - Legacy code with type issues
import { eq, and, gte, lte, sql, between } from "drizzle-orm";
import { appointments, appointmentDistributionAlerts } from "../drizzle/schema";
import { getDb } from "./db";

interface DayAppointmentCount {
  date: string;
  count: number;
  appointments: Array<{
    id: number;
    patientName: string;
    time: string;
    chair: string;
  }>;
}

interface DistributionAlert {
  alertDate: string;
  alertType: "empty_day" | "overloaded_day" | "unbalanced_week";
  severity: "warning" | "critical";
  appointmentCount: number;
  threshold: number;
  message: string;
  suggestedActions: string[];
  affectedDates: string[];
}

// Configuration thresholds
const EMPTY_DAY_THRESHOLD = 3; // Less than 3 appointments = empty
const CRITICAL_EMPTY_THRESHOLD = 0; // 0 appointments = critical
const OVERLOADED_DAY_THRESHOLD = 15; // More than 15 appointments = overloaded
const CRITICAL_OVERLOAD_THRESHOLD = 20; // More than 20 appointments = critical

/**
 * Get appointment count per day for the next N days
 */
export async function getAppointmentCountPerDay(daysAhead: number = 14): Promise<DayAppointmentCount[]> {
  const db = await getDb();
  if (!db) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + daysAhead);

  // Get all appointments in the date range
  const appointmentsList = await db
    .select({
      id: appointments.id,
      appointmentDate: appointments.appointmentDate,
      chair: appointments.chair,
      status: appointments.status,
    })
    .from(appointments)
    .where(
      and(
        gte(appointments.appointmentDate, today),
        lte(appointments.appointmentDate, endDate),
        sql`${appointments.status} != 'cancelled'`
      )
    )
    .execute();

  // Group by date
  const dateMap = new Map<string, DayAppointmentCount>();

  for (const apt of appointmentsList) {
    const dateStr = apt.appointmentDate.toISOString().split('T')[0];
    const timeStr = apt.appointmentDate.toISOString().split('T')[1].substring(0, 5);
    
    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, {
        date: dateStr,
        count: 0,
        appointments: [],
      });
    }

    const dayData = dateMap.get(dateStr)!;
    dayData.count++;
    dayData.appointments.push({
      id: apt.id,
      patientName: "Paciente",
      time: timeStr,
      chair: apt.chair || "Sin cadeira",
    });
  }

  // Fill in missing dates with 0 appointments
  const result: DayAppointmentCount[] = [];
  for (let i = 0; i < daysAhead; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() + i);
    const dateStr = checkDate.toISOString().split('T')[0];

    if (dateMap.has(dateStr)) {
      result.push(dateMap.get(dateStr)!);
    } else {
      result.push({
        date: dateStr,
        count: 0,
        appointments: [],
      });
    }
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Detect distribution problems and generate alerts
 */
export async function checkDistributionAndGenerateAlerts(): Promise<DistributionAlert[]> {
  const db = await getDb();
  if (!db) return [];

  const dayCounts = await getAppointmentCountPerDay(14);
  const alerts: DistributionAlert[] = [];

  // Check each day
  for (const day of dayCounts) {
    // Skip past dates
    const dayDate = new Date(day.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dayDate < today) continue;

    // Check for empty days
    if (day.count === CRITICAL_EMPTY_THRESHOLD) {
      // Find overloaded days nearby to suggest redistribution
      const nearbyOverloaded = dayCounts.filter(d => {
        const diff = Math.abs(new Date(d.date).getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 3 && d.count >= OVERLOADED_DAY_THRESHOLD;
      });

      const suggestedActions = [
        "Contactar pacientes de días sobrecargados para reagendar",
        "Ofrecer horarios disponibles en este día vacío",
        "Revisar disponibilidad de doctores y personal",
      ];

      if (nearbyOverloaded.length > 0) {
        suggestedActions.push(`Redistribuir desde: ${nearbyOverloaded.map(d => d.date).join(", ")}`);
      }

      alerts.push({
        alertDate: day.date,
        alertType: "empty_day",
        severity: "critical",
        appointmentCount: day.count,
        threshold: CRITICAL_EMPTY_THRESHOLD,
        message: `¡DÍA COMPLETAMENTE VACÍO! ${day.date} no tiene ninguna consulta agendada.`,
        suggestedActions,
        affectedDates: [day.date, ...nearbyOverloaded.map(d => d.date)],
      });
    } else if (day.count < EMPTY_DAY_THRESHOLD) {
      alerts.push({
        alertDate: day.date,
        alertType: "empty_day",
        severity: "warning",
        appointmentCount: day.count,
        threshold: EMPTY_DAY_THRESHOLD,
        message: `Día con baja ocupación: ${day.date} tiene solo ${day.count} consulta(s) agendada(s).`,
        suggestedActions: [
          "Contactar pacientes en lista de espera",
          "Promover disponibilidad en redes sociales",
          "Revisar si hay consultas pendientes de confirmación",
        ],
        affectedDates: [day.date],
      });
    }

    // Check for overloaded days
    if (day.count >= CRITICAL_OVERLOAD_THRESHOLD) {
      // Find empty days nearby
      const nearbyEmpty = dayCounts.filter(d => {
        const diff = Math.abs(new Date(d.date).getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 3 && d.count < EMPTY_DAY_THRESHOLD;
      });

      const suggestedActions = [
        "Redistribuir consultas a días con menor carga",
        "Contactar pacientes para ofrecer horarios alternativos",
        "Verificar capacidad de personal y recursos",
      ];

      if (nearbyEmpty.length > 0) {
        suggestedActions.push(`Días disponibles cercanos: ${nearbyEmpty.map(d => d.date).join(", ")}`);
      }

      alerts.push({
        alertDate: day.date,
        alertType: "overloaded_day",
        severity: "critical",
        appointmentCount: day.count,
        threshold: CRITICAL_OVERLOAD_THRESHOLD,
        message: `¡DÍA SOBRECARGADO! ${day.date} tiene ${day.count} consultas agendadas (capacidad excedida).`,
        suggestedActions,
        affectedDates: [day.date, ...nearbyEmpty.map(d => d.date)],
      });
    } else if (day.count >= OVERLOADED_DAY_THRESHOLD) {
      alerts.push({
        alertDate: day.date,
        alertType: "overloaded_day",
        severity: "warning",
        appointmentCount: day.count,
        threshold: OVERLOADED_DAY_THRESHOLD,
        message: `Día con alta carga: ${day.date} tiene ${day.count} consultas agendadas.`,
        suggestedActions: [
          "Monitorear capacidad de atención",
          "Considerar redistribuir algunas consultas",
          "Preparar recursos adicionales",
        ],
        affectedDates: [day.date],
      });
    }
  }

  // Save alerts to database
  for (const alert of alerts) {
    // Check if alert already exists
    const existing = await db
      .select()
      .from(appointmentDistributionAlerts)
      .where(
        and(
          eq(appointmentDistributionAlerts.alertDate, new Date(alert.alertDate)),
          eq(appointmentDistributionAlerts.isResolved, false)
        )
      )
      .execute();

    if (existing.length === 0) {
      await db.insert(appointmentDistributionAlerts).values({
        alertDate: new Date(alert.alertDate),
        alertType: alert.alertType,
        severity: alert.severity,
        appointmentCount: alert.appointmentCount,
        threshold: alert.threshold,
        message: alert.messageText,
        suggestedActions: JSON.stringify(alert.suggestedActions),
        affectedDates: JSON.stringify(alert.affectedDates),
        isResolved: false,
      }).execute();
    }
  }

  return alerts;
}

/**
 * Get active distribution alerts
 */
export async function getActiveDistributionAlerts() {
  const db = await getDb();
  if (!db) return [];

  const alerts = await db
    .select()
    .from(appointmentDistributionAlerts)
    .where(eq(appointmentDistributionAlerts.isResolved, false))
    .orderBy(
      sql`FIELD(${appointmentDistributionAlerts.severity}, 'critical', 'warning')`,
      appointmentDistributionAlerts.alertDate
    )
    .execute();

  return alerts.map(alert => ({
    ...alert,
    suggestedActions: alert.suggestedActions ? JSON.parse(alert.suggestedActions) : [],
    affectedDates: alert.affectedDates ? JSON.parse(alert.affectedDates) : [],
  }));
}

/**
 * Resolve distribution alert
 */
export async function resolveDistributionAlert(alertId: number, userId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(appointmentDistributionAlerts)
    .set({
      isResolved: true,
      resolvedAt: new Date(),
      resolvedBy: userId,
    })
    .where(eq(appointmentDistributionAlerts.id, alertId))
    .execute();
}
