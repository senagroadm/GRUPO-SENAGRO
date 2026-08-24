import crypto from 'crypto';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors';
import { logger } from '../../core/logger';
import {
  Orcamento,
  OrcamentoItem,
  OrcamentoVersao,
  HistoricoNegociacaoOrcamento,
  RegraAprovacaoOrcamento,
  ParametrosCustoEmpresa,
  StatusOrcamento,
} from './orcamento-types';
import { IndustrialCostEngine, PARAMETROS_PADRAO_EMPRESA } from './orcamento-cost-engine';

export class OrcamentoService {
  private orcamentos: Map<string, Orcamento> = new Map();
  private versoes: Map<string, OrcamentoVersao[]> = new Map(); // orcamentoId -> versoes[]
  private historico: Map<string, HistoricoNegociacaoOrcamento[]> = new Map(); // orcamentoId -> eventos[]
  private regrasAprovacao: Map<string, RegraAprovacaoOrcamento[]> = new Map(); // empresaId -> regras[]
  private parametrosEmpresa: Map<string, ParametrosCustoEmpresa> = new Map(); // empresaId -> params

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Inicializar parâmetros padrão
    Object.entries(PARAMETROS_PADRAO_EMPRESA).forEach(([empId, params]) => {
      this.parametrosEmpresa.set(empId, { ...params });
    });

    // Inicializar Regras de Aprovação Padrão
    const regrasTritech: RegraAprovacaoOrcamento[] = [
      {
        id: 'reg-01',
        empresaId: 'emp-tritech-corte',
        nome: 'Alçada Desconto Comercial > 5%',
        tipoGatilho: 'DESCONTO_EXCESSIVO',
        valorLimite: 5.0,
        nivelAprovadorNecessario: 'GERENTE_COMERCIAL',
        ativo: true,
      },
      {
        id: 'reg-02',
        empresaId: 'emp-tritech-corte',
        nome: 'Alçada Margem de Contribuição < 16%',
        tipoGatilho: 'MARGEM_INSUFICIENTE',
        valorLimite: 16.0,
        nivelAprovadorNecessario: 'DIRETOR_INDUSTRIAL',
        ativo: true,
      },
      {
        id: 'reg-03',
        empresaId: 'emp-tritech-corte',
        nome: 'Alçada Pedido Especial > R$ 150.000',
        tipoGatilho: 'VALOR_TOTAL_ALTO',
        valorLimite: 150000.0,
        nivelAprovadorNecessario: 'DIRETOR_GERAL',
        ativo: true,
      },
    ];
    this.regrasAprovacao.set('emp-tritech-corte', regrasTritech);

    // Orçamento 1: Produto Fabricado + Serviço (Chapas Cortadas e Dobradas em Inox)
    const orc1Id = 'orc-2026-0001';
    const paramsTritech = this.parametrosEmpresa.get('emp-tritech-corte') || PARAMETROS_PADRAO_EMPRESA.default;

    // Item 1: Produto Fabricado
    const item1Mat = IndustrialCostEngine.calcularCustoMaterial({
      tipoMaterial: 'AÇO INOX AISI 304',
      formato: 'CHAPA',
      especificacao: 'Chapa Inox 304 #3.00mm x 1500 x 3000',
      espessuraMm: 3.0,
      larguraMm: 1500,
      comprimentoMm: 3000,
      fatorPerdaAproveitamento: 1.15,
      parametros: paramsTritech,
    });
    const item1Corte = IndustrialCostEngine.calcularCustoCorte({
      processo: 'LASER_FIBRA',
      espessuraMm: 3.0,
      comprimentoCorteMetros: 28.5,
      numeroPerfuracoes: 42,
      parametros: paramsTritech,
    });
    const item1Dobra = IndustrialCostEngine.calcularCustoDobra({
      processo: 'CNC_SINCRONIZADA',
      espessuraMm: 3.0,
      comprimentoDobraMm: 1200,
      numeroDobras: 8,
      parametros: paramsTritech,
    });
    const item1Preco = IndustrialCostEngine.consolidarPrecoItem({
      tipoItem: 'PRODUTO_FABRICADO',
      custoMaterial: item1Mat,
      custoCorte: item1Corte,
      custoDobra: item1Dobra,
      margemLucroDesejadaPercentual: 26.0,
      descontoItemPercentual: 0,
      parametros: paramsTritech,
    });

    const item1: OrcamentoItem = {
      id: 'item-01',
      orcamentoId: orc1Id,
      sequencia: 1,
      tipoItem: 'PRODUTO_FABRICADO',
      codigoItem: 'FAB-CX-INOX-01',
      descricao: 'Gabinete Painel Elétrico Inox 304 Escovado 800x600x300mm com Reforços',
      ncm: '7326.90.90',
      unidadeMedida: 'UN',
      quantidade: 5,
      custoUnitario: item1Preco.custoUnitarioTotal,
      precoUnitarioMinimo: item1Preco.precoUnitarioMinimo,
      precoUnitarioSugerido: item1Preco.precoUnitarioSugerido,
      precoUnitarioFinal: item1Preco.precoUnitarioFinal,
      percentualDesconto: 0,
      valorDescontoUnitario: 0,
      subtotalCusto: Number((item1Preco.custoUnitarioTotal * 5).toFixed(2)),
      subtotalFinal: Number((item1Preco.precoUnitarioFinal * 5).toFixed(2)),
      margemContribuicaoValor: Number((item1Preco.valorMargemLucro * 5).toFixed(2)),
      margemContribuicaoPercentual: item1Preco.margemLucroPercentual,
      composicaoCusto: item1Preco,
      desenhoReferencia: 'DWG-PAINEL-EL-REV3.PDF',
      detalhesTecnicos: 'Corte a Laser Fibra Óptica, dobra em CNC e rebaixo para vedação de borracha EPDM.',
    };

    // Item 2: Serviço Puro de Corte e Dobra
    const item2Corte = IndustrialCostEngine.calcularCustoCorte({
      processo: 'LASER_FIBRA',
      espessuraMm: 6.35,
      comprimentoCorteMetros: 64.0,
      numeroPerfuracoes: 80,
      parametros: paramsTritech,
    });
    const item2Dobra = IndustrialCostEngine.calcularCustoDobra({
      processo: 'CNC_SINCRONIZADA',
      espessuraMm: 6.35,
      comprimentoDobraMm: 2000,
      numeroDobras: 16,
      parametros: paramsTritech,
    });
    const item2Preco = IndustrialCostEngine.consolidarPrecoItem({
      tipoItem: 'SERVICO',
      custoCorte: item2Corte,
      custoDobra: item2Dobra,
      margemLucroDesejadaPercentual: 30.0,
      descontoItemPercentual: 5.0,
      parametros: paramsTritech,
    });

    const item2: OrcamentoItem = {
      id: 'item-02',
      orcamentoId: orc1Id,
      sequencia: 2,
      tipoItem: 'SERVICO',
      codigoItem: 'SRV-LASER-DOBRA-02',
      descricao: 'Serviço de Corte a Laser Fibra 6kW e Dobra CNC em Chapas de Terceiros #6.35mm',
      ncm: '8466.93.90',
      unidadeMedida: 'SERVICO',
      quantidade: 1,
      custoUnitario: item2Preco.custoUnitarioTotal,
      precoUnitarioMinimo: item2Preco.precoUnitarioMinimo,
      precoUnitarioSugerido: item2Preco.precoUnitarioSugerido,
      precoUnitarioFinal: item2Preco.precoUnitarioFinal,
      percentualDesconto: 5.0,
      valorDescontoUnitario: Number((item2Preco.precoUnitarioSugerido * 0.05).toFixed(2)),
      subtotalCusto: item2Preco.custoUnitarioTotal,
      subtotalFinal: item2Preco.precoUnitarioFinal,
      margemContribuicaoValor: item2Preco.valorMargemLucro,
      margemContribuicaoPercentual: item2Preco.margemLucroPercentual,
      composicaoCusto: item2Preco,
      desenhoReferencia: 'DXF-SUPORTES-BASE-LOTE12.DXF',
      detalhesTecnicos: 'Material fornecido pelo cliente. Tolerâncias dimensionais conforme ISO 2768-m.',
    };

    const orc1Itens = [item1, item2];
    const orc1CustoTotal = Number(orc1Itens.reduce((acc, it) => acc + it.subtotalCusto, 0).toFixed(2));
    const orc1PrecoSugerido = Number(orc1Itens.reduce((acc, it) => acc + it.precoUnitarioSugerido * it.quantidade, 0).toFixed(2));
    const orc1PrecoFinal = Number(orc1Itens.reduce((acc, it) => acc + it.subtotalFinal, 0).toFixed(2));
    const orc1PrecoMinimo = Number(orc1Itens.reduce((acc, it) => acc + it.precoUnitarioMinimo * it.quantidade, 0).toFixed(2));
    const orc1DescontoTotal = Number((orc1PrecoSugerido - orc1PrecoFinal).toFixed(2));
    const orc1PercDesconto = orc1PrecoSugerido > 0 ? Number(((orc1DescontoTotal / orc1PrecoSugerido) * 100).toFixed(2)) : 0;
    const orc1MargemValor = Number(orc1Itens.reduce((acc, it) => acc + it.margemContribuicaoValor, 0).toFixed(2));
    const orc1MargemPerc = orc1PrecoFinal > 0 ? Number(((orc1MargemValor / orc1PrecoFinal) * 100).toFixed(2)) : 0;
    const orc1Impostos = Number(
      orc1Itens.reduce((acc, it) => acc + (it.composicaoCusto?.valorImpostosEstimados || 0) * it.quantidade, 0).toFixed(2)
    );

    const orc1: Orcamento = {
      id: orc1Id,
      empresaId: 'emp-tritech-corte',
      numeroOrcamento: 'ORC-2026-0001',
      versaoAtual: 1,
      codigoIdentificacao: 'ORC-2026-0001-REV01',
      tituloProjeto: 'Fornecimento de Painéis Inox 304 e Serviços de Corte/Dobra',
      clienteId: 'cli-agro-01',
      clienteNome: 'AgroMáquinas do Centro-Oeste S.A.',
      clienteCnpj: '48.920.114/0001-82',
      contatoNome: 'Eng. Ricardo Silveira',
      contatoEmail: 'ricardo.silveira@agromaquinas.ind.br',
      contatoTelefone: '(62) 99872-4411',
      vendedorId: 'usr-vend-01',
      vendedorNome: 'Marcos Vinícius (Comercial Técnico)',
      vendedorEmail: 'marcos.vendas@tritech.ind.br',
      status: 'APROVADO',
      exigeAprovacao: false,
      aprovadorId: 'usr-ger-01',
      aprovadorNome: 'Carlos Eduardo (Gerente Comercial)',
      dataAprovacao: new Date(Date.now() - 86400000).toISOString(),
      justificativaAprovacao: 'Margem de contribuição dentro do target (26.8%) e desconto de 5% em alçada regular.',
      dataEmissao: new Date(Date.now() - 172800000).toISOString().split('T')[0],
      validadeDias: 15,
      dataValidade: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      prazoEntregaDias: 10,
      condicaoPagamento: '28 / 42 dias no boleto bancário',
      tipoFrete: 'FOB',
      valorFrete: 0,
      localEntregaCidade: 'Anápolis',
      localEntregaUf: 'GO',
      quantidadeItens: 2,
      custoTotalEstimado: orc1CustoTotal,
      precoMinimoTotal: orc1PrecoMinimo,
      precoSugeridoTotal: orc1PrecoSugerido,
      precoFinalTotal: orc1PrecoFinal,
      valorDescontoTotal: orc1DescontoTotal,
      percentualDescontoTotal: orc1PercDesconto,
      impostosEstimadosTotais: orc1Impostos,
      comissaoEstimadaTotal: Number((orc1PrecoFinal * 0.035).toFixed(2)),
      margemLucroEstimadaValor: orc1MargemValor,
      margemLucroEstimadaPercentual: orc1MargemPerc,
      observacoesGerais:
        'Itens inspecionados com controle dimensional por braço tridimensional. Certificados de matéria-prima Inox 304 com rastreabilidade de usina inclusos.',
      observacoesInternas: 'Prioridade na esteira do laser fibra #6kW no turno 1.',
      garantiaMeses: 12,
      anexosIds: [],
      itens: orc1Itens,
      criadoPorId: 'usr-vend-01',
      criadoPorNome: 'Marcos Vinícius',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    };

    this.orcamentos.set(orc1Id, orc1);

    // Versão 1 de orc1
    const v1: OrcamentoVersao = {
      id: 'ver-01',
      orcamentoId: orc1Id,
      numeroVersao: 1,
      codigoVersao: 'ORC-2026-0001-REV01',
      dataVersao: orc1.createdAt,
      autorId: orc1.criadoPorId,
      autorNome: orc1.criadoPorNome,
      motivoRevisao: 'Emissão inicial da proposta técnica e comercial.',
      itensSnapshot: orc1Itens,
      resumoFinanceiro: {
        custoTotal: orc1CustoTotal,
        precoSugeridoTotal: orc1PrecoSugerido,
        precoFinalTotal: orc1PrecoFinal,
        valorDescontoTotal: orc1DescontoTotal,
        percentualDescontoTotal: orc1PercDesconto,
        margemLucroTotalPercentual: orc1MargemPerc,
        margemLucroTotalValor: orc1MargemValor,
        impostosTotais: orc1Impostos,
      },
      criadoEm: orc1.createdAt,
    };
    this.versoes.set(orc1Id, [v1]);

    // Histórico de negociação de orc1
    const histOrc1: HistoricoNegociacaoOrcamento[] = [
      {
        id: 'hist-01',
        orcamentoId: orc1Id,
        data: new Date(Date.now() - 172800000).toISOString(),
        usuarioId: 'usr-vend-01',
        usuarioNome: 'Marcos Vinícius',
        tipoEvento: 'CRIACAO',
        descricao: 'Criação do orçamento técnico com 2 itens (Fabricado + Serviço Laser).',
      },
      {
        id: 'hist-02',
        orcamentoId: orc1Id,
        data: new Date(Date.now() - 86400000).toISOString(),
        usuarioId: 'usr-ger-01',
        usuarioNome: 'Carlos Eduardo',
        tipoEvento: 'APROVACAO_CONCEDIDA',
        descricao: 'Proposta aprovada para envio ao cliente com margem de 26.8%.',
      },
    ];
    this.historico.set(orc1Id, histOrc1);

    // Orçamento 2: Produto Fabricado Complexo em Caldeiraria (MWAM) com Solda, Pintura e Montagem
    const orc2Id = 'orc-2026-0002';
    const paramsMwam = this.parametrosEmpresa.get('emp-mwam') || PARAMETROS_PADRAO_EMPRESA.default;

    const item2_1Mat = IndustrialCostEngine.calcularCustoMaterial({
      tipoMaterial: 'AÇO ESTRUTURAL ASTM A36',
      formato: 'CHAPA',
      espessuraMm: 9.52,
      larguraMm: 2000,
      comprimentoMm: 6000,
      fatorPerdaAproveitamento: 1.18,
      parametros: paramsMwam,
    });
    const item2_1Corte = IndustrialCostEngine.calcularCustoCorte({
      processo: 'PLASMA_HD',
      espessuraMm: 9.52,
      comprimentoCorteMetros: 45.0,
      numeroPerfuracoes: 32,
      parametros: paramsMwam,
    });
    const item2_1Solda = IndustrialCostEngine.calcularCustoSolda({
      processo: 'MIG_MAG',
      tipoJunta: 'Junta em Ângulo T Filete 6mm',
      comprimentoSoldaMm: 12000,
      pernaSoldaMm: 6.0,
      parametros: paramsMwam,
    });
    const item2_1Pintura = IndustrialCostEngine.calcularCustoPintura({
      processo: 'LIQUIDA_PU_EPOXI',
      areaPinturaM2: 18.5,
      numeroDemaos: 2,
      parametros: paramsMwam,
    });
    const item2_1Montagem = IndustrialCostEngine.calcularCustoMontagem({
      horasMontador: 6.5,
      insumosFixacaoValor: 280.0,
      parametros: paramsMwam,
    });

    const item2_1Preco = IndustrialCostEngine.consolidarPrecoItem({
      tipoItem: 'PRODUTO_FABRICADO',
      custoMaterial: item2_1Mat,
      custoCorte: item2_1Corte,
      custoSolda: item2_1Solda,
      custoPintura: item2_1Pintura,
      custoMontagem: item2_1Montagem,
      margemLucroDesejadaPercentual: 28.0,
      parametros: paramsMwam,
    });

    const item2_1: OrcamentoItem = {
      id: 'item-201',
      orcamentoId: orc2Id,
      sequencia: 1,
      tipoItem: 'PRODUTO_FABRICADO',
      codigoItem: 'FAB-ESTR-SILO-01',
      descricao: 'Estrutura Suporte Metálica para Silo Graneleiro 50t com Pintura Epóxi/PU',
      ncm: '7308.90.10',
      unidadeMedida: 'UN',
      quantidade: 2,
      custoUnitario: item2_1Preco.custoUnitarioTotal,
      precoUnitarioMinimo: item2_1Preco.precoUnitarioMinimo,
      precoUnitarioSugerido: item2_1Preco.precoUnitarioSugerido,
      precoUnitarioFinal: item2_1Preco.precoUnitarioFinal,
      percentualDesconto: 0,
      valorDescontoUnitario: 0,
      subtotalCusto: Number((item2_1Preco.custoUnitarioTotal * 2).toFixed(2)),
      subtotalFinal: Number((item2_1Preco.precoUnitarioFinal * 2).toFixed(2)),
      margemContribuicaoValor: Number((item2_1Preco.valorMargemLucro * 2).toFixed(2)),
      margemContribuicaoPercentual: item2_1Preco.margemLucroPercentual,
      composicaoCusto: item2_1Preco,
      desenhoReferencia: 'PROJ-CALD-SILO-50T-R02.PDF',
      detalhesTecnicos:
        'Corte em Plasma HD, soldagem MIG/MAG qualificada conforme AWS D1.1, pintura epóxi dupla camada e pré-montagem em fábrica.',
    };

    const orc2Itens = [item2_1];
    const orc2CustoTotal = Number(orc2Itens.reduce((acc, it) => acc + it.subtotalCusto, 0).toFixed(2));
    const orc2PrecoSugerido = Number(orc2Itens.reduce((acc, it) => acc + it.precoUnitarioSugerido * it.quantidade, 0).toFixed(2));
    const orc2PrecoFinal = Number(orc2Itens.reduce((acc, it) => acc + it.subtotalFinal, 0).toFixed(2));
    const orc2PrecoMinimo = Number(orc2Itens.reduce((acc, it) => acc + it.precoUnitarioMinimo * it.quantidade, 0).toFixed(2));
    const orc2DescontoTotal = 0;
    const orc2PercDesconto = 0;
    const orc2MargemValor = Number(orc2Itens.reduce((acc, it) => acc + it.margemContribuicaoValor, 0).toFixed(2));
    const orc2MargemPerc = orc2PrecoFinal > 0 ? Number(((orc2MargemValor / orc2PrecoFinal) * 100).toFixed(2)) : 0;
    const orc2Impostos = Number(
      orc2Itens.reduce((acc, it) => acc + (it.composicaoCusto?.valorImpostosEstimados || 0) * it.quantidade, 0).toFixed(2)
    );

    const orc2: Orcamento = {
      id: orc2Id,
      empresaId: 'emp-mwam',
      numeroOrcamento: 'ORC-2026-0002',
      versaoAtual: 1,
      codigoIdentificacao: 'ORC-2026-0002-REV01',
      tituloProjeto: 'Fabricação de Estruturas Metálicas de Sustentação de Silos',
      clienteId: 'cli-ind-02',
      clienteNome: 'Construtora e Montagens Industriais Vale do Rio Vermelho',
      clienteCnpj: '19.832.771/0001-44',
      contatoNome: 'Diretor Roberto Albuquerque',
      contatoEmail: 'roberto@valedoriovermelho.eng.br',
      contatoTelefone: '(62) 3211-9988',
      vendedorId: 'usr-vend-02',
      vendedorNome: 'Juliana Ferreira (Engenharia de Vendas)',
      vendedorEmail: 'juliana.vendas@mwam.com.br',
      status: 'ENVIADO_CLIENTE',
      exigeAprovacao: false,
      dataEmissao: new Date(Date.now() - 43200000).toISOString().split('T')[0],
      validadeDias: 10,
      dataValidade: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      prazoEntregaDias: 20,
      condicaoPagamento: '40% Sinal + 30% Pronto Fábrica + 30% 30 DDL',
      tipoFrete: 'CIF',
      valorFrete: 1850.0,
      localEntregaCidade: 'Rio Verde',
      localEntregaUf: 'GO',
      quantidadeItens: 1,
      custoTotalEstimado: orc2CustoTotal,
      precoMinimoTotal: orc2PrecoMinimo,
      precoSugeridoTotal: orc2PrecoSugerido,
      precoFinalTotal: orc2PrecoFinal,
      valorDescontoTotal: orc2DescontoTotal,
      percentualDescontoTotal: orc2PercDesconto,
      impostosEstimadosTotais: orc2Impostos,
      comissaoEstimadaTotal: Number((orc2PrecoFinal * 0.04).toFixed(2)),
      margemLucroEstimadaValor: orc2MargemValor,
      margemLucroEstimadaPercentual: orc2MargemPerc,
      observacoesGerais:
        'Incluso laudo de ensaio não-destrutivo por líquido penetrante (LP) nas juntas soldadas críticas. Montagem em campo não inclusa.',
      observacoesInternas: 'Verificar disponibilidade de estufa de pintura para peças de 6 metros.',
      garantiaMeses: 24,
      anexosIds: [],
      itens: orc2Itens,
      criadoPorId: 'usr-vend-02',
      criadoPorNome: 'Juliana Ferreira',
      createdAt: new Date(Date.now() - 43200000).toISOString(),
      updatedAt: new Date(Date.now() - 43200000).toISOString(),
    };

    this.orcamentos.set(orc2Id, orc2);
    this.versoes.set(orc2Id, [
      {
        id: 'ver-02',
        orcamentoId: orc2Id,
        numeroVersao: 1,
        codigoVersao: 'ORC-2026-0002-REV01',
        dataVersao: orc2.createdAt,
        autorId: orc2.criadoPorId,
        autorNome: orc2.criadoPorNome,
        motivoRevisao: 'Emissão inicial com detalhamento de corte plasma, solda e pintura epóxi.',
        itensSnapshot: orc2Itens,
        resumoFinanceiro: {
          custoTotal: orc2CustoTotal,
          precoSugeridoTotal: orc2PrecoSugerido,
          precoFinalTotal: orc2PrecoFinal,
          valorDescontoTotal: 0,
          percentualDescontoTotal: 0,
          margemLucroTotalPercentual: orc2MargemPerc,
          margemLucroTotalValor: orc2MargemValor,
          impostosTotais: orc2Impostos,
        },
        criadoEm: orc2.createdAt,
      },
    ]);
  }

  /**
   * Lista orçamentos com filtros estritos por tenant/empresa
   */
  listarOrcamentos(filtros: {
    empresaId: string;
    status?: StatusOrcamento;
    clienteNome?: string;
    vendedorId?: string;
    busca?: string;
    page?: number;
    limit?: number;
  }): {
    items: Orcamento[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    kpis: {
      totalOrcado: number;
      totalAprovados: number;
      totalPendentes: number;
      taxaConversao: number;
      ticketMedio: number;
    };
  } {
    if (!filtros.empresaId) {
      throw new BadRequestError('Empresa ID é estritamente obrigatório para listar orçamentos', {
        code: 'ORCAMENTO_MISSING_TENANT',
      });
    }

    let list = Array.from(this.orcamentos.values()).filter((o) => o.empresaId === filtros.empresaId);

    if (filtros.status) {
      list = list.filter((o) => o.status === filtros.status);
    }
    if (filtros.clienteNome) {
      const q = filtros.clienteNome.toLowerCase();
      list = list.filter((o) => o.clienteNome.toLowerCase().includes(q) || o.clienteCnpj.includes(q));
    }
    if (filtros.vendedorId) {
      list = list.filter((o) => o.vendedorId === filtros.vendedorId);
    }
    if (filtros.busca) {
      const term = filtros.busca.toLowerCase();
      list = list.filter(
        (o) =>
          o.numeroOrcamento.toLowerCase().includes(term) ||
          o.tituloProjeto.toLowerCase().includes(term) ||
          o.clienteNome.toLowerCase().includes(term) ||
          o.codigoIdentificacao.toLowerCase().includes(term) ||
          o.vendedorNome.toLowerCase().includes(term)
      );
    }

    // Ordenar decrescente por data de emissão/criação
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // KPIs consolidados do tenant
    const allCompanyOrcs = Array.from(this.orcamentos.values()).filter((o) => o.empresaId === filtros.empresaId);
    const totalOrcado = allCompanyOrcs.reduce((acc, o) => acc + o.precoFinalTotal, 0);
    const ganhosEAprovados = allCompanyOrcs.filter((o) => o.status === 'APROVADO' || o.status === 'GANHO');
    const totalAprovados = ganhosEAprovados.reduce((acc, o) => acc + o.precoFinalTotal, 0);
    const totalPendentes = allCompanyOrcs
      .filter((o) => o.status === 'PENDENTE_APROVACAO' || o.status === 'EM_ANALISE_TECNICA' || o.status === 'EM_NEGOCIACAO')
      .reduce((acc, o) => acc + o.precoFinalTotal, 0);

    const taxaConversao = allCompanyOrcs.length > 0 ? Number(((ganhosEAprovados.length / allCompanyOrcs.length) * 100).toFixed(1)) : 0;
    const ticketMedio = allCompanyOrcs.length > 0 ? Number((totalOrcado / allCompanyOrcs.length).toFixed(2)) : 0;

    const page = filtros.page || 1;
    const limit = filtros.limit || 20;
    const startIndex = (page - 1) * limit;
    const pagedItems = list.slice(startIndex, startIndex + limit);

    return {
      items: pagedItems,
      total: list.length,
      page,
      limit,
      totalPages: Math.ceil(list.length / limit) || 1,
      kpis: {
        totalOrcado: Number(totalOrcado.toFixed(2)),
        totalAprovados: Number(totalAprovados.toFixed(2)),
        totalPendentes: Number(totalPendentes.toFixed(2)),
        taxaConversao,
        ticketMedio,
      },
    };
  }

  /**
   * Obtém detalhes de um orçamento por ID com isolamento de tenant
   */
  getOrcamentoById(orcamentoId: string, empresaId: string): Orcamento {
    const orc = this.orcamentos.get(orcamentoId);
    if (!orc || orc.empresaId !== empresaId) {
      throw new NotFoundError('Orçamento não encontrado ou acesso negado');
    }
    return orc;
  }

  /**
   * Cria um novo orçamento
   */
  criarOrcamento(
    dados: {
      empresaId: string;
      tituloProjeto: string;
      clienteId: string;
      clienteNome: string;
      clienteCnpj: string;
      contatoNome: string;
      contatoEmail: string;
      contatoTelefone?: string;
      vendedorId: string;
      vendedorNome: string;
      vendedorEmail: string;
      validadeDias?: number;
      prazoEntregaDias?: number;
      condicaoPagamento?: string;
      tipoFrete?: 'CIF' | 'FOB' | 'RETIRA' | 'SEM_FRETE';
      valorFrete?: number;
      localEntregaCidade?: string;
      localEntregaUf?: string;
      observacoesGerais?: string;
      observacoesInternas?: string;
      garantiaMeses?: number;
      itens: Partial<OrcamentoItem>[];
    },
    usuarioCriador: { id: string; nome: string }
  ): Orcamento {
    if (!dados.empresaId) throw new BadRequestError('Empresa ID é obrigatório', { code: 'ORCAMENTO_MISSING_TENANT' });
    if (!dados.clienteNome || !dados.tituloProjeto) {
      throw new BadRequestError('Nome do cliente e título do projeto são obrigatórios', { code: 'ORCAMENTO_INVALID_INPUT' });
    }
    if (!dados.itens || dados.itens.length === 0) {
      throw new BadRequestError('O orçamento deve conter pelo menos 1 item', { code: 'ORCAMENTO_NO_ITEMS' });
    }

    const orcId = `orc-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const seqNum = this.orcamentos.size + 1;
    const numeroOrcamento = `ORC-${new Date().getFullYear()}-${String(seqNum).padStart(4, '0')}`;
    const versaoAtual = 1;
    const codigoIdentificacao = `${numeroOrcamento}-REV01`;

    const paramsEmpresa = this.parametrosEmpresa.get(dados.empresaId) || PARAMETROS_PADRAO_EMPRESA.default;

    // Processar e consolidar cada item
    const itensProcessados: OrcamentoItem[] = dados.itens.map((it, idx) => {
      const itemId = it.id || `item-${Date.now()}-${idx + 1}`;
      const qtd = it.quantidade && it.quantidade > 0 ? it.quantidade : 1;
      const custoUnit = it.custoUnitario || (it.composicaoCusto ? it.composicaoCusto.custoUnitarioTotal : 100);
      const precoSugerido = it.precoUnitarioSugerido || (it.composicaoCusto ? it.composicaoCusto.precoUnitarioSugerido : custoUnit * 1.35);
      const descontoPerc = it.percentualDesconto || 0;
      const valorDescUnit = Number((precoSugerido * (descontoPerc / 100)).toFixed(2));
      const precoFinal = it.precoUnitarioFinal || Number((precoSugerido - valorDescUnit).toFixed(2));
      const precoMinimo = it.precoUnitarioMinimo || (it.composicaoCusto ? it.composicaoCusto.precoUnitarioMinimo : custoUnit * 1.18);

      const subtotalCusto = Number((custoUnit * qtd).toFixed(2));
      const subtotalFinal = Number((precoFinal * qtd).toFixed(2));
      const margemValor = Number((subtotalFinal - subtotalCusto).toFixed(2));
      const margemPerc = subtotalFinal > 0 ? Number(((margemValor / subtotalFinal) * 100).toFixed(2)) : 0;

      return {
        id: itemId,
        orcamentoId: orcId,
        sequencia: idx + 1,
        tipoItem: it.tipoItem || 'PRODUTO_FABRICADO',
        codigoItem: it.codigoItem || `ITEM-${String(idx + 1).padStart(2, '0')}`,
        descricao: it.descricao || 'Item Industrial Customizado',
        ncm: it.ncm || '7326.90.90',
        unidadeMedida: it.unidadeMedida || 'UN',
        quantidade: qtd,
        custoUnitario: custoUnit,
        precoUnitarioMinimo: precoMinimo,
        precoUnitarioSugerido: precoSugerido,
        precoUnitarioFinal: precoFinal,
        percentualDesconto: descontoPerc,
        valorDescontoUnitario: valorDescUnit,
        subtotalCusto,
        subtotalFinal,
        margemContribuicaoValor: margemValor,
        margemContribuicaoPercentual: margemPerc,
        composicaoCusto: it.composicaoCusto,
        desenhoReferencia: it.desenhoReferencia,
        detalhesTecnicos: it.detalhesTecnicos,
      };
    });

    const custoTotal = Number(itensProcessados.reduce((acc, it) => acc + it.subtotalCusto, 0).toFixed(2));
    const precoSugeridoTotal = Number(itensProcessados.reduce((acc, it) => acc + it.precoUnitarioSugerido * it.quantidade, 0).toFixed(2));
    const precoFinalTotal = Number(itensProcessados.reduce((acc, it) => acc + it.subtotalFinal, 0).toFixed(2));
    const precoMinimoTotal = Number(itensProcessados.reduce((acc, it) => acc + it.precoUnitarioMinimo * it.quantidade, 0).toFixed(2));
    const valorDescontoTotal = Number((precoSugeridoTotal - precoFinalTotal).toFixed(2));
    const percDescontoTotal = precoSugeridoTotal > 0 ? Number(((valorDescontoTotal / precoSugeridoTotal) * 100).toFixed(2)) : 0;
    const margemLucroValor = Number((precoFinalTotal - custoTotal).toFixed(2));
    const margemLucroPerc = precoFinalTotal > 0 ? Number(((margemLucroValor / precoFinalTotal) * 100).toFixed(2)) : 0;
    const impostosTotais = Number(
      itensProcessados.reduce((acc, it) => acc + (it.composicaoCusto?.valorImpostosEstimados || 0) * it.quantidade, 0).toFixed(2)
    );

    // Avaliação automática de regras de aprovação
    let exigeAprovacao = false;
    let motivoExigencia = '';

    if (margemLucroPerc < paramsEmpresa.margemLucroMinimaPermitida) {
      exigeAprovacao = true;
      motivoExigencia = `Margem de lucro estimada (${margemLucroPerc}%) inferior à mínima permitida (${paramsEmpresa.margemLucroMinimaPermitida}%).`;
    } else if (percDescontoTotal > paramsEmpresa.limiteDescontoVendedorPercentual) {
      exigeAprovacao = true;
      motivoExigencia = `Desconto concedido (${percDescontoTotal}%) excede alçada do vendedor (${paramsEmpresa.limiteDescontoVendedorPercentual}%).`;
    }

    const dataEmissao = new Date().toISOString().split('T')[0];
    const valDias = dados.validadeDias || 15;
    const dataValidade = new Date(Date.now() + valDias * 86400000).toISOString().split('T')[0];

    const novoOrcamento: Orcamento = {
      id: orcId,
      empresaId: dados.empresaId,
      numeroOrcamento,
      versaoAtual,
      codigoIdentificacao,
      tituloProjeto: dados.tituloProjeto,
      clienteId: dados.clienteId || 'cli-generic',
      clienteNome: dados.clienteNome,
      clienteCnpj: dados.clienteCnpj || '00.000.000/0001-00',
      contatoNome: dados.contatoNome || '',
      contatoEmail: dados.contatoEmail || '',
      contatoTelefone: dados.contatoTelefone,
      vendedorId: dados.vendedorId || usuarioCriador.id,
      vendedorNome: dados.vendedorNome || usuarioCriador.nome,
      vendedorEmail: dados.vendedorEmail || '',
      status: exigeAprovacao ? 'PENDENTE_APROVACAO' : 'RASCUNHO',
      exigeAprovacao,
      motivoExigenciaAprovacao: motivoExigencia || undefined,
      dataEmissao,
      validadeDias: valDias,
      dataValidade,
      prazoEntregaDias: dados.prazoEntregaDias || 15,
      condicaoPagamento: dados.condicaoPagamento || '30 DDL Boleto',
      tipoFrete: dados.tipoFrete || 'FOB',
      valorFrete: dados.valorFrete || 0,
      localEntregaCidade: dados.localEntregaCidade,
      localEntregaUf: dados.localEntregaUf,
      quantidadeItens: itensProcessados.length,
      custoTotalEstimado: custoTotal,
      precoMinimoTotal,
      precoSugeridoTotal,
      precoFinalTotal,
      valorDescontoTotal,
      percentualDescontoTotal: percDescontoTotal,
      impostosEstimadosTotais: impostosTotais,
      comissaoEstimadaTotal: Number((precoFinalTotal * (paramsEmpresa.aliquotaComissaoPadrao / 100)).toFixed(2)),
      margemLucroEstimadaValor: margemLucroValor,
      margemLucroEstimadaPercentual: margemLucroPerc,
      observacoesGerais: dados.observacoesGerais || 'Proposta técnica e comercial em conformidade com as normas ABNT aplicáveis.',
      observacoesInternas: dados.observacoesInternas,
      garantiaMeses: dados.garantiaMeses || 12,
      anexosIds: [],
      itens: itensProcessados,
      criadoPorId: usuarioCriador.id,
      criadoPorNome: usuarioCriador.nome,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.orcamentos.set(orcId, novoOrcamento);

    // Gravar Versão 1 Snapshot
    const v1Snapshot: OrcamentoVersao = {
      id: `ver-${Date.now()}-1`,
      orcamentoId: orcId,
      numeroVersao: 1,
      codigoVersao: codigoIdentificacao,
      dataVersao: novoOrcamento.createdAt,
      autorId: usuarioCriador.id,
      autorNome: usuarioCriador.nome,
      motivoRevisao: 'Emissão inicial da proposta.',
      itensSnapshot: itensProcessados,
      resumoFinanceiro: {
        custoTotal,
        precoSugeridoTotal,
        precoFinalTotal,
        valorDescontoTotal,
        percentualDescontoTotal: percDescontoTotal,
        margemLucroTotalPercentual: margemLucroPerc,
        margemLucroTotalValor: margemLucroValor,
        impostosTotais,
      },
      criadoEm: novoOrcamento.createdAt,
    };
    this.versoes.set(orcId, [v1Snapshot]);

    // Registrar histórico
    this.registrarEventoNegociacao({
      orcamentoId: orcId,
      usuarioId: usuarioCriador.id,
      usuarioNome: usuarioCriador.nome,
      tipoEvento: 'CRIACAO',
      descricao: `Criação do orçamento com ${itensProcessados.length} itens. Total: R$ ${precoFinalTotal.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
      })}.`,
      dadosNovos: { precoFinalTotal, margemLucroPerc, exigeAprovacao },
    });

    logger.info('Novo orçamento criado com sucesso', { orcamentoId: orcId, empresaId: dados.empresaId });
    return novoOrcamento;
  }

  /**
   * Atualiza dados de um orçamento existente
   */
  atualizarOrcamento(
    orcamentoId: string,
    empresaId: string,
    dados: Partial<Orcamento>,
    usuario: { id: string; nome: string }
  ): Orcamento {
    const orc = this.getOrcamentoById(orcamentoId, empresaId);

    if (dados.tituloProjeto) orc.tituloProjeto = dados.tituloProjeto;
    if (dados.clienteNome) orc.clienteNome = dados.clienteNome;
    if (dados.clienteCnpj) orc.clienteCnpj = dados.clienteCnpj;
    if (dados.contatoNome) orc.contatoNome = dados.contatoNome;
    if (dados.contatoEmail) orc.contatoEmail = dados.contatoEmail;
    if (dados.contatoTelefone !== undefined) orc.contatoTelefone = dados.contatoTelefone;
    if (dados.prazoEntregaDias !== undefined) orc.prazoEntregaDias = dados.prazoEntregaDias;
    if (dados.validadeDias !== undefined) {
      orc.validadeDias = dados.validadeDias;
      orc.dataValidade = new Date(new Date(orc.dataEmissao).getTime() + dados.validadeDias * 86400000).toISOString().split('T')[0];
    }
    if (dados.condicaoPagamento) orc.condicaoPagamento = dados.condicaoPagamento;
    if (dados.tipoFrete) orc.tipoFrete = dados.tipoFrete;
    if (dados.valorFrete !== undefined) orc.valorFrete = dados.valorFrete;
    if (dados.localEntregaCidade !== undefined) orc.localEntregaCidade = dados.localEntregaCidade;
    if (dados.localEntregaUf !== undefined) orc.localEntregaUf = dados.localEntregaUf;
    if (dados.observacoesGerais !== undefined) orc.observacoesGerais = dados.observacoesGerais;
    if (dados.observacoesInternas !== undefined) orc.observacoesInternas = dados.observacoesInternas;
    if (dados.status) orc.status = dados.status;

    // Se itens foram atualizados
    if (dados.itens && Array.isArray(dados.itens)) {
      orc.itens = dados.itens;
      orc.quantidadeItens = dados.itens.length;
      orc.custoTotalEstimado = Number(dados.itens.reduce((acc, it) => acc + it.subtotalCusto, 0).toFixed(2));
      orc.precoSugeridoTotal = Number(
        dados.itens.reduce((acc, it) => acc + it.precoUnitarioSugerido * it.quantidade, 0).toFixed(2)
      );
      orc.precoFinalTotal = Number(dados.itens.reduce((acc, it) => acc + it.subtotalFinal, 0).toFixed(2));
      orc.precoMinimoTotal = Number(dados.itens.reduce((acc, it) => acc + it.precoUnitarioMinimo * it.quantidade, 0).toFixed(2));
      orc.valorDescontoTotal = Number((orc.precoSugeridoTotal - orc.precoFinalTotal).toFixed(2));
      orc.percentualDescontoTotal =
        orc.precoSugeridoTotal > 0 ? Number(((orc.valorDescontoTotal / orc.precoSugeridoTotal) * 100).toFixed(2)) : 0;
      orc.margemLucroEstimadaValor = Number((orc.precoFinalTotal - orc.custoTotalEstimado).toFixed(2));
      orc.margemLucroEstimadaPercentual =
        orc.precoFinalTotal > 0 ? Number(((orc.margemLucroEstimadaValor / orc.precoFinalTotal) * 100).toFixed(2)) : 0;
    }

    orc.updatedAt = new Date().toISOString();

    this.registrarEventoNegociacao({
      orcamentoId: orc.id,
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      tipoEvento: 'ALTERACAO_PRECO',
      descricao: `Atualização de dados e valores do orçamento. Novo total: R$ ${orc.precoFinalTotal.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
      })}.`,
    });

    return orc;
  }

  /**
   * Cria uma nova versão / revisão (ex: v1 -> v2) preservando histórico do snapshot
   */
  criarNovaVersao(
    orcamentoId: string,
    empresaId: string,
    motivoRevisao: string,
    novosItens: OrcamentoItem[],
    usuario: { id: string; nome: string }
  ): { orcamento: Orcamento; versao: OrcamentoVersao } {
    const orc = this.getOrcamentoById(orcamentoId, empresaId);

    const novaVersaoNum = orc.versaoAtual + 1;
    const codigoVersao = `${orc.numeroOrcamento}-REV${String(novaVersaoNum).padStart(2, '0')}`;

    orc.versaoAtual = novaVersaoNum;
    orc.codigoIdentificacao = codigoVersao;
    orc.itens = novosItens;
    orc.quantidadeItens = novosItens.length;
    orc.custoTotalEstimado = Number(novosItens.reduce((acc, it) => acc + it.subtotalCusto, 0).toFixed(2));
    orc.precoSugeridoTotal = Number(novosItens.reduce((acc, it) => acc + it.precoUnitarioSugerido * it.quantidade, 0).toFixed(2));
    orc.precoFinalTotal = Number(novosItens.reduce((acc, it) => acc + it.subtotalFinal, 0).toFixed(2));
    orc.precoMinimoTotal = Number(novosItens.reduce((acc, it) => acc + it.precoUnitarioMinimo * it.quantidade, 0).toFixed(2));
    orc.valorDescontoTotal = Number((orc.precoSugeridoTotal - orc.precoFinalTotal).toFixed(2));
    orc.percentualDescontoTotal =
      orc.precoSugeridoTotal > 0 ? Number(((orc.valorDescontoTotal / orc.precoSugeridoTotal) * 100).toFixed(2)) : 0;
    orc.margemLucroEstimadaValor = Number((orc.precoFinalTotal - orc.custoTotalEstimado).toFixed(2));
    orc.margemLucroEstimadaPercentual =
      orc.precoFinalTotal > 0 ? Number(((orc.margemLucroEstimadaValor / orc.precoFinalTotal) * 100).toFixed(2)) : 0;
    orc.updatedAt = new Date().toISOString();

    const snapshotVersao: OrcamentoVersao = {
      id: `ver-${Date.now()}-${novaVersaoNum}`,
      orcamentoId,
      numeroVersao: novaVersaoNum,
      codigoVersao,
      dataVersao: new Date().toISOString(),
      autorId: usuario.id,
      autorNome: usuario.nome,
      motivoRevisao: motivoRevisao || `Revisão técnica/comercial ${codigoVersao}`,
      itensSnapshot: novosItens,
      resumoFinanceiro: {
        custoTotal: orc.custoTotalEstimado,
        precoSugeridoTotal: orc.precoSugeridoTotal,
        precoFinalTotal: orc.precoFinalTotal,
        valorDescontoTotal: orc.valorDescontoTotal,
        percentualDescontoTotal: orc.percentualDescontoTotal,
        margemLucroTotalPercentual: orc.margemLucroEstimadaPercentual,
        margemLucroTotalValor: orc.margemLucroEstimadaValor,
        impostosTotais: orc.impostosEstimadosTotais,
      },
      criadoEm: new Date().toISOString(),
    };

    const versoesExistentes = this.versoes.get(orcamentoId) || [];
    versoesExistentes.push(snapshotVersao);
    this.versoes.set(orcamentoId, versoesExistentes);

    this.registrarEventoNegociacao({
      orcamentoId,
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      tipoEvento: 'NOVA_VERSAO',
      descricao: `Nova revisão criada (${codigoVersao}). Motivo: ${motivoRevisao}`,
    });

    return { orcamento: orc, versao: snapshotVersao };
  }

  /**
   * Obtém histórico de versões de um orçamento
   */
  getVersoes(orcamentoId: string, empresaId: string): OrcamentoVersao[] {
    this.getOrcamentoById(orcamentoId, empresaId); // valida tenant
    return this.versoes.get(orcamentoId) || [];
  }

  /**
   * Workflow de Aprovação / Rejeição de Alçadas
   */
  aprovarOuRejeitar(
    orcamentoId: string,
    empresaId: string,
    acao: 'APROVAR' | 'REJEITAR',
    justificativa: string,
    aprovador: { id: string; nome: string }
  ): Orcamento {
    const orc = this.getOrcamentoById(orcamentoId, empresaId);

    if (acao === 'APROVAR') {
      orc.status = 'APROVADO';
      orc.exigeAprovacao = false;
      orc.aprovadorId = aprovador.id;
      orc.aprovadorNome = aprovador.nome;
      orc.dataAprovacao = new Date().toISOString();
      orc.justificativaAprovacao = justificativa;

      this.registrarEventoNegociacao({
        orcamentoId,
        usuarioId: aprovador.id,
        usuarioNome: aprovador.nome,
        tipoEvento: 'APROVACAO_CONCEDIDA',
        descricao: `Orçamento APROVADO por ${aprovador.nome}. Justificativa: ${justificativa}`,
      });
    } else {
      orc.status = 'REJEITADO_INTERNO';
      orc.aprovadorId = aprovador.id;
      orc.aprovadorNome = aprovador.nome;
      orc.justificativaAprovacao = justificativa;

      this.registrarEventoNegociacao({
        orcamentoId,
        usuarioId: aprovador.id,
        usuarioNome: aprovador.nome,
        tipoEvento: 'APROVACAO_REJEITADA',
        descricao: `Orçamento REJEITADO por ${aprovador.nome}. Motivo: ${justificativa}`,
      });
    }

    orc.updatedAt = new Date().toISOString();
    return orc;
  }

  /**
   * Registrar evento no histórico de negociação
   */
  registrarEventoNegociacao(evento: {
    orcamentoId: string;
    usuarioId: string;
    usuarioNome: string;
    tipoEvento: HistoricoNegociacaoOrcamento['tipoEvento'];
    descricao: string;
    dadosAnteriores?: Record<string, any>;
    dadosNovos?: Record<string, any>;
  }): HistoricoNegociacaoOrcamento {
    const novoEvento: HistoricoNegociacaoOrcamento = {
      id: `hist-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      orcamentoId: evento.orcamentoId,
      data: new Date().toISOString(),
      usuarioId: evento.usuarioId,
      usuarioNome: evento.usuarioNome,
      tipoEvento: evento.tipoEvento,
      descricao: evento.descricao,
      dadosAnteriores: evento.dadosAnteriores,
      dadosNovos: evento.dadosNovos,
    };

    const lista = this.historico.get(evento.orcamentoId) || [];
    lista.unshift(novoEvento);
    this.historico.set(evento.orcamentoId, lista);

    return novoEvento;
  }

  /**
   * Obtém o histórico de negociação do orçamento
   */
  getHistoricoNegociacao(orcamentoId: string, empresaId: string): HistoricoNegociacaoOrcamento[] {
    this.getOrcamentoById(orcamentoId, empresaId);
    return this.historico.get(orcamentoId) || [];
  }

  /**
   * Obter parâmetros de custo da empresa
   */
  getParametrosEmpresa(empresaId: string): ParametrosCustoEmpresa {
    return this.parametrosEmpresa.get(empresaId) || PARAMETROS_PADRAO_EMPRESA[empresaId] || PARAMETROS_PADRAO_EMPRESA.default;
  }

  /**
   * Salvar parâmetros de custo da empresa
   */
  salvarParametrosEmpresa(empresaId: string, params: Partial<ParametrosCustoEmpresa>): ParametrosCustoEmpresa {
    const atual = this.getParametrosEmpresa(empresaId);
    const atualizado: ParametrosCustoEmpresa = {
      ...atual,
      ...params,
      empresaId,
    };
    this.parametrosEmpresa.set(empresaId, atualizado);
    return atualizado;
  }

  /**
   * Vincular anexo do módulo de arquivos ao orçamento
   */
  vincularAnexo(orcamentoId: string, empresaId: string, arquivoId: string, usuario: { id: string; nome: string }): Orcamento {
    const orc = this.getOrcamentoById(orcamentoId, empresaId);
    if (!orc.anexosIds.includes(arquivoId)) {
      orc.anexosIds.push(arquivoId);
      orc.updatedAt = new Date().toISOString();
      this.registrarEventoNegociacao({
        orcamentoId,
        usuarioId: usuario.id,
        usuarioNome: usuario.nome,
        tipoEvento: 'ANEXO_VINCULADO',
        descricao: `Novo arquivo/desenho técnico anexado à proposta (${arquivoId}).`,
      });
    }
    return orc;
  }
}

// Instância singleton em memória do serviço de orçamentos
export const orcamentoService = new OrcamentoService();
