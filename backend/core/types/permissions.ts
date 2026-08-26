export type ModuloSistema =
  | 'ADMINISTRACAO'
  | 'CRM'
  | 'COMERCIAL'
  | 'ORCAMENTO'
  | 'PEDIDO'
  | 'CREDITO_SERASA'
  | 'ENGENHARIA'
  | 'ESTOQUE'
  | 'COMPRAS'
  | 'PCP'
  | 'PRODUCAO'
  | 'CORTE'
  | 'DOBRA'
  | 'SERVICOS'
  | 'QUALIDADE'
  | 'MANUTENCAO'
  | 'EXPEDICAO'
  | 'FISCAL'
  | 'FINANCEIRO'
  | 'RH_OPERACIONAL'
  | 'BI'
  | 'AUDITORIA';

export type AcaoPermissao =
  | 'READ'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'CANCEL'
  | 'EXPORT'
  | 'ADMIN';

export interface PermissaoRule {
  empresaId?: string; // null ou undefined indica aplicabilidade em todas as empresas atribuídas
  modulo: ModuloSistema;
  acao: AcaoPermissao;
  permitido: boolean;
}
