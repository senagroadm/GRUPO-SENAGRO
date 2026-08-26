import { NextRequest, NextResponse } from 'next/server';
import { motorCustosService } from '@/backend/modules/custos/custos-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = req.headers.get('x-empresa-id') || searchParams.get('empresaId') || 'emp-tritech-corte';
    const tipo = searchParams.get('tipo') || 'resumo'; // 'resumo' | 'vigencias' | 'op' | 'pedido' | 'produto'
    const id = searchParams.get('id') || '';

    if (tipo === 'vigencias') {
      const vigencias = motorCustosService.listarParametrosVigencia(empresaId);
      const ativa = motorCustosService.obterParametrosVigentes(empresaId);
      return NextResponse.json({ success: true, vigencias, ativa });
    }

    if (tipo === 'op') {
      if (!id) {
        return NextResponse.json({ success: false, error: 'Parâmetro ID da OP é obrigatório' }, { status: 400 });
      }
      const analiseOp = motorCustosService.calcularCustoPorOP(empresaId, id);
      return NextResponse.json({ success: true, data: analiseOp });
    }

    if (tipo === 'pedido') {
      if (!id) {
        return NextResponse.json({ success: false, error: 'Parâmetro ID do Pedido é obrigatório' }, { status: 400 });
      }
      const analisePedido = motorCustosService.calcularCustoPorPedido(empresaId, id);
      return NextResponse.json({ success: true, data: analisePedido });
    }

    if (tipo === 'produto') {
      const codigo = id || 'CJ-CHAS-01';
      const analiseProduto = motorCustosService.calcularCustoPorProduto(empresaId, codigo);
      return NextResponse.json({ success: true, data: analiseProduto });
    }

    // Default: resumo executivo + parâmetros vigentes
    const resumo = motorCustosService.obterResumoGeralCustos(empresaId);
    const vigenciaAtiva = motorCustosService.obterParametrosVigentes(empresaId);

    return NextResponse.json({
      success: true,
      resumo,
      vigenciaAtiva,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar custos industriais' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const empresaId = req.headers.get('x-empresa-id') || 'emp-tritech-corte';
    const body = await req.json();
    const usuarioEmail = req.headers.get('x-usuario-email') || 'diretoria.industrial@tritech.ind.br';

    const vigenciaSalva = motorCustosService.salvarParametroVigencia(empresaId, body, usuarioEmail);

    return NextResponse.json({
      success: true,
      message: 'Parâmetros de custos atualizados com sucesso.',
      data: vigenciaSalva,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao salvar vigência de custos' },
      { status: 500 }
    );
  }
}
