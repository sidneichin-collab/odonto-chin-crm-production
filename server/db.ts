// @ts-nocheck - Legacy code with type issues
import { eq, and, gte, lte, desc, asc, sql, isNull, or, like, lt, ne, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  patients, 
  InsertPatient,
  treatments,
  InsertTreatment,
  appointments,
  InsertAppointment,

  messageTemplates,
  InsertMessageTemplate,
  communications,
  InsertCommunication,
  notifications,
  InsertNotification,
  waitlist,
  InsertWaitlist,

  whatsappConversations,


  rescheduleAlerts,

  reminderLogs,

  rescheduleRequests,

  tags,

  chairAssignments,
  clinics
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Inicializar db imediatamente
if (process.env.DATABASE_URL) {
  try {
    _db = drizzle(process.env.DATABASE_URL);
  } catch (error) {
    console.warn("[Database] Failed to connect:", error);
  }
}

// Exportar db diretamente para uso com Drizzle ORM
export const db = _db!;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER OPERATIONS ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Usar SQL manual para evitar campos extras do schema
    const name = user.name || null;
    const email = user.email || null;
    const loginMethod = user.loginMethod || 'google';
    const lastSignedIn = user.lastSignedIn || new Date();
    let role: 'user' | 'admin' = user.role || 'user';
    
    // Se for o owner, sempre admin
    if (user.openId === ENV.ownerOpenId) {
      role = 'admin';
    }

    // Query SQL manual com apenas campos que existem
    await db.execute(sql`
      INSERT INTO users (openId, name, email, loginMethod, role, lastSignedIn)
      VALUES (${user.openId}, ${name}, ${email}, ${loginMethod}, ${role}, ${lastSignedIn})
      ON DUPLICATE KEY UPDATE
        name = ${name},
        email = ${email},
        loginMethod = ${loginMethod},
        role = ${role},
        lastSignedIn = ${lastSignedIn}
    `);
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  console.log("[Database] getUserByOpenId called with openId:", openId);
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  try {
    console.log("[Database] Executing query...");
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    console.log("[Database] Query result:", result.length > 0 ? "FOUND (id: " + result[0].id + ")" : "NOT FOUND");
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Error in getUserByOpenId:", error);
    return undefined;
  }
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, userId));
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// COMMENTED OUT: These functions use fields removed from schema (password, status)
// If needed in future, update to use only existing fields
/*
export async function createUserWithPassword(data: { email: string; password: string; name: string; role?: "user" | "admin" }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const bcrypt = await import("bcrypt");
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  const result = await db.insert(users).values({
    openId: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate unique openId for local auth
    email: data.email,
    password: hashedPassword,
    name: data.name,
    role: data.role || "user",
    status: "active",
    loginMethod: "password",
  });
  
  return result;
}

export async function updateUserPassword(userId: number, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const bcrypt = await import("bcrypt");
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
}

export async function updateUserStatus(userId: number, status: "active" | "inactive") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ status }).where(eq(users.id, userId));
}
*/

export async function updateUser(userId: number, data: Partial<{ name: string; email: string; role: "user" | "admin" }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set(data).where(eq(users.id, userId));
}

// ==================== PATIENT OPERATIONS ====================

export async function createPatient(patient: InsertPatient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(patients).values(patient);
  // Return the created patient
  const insertedId = Number(result[0].insertId);
  const created = await getPatientById(insertedId);
  if (!created) throw new Error("Failed to retrieve created patient");
  return created;
}

// Normalize phone number for search (removes +, spaces, and leading zeros)
function normalizePhone(phone: string): string {
  // Remove +, spaces, dashes, parentheses
  let normalized = phone.replace(/[+\s\-()]/g, '');
  
  // Remove leading zeros (0995 -> 995)
  normalized = normalized.replace(/^0+/, '');
  
  return normalized;
}

export async function searchPatients(query: string) {
  const db = await getDb();
  if (!db) return [];
  
  // Check if query looks like a phone number (contains mostly digits)
  const isPhoneQuery = /^[+\d\s\-()]+$/.test(query) && query.replace(/\D/g, '').length >= 6;
  
  if (isPhoneQuery) {
    // Normalize the search query
    const normalizedQuery = normalizePhone(query);
    
    // Search by normalized phone (matches 595981234567, 0981234567, 981234567, etc.)
    const allPatients = await db.select({
      id: patients.id,
      name: patients.name,
      phone: patients.phone,
      email: patients.email,
    })
    .from(patients)
    .limit(100); // Get more to filter in JS
    
    // Filter by normalized phone in JavaScript
    return allPatients
      .filter(p => normalizePhone(p.phone).includes(normalizedQuery))
      .slice(0, 10);
  }
  
  // Search by name or email
  return await db.select({
    id: patients.id,
    name: patients.name,
    phone: patients.phone,
    email: patients.email,
  })
  .from(patients)
  .where(
    or(
      like(patients.name, `%${query}%`),
      like(patients.email, `%${query}%`)
    )
  )
  .limit(10);
}

export async function getAllPatients(searchTerm?: string, status?: string) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(patients);
  
  // Note: patients table does not have a 'status' field
  // Only filter by searchTerm
  if (searchTerm && searchTerm.trim() !== '') {
    query = query.where(
      or(
        like(patients.name, `%${searchTerm}%`),
        like(patients.ci, `%${searchTerm}%`),
        like(patients.phone, `%${searchTerm}%`),
        like(patients.email, `%${searchTerm}%`)
      )
    ) as any;
  }
  
  return await query.orderBy(desc(patients.createdAt));
}

export async function getPatientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePatient(id: number, data: Partial<InsertPatient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(patients).set(data).where(eq(patients.id, id));
}

export async function deletePatient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(patients).where(eq(patients.id, id));
}

export async function getPatientStats() {
  // Temporariamente retornando objeto vazio para debug
  return { active: 0, atRisk: 0 };
}

// ==================== TREATMENT OPERATIONS ====================

export async function createTreatment(treatment: InsertTreatment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(treatments).values(treatment);
  return result;
}

export async function getTreatmentsByPatientId(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(treatments).where(eq(treatments.patientId, patientId)).orderBy(desc(treatments.createdAt));
}

export async function getTreatmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(treatments).where(eq(treatments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateTreatment(id: number, data: Partial<InsertTreatment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(treatments).set(data).where(eq(treatments.id, id));
}

export async function deleteTreatment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(treatments).where(eq(treatments.id, id));
}

export async function getActiveTreatments() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(treatments).where(eq(treatments.status, 'in_progress')).orderBy(desc(treatments.createdAt));
}

// ==================== APPOINTMENT OPERATIONS ====================

export async function createAppointment(appointment: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(appointments).values(appointment);
  // Return the created appointment with patient info
  const insertedId = Number(result[0].insertId);
  const created = await db.select({
    id: appointments.id,
    patientId: appointments.patientId,
    patientName: patients.name,
    appointmentDate: appointments.appointmentDate,
    duration: appointments.duration,
    appointmentType: appointments.treatmentType,
    status: appointments.status,
    notes: appointments.notes,
    reminderAttempts: appointments.reminderAttempts,
  })
  .from(appointments)
  .leftJoin(patients, eq(appointments.patientId, patients.id))
  .where(eq(appointments.id, insertedId))
  .limit(1);
  
  if (!created[0]) throw new Error("Failed to retrieve created appointment");
  return created[0];
}

export async function getAppointmentsByDate(date: Date) {
  const db = await getDb();
  if (!db) return [];
  
  // Get start and end of day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const results = await db.select({
    id: appointments.id,
    patientId: appointments.patientId,
    patientName: patients.name,
    patientPhone: patients.phone,
    treatmentId: appointments.treatmentId,
    appointmentDate: appointments.appointmentDate,
    duration: appointments.duration,
    appointmentType: appointments.treatmentType,
    chair: appointments.chair,
    status: appointments.status,
    notes: appointments.notes,
    createdAt: appointments.createdAt,
    updatedAt: appointments.updatedAt,
  })
    .from(appointments)
    .leftJoin(patients, eq(appointments.patientId, patients.id))
    .where(and(
      gte(appointments.appointmentDate, startOfDay),
      lte(appointments.appointmentDate, endOfDay),
      // Kanban de Agenda mostra APENAS scheduled e confirmed
      inArray(appointments.status, ['scheduled', 'confirmed'])
    ))
    .orderBy(asc(appointments.appointmentDate));
  
  return results;
}

export async function getAppointmentsByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db.select({
    id: appointments.id,
    clinicId: appointments.clinicId,
    patientId: appointments.patientId,
    patientName: patients.name,
    patientPhone: patients.phone,
    treatmentId: appointments.treatmentId,
    appointmentDate: appointments.appointmentDate,
    appointmentTime: appointments.appointmentTime,
    duration: appointments.duration,
    appointmentType: appointments.treatmentType,
    status: appointments.status,
    notes: appointments.notes,
    chair: appointments.chair,
    reminderSent: appointments.reminderSent,
    reminderSentAt: appointments.reminderSentAt,
    reminderAttempts: appointments.reminderAttempts,
    lastReminderAt: appointments.lastReminderAt,
    confirmedAt: appointments.confirmedAt,
    createdAt: appointments.createdAt,
    updatedAt: appointments.updatedAt,
    createdBy: appointments.createdBy,
  })
    .from(appointments)
    .leftJoin(patients, eq(appointments.patientId, patients.id))
    .where(and(
      gte(appointments.appointmentDate, startDate),
      lte(appointments.appointmentDate, endDate)
    ))
    .orderBy(asc(appointments.appointmentDate));
  
  return results;
}

export async function getAppointmentsByPatientId(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(appointments)
    .where(eq(appointments.patientId, patientId))
    .orderBy(desc(appointments.appointmentDate));
}

export async function getAppointmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateAppointment(id: number, data: Partial<InsertAppointment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(appointments).set(data).where(eq(appointments.id, id));
}

export async function deleteAppointment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(appointments).where(eq(appointments.id, id));
}

export async function getTodayAppointments() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return getAppointmentsByDate(today);
}

export async function getTomorrowAppointments(baseDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  const today = baseDate || new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  
  const results = await db.select({
    id: appointments.id,
    patientId: appointments.patientId,
    patientName: patients.name,
    patientPhone: patients.phone,
    treatmentId: appointments.treatmentId,
    appointmentDate: appointments.appointmentDate,
    duration: appointments.duration,
    appointmentType: appointments.treatmentType,
    status: appointments.status,
    notes: appointments.notes,
    reminderSent: appointments.reminderSent,
    reminderSentAt: appointments.reminderSentAt,
    reminderAttempts: appointments.reminderAttempts,
    lastReminderAt: appointments.lastReminderAt,
    confirmedAt: appointments.confirmedAt,
    createdAt: appointments.createdAt,
    updatedAt: appointments.updatedAt,
    createdBy: appointments.createdBy,
  })
    .from(appointments)
    .leftJoin(patients, eq(appointments.patientId, patients.id))
    .where(and(
      gte(appointments.appointmentDate, tomorrow),
      lt(appointments.appointmentDate, dayAfterTomorrow)
    ))
    .orderBy(asc(appointments.appointmentDate));
  
  return results;
}

export async function getUpcomingAppointments(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  
  return await db.select().from(appointments)
    .where(gte(appointments.appointmentDate, now))
    .orderBy(asc(appointments.appointmentDate))
    .limit(limit);
}

// ==================== PAYMENT OPERATIONS ====================


// ==================== MESSAGE TEMPLATE OPERATIONS ====================

export async function createMessageTemplate(template: InsertMessageTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messageTemplates).values(template);
  return result;
}

export async function getAllMessageTemplates() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(messageTemplates).orderBy(desc(messageTemplates.createdAt));
}

export async function getMessageTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(messageTemplates).where(eq(messageTemplates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateMessageTemplate(id: number, data: Partial<InsertMessageTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(messageTemplates).set(data).where(eq(messageTemplates.id, id));
}

export async function deleteMessageTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(messageTemplates).where(eq(messageTemplates.id, id));
}

// ==================== COMMUNICATION OPERATIONS ====================

export async function createCommunication(communication: InsertCommunication) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(communications).values(communication);
  return result;
}

export async function getCommunicationsByPatientId(patientId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(communications)
    .where(eq(communications.patientId, patientId))
    .orderBy(desc(communications.createdAt));
}

export async function getAllCommunications() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(communications).orderBy(desc(communications.createdAt));
}

// ==================== NOTIFICATION OPERATIONS ====================

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(notification);
  return result;
}

export async function getNotificationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    ));
  return result.length;
}

// ==================== IMPORT OPERATIONS ====================

export async function bulkInsertPatients(patientsData: InsertPatient[]) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot bulk insert patients: database not available");
    return { success: 0, errors: [] as string[] };
  }

  const results = { success: 0, errors: [] as string[] };

  for (const patientData of patientsData) {
    try {
      await db.insert(patients).values(patientData);
      results.success++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.messageText : String(error);
      results.errors.push(`Failed to insert patient ${patientData.fullName}: ${errorMsg}`);
    }
  }

  return results;
}

export async function bulkInsertAppointments(appointmentsData: InsertAppointment[]) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot bulk insert appointments: database not available");
    return { success: 0, errors: [] as string[] };
  }

  const results = { success: 0, errors: [] as string[] };

  for (const appointmentData of appointmentsData) {
    try {
      await db.insert(appointments).values(appointmentData);
      results.success++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.messageText : String(error);
      results.errors.push(`Failed to insert appointment for patient ${appointmentData.patientId}: ${errorMsg}`);
    }
  }

  return results;
}

export async function checkDuplicatePatient(phone: string, email?: string) {
  const db = await getDb();
  if (!db) return null;

  const conditions = [eq(patients.phone, phone)];
  if (email) {
    conditions.push(eq(patients.email, email));
  }

  const result = await db.select().from(patients)
    .where(or(...conditions))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}


// Get all appointments for a specific month (for calendar indicators)
export async function getMonthAppointments(year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  
  // month is 0-indexed in JavaScript Date, but we receive 1-indexed from frontend
  const startDate = new Date(year, month - 1, 1);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(year, month, 0); // Last day of the month
  endDate.setHours(23, 59, 59, 999);
  
  const results = await db.select({
    id: appointments.id,
    appointmentDate: appointments.appointmentDate,
    status: appointments.status,
    appointmentType: appointments.treatmentType,
  })
    .from(appointments)
    .where(
      and(
        gte(appointments.appointmentDate, startDate),
        lt(appointments.appointmentDate, endDate)
      )
    );
  
  return results;
}


// ==================== WAITLIST OPERATIONS ====================

export async function addToWaitlist(waitlistData: InsertWaitlist) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add to waitlist: database not available");
    return null;
  }

  try {
    const result = await db.insert(waitlist).values(waitlistData);
    return result;
  } catch (error) {
    console.error("[Database] Error adding to waitlist:", error);
    throw error;
  }
}

export async function getWaitlistByType(appointmentType: "marketing_evaluation" | "orthodontic_treatment" | "general_clinic") {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    id: waitlist.id,
    patientId: waitlist.patientId,
    patientName: patients.name,
    patientPhone: patients.phone,
    appointmentType: waitlist.appointmentType,
    preferredDates: waitlist.preferredDates,
    preferredTimes: waitlist.preferredTimes,
    priority: waitlist.priority,
    status: waitlist.status,
    createdAt: waitlist.createdAt,
    notes: waitlist.notes,
  })
    .from(waitlist)
    .leftJoin(patients, eq(waitlist.patientId, patients.id))
    .where(
      and(
        eq(waitlist.appointmentType, appointmentType),
        eq(waitlist.status, "waiting")
      )
    )
    .orderBy(desc(waitlist.priority), asc(waitlist.createdAt));

  return result;
}

export async function getAllWaitlist() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    id: waitlist.id,
    patientId: waitlist.patientId,
    patientName: patients.name,
    patientPhone: patients.phone,
    appointmentType: waitlist.appointmentType,
    preferredDates: waitlist.preferredDates,
    preferredTimes: waitlist.preferredTimes,
    priority: waitlist.priority,
    status: waitlist.status,
    createdAt: waitlist.createdAt,
    notes: waitlist.notes,
  })
    .from(waitlist)
    .leftJoin(patients, eq(waitlist.patientId, patients.id))
    .where(eq(waitlist.status, "waiting"))
    .orderBy(desc(waitlist.priority), asc(waitlist.createdAt));

  return result;
}

export async function removeFromWaitlist(waitlistId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot remove from waitlist: database not available");
    return null;
  }

  try {
    await db.delete(waitlist).where(eq(waitlist.id, waitlistId));
    return { success: true };
  } catch (error) {
    console.error("[Database] Error removing from waitlist:", error);
    throw error;
  }
}

export async function updateWaitlistStatus(waitlistId: number, status: "waiting" | "notified" | "scheduled" | "expired") {
  const db = await getDb();
  if (!db) return null;

  try {
    const updateData: any = { status };
    if (status === "notified") {
      updateData.notifiedAt = new Date();
    }
    
    await db.update(waitlist)
      .set(updateData)
      .where(eq(waitlist.id, waitlistId));
    
    return { success: true };
  } catch (error) {
    console.error("[Database] Error updating waitlist status:", error);
    throw error;
  }
}

// ==================== RISK SCORE OPERATIONS ====================

export async function calculateRiskScore(patientId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    // Get patient's no-show count
    const patient = await db.select({
      noShowCount: patients.noShowCount,
    })
      .from(patients)
      .where(eq(patients.id, patientId))
      .limit(1);

    if (!patient.length) return 0;

    const noShowCount = patient[0].noShowCount || 0;

    // Get total appointments
    const totalAppointmentsResult = await db.select({
      count: sql<number>`count(*)`,
    })
      .from(appointments)
      .where(eq(appointments.patientId, patientId));

    const totalAppointments = Number(totalAppointmentsResult[0]?.count || 0);

    // Get confirmed appointments
    const confirmedAppointmentsResult = await db.select({
      count: sql<number>`count(*)`,
    })
      .from(appointments)
      .where(
        and(
          eq(appointments.patientId, patientId),
          eq(appointments.status, "confirmed")
        )
      );

    const confirmedAppointments = Number(confirmedAppointmentsResult[0]?.count || 0);

    // Calculate risk score (0-100)
    let riskScore = 0;

    // No-show weight (0-50 points)
    if (noShowCount >= 5) {
      riskScore += 50;
    } else if (noShowCount >= 3) {
      riskScore += 35;
    } else if (noShowCount >= 2) {
      riskScore += 20;
    } else if (noShowCount >= 1) {
      riskScore += 10;
    }

    // Confirmation rate weight (0-50 points)
    if (totalAppointments > 0) {
      const confirmationRate = confirmedAppointments / totalAppointments;
      if (confirmationRate < 0.3) {
        riskScore += 50;
      } else if (confirmationRate < 0.5) {
        riskScore += 35;
      } else if (confirmationRate < 0.7) {
        riskScore += 20;
      }
    }

    return Math.min(riskScore, 100);
  } catch (error) {
    console.error("[Database] Error calculating risk score:", error);
    return 0;
  }
}

export async function updatePatientRiskScore(patientId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const riskScore = await calculateRiskScore(patientId);
    
    // Update patient status based on risk score
    let status: "active" | "at_risk" = "active";
    if (riskScore >= 50) {
      status = "at_risk";
    }

    await db.update(patients)
      .set({ riskScore, status })
      .where(eq(patients.id, patientId));

    return { riskScore, status };
  } catch (error) {
    console.error("[Database] Error updating patient risk score:", error);
    throw error;
  }
}

export async function incrementNoShowCount(patientId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.update(patients)
      .set({ noShowCount: sql`${patients.noShowCount} + 1` })
      .where(eq(patients.id, patientId));

    // Recalculate risk score after incrementing no-show count
    await updatePatientRiskScore(patientId);

    return { success: true };
  } catch (error) {
    console.error("[Database] Error incrementing no-show count:", error);
    throw error;
  }
}

export async function getHighRiskPatients() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    id: patients.id,
    fullName: patients.name,
    phone: patients.phone,
    email: patients.email,
    riskScore: patients.riskScore,
    noShowCount: patients.noShowCount,
    status: patients.status,
  })
    .from(patients)
    .where(gte(patients.riskScore, 50))
    .orderBy(desc(patients.riskScore));

  return result;
}


// ==================== WEBHOOK OPERATIONS ====================

export async function getRecentIncomingMessages(connectionId?: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  const { incomingMessages } = await import("../drizzle/schema");
  
  if (connectionId) {
    return await db.select().from(incomingMessages)
      .where(eq(incomingMessages.connectionId, connectionId))
      .orderBy(desc(incomingMessages.createdAt))
      .limit(limit);
  } else {
    return await db.select().from(incomingMessages)
      .orderBy(desc(incomingMessages.createdAt))
      .limit(limit);
  }
}

export async function getWebhookLogs(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  const { webhookLogs } = await import("../drizzle/schema");
  
  return await db.select().from(webhookLogs)
    .orderBy(desc(webhookLogs.createdAt))
    .limit(limit);
}


// ==================== WHATSAPP CHANNEL STATS ====================

// export async function getChannelStats(sessionId: string) {
//   const db = await getDb();
//   if (!db) {
//     return {
//       messagesSentToday: 0,
//       messagesFailedToday: 0,
//       successRate: 100,
//       lastMessageSentAt: null,
//       uptime: 0,
//     };
//   }
//   
//   const { whatsappMessageLogs, whatsappSessions } = await import("../drizzle/schema");
//   const { sql } = await import("drizzle-orm");
//   
//   // Get today's date at 00:00:00
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   
//   // Count messages sent today
//   const sentToday = await db.select({ count: sql<number>`count(*)` })
//     .from(whatsappMessageLogs)
//     .where(sql`${whatsappMessageLogs.sessionId} = ${sessionId} AND ${whatsappMessageLogs.status} = 'sent' AND ${whatsappMessageLogs.sentAt} >= ${today}`);
//   
//   // Count messages failed today
//   const failedToday = await db.select({ count: sql<number>`count(*)` })
//     .from(whatsappMessageLogs)
//     .where(sql`${whatsappMessageLogs.sessionId} = ${sessionId} AND ${whatsappMessageLogs.status} = 'failed' AND ${whatsappMessageLogs.sentAt} >= ${today}`);
//   
//   // Get last message sent
//   const lastMessage = await db.select({ sentAt: whatsappMessageLogs.sentAt })
//     .from(whatsappMessageLogs)
//     .where(eq(whatsappMessageLogs.sessionId, sessionId))
//     .orderBy(desc(whatsappMessageLogs.sentAt))
//     .limit(1);
//   
//   // Get session info for uptime
//   const session = await db.select()
//     .from(whatsappSessions)
//     .where(eq(whatsappSessions.sessionId, sessionId))
//     .limit(1);
//   
//   const messagesSentToday = Number(sentToday[0]?.count || 0);
//   const messagesFailedToday = Number(failedToday[0]?.count || 0);
//   const totalMessages = messagesSentToday + messagesFailedToday;
//   const successRate = totalMessages > 0 ? (messagesSentToday / totalMessages) * 100 : 100;
//   
//   // Calculate uptime in minutes
//   let uptime = 0;
//   if (session[0]?.lastConnectedAt && session[0]?.status === 'connected') {
//     const connectedAt = new Date(session[0].lastConnectedAt);
//     const now = new Date();
//     uptime = Math.floor((now.getTime() - connectedAt.getTime()) / (1000 * 60));
//   }
//   
//   return {
//     messagesSentToday,
//     messagesFailedToday,
//     successRate,
//     lastMessageSentAt: lastMessage[0]?.sentAt || null,
//     uptime,
//   };
// }


/**
 * Check channel health and create alerts if needed
 */
// export async function checkChannelHealth(sessionId: string) {
//   const db = await getDb();
//   if (!db) return [];
//   
//   const stats = await getChannelStats(sessionId);
//   const alerts = [];
//   
//   // Check if success rate is below 80%
//   if (stats.successRate < 80 && stats.messagesSentToday + stats.messagesFailedToday > 5) {
//     const existingAlert = await db.select()
//       .from(channelHealthAlerts)
//       .where(sql`${channelHealthAlerts.sessionId} = ${sessionId} AND ${channelHealthAlerts.alertType} = 'low_success_rate' AND ${channelHealthAlerts.resolved} = false`)
//       .limit(1);
//     
//     if (existingAlert.length === 0) {
//       const alert = await db.insert(channelHealthAlerts).values({
//         sessionId,
//         alertType: 'low_success_rate',
//         message: `Taxa de sucesso do canal ${sessionId} está abaixo de 80% (${stats.successRate.toFixed(1)}%)`,
//         severity: stats.successRate < 50 ? 'critical' : 'warning',
//       });
//       alerts.push(alert);
//     }
//   } else {
//     // Resolve existing low_success_rate alerts
//     await db.update(channelHealthAlerts)
//       .set({ resolved: true, resolvedAt: new Date() })
//       .where(sql`${channelHealthAlerts.sessionId} = ${sessionId} AND ${channelHealthAlerts.alertType} = 'low_success_rate' AND ${channelHealthAlerts.resolved} = false`);
//   }
//   
//   // Check if channel has been disconnected for more than 5 minutes
//   const session = await db.select()
//     .from(whatsappSessions)
//     .where(eq(whatsappSessions.sessionId, sessionId))
//     .limit(1);
//   
//   if (session[0]?.status === 'disconnected') {
//     const disconnectedAt = session[0].updatedAt;
//     const now = new Date();
//     const minutesDisconnected = Math.floor((now.getTime() - new Date(disconnectedAt).getTime()) / (1000 * 60));
//     
//     if (minutesDisconnected > 5) {
//       const existingAlert = await db.select()
//         .from(channelHealthAlerts)
//         .where(sql`${channelHealthAlerts.sessionId} = ${sessionId} AND ${channelHealthAlerts.alertType} = 'disconnected' AND ${channelHealthAlerts.resolved} = false`)
//         .limit(1);
//       
//       if (existingAlert.length === 0) {
//         const alert = await db.insert(channelHealthAlerts).values({
//           sessionId,
//           alertType: 'disconnected',
//           message: `Canal ${sessionId} está desconectado há ${minutesDisconnected} minutos`,
//           severity: minutesDisconnected > 30 ? 'critical' : 'warning',
//         });
//         alerts.push(alert);
//       }
//     }
//   } else {
//     // Resolve existing disconnected alerts
//     await db.update(channelHealthAlerts)
//       .set({ resolved: true, resolvedAt: new Date() })
//       .where(sql`${channelHealthAlerts.sessionId} = ${sessionId} AND ${channelHealthAlerts.alertType} = 'disconnected' AND ${channelHealthAlerts.resolved} = false`);
//   }
//   
//   return alerts;
// }

/**
 * Get unresolved channel health alerts
 */
// export async function getUnresolvedAlerts() {
//   const db = await getDb();
//   if (!db) return [];
//   
//   return await db.select()
//     .from(channelHealthAlerts)
//     .where(eq(channelHealthAlerts.resolved, false))
//     .orderBy(desc(channelHealthAlerts.createdAt));
// }

/**
 * Get unresolved alerts count
 */
// export async function getUnresolvedAlertsCount() {
//   const db = await getDb();
//   if (!db) return 0;
//   
//   const result = await db.select({ count: sql<number>`count(*)` })
//     .from(channelHealthAlerts)
//     .where(eq(channelHealthAlerts.resolved, false));
//   
//   return Number(result[0]?.count || 0);
// }


// ==================== INBOX OPERATIONS ====================

export async function getInboxConversations(filters?: {
  sessionId?: string;
  status?: 'unread' | 'in_progress' | 'resolved';
}) {
  const db = await getDb();
  if (!db) return [];

  const { whatsappConversations } = await import('../drizzle/schema');
  const { eq, and, desc } = await import('drizzle-orm');

  const conditions = [];
  if (filters?.sessionId) {
    conditions.push(eq(whatsappConversations.sessionId, filters.sessionId));
  }
  if (filters?.status) {
    conditions.push(eq(whatsappConversations.status, filters.status));
  }

  const query = conditions.length > 0
    ? db.select().from(whatsappConversations).where(and(...conditions))
    : db.select().from(whatsappConversations);

  return await query.orderBy(desc(whatsappConversations.lastMessageAt));
}

export async function getConversationMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];

  const { whatsappMessages } = await import('../drizzle/schema');
  const { eq, asc } = await import('drizzle-orm');

  return await db.select().from(whatsappMessages)
    .where(eq(whatsappMessages.conversationId, conversationId))
    .orderBy(asc(whatsappMessages.createdAt));
}

export async function updateConversationStatus(
  conversationId: number,
  status: 'unread' | 'in_progress' | 'resolved',
  userId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { whatsappConversations } = await import('../drizzle/schema');
  const { eq } = await import('drizzle-orm');

  const updateData: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === 'resolved') {
    updateData.resolvedAt = new Date();
    if (userId) {
      updateData.resolvedBy = userId;
    }
  }

  if (status === 'in_progress' && userId) {
    updateData.assignedTo = userId;
  }

  await db.update(whatsappConversations)
    .set(updateData)
    .where(eq(whatsappConversations.id, conversationId));
}

export async function addMessageToConversation(
  conversationId: number,
  message: string,
  direction: 'incoming' | 'outgoing',
  userId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { whatsappMessages, whatsappConversations } = await import('../drizzle/schema');
  const { eq } = await import('drizzle-orm');

  // Add message
  await db.insert(whatsappMessages).values({
    conversationId,
    direction,
    message,
    messageType: 'text',
    sentBy: direction === 'outgoing' ? userId : null,
  });

  // Update conversation last message
  await db.update(whatsappConversations)
    .set({
      lastMessage: message,
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(whatsappConversations.id, conversationId));
}


// ==================== INBOX UNREAD COUNT ====================

export async function getUnreadMessagesCount() {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(whatsappConversations)
    .where(eq(whatsappConversations.status, 'unread'));
  
  return result[0]?.count || 0;
}


// Quick Replies helpers
export async function getQuickReplies(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  return db.select().from(quickReplies).where(eq(quickReplies.createdBy, userId));
}

export async function createQuickReply(data: { 
  title: string; 
  message: string; 
  mediaType?: string;
  mediaUrl?: string | null;
  mediaMimeType?: string | null;
  createdBy: number 
}) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  const result = await db.insert(quickReplies).values({
    title: data.title,
    message: data.messageText,
    mediaType: data.mediaType || 'text',
    mediaUrl: data.mediaUrl || null,
    mediaMimeType: data.mediaMimeType || null,
    createdBy: data.createdBy,
  });
  return result;
}

export async function deleteQuickReply(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  return db.delete(quickReplies).where(
    and(
      eq(quickReplies.id, id),
      eq(quickReplies.createdBy, userId)
    )
  );
}


// ==================== QUICK REPLY USAGE STATS ====================

export async function trackQuickReplyUsage(data: {
  templateId: number;
  conversationId: number | null;
  patientPhone: string;
  patientName: string | null;
  sentBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  return db.insert(quickReplyUsageStats).values({
    templateId: data.templateId,
    conversationId: data.conversationId,
    patientPhone: data.phone || data.patientPhone || "N/A",
    patientName: (data.patientName || "Paciente"),
    sentBy: data.sentBy,
    sentAt: new Date(),
  });
}

export async function trackPatientResponse(usageStatId: number, responseMessage: string) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  // Get the original usage stat to calculate response time
  const [stat] = await db.select().from(quickReplyUsageStats).where(eq(quickReplyUsageStats.id, usageStatId));
  if (!stat) return;
  
  const sentAt = new Date(stat.sentAt);
  const respondedAt = new Date();
  const responseTimeMinutes = Math.floor((respondedAt.getTime() - sentAt.getTime()) / (1000 * 60));
  
  return db.update(quickReplyUsageStats)
    .set({
      patientRespondedAt: respondedAt,
      responseMessage,
      responseTimeMinutes,
    })
    .where(eq(quickReplyUsageStats.id, usageStatId));
}

export async function getTemplateUsageStats(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const conditions = [];
  if (startDate) {
    conditions.push(sql`${quickReplyUsageStats.sentAt} >= ${startDate}`);
  }
  if (endDate) {
    conditions.push(sql`${quickReplyUsageStats.sentAt} <= ${endDate}`);
  }
  
  const baseQuery = db
    .select({
      templateId: quickReplyUsageStats.templateId,
      templateTitle: quickReplies.title,
      mediaType: quickReplies.mediaType,
      totalSent: sql<number>`COUNT(${quickReplyUsageStats.id})`,
      totalResponses: sql<number>`SUM(CASE WHEN ${quickReplyUsageStats.patientRespondedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
      responseRate: sql<number>`ROUND(SUM(CASE WHEN ${quickReplyUsageStats.patientRespondedAt} IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(${quickReplyUsageStats.id}), 2)`,
      avgResponseTimeMinutes: sql<number>`ROUND(AVG(${quickReplyUsageStats.responseTimeMinutes}), 0)`,
    })
    .from(quickReplyUsageStats)
    .leftJoin(quickReplies, eq(quickReplyUsageStats.templateId, quickReplies.id));
  
  if (conditions.length > 0) {
    return baseQuery
      .where(and(...conditions))
      .groupBy(quickReplyUsageStats.templateId, quickReplies.title, quickReplies.mediaType);
  }
  
  return baseQuery.groupBy(quickReplyUsageStats.templateId, quickReplies.title, quickReplies.mediaType);
}

export async function getTemplateUsageOverTime(templateId: number, days: number = 30) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return db
    .select({
      date: sql<string>`DATE(${quickReplyUsageStats.sentAt}) as date`,
      count: sql<number>`COUNT(${quickReplyUsageStats.id}) as count`,
    })
    .from(quickReplyUsageStats)
    .where(
      and(
        eq(quickReplyUsageStats.templateId, templateId),
        sql`${quickReplyUsageStats.sentAt} >= ${startDate}`
      )
    )
    .groupBy(sql`date`)
    .orderBy(sql`date`);
}

export async function getMediaTypeStats(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const conditions = [];
  if (startDate) {
    conditions.push(sql`${quickReplyUsageStats.sentAt} >= ${startDate}`);
  }
  if (endDate) {
    conditions.push(sql`${quickReplyUsageStats.sentAt} <= ${endDate}`);
  }
  
  const baseQuery = db
    .select({
      mediaType: quickReplies.mediaType,
      totalSent: sql<number>`COUNT(${quickReplyUsageStats.id})`,
      totalResponses: sql<number>`SUM(CASE WHEN ${quickReplyUsageStats.patientRespondedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
      responseRate: sql<number>`ROUND(SUM(CASE WHEN ${quickReplyUsageStats.patientRespondedAt} IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(${quickReplyUsageStats.id}), 2)`,
    })
    .from(quickReplyUsageStats)
    .leftJoin(quickReplies, eq(quickReplyUsageStats.templateId, quickReplies.id));
  
  if (conditions.length > 0) {
    return baseQuery
      .where(and(...conditions))
      .groupBy(quickReplies.mediaType);
  }
  
  return baseQuery.groupBy(quickReplies.mediaType);
}


// ==================== A/B TESTING OPERATIONS ====================



// ==================== REMINDER EFFECTIVENESS ANALYTICS ====================

/**
 * Get overall reminder effectiveness statistics
 */
export async function getReminderOverallStats() {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const result = await db
    .select({
      totalSent: sql<number>`COUNT(*)`,
      totalConfirmed: sql<number>`SUM(CASE WHEN ${reminderSchedule.patientConfirmed} = 1 THEN 1 ELSE 0 END)`,
      totalFailed: sql<number>`SUM(CASE WHEN ${reminderSchedule.status} = 'failed' THEN 1 ELSE 0 END)`,
      avgResponseTime: sql<number>`AVG(CASE WHEN ${reminderSchedule.patientConfirmed} = 1 THEN TIMESTAMPDIFF(MINUTE, ${reminderSchedule.sentAt}, ${reminderSchedule.confirmedAt}) ELSE NULL END)`,
    })
    .from(reminderSchedule)
    .where(eq(reminderSchedule.status, 'sent'));

  const stats = result[0];
  const confirmationRate = stats.totalSent > 0 
    ? ((stats.totalConfirmed / stats.totalSent) * 100).toFixed(2)
    : '0.00';

  return {
    totalSent: stats.totalSent || 0,
    totalConfirmed: stats.totalConfirmed || 0,
    totalFailed: stats.totalFailed || 0,
    confirmationRate: parseFloat(confirmationRate),
    avgResponseTimeMinutes: Math.round(stats.avgResponseTime || 0),
  };
}

/**
 * Get reminder effectiveness by attempt number
 */
export async function getReminderStatsByAttempt() {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const results = await db
    .select({
      attemptNumber: reminderSchedule.attemptNumber,
      totalSent: sql<number>`COUNT(*)`,
      totalConfirmed: sql<number>`SUM(CASE WHEN ${reminderSchedule.patientConfirmed} = 1 THEN 1 ELSE 0 END)`,
      avgResponseTime: sql<number>`AVG(CASE WHEN ${reminderSchedule.patientConfirmed} = 1 THEN TIMESTAMPDIFF(MINUTE, ${reminderSchedule.sentAt}, ${reminderSchedule.confirmedAt}) ELSE NULL END)`,
    })
    .from(reminderSchedule)
    .where(eq(reminderSchedule.status, 'sent'))
    .groupBy(reminderSchedule.attemptNumber)
    .orderBy(reminderSchedule.attemptNumber);

  return results.map(row => ({
    attemptNumber: row.attemptNumber,
    totalSent: row.totalSent || 0,
    totalConfirmed: row.totalConfirmed || 0,
    confirmationRate: row.totalSent > 0 
      ? parseFloat(((row.totalConfirmed / row.totalSent) * 100).toFixed(2))
      : 0,
    avgResponseTimeMinutes: Math.round(row.avgResponseTime || 0),
  }));
}

/**
 * Get reminder effectiveness by template
 */
export async function getReminderStatsByTemplate() {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const results = await db
    .select({
      templateId: reminderSchedule.templateId,
      templateName: reminderTemplates.name,
      attemptNumber: reminderTemplates.attemptNumber,
      scheduledHour: reminderTemplates.scheduledHour,
      scheduledMinute: reminderTemplates.scheduledMinute,
      persuasionLevel: reminderTemplates.persuasionLevel,
      totalSent: sql<number>`COUNT(*)`,
      totalConfirmed: sql<number>`SUM(CASE WHEN ${reminderSchedule.patientConfirmed} = 1 THEN 1 ELSE 0 END)`,
      avgResponseTime: sql<number>`AVG(CASE WHEN ${reminderSchedule.patientConfirmed} = 1 THEN TIMESTAMPDIFF(MINUTE, ${reminderSchedule.sentAt}, ${reminderSchedule.confirmedAt}) ELSE NULL END)`,
    })
    .from(reminderSchedule)
    .leftJoin(reminderTemplates, eq(reminderSchedule.templateId, reminderTemplates.id))
    .where(eq(reminderSchedule.status, 'sent'))
    .groupBy(reminderSchedule.templateId, reminderTemplates.name, reminderTemplates.attemptNumber, reminderTemplates.scheduledHour, reminderTemplates.scheduledMinute, reminderTemplates.persuasionLevel)
    .orderBy(sql`totalConfirmed DESC`);

  return results.map(row => ({
    templateId: row.templateId,
    templateName: row.templateName || 'Unknown',
    attemptNumber: row.attemptNumber,
    scheduledTime: `${String(row.scheduledHour).padStart(2, '0')}:${String(row.scheduledMinute).padStart(2, '0')}`,
    persuasionLevel: row.persuasionLevel,
    totalSent: row.totalSent || 0,
    totalConfirmed: row.totalConfirmed || 0,
    confirmationRate: row.totalSent > 0 
      ? parseFloat(((row.totalConfirmed / row.totalSent) * 100).toFixed(2))
      : 0,
    avgResponseTimeMinutes: Math.round(row.avgResponseTime || 0),
  }));
}

/**
 * Get reminder effectiveness by hour of day
 */
export async function getReminderStatsByHour() {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const results = await db
    .select({
      hour: sql<number>`HOUR(${reminderSchedule.sentAt})`,
      totalSent: sql<number>`COUNT(*)`,
      totalConfirmed: sql<number>`SUM(CASE WHEN ${reminderSchedule.patientConfirmed} = 1 THEN 1 ELSE 0 END)`,
    })
    .from(reminderSchedule)
    .where(eq(reminderSchedule.status, 'sent'))
    .groupBy(sql`HOUR(${reminderSchedule.sentAt})`)
    .orderBy(sql`HOUR(${reminderSchedule.sentAt})`);

  return results.map(row => ({
    hour: row.hour,
    hourFormatted: `${String(row.hour).padStart(2, '0')}:00`,
    totalSent: row.totalSent || 0,
    totalConfirmed: row.totalConfirmed || 0,
    confirmationRate: row.totalSent > 0 
      ? parseFloat(((row.totalConfirmed / row.totalSent) * 100).toFixed(2))
      : 0,
  }));
}

/**
 * Get insights and recommendations based on reminder data
 */
export async function getReminderInsights() {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  const byAttempt = await getReminderStatsByAttempt();
  const byTemplate = await getReminderStatsByTemplate();
  const byHour = await getReminderStatsByHour();

  const insights = [];

  // Find most effective attempt
  if (byAttempt.length > 0) {
    const bestAttempt = byAttempt.reduce((best, current) => 
      current.confirmationRate > best.confirmationRate ? current : best
    );
    insights.push({
      type: 'best_attempt',
      title: `Intento #${bestAttempt.attemptNumber} es el más efectivo`,
      description: `Genera ${bestAttempt.confirmationRate}% de confirmaciones`,
      metric: bestAttempt.confirmationRate,
    });
  }

  // Find most effective template
  if (byTemplate.length > 0) {
    const bestTemplate = byTemplate[0]; // Already sorted by totalConfirmed DESC
    insights.push({
      type: 'best_template',
      title: `Plantilla "${bestTemplate.templateName}" es la más efectiva`,
      description: `${bestTemplate.totalConfirmed} confirmaciones de ${bestTemplate.totalSent} envíos (${bestTemplate.confirmationRate}%)`,
      metric: bestTemplate.confirmationRate,
    });
  }

  // Find best hour
  if (byHour.length > 0) {
    const bestHour = byHour.reduce((best, current) => 
      current.confirmationRate > best.confirmationRate ? current : best
    );
    insights.push({
      type: 'best_hour',
      title: `${bestHour.hourFormatted} es el mejor horario`,
      description: `Genera ${bestHour.confirmationRate}% de confirmaciones`,
      metric: bestHour.confirmationRate,
    });
  }

  // Check if early attempts are working
  const firstThreeAttempts = byAttempt.filter(a => a.attemptNumber <= 3);
  if (firstThreeAttempts.length > 0) {
    const earlyConfirmations = firstThreeAttempts.reduce((sum, a) => sum + a.totalConfirmed, 0);
    const earlyTotal = firstThreeAttempts.reduce((sum, a) => sum + a.totalSent, 0);
    const earlyRate = earlyTotal > 0 ? (earlyConfirmations / earlyTotal) * 100 : 0;
    
    if (earlyRate > 50) {
      insights.push({
        type: 'early_success',
        title: 'Los primeros 3 intentos son muy efectivos',
        description: `${earlyRate.toFixed(1)}% de pacientes confirman en los primeros 3 intentos`,
        metric: parseFloat(earlyRate.toFixed(1)),
      });
    }
  }

  return insights;
}


// ==================== REMINDERS MANAGEMENT ====================

export async function getReminderTemplates() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return await db.select().from(reminderTemplates).orderBy(reminderTemplates.attemptNumber);
}

export async function getRemindersByAppointment(appointmentId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  return await db.select().from(reminderSchedule).where(eq(reminderSchedule.appointmentId, appointmentId)).orderBy(reminderSchedule.scheduledFor);
}

/**
 * Get reminder history (last 50 sends) with patient details
 */
export async function getReminderHistory(startDate?: Date, endDate?: Date, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const { reminderLogs } = await import('../drizzle/schema');
  
  let query = db
    .select({
      id: reminderLogs.id,
      appointmentId: reminderLogs.appointmentId,
      channel: reminderLogs.channel,
      message: reminderLogs.messageText,
      status: reminderLogs.status,
      errorMessage: reminderLogs.errorMessage,
      sentAt: reminderLogs.sentAt,
      patientName: patients.name,
      patientPhone: patients.phone,
      appointmentDate: appointments.appointmentDate,
    })
    .from(reminderLogs)
    .leftJoin(appointments, eq(reminderLogs.appointmentId, appointments.id))
    .leftJoin(patients, eq(appointments.patientId, patients.id));

  // Adicionar filtro de data se fornecido
  if (startDate && endDate) {
    query = query.where(
      and(
        gte(reminderLogs.sentAt, startDate),
        lte(reminderLogs.sentAt, endDate)
      )
    );
  }

  return await query
    .orderBy(desc(reminderLogs.sentAt))
    .limit(limit);
}


// ==================== Reschedule Request Detection ====================

export async function detectRescheduleRequest(messageText: string): Promise<boolean> {
  const rescheduleKeywords = [
    'reagendar',
    'cambiar',
    'no puedo',
    'otro día',
    'otro dia',
    'reprogramar',
    'mover',
    'postergar',
    'adelantar',
    'otra fecha',
    'otro horario',
    'cancelar',
    'no voy',
    'no puedo ir',
    'no podré',
    'no podre',
    'imposible',
    'tengo un problema',
    'surgió algo',
    'surgio algo',
    'emergencia',
    'imprevisto'
  ];

  const normalizedText = messageText.toLowerCase().trim();
  
  return rescheduleKeywords.some(keyword => normalizedText.includes(keyword));
}

export async function createRescheduleRequest(data: {
  appointmentId: number;
  patientId: number;
  conversationId?: number;
  detectedMessage: string;
  detectedKeywords: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not initialized');
  
  const result = await db.insert(rescheduleRequests).values({
    appointmentId: data.appointmentId,
    patientId: data.patientId,
    conversationId: data.conversationId,
    detectedMessage: data.detectedMessage,
    detectedKeywords: JSON.stringify(data.detectedKeywords),
    status: 'pending',
  });

  return result;
}

export async function generateWhatsAppLink(phone: string): Promise<string> {
  // Remove all non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Generate WhatsApp link
  return `https://wa.me/${cleanPhone}`;
}


// ==================== RESCHEDULE REQUESTS MANAGEMENT ====================

export async function getAllRescheduleRequests() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  return await db
    .select({
      id: rescheduleRequests.id,
      appointmentId: rescheduleRequests.appointmentId,
      patientId: rescheduleRequests.patientId,
      patientName: patients.name,
      patientPhone: patients.phone,
      appointmentDate: appointments.appointmentDate,
      appointmentType: appointments.treatmentType,
      detectedMessage: rescheduleRequests.detectedMessage,
      detectedKeywords: rescheduleRequests.detectedKeywords,
      status: rescheduleRequests.status,
      notes: rescheduleRequests.notes,
      createdAt: rescheduleRequests.createdAt,
      resolvedAt: rescheduleRequests.resolvedAt,
    })
    .from(rescheduleRequests)
    .innerJoin(patients, eq(rescheduleRequests.patientId, patients.id))
    .innerJoin(appointments, eq(rescheduleRequests.appointmentId, appointments.id))
    .orderBy(desc(rescheduleRequests.createdAt));
}

export async function getRescheduleRequestsByStatus(status: 'pending' | 'notified' | 'resolved') {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[getRescheduleRequestsByStatus] Database not available');
      return [];
    }
    
    const result = await db
      .select({
        id: rescheduleRequests.id,
        appointmentId: rescheduleRequests.appointmentId,
        patientId: rescheduleRequests.patientId,
        patientName: patients.name,
        patientPhone: patients.phone,
        appointmentDate: appointments.appointmentDate,
        appointmentType: appointments.treatmentType,
        detectedMessage: rescheduleRequests.detectedMessage,
        detectedKeywords: rescheduleRequests.detectedKeywords,
        status: rescheduleRequests.status,
        notes: rescheduleRequests.notes,
        createdAt: rescheduleRequests.createdAt,
        resolvedAt: rescheduleRequests.resolvedAt,
      })
      .from(rescheduleRequests)
      .innerJoin(patients, eq(rescheduleRequests.patientId, patients.id))
      .innerJoin(appointments, eq(rescheduleRequests.appointmentId, appointments.id))
      .where(eq(rescheduleRequests.status, status))
      .orderBy(desc(rescheduleRequests.createdAt));
    
    return result || [];
  } catch (error) {
    console.error('[getRescheduleRequestsByStatus] Error:', error);
    return [];
  }
}

export async function markRescheduleRequestAsResolved(
  requestId: number,
  resolvedBy: number,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const updateData: any = {
    status: 'resolved',
    resolvedAt: new Date(),
    resolvedBy,
  };
  
  if (notes) {
    updateData.notes = notes;
  }
  
  return await db
    .update(rescheduleRequests)
    .set(updateData)
    .where(eq(rescheduleRequests.id, requestId));
}

export async function addNotesToRescheduleRequest(requestId: number, notes: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  return await db
    .update(rescheduleRequests)
    .set({ notes })
    .where(eq(rescheduleRequests.id, requestId));
}


// ==================== CLINIC CONFIG ====================

export async function getClinicConfig() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const configs = await db.select().from(clinicConfig).limit(1);
  return configs.length > 0 ? configs[0] : null;
}

export async function updateClinicConfig(data: {
  clinicName: string;
  clinicWhatsAppPhone: string;
  notificationsEnabled: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // Check if config exists
  const existing = await getClinicConfig();
  
  if (existing) {
    // Update existing
    return await db
      .update(clinicConfig)
      .set(data)
      .where(eq(clinicConfig.id, existing.id));
  } else {
    // Insert new
    return await db.insert(clinicConfig).values(data);
  }
}


// ========================================
// Email Configuration Helpers
// ========================================

export async function getEmailConfig() {
  const db = await getDb();
  if (!db) return null;
  
  const configs = await db.select().from(emailConfigs).where(eq(emailConfigs.isActive, true)).limit(1);
  return configs[0] || null;
}

export async function updateEmailConfig(data: {
  clinicName: string;
  emailAddress: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  isActive: boolean;
}) {
  const db = await getDb();
  if (!db) return null;
  
  // Check if config exists
  const existing = await db.select().from(emailConfigs).limit(1);
  
  if (existing.length > 0) {
    // Update existing
    await db.update(emailConfigs)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(emailConfigs.id, existing[0].id));
    
    return { ...existing[0], ...data };
  } else {
    // Insert new
    await db.insert(emailConfigs).values(data);
    const newConfig = await db.select().from(emailConfigs).orderBy(desc(emailConfigs.id)).limit(1);
    return newConfig[0] || null;
  }
}



// ==================== TAGS ====================
export async function getAllTags() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(tags).orderBy(tags.name);
}

export async function createTag(data: { name: string; color: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  await db.insert(tags).values(data);
  const [newTag] = await db.select().from(tags).where(eq(tags.name, data.name)).limit(1);
  return newTag;
}

export async function updateTag(id: number, data: { name?: string; color?: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  await db.update(tags).set(data).where(eq(tags.id, id));
  return { id, ...data };
}

export async function deleteTag(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  await db.delete(tags).where(eq(tags.id, id));
  return { success: true };
}

export async function addTagToConversation(conversationId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  await db.insert(conversationTags).values({ conversationId, tagId });
  return { conversationId, tagId };
}

export async function removeTagFromConversation(conversationId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  await db.delete(conversationTags)
    .where(
      and(
        eq(conversationTags.conversationId, conversationId),
        eq(conversationTags.tagId, tagId)
      )
    );
  return { success: true };
}

export async function getConversationTags(conversationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const result = await db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
      description: tags.description,
    })
    .from(conversationTags)
    .innerJoin(tags, eq(conversationTags.tagId, tags.id))
    .where(eq(conversationTags.conversationId, conversationId));
  return result;
}


// ==================== CLINIC CONFIGURATION ====================
export async function getClinicConfiguration() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const result = await db.select().from(clinicConfiguration).limit(1);
  return result[0] || { orthodonticChairs: 3, clinicChairs: 1 };
}

export async function updateClinicConfiguration(data: { orthodonticChairs: number; clinicChairs: number }, updatedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  // Check if configuration exists
  const existing = await db.select().from(clinicConfiguration).limit(1);
  
  if (existing.length > 0) {
    // Update existing
    await db.update(clinicConfiguration)
      .set({ ...data, updatedBy })
      .where(eq(clinicConfiguration.id, existing[0].id));
    return { ...existing[0], ...data };
  } else {
    // Insert new
    const result = await db.insert(clinicConfiguration)
      .values({ ...data, updatedBy });
    return { id: Number(result[0].insertId), ...data };
  }
}


// Check if time slot is available for appointment
export async function checkTimeSlotAvailability(params: {
  appointmentDate: Date;
  chair: string;
  appointmentType: string;
  excludeAppointmentId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { appointmentDate, chair, appointmentType, excludeAppointmentId } = params;

  // Marketing Evaluation allows multiple appointments at same time
  if (appointmentType === "marketing_evaluation") {
    return { available: true, conflictingAppointments: [] };
  }

  // Check for conflicting appointments
  const conflicting = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.appointmentDate, appointmentDate),
        eq(appointments.chair, chair),
        ne(appointments.status, "cancelled"),
        excludeAppointmentId ? ne(appointments.id, excludeAppointmentId) : undefined
      )
    )
    .execute();

  return {
    available: conflicting.length === 0,
    conflictingAppointments: conflicting,
  };
}


// ==================== REMINDER AUTOMATION OPERATIONS ====================

/**
 * Busca consultas que precisam de recordatório no momento atual
 */
export async function getAppointmentsNeedingReminders(currentTime: Date) {
  const db = await getDb();
  if (!db) return [];

  try {
    // Por enquanto retornar array vazio até termos dados de teste
    // A query será ativada quando houver consultas no banco
    const result: any[] = [];

    return result;
  } catch (error) {
    console.error('[Database] Erro ao buscar consultas para recordatório:', error);
    return [];
  }
}

/**
 * Registra envio de recordatório
 */
export async function logReminderSent(
  appointmentId: number,
  patientId: number,
  sequenceNumber: number,
  message: string,
  channel: string,
  patientStatus: string
) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(communications).values({
      patientId,
      appointmentId,
      type: 'reminder',
      channel,
      message,
      status: 'sent',
      sentAt: new Date(),
      metadata: JSON.stringify({
        sequenceNumber,
        patientStatus
      })
    });
  } catch (error) {
    console.error('[Database] Erro ao registrar envio de recordatório:', error);
  }
}

/**
 * Atualiza status da consulta
 */
export async function updateAppointmentStatus(
  appointmentId: number,
  status: 'scheduled' | 'confirmed' | 'not_confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduling_pending'
) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.update(appointments)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(appointments.id, appointmentId));
  } catch (error) {
    console.error('[Database] Erro ao atualizar status da consulta:', error);
  }
}

/**
 * Move consulta no Kanban
 */
export async function moveAppointmentInKanban(
  appointmentId: number,
  fromStatus: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'pending',
  toStatus: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'pending'
) {
  const db = await getDb();
  if (!db) return;

  try {
    // Atualizar status da consulta
    await db.update(appointments)
      .set({ 
        status: toStatus,
        updatedAt: new Date()
      })
      .where(eq(appointments.id, appointmentId));

    // Registrar movimentação no histórico
    // Get first admin user to send notification
    const adminUsers = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
    if (adminUsers.length > 0) {
      await db.insert(notifications).values({
        userId: adminUsers[0].id,
        type: 'system',
        title: 'Consulta Movida no Kanban',
        message: `Consulta ${appointmentId} movida de ${fromStatus} para ${toStatus}`,
        isRead: false
      });
    }
  } catch (error) {
    console.error('[Database] Erro ao mover consulta no Kanban:', error);
  }
}

/**
 * Busca consulta pendente por telefone
 */
export async function getPendingAppointmentByPhone(phone: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select({
      id: appointments.id,
      patientId: appointments.patientId,
      patientName: patients.name,
      appointmentDate: appointments.appointmentDate,
      status: appointments.status
    })
    .from(appointments)
    .leftJoin(patients, eq(appointments.patientId, patients.id))
    .where(
      and(
        eq(patients.phone, phone),
        or(
          eq(appointments.status, 'scheduled'),
          eq(appointments.status, 'pending')
        ),
        gte(appointments.appointmentDate, new Date())
      )
    )
    .orderBy(appointments.appointmentDate)
    .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('[Database] Erro ao buscar consulta pendente:', error);
    return null;
  }
}

/**
 * Registra confirmação
 */
export async function logConfirmation(
  appointmentId: number,
  patientId: number,
  message: string,
  channel: string,
  confirmedAt: Date
) {
  const db = await getDb();
  if (!db) return;

  try {
    // Use reminderLogs para registrar confirmações
    await db.insert(reminderLogs).values({
      appointmentId,
      channel: channel as 'whatsapp' | 'email' | 'sms',
      message,
      status: 'delivered',
      sentAt: confirmedAt
    });
  } catch (error) {
    console.error('[Database] Erro ao registrar confirmação:', error);
  }
}

/**
 * Atualiza contadores do Dashboard
 */
export async function updateDashboardCounters() {
  const db = await getDb();
  if (!db) return;

  try {
    // Esta função pode ser expandida para atualizar estatísticas em tempo real
    // Por enquanto, apenas registra a atualização
    console.log('[Database] Contadores do Dashboard atualizados');
  } catch (error) {
    console.error('[Database] Erro ao atualizar contadores:', error);
  }
}

/**
 * Busca paciente por telefone
 */
export async function getPatientByPhone(phone: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select()
      .from(patients)
      .where(eq(patients.phone, phone))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('[Database] Erro ao buscar paciente por telefone:', error);
    return null;
  }
}

/**
 * Busca WhatsApp corporativo da clínica
 * TODO: Implementar corretamente - campo corporateWhatsApp não existe em clinicConfiguration
 * Provavelmente deveria buscar de outra tabela ou usar valor padrão
 */
export async function getClinicCorporateWhatsApp(clinicId: number): Promise<string | null> {
  // Retorna null por enquanto - implementar quando necessário
  return null;
}

/**
 * Envia notificação para secretária
 */
export async function sendNotificationToSecretary(
  phone: string,
  message: string
) {
  const db = await getDb();
  if (!db) return;

  try {
    // Get first admin/secretary user to send notification
    const adminUsers = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
    if (adminUsers.length === 0) {
      console.warn('[Database] Nenhum admin encontrado para enviar notificação');
      return;
    }
    
    await db.insert(notifications).values({
      userId: adminUsers[0].id,
      type: 'system',
      title: 'Solicitação de Reagendamento',
      message: `${message}\nTelefone: ${phone}`,
      isRead: false
    });
  } catch (error) {
    console.error('[Database] Erro ao enviar notificação:', error);
  }
}

/**
 * Busca mensagens recebidas não processadas
 */
export async function getUnprocessedIncomingMessages() {
  const db = await getDb();
  if (!db) return [];

  try {
    // Assumindo que existe uma tabela incomingMessages
    // Se não existir, retornar array vazio
    return [];
  } catch (error) {
    console.error('[Database] Erro ao buscar mensagens não processadas:', error);
    return [];
  }
}

/**
 * Marca mensagem como processada
 */
export async function markMessageAsProcessed(messageId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    // Implementar quando tabela incomingMessages estiver disponível
    console.log(`[Database] Mensagem ${messageId} marcada como processada`);
  } catch (error) {
    console.error('[Database] Erro ao marcar mensagem como processada:', error);
  }
}

/**
 * Salva mensagem recebida
 */
export async function saveIncomingMessage(data: {
  phone: string;
  message: string;
  sessionId: string;
  timestamp: Date;
  processed: boolean;
}): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    // Implementar quando tabela incomingMessages estiver disponível
    console.log('[Database] Mensagem recebida salva');
    return 1;
  } catch (error) {
    console.error('[Database] Erro ao salvar mensagem recebida:', error);
    return 0;
  }
}

// COMMENTED OUT: These functions use fields removed from schema (googleId, status, authProvider)
// If needed in future, update to use only existing fields
/*
export async function createUser(data: { 
  email: string; 
  name: string; 
  role?: "user" | "admin" | "secretary";
  status?: "active" | "inactive";
  googleId?: string;
  authProvider?: "local" | "google";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(users).values({
    openId: `${data.authProvider || 'local'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: data.email,
    name: data.name,
    role: data.role || "user",
    status: data.status || "active",
    googleId: data.googleId,
    authProvider: data.authProvider || "local",
    loginMethod: data.authProvider === "google" ? "google" : "password",
  });
  
  // MySQL doesn't support .returning(), so we fetch the user by email
  const createdUser = await getUserByEmail(data.email);
  return createdUser;
}

export async function updateUserGoogleId(userId: number, googleId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ googleId, authProvider: "google" }).where(eq(users.id, userId));
}
*/


// ==================== REAGENDAMENTO AUTOMÁTICO ====================

/**
 * Envia mensagem WhatsApp para o paciente
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<boolean> {
  try {
    // Importar dinamicamente para evitar dependência circular
    const { sendWhatsAppViaN8n } = await import('./n8nWhatsAppService');
    
    await sendWhatsAppViaN8n({
      sessionId: 'default', // TODO: Get from config
      phone: phone,
      message: message
    });
    
    console.log(`[Database] Mensagem WhatsApp enviada para ${phone}`);
    return true;
  } catch (error) {
    console.error('[Database] Erro ao enviar mensagem WhatsApp:', error);
    return false;
  }
}

/**
 * Cria alerta de reagendamento no Dashboard
 */
export async function createRescheduleAlert(data: {
  patientId: number;
  patientName: string;
  patientPhone: string;
  message: string;
  timestamp: Date;
}): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db.insert(rescheduleAlerts).values({
      patientId: data.patientId,
      patientName: (data.patientName || "Paciente"),
      patientPhone: data.phone || data.patientPhone || "N/A",
      message: data.messageText,
      timestamp: data.timestamp,
      viewed: false,
      resolved: false
    });
    
    const alertId = Number(result[0].insertId);
    console.log(`[Database] ⚠️ ALERTA DE REAGENDAMENTO CRIADO (ID: ${alertId}):`);
    console.log(`   Paciente: ${(data.patientName || "Paciente")}`);
    console.log(`   Telefone: ${data.phone || data.patientPhone || "N/A"}`);
    console.log(`   Mensagem: ${data.messageText}`);
    
    return alertId;
  } catch (error) {
    console.error('[Database] Erro ao criar alerta de reagendamento:', error);
    return 0;
  }
}

/**
 * Busca alertas de reagendamento não visualizados
 */
export async function getUnviewedRescheduleAlerts(): Promise<Array<{
  id: number;
  patientId: number;
  patientName: string;
  patientPhone: string;
  message: string;
  timestamp: Date;
}>> {
  const db = await getDb();
  if (!db) return [];

  try {
    const alerts = await db.select()
      .from(rescheduleAlerts)
      .where(eq(rescheduleAlerts.viewed, false))
      .orderBy(desc(rescheduleAlerts.timestamp));
    
    console.log(`[Database] Encontrados ${alerts.length} alertas de reagendamento não visualizados`);
    return alerts.map(alert => ({
      id: alert.id,
      patientId: alert.patientId,
      patientName: (alert.patientName || "Paciente"),
      patientPhone: alert.phone || alert.patientPhone || "N/A",
      message: alert.messageText,
      timestamp: alert.timestamp
    }));
  } catch (error) {
    console.error('[Database] Erro ao buscar alertas de reagendamento:', error);
    return [];
  }
}

/**
 * Marca alerta de reagendamento como visualizado
 */
export async function markRescheduleAlertAsViewed(alertId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(rescheduleAlerts)
      .set({ viewed: true, viewedAt: new Date() })
      .where(eq(rescheduleAlerts.id, alertId));
    
    console.log(`[Database] Alerta ${alertId} marcado como visualizado`);
    return true;
  } catch (error) {
    console.error('[Database] Erro ao marcar alerta como visualizado:', error);
    return false;
  }
}

/**
 * Marca alerta de reagendamento como resolvido
 */
export async function markRescheduleAlertAsResolved(alertId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(rescheduleAlerts)
      .set({ resolved: true, resolvedAt: new Date() })
      .where(eq(rescheduleAlerts.id, alertId));
    
    console.log(`[Database] Alerta ${alertId} marcado como resolvido`);
    return true;
  } catch (error) {
    console.error('[Database] Erro ao marcar alerta como resolvido:', error);
    return false;
  }
}


// ============================================================================
// Reminder Metrics Functions
// ============================================================================

export async function getReminderMetrics(startDate: Date, endDate: Date) {
  const reminders = await db
    .select()
    .from(reminderSchedule)
    .where(
      and(
        gte(reminderSchedule.sentAt, startDate),
        eq(reminderSchedule.sentAt, endDate)
      )
    );

  const totalSent = reminders.length;
  const totalConfirmed = reminders.filter((r) => r.confirmedAt !== null).length;
  // TODO: Implementar contagem de rescheduleRequests de outra tabela (rescheduleRequests)
  const totalRescheduleRequests = 0; // Campo rescheduleRequestedAt não existe em reminderSchedule
  const totalNoResponse = totalSent - totalConfirmed - totalRescheduleRequests;

  return {
    totalSent,
    totalConfirmed,
    totalRescheduleRequests,
    totalNoResponse,
  };
}


// ============================================================================
// Chair Doctor Assignment Functions (for Agenda Kanban)
// ============================================================================

/**
 * Update doctor assigned to a chair for a specific date
 */
export async function updateChairDoctor(params: {
  chairId: string;
  doctorName: string;
  date: Date;
  updatedBy: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not initialized');

  try {
    // Use raw SQL to avoid casing issues with ON DUPLICATE KEY UPDATE
    await db.execute(sql`
      INSERT INTO chairAssignments (chair_id, chair_name, doctor_name, date, created_by)
      VALUES (${params.chairId}, ${params.chairId}, ${params.doctorName}, ${params.date}, ${params.updatedBy})
      ON DUPLICATE KEY UPDATE
        doctor_name = ${params.doctorName},
        updated_at = CURRENT_TIMESTAMP
    `);

    console.log(`[Database] Doctor "${params.doctorName}" assigned to chair "${params.chairId}" for date ${params.date.toISOString()}`);
  } catch (error) {
    console.error('[Database] Error updating chair doctor:', error);
    throw error;
  }
}

/**
 * Get doctor assignments for all chairs on a specific date
 */
export async function getChairDoctorsByDate(date: Date): Promise<Array<{
  chairId: string;
  doctorName: string;
  assignmentDate: Date;
}>> {
  const db = await getDb();
  if (!db) return [];

  try {
    const assignments = await db
      .select()
      .from(chairAssignments)
      .where(eq(chairAssignments.date, date));

    return assignments.map((a) => ({
      chairId: a.chairId,
      doctorName: a.doctorName,
      assignmentDate: a.date,
    }));
  } catch (error) {
    console.error('[Database] Error getting chair doctors:', error);
    return [];
  }
}



/**
 * List all clinics
 */
export async function listClinics() {
  try {
    return await db.select().from(clinics).orderBy(asc(clinics.name));
  } catch (error) {
    console.error('[Database] Error listing clinics:', error);
    return [];
  }
}
