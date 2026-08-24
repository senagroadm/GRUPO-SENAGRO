/**
 * Interface Adapter Conceitual para Provedores de Bureau de Crédito (Serasa, Boa Vista, etc.)
 * Permite desacoplar a lógica de negócio e regras de crédito do provedor externo.
 * A implementação real será plugada futuramente via credenciais/contrato oficial.
 */

export interface CadastroBureauResponse {
  documento: string;
  razaoSocialOuNome: string;
  nomeFantasia?: string;
  situacaoCadastral: 'REGULAR' | 'SUSPENSA' | 'INAPTA' | 'BAIXADA' | 'NULA';
  dataAberturaOuNascimento?: string;
  cnaePrincipal?: string;
  cnaeDescricao?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade: string;
  uf: string;
  cep?: string;
  quadroSocietario: {
    nome: string;
    documento: string;
    participacaoPerc: number;
    cargo: string;
    dataEntrada?: string;
  }[];
  capitalSocial?: number;
}

export interface ScoreBureauResponse {
  documento: string;
  score: number; // 0 a 1000
  faixaRisco: 'MUITO_BAIXO' | 'BAIXO' | 'MEDIO' | 'ALTO' | 'MUITO_ALTO';
  probabilidadeInadimplenciaPerc: number; // 0% a 100%
  textoExplicativo: string;
}

export interface RestricoesBureauResponse {
  documento: string;
  totalRestricoesFinanceiras: number;
  valorTotalRestricoes: number;
  protestos: {
    cartorio: string;
    cidade: string;
    uf: string;
    dataProtesto: string;
    valor: number;
    favorecidoOuCedente: string;
  }[];
  pefin: { // Pendências Financeiras Comerciais
    empresaCredora: string;
    dataOcorrencia: string;
    valor: number;
    contrato?: string;
  }[];
  refin: { // Pendências Financeiras Bancárias
    instituicaoFinanceira: string;
    dataOcorrencia: string;
    valor: number;
    tipoOperacao?: string;
  }[];
  acoesJudiciais: {
    vara: string;
    processo: string;
    valor: number;
    dataDistribuicao: string;
    natureza: string;
  }[];
  chequesSemFundoQtd: number;
  participacaoFalenciasOuRecuperacoes: boolean;
}

export interface CreditoCompletoBureauResponse {
  cadastro: CadastroBureauResponse;
  score: ScoreBureauResponse;
  restricoes: RestricoesBureauResponse;
  resumoFinanceiro: {
    faturamentoEstimadoMensal: number;
    limiteCreditoSugeridoBureau: number;
    pontualidadePagamentoMercadoPerc: number;
  };
  provedorNome: string;
  consultadoEm: string;
}

export interface CreditProvider {
  readonly nomeProvedor: string;

  /**
   * Consulta dados cadastrais oficiais e quadro societário (QSA)
   */
  consultarCadastro(documento: string): Promise<CadastroBureauResponse>;

  /**
   * Consulta a pontuação de crédito (Score 0-1000) e probabilidade de inadimplência
   */
  consultarScore(documento: string): Promise<ScoreBureauResponse>;

  /**
   * Consulta pendências financeiras (PEFIN/REFIN), protestos em cartório, ações e cheques
   */
  consultarRestricoes(documento: string): Promise<RestricoesBureauResponse>;

  /**
   * Executa consulta de crédito abrangente consolidando cadastro, score e restrições
   */
  consultarCredito(documento: string): Promise<CreditoCompletoBureauResponse>;
}
