import { IBankingPort, GerarBoletoInput, ResultadoBoleto } from '../../ports/banking.port';

/**
 * ADAPTER: CnabBankingAdapter
 * Implementação padrão para cobrança bancária, emissão de boletos e CNAB 240/400.
 * STATUS: TODO / decision-needed (Definir layout por banco: Itaú, BB, Bradesco, Santander, Sicoob)
 */
export class CnabBankingAdapter implements IBankingPort {
  async gerarBoleto(dados: GerarBoletoInput): Promise<ResultadoBoleto> {
    // TODO / decision-needed: Geração de nosso número e linha digitável conforme convênio do banco da empresa
    const nossoNumero = `NN-${Date.now().toString().slice(-8)}`;
    return {
      nossoNumero,
      linhaDigitavel: '34191.79001 01043.510047 91020.150008 5 99990000000000',
      codigoBarras: '34195999900000000001790001043510049102015000',
      qrCodePix: '00020126580014BR.GOV.BCB.PIX0136' + dados.empresaId,
    };
  }

  async gerarArquivoRemessaCnab(
    empresaId: string,
    contaBancariaId: string,
    titulosIds: string[]
  ): Promise<{ cnabString: string; nomeArquivo: string }> {
    // TODO / decision-needed: Montador de layout CNAB 240/400
    const nomeArquivo = `CB${new Date().toISOString().slice(5, 10).replace('-', '')}01.REM`;
    return {
      cnabString: 'HEADER_ARQUIVO_CNAB_MOCK_TODO_DECISION_NEEDED',
      nomeArquivo,
    };
  }

  async processarArquivoRetornoCnab(
    empresaId: string,
    contaBancariaId: string,
    arquivoContent: string
  ): Promise<{ processados: number; liquidados: number; rejeitados: number }> {
    // TODO / decision-needed: Parser de retorno de liquidação de títulos
    return { processados: 0, liquidados: 0, rejeitados: 0 };
  }
}
