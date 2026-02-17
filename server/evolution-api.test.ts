/**
 * Evolution API Integration Test
 * Validates Evolution API credentials
 */

import { describe, it, expect } from 'vitest';

describe('Evolution API Integration', () => {
  it('should have valid Evolution API credentials configured', async () => {
    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
    const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

    expect(EVOLUTION_API_URL).toBeDefined();
    expect(EVOLUTION_API_KEY).toBeDefined();
    expect(EVOLUTION_API_URL).toBe('http://95.111.240.243:8080');
  });

  it('should successfully connect to Evolution API', async () => {
    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
    const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

    // Test connection by fetching instances list
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY!
      }
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  }, 10000); // 10s timeout for network request
});
