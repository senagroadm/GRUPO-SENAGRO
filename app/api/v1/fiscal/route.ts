import { NextRequest, NextResponse } from 'next/server';
import { fiscalService } from '@/backend/modules/fiscal/fiscal-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || 'empresa-1';
    const action = searchParams.get('action') || 'all';

    if (action === 'status-servicos') {
      const status = await fiscalService.verificarStatusServicos(empresaId);
      return NextResponse.json({ success: true, data: status });
    }

    if (action === 'documentos') {
      const modelo = (searchParams.get('modelo') as any) || undefined;
      const status = searchParams.get('status') || undefined;
      const search = searchParams.get('search') || undefined;
      const docs = fiscalService.getDocumentosFiscais(empresaId, { modelo, status, search });
      return NextResponse.json({ success: true, data: docs });
    }

    if (action === 'documento-detalhe') {
      const docId = searchParams.get('id');
      if (!docId) {
        return NextResponse.json({ success: false, error: 'ID do documento é obrigatório' }, { status: 400 });
      }
      const doc = fiscalService.getDocumentoById(empresaId, docId);
      const eventos = fiscalService.getEventosFiscais(empresaId, docId);
      return NextResponse.json({ success: true, data: { documento: doc, eventos } });
    }

    if (action === 'titulos') {
      const titulos = fiscalService.getTitulosFinanceiros(empresaId);
      return NextResponse.json({ success: true, data: titulos });
    }

    if (action === 'auditoria') {
      const audit = fiscalService.getAuditoriaLogsFaturamento(empresaId);
      return NextResponse.json({ success: true, data: audit });
    }

    // Default: 'all' payload completo para o dashboard fiscal
    const configuracao = fiscalService.getConfiguracao(empresaId);
    const series = fiscalService.getSeriesFiscais(empresaId);
    const operacoes = fiscalService.getOperacoesFiscais(empresaId);
    const regras = fiscalService.getRegrasTributarias(empresaId);
    const tribProdutos = fiscalService.getTributacoesProdutos(empresaId);
    const tribServicos = fiscalService.getTributacoesServicos(empresaId);
    const certificados = fiscalService.getCertificados(empresaId);
    const documentos = fiscalService.getDocumentosFiscais(empresaId);
    const logs = fiscalService.getLogsIntegracao(empresaId);
    const eventos = fiscalService.getEventosFiscais(empresaId);
    const titulos = fiscalService.getTitulosFinanceiros(empresaId);
    const auditoriaFaturamento = fiscalService.getAuditoriaLogsFaturamento(empresaId);

    return NextResponse.json({
      success: true,
      data: {
        configuracao,
        series,
        operacoes,
        regras,
        tribProdutos,
        tribServicos,
        certificados,
        documentos,
        logs,
        eventos,
        titulos,
        auditoriaFaturamento,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno na camada fiscal' },
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

    if (action === 'pre-validar') {
      const { request } = body;
      if (!request) {
        return NextResponse.json({ success: false, error: 'Payload de requisição não informado' }, { status: 400 });
      }
      const validacao = fiscalService.preValidarEmissao(empresaId, request);
      return NextResponse.json({ success: true, data: validacao });
    }

    if (action === 'emitir') {
      const { request } = body;
      if (!request || !request.idempotencyKey) {
        return NextResponse.json(
          { success: false, error: 'Payload de emissão e idempotencyKey são obrigatórios' },
          { status: 400 }
        );
      }
      const result = await fiscalService.emitirDocumentoFiscal(empresaId, request);
      return NextResponse.json({ success: true, data: result });
    }

    if (action === 'inutilizar') {
      const { request } = body;
      if (!request || !request.justificativa || !request.serie || !request.numeroInicial || !request.numeroFinal) {
        return NextResponse.json(
          { success: false, error: 'Dados incompletos para inutilização de faixa' },
          { status: 400 }
        );
      }
      const result = await fiscalService.inutilizarNumeracaoFiscal(empresaId, request);
      return NextResponse.json({ success: true, data: result });
    }

    if (action === 'importar-xml') {
      const { xmlConteudo, usuarioId } = body;
      if (!xmlConteudo) {
        return NextResponse.json({ success: false, error: 'Conteúdo XML é obrigatório' }, { status: 400 });
      }
      const result = await fiscalService.importarXmlFiscal(empresaId, xmlConteudo, usuarioId || 'usuario-sistema');
      return NextResponse.json({ success: result.sucesso, data: result, error: result.sucesso ? undefined : result.mensagem });
    }

    if (action === 'reprocessar') {
      const { documentoId, requestCorrigido, usuarioId } = body;
      if (!documentoId || !requestCorrigido) {
        return NextResponse.json(
          { success: false, error: 'documentoId e requestCorrigido são obrigatórios' },
          { status: 400 }
        );
      }
      const result = await fiscalService.reprocessarTentativaRejeitada(
        empresaId,
        documentoId,
        requestCorrigido,
        usuarioId || 'usuario-sistema'
      );
      return NextResponse.json({ success: true, data: result });
    }

    if (action === 'evento') {

      const { documentoFiscalId, tipoEvento, detalhes, usuarioId } = body;
      if (!documentoFiscalId || !tipoEvento) {
        return NextResponse.json(
          { success: false, error: 'documentoFiscalId e tipoEvento são obrigatórios' },
          { status: 400 }
        );
      }
      const result = await fiscalService.registrarEventoFiscal(
        empresaId,
        documentoFiscalId,
        tipoEvento,
        detalhes || {},
        usuarioId || 'usuario-sistema'
      );
      return NextResponse.json({ success: true, data: result });
    }

    if (action === 'salvar-config') {
      const { configuracao } = body;
      const res = fiscalService.salvarConfiguracao(empresaId, configuracao);
      return NextResponse.json({ success: true, data: res });
    }

    if (action === 'salvar-regra') {
      const { regra } = body;
      const res = fiscalService.salvarRegraTributaria(empresaId, regra);
      return NextResponse.json({ success: true, data: res });
    }

    if (action === 'salvar-operacao') {
      const { operacao } = body;
      const res = fiscalService.salvarOperacaoFiscal(empresaId, operacao);
      return NextResponse.json({ success: true, data: res });
    }

    if (action === 'salvar-serie') {
      const { serie } = body;
      const res = fiscalService.salvarSerieFiscal(empresaId, serie);
      return NextResponse.json({ success: true, data: res });
    }

    if (action === 'salvar-trib-produto') {
      const { tributacaoProduto } = body;
      const res = fiscalService.salvarTributacaoProduto(empresaId, tributacaoProduto);
      return NextResponse.json({ success: true, data: res });
    }

    return NextResponse.json({ success: false, error: `Ação ${action} não reconhecida` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar requisição fiscal' },
      { status: 500 }
    );
  }
}
