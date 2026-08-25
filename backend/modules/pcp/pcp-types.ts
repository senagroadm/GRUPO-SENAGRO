// backend/modules/pcp/pcp-types.ts

export type StatusOrdemProducao =
  | 'PLANEJADA'
  | 'LIBERADA'
  | 'EM_ANDAMENTO'
  | 'PAUSADA'
  | 'CONCLUIDA'
  | 'CANCELADA';

export type PrioridadeProducao = 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAIXA';

export type SetorPcp =
  | 'CORTE_DOBRA'
  | 'USINAGEM'
  | 'CALDEIRARIA_SOLDA'
  | 'MONTAGEM'
  | 'PINTURA'
  | 'INSPECAO_QUALIDADE';

export type AlgoritmoOrdenacaoFila =
  | 'CRITICAL_RATIO'
  | 'EDD'
  | 'SPT'
  | 'FIFO'
  | 'PRIORIDADE_MANUAL';

export type AlgoritmoSequenciamento = AlgoritmoOrdenacaoFila;

export interface ManutencaoProgramada {
  id: string;
  maquinaId: string;
  maquinaNome: string;
  tipo: 'PREVENTIVA' | 'CORRETIVA' | 'CALIBRACAO';
  dataInicio: string;
  dataFim: string;
  horasParada: number;
  descricao: string;
  status: 'AGENDADA' | 'EM_EXECUCAO' | 'CONCLUIDA';
}

export interface CentroTrabalhoMaquina {
  id: string;
  codigo: string;
  nome: string;
  setor: SetorPcp;
  empresaId: string;
  capacidadeHorasDiaNominal: number;
  turnosTrabalho: number; // ex: 1, 2 ou 3 turnos de 8h
  eficienciaOEE: number; // ex: 0.85 (85%)
  capacidadeHorasDiaLiquida: number; // (horasNominais * turnos * OEE) - horasManutencao
  operadoresDisponiveis: number;
  operadoresNecessarios: number;
  taxaOcupacaoPercentual: number;
  cargaProgramadaHoras: number;
  statusOperacional: 'DISPONIVEL' | 'EM_OPERACAO' | 'MANUTENCAO' | 'GARGALO';
  manutencoesAgendadas: ManutencaoProgramada[];
}

export interface OperacaoProducaoOP {
  id: string;
  opId: string;
  ordemProducaoNumero: string;
  sequenciaOperacao: number;
  operacaoNome: string;
  setor: SetorPcp;
  maquinaId: string;
  maquinaNome: string;
  codigoItem: string;
  descricaoItem: string;
  clienteNome?: string;
  pedidoVendaId?: string;
  quantidade: number;
  tempoSetupHoras: number;
  tempoProcessamentoHoras: number;
  tempoTotalEstimadoHoras: number;
  dataInicioPrevista: string;
  dataFimPrevista: string;
  dataEntregaPrometida: string;
  prioridade: PrioridadeProducao;
  criticalRatio: number;
  posicaoFila: number;
  status: 'PENDENTE' | 'EM_PROCESSO' | 'CONCLUIDA' | 'BLOQUEADA';
  operadorDesignado?: string;
  observacoes?: string;
}

export type ItemFilaProducao = OperacaoProducaoOP;

export interface OrdemProducao {
  id: string;
  numero: string; // ex: OP-2026-001
  empresaId: string;
  codigoItem: string;
  descricaoItem: string;
  tipoItem: 'PRODUTO_FABRICADO' | 'SUB_CONJUNTO' | 'COMPONENTE';
  projetoId?: string;
  revisaoId?: string;
  pedidoVendaId?: string;
  pedidoVendaNumero?: string;
  clienteNome?: string;
  quantidadePlanejada: number;
  quantidadeProduzida: number;
  unidadeMedida: string;
  prioridade: PrioridadeProducao;
  status: StatusOrdemProducao;
  dataEmissao: string;
  dataInicioPrevista: string;
  dataFimPrevista: string;
  dataEntregaPrometida: string;
  leadTimeDias: number;
  loteMinimo: number;
  multiploLote: number;
  custoTotalEstimado: number;
  operacoes: OperacaoProducaoOP[];
  materiaisNecessarios: {
    itemCodigo: string;
    itemDescricao: string;
    quantidadePorUnidade: number;
    quantidadeTotal: number;
    unidadeMedida: string;
    percentualPerda: number;
    estoqueDisponivel: number;
    quantidadeReservada: number;
    quantidadeBloqueada: number;
    statusDisponibilidade: 'DISPONIVEL' | 'PARCIAL' | 'INDISPONIVEL';
  }[];
  origemRastreabilidade: {
    tipoOrigem: 'PEDIDO_VENDA' | 'ESTOQUE_SEGURANCA' | 'SUGESTAO_MRP' | 'DEMANDA_INDEPENDENTE';
    documentoOrigemId?: string;
    documentoOrigemNumero?: string;
    solicitante?: string;
    motivo: string;
  };
}

export interface DemandaBrutaConsolidada {
  id: string;
  codigoItem: string;
  descricaoItem: string;
  tipoItem: 'PRODUTO_FABRICADO' | 'SUB_CONJUNTO' | 'COMPONENTE' | 'MATERIA_PRIMA';
  unidadeMedida: string;
  quantidadeTotal: number;
  dataNecessidadeMaisProxima: string;
  origens: {
    tipo: 'PEDIDO_VENDA' | 'OP_EM_ANDAMENTO' | 'ESTOQUE_SEGURANCA';
    documentoId: string;
    documentoNumero: string;
    clienteNome?: string;
    quantidade: number;
    dataPrometida: string;
    prioridade: PrioridadeProducao;
    nivelEstrutura: number;
  }[];
}

export interface NecessidadeLiquidaItem {
  id: string;
  codigoItem: string;
  descricaoItem: string;
  tipoItem: 'MATERIA_PRIMA' | 'PRODUTO_FABRICADO' | 'COMPONENTE' | 'SUB_CONJUNTO';
  unidadeMedida: string;
  demandaBruta: number;
  demandaBrutaTotal?: number;
  estoqueFisicoTotal: number;
  materialBloqueado: number; // Quarentena / Não-conforme
  reservasAtivas: number; // Já comprometido
  estoqueDisponivelReal: number; // Físico - Bloqueado - Reservas
  comprasEmTransito: number; // Pedidos de compra já emitidos e pendentes
  producaoEmProcesso: number; // OPs já liberadas em fabricação
  estoqueSegurancaConfigurado: number;
  necessidadeLiquidaCalculada: number; // (DemandaBruta + EstoqueSeguranca) - (EstoqueDisponivelReal + ComprasEmTransito + ProducaoEmProcesso)
  leadTimeDias: number;
  loteMinimo: number;
  multiploLote: number;
  dataNecessidade: string;
  dataDisparoRecomendada: string;
  categoriaAcao: 'COMPRA' | 'PRODUCAO' | 'COBERTO_ESTOQUE' | 'COBERTO_PEDIDOS_ABERTOS';
  origemRastreavel: {
    pedidoVendaId?: string;
    pedidoNumero?: string;
    clienteNome?: string;
    opPaiId?: string;
    opPaiNumero?: string;
    nivelBOM: number;
  };
}

export interface SugestaoCompraMRP {
  id: string;
  codigoItem: string;
  descricaoItem: string;
  unidadeMedida: string;
  quantidadeCalculada: number;
  quantidadeSugeridaComLote: number; // Ajustada por lote mínimo e múltiplos
  loteMinimo: number;
  multiploCompra: number;
  fornecedorPreferencialNome: string;
  fornecedorPreferencialCnpj: string;
  precoUnitarioEstimado: number;
  valorTotalEstimado: number;
  leadTimeFornecedorDias: number;
  dataNecessidadeProducao: string;
  dataDisparoPedidoCompra: string; // dataNecessidade - leadTime
  pedidoCompraExistenteCobriu?: boolean; // Regra anti-duplicação
  numeroPedidoCompraExistente?: string;
  origemRastreavel: {
    pedidoVendaId?: string;
    pedidoNumero?: string;
    clienteNome?: string;
    opPaiId?: string;
    opPaiNumero?: string;
    nivelBOM: number;
    motivo: string;
  };
  status: 'PENDENTE' | 'CONVERTIDA_EM_SC' | 'DESCONSIDERADA';
}

export interface SugestaoProducaoMRP {
  id: string;
  codigoItem: string;
  descricaoItem: string;
  unidadeMedida: string;
  quantidadeCalculada: number;
  quantidadeSugeridaComLote: number;
  loteMinimoFabricacao: number;
  multiploFabricacao: number;
  leadTimeFabricacaoDias: number;
  dataNecessidadeEntrega: string;
  dataInicioProgramacao: string; // dataNecessidade - leadTime
  prioridadeSugerida: PrioridadeProducao;
  roteiroPadraoId?: string;
  setorPrincipal: SetorPcp;
  maquinaGargaloEstimada?: string;
  origemRastreavel: {
    pedidoVendaId?: string;
    pedidoNumero?: string;
    clienteNome?: string;
    opOrigemNumero?: string;
    motivo: string;
  };
  status: 'PENDENTE' | 'CONVERTIDA_EM_OP' | 'DESCONSIDERADA';
}

export type TipoRiscoAtraso =
  | 'LEAD_TIME_COMPRA_EXCEDIDO'
  | 'SOBRECARGA_MAQUINA'
  | 'MANUTENCAO_BLOQUEANTE'
  | 'MATERIAL_BLOQUEADO_QUARENTENA'
  | 'FALTA_OPERADORES'
  | 'CONFLITO_ENTREGA_PROMETIDA';

export interface RiscoAtrasoProducao {
  id: string;
  tipoRisco: TipoRiscoAtraso;
  nivelSeveridade: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAIXO';
  codigoItem: string;
  descricaoItem: string;
  opRelacionada?: string;
  pedidoRelacionado?: string;
  clienteNome?: string;
  dataPrometida: string;
  dataPrevisaoCalculada: string;
  diasAtrasoEstimados: number;
  mensagem: string;
  impactoDescricao: string;
  acaoRecomendada: string;
  setorAfetado?: SetorPcp;
  maquinaAfetada?: string;
}

export type RiscoAtrasoPCP = RiscoAtrasoProducao;
export type CapacidadeMaquinaPCP = CentroTrabalhoMaquina;
export type CapacidadeSetorPCP = SetorCapacidade;

export interface SetorCapacidade {
  setor: SetorPcp;
  nome: string;
  setorNome?: string;
  quantidadeMaquinas: number;
  quantidadeOperadores: number;
  capacidadeTotalHorasDia: number;
  cargaAlocadaHoras: number;
  cargaAlocadaHorasDia?: number;
  taxaOcupacaoPercentual: number;
  status: 'NORMAL' | 'ATENCAO' | 'GARGALO';
}

export interface GanttItem {
  id: string;
  opId: string;
  opNumero: string;
  operacaoNome: string;
  itemCodigo: string;
  itemDescricao: string;
  setor: SetorPcp;
  maquinaId: string;
  maquinaNome: string;
  dataInicio: string;
  dataFim: string;
  duracaoHoras: number;
  progressoPercentual: number;
  prioridade: PrioridadeProducao;
  status: string;
  dependencias: string[];
}

export type ItemGanttPCP = GanttItem;

export interface ResumoCalculoMRP {
  totalDemandasAnalisadas: number;
  totalItensNecessidadeLiquida: number;
  totalSugestoesCompra: number;
  valorTotalEstimadoCompras: number;
  totalSugestoesProducao: number;
  totalRiscosAtraso: number;
  totalRiscosCriticos: number;
  maquinasGargaloTotal: number;
}

export interface ResultadoCalculoMRP {
  dataExecucao: string;
  tempoProcessamentoMs: number;
  demandasBrutas: DemandaBrutaConsolidada[];
  necessidadesLiquidas: NecessidadeLiquidaItem[];
  sugestoesCompra: SugestaoCompraMRP[];
  sugestoesProducao: SugestaoProducaoMRP[];
  riscosAtraso: RiscoAtrasoProducao[];
  capacidadeMaquinas: CentroTrabalhoMaquina[];
  capacidadeSetores: SetorCapacidade[];
  gantt: GanttItem[];
  ganttInicial?: GanttItem[];
  resumo: ResumoCalculoMRP;
  totalDemandaAnalisada: number;
  totalComprasSugeridas: number;
  totalOpsSugeridas: number;
  totalRiscosIdentificados: number;
}
