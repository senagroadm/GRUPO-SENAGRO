import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { userService } from '@/backend/modules/multi-tenant/user-service';
import { logger } from '@/backend/core/logger';

export const GET = createSecureHandler(async (req: NextRequest, ctx) => {
  const urlParts = req.nextUrl.pathname.split('/');
  const id = urlParts[urlParts.length - 1];

  const user = userService.getUserById(id);

  return NextResponse.json({
    success: true,
    data: user,
  });
});

export const PUT = createSecureHandler(async (req: NextRequest, ctx) => {
  const urlParts = req.nextUrl.pathname.split('/');
  const id = urlParts[urlParts.length - 1];
  const body = await req.json();

  const updatedUser = userService.updateUser(id, {
    nome: body.nome,
    email: body.email,
    cpf: body.cpf,
    cargo: body.cargo,
    isSuperAdmin: body.isSuperAdmin,
    ativo: body.ativo,
    empresasVinculadas: body.empresasVinculadas,
  });

  logger.info('Updated user via Admin API', {
    requestId: ctx.requestId,
    userId: updatedUser.id,
  });

  return NextResponse.json({
    success: true,
    message: `Usuário '${updatedUser.nome}' atualizado com sucesso.`,
    data: updatedUser,
  });
});

export const DELETE = createSecureHandler(async (req: NextRequest, ctx) => {
  const urlParts = req.nextUrl.pathname.split('/');
  const id = urlParts[urlParts.length - 1];

  const toggledUser = userService.toggleUserStatus(id);

  logger.info('Toggled user status via Admin API', {
    requestId: ctx.requestId,
    userId: toggledUser.id,
    ativo: toggledUser.ativo,
  });

  return NextResponse.json({
    success: true,
    message: `Status do usuário '${toggledUser.nome}' alterado para ${toggledUser.ativo ? 'ATIVO' : 'INATIVO'}.`,
    data: toggledUser,
  });
});
