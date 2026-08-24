import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { profileService } from '@/backend/modules/multi-tenant/profile-service';

export const GET = createSecureHandler(async (req: NextRequest) => {
  const perfis = profileService.listPerfis();
  const permissoes = profileService.listPermissoes();

  return NextResponse.json({
    success: true,
    data: {
      perfis,
      permissoes,
    },
  });
});

export const POST = createSecureHandler(async (req: NextRequest) => {
  const body = await req.json();

  const newPerfil = profileService.createPerfil({
    codigo: body.codigo,
    nome: body.nome,
    descricao: body.descricao,
    nivelAcesso: body.nivelAcesso,
    permissoesIds: body.permissoesIds,
  });

  return NextResponse.json(
    {
      success: true,
      message: `Perfil '${newPerfil.nome}' criado com sucesso.`,
      data: newPerfil,
    },
    { status: 201 }
  );
});
