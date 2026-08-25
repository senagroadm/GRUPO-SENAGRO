import { NextRequest, NextResponse } from 'next/server';
import { comprasService } from '@/backend/modules/compras/compras-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const aprovadorNome = body.aprovadorNome || 'Diretoria Industrial';
    const parecer = body.parecer || 'Aprovado para cotação de mercado';

    const solicitacao = comprasService.aprovarSolicitacao(id, aprovadorNome, parecer);
    return NextResponse.json({
      success: true,
      data: solicitacao,
      message: `Solicitação ${solicitacao.numero} aprovada com sucesso.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
