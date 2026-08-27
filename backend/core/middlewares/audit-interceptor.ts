import { RequestTenantContext } from '../types/context';
import { AuditService } from '../audit/audit-service';
import { TipoAcaoAuditoria, SeveridadeAuditoria } from '../audit/audit-types';
import { companyService } from '../../modules/multi-tenant/company-service';
import { userService } from '../../modules/multi-tenant/user-service';

export interface AuditContextOptions {
  modulo: string;
  acao: TipoAcaoAuditoria;
  entidade: string;
  entidadeId: string;
  severidade?: SeveridadeAuditoria;
  justificativa?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadadosExtras?: Record<string, unknown>;
}

/**
 * Interceptor/Helper central para auditoria de ações críticas no backend.
 * Garante extração de IP, User-Agent, Request-ID, dados de usuário e isolamento do CNPJ/empresa_id.
 */
export function interceptAndAuditAction(
  tenantContext: RequestTenantContext,
  options: AuditContextOptions,
  requestDetails?: { ip?: string; userAgent?: string; requestId?: string }
) {
  const auditService = AuditService.getInstance();

  const user = userService.getUserById(tenantContext.userId);
  const company = companyService.getCompanyById(tenantContext.empresaAtivaId);

  const empresaVinculada = user?.empresasVinculadas?.find(
    (e) => e.empresaId === tenantContext.empresaAtivaId
  );

  const usuarioInfo = {
    id: tenantContext.userId,
    nome: user?.nome || 'Usuário do Sistema',
    email: tenantContext.userEmail || 'usuario@tritech.ind.br',
    perfil:
      empresaVinculada?.perfilNome ||
      empresaVinculada?.perfilId ||
      user?.cargo ||
      (tenantContext.isSuperAdmin ? 'ADMIN_GLOBAL' : 'OPERADOR'),
  };

  const empresaInfo = {
    id: tenantContext.empresaAtivaId,
    codigo: company?.codigo || 'TRITECH',
    nome: company?.razaoSocial || 'Empresa Grupo TRITECH',
    cnpj: company?.cnpj || '11.222.333/0001-44',
  };

  return auditService.registrarLog({
    requestId: requestDetails?.requestId || tenantContext.requestId,
    usuario: usuarioInfo,
    empresa: empresaInfo,
    modulo: options.modulo,
    acao: options.acao,
    entidade: options.entidade,
    entidadeId: options.entidadeId,
    ip: requestDetails?.ip || '192.168.1.100',
    userAgent: requestDetails?.userAgent || 'ERP-Backend-Client/2.0',
    before: options.before,
    after: options.after,
    justificativa: options.justificativa,
    severidade: options.severidade,
    metadadosExtras: options.metadadosExtras,
  });
}
