import { describe, it, expect } from 'vitest';
import { GET as healthHandler } from '../../app/api/v1/health/route';
import { NextRequest } from 'next/server';

describe('GET /api/v1/health Integration Test', () => {
  it('should return 200 with standard health check payload and headers', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/health', {
      headers: {
        'x-request-id': 'test-health-req-001',
      },
    });

    const response = await healthHandler(req);
    expect(response.status).toBe(200);

    expect(response.headers.get('x-request-id')).toBe('test-health-req-001');

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.apiVersion).toBe('v1');
    expect(body.status).toBeDefined();
    expect(body.system).toBeDefined();
    expect(body.checks).toBeDefined();
    expect(body.checks.database).toBeDefined();
    expect(body.timestamp).toBeDefined();
  });
});
