/**
 * NEXUS ERP - Tipos do Módulo de Central de Cobrança, Gestão de Risco & Inadimplência
 * 
 * Regras de Arquitetura:
 * 1. Isolamento Multiempresa: Toda entidade carrega empresaId obrigatório.
 * 2. Parametrização da Régua: Gatilhos de 7 dias antes, 2 dias antes, vencimento e atraso são customizáveis.
 * 3. Não-Destrutivo: Nenhuma renegociação/cancelamento altera títulos sem trilha de auditoria append-only.
 * 4. Limite de Crédito: Considera rigorosamente Exposição Atual (títulos AR faturados) + Exposição Futura (pedidos aprovados em carteira/produção).
 */

export type CanalComunicacaoCobranca = 'EMAIL' | 'WHATSAPP' | 'SMS' | 'LIGACAO' | 'NOTIFICACAO_SISTEMA' | 'CARTA_REGISTRADA' | 'REUNIAO_PRESENCIAL';

export type StatusLembreteCobranca = 'AGENDADO' | 'ENVIADO' | 'ENTREGUE' | 'LIDO' | 'RESPONDIDO' | 'FALHA_ENVIO' | 'CANCELADO';

export type StatusBloqueioComercial = 'ATIVO' | 'SUSPENSO_POR_PROMESSA' | 'DESBLOQUEIO_TEMPORARIO' | 'LIBERACAO_EXCEPCIONAL_AUDITADA' | 'INATIVO';

export type MotivoBloqueioComercial =
  | 'INADIMPLENCIA_TITULOS_VENCIDOS'
  | 'EXPOSICAO_ACIMA_DO_LIMITE'
  | 'QUEBRA_DE_PROMESSA'
  | 'PROTESTO_OU_RESTRICAO_BUREAU'
  | 'SCORE_CREDITO_REBAIXADO'
  | 'CADASTRO_EXPIRADO'
  | 'BLOQUEIO_MANUAL_ADMINISTRATIVO';

export type StatusPromessaPagamento = 'PENDENTE' | 'CUMPRIDA' | 'CUMPRIDA_PARCIAL' | 'QUEBRADA' | 'CANCELADA';

export type TipoContatoCobranca =
  | 'LIGACAO_TELEFONICA'
  | 'WHATSAPP'
  | 'EMAIL_AUTOMATICO_REGUA'
  | 'EMAIL_MANUAL'
  | 'REUNIAO_PRESENCIAL'
  | 'NOTIFICACAO_EXTRAJUDICIAL'
  | 'PROTESTO_CARTORIO'
  | 'ACORDO_RENEGOCIACAO'
  | 'ANOTACAO_INTERNA';

export type SentimentoClienteCobranca = 'COOPERATIVO' | 'NEUTRO' | 'PROTESTANDO' | 'EVASIVO' | 'INCOMUNICAVEL' | 'LITIGIOSO';

export type StatusRenegociacaoAcordo = 'SIMULADO' | 'AGUARDANDO_ASSINATURA' | 'EFETIVADO' | 'CANCELADO' | 'QUEBRADO';

// -----------------------------------------------------------------------------
// 1. AGING LIST & MATRIZ DE VENCIMENTOS
// -----------------------------------------------------------------------------

export interface AgingFaixaValores {
  faixa: 'A_VENCER_MAIS_30' | 'A_VENCER_1_30' | 'VENCIDO_1_30' | 'VENCIDO_31_60' | 'VENCIDO_61_90' | 'VENCIDO_91_120' | 'VENCIDO_MAIS_120';
  label: string;
  valorTotal: number;
  quantidadeTitulos: number;
  percentualTotal: number;
  taxaPddPerc: number; // Provisão para Devedores Duvidosos (ex: 1%, 5%, 15%, 30%, 70%)
  valorPddEstimado: number;
}

export interface AgingClienteItem {
  clienteId: string;
  clienteNome: string;
  cnpjCpf: string;
  limiteCredito: number;
  exposicaoAtual: number;
  exposicaoFutura: number;
  exposicaoTotal: number;
  limiteDisponivel: number;
  scoreRisco: number; // 0-1000
  classificacaoRisco: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  statusBloqueio: StatusBloqueioComercial;
  diasMaiorAtraso: number;
  totalVencido: number;
  totalAVencer: number;
  totalGeral: number;
  valoresPorFaixa: {
    aVencerMais30: number;
    aVencer1a30: number;
    vencido1a30: number;
    vencido31a60: number;
    vencido61a90: number;
    vencido91a120: number;
    vencidoMais120: number;
  };
  titulosCount: number;
  temPromessaVigente: boolean;
  proximaAcaoSugerida: string;
}

export interface AgingMatrixResumo {
  empresaId: string;
  empresaNome: string;
  dataCalculo: string;
  totalCarteiraReceber: number;
  totalAVencer: number;
  totalVencido: number;
  taxaInadimplenciaGeralPerc: number;
  pddTotalCalculada: number;
  dsoMedioDias: number; // Days Sales Outstanding
  faixas: AgingFaixaValores[];
  clientes: AgingClienteItem[];
}

// -----------------------------------------------------------------------------
// 2. RÉGUA E REGRAS DE COBRANÇA (PARAMETRIZÁVEIS)
// -----------------------------------------------------------------------------

export interface GatilhoReguaCobranca {
  id: string;
  ordem: number;
  diasRelativoVencimento: number; // Ex: -7 (7 dias antes), -2 (2 dias antes), 0 (no dia), +3, +7, +15, +30
  fase: 'PRE_VENCIMENTO' | 'VENCIMENTO' | 'ATRASO_LEVE' | 'ATRASO_MEDIO' | 'ATRASO_GRAVE' | 'JURIDICO_CARTORIO';
  nomeRegra: string;
  descricao: string;
  ativo: boolean;
  canaisHabilitados: CanalComunicacaoCobranca[];
  acaoAutomaticaBloqueio: boolean; // Ex: Se chegar a +15d, bloqueia cliente automaticamente
  acaoAutomaticaProtesto: boolean; // Ex: Se chegar a +30d, gera alerta de cartório
  templateAssuntoEmail: string;
  templateMensagem: string; // Suporta tags: {{cliente_nome}}, {{numero_documento}}, {{valor_total}}, {{data_vencimento}}, {{dias_atraso}}, {{link_pix}}, {{link_boleto}}
}

export interface ReguaCobrancaConfig {
  id: string;
  empresaId: string;
  empresaNome: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  diasToleranciaAntesBloqueio: number; // Padrão: 10 dias
  bloquearAutomaticoEstouroLimite: boolean;
  bloquearAutomaticoAtraso: boolean;
  permitirDesbloqueioComPromessa: boolean;
  diasValidadePromessaPadrao: number; // Ex: 5 dias
  jurosMoraMensalPerc: number; // Padrão: 1.0% ao mês
  multaAtrasoPerc: number; // Padrão: 2.0%
  gatilhos: GatilhoReguaCobranca[];
  atualizadoEm: string;
  atualizadoPorUsuarioId: string;
}

// -----------------------------------------------------------------------------
// 3. LEMBRETES E COMUNICAÇÃO DE COBRANÇA
// -----------------------------------------------------------------------------

export interface LembreteCobranca {
  id: string;
  empresaId: string;
  clienteId: string;
  clienteNome: string;
  clienteCnpjCpf: string;
  clienteEmail: string;
  clienteTelefone: string;
  contaReceberId: string;
  parcelaId?: string;
  numeroDocumento: string;
  numeroParcela: number;
  valorNominal: number;
  valorTotalLiquido: number;
  dataVencimento: string;
  diasAtrasoOuAntecedencia: number; // Positivo = dias em atraso, Negativo = dias antes do vencimento
  gatilhoId?: string;
  nomeRegraGatilho: string;
  canal: CanalComunicacaoCobranca;
  assunto: string;
  conteudoMensagem: string;
  linkPixQrCode?: string;
  linhaDigitavelBoleto?: string;
  linkSegundaViaBoleto?: string;
  status: StatusLembreteCobranca;
  agendadoPara: string;
  disparadoEm?: string;
  entregueEm?: string;
  respostaRecebida?: string;
  usuarioDisparadorId?: string; // Se manual
  origem: 'REGUA_AUTOMATICA' | 'DISPARO_MANUAL';
  createdAt: string;
}

// -----------------------------------------------------------------------------
// 4. BLOQUEIOS COMERCIAIS & GOVERNANÇA DE CRÉDITO
// -----------------------------------------------------------------------------

export interface BloqueioComercialCliente {
  id: string;
  empresaId: string;
  clienteId: string;
  clienteNome: string;
  cnpjCpf: string;
  status: StatusBloqueioComercial;
  motivo: MotivoBloqueioComercial;
  detalhesMotivo: string;
  valorInadimplente: number;
  diasMaiorAtraso: number;
  exposicaoNoMomento: number;
  limiteNoMomento: number;
  bloqueadoAutomatico: boolean;
  bloqueadoEm: string;
  bloqueadoPorUsuarioId?: string;
  bloqueadoPorUsuarioNome?: string;
  
  // Desbloqueio Temporário / Exceção
  desbloqueadoEm?: string;
  desbloqueadoPorUsuarioId?: string;
  desbloqueadoPorUsuarioNome?: string;
  justificativaDesbloqueio?: string;
  validadeDesbloqueioTemporarioAte?: string;
  promessaIdVinculada?: string;

  // Auditoria
  historicoAcoes: {
    dataHora: string;
    acao: string;
    usuarioNome: string;
    justificativa: string;
  }[];
}

// -----------------------------------------------------------------------------
// 5. PROMESSAS DE PAGAMENTO
// -----------------------------------------------------------------------------

export interface PromessaPagamento {
  id: string;
  empresaId: string;
  clienteId: string;
  clienteNome: string;
  cnpjCpf: string;
  dataRegistro: string;
  dataPrometida: string; // YYYY-MM-DD
  valorPrometido: number;
  formaPagamentoPrevista: 'PIX' | 'BOLETO' | 'TED' | 'CARTAO_CREDITO' | 'CHEQUE' | 'DINHEIRO';
  contatoNome: string;
  contatoTelefoneOuEmail: string;
  observacoes: string;
  status: StatusPromessaPagamento;
  suspenderBloqueio: boolean;
  suspensaoValidaAte: string;
  titulosVinculados: {
    contaReceberId: string;
    parcelaId?: string;
    numeroDocumento: string;
    numeroParcela: number;
    valorOriginal: number;
    valorSaldoRestante: number;
  }[];
  registradoPorUsuarioId: string;
  registradoPorUsuarioNome: string;
  dataResolucao?: string;
  valorEfetivamentePago?: number;
  motivoCancelamentoOuQuebra?: string;
  auditoriaLogId?: string;
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// 6. HISTÓRICO DE CONTATO (CRM DE COBRANÇA)
// -----------------------------------------------------------------------------

export interface HistoricoContatoCobranca {
  id: string;
  empresaId: string;
  clienteId: string;
  clienteNome: string;
  cnpjCpf: string;
  dataHora: string;
  tipoContato: TipoContatoCobranca;
  canal: CanalComunicacaoCobranca;
  contatoNomeCliente: string;
  contatoCargoOuDepto?: string;
  telefoneOuEmailUtilizado: string;
  resumoConversa: string;
  detalhesAcordo?: string;
  sentimentoCliente: SentimentoClienteCobranca;
  gerouPromessaPagamento: boolean;
  promessaId?: string;
  dataProximoFollowUp?: string;
  proximaAcaoDescricao?: string;
  operadorUsuarioId: string;
  operadorUsuarioNome: string;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// 7. RENEGOCIAÇÃO DE DÍVIDAS & ACORDOS
// -----------------------------------------------------------------------------

export interface TituloRenegociacaoOrigem {
  contaReceberId: string;
  parcelaId?: string;
  numeroDocumento: string;
  numeroParcela: number;
  dataVencimentoOriginal: string;
  diasAtraso: number;
  valorOriginal: number;
  valorJurosOriginal: number;
  valorMultaOriginal: number;
  valorSaldoOriginal: number;
}

export interface ParcelaRenegociacaoGerada {
  numeroParcela: number;
  dataVencimento: string;
  valorNominal: number;
  valorJurosEmbutidos: number;
  valorTotalParcela: number;
  formaPagamentoPrevista: 'BOLETO' | 'PIX' | 'TED';
}

export interface RenegociacaoDivida {
  id: string;
  codigoAcordo: string; // Ex: 'ACD-2026-0042'
  empresaId: string;
  empresaNome: string;
  clienteId: string;
  clienteNome: string;
  cnpjCpf: string;
  status: StatusRenegociacaoAcordo;
  dataAcordo: string;
  
  // Totalizadores Originais
  totalPrincipalOriginal: number;
  totalJurosCalculados: number;
  totalMultaCalculada: number;
  totalDividaBruta: number;
  
  // Condições do Acordo Concedidas
  descontoConcedidoPrincipal: number;
  descontoConcedidoJurosMulta: number;
  totalDescontoGeral: number;
  valorFinalAcordado: number;
  
  // Estrutura de Pagamento
  valorEntrada: number;
  dataVencimentoEntrada?: string;
  quantidadeParcelas: number;
  intervaloDiasParcelas: number; // Ex: 30 dias
  taxaJurosParcelamentoMensal: number;
  primeiroVencimentoParcelas: string;
  
  // Títulos Vinculados
  titulosOrigem: TituloRenegociacaoOrigem[];
  parcelasNovas: ParcelaRenegociacaoGerada[];
  novosTitulosCriadosIds?: string[]; // IDs das novas Contas a Receber geradas
  
  // Governança & Alçada
  justificativaComercial: string;
  negociadorUsuarioId: string;
  negociadorUsuarioNome: string;
  aprovadorUsuarioId?: string;
  aprovadorUsuarioNome?: string;
  termoConfissaoDividaGerado: boolean;
  termoStoragePath?: string;
  
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// 8. CRÉDITO POR CLIENTE / EMPRESA (EXPOSIÇÃO ATUAL + FUTURA)
// -----------------------------------------------------------------------------

export interface ExposicaoCreditoCliente {
  clienteId: string;
  clienteNome: string;
  cnpjCpf: string;
  empresaId: string;
  empresaNome: string;
  
  // Limites
  limiteConcedido: number;
  limiteTemporario: number;
  validadeLimiteTemporario?: string;
  limiteTotalEfetivo: number;
  
  // Exposição Atual (Títulos Faturados no Contas a Receber)
  titulosAVencerValor: number;
  titulosAVencerQtd: number;
  titulosVencidosValor: number;
  titulosVencidosQtd: number;
  exposicaoAtual: number; // aVencer + vencidos
  
  // Exposição Futura (Pedidos Aprovados e Faturamento Pendente)
  pedidosCarteiraAprovadosValor: number;
  pedidosCarteiraQtd: number;
  ordensProducaoEmAndamentoValor: number;
  faturamentoPendenteValor: number;
  exposicaoFutura: number; // pedidos + ordens + faturamento pendente
  
  // Exposição Total & Disponibilidade
  exposicaoTotal: number; // atual + futura
  limiteDisponivel: number; // limiteTotalEfetivo - exposicaoTotal
  percentualUtilizacaoLimite: number; // (exposicaoTotal / limiteTotalEfetivo) * 100
  
  // Avaliação de Risco
  scoreInterno: number;
  scoreBureauSerasa: number;
  faixaRisco: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  statusBloqueio: StatusBloqueioComercial;
  diasMaiorAtrasoAtual: number;
  dataUltimaRevisaoLimite: string;
  proximaRevisaoLimiteData: string;
  
  // Desdobramento por todas as 5 empresas do Grupo TRITECH
  desdobramentoGrupo: {
    empresaId: string;
    empresaCodigo: string;
    empresaNome: string;
    exposicaoAtual: number;
    exposicaoFutura: number;
    exposicaoTotal: number;
  }[];
}

// -----------------------------------------------------------------------------
// 9. TRILHA DE AUDITORIA DE COBRANÇA E RISCO (APPEND-ONLY)
// -----------------------------------------------------------------------------

export interface AuditoriaCobrancaRiscoLog {
  id: string;
  empresaId: string;
  usuarioId: string;
  usuarioNome: string;
  dataHora: string;
  modulo: 'CENTRAL_COBRANCA' | 'RISCO_CREDITO' | 'REGUA_COBRANCA' | 'BLOQUEIO_COMERCIAL' | 'RENEGOCIACAO' | 'PROMESSA_PAGAMENTO';
  acao:
    | 'ALTERACAO_REGUA_PARAMETROS'
    | 'DISPARO_LEMBRETE_AUTOMATICO'
    | 'DISPARO_LEMBRETE_MANUAL'
    | 'BLOQUEIO_CLIENTE_APLICADO'
    | 'DESBLOQUEIO_CLIENTE_MANUAL'
    | 'LIBERACAO_EXCEPCIONAL_AUDITADA'
    | 'REGISTRO_PROMESSA_PAGAMENTO'
    | 'PROMESSA_CUMPRIDA'
    | 'PROMESSA_QUEBRADA'
    | 'SIMULACAO_RENEGOCIACAO'
    | 'EFETIVACAO_RENEGOCIACAO_ACORDO'
    | 'CANCELAMENTO_RENEGOCIACAO'
    | 'ALTERACAO_LIMITE_CREDITO'
    | 'REGISTRO_CONTATO_CRM';
  entidadeAfetada: string;
  entidadeId: string;
  clienteId?: string;
  clienteNome?: string;
  justificativa?: string;
  payloadBefore?: Record<string, unknown>;
  payloadAfter?: Record<string, unknown>;
  ipOrigem?: string;
}

// -----------------------------------------------------------------------------
// 10. DASHBOARD CONSOLIDADO DA CENTRAL DE COBRANÇA
// -----------------------------------------------------------------------------

export interface CentralCobrancaDashboardData {
  empresaId: string;
  empresaNome: string;
  dataReferencia: string;
  
  // KPIs Principais
  totalCarteiraReceber: number;
  totalEmDiaAVencer: number;
  totalVencidoInadimplente: number;
  percentualInadimplencia: number;
  pddTotalEstimada: number;
  dsoMedioDias: number;
  
  // Contadores Operacionais
  clientesTotalDevedores: number;
  clientesBloqueadosTotal: number;
  promessasPagamentoAtivasQtd: number;
  promessasPagamentoAtivasValor: number;
  renegociacoesVigentesQtd: number;
  renegociacoesVigentesValor: number;
  lembretesDisparadosHoje: number;
  
  // Resumos Estruturados
  aging: AgingMatrixResumo;
  filaCobrancaPriorizada: AgingClienteItem[];
  bloqueiosAtivos: BloqueioComercialCliente[];
  promessasRecentes: PromessaPagamento[];
  renegociacoesRecentes: RenegociacaoDivida[];
  contatosRecentes: HistoricoContatoCobranca[];
  auditoriaRecente: AuditoriaCobrancaRiscoLog[];
}
