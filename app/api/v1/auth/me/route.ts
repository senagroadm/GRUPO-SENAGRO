import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantContext } from '@/backend/core/middlewares/auth';
import { EMPRESAS_GRUPO } from '@/backend/core/types/company';
import { logger } from '@/backend/core/logger';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { mfaService } from '@/backend/core/security/mfa';

export const GET = createSecureHandler(
  async (req: NextRequest, secContext) => {
    const token = req.headers.get('authorization') || undefined;
    const empresaIdHeader = req.headers.get('x-empresa-id') || undefined;

    const tenantContext = resolveTenantContext({
      token,
      empresaIdHeader,
      correlationId: secContext.correlationId,
      requestId: secContext.requestId,
    });

    const empresaAtiva = EMPRESAS_GRUPO.find((e) => e.id === tenantContext.empresaAtivaId) || EMPRESAS_GRUPO[0];
    const empresasAutorizadas = EMPRESAS_GRUPO.filter((e) => tenantContext.empresasAutorizadasIds.includes(e.id));

    // Determinar se o perfil exige MFA
    const roleName = tenantContext.isSuperAdmin ? 'SUPERADMIN' : 'USUARIO';
    const mfaRequired = mfaService.isMfaRequiredForRole(roleName);

    logger.info('User tenant session resolved securely', {
      userId: tenantContext.userId,
      empresaAtivaId: tenantContext.empresaAtivaId,
      requestId: secContext.requestId,
      mfaRequired,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: tenantContext.userId,
            email: tenantContext.userEmail,
            isSuperAdmin: tenantContext.isSuperAdmin,
          },
          tenant: {
            empresaAtiva,
            empresasAutorizadas,
          },
          security: {
            mfaRequired,
            mfaStatus: {
              enabled: false,
              required: mfaRequired,
              activeMethod: 'totp',
            },
          },
          permissions: tenantContext.permissoes,
        },
        requestId: secContext.requestId,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
      }
    );
  },
  { endpointType: 'auth' }
);
