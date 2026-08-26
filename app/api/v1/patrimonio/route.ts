// app/api/v1/patrimonio/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { patrimonioCalibracaoService } from '@/backend/modules/patrimonio/patrimonio-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || 'emp-01';

    const ativos = patrimonioCalibracaoService.listarAtivos(empresaId);
    const ferramentas = patrimonioCalibracaoService.listarFerramentas(empresaId);
    const instrumentos = patrimonioCalibracaoService.listarInstrumentos(empresaId);
    const indicadores = patrimonioCalibracaoService.obterIndicadoresEAlertas(empresaId);

    return NextResponse.json({
      success: true,
      data: {
        ativos,
        ferramentas,
        instrumentos,
        indicadores,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao carregar dados de patrimônio e calibração' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { acao, empresaId, payload } = body;

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId é obrigatório para isolamento multiempresa.' },
        { status: 400 }
      );
    }

    let resultado: any;

    switch (acao) {
      // 1. Ações de Patrimônio
      case 'cadastrar_ativo': {
        resultado = patrimonioCalibracaoService.cadastrarAtivo(
          empresaId,
          payload.empresaNome || 'TRITECH Industrial',
          payload
        );
        return NextResponse.json({
          success: true,
          message: `Ativo ${resultado.codigoPatrimonio} cadastrado e tombado com sucesso.`,
          data: resultado,
        });
      }

      case 'transferir_ativo': {
        resultado = patrimonioCalibracaoService.transferirLocalizacaoResponsavel(
          empresaId,
          payload.id,
          payload
        );
        return NextResponse.json({
          success: true,
          message: `Movimentação do ativo ${resultado.codigoPatrimonio} registrada com sucesso.`,
          data: resultado,
        });
      }

      case 'baixar_ativo': {
        resultado = patrimonioCalibracaoService.baixarAtivo(
          empresaId,
          payload.id,
          payload
        );
        return NextResponse.json({
          success: true,
          message: `Baixa patrimonial do ativo ${resultado.codigoPatrimonio} efetuada com sucesso.`,
          data: resultado,
        });
      }

      // 2. Ações de Ferramentas
      case 'cadastrar_ferramenta': {
        resultado = patrimonioCalibracaoService.cadastrarFerramenta(empresaId, payload);
        return NextResponse.json({
          success: true,
          message: `Ferramenta ${resultado.codigo} cadastrada com sucesso.`,
          data: resultado,
        });
      }

      case 'atualizar_condicao_ferramenta': {
        resultado = patrimonioCalibracaoService.atualizarCondicaoFerramenta(
          empresaId,
          payload.id,
          payload
        );
        return NextResponse.json({
          success: true,
          message: `Condição da ferramenta ${resultado.codigo} atualizada para ${resultado.condicao}.`,
          data: resultado,
        });
      }

      case 'movimentar_ferramenta': {
        resultado = patrimonioCalibracaoService.registrarMovimentacaoFerramenta(
          empresaId,
          payload.id,
          payload
        );
        return NextResponse.json({
          success: true,
          message: `Movimentação da ferramenta ${resultado.codigo} registrada com sucesso.`,
          data: resultado,
        });
      }

      case 'manutencao_ferramenta': {
        resultado = patrimonioCalibracaoService.registrarManutencaoAfiacaoFerramenta(
          empresaId,
          payload.id,
          payload
        );
        return NextResponse.json({
          success: true,
          message: `Intervenção de ${payload.tipo} da ferramenta ${resultado.codigo} registrada com sucesso.`,
          data: resultado,
        });
      }

      // 3. Ações de Calibração
      case 'cadastrar_instrumento': {
        resultado = patrimonioCalibracaoService.cadastrarInstrumento(empresaId, payload);
        return NextResponse.json({
          success: true,
          message: `Instrumento de medição ${resultado.codigoInstrumento} cadastrado com sucesso.`,
          data: resultado,
        });
      }

      case 'registrar_calibracao': {
        resultado = patrimonioCalibracaoService.registrarNovaCalibracao(
          empresaId,
          payload.id,
          payload
        );
        return NextResponse.json({
          success: true,
          message: `Calibração do instrumento ${resultado.codigoInstrumento} homologada com certificado ${payload.numeroCertificado}.`,
          data: resultado,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Ação '${acao}' desconhecida no módulo de patrimônio e calibração.` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar requisição no servidor.' },
      { status: 500 }
    );
  }
}
