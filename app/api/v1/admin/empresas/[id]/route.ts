import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { companyService } from '@/backend/modules/multi-tenant/company-service';
import { logger } from '@/backend/core/logger';

export const GET = createSecureHandler(async (req: NextRequest, ctx) => {
  const urlParts = req.nextUrl.pathname.split('/');
  const id = urlParts[urlParts.length - 1];

  const company = companyService.getCompanyById(id);

  return NextResponse.json({
    success: true,
    data: company,
  });
});

export const PUT = createSecureHandler(async (req: NextRequest, ctx) => {
  const urlParts = req.nextUrl.pathname.split('/');
  const id = urlParts[urlParts.length - 1];
  const body = await req.json();

  const updatedCompany = companyService.updateCompany(id, {
    razaoSocial: body.razaoSocial,
    nomeFantasia: body.nomeFantasia,
    cnpj: body.cnpj,
    inscricaoEstadual: body.inscricaoEstadual,
    inscricaoMunicipal: body.inscricaoMunicipal,
    regimeTributario: body.regimeTributario,
    ramoAtividade: body.ramoAtividade,
    isMatriz: body.isMatriz,
    ativo: body.ativo,
  });

  logger.info('Updated company via Admin API', {
    requestId: ctx.requestId,
    companyId: updatedCompany.id,
  });

  return NextResponse.json({
    success: true,
    message: `Empresa '${updatedCompany.nomeFantasia}' atualizada com sucesso.`,
    data: updatedCompany,
  });
});

export const DELETE = createSecureHandler(async (req: NextRequest, ctx) => {
  const urlParts = req.nextUrl.pathname.split('/');
  const id = urlParts[urlParts.length - 1];

  const toggledCompany = companyService.toggleCompanyStatus(id);

  logger.info('Toggled company status via Admin API', {
    requestId: ctx.requestId,
    companyId: toggledCompany.id,
    ativo: toggledCompany.ativo,
  });

  return NextResponse.json({
    success: true,
    message: `Status da empresa '${toggledCompany.nomeFantasia}' alterado para ${toggledCompany.ativo ? 'ATIVO' : 'INATIVO'}.`,
    data: toggledCompany,
  });
});
