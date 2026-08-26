/**
 * PORT: IBankingPort
 * Contrato de integração bancária para boletos, cobranças, PIX híbrido e conciliação bancária.
 */
export * from '../modules/bancario/bancario-types';
export * from '../adapters/banking/banco-adapter.interface';

// Aliases para compatibilidade
export type GerarBoletoInput = {
  empresaId: string;
  tituloReceberId: string;
  pagador: {
    cnpjCpf: string;
    nome: string;
    endereco: string;
  };
  valorNominal: number;
  dataVencimento: Date | string;
  multaPercentual?: number;
  jurosMensalPercentual?: number;
  instrucoes?: string[];
};

export type ResultadoBoleto = {
  nossoNumero: string;
  linhaDigitavel: string;
  codigoBarras: string;
  qrCodePix?: string;
  pdfUrl?: string;
};

export interface IBankingPort {
  gerarBoleto(dados: GerarBoletoInput): Promise<ResultadoBoleto>;
  gerarArquivoRemessaCnab(empresaId: string, contaBancariaId: string, titulosIds: string[]): Promise<{ cnabString: string; nomeArquivo: string }>;
  processarArquivoRetornoCnab(empresaId: string, contaBancariaId: string, arquivoContent: string): Promise<{ processados: number; liquidados: number; rejeitados: number }>;
}
