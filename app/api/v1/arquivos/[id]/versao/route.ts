import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { fileStorageService } from '@/backend/modules/storage/file-storage-service';

export const POST = createSecureHandler(async (req: NextRequest, ctx) => {
  const urlParts = req.nextUrl.pathname.split('/');
  const idIndex = urlParts.indexOf('arquivos') + 1;
  const parentId = urlParts[idIndex];

  const empresaId = req.headers.get('x-empresa-id') || 'e1111111-1111-1111-1111-111111111111';
  const usuarioId = req.headers.get('x-user-id') || 'u1111111-1111-1111-1111-111111111111';
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'Browser-Client';

  const parentFile = fileStorageService.getArquivoById(parentId, empresaId);

  let buffer: Buffer;
  let nomeOriginal = parentFile.nomeOriginal;
  let mimeType = parentFile.mimeType;
  let descricao = parentFile.descricao || 'Nova versão do documento';

  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body = await req.json();
    if (body.base64Content) {
      buffer = Buffer.from(body.base64Content, 'base64');
    } else if (body.content) {
      buffer = Buffer.from(body.content, 'utf-8');
    } else {
      buffer = Buffer.from(`Nova versão v${parentFile.versao + 1} de ${parentFile.nomeOriginal}`);
    }
    nomeOriginal = body.nomeOriginal || parentFile.nomeOriginal;
    mimeType = body.mimeType || parentFile.mimeType;
    descricao = body.descricao || descricao;
  } else {
    const rawBytes = await req.arrayBuffer();
    buffer = Buffer.from(rawBytes);
  }

  const novaVersao = await fileStorageService.uploadArquivo(
    {
      empresaId,
      modulo: parentFile.modulo,
      entidadeTipo: parentFile.entidadeTipo,
      entidadeId: parentFile.entidadeId,
      nomeOriginal,
      buffer,
      mimeType,
      categoria: parentFile.categoria,
      descricao,
      documentoOrigemId: parentFile.id,
      usuarioId,
    },
    { ipOrigem: clientIp, userAgent }
  );

  return NextResponse.json(
    {
      success: true,
      message: `Nova versão v${novaVersao.versao} criada com sucesso para ${parentFile.nomeOriginal}`,
      data: novaVersao,
      requestId: ctx.requestId,
    },
    { status: 201 }
  );
});
