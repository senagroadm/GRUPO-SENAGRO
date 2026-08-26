export type TipoTransacaoIntercompany =
  | 'VENDA_MERCANTIL'
  | 'PRESTACAO_SERVICO'
  | 'TRANSFERENCIA_ESTOQUE'
  | 'RATEIO_CSC'
  | 'MUTUO_FINANCEIRO';

export type StatusReconciliacao = 'CONCILIADO' | 'PENDENTE' | 'DIVERGENTE';
export type StatusEliminacao = 'A_ELIMINAR' | 'ELIMINADO' | 'IGNORADO';
export type CriterioRateio = 'FATURAMENTO_SHARE' | 'HEADCOUNT_COLABORADORES' | 'FIXO_PARAMETRIZADO' | 'CONSUMO_HORAS_ENG';

export interface TransacaoIntercompanyRecord {
  id: string;
  tipo: TipoTransacaoIntercompany;
  empresaOrigemId: string;
  empresaOrigemCodigo: string;
  empresaOrigemNome: string;
  empresaDestinoId: string;
  empresaDestinoCodigo: string;
  empresaDestinoNome: string;
  documentoRef: string;
  cfop?: string;
  dataEmissao: string;
  dataCompetencia: string; // YYYY-MM
  descricao: string;
  categoria: string;
  valorBruto: number;
  valorDeducoesImpostos: number;
  valorLiquido: number;
  custoOrigem: number;
  margemLucroEmbutida: number; // Lucro intercompany a eliminar se em estoque
  percentualMargem: number;
  statusReconciliacao: StatusReconciliacao;
  valorLancadoDestino: number;
  divergenciaValor: number;
  motivoDivergencia?: string;
  eliminavel: boolean;
  statusEliminacao: StatusEliminacao;
  reconciliadoPor?: string;
  reconciliadoEm?: string;
}

export interface RegraEliminacaoConfig {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  tipoOperacao: TipoTransacaoIntercompany | 'ESTOQUE_LUCRO_NAO_REALIZADO' | 'SALDOS_PATRIMONIAIS';
  ativo: boolean;
  eliminarReceitaCusto: boolean;
  eliminarAtivoPassivo: boolean;
  eliminarMargemEstoque: boolean;
  observacaoContabil: string;
}

export interface RateioItemDistribuicao {
  empresaId: string;
  empresaCodigo: string;
  empresaNome: string;
  percentual: number;
  valor: number;
  baseCalculoDescricao: string;
}

export interface RateioCscRecord {
  id: string;
  codigo: string;
  competencia: string; // YYYY-MM
  departamentoOrigem: string;
  empresaOrigemId: string;
  empresaOrigemNome: string;
  descricao: string;
  valorTotalRateado: number;
  criterioRateio: CriterioRateio;
  distribuicao: RateioItemDistribuicao[];
  criadoEm: string;
  aprovadoPor?: string;
}

export interface PosicaoClienteEmpresa {
  empresaId: string;
  empresaCodigo: string;
  empresaNome: string;
  limiteAlocado: number;
  saldoAberto: number;
  saldoVencido: number;
  diasMaiorAtraso: number;
  pedidosEmCarteira: number;
  statusCreditoNaEmpresa: 'LIBERADO' | 'ALERTA' | 'BLOQUEADO';
}

export interface ExposicaoClienteGrupoRecord {
  clienteId: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  segmento: string;
  scoreCreditoGrupo: number; // 0 a 1000
  ratingRisco: 'AAA' | 'AA' | 'A' | 'B' | 'C' | 'D';
  limiteCreditoGlobalAprovado: number;
  exposicaoTotalGrupo: number; // Soma de saldos em aberto nos 5 CNPJs
  percentualUtilizacaoGlobal: number; // (exposicaoTotal / limiteGlobal) * 100
  titulosVencidosTotal: number;
  pddCalculadaTotal: number;
  pedidosCarteiraTotal: number;
  statusLimite: 'DENTRO_LIMITE' | 'ALERTA_80' | 'LIMITE_ESTOURADO';
  empresasComOperacao: number; // Quantos CNPJs atendem esse cliente (1 a 5)
  posicaoPorEmpresa: PosicaoClienteEmpresa[];
}

export interface EstoqueEmpresaConsolidadoRecord {
  empresaId: string;
  empresaCodigo: string;
  empresaNome: string;
  materiaPrimaValor: number;
  emProcessoValor: number;
  produtoAcabadoValor: number;
  estoqueTransitoIntercompanyValor: number;
  totalEstoqueBruto: number;
  margemIntercompanyNaoRealizada: number; // Margem agregada que deve ser expurgada
  totalEstoqueConsolidadoLiquido: number; // Bruto - Margem Não Realizada
  giroEstoqueDias: number;
  itensCriticos: number;
}

export interface CaixaEmpresaConsolidadoRecord {
  empresaId: string;
  empresaCodigo: string;
  empresaNome: string;
  saldoBancosContaCorrente: number;
  saldoAplicacoesLiquidez: number;
  saldoCaixaGeral: number;
  saldoMutuoReceberIntercompany: number;
  saldoMutuoPagarIntercompany: number;
  saldoMutuoLiquido: number; // Receber - Pagar
  caixaDisponivelEfetivo: number; // Bancos + Aplicações + Caixa
  projecaoFluxo30d: number;
  compromissosCurtoPrazo: number;
  indiceLiquidezSeca: number;
}

export interface DreConsolidadoLinha {
  id: string;
  contaCodigo: string;
  descricao: string;
  tipo: 'SINTETICA' | 'ANALITICA';
  destaque: boolean;
  ehSubtotal: boolean;
  valoresPorEmpresa: Record<string, number>; // [empresaId]: valor
  somaBrutaCombinada: number;
  eliminacoesIntercompany: number;
  consolidadoGrupo: number;
  detalheEliminacoes?: string;
}

export interface FaturamentoConsolidadoEmpresa {
  empresaId: string;
  empresaCodigo: string;
  empresaNome: string;
  faturamentoBrutoTotal: number;
  vendasIntercompany: number;
  servicosIntercompany: number;
  totalIntercompany: number;
  faturamentoMercadoTerceiros: number;
  margemBrutaTerceirosPerc: number;
  shareFaturamentoGrupoPerc: number;
  ticketMedioTerceiros: number;
  volumePedidosTerceiros: number;
}

export interface FiltroConsolidacao {
  competencia: string; // '2026-08' ou 'TODOS'
  empresasIds: string[]; // IDs das empresas selecionadas
  tiposOperacao: TipoTransacaoIntercompany[];
  statusReconciliacao: string; // 'TODOS' | 'CONCILIADO' | 'PENDENTE' | 'DIVERGENTE'
  regrasAtivas: Record<string, boolean>;
  apenasDivergentes: boolean;
}

export interface ResumoConsolidacaoGrupo {
  faturamentoBrutoCombinado: number;
  faturamentoIntercompanyEliminado: number;
  faturamentoConsolidadoTerceiros: number;
  percentualEliminacaoFaturamento: number;
  
  custoBrutoCombinado: number;
  custoIntercompanyEliminado: number;
  custoConsolidadoTerceiros: number;
  
  ebitdaCombinado: number;
  ebitdaConsolidado: number;
  margemEbitdaConsolidada: number;
  
  lucroLiquidoCombinado: number;
  lucroLiquidoConsolidado: number;
  margemLiquidaConsolidada: number;
  
  estoqueBrutoTotal: number;
  lucroEstoqueEliminado: number;
  estoqueLiquidoConsolidado: number;
  
  caixaDisponivelTotal: number;
  mutuosIntercompanyTotal: number;
  
  transacoesIntercompanyTotal: number;
  transacoesConciliadas: number;
  transacoesPendentes: number;
  transacoesDivergentes: number;
  valorPendenteReconciliacao: number;
}
