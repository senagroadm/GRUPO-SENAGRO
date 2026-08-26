// app/api/v1/producao/apontamento/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { producaoService } from '@/backend/modules/producao/producao-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      empresaId,
      opId,
      opOperacaoId,
      tipoApontamento,
      dataHoraInicio,
      dataHoraFim,
      duracaoMinutos,
      operadorId,
      maquinaId,
      quantidadeBoas,
      quantidadeRefugo,
      quantidadeRetrabalho,
      motivoRefugo,
      descricaoRefugo,
      motivoRetrabalho,
      descricaoRetrabalho,
      materiaisConsumidos,
      custoConsumiveis,
      custoServicosExternos,
      detalhesCorte,
      detalhesDobra,
      detalhesSolda,
      detalhesPintura,
      detalhesMontagem,
      detalhesAcabamento,
      detalhesServicoExterno,
      observacoes,
    } = body;

    if (!empresaId || !opId || !opOperacaoId) {
      return NextResponse.json({ success: false, error: 'empresaId, opId e opOperacaoId são obrigatórios' }, { status: 400 });
    }

    const resultado = producaoService.registrarApontamento({
      empresaId,
      opId,
      opOperacaoId,
      tipoApontamento: tipoApontamento || 'PRODUCAO',
      dataHoraInicio: dataHoraInicio || new Date().toISOString(),
      dataHoraFim: dataHoraFim || new Date().toISOString(),
      duracaoMinutos: Number(duracaoMinutos || 0),
      operadorId: operadorId || 'op-01',
      maquinaId: maquinaId || 'maq-laser-01',
      quantidadeBoas: Number(quantidadeBoas || 0),
      quantidadeRefugo: Number(quantidadeRefugo || 0),
      quantidadeRetrabalho: Number(quantidadeRetrabalho || 0),
      motivoRefugo,
      descricaoRefugo,
      motivoRetrabalho,
      descricaoRetrabalho,
      materiaisConsumidos: materiaisConsumidos || [],
      custoConsumiveis: Number(custoConsumiveis || 0),
      custoServicosExternos: Number(custoServicosExternos || 0),
      detalhesCorte,
      detalhesDobra,
      detalhesSolda,
      detalhesPintura,
      detalhesMontagem,
      detalhesAcabamento,
      detalhesServicoExterno,
      observacoes,
    });

    return NextResponse.json({
      success: true,
      message: 'Apontamento de produção registrado com sucesso. Fluxo e custos atualizados.',
      data: resultado,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
