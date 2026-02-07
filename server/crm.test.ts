import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(tenantId: number = 1, role: "super-admin" | "admin" | "user" = "admin"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@odontochin.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user: { ...user, tenantId },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("CRM Multi-Tenant System", () => {
  describe("Dashboard Stats", () => {
    it("should return dashboard statistics for authenticated user", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const stats = await caller.dashboard.stats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("totalPatients");
      expect(stats).toHaveProperty("todayAppointments");
      expect(stats).toHaveProperty("waitingList");
      expect(stats).toHaveProperty("atRiskPatients");
      expect(typeof stats.totalPatients).toBe("number");
      expect(typeof stats.todayAppointments).toBe("number");
      expect(typeof stats.waitingList).toBe("number");
      expect(typeof stats.atRiskPatients).toBe("number");
    });
  });

  describe("Patient Management", () => {
    it("should list patients for tenant", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const patients = await caller.patients.list();

      expect(Array.isArray(patients)).toBe(true);
    });

    it("should create a new patient", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const newPatient = {
        firstName: "Juan",
        lastName: "Pérez",
        phone: "+595981234567",
        gender: "M" as const,
      };

      const result = await caller.patients.create(newPatient);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.firstName).toBe("Juan");
      expect(result.lastName).toBe("Pérez");
    });
  });

  describe("Appointments Kanban", () => {
    it("should list appointments by type", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const appointments = await caller.appointments.list({ type: "Ortodontia" });

      expect(Array.isArray(appointments)).toBe(true);
    });
  });

  describe("Waiting List", () => {
    it("should list waiting list entries", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const waitingList = await caller.waitingList.list();

      expect(Array.isArray(waitingList)).toBe(true);
    });
  });

  describe("WhatsApp Integration", () => {
    it("should list WhatsApp messages", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const messages = await caller.whatsapp.messages();

      expect(Array.isArray(messages)).toBe(true);
    });
  });

  describe("Tenant Isolation", () => {
    it("should only return data for the user's tenant", async () => {
      const ctx1 = createTestContext(1);
      const ctx2 = createTestContext(2);

      const caller1 = appRouter.createCaller(ctx1);
      const caller2 = appRouter.createCaller(ctx2);

      const patients1 = await caller1.patients.list();
      const patients2 = await caller2.patients.list();

      // Both should return arrays (even if empty)
      expect(Array.isArray(patients1)).toBe(true);
      expect(Array.isArray(patients2)).toBe(true);

      // If there's data, verify tenant isolation
      if (patients1.length > 0) {
        expect(patients1.every((p) => p.tenantId === 1)).toBe(true);
      }
      if (patients2.length > 0) {
        expect(patients2.every((p) => p.tenantId === 2)).toBe(true);
      }
    });
  });
});
