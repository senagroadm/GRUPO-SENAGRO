import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { companyService } from '@/backend/modules/multi-tenant/company-service';
import { extractPaginationParams, buildPaginatedResponse } from '@/backend/core/pagination';
import { logger } from '@/backend/core/logger';

export const GET = createSecureHandler(async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);
  const pagination = extractPaginationParams(searchParams);
  const search = searchParams.get('search') || undefined;
  const regime = searchParams.get('regime') || undefined;
  const ativoParam = searchParams.get('ativo');
  const ativo = ativoParam !== null ? ativoParam === 'true' : undefined;

  const allCompanies = companyService.listCompanies({ search, regime, ativo });
  const paginatedResult = buildPaginatedResponse(allCompanies, pagination);

  logger.info('Listed companies via Admin API', {
    requestId: ctx.requestId,
    total: allCompanies.length,
    page: pagination.page,
  });

  return NextResponse.json({
    success: true,
    ...paginatedResult,
  });
});

export const POST = createSecureHandler(async (req: NextRequest, ctx) => {
  const body = await req.json();

  const createdCompany = companyService.createCompany({
    codigo: body.codigo,
    razaoSocial: body.razaoSocial,
    nomeFantasia: body.nomeFantasia,
    cnpj: body.cnpj,
    inscricaoEstadual: body.inscricaoEstadual,
    inscricaoMunicipal: body.inscricaoMunicipal,
    regimeTributario: body.regimeTributario,
    ramoAtividade: body.ramoAtividade,
    isMatriz: body.isMatriz,
  });

  logger.info('Created new company via Admin API', {
    requestId: ctx.requestId,
    companyId: createdCompany.id,
    cnpj: createdCompany.cnpj,
    codigo: createdCompany.codigo,
  });

  return NextResponse.json(
    {
      success: true,
      message: `Empresa '${createdCompany.nomeFantasia}' cadastrada com sucesso.`,
      data: createdCompany,
    },
    { status: 201 }
  );
});
