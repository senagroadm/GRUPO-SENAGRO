import { NextRequest, NextResponse } from 'next/server';
import { expedicaoService } from '@/backend/modules/expedicao/expedicao-service';
import { StatusExpedicao } from '@/backend/modules/expedicao/expedicao-types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = request.headers.get('x-empresa-id') || searchParams.get('empresaId') || 'empresa-1';
    const tipo = searchParams.get('tipo') || 'expedicoes';
    const status = searchParams.get('status') as StatusExpedicao | undefined;
    const search = searchParams.get('search') || undefined;
    const expedicaoId = searchParams.get('expedicaoId');

    if (expedicaoId) {
      const exp = expedicaoService.getExpedicaoById(empresaId, expedicaoId);
      if (!exp) {
        return NextResponse.json({ error: 'Expedição não encontrada' }, { status: 404 });
      }
      return NextResponse.json({ expedicao: exp });
    }

    switch (tipo) {
      case 'expedicoes': {
        const expedicoes = expedicaoService.getExpedicoes(empresaId, status, search);
        return NextResponse.json({ expedicoes });
      }
      case 'cargas': {
        const cargas = expedicaoService.getCargas(empresaId);
        return NextResponse.json({ cargas });
      }
      case 'transportadoras': {
        const transportadoras = expedicaoService.getTransportadoras(empresaId);
        return NextResponse.json({ transportadoras });
      }
      case 'tabelas_frete': {
        const tabelasFrete = expedicaoService.getTabelasFrete(empresaId);
        return NextResponse.json({ tabelasFrete });
      }
      case 'veiculos': {
        const veiculos = expedicaoService.getVeiculos(empresaId);
        return NextResponse.json({ veiculos });
      }
      case 'motoristas': {
        const motoristas = expedicaoService.getMotoristas(empresaId);
        return NextResponse.json({ motoristas });
      }
      case 'indicadores_otif': {
        const indicadores = expedicaoService.calcularIndicadoresLogisticaEOTIF(empresaId);
        return NextResponse.json({ indicadores });
      }
      case 'simular_frete': {
        const modalidade = (searchParams.get('modalidade') || 'CIF') as any;
        const tipoTransp = (searchParams.get('tipoTransporte') || 'TRANSPORTADORA_TERCEIRA') as any;
        const transpId = searchParams.get('transportadoraId') || undefined;
        const pesoKg = parseFloat(searchParams.get('pesoKg') || '100');
        const volM3 = parseFloat(searchParams.get('volumeM3') || '0.5');
        const valorMerc = parseFloat(searchParams.get('valorMercadorias') || '10000');
        const ufDest = searchParams.get('ufDestino') || 'SP';

        const frete = expedicaoService.simularCalculoFrete(
          empresaId,
          modalidade,
          tipoTransp,
          transpId,
          pesoKg,
          volM3,
          valorMerc,
          ufDest
        );
        return NextResponse.json({ frete });
      }
      default: {
        const expedicoes = expedicaoService.getExpedicoes(empresaId);
        const indicadores = expedicaoService.calcularIndicadoresLogisticaEOTIF(empresaId);
        return NextResponse.json({ expedicoes, indicadores });
      }
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno no módulo de expedição' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const empresaId = request.headers.get('x-empresa-id') || 'empresa-1';
    const body = await request.json();
    const { acao, payload } = body;

    switch (acao) {
      case 'criar_expedicao': {
        const nova = expedicaoService.criarExpedicao(empresaId, payload);
        return NextResponse.json({ success: true, expedicao: nova, message: 'Expedição criada com sucesso!' });
      }

      case 'iniciar_separacao': {
        const exp = expedicaoService.iniciarSeparacao(
          empresaId,
          payload.expedicaoId,
          payload.operadorId,
          payload.operadorNome
        );
        return NextResponse.json({ success: true, expedicao: exp, message: 'Separação (Picking) iniciada!' });
      }

      case 'concluir_separacao': {
        const exp = expedicaoService.concluirSeparacao(empresaId, payload.expedicaoId, payload.itensColetados);
        return NextResponse.json({ success: true, expedicao: exp, message: 'Separação concluída com sucesso!' });
      }

      case 'iniciar_conferencia': {
        const exp = expedicaoService.iniciarConferencia(
          empresaId,
          payload.expedicaoId,
          payload.conferenteId,
          payload.conferenteNome,
          payload.metodo
        );
        return NextResponse.json({ success: true, expedicao: exp, message: 'Conferência de itens iniciada!' });
      }

      case 'bipar_item_conferencia': {
        const exp = expedicaoService.biparItemConferencia(
          empresaId,
          payload.expedicaoId,
          payload.codigoProduto,
          payload.codigoBarrasLido,
          payload.quantidadeLida
        );
        return NextResponse.json({ success: true, expedicao: exp });
      }

      case 'finalizar_conferencia': {
        const exp = expedicaoService.finalizarConferencia(
          empresaId,
          payload.expedicaoId,
          payload.pesoAferidoBalancaKg
        );
        return NextResponse.json({
          success: true,
          expedicao: exp,
          message:
            exp.conferencia?.status === 'APROVADA'
              ? 'Conferência aprovada 100%!'
              : 'Conferência finalizada com divergências.',
        });
      }

      case 'gerar_volumes': {
        const exp = expedicaoService.gerarVolumesEEtiquetas(empresaId, payload.expedicaoId, payload.volumes);
        return NextResponse.json({
          success: true,
          expedicao: exp,
          message: `${exp.quantidadeTotalVolumes} volume(s) e etiquetas térmicas GS1 gerados com sucesso!`,
        });
      }

      case 'gerar_documentacao': {
        const exp = expedicaoService.gerarDocumentacao(empresaId, payload.expedicaoId, payload);
        return NextResponse.json({
          success: true,
          expedicao: exp,
          message: 'Romaneio e Documentação Fiscal registrados!',
        });
      }

      case 'despachar': {
        const exp = expedicaoService.despacharExpedicao(empresaId, payload.expedicaoId, payload);
        return NextResponse.json({
          success: true,
          expedicao: exp,
          message: 'Expedição despachada da fábrica. Status alterado para EM TRÂNSITO.',
        });
      }

      case 'adicionar_rastreamento': {
        const exp = expedicaoService.adicionarRastreamento(empresaId, payload.expedicaoId, payload.evento);
        return NextResponse.json({ success: true, expedicao: exp, message: 'Marco de rastreamento adicionado!' });
      }

      case 'registrar_ocorrencia': {
        const res = expedicaoService.registrarOcorrencia(empresaId, payload.expedicaoId, payload);
        return NextResponse.json({
          success: true,
          expedicao: res.expedicao,
          ocorrencia: res.ocorrencia,
          message: 'Ocorrência registrada com sucesso.',
        });
      }

      case 'confirmar_entrega': {
        const exp = expedicaoService.confirmarEntrega(empresaId, payload.expedicaoId, payload);
        return NextResponse.json({
          success: true,
          expedicao: exp,
          message: 'Comprovante de entrega (canhoto) registrado com sucesso! Cálculo OTIF atualizado.',
        });
      }

      case 'criar_carga': {
        const carga = expedicaoService.criarCarga(empresaId, payload);
        return NextResponse.json({ success: true, carga, message: 'Carga consolidada criada com sucesso!' });
      }

      case 'salvar_transportadora': {
        const transp = expedicaoService.salvarTransportadora(empresaId, payload);
        return NextResponse.json({ success: true, transportadora: transp, message: 'Transportadora salva!' });
      }

      case 'salvar_tabela_frete': {
        const tab = expedicaoService.salvarTabelaFrete(empresaId, payload);
        return NextResponse.json({ success: true, tabelaFrete: tab, message: 'Tabela de frete salva!' });
      }

      case 'salvar_veiculo': {
        const veic = expedicaoService.salvarVeiculo(empresaId, payload);
        return NextResponse.json({ success: true, veiculo: veic, message: 'Veículo salvo com sucesso!' });
      }

      case 'salvar_motorista': {
        const mot = expedicaoService.salvarMotorista(empresaId, payload);
        return NextResponse.json({ success: true, motorista: mot, message: 'Motorista salvo com sucesso!' });
      }

      default:
        return NextResponse.json({ error: `Ação desconhecida: ${acao}` }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao processar requisição' }, { status: 500 });
  }
}
