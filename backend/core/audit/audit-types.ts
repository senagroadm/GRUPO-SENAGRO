export type TipoAcaoAuditoria =
  | 'LOGIN'
  | 'LOGOUT'
  | 'TROCA_EMPRESA'
  | 'CRIAR_PEDIDO'
  | 'ALTERAR_PEDIDO'
  | 'CANCELAR_PEDIDO'
  | 'ALTERAR_PRECO_DESCONTO'
  | 'APROVAR_CREDITO'
  | 'APROVAR_COMPRA'
  | 'APROVAR_PAGAMENTO'
  | 'AJUSTE_ESTOQUE'
  | 'CRIAR_COMPRA'
  | 'PAGAMENTO_TITULO'
  | 'ESTORNO_FINANCEIRO'
  | 'ESTORNO_ESTOQUE'
  | 'EMISSAO_FISCAL'
  | 'CANCELAMENTO_FISCAL'
  | 'TRANSFERENCIA_INTERCOMPANY'
  | 'ALTERAR_PERMISSOES'
  | 'ORDEM_MANUTENCAO'
  | 'REGISTRO_RNC_QUALIDADE'
  | 'EXCLUSAO_LOGICA';

export type SeveridadeAuditoria = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface AuditUsuarioInfo {
  id: string;
  nome: string;
  email: string;
  perfil: string;
}

export interface AuditEmpresaInfo {
  id: string;
  codigo: string;
  nome: string;
  cnpj: string;
}

export interface AuditLogEntry {
  id: string;
  requestId: string;
  timestamp: string;
  usuario: AuditUsuarioInfo;
  empresa: AuditEmpresaInfo;
  modulo: string;
  acao: TipoAcaoAuditoria;
  entidade: string;
  entidadeId: string;
  ip: string;
  userAgent: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  justificativa?: string;
  severidade: SeveridadeAuditoria;
  hashIntegridade: string;
  hashAnterior?: string;
  diffCampos?: Array<{
    campo: string;
    valorAntes: unknown;
    valorDepois: unknown;
  }>;
  metadadosExtras?: Record<string, unknown>;
}

export interface AuditFiltros {
  empresaId?: string;
  modulo?: string;
  acao?: TipoAcaoAuditoria | 'TODAS';
  usuarioId?: string;
  severidade?: SeveridadeAuditoria | 'TODAS';
  dataInicio?: string;
  dataFim?: string;
  entidade?: string;
  entidadeId?: string;
  requestId?: string;
  termoBusca?: string;
  apenasComDiferenca?: boolean;
}

export interface AuditMetricsSummary {
  totalLogs: number;
  acoesCriticasHoje: number;
  trocasEmpresa: number;
  alteracoesPrecoDesconto: number;
  exclusoesLogicas: number;
  aprovacoesRealizadas: number;
  estornosRealizados: number;
  distribuicaoPorModulo: Record<string, number>;
  distribuicaoPorSeveridade: Record<SeveridadeAuditoria, number>;
}
