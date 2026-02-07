import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  tenants, Tenant, InsertTenant,
  patients, Patient, InsertPatient,
  appointments, Appointment, InsertAppointment,
  waitingList, WaitingList, InsertWaitingList,
  whatsappMessages, WhatsappMessage, InsertWhatsappMessage,
  automationLogs, AutomationLog, InsertAutomationLog,
  auditLogs, AuditLog, InsertAuditLog
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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

// ============================================================================
// USER MANAGEMENT
// ============================================================================

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
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'super-admin';
      updateSet.role = 'super-admin';
    }

    if (user.tenantId !== undefined) {
      values.tenantId = user.tenantId;
      updateSet.tenantId = user.tenantId;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// TENANT (CLINIC) MANAGEMENT
// ============================================================================

export async function createTenant(tenant: InsertTenant): Promise<Tenant> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tenants).values(tenant);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(tenants).where(eq(tenants.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getTenantById(id: number): Promise<Tenant | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  return result[0];
}

export async function getAllTenants(): Promise<Tenant[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(tenants).orderBy(desc(tenants.createdAt));
}

export async function updateTenant(id: number, updates: Partial<InsertTenant>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(tenants).set(updates).where(eq(tenants.id, id));
}

// ============================================================================
// PATIENT MANAGEMENT (Tenant-isolated)
// ============================================================================

export async function createPatient(patient: InsertPatient): Promise<Patient> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(patients).values(patient);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(patients).where(eq(patients.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getPatientsByTenant(tenantId: number): Promise<Patient[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(patients)
    .where(eq(patients.tenantId, tenantId))
    .orderBy(desc(patients.createdAt));
}

export async function getPatientById(id: number, tenantId: number): Promise<Patient | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(patients)
    .where(and(eq(patients.id, id), eq(patients.tenantId, tenantId)))
    .limit(1);
  return result[0];
}

export async function updatePatient(id: number, tenantId: number, updates: Partial<InsertPatient>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(patients)
    .set(updates)
    .where(and(eq(patients.id, id), eq(patients.tenantId, tenantId)));
}

export async function getAtRiskPatients(tenantId: number): Promise<Patient[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(patients)
    .where(and(eq(patients.tenantId, tenantId), eq(patients.isAtRisk, true)))
    .orderBy(desc(patients.lastContactDate));
}

// ============================================================================
// APPOINTMENT MANAGEMENT (Tenant-isolated)
// ============================================================================

export async function createAppointment(appointment: InsertAppointment): Promise<Appointment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(appointments).values(appointment);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(appointments).where(eq(appointments.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getAppointmentsByTenant(tenantId: number, type?: "Ortodontia" | "Clinico General"): Promise<Appointment[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(appointments.tenantId, tenantId)];
  if (type) {
    conditions.push(eq(appointments.type, type));
  }

  return await db.select().from(appointments)
    .where(and(...conditions))
    .orderBy(desc(appointments.appointmentDate));
}

export async function getTodayAppointments(tenantId: number): Promise<Appointment[]> {
  const db = await getDb();
  if (!db) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await db.select().from(appointments)
    .where(
      and(
        eq(appointments.tenantId, tenantId),
        sql`${appointments.appointmentDate} >= ${today}`,
        sql`${appointments.appointmentDate} < ${tomorrow}`
      )
    )
    .orderBy(appointments.appointmentDate);
}

export async function updateAppointment(id: number, tenantId: number, updates: Partial<InsertAppointment>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(appointments)
    .set(updates)
    .where(and(eq(appointments.id, id), eq(appointments.tenantId, tenantId)));
}

// ============================================================================
// WAITING LIST MANAGEMENT (Tenant-isolated)
// ============================================================================

export async function addToWaitingList(entry: InsertWaitingList): Promise<WaitingList> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(waitingList).values(entry);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(waitingList).where(eq(waitingList.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getWaitingListByTenant(tenantId: number): Promise<WaitingList[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(waitingList)
    .where(and(eq(waitingList.tenantId, tenantId), eq(waitingList.status, "En Espera")))
    .orderBy(desc(waitingList.createdAt));
}

export async function updateWaitingListEntry(id: number, tenantId: number, updates: Partial<InsertWaitingList>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(waitingList)
    .set(updates)
    .where(and(eq(waitingList.id, id), eq(waitingList.tenantId, tenantId)));
}

// ============================================================================
// WHATSAPP MESSAGE LOGGING
// ============================================================================

export async function logWhatsappMessage(message: InsertWhatsappMessage): Promise<WhatsappMessage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(whatsappMessages).values(message);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(whatsappMessages).where(eq(whatsappMessages.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getWhatsappMessagesByTenant(tenantId: number): Promise<WhatsappMessage[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(whatsappMessages)
    .where(eq(whatsappMessages.tenantId, tenantId))
    .orderBy(desc(whatsappMessages.createdAt))
    .limit(100);
}

// ============================================================================
// DASHBOARD STATISTICS
// ============================================================================

export async function getDashboardStats(tenantId: number) {
  const db = await getDb();
  if (!db) return null;

  const [totalPatients] = await db.select({ count: sql<number>`count(*)` })
    .from(patients)
    .where(eq(patients.tenantId, tenantId));

  const [todayAppointmentsCount] = await db.select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(
      and(
        eq(appointments.tenantId, tenantId),
        sql`DATE(${appointments.appointmentDate}) = CURDATE()`
      )
    );

  const [waitingListCount] = await db.select({ count: sql<number>`count(*)` })
    .from(waitingList)
    .where(and(eq(waitingList.tenantId, tenantId), eq(waitingList.status, "En Espera")));

  const [atRiskCount] = await db.select({ count: sql<number>`count(*)` })
    .from(patients)
    .where(and(eq(patients.tenantId, tenantId), eq(patients.isAtRisk, true)));

  return {
    totalPatients: Number(totalPatients?.count || 0),
    todayAppointments: Number(todayAppointmentsCount?.count || 0),
    waitingList: Number(waitingListCount?.count || 0),
    atRiskPatients: Number(atRiskCount?.count || 0),
  };
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export async function logAudit(log: InsertAuditLog): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(auditLogs).values(log);
  } catch (error) {
    console.error("[Audit] Failed to log:", error);
  }
}
