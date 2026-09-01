export type TipoItemOrcamento = 'PRODUTO_PRONTO' | 'PRODUTO_FABRICADO' | 'SERVICO' | 'PRODUTO_SERVICO';

export type StatusOrcamento =
  | 'RASCUNHO'
  | 'EM_ANALISE_TECNICA'
  | 'PENDENTE_APROVACAO'
  | 'APROVADO'
  | 'REJEITADO_INTERNO'
  | 'ENVIADO_CLIENTE'
  | 'EM_NEGOCIACAO'
  | 'GANHO'
  | 'PERDIDO'
  | 'CANCELADO';

export type TipoProcessoCorte = 'LASER_FIBRA' | 'PLASMA_HD' | 'OXICORTE' | 'SERRA_FITA' | 'GUILHOTINA' | 'NAO_APLICA';
export type TipoProcessoDobra = 'CNC_SINCRONIZADA' | 'CONVENCIONAL' | 'CALANDRA' | 'NAO_APLICA';
export type TipoProcessoSolda = 'MIG_MAG' | 'TIG' | 'ELETRODO' | 'ARAME_TUBULAR' | 'ROBO_SOLDA' | 'NAO_APLICA';
export type TipoProcessoPintura = 'PO_ELETROSTATICA' | 'LIQUIDA_PU_EPOXI' | 'PRIMER_ANTICORROSIVO' | 'JATEAMENTO_GRANALHA' | 'GALVANIZACAO_FOGO' | 'NAO_APLICA';
export type TipoFrete = 'CIF' | 'FOB' | 'RETIRA' | 'SEM_FRETE';

/**
 * Parâmetros de taxas e custos industriais parametrizáveis por Empresa
 */
export interface ParametrosCustoEmpresa {
  empresaId: string;
  // Custos/hora dos centros de trabalho (R$/hora)
  taxaHoraLaser: number;
  taxaHoraPlasma: number;
  taxaHoraOxicorte: number;
  taxaHoraDobra: number;
  taxaHoraSolda: number;
  taxaHoraPintura: number;
  taxaHoraMontagem: number;
  taxaHoraUsinagem: number;
  taxaHoraEngenharia: number;

  // Taxa horária de Mão de Obra Direta com Encargos (R$/hora)
  taxaMaoDeObraDiretaPadrao: number;
  fatorEncargosSociais: number; // Ex: 1.80 (80% de encargos)

  // Custos Indiretos de Fabricação (GGF / CIF)
  fatorCustosIndiretosPercentual: number; // Ex: 15% sobre o custo direto

  // Alíquotas de Tributos Médias Estimadas (%)
  aliquotaIcmsPadrao: number; // Ex: 12% ou 18%
  aliquotaIpiPadrao: number; // Ex: 5% ou 10%
  aliquotaPisPadrao: number; // Ex: 1.65%
  aliquotaCofinsPadrao: number; // Ex: 7.60%
  aliquotaIssqnPadrao: number; // Ex: 5.00% (para serviços puros)

  // Política Comercial Padrão (%)
  margemLucroAlvoPadrao: number; // Ex: 25%
  margemLucroMinimaPermitida: number; // Ex: 15% (abaixo disso exige aprovação)
  aliquotaComissaoPadrao: number; // Ex: 3%
  limiteDescontoVendedorPercentual: number; // Ex: 5%
  limiteDescontoGerentePercentual: number; // Ex: 12%

  // Tabela de Preço de Materiais Base (R$/kg)
  precosMateriaisKg: Record<string, number>;
}

/**
 * Detalhamento dos custos de corte
 */
export interface CustoCorteDetalhado {
  processo: TipoProcessoCorte;
  espessuraMm: number;
  comprimentoCorteMetros: number;
  numeroPerfuracoes: number;
  velocidadeCorteMmMin: number;
  tempoCorteMinutos: number;
  taxaHoraAplicada: number;
  custoTotalCorte: number;
}

/**
 * Detalhamento dos custos de dobra
 */
export interface CustoDobraDetalhado {
  processo: TipoProcessoDobra;
  espessuraMm: number;
  comprimentoDobraMm: number;
  numeroDobras: number;
  tempoSetupMinutos: number;
  tempoPorDobraSegundos: number;
  tempoTotalMinutos: number;
  taxaHoraAplicada: number;
  custoTotalDobra: number;
}

/**
 * Detalhamento dos custos de solda
 */
export interface CustoSoldaDetalhado {
  processo: TipoProcessoSolda;
  tipoJunta: string; // Ex: Topo, Filete, Chanfro V
  comprimentoSoldaMm: number;
  horasSoldador: number;
  consumoArameKg: number;
  precoArameKg: number;
  consumoGasM3: number;
  precoGasM3: number;
  taxaHoraSolda: number;
  custoMaoObraSolda: number;
  custoConsumiveisSolda: number;
  custoTotalSolda: number;
}

/**
 * Detalhamento dos custos de pintura e tratamento de superfície
 */
export interface CustoPinturaDetalhado {
  processo: TipoProcessoPintura;
  areaPinturaM2: number;
  numeroDemaos: number;
  espessuraCamadaMicrons: number;
  rendimentoTintaM2Litro: number;
  precoTintaLitroOuKg: number;
  tempoCabineMinutos: number;
  taxaHoraPintura: number;
  custoInsumoPintura: number;
  custoOperacionalPintura: number;
  custoTotalPintura: number;
}

/**
 * Detalhamento dos custos de montagem e ajustagem
 */
export interface CustoMontagemDetalhado {
  horasMontador: number;
  taxaHoraMontador: number;
  tempoAjusteMinutos: number;
  insumosFixacaoValor: number; // parafusos, arruelas, gaxetas
  custoTotalMontagem: number;
}

/**
 * Detalhamento dos custos de materiais (chapas, tubos, perfis, componentes)
 */
export interface CustoMaterialDetalhado {
  tipoMaterial: string; // Ex: Aço Carbono SAE 1020, Inox 304, Alumínio 5052
  formato: 'CHAPA' | 'TUBO_REDONDO' | 'TUBO_QUADRADO' | 'PERFIL_W' | 'BARRA_CHATA' | 'COMPONENTE_PRONTO';
  especificacao: string; // Ex: Chapa 3/16" (4.75mm) x 1200 x 3000
  densidadeMaterialKgDm3: number; // 7.85 para aço carbono, 7.93 para inox, 2.70 para alumínio
  espessuraMm?: number;
  larguraMm?: number;
  comprimentoMm?: number;
  diametroMm?: number;
  pesoLiquidoKg: number;
  fatorPerdaAproveitamento: number; // Ex: 1.15 (15% de perda no ninho/retalho)
  pesoBrutoKg: number;
  precoKg: number;
  custoTotalMaterial: number;
}

/**
 * Memória de cálculo consolidada de custos do item
 */
export interface ComposicaoCustoItem {
  custoMaterial: number;
  detalheMaterial?: CustoMaterialDetalhado;
  custoCorte: number;
  detalheCorte?: CustoCorteDetalhado;
  custoDobra: number;
  detalheDobra?: CustoDobraDetalhado;
  custoSolda: number;
  detalheSolda?: CustoSoldaDetalhado;
  custoPintura: number;
  detalhePintura?: CustoPinturaDetalhado;
  custoMontagem: number;
  detalheMontagem?: CustoMontagemDetalhado;
  custoMaoDeObraDiretaOutros: number;
  custoInsumosTerceirizados: number;

  // Totais de Custo
  totalCustoDireto: number;
  custosIndiretosFabricacao: number; // GGF / CIF rateado
  custoUnitarioTotal: number;

  // Formação de Preço
  aliquotaImpostosTotalPercentual: number;
  valorImpostosEstimados: number;
  aliquotaComissaoPercentual: number;
  valorComissaoEstimada: number;
  margemLucroPercentual: number;
  valorMargemLucro: number;
  precoUnitarioMinimo: number;
  precoUnitarioSugerido: number;
  precoUnitarioFinal: number;
}

/**
 * Item individual do Orçamento
 */
export interface OrcamentoItem {
  id: string;
  orcamentoId: string;
  sequencia: number;
  tipoItem: TipoItemOrcamento;
  codigoItem: string;
  descricao: string;
  ncm?: string;
  unidadeMedida: 'UN' | 'PC' | 'KG' | 'M' | 'M2' | 'CJ' | 'HORA' | 'SERVICO';
  quantidade: number;

  // Valores Unitários e Totais
  custoUnitario: number;
  precoUnitarioMinimo: number;
  precoUnitarioSugerido: number;
  precoUnitarioFinal: number;
  percentualDesconto: number;
  valorDescontoUnitario: number;

  subtotalCusto: number;
  subtotalFinal: number;
  margemContribuicaoValor: number;
  margemContribuicaoPercentual: number;

  // Memória Técnica de Custos
  composicaoCusto?: ComposicaoCustoItem;

  // Observações específicas do item
  desenhoReferencia?: string;
  detalhesTecnicos?: string;
  imagemUrl?: string | null;
}

/**
 * Versão / Revisão do Orçamento
 */
export interface OrcamentoVersao {
  id: string;
  orcamentoId: string;
  numeroVersao: number; // 1, 2, 3...
  codigoVersao: string; // Ex: ORC-2026-0042-REV01
  dataVersao: string;
  autorId: string;
  autorNome: string;
  motivoRevisao: string;
  itensSnapshot: OrcamentoItem[];
  resumoFinanceiro: {
    custoTotal: number;
    precoSugeridoTotal: number;
    precoFinalTotal: number;
    valorDescontoTotal: number;
    percentualDescontoTotal: number;
    margemLucroTotalPercentual: number;
    margemLucroTotalValor: number;
    impostosTotais: number;
  };
  criadoEm: string;
}

/**
 * Registro do Histórico de Negociação e Alçadas
 */
export interface HistoricoNegociacaoOrcamento {
  id: string;
  orcamentoId: string;
  data: string;
  usuarioId: string;
  usuarioNome: string;
  tipoEvento:
    | 'CRIACAO'
    | 'NOVA_VERSAO'
    | 'ALTERACAO_PRECO'
    | 'SOLICITACAO_APROVACAO'
    | 'APROVACAO_CONCEDIDA'
    | 'APROVACAO_REJEITADA'
    | 'ENVIO_PROPOSTA_CLIENTE'
    | 'CONTRAPROPOSTA_CLIENTE'
    | 'STATUS_ALTERADO'
    | 'ANEXO_VINCULADO';
  descricao: string;
  dadosAnteriores?: Record<string, any>;
  dadosNovos?: Record<string, any>;
}

/**
 * Regra de Aprovação e Alçadas
 */
export interface RegraAprovacaoOrcamento {
  id: string;
  empresaId: string;
  nome: string;
  tipoGatilho: 'DESCONTO_EXCESSIVO' | 'MARGEM_INSUFICIENTE' | 'VALOR_TOTAL_ALTO' | 'PRAZO_ESPECIAL';
  valorLimite: number; // Ex: 10% desconto, 18% margem mínima, R$ 100.000 valor
  nivelAprovadorNecessario: 'GERENTE_COMERCIAL' | 'DIRETOR_INDUSTRIAL' | 'DIRETOR_GERAL';
  ativo: boolean;
}

/**
 * Orçamento Principal (Header + Relações)
 */
export interface Orcamento {
  id: string;
  empresaId: string; // Isolamento estrito por CNPJ
  numeroOrcamento: string; // Ex: ORC-2026-0001
  versaoAtual: number; // 1, 2, 3...
  codigoIdentificacao: string; // Ex: ORC-2026-0001-REV01
  tituloProjeto: string;

  // Vínculos Comerciais
  clienteId: string;
  clienteNome: string;
  clienteCnpj: string;
  contatoNome: string;
  contatoEmail: string;
  contatoTelefone?: string;
  vendedorId: string;
  vendedorNome: string;
  vendedorEmail: string;

  // Status e Workflow
  status: StatusOrcamento;
  exigeAprovacao: boolean;
  motivoExigenciaAprovacao?: string;
  aprovadorId?: string;
  aprovadorNome?: string;
  dataAprovacao?: string;
  justificativaAprovacao?: string;

  // Prazos e Condições Comerciais
  dataEmissao: string;
  validadeDias: number;
  dataValidade: string;
  prazoEntregaDias: number;
  condicaoPagamento: string; // Ex: "30 / 60 / 90 dias", "À Vista 5% desc", "50% Sinal + 50% Faturamento"
  tipoFrete: TipoFrete;
  valorFrete: number;
  localEntregaCidade?: string;
  localEntregaUf?: string;

  // Totais e Formação de Preço
  quantidadeItens: number;
  custoTotalEstimado: number;
  precoMinimoTotal: number;
  precoSugeridoTotal: number;
  precoFinalTotal: number;
  valorDescontoTotal: number;
  percentualDescontoTotal: number;
  impostosEstimadosTotais: number;
  comissaoEstimadaTotal: number;
  margemLucroEstimadaValor: number;
  margemLucroEstimadaPercentual: number;

  // Cláusulas e Observações
  observacoesGerais: string;
  observacoesInternas?: string;
  garantiaMeses: number;

  // Vínculos e Anexos (integração Storage)
  anexosIds: string[];

  // Itens da versão ativa
  itens: OrcamentoItem[];

  // Metadados
  criadoPorId: string;
  criadoPorNome: string;
  createdAt: string;
  updatedAt: string;
}
