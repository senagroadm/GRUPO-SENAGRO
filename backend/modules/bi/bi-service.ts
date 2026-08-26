// backend/modules/bi/bi-service.ts
import { EMPRESAS_GRUPO, Empresa } from '@/backend/core/types/company';
import {
  IndicadorDefinicao,
  MetaIndicador,
  HistoricoIndicadorPonto,
  BiAlerta,
  DashboardGrupoData,
  DashboardEmpresaData,
  DashboardIndustrialData,
  DashboardComercialData,
  DashboardFinanceiroData,
  DrillDownGrupo,
  DrillDownEmpresa,
  DrillDownSetor,
  DrillDownCliente,
  DrillDownPedido,
  DrillDownItem,
  BiDashboardConfig,
  KpiCardItem,
  StatusAlerta,
} from './bi-types';

export class BiAnalyticsService {
  // Catálogo mestre de indicadores
  private indicadores: IndicadorDefinicao[] = [
    {
      id: 'ind-fat-global',
      codigo: 'FAT_GLOBAL',
      nome: 'Faturamento Bruto Consolidado',
      descricao: 'Soma de todas as notas fiscais e vendas faturadas no período.',
      categoria: 'GRUPO',
      unidade: 'BRL',
      formula: 'SUM(Vendas_Faturadas) - Cancelamentos',
      periodicidade: 'MENSAL',
      polaridade: 'MAIOR_MELHOR',
      ativo: true,
    },
    {
      id: 'ind-mrg-contrib',
      codigo: 'MRG_CONTRIB',
      nome: 'Margem de Contribuição Média',
      descricao: 'Percentual da receita que sobra após deduções de custos variáveis e impostos diretos.',
      categoria: 'GRUPO',
      unidade: 'PERCENTUAL',
      formula: '((Receita_Liquida - Custos_Variaveis) / Receita_Liquida) * 100',
      periodicidade: 'MENSAL',
      polaridade: 'MAIOR_MELHOR',
      valorReferenciaMercado: 28.5,
      ativo: true,
    },
    {
      id: 'ind-oee-fabril',
      codigo: 'OEE_FABRIL',
      nome: 'OEE - Eficiência Global de Equipamentos',
      descricao: 'Índice de disponibilidade x performance x qualidade dos centros de usinagem e corte.',
      categoria: 'INDUSTRIAL',
      unidade: 'PERCENTUAL',
      formula: 'Disponibilidade% * Performance% * Qualidade%',
      periodicidade: 'DIARIO',
      polaridade: 'MAIOR_MELHOR',
      valorReferenciaMercado: 85.0,
      ativo: true,
    },
    {
      id: 'ind-otif-entregas',
      codigo: 'OTIF_ENTREGAS',
      nome: 'OTIF - No Prazo & Completo',
      descricao: 'Percentual de pedidos entregues estritamente na data prometida com especificação 100% correta.',
      categoria: 'GRUPO',
      unidade: 'PERCENTUAL',
      formula: '(Pedidos_No_Prazo_e_Completos / Total_Pedidos_Expedidos) * 100',
      periodicidade: 'MENSAL',
      polaridade: 'MAIOR_MELHOR',
      valorReferenciaMercado: 95.0,
      ativo: true,
    },
    {
      id: 'ind-inadimp-total',
      codigo: 'TAXA_INADIMP',
      nome: 'Taxa de Inadimplência (> 30 dias)',
      descricao: 'Percentual de títulos vencidos há mais de 30 dias sobre a carteira total de recebíveis.',
      categoria: 'FINANCEIRO',
      unidade: 'PERCENTUAL',
      formula: '(Titulos_Vencidos_30d / Total_Recebiveis_Ativos) * 100',
      periodicidade: 'MENSAL',
      polaridade: 'MENOR_MELHOR',
      valorReferenciaMercado: 2.5,
      ativo: true,
    },
    {
      id: 'ind-taxa-refugo',
      codigo: 'TAXA_REFUGO',
      nome: 'Taxa de Refugo & Sucata',
      descricao: 'Percentual de peças descartadas por não-conformidade dimensional ou metalúrgica.',
      categoria: 'INDUSTRIAL',
      unidade: 'PERCENTUAL',
      formula: '(Pecas_Refugadas / Total_Pecas_Produzidas) * 100',
      periodicidade: 'DIARIO',
      polaridade: 'MENOR_MELHOR',
      valorReferenciaMercado: 1.8,
      ativo: true,
    },
    {
      id: 'ind-taxa-conversao-comercial',
      codigo: 'CONV_COMERCIAL',
      nome: 'Taxa de Conversão de Propostas',
      descricao: 'Percentual de orçamentos e propostas comerciais fechados em pedidos efetivos.',
      categoria: 'COMERCIAL',
      unidade: 'PERCENTUAL',
      formula: '(Propostas_Ganhas / Total_Propostas_Emitidas) * 100',
      periodicidade: 'MENSAL',
      polaridade: 'MAIOR_MELHOR',
      valorReferenciaMercado: 35.0,
      ativo: true,
    },
    {
      id: 'ind-conciliacao-bancaria',
      codigo: 'CONCIL_BANCARIA',
      nome: 'Índice de Conciliação Bancária',
      descricao: 'Percentual de extratos bancários conciliados no fechamento diário.',
      categoria: 'FINANCEIRO',
      unidade: 'PERCENTUAL',
      formula: '(Lancamentos_Conciliados / Total_Lancamentos_Extrato) * 100',
      periodicidade: 'DIARIO',
      polaridade: 'MAIOR_MELHOR',
      valorReferenciaMercado: 99.0,
      ativo: true,
    },
  ];

  // Metas parametrizadas por empresa e grupo
  private metas: MetaIndicador[] = [
    {
      id: 'meta-fat-grupo-2026',
      indicadorId: 'ind-fat-global',
      indicadorCodigo: 'FAT_GLOBAL',
      empresaId: 'GRUPO',
      ano: 2026,
      valorAlvo: 8500000,
      limiteAlertaAmarelo: 7800000,
      limiteCriticoVermelho: 7000000,
      responsavelNome: 'Diretoria Executiva TRITECH',
    },
    {
      id: 'meta-mrg-grupo-2026',
      indicadorId: 'ind-mrg-contrib',
      indicadorCodigo: 'MRG_CONTRIB',
      empresaId: 'GRUPO',
      ano: 2026,
      valorAlvo: 30.0,
      limiteAlertaAmarelo: 25.0,
      limiteCriticoVermelho: 20.0,
      responsavelNome: 'Controladoria & Finanças',
    },
    {
      id: 'meta-oee-grupo-2026',
      indicadorId: 'ind-oee-fabril',
      indicadorCodigo: 'OEE_FABRIL',
      empresaId: 'GRUPO',
      ano: 2026,
      valorAlvo: 85.0,
      limiteAlertaAmarelo: 78.0,
      limiteCriticoVermelho: 70.0,
      responsavelNome: 'Gerência Industrial',
    },
    {
      id: 'meta-otif-grupo-2026',
      indicadorId: 'ind-otif-entregas',
      indicadorCodigo: 'OTIF_ENTREGAS',
      empresaId: 'GRUPO',
      ano: 2026,
      valorAlvo: 96.0,
      limiteAlertaAmarelo: 90.0,
      limiteCriticoVermelho: 85.0,
      responsavelNome: 'Logística & PCP',
    },
    {
      id: 'meta-inadimp-grupo-2026',
      indicadorId: 'ind-inadimp-total',
      indicadorCodigo: 'TAXA_INADIMP',
      empresaId: 'GRUPO',
      ano: 2026,
      valorAlvo: 2.0,
      limiteAlertaAmarelo: 3.5,
      limiteCriticoVermelho: 5.0,
      responsavelNome: 'Crédito & Cobrança',
    },
  ];

  // Alertas inteligentes de BI
  private alertas: BiAlerta[] = [
    {
      id: 'alt-bi-001',
      empresaId: '44444444-4444-4444-4444-444444444444',
      empresaNome: 'Tritech Corte & Dobra',
      indicadorId: 'ind-oee-fabril',
      indicadorCodigo: 'OEE_FABRIL',
      indicadorNome: 'OEE - Eficiência Global de Equipamentos',
      categoria: 'INDUSTRIAL',
      status: 'CRITICO',
      valorAtual: 68.4,
      valorMeta: 85.0,
      limiteViolado: 70.0,
      dataDisparo: '2026-08-26 06:45',
      mensagemDiagnostico: 'Linha de Corte Laser Fibra 12kW apresentou 140 min de paradas não programadas por falha de alinhamento ótico no bico.',
      planoAcaoSugerido: 'Abrir OS de manutenção corretiva emergencial e recalibrar parâmetros de corte para chapa 1/2".',
      reconhecido: false,
    },
    {
      id: 'alt-bi-002',
      empresaId: '33333333-3333-3333-3333-333333333333',
      empresaNome: 'Senagro Indústria',
      indicadorId: 'ind-inadimp-total',
      indicadorCodigo: 'TAXA_INADIMP',
      indicadorNome: 'Taxa de Inadimplência (> 30 dias)',
      categoria: 'FINANCEIRO',
      status: 'ATENCAO',
      valorAtual: 3.8,
      valorMeta: 2.0,
      limiteViolado: 3.5,
      dataDisparo: '2026-08-25 18:30',
      mensagemDiagnostico: 'Atraso na liquidação de 3 títulos agrícolas do cliente Agropecuária Rio Verde no valor de R$ 145.000,00.',
      planoAcaoSugerido: 'Ativar régua de cobrança automática com envio de notificação extrajudicial e propor renegociação com confissão de dívida.',
      reconhecido: true,
      reconhecidoPor: 'Coordenação Financeira',
      dataReconhecimento: '2026-08-26 08:15',
    },
    {
      id: 'alt-bi-003',
      empresaId: '22222222-2222-2222-2222-222222222222',
      empresaNome: 'Oliveira & Amorim Distribuição',
      indicadorId: 'ind-taxa-refugo',
      indicadorCodigo: 'TAXA_REFUGO',
      indicadorNome: 'Taxa de Refugo & Sucata',
      categoria: 'INDUSTRIAL',
      status: 'ATENCAO',
      valorAtual: 2.9,
      valorMeta: 1.8,
      limiteViolado: 2.5,
      dataDisparo: '2026-08-26 05:10',
      mensagemDiagnostico: 'Lote de bobina de aço carbono A36 com oxidação superficial elevada gerou 380 kg de sucata na perfiladeira.',
      planoAcaoSugerido: 'Abrir RNC para fornecedor Gerdau Aços e segregar lote com etiqueta de quarentena.',
      reconhecido: false,
    },
  ];

  // Configurações de Dashboard
  private configsDashboard: BiDashboardConfig[] = [
    {
      id: 'cfg-dash-default',
      usuarioId: 'usr-admin-01',
      empresaId: 'GRUPO',
      dashboardTipo: 'GRUPO',
      autoRefreshIntervalSegundos: 60,
      temaCores: 'PADRAO_TECNICO',
      widgetsVisiveis: [
        { widgetId: 'w-fat', titulo: 'Faturamento Consolidado', visivel: true, posicaoOrdem: 1 },
        { widgetId: 'w-mrg', titulo: 'Margem de Contribuição', visivel: true, posicaoOrdem: 2 },
        { widgetId: 'w-cxa', titulo: 'Posição de Caixa', visivel: true, posicaoOrdem: 3 },
        { widgetId: 'w-oee', titulo: 'OEE Fabril Geral', visivel: true, posicaoOrdem: 4 },
        { widgetId: 'w-otif', titulo: 'OTIF de Entregas', visivel: true, posicaoOrdem: 5 },
        { widgetId: 'w-inad', titulo: 'Taxa de Inadimplência', visivel: true, posicaoOrdem: 6 },
      ],
    },
  ];

  // -------------------------------------------------------------
  // 1. DASHBOARD DO GRUPO (10 INDICADORES MACRO CONSOLIDADOS)
  // -------------------------------------------------------------
  public getDashboardGrupo(ano: number = 2026, mes: number = 8): DashboardGrupoData {
    const distribuicaoEmpresas = [
      {
        empresaId: '11111111-1111-1111-1111-111111111111',
        empresaCodigo: 'MWAM',
        nomeFantasia: 'MWAM Engenharia',
        faturamento: 1450000,
        margemLucro: 32.4,
        caixa: 480000,
        producao: 310,
        oee: 84.5,
        inadimplencia: 1.2,
        otif: 97.5,
        shareFaturamento: 16.8,
      },
      {
        empresaId: '22222222-2222-2222-2222-222222222222',
        empresaCodigo: 'OLIVEIRA_AMORIM',
        nomeFantasia: 'Oliveira & Amorim Distribuição',
        faturamento: 2850000,
        margemLucro: 22.8,
        caixa: 920000,
        producao: 1420,
        oee: 88.0,
        inadimplencia: 2.1,
        otif: 96.0,
        shareFaturamento: 33.1,
      },
      {
        empresaId: '33333333-3333-3333-3333-333333333333',
        empresaCodigo: 'SENAGRO',
        nomeFantasia: 'Senagro Indústria',
        faturamento: 2150000,
        margemLucro: 29.5,
        caixa: 750000,
        producao: 890,
        oee: 81.2,
        inadimplencia: 3.8,
        otif: 93.5,
        shareFaturamento: 25.0,
      },
      {
        empresaId: '44444444-4444-4444-4444-444444444444',
        empresaCodigo: 'TRITECH_CORTE',
        nomeFantasia: 'Tritech Corte & Dobra',
        faturamento: 1180000,
        margemLucro: 34.2,
        caixa: 390000,
        producao: 650,
        oee: 68.4,
        inadimplencia: 1.5,
        otif: 94.0,
        shareFaturamento: 13.7,
      },
      {
        empresaId: '55555555-5555-5555-5555-555555555555',
        empresaCodigo: 'TRITECH_IND',
        nomeFantasia: 'Tritech Indústria',
        faturamento: 980000,
        margemLucro: 31.0,
        caixa: 310000,
        producao: 480,
        oee: 83.0,
        inadimplencia: 1.9,
        otif: 95.8,
        shareFaturamento: 11.4,
      },
    ];

    const faturamentoConsolidado = distribuicaoEmpresas.reduce((acc, curr) => acc + curr.faturamento, 0);
    const metaFaturamento = 8500000;
    const caixaDisponivelTotal = distribuicaoEmpresas.reduce((acc, curr) => acc + curr.caixa, 0);
    const producaoTotalVolume = distribuicaoEmpresas.reduce((acc, curr) => acc + curr.producao, 0);
    const margemContribuicaoMedia = 28.9;
    const margemEbitdaMedia = 18.4;
    const recebiveisTotal = 5620000;
    const pagamentosPrevistosTotal = 3980000;
    const estoqueValorizadoTotal = 4350000;
    const indiceAtrasoEntregasOtif = 4.8; // 95.2% OTIF
    const taxaInadimplenciaTotal = 2.3;
    const resultadoLiquidoConsolidado = 1245000;

    const kpis: KpiCardItem[] = [
      {
        id: 'kpi-fat',
        titulo: 'Faturamento Grupo',
        valor: faturamentoConsolidado,
        unidade: 'BRL',
        meta: metaFaturamento,
        variacaoPeriodoAnterior: 6.2,
        status: faturamentoConsolidado >= metaFaturamento ? 'NORMAL' : 'ATENCAO',
        tendencia: 'ALTA',
        descricaoAjuda: 'Receita bruta acumulada das 5 empresas do Grupo TRITECH',
      },
      {
        id: 'kpi-mrg',
        titulo: 'Margem Contribuição',
        valor: margemContribuicaoMedia,
        unidade: 'PERCENTUAL',
        meta: 30.0,
        variacaoPeriodoAnterior: 1.1,
        status: 'NORMAL',
        tendencia: 'ALTA',
        descricaoAjuda: 'Margem pós-custos variáveis direta de produtos e serviços',
      },
      {
        id: 'kpi-cxa',
        titulo: 'Caixa Consolidado',
        valor: caixaDisponivelTotal,
        unidade: 'BRL',
        meta: 2500000,
        variacaoPeriodoAnterior: 4.8,
        status: 'NORMAL',
        tendencia: 'ALTA',
        descricaoAjuda: 'Saldos disponíveis em contas correntes e aplicações líquidas',
      },
      {
        id: 'kpi-rec',
        titulo: 'Contas a Receber',
        valor: recebiveisTotal,
        unidade: 'BRL',
        variacaoPeriodoAnterior: -2.3,
        status: 'NORMAL',
        tendencia: 'ESTAVEL',
        descricaoAjuda: 'Carteira de títulos a vencer e vencidos a receber',
      },
      {
        id: 'kpi-pag',
        titulo: 'Contas a Pagar',
        valor: pagamentosPrevistosTotal,
        unidade: 'BRL',
        variacaoPeriodoAnterior: 3.5,
        status: 'NORMAL',
        tendencia: 'ESTAVEL',
        descricaoAjuda: 'Compromissos operacionais, matéria-prima e tributos',
      },
      {
        id: 'kpi-est',
        titulo: 'Estoque Valorizado',
        valor: estoqueValorizadoTotal,
        unidade: 'BRL',
        variacaoPeriodoAnterior: -1.8,
        status: 'NORMAL',
        tendencia: 'BAIXA',
        descricaoAjuda: 'Matéria-prima, produtos em processo (WIP) e acabados',
      },
      {
        id: 'kpi-prod',
        titulo: 'Produção Total',
        valor: producaoTotalVolume,
        unidade: 'QUANTIDADE',
        meta: 3600,
        variacaoPeriodoAnterior: 8.5,
        status: 'NORMAL',
        tendencia: 'ALTA',
        descricaoAjuda: 'Volume fabril físico processado (unidades estruturais / ton)',
      },
      {
        id: 'kpi-atr',
        titulo: 'Taxa de Atraso (OTIF)',
        valor: indiceAtrasoEntregasOtif,
        unidade: 'PERCENTUAL',
        meta: 4.0,
        variacaoPeriodoAnterior: -0.9,
        status: indiceAtrasoEntregasOtif <= 4.0 ? 'NORMAL' : 'ATENCAO',
        tendencia: 'BAIXA',
        descricaoAjuda: 'Percentual de expedições fora da janela prometida',
      },
      {
        id: 'kpi-inad',
        titulo: 'Inadimplência (>30d)',
        valor: taxaInadimplenciaTotal,
        unidade: 'PERCENTUAL',
        meta: 2.0,
        variacaoPeriodoAnterior: 0.3,
        status: taxaInadimplenciaTotal <= 2.0 ? 'NORMAL' : 'ATENCAO',
        tendencia: 'ALTA',
        descricaoAjuda: 'Percentual de inadimplência da carteira ativa',
      },
      {
        id: 'kpi-res',
        titulo: 'Resultado Líquido',
        valor: resultadoLiquidoConsolidado,
        unidade: 'BRL',
        meta: 1200000,
        variacaoPeriodoAnterior: 9.4,
        status: 'NORMAL',
        tendencia: 'ALTA',
        descricaoAjuda: 'Lucro líquido gerencial consolidado do período',
      },
    ];

    const evolucaoMensalConsolidada = [
      { mes: 'Mar/26', faturamento: 7420000, metaFaturamento: 7600000, custoOperacional: 5380000, resultado: 980000, margem: 27.5 },
      { mes: 'Abr/26', faturamento: 7850000, metaFaturamento: 7800000, custoOperacional: 5610000, resultado: 1090000, margem: 28.5 },
      { mes: 'Mai/26', faturamento: 8120000, metaFaturamento: 8000000, custoOperacional: 5760000, resultado: 1180000, margem: 29.1 },
      { mes: 'Jun/26', faturamento: 8340000, metaFaturamento: 8200000, custoOperacional: 5920000, resultado: 1210000, margem: 29.0 },
      { mes: 'Jul/26', faturamento: 8490000, metaFaturamento: 8400000, custoOperacional: 6010000, resultado: 1235000, margem: 29.2 },
      { mes: 'Ago/26', faturamento: 8610000, metaFaturamento: 8500000, custoOperacional: 6120000, resultado: 1245000, margem: 28.9 },
    ];

    return {
      periodoAtual: 'Agosto / 2026',
      faturamentoConsolidado,
      metaFaturamento,
      margemContribuicaoMedia,
      margemEbitdaMedia,
      caixaDisponivelTotal,
      recebiveisTotal,
      pagamentosPrevistosTotal,
      estoqueValorizadoTotal,
      producaoTotalVolume,
      indiceAtrasoEntregasOtif,
      taxaInadimplenciaTotal,
      resultadoLiquidoConsolidado,
      kpis,
      distribuicaoEmpresas,
      evolucaoMensalConsolidada,
    };
  }

  // -------------------------------------------------------------
  // 2. DASHBOARD DA EMPRESA (FILTRADO PELO CONTEXTO ATIVO)
  // -------------------------------------------------------------
  public getDashboardEmpresa(empresaId: string): DashboardEmpresaData {
    const emp = EMPRESAS_GRUPO.find((e) => e.id === empresaId) || EMPRESAS_GRUPO[0];
    const grp = this.getDashboardGrupo();
    const dadosEmp = grp.distribuicaoEmpresas.find((d) => d.empresaId === empresaId) || grp.distribuicaoEmpresas[0];

    const receitaBruta = dadosEmp.faturamento;
    const deducoesImpostos = Math.round(receitaBruta * 0.115);
    const receitaLiquida = receitaBruta - deducoesImpostos;
    const custosProdutosVendidos = Math.round(receitaLiquida * 0.62);
    const lucroBruto = receitaLiquida - custosProdutosVendidos;
    const margemBrutaPercentual = Number(((lucroBruto / receitaLiquida) * 100).toFixed(1));
    const despesasOperacionais = Math.round(receitaLiquida * 0.18);
    const ebitda = lucroBruto - despesasOperacionais;
    const margemEbitdaPercentual = Number(((ebitda / receitaLiquida) * 100).toFixed(1));
    const resultadoFinanceiro = Math.round(receitaLiquida * -0.015);
    const lucroLiquido = ebitda + resultadoFinanceiro;
    const margemLiquidaPercentual = Number(((lucroLiquido / receitaLiquida) * 100).toFixed(1));

    const kpis: KpiCardItem[] = [
      {
        id: 'kpi-emp-fat',
        titulo: 'Faturamento da Unidade',
        valor: receitaBruta,
        unidade: 'BRL',
        meta: Math.round(receitaBruta * 1.05),
        status: 'NORMAL',
        tendencia: 'ALTA',
        descricaoAjuda: `Faturamento emitido por ${emp.nomeFantasia}`,
      },
      {
        id: 'kpi-emp-mrg',
        titulo: 'Margem Bruta Unitária',
        valor: margemBrutaPercentual,
        unidade: 'PERCENTUAL',
        meta: 35.0,
        status: margemBrutaPercentual >= 35.0 ? 'NORMAL' : 'ATENCAO',
        tendencia: 'ALTA',
        descricaoAjuda: 'Margem industrial sobre custo padrão/real',
      },
      {
        id: 'kpi-emp-cxa',
        titulo: 'Saldo em Contas',
        valor: dadosEmp.caixa,
        unidade: 'BRL',
        status: 'NORMAL',
        tendencia: 'ALTA',
        descricaoAjuda: 'Disponibilidade financeira da conta vinculada',
      },
      {
        id: 'kpi-emp-oee',
        titulo: 'OEE Fábrica / Centro',
        valor: dadosEmp.oee,
        unidade: 'PERCENTUAL',
        meta: 85.0,
        status: dadosEmp.oee >= 80.0 ? 'NORMAL' : 'CRITICO',
        tendencia: dadosEmp.oee >= 80.0 ? 'ALTA' : 'BAIXA',
        descricaoAjuda: 'Eficiência de máquinas e postos de trabalho',
      },
      {
        id: 'kpi-emp-inad',
        titulo: 'Inadimplência Unidade',
        valor: dadosEmp.inadimplencia,
        unidade: 'PERCENTUAL',
        meta: 2.0,
        status: dadosEmp.inadimplencia <= 2.0 ? 'NORMAL' : 'ATENCAO',
        tendencia: dadosEmp.inadimplencia <= 2.0 ? 'BAIXA' : 'ALTA',
        descricaoAjuda: 'Títulos em atraso de clientes desta empresa',
      },
      {
        id: 'kpi-emp-otif',
        titulo: 'OTIF de Entregas',
        valor: dadosEmp.otif,
        unidade: 'PERCENTUAL',
        meta: 95.0,
        status: dadosEmp.otif >= 95.0 ? 'NORMAL' : 'ATENCAO',
        tendencia: 'ALTA',
        descricaoAjuda: 'Pontualidade de entregas da fábrica',
      },
    ];

    const desempenhoSetores = [
      {
        setorId: 'set-usinagem',
        setorNome: 'Usinagem CNC & Tornos',
        custoSetor: Math.round(receitaBruta * 0.28),
        eficienciaMedia: dadosEmp.oee,
        horasApontadas: 340,
        volumeProduzido: 420,
        desvioPadrao: 2.4,
      },
      {
        setorId: 'set-corte',
        setorNome: 'Corte Laser & Dobra',
        custoSetor: Math.round(receitaBruta * 0.35),
        eficienciaMedia: Math.max(68.0, dadosEmp.oee - 4.5),
        horasApontadas: 410,
        volumeProduzido: 680,
        desvioPadrao: 3.8,
      },
      {
        setorId: 'set-montagem',
        setorNome: 'Montagem & Solda Técnica',
        custoSetor: Math.round(receitaBruta * 0.22),
        eficienciaMedia: 91.5,
        horasApontadas: 280,
        volumeProduzido: 350,
        desvioPadrao: 1.5,
      },
    ];

    return {
      empresaId,
      empresaNome: emp.nomeFantasia,
      cnpj: emp.cnpj,
      periodo: 'Agosto / 2026',
      kpis,
      dreSintetico: {
        receitaBruta,
        deducoesImpostos,
        receitaLiquida,
        custosProdutosVendidos,
        lucroBruto,
        margemBrutaPercentual,
        despesasOperacionais,
        ebitda,
        margemEbitdaPercentual,
        resultadoFinanceiro,
        lucroLiquido,
        margemLiquidaPercentual,
      },
      desempenhoSetores,
    };
  }

  // -------------------------------------------------------------
  // 3. DASHBOARD INDUSTRIAL (OEE, PRODUÇÃO, PARADAS, REFUGO, RISCO)
  // -------------------------------------------------------------
  public getDashboardIndustrial(empresaId: string | 'GRUPO'): DashboardIndustrialData {
    return {
      empresaId,
      periodo: 'Agosto / 2026',
      oeeGeral: {
        oee: 82.4,
        disponibilidade: 89.2,
        performance: 94.1,
        qualidade: 98.2,
        metaOee: 85.0,
      },
      producaoVolume: {
        totalPecasProduzidas: 3750,
        metaPecas: 3600,
        pesoTotalKg: 48600,
        horasFabrisTrabalhadas: 1280,
      },
      eficienciaLinhas: [
        {
          linhaId: 'lin-01',
          linhaNome: 'Célula de Usinagem 5 Eixos (Mazak)',
          oee: 88.5,
          disponibilidade: 92.0,
          performance: 97.4,
          qualidade: 98.8,
          status: 'ALTA_PERFORMANCE',
        },
        {
          linhaId: 'lin-02',
          linhaNome: 'Corte a Laser Fibra 12kW (Bystronic)',
          oee: 68.4,
          disponibilidade: 74.5,
          performance: 93.0,
          qualidade: 98.6,
          status: 'CRITICO',
        },
        {
          linhaId: 'lin-03',
          linhaNome: 'Dobra CNC 320T (Trumpf TrumaBend)',
          oee: 84.2,
          disponibilidade: 89.0,
          performance: 95.8,
          qualidade: 98.7,
          status: 'ESTAVEL',
        },
        {
          linhaId: 'lin-04',
          linhaNome: 'Caldeiraria Pesada & Robô de Solda',
          oee: 86.9,
          disponibilidade: 91.5,
          performance: 96.2,
          qualidade: 98.7,
          status: 'ALTA_PERFORMANCE',
        },
      ],
      paradasProducao: [
        {
          motivo: 'Ajuste de Ótica & Calibração do Foco Laser',
          categoria: 'MECANICA',
          tempoMinutos: 380,
          percentualTempoTotal: 34.2,
          ocorrenciasQtd: 8,
        },
        {
          motivo: 'Troca de Ferramental e Setup de Matriz Dobra',
          categoria: 'SETUP',
          tempoMinutos: 290,
          percentualTempoTotal: 26.1,
          ocorrenciasQtd: 14,
        },
        {
          motivo: 'Aguardando Matéria-Prima (Chapa 5/8" A36)',
          categoria: 'FALTA_MATERIAL',
          tempoMinutos: 210,
          percentualTempoTotal: 18.9,
          ocorrenciasQtd: 4,
        },
        {
          motivo: 'Alarme de Sobreaquecimento Chiller Hidráulico',
          categoria: 'ELETRICA',
          tempoMinutos: 130,
          percentualTempoTotal: 11.7,
          ocorrenciasQtd: 3,
        },
        {
          motivo: 'Treinamento de Operador em Posto NR-12',
          categoria: 'OPERACIONAL',
          tempoMinutos: 100,
          percentualTempoTotal: 9.1,
          ocorrenciasQtd: 2,
        },
      ],
      refugoRetrabalho: {
        totalPecasRefugadas: 68,
        taxaRefugoPercentual: 1.81,
        custoTotalRefugo: 14850.0,
        totalHorasRetrabalho: 42.5,
        taxaRetrabalhoPercentual: 2.15,
        custoTotalRetrabalho: 8920.0,
        principaisCausasRefugo: [
          { causa: 'Rebarba excessiva / perda de foco laser', pecas: 32, custo: 6800 },
          { causa: 'Desvio angular em dobra CNC por espessura variável', pecas: 21, custo: 5100 },
          { causa: 'Porosidade em cordão de solda estrutural', pecas: 15, custo: 2950 },
        ],
      },
      capacidadeUtilizacao: {
        capacidadeInstaladaHoras: 1600,
        capacidadeUtilizadaHoras: 1280,
        taxaUtilizacao: 80.0,
        gargaloPrincipal: 'Corte Laser Fibra (demanda 112% da capacidade em 1 turno)',
      },
      pedidosEmRisco: [
        {
          pedidoId: 'ped-rsk-001',
          numeroPedido: 'PV-2026-0811',
          clienteNome: 'Agrovale Implementos Agrícolas S/A',
          dataPrometida: '2026-08-28',
          diasAtrasoEstimado: 2,
          opRelacionada: 'OP-2026-0492',
          estagioAtual: 'Caldeiraria & Solda',
          motivoRisco: 'Atraso na liberação da chapa cortada a laser (gargalo de máquina).',
          valorPedido: 145000.0,
          criticidade: 'CRITICA',
        },
        {
          pedidoId: 'ped-rsk-002',
          numeroPedido: 'PV-2026-0824',
          clienteNome: 'Kepler Weber Equipamentos',
          dataPrometida: '2026-08-30',
          diasAtrasoEstimado: 1,
          opRelacionada: 'OP-2026-0501',
          estagioAtual: 'Usinagem CNC',
          motivoRisco: 'Desgaste prematuro de inserto de rosca macho exigiu retrabalho.',
          valorPedido: 89000.0,
          criticidade: 'MEDIA',
        },
        {
          pedidoId: 'ped-rsk-003',
          numeroPedido: 'PV-2026-0839',
          clienteNome: 'Randon Implementos Rodoviários',
          dataPrometida: '2026-09-02',
          diasAtrasoEstimado: 3,
          opRelacionada: 'OP-2026-0518',
          estagioAtual: 'Pintura Epóxi & Expedição',
          motivoRisco: 'Secagem e cura térmica estendida por umidade relativa.',
          valorPedido: 210000.0,
          criticidade: 'ALTA',
        },
      ],
    };
  }

  // -------------------------------------------------------------
  // 4. DASHBOARD COMERCIAL (FUNIL, CONVERSÃO, VENDAS, VENDEDORES)
  // -------------------------------------------------------------
  public getDashboardComercial(empresaId: string | 'GRUPO'): DashboardComercialData {
    return {
      empresaId,
      periodo: 'Agosto / 2026',
      funilVendas: [
        { etapa: 'PROSPECCAO', nomeEtapa: '1. Prospecção Ativa', quantidadeOportunidades: 84, valorTotalEtapa: 18500000, taxaConversaoEtapa: 65.0 },
        { etapa: 'QUALIFICACAO', nomeEtapa: '2. Qualificação Técnica', quantidadeOportunidades: 55, valorTotalEtapa: 14200000, taxaConversaoEtapa: 72.7 },
        { etapa: 'COTACAO', nomeEtapa: '3. Orçamento CPQ / Engenharia', quantidadeOportunidades: 40, valorTotalEtapa: 11800000, taxaConversaoEtapa: 67.5 },
        { etapa: 'PROPOSTA', nomeEtapa: '4. Proposta Enviada', quantidadeOportunidades: 27, valorTotalEtapa: 9900000, taxaConversaoEtapa: 77.8 },
        { etapa: 'NEGOCIACAO', nomeEtapa: '5. Negociação & Crédito', quantidadeOportunidades: 21, valorTotalEtapa: 8950000, taxaConversaoEtapa: 85.7 },
        { etapa: 'FECHADO_GANHO', nomeEtapa: '6. Pedido Fechado (Ganho)', quantidadeOportunidades: 18, valorTotalEtapa: 8610000, taxaConversaoEtapa: 100.0 },
      ],
      taxaConversaoGeral: 21.4, // 18 / 84
      ticketMedioVendas: 478333.33,
      vendasRealizadas: {
        faturadoNoPeriodo: 8610000,
        metaPeriodo: 8500000,
        percentualMetaAtingido: 101.3,
        carteiraBacklogFuturo: 14200000,
      },
      margemContribuicaoPorLinha: [
        { linhaProduto: 'Serviços de Corte a Laser e Dobra CNC', faturamento: 2350000, margemBrutaPercentual: 38.5, margemLiquidaPercentual: 24.2 },
        { linhaProduto: 'Equipamentos Agrícolas & Grãos (Senagro)', faturamento: 2150000, margemBrutaPercentual: 32.0, margemLiquidaPercentual: 19.8 },
        { linhaProduto: 'Distribuição de Perfis e Aço Estrutural', faturamento: 2850000, margemBrutaPercentual: 22.8, margemLiquidaPercentual: 13.5 },
        { linhaProduto: 'Engenharia de Montagem & Caldeiraria', faturamento: 1260000, margemBrutaPercentual: 34.0, margemLiquidaPercentual: 21.5 },
      ],
      rankingVendedores: [
        {
          vendedorId: 'vend-01',
          vendedorNome: 'Carlos Eduardo Mendes',
          totalVendido: 2950000,
          metaVendedor: 2500000,
          atingimentoMetaPercentual: 118.0,
          ticketMedio: 590000,
          quantidadePedidos: 5,
          taxaConversao: 31.2,
        },
        {
          vendedorId: 'vend-02',
          vendedorNome: 'Juliana Fagundes Rios',
          totalVendido: 2480000,
          metaVendedor: 2300000,
          atingimentoMetaPercentual: 107.8,
          ticketMedio: 496000,
          quantidadePedidos: 5,
          taxaConversao: 28.5,
        },
        {
          vendedorId: 'vend-03',
          vendedorNome: 'Roberto Santos Lima',
          totalVendido: 1980000,
          metaVendedor: 2000000,
          atingimentoMetaPercentual: 99.0,
          ticketMedio: 396000,
          quantidadePedidos: 5,
          taxaConversao: 19.8,
        },
        {
          vendedorId: 'vend-04',
          vendedorNome: 'Mariana Duarte Souza',
          totalVendido: 1200000,
          metaVendedor: 1700000,
          atingimentoMetaPercentual: 70.6,
          ticketMedio: 400000,
          quantidadePedidos: 3,
          taxaConversao: 14.5,
        },
      ],
    };
  }

  // -------------------------------------------------------------
  // 5. DASHBOARD FINANCEIRO (CAIXA, PROJETADO, AGING, BANCOS, CONCILIAÇÃO)
  // -------------------------------------------------------------
  public getDashboardFinanceiro(empresaId: string | 'GRUPO'): DashboardFinanceiroData {
    return {
      empresaId,
      periodo: 'Agosto / 2026',
      caixaDisponivelTotal: 2850000,
      distribuicaoBancos: [
        { bancoId: 'bco-01', bancoNome: 'Banco Itaú S/A (341)', numeroConta: 'Ag 0941 CC 44820-9', saldoAtual: 1120000, percentualTotal: 39.3, chavePixPadrao: 'financeiro@tritech.ind.br' },
        { bancoId: 'bco-02', bancoNome: 'Banco Bradesco S/A (237)', numeroConta: 'Ag 1280 CC 99310-2', saldoAtual: 850000, percentualTotal: 29.8, chavePixPadrao: '26.200.037/0001-57' },
        { bancoId: 'bco-03', bancoNome: 'Banco do Brasil (001)', numeroConta: 'Ag 3480 CC 11204-5', saldoAtual: 540000, percentualTotal: 18.9 },
        { bancoId: 'bco-04', bancoNome: 'Sicoob Cooperativa (756)', numeroConta: 'Ag 4012 CC 55291-0', saldoAtual: 340000, percentualTotal: 12.0 },
      ],
      fluxoProjetadoCurvas: [
        { diaOuMes: 'Hoje (26/08)', entradasPrevistas: 380000, saidasPrevistas: 190000, saldoLiquidoDia: 190000, saldoAcumuladoProjetado: 2850000 },
        { diaOuMes: 'D+7 (02/09)', entradasPrevistas: 920000, saidasPrevistas: 640000, saldoLiquidoDia: 280000, saldoAcumuladoProjetado: 3130000 },
        { diaOuMes: 'D+15 (10/09)', entradasPrevistas: 1450000, saidasPrevistas: 1280000, saldoLiquidoDia: 170000, saldoAcumuladoProjetado: 3300000 },
        { diaOuMes: 'D+30 (25/09)', entradasPrevistas: 2100000, saidasPrevistas: 1850000, saldoLiquidoDia: 250000, saldoAcumuladoProjetado: 3550000 },
        { diaOuMes: 'D+60 (25/10)', entradasPrevistas: 3800000, saidasPrevistas: 3400000, saldoLiquidoDia: 400000, saldoAcumuladoProjetado: 3950000 },
        { diaOuMes: 'D+90 (25/11)', entradasPrevistas: 4600000, saidasPrevistas: 4100000, saldoLiquidoDia: 500000, saldoAcumuladoProjetado: 4450000 },
      ],
      agingListRecebiveis: [
        { faixa: 'A_VENCER', faixaTitulo: 'A Vencer (Dentro do Prazo)', valorTotal: 4680000, percentualTotal: 83.3, percentualPddEstimada: 0.0, provisaoPddValor: 0, quantidadeTitulos: 142 },
        { faixa: 'VENCIDO_1_30', faixaTitulo: 'Vencido 1 a 30 dias', valorTotal: 580000, percentualTotal: 10.3, percentualPddEstimada: 5.0, provisaoPddValor: 29000, quantidadeTitulos: 18 },
        { faixa: 'VENCIDO_31_60', faixaTitulo: 'Vencido 31 a 60 dias', valorTotal: 210000, percentualTotal: 3.7, percentualPddEstimada: 20.0, provisaoPddValor: 42000, quantidadeTitulos: 6 },
        { faixa: 'VENCIDO_61_90', faixaTitulo: 'Vencido 61 a 90 dias', valorTotal: 95000, percentualTotal: 1.7, percentualPddEstimada: 50.0, provisaoPddValor: 47500, quantidadeTitulos: 3 },
        { faixa: 'VENCIDO_90_MAIS', faixaTitulo: 'Vencido > 90 dias (Jurídico)', valorTotal: 55000, percentualTotal: 1.0, percentualPddEstimada: 100.0, provisaoPddValor: 55000, quantidadeTitulos: 2 },
      ],
      conciliacaoStatus: {
        taxaConciliacaoExtratos: 98.4,
        totalLancamentosPendentes: 4,
        valorTotalPendenteConciliacao: 18450.0,
        dataUltimaConciliacao: '2026-08-26 06:00',
      },
    };
  }

  // -------------------------------------------------------------
  // 6. MOTOR DE DRILL-DOWN (6 NÍVEIS HIERÁRQUICOS)
  // Grupo -> Empresa -> Setor -> Cliente -> Pedido -> Item
  // -------------------------------------------------------------
  public getDrillDownCompleto(): DrillDownGrupo {
    const empresas: DrillDownEmpresa[] = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        codigo: 'MWAM',
        nomeFantasia: 'MWAM Engenharia',
        cnpj: '44.566.045/0001-01',
        faturamento: 1450000,
        margemLucro: 32.4,
        oee: 84.5,
        setores: [
          {
            id: 'set-mwam-01',
            codigo: 'ENG_MONTAGEM',
            nome: 'Engenharia de Montagem Industrial',
            tipo: 'PRODUTIVO',
            responsavelNome: 'Eng. Maurício Wagner',
            oeeMedio: 86.0,
            custoHoraSetor: 185.0,
            totalHorasTrabalhadas: 480,
            clientes: [
              {
                id: 'cli-mwam-01',
                cnpjCpf: '14.882.901/0001-44',
                razaoSocial: 'Petroquímica do Sul S/A',
                nomeFantasia: 'Petroquímica do Sul',
                segmentoMercado: 'Óleo & Gás / Químico',
                scoreCredito: 920,
                limiteCredito: 1500000,
                exposicaoAtual: 420000,
                faturamentoAcumulado: 680000,
                pedidosQtd: 2,
                pedidos: [
                  {
                    id: 'ped-mwam-01',
                    numeroPedido: 'PV-MWAM-2026-0104',
                    ordemProducaoId: 'OP-ENG-089',
                    dataEmissao: '2026-08-10',
                    dataEntregaPrometida: '2026-09-05',
                    statusPedido: 'EM_PRODUCAO',
                    valorTotal: 420000.0,
                    margemTotalPercentual: 34.5,
                    otifStatus: 'NO_PRAZO',
                    itens: [
                      {
                        id: 'item-mw-01',
                        codigo: 'ESTRUT-SKID-01',
                        descricao: 'Skid de Bombeamento Químico em Inox 316L',
                        especificacaoTecnica: 'Estrutura tubular soldada com teste por líquido penetrante',
                        unidadeMedida: 'UN',
                        quantidadePedida: 2,
                        quantidadeProduzida: 1,
                        precoUnitarioVenda: 210000.0,
                        custoUnitarioPadrao: 135000.0,
                        custoUnitarioReal: 137500.0,
                        margemUnitarioPercentual: 34.5,
                        taxaRefugoItem: 0.0,
                        statusProducao: 'EM_PRODUCAO',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        codigo: 'OLIVEIRA_AMORIM',
        nomeFantasia: 'Oliveira & Amorim Distribuição',
        cnpj: '26.200.037/0001-57',
        faturamento: 2850000,
        margemLucro: 22.8,
        oee: 88.0,
        setores: [
          {
            id: 'set-dist-01',
            codigo: 'LOG_DISTRIB',
            nome: 'Centro de Distribuição & Fracionamento de Aço',
            tipo: 'PRODUTIVO',
            responsavelNome: 'Claudio Amorim',
            oeeMedio: 88.0,
            custoHoraSetor: 120.0,
            totalHorasTrabalhadas: 620,
            clientes: [
              {
                id: 'cli-dist-01',
                cnpjCpf: '03.882.119/0001-99',
                razaoSocial: 'Estruturas Metálicas Triângulo Ltda',
                nomeFantasia: 'Triângulo Metálicas',
                segmentoMercado: 'Construção Civil Pesada',
                scoreCredito: 850,
                limiteCredito: 800000,
                exposicaoAtual: 340000,
                faturamentoAcumulado: 890000,
                pedidosQtd: 1,
                pedidos: [
                  {
                    id: 'ped-dist-01',
                    numeroPedido: 'PV-OA-2026-0412',
                    dataEmissao: '2026-08-18',
                    dataEntregaPrometida: '2026-08-28',
                    statusPedido: 'LIBERADO_EXPEDICAO',
                    valorTotal: 340000.0,
                    margemTotalPercentual: 22.5,
                    otifStatus: 'NO_PRAZO',
                    itens: [
                      {
                        id: 'item-dist-01',
                        codigo: 'VIGA-W-250',
                        descricao: 'Viga Estrutural W 250 x 32.7 kg/m - ASTM A572 Gr 50',
                        especificacaoTecnica: 'Barras de 12 metros com certificado de usina Gerdau',
                        unidadeMedida: 'TON',
                        quantidadePedida: 35,
                        quantidadeProduzida: 35,
                        precoUnitarioVenda: 9714.28,
                        custoUnitarioPadrao: 7500.0,
                        custoUnitarioReal: 7520.0,
                        margemUnitarioPercentual: 22.5,
                        taxaRefugoItem: 0.2,
                        statusProducao: 'CONCLUIDO',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        codigo: 'SENAGRO',
        nomeFantasia: 'Senagro Indústria',
        cnpj: '23.280.366/0001-67',
        faturamento: 2150000,
        margemLucro: 29.5,
        oee: 81.2,
        setores: [
          {
            id: 'set-sen-01',
            codigo: 'IND_AGRO',
            nome: 'Linha de Implementos & Equipamentos de Grãos',
            tipo: 'PRODUTIVO',
            responsavelNome: 'Eng. Roberto Senna',
            oeeMedio: 81.2,
            custoHoraSetor: 160.0,
            totalHorasTrabalhadas: 540,
            clientes: [
              {
                id: 'cli-sen-01',
                cnpjCpf: '19.445.102/0001-88',
                razaoSocial: 'Agropecuária Rio Verde Ltda',
                nomeFantasia: 'Agro Rio Verde',
                segmentoMercado: 'Agronegócio / Grãos',
                scoreCredito: 710,
                limiteCredito: 600000,
                exposicaoAtual: 285000,
                faturamentoAcumulado: 750000,
                pedidosQtd: 1,
                pedidos: [
                  {
                    id: 'ped-sen-01',
                    numeroPedido: 'PV-SEN-2026-0811',
                    ordemProducaoId: 'OP-2026-0492',
                    dataEmissao: '2026-08-05',
                    dataEntregaPrometida: '2026-08-28',
                    statusPedido: 'EM_PRODUCAO',
                    valorTotal: 285000.0,
                    margemTotalPercentual: 29.5,
                    otifStatus: 'EM_RISCO',
                    itens: [
                      {
                        id: 'item-sen-01',
                        codigo: 'ELEV-GRAO-60T',
                        descricao: 'Elevador de Canecas 60 ton/h Auto-Limpante',
                        especificacaoTecnica: 'Cabeçote com revestimento cerâmico e acionamento WEG',
                        unidadeMedida: 'UN',
                        quantidadePedida: 1,
                        quantidadeProduzida: 0.7,
                        precoUnitarioVenda: 285000.0,
                        custoUnitarioPadrao: 198000.0,
                        custoUnitarioReal: 201000.0,
                        margemUnitarioPercentual: 29.5,
                        taxaRefugoItem: 1.2,
                        statusProducao: 'EM_PRODUCAO',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        codigo: 'TRITECH_CORTE',
        nomeFantasia: 'Tritech Corte & Dobra',
        cnpj: '48.082.502/0001-35',
        faturamento: 1180000,
        margemLucro: 34.2,
        oee: 68.4,
        setores: [
          {
            id: 'set-tc-01',
            codigo: 'CORTE_LASER',
            nome: 'Célula Laser Fibra 12kW & Dobra CNC',
            tipo: 'PRODUTIVO',
            responsavelNome: 'Marcos Vinicius Técnico',
            oeeMedio: 68.4,
            custoHoraSetor: 210.0,
            totalHorasTrabalhadas: 490,
            clientes: [
              {
                id: 'cli-tc-01',
                cnpjCpf: '88.192.304/0001-12',
                razaoSocial: 'Randon Implementos Rodoviários S/A',
                nomeFantasia: 'Randon Implementos',
                segmentoMercado: 'Automotivo / Transporte Pesado',
                scoreCredito: 980,
                limiteCredito: 2500000,
                exposicaoAtual: 510000,
                faturamentoAcumulado: 1200000,
                pedidosQtd: 2,
                pedidos: [
                  {
                    id: 'ped-tc-01',
                    numeroPedido: 'PV-TC-2026-0922',
                    ordemProducaoId: 'OP-LASER-310',
                    dataEmissao: '2026-08-12',
                    dataEntregaPrometida: '2026-09-02',
                    statusPedido: 'EM_PRODUCAO',
                    valorTotal: 210000.0,
                    margemTotalPercentual: 35.8,
                    otifStatus: 'EM_RISCO',
                    itens: [
                      {
                        id: 'item-tc-01',
                        codigo: 'CHAPA-CHASSI-8MM',
                        descricao: 'Longarina Dianteira Cortada a Laser Chapa Domex 700 8mm',
                        especificacaoTecnica: 'Corte sem escória, furação calibrada H7 e chanfro robotizado',
                        unidadeMedida: 'PC',
                        quantidadePedida: 120,
                        quantidadeProduzida: 80,
                        precoUnitarioVenda: 1750.0,
                        custoUnitarioPadrao: 1120.0,
                        custoUnitarioReal: 1124.0,
                        margemUnitarioPercentual: 35.8,
                        taxaRefugoItem: 2.1,
                        statusProducao: 'EM_PRODUCAO',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        codigo: 'TRITECH_IND',
        nomeFantasia: 'Tritech Indústria',
        cnpj: '51.109.822/0001-90',
        faturamento: 980000,
        margemLucro: 31.0,
        oee: 83.0,
        setores: [
          {
            id: 'set-ti-01',
            codigo: 'USINAGEM_PESADA',
            nome: 'Usinagem CNC & Mandrilamento Pesado',
            tipo: 'PRODUTIVO',
            responsavelNome: 'Carlos Alberto Mestre',
            oeeMedio: 83.0,
            custoHoraSetor: 195.0,
            totalHorasTrabalhadas: 380,
            clientes: [
              {
                id: 'cli-ti-01',
                cnpjCpf: '91.229.401/0001-50',
                razaoSocial: 'Kepler Weber S/A',
                nomeFantasia: 'Kepler Weber',
                segmentoMercado: 'Armazenagem de Grãos',
                scoreCredito: 940,
                limiteCredito: 1800000,
                exposicaoAtual: 320000,
                faturamentoAcumulado: 850000,
                pedidosQtd: 1,
                pedidos: [
                  {
                    id: 'ped-ti-01',
                    numeroPedido: 'PV-TI-2026-0305',
                    ordemProducaoId: 'OP-CNC-410',
                    dataEmissao: '2026-08-14',
                    dataEntregaPrometida: '2026-08-30',
                    statusPedido: 'EM_PRODUCAO',
                    valorTotal: 320000.0,
                    margemTotalPercentual: 31.0,
                    otifStatus: 'NO_PRAZO',
                    itens: [
                      {
                        id: 'item-ti-01',
                        codigo: 'EIXO-TRACIONADOR-120',
                        descricao: 'Eixo Tracionador Forjado SAE 4340 com Tratamento Térmico',
                        especificacaoTecnica: 'Retífica cilíndrica Ra 0.4 e têmpera por indução 58 HRC',
                        unidadeMedida: 'PC',
                        quantidadePedida: 40,
                        quantidadeProduzida: 32,
                        precoUnitarioVenda: 8000.0,
                        custoUnitarioPadrao: 5500.0,
                        custoUnitarioReal: 5520.0,
                        margemUnitarioPercentual: 31.0,
                        taxaRefugoItem: 0.0,
                        statusProducao: 'EM_PRODUCAO',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const faturamentoTotal = empresas.reduce((acc, curr) => acc + curr.faturamento, 0);

    return {
      id: 'grp-tritech-global',
      nomeGrupo: 'Grupo TRITECH Industrial (5 CNPJs)',
      faturamentoTotal,
      empresas,
    };
  }

  // -------------------------------------------------------------
  // 7. GESTÃO DE INDICADORES, METAS E ALERTAS
  // -------------------------------------------------------------
  public getIndicadoresCatalogo(): IndicadorDefinicao[] {
    return [...this.indicadores];
  }

  public getMetas(empresaId?: string): MetaIndicador[] {
    if (!empresaId || empresaId === 'GRUPO') return [...this.metas];
    return this.metas.filter((m) => m.empresaId === empresaId || m.empresaId === 'GRUPO');
  }

  public salvarMeta(meta: Omit<MetaIndicador, 'id'> & { id?: string }): MetaIndicador {
    const id = meta.id || `meta-${Date.now()}`;
    const novaMeta: MetaIndicador = { ...meta, id };
    const idx = this.metas.findIndex((m) => m.id === id);
    if (idx >= 0) {
      this.metas[idx] = novaMeta;
    } else {
      this.metas.push(novaMeta);
    }
    return novaMeta;
  }

  public getAlertas(empresaId?: string): BiAlerta[] {
    if (!empresaId || empresaId === 'GRUPO') return [...this.alertas];
    return this.alertas.filter((a) => a.empresaId === empresaId || a.empresaId === 'GRUPO');
  }

  public reconhecerAlerta(alertaId: string, usuarioNome: string): BiAlerta {
    const al = this.alertas.find((a) => a.id === alertaId);
    if (!al) throw new Error('Alerta não encontrado.');
    al.reconhecido = true;
    al.reconhecidoPor = usuarioNome;
    al.dataReconhecimento = new Date().toISOString().replace('T', ' ').substring(0, 16);
    return al;
  }

  public getConfigDashboard(tipo: BiDashboardConfig['dashboardTipo'], usuarioId: string = 'usr-admin-01'): BiDashboardConfig {
    const cfg = this.configsDashboard.find((c) => c.dashboardTipo === tipo && c.usuarioId === usuarioId);
    if (cfg) return cfg;
    return {
      id: `cfg-${tipo}-${Date.now()}`,
      usuarioId,
      empresaId: 'GRUPO',
      dashboardTipo: tipo,
      autoRefreshIntervalSegundos: 60,
      temaCores: 'PADRAO_TECNICO',
      widgetsVisiveis: [
        { widgetId: 'w-1', titulo: 'Cartões de KPIs Principais', visivel: true, posicaoOrdem: 1 },
        { widgetId: 'w-2', titulo: 'Gráficos de Tendência & Evolução', visivel: true, posicaoOrdem: 2 },
        { widgetId: 'w-3', titulo: 'Tabelas Detalhadas & Decomposição', visivel: true, posicaoOrdem: 3 },
        { widgetId: 'w-4', titulo: 'Painel de Alertas de Criticidade', visivel: true, posicaoOrdem: 4 },
      ],
    };
  }

  public salvarConfigDashboard(config: BiDashboardConfig): BiDashboardConfig {
    const idx = this.configsDashboard.findIndex((c) => c.id === config.id);
    if (idx >= 0) {
      this.configsDashboard[idx] = config;
    } else {
      this.configsDashboard.push(config);
    }
    return config;
  }

  // -------------------------------------------------------------
  // 8. SIMULAÇÃO DE EXPORTAÇÃO DE RELATÓRIO EXECUTIVO (PDF/EXCEL/CSV)
  // -------------------------------------------------------------
  public exportarRelatorioExecutivo(
    formato: 'PDF' | 'EXCEL' | 'CSV',
    dashboardTipo: string,
    empresaNome: string
  ): { sucesso: boolean; nomeArquivo: string; tamanhoBytes: number; hashDownload: string } {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14);
    const extensao = formato === 'PDF' ? 'pdf' : formato === 'EXCEL' ? 'xlsx' : 'csv';
    const nomeArquivo = `RELATORIO_BI_${dashboardTipo.toUpperCase()}_${empresaNome.replace(/\s+/g, '_').toUpperCase()}_${timestamp}.${extensao}`;

    return {
      sucesso: true,
      nomeArquivo,
      tamanhoBytes: formato === 'PDF' ? 1420500 : formato === 'EXCEL' ? 624000 : 185000,
      hashDownload: `SHA256-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
    };
  }
}

export const biAnalyticsService = new BiAnalyticsService();
