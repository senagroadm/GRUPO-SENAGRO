/**
 * PORT: IBankingPort
 * Contrato de integração bancária para boletos, arquivos CNAB 240/400 e conciliação bancária.
 * Dependência externa marcada como: TODO / decision-needed (CNAB tradicional vs APIs Open Finance BB/Itaú/Bradesco/Santander/Sicoob).
 */

export interface GerarBoletoInput {
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
}

export interface ResultadoBoleto {
  nossoNumero: string;
  linhaDigitavel: string;
  codigoBarras: string;
  qrCodePix?: string;
  pdfUrl?: string;
}

export interface IBankingPort {
  gerarBoleto(dados: GerarBoletoInput): Promise<ResultadoBoleto>;
  gerarArquivoRemessaCnab(empresaId: string, contaBancariaId: string, titulosIds: string[]): Promise<{ cnabString: string; nomeArquivo: string }>;
  processarArquivoRetornoCnab(empresaId: string, contaBancariaId: string, arquivoContent: string): Promise<{ processados: number; liquidados: number; rejeitados: number }>;
}
