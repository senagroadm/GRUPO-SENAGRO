// backend/modules/compras/compras-types.ts
// Módulo de Compras, Suprimentos e Governança Multi-fornecedor
// Fluxo: Necessidade -> Solicitação -> Cotação Multi-critério -> Aprovação de Alçada -> Pedido de Compra -> Recebimento Físico/Fiscal -> Integração (Estoque, Financeiro, Fiscal) + Devoluções & IQF

export type OrigemNecessidadeCompra =
  | 'MANUAL'
  | 'ESTOQUE_MINIMO'
  | 'MRP'
  | 'ORDEM_PRODUCAO'
  | 'MANUTENCAO';

export type PrioridadeCompra =
  | 'BAIXA'
  | 'NORMAL'
  | 'URGENTE'
  | 'EMERGENCIAL';

export type StatusSolicitacaoCompra =
  | 'RASCUNHO'
  | 'PENDENTE_APROVACAO'
  | 'APROVADA'
  | 'REJEITADA'
  | 'EM_COTACAO'
  | 'ATENDIDA_TOTAL'
  | 'ATENDIDA_PARCIAL'
  | 'CANCELADA';

export interface SolicitacaoCompraItem {
  id: string;
  solicitacaoId: string;
  produtoId: string;
  codigoProduto: string;
  descricao: string;
  quantidade: number;
  unidadeMedida: string;
  precoEstimadoUnitario: number;
  valorEstimadoTotal: number;
  quantidadeAtendida: number;
  statusItem: 'PENDENTE' | 'COTADO' | 'PEDIDO_GERADO' | 'CANCELADO';
  centroCustoId?: string;
  maquinaTag?: string;
}

export interface SolicitacaoCompra {
  id: string;
  empresaId: string;
  numero: string; // SC-2026-0001
  tipoGeracao: OrigemNecessidadeCompra;
  prioridade: PrioridadeCompra;
  status: StatusSolicitacaoCompra;
  solicitanteId: string;
  solicitanteNome: string;
  departamento: string;
  dataNecessidade: string;
  justificativa: string;
  planoProducao?: string;
  numeroOp?: string;
  clienteNome?: string;
  itens: SolicitacaoCompraItem[];
  aprovadoPor?: string;
  dataAprovacao?: string;
  motivoRejeicao?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export type StatusCotacao =
  | 'ABERTA'
  | 'EM_ANALISE'
  | 'FINALIZADA'
  | 'CANCELADA';

export interface CriterioPesosCotacao {
  pesoPreco: number;     // Ex: 35%
  pesoFrete: number;     // Ex: 20%
  pesoPrazo: number;     // Ex: 20%
  pesoQualidade: number; // Ex: 15% (Baseado no IQF)
  pesoHistorico: number; // Ex: 10% (Pontualidade e relacionamento)
}

export interface CotacaoFornecedorItem {
  id: string;
  cotacaoFornecedorId: string;
  produtoId: string;
  codigoProduto: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  aliquotaIpi: number;
  valorIpi: number;
  aliquotaIcms: number;
  valorIcms: number;
  valorTotalItem: number;
  prazoEntregaDias: number;
  garantiaMeses: number;
}

export interface CotacaoFornecedor {
  id: string;
  cotacaoId: string;
  fornecedorId: string;
  fornecedorNome: string;
  fornecedorCnpj: string;
  condicaoPagamento: string; // 30 DDL, 30/60/90, A Vista, etc.
  tipoFrete: 'CIF' | 'FOB';
  valorFrete: number;
  prazoEntregaDiasGeral: number;
  validadeProposta: string;
  
  // Avaliação Multi-critério Ponderada
  pontuacaoPreco: number;     // 0 a 100
  pontuacaoFrete: number;     // 0 a 100
  pontuacaoPrazo: number;     // 0 a 100
  pontuacaoQualidade: number; // 0 a 100 (IQF)
  pontuacaoHistorico: number; // 0 a 100
  pontuacaoGeralFinal: number; // Média Ponderada
  rankingGeral: number;       // 1º, 2º, 3º lugar

  statusResposta: 'RESPONDIDA' | 'PENDENTE' | 'RECUSADA';
  selecionadoVencedor: boolean;
  justificativaEscolha?: string;
  itens: CotacaoFornecedorItem[];
}

export interface Cotacao {
  id: string;
  empresaId: string;
  numero: string; // COT-2026-0001
  solicitacaoId: string;
  solicitacaoNumero: string;
  status: StatusCotacao;
  compradorId: string;
  compradorNome: string;
  pesosCriterios: CriterioPesosCotacao;
  fornecedores: CotacaoFornecedor[];
  fornecedorVencedorId?: string;
  justificativaAprovacaoNaoPrimeiroLugar?: string;
  aprovadoPor?: string;
  dataAprovacao?: string;
  prazoLimiteResposta: string;
  criadoEm: string;
  atualizadoEm: string;
}

export type StatusPedidoCompra =
  | 'RASCUNHO'
  | 'PENDENTE_APROVACAO'
  | 'APROVADO'
  | 'ENVIADO_FORNECEDOR'
  | 'CONFIRMADO_FORNECEDOR'
  | 'EM_TRANSITO'
  | 'RECEBIDO_PARCIAL'
  | 'RECEBIDO_TOTAL'
  | 'CANCELADO';

export interface PedidoCompraItem {
  id: string;
  pedidoCompraId: string;
  produtoId: string;
  codigoProduto: string;
  descricao: string;
  quantidade: number;
  unidadeMedida: string;
  precoUnitario: number;
  aliquotaIpi: number;
  valorIpi: number;
  aliquotaIcms: number;
  valorIcms: number;
  valorTotalItem: number;
  quantidadeEntregue: number;
  quantidadePendente: number;
  quantidadeDevolvida: number;
  dataPrevisaoEntrega: string;
  statusItem: 'PENDENTE' | 'PARCIAL' | 'CONCLUIDO' | 'CANCELADO';
}

export interface PedidoCompra {
  id: string;
  empresaId: string;
  numero: string; // PC-2026-0001
  cotacaoId?: string;
  solicitacaoId?: string;
  fornecedorId: string;
  fornecedorNome: string;
  fornecedorCnpj: string;
  fornecedorEmail: string;
  condicaoPagamento: string;
  tipoFrete: 'CIF' | 'FOB';
  valorFrete: number;
  valorTotalProdutos: number;
  valorTotalImpostos: number;
  valorTotalItens: number;
  status: StatusPedidoCompra;
  dataEmissao: string;
  dataPrevisaoEntrega: string;
  compradorNome: string;
  aprovadoPor?: string;
  itens: PedidoCompraItem[];
  observacoes?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export type StatusRecebimento =
  | 'RECEBIDO_TOTAL'
  | 'RECEBIDO_PARCIAL'
  | 'REJEITADO_QUALIDADE'
  | 'DEVOLVIDO_PARCIAL'
  | 'DEVOLVIDO_TOTAL';

export interface RecebimentoItem {
  id: string;
  recebimentoId: string;
  pedidoCompraItemId: string;
  produtoId: string;
  codigoProduto: string;
  descricao: string;
  quantidadeEntregue: number;
  quantidadeAprovada: number;
  quantidadeRejeitada: number;
  quantidadeDevolvida?: number;
  unidadeMedida: string;
  precoUnitario: number;
  valorTotalItem: number;
  loteId?: string;
  numeroLoteUsina?: string;
  numeroCorrida?: string;
  certificadoUsinaNumero?: string;
  laudoQualidadeNumero?: string;
  almoxarifadoDestinoId?: string;
  localizacaoDestinoId?: string;
  statusInspecao: 'APROVADO' | 'REJEITADO' | 'APROVADO_COM_RESSALVA';
}

export interface Recebimento {
  id: string;
  empresaId: string;
  numero: string; // REC-2026-0001
  pedidoCompraId: string;
  pedidoCompraNumero: string;
  fornecedorId: string;
  fornecedorNome: string;
  fornecedorCnpj: string;
  numeroNf: string;
  serieNf: string;
  chaveAcessoNfe: string;
  dataEmissaoNf: string;
  dataRecebimento: string;
  valorTotalNf: number;
  status: StatusRecebimento;
  responsavelRecebimentoId: string;
  responsavelRecebimentoNome: string;
  conferenteQualidadeNome: string;
  almoxarifadoPadraoId?: string;
  itens: RecebimentoItem[];
  gerouMovimentoEstoque: boolean;
  movimentoEstoqueIds: string[];
  gerouIntegracaoFinanceira: boolean;
  tituloContasPagarId?: string;
  gerouIntegracaoFiscal: boolean;
  registroFiscalId?: string;
  observacoes?: string;
  criadoEm: string;
}

export interface DevolucaoCompraItem {
  id: string;
  devolucaoId: string;
  recebimentoItemId: string;
  produtoId: string;
  codigoProduto: string;
  descricao: string;
  quantidadeDevolvida: number;
  precoUnitario: number;
  valorTotalItem: number;
  motivo: string;
  loteDevolvidoId?: string;
}

export interface DevolucaoCompra {
  id: string;
  empresaId: string;
  numero: string; // DEV-2026-0001
  recebimentoId: string;
  pedidoCompraId: string;
  fornecedorId: string;
  fornecedorNome: string;
  fornecedorCnpj: string;
  tipoDevolucao: 'TOTAL' | 'PARCIAL';
  motivoGeral: string;
  numeroNfDevolucao: string;
  serieNfDevolucao: string;
  chaveAcessoNfeDevolucao: string;
  dataDevolucao: string;
  valorTotalDevolvido: number;
  responsavelNome: string;
  itens: DevolucaoCompraItem[];
  statusIntegracaoEstoque: boolean;
  statusIntegracaoFinanceira: boolean;
  statusIntegracaoFiscal: boolean;
  criadoEm: string;
}

export interface HistoricoPrecoCompra {
  id: string;
  empresaId: string;
  produtoId: string;
  codigoProduto: string;
  descricao: string;
  fornecedorId: string;
  fornecedorNome: string;
  dataCompra: string;
  precoUnitario: number;
  valorFreteUnitario: number;
  quantidadeComprada: number;
  numeroPedido: string;
  numeroNf: string;
  tendenciaPreco: 'ALTA' | 'BAIXA' | 'ESTAVEL';
}

export interface AvaliacaoFornecedor {
  id: string;
  empresaId: string;
  fornecedorId: string;
  fornecedorNome: string;
  fornecedorCnpj: string;
  totalPedidosRealizados: number;
  totalItensEntregues: number;
  totalItensComAtraso: number;
  totalItensRejeitadosQualidade: number;
  totalDevolucoes: number;
  mediaCumprimentoPrazoPercentual: number;
  mediaAprovacaoQualidadePercentual: number;
  pontuacaoHistorico: number;
  iqfPontuacaoGeral: number; // Índice de Qualificação de Fornecedor (0 a 100)
  categoriaFornecedor: 'HOMOLOGADO_A' | 'HOMOLOGADO_B' | 'EM_OBSERVACAO' | 'SUSPENSO';
  ultimaAtualizacao: string;
}

export interface IntegracaoFinanceiraCompra {
  id: string;
  empresaId: string;
  recebimentoId: string;
  pedidoCompraId: string;
  fornecedorNome: string;
  numeroNf: string;
  valorTotal: number;
  parcelas: Array<{
    numeroParcela: number;
    dataVencimento: string;
    valor: number;
    status: 'ABERTO' | 'PAGO';
  }>;
  statusTitulo: 'GERADO_CONTAS_A_PAGAR';
  criadoEm: string;
}

export interface IntegracaoFiscalCompra {
  id: string;
  empresaId: string;
  recebimentoId: string;
  chaveNfe: string;
  numeroNf: string;
  serie: string;
  dataEmissao: string;
  cfopEntrada: string;
  baseCalculoIcms: number;
  valorIcms: number;
  baseCalculoIpi: number;
  valorIpi: number;
  valorTotalNf: number;
  statusEscrituracao: 'REGISTRADO_LIVRO_ENTRADA';
}

// Aliases for component convenience
export type CotacaoCompra = Cotacao;
export type RecebimentoCompra = Recebimento;
export type AvaliacaoFornecedorIQF = AvaliacaoFornecedor;
