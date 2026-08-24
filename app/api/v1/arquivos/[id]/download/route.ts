import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { fileStorageService } from '@/backend/modules/storage/file-storage-service';

export const GET = createSecureHandler(async (req: NextRequest) => {
  const urlParts = req.nextUrl.pathname.split('/');
  // URL pattern: /api/v1/arquivos/[id]/download
  const idIndex = urlParts.indexOf('arquivos') + 1;
  const id = urlParts[idIndex];

  const empresaId = req.headers.get('x-empresa-id') || 'e1111111-1111-1111-1111-111111111111';
  const usuarioId = req.headers.get('x-user-id') || 'u1111111-1111-1111-1111-111111111111';
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'Browser-Client';

  const { metadata, buffer } = await fileStorageService.downloadArquivo(id, empresaId, usuarioId, {
    ipOrigem: clientIp,
    userAgent,
  });

  const encodedFileName = encodeURIComponent(metadata.nomeOriginal);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': metadata.mimeType,
      'Content-Length': buffer.length.toString(),
      'Content-Disposition': `attachment; filename="${metadata.nomeOriginal}"; filename*=UTF-8''${encodedFileName}`,
      'X-File-Hash-Sha256': metadata.hashSha256,
      'X-File-Version': metadata.versao.toString(),
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    },
  });
});
