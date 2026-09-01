// backend/modules/compras/compras-service.ts
import {
  SolicitacaoCompra,
  SolicitacaoCompraItem,
  Cotacao,
  CotacaoFornecedor,
  CotacaoFornecedorItem,
  CriterioPesosCotacao,
  PedidoCompra,
  PedidoCompraItem,
  Recebimento,
  RecebimentoItem,
  DevolucaoCompra,
  DevolucaoCompraItem,
  HistoricoPrecoCompra,
  AvaliacaoFornecedor,
  IntegracaoFinanceiraCompra,
  IntegracaoFiscalCompra,
  OrigemNecessidadeCompra,
  PrioridadeCompra,
} from './compras-types';
import { estoqueService } from '../estoque/estoque-service';
import { BadRequestError, NotFoundError } from '../../core/errors';

export class ComprasService {
  private solicitacoes: Map<string, SolicitacaoCompra> = new Map();
  private cotacoes: Map<string, Cotacao> = new Map();
  private pedidos: Map<string, PedidoCompra> = new Map();
  private recebimentos: Map<string, Recebimento> = new Map();
  private devolucoes: Map<string, DevolucaoCompra> = new Map();
  private historicoPrecos: HistoricoPrecoCompra[] = [];
  private avaliacoesFornecedores: Map<string, AvaliacaoFornecedor> = new Map();
  private integracoesFinanceiras: Map<string, IntegracaoFinanceiraCompra> = new Map();
  private integracoesFiscais: Map<string, IntegracaoFiscalCompra> = new Map();

  private seqSolicitacao = 100;
  private seqCotacao = 100;
  private seqPedido = 100;
  private seqRecebimento = 100;
  private seqDevolucao = 100;

  constructor() {
    this.seedInitialData();
  }

  // ============================================================================
  // 1. SOLICITAÇÕES DE COMPRA (Necessidade, MRP, Estoque Mínimo, OP, Manutenção)
  // ============================================================================

  public criarSolicitacao(
    empresaId: string,
    dados: {
      tipoGeracao: OrigemNecessidadeCompra;
      prioridade: PrioridadeCompra;
      solicitanteNome: string;
      departamento: string;
      dataNecessidade: string;
      justificativa: string;
      numeroOp?: string;
      clienteNome?: string;
      planoProducao?: string;
      itens: Array<{
        produtoId: string;
        codigoProduto: string;
        descricao: string;
        quantidade: number;
        unidadeMedida: string;
        precoEstimadoUnitario?: number;
        centroCustoId?: string;
        maquinaTag?: string;
      }>;
    }
  ): SolicitacaoCompra {
    if (!dados.itens || dados.itens.length === 0) {
      throw new BadRequestError('A solicitação de compra deve conter ao menos um item.');
    }

    this.seqSolicitacao++;
    const solicitacaoId = `sc-${crypto.randomUUID().slice(0, 8)}`;
    const numero = `SC-2026-${String(this.seqSolicitacao).padStart(4, '0')}`;
    const agora = new Date().toISOString();

    const itensCriados: SolicitacaoCompraItem[] = dados.itens.map((it, idx) => {
      const precoEstimado = it.precoEstimadoUnitario || 100;
      return {
        id: `sci-${crypto.randomUUID().slice(0, 8)}-${idx + 1}`,
        solicitacaoId,
        produtoId: it.produtoId,
        codigoProduto: it.codigoProduto,
        descricao: it.descricao,
        quantidade: it.quantidade,
        unidadeMedida: it.unidadeMedida,
        precoEstimadoUnitario: precoEstimado,
        valorEstimadoTotal: it.quantidade * precoEstimado,
        quantidadeAtendida: 0,
        statusItem: 'PENDENTE',
        centroCustoId: it.centroCustoId,
        maquinaTag: it.maquinaTag,
      };
    });

    const solicitacao: SolicitacaoCompra = {
      id: solicitacaoId,
      empresaId,
      numero,
      tipoGeracao: dados.tipoGeracao,
      prioridade: dados.prioridade,
      status: 'RASCUNHO',
      solicitanteId: `usr-${crypto.randomUUID().slice(0, 6)}`,
      solicitanteNome: dados.solicitanteNome,
      departamento: dados.departamento,
      dataNecessidade: dados.dataNecessidade,
      justificativa: dados.justificativa,
      numeroOp: dados.numeroOp,
      clienteNome: dados.clienteNome,
      planoProducao: dados.planoProducao,
      itens: itensCriados,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    this.solicitacoes.set(solicitacaoId, solicitacao);
    return solicitacao;
  }

  public listarSolicitacoes(empresaId: string): SolicitacaoCompra[] {
    return Array.from(this.solicitacoes.values()).filter((s) => s.empresaId === empresaId);
  }

  public aprovarSolicitacao(id: string, aprovadorNome: string, parecer?: string): SolicitacaoCompra {
    const sol = this.solicitacoes.get(id);
    if (!sol) {
      throw new NotFoundError(`Solicitação de compra ${id} não encontrada.`);
    }
    sol.status = 'APROVADA';
    sol.aprovadoPor = aprovadorNome;
    sol.dataAprovacao = new Date().toISOString();
    sol.atualizadoEm = new Date().toISOString();
    if (parecer) {
      sol.justificativa += ` | Parecer Aprovação: ${parecer}`;
    }
    return sol;
  }

  public rejeitarSolicitacao(id: string, motivoRejeicao: string): SolicitacaoCompra {
    const sol = this.solicitacoes.get(id);
    if (!sol) {
      throw new NotFoundError(`Solicitação de compra ${id} não encontrada.`);
    }
    sol.status = 'REJEITADA';
    sol.motivoRejeicao = motivoRejeicao;
    sol.atualizadoEm = new Date().toISOString();
    return sol;
  }

  // ============================================================================
  // 2. COTAÇÕES MULTI-CRITÉRIO & SCORING DE FORNECEDORES
  // ============================================================================

  public criarCotacao(
    empresaId: string,
    dados: {
      solicitacaoId: string;
      compradorNome: string;
      fornecedoresIds: string[];
      pesosCriterios?: Partial<CriterioPesosCotacao>;
      prazoLimiteResposta?: string;
    }
  ): Cotacao {
    const sol = this.solicitacoes.get(dados.solicitacaoId);
    if (!sol) {
      throw new NotFoundError(`Solicitação de compra ${dados.solicitacaoId} não encontrada.`);
    }

    this.seqCotacao++;
    const cotacaoId = `cot-${crypto.randomUUID().slice(0, 8)}`;
    const numero = `COT-2026-${String(this.seqCotacao).padStart(4, '0')}`;
    const agora = new Date().toISOString();

    const pesos: CriterioPesosCotacao = {
      pesoPreco: dados.pesosCriterios?.pesoPreco ?? 40,
      pesoFrete: dados.pesosCriterios?.pesoFrete ?? 20,
      pesoPrazo: dados.pesosCriterios?.pesoPrazo ?? 20,
      pesoQualidade: dados.pesosCriterios?.pesoQualidade ?? 10,
      pesoHistorico: dados.pesosCriterios?.pesoHistorico ?? 10,
    };

    // Fornecedores Cadastrados Mock para Simulação e Cotação
    const fornecedoresDisponiveis: Record<string, { nome: string; cnpj: string; freteTipo: 'CIF' | 'FOB'; prazoDias: number; precoFator: number; freteValor: number; condicao: string }> = {
      'forn-usiminas-01': {
        nome: 'Usiminas Aços Especiais S.A.',
        cnpj: '60.870.004/0001-40',
        freteTipo: 'CIF',
        prazoDias: 5,
        precoFator: 0.98,
        freteValor: 0,
        condicao: '30/60 DDL',
      },
      'forn-gerdau-03': {
        nome: 'Gerdau Aços Longos S.A.',
        cnpj: '01.571.528/0001-80',
        freteTipo: 'FOB',
        prazoDias: 3,
        precoFator: 0.95,
        freteValor: 450,
        condicao: '28 DDL',
      },
      'forn-csn-02': {
        nome: 'Companhia Siderúrgica Nacional (CSN)',
        cnpj: '33.042.730/0001-04',
        freteTipo: 'CIF',
        prazoDias: 8,
        precoFator: 1.02,
        freteValor: 0,
        condicao: '45 DDL',
      },
      'forn-aperam-04': {
        nome: 'Aperam South America Inox',
        cnpj: '00.415.541/0001-90',
        freteTipo: 'CIF',
        prazoDias: 12,
        precoFator: 1.05,
        freteValor: 0,
        condicao: '30 DDL',
      },
    };

    const cotacoesFornecedores: CotacaoFornecedor[] = dados.fornecedoresIds.map((fornId) => {
      const fInfo = fornecedoresDisponiveis[fornId] || {
        nome: `Fornecedor Parceiro ${fornId}`,
        cnpj: '00.000.000/0001-00',
        freteTipo: 'CIF' as const,
        prazoDias: 7,
        precoFator: 1.0,
        freteValor: 0,
        condicao: '30 DDL',
      };

      const itensFornecedor: CotacaoFornecedorItem[] = sol.itens.map((it, idx) => {
        const precoBase = (it.precoEstimadoUnitario || 1000) * fInfo.precoFator;
        const aliquotaIpi = 5;
        const aliquotaIcms = 18;
        const valorIpi = precoBase * (aliquotaIpi / 100);
        const valorIcms = precoBase * (aliquotaIcms / 100);
        const valorTotalItem = (precoBase + valorIpi) * it.quantidade;

        return {
          id: `cfi-${crypto.randomUUID().slice(0, 8)}-${idx + 1}`,
          cotacaoFornecedorId: '',
          produtoId: it.produtoId,
          codigoProduto: it.codigoProduto,
          descricao: it.descricao,
          quantidade: it.quantidade,
          precoUnitario: Number(precoBase.toFixed(2)),
          aliquotaIpi,
          valorIpi: Number(valorIpi.toFixed(2)),
          aliquotaIcms,
          valorIcms: Number(valorIcms.toFixed(2)),
          valorTotalItem: Number(valorTotalItem.toFixed(2)),
          prazoEntregaDias: fInfo.prazoDias,
          garantiaMeses: 12,
        };
      });

      const avaliacao = this.getOuCriarAvaliacaoFornecedor(empresaId, fornId, fInfo.nome, fInfo.cnpj);

      return {
        id: `cf-${crypto.randomUUID().slice(0, 8)}`,
        cotacaoId,
        fornecedorId: fornId,
        fornecedorNome: fInfo.nome,
        fornecedorCnpj: fInfo.cnpj,
        condicaoPagamento: fInfo.condicao,
        tipoFrete: fInfo.freteTipo,
        valorFrete: fInfo.freteValor,
        prazoEntregaDiasGeral: fInfo.prazoDias,
        validadeProposta: '2026-03-31',
        pontuacaoPreco: 0,
        pontuacaoFrete: 0,
        pontuacaoPrazo: 0,
        pontuacaoQualidade: avaliacao.iqfPontuacaoGeral,
        pontuacaoHistorico: avaliacao.pontuacaoHistorico,
        pontuacaoGeralFinal: 0,
        rankingGeral: 0,
        statusResposta: 'RESPONDIDA',
        selecionadoVencedor: false,
        itens: itensFornecedor,
      };
    });

    // Calcular Scoring Ponderado das Propostas
    this.recalcularScoringCotacao(cotacoesFornecedores, pesos);

    const cotacao: Cotacao = {
      id: cotacaoId,
      empresaId,
      numero,
      solicitacaoId: sol.id,
      solicitacaoNumero: sol.numero,
      status: 'EM_ANALISE',
      compradorId: `usr-${crypto.randomUUID().slice(0, 6)}`,
      compradorNome: dados.compradorNome,
      pesosCriterios: pesos,
      fornecedores: cotacoesFornecedores,
      prazoLimiteResposta: dados.prazoLimiteResposta || new Date(Date.now() + 5 * 86400000).toISOString(),
      criadoEm: agora,
      atualizadoEm: agora,
    };

    sol.status = 'EM_COTACAO';
    this.cotacoes.set(cotacaoId, cotacao);
    return cotacao;
  }

  private recalcularScoringCotacao(fornecedores: CotacaoFornecedor[], pesos: CriterioPesosCotacao) {
    if (fornecedores.length === 0) return;

    // Calcular valores totais de itens + frete para cada fornecedor
    const totaisPreco = fornecedores.map((f) => {
      const somaItens = f.itens.reduce((acc, it) => acc + it.valorTotalItem, 0);
      return somaItens;
    });
    const menorPreco = Math.min(...totaisPreco);

    const prazos = fornecedores.map((f) => f.prazoEntregaDiasGeral);
    const menorPrazo = Math.min(...prazos);

    fornecedores.forEach((f, idx) => {
      const precoTotal = totaisPreco[idx];
      // Pontuação de Preço (0 a 100, inversamente proporcional ao menor preço)
      f.pontuacaoPreco = Number(Math.min(100, Math.max(10, (menorPreco / (precoTotal || 1)) * 100)).toFixed(1));

      // Pontuação de Frete (CIF = 100, FOB com frete ponderado)
      f.pontuacaoFrete = f.tipoFrete === 'CIF' ? 100 : Math.max(30, 100 - (f.valorFrete / 50));

      // Pontuação de Prazo (Inversamente proporcional ao menor prazo)
      f.pontuacaoPrazo = Number(Math.min(100, Math.max(20, (menorPrazo / (f.prazoEntregaDiasGeral || 1)) * 100)).toFixed(1));

      // Pontuação Geral Final Ponderada (Base 100)
      const somaPesos = pesos.pesoPreco + pesos.pesoFrete + pesos.pesoPrazo + pesos.pesoQualidade + pesos.pesoHistorico || 100;
      const pontuacaoFinal =
        (f.pontuacaoPreco * pesos.pesoPreco +
          f.pontuacaoFrete * pesos.pesoFrete +
          f.pontuacaoPrazo * pesos.pesoPrazo +
          f.pontuacaoQualidade * pesos.pesoQualidade +
          f.pontuacaoHistorico * pesos.pesoHistorico) /
        somaPesos;

      f.pontuacaoGeralFinal = Number(pontuacaoFinal.toFixed(1));
    });

    // Ordenar por pontuação final decrescente e atribuir ranking
    const ordenados = [...fornecedores].sort((a, b) => b.pontuacaoGeralFinal - a.pontuacaoGeralFinal);
    ordenados.forEach((f, rank) => {
      f.rankingGeral = rank + 1;
    });
  }

  public listarCotacoes(empresaId: string): Cotacao[] {
    return Array.from(this.cotacoes.values()).filter((c) => c.empresaId === empresaId);
  }

  public aprovarCotacaoEEfetivarPedido(
    cotacaoId: string,
    dados: {
      fornecedorIdVencedor: string;
      aprovadorNome: string;
      justificativaEscolha?: string;
    }
  ): { cotacao: Cotacao; pedido: PedidoCompra } {
    const cotacao = this.cotacoes.get(cotacaoId);
    if (!cotacao) {
      throw new NotFoundError(`Cotação ${cotacaoId} não encontrada.`);
    }

    const fornecedorEscolhido = cotacao.fornecedores.find((f) => f.fornecedorId === dados.fornecedorIdVencedor);
    if (!fornecedorEscolhido) {
      throw new NotFoundError(`Fornecedor ${dados.fornecedorIdVencedor} não encontrado na cotação.`);
    }

    // REGRA DE GOVERNANÇA: Se não for o 1º colocado do ranking geral ponderado, exige justificativa formal
    if (fornecedorEscolhido.rankingGeral !== 1) {
      if (!dados.justificativaEscolha || dados.justificativaEscolha.trim().length < 10) {
        throw new BadRequestError(
          `A escolha do fornecedor ${fornecedorEscolhido.fornecedorNome} (${fornecedorEscolhido.rankingGeral}º colocado) exige justificativa formal de alçada de diretoria (mínimo 10 caracteres).`
        );
      }
    }

    cotacao.fornecedores.forEach((f) => {
      f.selecionadoVencedor = f.fornecedorId === dados.fornecedorIdVencedor;
      if (f.selecionadoVencedor) {
        f.justificativaEscolha = dados.justificativaEscolha;
      }
    });

    cotacao.fornecedorVencedorId = dados.fornecedorIdVencedor;
    cotacao.justificativaAprovacaoNaoPrimeiroLugar = dados.justificativaEscolha;
    cotacao.status = 'FINALIZADA';
    cotacao.aprovadoPor = dados.aprovadorNome;
    cotacao.dataAprovacao = new Date().toISOString();
    cotacao.atualizadoEm = new Date().toISOString();

    // Gerar Pedido de Compra
    this.seqPedido++;
    const pedidoId = `pc-${crypto.randomUUID().slice(0, 8)}`;
    const numeroPedido = `PC-2026-${String(this.seqPedido).padStart(4, '0')}`;
    const agora = new Date().toISOString();

    const itensPedido: PedidoCompraItem[] = fornecedorEscolhido.itens.map((it, idx) => ({
      id: `pci-${crypto.randomUUID().slice(0, 8)}-${idx + 1}`,
      pedidoCompraId: pedidoId,
      produtoId: it.produtoId,
      codigoProduto: it.codigoProduto,
      descricao: it.descricao,
      quantidade: it.quantidade,
      unidadeMedida: 'CHAPA',
      precoUnitario: it.precoUnitario,
      aliquotaIpi: it.aliquotaIpi,
      valorIpi: it.valorIpi,
      aliquotaIcms: it.aliquotaIcms,
      valorIcms: it.valorIcms,
      valorTotalItem: it.valorTotalItem,
      quantidadeEntregue: 0,
      quantidadePendente: it.quantidade,
      quantidadeDevolvida: 0,
      dataPrevisaoEntrega: new Date(Date.now() + fornecedorEscolhido.prazoEntregaDiasGeral * 86400000).toISOString().split('T')[0],
      statusItem: 'PENDENTE',
    }));

    const valorProdutos = itensPedido.reduce((acc, it) => acc + (it.precoUnitario * it.quantidade), 0);
    const valorImpostos = itensPedido.reduce((acc, it) => acc + (it.valorIpi * it.quantidade), 0);
    const valorTotal = itensPedido.reduce((acc, it) => acc + it.valorTotalItem, 0) + fornecedorEscolhido.valorFrete;

    const pedido: PedidoCompra = {
      id: pedidoId,
      empresaId: cotacao.empresaId,
      numero: numeroPedido,
      cotacaoId: cotacao.id,
      solicitacaoId: cotacao.solicitacaoId,
      fornecedorId: fornecedorEscolhido.fornecedorId,
      fornecedorNome: fornecedorEscolhido.fornecedorNome,
      fornecedorCnpj: fornecedorEscolhido.fornecedorCnpj,
      fornecedorEmail: 'vendas@usiminas.com.br',
      condicaoPagamento: fornecedorEscolhido.condicaoPagamento,
      tipoFrete: fornecedorEscolhido.tipoFrete,
      valorFrete: fornecedorEscolhido.valorFrete,
      valorTotalProdutos: Number(valorProdutos.toFixed(2)),
      valorTotalImpostos: Number(valorImpostos.toFixed(2)),
      valorTotalItens: Number(valorTotal.toFixed(2)),
      status: 'APROVADO',
      dataEmissao: agora.split('T')[0],
      dataPrevisaoEntrega: new Date(Date.now() + fornecedorEscolhido.prazoEntregaDiasGeral * 86400000).toISOString().split('T')[0],
      compradorNome: cotacao.compradorNome,
      aprovadoPor: dados.aprovadorNome,
      itens: itensPedido,
      observacoes: `Gerado a partir da Cotação ${cotacao.numero}. Justificativa: ${dados.justificativaEscolha || 'Melhor pontuação global de suprimentos.'}`,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    this.pedidos.set(pedidoId, pedido);

    // Atualizar status da solicitação
    const sol = this.solicitacoes.get(cotacao.solicitacaoId);
    if (sol) {
      sol.status = 'ATENDIDA_PARCIAL';
      sol.itens.forEach((it) => {
        it.statusItem = 'PEDIDO_GERADO';
      });
    }

    return { cotacao, pedido };
  }

  // ============================================================================
  // 3. PEDIDOS DE COMPRA
  // ============================================================================

  public getPedidos(empresaId: string): PedidoCompra[] {
    return Array.from(this.pedidos.values()).filter((p) => p.empresaId === empresaId);
  }

  public getPedidoById(id: string): PedidoCompra | undefined {
    return this.pedidos.get(id);
  }

  // ============================================================================
  // 4. RECEBIMENTO FÍSICO E FISCAL (Estoque + Financeiro + Fiscal)
  // ============================================================================

  public processarRecebimento(
    empresaId: string,
    dados: {
      pedidoCompraId: string;
      numeroNf: string;
      serieNf: string;
      chaveAcessoNfe: string;
      dataEmissaoNf: string;
      responsavelRecebimentoNome: string;
      conferenteQualidadeNome: string;
      observacoes?: string;
      itens: Array<{
        pedidoCompraItemId: string;
        quantidadeEntregue: number;
        quantidadeAprovada: number;
        quantidadeRejeitada: number;
        numeroLoteUsina?: string;
        numeroCorrida?: string;
        certificadoUsinaNumero?: string;
        laudoQualidadeNumero?: string;
        almoxarifadoDestinoId?: string;
        localizacaoDestinoId?: string;
      }>;
    }
  ): {
    recebimento: Recebimento;
    financeiro: IntegracaoFinanceiraCompra;
    fiscal: IntegracaoFiscalCompra;
  } {
    const pedido = this.pedidos.get(dados.pedidoCompraId);
    if (!pedido) {
      throw new NotFoundError(`Pedido de compra ${dados.pedidoCompraId} não encontrado.`);
    }

    this.seqRecebimento++;
    const recebimentoId = `rec-${crypto.randomUUID().slice(0, 8)}`;
    const numero = `REC-2026-${String(this.seqRecebimento).padStart(4, '0')}`;
    const agora = new Date().toISOString();

    const movimentosEstoqueIds: string[] = [];
    let valorTotalRecebido = 0;

    const itensRecebidos: RecebimentoItem[] = dados.itens.map((itDado, idx) => {
      const itemPedido = pedido.itens.find((pi) => pi.id === itDado.pedidoCompraItemId);
      if (!itemPedido) {
        throw new NotFoundError(`Item ${itDado.pedidoCompraItemId} não pertence ao pedido de compra.`);
      }

      const statusInspecao =
        itDado.quantidadeRejeitada === 0
          ? 'APROVADO'
          : itDado.quantidadeAprovada === 0
          ? 'REJEITADO'
          : 'APROVADO_COM_RESSALVA';

      const valorTotalItem = itemPedido.precoUnitario * itDado.quantidadeAprovada;
      valorTotalRecebido += valorTotalItem;

      let loteCriadoId: string | undefined;

      // Movimentar Estoque se houver quantidade aprovada
      if (itDado.quantidadeAprovada > 0) {
        try {
          const resultadoMov = estoqueService.executarMovimento(empresaId, {
            tipoMovimento: 'ENTRADA_COMPRA',
            produtoId: itemPedido.produtoId,
            codigoProduto: itemPedido.codigoProduto,
            descricaoProduto: itemPedido.descricao,
            unidadeMedida: itemPedido.unidadeMedida,
            quantidade: itDado.quantidadeAprovada,
            custoUnitario: itemPedido.precoUnitario,
            almoxarifadoDestinoId: itDado.almoxarifadoDestinoId || 'alm-chapas-tritech-01',
            localizacaoDestinoId: itDado.localizacaoDestinoId || 'loc-rack-chapa-01',
            numeroLote: itDado.numeroLoteUsina,
            documentoOrigemTipo: 'NOTA_FISCAL_ENTRADA',
            documentoOrigemNumero: dados.numeroNf,
            motivo: `Recebimento da NF-e ${dados.numeroNf} - ${pedido.fornecedorNome}`,
            usuarioId: 'usr-almox-01',
            usuarioNome: dados.responsavelRecebimentoNome,
          });
          movimentosEstoqueIds.push(resultadoMov.movimento.id);
          loteCriadoId = resultadoMov.movimento.loteId;
        } catch {
          movimentosEstoqueIds.push(`mov-${crypto.randomUUID().slice(0, 6)}`);
        }
      }

      // Atualizar quantidades no item do pedido
      itemPedido.quantidadeEntregue += itDado.quantidadeAprovada;
      itemPedido.quantidadePendente = Math.max(0, itemPedido.quantidade - itemPedido.quantidadeEntregue);
      itemPedido.statusItem = itemPedido.quantidadePendente === 0 ? 'CONCLUIDO' : 'PARCIAL';

      // Atualizar histórico de preço de compra
      this.historicoPrecos.unshift({
        id: `hpc-${crypto.randomUUID().slice(0, 8)}`,
        empresaId,
        produtoId: itemPedido.produtoId,
        codigoProduto: itemPedido.codigoProduto,
        descricao: itemPedido.descricao,
        fornecedorId: pedido.fornecedorId,
        fornecedorNome: pedido.fornecedorNome,
        dataCompra: agora.split('T')[0],
        precoUnitario: itemPedido.precoUnitario,
        valorFreteUnitario: pedido.valorFrete / (pedido.itens.length || 1),
        quantidadeComprada: itDado.quantidadeAprovada,
        numeroPedido: pedido.numero,
        numeroNf: dados.numeroNf,
        tendenciaPreco: 'ESTAVEL',
      });

      return {
        id: `reci-${crypto.randomUUID().slice(0, 8)}-${idx + 1}`,
        recebimentoId,
        pedidoCompraItemId: itDado.pedidoCompraItemId,
        produtoId: itemPedido.produtoId,
        codigoProduto: itemPedido.codigoProduto,
        descricao: itemPedido.descricao,
        quantidadeEntregue: itDado.quantidadeEntregue,
        quantidadeAprovada: itDado.quantidadeAprovada,
        quantidadeRejeitada: itDado.quantidadeRejeitada,
        unidadeMedida: itemPedido.unidadeMedida,
        precoUnitario: itemPedido.precoUnitario,
        valorTotalItem: Number(valorTotalItem.toFixed(2)),
        loteId: loteCriadoId,
        numeroLoteUsina: itDado.numeroLoteUsina,
        numeroCorrida: itDado.numeroCorrida,
        certificadoUsinaNumero: itDado.certificadoUsinaNumero,
        laudoQualidadeNumero: itDado.laudoQualidadeNumero,
        almoxarifadoDestinoId: itDado.almoxarifadoDestinoId,
        localizacaoDestinoId: itDado.localizacaoDestinoId,
        statusInspecao,
      };
    });

    // Atualizar status global do pedido
    const pendenciaGeral = pedido.itens.reduce((acc, it) => acc + it.quantidadePendente, 0);
    pedido.status = pendenciaGeral === 0 ? 'RECEBIDO_TOTAL' : 'RECEBIDO_PARCIAL';
    pedido.atualizadoEm = agora;

    const recebimento: Recebimento = {
      id: recebimentoId,
      empresaId,
      numero,
      pedidoCompraId: pedido.id,
      pedidoCompraNumero: pedido.numero,
      fornecedorId: pedido.fornecedorId,
      fornecedorNome: pedido.fornecedorNome,
      fornecedorCnpj: pedido.fornecedorCnpj,
      numeroNf: dados.numeroNf,
      serieNf: dados.serieNf,
      chaveAcessoNfe: dados.chaveAcessoNfe,
      dataEmissaoNf: dados.dataEmissaoNf,
      dataRecebimento: agora,
      valorTotalNf: Number(valorTotalRecebido.toFixed(2)),
      status: pendenciaGeral === 0 ? 'RECEBIDO_TOTAL' : 'RECEBIDO_PARCIAL',
      responsavelRecebimentoId: 'usr-almox-01',
      responsavelRecebimentoNome: dados.responsavelRecebimentoNome,
      conferenteQualidadeNome: dados.conferenteQualidadeNome,
      itens: itensRecebidos,
      gerouMovimentoEstoque: movimentosEstoqueIds.length > 0,
      movimentoEstoqueIds: movimentosEstoqueIds,
      gerouIntegracaoFinanceira: true,
      tituloContasPagarId: `tit-cp-${crypto.randomUUID().slice(0, 6)}`,
      gerouIntegracaoFiscal: true,
      registroFiscalId: `fisc-${crypto.randomUUID().slice(0, 6)}`,
      observacoes: dados.observacoes,
      criadoEm: agora,
    };

    // INTEGRAÇÃO FINANCEIRA (Geração de Contas a Pagar)
    const financeiro: IntegracaoFinanceiraCompra = {
      id: `fin-cp-${crypto.randomUUID().slice(0, 8)}`,
      empresaId,
      recebimentoId,
      pedidoCompraId: pedido.id,
      fornecedorNome: pedido.fornecedorNome,
      numeroNf: dados.numeroNf,
      valorTotal: recebimento.valorTotalNf,
      parcelas: [
        {
          numeroParcela: 1,
          dataVencimento: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          valor: Number((recebimento.valorTotalNf / 2).toFixed(2)),
          status: 'ABERTO',
        },
        {
          numeroParcela: 2,
          dataVencimento: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
          valor: Number((recebimento.valorTotalNf / 2).toFixed(2)),
          status: 'ABERTO',
        },
      ],
      statusTitulo: 'GERADO_CONTAS_A_PAGAR',
      criadoEm: agora,
    };

    // INTEGRAÇÃO FISCAL (Registro em Livro de Entrada com CFOP Industrial)
    const fiscal: IntegracaoFiscalCompra = {
      id: `fisc-in-${crypto.randomUUID().slice(0, 8)}`,
      empresaId,
      recebimentoId,
      chaveNfe: dados.chaveAcessoNfe,
      numeroNf: dados.numeroNf,
      serie: dados.serieNf,
      dataEmissao: dados.dataEmissaoNf,
      cfopEntrada: '1.101', // Compra para industrialização
      baseCalculoIcms: recebimento.valorTotalNf,
      valorIcms: Number((recebimento.valorTotalNf * 0.18).toFixed(2)),
      baseCalculoIpi: recebimento.valorTotalNf,
      valorIpi: Number((recebimento.valorTotalNf * 0.05).toFixed(2)),
      valorTotalNf: recebimento.valorTotalNf,
      statusEscrituracao: 'REGISTRADO_LIVRO_ENTRADA',
    };

    this.recebimentos.set(recebimentoId, recebimento);
    this.integracoesFinanceiras.set(financeiro.id, financeiro);
    this.integracoesFiscais.set(fiscal.id, fiscal);

    // Atualizar IQF do Fornecedor
    this.atualizarIqfFornecedor(empresaId, pedido.fornecedorId, pedido.fornecedorNome, pedido.fornecedorCnpj, {
      itensEntregues: itensRecebidos.reduce((acc, it) => acc + it.quantidadeEntregue, 0),
      itensRejeitados: itensRecebidos.reduce((acc, it) => acc + it.quantidadeRejeitada, 0),
      emAtraso: false,
    });

    return { recebimento, financeiro, fiscal };
  }

  // ============================================================================
  // 5. DEVOLUÇÕES DE COMPRA (Estorno de Estoque + Ajuste Financeiro/Fiscal)
  // ============================================================================

  public processarDevolucao(
    empresaId: string,
    dados: {
      recebimentoId: string;
      tipoDevolucao: 'TOTAL' | 'PARCIAL';
      motivoGeral: string;
      numeroNfDevolucao: string;
      serieNfDevolucao: string;
      chaveAcessoNfeDevolucao: string;
      responsavelNome: string;
      itens: Array<{
        recebimentoItemId: string;
        quantidadeDevolvida: number;
        motivo: string;
      }>;
    }
  ): DevolucaoCompra {
    const recebimento = this.recebimentos.get(dados.recebimentoId);
    if (!recebimento) {
      throw new NotFoundError(`Recebimento ${dados.recebimentoId} não encontrado.`);
    }

    const pedido = this.pedidos.get(recebimento.pedidoCompraId);
    this.seqDevolucao++;
    const devolucaoId = `dev-${crypto.randomUUID().slice(0, 8)}`;
    const numero = `DEV-2026-${String(this.seqDevolucao).padStart(4, '0')}`;
    const agora = new Date().toISOString();

    let valorTotalDevolvido = 0;

    const itensDevolvidos: DevolucaoCompraItem[] = dados.itens.map((itDado, idx) => {
      const recItem = recebimento.itens.find((ri) => ri.id === itDado.recebimentoItemId);
      if (!recItem) {
        throw new NotFoundError(`Item de recebimento ${itDado.recebimentoItemId} não encontrado.`);
      }

      const valorItem = recItem.precoUnitario * itDado.quantidadeDevolvida;
      valorTotalDevolvido += valorItem;

      recItem.quantidadeDevolvida = (recItem.quantidadeDevolvida || 0) + itDado.quantidadeDevolvida;

      // Se havia lote/saldo, estorna do estoque com reversão
      if (recItem.quantidadeAprovada > 0) {
        try {
          estoqueService.executarMovimento(empresaId, {
            tipoMovimento: 'REVERSAO_ESTORNO',
            produtoId: recItem.produtoId,
            codigoProduto: recItem.codigoProduto,
            descricaoProduto: recItem.descricao,
            unidadeMedida: recItem.unidadeMedida,
            quantidade: itDado.quantidadeDevolvida,
            custoUnitario: recItem.precoUnitario,
            almoxarifadoOrigemId: recItem.almoxarifadoDestinoId || 'alm-chapas-tritech-01',
            localizacaoOrigemId: recItem.localizacaoDestinoId || 'loc-rack-chapa-01',
            numeroLote: recItem.numeroLoteUsina,
            documentoOrigemTipo: 'NOTA_FISCAL_DEVOLUCAO',
            documentoOrigemNumero: dados.numeroNfDevolucao,
            motivo: `Devolução a fornecedor NF ${dados.numeroNfDevolucao}: ${itDado.motivo}`,
            usuarioId: 'usr-almox-01',
            usuarioNome: dados.responsavelNome,
          });
        } catch {
          // Continua registro de devolução
        }
      }

      // Reverter quantidade entregue no pedido se existir
      if (pedido) {
        const pItem = pedido.itens.find((pi) => pi.id === recItem.pedidoCompraItemId);
        if (pItem) {
          pItem.quantidadeDevolvida = (pItem.quantidadeDevolvida || 0) + itDado.quantidadeDevolvida;
          pItem.quantidadeEntregue = Math.max(0, pItem.quantidadeEntregue - itDado.quantidadeDevolvida);
          pItem.quantidadePendente += itDado.quantidadeDevolvida;
        }
      }

      return {
        id: `devi-${crypto.randomUUID().slice(0, 8)}-${idx + 1}`,
        devolucaoId,
        recebimentoItemId: itDado.recebimentoItemId,
        produtoId: recItem.produtoId,
        codigoProduto: recItem.codigoProduto,
        descricao: recItem.descricao,
        quantidadeDevolvida: itDado.quantidadeDevolvida,
        precoUnitario: recItem.precoUnitario,
        valorTotalItem: Number(valorItem.toFixed(2)),
        motivo: itDado.motivo,
        loteDevolvidoId: recItem.loteId,
      };
    });

    recebimento.status = dados.tipoDevolucao === 'TOTAL' ? 'DEVOLVIDO_TOTAL' : 'DEVOLVIDO_PARCIAL';

    const devolucao: DevolucaoCompra = {
      id: devolucaoId,
      empresaId,
      numero,
      recebimentoId: recebimento.id,
      pedidoCompraId: recebimento.pedidoCompraId,
      fornecedorId: recebimento.fornecedorId,
      fornecedorNome: recebimento.fornecedorNome,
      fornecedorCnpj: recebimento.fornecedorCnpj,
      tipoDevolucao: dados.tipoDevolucao,
      motivoGeral: dados.motivoGeral,
      numeroNfDevolucao: dados.numeroNfDevolucao,
      serieNfDevolucao: dados.serieNfDevolucao,
      chaveAcessoNfeDevolucao: dados.chaveAcessoNfeDevolucao,
      dataDevolucao: agora,
      valorTotalDevolvido: Number(valorTotalDevolvido.toFixed(2)),
      responsavelNome: dados.responsavelNome,
      itens: itensDevolvidos,
      statusIntegracaoEstoque: true,
      statusIntegracaoFinanceira: true,
      statusIntegracaoFiscal: true,
      criadoEm: agora,
    };

    this.devolucoes.set(devolucaoId, devolucao);

    // Atualizar métricas IQF de devolução
    const avaliacao = this.getOuCriarAvaliacaoFornecedor(
      empresaId,
      recebimento.fornecedorId,
      recebimento.fornecedorNome,
      recebimento.fornecedorCnpj
    );
    avaliacao.totalDevolucoes += 1;
    avaliacao.iqfPontuacaoGeral = Math.max(10, avaliacao.iqfPontuacaoGeral - 5);
    avaliacao.ultimaAtualizacao = agora;

    return devolucao;
  }

  // ============================================================================
  // 6. HISTÓRICO DE PREÇOS E AVALIAÇÃO IQF DE FORNECEDORES
  // ============================================================================

  public getHistoricoPrecos(empresaId: string, produtoId?: string): HistoricoPrecoCompra[] {
    return this.historicoPrecos.filter((h) => h.empresaId === empresaId && (!produtoId || h.produtoId === produtoId));
  }

  public getAvaliacoesFornecedores(empresaId: string): AvaliacaoFornecedor[] {
    return Array.from(this.avaliacoesFornecedores.values()).filter((a) => a.empresaId === empresaId);
  }

  public getRecebimentos(empresaId: string, pedidoCompraId?: string): Recebimento[] {
    return Array.from(this.recebimentos.values()).filter(
      (r) => r.empresaId === empresaId && (!pedidoCompraId || r.pedidoCompraId === pedidoCompraId)
    );
  }

  public getDevolucoes(empresaId: string): DevolucaoCompra[] {
    return Array.from(this.devolucoes.values()).filter((d) => d.empresaId === empresaId);
  }

  private getOuCriarAvaliacaoFornecedor(
    empresaId: string,
    fornecedorId: string,
    fornecedorNome: string,
    fornecedorCnpj: string
  ): AvaliacaoFornecedor {
    const key = `${empresaId}:${fornecedorId}`;
    if (!this.avaliacoesFornecedores.has(key)) {
      this.avaliacoesFornecedores.set(key, {
        id: `av-${crypto.randomUUID().slice(0, 8)}`,
        empresaId,
        fornecedorId,
        fornecedorNome,
        fornecedorCnpj,
        totalPedidosRealizados: 12,
        totalItensEntregues: 150,
        totalItensComAtraso: 1,
        totalItensRejeitadosQualidade: 2,
        totalDevolucoes: 0,
        mediaCumprimentoPrazoPercentual: 95,
        mediaAprovacaoQualidadePercentual: 98,
        pontuacaoHistorico: 92,
        iqfPontuacaoGeral: 96,
        categoriaFornecedor: 'HOMOLOGADO_A',
        ultimaAtualizacao: new Date().toISOString(),
      });
    }
    return this.avaliacoesFornecedores.get(key)!;
  }

  private atualizarIqfFornecedor(
    empresaId: string,
    fornecedorId: string,
    fornecedorNome: string,
    fornecedorCnpj: string,
    stats: { itensEntregues: number; itensRejeitados: number; emAtraso: boolean }
  ) {
    const avaliacao = this.getOuCriarAvaliacaoFornecedor(empresaId, fornecedorId, fornecedorNome, fornecedorCnpj);
    avaliacao.totalItensEntregues += stats.itensEntregues;
    avaliacao.totalItensRejeitadosQualidade += stats.itensRejeitados;
    if (stats.emAtraso) {
      avaliacao.totalItensComAtraso += 1;
    }

    const taxaQualidade =
      avaliacao.totalItensEntregues > 0
        ? ((avaliacao.totalItensEntregues - avaliacao.totalItensRejeitadosQualidade) / avaliacao.totalItensEntregues) * 100
        : 100;

    avaliacao.mediaAprovacaoQualidadePercentual = Number(taxaQualidade.toFixed(1));
    avaliacao.iqfPontuacaoGeral = Number(((taxaQualidade * 0.6) + (avaliacao.mediaCumprimentoPrazoPercentual * 0.4)).toFixed(1));
    avaliacao.categoriaFornecedor =
      avaliacao.iqfPontuacaoGeral >= 90
        ? 'HOMOLOGADO_A'
        : avaliacao.iqfPontuacaoGeral >= 75
        ? 'HOMOLOGADO_B'
        : 'EM_OBSERVACAO';
    avaliacao.ultimaAtualizacao = new Date().toISOString();
  }

  // ============================================================================
  // SEED DE DADOS DEMO
  // ============================================================================

  private seedInitialData() {
    const empresaTritech = '11111111-1111-1111-1111-111111111111'; // Tritech Metalúrgica
    const agora = new Date().toISOString();

    // 1. Solicitação Demo (MRP / Reposição de Chapas SAE 1020)
    const sol1 = this.criarSolicitacao(empresaTritech, {
      tipoGeracao: 'MRP',
      prioridade: 'URGENTE',
      solicitanteNome: 'Carlos Eduardo (PCP)',
      departamento: 'Planejamento e Controle de Produção',
      dataNecessidade: '2026-03-05',
      justificativa: 'Atendimento à OP-2026-1044 (AgroSilus Tanque Inox) e estoque de segurança',
      numeroOp: 'OP-2026-1044',
      clienteNome: 'AgroSilus Equipamentos Agrícolas',
      itens: [
        {
          produtoId: 'prod-chapa-1020-475',
          codigoProduto: 'MP-CH-1020-4.75',
          descricao: 'Chapa Aço SAE 1020 4.75mm (3/16") 1500x3000mm',
          quantidade: 20,
          unidadeMedida: 'CHAPA',
          precoEstimadoUnitario: 1150,
          centroCustoId: 'CC-PROD-CORTE',
        },
        {
          produtoId: 'prod-chapa-inox-304-20',
          codigoProduto: 'MP-CH-INOX-304-2.0',
          descricao: 'Chapa Aço Inox AISI 304 2.00mm 1250x3000mm 2B',
          quantidade: 12,
          unidadeMedida: 'CHAPA',
          precoEstimadoUnitario: 2400,
          centroCustoId: 'CC-PROD-CALDEIRARIA',
        },
      ],
    });
    this.aprovarSolicitacao(sol1.id, 'Eng. Roberto Alcantara (Diretor Industrial)', 'Aprovado para cotação imediata com foco em prazo e qualidade');

    // 1.1 Solicitação Demo 2 (Pendente de Aprovação - Reposição de Tubos Estruturais)
    const sol2 = this.criarSolicitacao(empresaTritech, {
      tipoGeracao: 'ORDEM_PRODUCAO',
      prioridade: 'EMERGENCIAL',
      solicitanteNome: 'Marcos Vinicius (Engenharia & PCP)',
      departamento: 'Engenharia de Fabricação',
      dataNecessidade: '2026-03-10',
      justificativa: 'Aquisição emergencial de perfis tubulares estruturais para estrutura da Caldeiraria Pesada OP-2026-1088',
      numeroOp: 'OP-2026-1088',
      clienteNome: 'Usiminas Mecânica S.A.',
      itens: [
        {
          produtoId: 'prod-tubo-quad-100-475',
          codigoProduto: 'MP-TB-QUAD-100X100-4.75',
          descricao: 'Tubo Estrutural Quadrado 100x100x4.75mm NBR 8261',
          quantidade: 16,
          unidadeMedida: 'BARRA_6M',
          precoEstimadoUnitario: 480,
          centroCustoId: 'CC-PROD-CORTE',
        },
        {
          produtoId: 'prod-eletrodo-7018',
          codigoProduto: 'CS-EL-E7018-3.25',
          descricao: 'Eletrodo Revestido AWS E7018 3.25mm',
          quantidade: 50,
          unidadeMedida: 'KG',
          precoEstimadoUnitario: 38,
          centroCustoId: 'CC-PROD-SOLDAGEM',
        },
      ],
    });
    sol2.status = 'PENDENTE_APROVACAO';

    // 2. Cotação Demo vinculada
    const cotacaoDemo = this.criarCotacao(empresaTritech, {
      solicitacaoId: sol1.id,
      compradorNome: 'Juliana Mendes (Compradora Sênior)',
      fornecedoresIds: ['forn-usiminas-01', 'forn-gerdau-03', 'forn-csn-02'],
      pesosCriterios: {
        pesoPreco: 35,
        pesoFrete: 20,
        pesoPrazo: 25,
        pesoQualidade: 10,
        pesoHistorico: 10,
      },
    });

    // 3. Aprovação da Cotação e Geração do Pedido
    const vencedor = cotacaoDemo.fornecedores[0];
    const { pedido: pedidoDemo } = this.aprovarCotacaoEEfetivarPedido(cotacaoDemo.id, {
      fornecedorIdVencedor: vencedor.fornecedorId,
      aprovadorNome: 'Roberto Alcantara',
      justificativaEscolha: 'Vencedor geral no motor ponderado de suprimentos (Melhor score CIF e prazo).',
    });

    // 4. Recebimento Parcial Demo
    this.processarRecebimento(empresaTritech, {
      pedidoCompraId: pedidoDemo.id,
      numeroNf: '000.089.412',
      serieNf: '1',
      chaveAcessoNfe: '31260260870004000140550010000894121098421099',
      dataEmissaoNf: '2026-02-24',
      responsavelRecebimentoNome: 'Marcelo Vieira (Almoxarife)',
      conferenteQualidadeNome: 'Inspetor Carlos Silva',
      observacoes: 'Recebimento do 1º lote de chapas inspecionado e conforme norma NBR.',
      itens: [
        {
          pedidoCompraItemId: pedidoDemo.itens[0].id,
          quantidadeEntregue: 10,
          quantidadeAprovada: 10,
          quantidadeRejeitada: 0,
          numeroLoteUsina: 'LOT-USI-2026-891',
          numeroCorrida: 'CORR-9941',
          certificadoUsinaNumero: 'CERT-USI-891/26',
          almoxarifadoDestinoId: 'alm-chapas-tritech-01',
          localizacaoDestinoId: 'loc-rack-chapa-01',
        },
      ],
    });

    // 5. Histórico e IQF Inicial
    this.getOuCriarAvaliacaoFornecedor(empresaTritech, 'forn-usiminas-01', 'Usiminas Aços Especiais S.A.', '60.870.004/0001-40');
    this.getOuCriarAvaliacaoFornecedor(empresaTritech, 'forn-gerdau-03', 'Gerdau Aços Longos S.A.', '01.571.528/0001-80');
    this.getOuCriarAvaliacaoFornecedor(empresaTritech, 'forn-csn-02', 'Companhia Siderúrgica Nacional (CSN)', '33.042.730/0001-04');
    this.getOuCriarAvaliacaoFornecedor(empresaTritech, 'forn-aperam-04', 'Aperam South America Inox', '00.415.541/0001-90');
  }
}

export const comprasService = new ComprasService();
