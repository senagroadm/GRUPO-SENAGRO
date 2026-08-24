/**
 * PORT: ICreditSerasaPort
 * Contrato de consulta de crédito, birôs e bureaus (Serasa Experian / Boa Vista / Sintegra).
 * Dependência externa marcada como: TODO / decision-needed (API Serasa Relato PJ / Score PJ).
 */

export interface ConsultaCreditoInput {
  empresaId: string;
  cnpjCpf: string;
  razaoSocial: string;
  uf: string;
}

export interface RestricaoFinanceira {
  tipo: 'PROTESTO' | 'PEFIN' | 'REFIN' | 'CHEQUE_SEM_FUNDO' | 'ACAO_JUDICIAL';
  origem: string;
  valor: number;
  dataOcorrencia: string;
}

export interface ResultadoAnaliseCredito {
  cnpjCpf: string;
  score: number; // 0 a 1000
  faixaRisco: 'MUITO_BAIXO' | 'BAIXO' | 'MEDIO' | 'ALTO' | 'MUITO_ALTO';
  limiteSugerido: number;
  possuiRestricoes: boolean;
  restricoes: RestricaoFinanceira[];
  dataConsulta: string;
  provedor: 'SERASA_EXPERIAN' | 'BOA_VISTA' | 'MOTOR_INTERNO_MOCK';
}

export interface ICreditSerasaPort {
  consultarScorePJ(dados: ConsultaCreditoInput): Promise<ResultadoAnaliseCredito>;
}
