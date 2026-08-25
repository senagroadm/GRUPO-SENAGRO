import { EMPRESAS_GRUPO } from '../types/company';
import { RequestTenantContext } from '../types/context';
import { ModuloSistema, AcaoPermissao } from '../types/permissions';
import { UnauthorizedError, TenantMismatchError, ForbiddenError } from '../errors';
import { userService } from '../../modules/multi-tenant/user-service';
import { companyService } from '../../modules/multi-tenant/company-service';

export interface AuthHeaderPayload {
  token?: string;
  empresaIdHeader?: string;
  correlationId?: string;
  requestId?: string;
}

/**
 * Base authentication and multi-tenant resolver.
 * Parses Bearer token or mock credentials, extracts authorized companies,
 * and ensures active company matches an authorized company for the user.
 */
export function resolveTenantContext(payload: AuthHeaderPayload): RequestTenantContext {
  const { token, empresaIdHeader, correlationId = 'corr-unknown', requestId = 'req-unknown' } = payload;

  // In test or development without token, default to simulated admin user if not provided
  if (!token) {
    const allCompanies = companyService.listCompanies({ ativo: true });
    const defaultEmpresa = allCompanies[0]?.id || EMPRESAS_GRUPO[0].id;
    const targetEmpresaId = empresaIdHeader || defaultEmpresa;

    return {
      userId: 'u1111111-1111-1111-1111-111111111111',
      userEmail: 'superadmin@industrialgroup.com.br',
      isSuperAdmin: true,
      empresaAtivaId: targetEmpresaId,
      empresasAutorizadasIds: allCompanies.map((e) => e.id),
      permissoes: [],
      correlationId,
      requestId,
    };
  }

  // Basic Bearer token inspection (e.g. bearer mock-user:role:companies)
  if (token.startsWith('Bearer ')) {
    const rawToken = token.replace('Bearer ', '').trim();

    if (rawToken === 'invalid-token') {
      throw new UnauthorizedError('Token de autenticação inválido ou expirado');
    }

    // Try finding registered user by ID or email
    let registeredUser = null;
    try {
      registeredUser = userService.getUserById(rawToken);
    } catch {
      registeredUser = userService.getUserByEmail(rawToken);
    }

    if (registeredUser) {
      if (!registeredUser.ativo) {
        throw new UnauthorizedError(`Usuário '${registeredUser.nome}' está inativo.`);
      }

      const allCompanies = companyService.listCompanies({ ativo: true });
      const authorizedCompanies = registeredUser.isSuperAdmin
        ? allCompanies.map((c) => c.id)
        : registeredUser.empresasVinculadas.filter((b) => b.ativo).map((b) => b.empresaId);

      const activeEmpresaId = empresaIdHeader || authorizedCompanies[0] || allCompanies[0].id;

      if (!registeredUser.isSuperAdmin && !authorizedCompanies.includes(activeEmpresaId)) {
        throw new TenantMismatchError(
          `Usuário '${registeredUser.nome}' não possui permissão para acessar a empresa: ${activeEmpresaId}`
        );
      }

      return {
        userId: registeredUser.id,
        userEmail: registeredUser.email,
        isSuperAdmin: registeredUser.isSuperAdmin,
        empresaAtivaId: activeEmpresaId,
        empresasAutorizadasIds: authorizedCompanies,
        permissoes: [],
        correlationId,
        requestId,
      };
    }

    // Legacy mock token support for tests
    const isSuperAdmin = rawToken.includes('superadmin') || rawToken === 'admin-token';
    const authorizedCompanies = isSuperAdmin
      ? EMPRESAS_GRUPO.map((e) => e.id)
      : rawToken.includes('tritech-only')
      ? ['44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555']
      : [EMPRESAS_GRUPO[0].id];

    const activeEmpresaId = empresaIdHeader || authorizedCompanies[0];

    // Validate that user is allowed to operate in this company
    if (!isSuperAdmin && !authorizedCompanies.includes(activeEmpresaId)) {
      throw new TenantMismatchError(
        `Usuário não possui permissão para acessar a empresa selecionada: ${activeEmpresaId}`
      );
    }

    return {
      userId: `usr-${rawToken.substring(0, 8)}`,
      userEmail: `${rawToken}@industrialgroup.com.br`,
      isSuperAdmin,
      empresaAtivaId: activeEmpresaId,
      empresasAutorizadasIds: authorizedCompanies,
      permissoes: [],
      correlationId,
      requestId,
    };
  }

  throw new UnauthorizedError('Formato de autorização inválido. Use Bearer <token>');
}

export function enforcePermission(
  context: RequestTenantContext,
  modulo: ModuloSistema,
  acao: AcaoPermissao
): void {
  if (context.isSuperAdmin) {
    return;
  }

  const hasPerm = context.permissoes.some(
    (p) =>
      p.modulo === modulo &&
      p.acao === acao &&
      p.permitido &&
      (!p.empresaId || p.empresaId === context.empresaAtivaId)
  );

  if (!hasPerm) {
    throw new ForbiddenError(
      `Acesso negado para a ação '${acao}' no módulo '${modulo}' na empresa ${context.empresaAtivaId}`
    );
  }
}

