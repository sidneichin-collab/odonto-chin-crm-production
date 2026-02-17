import { describe, expect, it } from "vitest";

describe("Evolution API Connection", () => {
  it("should have Evolution API credentials configured", () => {
    expect(process.env.EVOLUTION_API_URL).toBeDefined();
    expect(process.env.EVOLUTION_API_KEY).toBeDefined();

    // Validate URL format
    expect(process.env.EVOLUTION_API_URL).toMatch(/^https?:\/\//);
    expect(process.env.EVOLUTION_API_URL).toBe('http://95.111.240.243:8080');
  });

  it("should validate API connection to Evolution server", async () => {
    const apiUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;

    expect(apiUrl).toBeDefined();
    expect(apiKey).toBeDefined();

    // Test connection by fetching instances
    const response = await fetch(`${apiUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': apiKey!,
      },
    });

    // Should return 200 or 404 (no instances), but not 401/403 (auth error)
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
    expect([200, 404]).toContain(response.status);
  }, 10000);
});
