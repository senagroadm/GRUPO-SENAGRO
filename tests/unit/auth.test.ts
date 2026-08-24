import { describe, it, expect } from 'vitest';
import { resolveTenantContext, enforcePermission } from '../../backend/core/middlewares/auth';
import { UnauthorizedError, TenantMismatchError, ForbiddenError } from '../../backend/core/errors';
import { EMPRESAS_GRUPO } from '../../backend/core/types/company';

describe('Authentication and Tenant Context Unit Tests', () => {
  it('should resolve superadmin context authorizing all 5 companies', () => {
    const context = resolveTenantContext({
      token: 'Bearer superadmin-token',
      empresaIdHeader: EMPRESAS_GRUPO[0].id,
    });

    expect(context.isSuperAdmin).toBe(true);
    expect(context.empresasAutorizadasIds.length).toBe(5);
    expect(context.empresaAtivaId).toBe(EMPRESAS_GRUPO[0].id);
  });

  it('should reject invalid Bearer token format', () => {
    expect(() =>
      resolveTenantContext({
        token: 'invalid-token',
      })
    ).toThrow(UnauthorizedError);
  });

  it('should prevent cross-tenant access when company is unauthorized', () => {
    expect(() =>
      resolveTenantContext({
        token: 'Bearer tritech-only-user',
        empresaIdHeader: '11111111-1111-1111-1111-111111111111', // MWAM id
      })
    ).toThrow(TenantMismatchError);
  });

  it('should enforce 3D RBAC permissions properly', () => {
    const userContext = {
      userId: 'usr-1',
      userEmail: 'user@test.com',
      isSuperAdmin: false,
      empresaAtivaId: '44444444-4444-4444-4444-444444444444',
      empresasAutorizadasIds: ['44444444-4444-4444-4444-444444444444'],
      permissoes: [
        {
          empresaId: '44444444-4444-4444-4444-444444444444',
          modulo: 'CORTE' as const,
          acao: 'READ' as const,
          permitido: true,
        },
      ],
      correlationId: 'c1',
      requestId: 'r1',
    };

    expect(() => enforcePermission(userContext, 'CORTE', 'READ')).not.toThrow();
    expect(() => enforcePermission(userContext, 'CORTE', 'ADMIN')).toThrow(ForbiddenError);
    expect(() => enforcePermission(userContext, 'FISCAL', 'READ')).toThrow(ForbiddenError);
  });
});
