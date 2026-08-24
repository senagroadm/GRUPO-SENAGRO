import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { fileStorageService } from '@/backend/modules/storage/file-storage-service';

export const GET = createSecureHandler(async (req: NextRequest) => {
  const urlParts = req.nextUrl.pathname.split('/');
  // URL pattern: /api/v1/arquivos/[id]/preview
  const idIndex = urlParts.indexOf('arquivos') + 1;
  const id = urlParts[idIndex];

  const empresaId = req.headers.get('x-empresa-id') || 'e1111111-1111-1111-1111-111111111111';
  const usuarioId = req.headers.get('x-user-id') || 'u1111111-1111-1111-1111-111111111111';
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'Browser-Client';

  const { metadata, buffer, isPreviewable } = await fileStorageService.previewArquivo(id, empresaId, usuarioId, {
    ipOrigem: clientIp,
    userAgent,
  });

  const { searchParams } = new URL(req.url);
  const asJson = searchParams.get('format') === 'json';

  if (asJson) {
    return NextResponse.json({
      success: true,
      data: {
        ...metadata,
        isPreviewable,
        base64: buffer.toString('base64'),
        previewText: isPreviewable ? buffer.toString('utf-8').slice(0, 10000) : null,
      },
    });
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': metadata.mimeType,
      'Content-Length': buffer.length.toString(),
      'Content-Disposition': `inline; filename="${metadata.nomeOriginal}"`,
      'X-Previewable': isPreviewable ? 'true' : 'false',
      'X-File-Hash-Sha256': metadata.hashSha256,
      'Cache-Control': 'private, max-age=300',
    },
  });
});
