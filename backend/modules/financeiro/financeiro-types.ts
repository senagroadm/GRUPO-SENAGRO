/**
 * NEXUS ERP - Tipos do Núcleo Financeiro (AP/AR, Tesouraria, Contabilidade Gerencial)
 * 
 * Regras:
 * 1. Isolamento estrito por empresa_id (5 CNPJs do grupo TRITECH).
 * 2. Segregação de Funções (SoD): Lançamento, Aprovação e Pagamento.
 * 3. Proibição de exclusão física de títulos liquidados (Soft-delete/Auditoria).
 * 4. Rastreabilidade com juros, multas, descontos, baixas parciais, adiantamentos e renegociações.
 */

export type TipoLancamentoFinanceiro = 'PAGAR' | 'RECEBER';

export type StatusTituloFinanceiro =
  | 'RASCUNHO'
  | 'PENDENTE_APROVACAO'
  | 'APROVADO'
  | 'REJEITADO'
  | 'EM_ABERTO'
  | 'PARCIALMENTE_PAGO'
  | 'LIQUIDADO'
  | 'CANCELADO'
  | 'RENEGOCIADO'
  | 'PROTESTADO'
  | 'EM_COBRANCA_JUDICIAL';

export type StatusParcelaFinanceira =
  | 'EM_ABERTO'
  | 'PARCIALMENTE_PAGA'
  | 'LIQUIDADA'
  | 'CANCELADA'
  | 'RENEGOCIADA'
  | 'PROTESTADA';

export type OrigemTituloFinanceiro =
  | 'MANUAL'
  | 'COMPRAS_ORDEM'
  | 'PEDIDO_VENDA'
  | 'FISCAL_NFE_ENTRADA'
  | 'FISCAL_NFE_FATURAMENTO'
  | 'FISCAL_NFSE_SERVICO'
  | 'RENEGOCIACAO'
  | 'ADIANTAMENTO_COMPENSACAO'
  | 'CONTRATO_RECORRENTE'
  | 'DESPESA_FOLHA_RH';

export type FormaPagamentoFinanceiro =
  | 'PIX'
  | 'BOLETO'
  | 'TED'
  | 'DOC'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'CHEQUE'
  | 'DINHEIRO'
  | 'COMPENSACAO_ADIANTAMENTO'
  | 'DEBITO_AUTOMATICO';

export type TipoCentroCusto =
  | 'PRODUTIVO'
  | 'ADMINISTRATIVO'
  | 'COMERCIAL'
  | 'ENGENHARIA'
  | 'LOGISTICA'
  | 'MANUTENCAO'
  | 'DIRETORIA';

export type TipoCategoriaFinanceira = 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA';

export type TipoContaPlanoContas = 'SINTETICA' | 'ANALITICA';
export type NaturezaContaPlanoContas = 'DEVEDORA' | 'CREDORA';

// -------------------------------------------------------------
// ESTRUTURA CONTÁBIL E CENTROS DE CUSTO
// -------------------------------------------------------------

export interface PlanoConta {
  id: string;
  empresaId: string;
  codigoEstrutural: string; // Ex: '1.01.01.001'
  nomeConta: string;
  tipoConta: TipoContaPlanoContas;
  natureza: NaturezaContaPlanoContas;
  nivel: number;
  contaPaiId?: string;
  ativo: boolean;
  descricao?: string;
}

export interface CentroCusto {
  id: string;
  empresaId: string;
  codigo: string; // Ex: 'CC-FAB-01'
  nome: string;
  tipo: TipoCentroCusto;
  responsavel?: string;
  ativo: boolean;
  orcamentoMensalPrevisto?: number;
}

export interface CategoriaFinanceira {
  id: string;
  empresaId: string;
  nome: string;
  tipo: TipoCategoriaFinanceira;
  planoContaId?: string;
  planoContaNome?: string;
  corHex: string;
  dedutivelFiscal: boolean;
  ativo: boolean;
}

// -------------------------------------------------------------
// CONTAS A PAGAR (AP - ACCOUNTS PAYABLE)
// -------------------------------------------------------------

export interface ContaPagarParcela {
  id: string;
  empresaId: string;
  contaPagarId: string;
  numeroParcela: number;
  totalParcelas: number;
  dataVencimento: string; // YYYY-MM-DD
  dataPagamento?: string;
  valorNominal: number;
  valorJuros: number;
  valorMulta: number;
  valorDesconto: number;
  valorTotalLiquido: number; // nominal + juros + multa - desconto
  valorPago: number;
  valorSaldo: number;
  statusParcela: StatusParcelaFinanceira;
  formaPagamentoPrevista: FormaPagamentoFinanceiro;
  codigoBarrasBoleto?: string;
  linhaDigitavel?: string;
  chavePix?: string;
  diasAtraso?: number;
}

export interface ContaPagar {
  id: string;
  empresaId: string;
  fornecedorId: string;
  fornecedorNome: string;
  fornecedorCnpjCpf: string;
  numeroDocumento: string;
  descricao: string;
  origem: OrigemTituloFinanceiro;
  ordemCompraId?: string;
  documentoFiscalId?: string;
  chaveNfe?: string;
  categoriaFinanceiraId?: string;
  categoriaFinanceiraNome?: string;
  centroCustoId?: string;
  centroCustoNome?: string;
  planoContaId?: string;
  planoContaCodigo?: string;

  // Valores Consolidados
  valorOriginal: number;
  valorJuros: number;
  valorMulta: number;
  valorDesconto: number;
  valorTotalLiquido: number;
  valorPago: number;
  valorSaldoRestante: number;

  dataEmissao: string;
  dataVencimentoPrimeira: string;
  totalParcelas: number;
  parcelas: ContaPagarParcela[];

  status: StatusTituloFinanceiro;

  // Segregação de Funções (SoD)
  criadoPorUsuarioId: string;
  criadoPorUsuarioNome: string;
  aprovadoPorUsuarioId?: string;
  aprovadoPorUsuarioNome?: string;
  dataAprovacao?: string;
  motivoRejeicao?: string;

  motivoCancelamento?: string;
  renegociacaoId?: string;
  comprovanteStoragePath?: string;

  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// -------------------------------------------------------------
// CONTAS A RECEBER (AR - ACCOUNTS RECEIVABLE)
// -------------------------------------------------------------

export interface ContaReceberParcela {
  id: string;
  empresaId: string;
  contaReceberId: string;
  numeroParcela: number;
  totalParcelas: number;
  dataVencimento: string; // YYYY-MM-DD
  dataRecebimento?: string;
  valorNominal: number;
  valorJuros: number;
  valorMulta: number;
  valorDesconto: number;
  valorTotalLiquido: number;
  valorRecebido: number;
  valorSaldo: number;
  statusParcela: StatusParcelaFinanceira;
  formaRecebimentoPrevista: FormaPagamentoFinanceiro;
  nossoNumero?: string;
  linhaDigitavel?: string;
  qrCodePix?: string;
  diasAtraso?: number;
}

export interface ContaReceber {
  id: string;
  empresaId: string;
  clienteId: string;
  clienteNome: string;
  clienteCnpjCpf: string;
  numeroDocumento: string;
  descricao: string;
  origem: OrigemTituloFinanceiro;
  pedidoVendaId?: string;
  documentoFiscalId?: string;
  chaveNfe?: string;
  categoriaFinanceiraId?: string;
  categoriaFinanceiraNome?: string;
  centroCustoId?: string;
  centroCustoNome?: string;
  planoContaId?: string;
  planoContaCodigo?: string;

  // Valores Consolidados
  valorOriginal: number;
  valorJuros: number;
  valorMulta: number;
  valorDesconto: number;
  valorTotalLiquido: number;
  valorRecebido: number;
  valorSaldoRestante: number;

  dataEmissao: string;
  dataVencimentoPrimeira: string;
  totalParcelas: number;
  parcelas: ContaReceberParcela[];

  status: StatusTituloFinanceiro;

  // Segregação de Funções (SoD)
  criadoPorUsuarioId: string;
  criadoPorUsuarioNome: string;
  aprovadoPorUsuarioId?: string;
  aprovadoPorUsuarioNome?: string;
  dataAprovacao?: string;

  motivoCancelamento?: string;
  renegociacaoId?: string;

  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// -------------------------------------------------------------
// BAIXAS / LIQUIDAÇÕES (PARCIAIS E TOTAIS)
// -------------------------------------------------------------

export interface BaixaFinanceira {
  id: string;
  empresaId: string;
  tipoOperacao: 'PAGAMENTO' | 'RECEBIMENTO';
  contaPagarId?: string;
  contaPagarParcelaId?: string;
  contaReceberId?: string;
  contaReceberParcelaId?: string;
  numeroDocumento: string;
  numeroParcela: number;

  dataBaixa: string;
  valorPagoOuRecebido: number;
  valorJurosAplicado: number;
  valorMultaAplicada: number;
  valorDescontoAplicado: number;

  formaPagamento: FormaPagamentoFinanceiro;
  contaBancariaNome?: string;
  autenticacaoBancaria?: string;
  observacoes?: string;
  comprovanteStoragePath?: string;

  usuarioBaixaId: string;
  usuarioBaixaNome: string;

  estornado: boolean;
  dataEstorno?: string;
  usuarioEstornoId?: string;
  motivoEstorno?: string;

  createdAt: string;
}

// -------------------------------------------------------------
// ADIANTAMENTOS FINANCEIROS
// -------------------------------------------------------------

export type TipoAdiantamento = 'A_FORNECEDOR' | 'DE_CLIENTE';
export type StatusAdiantamento =
  | 'DISPONIVEL'
  | 'PARCIALMENTE_COMPENSADO'
  | 'TOTALMENTE_COMPENSADO'
  | 'CANCELADO';

export interface CompensacaoAdiantamentoItem {
  id: string;
  adiantamentoId: string;
  tituloId: string;
  parcelaId: string;
  tipoTitulo: 'PAGAR' | 'RECEBER';
  valorCompensado: number;
  dataCompensacao: string;
  usuarioId: string;
  usuarioNome: string;
}

export interface AdiantamentoFinanceiro {
  id: string;
  empresaId: string;
  tipo: TipoAdiantamento;
  parceiroId: string;
  parceiroNome: string;
  parceiroCnpjCpf: string;
  numeroDocumento: string;
  dataAdiantamento: string;
  valorOriginal: number;
  valorCompensado: number;
  valorSaldoDisponivel: number;
  status: StatusAdiantamento;
  formaPagamento: FormaPagamentoFinanceiro;
  usuarioLancamentoId: string;
  usuarioLancamentoNome: string;
  observacoes?: string;
  compensacoes: CompensacaoAdiantamentoItem[];
  createdAt: string;
}

// -------------------------------------------------------------
// RENEGOCIAÇÃO DE TÍTULOS / DÍVIDAS
// -------------------------------------------------------------

export interface RenegociacaoFinanceira {
  id: string;
  empresaId: string;
  tipo: TipoLancamentoFinanceiro;
  parceiroId: string;
  parceiroNome: string;
  numeroProtocolo: string;
  dataRenegociacao: string;
  titulosOriginaisIds: string[];
  parcelasOriginaisIds: string[];
  valorTotalOriginal: number;
  valorJurosAcordo: number;
  valorDescontoAcordo: number;
  valorTotalRenegociado: number;
  quantidadeNovasParcelas: number;
  novoTituloGeradoId: string;
  motivoRenegociacao: string;
  usuarioId: string;
  usuarioNome: string;
  createdAt: string;
}

// -------------------------------------------------------------
// RESUMOS E INDICADORES (DASHBOARD & FLUXO DE CAIXA)
// -------------------------------------------------------------

export interface ResumoFinanceiroEmpresa {
  empresaId: string;
  totalPagarAberto: number;
  totalPagarVencido: number;
  totalPagarHoje: number;
  totalReceberAberto: number;
  totalReceberVencido: number;
  totalReceberHoje: number;
  saldoProjetado: number;
  indiceInadimplenciaPercent: number;
  totalAdiantamentosFornecedorDisponivel: number;
  totalAdiantamentosClienteDisponivel: number;
  totalTitulosPendentesAprovacao: number;
}

export interface ProjecaoFluxoCaixaDia {
  data: string; // YYYY-MM-DD
  diaSemana: string;
  totalPrevistoReceber: number;
  totalPrevistoPagar: number;
  saldoDia: number;
  saldoAcumulado: number;
}

export interface DreSinteticoItem {
  codigo: string;
  descricao: string;
  tipo: 'RECEITA' | 'DEDUCAO' | 'CUSTO' | 'DESPESA' | 'RESULTADO';
  valor: number;
  percentualSobreReceita: number;
}

// -------------------------------------------------------------
// TRILHA DE AUDITORIA FINANCEIRA
// -------------------------------------------------------------

export interface AuditoriaFinanceiraLog {
  id: string;
  empresaId: string;
  usuarioId: string;
  usuarioNome: string;
  modulo: 'FINANCEIRO';
  acao:
    | 'CRIACAO_TITULO'
    | 'APROVACAO_TITULO'
    | 'REJEICAO_TITULO'
    | 'BAIXA_PARCIAL'
    | 'BAIXA_TOTAL'
    | 'ESTORNO_BAIXA'
    | 'CANCELAMENTO_TITULO'
    | 'RENEGOCIACAO'
    | 'LANCAMENTO_ADIANTAMENTO'
    | 'COMPENSACAO_ADIANTAMENTO'
    | 'ALTERACAO_VENCIMENTO';
  timestamp: string;
  tituloOuDocumentoRef: string;
  payloadBefore: any;
  payloadAfter: any;
  detalhes: string;
}
