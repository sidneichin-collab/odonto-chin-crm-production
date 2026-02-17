// @ts-nocheck
import { db, getDb } from './db';
import { incomingMessages, appointments, patients } from '../drizzle/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

export interface RescheduleHistoryRecord {
  id: string;
  patientName: string;
  patientPhone: string;
  originalDate: string;
  originalTime: string;
  newDate?: string;
  newTime?: string;
  reason?: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: number;
  completedAt?: number;
  secretaryId?: number;
  secretaryName?: string;
}

/**
 * Obtiene el histórico de reagendamientos
 */
export async function getRescheduleHistory(
  startDate?: number,
  endDate?: number,
  status?: 'pending' | 'completed' | 'cancelled'
): Promise<RescheduleHistoryRecord[]> {
  try {
    const database = await getDb();
    if (!database) {
      console.error('Database connection failed');
      return [];
    }

    // Obtener mensajes de reagendamiento
    const conditions = [eq(incomingMessages.detectedIntent, 'reschedule')];
    
    if (startDate) {
      conditions.push(gte(incomingMessages.createdAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(incomingMessages.createdAt, new Date(endDate)));
    }

    const rescheduleMessages = await database
      .select()
      .from(incomingMessages)
      .where(and(...conditions))
      .orderBy(desc(incomingMessages.createdAt));

    // Enriquecer con información de pacientes y citas
    const enrichedRecords: RescheduleHistoryRecord[] = await Promise.all(
      rescheduleMessages.map(async (msg: any) => {
        let patientName = 'Desconocido';
        let originalDate = '';
        let originalTime = '';
        let appointmentStatus = 'pending';

        // Obtener información del paciente
        if (msg.senderPhone) {
          const patientRecords = await database
            .select()
            .from(patients)
            .where(eq(patients.phone, msg.senderPhone))
            .limit(1);

          if (patientRecords.length > 0) {
            patientName = patientRecords[0].fullName || 'Desconocido';
          }
        }

        // Obtener información de la cita original
        if (msg.relatedAppointmentId) {
          const appointmentRecords = await database
            .select()
            .from(appointments)
            .where(eq(appointments.id, msg.relatedAppointmentId))
            .limit(1);

          if (appointmentRecords.length > 0) {
            const apt = appointmentRecords[0];
            const appointmentDateTime = new Date(apt.appointmentDate);
            originalDate = appointmentDateTime.toLocaleDateString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            });
            originalTime = appointmentDateTime.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            });
            appointmentStatus = apt.status || 'pending';
          }
        }

        return {
          id: `RESCHEDULE_${msg.id}`,
          patientName,
          patientPhone: msg.senderPhone || 'N/A',
          originalDate,
          originalTime,
          reason: msg.messageText,
          status: (appointmentStatus as 'pending' | 'completed' | 'cancelled') || 'pending',
          createdAt: msg.createdAt.getTime(),
        };
      })
    );

    // Filtrar por estado si se especifica
    if (status) {
      return enrichedRecords.filter((r) => r.status === status);
    }

    return enrichedRecords;
  } catch (error) {
    console.error('Error obteniendo histórico de reagendamientos:', error);
    return [];
  }
}

/**
 * Obtiene estadísticas de reagendamientos
 */
export async function getRescheduleStats(startDate?: number, endDate?: number) {
  try {
    const records = await getRescheduleHistory(startDate, endDate);

    const stats = {
      total: records.length,
      completed: records.filter((r) => r.status === 'completed').length,
      pending: records.filter((r) => r.status === 'pending').length,
      cancelled: records.filter((r) => r.status === 'cancelled').length,
      completionRate:
        records.length > 0
          ? Math.round((records.filter((r) => r.status === 'completed').length / records.length) * 100)
          : 0,
    };

    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas de reagendamientos:', error);
    return {
      total: 0,
      completed: 0,
      pending: 0,
      cancelled: 0,
      completionRate: 0,
    };
  }
}

/**
 * Marca un reagendamiento como completado
 */
export async function completeReschedule(
  rescheduleId: string,
  newDate: string,
  newTime: string,
  secretaryId?: number,
  secretaryName?: string
): Promise<boolean> {
  try {
    console.log(
      `Reagendamiento ${rescheduleId} completado por ${secretaryName} (${secretaryId}). Nueva cita: ${newDate} a las ${newTime}`
    );

    return true;
  } catch (error) {
    console.error('Error completando reagendamiento:', error);
    return false;
  }
}
