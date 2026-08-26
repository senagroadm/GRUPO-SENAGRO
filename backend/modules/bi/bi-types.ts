// backend/modules/bi/bi-types.ts

export type CategoriaIndicador = 'GRUPO' | 'FINANCEIRO' | 'INDUSTRIAL' | 'COMERCIAL' | 'ESTOQUE' | 'QUALIDADE';
export type PeriodicidadeIndicador = 'DIARIO' | 'SEMANAL' | 'MENSAL' | 'TRIMESTRAL' | 'ANUAL';
export type PolaridadeIndicador = 'MAIOR_MELHOR' | 'MENOR_MELHOR' | 'ALVO_EXATO';
export type StatusAlerta = 'NORMAL' | 'ATENCAO' | 'CRITICO';
export type TipoVisualizacaoWidget = 'CARD_VALOR' | 'GRAFICO_LINHA' | 'GRAFICO_BARRA' | 'GRAFICO_DONUT' | 'TABELA' | 'FUNIL' | 'OEE_GAUGE' | 'PARETO' | 'WATERFALL';

export interface IndicadorDefinicao {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  categoria: CategoriaIndicador;
  unidade: 'BRL' | 'PERCENTUAL' | 'QUANTIDADE' | 'HORAS' | 'DIAS' | 'PONTOS';
  formula: string;
  periodicidade: PeriodicidadeIndicador;
  polaridade: PolaridadeIndicador;
  valorReferenciaMercado?: number;
  ativo: boolean;
}

export interface MetaIndicador {
  id: string;
  indicadorId: string;
  indicadorCodigo: string;
  empresaId: string | 'GRUPO'; // 'GRUPO' para meta global consolidada ou empresa_id
  ano: number;
  mes?: number; // 1 a 12 ou undefined se anual
  valorAlvo: number;
  limiteAlertaAmarelo: number; // Tolerância
  limiteCriticoVermelho: number;
  observacoes?: string;
  responsavelNome: string;
}

export interface HistoricoIndicadorPonto {
  id: string;
  indicadorId: string;
  indicadorCodigo: string;
  empresaId: string | 'GRUPO';
  periodo: string; // Ex: '2026-01', '2026-02', etc.
  valorRealizado: number;
  valorMeta: number;
  variacaoPercentualMeta: number;
  status: StatusAlerta;
  detalhesJson?: Record<string, any>;
}

export interface BiAlerta {
  id: string;
  empresaId: string | 'GRUPO';
  empresaNome: string;
  indicadorId: string;
  indicadorCodigo: string;
  indicadorNome: string;
  categoria: CategoriaIndicador;
  status: StatusAlerta;
  valorAtual: number;
  valorMeta: number;
  limiteViolado: number;
  dataDisparo: string;
  mensagemDiagnostico: string;
  planoAcaoSugerido: string;
  reconhecido: boolean;
  reconhecidoPor?: string;
  dataReconhecimento?: string;
}

// -------------------------------------------------------------
// MODELOS DE DASHBOARD CONSOLIDADOS
// -------------------------------------------------------------

export interface KpiCardItem {
  id: string;
  titulo: string;
  valor: number;
  unidade: 'BRL' | 'PERCENTUAL' | 'QUANTIDADE' | 'HORAS' | 'DIAS';
  meta?: number;
  variacaoPeriodoAnterior?: number; // %
  status: StatusAlerta;
  tendencia: 'ALTA' | 'BAIXA' | 'ESTAVEL';
  descricaoAjuda: string;
}

export interface DashboardGrupoData {
  periodoAtual: string;
  faturamentoConsolidado: number;
  metaFaturamento: number;
  margemContribuicaoMedia: number; // %
  margemEbitdaMedia: number; // %
  caixaDisponivelTotal: number;
  recebiveisTotal: number;
  pagamentosPrevistosTotal: number;
  estoqueValorizadoTotal: number;
  producaoTotalVolume: number; // Unidades / Toneladas
  indiceAtrasoEntregasOtif: number; // % (100 - OTIF)
  taxaInadimplenciaTotal: number; // %
  resultadoLiquidoConsolidado: number;
  kpis: KpiCardItem[];
  distribuicaoEmpresas: {
    empresaId: string;
    empresaCodigo: string;
    nomeFantasia: string;
    faturamento: number;
    margemLucro: number;
    caixa: number;
    producao: number;
    oee: number;
    inadimplencia: number;
    otif: number;
    shareFaturamento: number; // %
  }[];
  evolucaoMensalConsolidada: {
    mes: string;
    faturamento: number;
    metaFaturamento: number;
    custoOperacional: number;
    resultado: number;
    margem: number;
  }[];
}

export interface DashboardEmpresaData {
  empresaId: string;
  empresaNome: string;
  cnpj: string;
  periodo: string;
  kpis: KpiCardItem[];
  dreSintetico: {
    receitaBruta: number;
    deducoesImpostos: number;
    receitaLiquida: number;
    custosProdutosVendidos: number;
    lucroBruto: number;
    margemBrutaPercentual: number;
    despesasOperacionais: number;
    ebitda: number;
    margemEbitdaPercentual: number;
    resultadoFinanceiro: number;
    lucroLiquido: number;
    margemLiquidaPercentual: number;
  };
  desempenhoSetores: {
    setorId: string;
    setorNome: string;
    custoSetor: number;
    eficienciaMedia: number;
    horasApontadas: number;
    volumeProduzido: number;
    desvioPadrao: number;
  }[];
}

export interface DashboardIndustrialData {
  empresaId: string | 'GRUPO';
  periodo: string;
  oeeGeral: {
    oee: number; // Disponibilidade * Performance * Qualidade
    disponibilidade: number; // %
    performance: number; // %
    qualidade: number; // %
    metaOee: number;
  };
  producaoVolume: {
    totalPecasProduzidas: number;
    metaPecas: number;
    pesoTotalKg: number;
    horasFabrisTrabalhadas: number;
  };
  eficienciaLinhas: {
    linhaId: string;
    linhaNome: string;
    oee: number;
    disponibilidade: number;
    performance: number;
    qualidade: number;
    status: 'ALTA_PERFORMANCE' | 'ESTAVEL' | 'CRITICO';
  }[];
  paradasProducao: {
    motivo: string;
    categoria: 'MECANICA' | 'ELETRICA' | 'SETUP' | 'FALTA_MATERIAL' | 'OPERACIONAL';
    tempoMinutos: number;
    percentualTempoTotal: number;
    ocorrenciasQtd: number;
  }[];
  refugoRetrabalho: {
    totalPecasRefugadas: number;
    taxaRefugoPercentual: number;
    custoTotalRefugo: number;
    totalHorasRetrabalho: number;
    taxaRetrabalhoPercentual: number;
    custoTotalRetrabalho: number;
    principaisCausasRefugo: { causa: string; pecas: number; custo: number }[];
  };
  capacidadeUtilizacao: {
    capacidadeInstaladaHoras: number;
    capacidadeUtilizadaHoras: number;
    taxaUtilizacao: number; // %
    gargaloPrincipal: string;
  };
  pedidosEmRisco: {
    pedidoId: string;
    numeroPedido: string;
    clienteNome: string;
    dataPrometida: string;
    diasAtrasoEstimado: number;
    opRelacionada: string;
    estagioAtual: string;
    motivoRisco: string;
    valorPedido: number;
    criticidade: 'ALTA' | 'MEDIA' | 'CRITICA';
  }[];
}

export interface DashboardComercialData {
  empresaId: string | 'GRUPO';
  periodo: string;
  funilVendas: {
    etapa: 'PROSPECCAO' | 'QUALIFICACAO' | 'COTACAO' | 'PROPOSTA' | 'NEGOCIACAO' | 'FECHADO_GANHO';
    nomeEtapa: string;
    quantidadeOportunidades: number;
    valorTotalEtapa: number;
    taxaConversaoEtapa: number; // %
  }[];
  taxaConversaoGeral: number; // %
  ticketMedioVendas: number;
  vendasRealizadas: {
    faturadoNoPeriodo: number;
    metaPeriodo: number;
    percentualMetaAtingido: number;
    carteiraBacklogFuturo: number;
  };
  margemContribuicaoPorLinha: {
    linhaProduto: string;
    faturamento: number;
    margemBrutaPercentual: number;
    margemLiquidaPercentual: number;
  }[];
  rankingVendedores: {
    vendedorId: string;
    vendedorNome: string;
    totalVendido: number;
    metaVendedor: number;
    atingimentoMetaPercentual: number;
    ticketMedio: number;
    quantidadePedidos: number;
    taxaConversao: number;
  }[];
}

export interface DashboardFinanceiroData {
  empresaId: string | 'GRUPO';
  periodo: string;
  caixaDisponivelTotal: number;
  distribuicaoBancos: {
    bancoId: string;
    bancoNome: string;
    numeroConta: string;
    saldoAtual: number;
    percentualTotal: number;
    chavePixPadrao?: string;
  }[];
  fluxoProjetadoCurvas: {
    diaOuMes: string;
    entradasPrevistas: number;
    saidasPrevistas: number;
    saldoLiquidoDia: number;
    saldoAcumuladoProjetado: number;
  }[];
  agingListRecebiveis: {
    faixa: 'A_VENCER' | 'VENCIDO_1_30' | 'VENCIDO_31_60' | 'VENCIDO_61_90' | 'VENCIDO_90_MAIS';
    faixaTitulo: string;
    valorTotal: number;
    percentualTotal: number;
    percentualPddEstimada: number;
    provisaoPddValor: number;
    quantidadeTitulos: number;
  }[];
  conciliacaoStatus: {
    taxaConciliacaoExtratos: number; // %
    totalLancamentosPendentes: number;
    valorTotalPendenteConciliacao: number;
    dataUltimaConciliacao: string;
  };
}

// -------------------------------------------------------------
// DRILL-DOWN ANALÍTICO (6 NÍVEIS)
// -------------------------------------------------------------

export interface DrillDownItem {
  id: string;
  codigo: string;
  descricao: string;
  especificacaoTecnica: string;
  unidadeMedida: string;
  quantidadePedida: number;
  quantidadeProduzida: number;
  precoUnitarioVenda: number;
  custoUnitarioPadrao: number;
  custoUnitarioReal: number;
  margemUnitarioPercentual: number;
  taxaRefugoItem: number;
  statusProducao: 'CONCLUIDO' | 'EM_PRODUCAO' | 'AGUARDANDO_MATERIA_PRIMA';
}

export interface DrillDownPedido {
  id: string;
  numeroPedido: string;
  ordemProducaoId?: string;
  dataEmissao: string;
  dataEntregaPrometida: string;
  statusPedido: 'FATURADO' | 'EM_PRODUCAO' | 'LIBERADO_EXPEDICAO' | 'BLOQUEIO_CREDITO';
  valorTotal: number;
  margemTotalPercentual: number;
  otifStatus: 'NO_PRAZO' | 'EM_RISCO' | 'ATRASADO';
  itens: DrillDownItem[];
}

export interface DrillDownCliente {
  id: string;
  cnpjCpf: string;
  razaoSocial: string;
  nomeFantasia: string;
  segmentoMercado: string;
  scoreCredito: number;
  limiteCredito: number;
  exposicaoAtual: number;
  faturamentoAcumulado: number;
  pedidosQtd: number;
  pedidos: DrillDownPedido[];
}

export interface DrillDownSetor {
  id: string;
  codigo: string;
  nome: string;
  tipo: 'PRODUTIVO' | 'APOIO' | 'COMERCIAL';
  responsavelNome: string;
  oeeMedio: number;
  custoHoraSetor: number;
  totalHorasTrabalhadas: number;
  clientes: DrillDownCliente[];
}

export interface DrillDownEmpresa {
  id: string;
  codigo: string;
  nomeFantasia: string;
  cnpj: string;
  faturamento: number;
  margemLucro: number;
  oee: number;
  setores: DrillDownSetor[];
}

export interface DrillDownGrupo {
  id: string;
  nomeGrupo: string;
  faturamentoTotal: number;
  empresas: DrillDownEmpresa[];
}

// Configurações e Preferências de Dashboard
export interface BiDashboardConfig {
  id: string;
  usuarioId: string;
  empresaId: string | 'GRUPO';
  dashboardTipo: 'GRUPO' | 'EMPRESA' | 'INDUSTRIAL' | 'COMERCIAL' | 'FINANCEIRO';
  autoRefreshIntervalSegundos: number; // 0 = desativado, 30, 60, 300
  temaCores: 'PADRAO_TECNICO' | 'ALTO_CONTRASTE';
  widgetsVisiveis: {
    widgetId: string;
    titulo: string;
    visivel: boolean;
    posicaoOrdem: number;
  }[];
}
