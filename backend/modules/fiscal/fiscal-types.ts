/**
 * NEXUS ERP - Módulo Fiscal Desacoplado
 * Tipos e Definições de Domínio Tributário & Documentos Fiscais
 * Isolamento Multiempresa, Séries Independentes, Extensão IBS/CBS
 */

export type ModeloDocumentoFiscal = 'NFE_55' | 'NFSE' | 'NFCE_65' | 'CTE_57' | 'MDFE_58';

export type AmbienteFiscal = 'HOMOLOGACAO' | 'PRODUCAO';

export type TipoEmissaoFiscal = 'NORMAL' | 'CONTINGENCIA_FSDA' | 'CONTINGENCIA_EPEC' | 'CONTINGENCIA_SVC_AN' | 'CONTINGENCIA_SVC_RS';

export type RegimeTributario = 'SIMPLES_NACIONAL' | 'SIMPLES_EXCESSO_RECEITA' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';

export type StatusDocumentoFiscal =
  | 'RASCUNHO'
  | 'VALIDADO'
  | 'ASSINADO'
  | 'ENVIADO_PROCESSAMENTO'
  | 'AUTORIZADO'
  | 'REJEITADO'
  | 'CANCELADO'
  | 'DENEGADO'
  | 'INUTILIZADO'
  | 'SUBSTITUIDO';

export type TipoEventoFiscal =
  | 'CANCELAMENTO'
  | 'CARTA_CORRECAO_CCE'
  | 'INUTILIZACAO'
  | 'MANIFESTACAO_DESTINATARIO'
  | 'PRORROGACAO_SUSPENSAO';

export type FinalidadeNFe = 'NORMAL' | 'COMPLEMENTAR' | 'AJUSTE' | 'DEVOLUCAO_RETORNO';

export type TipoOperacaoNFe = 'ENTRADA' | 'SAIDA';

// -------------------------------------------------------------
// 1. CONFIGURAÇÕES FISCAIS POR EMPRESA
// -------------------------------------------------------------
export interface ConfiguracaoFiscal {
  id: string;
  empresaId: string;
  ambientePadrao: AmbienteFiscal;
  regimeTributario: RegimeTributario;
  inscricaoEstadual: string;
  inscricaoMunicipal?: string;
  cnaePrincipal?: string;
  codigoMunicipioIBGE: string;
  ufEmissao: string;
  aliquotaSimplesNacionalPercentual?: number;
  incentivadorCultural: boolean;
  certificadoReferenciaId?: string;
  danfePadraoLogotipoUrl?: string;
  observacoesFiscoPadrao?: string;
  observacoesContribuintePadrao?: string;
  habilitarReformaTributariaIbsCbs: boolean; // Flag para cálculo dual / transição
  criadoEm: string;
  atualizadoEm: string;
}

// -------------------------------------------------------------
// 2. CERTIFICADOS DIGITAIS (REFERÊNCIAS - SEM SENHA EM CLARO)
// -------------------------------------------------------------
export interface CertificadoReferencia {
  id: string;
  empresaId: string;
  tipo: 'A1_ARQUIVO' | 'A3_HSM' | 'CLOUD_VAULT';
  aliasNome: string;
  cnpjTitular: string;
  razaoSocialTitular: string;
  emissorAutoridadeCertificadora: string;
  numeroSerieHex: string;
  validoDe: string;
  validoAte: string;
  status: 'VALIDO' | 'EXPIRADO' | 'REVOGADO' | 'PROXIMO_VENCIMENTO';
  diasAteVencimento: number;
  vaultSecretKeyRef: string; // Referência segura no gerenciador de segredos
  ativo: boolean;
}

// -------------------------------------------------------------
// 3. SÉRIES & NUMERAÇÕES FISCAIS INDEPENDENTES
// -------------------------------------------------------------
export interface SerieFiscal {
  id: string;
  empresaId: string;
  modelo: ModeloDocumentoFiscal;
  serieNumero: number;
  ambiente: AmbienteFiscal;
  descricao: string;
  ultimoNumeroUtilizado: number;
  bloqueadoParaUso: boolean;
  ativo: boolean;
  criadoEm: string;
}

export interface NumeracaoFiscalLog {
  id: string;
  empresaId: string;
  serieFiscalId: string;
  numeroReservado: number;
  documentoFiscalId?: string;
  status: 'RESERVADO' | 'UTILIZADO' | 'INUTILIZADO' | 'CANCELADO';
  reservadoPorUsuarioId: string;
  timestamp: string;
  motivoInutilizacao?: string;
}

// -------------------------------------------------------------
// 4. OPERAÇÕES FISCAIS (NATUREZA DE OPERAÇÃO & CFOP)
// -------------------------------------------------------------
export interface OperacaoFiscal {
  id: string;
  empresaId: string;
  codigoOperacao: string; // Ex: "VENDA_IND_ESTADUAL"
  descricaoNatureza: string; // Ex: "VENDA DE PRODUCAO DO ESTABELECIMENTO"
  tipoOperacao: TipoOperacaoNFe;
  cfopPadraoEstadual: string; // Ex: "5101"
  cfopPadraoInterestadual: string; // Ex: "6101"
  cfopPadraoExterior: string; // Ex: "7101"
  finalidade: FinalidadeNFe;
  movimentaEstoque: boolean;
  geraFinanceiro: boolean;
  consumidorFinalPadrao: boolean;
  indicadorPresencaPadrao: 'NAO_SE_APLICA' | 'PRESENCIAL' | 'INTERNET' | 'TELEATENDIMENTO' | 'OUTROS';
  textoPadraoDadosAdicionais?: string;
  ativo: boolean;
}

// -------------------------------------------------------------
// 5. REGRAS TRIBUTÁRIAS & MATRIZ DE ENQUADRAMENTO
// -------------------------------------------------------------
export interface RegraTributaria {
  id: string;
  empresaId: string;
  nomeRegra: string;
  prioridade: number; // 1 mais prioritária
  ufOrigem: string;
  ufDestino: string; // "SP", "RJ", ou "*" para todos
  tipoContribuinteDestino: 'CONTRIBUINTE_ICMS' | 'NAO_CONTRIBUINTE' | 'ORGAO_PUBLICO';
  regimeDestino: 'SIMPLES' | 'GERAL' | 'QUALQUER';
  
  // Enquadramento de ICMS
  cstIcms?: string; // Ex: "00", "10", "20", "60"
  csosnIcms?: string; // Ex: "101", "102", "500"
  aliquotaIcmsBasePercentual?: number;
  reducaoBaseIcmsPercentual?: number;
  diferimentoIcmsPercentual?: number;
  possuiStIcms: boolean;
  mvaStPercentual?: number;
  aliquotaIcmsInternaDestinoSt?: number;
  reducaoBaseIcmsStPercentual?: number;

  // Difal Partilha
  calculaDifal: boolean;
  aliquotaFcpDestinoPercentual?: number;

  // IPI
  cstIpi?: string; // Ex: "50", "51", "53"
  aliquotaIpiPercentual?: number;
  enquadramentoIpiCodigo?: string;

  // PIS / COFINS
  cstPis?: string; // Ex: "01", "06", "08"
  aliquotaPisPercentual?: number;
  cstCofins?: string; // Ex: "01", "06", "08"
  aliquotaCofinsPercentual?: number;

  // EXTENSÃO REFORMA TRIBUTÁRIA: IBS & CBS (Campos Extensíveis EC 132/2023)
  tributacaoIbsCbs?: TributacaoIbsCbsConfig;

  observacaoLegal?: string;
  ativo: boolean;
}

// -------------------------------------------------------------
// 6. TRIBUTAÇÃO DE PRODUTOS & SERVIÇOS
// -------------------------------------------------------------
export interface TributacaoProduto {
  id: string;
  empresaId: string;
  produtoId: string;
  codigoProduto: string;
  descricao: string;
  ncm: string; // Nomenclatura Comum do Mercosul (8 dígitos)
  cest?: string; // Código Especificador da ST (7 dígitos)
  origemMercadoria: '0_NACIONAL' | '1_IMPORTACAO_DIRETA' | '2_ESTRANGEIRA_ADQUIRIDA_MERCADO_INTERNO' | '4_NACIONAL_PPB';
  tipoItemSped: '00_MERCADORIA_REVENDA' | '01_MATERIA_PRIMA' | '02_EMBALAGEM' | '03_PRODUTO_PROCESSO' | '04_PRODUTO_ACABADO' | '05_SUBPRODUTO' | '06_PRODUTO_INTERMEDIARIO' | '07_MATERIAL_USO_CONSUMO' | '08_ATIVO_IMOBILIZADO';
  gtinEan?: string;
  gtinEanTributavel?: string;
  unidadeTributavel: string;
  fatorConversaoTributavel: number;
  isentoIpi: boolean;
  aliquotaIpiPropria?: number;
  codigoBeneficioFiscalUf?: string;
  
  // Extensão Reforma Tributária
  ibsCbsConfig?: TributacaoIbsCbsConfig;
  
  ativo: boolean;
}

export interface TributacaoServico {
  id: string;
  empresaId: string;
  servicoId: string;
  codigoServico: string;
  descricao: string;
  itemListaServicoLc116: string; // Ex: "07.02 - Execução de obras..."
  codigoTributacaoMunicipio: string; // Código municipal específico
  cnaeCodigo: string;
  aliquotaIssPercentual: number;
  issRetidoPadrao: boolean;
  exigibilidadeIss: 'EXIGIVEL' | 'ISENCAO' | 'IMUNIDADE' | 'EXPORTACAO' | 'SUSPENSO_JUDICIAL';
  retencaoPisPercentual?: number;
  retencaoCofinsPercentual?: number;
  retencaoCsllPercentual?: number;
  retencaoIrrfPercentual?: number;
  retencaoInssPercentual?: number;
  minimoRetencaoFederal: number; // R$ 10,00 ou conforme legislação
  ativo: boolean;
}

// -------------------------------------------------------------
// 7. EXTENSÃO REFORMA TRIBUTÁRIA (IBS & CBS)
// -------------------------------------------------------------
export interface TributacaoIbsCbsConfig {
  cstIbsCbs: string; // Código de Situação Tributária IBS/CBS
  aliquotaIbsEstadualPercentual: number; // Parcela Estadual
  aliquotaIbsMunicipalPercentual: number; // Parcela Municipal
  aliquotaCbsFederalPercentual: number; // CBS Federal Unificada
  reducaoAliquotaPercentual?: number; // Regimes diferenciados (saúde, educação, etc.)
  regimeEspecifico?: 'PADRAO' | 'COMBUSTIVEIS' | 'SERVICOS_FINANCEIROS' | 'IMOBILIARIO' | 'SIMPLES_COMPARTILHADO';
  aliquotaImpostoSeletivoPercentual?: number; // IS (Imposto Seletivo / Sin Tax)
  classificacaoTributariaNacional?: string; // Código unificado nacional
}

export interface MemoriaCalculoIbsCbs {
  baseCalculoIbsCbs: number;
  valorIbsEstadual: number;
  valorIbsMunicipal: number;
  valorIbsTotal: number;
  valorCbsFederal: number;
  valorImpostoSeletivo: number;
  valorTotalTributosNovaReforma: number;
}

// -------------------------------------------------------------
// 8. DOCUMENTOS FISCAIS & ITENS
// -------------------------------------------------------------
export interface DocumentoFiscalItem {
  id: string;
  numeroItem: number;
  produtoId?: string;
  servicoId?: string;
  codigoItem: string;
  descricao: string;
  ncm?: string;
  cest?: string;
  cfop: string;
  unidadeMedida: string;
  quantidade: number;
  valorUnitario: number;
  valorBrutoTotal: number;
  valorDescontoItem: number;
  valorFreteRateado: number;
  valorSeguroRateado: number;
  valorOutrasDespesasRateado: number;
  valorTotalLiquido: number;

  // Tributos ICMS
  origemMercadoria: string;
  cstCsosnIcms: string;
  baseCalculoIcms: number;
  aliquotaIcmsPercentual: number;
  valorIcms: number;
  baseCalculoIcmsSt: number;
  aliquotaIcmsStPercentual: number;
  valorIcmsSt: number;
  valorFcp: number;

  // Tributos IPI
  cstIpi?: string;
  baseCalculoIpi: number;
  aliquotaIpiPercentual: number;
  valorIpi: number;

  // PIS / COFINS
  cstPis?: string;
  baseCalculoPis: number;
  aliquotaPisPercentual: number;
  valorPis: number;
  cstCofins?: string;
  baseCalculoCofins: number;
  aliquotaCofinsPercentual: number;
  valorCofins: number;

  // ISS (para NFS-e ou item misto)
  baseCalculoIss?: number;
  aliquotaIssPercentual?: number;
  valorIss?: number;
  issRetido?: boolean;

  // Extensão Reforma Tributária
  memoriaIbsCbs?: MemoriaCalculoIbsCbs;

  // Metadados de rastreabilidade
  loteNumero?: string;
  numeroPedidoVenda?: string;
  itemPedidoVenda?: number;
}

export interface DocumentoFiscal {
  id: string;
  empresaId: string;
  modelo: ModeloDocumentoFiscal;
  serie: number;
  numeroDocumento: number;
  tipoEmissao: TipoEmissaoFiscal;
  ambiente: AmbienteFiscal;
  status: StatusDocumentoFiscal;
  chaveAcesso?: string; // 44 dígitos para NF-e
  codigoVerificacaoNfse?: string;
  numeroRps?: number;
  serieRps?: string;
  
  naturezaOperacao: string;
  operacaoFiscalId?: string;
  tipoOperacao: TipoOperacaoNFe;
  dataHoraEmissao: string;
  dataHoraSaidaEntrada?: string;

  // Destinatário / Tomador
  destinatario: {
    tipoPessoa: 'PJ' | 'PF' | 'ESTRANGEIRO';
    cnpjCpf: string;
    razaoSocialNome: string;
    nomeFantasia?: string;
    inscricaoEstadual?: string;
    inscricaoMunicipal?: string;
    indicadorIe: '1_CONTRIBUINTE' | '2_ISENTO' | '9_NAO_CONTRIBUINTE';
    emailNotificacao?: string;
    telefone?: string;
    endereco: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      codigoMunicipioIBGE: string;
      cidade: string;
      uf: string;
      cep: string;
      codigoPais?: string;
      pais?: string;
    };
  };

  // Itens
  itens: DocumentoFiscalItem[];

  // Totais Consolidados (Totais da NF-e)
  totais: {
    valorProdutosServicos: number;
    valorDescontos: number;
    valorFrete: number;
    valorSeguro: number;
    valorOutrasDespesas: number;
    baseCalculoIcms: number;
    valorTotalIcms: number;
    baseCalculoIcmsSt: number;
    valorTotalIcmsSt: number;
    valorTotalFcp: number;
    valorTotalIpi: number;
    baseCalculoPis: number;
    valorTotalPis: number;
    baseCalculoCofins: number;
    valorTotalCofins: number;
    valorTotalIss?: number;
    valorRetencoesFederais?: number;
    valorTotalDocumento: number;
    
    // Totais Reforma Tributária
    valorTotalIbs?: number;
    valorTotalCbs?: number;
    valorTotalImpostoSeletivo?: number;
  };

  // Transporte & Volumes
  transporte?: {
    modalidadeFrete: '0_CIF_EMITENTE' | '1_FOB_DESTINATARIO' | '2_TERCEIROS' | '3_PROPRIO_REMETENTE' | '4_PROPRIO_DESTINATARIO' | '9_SEM_FRETE';
    transportadoraCnpj?: string;
    transportadoraRazaoSocial?: string;
    transportadoraIe?: string;
    veiculoPlaca?: string;
    veiculoUf?: string;
    veiculoRntrc?: string;
    quantidadeVolumes?: number;
    especieVolumes?: string;
    pesoLiquidoKg?: number;
    pesoBrutoKg?: number;
  };

  // Cobrança & Faturas
  cobranca?: {
    numeroFatura?: string;
    valorOriginalFatura?: number;
    valorLiquidoFatura?: number;
    duplicatas: Array<{
      numeroDuplicata: string;
      dataVencimento: string;
      valorParcela: number;
    }>;
  };

  // Informações Adicionais
  informacoesAdicionais?: {
    dadosAdicionaisFisco?: string;
    dadosAdicionaisContribuinte?: string;
  };

  // Metadados de Protocolo e Autorização
  protocoloAutorizacao?: string;
  dataHoraAutorizacao?: string;
  motivoStatusSefaz?: string;
  codigoStatusSefaz?: number;
  xmlAssinado?: string;
  xmlDistribuicaoProtocolado?: string;
  pdfDanfeUrl?: string;

  // Idempotência & Rastreabilidade
  idempotencyKey: string;
  pedidoOrigemId?: string;
  ordemProducaoOrigemId?: string;
  usuarioEmissorId: string;
  criadoEm: string;
  atualizadoEm: string;
}

// -------------------------------------------------------------
// 9. EVENTOS FISCAIS (CC-e, CANCELAMENTO, INUTILIZAÇÃO)
// -------------------------------------------------------------
export interface EventoFiscal {
  id: string;
  empresaId: string;
  documentoFiscalId: string;
  chaveAcesso: string;
  tipoEvento: TipoEventoFiscal;
  numeroSequencialEvento: number;
  dataHoraEvento: string;
  detalhesEvento: {
    justificativa?: string;
    textoCorrecao?: string; // Para CC-e (mínimo 15 caracteres)
    serieInutilizada?: number;
    numeroInicialInutilizado?: number;
    numeroFinalInutilizado?: number;
    tipoManifestacao?: 'CONFIRMACAO_OPERACAO' | 'CIENCIA_OPERACAO' | 'DESCONHECIMENTO' | 'OPERACAO_NAO_REALIZADA';
  };
  protocoloEvento?: string;
  statusSefaz: 'AUTORIZADO' | 'REJEITADO' | 'PENDENTE';
  codigoStatusSefaz?: number;
  motivoStatusSefaz?: string;
  xmlEventoAssinado?: string;
  usuarioSolicitanteId: string;
  criadoEm: string;
}

// -------------------------------------------------------------
// 10. LOGS DE INTEGRAÇÃO FISCAL (AUDITORIA & DIAGNÓSTICO)
// -------------------------------------------------------------
export interface IntegracaoFiscalLog {
  id: string;
  empresaId: string;
  documentoFiscalId?: string;
  eventoFiscalId?: string;
  servico:
    | 'SEFAZ_AUTORIZACAO'
    | 'SEFAZ_RETORNO'
    | 'SEFAZ_EVENTO'
    | 'SEFAZ_INUTILIZACAO'
    | 'SEFAZ_STATUS_SERVICO'
    | 'SEFAZ_DISTRIBUICAO_DFE'
    | 'NFSE_PREFEITURA'
    | 'REFORMA_TRIBUTARIA_MOTOR';
  ambiente: AmbienteFiscal;
  idempotencyKey: string;
  endpointChamado: string;
  tempoRespostaMs: number;
  statusHttp: number;
  payloadEnvioFormatado: string;
  payloadRetornoFormatado: string;
  sucesso: boolean;
  mensagemErro?: string;
  timestamp: string;
}

// -------------------------------------------------------------
// 11. PAYLOAD DE SOLICITAÇÃO DE EMISSÃO & SIMULAÇÃO
// -------------------------------------------------------------
export interface EmissaoDocumentoRequest {
  empresaId: string;
  modelo: ModeloDocumentoFiscal;
  serieNumero?: number; // Se não informado, pega a série padrão ativa
  ambiente?: AmbienteFiscal; // Se não informado, pega da config da empresa
  idempotencyKey: string;
  operacaoFiscalCodigo: string;
  chaveReferenciadaNFe?: string; // Para devoluções e retornos referenciando chave original de 44 dígitos
  tipoDocumentoOrigem?: 'PEDIDO_VENDA' | 'ORDEM_PRODUCAO' | 'NOTA_COMPRA' | 'TRANSFERENCIA' | 'AVULSO';
  documentoOrigemId?: string;
  empresaDestinoIntercompanyId?: string; // Para transferências entre os CNPJs do grupo TRITECH
  destinatario: DocumentoFiscal['destinatario'];
  itens: Array<{
    produtoId?: string;
    servicoId?: string;
    codigoItem: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    valorDesconto?: number;
    ncmManual?: string;
    cfopManual?: string;
    loteNumero?: string;
    almoxarifadoOrigemId?: string;
    almoxarifadoDestinoId?: string;
  }>;
  transporte?: DocumentoFiscal['transporte'];
  cobranca?: DocumentoFiscal['cobranca'];
  observacoesContribuinte?: string;
  pedidoOrigemId?: string;
  usuarioId: string;
}

// -------------------------------------------------------------
// 12. PRÉ-VALIDAÇÃO FISCAL ESTRUTURADA
// -------------------------------------------------------------
export interface ItemValidacaoErro {
  campo: string;
  mensagem: string;
  severidade: 'BLOQUEANTE' | 'AVISO';
  categoria: 'EMPRESA' | 'CLIENTE' | 'PRODUTO' | 'TRIBUTACAO' | 'ENDERECO' | 'SERIE' | 'CERTIFICADO' | 'CONDICOES';
}

export interface PreValidacaoResult {
  valido: boolean;
  temAvisos: boolean;
  erros: ItemValidacaoErro[];
  avisos: ItemValidacaoErro[];
  resumoValidacoes: {
    empresaOk: boolean;
    clienteOk: boolean;
    produtosOk: boolean;
    tributacaoOk: boolean;
    enderecoOk: boolean;
    serieOk: boolean;
    certificadoOk: boolean;
    condicoesOk: boolean;
  };
  auditoriaTimestamp: string;
}

// -------------------------------------------------------------
// 13. INUTILIZAÇÃO DE NUMERAÇÃO FISCAL
// -------------------------------------------------------------
export interface InutilizacaoRequest {
  empresaId: string;
  modelo: ModeloDocumentoFiscal;
  serie: number;
  ano: number; // Ex: 26 (para 2026)
  numeroInicial: number;
  numeroFinal: number;
  justificativa: string; // Mínimo 15 caracteres
  ambiente?: AmbienteFiscal;
  usuarioId: string;
}

export interface InutilizacaoResponse {
  sucesso: boolean;
  protocoloInutilizacao?: string;
  dataHoraInutilizacao: string;
  codigoStatusSefaz: number;
  motivoStatusSefaz: string;
  xmlInutilizacaoAssinado?: string;
  logsIntegracao: IntegracaoFiscalLog[];
}

// -------------------------------------------------------------
// 14. IMPORTAÇÃO E PARSER DE XML
// -------------------------------------------------------------
export interface XmlItemParsed {
  numeroItem: number;
  codigoProduto: string;
  codigoEan?: string;
  descricao: string;
  ncm: string;
  cest?: string;
  cfop: string;
  unidadeMedida: string;
  quantidade: number;
  valorUnitario: number;
  valorTotalBruto: number;
  valorDesconto: number;
  valorFreteRateado: number;
  valorSeguroRateado: number;
  valorOutrasDespesasRateado: number;
  cstCsosnIcms: string;
  origemMercadoria?: string;
  baseCalculoIcms: number;
  aliquotaIcms: number;
  valorIcms: number;
  baseCalculoIcmsSt?: number;
  aliquotaIcmsSt?: number;
  valorIcmsSt?: number;
  baseCalculoIpi?: number;
  aliquotaIpi?: number;
  valorIpi: number;
  baseCalculoPis?: number;
  aliquotaPis?: number;
  valorPis: number;
  baseCalculoCofins?: number;
  aliquotaCofins?: number;
  valorCofins: number;
  loteNumero?: string;
  dataFabricacaoLote?: string;
  dataValidadeLote?: string;
  // Custo de Aquisição Rateado (Industrial)
  custoAquisicaoTotal: number;
  custoAquisicaoUnitario: number;
  aliquotaIcmsCreditoRecuperavel?: number;
  valorIcmsCreditoRecuperavel?: number;
  custoLiquidoAquisicaoUnitario?: number;
}

export interface ChaveAcessoNFeDecomposta {
  chaveAcesso: string;
  codigoUf: string;
  ufSigla: string;
  anoMesEmissao: string;
  cnpjEmitente: string;
  modelo: ModeloDocumentoFiscal;
  serie: number;
  numeroDocumento: number;
  tipoEmissao: TipoEmissaoFiscal;
  codigoNumerico: string;
  digitoVerificador: number;
  chaveValida: boolean;
}

export interface XmlNFeParsed {
  chaveAcesso: string;
  chaveDecomposta?: ChaveAcessoNFeDecomposta;
  modelo: ModeloDocumentoFiscal;
  serie: number;
  numeroDocumento: number;
  dataHoraEmissao: string;
  naturezaOperacao: string;
  tipoOperacao: TipoOperacaoNFe;
  tipoEmissao?: TipoEmissaoFiscal;
  finalidade?: FinalidadeNFe;
  emitente: {
    cnpjCpf: string;
    razaoSocialNome: string;
    nomeFantasia?: string;
    inscricaoEstadual?: string;
    inscricaoMunicipal?: string;
    cnae?: string;
    regimeTributarioCRT?: string;
    uf: string;
    municipio: string;
    codigoMunicipioIBGE: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cep: string;
    telefone?: string;
  };
  destinatario: {
    cnpjCpf: string;
    razaoSocialNome: string;
    inscricaoEstadual?: string;
    uf: string;
    municipio: string;
    codigoMunicipioIBGE: string;
    logradouro: string;
    numero: string;
    bairro: string;
    cep: string;
    telefone?: string;
  };
  itens: XmlItemParsed[];
  totais: {
    valorProdutos: number;
    valorFrete: number;
    valorSeguro: number;
    valorDesconto: number;
    valorOutrasDespesas?: number;
    baseCalculoIcms: number;
    valorIcms: number;
    baseCalculoIcmsSt?: number;
    valorIcmsSt?: number;
    valorIpi: number;
    valorPis: number;
    valorCofins: number;
    valorTotalNota: number;
    valorTotalTributosAproximado?: number;
  };
  transporte?: {
    modalidadeFrete: string;
    transportadora?: {
      cnpjCpf?: string;
      razaoSocial?: string;
      inscricaoEstadual?: string;
      enderecoCompleto?: string;
      municipio?: string;
      uf?: string;
    };
    volumes?: {
      quantidade?: number;
      especie?: string;
      marca?: string;
      pesoLiquidoKg?: number;
      pesoBrutoKg?: number;
    };
  };
  cobranca?: {
    fatura?: {
      numero?: string;
      valorOriginal?: number;
      valorLiquido?: number;
    };
    duplicatas: Array<{
      numero: string;
      vencimento: string;
      valor: number;
    }>;
  };
  informacoesAdicionais?: {
    informacoesFisco?: string;
    informacoesComplementaresContribuinte?: string;
  };
  protocoloAutorizacao?: string;
  dataHoraAutorizacao?: string;
  statusSefazCodigo?: number;
  statusSefazMotivo?: string;
  rawXml: string;
}

export interface ImportacaoXmlResult {
  sucesso: boolean;
  documentoId?: string;
  documentoParsed?: XmlNFeParsed;
  documentoCriado?: DocumentoFiscal;
  estoqueAtualizado: boolean;
  financeiroGerado: boolean;
  movimentosEstoqueIds: string[];
  titulosFinanceirosIds: string[];
  mensagem: string;
  erros?: string[];
}

// -------------------------------------------------------------
// 15. EFEITOS PÓS-AUTORIZAÇÃO & INTEGRAÇÃO FATURAMENTO
// -------------------------------------------------------------
export interface FaturamentoIntegradoEfeitos {
  estoqueAtualizado: boolean;
  movimentosEstoque: Array<{
    id: string;
    produtoId: string;
    tipo: 'ENTRADA' | 'SAIDA';
    quantidade: number;
    almoxarifadoId: string;
    saldoAnterior: number;
    saldoPosterior: number;
  }>;
  financeiroGerado: boolean;
  titulosFinanceiros: Array<{
    id: string;
    tipo: 'RECEBER' | 'PAGAR';
    numeroTitulo: string;
    parcela: number;
    totalParcelas: number;
    valor: number;
    dataVencimento: string;
    status: 'ABERTO' | 'BAIXADO' | 'CANCELADO';
  }>;
  intercompanyGerado?: {
    empresaDestinoId: string;
    documentoEntradaId: string;
    numeroDocumentoEntrada: number;
    chaveAcessoVinculada: string;
  };
  auditoriaLogId: string;
}

