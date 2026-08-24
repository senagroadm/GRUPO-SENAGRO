import { ModuloSistema, AcaoPermissao, PermissaoRule } from './permissions';

export interface RequestTenantContext {
  userId: string;
  userEmail: string;
  isSuperAdmin: boolean;
  empresaAtivaId: string;
  empresasAutorizadasIds: string[];
  permissoes: PermissaoRule[];
  correlationId: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export function hasPermission(
  ctx: RequestTenantContext,
  modulo: ModuloSistema,
  acao: AcaoPermissao
): boolean {
  if (ctx.isSuperAdmin) return true;

  return ctx.permissoes.some((p) => {
    const matchEmpresa = !p.empresaId || p.empresaId === ctx.empresaAtivaId;
    const matchModulo = p.modulo === modulo;
    const matchAcao = p.acao === acao || p.acao === 'ADMIN';
    return matchEmpresa && matchModulo && matchAcao && p.permitido;
  });
}
