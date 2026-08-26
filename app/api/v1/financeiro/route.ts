import { NextRequest, NextResponse } from 'next/server';
import { financeiroService } from '@/backend/modules/financeiro/financeiro-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '11111111-1111-1111-1111-111111111111';
    const action = searchParams.get('action') || 'dashboard';

    if (action === 'contas-pagar') {
      const status = (searchParams.get('status') as any) || undefined;
      const data = financeiroService.getContasPagar(empresaId, status);
      return NextResponse.json({ success: true, data });
    }

    if (action === 'conta-pagar-detalhe') {
      const id = searchParams.get('id');
      if (!id) return NextResponse.json({ success: false, error: 'ID do título é obrigatório' }, { status: 400 });
      const data = financeiroService.getContaPagarById(empresaId, id);
      return NextResponse.json({ success: true, data });
    }

    if (action === 'contas-receber') {
      const status = (searchParams.get('status') as any) || undefined;
      const data = financeiroService.getContasReceber(empresaId, status);
      return NextResponse.json({ success: true, data });
    }

    if (action === 'conta-receber-detalhe') {
      const id = searchParams.get('id');
      if (!id) return NextResponse.json({ success: false, error: 'ID do título é obrigatório' }, { status: 400 });
      const data = financeiroService.getContaReceberById(empresaId, id);
      return NextResponse.json({ success: true, data });
    }

    if (action === 'adiantamentos') {
      const tipo = (searchParams.get('tipo') as any) || undefined;
      const data = financeiroService.getAdiantamentos(empresaId, tipo);
      return NextResponse.json({ success: true, data });
    }

    if (action === 'fluxo-caixa') {
      const dias = Number(searchParams.get('dias') || 15);
      const data = financeiroService.getProjecaoFluxoCaixa(empresaId, dias);
      return NextResponse.json({ success: true, data });
    }

    if (action === 'dre-sintetico') {
      const data = financeiroService.getDreSintetico(empresaId);
      return NextResponse.json({ success: true, data });
    }

    if (action === 'cadastros') {
      const planoContas = financeiroService.getPlanoContas(empresaId);
      const centrosCusto = financeiroService.getCentrosCusto(empresaId);
      const categorias = financeiroService.getCategoriasFinanceiras(empresaId);
      return NextResponse.json({ success: true, data: { planoContas, centrosCusto, categorias } });
    }

    if (action === 'auditoria') {
      const data = financeiroService.getAuditoriaLogs(empresaId);
      return NextResponse.json({ success: true, data });
    }

    // Default: 'dashboard'
    const resumo = financeiroService.getResumoFinanceiro(empresaId);
    const contasPagar = financeiroService.getContasPagar(empresaId);
    const contasReceber = financeiroService.getContasReceber(empresaId);
    const adiantamentos = financeiroService.getAdiantamentos(empresaId);
    const fluxoCaixa = financeiroService.getProjecaoFluxoCaixa(empresaId, 15);
    const dre = financeiroService.getDreSintetico(empresaId);
    const planoContas = financeiroService.getPlanoContas(empresaId);
    const centrosCusto = financeiroService.getCentrosCusto(empresaId);
    const categorias = financeiroService.getCategoriasFinanceiras(empresaId);
    const auditoria = financeiroService.getAuditoriaLogs(empresaId);

    return NextResponse.json({
      success: true,
      data: {
        resumo,
        contasPagar,
        contasReceber,
        adiantamentos,
        fluxoCaixa,
        dre,
        planoContas,
        centrosCusto,
        categorias,
        auditoria,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno no núcleo financeiro' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { empresaId, action } = body;

    if (!empresaId) {
      return NextResponse.json({ success: false, error: 'empresaId é obrigatório' }, { status: 400 });
    }

    if (action === 'criar-conta-pagar') {
      const { payload } = body;
      if (!payload) return NextResponse.json({ success: false, error: 'Payload é obrigatório' }, { status: 400 });
      const cp = financeiroService.criarContaPagarManual(empresaId, payload);
      return NextResponse.json({ success: true, data: cp });
    }

    if (action === 'aprovar-rejeitar-pagar') {
      const { contaPagarId, aprovado, usuarioId, usuarioNome, motivoRejeicao } = body;
      if (!contaPagarId) return NextResponse.json({ success: false, error: 'contaPagarId é obrigatório' }, { status: 400 });
      const cp = financeiroService.aprovarOuRejeitarContaPagar(
        empresaId,
        contaPagarId,
        aprovado,
        usuarioId || 'u-controladoria',
        usuarioNome || 'Gerência Controladoria',
        motivoRejeicao
      );
      return NextResponse.json({ success: true, data: cp });
    }

    if (action === 'baixar-conta-pagar') {
      const { contaPagarId, parcelaId, payload } = body;
      if (!contaPagarId || !parcelaId || !payload) {
        return NextResponse.json({ success: false, error: 'Parâmetros de baixa incompletos' }, { status: 400 });
      }
      const res = financeiroService.baixarParcelaContaPagar(empresaId, contaPagarId, parcelaId, payload);
      return NextResponse.json({ success: true, data: res });
    }

    if (action === 'cancelar-conta-pagar') {
      const { contaPagarId, motivo, usuarioId, usuarioNome } = body;
      if (!contaPagarId || !motivo) {
        return NextResponse.json({ success: false, error: 'contaPagarId e motivo são obrigatórios' }, { status: 400 });
      }
      const res = financeiroService.cancelarContaPagar(
        empresaId,
        contaPagarId,
        motivo,
        usuarioId || 'u-admin',
        usuarioNome || 'Administrador'
      );
      return NextResponse.json({ success: true, data: res });
    }

    if (action === 'criar-conta-receber') {
      const { payload } = body;
      if (!payload) return NextResponse.json({ success: false, error: 'Payload é obrigatório' }, { status: 400 });
      const cr = financeiroService.criarContaReceberManual(empresaId, payload);
      return NextResponse.json({ success: true, data: cr });
    }

    if (action === 'baixar-conta-receber') {
      const { contaReceberId, parcelaId, payload } = body;
      if (!contaReceberId || !parcelaId || !payload) {
        return NextResponse.json({ success: false, error: 'Parâmetros de recebimento incompletos' }, { status: 400 });
      }
      const res = financeiroService.baixarParcelaContaReceber(empresaId, contaReceberId, parcelaId, payload);
      return NextResponse.json({ success: true, data: res });
    }

    if (action === 'renegociar-titulos') {
      const { payload } = body;
      if (!payload) return NextResponse.json({ success: false, error: 'Payload de renegociação é obrigatório' }, { status: 400 });
      const res = financeiroService.renegociarTitulos(empresaId, payload);
      return NextResponse.json({ success: true, data: res });
    }

    if (action === 'criar-adiantamento') {
      const { payload } = body;
      if (!payload) return NextResponse.json({ success: false, error: 'Payload de adiantamento é obrigatório' }, { status: 400 });
      const ad = financeiroService.criarAdiantamento(empresaId, payload);
      return NextResponse.json({ success: true, data: ad });
    }

    if (action === 'compensar-adiantamento') {
      const { adiantamentoId, tituloId, parcelaId, tipoTitulo, valorCompensar, usuarioId, usuarioNome } = body;
      if (!adiantamentoId || !tituloId || !parcelaId || !valorCompensar) {
        return NextResponse.json({ success: false, error: 'Parâmetros de compensação incompletos' }, { status: 400 });
      }
      const ad = financeiroService.compensarAdiantamentoEmParcela(
        empresaId,
        adiantamentoId,
        tituloId,
        parcelaId,
        tipoTitulo || 'PAGAR',
        Number(valorCompensar),
        usuarioId || 'u-tesouraria',
        usuarioNome || 'Tesouraria'
      );
      return NextResponse.json({ success: true, data: ad });
    }

    if (action === 'criar-centro-custo') {
      const { payload } = body;
      const cc = financeiroService.criarCentroCusto(empresaId, payload);
      return NextResponse.json({ success: true, data: cc });
    }

    if (action === 'criar-categoria') {
      const { payload } = body;
      const cat = financeiroService.criarCategoriaFinanceira(empresaId, payload);
      return NextResponse.json({ success: true, data: cat });
    }

    return NextResponse.json({ success: false, error: `Ação ${action} não reconhecida` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar requisição financeira' },
      { status: 500 }
    );
  }
}
