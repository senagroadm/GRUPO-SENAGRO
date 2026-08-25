// backend/modules/pcp/pcp-types.ts
// Módulo de Planejamento e Controle da Produção (PCP) & MRP Inicial
// Análise determinística de Pedidos, OPs, BOM, Estoque, Reservas, Compras Abertas, Lead Times,
// Capacidade de Máquinas, Operadores e Manutenção para gerar Necessidades Líquidas, Sugestões e Gantt.

export type SetorPcp =
  | 'CORTE_LASER'
  | 'DOBRA_CNC'
  | 'CALDEIRARIA_SOLDA'
  | 'USINAGEM'
  | 'PINTURA_TRATAMENTO'
  | 'MONTAGEM'
  | 'INSPECAO_QUALIDADE';

export type StatusOP =
  | 'PLANEJADA'
  | 'LIBERADA'
  | 'EM_PROCESSO'
  | 'PAUSADA'
  | 'CONCLUIDA'
  | 'CANCELADA';

export type PrioridadeProducao =
  | 'URGENTE'
  | 'ALTA'
  | 'NORMAL'
  | 'BAIXA';

export type StatusOperacaoOP =
  | 'NA_FILA'
  | 'EM_SETUP'
  | 'EM_EXECUCAO'
  | 'PAUSADA'
  | 'CONCLUIDA'
  | 'BLOQUEADA';

export type StatusMateriaPrimaOP =
  | 'TOTALMENTE_DISPONIVEL'
  | 'PARCIALMENTE_DISPONIVEL'
  | 'AGUARDANDO_COMPRA'
  | 'BLOQUEADA_QUALIDADE';

export type AlgoritmoOrdenacaoFila =
  | 'CRITICAL_RATIO'
  | 'EARLIEST_DUE_DATE'
  | 'SHORTEST_PROCESSING_TIME'
  | 'FIFO'
  | 'PRIORIDADE_MANUAL';

export type AlgoritmoSequenciamento = AlgoritmoOrdenacaoFila;

export interface ItemFilaProducao {
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
  quantidade: number;
  tempoSetupHoras: number;
  tempoProcessamentoHoras: number;
  dataEntregaPrometida: string;
  prioridade: PrioridadeProducao;
  criticalRatio: number;
  posicaoFila: number;
  status: string;
}

export type RiscoAtrasoPCP = RiscoAtrasoProducao;
export type CapacidadeMaquinaPCP = CentroTrabalhoMaquina;
export type CapacidadeSetorPCP = SetorCapacidade;
export type ItemGanttPCP = GanttItem;

export interface OperacaoProducaoOP {
  id: string;
  opId: string;
  sequencia: number;
  operacaoNome: string;
  setor: SetorPcp;
  maquinaId: string;
  maquinaNome: string;
  ferramenta?: string;
  tempoSetupMinutos: number;
  tempoCicloMinutos: number;
  tempoTotalMinutos: number;
  status: StatusOperacaoOP;
  dataInicioPrevista: string;
  dataFimPrevista: string;
  dataInicioReal?: string;
  dataFimReal?: string;
  operadorAlocadoId?: string;
  operadorAlocadoNome?: string;
  posicaoFila: number;
  motivoBloqueio?: string;
  instrucaoTecnica?: string;
}

export interface MaterialRequeridoOP {
  id: string;
  codigo: string;
  descricao: string;
  tipo: 'MATERIA_PRIMA' | 'COMPONENTE' | 'SUB_CONJUNTO' | 'FIXACAO' | 'CONSUMIVEL';
  quantidadeLiquidaPorUnidade: number;
  percentualPerda: number;
  quantidadeTotalNecessaria: number;
  unidadeMedida: string;
  quantidadeDisponivelEstoque: number;
  quantidadeReservada: number;
  quantidadePendenteCompra: number;
  atendido: boolean;
  custoUnitarioEstimado: number;
}

export interface OrdemProducao {
  id: string;
  empresaId: string;
  numeroOp: string; // Ex: 'OP-2026-0101'
  origemTipo: 'PEDIDO_VENDA' | 'ESTOQUE_MINIMO' | 'MANUAL' | 'SUGESTAO_MRP';
  pedidoVendaId?: string;
  pedidoVendaNumero?: string;
  clienteNome?: string;
  projetoId: string;
  projetoCodigo: string;
  projetoTitulo: string;
  revisaoId: string;
  revisaoVersao: string;
  codigoItem: string;
  descricaoItem: string;
  quantidadePlanejada: number;
  quantidadeProduzida: number;
  quantidadeRefugo: number;
  unidadeMedida: string;
  status: StatusOP;
  prioridade: PrioridadeProducao;
  criticalRatio: number;
  folgaDias: number;
  dataEmissao: string;
  dataInicioPrevista: string;
  dataFimPrevista: string;
  dataEntregaPrometida: string;
  dataInicioReal?: string;
  dataFimReal?: string;
  leadTimeFabricacaoHoras: number;
  statusMateriaPrima: StatusMateriaPrimaOP;
  operacoes: OperacaoProducaoOP[];
  materiaisRequeridos: MaterialRequeridoOP[];
  observacoes?: string;
}

export interface OrigemDemandaRastreavel {
  tipoOrigem: 'PEDIDO_VENDA' | 'ORDEM_PRODUCAO' | 'ESTOQUE_MINIMO' | 'PROJETO_BOM';
  documentoOrigemId: string;
  documentoOrigemNumero: string;
  clienteNome?: string;
  quantidadeDemandada: number;
  dataPrometida: string;
  justificativaCalculo: string;
}

export interface NecessidadeLiquidaItem {
  id: string;
  empresaId: string;
  codigoItem: string;
  descricao: string;
  tipoItem: 'MATERIA_PRIMA' | 'PRODUTO_FABRICADO' | 'COMPONENTE' | 'SUB_CONJUNTO';
  unidadeMedida: string;
  demandaBruta: number;
  demandaBrutaTotal?: number;
  estoqueFisicoTotal: number;
  materialBloqueado: number;
  reservasAtivas: number;
  estoqueLiquidoDisponivel: number;
  comprasAbertasEmTransito: number;
  opsEmAndamento: number;
  necessidadeLiquidaCalculada: number;
  leadTimeDias: number;
  dataLimiteNecessidade: string;
  dataSugeridaDisparo: string;
  origensDemanda: OrigemDemandaRastreavel[];
}

export interface SugestaoCompraMRP {
  id: string;
  empresaId: string;
  codigoItem: string;
  descricao: string;
  unidadeMedida: string;
  quantidadeSugerida: number;
  precoEstimadoUnitario: number;
  valorTotalEstimado: number;
  fornecedorPreferencialNome: string;
  leadTimeCompraDias: number;
  dataNecessidadeFabrica: string;
  dataSugeridaEmissaoCompra: string;
  urgencia: 'NORMAL' | 'URGENTE' | 'CRITICA';
  jaExisteCompraAberta: boolean;
  numeroCompraAbertaExistente?: string;
  status: 'PENDENTE' | 'CONVERTIDA_SOLICITACAO' | 'IGNORADA';
  solicitacaoCompraGeradaId?: string;
  origemRastreavel: OrigemDemandaRastreavel[];
  motivoCalculo: string;
}

export interface SugestaoProducaoMRP {
  id: string;
  empresaId: string;
  codigoItem: string;
  descricao: string;
  unidadeMedida: string;
  projetoId: string;
  projetoCodigo: string;
  revisaoId: string;
  revisaoVersao: string;
  quantidadeSugerida: number;
  leadTimeFabricacaoDias: number;
  leadTimeFabricacaoHoras: number;
  dataNecessidadeEntrega: string;
  dataSugeridaInicioProducao: string;
  status: 'PENDENTE' | 'CONVERTIDA_OP' | 'IGNORADA';
  opGeradaId?: string;
  origemRastreavel: OrigemDemandaRastreavel[];
  motivoCalculo: string;
}

export type TipoRiscoAtraso =
  | 'SUPRIMENTO_ATRASADO'
  | 'SOBRECARGA_CAPACIDADE'
  | 'MANUTENCAO_MAQUINA'
  | 'FALTA_OPERADOR'
  | 'PRAZO_ESTOURADO';

export interface RiscoAtrasoProducao {
  id: string;
  empresaId: string;
  tipoRisco: TipoRiscoAtraso;
  nivelSeveridade: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  opId?: string;
  opNumero?: string;
  maquinaId?: string;
  maquinaNome?: string;
  setor?: SetorPcp;
  codigoItem?: string;
  titulo: string;
  descricao: string;
  impactoDias: number;
  acaoSugerida: string;
  dataDeteccao: string;
}

export interface CentroTrabalhoMaquina {
  id: string;
  empresaId: string;
  codigo: string;
  nome: string;
  setor: SetorPcp;
  capacidadeHorasDiaNominal: number;
  taxaEficienciaOEE: number;
  capacidadeHorasDiaLiquida: number;
  cargaProgramadaHoras: number;
  taxaOcupacaoPercentual: number;
  status: 'DISPONIVEL' | 'EM_PROCESSO' | 'SOBRECARREGADA' | 'EM_MANUTENCAO' | 'PARADA_SETUP';
  operadorPadraoNome?: string;
}

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

export interface OperadorProducao {
  id: string;
  empresaId: string;
  matricula: string;
  nome: string;
  setor: SetorPcp;
  turno: 'TURNO_1' | 'TURNO_2' | 'TURNO_3';
  qualificacoes: string[];
  disponibilidadeHorasDia: number;
  horasAlocadasDia: number;
  status: 'DISPONIVEL' | 'ALOCADO' | 'AFASTADO' | 'FERIAS';
}

export interface ManutencaoMaquina {
  id: string;
  empresaId: string;
  maquinaId: string;
  maquinaNome: string;
  tipo: 'PREVENTIVA' | 'CORRETIVA' | 'PREDITIVA' | 'CALIBRACAO';
  descricao: string;
  dataInicio: string;
  dataFim: string;
  duracaoHoras: number;
  impactaCapacidade: boolean;
  status: 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
  tecnicoResponsavel: string;
}

export interface TurnoFabril {
  id: string;
  nome: string;
  inicio: string; // '06:00'
  fim: string; // '15:48'
  horasUteis: number; // 8.8h
}

export interface ParadaFabril {
  id: string;
  data: string;
  descricao: string;
  tipo: 'FERIADO' | 'PARADA_COLETIVA' | 'MANUTENCAO_GERAL';
}

export interface CalendarioFabril {
  empresaId: string;
  diasUteisSemana: number[]; // [1, 2, 3, 4, 5] = Seg a Sex
  turnos: TurnoFabril[];
  paradas: ParadaFabril[];
}

export interface GanttItem {
  id: string;
  opId: string;
  opNumero: string;
  projetoCodigo: string;
  clienteNome?: string;
  codigoItem: string;
  descricao: string;
  operacaoId?: string;
  operacaoNome?: string;
  sequencia?: number;
  setor: SetorPcp;
  maquinaNome: string;
  dataInicio: string;
  dataFim: string;
  progressoPercentual: number;
  status: string;
  prioridade: PrioridadeProducao;
  temRiscoAtraso: boolean;
  motivoRisco?: string;
  dependencias: string[];
}

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
  totalGargalosIdentificados: number;
}
