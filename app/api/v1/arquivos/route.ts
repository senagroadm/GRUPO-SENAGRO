import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { fileStorageService } from '@/backend/modules/storage/file-storage-service';
import { logger } from '@/backend/core/logger';

export const GET = createSecureHandler(async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);
  const empresaId = req.headers.get('x-empresa-id') || searchParams.get('empresaId') || 'e1111111-1111-1111-1111-111111111111';
  const modulo = searchParams.get('modulo') || undefined;
  const entidadeTipo = searchParams.get('entidadeTipo') || undefined;
  const entidadeId = searchParams.get('entidadeId') || undefined;
  const categoria = searchParams.get('categoria') || undefined;
  const termoBusca = searchParams.get('busca') || undefined;
  const apenasVersaoAtual = searchParams.get('todasVersoes') !== 'true';

  const arquivos = fileStorageService.listarArquivos({
    empresaId,
    modulo,
    entidadeTipo,
    entidadeId,
    categoria,
    termoBusca,
    apenasVersaoAtual,
  });

  return NextResponse.json({
    success: true,
    total: arquivos.length,
    data: arquivos,
    requestId: ctx.requestId,
  });
});

export const POST = createSecureHandler(async (req: NextRequest, ctx) => {
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'Browser-Client';
  const empresaId = req.headers.get('x-empresa-id') || 'e1111111-1111-1111-1111-111111111111';
  const usuarioId = req.headers.get('x-user-id') || 'u1111111-1111-1111-1111-111111111111';

  let buffer: Buffer;
  let nomeOriginal = 'arquivo.bin';
  let mimeType: string | undefined;
  let modulo = 'GERAL';
  let entidadeTipo = 'GERAL';
  let entidadeId = 'ROOT';
  let categoria = 'GERAL';
  let descricao: string | undefined;
  let documentoOrigemId: string | undefined;

  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body = await req.json();
    if (body.base64Content) {
      buffer = Buffer.from(body.base64Content, 'base64');
    } else if (body.content) {
      buffer = Buffer.from(body.content, 'utf-8');
    } else {
      buffer = Buffer.from('Nexus ERP Synthetic Document Buffer Data');
    }
    nomeOriginal = body.nomeOriginal || body.nome || 'documento.pdf';
    mimeType = body.mimeType;
    modulo = body.modulo || 'CRM';
    entidadeTipo = body.entidadeTipo || 'GERAL';
    entidadeId = body.entidadeId || 'ROOT';
    categoria = body.categoria || 'GERAL';
    descricao = body.descricao;
    documentoOrigemId = body.documentoOrigemId;
  } else if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ success: false, error: 'Campo "file" não encontrado no FormData' }, { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    buffer = Buffer.from(bytes);
    nomeOriginal = file.name;
    mimeType = file.type;
    modulo = (formData.get('modulo') as string) || 'GERAL';
    entidadeTipo = (formData.get('entidadeTipo') as string) || 'GERAL';
    entidadeId = (formData.get('entidadeId') as string) || 'ROOT';
    categoria = (formData.get('categoria') as string) || 'GERAL';
    descricao = (formData.get('descricao') as string) || undefined;
    documentoOrigemId = (formData.get('documentoOrigemId') as string) || undefined;
  } else {
    const rawBytes = await req.arrayBuffer();
    buffer = Buffer.from(rawBytes);
  }

  const arquivo = await fileStorageService.uploadArquivo(
    {
      empresaId,
      modulo,
      entidadeTipo,
      entidadeId,
      nomeOriginal,
      buffer,
      mimeType,
      categoria,
      descricao,
      documentoOrigemId,
      usuarioId,
    },
    { ipOrigem: clientIp, userAgent }
  );

  logger.info('Arquivo processado e salvo no Object Storage', {
    arquivoId: arquivo.id,
    hashSha256: arquivo.hashSha256,
    tamanhoBytes: arquivo.tamanhoBytes,
    requestId: ctx.requestId,
  });

  return NextResponse.json(
    {
      success: true,
      message: 'Arquivo armazenado com sucesso no Object Storage',
      data: arquivo,
      requestId: ctx.requestId,
    },
    { status: 201 }
  );
});
