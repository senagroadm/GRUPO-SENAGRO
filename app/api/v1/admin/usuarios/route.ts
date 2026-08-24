import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { userService } from '@/backend/modules/multi-tenant/user-service';
import { extractPaginationParams, buildPaginatedResponse } from '@/backend/core/pagination';
import { logger } from '@/backend/core/logger';

export const GET = createSecureHandler(async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);
  const pagination = extractPaginationParams(searchParams);
  const search = searchParams.get('search') || undefined;
  const empresaId = searchParams.get('empresaId') || undefined;
  const ativoParam = searchParams.get('ativo');
  const ativo = ativoParam !== null ? ativoParam === 'true' : undefined;

  const allUsers = userService.listUsers({ search, empresaId, ativo });
  const paginatedResult = buildPaginatedResponse(allUsers, pagination);

  logger.info('Listed users via Admin API', {
    requestId: ctx.requestId,
    total: allUsers.length,
    page: pagination.page,
  });

  return NextResponse.json({
    success: true,
    ...paginatedResult,
  });
});

export const POST = createSecureHandler(async (req: NextRequest, ctx) => {
  const body = await req.json();

  const createdUser = userService.createUser({
    nome: body.nome,
    email: body.email,
    cpf: body.cpf,
    cargo: body.cargo,
    isSuperAdmin: body.isSuperAdmin,
    empresasVinculadas: body.empresasVinculadas || [],
  });

  logger.info('Created new user via Admin API', {
    requestId: ctx.requestId,
    userId: createdUser.id,
    email: createdUser.email,
  });

  return NextResponse.json(
    {
      success: true,
      message: `Usuário '${createdUser.nome}' cadastrado com sucesso.`,
      data: createdUser,
    },
    { status: 201 }
  );
});
