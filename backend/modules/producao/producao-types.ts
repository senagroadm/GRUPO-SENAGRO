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
 * =========================================================================
 * EXTENSÕES ESPECÍFICAS DE PROCESSOS INDUSTRIAIS (CORTE, DOBRA, SOLDA, ETC)
 * =========================================================================
 */

export type TipoProcessoCorte = 'LASER_FIBRA' | 'LASER_CO2' | 'PLASMA_HD' | 'OXICORTE' | 'GUILHOTINA' | 'SERRA_FITA' | 'SERRA_FITA_MECANICA' | 'OUTROS';
export type TipoGasCorte = 'OXIGENIO_O2' | 'NITROGENIO_N2' | 'NITROGENIO_N2_ALTA_PRESSAO' | 'AR_COMPRIMIDO' | 'ARGONIO' | 'ARGONIO_PURO' | 'ARGONIO_PURO_100' | 'MISTURA_SPECIAL' | 'MISTURA_AR_CO2_20' | 'CO2_PURO' | 'AR_HE_CO2' | 'SEM_GAS';
export type TipoSucata = 'ESQUELETO_LASER' | 'PONTAS_PERFIL' | 'PONTAS_DE_BARRA' | 'CAVACO_USINAGEM' | 'BORRA_PLASMA' | 'RETALHO_CONDENADO' | 'SUCATA_INOX_LIMPA' | 'SUCATA_MISTA';

/**
 * Extensão Técnica Específica de CORTE (Laser, Plasma, Oxicorte, etc.)
 */
export interface ExtensaoCorteLaser {
  tipoProcessoCorte: TipoProcessoCorte;
  material: string; // Ex: 'Aço SAC-350 / Domex 700', 'Inox AISI 304', 'SAE 1020'
  espessuraMm: number; // Ex: 6.35 mm
  
  // Chapa bruta e dimensões
  chapaDescricao: string; // Ex: 'Chapa Aço SAC-350 #6.35 x 1500 x 6000 mm'
  formatoChapaLarguraMm?: number;
  formatoChapaComprimentoMm?: number;
  formatoChapaAreaM2?: number;
  loteChapa?: string;
  chapaOrigemEstoqueId?: string;
  
  // Programa CNC / Nesting
  programaCncCodigo?: string; // Ex: 'PRG-CHAS-6MM-V02.cnc'
  programaCncVersao?: string;
  nestingAproveitamentoPercentual?: number; // Ex: 88.5%
  quantidadePecasPorChapa?: number;
  totalChapasNecessarias?: number;
  totalChapasConsumidasReal?: number;
  
  // Tempos de Processamento
  tempoPrevistoMinutosTotal?: number;
  tempoPrevistoMinutosPorPeca?: number;
  tempoRealMinutosTotal?: number;
  tempoRealMinutosPorPeca?: number;
  tempoSetupMinutosPrevisto?: number;
  tempoSetupMinutosReal?: number;
  descricaoSetup?: string;
  
  // Quantidades
  quantidadePecasPlanejada: number;
  quantidadePecasCortadasBoas: number;
  quantidadePecasRefugadas: number;
  
  // Peso e Balanço de Massa
  pesoLiquidoPecaUnitariaKg: number;
  pesoLiquidoTotalPecasKg: number;
  pesoBrutoChapaUnitariaKg?: number;
  pesoBrutoTotalChapasKg?: number;
  
  // Retalho Reutilizável Gerado
  temRetalhoAproveitavel: boolean;
  retalhoDescricao?: string;
  retalhoDimensoes?: string;
  retalhoPesoKg?: number;
  retalhoCodigoEstoque?: string;
  retalhoValorizadoCredito?: number;
  
  // Sucata / Esqueleto Irrecuperável
  pesoSucataTotalKg: number;
  tipoSucata: TipoSucata;
  custoSucataPerdida?: number;
  
  // Gás de Assistência & Consumíveis
  gasTipo?: TipoGasCorte;
  gasPressaoBar?: number;
  gasConsumoEstimadoM3?: number;
  gasConsumoRealM3?: number;
  bicoNozzleModelo?: string;
  lenteFocalOuVidroProtecao?: string;
  custoGasConsumiveisTotal?: number;
}

/**
 * Extensão Técnica Específica de DOBRA (Prensa Dobradeira CNC / Manual)
 */
export interface PassoDobraSequencia {
  passoNumero: number;
  descricaoDobra: string;
  anguloNominalGraus: number;
  anguloMedidoRealGraus?: number;
  comprimentoDobraMm: number;
  forcaDobraToneladas?: number;
  puncaoCodigo: string;
  matrizCodigo: string;
  aberturaMatrizV_Mm: number;
  compensacaoSpringbackGraus?: number;
  statusPasso: 'CONCLUIDO' | 'EM_AJUSTE' | 'PENDENTE';
}

export interface ExtensaoDobraCNC {
  maquinaNome: string;
  maquinaCodigo?: string;
  ferramentaConjunto: string;
  puncaoModelo: string;
  matrizModelo: string;
  aberturaMatrizV_Mm: number;
  raioInternoDobraMm: number;
  espessuraMaterialMm: number;
  materialDescricao: string;
  
  // Ângulos e Parâmetros
  angulosDescricao: string;
  compensacaoSpringback: number;
  sequenciaPassosDobra: PassoDobraSequencia[];
  totalDobrasPorPeca: number;
  
  // Tempos
  tempoSetupPrevistoMinutos?: number;
  tempoSetupRealMinutos?: number;
  tempoDobraPrevistoPorPecaMinutos?: number;
  tempoDobraRealPorPecaMinutos?: number;
  tempoTotalPrevistoMinutos?: number;
  tempoTotalRealMinutos?: number;
  
  // Quantidades
  quantidadePlanejada: number;
  quantidadeDobradaBoas: number;
  quantidadeRefugoDobra: number;
  quantidadeRetrabalhoDobra: number;
  
  // Retrabalho específico de dobra
  houveRetrabalhoDobra: boolean;
  motivoRetrabalhoDobra?: 'SPRINGBACK_INCORRETO' | 'ANGULO_FORA_TOLERANCIA' | 'MARCA_EXCESSIVA_FERRAMENTAL' | 'INVERSAO_DOBRA' | 'REDOBRA_AJUSTE';
  descricaoRetrabalhoDobra?: string;
  acaoCorretivaDobra?: string;
  custoRetrabalhoDobra?: number;
}

/**
 * Extensões Preparadas para Outros Processos de Chão de Fábrica
 */
export interface ExtensaoSoldaCaldeiraria {
  processo: 'MIG_MAG_GMAW' | 'TIG_GTAW' | 'ARAME_TUBULAR_FCAW' | 'ELETRODO_SMAW' | 'LASER' | 'ARCO_SUBMERSO_SAW' | string;
  gasProtecao: TipoGasCorte | 'MISTURA_AR_CO2_20' | 'ARGONIO_PURO' | 'ARGONIO_PURO_100' | 'CO2_PURO' | 'AR_HE_CO2' | 'SEM_GAS';
  gasConsumoLitrosMinuto?: number;
  consumivelArameCodigo: string;
  consumivelArameLote?: string;
  consumoArameEstimadoKg?: number;
  consumoArameRealKg?: number;
  procedimentoEPS_WPS: string;
  qualificacaoSoldadorNorma?: string;
  tipoJunta?: 'TOPO_COM_CHANFRO_V' | 'ANGULO_T' | 'SOBREPOSTA' | 'CANTO' | 'VIROLA' | string;
  inspecaoEnsaioNaoDestrutivo?: 'VISUAL_100%' | 'LIQUIDO_PENETRANTE_LP' | 'PARTICULA_MAGNETICA_PM' | 'ULTRASSOM_US' | 'RADIOGRAFIA_RX' | 'RADIOGRAFIA_RX_TOTAL' | string;
  laudoInspecaoNumero?: string;
  aprovadoQualidadeSolda: boolean;
  custoConsumiveisSolda?: number;
}

export interface ExtensaoPinturaAcabamento {
  tipoPintura: 'ELETROSTATICA_PO' | 'LIQUIDA_EPOXI' | 'LIQUIDA_POLIURETANO_PU' | 'PRIMER_ANTICORROSIVO_ZINCO' | string;
  corRAL: string;
  corDescricao: string;
  tintaCodigo: string;
  tintaLote?: string;
  espessuraCamadaMicronsPrevista: number;
  espessuraCamadaMicronsReal?: number;
  temperaturaEstufaC?: number;
  tempoEstufaMinutos?: number;
  areaTotalPinturaM2?: number;
  preTratamentoSuperficie?: 'DESENGRAXE_E_FOSFATIZACAO' | 'JATEAMENTO_GRANALHA_SA2_5' | 'NANOTECNOLOGIA_ZIRCONIO' | string;
  consumoTintaEstimadoKgOuLitros?: number;
  consumoTintaRealKgOuLitros?: number;
  custoInsumosPintura?: number;
}

export interface ExtensaoMontagem {
  tipoMontagem: 'MECANICA_ESTRUTURAL' | 'MECANICA_PARAFUSADA' | 'ELETROMECANICA' | 'HIDRAULICA_PNEUMATICA' | 'CONJUNTO_APARAFUSADO' | string;
  instrucaoMontagemNumero?: string;
  elementosFixacaoList?: {
    itemCodigo: string;
    itemDescricao: string;
    quantidade: number;
    unidade: string;
    torqueExigidoNm?: number;
  }[];
  torquimetroCalibradoCodigo?: string;
  ferramentaTorquimetroUtilizada?: string;
  torqueEspecificadoNm?: number;
  torquesEspecificadosNm?: string;
  quantidadeComponentesMontadosPorPeca?: number;
  gabaritoMontagemCodigo?: string;
  testeFuncionalDescricao?: string;
  testeFuncionalAprovado?: boolean;
  inspecaoAprovada?: boolean;
  custoComponentesMontagem?: number;
}

export interface ExtensaoAcabamento {
  tipoAcabamento: 'JATEAMENTO_GRANALHA_ACO' | 'LIXAMENTO_MANUAL' | 'LIXAMENTO_CINTA' | 'POLIMENTO_ESPELHADO_SANITARIO' | 'POLIMENTO_SANITARIO_ESPELHADO' | 'ESCOVAMENTO' | 'ESCOVADO' | 'REBARBACAO_TAMBOR' | string;
  grauRugosidadeRaMicrons?: number;
  rugosidadeMaximaRa_Microns?: number;
  rugosidadeMedidaRealRa?: number;
  granulometriaLixa?: string;
  abrasivosUtilizados?: string;
  insumosAbrasivosUtilizados?: string;
  tempoExecucaoMinutos?: number;
  custoAbrasivosInsumos?: number;
  custoInsumosAcabamento?: number;
  aprovadoInspecaoVisual?: boolean;
}

export interface ExtensaoServicoExterno {
  tipoServico: 'GALVANIZACAO_A_FOGO' | 'ZINCAGEM_TRIVALENTE' | 'TEMPERA_INDUCAO' | 'NITRETACAO' | 'USINAGEM_TERCEIRIZADA' | 'CORTE_PESADO_TERCEIRO' | string;
  fornecedorNome: string;
  fornecedorCnpj?: string;
  pedidoCompraNumero?: string;
  pedidoCompraServicoNumero?: string;
  notaFiscalRemessa?: string;
  notaFiscalRemessaNumero?: string;
  notaRemessaIndustrializacaoNumero?: string;
  notaFiscalRetorno?: string;
  notaFiscalRetornoNumero?: string;
  notaRetornoIndustrializacaoNumero?: string;
  dataEnvioRemessa?: string;
  dataEnvio?: string;
  dataRetornoPrevista?: string;
  prazoRetornoPrevisto?: string;
  dataRetornoReal?: string;
  quantidadeEnviada: number;
  quantidadeRetornada: number;
  quantidadeAprovada?: number;
  quantidadeRetornadaAprovada?: number;
  quantidadeRejeitada?: number;
  unidadeMedida?: string;
  laudoCertificadoFornecedor?: string;
  certificadoConformidadeFornecedor?: string;
  certificadoTratamentoNumero?: string;
  espessuraCamadaMicronsMedida?: number;
  custoUnitarioServico?: number;
  custoTotalServicoExterno: number;
  custoTotalServico?: number;
  statusServico?: string;
  inspecaoAprovada?: boolean;
}

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
  setor: string; // 'CORTE_LASER' | 'DOBRA_CNC' | 'CALDEIRARIA_SOLDA' | 'USINAGEM' | 'PINTURA' | 'MONTAGEM' | 'INSPECAO' | 'SERVICO_EXTERNO'
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
  
  // Custos acumulados na operação (parametrização vs real):
  custoMaoDeObraReal: number;
  custoMaquinaReal: number;
  custoConsumiveisReal?: number;
  custoServicosExternos?: number;
  custoTotalOperacaoReal: number;
  
  // Detalhamento e Extensões Técnicas Específicas:
  extensaoCorte?: ExtensaoCorteLaser;
  extensaoDobra?: ExtensaoDobraCNC;
  extensaoSolda?: ExtensaoSoldaCaldeiraria;
  extensaoPintura?: ExtensaoPinturaAcabamento;
  extensaoMontagem?: ExtensaoMontagem;
  extensaoAcabamento?: ExtensaoAcabamento;
  extensaoServicoExterno?: ExtensaoServicoExterno;
  
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
  operadorCustoHoraParametrizado?: number;
  maquinaId: string;
  maquinaNome: string;
  maquinaCustoHoraParametrizado?: number;
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
  
  // Custos calculados com custo-hora parametrizado e tempos reais:
  custoMaoDeObraCalculado: number;
  custoMaquinaCalculado: number;
  custoMateriaisCalculado: number;
  custoConsumiveisCalculado?: number;
  custoServicosExternos?: number;
  custoTotalApontamento: number;
  
  // Detalhes técnicos apontados específicos do processo:
  detalhesCorte?: Partial<ExtensaoCorteLaser>;
  detalhesDobra?: Partial<ExtensaoDobraCNC>;
  detalhesSolda?: Partial<ExtensaoSoldaCaldeiraria>;
  detalhesPintura?: Partial<ExtensaoPinturaAcabamento>;
  detalhesMontagem?: Partial<ExtensaoMontagem>;
  detalhesAcabamento?: Partial<ExtensaoAcabamento>;
  detalhesServicoExterno?: Partial<ExtensaoServicoExterno>;

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
    consumiveis?: number;
    servicosExternos?: number;
    total: number;
  };
  custoReal: {
    materiais: number;
    maoDeObra: number;
    maquina: number;
    consumiveis?: number;
    servicosExternos?: number;
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
