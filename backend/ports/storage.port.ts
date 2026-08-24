/**
 * PORT: IStoragePort
 * Contrato de Object Storage para armazenamento de arquivos pesados (CAD DXF/DWG, PDFs, XMLs de NF-e).
 * Dependência externa marcada como: TODO / decision-needed (S3 / MinIO / Google Cloud Storage / Cloudflare R2).
 */

export interface UploadFileInput {
  empresaId: string;
  modulo: string;
  pasta: 'desenhos_tecnicos' | 'certificados_materia_prima' | 'xml_nfe' | 'danfe_pdf' | 'comprovantes_financeiros';
  nomeArquivo: string;
  mimetype: string;
  conteudoBuffer: Buffer | Uint8Array;
}

export interface UploadFileResult {
  chaveStorage: string;
  urlAcesso: string;
  tamanhoBytes: number;
}

export interface IStoragePort {
  salvarArquivo(dados: UploadFileInput): Promise<UploadFileResult>;
  obterUrlDownloadAssinada(chaveStorage: string, expiracaoSegundos?: number): Promise<string>;
  excluirArquivo(chaveStorage: string): Promise<boolean>;
}
