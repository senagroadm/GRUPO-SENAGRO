// backend/modules/manutencao/manutencao-types.ts
// Módulo 11: Gestão de Manutenção & Ativos Industriais (PCM - Planejamento e Controle de Manutenção)
// Ativos, Componentes, Planos (Preventivo, Corretivo, Preditivo), Ordens de Manutenção, Falhas,
// Paradas, Itens/Sobressalentes com Solicitação de Compra, Serviços de Terceiros, Horímetros e Ferramental.

export type TipoAtivo =
  | 'CORTE_LASER'
  | 'DOBRADEIRA_CNC'
  | 'PUNCIONADEIRA'
  | 'SOLDA_ROBOTICA'
  | 'CENTRO_USINAGEM'
  | 'PONTE_ROLANTE'
  | 'COMPRESSOR_AR'
  | 'CABINE_PINTURA'
  | 'GUILHOTINA';

export type CriticidadeAtivo = 'A' | 'B' | 'C'; // A = Crítico (Gargalo de Produção), B = Médio, C = Baixo

export type StatusOperacionalAtivo =
  | 'OPERACIONAL'
  | 'EM_MANUTENCAO_PREVENTIVA'
  | 'EM_MANUTENCAO_CORRETIVA'
  | 'EM_MANUTENCAO_PREDITIVA'
  | 'INDISPONIVEL_DEFEITO'
  | 'DESATIVADO';

export type TipoComponente =
  | 'FONTE_LASER'
  | 'CABECOTE_CORTE'
  | 'SISTEMA_OPTICO'
  | 'CNC_COMANDO'
  | 'SERVOMOTOR_DRIVE'
  | 'SISTEMA_HIDRAULICO'
  | 'SISTEMA_PNEUMATICO'
  | 'BARRAMENTO_GUIAS'
  | 'BOMBA_VAPOR'
  | 'ESTRUTURAL';

export type TipoManutencao =
  | 'PREVENTIVA'
  | 'CORRETIVA'
  | 'PREDITIVA'
  | 'LUBRIFICACAO'
  | 'INSPECAO_ROTA'
  | 'MELHORIA_ENGENHARIA';

export type GatilhoPlano = 'CALENDARIO' | 'HORIMETRO' | 'CONDICAO_PREDITIVA' | 'HIBRIDO';

export type PrioridadeManutencao = 'BAIXA' | 'MEDIA' | 'ALTA' | 'EMERGENCIAL_PARADA_PRODUCAO';

export type StatusOrdemManutencao =
  | 'ABERTA'
  | 'PLANEJADA'
  | 'EM_EXECUCAO'
  | 'AGUARDANDO_PECA'
  | 'AGUARDANDO_TERCEIRO'
  | 'CONCLUIDA'
  | 'CANCELADA';

export type TipoParadaManutencao =
  | 'MANUTENCAO_CORRETIVA_NAO_PROGRAMADA'
  | 'MANUTENCAO_PREVENTIVA_PROGRAMADA'
  | 'PREDITIVA_CONDICAO'
  | 'SETUP_FERRAMENTAL';

export type TipoFerramenta =
  | 'MATRIZ_DOBRA'
  | 'PUNCAO_DOBRA'
  | 'BICO_LASER'
  | 'LENTE_OPTICA'
  | 'ESTAMPO_PUNCAO'
  | 'FRESA_USINAGEM';

export type StatusFerramenta =
  | 'DISPONIVEL_ESTOQUE'
  | 'MONTADA_EM_MAQUINA'
  | 'EM_AFIACAO_EXTERNA'
  | 'DESGASTADA_SUCATA';

export type TipoMovimentoFerramenta =
  | 'CHECKOUT_MONTAGEM'
  | 'CHECKIN_DESMONTAGEM'
  | 'ENVIO_AFIACAO'
  | 'RETORNO_AFIACAO'
  | 'DESCARTE_SUCATA';

// ---------------------------------------------------------------------------
// 1. ATIVO INDUSTRIAL (Máquina / Equipamento)
// ---------------------------------------------------------------------------
export interface AtivoIndustrial {
  id: string;
  empresaId: string;
  tag: string; // Ex: 'LASER-01', 'DOBRA-02'
  nome: string;
  tipo: TipoAtivo;
  marca: string;
  modelo: string;
  numeroSerie: string;
  anoFabricacao: number;
  criticidade: CriticidadeAtivo;
  centroCusto: string;
  localizacaoSetor: string;
  statusOperacional: StatusOperacionalAtivo;
  dataAquisicao: string;
  valorAquisicao: number;
  custoHoraMaquina: number; // Custo hora da máquina para custos de produção/parada
  horimetroAtual: number; // Horas acumuladas de trabalho
  horimetroUltimaPreventiva: number;
  dataUltimaPreventiva?: string;
  proximaPreventivaData?: string;
  proximaPreventivaHorimetro?: number;
  bloqueioPCP: boolean; // Flag estrita que impede PCP de alocar OPs quando indisponível
  motivoBloqueioPCP?: string;
  notificacaoPCPData?: string;
  totalParadasHistorico: number;
  tempoTotalParadoMinutos: number;
  mtbfHoras: number; // Mean Time Between Failures calculado
  mttrHoras: number; // Mean Time To Repair calculado
  disponibilidadePercentual: number; // Disponibilidade (%)
}

// ---------------------------------------------------------------------------
// 2. COMPONENTES & SUBCONJUNTOS DO ATIVO
// ---------------------------------------------------------------------------
export interface ComponenteAtivo {
  id: string;
  empresaId: string;
  ativoId: string;
  ativoTag: string;
  codigo: string;
  nome: string;
  tipoComponente: TipoComponente;
  numeroSerie?: string;
  vidaUtilEstimadaHoras: number;
  horasTrabalhadas: number;
  criticidade: 'ALTA' | 'MEDIA' | 'BAIXA';
  status: 'EM_OPERACAO' | 'DESGASTE_AVANCADO' | 'SUBSTITUIDO' | 'EM_REPARO';
  dataInstalacao: string;
  ultimaInspecao?: string;
  detalhesTecnicos?: string;
}

// ---------------------------------------------------------------------------
// 3. PLANOS DE MANUTENÇÃO (PMP - Plano Mestre Preventivo / Preditivo)
// ---------------------------------------------------------------------------
export interface TarefaChecklistManutencao {
  id: string;
  sequencia: number;
  descricao: string;
  tipoInspecao: 'VISUAL' | 'MEDICAO' | 'LUBRIFICACAO' | 'SUBSTITUICAO' | 'TESTE_FUNCIONAL';
  instrumento?: string;
  valorReferencia?: string;
  tempoEstimadoMinutos: number;
  obrigatorio: boolean;
}

export interface MaterialEstimadoPlano {
  produtoId: string;
  codigoProduto: string;
  descricao: string;
  quantidade: number;
  unidadeMedida: string;
  custoEstimadoUnitario: number;
}

export interface PlanoManutencao {
  id: string;
  empresaId: string;
  codigo: string; // Ex: 'PMP-LASER-MENSAL'
  titulo: string;
  tipo: TipoManutencao;
  gatilho: GatilhoPlano;
  intervaloDias?: number; // Periodicidade de calendário
  intervaloHorimetro?: number; // Periodicidade por horas trabalhadas
  toleranciaDias: number;
  toleranciaHoras: number;
  tipoAtivo?: TipoAtivo;
  ativoId?: string; // Se específico para uma máquina
  tarefas: TarefaChecklistManutencao[];
  materiaisEstimados: MaterialEstimadoPlano[];
  tempoTotalEstimadoHoras: number;
  qualificacaoRequerida: string;
  ativo: boolean;
}

// ---------------------------------------------------------------------------
// 4. ORDENS DE MANUTENÇÃO (OM)
// ---------------------------------------------------------------------------
export interface RespostaTarefaOM {
  tarefaId: string;
  descricao: string;
  concluido: boolean;
  observacao?: string;
  valorMedido?: string;
  executadoPor?: string;
}

export interface OrdemManutencao {
  id: string;
  empresaId: string;
  numeroOM: string; // Ex: 'OM-2026-0042'
  tipoManutencao: TipoManutencao;
  origem: 'PLANO_CALENDARIO' | 'PLANO_HORIMETRO' | 'SOLICITACAO_CHAO_FABRICA' | 'ALARME_PREDITIVO_IOT' | 'INSPECAO_QUALIDADE';
  prioridade: PrioridadeManutencao;
  status: StatusOrdemManutencao;
  ativoId: string;
  ativoTag: string;
  ativoNome: string;
  componenteId?: string;
  componenteNome?: string;
  planoManutencaoId?: string;
  planoManutencaoTitulo?: string;
  falhaId?: string;
  descricaoProblema: string;
  causaRaizIdentificada?: string;
  solucaoAplicada?: string;
  solicitanteNome: string;
  dataAbertura: string;
  dataAgendamento?: string;
  dataInicioExecucao?: string;
  dataFimExecucao?: string;
  tecnicoResponsavelId?: string;
  tecnicoResponsavelNome?: string;
  horimetroNoMomento?: number;
  tempoParadaHoras: number; // Máquina parada
  tempoTrabalhoTecnicoHoras: number; // Homem-hora
  tarefasExecutadas: RespostaTarefaOM[];
  
  // Custos acumulados
  custoMaoDeObraInterna: number;
  custoServicosTerceiros: number;
  custoMateriaisPecas: number;
  custoOportunidadeParada: number;
  custoTotalOM: number;

  // Integrações
  bloqueouProducao: boolean;
  notificouPCP: boolean;
  solicitacoesCompraGeradas: string[]; // IDs de SCs geradas automaticamente
  observacoesFinais?: string;
}

// ---------------------------------------------------------------------------
// 5. CATÁLOGO DE FALHAS & SINTOMAS (ISO 14224)
// ---------------------------------------------------------------------------
export interface FalhaCatalogo {
  id: string;
  empresaId: string;
  codigo: string;
  sintoma: string;
  modoFalha: 'DESGASTE_MECANICO' | 'SOBREAQUECIMENTO' | 'CURTO_CIRCUITO' | 'FALHA_SOFTWARE_CNC' | 'CONTAMINACAO_OLEO' | 'DESALINHAMENTO_OPTICO' | 'VAZAMENTO_FLUIDO' | 'FADIGA_ESTRUTURAL';
  causaProvavel: string;
  acaoPadraoRecomendada: string;
  criticidade: 'ALTA' | 'MEDIA' | 'BAIXA';
  totalOcorrencias: number;
}

// ---------------------------------------------------------------------------
// 6. HISTÓRICO DE PARADAS DE MÁQUINA (Downtime)
// ---------------------------------------------------------------------------
export interface ParadaManutencao {
  id: string;
  empresaId: string;
  ativoId: string;
  ativoTag: string;
  ordemManutencaoId?: string;
  numeroOM?: string;
  ordemProducaoIdAfetada?: string;
  dataHoraInicio: string;
  dataHoraFim?: string;
  duracaoMinutos: number;
  tipoParada: TipoParadaManutencao;
  motivo: string;
  impactoProducaoDescricao?: string;
  bloqueouPcp: boolean;
  registradoPor: string;
}

// ---------------------------------------------------------------------------
// 7. ITENS / SOBRESSALENTES REQUISITADOS NA OM
// ---------------------------------------------------------------------------
export interface ManutencaoItemRequisitado {
  id: string;
  empresaId: string;
  ordemManutencaoId: string;
  numeroOM: string;
  produtoId: string;
  codigoProduto: string;
  descricao: string;
  quantidadeRequisitada: number;
  quantidadeEmEstoqueDisponivel: number;
  unidadeMedida: string;
  custoUnitario: number;
  custoTotal: number;
  statusAtendimento: 'RESERVADO_ESTOQUE' | 'SOLICITACAO_COMPRA_GERADA' | 'ENTREGUE_APLICADO';
  solicitacaoCompraId?: string; // ID da SC gerada caso estoque insuficiente
  solicitacaoCompraNumero?: string;
  dataRequisicao: string;
}

// ---------------------------------------------------------------------------
// 8. SERVIÇOS DE TERCEIROS NA MANUTENÇÃO
// ---------------------------------------------------------------------------
export interface ManutencaoServicoTerceiro {
  id: string;
  empresaId: string;
  ordemManutencaoId: string;
  numeroOM: string;
  fornecedorId: string;
  fornecedorNome: string;
  cnpj?: string;
  descricaoServico: string;
  horasTrabalhadas: number;
  valorHora: number;
  valorTotal: number;
  numeroNotaServicoOuOS?: string;
  status: 'COTADO' | 'APROVADO' | 'EM_EXECUCAO' | 'CONCLUIDO';
  tecnicoExternoNome?: string;
}

// ---------------------------------------------------------------------------
// 9. LEITURAS DE HORÍMETRO & GATILHOS
// ---------------------------------------------------------------------------
export interface RegistroHorimetro {
  id: string;
  empresaId: string;
  ativoId: string;
  ativoTag: string;
  dataLeitura: string;
  horimetroAnterior: number;
  horimetroAtual: number;
  horasTrabalhadasPeriodo: number;
  origem: 'MANUAL' | 'CHAO_DE_FABRICA_OP' | 'TELEMETRIA_IOT_CLP';
  disparouPreventiva: boolean;
  ordemManutencaoGeradaId?: string;
  ordemManutencaoGeradaNumero?: string;
  registradoPor: string;
}

// ---------------------------------------------------------------------------
// 10. GESTÃO DE FERRAMENTAL & MATRIZES
// ---------------------------------------------------------------------------
export interface FerramentaIndustrial {
  id: string;
  empresaId: string;
  codigo: string; // Ex: 'MATRIZ-V12-88G'
  nome: string;
  tipoFerramenta: TipoFerramenta;
  maquinasCompativeis: string[]; // Tags das máquinas ex: ['DOBRA-01', 'DOBRA-02']
  vidaUtilEstimadaGolpesHoras: number;
  acumuladoGolpesHoras: number;
  limiteAlertaAfiacao: number;
  status: StatusFerramenta;
  ativoAtualId?: string;
  ativoAtualTag?: string;
  localizacaoArmazem: string;
  totalAfiacoesRealizadas: number;
  custoAquisicao: number;
}

export interface MovimentoFerramenta {
  id: string;
  empresaId: string;
  ferramentaId: string;
  ferramentaCodigo: string;
  ferramentaNome: string;
  tipoMovimento: TipoMovimentoFerramenta;
  ativoId?: string;
  ativoTag?: string;
  operadorNome: string;
  dataHora: string;
  golpesNoSetup?: number;
  observacoes?: string;
}

// ---------------------------------------------------------------------------
// 11. MONITORAMENTO PREDITIVO (Sensores & Telemetria)
// ---------------------------------------------------------------------------
export interface LeituraPreditivaSensor {
  id: string;
  empresaId: string;
  ativoId: string;
  ativoTag: string;
  dataHora: string;
  temperaturaFonteGrausC: number;
  vibracaoEixoRmsMmS: number;
  pressaoHidraulicaBar: number;
  qualidadeOleoParticulasNas: number;
  alertaDetectado: boolean;
  statusSensor: 'NORMAL' | 'ALERTA' | 'CRITICO';
  mensagemDiagnostico: string;
}

// ---------------------------------------------------------------------------
// 12. INDICADORES CONSOLIDADOS DO PCM
// ---------------------------------------------------------------------------
export interface IndicadoresPCM {
  empresaId: string;
  periodoMes: string;
  totalAtivos: number;
  ativosOperacionais: number;
  ativosEmManutencao: number;
  mtbfGlobalHoras: number; // Mean Time Between Failures Global
  mttrGlobalHoras: number; // Mean Time To Repair Global
  disponibilidadeGlobalPercentual: number; // Disponibilidade (%)
  taxaPreventivasEmDiaPercentual: number; // % SLA Preventivas no Prazo
  custoTotalManutencaoMes: number;
  custoMaoDeObraInterna: number;
  custoServicosTerceiros: number;
  custoMateriaisPecas: number;
  custoOportunidadeParadas: number;
  custoManutencaoPorHoraOperacional: number;
  totalOrdensAbertas: number;
  totalOrdensConcluidas: number;
  ordensPreventivasExecutadas: number;
  ordensCorretivasExecutadas: number;
  totalHorasDowntimeMes: number;
  maquinasComMaisFalhas: {
    ativoTag: string;
    nome: string;
    totalFalhas: number;
    horasParadas: number;
    custoTotal: number;
  }[];
  pecasMaisRequisitadas: {
    codigo: string;
    descricao: string;
    quantidade: number;
    custoTotal: number;
    comprasGeradas: number;
  }[];
}
