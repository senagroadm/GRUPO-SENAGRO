import {
  IStoragePort,
  UploadFileInput,
  UploadFileResult,
} from '../../ports/storage.port';

/**
 * ADAPTER: ObjectStorageAdapter
 * Adaptador para armazenamento de arquivos técnicos (DXF/DWG/PDF) e XMLs fiscais.
 * STATUS: TODO / decision-needed (S3 compatível / MinIO / GCS / Cloudflare R2)
 */
export class ObjectStorageAdapter implements IStoragePort {
  async salvarArquivo(dados: UploadFileInput): Promise<UploadFileResult> {
    const chaveStorage = `${dados.empresaId}/${dados.modulo}/${dados.pasta}/${Date.now()}_${dados.nomeArquivo}`;
    return {
      chaveStorage,
      urlAcesso: `/api/storage/download?key=${encodeURIComponent(chaveStorage)}`,
      tamanhoBytes: dados.conteudoBuffer.byteLength,
    };
  }

  async obterUrlDownloadAssinada(chaveStorage: string, _expiracaoSegundos = 3600): Promise<string> {
    return `/api/storage/download?key=${encodeURIComponent(chaveStorage)}`;
  }

  async excluirArquivo(_chaveStorage: string): Promise<boolean> {
    return true;
  }
}
