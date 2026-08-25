import crypto from 'crypto';
import {
  PedidoVenda,
  PedidoItem,
  PedidoParcela,
  PedidoEntrega,
  PedidoAprovacao,
  VersaoComercialCongelada,
  StatusPedido,
  OrigemPedido,
  TipoItemPedido,
  TipoFrete,
  TransicaoStatusLog,
  PoliticaVendaEmpresa,
} from './pedido-types';
import { PedidoStateMachine, AnaliseMudancaCritica } from './pedido-state-machine';
import { orcamentoService } from '../orcamento/orcamento-service';
import { creditoService } from '../credito/credito-service';

export class PedidoService {
  private pedidos: Map<string, PedidoVenda> = new Map();
  private politicasVenda: Map<string, PoliticaVendaEmpresa> = new Map();

  constructor() {
    this.inicializarPoliticasVenda();
    this.seedInitialData();
  }

  private inicializarPoliticasVenda() {
    // Parâmetros de política comercial por empresa industrial do grupo
    const padroes: PoliticaVendaEmpresa[] = [
      {
        empresaId: 'emp-tritech-corte',
        margemMinimaPermitidaPerc: 16.0,
        toleranciaVariacaoReaberturaPerc: 2.0,
        toleranciaVariacaoReaberturaValor: 500.0,
        exigirAprovacaoCredito: true,
        exigirAprovacaoMargem: true,
        reservaAutomaticaAoAprovar: true,
        geracaoAutomaticaOPAoAprovar: true,
      },
      {
        empresaId: 'emp-tritech-caldeiraria',
        margemMinimaPermitidaPerc: 18.0,
        toleranciaVariacaoReaberturaPerc: 1.5,
        toleranciaVariacaoReaberturaValor: 1000.0,
        exigirAprovacaoCredito: true,
        exigirAprovacaoMargem: true,
        reservaAutomaticaAoAprovar: true,
        geracaoAutomaticaOPAoAprovar: true,
      },
      {
        empresaId: 'emp-tritech-usinagem',
        margemMinimaPermitidaPerc: 20.0,
        toleranciaVariacaoReaberturaPerc: 2.0,
        toleranciaVariacaoReaberturaValor: 500.0,
        exigirAprovacaoCredito: true,
        exigirAprovacaoMargem: true,
        reservaAutomaticaAoAprovar: true,
        geracaoAutomaticaOPAoAprovar: true,
      },
      {
        empresaId: 'emp-004',
        margemMinimaPermitidaPerc: 16.0,
        toleranciaVariacaoReaberturaPerc: 2.0,
        toleranciaVariacaoReaberturaValor: 500.0,
        exigirAprovacaoCredito: true,
        exigirAprovacaoMargem: true,
        reservaAutomaticaAoAprovar: true,
        geracaoAutomaticaOPAoAprovar: true,
      },
    ];

    padroes.forEach((p) => this.politicasVenda.set(p.empresaId, p));
  }

  public getPoliticaVenda(empresaId: string): PoliticaVendaEmpresa {
    return (
      this.politicasVenda.get(empresaId) || {
        empresaId,
        margemMinimaPermitidaPerc: 16.0,
        toleranciaVariacaoReaberturaPerc: 2.0,
        toleranciaVariacaoReaberturaValor: 500.0,
        exigirAprovacaoCredito: true,
        exigirAprovacaoMargem: true,
        reservaAutomaticaAoAprovar: true,
        geracaoAutomaticaOPAoAprovar: true,
      }
    );
  }

  // ---------------------------------------------------------------------------
  // CONSULTAS
  // ---------------------------------------------------------------------------

  public getPedidos(filtros?: {
    empresaId?: string;
    status?: StatusPedido;
    origem?: OrigemPedido;
    clienteId?: string;
    busca?: string;
  }): PedidoVenda[] {
    let lista = Array.from(this.pedidos.values());

    if (filtros?.empresaId && filtros.empresaId !== 'TODAS') {
      lista = lista.filter((p) => p.empresaId === filtros.empresaId);
    }

    if (filtros?.status) {
      lista = lista.filter((p) => p.status === filtros.status);
    }

    if (filtros?.origem) {
      lista = lista.filter((p) => p.origem === filtros.origem);
    }

    if (filtros?.clienteId) {
      lista = lista.filter((p) => p.clienteId === filtros.clienteId);
    }

    if (filtros?.busca) {
      const q = filtros.busca.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.numero.toLowerCase().includes(q) ||
          p.clienteNome.toLowerCase().includes(q) ||
          p.clienteCnpjCpf.toLowerCase().includes(q) ||
          (p.orcamentoNumero && p.orcamentoNumero.toLowerCase().includes(q)) ||
          p.itens.some((it) => it.descricao.toLowerCase().includes(q) || it.codigoItem.toLowerCase().includes(q))
      );
    }

    // Ordenar decrescente por data de criação / número
    return lista.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  public getPedidoById(id: string): PedidoVenda | undefined {
    return this.pedidos.get(id);
  }

  public getPedidoByNumero(numero: string): PedidoVenda | undefined {
    return Array.from(this.pedidos.values()).find((p) => p.numero === numero);
  }

  // ---------------------------------------------------------------------------
  // CONVERSÃO DE ORÇAMENTO PARA PEDIDO DE VENDA
  // ---------------------------------------------------------------------------

  public async converterOrcamentoParaPedido(
    orcamentoId: string,
    empresaId: string,
    usuario: { id: string; nome: string; cargo: string }
  ): Promise<PedidoVenda> {
    // 1. Obter orçamento original
    const orc = orcamentoService.getOrcamentoById(orcamentoId, empresaId);
    if (!orc) {
      throw new Error(`Orçamento #${orcamentoId} não encontrado no sistema.`);
    }

    // 2. Verificar elegibilidade para conversão (APROVADO, GANHO, ENVIADO_CLIENTE ou RASCUNHO validado)
    const statusElegiveis = ['APROVADO', 'GANHO', 'ENVIADO_CLIENTE', 'EM_NEGOCIACAO'];
    if (!statusElegiveis.includes(orc.status)) {
      throw new Error(
        `Orçamento com status '${orc.status}' não pode ser convertido em pedido. Status deve ser um dos: [${statusElegiveis.join(', ')}].`
      );
    }

    const politicaVenda = this.getPoliticaVenda(empresaId);
    const novoNumero = this.gerarProximoNumeroPedido(empresaId);
    const pedidoId = `ped-${crypto.randomUUID().slice(0, 8)}`;
    const agora = new Date().toISOString();

    // 3. Mapear Itens do Orçamento para Itens de Pedido preservando custos e margens
    const itensPedido: PedidoItem[] = orc.itens.map((it, idx) => {
      const precoUnit = it.precoUnitarioFinal;
      const qtd = it.quantidade;
      const descPerc = it.percentualDesconto || 0;
      const valorDesc = Number((it.valorDescontoUnitario * qtd).toFixed(2));
      const precoLiq = it.precoUnitarioFinal;
      const valorTot = it.subtotalFinal;
      const aliquotaIpi = 5;
      const aliquotaIcms = 18;
      const valorIpi = Number((valorTot * (aliquotaIpi / 100)).toFixed(2));
      const valorIcms = Number((valorTot * (aliquotaIcms / 100)).toFixed(2));
      const prazoItemDias = 7;
      const dataPrometidaItem = this.calcularDataFuturaDias(agora, prazoItemDias);

      return {
        id: `ped-it-${crypto.randomUUID().slice(0, 8)}`,
        pedidoId,
        numeroItem: idx + 1,
        produtoId: it.id,
        codigoItem: it.codigoItem || `PROD-${String(idx + 1).padStart(3, '0')}`,
        descricao: it.descricao,
        tipoItem: (it.tipoItem as TipoItemPedido) || 'PRODUTO_FABRICADO',
        ncm: it.ncm || '7326.90.90',
        unidadeMedida: it.unidadeMedida || 'UN',
        quantidade: qtd,
        quantidadeEntregue: 0,
        quantidadeFaturada: 0,
        quantidadeReservadaEstoque: 0,
        quantidadePendenteProducao: it.tipoItem === 'PRODUTO_FABRICADO' || it.tipoItem === 'PRODUTO_SERVICO' ? qtd : 0,
        precoUnitario: precoUnit,
        descontoPerc: descPerc,
        valorDesconto: valorDesc,
        precoLiquido: precoLiq,
        valorTotal: valorTot,
        aliquotaIpi,
        valorIpi,
        aliquotaIcms,
        valorIcms,
        custoUnitarioEstimado: it.custoUnitario,
        custoTotalEstimado: it.subtotalCusto,
        margemItemPerc: it.margemContribuicaoPercentual,
        prazoItemDias,
        dataPrometidaItem,
        necessidadeGerada: {
          tipo: 'NENHUMA',
        },
        especificacaoTecnica: {
          processoCorte: 'LASER_FIBRA',
          materiaPrimaBase: it.composicaoCusto?.detalheMaterial?.tipoMaterial || 'Aço SAE 1020',
          espessuraMm: it.composicaoCusto?.detalheMaterial?.espessuraMm || 4.75,
          pesoUnitarioKg: it.composicaoCusto?.detalheMaterial?.pesoLiquidoKg,
        },
      };
    });

    // 4. Congelar a Versão Comercial Original do Orçamento (Snapshot Imutável)
    const snapshotItens = itensPedido.map((it) => ({
      itemNumero: it.numeroItem,
      codigoItem: it.codigoItem,
      descricao: it.descricao,
      tipoItem: it.tipoItem,
      quantidade: it.quantidade,
      precoUnitario: it.precoUnitario,
      valorTotal: it.valorTotal,
      custoUnitario: it.custoUnitarioEstimado,
      margemPerc: it.margemItemPerc,
    }));

    const rawIntegrityData = JSON.stringify({
      orcamentoId: orc.id,
      valorTotal: orc.precoFinalTotal,
      margem: orc.margemLucroEstimadaPercentual,
      itens: snapshotItens,
    });
    const hashIntegridade = crypto.createHash('sha256').update(rawIntegrityData).digest('hex');

    const versaoComercialCongelada: VersaoComercialCongelada = {
      orcamentoId: orc.id,
      orcamentoNumero: orc.numeroOrcamento,
      versaoNumero: orc.versaoAtual,
      congeladoEm: agora,
      dataAprovacaoOrcamento: orc.updatedAt || agora,
      tabelaPrecoOriginal: 'TAB_PADRAO_2026',
      condicaoPagamentoOriginal: orc.condicaoPagamento || '30/60 DDL',
      margemContribuicaoOriginalPerc: orc.margemLucroEstimadaPercentual,
      custoTotalPrevistoOriginal: orc.custoTotalEstimado,
      valorTotalOriginal: orc.precoFinalTotal,
      impostosTotaisOriginais: orc.impostosEstimadosTotais,
      itensSnapshot: snapshotItens,
      hashIntegridade,
    };

    // 5. Calcular Lead Time Total e Prazo Prometido
    const maxLeadTimeDias = Math.max(...itensPedido.map((it) => it.prazoItemDias), 7);
    const prazoPrometido = orc.prazoEntregaDias
      ? this.calcularDataFuturaDias(agora, orc.prazoEntregaDias)
      : this.calcularDataFuturaDias(agora, 15);

    // 6. Gerar Parcelas Financeiras Iniciais
    const parcelas = this.gerarParcelas(pedidoId, orc.precoFinalTotal, orc.condicaoPagamento || '30/60 DDL', agora);

    // 7. Gerar Cronograma de Entrega Inicial (1 Remessa Integral Inicial)
    const entregas: PedidoEntrega[] = [
      {
        id: `ped-ent-${crypto.randomUUID().slice(0, 8)}`,
        pedidoId,
        numeroRemessa: 1,
        dataPrometidaEntrega: prazoPrometido,
        dataPrevisaoDespacho: this.calcularDataFuturaDias(prazoPrometido, -2),
        itens: itensPedido.map((it) => ({
          pedidoItemId: it.id,
          codigoItem: it.codigoItem,
          descricao: it.descricao,
          quantidadeProgramada: it.quantidade,
          quantidadeExpedida: 0,
          quantidadeEntregue: 0,
          unidadeMedida: it.unidadeMedida,
        })),
        statusEntrega: 'PROGRAMADA',
      },
    ];

    // 8. Validação de Limite de Crédito
    const validacaoCredito = this.validarCreditoCliente(orc.clienteId, empresaId, orc.precoFinalTotal);

    // 9. Validação de Margem Mínima
    const margemMinima = politicaVenda.margemMinimaPermitidaPerc;
    const margemCalculada = orc.margemLucroEstimadaPercentual;
    const diferencaMargem = Number((margemCalculada - margemMinima).toFixed(2));
    const margemAbaixo = margemCalculada < margemMinima;

    const validacaoMargem = {
      statusValidacao: margemAbaixo
        ? ('ABAIXO_MARGEM_MINIMA' as const)
        : ('DENTRO_DA_MARGEM' as const),
      margemCalculadaPerc: margemCalculada,
      margemMinimaRequeridaPerc: margemMinima,
      diferencaPerc: diferencaMargem,
      aprovacaoObrigatoria: margemAbaixo,
      detalhes: margemAbaixo
        ? `Margem de contribuição calculada (${margemCalculada.toFixed(1)}%) é inferior ao piso mínimo da empresa (${margemMinima.toFixed(1)}%). Requer aprovação de Diretoria Comercial.`
        : `Margem de contribuição (${margemCalculada.toFixed(1)}%) aprovada dentro da política da empresa (mínimo ${margemMinima.toFixed(1)}%).`,
    };

    // 10. Definir Aprovações de Alçada Necessárias
    const aprovacoes: PedidoAprovacao[] = [];

    if (validacaoCredito.statusValidacao === 'EXIGE_APROVACAO_ALCADA' || validacaoCredito.possuiBloqueioAtivo) {
      aprovacoes.push({
        id: `ped-apr-${crypto.randomUUID().slice(0, 8)}`,
        pedidoId,
        tipoAprovacao: 'LIMITE_CREDITO',
        motivoExigencia: validacaoCredito.detalhesValidacao,
        nivelAlcadaRequerido: 'GERENTE_FINANCEIRO',
        status: 'PENDENTE',
        solicitadoPor: usuario.nome,
        solicitadoEm: agora,
      });
    }

    if (validacaoMargem.aprovacaoObrigatoria) {
      aprovacoes.push({
        id: `ped-apr-${crypto.randomUUID().slice(0, 8)}`,
        pedidoId,
        tipoAprovacao: 'MARGEM_MINIMA',
        motivoExigencia: validacaoMargem.detalhes,
        nivelAlcadaRequerido: 'DIRETOR_INDUSTRIAL',
        status: 'PENDENTE',
        solicitadoPor: usuario.nome,
        solicitadoEm: agora,
      });
    }

    // 11. Definir Status Inicial com base nas aprovações
    let statusInicial: StatusPedido = 'APROVADO';
    if (aprovacoes.length > 0) {
      statusInicial = 'APROVACAO';
    }

    const logInicial: TransicaoStatusLog = {
      id: `log-${crypto.randomUUID().slice(0, 8)}`,
      pedidoId,
      statusAnterior: 'RASCUNHO',
      novoStatus: statusInicial,
      dataTransicao: agora,
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      motivo: `Pedido gerado a partir da conversão sem redigitação do Orçamento #${orc.numeroOrcamento}.`,
      detalhes: aprovacoes.length > 0 ? `Encaminhado para alçada de aprovação (${aprovacoes.map((a) => a.tipoAprovacao).join(', ')}).` : 'Aprovado diretamente conforme regras de crédito e margem.',
    };

    const valorTotalProdutos = orc.itens.reduce((acc, it) => acc + it.subtotalFinal, 0);

    const pedido: PedidoVenda = {
      id: pedidoId,
      numero: novoNumero,
      empresaId,
      empresaNome: 'Tritech Indústria Metalúrgica Ltda',
      clienteId: orc.clienteId,
      clienteNome: orc.clienteNome,
      clienteCnpjCpf: orc.clienteCnpj || '00.000.000/0001-00',
      origem: 'ORCAMENTO',
      orcamentoOrigemId: orc.id,
      orcamentoNumero: orc.numeroOrcamento,
      orcamentoVersaoId: `v${orc.versaoAtual}`,
      versaoComercialCongelada,
      status: statusInicial,

      valorTotalProdutos,
      valorFrete: orc.valorFrete || 0,
      valorDesconto: orc.valorDescontoTotal || 0,
      valorOutrasDespesas: 0,
      valorIpiTotal: Number((orc.impostosEstimadosTotais * 0.4).toFixed(2)),
      valorIcmsTotal: Number((orc.impostosEstimadosTotais * 0.6).toFixed(2)),
      valorTotalPedido: orc.precoFinalTotal,
      custoTotalEstimado: orc.custoTotalEstimado,
      margemContribuicaoEstimadaPerc: orc.margemLucroEstimadaPercentual,
      margemMinimaEmpresaPerc: margemMinima,

      tipoFrete: (orc.tipoFrete as TipoFrete) || 'FOB',
      prazoPrometido,
      dataEmissao: agora.split('T')[0],
      dataEntregaDesejada: prazoPrometido,
      leadTimeDiasCalculado: maxLeadTimeDias,

      vendedorId: orc.vendedorId || usuario.id,
      vendedorNome: orc.vendedorNome || usuario.nome,
      canalVenda: 'ORÇAMENTO CPQ',
      condicaoPagamento: orc.condicaoPagamento || '30/60 DDL',
      formaPagamento: 'Boleto Bancário',
      tabelaPreco: 'TAB_PADRAO_2026',
      observacoesComerciais: orc.observacoesGerais,
      observacoesProducao: orc.observacoesInternas,

      validacaoCredito,
      validacaoMargem,
      statusEstoque: 'AGUARDANDO_RESERVA',
      statusNecessidades: 'NAO_GERADO',

      itens: itensPedido,
      parcelas,
      entregas,
      aprovacoes,
      historicoTransicoes: [logInicial],

      revisoesCount: 0,
      versaoAtual: 1,
      bloqueadoParaEdicao: true,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    // 12. Se o pedido já nasceu APROVADO, processar imediatamente reservas de estoque e OPs
    if (statusInicial === 'APROVADO') {
      this.processarReservasENecessidadesInterno(pedido);
    }

    // 13. Atualizar status do orçamento original para GANHO se ainda não estava
    try {
      orc.status = 'GANHO';
      orc.updatedAt = agora;
      orcamentoService.registrarEventoNegociacao({
        orcamentoId: orc.id,
        usuarioId: usuario.id,
        usuarioNome: usuario.nome,
        tipoEvento: 'STATUS_ALTERADO',
        descricao: `Convertido no Pedido de Venda #${novoNumero}.`,
      });
    } catch {
      // prosseguir
    }

    this.pedidos.set(pedido.id, pedido);
    return pedido;
  }

  // ---------------------------------------------------------------------------
  // CRIAÇÃO DE PEDIDO DIRETO (SEM ORÇAMENTO PRÉVIO)
  // ---------------------------------------------------------------------------

  public async criarPedidoDireto(dados: {
    empresaId: string;
    empresaNome: string;
    clienteId: string;
    clienteNome: string;
    clienteCnpjCpf: string;
    itens: {
      codigoItem: string;
      descricao: string;
      tipoItem: TipoItemPedido;
      ncm?: string;
      unidadeMedida: string;
      quantidade: number;
      precoUnitario: number;
      descontoPerc?: number;
      custoUnitarioEstimado: number;
      prazoItemDias?: number;
      especificacaoTecnica?: PedidoItem['especificacaoTecnica'];
    }[];
    condicaoPagamento: string;
    formaPagamento: string;
    tipoFrete: TipoFrete;
    prazoPrometido?: string;
    vendedorId: string;
    vendedorNome: string;
    observacoesComerciais?: string;
    observacoesProducao?: string;
  }): Promise<PedidoVenda> {
    const politicaVenda = this.getPoliticaVenda(dados.empresaId);
    const novoNumero = this.gerarProximoNumeroPedido(dados.empresaId);
    const pedidoId = `ped-${crypto.randomUUID().slice(0, 8)}`;
    const agora = new Date().toISOString();

    let valorTotalProdutos = 0;
    let custoTotalEstimado = 0;
    let valorDescontoTotal = 0;

    const itensPedido: PedidoItem[] = dados.itens.map((it, idx) => {
      const precoUnit = it.precoUnitario;
      const qtd = it.quantidade;
      const descPerc = it.descontoPerc || 0;
      const valorDesc = Number(((precoUnit * qtd * descPerc) / 100).toFixed(2));
      const precoLiq = Number((precoUnit * (1 - descPerc / 100)).toFixed(2));
      const valorTot = Number((precoLiq * qtd).toFixed(2));
      const custoTotalItem = Number((it.custoUnitarioEstimado * qtd).toFixed(2));
      const margemItemPerc = valorTot > 0 ? Number((((valorTot - custoTotalItem) / valorTot) * 100).toFixed(2)) : 0;
      const prazoItemDias = it.prazoItemDias || (it.tipoItem === 'PRODUTO_FABRICADO' ? 10 : 3);
      const dataPrometidaItem = this.calcularDataFuturaDias(agora, prazoItemDias);

      valorTotalProdutos += valorTot;
      custoTotalEstimado += custoTotalItem;
      valorDescontoTotal += valorDesc;

      return {
        id: `ped-it-${crypto.randomUUID().slice(0, 8)}`,
        pedidoId,
        numeroItem: idx + 1,
        codigoItem: it.codigoItem,
        descricao: it.descricao,
        tipoItem: it.tipoItem,
        ncm: it.ncm || '7326.90.90',
        unidadeMedida: it.unidadeMedida,
        quantidade: qtd,
        quantidadeEntregue: 0,
        quantidadeFaturada: 0,
        quantidadeReservadaEstoque: 0,
        quantidadePendenteProducao: it.tipoItem === 'PRODUTO_FABRICADO' || it.tipoItem === 'PRODUTO_SERVICO' ? qtd : 0,
        precoUnitario: precoUnit,
        descontoPerc: descPerc,
        valorDesconto: valorDesc,
        precoLiquido: precoLiq,
        valorTotal: valorTot,
        aliquotaIpi: 5,
        valorIpi: Number((valorTot * 0.05).toFixed(2)),
        aliquotaIcms: 18,
        valorIcms: Number((valorTot * 0.18).toFixed(2)),
        custoUnitarioEstimado: it.custoUnitarioEstimado,
        custoTotalEstimado: custoTotalItem,
        margemItemPerc,
        prazoItemDias,
        dataPrometidaItem,
        necessidadeGerada: {
          tipo: 'NENHUMA',
        },
        especificacaoTecnica: it.especificacaoTecnica,
      };
    });

    const valorTotalPedido = Number((valorTotalProdutos * 1.05).toFixed(2)); // com IPI
    const margemGeralPerc = valorTotalProdutos > 0 ? Number((((valorTotalProdutos - custoTotalEstimado) / valorTotalProdutos) * 100).toFixed(2)) : 0;
    const maxLeadTimeDias = Math.max(...itensPedido.map((it) => it.prazoItemDias), 5);
    const prazoFinalPrometido = dados.prazoPrometido || this.calcularDataFuturaDias(agora, maxLeadTimeDias);

    // Validações de Crédito e Margem
    const validacaoCredito = this.validarCreditoCliente(dados.clienteId, dados.empresaId, valorTotalPedido);
    const margemMinima = politicaVenda.margemMinimaPermitidaPerc;
    const margemAbaixo = margemGeralPerc < margemMinima;

    const validacaoMargem = {
      statusValidacao: margemAbaixo
        ? ('ABAIXO_MARGEM_MINIMA' as const)
        : ('DENTRO_DA_MARGEM' as const),
      margemCalculadaPerc: margemGeralPerc,
      margemMinimaRequeridaPerc: margemMinima,
      diferencaPerc: Number((margemGeralPerc - margemMinima).toFixed(2)),
      aprovacaoObrigatoria: margemAbaixo,
      detalhes: margemAbaixo
        ? `Margem calculada (${margemGeralPerc.toFixed(1)}%) abaixo do limite mínimo da empresa (${margemMinima.toFixed(1)}%). Requer aprovação de Diretoria.`
        : `Margem calculada (${margemGeralPerc.toFixed(1)}%) aprovada dentro do padrão.`,
    };

    const parcelas = this.gerarParcelas(pedidoId, valorTotalPedido, dados.condicaoPagamento, agora);

    const entregas: PedidoEntrega[] = [
      {
        id: `ped-ent-${crypto.randomUUID().slice(0, 8)}`,
        pedidoId,
        numeroRemessa: 1,
        dataPrometidaEntrega: prazoFinalPrometido,
        dataPrevisaoDespacho: this.calcularDataFuturaDias(prazoFinalPrometido, -2),
        itens: itensPedido.map((it) => ({
          pedidoItemId: it.id,
          codigoItem: it.codigoItem,
          descricao: it.descricao,
          quantidadeProgramada: it.quantidade,
          quantidadeExpedida: 0,
          quantidadeEntregue: 0,
          unidadeMedida: it.unidadeMedida,
        })),
        statusEntrega: 'PROGRAMADA',
      },
    ];

    const aprovacoes: PedidoAprovacao[] = [];

    if (validacaoCredito.statusValidacao === 'EXIGE_APROVACAO_ALCADA' || validacaoCredito.possuiBloqueioAtivo) {
      aprovacoes.push({
        id: `ped-apr-${crypto.randomUUID().slice(0, 8)}`,
        pedidoId,
        tipoAprovacao: 'LIMITE_CREDITO',
        motivoExigencia: validacaoCredito.detalhesValidacao,
        nivelAlcadaRequerido: 'GERENTE_FINANCEIRO',
        status: 'PENDENTE',
        solicitadoPor: dados.vendedorNome,
        solicitadoEm: agora,
      });
    }

    if (validacaoMargem.aprovacaoObrigatoria) {
      aprovacoes.push({
        id: `ped-apr-${crypto.randomUUID().slice(0, 8)}`,
        pedidoId,
        tipoAprovacao: 'MARGEM_MINIMA',
        motivoExigencia: validacaoMargem.detalhes,
        nivelAlcadaRequerido: 'DIRETOR_INDUSTRIAL',
        status: 'PENDENTE',
        solicitadoPor: dados.vendedorNome,
        solicitadoEm: agora,
      });
    }

    let statusInicial: StatusPedido = 'PENDENTE';
    if (aprovacoes.length > 0) {
      statusInicial = 'APROVACAO';
    }

    const logInicial: TransicaoStatusLog = {
      id: `log-${crypto.randomUUID().slice(0, 8)}`,
      pedidoId,
      statusAnterior: 'RASCUNHO',
      novoStatus: statusInicial,
      dataTransicao: agora,
      usuarioId: dados.vendedorId,
      usuarioNome: dados.vendedorNome,
      motivo: 'Criação de Pedido Direto de Venda.',
      detalhes: `Pedido direto criado com ${itensPedido.length} itens.`,
    };

    const pedido: PedidoVenda = {
      id: pedidoId,
      numero: novoNumero,
      empresaId: dados.empresaId,
      empresaNome: dados.empresaNome,
      clienteId: dados.clienteId,
      clienteNome: dados.clienteNome,
      clienteCnpjCpf: dados.clienteCnpjCpf,
      origem: 'DIRETO',
      status: statusInicial,

      valorTotalProdutos,
      valorFrete: 0,
      valorDesconto: valorDescontoTotal,
      valorOutrasDespesas: 0,
      valorIpiTotal: Number((valorTotalProdutos * 0.05).toFixed(2)),
      valorIcmsTotal: Number((valorTotalProdutos * 0.18).toFixed(2)),
      valorTotalPedido,
      custoTotalEstimado,
      margemContribuicaoEstimadaPerc: margemGeralPerc,
      margemMinimaEmpresaPerc: margemMinima,

      tipoFrete: dados.tipoFrete,
      prazoPrometido: prazoFinalPrometido,
      dataEmissao: agora.split('T')[0],
      dataEntregaDesejada: prazoFinalPrometido,
      leadTimeDiasCalculado: maxLeadTimeDias,

      vendedorId: dados.vendedorId,
      vendedorNome: dados.vendedorNome,
      canalVenda: 'VENDA DIRETA',
      condicaoPagamento: dados.condicaoPagamento,
      formaPagamento: dados.formaPagamento,
      tabelaPreco: 'TAB_PADRAO_DIRETA',
      observacoesComerciais: dados.observacoesComerciais,
      observacoesProducao: dados.observacoesProducao,

      validacaoCredito,
      validacaoMargem,
      statusEstoque: 'AGUARDANDO_RESERVA',
      statusNecessidades: 'NAO_GERADO',

      itens: itensPedido,
      parcelas,
      entregas,
      aprovacoes,
      historicoTransicoes: [logInicial],

      revisoesCount: 0,
      versaoAtual: 1,
      bloqueadoParaEdicao: false,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    this.pedidos.set(pedido.id, pedido);
    return pedido;
  }

  // ---------------------------------------------------------------------------
  // DECISÃO DE ALÇADA DE APROVAÇÃO (CRÉDITO, MARGEM, MUDANÇA CRÍTICA)
  // ---------------------------------------------------------------------------

  public decidirAprovacao(
    pedidoId: string,
    aprovacaoId: string,
    decisao: {
      aprovado: boolean;
      parecer: string;
      aprovadorNome: string;
      cargoAprovador: string;
      usuarioId: string;
    }
  ): PedidoVenda {
    const pedido = this.pedidos.get(pedidoId);
    if (!pedido) {
      throw new Error(`Pedido #${pedidoId} não encontrado.`);
    }

    const aprovacao = pedido.aprovacoes.find((a) => a.id === aprovacaoId);
    if (!aprovacao) {
      throw new Error(`Aprovação #${aprovacaoId} não encontrada no pedido.`);
    }

    const agora = new Date().toISOString();
    aprovacao.status = decisao.aprovado ? 'APROVADO' : 'REJEITADO';
    aprovacao.aprovadoPor = decisao.aprovadorNome;
    aprovacao.cargoAprovador = decisao.cargoAprovador;
    aprovacao.aprovadoEm = agora;
    aprovacao.parecerAprovador = decisao.parecer;

    // Se foi aprovada, verificar se ainda restam outras aprovações pendentes
    if (decisao.aprovado) {
      const restamPendentes = pedido.aprovacoes.some((a) => a.status === 'PENDENTE');
      if (!restamPendentes) {
        // Todas as alçadas foram atendidas! Avançar pedido para APROVADO
        const statusAnterior = pedido.status;
        pedido.status = 'APROVADO';
        pedido.bloqueadoParaEdicao = true;
        pedido.atualizadoEm = agora;

        this.processarReservasENecessidadesInterno(pedido);

        pedido.historicoTransicoes.push({
          id: `log-${crypto.randomUUID().slice(0, 8)}`,
          pedidoId,
          statusAnterior,
          novoStatus: 'APROVADO',
          dataTransicao: agora,
          usuarioId: decisao.usuarioId,
          usuarioNome: decisao.aprovadorNome,
          motivo: `Alçada '${aprovacao.tipoAprovacao}' aprovada por ${decisao.aprovadorNome} (${decisao.cargoAprovador}). Todas aprovações concluídas.`,
          detalhes: decisao.parecer,
        });
      } else {
        pedido.historicoTransicoes.push({
          id: `log-${crypto.randomUUID().slice(0, 8)}`,
          pedidoId,
          statusAnterior: pedido.status,
          novoStatus: pedido.status,
          dataTransicao: agora,
          usuarioId: decisao.usuarioId,
          usuarioNome: decisao.aprovadorNome,
          motivo: `Alçada '${aprovacao.tipoAprovacao}' aprovada. Restam outras aprovações pendentes.`,
          detalhes: decisao.parecer,
        });
      }
    } else {
      // Rejeitada: retornar para RASCUNHO ou manter bloqueado
      const statusAnterior = pedido.status;
      pedido.status = 'RASCUNHO';
      pedido.bloqueadoParaEdicao = false;
      pedido.atualizadoEm = agora;

      pedido.historicoTransicoes.push({
        id: `log-${crypto.randomUUID().slice(0, 8)}`,
        pedidoId,
        statusAnterior,
        novoStatus: 'RASCUNHO',
        dataTransicao: agora,
        usuarioId: decisao.usuarioId,
        usuarioNome: decisao.aprovadorNome,
        motivo: `Aprovação de alçada '${aprovacao.tipoAprovacao}' REJEITADA por ${decisao.aprovadorNome}. Pedido retornado para rascunho/revisão.`,
        detalhes: decisao.parecer,
      });
    }

    return pedido;
  }

  // ---------------------------------------------------------------------------
  // RESERVA DE ESTOQUE E GERAÇÃO DE NECESSIDADES (OP / SC)
  // ---------------------------------------------------------------------------

  public processarReservasENecessidades(pedidoId: string): PedidoVenda {
    const pedido = this.pedidos.get(pedidoId);
    if (!pedido) throw new Error(`Pedido #${pedidoId} não encontrado.`);
    this.processarReservasENecessidadesInterno(pedido);
    return pedido;
  }

  private processarReservasENecessidadesInterno(pedido: PedidoVenda): void {
    const agora = new Date().toISOString();
    let totalReservado = 0;
    let totalOpGerada = 0;

    pedido.itens.forEach((it, idx) => {
      if (it.tipoItem === 'PRODUTO_PRONTO') {
        // Reservar do estoque
        it.quantidadeReservadaEstoque = it.quantidade;
        it.necessidadeGerada = {
          tipo: 'RESERVA_ESTOQUE',
          documentoReferenciaId: `RES-${pedido.numero}-${it.numeroItem}`,
          statusDocumento: 'ALOCADO',
          geradoEm: agora,
        };
        totalReservado++;
      } else if (it.tipoItem === 'PRODUTO_FABRICADO' || it.tipoItem === 'PRODUTO_SERVICO') {
        // Gerar Ordem de Produção (OP)
        const numeroOp = `OP-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
        it.quantidadePendenteProducao = it.quantidade;
        it.necessidadeGerada = {
          tipo: 'ORDEM_PRODUCAO',
          documentoReferenciaId: numeroOp,
          numeroOp,
          statusDocumento: 'PLANEJADA',
          geradoEm: agora,
        };
        totalOpGerada++;
      }
    });

    pedido.statusEstoque = totalReservado === pedido.itens.length ? 'TOTALMENTE_RESERVADO' : totalReservado > 0 ? 'PARCIALMENTE_RESERVADO' : 'NAO_APLICAVEL';
    pedido.statusNecessidades = totalOpGerada > 0 ? 'NECESSIDADES_GERADAS' : 'NAO_GERADO';
    pedido.atualizadoEm = agora;
  }

  // ---------------------------------------------------------------------------
  // TRANSIÇÃO DE STATUS DA MÁQUINA DE ESTADOS
  // ---------------------------------------------------------------------------

  public transicionarStatus(
    pedidoId: string,
    novoStatus: StatusPedido,
    contexto: {
      motivo?: string;
      usuarioId: string;
      usuarioNome: string;
      codigoRastreio?: string;
      notaFiscalNumero?: string;
      remessaNumero?: number;
    }
  ): PedidoVenda {
    const pedido = this.pedidos.get(pedidoId);
    if (!pedido) throw new Error(`Pedido #${pedidoId} não encontrado.`);

    // Validar máquina de estados
    const validacao = PedidoStateMachine.validarTransicao(pedido, novoStatus);
    if (!validacao.valido) {
      throw new Error(validacao.motivo || `Transição de ${pedido.status} para ${novoStatus} não é permitida.`);
    }

    const statusAnterior = pedido.status;
    const agora = new Date().toISOString();

    pedido.status = novoStatus;
    pedido.atualizadoEm = agora;

    // Efeitos Colaterais Conforme o Novo Status
    if (novoStatus === 'APROVADO') {
      pedido.bloqueadoParaEdicao = true;
      this.processarReservasENecessidadesInterno(pedido);
    } else if (novoStatus === 'EM_EXECUCAO') {
      pedido.statusNecessidades = 'ORDENS_EM_ANDAMENTO';
      pedido.itens.forEach((it) => {
        if (it.necessidadeGerada.tipo === 'ORDEM_PRODUCAO') {
          it.necessidadeGerada.statusDocumento = 'EM_PROCESSO';
        }
      });
    } else if (novoStatus === 'PRONTO') {
      pedido.statusNecessidades = 'ORDENS_CONCLUIDAS';
      pedido.itens.forEach((it) => {
        if (it.necessidadeGerada.tipo === 'ORDEM_PRODUCAO') {
          it.necessidadeGerada.statusDocumento = 'FINALIZADA';
        }
      });
    } else if (novoStatus === 'EXPEDIDO') {
      // Atualizar remessas
      pedido.entregas.forEach((ent) => {
        if (ent.statusEntrega === 'PROGRAMADA' || ent.statusEntrega === 'PRONTA_EXPEDICAO') {
          ent.statusEntrega = 'EXPEDIDA';
          ent.codigoRastreio = contexto.codigoRastreio || ent.codigoRastreio || `BR-${Math.floor(100000000 + Math.random() * 900000000)}BR`;
          ent.dataEfetivaEntrega = agora.split('T')[0];
        }
      });
      pedido.itens.forEach((it) => {
        it.quantidadeEntregue = it.quantidade;
      });
    } else if (novoStatus === 'FATURADO') {
      const nf = contexto.notaFiscalNumero || `NF-e ${Math.floor(40000 + Math.random() * 50000)}`;
      pedido.parcelas.forEach((parc) => {
        if (parc.status === 'PENDENTE') {
          parc.status = 'FATURADO';
          parc.tituloReceberId = `TIT-${Math.floor(10000 + Math.random() * 90000)}`;
        }
      });
      pedido.entregas.forEach((ent) => {
        ent.notaFiscalNumero = nf;
      });
      pedido.itens.forEach((it) => {
        it.quantidadeFaturada = it.quantidade;
      });
    } else if (novoStatus === 'CONCLUIDO') {
      pedido.dataEfetivaConclusao = agora.split('T')[0];
      pedido.bloqueadoParaEdicao = true;
    } else if (novoStatus === 'CANCELADO') {
      // Estorno de reservas e cancelamento de OPs e parcelas
      pedido.bloqueadoParaEdicao = true;
      pedido.itens.forEach((it) => {
        it.quantidadeReservadaEstoque = 0;
        if (it.necessidadeGerada.tipo === 'ORDEM_PRODUCAO') {
          it.necessidadeGerada.statusDocumento = 'CANCELADA';
        }
      });
      pedido.parcelas.forEach((p) => {
        p.status = 'CANCELADO';
      });
      pedido.entregas.forEach((e) => {
        e.statusEntrega = 'CANCELADA';
      });
    }

    // Registrar log auditável
    pedido.historicoTransicoes.push({
      id: `log-${crypto.randomUUID().slice(0, 8)}`,
      pedidoId,
      statusAnterior,
      novoStatus,
      dataTransicao: agora,
      usuarioId: contexto.usuarioId,
      usuarioNome: contexto.usuarioNome,
      motivo: contexto.motivo || `Transição de status executada por ${contexto.usuarioNome}.`,
      detalhes: validacao.efeitosColaterais?.join(' ') || undefined,
    });

    return pedido;
  }

  // ---------------------------------------------------------------------------
  // MUDANÇAS CRÍTICAS EM PEDIDOS APROVADOS (REABERTURA E REAPROVAÇÃO)
  // ---------------------------------------------------------------------------

  public aplicarAlteracaoCritica(
    pedidoId: string,
    alteracoes: {
      valorTotalPedido?: number;
      prazoPrometido?: string;
      condicaoPagamento?: string;
      margemContribuicaoEstimadaPerc?: number;
      itens?: PedidoItem[];
      motivoAlteracao: string;
    },
    usuario: { id: string; nome: string; cargo: string }
  ): { pedido: PedidoVenda; analise: AnaliseMudancaCritica } {
    const pedido = this.pedidos.get(pedidoId);
    if (!pedido) throw new Error(`Pedido #${pedidoId} não encontrado.`);

    const politica = this.getPoliticaVenda(pedido.empresaId);
    const analise = PedidoStateMachine.avaliarMudancaCritica(
      pedido,
      alteracoes,
      politica.toleranciaVariacaoReaberturaPerc,
      politica.toleranciaVariacaoReaberturaValor
    );

    const agora = new Date().toISOString();

    if (analise.isCritica) {
      // Reabrir o pedido: incrementa versão e reenvia para APROVAÇÃO
      const statusAnterior = pedido.status;
      pedido.status = 'APROVACAO';
      pedido.versaoAtual += 1;
      pedido.revisoesCount += 1;
      pedido.bloqueadoParaEdicao = false;

      if (alteracoes.valorTotalPedido !== undefined) pedido.valorTotalPedido = alteracoes.valorTotalPedido;
      if (alteracoes.prazoPrometido !== undefined) pedido.prazoPrometido = alteracoes.prazoPrometido;
      if (alteracoes.condicaoPagamento !== undefined) pedido.condicaoPagamento = alteracoes.condicaoPagamento;
      if (alteracoes.margemContribuicaoEstimadaPerc !== undefined) pedido.margemContribuicaoEstimadaPerc = alteracoes.margemContribuicaoEstimadaPerc;
      if (alteracoes.itens) pedido.itens = alteracoes.itens;

      // Adicionar exigência de aprovação de reabertura crítica
      const novaAprovacao: PedidoAprovacao = {
        id: `ped-apr-${crypto.randomUUID().slice(0, 8)}`,
        pedidoId,
        tipoAprovacao: 'MUDANCA_CRITICA_REABERTURA',
        motivoExigencia: `Mudança crítica detectada (Revisão v${pedido.versaoAtual}): ${analise.motivos.join(' | ')}. Motivo informado: ${alteracoes.motivoAlteracao}`,
        nivelAlcadaRequerido: 'DIRETOR_INDUSTRIAL',
        status: 'PENDENTE',
        solicitadoPor: usuario.nome,
        solicitadoEm: agora,
      };

      pedido.aprovacoes.push(novaAprovacao);

      pedido.historicoTransicoes.push({
        id: `log-${crypto.randomUUID().slice(0, 8)}`,
        pedidoId,
        statusAnterior,
        novoStatus: 'APROVACAO',
        dataTransicao: agora,
        usuarioId: usuario.id,
        usuarioNome: usuario.nome,
        motivo: `MUDANÇA CRÍTICA DETECTADA: Pedido reaberto para revisão v${pedido.versaoAtual} e submetido para re-aprovação de alçada.`,
        detalhes: analise.motivos.join(' | '),
      });
    } else {
      // Alteração não crítica (apenas atualiza valores permitidos)
      if (alteracoes.prazoPrometido !== undefined) pedido.prazoPrometido = alteracoes.prazoPrometido;
      if (alteracoes.condicaoPagamento !== undefined) pedido.condicaoPagamento = alteracoes.condicaoPagamento;

      pedido.historicoTransicoes.push({
        id: `log-${crypto.randomUUID().slice(0, 8)}`,
        pedidoId,
        statusAnterior: pedido.status,
        novoStatus: pedido.status,
        dataTransicao: agora,
        usuarioId: usuario.id,
        usuarioNome: usuario.nome,
        motivo: 'Alteração não-crítica realizada dentro dos limites de tolerância.',
        detalhes: alteracoes.motivoAlteracao,
      });
    }

    pedido.atualizadoEm = agora;
    return { pedido, analise };
  }

  // ---------------------------------------------------------------------------
  // HELPERS INTERNOS DE CRÉDITO, PARCELAS E NÚMEROS
  // ---------------------------------------------------------------------------

  private validarCreditoCliente(clienteId: string, empresaId: string, valorPedido: number) {
    const agora = new Date().toISOString();
    const limite = creditoService.getLimitePorClienteId(clienteId);
    const bloqueios = creditoService.getBloqueios(empresaId).filter((b) => b.clienteId === clienteId && b.ativo);

    const possuiBloqueioAtivo = bloqueios.length > 0;
    const motivoBloqueio = possuiBloqueioAtivo ? (bloqueios[0].detalhesMotivo || bloqueios[0].motivo) : undefined;

    const limiteEmpresa = limite?.limitesPorEmpresa.find((e) => e.empresaId === empresaId);
    const limiteConcedidoEmpresa = limiteEmpresa?.limiteConcedido || 0;
    const exposicaoAtualEmpresa = limiteEmpresa?.exposicaoAtual || 0;
    const disponivelEmpresa = Math.max(0, limiteConcedidoEmpresa - exposicaoAtualEmpresa);

    const limiteGrupo = limite?.limiteConsolidadoGrupo || 0;
    const exposicaoAtualGrupo = limite?.exposicaoConsolidadaAtual || 0;
    const disponivelGrupo = Math.max(0, limiteGrupo - exposicaoAtualGrupo);

    const excedeEmpresa = valorPedido > disponivelEmpresa;
    const excedeGrupo = valorPedido > disponivelGrupo;

    let statusValidacao: 'APROVADO' | 'REPROVADO' | 'EXIGE_APROVACAO_ALCADA' | 'ISENTO' = 'APROVADO';
    let detalhes = `Limite de crédito aprovado. Limite disponível empresa: R$ ${disponivelEmpresa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;

    if (possuiBloqueioAtivo) {
      statusValidacao = 'EXIGE_APROVACAO_ALCADA';
      detalhes = `Cliente com BLOQUEIO DE CRÉDITO ATIVO (${motivoBloqueio || 'Inadimplência'}). Faturamento travado - exige liberação formal de alçada financeira.`;
    } else if (excedeEmpresa || excedeGrupo) {
      statusValidacao = 'EXIGE_APROVACAO_ALCADA';
      detalhes = `Valor do pedido (R$ ${valorPedido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) excede o saldo de crédito disponível (Empresa: R$ ${disponivelEmpresa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, Grupo: R$ ${disponivelGrupo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). Exige aprovação de alçada de crédito.`;
    }

    return {
      statusValidacao,
      limiteEmpresaDisponivel: disponivelEmpresa,
      limiteGrupoDisponivel: disponivelGrupo,
      exposicaoProjetadaEmpresa: exposicaoAtualEmpresa + valorPedido,
      exposicaoProjetadaGrupo: exposicaoAtualGrupo + valorPedido,
      possuiBloqueioAtivo,
      motivoBloqueio,
      dataValidacao: agora,
      detalhesValidacao: detalhes,
    };
  }

  private gerarParcelas(pedidoId: string, valorTotal: number, condicao: string, dataBase: string): PedidoParcela[] {
    const parcelas: PedidoParcela[] = [];

    // Ex: "30/60 DDL" ou "30/60/90 DDL" ou "À Vista" ou "Sinal 30% + 30 DDL"
    if (condicao.toLowerCase().includes('vista') || condicao.toLowerCase().includes('antecipado')) {
      parcelas.push({
        id: `parc-${crypto.randomUUID().slice(0, 8)}`,
        pedidoId,
        numeroParcela: 1,
        totalParcelas: 1,
        diasVencimento: 0,
        dataVencimento: dataBase.split('T')[0],
        percentualParcela: 100,
        valorParcela: valorTotal,
        formaPagamento: 'PIX / Transferência',
        status: 'PENDENTE',
      });
      return parcelas;
    }

    const prazosMatch = condicao.match(/\d+/g);
    const dias = prazosMatch && prazosMatch.length > 0 ? prazosMatch.map(Number) : [30, 60];
    const totalParcs = dias.length;
    const percIndividual = Number((100 / totalParcs).toFixed(2));
    const valorIndividual = Number((valorTotal / totalParcs).toFixed(2));

    dias.forEach((dia, idx) => {
      const isUltima = idx === totalParcs - 1;
      const valor = isUltima ? Number((valorTotal - valorIndividual * (totalParcs - 1)).toFixed(2)) : valorIndividual;

      parcelas.push({
        id: `parc-${crypto.randomUUID().slice(0, 8)}`,
        pedidoId,
        numeroParcela: idx + 1,
        totalParcelas: totalParcs,
        diasVencimento: dia,
        dataVencimento: this.calcularDataFuturaDias(dataBase, dia),
        percentualParcela: isUltima ? Number((100 - percIndividual * (totalParcs - 1)).toFixed(2)) : percIndividual,
        valorParcela: valor,
        formaPagamento: 'Boleto Bancário',
        status: 'PENDENTE',
      });
    });

    return parcelas;
  }

  private calcularDataFuturaDias(dataIso: string, dias: number): string {
    const d = new Date(dataIso);
    d.setDate(d.getDate() + dias);
    return d.toISOString().split('T')[0];
  }

  private gerarProximoNumeroPedido(empresaId: string): string {
    const ano = new Date().getFullYear();
    const count = this.pedidos.size + 1;
    return `PED-${ano}-${String(count).padStart(4, '0')}`;
  }

  // ---------------------------------------------------------------------------
  // SEED DE DADOS DEMO REALISTAS DO SETOR INDUSTRIAL
  // ---------------------------------------------------------------------------

  private seedInitialData() {
    const dataRef = '2026-08-20T10:00:00Z';

    // 1. Pedido 1: Convertido de Orçamento Marcopolo (Laser + Dobra de Longarinas) - EM_EXECUCAO
    const ped1Id = 'ped-001';
    const ped1Itens: PedidoItem[] = [
      {
        id: 'it-001',
        pedidoId: ped1Id,
        numeroItem: 1,
        codigoItem: 'LONG-750-X',
        descricao: 'Longarina Estrutural Dobrada Aço SAC-350 4.75mm x 3200mm',
        tipoItem: 'PRODUTO_FABRICADO',
        ncm: '7308.90.10',
        unidadeMedida: 'PC',
        quantidade: 120,
        quantidadeEntregue: 0,
        quantidadeFaturada: 0,
        quantidadeReservadaEstoque: 0,
        quantidadePendenteProducao: 120,
        precoUnitario: 485.0,
        descontoPerc: 2.0,
        valorDesconto: 1164.0,
        precoLiquido: 475.3,
        valorTotal: 57036.0,
        aliquotaIpi: 5.0,
        valorIpi: 2851.8,
        aliquotaIcms: 18.0,
        valorIcms: 10266.48,
        custoUnitarioEstimado: 345.2,
        custoTotalEstimado: 41424.0,
        margemItemPerc: 27.4,
        prazoItemDias: 12,
        dataPrometidaItem: '2026-09-02',
        necessidadeGerada: {
          tipo: 'ORDEM_PRODUCAO',
          documentoReferenciaId: 'OP-2026-0841',
          numeroOp: 'OP-2026-0841',
          statusDocumento: 'EM_PROCESSO',
          geradoEm: '2026-08-20T10:05:00Z',
        },
        especificacaoTecnica: {
          processoCorte: 'LASER_FIBRA',
          processoDobra: 'CNC_SINCRONIZADA',
          processoPintura: 'PRIMER_ANTICORROSIVO',
          materiaPrimaBase: 'Chapa Aço SAC-350 4.75mm',
          espessuraMm: 4.75,
          pesoUnitarioKg: 38.5,
        },
      },
      {
        id: 'it-002',
        pedidoId: ped1Id,
        numeroItem: 2,
        codigoItem: 'SUP-SUSP-02',
        descricao: 'Suporte de Suspensão Reforçado Soldado MIG',
        tipoItem: 'PRODUTO_FABRICADO',
        ncm: '8708.80.00',
        unidadeMedida: 'UN',
        quantidade: 240,
        quantidadeEntregue: 0,
        quantidadeFaturada: 0,
        quantidadeReservadaEstoque: 0,
        quantidadePendenteProducao: 240,
        precoUnitario: 135.0,
        descontoPerc: 0,
        valorDesconto: 0,
        precoLiquido: 135.0,
        valorTotal: 32400.0,
        aliquotaIpi: 5.0,
        valorIpi: 1620.0,
        aliquotaIcms: 18.0,
        valorIcms: 5832.0,
        custoUnitarioEstimado: 94.0,
        custoTotalEstimado: 22560.0,
        margemItemPerc: 30.4,
        prazoItemDias: 14,
        dataPrometidaItem: '2026-09-05',
        necessidadeGerada: {
          tipo: 'ORDEM_PRODUCAO',
          documentoReferenciaId: 'OP-2026-0842',
          numeroOp: 'OP-2026-0842',
          statusDocumento: 'PLANEJADA',
          geradoEm: '2026-08-20T10:05:00Z',
        },
        especificacaoTecnica: {
          processoCorte: 'LASER_FIBRA',
          processoDobra: 'CNC_SINCRONIZADA',
          processoSolda: 'MIG_MAG',
          materiaPrimaBase: 'Chapa Aço SAE 1020 6.35mm',
          espessuraMm: 6.35,
          pesoUnitarioKg: 12.2,
        },
      },
    ];

    const ped1: PedidoVenda = {
      id: ped1Id,
      numero: 'PED-2026-0001',
      empresaId: 'emp-tritech-corte',
      empresaNome: 'Tritech Indústria Metalúrgica Ltda',
      clienteId: 'cli-01',
      clienteNome: 'Marcopolo S.A. Carrocerias',
      clienteCnpjCpf: '88.611.838/0001-30',
      origem: 'ORCAMENTO',
      orcamentoOrigemId: 'orc-01',
      orcamentoNumero: 'ORC-2026-0042',
      orcamentoVersaoId: 'v1',
      versaoComercialCongelada: {
        orcamentoId: 'orc-01',
        orcamentoNumero: 'ORC-2026-0042',
        versaoNumero: 1,
        congeladoEm: '2026-08-20T10:00:00Z',
        dataAprovacaoOrcamento: '2026-08-20T09:30:00Z',
        tabelaPrecoOriginal: 'TAB_MONTADORAS_2026',
        condicaoPagamentoOriginal: '30/60 DDL',
        margemContribuicaoOriginalPerc: 28.5,
        custoTotalPrevistoOriginal: 63984.0,
        valorTotalOriginal: 93907.8,
        impostosTotaisOriginais: 20569.28,
        itensSnapshot: [
          {
            itemNumero: 1,
            codigoItem: 'LONG-750-X',
            descricao: 'Longarina Estrutural Dobrada Aço SAC-350 4.75mm x 3200mm',
            tipoItem: 'PRODUTO_FABRICADO',
            quantidade: 120,
            precoUnitario: 485.0,
            valorTotal: 57036.0,
            custoUnitario: 345.2,
            margemPerc: 27.4,
          },
          {
            itemNumero: 2,
            codigoItem: 'SUP-SUSP-02',
            descricao: 'Suporte de Suspensão Reforçado Soldado MIG',
            tipoItem: 'PRODUTO_FABRICADO',
            quantidade: 240,
            precoUnitario: 135.0,
            valorTotal: 32400.0,
            custoUnitario: 94.0,
            margemPerc: 30.4,
          },
        ],
        hashIntegridade: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
      status: 'EM_EXECUCAO',

      valorTotalProdutos: 89436.0,
      valorFrete: 0,
      valorDesconto: 1164.0,
      valorOutrasDespesas: 0,
      valorIpiTotal: 4471.8,
      valorIcmsTotal: 16098.48,
      valorTotalPedido: 93907.8,
      custoTotalEstimado: 63984.0,
      margemContribuicaoEstimadaPerc: 28.5,
      margemMinimaEmpresaPerc: 16.0,

      tipoFrete: 'CIF',
      transportadoraNome: 'Expresso São Miguel',
      prazoPrometido: '2026-09-05',
      dataEmissao: '2026-08-20',
      dataEntregaDesejada: '2026-09-05',
      leadTimeDiasCalculado: 14,

      vendedorId: 'usr-vend-01',
      vendedorNome: 'Marcos Vinicius Rezende',
      canalVenda: 'ORÇAMENTO CPQ',
      condicaoPagamento: '30/60 DDL',
      formaPagamento: 'Boleto Bancário',
      tabelaPreco: 'TAB_MONTADORAS_2026',
      observacoesComerciais: 'Pedido faturado conforme contrato guarda-chuva de fornecimento anual.',
      observacoesProducao: 'Inspeção dimensional rigorosa nas dobras conforme cota de controle crítico do desenho CAD.',

      validacaoCredito: {
        statusValidacao: 'APROVADO',
        limiteEmpresaDisponivel: 180000.0,
        limiteGrupoDisponivel: 450000.0,
        exposicaoProjetadaEmpresa: 93907.8,
        exposicaoProjetadaGrupo: 93907.8,
        possuiBloqueioAtivo: false,
        dataValidacao: dataRef,
        detalhesValidacao: 'Limite de crédito aprovado dentro do teto concedido.',
      },
      validacaoMargem: {
        statusValidacao: 'DENTRO_DA_MARGEM',
        margemCalculadaPerc: 28.5,
        margemMinimaRequeridaPerc: 16.0,
        diferencaPerc: 12.5,
        aprovacaoObrigatoria: false,
        detalhes: 'Margem aprovada (28.5% vs 16.0% piso mínimo).',
      },
      statusEstoque: 'NAO_APLICAVEL',
      statusNecessidades: 'ORDENS_EM_ANDAMENTO',

      itens: ped1Itens,
      parcelas: [
        {
          id: 'p1-parc-1',
          pedidoId: ped1Id,
          numeroParcela: 1,
          totalParcelas: 2,
          diasVencimento: 30,
          dataVencimento: '2026-09-19',
          percentualParcela: 50.0,
          valorParcela: 46953.9,
          formaPagamento: 'Boleto Bancário',
          status: 'PENDENTE',
        },
        {
          id: 'p1-parc-2',
          pedidoId: ped1Id,
          numeroParcela: 2,
          totalParcelas: 2,
          diasVencimento: 60,
          dataVencimento: '2026-10-19',
          percentualParcela: 50.0,
          valorParcela: 46953.9,
          formaPagamento: 'Boleto Bancário',
          status: 'PENDENTE',
        },
      ],
      entregas: [
        {
          id: 'p1-ent-1',
          pedidoId: ped1Id,
          numeroRemessa: 1,
          dataPrometidaEntrega: '2026-09-05',
          dataPrevisaoDespacho: '2026-09-03',
          itens: [
            {
              pedidoItemId: 'it-001',
              codigoItem: 'LONG-750-X',
              descricao: 'Longarina Estrutural Dobrada Aço SAC-350 4.75mm x 3200mm',
              quantidadeProgramada: 120,
              quantidadeExpedida: 0,
              quantidadeEntregue: 0,
              unidadeMedida: 'PC',
            },
            {
              pedidoItemId: 'it-002',
              codigoItem: 'SUP-SUSP-02',
              descricao: 'Suporte de Suspensão Reforçado Soldado MIG',
              quantidadeProgramada: 240,
              quantidadeExpedida: 0,
              quantidadeEntregue: 0,
              unidadeMedida: 'UN',
            },
          ],
          statusEntrega: 'PROGRAMADA',
        },
      ],
      aprovacoes: [],
      historicoTransicoes: [
        {
          id: 'log-p1-1',
          pedidoId: ped1Id,
          statusAnterior: 'RASCUNHO',
          novoStatus: 'APROVADO',
          dataTransicao: '2026-08-20T10:00:00Z',
          usuarioId: 'usr-vend-01',
          usuarioNome: 'Marcos Vinicius Rezende',
          motivo: 'Conversão automática do Orçamento #ORC-2026-0042 aprovado pelo cliente.',
          detalhes: 'Geração imediata de OPs industriais.',
        },
        {
          id: 'log-p1-2',
          pedidoId: ped1Id,
          statusAnterior: 'APROVADO',
          novoStatus: 'EM_EXECUCAO',
          dataTransicao: '2026-08-21T08:30:00Z',
          usuarioId: 'usr-pcp-01',
          usuarioNome: 'Carlos Eduardo Silveira (PCP)',
          motivo: 'Ordens de Produção liberadas para corte a laser na Máquina Trumpf Laser 10kW.',
        },
      ],

      revisoesCount: 0,
      versaoAtual: 1,
      bloqueadoParaEdicao: true,
      criadoEm: '2026-08-20T10:00:00Z',
      atualizadoEm: '2026-08-21T08:30:00Z',
    };

    this.pedidos.set(ped1.id, ped1);

    // 2. Pedido 2: Convertido de Orçamento com Trava de Limite de Crédito (APROVACAO)
    const ped2Id = 'ped-002';
    const ped2: PedidoVenda = {
      id: ped2Id,
      numero: 'PED-2026-0002',
      empresaId: 'emp-tritech-corte',
      empresaNome: 'Tritech Indústria Metalúrgica Ltda',
      clienteId: 'cli-02',
      clienteNome: 'Randon Implementos Rodoviários',
      clienteCnpjCpf: '92.768.234/0001-90',
      origem: 'ORCAMENTO',
      orcamentoOrigemId: 'orc-02',
      orcamentoNumero: 'ORC-2026-0045',
      orcamentoVersaoId: 'v1',
      status: 'APROVACAO',

      valorTotalProdutos: 145000.0,
      valorFrete: 2500.0,
      valorDesconto: 0,
      valorOutrasDespesas: 0,
      valorIpiTotal: 7250.0,
      valorIcmsTotal: 26100.0,
      valorTotalPedido: 154750.0,
      custoTotalEstimado: 104400.0,
      margemContribuicaoEstimadaPerc: 28.0,
      margemMinimaEmpresaPerc: 16.0,

      tipoFrete: 'CIF',
      prazoPrometido: '2026-09-18',
      dataEmissao: '2026-08-22',
      dataEntregaDesejada: '2026-09-18',
      leadTimeDiasCalculado: 21,

      vendedorId: 'usr-vend-02',
      vendedorNome: 'Juliana Paes (Key Account)',
      canalVenda: 'ORÇAMENTO CPQ',
      condicaoPagamento: '30/60/90 DDL',
      formaPagamento: 'Boleto Bancário',
      tabelaPreco: 'TAB_MONTADORAS_2026',

      validacaoCredito: {
        statusValidacao: 'EXIGE_APROVACAO_ALCADA',
        limiteEmpresaDisponivel: 80000.0,
        limiteGrupoDisponivel: 200000.0,
        exposicaoProjetadaEmpresa: 224750.0,
        exposicaoProjetadaGrupo: 224750.0,
        possuiBloqueioAtivo: false,
        dataValidacao: '2026-08-22T14:00:00Z',
        detalhesValidacao: 'Valor do pedido (R$ 154.750,00) excede o saldo de limite disponível na empresa (R$ 80.000,00). Requer aprovação de alçada da Diretoria Financeira.',
      },
      validacaoMargem: {
        statusValidacao: 'DENTRO_DA_MARGEM',
        margemCalculadaPerc: 28.0,
        margemMinimaRequeridaPerc: 16.0,
        diferencaPerc: 12.0,
        aprovacaoObrigatoria: false,
        detalhes: 'Margem de 28.0% atende a política de rentabilidade.',
      },
      statusEstoque: 'AGUARDANDO_RESERVA',
      statusNecessidades: 'NAO_GERADO',

      itens: [
        {
          id: 'it-003',
          pedidoId: ped2Id,
          numeroItem: 1,
          codigoItem: 'TRAV-SEMIRR-400',
          descricao: 'Travessa Reforçada de Chassi Carreta Bitrem Aço Domex 700',
          tipoItem: 'PRODUTO_FABRICADO',
          ncm: '8716.90.90',
          unidadeMedida: 'PC',
          quantidade: 50,
          quantidadeEntregue: 0,
          quantidadeFaturada: 0,
          quantidadeReservadaEstoque: 0,
          quantidadePendenteProducao: 50,
          precoUnitario: 2900.0,
          descontoPerc: 0,
          valorDesconto: 0,
          precoLiquido: 2900.0,
          valorTotal: 145000.0,
          aliquotaIpi: 5.0,
          valorIpi: 7250.0,
          aliquotaIcms: 18.0,
          valorIcms: 26100.0,
          custoUnitarioEstimado: 2088.0,
          custoTotalEstimado: 104400.0,
          margemItemPerc: 28.0,
          prazoItemDias: 21,
          dataPrometidaItem: '2026-09-18',
          necessidadeGerada: { tipo: 'NENHUMA' },
        },
      ],
      parcelas: [
        {
          id: 'p2-parc-1',
          pedidoId: ped2Id,
          numeroParcela: 1,
          totalParcelas: 3,
          diasVencimento: 30,
          dataVencimento: '2026-09-21',
          percentualParcela: 33.33,
          valorParcela: 51583.33,
          formaPagamento: 'Boleto Bancário',
          status: 'PENDENTE',
        },
        {
          id: 'p2-parc-2',
          pedidoId: ped2Id,
          numeroParcela: 2,
          totalParcelas: 3,
          diasVencimento: 60,
          dataVencimento: '2026-10-21',
          percentualParcela: 33.33,
          valorParcela: 51583.33,
          formaPagamento: 'Boleto Bancário',
          status: 'PENDENTE',
        },
        {
          id: 'p2-parc-3',
          pedidoId: ped2Id,
          numeroParcela: 3,
          totalParcelas: 3,
          diasVencimento: 90,
          dataVencimento: '2026-11-21',
          percentualParcela: 33.34,
          valorParcela: 51583.34,
          formaPagamento: 'Boleto Bancário',
          status: 'PENDENTE',
        },
      ],
      entregas: [
        {
          id: 'p2-ent-1',
          pedidoId: ped2Id,
          numeroRemessa: 1,
          dataPrometidaEntrega: '2026-09-18',
          dataPrevisaoDespacho: '2026-09-16',
          itens: [
            {
              pedidoItemId: 'it-003',
              codigoItem: 'TRAV-SEMIRR-400',
              descricao: 'Travessa Reforçada de Chassi Carreta Bitrem Aço Domex 700',
              quantidadeProgramada: 50,
              quantidadeExpedida: 0,
              quantidadeEntregue: 0,
              unidadeMedida: 'PC',
            },
          ],
          statusEntrega: 'PROGRAMADA',
        },
      ],
      aprovacoes: [
        {
          id: 'p2-apr-1',
          pedidoId: ped2Id,
          tipoAprovacao: 'LIMITE_CREDITO',
          motivoExigencia: 'Excedente de R$ 74.750,00 sobre o limite concedido na empresa Tritech Corte.',
          nivelAlcadaRequerido: 'GERENTE_FINANCEIRO',
          status: 'PENDENTE',
          solicitadoPor: 'Juliana Paes (Key Account)',
          solicitadoEm: '2026-08-22T14:05:00Z',
        },
      ],
      historicoTransicoes: [
        {
          id: 'log-p2-1',
          pedidoId: ped2Id,
          statusAnterior: 'RASCUNHO',
          novoStatus: 'APROVACAO',
          dataTransicao: '2026-08-22T14:05:00Z',
          usuarioId: 'usr-vend-02',
          usuarioNome: 'Juliana Paes',
          motivo: 'Pedido convertido do orçamento #ORC-2026-0045 travado na alçada de crédito.',
        },
      ],

      revisoesCount: 0,
      versaoAtual: 1,
      bloqueadoParaEdicao: false,
      criadoEm: '2026-08-22T14:05:00Z',
      atualizadoEm: '2026-08-22T14:05:00Z',
    };

    this.pedidos.set(ped2.id, ped2);

    // 3. Pedido 3: Pedido DIRETO com Entrega PARCIAL expedida (PARCIAL)
    const ped3Id = 'ped-003';
    const ped3: PedidoVenda = {
      id: ped3Id,
      numero: 'PED-2026-0003',
      empresaId: 'emp-tritech-corte',
      empresaNome: 'Tritech Indústria Metalúrgica Ltda',
      clienteId: 'cli-03',
      clienteNome: 'Kepler Weber S.A. Silos',
      clienteCnpjCpf: '90.222.111/0001-44',
      origem: 'DIRETO',
      status: 'PARCIAL',

      valorTotalProdutos: 42000.0,
      valorFrete: 0,
      valorDesconto: 0,
      valorOutrasDespesas: 0,
      valorIpiTotal: 2100.0,
      valorIcmsTotal: 7560.0,
      valorTotalPedido: 44100.0,
      custoTotalEstimado: 29400.0,
      margemContribuicaoEstimadaPerc: 30.0,
      margemMinimaEmpresaPerc: 16.0,

      tipoFrete: 'FOB',
      prazoPrometido: '2026-08-30',
      dataEmissao: '2026-08-15',
      dataEntregaDesejada: '2026-08-30',
      leadTimeDiasCalculado: 10,

      vendedorId: 'usr-vend-01',
      vendedorNome: 'Marcos Vinicius Rezende',
      canalVenda: 'VENDA DIRETA',
      condicaoPagamento: '28 DDL',
      formaPagamento: 'Boleto Bancário',
      tabelaPreco: 'TAB_PADRAO_DIRETA',

      validacaoCredito: {
        statusValidacao: 'APROVADO',
        limiteEmpresaDisponivel: 120000.0,
        limiteGrupoDisponivel: 250000.0,
        exposicaoProjetadaEmpresa: 44100.0,
        exposicaoProjetadaGrupo: 44100.0,
        possuiBloqueioAtivo: false,
        dataValidacao: '2026-08-15T09:00:00Z',
        detalhesValidacao: 'Crédito aprovado.',
      },
      validacaoMargem: {
        statusValidacao: 'DENTRO_DA_MARGEM',
        margemCalculadaPerc: 30.0,
        margemMinimaRequeridaPerc: 16.0,
        diferencaPerc: 14.0,
        aprovacaoObrigatoria: false,
        detalhes: 'Margem aprovada.',
      },
      statusEstoque: 'NAO_APLICAVEL',
      statusNecessidades: 'ORDENS_EM_ANDAMENTO',

      itens: [
        {
          id: 'it-004',
          pedidoId: ped3Id,
          numeroItem: 1,
          codigoItem: 'PAINEL-SILO-GALV',
          descricao: 'Painel Galvanizado Perfurado para Fundo de Silo 2.00mm',
          tipoItem: 'PRODUTO_FABRICADO',
          ncm: '7308.90.90',
          unidadeMedida: 'M2',
          quantidade: 300,
          quantidadeEntregue: 150,
          quantidadeFaturada: 150,
          quantidadeReservadaEstoque: 0,
          quantidadePendenteProducao: 150,
          precoUnitario: 140.0,
          descontoPerc: 0,
          valorDesconto: 0,
          precoLiquido: 140.0,
          valorTotal: 42000.0,
          aliquotaIpi: 5.0,
          valorIpi: 2100.0,
          aliquotaIcms: 18.0,
          valorIcms: 7560.0,
          custoUnitarioEstimado: 98.0,
          custoTotalEstimado: 29400.0,
          margemItemPerc: 30.0,
          prazoItemDias: 10,
          dataPrometidaItem: '2026-08-30',
          necessidadeGerada: {
            tipo: 'ORDEM_PRODUCAO',
            documentoReferenciaId: 'OP-2026-0792',
            numeroOp: 'OP-2026-0792',
            statusDocumento: 'EM_PROCESSO',
            geradoEm: '2026-08-15T09:10:00Z',
          },
        },
      ],
      parcelas: [
        {
          id: 'p3-parc-1',
          pedidoId: ped3Id,
          numeroParcela: 1,
          totalParcelas: 1,
          diasVencimento: 28,
          dataVencimento: '2026-09-12',
          percentualParcela: 100,
          valorParcela: 44100.0,
          formaPagamento: 'Boleto Bancário',
          status: 'PENDENTE',
        },
      ],
      entregas: [
        {
          id: 'p3-ent-1',
          pedidoId: ped3Id,
          numeroRemessa: 1,
          dataPrometidaEntrega: '2026-08-20',
          dataPrevisaoDespacho: '2026-08-19',
          dataEfetivaEntrega: '2026-08-20',
          itens: [
            {
              pedidoItemId: 'it-004',
              codigoItem: 'PAINEL-SILO-GALV',
              descricao: 'Painel Galvanizado Perfurado para Fundo de Silo 2.00mm',
              quantidadeProgramada: 150,
              quantidadeExpedida: 150,
              quantidadeEntregue: 150,
              unidadeMedida: 'M2',
            },
          ],
          statusEntrega: 'EXPEDIDA',
          codigoRastreio: 'BR-849102934BR',
          transportadora: 'Transportes Rodoviários Panamericano',
          notaFiscalNumero: 'NF-e 49.102',
        },
        {
          id: 'p3-ent-2',
          pedidoId: ped3Id,
          numeroRemessa: 2,
          dataPrometidaEntrega: '2026-08-30',
          dataPrevisaoDespacho: '2026-08-28',
          itens: [
            {
              pedidoItemId: 'it-004',
              codigoItem: 'PAINEL-SILO-GALV',
              descricao: 'Painel Galvanizado Perfurado para Fundo de Silo 2.00mm',
              quantidadeProgramada: 150,
              quantidadeExpedida: 0,
              quantidadeEntregue: 0,
              unidadeMedida: 'M2',
            },
          ],
          statusEntrega: 'PROGRAMADA',
        },
      ],
      aprovacoes: [],
      historicoTransicoes: [
        {
          id: 'log-p3-1',
          pedidoId: ped3Id,
          statusAnterior: 'RASCUNHO',
          novoStatus: 'APROVADO',
          dataTransicao: '2026-08-15T09:10:00Z',
          usuarioId: 'usr-vend-01',
          usuarioNome: 'Marcos Vinicius Rezende',
          motivo: 'Pedido direto cadastrado e aprovado.',
        },
        {
          id: 'log-p3-2',
          pedidoId: ped3Id,
          statusAnterior: 'APROVADO',
          novoStatus: 'EM_EXECUCAO',
          dataTransicao: '2026-08-16T08:00:00Z',
          usuarioId: 'usr-pcp-01',
          usuarioNome: 'Carlos Eduardo Silveira',
          motivo: 'Produção iniciada para remessa 1.',
        },
        {
          id: 'log-p3-3',
          pedidoId: ped3Id,
          statusAnterior: 'EM_EXECUCAO',
          novoStatus: 'PARCIAL',
          dataTransicao: '2026-08-20T16:00:00Z',
          usuarioId: 'usr-exp-01',
          usuarioNome: 'Rodrigo Expedição',
          motivo: 'Remessa 1 expedida (150 m2 com NF-e 49.102). Restante em fabricação.',
        },
      ],

      revisoesCount: 0,
      versaoAtual: 1,
      bloqueadoParaEdicao: true,
      criadoEm: '2026-08-15T09:00:00Z',
      atualizadoEm: '2026-08-20T16:00:00Z',
    };

    this.pedidos.set(ped3.id, ped3);

    // 4. Pedido 4: FATURADO e CONCLUÍDO
    const ped4Id = 'ped-004';
    const ped4: PedidoVenda = {
      id: ped4Id,
      numero: 'PED-2026-0004',
      empresaId: 'emp-tritech-corte',
      empresaNome: 'Tritech Indústria Metalúrgica Ltda',
      clienteId: 'cli-04',
      clienteNome: 'Guerra Implementos Ltda',
      clienteCnpjCpf: '89.123.456/0001-78',
      origem: 'ORCAMENTO',
      orcamentoOrigemId: 'orc-03',
      orcamentoNumero: 'ORC-2026-0038',
      status: 'FATURADO',

      valorTotalProdutos: 36000.0,
      valorFrete: 0,
      valorDesconto: 0,
      valorOutrasDespesas: 0,
      valorIpiTotal: 1800.0,
      valorIcmsTotal: 6480.0,
      valorTotalPedido: 37800.0,
      custoTotalEstimado: 25200.0,
      margemContribuicaoEstimadaPerc: 30.0,
      margemMinimaEmpresaPerc: 16.0,

      tipoFrete: 'FOB',
      prazoPrometido: '2026-08-18',
      dataEmissao: '2026-08-01',
      dataEntregaDesejada: '2026-08-18',
      dataEfetivaConclusao: '2026-08-18',
      leadTimeDiasCalculado: 12,

      vendedorId: 'usr-vend-01',
      vendedorNome: 'Marcos Vinicius Rezende',
      canalVenda: 'ORÇAMENTO CPQ',
      condicaoPagamento: '30 DDL',
      formaPagamento: 'Boleto Bancário',
      tabelaPreco: 'TAB_MONTADORAS_2026',

      validacaoCredito: {
        statusValidacao: 'APROVADO',
        limiteEmpresaDisponivel: 100000.0,
        limiteGrupoDisponivel: 200000.0,
        exposicaoProjetadaEmpresa: 37800.0,
        exposicaoProjetadaGrupo: 37800.0,
        possuiBloqueioAtivo: false,
        dataValidacao: '2026-08-01T10:00:00Z',
        detalhesValidacao: 'Crédito aprovado sem pendências.',
      },
      validacaoMargem: {
        statusValidacao: 'DENTRO_DA_MARGEM',
        margemCalculadaPerc: 30.0,
        margemMinimaRequeridaPerc: 16.0,
        diferencaPerc: 14.0,
        aprovacaoObrigatoria: false,
        detalhes: 'Margem aprovada.',
      },
      statusEstoque: 'NAO_APLICAVEL',
      statusNecessidades: 'ORDENS_CONCLUIDAS',

      itens: [
        {
          id: 'it-005',
          pedidoId: ped4Id,
          numeroItem: 1,
          codigoItem: 'FLANGE-SOLD-01',
          descricao: 'Flange Soldada em Aço Carbono ASTM A36 12.70mm',
          tipoItem: 'PRODUTO_FABRICADO',
          ncm: '7307.91.00',
          unidadeMedida: 'UN',
          quantidade: 80,
          quantidadeEntregue: 80,
          quantidadeFaturada: 80,
          quantidadeReservadaEstoque: 0,
          quantidadePendenteProducao: 0,
          precoUnitario: 450.0,
          descontoPerc: 0,
          valorDesconto: 0,
          precoLiquido: 450.0,
          valorTotal: 36000.0,
          aliquotaIpi: 5.0,
          valorIpi: 1800.0,
          aliquotaIcms: 18.0,
          valorIcms: 6480.0,
          custoUnitarioEstimado: 315.0,
          custoTotalEstimado: 25200.0,
          margemItemPerc: 30.0,
          prazoItemDias: 12,
          dataPrometidaItem: '2026-08-18',
          necessidadeGerada: {
            tipo: 'ORDEM_PRODUCAO',
            documentoReferenciaId: 'OP-2026-0689',
            numeroOp: 'OP-2026-0689',
            statusDocumento: 'FINALIZADA',
            geradoEm: '2026-08-01T10:05:00Z',
          },
        },
      ],
      parcelas: [
        {
          id: 'p4-parc-1',
          pedidoId: ped4Id,
          numeroParcela: 1,
          totalParcelas: 1,
          diasVencimento: 30,
          dataVencimento: '2026-09-17',
          percentualParcela: 100,
          valorParcela: 37800.0,
          formaPagamento: 'Boleto Bancário',
          status: 'FATURADO',
          tituloReceberId: 'TIT-92811',
        },
      ],
      entregas: [
        {
          id: 'p4-ent-1',
          pedidoId: ped4Id,
          numeroRemessa: 1,
          dataPrometidaEntrega: '2026-08-18',
          dataPrevisaoDespacho: '2026-08-17',
          dataEfetivaEntrega: '2026-08-18',
          itens: [
            {
              pedidoItemId: 'it-005',
              codigoItem: 'FLANGE-SOLD-01',
              descricao: 'Flange Soldada em Aço Carbono ASTM A36 12.70mm',
              quantidadeProgramada: 80,
              quantidadeExpedida: 80,
              quantidadeEntregue: 80,
              unidadeMedida: 'UN',
            },
          ],
          statusEntrega: 'ENTREGUE',
          codigoRastreio: 'BR-981729384BR',
          transportadora: 'Transportadora Guerra Express',
          notaFiscalNumero: 'NF-e 48.912',
        },
      ],
      aprovacoes: [],
      historicoTransicoes: [
        {
          id: 'log-p4-1',
          pedidoId: ped4Id,
          statusAnterior: 'RASCUNHO',
          novoStatus: 'APROVADO',
          dataTransicao: '2026-08-01T10:05:00Z',
          usuarioId: 'usr-vend-01',
          usuarioNome: 'Marcos Vinicius Rezende',
          motivo: 'Conversão de orçamento e aprovação.',
        },
        {
          id: 'log-p4-2',
          pedidoId: ped4Id,
          statusAnterior: 'APROVADO',
          novoStatus: 'EM_EXECUCAO',
          dataTransicao: '2026-08-02T08:00:00Z',
          usuarioId: 'usr-pcp-01',
          usuarioNome: 'Carlos Eduardo Silveira',
          motivo: 'Ordens de Produção em andamento.',
        },
        {
          id: 'log-p4-3',
          pedidoId: ped4Id,
          statusAnterior: 'EM_EXECUCAO',
          novoStatus: 'PRONTO',
          dataTransicao: '2026-08-16T17:00:00Z',
          usuarioId: 'usr-pcp-01',
          usuarioNome: 'Carlos Eduardo Silveira',
          motivo: 'Inspeção de qualidade e liberação dos lotes.',
        },
        {
          id: 'log-p4-4',
          pedidoId: ped4Id,
          statusAnterior: 'PRONTO',
          novoStatus: 'EXPEDIDO',
          dataTransicao: '2026-08-17T14:30:00Z',
          usuarioId: 'usr-exp-01',
          usuarioNome: 'Rodrigo Expedição',
          motivo: 'Coleta realizada pela transportadora.',
        },
        {
          id: 'log-p4-5',
          pedidoId: ped4Id,
          statusAnterior: 'EXPEDIDO',
          novoStatus: 'FATURADO',
          dataTransicao: '2026-08-18T09:00:00Z',
          usuarioId: 'usr-fisc-01',
          usuarioNome: 'Camila Faturamento',
          motivo: 'Emissão da NF-e 48.912 e títulos a receber integrados.',
        },
      ],

      revisoesCount: 0,
      versaoAtual: 1,
      bloqueadoParaEdicao: true,
      criadoEm: '2026-08-01T10:00:00Z',
      atualizadoEm: '2026-08-18T09:00:00Z',
    };

    this.pedidos.set(ped4.id, ped4);
  }
}

// Instância singleton do serviço de pedidos de venda
export const pedidoService = new PedidoService();
