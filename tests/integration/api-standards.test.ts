import { describe, it, expect } from 'vitest';
import { GET as companiesHandler } from '../../app/api/v1/companies/route';
import { GET as authHandler } from '../../app/api/v1/auth/me/route';
import { NextRequest } from 'next/server';

describe('API Standards & Tenant Integration Tests', () => {
  it('should return paginated companies with standard envelope and headers', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/companies?page=1&limit=2', {
      headers: {
        'x-request-id': 'req-test-pag-1',
        'x-correlation-id': 'corr-test-pag-1',
      },
    });

    const res = await companiesHandler(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-request-id')).toBe('req-test-pag-1');
    expect(res.headers.get('x-correlation-id')).toBe('corr-test-pag-1');

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBe(2);
    expect(json.pagination).toEqual({
      page: 1,
      limit: 2,
      totalItems: 5,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: false,
    });
  });

  it('should resolve session info and tenant via /api/v1/auth/me', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/auth/me', {
      headers: {
        'x-request-id': 'req-test-auth-1',
      },
    });

    const res = await authHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.user).toBeDefined();
    expect(json.data.tenant).toBeDefined();
    expect(json.data.tenant.empresaAtiva).toBeDefined();
  });
});
