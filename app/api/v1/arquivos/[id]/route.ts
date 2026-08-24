import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { fileStorageService } from '@/backend/modules/storage/file-storage-service';

export const GET = createSecureHandler(async (req: NextRequest, ctx) => {
  // Extract id from URL path
  const urlParts = req.nextUrl.pathname.split('/');
  const id = urlParts[urlParts.length - 1];
  const empresaId = req.headers.get('x-empresa-id') || 'e1111111-1111-1111-1111-111111111111';

  const metadata = fileStorageService.getArquivoById(id, empresaId);
  const historicoVersoes = fileStorageService.obterHistoricoVersoes(id, empresaId);

  return NextResponse.json({
    success: true,
    data: {
      ...metadata,
      historicoVersoes,
    },
    requestId: ctx.requestId,
  });
});

export const DELETE = createSecureHandler(async (req: NextRequest, ctx) => {
  const urlParts = req.nextUrl.pathname.split('/');
  const id = urlParts[urlParts.length - 1];
  const empresaId = req.headers.get('x-empresa-id') || 'e1111111-1111-1111-1111-111111111111';
  const usuarioId = req.headers.get('x-user-id') || 'u1111111-1111-1111-1111-111111111111';
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'Browser-Client';

  fileStorageService.excluirArquivo(id, empresaId, usuarioId, { ipOrigem: clientIp, userAgent });

  return NextResponse.json({
    success: true,
    message: 'Arquivo removido com sucesso',
    requestId: ctx.requestId,
  });
});
