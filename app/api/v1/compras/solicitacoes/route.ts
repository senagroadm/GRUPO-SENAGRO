import { NextRequest, NextResponse } from 'next/server';
import { comprasService } from '@/backend/modules/compras/compras-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '11111111-1111-1111-1111-111111111111';
    const solicitacoes = comprasService.listarSolicitacoes(empresaId);
    return NextResponse.json({ success: true, data: solicitacoes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const empresaId = body.empresaId || '11111111-1111-1111-1111-111111111111';

    const solicitacao = comprasService.criarSolicitacao(empresaId, {
      tipoGeracao: body.tipoGeracao || 'MANUAL',
      prioridade: body.prioridade || 'NORMAL',
      solicitanteNome: body.solicitanteNome || 'Comprador Industrial',
      departamento: body.departamento || 'Suprimentos',
      dataNecessidade: body.dataNecessidade || new Date().toISOString().split('T')[0],
      justificativa: body.justificativa || 'Reposição de estoque de matéria-prima',
      numeroOp: body.numeroOp,
      clienteNome: body.clienteNome,
      planoProducao: body.planoProducao,
      itens: body.itens || [],
    });

    return NextResponse.json({
      success: true,
      data: solicitacao,
      message: `Solicitação ${solicitacao.numero} criada com sucesso.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
