import { describe, it, expect } from 'vitest';
import { RequestTenantContext, hasPermission } from '../../backend/core/types/context';

describe('Tenant Context & RBAC Isolation Unit Test', () => {
  it('should prevent access when user is not authorized in target company', () => {
    const userContext: RequestTenantContext = {
      userId: 'usr-123',
      userEmail: 'gerente@tritech.com.br',
      isSuperAdmin: false,
      empresaAtivaId: '44444444-4444-4444-4444-444444444444', // Tritech Corte
      empresasAutorizadasIds: ['44444444-4444-4444-4444-444444444444'],
      permissoes: [
        {
          empresaId: '44444444-4444-4444-4444-444444444444',
          modulo: 'CORTE',
          acao: 'ADMIN',
          permitido: true,
        },
      ],
      correlationId: 'req-001',
    };

    // Tem acesso ao módulo CORTE na Tritech Corte
    expect(hasPermission(userContext, 'CORTE', 'CREATE')).toBe(true);

    // NÃO tem acesso ao módulo FINANCEIRO na Tritech Corte
    expect(hasPermission(userContext, 'FINANCEIRO', 'READ')).toBe(false);

    // NÃO tem permissão se o contexto mudar para Senagro (Empresa 3)
    const contextOutraEmpresa = {
      ...userContext,
      empresaAtivaId: '33333333-3333-3333-3333-333333333333',
    };
    expect(hasPermission(contextOutraEmpresa, 'CORTE', 'CREATE')).toBe(false);
  });
});
