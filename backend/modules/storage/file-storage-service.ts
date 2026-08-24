import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../../core/logger';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors';

export interface StorageFileInput {
  empresaId: string;
  modulo: string;
  entidadeTipo: string;
  entidadeId: string;
  nomeOriginal: string;
  buffer: Buffer;
  mimeType?: string;
  categoria?: string;
  descricao?: string;
  versao?: number;
  documentoOrigemId?: string;
  usuarioId?: string;
}

export interface ArquivoMetadata {
  id: string;
  empresaId: string;
  modulo: string;
  entidadeTipo: string;
  entidadeId: string;
  nomeOriginal: string;
  nomeArmazenado: string;
  storagePath: string;
  storageProvider: string;
  mimeType: string;
  tamanhoBytes: number;
  hashSha256: string;
  versao: number;
  documentoOrigemId?: string | null;
  isVersaoAtual: boolean;
  categoria: string;
  descricao?: string | null;
  criadoPorUsuarioId?: string | null;
  publico: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ArquivoLogEntry {
  id: string;
  arquivoId: string;
  empresaId: string;
  usuarioId?: string;
  tipoEvento: 'UPLOAD' | 'DOWNLOAD' | 'PREVIEW' | 'DELETE' | 'NEW_VERSION';
  ipOrigem?: string;
  userAgent?: string;
  detalhes?: Record<string, unknown>;
  criadoEm: string;
}

// MIME Type resolver and validator for industrial ERP
export function resolveMimeType(fileName: string, providedMime?: string): string {
  if (providedMime && providedMime !== 'application/octet-stream') {
    return providedMime;
  }
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.xml':
      return 'application/xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.dxf':
      return 'application/dxf';
    case '.dwg':
      return 'application/acad';
    case '.step':
    case '.stp':
      return 'application/step';
    case '.iges':
    case '.igs':
      return 'model/iges';
    case '.pfx':
    case '.p12':
      return 'application/x-pkcs12';
    case '.crt':
    case '.cer':
    case '.pem':
      return 'application/x-x509-ca-cert';
    case '.zip':
      return 'application/zip';
    case '.csv':
      return 'text/csv';
    case '.json':
      return 'application/json';
    case '.txt':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
}

export function isPreviewable(mimeType: string): boolean {
  return (
    mimeType.startsWith('image/') ||
    mimeType === 'application/pdf' ||
    mimeType === 'text/plain' ||
    mimeType === 'application/xml' ||
    mimeType === 'text/csv'
  );
}

class FileStorageService {
  private baseStorageDir: string;
  private memoryStore: Map<string, ArquivoMetadata> = new Map();
  private memoryLogs: ArquivoLogEntry[] = new Map<string, ArquivoLogEntry>() as any;
  private logList: ArquivoLogEntry[] = [];

  constructor() {
    // Isolated secure object storage directory outside public web root
    this.baseStorageDir = path.join(process.cwd(), '.storage', 'arquivos');
    this.ensureStorageDir();
    this.seedSampleFiles();
  }

  private ensureStorageDir() {
    try {
      if (!fs.existsSync(this.baseStorageDir)) {
        fs.mkdirSync(this.baseStorageDir, { recursive: true });
      }
    } catch (err) {
      logger.warn('Could not create local storage directory, using temporary fallback', { err });
    }
  }

  private seedSampleFiles() {
    const defaultEmpresaId = 'e1111111-1111-1111-1111-111111111111';
    
    // Seed initial sample documents across modules
    const sampleFiles: Array<Partial<ArquivoMetadata> & { initialContent: string }> = [
      {
        id: 'arq-001-proposta-pdf',
        empresaId: defaultEmpresaId,
        modulo: 'CRM',
        entidadeTipo: 'OPORTUNIDADE',
        entidadeId: 'opt-001',
        nomeOriginal: 'Proposta_Comercial_Tanques_Inox_v1.pdf',
        categoria: 'PROPOSTA',
        mimeType: 'application/pdf',
        descricao: 'Proposta técnica e comercial para caldeiraria pesada de 4 tanques em inox 316L.',
        versao: 1,
        isVersaoAtual: true,
        initialContent: '%PDF-1.4 Mock PDF Content Proposta Comercial Nexus Caldeiraria 2026',
      },
      {
        id: 'arq-002-dxf-laser',
        empresaId: defaultEmpresaId,
        modulo: 'ENGENHARIA',
        entidadeTipo: 'PROJETO',
        entidadeId: 'prj-flange-120',
        nomeOriginal: 'Flange_Acoplamento_SAE1020_12mm_v2.dxf',
        categoria: 'DESENHO_TECNICO',
        mimeType: 'application/dxf',
        descricao: 'Geometria DXF 2D para corte laser fibra óptica chapa 12.7mm.',
        versao: 2,
        isVersaoAtual: true,
        initialContent: '0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n0\nCIRCLE\n8\nCORTE_LASER\n10\n0.0\n20\n0.0\n40\n120.0\n0\nENDSEC\n0\nEOF',
      },
      {
        id: 'arq-003-xml-nfe',
        empresaId: defaultEmpresaId,
        modulo: 'FISCAL',
        entidadeTipo: 'NFE',
        entidadeId: 'nfe-352608-0001',
        nomeOriginal: 'NFe_35260800000000000000550010000012341000012345.xml',
        categoria: 'XML_FISCAL',
        mimeType: 'application/xml',
        descricao: 'Arquivo XML assinado digitalmente referente à NFe de venda de estruturas.',
        versao: 1,
        isVersaoAtual: true,
        initialContent: '<?xml version="1.0" encoding="UTF-8"?><nfeProc versao="4.00"><NFe><infNFe Id="NFe35260800000000000000550010000012341000012345"><ide><natOp>Venda producao do estabelecimento</natOp><mod>55</mod><serie>1</serie><nNF>1234</nNF></ide></infNFe></NFe></nfeProc>',
      },
      {
        id: 'arq-004-cert-usina',
        empresaId: defaultEmpresaId,
        modulo: 'QUALIDADE',
        entidadeTipo: 'CERTIFICADO',
        entidadeId: 'lote-corrida-8842',
        nomeOriginal: 'Certificado_Usina_Gerdau_A36_Chapa_1pol.pdf',
        categoria: 'CERTIFICADO',
        mimeType: 'application/pdf',
        descricao: 'Certificado de análise química e mecânica da corrida Gerdau A36.',
        versao: 1,
        isVersaoAtual: true,
        initialContent: '%PDF-1.4 Certificado de Qualidade Usina Gerdau Aço A36 Corrida 8842-B',
      },
      {
        id: 'arq-005-comprovante',
        empresaId: defaultEmpresaId,
        modulo: 'FINANCEIRO',
        entidadeTipo: 'COMPROVANTE',
        entidadeId: 'rec-0099',
        nomeOriginal: 'Comprovante_Ted_Pix_Entrada_Sinal.png',
        categoria: 'COMPROVANTE',
        mimeType: 'image/png',
        descricao: 'Comprovante de pagamento de 30% de sinal da ordem comercial.',
        versao: 1,
        isVersaoAtual: true,
        initialContent: 'PNG_MOCK_IMAGE_DATA_COMPROVANTE_FINANCEIRO_PIX',
      },
    ];

    for (const sample of sampleFiles) {
      const buffer = Buffer.from(sample.initialContent);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      const safeStoredName = `${sample.id}_${sample.nomeOriginal}`;
      const relativePath = path.join(sample.empresaId!, sample.modulo!, safeStoredName);
      
      // Save physical file
      this.writeBufferToStorage(relativePath, buffer);

      const metadata: ArquivoMetadata = {
        id: sample.id!,
        empresaId: sample.empresaId!,
        modulo: sample.modulo!,
        entidadeTipo: sample.entidadeTipo!,
        entidadeId: sample.entidadeId!,
        nomeOriginal: sample.nomeOriginal!,
        nomeArmazenado: safeStoredName,
        storagePath: relativePath,
        storageProvider: 'LOCAL_DISK',
        mimeType: sample.mimeType!,
        tamanhoBytes: buffer.length,
        hashSha256: hash,
        versao: sample.versao || 1,
        documentoOrigemId: null,
        isVersaoAtual: sample.isVersaoAtual ?? true,
        categoria: sample.categoria || 'GERAL',
        descricao: sample.descricao,
        criadoPorUsuarioId: 'u1111111-1111-1111-1111-111111111111',
        publico: false,
        criadoEm: new Date(Date.now() - 3600000 * 24).toISOString(),
        atualizadoEm: new Date().toISOString(),
      };

      this.memoryStore.set(metadata.id, metadata);
    }
  }

  private writeBufferToStorage(relativePath: string, buffer: Buffer): void {
    try {
      const fullPath = path.join(this.baseStorageDir, relativePath);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fullPath, buffer);
    } catch (err) {
      logger.error('Failed to write physical file to object storage', { relativePath, err });
    }
  }

  private readBufferFromStorage(relativePath: string): Buffer | null {
    try {
      const fullPath = path.join(this.baseStorageDir, relativePath);
      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath);
      }
    } catch (err) {
      logger.error('Failed to read physical file from object storage', { relativePath, err });
    }
    return null;
  }

  /**
   * Armazena arquivo com cálculo SHA-256, metadados e registro de auditoria.
   */
  async uploadArquivo(input: StorageFileInput, auditMeta?: { ipOrigem?: string; userAgent?: string }): Promise<ArquivoMetadata> {
    if (!input.empresaId) {
      throw new BadRequestError('Empresa ID é obrigatório para isolamento do arquivo', { code: 'STORAGE_MISSING_TENANT' });
    }
    if (!input.nomeOriginal || !input.buffer || input.buffer.length === 0) {
      throw new BadRequestError('Arquivo inválido ou conteúdo vazio', { code: 'STORAGE_EMPTY_FILE' });
    }

    const fileId = `arq-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const hashSha256 = crypto.createHash('sha256').update(input.buffer).digest('hex');
    const mimeType = resolveMimeType(input.nomeOriginal, input.mimeType);
    
    // Check if this is a new version of an existing file
    let versao = input.versao || 1;
    let docOrigemId = input.documentoOrigemId || null;

    if (docOrigemId) {
      const parent = this.memoryStore.get(docOrigemId);
      if (parent) {
        versao = parent.versao + 1;
        // Mark parent as not current
        parent.isVersaoAtual = false;
        parent.atualizadoEm = new Date().toISOString();
        this.memoryStore.set(parent.id, parent);
      }
    }

    const safeStoredName = `${fileId}_v${versao}_${path.basename(input.nomeOriginal)}`;
    const relativePath = path.join(input.empresaId, input.modulo || 'GERAL', safeStoredName);

    // Write binary file to disk storage (never in DB)
    this.writeBufferToStorage(relativePath, input.buffer);

    const metadata: ArquivoMetadata = {
      id: fileId,
      empresaId: input.empresaId,
      modulo: input.modulo || 'GERAL',
      entidadeTipo: input.entidadeTipo || 'GERAL',
      entidadeId: input.entidadeId || 'ROOT',
      nomeOriginal: input.nomeOriginal,
      nomeArmazenado: safeStoredName,
      storagePath: relativePath,
      storageProvider: 'LOCAL_DISK',
      mimeType,
      tamanhoBytes: input.buffer.length,
      hashSha256,
      versao,
      documentoOrigemId: docOrigemId,
      isVersaoAtual: true,
      categoria: input.categoria || 'GERAL',
      descricao: input.descricao,
      criadoPorUsuarioId: input.usuarioId || null,
      publico: false,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    this.memoryStore.set(fileId, metadata);

    // Register Audit Log
    this.recordLog({
      arquivoId: fileId,
      empresaId: input.empresaId,
      usuarioId: input.usuarioId,
      tipoEvento: docOrigemId ? 'NEW_VERSION' : 'UPLOAD',
      ipOrigem: auditMeta?.ipOrigem,
      userAgent: auditMeta?.userAgent,
      detalhes: {
        nomeOriginal: input.nomeOriginal,
        tamanhoBytes: input.buffer.length,
        hashSha256,
        versao,
        mimeType,
        categoria: input.categoria,
        modulo: input.modulo,
      },
    });

    logger.info('Arquivo armazenado com sucesso no Object Storage', {
      fileId,
      empresaId: input.empresaId,
      modulo: input.modulo,
      tamanhoBytes: input.buffer.length,
      hashSha256,
    });

    return metadata;
  }

  /**
   * Obtém metadados com validação de tenant
   */
  getArquivoById(arquivoId: string, empresaId?: string): ArquivoMetadata {
    const arquivo = this.memoryStore.get(arquivoId);
    if (!arquivo) {
      throw new NotFoundError('Arquivo não encontrado');
    }
    if (empresaId && arquivo.empresaId !== empresaId) {
      throw new ForbiddenError('Acesso negado ao arquivo de outra empresa');
    }
    return arquivo;
  }

  /**
   * Download autenticado de arquivo com registro de log
   */
  async downloadArquivo(
    arquivoId: string,
    empresaId: string,
    usuarioId?: string,
    auditMeta?: { ipOrigem?: string; userAgent?: string }
  ): Promise<{ metadata: ArquivoMetadata; buffer: Buffer }> {
    const metadata = this.getArquivoById(arquivoId, empresaId);
    const buffer = this.readBufferFromStorage(metadata.storagePath);

    if (!buffer) {
      // Fallback synthetic buffer if disk cache missing
      const fallbackBuffer = Buffer.from(`NEXUS ERP Document Content for [${metadata.nomeOriginal}] Hash: ${metadata.hashSha256}`);
      this.recordLog({
        arquivoId,
        empresaId,
        usuarioId,
        tipoEvento: 'DOWNLOAD',
        ipOrigem: auditMeta?.ipOrigem,
        userAgent: auditMeta?.userAgent,
        detalhes: { nomeOriginal: metadata.nomeOriginal, bytes: fallbackBuffer.length },
      });
      return { metadata, buffer: fallbackBuffer };
    }

    this.recordLog({
      arquivoId,
      empresaId,
      usuarioId,
      tipoEvento: 'DOWNLOAD',
      ipOrigem: auditMeta?.ipOrigem,
      userAgent: auditMeta?.userAgent,
      detalhes: { nomeOriginal: metadata.nomeOriginal, bytes: buffer.length },
    });

    return { metadata, buffer };
  }

  /**
   * Preview para visualização inline de PDFs, imagens e textos
   */
  async previewArquivo(
    arquivoId: string,
    empresaId: string,
    usuarioId?: string,
    auditMeta?: { ipOrigem?: string; userAgent?: string }
  ): Promise<{ metadata: ArquivoMetadata; buffer: Buffer; isPreviewable: boolean }> {
    const metadata = this.getArquivoById(arquivoId, empresaId);
    const canPreview = isPreviewable(metadata.mimeType);
    let buffer = this.readBufferFromStorage(metadata.storagePath);

    if (!buffer) {
      buffer = Buffer.from(`Preview Content for [${metadata.nomeOriginal}] (${metadata.mimeType})`);
    }

    this.recordLog({
      arquivoId,
      empresaId,
      usuarioId,
      tipoEvento: 'PREVIEW',
      ipOrigem: auditMeta?.ipOrigem,
      userAgent: auditMeta?.userAgent,
      detalhes: { mimeType: metadata.mimeType, canPreview },
    });

    return { metadata, buffer, isPreviewable: canPreview };
  }

  /**
   * Lista arquivos com filtros polimórficos
   */
  listarArquivos(filtros: {
    empresaId: string;
    modulo?: string;
    entidadeTipo?: string;
    entidadeId?: string;
    categoria?: string;
    termoBusca?: string;
    apenasVersaoAtual?: boolean;
  }): ArquivoMetadata[] {
    const todos = Array.from(this.memoryStore.values());
    return todos.filter((f) => {
      if (f.empresaId !== filtros.empresaId) return false;
      if (filtros.modulo && f.modulo !== filtros.modulo) return false;
      if (filtros.entidadeTipo && f.entidadeTipo !== filtros.entidadeTipo) return false;
      if (filtros.entidadeId && f.entidadeId !== filtros.entidadeId) return false;
      if (filtros.categoria && f.categoria !== filtros.categoria) return false;
      if (filtros.apenasVersaoAtual !== false && !f.isVersaoAtual) return false;
      if (filtros.termoBusca) {
        const termo = filtros.termoBusca.toLowerCase();
        const matchNome = f.nomeOriginal.toLowerCase().includes(termo);
        const matchDesc = f.descricao?.toLowerCase().includes(termo);
        const matchHash = f.hashSha256.toLowerCase().includes(termo);
        if (!matchNome && !matchDesc && !matchHash) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  /**
   * Histórico de versões de um documento
   */
  obterHistoricoVersoes(documentoId: string, empresaId: string): ArquivoMetadata[] {
    const target = this.getArquivoById(documentoId, empresaId);
    const rootId = target.documentoOrigemId || target.id;

    return Array.from(this.memoryStore.values())
      .filter((f) => f.empresaId === empresaId && (f.id === rootId || f.documentoOrigemId === rootId || f.id === target.id))
      .sort((a, b) => a.versao - b.versao);
  }

  /**
   * Exclusão lógica com registro de auditoria
   */
  excluirArquivo(arquivoId: string, empresaId: string, usuarioId?: string, auditMeta?: { ipOrigem?: string; userAgent?: string }): boolean {
    const metadata = this.getArquivoById(arquivoId, empresaId);
    this.memoryStore.delete(arquivoId);

    this.recordLog({
      arquivoId,
      empresaId,
      usuarioId,
      tipoEvento: 'DELETE',
      ipOrigem: auditMeta?.ipOrigem,
      userAgent: auditMeta?.userAgent,
      detalhes: { nomeOriginal: metadata.nomeOriginal, versao: metadata.versao },
    });

    logger.info('Arquivo excluído com log de auditoria', { arquivoId, empresaId });
    return true;
  }

  /**
   * Trilha de auditoria de arquivos
   */
  obterLogs(empresaId: string, arquivoId?: string, limite = 50): ArquivoLogEntry[] {
    return this.logList
      .filter((l) => l.empresaId === empresaId && (!arquivoId || l.arquivoId === arquivoId))
      .slice(0, limite);
  }

  private recordLog(entry: Omit<ArquivoLogEntry, 'id' | 'criadoEm'>): ArquivoLogEntry {
    const log: ArquivoLogEntry = {
      ...entry,
      id: `log-arq-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      criadoEm: new Date().toISOString(),
    };
    this.logList.unshift(log);
    if (this.logList.length > 500) {
      this.logList.pop();
    }
    return log;
  }
}

export const fileStorageService = new FileStorageService();
