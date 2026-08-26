// app/api/v1/qualidade/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { qualidadeService } from '@/backend/modules/qualidade/qualidade-service';
import { TipoInspecao, DisposicaoQualidade, StatusNC, SeveridadeNC } from '@/backend/modules/qualidade/qualidade-types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId') || 'emp-tritech-corte';
    const tipo = searchParams.get('tipo') as TipoInspecao | null;
    const disposicao = searchParams.get('disposicao') as DisposicaoQualidade | null;
    const statusNC = searchParams.get('statusNC') as StatusNC | null;
    const severidadeNC = searchParams.get('severidadeNC') as SeveridadeNC | null;
    const secao = searchParams.get('secao') || 'todos';

    if (secao === 'indicadores') {
      const kpis = qualidadeService.obterIndicadoresQualidade(empresaId);
      return NextResponse.json({ success: true, data: kpis });
    }

    if (secao === 'checklists') {
      const modelos = qualidadeService.listarModelosChecklist(empresaId, tipo || undefined);
      return NextResponse.json({ success: true, data: modelos });
    }

    if (secao === 'inspecoes') {
      const inspecoes = qualidadeService.listarInspecoes(empresaId, tipo || undefined, disposicao || undefined);
      return NextResponse.json({ success: true, data: inspecoes });
    }

    if (secao === 'rncs') {
      const rncs = qualidadeService.listarNaoConformidades(empresaId, statusNC || undefined, severidadeNC || undefined);
      return NextResponse.json({ success: true, data: rncs });
    }

    if (secao === 'retrabalhos') {
      const retrabalhos = qualidadeService.listarRetrabalhos(empresaId);
      return NextResponse.json({ success: true, data: retrabalhos });
    }

    if (secao === 'refugos') {
      const refugos = qualidadeService.listarRefugos(empresaId);
      return NextResponse.json({ success: true, data: refugos });
    }

    // Todos consolidados
    const modelos = qualidadeService.listarModelosChecklist(empresaId);
    const inspecoes = qualidadeService.listarInspecoes(empresaId);
    const rncs = qualidadeService.listarNaoConformidades(empresaId);
    const retrabalhos = qualidadeService.listarRetrabalhos(empresaId);
    const refugos = qualidadeService.listarRefugos(empresaId);
    const indicadores = qualidadeService.obterIndicadoresQualidade(empresaId);

    return NextResponse.json({
      success: true,
      data: {
        modelosChecklist: modelos,
        inspecoes,
        naoConformidades: rncs,
        retrabalhos,
        refugos,
        indicadores,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Erro ao buscar dados do módulo de qualidade' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { acao, empresaId = 'emp-tritech-corte', payload, usuarioNome = 'Auditor Qualidade', usuarioEmail = 'qualidade@tritech.ind.br' } = body;

    if (!acao) {
      return NextResponse.json(
        { success: false, error: { message: 'Parâmetro "acao" é obrigatório.' } },
        { status: 400 }
      );
    }

    switch (acao) {
      case 'REGISTRAR_INSPECAO': {
        const resultado = qualidadeService.registrarInspecao(empresaId, payload, usuarioNome, usuarioEmail);
        return NextResponse.json({
          success: true,
          message: `Inspeção ${resultado.inspecao.numeroInspecao} registrada com sucesso. Disposição: ${resultado.inspecao.disposicaoFinal}`,
          data: resultado,
        });
      }

      case 'CRIAR_CHECKLIST': {
        const novoChecklist = qualidadeService.criarModeloChecklist(empresaId, payload, usuarioEmail);
        return NextResponse.json({
          success: true,
          message: `Modelo de checklist ${novoChecklist.codigo} cadastrado com sucesso.`,
          data: novoChecklist,
        });
      }

      case 'CRIAR_RNC': {
        const novaRNC = qualidadeService.criarNaoConformidade(empresaId, payload, usuarioNome);
        return NextResponse.json({
          success: true,
          message: `Não Conformidade ${novaRNC.numeroRNC} aberta com sucesso.`,
          data: novaRNC,
        });
      }

      case 'ADICIONAR_CAUSA': {
        const { rncId, causa } = payload;
        const rncAtualizada = qualidadeService.adicionarCausaIshikawa(rncId, empresaId, {
          ...causa,
          identificadaPor: usuarioNome,
        });
        return NextResponse.json({
          success: true,
          message: 'Análise de causa raiz Ishikawa 6M & 5 Porquês vinculada à RNC com sucesso.',
          data: rncAtualizada,
        });
      }

      case 'ADICIONAR_ACAO_CORRETIVA': {
        const { rncId, acaoCorretiva } = payload;
        const rncAtualizada = qualidadeService.adicionarAcaoCorretiva(rncId, empresaId, acaoCorretiva);
        return NextResponse.json({
          success: true,
          message: 'Plano de ação corretiva registrado com sucesso.',
          data: rncAtualizada,
        });
      }

      case 'ADICIONAR_ACAO_PREVENTIVA': {
        const { rncId, acaoPreventiva } = payload;
        const rncAtualizada = qualidadeService.adicionarAcaoPreventiva(rncId, empresaId, acaoPreventiva);
        return NextResponse.json({
          success: true,
          message: 'Ação preventiva e lição aprendida registradas com sucesso.',
          data: rncAtualizada,
        });
      }

      case 'VALIDAR_EFICACIA': {
        const { rncId, eficaz, descricao } = payload;
        const rncAtualizada = qualidadeService.validarEficaciaRNC(rncId, empresaId, {
          eficaz,
          descricao,
          validadoPor: usuarioNome,
        });
        return NextResponse.json({
          success: true,
          message: `Eficácia da RNC avaliada como ${eficaz ? 'EFICAZ (Concluída)' : 'INEFICAZ (Reaberta)'}.`,
          data: rncAtualizada,
        });
      }

      case 'CRIAR_RETRABALHO': {
        const novoRetrabalho = qualidadeService.criarOrdemRetrabalho(empresaId, payload, usuarioNome);
        return NextResponse.json({
          success: true,
          message: `Ordem de retrabalho ${novoRetrabalho.numeroRetrabalho} gerada com sucesso.`,
          data: novoRetrabalho,
        });
      }

      case 'REGISTRAR_REFUGO': {
        const novoRefugo = qualidadeService.registrarRefugo(empresaId, payload, usuarioNome);
        return NextResponse.json({
          success: true,
          message: `Refugo/Sucata ${novoRefugo.numeroRefugo} registrado com sucesso.`,
          data: novoRefugo,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: { message: `Ação "${acao}" não reconhecida.` } },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Erro ao executar ação no módulo de qualidade' } },
      { status: 500 }
    );
  }
}
