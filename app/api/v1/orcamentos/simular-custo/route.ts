import { NextRequest, NextResponse } from 'next/server';
import { IndustrialCostEngine } from '@/backend/modules/orcamento/orcamento-cost-engine';
import { orcamentoService } from '@/backend/modules/orcamento/orcamento-service';

export async function POST(req: NextRequest) {
  try {
    const empresaIdHeader = req.headers.get('x-empresa-id');
    const body = await req.json();
    const empresaId = empresaIdHeader || body.empresaId || 'default';

    const params = orcamentoService.getParametrosEmpresa(empresaId);

    // 1. Calcular Material se aplicável
    let detalheMaterial = undefined;
    if (body.material && body.material.tipoMaterial) {
      detalheMaterial = IndustrialCostEngine.calcularCustoMaterial({
        tipoMaterial: body.material.tipoMaterial,
        formato: body.material.formato || 'CHAPA',
        especificacao: body.material.especificacao,
        espessuraMm: body.material.espessuraMm ? Number(body.material.espessuraMm) : undefined,
        larguraMm: body.material.larguraMm ? Number(body.material.larguraMm) : undefined,
        comprimentoMm: body.material.comprimentoMm ? Number(body.material.comprimentoMm) : undefined,
        diametroMm: body.material.diametroMm ? Number(body.material.diametroMm) : undefined,
        pesoInformadoKg: body.material.pesoInformadoKg ? Number(body.material.pesoInformadoKg) : undefined,
        fatorPerdaAproveitamento: body.material.fatorPerdaAproveitamento ? Number(body.material.fatorPerdaAproveitamento) : undefined,
        precoKgCustom: body.material.precoKgCustom ? Number(body.material.precoKgCustom) : undefined,
        parametros: params,
      });
    }

    // 2. Calcular Corte se aplicável
    let detalheCorte = undefined;
    if (body.corte && body.corte.processo && body.corte.processo !== 'NAO_APLICA' && body.corte.comprimentoCorteMetros > 0) {
      detalheCorte = IndustrialCostEngine.calcularCustoCorte({
        processo: body.corte.processo,
        espessuraMm: Number(body.corte.espessuraMm || (detalheMaterial?.espessuraMm || 3.0)),
        comprimentoCorteMetros: Number(body.corte.comprimentoCorteMetros),
        numeroPerfuracoes: body.corte.numeroPerfuracoes ? Number(body.corte.numeroPerfuracoes) : undefined,
        velocidadeCorteCustomMmMin: body.corte.velocidadeCorteCustomMmMin ? Number(body.corte.velocidadeCorteCustomMmMin) : undefined,
        parametros: params,
      });
    }

    // 3. Calcular Dobra se aplicável
    let detalheDobra = undefined;
    if (body.dobra && body.dobra.processo && body.dobra.processo !== 'NAO_APLICA' && body.dobra.numeroDobras > 0) {
      detalheDobra = IndustrialCostEngine.calcularCustoDobra({
        processo: body.dobra.processo,
        espessuraMm: Number(body.dobra.espessuraMm || (detalheMaterial?.espessuraMm || 3.0)),
        comprimentoDobraMm: Number(body.dobra.comprimentoDobraMm || 1000),
        numeroDobras: Number(body.dobra.numeroDobras),
        tempoSetupMinutos: body.dobra.tempoSetupMinutos ? Number(body.dobra.tempoSetupMinutos) : undefined,
        parametros: params,
      });
    }

    // 4. Calcular Solda se aplicável
    let detalheSolda = undefined;
    if (body.solda && body.solda.processo && body.solda.processo !== 'NAO_APLICA' && body.solda.comprimentoSoldaMm > 0) {
      detalheSolda = IndustrialCostEngine.calcularCustoSolda({
        processo: body.solda.processo,
        tipoJunta: body.solda.tipoJunta,
        comprimentoSoldaMm: Number(body.solda.comprimentoSoldaMm),
        pernaSoldaMm: body.solda.pernaSoldaMm ? Number(body.solda.pernaSoldaMm) : undefined,
        horasSoldadorInformadas: body.solda.horasSoldadorInformadas ? Number(body.solda.horasSoldadorInformadas) : undefined,
        parametros: params,
      });
    }

    // 5. Calcular Pintura se aplicável
    let detalhePintura = undefined;
    if (body.pintura && body.pintura.processo && body.pintura.processo !== 'NAO_APLICA' && body.pintura.areaPinturaM2 > 0) {
      detalhePintura = IndustrialCostEngine.calcularCustoPintura({
        processo: body.pintura.processo,
        areaPinturaM2: Number(body.pintura.areaPinturaM2),
        numeroDemaos: body.pintura.numeroDemaos ? Number(body.pintura.numeroDemaos) : undefined,
        tempoCabineMinutos: body.pintura.tempoCabineMinutos ? Number(body.pintura.tempoCabineMinutos) : undefined,
        parametros: params,
      });
    }

    // 6. Calcular Montagem se aplicável
    let detalheMontagem = undefined;
    if (body.montagem && (body.montagem.horasMontador > 0 || body.montagem.insumosFixacaoValor > 0)) {
      detalheMontagem = IndustrialCostEngine.calcularCustoMontagem({
        horasMontador: Number(body.montagem.horasMontador || 0),
        insumosFixacaoValor: Number(body.montagem.insumosFixacaoValor || 0),
        tempoAjusteMinutos: Number(body.montagem.tempoAjusteMinutos || 0),
        parametros: params,
      });
    }

    // 7. Consolidar Formação de Preço e Mark-up
    const composicao = IndustrialCostEngine.consolidarPrecoItem({
      tipoItem: body.tipoItem || 'PRODUTO_FABRICADO',
      custoMaterial: detalheMaterial,
      custoCorte: detalheCorte,
      custoDobra: detalheDobra,
      custoSolda: detalheSolda,
      custoPintura: detalhePintura,
      custoMontagem: detalheMontagem,
      custoDiretoInformado: body.custoDiretoInformado ? Number(body.custoDiretoInformado) : undefined,
      custoInsumosTerceirizados: body.custoInsumosTerceirizados ? Number(body.custoInsumosTerceirizados) : undefined,
      margemLucroDesejadaPercentual: body.margemLucroDesejadaPercentual ? Number(body.margemLucroDesejadaPercentual) : undefined,
      descontoItemPercentual: body.descontoItemPercentual ? Number(body.descontoItemPercentual) : 0,
      parametros: params,
    });

    return NextResponse.json({
      success: true,
      data: composicao,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao simular custo e formação de preço' },
      { status: 500 }
    );
  }
}
