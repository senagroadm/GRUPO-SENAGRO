export type StatusProjeto =
  | 'EM_DESENVOLVIMENTO'
  | 'HOMOLOGADO'
  | 'EM_PRODUCAO'
  | 'OBSOLETO'
  | 'CANCELADO';

export type CategoriaProjeto =
  | 'ESTRUTURA_METALICA'
  | 'MAQUINARIO_INDUSTRIAL'
  | 'CHASSI_VEICULAR'
  | 'TUBULACAO_CALDEIRARIA'
  | 'PECA_ESTAMPADA'
  | 'RESERVATORIO_SILO';

export type StatusRevisao =
  | 'RASCUNHO'
  | 'EM_APROVACAO'
  | 'ATIVA'
  | 'OBSOLETA'
  | 'CANCELADA';

export type TipoItemBOM =
  | 'MATERIA_PRIMA'
  | 'COMPONENTE'
  | 'SUB_CONJUNTO'
  | 'FIXACAO'
  | 'ACABAMENTO'
  | 'CONSUMIVEL';

export type SetorFabricacao =
  | 'CORTE_LASER'
  | 'DOBRA_CNC'
  | 'CALDEIRARIA_SOLDA'
  | 'USINAGEM'
  | 'PINTURA_TRATAMENTO'
  | 'MONTAGEM'
  | 'INSPECAO_QUALIDADE';

export type TipoArquivoTecnico =
  | 'DESENHO_2D'
  | 'MODELO_3D'
  | 'ESPECIFICACAO_TECNICA'
  | 'MEMORIAL_CALCULO'
  | 'LAUDO_ENSAIO'
  | 'PROGRAMA_CNC_CAM'
  | 'PLANO_CORTE_NESTING';

export type FormatoArquivo =
  | 'PDF'
  | 'DWG'
  | 'DXF'
  | 'STEP'
  | 'IGES'
  | 'SLDPRT'
  | 'SLDASM'
  | 'DOCX'
  | 'XLSX'
  | 'NC_GCODE';

/**
 * Entidade: Projetos
 */
export interface Projeto {
  id: string;
  codigo: string; // Ex: 'PRJ-2026-CHAS-01'
  titulo: string;
  descricao: string;
  clienteId: string;
  clienteNome: string;
  responsavelNome: string;
  categoria: CategoriaProjeto;
  status: StatusProjeto;
  empresaId: string;
  dataCriacao: string;
  dataAtualizacao: string;
  // Denormalized quick pointers to current active revision
  revisaoAtivaId?: string;
  revisaoAtivaVersao?: string;
  custoTotalEstimadoRevisaoAtiva?: number;
  tempoTotalFabricacaoMinutosRevisaoAtiva?: number;
  pesoTotalEstimadoKgRevisaoAtiva?: number;
}

/**
 * Entidade: Projeto Revisões (projeto_revisoes)
 * REGRAS:
 * - Revisão tem versão (Rev 00, Rev 01, etc.).
 * - Apenas UMA revisão pode estar ativa para cada projeto.
 * - Nenhuma alteração apaga a anterior (imutabilidade e histórico).
 */
export interface ProjetoRevisao {
  id: string;
  projetoId: string;
  versao: string; // Ex: 'Rev 00', 'Rev 01', 'Rev 02'
  numeroSequencial: number; // 0, 1, 2, 3...
  descricaoModificacoes: string;
  motivoRevisao: string;
  status: StatusRevisao;
  ativa: boolean; // Flag booleana: se true, é a revisão oficial ativa do projeto
  dataCriacao: string;
  criadoPor: string;
  dataLiberacao?: string;
  liberadoPor?: string;
  parecerAprovacao?: string;
  empresaId: string;
}

/**
 * Entidade: Estruturas de Produto (estruturas_produto - BOM)
 */
export interface EstruturaProduto {
  id: string;
  projetoId: string;
  revisaoId: string;
  codigoEstrutura: string;
  versao: string;
  descricao: string;
  dataValidadeInicio: string;
  custoTotalEstimado: number;
  pesoTotalEstimadoKg: number;
  empresaId: string;
  itens: EstruturaItem[];
}

/**
 * Entidade: Itens da Estrutura (estrutura_itens)
 * REGRA:
 * - BOM suporta componentes, quantidades e perdas (% de refugo/queima/nesting).
 */
export interface EstruturaItem {
  id: string;
  estruturaId: string;
  itemSequencia: number; // 10, 20, 30, 40...
  produtoId: string;
  codigo: string;
  descricao: string;
  tipoItem: TipoItemBOM;
  quantidadeLiquida: number; // Quantidade de projeto necessária na peça pronta
  unidadeMedida: string; // 'CHAPA', 'BARRA', 'KG', 'M2', 'UN', 'PC', 'METRO'
  percentualPerda: number; // Ex: 8.5% (perda de retalho / corte / queima)
  quantidadeBruta: number; // Calculada: quantLiquida * (1 + percentualPerda / 100)
  nestingOuCorteInfo?: string; // Ex: 'Corte em chapa 1500x6000 #4.75mm - aproveitamento 91.5%'
  custoUnitarioEstimado: number;
  custoTotalItem: number; // quantidadeBruta * custoUnitarioEstimado
  pesoUnitarioKg: number;
  pesoTotalKg: number; // quantidadeBruta * pesoUnitarioKg
  observacoesTecnicas?: string;
  dimensoesBrutasMm?: {
    espessura?: number;
    largura?: number;
    comprimento?: number;
  };
}

/**
 * Entidade: Roteiros de Fabricação (roteiros)
 */
export interface Roteiro {
  id: string;
  projetoId: string;
  revisaoId: string;
  codigoRoteiro: string;
  versao: string;
  descricao: string;
  tempoPreparacaoTotalMinutos: number;
  tempoOperacaoTotalMinutos: number;
  tempoTotalPadraoMinutos: number;
  custoTotalMaoDeObra: number;
  empresaId: string;
  operacoes: RoteiroOperacao[];
}

/**
 * Entidade: Operações do Roteiro (roteiro_operacoes)
 * REGRA:
 * - Roteiro suporta sequência, operação, setor, máquina, ferramenta e tempo padrão (setup + ciclo).
 */
export interface RoteiroOperacao {
  id: string;
  roteiroId: string;
  sequencia: number; // 10, 20, 30, 40...
  operacaoNome: string; // Ex: 'Corte a Laser 4kW Fibra Óptica'
  setor: SetorFabricacao;
  maquina: string; // Ex: 'Laser Trumpf TruLaser 3030'
  ferramenta: string; // Ex: 'Bico 1.5mm / Gás O2'
  tempoPreparacaoMinutos: number; // Setup
  tempoOperacaoMinutos: number; // Ciclo unitário
  tempoPadraoTotalMinutos: number; // Setup + Ciclo
  custoHoraMaquina: number;
  custoTotalOperacao: number; // (tempoPadraoTotalMinutos / 60) * custoHoraMaquina
  instrucaoTecnica: string;
  desenhosOuFotosRef?: string;
  exigeInspecaoQualidade: boolean;
}

/**
 * Entidade: Arquivos Técnicos (arquivos_tecnicos)
 * REGRA:
 * - Arquivos técnicos são vinculados por projeto/revisão.
 */
export interface ArquivoTecnico {
  id: string;
  projetoId: string;
  revisaoId: string;
  revisaoVersao: string;
  nomeArquivo: string;
  tipo: TipoArquivoTecnico;
  formato: FormatoArquivo;
  tamanhoBytes: number;
  tamanhoFormatado: string;
  url: string;
  hashMd5: string;
  autor: string;
  dataUpload: string;
  observacoes?: string;
  empresaId: string;
}

/**
 * Entidade: Rastreabilidade de Ordem de Produção (OP)
 * REGRA:
 * - OP deve registrar qual revisão foi usada.
 */
export interface OrdemProducaoVinculo {
  id: string;
  numeroOp: string;
  projetoId: string;
  projetoCodigo: string;
  projetoTitulo: string;
  revisaoId: string;
  revisaoVersao: string; // Snapshot imutável da versão usada na OP
  dataSnapshotBOM: string;
  statusOp: 'PLANEJADA' | 'LIBERADA_FABRICA' | 'EM_PRODUCAO' | 'CONCLUIDA';
  quantidadeProduzir: number;
  dataLiberacao: string;
  empresaId: string;
}

/**
 * Entidade: Histórico de Engenharia & Auditoria
 */
export interface HistoricoEngenhariaEvento {
  id: string;
  projetoId: string;
  revisaoId?: string;
  revisaoVersao?: string;
  tipoEvento:
    | 'CRIACAO_PROJETO'
    | 'CRIACAO_REVISAO'
    | 'MODIFICACAO_BOM'
    | 'MODIFICACAO_ROTEIRO'
    | 'UPLOAD_ARQUIVO'
    | 'APROVACAO_REVISAO'
    | 'ATIVACAO_REVISAO'
    | 'OBSOLESCENCIA_REVISAO'
    | 'VINCULO_ORDEM_PRODUCAO';
  descricao: string;
  usuarioNome: string;
  dataHora: string;
  empresaId: string;
  detalhes?: Record<string, any>;
}

/**
 * View model consolidado do projeto com todo seu contexto de engenharia
 */
export interface ProjetoDetalhado {
  projeto: Projeto;
  revisoes: ProjetoRevisao[];
  revisaoAtiva: ProjetoRevisao | null;
  revisaoSelecionada: ProjetoRevisao | null;
  estruturaBOM: EstruturaProduto | null;
  roteiro: Roteiro | null;
  arquivos: ArquivoTecnico[];
  ordensProducao: OrdemProducaoVinculo[];
  historico: HistoricoEngenhariaEvento[];
}
