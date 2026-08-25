export type StatusPedido =
  | 'RASCUNHO'
  | 'PENDENTE'
  | 'APROVACAO'
  | 'APROVADO'
  | 'EM_EXECUCAO'
  | 'PARCIAL'
  | 'PRONTO'
  | 'EXPEDIDO'
  | 'FATURADO'
  | 'CONCLUIDO'
  | 'CANCELADO';

export type OrigemPedido = 'ORCAMENTO' | 'DIRETO';

export type TipoItemPedido = 'PRODUTO_PRONTO' | 'PRODUTO_FABRICADO' | 'SERVICO' | 'PRODUTO_SERVICO';

export type TipoAprovacaoPedido =
  | 'LIMITE_CREDITO'
  | 'MARGEM_MINIMA'
  | 'DESCONTO_EXCESSIVO'
  | 'PRAZO_ESPECIAL'
  | 'MUDANCA_CRITICA_REABERTURA';

export type StatusAprovacao = 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'CANCELADO';

export type NivelAlcadaPedido =
  | 'VENDEDOR'
  | 'GERENTE_COMERCIAL'
  | 'GERENTE_FINANCEIRO'
  | 'DIRETOR_INDUSTRIAL'
  | 'DIRETOR_GERAL';

export type StatusEntrega =
  | 'PROGRAMADA'
  | 'EM_SEPARACAO'
  | 'PRONTA_EXPEDICAO'
  | 'EXPEDIDA'
  | 'ENTREGUE'
  | 'CANCELADA';

export type StatusParcela = 'PENDENTE' | 'FATURADO' | 'LIQUIDADO' | 'CANCELADO';

export type TipoNecessidadeGerada =
  | 'NENHUMA'
  | 'ORDEM_PRODUCAO'
  | 'SOLICITACAO_COMPRA'
  | 'RESERVA_ESTOQUE';

export type TipoFrete = 'CIF' | 'FOB' | 'RETIRA' | 'SEM_FRETE';

/**
 * Item individual do Pedido de Venda
 */
export interface PedidoItem {
  id: string;
  pedidoId: string;
  numeroItem: number;
  produtoId?: string;
  codigoItem: string;
  descricao: string;
  tipoItem: TipoItemPedido;
  ncm: string;
  unidadeMedida: string; // UN, PC, KG, M, CJ
  quantidade: number;
  quantidadeEntregue: number;
  quantidadeFaturada: number;
  quantidadeReservadaEstoque: number;
  quantidadePendenteProducao: number;
  precoUnitario: number;
  descontoPerc: number;
  valorDesconto: number;
  precoLiquido: number;
  valorTotal: number;
  aliquotaIpi: number;
  valorIpi: number;
  aliquotaIcms: number;
  valorIcms: number;
  custoUnitarioEstimado: number;
  custoTotalEstimado: number;
  margemItemPerc: number;
  prazoItemDias: number;
  dataPrometidaItem: string;
  necessidadeGerada: {
    tipo: TipoNecessidadeGerada;
    documentoReferenciaId?: string;
    statusDocumento?: string;
    numeroOp?: string;
    numeroSc?: string;
    geradoEm?: string;
  };
  especificacaoTecnica?: {
    processoCorte?: string;
    processoDobra?: string;
    processoSolda?: string;
    processoPintura?: string;
    materiaPrimaBase?: string;
    espessuraMm?: number;
    pesoUnitarioKg?: number;
    desenhoArquivoUrl?: string;
    observacaoEngenharia?: string;
  };
}

/**
 * Parcela financeira do Pedido
 */
export interface PedidoParcela {
  id: string;
  pedidoId: string;
  numeroParcela: number;
  totalParcelas: number;
  diasVencimento: number; // Ex: 30, 60, 90
  dataVencimento: string; // YYYY-MM-DD
  percentualParcela: number; // Ex: 33.33%
  valorParcela: number;
  formaPagamento: string; // Boleto, PIX, Transferência, Carta de Crédito
  status: StatusParcela;
  tituloReceberId?: string;
  observacao?: string;
}

/**
 * Remessa/Entrega programada do Pedido
 */
export interface PedidoEntrega {
  id: string;
  pedidoId: string;
  numeroRemessa: number;
  dataPrometidaEntrega: string;
  dataPrevisaoDespacho: string;
  dataEfetivaEntrega?: string;
  itens: {
    pedidoItemId: string;
    codigoItem: string;
    descricao: string;
    quantidadeProgramada: number;
    quantidadeExpedida: number;
    quantidadeEntregue: number;
    unidadeMedida: string;
  }[];
  statusEntrega: StatusEntrega;
  codigoRastreio?: string;
  transportadora?: string;
  notaFiscalNumero?: string;
  observacoes?: string;
}

/**
 * Aprovação de Alçada (Crédito, Margem, Mudança Crítica)
 */
export interface PedidoAprovacao {
  id: string;
  pedidoId: string;
  tipoAprovacao: TipoAprovacaoPedido;
  motivoExigencia: string;
  nivelAlcadaRequerido: NivelAlcadaPedido;
  status: StatusAprovacao;
  solicitadoPor: string;
  solicitadoEm: string;
  aprovadoPor?: string;
  cargoAprovador?: string;
  aprovadoEm?: string;
  parecerAprovador?: string;
}

/**
 * Snapshot inalterável da versão comercial congelada aprovada do orçamento
 */
export interface VersaoComercialCongelada {
  orcamentoId: string;
  orcamentoNumero: string;
  versaoNumero: number;
  congeladoEm: string;
  dataAprovacaoOrcamento: string;
  tabelaPrecoOriginal: string;
  condicaoPagamentoOriginal: string;
  margemContribuicaoOriginalPerc: number;
  custoTotalPrevistoOriginal: number;
  valorTotalOriginal: number;
  impostosTotaisOriginais: number;
  itensSnapshot: {
    itemNumero: number;
    codigoItem: string;
    descricao: string;
    tipoItem: TipoItemPedido;
    quantidade: number;
    precoUnitario: number;
    valorTotal: number;
    custoUnitario: number;
    margemPerc: number;
    tempoFabricacaoTotalMinutos?: number;
  }[];
  hashIntegridade: string;
}

/**
 * Resultado da validação de crédito no momento do pedido
 */
export interface ValidacaoCreditoPedido {
  statusValidacao: 'APROVADO' | 'REPROVADO' | 'EXIGE_APROVACAO_ALCADA' | 'ISENTO';
  limiteEmpresaDisponivel: number;
  limiteGrupoDisponivel: number;
  exposicaoProjetadaEmpresa: number;
  exposicaoProjetadaGrupo: number;
  possuiBloqueioAtivo: boolean;
  motivoBloqueio?: string;
  dataValidacao: string;
  detalhesValidacao: string;
}

/**
 * Resultado da validação de margem mínima
 */
export interface ValidacaoMargemPedido {
  statusValidacao: 'DENTRO_DA_MARGEM' | 'ABAIXO_MARGEM_MINIMA' | 'EXIGE_ALCADA';
  margemCalculadaPerc: number;
  margemMinimaRequeridaPerc: number;
  diferencaPerc: number;
  aprovacaoObrigatoria: boolean;
  detalhes: string;
}

/**
 * Registro de histórico de transição de status
 */
export interface TransicaoStatusLog {
  id: string;
  pedidoId: string;
  statusAnterior: StatusPedido;
  novoStatus: StatusPedido;
  dataTransicao: string;
  usuarioId: string;
  usuarioNome: string;
  motivo?: string;
  detalhes?: string;
}

/**
 * Entidade Principal: Pedido de Venda
 */
export interface PedidoVenda {
  id: string;
  numero: string; // Ex: PED-2026-0001
  empresaId: string;
  empresaNome: string;
  clienteId: string;
  clienteNome: string;
  clienteCnpjCpf: string;
  origem: OrigemPedido;
  orcamentoOrigemId?: string;
  orcamentoNumero?: string;
  orcamentoVersaoId?: string;
  versaoComercialCongelada?: VersaoComercialCongelada;
  status: StatusPedido;
  
  // Valores e Totais
  valorTotalProdutos: number;
  valorFrete: number;
  valorDesconto: number;
  valorOutrasDespesas: number;
  valorIpiTotal: number;
  valorIcmsTotal: number;
  valorTotalPedido: number;
  custoTotalEstimado: number;
  margemContribuicaoEstimadaPerc: number;
  margemMinimaEmpresaPerc: number;

  // Logística e Transporte
  tipoFrete: TipoFrete;
  transportadoraNome?: string;
  transportadoraCnpj?: string;

  // Prazos e Datas
  prazoPrometido: string; // ISO string data acordada com cliente
  dataEmissao: string;
  dataEntregaDesejada: string;
  dataPrevisaoProducao?: string;
  dataEfetivaConclusao?: string;
  leadTimeDiasCalculado: number;

  // Comercial
  vendedorId: string;
  vendedorNome: string;
  canalVenda: string;
  condicaoPagamento: string;
  formaPagamento: string;
  tabelaPreco: string;
  observacoesComerciais?: string;
  observacoesProducao?: string;

  // Validações Automáticas
  validacaoCredito: ValidacaoCreditoPedido;
  validacaoMargem: ValidacaoMargemPedido;
  statusEstoque: 'NAO_APLICAVEL' | 'TOTALMENTE_RESERVADO' | 'PARCIALMENTE_RESERVADO' | 'AGUARDANDO_RESERVA' | 'SEM_ESTOQUE';
  statusNecessidades: 'NAO_GERADO' | 'NECESSIDADES_GERADAS' | 'ORDENS_EM_ANDAMENTO' | 'ORDENS_CONCLUIDAS';

  // Coleções Filhas (Agregações)
  itens: PedidoItem[];
  parcelas: PedidoParcela[];
  entregas: PedidoEntrega[];
  aprovacoes: PedidoAprovacao[];
  historicoTransicoes: TransicaoStatusLog[];

  // Versionamento & Controle de Alterações Críticas
  revisoesCount: number;
  versaoAtual: number;
  bloqueadoParaEdicao: boolean;
  motivoBloqueioEdicao?: string;

  criadoEm: string;
  atualizadoEm: string;
}

/**
 * Parâmetros de Política Comercial por Empresa
 */
export interface PoliticaVendaEmpresa {
  empresaId: string;
  margemMinimaPermitidaPerc: number; // Ex: 16.0%
  toleranciaVariacaoReaberturaPerc: number; // Ex: 2.0%
  toleranciaVariacaoReaberturaValor: number; // Ex: R$ 500.00
  exigirAprovacaoCredito: boolean;
  exigirAprovacaoMargem: boolean;
  reservaAutomaticaAoAprovar: boolean;
  geracaoAutomaticaOPAoAprovar: boolean;
}
