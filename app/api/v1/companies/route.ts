import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantContext } from '@/backend/core/middlewares/auth';
import { parsePaginationParams, createPaginatedResponse } from '@/backend/core/pagination';
import { EMPRESAS_GRUPO } from '@/backend/core/types/company';
import { logger } from '@/backend/core/logger';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { sanitizeString } from '@/backend/core/security/sanitization';

export const GET = createSecureHandler(async (req: NextRequest, secContext) => {
  const token = req.headers.get('authorization') || undefined;
  const empresaIdHeader = req.headers.get('x-empresa-id') || undefined;

  const tenantContext = resolveTenantContext({
    token,
    empresaIdHeader,
    correlationId: secContext.correlationId,
    requestId: secContext.requestId,
  });

  const searchParams = req.nextUrl.searchParams;
  const pagination = parsePaginationParams(searchParams);

  // Filter companies based on user permissions
  let allowedCompanies = EMPRESAS_GRUPO.filter(
    (c) => tenantContext.isSuperAdmin || tenantContext.empresasAutorizadasIds.includes(c.id)
  );

  // Optional query filter sanitized against XSS
  const rawQuery = searchParams.get('q');
  if (rawQuery) {
    const query = sanitizeString(rawQuery);
    const qLower = query.toLowerCase();
    allowedCompanies = allowedCompanies.filter(
      (c) =>
        c.nomeFantasia.toLowerCase().includes(qLower) ||
        c.razaoSocial.toLowerCase().includes(qLower) ||
        c.cnpj.includes(qLower) ||
        c.codigo.toLowerCase().includes(qLower)
    );
  }

  const totalCount = allowedCompanies.length;
  const offset = (pagination.page - 1) * pagination.limit;
  const paginatedItems = allowedCompanies.slice(offset, offset + pagination.limit);

  logger.info('Listed companies with pagination and sanitized filters', {
    requestId: secContext.requestId,
    page: pagination.page,
    limit: pagination.limit,
    totalCount,
  });

  const response = createPaginatedResponse(
    paginatedItems,
    totalCount,
    pagination.page,
    pagination.limit,
    secContext.requestId
  );

  return NextResponse.json(response, {
    status: 200,
  });
});
