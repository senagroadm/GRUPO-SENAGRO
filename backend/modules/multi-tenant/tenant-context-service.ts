import {
  EmpresaRecord,
  EmpresaContextAuditRecord,
  SwitchCompanyPayload,
  SwitchCompanyResponse,
  PerfilRecord,
} from './types';
import { companyService } from './company-service';
import { userService } from './user-service';
import { profileService } from './profile-service';
import { TenantMismatchError, UnauthorizedError, ValidationError } from '../../core/errors';
import { randomUUID } from 'crypto';

class TenantContextService {
  private auditLogs: EmpresaContextAuditRecord[] = [];
  // Active session company mapping by user id
  private activeUserSessions: Map<string, string> = new Map();

  constructor() {
    // Initial session defaults
    this.activeUserSessions.set('u1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111');
    this.activeUserSessions.set('u2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111');
    this.activeUserSessions.set('u3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');
    this.activeUserSessions.set('u4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333');
    this.activeUserSessions.set('u5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111');
  }

  public getActiveEmpresaId(userId: string): string {
    const active = this.activeUserSessions.get(userId);
    if (active) return active;

    const user = userService.getUserById(userId);
    const defaultBinding = user.empresasVinculadas.find((b) => b.padrao && b.ativo) || user.empresasVinculadas[0];
    if (defaultBinding) {
      this.activeUserSessions.set(userId, defaultBinding.empresaId);
      return defaultBinding.empresaId;
    }

    if (user.isSuperAdmin) {
      const all = companyService.listCompanies({ ativo: true });
      const firstId = all[0]?.id || '11111111-1111-1111-1111-111111111111';
      this.activeUserSessions.set(userId, firstId);
      return firstId;
    }

    throw new TenantMismatchError(`O usuário '${user.nome}' não possui nenhuma empresa vinculada ativa.`);
  }

  /**
   * Valida autorização de acesso a um tenant específico.
   * Regra 3: O backend valida o empresa_id, nunca confiando no frontend.
   * Regra 4: Usuário sem vínculo com a empresa não pode ler nem alterar dados.
   */
  public enforceTenantAccess(userId: string, targetEmpresaId: string): void {
    const user = userService.getUserById(userId);

    if (!user.ativo) {
      throw new UnauthorizedError(`Usuário '${user.nome}' está inativo no sistema.`);
    }

    // Valida se empresa existe e está ativa
    const targetCompany = companyService.getCompanyById(targetEmpresaId);
    if (!targetCompany.ativo) {
      throw new TenantMismatchError(`A empresa '${targetCompany.nomeFantasia}' está inativa.`);
    }

    // Se for SuperAdmin, tem acesso global
    if (user.isSuperAdmin) {
      return;
    }

    // Valida se o usuário tem vínculo ativo com a empresa
    const hasBinding = user.empresasVinculadas.some(
      (b) => b.empresaId === targetEmpresaId && b.ativo
    );

    if (!hasBinding) {
      throw new TenantMismatchError(
        `Acesso Negado: O usuário '${user.nome}' não possui permissão de acesso à empresa '${targetCompany.nomeFantasia}' (${targetCompany.cnpj}).`
      );
    }
  }

  /**
   * Alterna a empresa ativa do usuário e registra na trilha de auditoria.
   * Regra 5: Usuário com acesso ao grupo pode alternar para uma empresa e operar dentro dela.
   * Regra 6: Auditar troca de contexto de empresa.
   */
  public switchActiveCompany(payload: SwitchCompanyPayload): SwitchCompanyResponse {
    const { userId, targetEmpresaId, motivo, correlationId, ipAddress = '127.0.0.1', userAgent = 'Unknown' } = payload;

    if (!userId || !targetEmpresaId) {
      throw new ValidationError('ID do usuário e ID da empresa destino são obrigatórios para troca de contexto.');
    }

    const user = userService.getUserById(userId);
    const previousEmpresaId = this.activeUserSessions.get(userId);

    // 1. Validação estrita de autorização
    this.enforceTenantAccess(userId, targetEmpresaId);

    const targetCompany = companyService.getCompanyById(targetEmpresaId);
    let previousCompany: EmpresaRecord | null = null;
    if (previousEmpresaId) {
      try {
        previousCompany = companyService.getCompanyById(previousEmpresaId);
      } catch {
        // Ignora
      }
    }

    // 2. Atualiza a sessão ativa
    this.activeUserSessions.set(userId, targetEmpresaId);

    // 3. Regra 6: Registra auditoria da troca de contexto
    const auditRecord: EmpresaContextAuditRecord = {
      id: randomUUID(),
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email,
      empresaOrigemId: previousCompany?.id,
      empresaOrigemNome: previousCompany?.nomeFantasia || 'Nenhum / Inicial',
      empresaDestinoId: targetCompany.id,
      empresaDestinoNome: targetCompany.nomeFantasia,
      motivo: motivo || 'Alternância de contexto operacional pelo usuário',
      ipOrigem: ipAddress,
      userAgent,
      correlationId: correlationId || `corr-ctx-${Date.now()}`,
      criadoEm: new Date().toISOString(),
    };

    this.auditLogs.unshift(auditRecord);

    // 4. Resolve empresas autorizadas para o usuário
    const allCompanies = companyService.listCompanies({ ativo: true });
    const authorizedCompanies = user.isSuperAdmin
      ? allCompanies
      : allCompanies.filter((c) =>
          user.empresasVinculadas.some((b) => b.empresaId === c.id && b.ativo)
        );

    // 5. Resolve perfil ativo para a empresa
    let activeProfile: PerfilRecord | null = null;
    const binding = user.empresasVinculadas.find((b) => b.empresaId === targetEmpresaId);
    if (binding) {
      try {
        activeProfile = profileService.getPerfilById(binding.perfilId);
      } catch {
        // Ignora
      }
    } else if (user.isSuperAdmin) {
      activeProfile = profileService.getPerfilByCodigo('SUPERADMIN_GRUPO');
    }

    return {
      success: true,
      activeCompany: targetCompany,
      hasGroupViewAccess: user.isSuperAdmin || authorizedCompanies.length >= allCompanies.length,
      authorizedCompanies,
      activeProfile,
      auditLogId: auditRecord.id,
    };
  }

  public getAuditLogs(limit = 50): EmpresaContextAuditRecord[] {
    return this.auditLogs.slice(0, limit);
  }

  public getSessionInfo(userId: string): SwitchCompanyResponse {
    const activeEmpresaId = this.getActiveEmpresaId(userId);
    const user = userService.getUserById(userId);
    const activeCompany = companyService.getCompanyById(activeEmpresaId);

    const allCompanies = companyService.listCompanies({ ativo: true });
    const authorizedCompanies = user.isSuperAdmin
      ? allCompanies
      : allCompanies.filter((c) =>
          user.empresasVinculadas.some((b) => b.empresaId === c.id && b.ativo)
        );

    let activeProfile: PerfilRecord | null = null;
    const binding = user.empresasVinculadas.find((b) => b.empresaId === activeEmpresaId);
    if (binding) {
      try {
        activeProfile = profileService.getPerfilById(binding.perfilId);
      } catch {
        // Ignora
      }
    } else if (user.isSuperAdmin) {
      activeProfile = profileService.getPerfilByCodigo('SUPERADMIN_GRUPO');
    }

    return {
      success: true,
      activeCompany,
      hasGroupViewAccess: user.isSuperAdmin || authorizedCompanies.length >= allCompanies.length,
      authorizedCompanies,
      activeProfile,
      auditLogId: 'initial-session',
    };
  }
}

export const tenantContextService = new TenantContextService();
