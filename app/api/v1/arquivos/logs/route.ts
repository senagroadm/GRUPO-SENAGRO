import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { fileStorageService } from '@/backend/modules/storage/file-storage-service';

export const GET = createSecureHandler(async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);
  const empresaId = req.headers.get('x-empresa-id') || searchParams.get('empresaId') || 'e1111111-1111-1111-1111-111111111111';
  const arquivoId = searchParams.get('arquivoId') || undefined;
  const limite = Number(searchParams.get('limit')) || 50;

  const logs = fileStorageService.obterLogs(empresaId, arquivoId, limite);

  return NextResponse.json({
    success: true,
    total: logs.length,
    data: logs,
    requestId: ctx.requestId,
  });
});
