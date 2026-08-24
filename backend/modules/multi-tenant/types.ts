import { ModuloSistema, AcaoPermissao } from '../../core/types/permissions';

export type RegimeTributario = 'LUCRO_REAL' | 'LUCRO_PRESUMIDO' | 'SIMPLES_NACIONAL';
export type NivelAcessoPerfil = 'GRUPO' | 'EMPRESA' | 'OPERACIONAL';

export interface EmpresaRecord {
  id: string;
  codigo: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  regimeTributario: RegimeTributario;
  ramoAtividade: string;
  isMatriz: boolean;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface PerfilRecord {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  nivelAcesso: NivelAcessoPerfil;
  ativo: boolean;
  permissoesIds?: string[];
  criadoEm: string;
}

export interface PermissaoRecord {
  id: string;
  codigo: string;
  modulo: ModuloSistema;
  acao: AcaoPermissao;
  descricao: string;
  criadoEm: string;
}

export interface UsuarioEmpresaBinding {
  empresaId: string;
  empresaNomeFantasia?: string;
  empresaCnpj?: string;
  perfilId: string;
  perfilNome?: string;
  padrao: boolean;
  ativo: boolean;
}

export interface UsuarioRecord {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  cargo?: string;
  isSuperAdmin: boolean;
  ativo: boolean;
  empresasVinculadas: UsuarioEmpresaBinding[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface EmpresaContextAuditRecord {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioEmail: string;
  empresaOrigemId?: string;
  empresaOrigemNome?: string;
  empresaDestinoId: string;
  empresaDestinoNome: string;
  motivo?: string;
  ipOrigem?: string;
  userAgent?: string;
  correlationId?: string;
  criadoEm: string;
}

export interface SwitchCompanyPayload {
  userId: string;
  targetEmpresaId: string;
  motivo?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SwitchCompanyResponse {
  success: boolean;
  activeCompany: EmpresaRecord;
  hasGroupViewAccess: boolean;
  authorizedCompanies: EmpresaRecord[];
  activeProfile: PerfilRecord | null;
  auditLogId: string;
}
