import { NextRequest, NextResponse } from 'next/server';
import { pcpService } from '@/backend/modules/pcp/pcp-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sugestaoId } = body;

    if (!sugestaoId) {
      return NextResponse.json(
        { success: false, error: 'ID da sugestão de produção é obrigatório' },
        { status: 400 }
      );
    }

    const resultado = pcpService.converterSugestaoProducao(sugestaoId);

    if (!resultado.sucesso) {
      return NextResponse.json({ success: false, error: resultado.mensagem }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ordemProducaoNumero: resultado.ordemProducaoNumero,
      mensagem: resultado.mensagem,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao gerar Ordem de Produção' },
      { status: 500 }
    );
  }
}
