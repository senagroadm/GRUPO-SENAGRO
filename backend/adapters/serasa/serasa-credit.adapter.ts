import {
  ICreditSerasaPort,
  ConsultaCreditoInput,
  ResultadoAnaliseCredito,
} from '../../ports/credit-serasa.port';

/**
 * ADAPTER: SerasaCreditAdapter
 * Implementação desacoplada de consulta de score e restrições de CNPJ.
 * STATUS: TODO / decision-needed (Definir pacote de credenciais Serasa Experian PJ / Boa Vista)
 */
export class SerasaCreditAdapter implements ICreditSerasaPort {
  async consultarScorePJ(dados: ConsultaCreditoInput): Promise<ResultadoAnaliseCredito> {
    // TODO / decision-needed: Conexão real com API Serasa Experian Relato
    return {
      cnpjCpf: dados.cnpjCpf,
      score: 750,
      faixaRisco: 'BAIXO',
      limiteSugerido: 150000.0,
      possuiRestricoes: false,
      restricoes: [],
      dataConsulta: new Date().toISOString(),
      provedor: 'SERASA_EXPERIAN',
    };
  }
}
