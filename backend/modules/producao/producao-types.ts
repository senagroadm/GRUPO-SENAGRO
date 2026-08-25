// backend/modules/producao/producao-types.ts

export type StatusOrdemProducao =
  | 'CRIADA'
  | 'LIBERADA'
  | 'EM_PRODUCAO'
  | 'PAUSADA'
  | 'CONCLUIDA'
  | 'ENCERRADA_PARCIAL'
  | 'CANCELADA';

export type TipoOrdemProducao = 'TOTAL' | 'PARCIAL' | 'RETRABALHO' | 'COMPLEMENTAR';

export type PrioridadeProducao = 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAIXA';

export type StatusOperacaoOP =
  | 'AGUARDANDO_ANTERIOR'
  | 'PRONTA_PARA_INICIO'
  | 'EM_SETUP'
  | 'EM_PRODUCAO'
  | 'EM_PARADA'
  | 'CONCLUIDA'
  | 'CONCLUIDA_PARCIAL';

export type TipoApontamento =
  | 'SETUP'
  | 'PRODUCAO'
  | 'FINALIZACAO_OPERACAO'
  | 'CONSUMO_MATERIAL'
  | 'AJUSTE_QUALIDADE';

export type MotivoParadaCategoria =
  | 'FALTA_MATERIAL'
  | 'QUEBRA_MAQUINA'
  | 'MANUTENCAO_CORRETIVA'
  | 'FALTA_ENERGIA'
  | 'TROCA_FERRAMENTA'
  | 'AJUSTE_PROGRAMA_CNC'
  | 'INSPECAO_QUALIDADE_AGUARDANDO'
  | 'ALMOCO_INTERVALO'
  | 'LIMPEZA_SETUP'
  | 'OUTROS';

export type MotivoRefugoCategoria =
  | 'DEFEITO_DIMENSIONAL'
  | 'DEFEITO_CORTE_LASER'
  | 'TRINCA_SOLDA'
  | 'ERRO_PROGRAMACAO_CNC'
  | 'MATERIAL_COM_DEFEITO_USINA'
  | 'ERRO_OPERACIONAL'
  | 'ACABAMENTO_FORA_PADRAO'
  | 'OUTROS';

export type MotivoRetrabalhoCategoria =
  | 'RECORTE_REBARBA'
  | 'REDOBRA_AJUSTE'
  | 'RESSOLDA_RETOQUE'
  | 'REPASSAGEM_ROSCA'
  | 'LIXAMENTO_POLIMENTO'
  | 'REPINTURA'
  | 'AJUSTE_DIMENSIONAL'
  | 'OUTROS';

/**
 * Entidade: op_materiais
 * Controle dos materiais alocados para a OP com previsão da BOM e consumo real apontado
 */
export interface OpMaterial {
  id: string;
  opId: string;
  itemCodigo: string;
  itemDescricao: string;
  tipoItem: string; // 'MATERIA_PRIMA' | 'COMPONENTE' | 'FIXACAO' | 'CONSUMIVEL'
  unidadeMedida: string;
  quantidadePorUnidade: number;
  percentualPerdaPrevisto: number;
  quantidadePrevistaTotal: number;
  quantidadeRealConsumida: number;
  saldoRestanteConsumo: number;
  custoUnitario: number;
  custoTotalPrevisto: number;
  custoTotalReal: number;
  loteMateriaPrima?: string;
  certificadoUsina?: string;
  statusConsumo: 'PENDENTE' | 'CONSUMO_PARCIAL' | 'BAIXADO_TOTAL' | 'CONSUMO_EXCEDIDO';
}

/**
 * Entidade: op_operacoes
 * Etapas da rota de fabricação copiadas do roteiro da engenharia
 */
export interface OpOperacao {
  id: string;
  opId: string;
  sequencia: number; // 10, 20, 30, 40...
  nomeOperacao: string;
  setor: string; // 'CORTE_LASER' | 'DOBRA_CNC' | 'CALDEIRARIA_SOLDA' | 'USINAGEM' | 'PINTURA' | 'MONTAGEM' | 'INSPECAO'
  maquinaId: string;
  maquinaNome: string;
  ferramenta?: string;
  operadorDesignado?: string;
  tempoSetupPadraoMinutos: number;
  tempoCicloPadraoMinutos: number;
  tempoTotalPadraoMinutos: number;
  custoHoraMaquina: number;
  custoHoraMaoDeObra: number;
  
  // Quantidades no fluxo sequencial:
  quantidadeTotalPrevista: number;
  quantidadeDisponivelEntrada: number; // Liberada da operação anterior (ou inicial para sequencia 10)
  quantidadeProduzidaBoas: number; // Peças boas produzidas e liberadas para a próxima
  quantidadeRefugada: number; // Peças perdidas/descartadas nesta operação
  quantidadeEmRetrabalho: number; // Peças em processo de retrabalho
  saldoOperacaoRestante: number; // quantidadeDisponivelEntrada - (quantidadeProduzidaBoas + quantidadeRefugada)
  
  // Tempos reais apontados:
  tempoSetupRealMinutos: number;
  tempoExecucaoRealMinutos: number;
  tempoParadasMinutos: number;
  tempoTotalRealMinutos: number;
  
  // Custos acumulados na operação:
  custoMaoDeObraReal: number;
  custoMaquinaReal: number;
  custoTotalOperacaoReal: number;
  
  status: StatusOperacaoOP;
  exigeInspecaoQualidade: boolean;
  dataInicioReal?: string;
  dataFimReal?: string;
}

/**
 * Entidade: apontamentos_producao
 * Registro de tempos, peças produzidas, operador, máquina e insumos consumidos
 */
export interface ApontamentoProducao {
  id: string;
  opId: string;
  opNumero: string;
  opOperacaoId: string;
  sequenciaOperacao: number;
  nomeOperacao: string;
  tipoApontamento: TipoApontamento;
  dataHoraInicio: string;
  dataHoraFim: string;
  duracaoMinutos: number;
  operadorId: string;
  operadorNome: string;
  maquinaId: string;
  maquinaNome: string;
  quantidadeBoas: number;
  quantidadeRefugo: number;
  quantidadeRetrabalho: number;
  materiaisConsumidos: {
    materialId: string;
    itemCodigo: string;
    itemDescricao: string;
    quantidadeConsumida: number;
    unidadeMedida: string;
    custoUnitario: number;
    custoTotal: number;
    lote?: string;
  }[];
  custoMaoDeObraCalculado: number;
  custoMaquinaCalculado: number;
  custoMateriaisCalculado: number;
  custoTotalApontamento: number;
  observacoes?: string;
  empresaId: string;
  criadoEm: string;
}

/**
 * Entidade: paradas_producao
 * Interrupções de máquina/produção com cronometragem e motivo
 */
export interface ParadaProducao {
  id: string;
  opId?: string;
  opNumero?: string;
  opOperacaoId?: string;
  maquinaId: string;
  maquinaNome: string;
  operadorId: string;
  operadorNome: string;
  dataHoraInicio: string;
  dataHoraFim?: string;
  duracaoMinutos: number;
  motivoCategoria: MotivoParadaCategoria;
  motivoDescricao: string;
  status: 'EM_ANDAMENTO' | 'FINALIZADA';
  impactoCustoEstimado: number;
  empresaId: string;
  criadoEm: string;
}

/**
 * Entidade: refugos
 * Peças não-conformes descartadas com cálculo de perdas financeiras
 */
export interface RefugoProducao {
  id: string;
  opId: string;
  opNumero: string;
  opOperacaoId: string;
  sequenciaOperacao: number;
  nomeOperacao: string;
  dataHora: string;
  operadorId: string;
  operadorNome: string;
  maquinaId: string;
  maquinaNome: string;
  quantidadeRefugada: number;
  unidadeMedida: string;
  motivoRefugo: MotivoRefugoCategoria;
  descricaoDefeito: string;
  destinoPeca: 'SUCATA_VENDA' | 'DESCARTE_TOTAL' | 'ANALISE_QUALIDADE';
  custoPerdaEstimado: number; // Custos de materiais e etapas anteriores absorvidos pela peça perdida
  disparouOpComplementar: boolean;
  opComplementarId?: string;
  empresaId: string;
  criadoEm: string;
}

/**
 * Entidade: retrabalhos
 * Peças com desvios recuperáveis que exigem ação corretiva
 */
export interface RetrabalhoProducao {
  id: string;
  opOrigemId: string;
  opOrigemNumero: string;
  opOperacaoOrigemId: string;
  sequenciaOperacaoOrigem: number;
  nomeOperacaoOrigem: string;
  dataHora: string;
  operadorId: string;
  operadorNome: string;
  maquinaId: string;
  maquinaNome: string;
  quantidadeRetrabalho: number;
  motivoRetrabalho: MotivoRetrabalhoCategoria;
  descricaoAjuste: string;
  instrucaoRetrabalho: string;
  tempoEstimadoMinutos: number;
  tempoRealMinutos: number;
  custoAdicionalEstimado: number;
  custoAdicionalReal: number;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'REPROVADO_GEROU_REFUGO';
  opRetrabalhoGeradaId?: string;
  empresaId: string;
  criadoEm: string;
}

/**
 * Regra explícita de encerramento de OP com pendências
 */
export interface JustificativaEncerramentoOP {
  motivo: 'CANCELAMENTO_PEDIDO_CLIENTE' | 'ENCERRAMENTO_PARCIAL_ACEITO' | 'DESVIO_ENGENHARIA' | 'PERDA_TOTAL_LOTE' | 'DECISAO_DIRETORIA';
  descricaoDetalhada: string;
  saldoNaoAtendido: number;
  responsavelNome: string;
  autorizacaoGerencia: boolean;
  dataHoraEncerramento: string;
}

/**
 * Entidade: ordens_producao
 * Ordem de Produção completa com conhecimento de Pedido, Produto, Revisão, BOM, Roteiro,
 * quantidades planejadas, produzidas, refugadas, saldo, prazo e custos.
 */
export interface OrdemProducaoCompleta {
  id: string;
  numero: string; // Ex: 'OP-2026-001'
  empresaId: string;
  
  // Vínculos mandatórios:
  pedidoId?: string;
  pedidoNumero?: string;
  clienteNome?: string;
  
  produtoId: string;
  produtoCodigo: string;
  produtoDescricao: string;
  unidadeMedida: string;
  
  projetoId?: string;
  projetoCodigo?: string;
  projetoTitulo?: string;
  
  revisaoId: string;
  revisaoVersao: string; // Snapshot imutável (ex: 'Rev 01')
  
  bomId: string;
  bomCodigo: string;
  bomVersao: string;
  
  roteiroId: string;
  roteiroCodigo: string;
  roteiroVersao: string;
  
  // Quantidades & Balanço:
  quantidadePlanejada: number;
  quantidadeProduzida: number; // Peças boas que completaram a última operação
  quantidadeRefugada: number; // Soma de refugos em todas as operações
  quantidadeEmProcesso: number; // Peças entre operações intermediárias
  saldoRestante: number; // quantidadePlanejada - (quantidadeProduzida + quantidadeRefugada)
  
  // Prazos e prioridades:
  dataEmissao: string;
  prazoEntrega: string; // Data limite
  dataInicioProgramada: string;
  dataFimProgramada: string;
  dataInicioReal?: string;
  dataFimReal?: string;
  prioridade: PrioridadeProducao;
  
  // Tipo e relacionamentos:
  tipoOP: TipoOrdemProducao;
  opPaiId?: string; // Se for OP parcial ou decorrente de retrabalho
  opPaiNumero?: string;
  opsFilhasIds?: string[]; // Se foi desmembrada em OPs parciais
  
  status: StatusOrdemProducao;
  
  // Custos previstos vs reais:
  custoPlanejado: {
    materiais: number;
    maoDeObra: number;
    maquina: number;
    total: number;
  };
  custoReal: {
    materiais: number;
    maoDeObra: number;
    maquina: number;
    retrabalhos: number;
    perdasRefugos: number;
    total: number;
  };
  
  // Coleções internas da OP:
  materiais: OpMaterial[];
  operacoes: OpOperacao[];
  
  // Regra de encerramento com pendências:
  justificativaEncerramento?: JustificativaEncerramentoOP;
  
  observacoes?: string;
  criadoPor: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface OperadorProducao {
  id: string;
  nome: string;
  matricula: string;
  setor: string;
  especialidade: string;
  custoHora: number;
  status: 'DISPONIVEL' | 'EM_OPERACAO' | 'INTERVALO' | 'AFASTADO';
  opAtualNumero?: string;
}

export interface MaquinaCentroTrabalho {
  id: string;
  codigo: string;
  nome: string;
  setor: string;
  custoHora: number;
  status: 'DISPONIVEL' | 'EM_PRODUCAO' | 'EM_SETUP' | 'PARADA' | 'MANUTENCAO';
  opAtualNumero?: string;
  operacaoAtualNome?: string;
  oeeAtualPercentual: number;
}
