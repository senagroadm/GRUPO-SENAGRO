/**
 * Tipos e Interfaces do Módulo de Análise de Crédito & Risco Industrial
 * Suporta isolamento multiempresa e limite consolidado para o grupo econômico.
 */

export type StatusAnaliseCredito =
  | 'RASCUNHO'
  | 'EM_ANALISE'
  | 'PENDENTE_APROVACAO'
  | 'APROVADO'
  | 'APROVADO_COM_RESTRICAO'
  | 'REPROVADO'
  | 'CANCELADO';

export type RecomendacaoMotor =
  | 'APROVACAO_AUTOMATICA'
  | 'RECOMENDA_APROVACAO'
  | 'SUBMETER_COMITE'
  | 'RECOMENDA_RESTRICAO'
  | 'RECOMENDA_REPROVACAO'
  | 'BLOQUEIO_IMEDIATO';

export type NivelAlcadaAprovacao =
  | 'ANALISTA_CREDITO'
  | 'GERENTE_FINANCEIRO'
  | 'DIRETORIA_EXECUTIVA'
  | 'COMITE_CREDITO';

export type MotivoBloqueioCredito =
  | 'INADIMPLENCIA_TITULOS_VENCIDOS'
  | 'EXPOSICAO_ACIMA_DO_LIMITE'
  | 'PROTESTO_OU_RESTRICAO_EXTERNA'
  | 'SCORE_CRITICO_BUREAU'
  | 'CADASTRO_DESATUALIZADO'
  | 'BLOQUEIO_ADMINISTRATIVO_MANUAL'
  | 'RECUPERACAO_JUDICIAL_OU_FALENCIA';

export type StatusTituloPagamento =
  | 'EM_ABERTO'
  | 'PAGO_EM_DIA'
  | 'PAGO_COM_ATRASO'
  | 'VENCIDO'
  | 'RENEGOCIADO'
  | 'CANCELADO';

export type TipoGarantiaExigida =
  | 'NENHUMA'
  | 'AVAL_SOCIOS'
  | 'ALIENACAO_FIDUCIARIA'
  | 'PAGAMENTO_ANTECIPADO'
  | 'SINAL_50_RESTANTE_FATURADO'
  | 'CARTA_FIANCA_BANCARIA'
  | 'DUPLICATA_CAUCIONADA';

// -----------------------------------------------------------------------------
// ENTIDADE 1: politicas_credito
// -----------------------------------------------------------------------------
export interface FaixaScorePolitica {
  faixa: string; // Ex: "A+", "A", "B", "C", "D"
  scoreMin: number;
  scoreMax: number;
  fatorLimiteFaturamento: number; // Percentual do faturamento mensal sugerido como limite (ex: 0.3 = 30%)
  limiteMaximoSemComite: number;
  prazoMaximoDias: number; // Ex: 28, 35, 42 dias
  exigeGarantia: boolean;
  permiteParcelamento: boolean;
}

export interface PoliticaCredito {
  id: string;
  empresaId?: string | null; // null = Política Global do Grupo Econômico
  nome: string;
  descricao: string;
  versao: string;
  ativo: boolean;
  
  // Pesos do Score Interno (soma = 100%)
  pesoHistoricoInterno: number;     // Ex: 35%
  pesoTempoRelacionamento: number;  // Ex: 15%
  pesoVolumeFaturamento: number;    // Ex: 15%
  pesoScoreBureauExterno: number;   // Ex: 20%
  pesoRestricoesExternas: number;   // Ex: 15%

  // Regras de Tolerância
  diasToleranciaAtraso: number;     // Tolerância em dias antes de travar (ex: 5 dias)
  valorMaximoProtestoTolerado: number; // Valor R$ aceito se comprovadamente contestado (ex: R$ 500)
  quantidadeMaxProtestos: number;   // Zero protestos tolerados por padrão
  mesesValidadeAnalise: number;     // Ex: 6 meses para renovação obrigatória
  
  // Faixas de Score
  faixasScore: FaixaScorePolitica[];

  // Alçadas de Aprovação
  alcadas: {
    nivel: NivelAlcadaAprovacao;
    limiteMaximo: number;
    permiteAprovarComRestricao: boolean;
  }[];

  criadoEm: string;
  atualizadoEm: string;
}

// -----------------------------------------------------------------------------
// ENTIDADE 2: limites_credito
// -----------------------------------------------------------------------------
export interface LimiteCreditoEmpresa {
  empresaId: string;
  empresaNome: string;
  limiteConcedido: number;
  limiteTemporario: number;
  dataFimTemporario?: string;
  exposicaoAtual: number;
  exposicaoProjetada: number;
  saldoDisponivel: number;
  status: 'ATIVO' | 'SUSPENSO' | 'BLOQUEADO';
}

export interface LimiteCredito {
  id: string;
  clienteId: string;
  clienteNome: string;
  cnpjCpf: string;
  grupoEconomicoCliente?: string;

  // Limite Consolidado do Grupo Industrial (MWAM, Tritech, Senagro, etc.)
  limiteConsolidadoGrupo: number;
  exposicaoConsolidadaAtual: number;
  exposicaoConsolidadaProjetada: number;
  saldoConsolidadoDisponivel: number;

  // Limites discriminados por Empresa do ERP
  limitesPorEmpresa: LimiteCreditoEmpresa[];

  // Validade e Governança
  dataConcessao: string;
  dataValidade: string;
  ultimaAnaliseId?: string;
  aprovadorId?: string;
  aprovadorNome?: string;
  observacoes?: string;
  statusGeral: 'LIBERADO' | 'ALERTA_EXPOSICAO' | 'BLOQUEADO' | 'VENCIDO';
  
  criadoEm: string;
  atualizadoEm: string;
}

// -----------------------------------------------------------------------------
// ENTIDADE 3: analises_credito
// -----------------------------------------------------------------------------
export interface AnaliseCredito {
  id: string;
  protocolo: string;
  empresaId: string; // Empresa solicitante da análise
  empresaNome: string;
  clienteId: string;
  clienteNome: string;
  cnpjCpf: string;

  // Dados Cadastrais Snapshot
  dadosCadastrais: {
    razaoSocial: string;
    nomeFantasia: string;
    cnpjCpf: string;
    inscricaoEstadual?: string;
    dataFundacao?: string;
    cnaePrincipal?: string;
    ramoAtividade?: string;
    cidade: string;
    uf: string;
    capitalSocial?: number;
    faturamentoMensalEstimado: number;
    quadroSocietario: {
      nome: string;
      cpfCnpj: string;
      participacaoPerc: number;
      cargo: string;
    }[];
  };

  // Solicitação
  limiteSolicitado: number;
  prazoPagamentoSolicitadoDias: number;
  motivoSolicitacao: 'PRIMEIRA_ANALISE' | 'AUMENTO_LIMITE' | 'REVISAO_PERIODICA' | 'NOVO_PEDIDO_GRANDE' | 'DESBLOQUEIO';
  solicitanteNome: string;

  // Exposição Snapshot no momento da análise
  exposicaoNoMomento: {
    exposicaoAtualEmpresa: number;
    exposicaoProjetadaEmpresa: number;
    exposicaoAtualGrupo: number;
    exposicaoProjetadaGrupo: number;
    pedidosEmCarteiraValor: number;
    titulosVencidosValor: number;
    quantidadeTitulosVencidos: number;
  };

  // Histórico Interno Consolidado
  historicoInterno: {
    mesesRelacionamento: number;
    totalFaturadoHistorico: number;
    quantidadePedidosHistorico: number;
    maiorCompraValor: number;
    maiorAcumuloValor: number;
    mediaAtrasoDias: number;
    taxaPontualidadePerc: number; // Ex: 96.5%
    totalTitulosPagos: number;
    totalTitulosComAtraso: number;
  };

  // Consulta Externa de Bureau (Serasa / Provider)
  consultaBureau?: {
    consultaId: string;
    provedor: string;
    dataHoraConsulta: string;
    scoreBureau: number; // 0 a 1000
    probabilidadeInadimplencia: number; // Ex: 3.2%
    faixaRiscoBureau: string; // Ex: "Baixo Risco (B)"
    protestosQtd: number;
    protestosValor: number;
    pefinQtd: number;
    pefinValor: number;
    refinQtd: number;
    refinValor: number;
    acoesJudiciaisQtd: number;
    chequesSemFundoQtd: number;
    falenciasOuRecuperacoes: boolean;
  };

  // Motor de Score Interno
  resultadoScoreInterno: {
    scoreInternoFinal: number; // 0 a 1000
    faixaScore: string; // A+, A, B, C, D
    pontosHistorico: number;
    pontosRelacionamento: number;
    pontosVolume: number;
    pontosBureau: number;
    pontosRestricoes: number;
    limiteSugeridoMotor: number;
    prazoMaximoSugeridoDias: number;
    garantiaSugerida: TipoGarantiaExigida;
    recomendacao: RecomendacaoMotor;
    motivosRecomendacao: string[];
  };

  // Decisão Humana / Alçada
  decisao?: {
    status: StatusAnaliseCredito;
    limiteAprovado: number;
    limiteConsolidadoAprovado: number;
    prazoMaximoDias: number;
    garantiaExigida: TipoGarantiaExigida;
    parecerAprovador: string;
    aprovadorUsuarioId: string;
    aprovadorNome: string;
    aprovadorCargo: string;
    nivelAlcada: NivelAlcadaAprovacao;
    decididoEm: string;
    validadeAprovacao: string;
  };

  status: StatusAnaliseCredito;
  criadoEm: string;
  atualizadoEm: string;
}

// -----------------------------------------------------------------------------
// ENTIDADE 4: consultas_credito
// -----------------------------------------------------------------------------
export interface ConsultaCreditoBureau {
  id: string;
  empresaId: string;
  clienteId?: string;
  documento: string; // CNPJ ou CPF
  razaoSocialConsultada: string;
  provedor: string; // "MOCK_SERASA_EXPERIAN" | "SERASA_EXPERIAN" | "BOA_VISTA"
  tipoConsulta: 'COMPLETA_PJ' | 'SIMPLES_PF' | 'SCORE_APENAS' | 'RESTRICOES';
  
  // Resumo Retornado
  scoreRetornado: number;
  faixaRisco: string;
  probabilidadeInadimplenciaPerc: number;
  quantidadeProtestos: number;
  valorTotalProtestos: number;
  quantidadePendenciasFinanceiras: number;
  valorTotalPendencias: number;
  quantidadeAcoesJudiciais: number;
  chequesSemFundo: number;
  situacaoReceitaFederal: string;
  
  // Payload Estruturado
  payloadResposta: Record<string, unknown>;
  
  custoConsultaEstimado?: number;
  usuarioSolicitanteId: string;
  usuarioSolicitanteNome: string;
  dataHoraConsulta: string;
}

// -----------------------------------------------------------------------------
// ENTIDADE 5: bloqueios_credito
// -----------------------------------------------------------------------------
export interface BloqueioCredito {
  id: string;
  empresaId: string; // Empresa que aplicou o bloqueio ou "GLOBAL"
  clienteId: string;
  clienteNome: string;
  cnpjCpf: string;
  tipoBloqueio: 'AUTOMATICO_MOTOR' | 'MANUAL_USUARIO' | 'INTEGRACAO_FINANCEIRO';
  motivo: MotivoBloqueioCredito;
  detalhesMotivo: string;
  valorTitulosVencidos?: number;
  diasMaiorAtraso?: number;
  ativo: boolean;
  bloqueadoEm: string;
  bloqueadoPorUsuarioId?: string;
  bloqueadoPorUsuarioNome?: string;
  
  // Desbloqueio
  desbloqueadoEm?: string;
  desbloqueadoPorUsuarioId?: string;
  desbloqueadoPorUsuarioNome?: string;
  justificativaDesbloqueio?: string;
}

// -----------------------------------------------------------------------------
// ENTIDADE 6: historico_pagamentos
// -----------------------------------------------------------------------------
export interface HistoricoPagamentoItem {
  id: string;
  empresaId: string;
  empresaNome: string;
  clienteId: string;
  numeroTitulo: string;
  documentoOrigem: string; // Ex: NF-e 004523 ou Pedido 1045
  valorNominal: number;
  valorPago?: number;
  dataEmissao: string;
  dataVencimento: string;
  dataLiquidacao?: string;
  diasAtraso: number; // 0 se pago em dia
  status: StatusTituloPagamento;
  meioPagamento?: 'BOLETO' | 'PIX' | 'TRANSFERENCIA' | 'CARTAO_CREDITO';
}

// -----------------------------------------------------------------------------
// ENTIDADE 7: relacionamento_cliente_empresa
// -----------------------------------------------------------------------------
export interface RelacionamentoClienteEmpresa {
  id: string;
  clienteId: string;
  clienteNome: string;
  cnpjCpf: string;
  empresaId: string;
  empresaNome: string;
  
  // Indicadores Acumulados
  primeiraCompraData: string;
  ultimaCompraData: string;
  tempoRelacionamentoMeses: number;
  faturamentoTotalAcumulado: number;
  quantidadeTotalPedidos: number;
  ticketMedio: number;
  maiorCompraValor: number;
  maiorAcumuloFinanceiro: number;
  
  // Comportamento de Pagamento
  totalTitulosEmitidos: number;
  totalTitulosPagosEmDia: number;
  totalTitulosPagosComAtraso: number;
  totalTitulosVencidosNaoPagos: number;
  mediaDiasAtraso: number;
  maiorAtrasoHistoricoDias: number;
  indicePontualidadePerc: number;
  
  // Configurações Específicas
  tabelaPrecoPadrao?: string;
  condicaoPagamentoPadrao?: string;
  bloqueadoNestaEmpresa: boolean;
  motivoBloqueio?: string;
  
  atualizadoEm: string;
}
