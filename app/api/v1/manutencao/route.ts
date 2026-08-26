// app/api/v1/manutencao/route.ts
// Rota de API para o Módulo 11: Gestão de Manutenção & Ativos Industriais (PCM)

import { NextRequest, NextResponse } from 'next/server';
import { manutencaoService } from '@/backend/modules/manutencao/manutencao-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId') || 'emp-tritech-corte';
    const tipo = searchParams.get('tipo') || 'all';

    if (tipo === 'indicadores') {
      const indicadores = manutencaoService.obterIndicadoresPCM(empresaId);
      return NextResponse.json({ success: true, data: { indicadores } });
    }

    if (tipo === 'ativos') {
      const ativos = manutencaoService.listarAtivos(empresaId);
      return NextResponse.json({ success: true, data: { ativos } });
    }

    if (tipo === 'ordens') {
      const ordens = manutencaoService.listarOrdens(empresaId);
      return NextResponse.json({ success: true, data: { ordens } });
    }

    // Default 'all': Retorna visão consolidada completa do PCM
    const [
      indicadores,
      ativos,
      componentes,
      planos,
      ordens,
      ferramentas,
      paradas,
      horimetros,
      leiturasPreditivas,
      itensRequisitados,
      servicosTerceiros,
    ] = [
      manutencaoService.obterIndicadoresPCM(empresaId),
      manutencaoService.listarAtivos(empresaId),
      manutencaoService.listarComponentes(empresaId),
      manutencaoService.listarPlanos(empresaId),
      manutencaoService.listarOrdens(empresaId),
      manutencaoService.listarFerramentas(empresaId),
      manutencaoService.listarParadas(empresaId),
      manutencaoService.listarLeiturasHorimetro(empresaId),
      manutencaoService.listarLeiturasPreditivas(empresaId),
      manutencaoService.listarItensRequisitados(empresaId),
      manutencaoService.listarServicosTerceiros(empresaId),
    ];

    return NextResponse.json({
      success: true,
      data: {
        indicadores,
        ativos,
        componentes,
        planos,
        ordens,
        ferramentas,
        paradas,
        horimetros,
        leiturasPreditivas,
        itensRequisitados,
        servicosTerceiros,
      },
    });
  } catch (error: any) {
    console.error('Erro ao consultar PCM:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno ao consultar PCM' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { acao, empresaId, payload } = body;

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId é obrigatório' },
        { status: 400 }
      );
    }

    switch (acao) {
      case 'abrir_om': {
        const novaOM = manutencaoService.abrirOrdemManutencao(empresaId, payload);
        return NextResponse.json({
          success: true,
          message: `Ordem de Manutenção ${novaOM.numeroOM} aberta com sucesso!`,
          data: novaOM,
        });
      }

      case 'iniciar_om': {
        const omAtualizada = manutencaoService.iniciarExecucaoOM(
          payload.ordemId,
          empresaId,
          payload.tecnicoNome || 'Técnico Responsável'
        );
        return NextResponse.json({
          success: true,
          message: `Execução da ${omAtualizada.numeroOM} iniciada.`,
          data: omAtualizada,
        });
      }

      case 'atualizar_tarefa_om': {
        const omAtualizada = manutencaoService.atualizarTarefaOM(
          payload.ordemId,
          empresaId,
          payload.tarefaId,
          payload.dados
        );
        return NextResponse.json({
          success: true,
          message: 'Tarefa de checklist atualizada.',
          data: omAtualizada,
        });
      }

      case 'concluir_om': {
        const omConcluida = manutencaoService.concluirOrdemManutencao(
          payload.ordemId,
          empresaId,
          payload.dados
        );
        return NextResponse.json({
          success: true,
          message: `Ordem ${omConcluida.numeroOM} concluída com sucesso! Máquina liberada para produção.`,
          data: omConcluida,
        });
      }

      case 'requisitar_peca': {
        const resultado = manutencaoService.requisitarPecaParaOM(empresaId, payload);
        let msg = 'Peça reservada do estoque com sucesso.';
        if (resultado.item.statusAtendimento === 'SOLICITACAO_COMPRA_GERADA') {
          msg = `Estoque insuficiente! Solicitação de Compra ${resultado.solicitacaoCompraGerada?.numero || 'gerada'} criada automaticamente para o setor de Compras & Suprimentos.`;
        }
        return NextResponse.json({
          success: true,
          message: msg,
          data: resultado,
        });
      }

      case 'adicionar_servico_terceiro': {
        const servico = manutencaoService.adicionarServicoTerceiro(empresaId, payload);
        return NextResponse.json({
          success: true,
          message: 'Serviço terceirizado registrado na Ordem de Manutenção.',
          data: servico,
        });
      }

      case 'registrar_horimetro': {
        const resultado = manutencaoService.registrarLeituraHorimetro(empresaId, payload);
        let msg = 'Horímetro registrado com sucesso.';
        if (resultado.registro.disparouPreventiva && resultado.ordemPreventivaGerada) {
          msg = `Horímetro registrado! Gatilho de manutenção preventiva atingido: ${resultado.ordemPreventivaGerada.numeroOM} gerada automaticamente.`;
        }
        return NextResponse.json({
          success: true,
          message: msg,
          data: resultado,
        });
      }

      case 'cadastrar_ativo': {
        const novoAtivo = manutencaoService.cadastrarAtivo(empresaId, payload);
        return NextResponse.json({
          success: true,
          message: `Ativo industrial ${novoAtivo.tag} cadastrado com sucesso!`,
          data: novoAtivo,
        });
      }

      case 'atualizar_status_ativo': {
        const ativo = manutencaoService.atualizarStatusOperacional(
          payload.ativoId,
          empresaId,
          payload.statusOperacional,
          payload.motivo,
          payload.usuario
        );
        return NextResponse.json({
          success: true,
          message: `Status do ativo ${ativo.tag} alterado para ${ativo.statusOperacional}. ${ativo.bloqueioPCP ? 'PCP Notificado e Capacidade Bloqueada.' : 'Capacidade liberada para alocação.'}`,
          data: ativo,
        });
      }

      case 'cadastrar_plano': {
        const novoPlano = manutencaoService.cadastrarPlano(empresaId, payload);
        return NextResponse.json({
          success: true,
          message: `Plano Mestre de Manutenção ${novoPlano.codigo} cadastrado.`,
          data: novoPlano,
        });
      }

      case 'cadastrar_ferramenta': {
        const novaFerramenta = manutencaoService.cadastrarFerramenta(empresaId, payload);
        return NextResponse.json({
          success: true,
          message: `Ferramental ${novaFerramenta.codigo} cadastrado.`,
          data: novaFerramenta,
        });
      }

      case 'movimentar_ferramenta': {
        const mov = manutencaoService.movimentarFerramenta(empresaId, payload);
        return NextResponse.json({
          success: true,
          message: `Movimentação de ferramenta (${mov.tipoMovimento}) registrada.`,
          data: mov,
        });
      }

      case 'registrar_leitura_preditiva': {
        const leitura = manutencaoService.registrarLeituraSensor(empresaId, payload);
        return NextResponse.json({
          success: true,
          message: `Telemetria preditiva recebida: ${leitura.statusSensor}.`,
          data: leitura,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Ação desconhecida: "${acao}"` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Erro na ação de PCM:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar ação no PCM' },
      { status: 500 }
    );
  }
}
