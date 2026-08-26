// backend/modules/qualidade/qualidade-types.ts

export type TipoInspecao = 'RECEBIMENTO' | 'PROCESSO' | 'FINAL';

export type DisposicaoQualidade =
  | 'APROVADO'
  | 'APROVADO_COM_DESVIO'
  | 'REPROVADO'
  | 'QUARENTENA'
  | 'RETRABALHO'
  | 'SUCATA';

export type SeveridadeNC = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type OrigemNC =
  | 'INSPECAO_RECEBIMENTO'
  | 'INSPECAO_PROCESSO'
  | 'INSPECAO_FINAL'
  | 'AUDITORIA_INTERNA'
  | 'RECLAMACAO_CLIENTE'
  | 'CHAO_DE_FABRICA';

export type StatusNC =
  | 'ABERTA'
  | 'EM_INVESTIGACAO'
  | 'PLANO_ACAO_DEFINIDO'
  | 'EM_EXECUCAO'
  | 'AGUARDANDO_EFICACIA'
  | 'EFICAZ_CONCLUIDA'
  | 'INEFICAZ_REABERTA'
  | 'CANCELADA';

export type CategoriaIshikawa =
  | 'METODO'
  | 'MATERIAL'
  | 'MAQUINA'
  | 'MAO_DE_OBRA'
  | 'MEIO_AMBIENTE'
  | 'MEDICAO';

export type StatusAcao = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'VALIDADA_EFICAZ' | 'CANCELADA';

export type StatusRetrabalho =
  | 'SOLICITADO'
  | 'EM_EXECUCAO'
  | 'CONCLUIDO_REINSPECIONADO'
  | 'CANCELADO';

export type StatusRefugo = 'REGISTRADO' | 'SEGREGADO' | 'PESADO' | 'DESTINADO_SUCATA';

export type TipoValorChecklist = 'BOOLEANO' | 'NUMERICO_TOLERANCIA' | 'TEXTUAL' | 'FOTO_EVIDENCIA';

export type NivelCriticidadeItem = 'CRITICO' | 'MAIOR' | 'MENOR';

/**
 * 1. MODELOS DE CHECKLIST (Biblioteca de Modelos de Inspeção)
 */
export interface ItemChecklist {
  id: string;
  modeloId: string;
  sequencia: number;
  tituloCriterio: string;
  metodoInspecao: string;
  instrumentoMedicao: string; // Ex: Paquímetro Mitutoyo 300mm, Micrômetro, Rugosímetro, Trena Laser
  tipoValor: TipoValorChecklist;
  valorNominal?: number;
  toleranciaMin?: number;
  toleranciaMax?: number;
  unidadeMedida?: string; // mm, °, Ra, kg, N
  nivelCriticidade: NivelCriticidadeItem;
  instrucaoInspecao: string;
  fotoReferenciaUrl?: string;
}

export interface ModeloChecklist {
  id: string;
  empresaId: string;
  codigo: string;
  titulo: string;
  versao: string;
  tipoInspecao: TipoInspecao;
  setor: string;
  produtoCodigo?: string;
  operacaoPadrao?: string;
  descricao: string;
  ativo: boolean;
  criadoPor: string;
  criadoEm: string;
  atualizadoEm: string;
  itens: ItemChecklist[];
}

/**
 * 2. RESPOSTAS DE INSPEÇÃO
 */
export interface RespostaInspecao {
  id: string;
  inspecaoId: string;
  itemChecklistId: string;
  sequencia: number;
  tituloCriterio: string;
  metodoInspecao: string;
  instrumentoMedicao: string;
  tipoValor: TipoValorChecklist;
  valorNominal?: number;
  toleranciaMin?: number;
  toleranciaMax?: number;
  unidadeMedida?: string;
  nivelCriticidade: NivelCriticidadeItem;
  // Resposta Real
  conforme: boolean;
  valorMedidoNumerico?: number;
  valorMedidoTexto?: string;
  desvioDetectado?: number;
  fotosEvidencia?: string[];
  observacao?: string;
  statusDisposicao: DisposicaoQualidade;
}

/**
 * 3. INSPEÇÕES DE QUALIDADE (Recebimento, Processo, Final)
 */
export interface InspecaoQualidade {
  id: string;
  empresaId: string;
  numeroInspecao: string; // Ex: IQ-REC-2026-0089, IP-LASER-2026-0412, IF-ACAB-2026-0054
  tipoInspecao: TipoInspecao;
  dataInspecao: string;
  inspetorId: string;
  inspetorNome: string;
  modeloChecklistId: string;
  modeloChecklistTitulo: string;

  // Contexto e Rastreabilidade
  fornecedorId?: string;
  fornecedorNome?: string;
  notaFiscalNumero?: string;
  pedidoCompraNumero?: string;
  loteMaterial?: string;
  corridaAco?: string;
  certificadoUsinaNumero?: string;
  certificadoUsinaAnexoUrl?: string;

  opId?: string;
  opNumero?: string;
  operacaoId?: string;
  operacaoNome?: string;
  maquinaId?: string;
  maquinaNome?: string;
  setor: string;

  produtoCodigo: string;
  produtoDescricao: string;

  // Tamanhos e Amostragem
  tamanhoLote: number;
  tamanhoAmostra: number;
  unidadeMedida: string;
  quantidadeAprovada: number;
  quantidadeAprovadaComDesvio: number;
  quantidadeReprovada: number;
  quantidadeQuarentena: number;
  quantidadeRetrabalho: number;
  quantidadeRefugo: number;

  // Resultado Final
  disposicaoFinal: DisposicaoQualidade;
  observacoesGerais: string;
  laudoTecnico: string;
  rncGeradaId?: string;
  rncNumero?: string;
  fotosEvidencias: string[];
  respostas: RespostaInspecao[];

  criadoEm: string;
  atualizadoEm: string;
}

/**
 * 4. CAUSAS DE NÃO CONFORMIDADE (Ishikawa 6M & 5 Porquês)
 */
export interface Metodo5Porques {
  porQue1: string;
  porQue2: string;
  porQue3: string;
  porQue4: string;
  porQue5CausaRaiz: string;
}

export interface CausaNC {
  id: string;
  rncId: string;
  categoriaIshikawa: CategoriaIshikawa;
  descricaoCausa: string;
  metodo5Porques: Metodo5Porques;
  identificadaPor: string;
  dataIdentificacao: string;
}

/**
 * 5. AÇÕES CORRETIVAS
 */
export interface AcaoCorretivaNC {
  id: string;
  rncId: string;
  causaId?: string;
  descricaoAcao: string;
  tipoAcao: 'BLOQUEIO' | 'CORRECAO_PROCESSO' | 'TREINAMENTO' | 'MANUTENCAO_PREVENTIVA' | 'REVISAO_ENGENHARIA';
  responsavelNome: string;
  responsavelEmail: string;
  setorResponsavel: string;
  prazoLimite: string;
  dataConclusao?: string;
  status: StatusAcao;
  evidenciaUrl?: string;
  observacoes?: string;
}

/**
 * 6. AÇÕES PREVENTIVAS / MELHORIAS
 */
export interface AcaoPreventivaNC {
  id: string;
  rncId: string;
  descricaoOportunidadeMelhoria: string;
  processoAfetado: string;
  responsavelNome: string;
  responsavelEmail: string;
  prazoLimite: string;
  dataConclusao?: string;
  status: StatusAcao;
  licaoAprendida: string;
}

/**
 * 7. RETRABALHOS DE QUALIDADE
 */
export interface RetrabalhoQualidade {
  id: string;
  empresaId: string;
  numeroRetrabalho: string; // Ex: RET-2026-0045
  rncId?: string;
  rncNumero?: string;
  opOrigemId?: string;
  opOrigemNumero?: string;
  produtoCodigo: string;
  produtoDescricao: string;
  quantidadeParaRetrabalhar: number;
  quantidadeRetrabalhadaSucesso: number;
  quantidadePerdidaAposRetrabalho: number;
  unidadeMedida: string;
  instrucaoRetrabalho: string;
  setor: string;
  maquinaId?: string;
  maquinaNome?: string;
  operadorNome?: string;
  horasEstimadas: number;
  horasReais: number;
  custoHoraParametrizado: number;
  custoTotalRetrabalho: number;
  dataInicio?: string;
  dataFim?: string;
  status: StatusRetrabalho;
  aprovadoPor?: string;
  criadoEm: string;
}

/**
 * 8. REFUGOS & SUCATAS DE QUALIDADE
 */
export interface RefugoQualidade {
  id: string;
  empresaId: string;
  numeroRefugo: string; // Ex: REF-2026-0092
  rncId?: string;
  rncNumero?: string;
  inspecaoId?: string;
  opOrigemNumero?: string;
  produtoCodigo: string;
  descricaoMaterial: string;
  motivoCategoria: string;
  detalheMotivo: string;
  quantidadeRefugada: number;
  unidadeMedida: string;
  pesoTotalKg: number;
  precoUnitarioKg: number;
  custoTotalPrejuizo: number;
  fornecedorId?: string;
  fornecedorNome?: string;
  maquinaId?: string;
  maquinaNome?: string;
  setor: string;
  destinoMaterial: 'SUCATA_VENDA' | 'DESCARTE_ECOLOGICO' | 'RETORNO_FORNECEDOR';
  notaDevolucaoFornecedor?: string;
  responsavelRegistro: string;
  dataRegistro: string;
  status: StatusRefugo;
}

/**
 * EVIDÊNCIAS DE QUALIDADE
 */
export interface EvidenciaQualidade {
  id: string;
  titulo: string;
  tipo: 'FOTO' | 'LAUDO_TECNICO' | 'RELATORIO_DIMENSIONAL' | 'CERTIFICADO' | 'DESENHO_MARCADO';
  url: string;
  dataUpload: string;
  descricao?: string;
}

/**
 * 9. NÃO CONFORMIDADES (RNC / NC)
 */
export interface NaoConformidade {
  id: string;
  empresaId: string;
  numeroRNC: string; // Ex: RNC-2026-0034
  titulo: string;
  dataAbertura: string;
  status: StatusNC;
  severidade: SeveridadeNC;
  origem: OrigemNC;

  // Contexto do Problema
  inspecaoOrigemId?: string;
  inspecaoOrigemNumero?: string;
  descricaoProblema: string;
  detalhesTecnicosDefeito: string;

  produtoCodigo: string;
  produtoDescricao: string;
  lote?: string;
  corridaAco?: string;
  opId?: string;
  opNumero?: string;
  pedidoNumero?: string;
  maquinaId?: string;
  maquinaNome?: string;
  fornecedorId?: string;
  fornecedorNome?: string;
  setor: string;

  quantidadeInspecionada: number;
  quantidadeNaoConforme: number;
  unidadeMedida: string;
  valorPrejuizoEstimado: number;

  // Disposição Imediata
  acaoDisposicaoImediata: string;
  responsavelDisposicao: string;
  dataDisposicao?: string;
  resultadoDisposicao: DisposicaoQualidade;

  // Análise de Causas
  causas: CausaNC[];

  // Planos de Ação
  acoesCorretivas: AcaoCorretivaNC[];
  acoesPreventivas: AcaoPreventivaNC[];

  // Rastreabilidade de Retrabalhos e Refugos
  retrabalhos: RetrabalhoQualidade[];
  refugos: RefugoQualidade[];

  // Responsabilidades & Prazos
  responsavelAbertura: string;
  responsavelInvestigacao: string;
  responsavelAcoes: string;
  prazoLimiteConclusao: string;
  dataConclusaoReal?: string;

  // Evidências
  evidencias: EvidenciaQualidade[];

  // Avaliação de Eficácia (Verificação pós-implementação)
  avaliacaoEficaciaDescricao?: string;
  eficaz?: boolean;
  validadoPor?: string;
  dataValidacaoEficacia?: string;

  criadoEm: string;
  atualizadoEm: string;
}

/**
 * 10. INDICADORES E PARETO DE QUALIDADE (DASHBOARD ANALÍTICO)
 */
export interface IndicadoresQualidade {
  empresaId: string;
  periodoReferencia: string;

  // Visão Macro
  totalInspecoes: number;
  totalAprovadas: number;
  totalAprovadasComDesvio: number;
  totalReprovadas: number;
  totalQuarentena: number;
  totalRetrabalho: number;
  totalSucata: number;
  taxaAprovacaoPercentual: number;

  // Refugo / Sucata
  indiceRefugoPercentual: number;
  pesoTotalRefugadoKg: number;
  custoTotalRefugo: number;

  // Retrabalho
  indiceRetrabalhoPercentual: number;
  horasTotaisRetrabalho: number;
  custoTotalRetrabalho: number;

  // Custo da Não Qualidade (CNQ)
  custoNaoQualidadeTotal: number; // Refugo + Retrabalho + Perdas Fornecedor
  custoCNQPorFaturamentoEstimadoPercentual: number;

  // RNCs por Status e Severidade
  totalRNCs: number;
  rncsAbertas: number;
  rncsEmExecucao: number;
  rncsAguardandoEficacia: number;
  rncsConcluidasEficazes: number;
  rncsCriticas: number;

  // Rank / Pareto por Fornecedor
  ncPorFornecedor: Array<{
    fornecedorId: string;
    fornecedorNome: string;
    totalInspecoes: number;
    totalNCs: number;
    taxaRejeicaoPercentual: number;
    custoPrejuizo: number;
    principaisDefeitos: string[];
  }>;

  // Rank / Pareto por Máquina
  ncPorMaquina: Array<{
    maquinaId: string;
    maquinaNome: string;
    setor: string;
    totalNCs: number;
    pecasAfetadas: number;
    horasRetrabalho: number;
    custoPerda: number;
    principaisDefeitos: string[];
  }>;

  // Rank / Pareto por Processo / Setor
  ncPorProcesso: Array<{
    setor: string;
    nomeSetor: string;
    totalInspecoes: number;
    totalNCs: number;
    taxaReprovacaoPercentual: number;
    custoCNQ: number;
  }>;
}
