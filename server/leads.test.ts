import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
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

describe("leads procedures", () => {
  it("should create a lead successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const leadData = {
      name: "Juan Pérez",
      phone: "+595981234567",
      email: "juan@example.com",
      treatment: "Ortodoncia",
      estimatedValue: "5000",
      source: "Facebook",
      status: "novo" as const,
    };

    const result = await caller.leads.create(leadData);
    expect(result.success).toBe(true);
  });

  it("should list all leads", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const leads = await caller.leads.list();
    expect(Array.isArray(leads)).toBe(true);
  });

  it("should fail to create lead without name", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const leadData = {
      name: "",
      phone: "+595981234567",
      email: "test@example.com",
      treatment: "Ortodoncia",
      estimatedValue: "5000",
      source: "Facebook",
      status: "novo" as const,
    };

    await expect(caller.leads.create(leadData)).rejects.toThrow();
  });

  it("should update lead status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a lead
    await caller.leads.create({
      name: "Test Lead",
      phone: "+595981234567",
      email: "test@example.com",
      treatment: "Ortodoncia",
      estimatedValue: "5000",
      source: "Facebook",
      status: "novo",
    });

    // Get all leads to find the created one
    const leads = await caller.leads.list();
    const createdLead = leads.find((l) => l.name === "Test Lead");

    if (createdLead) {
      // Update the status
      const result = await caller.leads.update({
        id: createdLead.id,
        status: "ganho",
      });

      expect(result.success).toBe(true);

      // Verify the update
      const updatedLead = await caller.leads.getById({ id: createdLead.id });
      expect(updatedLead?.status).toBe("ganho");
    }
  });
});

describe("analytics procedures", () => {
  it("should return metrics", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const metrics = await caller.analytics.metrics({});
    
    expect(metrics).toHaveProperty("totalLeads");
    expect(metrics).toHaveProperty("wonLeads");
    expect(metrics).toHaveProperty("totalRevenue");
    expect(metrics).toHaveProperty("conversionRate");
    
    expect(typeof metrics.totalLeads).toBe("number");
    expect(typeof metrics.wonLeads).toBe("number");
    expect(typeof metrics.totalRevenue).toBe("number");
    expect(typeof metrics.conversionRate).toBe("number");
  });

  it("should return leads by source", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const bySource = await caller.analytics.bySource();
    
    expect(Array.isArray(bySource)).toBe(true);
    if (bySource.length > 0) {
      expect(bySource[0]).toHaveProperty("source");
      expect(bySource[0]).toHaveProperty("count");
    }
  });
});
