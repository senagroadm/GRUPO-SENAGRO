import {
  TransacaoIntercompanyRecord,
  RegraEliminacaoConfig,
  RateioCscRecord,
  ExposicaoClienteGrupoRecord,
  EstoqueEmpresaConsolidadoRecord,
  CaixaEmpresaConsolidadoRecord,
  DreConsolidadoLinha,
  FaturamentoConsolidadoEmpresa,
  FiltroConsolidacao,
  ResumoConsolidacaoGrupo,
  TipoTransacaoIntercompany,
} from './consolidacao-types';

export const GRUPO_EMPRESAS_FIXAS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    codigo: 'MWAM',
    nomeFantasia: 'MWAM Engenharia',
    razaoSocial: 'MWAM Engenharia e Serviços Industrial Ltda',
    cnpj: '44.566.045/0001-01',
    regime: 'LUCRO_PRESUMIDO',
    cor: '#4F46E5', // Indigo
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    codigo: 'OLIVEIRA_AMORIM',
    nomeFantasia: 'Oliveira & Amorim Distribuição',
    razaoSocial: 'Oliveira e Amorim Distribuição Ltda',
    cnpj: '26.200.037/0001-57',
    regime: 'LUCRO_REAL',
    cor: '#059669', // Emerald
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    codigo: 'SENAGRO',
    nomeFantasia: 'Senagro Indústria',
    razaoSocial: 'Senagro Indústria e Comércio Ltda',
    cnpj: '23.280.366/0001-67',
    regime: 'LUCRO_REAL',
    cor: '#D97706', // Amber
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    codigo: 'TRITECH_CORTE',
    nomeFantasia: 'Tritech Corte & Dobra',
    razaoSocial: 'Tritech Corte Dobra e Fabricação Ltda',
    cnpj: '48.082.502/0001-35',
    regime: 'LUCRO_REAL',
    cor: '#2563EB', // Blue
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    codigo: 'TRITECH_IND',
    nomeFantasia: 'Tritech Industrial',
    razaoSocial: 'Tritech Industrial Ltda',
    cnpj: '64.036.495/0001-91',
    regime: 'LUCRO_REAL',
    cor: '#7C3AED', // Violet
  },
];

export class ConsolidacaoService {
  private static instance: ConsolidacaoService;

  private transacoes: TransacaoIntercompanyRecord[] = [];
  private regras: RegraEliminacaoConfig[] = [];
  private rateios: RateioCscRecord[] = [];
  private exposicoesClientes: ExposicaoClienteGrupoRecord[] = [];

  private constructor() {
    this.seedInitialData();
  }

  public static getInstance(): ConsolidacaoService {
    if (!ConsolidacaoService.instance) {
      ConsolidacaoService.instance = new ConsolidacaoService();
    }
    return ConsolidacaoService.instance;
  }

  private seedInitialData(): void {
    // 1. Regras de Eliminação Gerencial Configuráveis
    this.regras = [
      {
        id: 'REG-001',
        codigo: 'ELIM_VENDAS_MERCANTIS',
        nome: 'Eliminação de Vendas Mercantis Intercompany',
        descricao: 'Anula a Receita Bruta de Venda na empresa vendedora contra o CPV/Custo de Aquisição na empresa compradora.',
        tipoOperacao: 'VENDA_MERCANTIL',
        ativo: true,
        eliminarReceitaCusto: true,
        eliminarAtivoPassivo: true,
        eliminarMargemEstoque: false,
        observacaoContabil: 'Evita a duplicação artificial da receita consolidada do grupo para operações entre os 5 CNPJs.',
      },
      {
        id: 'REG-002',
        codigo: 'ELIM_SERVICOS_COMPARTILHADOS',
        nome: 'Eliminação de Prestação de Serviços Intercompany',
        descricao: 'Elimina receita de serviços técnicos/industrialização (ex: laser, usinagem, projetos de engenharia) contra a despesa/custo de serviço contratado.',
        tipoOperacao: 'PRESTACAO_SERVICO',
        ativo: true,
        eliminarReceitaCusto: true,
        eliminarAtivoPassivo: true,
        eliminarMargemEstoque: false,
        observacaoContabil: 'Compensa a NFS-e emitida pela prestadora com o lançamento de despesa na tomadora do mesmo grupo.',
      },
      {
        id: 'REG-003',
        codigo: 'ELIM_RATEIOS_CSC',
        nome: 'Eliminação de Rateio do Centro de Serviços Compartilhados (CSC)',
        descricao: 'Zera as receitas de ressarcimento corporativo de TI, RH, Diretoria e Jurídico contra os custos rateados nas unidades operacionais.',
        tipoOperacao: 'RATEIO_CSC',
        ativo: true,
        eliminarReceitaCusto: true,
        eliminarAtivoPassivo: false,
        eliminarMargemEstoque: false,
        observacaoContabil: 'O CSC tem resultado neutro no consolidado global.',
      },
      {
        id: 'REG-004',
        codigo: 'ELIM_TRANSFERENCIAS_ESTOQUE',
        nome: 'Eliminação de Transferências de Estoque e Ativos',
        descricao: 'Neutraliza as notas fiscais de transferência (CFOP 5.151 / 5.152) que não geram faturamento efetivo para terceiros.',
        tipoOperacao: 'TRANSFERENCIA_ESTOQUE',
        ativo: true,
        eliminarReceitaCusto: true,
        eliminarAtivoPassivo: true,
        eliminarMargemEstoque: false,
        observacaoContabil: 'CFOPs de transferência entre filiais/empresas do grupo.',
      },
      {
        id: 'REG-005',
        codigo: 'ELIM_LUCRO_NAO_REALIZADO_ESTOQUE',
        nome: 'Expurgo de Margem Intercompany em Estoque Remanescente',
        descricao: 'Elimina a margem de lucro embutida nos itens que foram vendidos internamente mas continuam no estoque da compradora no fechamento.',
        tipoOperacao: 'ESTOQUE_LUCRO_NAO_REALIZADO',
        ativo: true,
        eliminarReceitaCusto: true,
        eliminarAtivoPassivo: false,
        eliminarMargemEstoque: true,
        observacaoContabil: 'Princípio de realização da receita: o lucro do grupo só existe quando a peça é faturada para cliente terceiro.',
      },
      {
        id: 'REG-006',
        codigo: 'ELIM_MUTUOS_SALDOS_CR_CP',
        nome: 'Eliminação de Mútuos e Saldos de Contas a Receber / Pagar Intercompany',
        descricao: 'Cancela o ativo de Contas a Receber Intercompany de uma empresa contra o passivo de Contas a Pagar Intercompany da outra.',
        tipoOperacao: 'MUTUO_FINANCEIRO',
        ativo: true,
        eliminarReceitaCusto: false,
        eliminarAtivoPassivo: true,
        eliminarMargemEstoque: false,
        observacaoContabil: 'Evita inflar o ativo circulante e o passivo circulante consolidado do grupo.',
      },
    ];

    // 2. Transações Intercompany Reais entre os 5 CNPJs
    this.transacoes = [
      {
        id: 'TX-INT-001',
        tipo: 'VENDA_MERCANTIL',
        empresaOrigemId: '22222222-2222-2222-2222-222222222222',
        empresaOrigemCodigo: 'OLIVEIRA_AMORIM',
        empresaOrigemNome: 'Oliveira & Amorim Distribuição',
        empresaDestinoId: '44444444-4444-4444-4444-444444444444',
        empresaDestinoCodigo: 'TRITECH_CORTE',
        empresaDestinoNome: 'Tritech Corte & Dobra',
        documentoRef: 'NF-e 004128/1',
        cfop: '5.151',
        dataEmissao: '2026-08-05',
        dataCompetencia: '2026-08',
        descricao: 'Venda de Bobinas de Aço Laminado a Frio SAE 1020 (32 Toneladas)',
        categoria: 'Matéria-Prima Aço',
        valorBruto: 184500.0,
        valorDeducoesImpostos: 22140.0,
        valorLiquido: 162360.0,
        custoOrigem: 142000.0,
        margemLucroEmbutida: 20360.0,
        percentualMargem: 12.54,
        statusReconciliacao: 'CONCILIADO',
        valorLancadoDestino: 184500.0,
        divergenciaValor: 0.0,
        eliminavel: true,
        statusEliminacao: 'A_ELIMINAR',
        reconciliadoPor: 'Carlos Contabilidade',
        reconciliadoEm: '2026-08-06T14:30:00.000Z',
      },
      {
        id: 'TX-INT-002',
        tipo: 'VENDA_MERCANTIL',
        empresaOrigemId: '22222222-2222-2222-2222-222222222222',
        empresaOrigemCodigo: 'OLIVEIRA_AMORIM',
        empresaOrigemNome: 'Oliveira & Amorim Distribuição',
        empresaDestinoId: '55555555-5555-5555-5555-555555555555',
        empresaDestinoCodigo: 'TRITECH_IND',
        empresaDestinoNome: 'Tritech Industrial',
        documentoRef: 'NF-e 004155/1',
        cfop: '5.151',
        dataEmissao: '2026-08-08',
        dataCompetencia: '2026-08',
        descricao: 'Fornecimento de Perfis Estruturais W250x33 e Vigas I de Alta Resistência',
        categoria: 'Matéria-Prima Estrutural',
        valorBruto: 295000.0,
        valorDeducoesImpostos: 35400.0,
        valorLiquido: 259600.0,
        custoOrigem: 228000.0,
        margemLucroEmbutida: 31600.0,
        percentualMargem: 12.17,
        statusReconciliacao: 'CONCILIADO',
        valorLancadoDestino: 295000.0,
        divergenciaValor: 0.0,
        eliminavel: true,
        statusEliminacao: 'A_ELIMINAR',
        reconciliadoPor: 'Carlos Contabilidade',
        reconciliadoEm: '2026-08-09T09:15:00.000Z',
      },
      {
        id: 'TX-INT-003',
        tipo: 'PRESTACAO_SERVICO',
        empresaOrigemId: '44444444-4444-4444-4444-444444444444',
        empresaOrigemCodigo: 'TRITECH_CORTE',
        empresaOrigemNome: 'Tritech Corte & Dobra',
        empresaDestinoId: '33333333-3333-3333-3333-333333333333',
        empresaDestinoCodigo: 'SENAGRO',
        empresaDestinoNome: 'Senagro Indústria',
        documentoRef: 'NFS-e 001923',
        cfop: 'NFS-E 14.01',
        dataEmissao: '2026-08-11',
        dataCompetencia: '2026-08',
        descricao: 'Serviço de Corte a Laser Fibra Óptica 12kW e Conformação CNC para Chassi de Colhedora',
        categoria: 'Industrialização por Encomenda',
        valorBruto: 112000.0,
        valorDeducoesImpostos: 8960.0,
        valorLiquido: 103040.0,
        custoOrigem: 78400.0,
        margemLucroEmbutida: 24640.0,
        percentualMargem: 23.91,
        statusReconciliacao: 'CONCILIADO',
        valorLancadoDestino: 112000.0,
        divergenciaValor: 0.0,
        eliminavel: true,
        statusEliminacao: 'A_ELIMINAR',
        reconciliadoPor: 'Mariana Controladoria',
        reconciliadoEm: '2026-08-12T11:00:00.000Z',
      },
      {
        id: 'TX-INT-004',
        tipo: 'PRESTACAO_SERVICO',
        empresaOrigemId: '11111111-1111-1111-1111-111111111111',
        empresaOrigemCodigo: 'MWAM',
        empresaOrigemNome: 'MWAM Engenharia',
        empresaDestinoId: '55555555-5555-5555-5555-555555555555',
        empresaDestinoCodigo: 'TRITECH_IND',
        empresaDestinoNome: 'Tritech Industrial',
        documentoRef: 'NFS-e 000882',
        cfop: 'NFS-E 07.02',
        dataEmissao: '2026-08-14',
        dataCompetencia: '2026-08',
        descricao: 'Elaboração de Projetos Estruturais em CAD/BIM e ART de Montagem Mecânica',
        categoria: 'Engenharia & Projetos',
        valorBruto: 85000.0,
        valorDeducoesImpostos: 6800.0,
        valorLiquido: 78200.0,
        custoOrigem: 51000.0,
        margemLucroEmbutida: 27200.0,
        percentualMargem: 34.78,
        statusReconciliacao: 'CONCILIADO',
        valorLancadoDestino: 85000.0,
        divergenciaValor: 0.0,
        eliminavel: true,
        statusEliminacao: 'A_ELIMINAR',
        reconciliadoPor: 'Mariana Controladoria',
        reconciliadoEm: '2026-08-15T16:20:00.000Z',
      },
      {
        id: 'TX-INT-005',
        tipo: 'RATEIO_CSC',
        empresaOrigemId: '11111111-1111-1111-1111-111111111111',
        empresaOrigemCodigo: 'MWAM',
        empresaOrigemNome: 'MWAM Engenharia (CSC Corporativo)',
        empresaDestinoId: '33333333-3333-3333-3333-333333333333',
        empresaDestinoCodigo: 'SENAGRO',
        empresaDestinoNome: 'Senagro Indústria',
        documentoRef: 'RAT-CSC-2026/08-01',
        cfop: 'RATEIO',
        dataEmissao: '2026-08-20',
        dataCompetencia: '2026-08',
        descricao: 'Rateio de TI, Sistemas ERP, Jurídico e RH Corporativo (Base Faturamento Share)',
        categoria: 'Rateio Corporativo CSC',
        valorBruto: 42500.0,
        valorDeducoesImpostos: 0.0,
        valorLiquido: 42500.0,
        custoOrigem: 42500.0,
        margemLucroEmbutida: 0.0,
        percentualMargem: 0.0,
        statusReconciliacao: 'CONCILIADO',
        valorLancadoDestino: 42500.0,
        divergenciaValor: 0.0,
        eliminavel: true,
        statusEliminacao: 'A_ELIMINAR',
      },
      {
        id: 'TX-INT-006',
        tipo: 'RATEIO_CSC',
        empresaOrigemId: '11111111-1111-1111-1111-111111111111',
        empresaOrigemCodigo: 'MWAM',
        empresaOrigemNome: 'MWAM Engenharia (CSC Corporativo)',
        empresaDestinoId: '22222222-2222-2222-2222-222222222222',
        empresaDestinoCodigo: 'OLIVEIRA_AMORIM',
        empresaDestinoNome: 'Oliveira & Amorim Distribuição',
        documentoRef: 'RAT-CSC-2026/08-02',
        cfop: 'RATEIO',
        dataEmissao: '2026-08-20',
        dataCompetencia: '2026-08',
        descricao: 'Rateio de TI, Sistemas ERP, Jurídico e RH Corporativo (Base Faturamento Share)',
        categoria: 'Rateio Corporativo CSC',
        valorBruto: 38200.0,
        valorDeducoesImpostos: 0.0,
        valorLiquido: 38200.0,
        custoOrigem: 38200.0,
        margemLucroEmbutida: 0.0,
        percentualMargem: 0.0,
        statusReconciliacao: 'CONCILIADO',
        valorLancadoDestino: 38200.0,
        divergenciaValor: 0.0,
        eliminavel: true,
        statusEliminacao: 'A_ELIMINAR',
      },
      {
        id: 'TX-INT-007',
        tipo: 'TRANSFERENCIA_ESTOQUE',
        empresaOrigemId: '44444444-4444-4444-4444-444444444444',
        empresaOrigemCodigo: 'TRITECH_CORTE',
        empresaOrigemNome: 'Tritech Corte & Dobra',
        empresaDestinoId: '55555555-5555-5555-5555-555555555555',
        empresaDestinoCodigo: 'TRITECH_IND',
        empresaDestinoNome: 'Tritech Industrial',
        documentoRef: 'NF-e 004189/1',
        cfop: '5.152',
        dataEmissao: '2026-08-22',
        dataCompetencia: '2026-08',
        descricao: 'Transferência de Retalhos de Chapa Grossa e Sobras Aproveitáveis para Caldeiraria Pesada',
        categoria: 'Transferência de Material',
        valorBruto: 34800.0,
        valorDeducoesImpostos: 0.0,
        valorLiquido: 34800.0,
        custoOrigem: 34800.0,
        margemLucroEmbutida: 0.0,
        percentualMargem: 0.0,
        statusReconciliacao: 'DIVERGENTE',
        valorLancadoDestino: 31200.0,
        divergenciaValor: 3600.0,
        motivoDivergencia: 'Destino deu entrada com desconto de pesagem na balança rodoviária (-1.2 Ton)',
        eliminavel: true,
        statusEliminacao: 'A_ELIMINAR',
      },
      {
        id: 'TX-INT-008',
        tipo: 'MUTUO_FINANCEIRO',
        empresaOrigemId: '55555555-5555-5555-5555-555555555555',
        empresaOrigemCodigo: 'TRITECH_IND',
        empresaOrigemNome: 'Tritech Industrial',
        empresaDestinoId: '11111111-1111-1111-1111-111111111111',
        empresaDestinoCodigo: 'MWAM',
        empresaDestinoNome: 'MWAM Engenharia',
        documentoRef: 'CTR-MUT-2026-03',
        cfop: 'MUTUO',
        dataEmissao: '2026-08-24',
        dataCompetencia: '2026-08',
        descricao: 'Empréstimo Mútuo entre Partes Relacionadas para Capital de Giro com CDI + 1.2% a.a.',
        categoria: 'Mútuo Financeiro Intercompany',
        valorBruto: 150000.0,
        valorDeducoesImpostos: 0.0,
        valorLiquido: 150000.0,
        custoOrigem: 150000.0,
        margemLucroEmbutida: 0.0,
        percentualMargem: 0.0,
        statusReconciliacao: 'PENDENTE',
        valorLancadoDestino: 0.0,
        divergenciaValor: 150000.0,
        motivoDivergencia: 'Aguardando validação do termo de mútuo e assinatura digital dos diretores',
        eliminavel: true,
        statusEliminacao: 'A_ELIMINAR',
      },
    ];

    // 3. Rateios do CSC
    this.rateios = [
      {
        id: 'RAT-2026-08-01',
        codigo: 'CSC-TI-INFRA',
        competencia: '2026-08',
        departamentoOrigem: 'TI, Servidores & ERP',
        empresaOrigemId: '11111111-1111-1111-1111-111111111111',
        empresaOrigemNome: 'MWAM Engenharia (CSC Matriz)',
        descricao: 'Licenças de Software ERP, Cloud, Links Dedicados e Suporte N3',
        valorTotalRateado: 65000.0,
        criterioRateio: 'HEADCOUNT_COLABORADORES',
        distribuicao: [
          { empresaId: '11111111-1111-1111-1111-111111111111', empresaCodigo: 'MWAM', empresaNome: 'MWAM', percentual: 18.46, valor: 12000.0, baseCalculoDescricao: '24 Colaboradores' },
          { empresaId: '22222222-2222-2222-2222-222222222222', empresaCodigo: 'OLIVEIRA_AMORIM', empresaNome: 'Oliveira & Amorim', percentual: 23.08, valor: 15000.0, baseCalculoDescricao: '30 Colaboradores' },
          { empresaId: '33333333-3333-3333-3333-333333333333', empresaCodigo: 'SENAGRO', empresaNome: 'Senagro Indústria', percentual: 24.62, valor: 16000.0, baseCalculoDescricao: '32 Colaboradores' },
          { empresaId: '44444444-4444-4444-4444-444444444444', empresaCodigo: 'TRITECH_CORTE', empresaNome: 'Tritech Corte & Dobra', percentual: 15.38, valor: 10000.0, baseCalculoDescricao: '20 Colaboradores' },
          { empresaId: '55555555-5555-5555-5555-555555555555', empresaCodigo: 'TRITECH_IND', empresaNome: 'Tritech Industrial', percentual: 18.46, valor: 12000.0, baseCalculoDescricao: '24 Colaboradores' },
        ],
        criadoEm: '2026-08-01T08:00:00.000Z',
        aprovadoPor: 'Diretoria Executiva',
      },
      {
        id: 'RAT-2026-08-02',
        codigo: 'CSC-RH-JURIDICO',
        competencia: '2026-08',
        departamentoOrigem: 'RH Corporativo & Jurídico',
        empresaOrigemId: '11111111-1111-1111-1111-111111111111',
        empresaOrigemNome: 'MWAM Engenharia (CSC Matriz)',
        descricao: 'Honorários Advocatícios Trabalhistas/Fiscais e Gestão Corporativa de Benefícios',
        valorTotalRateado: 48000.0,
        criterioRateio: 'FATURAMENTO_SHARE',
        distribuicao: [
          { empresaId: '11111111-1111-1111-1111-111111111111', empresaCodigo: 'MWAM', empresaNome: 'MWAM', percentual: 12.5, valor: 6000.0, baseCalculoDescricao: 'Share 12.5% Faturamento' },
          { empresaId: '22222222-2222-2222-2222-222222222222', empresaCodigo: 'OLIVEIRA_AMORIM', empresaNome: 'Oliveira & Amorim', percentual: 27.5, valor: 13200.0, baseCalculoDescricao: 'Share 27.5% Faturamento' },
          { empresaId: '33333333-3333-3333-3333-333333333333', empresaCodigo: 'SENAGRO', empresaNome: 'Senagro Indústria', percentual: 22.5, valor: 10800.0, baseCalculoDescricao: 'Share 22.5% Faturamento' },
          { empresaId: '44444444-4444-4444-4444-444444444444', empresaCodigo: 'TRITECH_CORTE', empresaNome: 'Tritech Corte & Dobra', percentual: 16.5, valor: 7920.0, baseCalculoDescricao: 'Share 16.5% Faturamento' },
          { empresaId: '55555555-5555-5555-5555-555555555555', empresaCodigo: 'TRITECH_IND', empresaNome: 'Tritech Industrial', percentual: 21.0, valor: 10080.0, baseCalculoDescricao: 'Share 21.0% Faturamento' },
        ],
        criadoEm: '2026-08-01T08:00:00.000Z',
        aprovadoPor: 'Diretoria Executiva',
      },
    ];

    // 4. Exposição de Clientes no Grupo (Clientes que compram de mais de uma empresa)
    this.exposicoesClientes = [
      {
        clienteId: 'CLI-GRP-001',
        razaoSocial: 'Usina Santa Terezinha Açúcar e Álcool S.A.',
        nomeFantasia: 'Usina Santa Terezinha',
        cnpj: '78.192.482/0001-44',
        segmento: 'Agroindustrial / Sucroalcooleiro',
        scoreCreditoGrupo: 885,
        ratingRisco: 'AAA',
        limiteCreditoGlobalAprovado: 1200000.0,
        exposicaoTotalGrupo: 892400.0,
        percentualUtilizacaoGlobal: 74.37,
        titulosVencidosTotal: 0.0,
        pddCalculadaTotal: 0.0,
        pedidosCarteiraTotal: 340000.0,
        statusLimite: 'DENTRO_LIMITE',
        empresasComOperacao: 4,
        posicaoPorEmpresa: [
          { empresaId: '11111111-1111-1111-1111-111111111111', empresaCodigo: 'MWAM', empresaNome: 'MWAM Engenharia', limiteAlocado: 250000.0, saldoAberto: 185000.0, saldoVencido: 0.0, diasMaiorAtraso: 0, pedidosEmCarteira: 80000.0, statusCreditoNaEmpresa: 'LIBERADO' },
          { empresaId: '22222222-2222-2222-2222-222222222222', empresaCodigo: 'OLIVEIRA_AMORIM', empresaNome: 'Oliveira & Amorim', limiteAlocado: 350000.0, saldoAberto: 290000.0, saldoVencido: 0.0, diasMaiorAtraso: 0, pedidosEmCarteira: 110000.0, statusCreditoNaEmpresa: 'LIBERADO' },
          { empresaId: '44444444-4444-4444-4444-444444444444', empresaCodigo: 'TRITECH_CORTE', empresaNome: 'Tritech Corte & Dobra', limiteAlocado: 200000.0, saldoAberto: 142400.0, saldoVencido: 0.0, diasMaiorAtraso: 0, pedidosEmCarteira: 50000.0, statusCreditoNaEmpresa: 'LIBERADO' },
          { empresaId: '55555555-5555-5555-5555-555555555555', empresaCodigo: 'TRITECH_IND', empresaNome: 'Tritech Industrial', limiteAlocado: 400000.0, saldoAberto: 275000.0, saldoVencido: 0.0, diasMaiorAtraso: 0, pedidosEmCarteira: 100000.0, statusCreditoNaEmpresa: 'LIBERADO' },
        ],
      },
      {
        clienteId: 'CLI-GRP-002',
        razaoSocial: 'AGCO do Brasil Máquinas Agrícolas Ltda',
        nomeFantasia: 'AGCO Valtra / Massey',
        cnpj: '58.392.102/0002-88',
        segmento: 'Montadora Agrícola OEM',
        scoreCreditoGrupo: 920,
        ratingRisco: 'AAA',
        limiteCreditoGlobalAprovado: 2000000.0,
        exposicaoTotalGrupo: 1785000.0,
        percentualUtilizacaoGlobal: 89.25,
        titulosVencidosTotal: 0.0,
        pddCalculadaTotal: 0.0,
        pedidosCarteiraTotal: 620000.0,
        statusLimite: 'ALERTA_80',
        empresasComOperacao: 3,
        posicaoPorEmpresa: [
          { empresaId: '22222222-2222-2222-2222-222222222222', empresaCodigo: 'OLIVEIRA_AMORIM', empresaNome: 'Oliveira & Amorim', limiteAlocado: 600000.0, saldoAberto: 540000.0, saldoVencido: 0.0, diasMaiorAtraso: 0, pedidosEmCarteira: 180000.0, statusCreditoNaEmpresa: 'ALERTA' },
          { empresaId: '33333333-3333-3333-3333-333333333333', empresaCodigo: 'SENAGRO', empresaNome: 'Senagro Indústria', limiteAlocado: 800000.0, saldoAberto: 725000.0, saldoVencido: 0.0, diasMaiorAtraso: 0, pedidosEmCarteira: 260000.0, statusCreditoNaEmpresa: 'ALERTA' },
          { empresaId: '44444444-4444-4444-4444-444444444444', empresaCodigo: 'TRITECH_CORTE', empresaNome: 'Tritech Corte & Dobra', limiteAlocado: 600000.0, saldoAberto: 520000.0, saldoVencido: 0.0, diasMaiorAtraso: 0, pedidosEmCarteira: 180000.0, statusCreditoNaEmpresa: 'ALERTA' },
        ],
      },
      {
        clienteId: 'CLI-GRP-003',
        razaoSocial: 'Construtora e Mineradora Vale do Rio Novo S.A.',
        nomeFantasia: 'Mineradora Rio Novo',
        cnpj: '19.482.901/0001-32',
        segmento: 'Mineração e Infraestrutura',
        scoreCreditoGrupo: 640,
        ratingRisco: 'B',
        limiteCreditoGlobalAprovado: 600000.0,
        exposicaoTotalGrupo: 685000.0,
        percentualUtilizacaoGlobal: 114.17,
        titulosVencidosTotal: 145000.0,
        pddCalculadaTotal: 43500.0,
        pedidosCarteiraTotal: 90000.0,
        statusLimite: 'LIMITE_ESTOURADO',
        empresasComOperacao: 3,
        posicaoPorEmpresa: [
          { empresaId: '11111111-1111-1111-1111-111111111111', empresaCodigo: 'MWAM', empresaNome: 'MWAM Engenharia', limiteAlocado: 150000.0, saldoAberto: 195000.0, saldoVencido: 45000.0, diasMaiorAtraso: 42, pedidosEmCarteira: 0.0, statusCreditoNaEmpresa: 'BLOQUEADO' },
          { empresaId: '44444444-4444-4444-4444-444444444444', empresaCodigo: 'TRITECH_CORTE', empresaNome: 'Tritech Corte & Dobra', limiteAlocado: 200000.0, saldoAberto: 210000.0, saldoVencido: 35000.0, diasMaiorAtraso: 28, pedidosEmCarteira: 20000.0, statusCreditoNaEmpresa: 'BLOQUEADO' },
          { empresaId: '55555555-5555-5555-5555-555555555555', empresaCodigo: 'TRITECH_IND', empresaNome: 'Tritech Industrial', limiteAlocado: 250000.0, saldoAberto: 280000.0, saldoVencido: 65000.0, diasMaiorAtraso: 55, pedidosEmCarteira: 70000.0, statusCreditoNaEmpresa: 'BLOQUEADO' },
        ],
      },
      {
        clienteId: 'CLI-GRP-004',
        razaoSocial: 'Randon Implementos e Participações S.A.',
        nomeFantasia: 'Randon Implementos',
        cnpj: '89.147.283/0003-12',
        segmento: 'Implementos Rodoviários',
        scoreCreditoGrupo: 910,
        ratingRisco: 'AAA',
        limiteCreditoGlobalAprovado: 1500000.0,
        exposicaoTotalGrupo: 980000.0,
        percentualUtilizacaoGlobal: 65.33,
        titulosVencidosTotal: 0.0,
        pddCalculadaTotal: 0.0,
        pedidosCarteiraTotal: 410000.0,
        statusLimite: 'DENTRO_LIMITE',
        empresasComOperacao: 2,
        posicaoPorEmpresa: [
          { empresaId: '22222222-2222-2222-2222-222222222222', empresaCodigo: 'OLIVEIRA_AMORIM', empresaNome: 'Oliveira & Amorim', limiteAlocado: 800000.0, saldoAberto: 530000.0, saldoVencido: 0.0, diasMaiorAtraso: 0, pedidosEmCarteira: 220000.0, statusCreditoNaEmpresa: 'LIBERADO' },
          { empresaId: '44444444-4444-4444-4444-444444444444', empresaCodigo: 'TRITECH_CORTE', empresaNome: 'Tritech Corte & Dobra', limiteAlocado: 700000.0, saldoAberto: 450000.0, saldoVencido: 0.0, diasMaiorAtraso: 0, pedidosEmCarteira: 190000.0, statusCreditoNaEmpresa: 'LIBERADO' },
        ],
      },
      {
        clienteId: 'CLI-GRP-005',
        razaoSocial: 'Coamo Agroindustrial Cooperativa',
        nomeFantasia: 'Coamo Agroindustrial',
        cnpj: '75.904.382/0001-09',
        segmento: 'Cooperativa Agrícola',
        scoreCreditoGrupo: 890,
        ratingRisco: 'AA',
        limiteCreditoGlobalAprovado: 1000000.0,
        exposicaoTotalGrupo: 620000.0,
        percentualUtilizacaoGlobal: 62.0,
        titulosVencidosTotal: 0.0,
        pddCalculadaTotal: 0.0,
        pedidosCarteiraTotal: 180000.0,
        statusLimite: 'DENTRO_LIMITE',
        empresasComOperacao: 2,
        posicaoPorEmpresa: [
          { empresaId: '33333333-3333-3333-3333-333333333333', empresaCodigo: 'SENAGRO', empresaNome: 'Senagro Indústria', limiteAlocado: 700000.0, saldoAberto: 440000.0, saldoVencido: 0.0, diasMaiorAtraso: 0, pedidosEmCarteira: 130000.0, statusCreditoNaEmpresa: 'LIBERADO' },
          { empresaId: '11111111-1111-1111-1111-111111111111', empresaCodigo: 'MWAM', empresaNome: 'MWAM Engenharia', limiteAlocado: 300000.0, saldoAberto: 180000.0, saldoVencido: 0.0, diasMaiorAtraso: 0, pedidosEmCarteira: 50000.0, statusCreditoNaEmpresa: 'LIBERADO' },
        ],
      },
    ];
  }

  // Obter Regras de Eliminação
  public getRegras(): RegraEliminacaoConfig[] {
    return [...this.regras];
  }

  public toggleRegra(regraId: string, ativo: boolean): void {
    const r = this.regras.find(x => x.id === regraId);
    if (r) {
      r.ativo = ativo;
    }
  }

  // Obter Transações Intercompany
  public getTransacoes(filtro?: Partial<FiltroConsolidacao>): TransacaoIntercompanyRecord[] {
    let list = [...this.transacoes];

    if (filtro?.competencia && filtro.competencia !== 'TODOS') {
      list = list.filter(t => t.dataCompetencia === filtro.competencia);
    }

    if (filtro?.empresasIds && filtro.empresasIds.length > 0) {
      list = list.filter(
        t => filtro.empresasIds!.includes(t.empresaOrigemId) || filtro.empresasIds!.includes(t.empresaDestinoId)
      );
    }

    if (filtro?.tiposOperacao && filtro.tiposOperacao.length > 0) {
      list = list.filter(t => filtro.tiposOperacao!.includes(t.tipo));
    }

    if (filtro?.statusReconciliacao && filtro.statusReconciliacao !== 'TODOS') {
      list = list.filter(t => t.statusReconciliacao === filtro.statusReconciliacao);
    }

    if (filtro?.apenasDivergentes) {
      list = list.filter(t => t.statusReconciliacao === 'DIVERGENTE' || t.statusReconciliacao === 'PENDENTE');
    }

    return list;
  }

  // Reconciliar Transação
  public reconciliarTransacao(id: string, usuario: string): boolean {
    const tx = this.transacoes.find(t => t.id === id);
    if (tx) {
      tx.statusReconciliacao = 'CONCILIADO';
      tx.valorLancadoDestino = tx.valorBruto;
      tx.divergenciaValor = 0;
      tx.motivoDivergencia = undefined;
      tx.reconciliadoPor = usuario;
      tx.reconciliadoEm = new Date().toISOString();
      return true;
    }
    return false;
  }

  // Adicionar Nova Transação Intercompany
  public adicionarTransacao(tx: Omit<TransacaoIntercompanyRecord, 'id'>): TransacaoIntercompanyRecord {
    const newTx: TransacaoIntercompanyRecord = {
      ...tx,
      id: `TX-INT-${String(this.transacoes.length + 1).padStart(3, '0')}`,
    };
    this.transacoes.push(newTx);
    return newTx;
  }

  // Obter Rateios CSC
  public getRateios(competencia?: string): RateioCscRecord[] {
    if (competencia && competencia !== 'TODOS') {
      return this.rateios.filter(r => r.competencia === competencia);
    }
    return [...this.rateios];
  }

  // ==========================================
  // 1. RELATÓRIO: FATURAMENTO POR EMPRESA
  // ==========================================
  public getFaturamentoPorEmpresa(filtro?: FiltroConsolidacao): FaturamentoConsolidadoEmpresa[] {
    // Dados base por empresa (simulados e calibrados com a realidade dos 5 CNPJs)
    const baseEmpresas: Record<string, { faturamentoBruto: number; pedidosTerceiros: number; ticketMedio: number }> = {
      '11111111-1111-1111-1111-111111111111': { faturamentoBruto: 780000.0, pedidosTerceiros: 28, ticketMedio: 23200.0 }, // MWAM
      '22222222-2222-2222-2222-222222222222': { faturamentoBruto: 2450000.0, pedidosTerceiros: 142, ticketMedio: 13800.0 }, // OLIVEIRA_AMORIM
      '33333333-3333-3333-3333-333333333333': { faturamentoBruto: 1850000.0, pedidosTerceiros: 46, ticketMedio: 39500.0 }, // SENAGRO
      '44444444-4444-4444-4444-444444444444': { faturamentoBruto: 1420000.0, pedidosTerceiros: 88, ticketMedio: 12800.0 }, // TRITECH_CORTE
      '55555555-5555-5555-5555-555555555555': { faturamentoBruto: 2150000.0, pedidosTerceiros: 34, ticketMedio: 63200.0 }, // TRITECH_IND
    };

    const regras = this.regras;
    const regraVendaAtiva = regras.find(r => r.codigo === 'ELIM_VENDAS_MERCANTIS')?.ativo ?? true;
    const regraServicoAtiva = regras.find(r => r.codigo === 'ELIM_SERVICOS_COMPARTILHADOS')?.ativo ?? true;

    // Calcular intercompany por empresa de origem
    const intercompanyPorEmpresa: Record<string, { vendas: number; servicos: number }> = {};
    GRUPO_EMPRESAS_FIXAS.forEach(emp => {
      intercompanyPorEmpresa[emp.id] = { vendas: 0, servicos: 0 };
    });

    this.transacoes.forEach(t => {
      if (intercompanyPorEmpresa[t.empresaOrigemId]) {
        if (t.tipo === 'VENDA_MERCANTIL') {
          intercompanyPorEmpresa[t.empresaOrigemId].vendas += t.valorBruto;
        } else if (t.tipo === 'PRESTACAO_SERVICO') {
          intercompanyPorEmpresa[t.empresaOrigemId].servicos += t.valorBruto;
        }
      }
    });

    const empresasFiltradas = GRUPO_EMPRESAS_FIXAS.filter(
      emp => !filtro?.empresasIds || filtro.empresasIds.length === 0 || filtro.empresasIds.includes(emp.id)
    );

    // Calcular total bruto terceiros para rateio do share
    let totalTerceirosGrupo = 0;
    const resultadosPre = empresasFiltradas.map(emp => {
      const base = baseEmpresas[emp.id] || { faturamentoBruto: 500000, pedidosTerceiros: 20, ticketMedio: 25000 };
      const ic = intercompanyPorEmpresa[emp.id] || { vendas: 0, servicos: 0 };

      const vendasIC = regraVendaAtiva ? ic.vendas : 0;
      const servicosIC = regraServicoAtiva ? ic.servicos : 0;
      const totalIC = vendasIC + servicosIC;

      const faturamentoTerceiros = Math.max(0, base.faturamentoBruto - totalIC);
      totalTerceirosGrupo += faturamentoTerceiros;

      return {
        empresaId: emp.id,
        empresaCodigo: emp.codigo,
        empresaNome: emp.nomeFantasia,
        faturamentoBrutoTotal: base.faturamentoBruto,
        vendasIntercompany: vendasIC,
        servicosIntercompany: servicosIC,
        totalIntercompany: totalIC,
        faturamentoMercadoTerceiros: faturamentoTerceiros,
        margemBrutaTerceirosPerc: emp.codigo === 'MWAM' ? 44.5 : emp.codigo === 'SENAGRO' ? 36.2 : emp.codigo === 'TRITECH_CORTE' ? 32.8 : emp.codigo === 'TRITECH_IND' ? 34.0 : 22.4,
        shareFaturamentoGrupoPerc: 0,
        ticketMedioTerceiros: base.ticketMedio,
        volumePedidosTerceiros: base.pedidosTerceiros,
      };
    });

    return resultadosPre.map(r => ({
      ...r,
      shareFaturamentoGrupoPerc: totalTerceirosGrupo > 0 ? (r.faturamentoMercadoTerceiros / totalTerceirosGrupo) * 100 : 0,
    }));
  }

  // ==========================================
  // 2. RELATÓRIO: DRE CONSOLIDADO & RESULTADO POR EMPRESA
  // ==========================================
  public getDreConsolidado(filtro?: FiltroConsolidacao): DreConsolidadoLinha[] {
    const faturamentos = this.getFaturamentoPorEmpresa(filtro);
    const regras = this.regras;

    const regraVendasAtiva = regras.find(r => r.codigo === 'ELIM_VENDAS_MERCANTIS')?.ativo ?? true;
    const regraServicosAtiva = regras.find(r => r.codigo === 'ELIM_SERVICOS_COMPARTILHADOS')?.ativo ?? true;
    const regraRateioAtiva = regras.find(r => r.codigo === 'ELIM_RATEIOS_CSC')?.ativo ?? true;
    const regraEstoqueAtiva = regras.find(r => r.codigo === 'ELIM_LUCRO_NAO_REALIZADO_ESTOQUE')?.ativo ?? true;

    // Calcular valores das eliminações
    let elimVendasMercantis = 0;
    let elimServicos = 0;
    let elimRateios = 0;
    let elimLucroEstoque = regraEstoqueAtiva ? 52000.0 : 0; // Margem não realizada acumulada no estoque intercompany

    this.transacoes.forEach(t => {
      if (t.tipo === 'VENDA_MERCANTIL' && regraVendasAtiva) {
        elimVendasMercantis += t.valorBruto;
      }
      if (t.tipo === 'PRESTACAO_SERVICO' && regraServicosAtiva) {
        elimServicos += t.valorBruto;
      }
      if (t.tipo === 'RATEIO_CSC' && regraRateioAtiva) {
        elimRateios += t.valorBruto;
      }
    });

    const totalElimFaturamento = elimVendasMercantis + elimServicos;

    // Mapeamento das 5 empresas
    const empIds = GRUPO_EMPRESAS_FIXAS.map(e => e.id);

    // Linha 1: Receita Bruta de Vendas e Serviços
    const recBrutaValores: Record<string, number> = {};
    let somaRecBruta = 0;
    faturamentos.forEach(f => {
      recBrutaValores[f.empresaId] = f.faturamentoBrutoTotal;
      somaRecBruta += f.faturamentoBrutoTotal;
    });

    // Linha 2: (-) Impostos sobre Vendas e Deduções (PIS/COFINS/ICMS/ISS)
    const impostosValores: Record<string, number> = {
      '11111111-1111-1111-1111-111111111111': -62400.0,  // MWAM (~8%)
      '22222222-2222-2222-2222-222222222222': -343000.0, // OLIVEIRA (~14%)
      '33333333-3333-3333-3333-333333333333': -259000.0, // SENAGRO (~14%)
      '44444444-4444-4444-4444-444444444444': -170400.0, // TRITECH_CORTE (~12%)
      '55555555-5555-5555-5555-555555555555': -301000.0, // TRITECH_IND (~14%)
    };
    let somaImpostos = Object.values(impostosValores).reduce((a, b) => a + b, 0);
    const elimImpostos = totalElimFaturamento * 0.12; // Impostos incidentes em notas intercompany

    // Linha 3: (=) Receita Líquida Operacional
    const recLiquidaValores: Record<string, number> = {};
    let somaRecLiquida = 0;
    empIds.forEach(id => {
      const rb = recBrutaValores[id] || 0;
      const imp = impostosValores[id] || 0;
      recLiquidaValores[id] = rb + imp;
      somaRecLiquida += recLiquidaValores[id];
    });
    const elimRecLiquida = -(totalElimFaturamento - elimImpostos);

    // Linha 4: (-) Custo dos Produtos e Serviços Vendidos (CPV / CSP)
    const cpvValores: Record<string, number> = {
      '11111111-1111-1111-1111-111111111111': -420000.0,
      '22222222-2222-2222-2222-222222222222': -1680000.0,
      '33333333-3333-3333-3333-333333333333': -1050000.0,
      '44444444-4444-4444-4444-444444444444': -860000.0,
      '55555555-5555-5555-5555-555555555555': -1260000.0,
    };
    let somaCpv = Object.values(cpvValores).reduce((a, b) => a + b, 0);
    // Eliminação do CPV: anula a compra intercompany e adiciona/expurga a margem não realizada no estoque
    const elimCpv = (totalElimFaturamento - elimImpostos) - elimLucroEstoque;

    // Linha 5: (=) Lucro Bruto
    const lucroBrutoValores: Record<string, number> = {};
    let somaLucroBruto = 0;
    empIds.forEach(id => {
      lucroBrutoValores[id] = (recLiquidaValores[id] || 0) + (cpvValores[id] || 0);
      somaLucroBruto += lucroBrutoValores[id];
    });
    const elimLucroBruto = -elimLucroEstoque; // Apenas o lucro não realizado permanece eliminado

    // Linha 6: (-) Despesas Operacionais (Vendas, Administrativas, Fretes)
    const despOperacionaisValores: Record<string, number> = {
      '11111111-1111-1111-1111-111111111111': -145000.0,
      '22222222-2222-2222-2222-222222222222': -210000.0,
      '33333333-3333-3333-3333-333333333333': -260000.0,
      '44444444-4444-4444-4444-444444444444': -185000.0,
      '55555555-5555-5555-5555-555555555555': -275000.0,
    };
    let somaDespOperacionais = Object.values(despOperacionaisValores).reduce((a, b) => a + b, 0);

    // Linha 7: (+/-) Rateios Corporativos CSC
    const rateioCscValores: Record<string, number> = {
      '11111111-1111-1111-1111-111111111111': 80700.0,  // Receita de ressarcimento CSC
      '22222222-2222-2222-2222-222222222222': -28200.0, // Despesa rateada
      '33333333-3333-3333-3333-333333333333': -26800.0,
      '44444444-4444-4444-4444-444444444444': -17920.0,
      '55555555-5555-5555-5555-555555555555': -22080.0,
    };
    let somaRateioCsc = Object.values(rateioCscValores).reduce((a, b) => a + b, 0);
    const elimRateiosCsc = regraRateioAtiva ? -somaRateioCsc : 0;

    // Linha 8: (=) EBITDA Gerencial
    const ebitdaValores: Record<string, number> = {};
    let somaEbitda = 0;
    empIds.forEach(id => {
      ebitdaValores[id] =
        (lucroBrutoValores[id] || 0) +
        (despOperacionaisValores[id] || 0) +
        (rateioCscValores[id] || 0);
      somaEbitda += ebitdaValores[id];
    });
    const elimEbitda = elimLucroBruto + elimRateiosCsc;

    // Linha 9: (-) Depreciação e Amortização
    const depValores: Record<string, number> = {
      '11111111-1111-1111-1111-111111111111': -18000.0,
      '22222222-2222-2222-2222-222222222222': -24000.0,
      '33333333-3333-3333-3333-333333333333': -48000.0,
      '44444444-4444-4444-4444-444444444444': -42000.0,
      '55555555-5555-5555-5555-555555555555': -65000.0,
    };
    let somaDep = Object.values(depValores).reduce((a, b) => a + b, 0);

    // Linha 10: (+/-) Resultado Financeiro Líquido (Juros / Rendimentos)
    const resFinValores: Record<string, number> = {
      '11111111-1111-1111-1111-111111111111': 14200.0,
      '22222222-2222-2222-2222-222222222222': -38000.0,
      '33333333-3333-3333-3333-333333333333': -22000.0,
      '44444444-4444-4444-4444-444444444444': -15000.0,
      '55555555-5555-5555-5555-555555555555': -32000.0,
    };
    let somaResFin = Object.values(resFinValores).reduce((a, b) => a + b, 0);

    // Linha 11: (-) IRPJ / CSLL (Provisão sobre o Lucro)
    const irCsllValores: Record<string, number> = {
      '11111111-1111-1111-1111-111111111111': -32000.0,
      '22222222-2222-2222-2222-222222222222': -36000.0,
      '33333333-3333-3333-3333-333333333333': -45000.0,
      '44444444-4444-4444-4444-444444444444': -38000.0,
      '55555555-5555-5555-5555-555555555555': -52000.0,
    };
    let somaIrCsll = Object.values(irCsllValores).reduce((a, b) => a + b, 0);

    // Linha 12: (=) Lucro Líquido do Exercício
    const lucroLiquidoValores: Record<string, number> = {};
    let somaLucroLiquido = 0;
    empIds.forEach(id => {
      lucroLiquidoValores[id] =
        (ebitdaValores[id] || 0) +
        (depValores[id] || 0) +
        (resFinValores[id] || 0) +
        (irCsllValores[id] || 0);
      somaLucroLiquido += lucroLiquidoValores[id];
    });
    const elimLucroLiquido = elimEbitda;

    return [
      {
        id: 'DRE-01',
        contaCodigo: '1.01',
        descricao: 'Receita Bruta Total (Vendas & Serviços)',
        tipo: 'SINTETICA',
        destaque: true,
        ehSubtotal: false,
        valoresPorEmpresa: recBrutaValores,
        somaBrutaCombinada: somaRecBruta,
        eliminacoesIntercompany: -totalElimFaturamento,
        consolidadoGrupo: somaRecBruta - totalElimFaturamento,
        detalheEliminacoes: `Eliminação de R$ ${totalElimFaturamento.toLocaleString('pt-BR')} (Vendas Mercantis: R$ ${elimVendasMercantis.toLocaleString('pt-BR')}, Serviços: R$ ${elimServicos.toLocaleString('pt-BR')})`,
      },
      {
        id: 'DRE-02',
        contaCodigo: '1.02',
        descricao: '(-) Deduções da Receita Bruta e Impostos',
        tipo: 'ANALITICA',
        destaque: false,
        ehSubtotal: false,
        valoresPorEmpresa: impostosValores,
        somaBrutaCombinada: somaImpostos,
        eliminacoesIntercompany: elimImpostos,
        consolidadoGrupo: somaImpostos + elimImpostos,
        detalheEliminacoes: 'Estorno de tributos incidentes nas operações entre partes relacionadas',
      },
      {
        id: 'DRE-03',
        contaCodigo: '1.03',
        descricao: '(=) Receita Líquida Operacional',
        tipo: 'SINTETICA',
        destaque: true,
        ehSubtotal: true,
        valoresPorEmpresa: recLiquidaValores,
        somaBrutaCombinada: somaRecLiquida,
        eliminacoesIntercompany: elimRecLiquida,
        consolidadoGrupo: somaRecLiquida + elimRecLiquida,
        detalheEliminacoes: 'Receita Líquida efetiva auferida exclusivamente com terceiros de mercado',
      },
      {
        id: 'DRE-04',
        contaCodigo: '2.01',
        descricao: '(-) Custo dos Produtos e Serviços Vendidos (CPV / CSP)',
        tipo: 'ANALITICA',
        destaque: false,
        ehSubtotal: false,
        valoresPorEmpresa: cpvValores,
        somaBrutaCombinada: somaCpv,
        eliminacoesIntercompany: elimCpv,
        consolidadoGrupo: somaCpv + elimCpv,
        detalheEliminacoes: `Anulação de compras internas + expurgo de margem não realizada no estoque (R$ ${elimLucroEstoque.toLocaleString('pt-BR')})`,
      },
      {
        id: 'DRE-05',
        contaCodigo: '3.01',
        descricao: '(=) Lucro Bruto Consolidado',
        tipo: 'SINTETICA',
        destaque: true,
        ehSubtotal: true,
        valoresPorEmpresa: lucroBrutoValores,
        somaBrutaCombinada: somaLucroBruto,
        eliminacoesIntercompany: elimLucroBruto,
        consolidadoGrupo: somaLucroBruto + elimLucroBruto,
        detalheEliminacoes: 'Margem bruta de contribuição do grupo sem duplicações intercompany',
      },
      {
        id: 'DRE-06',
        contaCodigo: '4.01',
        descricao: '(-) Despesas Operacionais (Comerciais, ADM e Fretes)',
        tipo: 'ANALITICA',
        destaque: false,
        ehSubtotal: false,
        valoresPorEmpresa: despOperacionaisValores,
        somaBrutaCombinada: somaDespOperacionais,
        eliminacoesIntercompany: 0,
        consolidadoGrupo: somaDespOperacionais,
        detalheEliminacoes: 'Despesas com equipes e estruturas físicas locais',
      },
      {
        id: 'DRE-07',
        contaCodigo: '4.02',
        descricao: '(+/-) Rateios Corporativos do CSC (Centro Serviços)',
        tipo: 'ANALITICA',
        destaque: false,
        ehSubtotal: false,
        valoresPorEmpresa: rateioCscValores,
        somaBrutaCombinada: somaRateioCsc,
        eliminacoesIntercompany: elimRateiosCsc,
        consolidadoGrupo: somaRateioCsc + elimRateiosCsc,
        detalheEliminacoes: 'Neutralização completa do resultado do CSC Corporativo no consolidado',
      },
      {
        id: 'DRE-08',
        contaCodigo: '5.01',
        descricao: '(=) EBITDA Gerencial Consolidado',
        tipo: 'SINTETICA',
        destaque: true,
        ehSubtotal: true,
        valoresPorEmpresa: ebitdaValores,
        somaBrutaCombinada: somaEbitda,
        eliminacoesIntercompany: elimEbitda,
        consolidadoGrupo: somaEbitda + elimEbitda,
        detalheEliminacoes: 'Geração operacional de caixa líquida do Grupo TRITECH',
      },
      {
        id: 'DRE-09',
        contaCodigo: '6.01',
        descricao: '(-) Depreciação e Amortização do Parque Fabril',
        tipo: 'ANALITICA',
        destaque: false,
        ehSubtotal: false,
        valoresPorEmpresa: depValores,
        somaBrutaCombinada: somaDep,
        eliminacoesIntercompany: 0,
        consolidadoGrupo: somaDep,
        detalheEliminacoes: 'Depreciação linear de maquinários industriais (Laser, Dobradeiras, Pontes)',
      },
      {
        id: 'DRE-10',
        contaCodigo: '7.01',
        descricao: '(+/-) Resultado Financeiro Líquido',
        tipo: 'ANALITICA',
        destaque: false,
        ehSubtotal: false,
        valoresPorEmpresa: resFinValores,
        somaBrutaCombinada: somaResFin,
        eliminacoesIntercompany: 0,
        consolidadoGrupo: somaResFin,
        detalheEliminacoes: 'Juros de capital de giro vs receitas de aplicações CDI',
      },
      {
        id: 'DRE-11',
        contaCodigo: '8.01',
        descricao: '(-) Provisão para IRPJ e CSLL',
        tipo: 'ANALITICA',
        destaque: false,
        ehSubtotal: false,
        valoresPorEmpresa: irCsllValores,
        somaBrutaCombinada: somaIrCsll,
        eliminacoesIntercompany: 0,
        consolidadoGrupo: somaIrCsll,
        detalheEliminacoes: 'Impostos sobre o lucro por CNPJ individual',
      },
      {
        id: 'DRE-12',
        contaCodigo: '9.01',
        descricao: '(=) Lucro Líquido Consolidado do Grupo',
        tipo: 'SINTETICA',
        destaque: true,
        ehSubtotal: true,
        valoresPorEmpresa: lucroLiquidoValores,
        somaBrutaCombinada: somaLucroLiquido,
        eliminacoesIntercompany: elimLucroLiquido,
        consolidadoGrupo: somaLucroLiquido + elimLucroLiquido,
        detalheEliminacoes: 'Resultado final real realizável pelos acionistas do Grupo TRITECH',
      },
    ];
  }

  // ==========================================
  // 3. RELATÓRIO: EXPOSIÇÃO DE CLIENTES NO GRUPO
  // ==========================================
  public getExposicoesClientes(filtroSegmento?: string, apenasRisco?: boolean): ExposicaoClienteGrupoRecord[] {
    let list = [...this.exposicoesClientes];
    if (filtroSegmento && filtroSegmento !== 'TODOS') {
      list = list.filter(c => c.segmento.toLowerCase().includes(filtroSegmento.toLowerCase()));
    }
    if (apenasRisco) {
      list = list.filter(c => c.statusLimite === 'LIMITE_ESTOURADO' || c.statusLimite === 'ALERTA_80' || c.titulosVencidosTotal > 0);
    }
    return list;
  }

  // ==========================================
  // 4. RELATÓRIO: ESTOQUE POR EMPRESA & LUCRO NÃO REALIZADO
  // ==========================================
  public getEstoquePorEmpresa(): EstoqueEmpresaConsolidadoRecord[] {
    const dados: EstoqueEmpresaConsolidadoRecord[] = [
      {
        empresaId: '11111111-1111-1111-1111-111111111111',
        empresaCodigo: 'MWAM',
        empresaNome: 'MWAM Engenharia',
        materiaPrimaValor: 180000.0,
        emProcessoValor: 240000.0,
        produtoAcabadoValor: 120000.0,
        estoqueTransitoIntercompanyValor: 0.0,
        totalEstoqueBruto: 540000.0,
        margemIntercompanyNaoRealizada: 0.0,
        totalEstoqueConsolidadoLiquido: 540000.0,
        giroEstoqueDias: 38,
        itensCriticos: 2,
      },
      {
        empresaId: '22222222-2222-2222-2222-222222222222',
        empresaCodigo: 'OLIVEIRA_AMORIM',
        empresaNome: 'Oliveira & Amorim Distribuição',
        materiaPrimaValor: 2150000.0,
        emProcessoValor: 120000.0,
        produtoAcabadoValor: 850000.0,
        estoqueTransitoIntercompanyValor: 45000.0,
        totalEstoqueBruto: 3165000.0,
        margemIntercompanyNaoRealizada: 0.0,
        totalEstoqueConsolidadoLiquido: 3165000.0,
        giroEstoqueDias: 52,
        itensCriticos: 8,
      },
      {
        empresaId: '33333333-3333-3333-3333-333333333333',
        empresaCodigo: 'SENAGRO',
        empresaNome: 'Senagro Indústria',
        materiaPrimaValor: 920000.0,
        emProcessoValor: 680000.0,
        produtoAcabadoValor: 1140000.0,
        estoqueTransitoIntercompanyValor: 28000.0,
        totalEstoqueBruto: 2768000.0,
        margemIntercompanyNaoRealizada: 18500.0, // Compras feitas da Tritech Corte que ainda estão em estoque
        totalEstoqueConsolidadoLiquido: 2749500.0,
        giroEstoqueDias: 64,
        itensCriticos: 5,
      },
      {
        empresaId: '44444444-4444-4444-4444-444444444444',
        empresaCodigo: 'TRITECH_CORTE',
        empresaNome: 'Tritech Corte & Dobra',
        materiaPrimaValor: 680000.0,
        emProcessoValor: 390000.0,
        produtoAcabadoValor: 340000.0,
        estoqueTransitoIntercompanyValor: 15000.0,
        totalEstoqueBruto: 1425000.0,
        margemIntercompanyNaoRealizada: 14200.0, // Aço comprado de Oliveira & Amorim em estoque
        totalEstoqueConsolidadoLiquido: 1410800.0,
        giroEstoqueDias: 34,
        itensCriticos: 3,
      },
      {
        empresaId: '55555555-5555-5555-5555-555555555555',
        empresaCodigo: 'TRITECH_IND',
        empresaNome: 'Tritech Industrial',
        materiaPrimaValor: 1120000.0,
        emProcessoValor: 850000.0,
        produtoAcabadoValor: 980000.0,
        estoqueTransitoIntercompanyValor: 34800.0,
        totalEstoqueBruto: 2984800.0,
        margemIntercompanyNaoRealizada: 19300.0, // Aço e serviços de Oliveira & Amorim e MWAM
        totalEstoqueConsolidadoLiquido: 2965500.0,
        giroEstoqueDias: 58,
        itensCriticos: 6,
      },
    ];

    return dados;
  }

  // ==========================================
  // 5. RELATÓRIO: CAIXA POR EMPRESA & MÚTUOS
  // ==========================================
  public getCaixaPorEmpresa(): CaixaEmpresaConsolidadoRecord[] {
    const dados: CaixaEmpresaConsolidadoRecord[] = [
      {
        empresaId: '11111111-1111-1111-1111-111111111111',
        empresaCodigo: 'MWAM',
        empresaNome: 'MWAM Engenharia',
        saldoBancosContaCorrente: 185400.0,
        saldoAplicacoesLiquidez: 420000.0,
        saldoCaixaGeral: 8500.0,
        saldoMutuoReceberIntercompany: 0.0,
        saldoMutuoPagarIntercompany: 150000.0, // Tomou mútuo da Tritech Ind
        saldoMutuoLiquido: -150000.0,
        caixaDisponivelEfetivo: 613900.0,
        projecaoFluxo30d: 210000.0,
        compromissosCurtoPrazo: 380000.0,
        indiceLiquidezSeca: 1.61,
      },
      {
        empresaId: '22222222-2222-2222-2222-222222222222',
        empresaCodigo: 'OLIVEIRA_AMORIM',
        empresaNome: 'Oliveira & Amorim Distribuição',
        saldoBancosContaCorrente: 342000.0,
        saldoAplicacoesLiquidez: 890000.0,
        saldoCaixaGeral: 12000.0,
        saldoMutuoReceberIntercompany: 479500.0, // Recebíveis intercompany das vendas de aço
        saldoMutuoPagarIntercompany: 0.0,
        saldoMutuoLiquido: 479500.0,
        caixaDisponivelEfetivo: 1244000.0,
        projecaoFluxo30d: 580000.0,
        compromissosCurtoPrazo: 820000.0,
        indiceLiquidezSeca: 1.51,
      },
      {
        empresaId: '33333333-3333-3333-3333-333333333333',
        empresaCodigo: 'SENAGRO',
        empresaNome: 'Senagro Indústria',
        saldoBancosContaCorrente: 215000.0,
        saldoAplicacoesLiquidez: 560000.0,
        saldoCaixaGeral: 6500.0,
        saldoMutuoReceberIntercompany: 0.0,
        saldoMutuoPagarIntercompany: 112000.0, // Pagar serviços para Tritech Corte
        saldoMutuoLiquido: -112000.0,
        caixaDisponivelEfetivo: 781500.0,
        projecaoFluxo30d: 340000.0,
        compromissosCurtoPrazo: 590000.0,
        indiceLiquidezSeca: 1.32,
      },
      {
        empresaId: '44444444-4444-4444-4444-444444444444',
        empresaCodigo: 'TRITECH_CORTE',
        empresaNome: 'Tritech Corte & Dobra',
        saldoBancosContaCorrente: 168000.0,
        saldoAplicacoesLiquidez: 340000.0,
        saldoCaixaGeral: 5000.0,
        saldoMutuoReceberIntercompany: 112000.0, // A receber da Senagro
        saldoMutuoPagarIntercompany: 184500.0, // A pagar para Oliveira & Amorim
        saldoMutuoLiquido: -72500.0,
        caixaDisponivelEfetivo: 513000.0,
        projecaoFluxo30d: 195000.0,
        compromissosCurtoPrazo: 410000.0,
        indiceLiquidezSeca: 1.25,
      },
      {
        empresaId: '55555555-5555-5555-5555-555555555555',
        empresaCodigo: 'TRITECH_IND',
        empresaNome: 'Tritech Industrial',
        saldoBancosContaCorrente: 295000.0,
        saldoAplicacoesLiquidez: 720000.0,
        saldoCaixaGeral: 15000.0,
        saldoMutuoReceberIntercompany: 150000.0, // Emprestou para MWAM
        saldoMutuoPagarIntercompany: 380000.0, // Pagar para Oliveira & Amorim e MWAM
        saldoMutuoLiquido: -230000.0,
        caixaDisponivelEfetivo: 1030000.0,
        projecaoFluxo30d: 460000.0,
        compromissosCurtoPrazo: 740000.0,
        indiceLiquidezSeca: 1.39,
      },
    ];

    return dados;
  }

  // ==========================================
  // 6. RESUMO EXECUTIVO DA CONSOLIDAÇÃO DO GRUPO
  // ==========================================
  public getResumoConsolidacao(filtro?: FiltroConsolidacao): ResumoConsolidacaoGrupo {
    const dre = this.getDreConsolidado(filtro);
    const faturamentos = this.getFaturamentoPorEmpresa(filtro);
    const estoque = this.getEstoquePorEmpresa();
    const caixa = this.getCaixaPorEmpresa();
    const transacoes = this.getTransacoes(filtro);

    const recBruta = dre.find(d => d.id === 'DRE-01')!;
    const cpv = dre.find(d => d.id === 'DRE-04')!;
    const ebitda = dre.find(d => d.id === 'DRE-08')!;
    const lucroLiquido = dre.find(d => d.id === 'DRE-12')!;

    const estoqueBruto = estoque.reduce((acc, curr) => acc + curr.totalEstoqueBruto, 0);
    const estoqueMargem = estoque.reduce((acc, curr) => acc + curr.margemIntercompanyNaoRealizada, 0);

    const caixaTotal = caixa.reduce((acc, curr) => acc + curr.caixaDisponivelEfetivo, 0);
    const mutuosTotal = caixa.reduce((acc, curr) => acc + curr.saldoMutuoReceberIntercompany, 0);

    const conciliadas = transacoes.filter(t => t.statusReconciliacao === 'CONCILIADO').length;
    const pendentes = transacoes.filter(t => t.statusReconciliacao === 'PENDENTE').length;
    const divergentes = transacoes.filter(t => t.statusReconciliacao === 'DIVERGENTE').length;
    const valorPendente = transacoes
      .filter(t => t.statusReconciliacao !== 'CONCILIADO')
      .reduce((acc, curr) => acc + curr.valorBruto, 0);

    const faturamentoEliminado = Math.abs(recBruta.eliminacoesIntercompany);
    const percentualElim = recBruta.somaBrutaCombinada > 0 ? (faturamentoEliminado / recBruta.somaBrutaCombinada) * 100 : 0;

    return {
      faturamentoBrutoCombinado: recBruta.somaBrutaCombinada,
      faturamentoIntercompanyEliminado: faturamentoEliminado,
      faturamentoConsolidadoTerceiros: recBruta.consolidadoGrupo,
      percentualEliminacaoFaturamento: percentualElim,

      custoBrutoCombinado: Math.abs(cpv.somaBrutaCombinada),
      custoIntercompanyEliminado: Math.abs(cpv.eliminacoesIntercompany),
      custoConsolidadoTerceiros: Math.abs(cpv.consolidadoGrupo),

      ebitdaCombinado: ebitda.somaBrutaCombinada,
      ebitdaConsolidado: ebitda.consolidadoGrupo,
      margemEbitdaConsolidada: recBruta.consolidadoGrupo > 0 ? (ebitda.consolidadoGrupo / recBruta.consolidadoGrupo) * 100 : 0,

      lucroLiquidoCombinado: lucroLiquido.somaBrutaCombinada,
      lucroLiquidoConsolidado: lucroLiquido.consolidadoGrupo,
      margemLiquidaConsolidada: recBruta.consolidadoGrupo > 0 ? (lucroLiquido.consolidadoGrupo / recBruta.consolidadoGrupo) * 100 : 0,

      estoqueBrutoTotal: estoqueBruto,
      lucroEstoqueEliminado: estoqueMargem,
      estoqueLiquidoConsolidado: estoqueBruto - estoqueMargem,

      caixaDisponivelTotal: caixaTotal,
      mutuosIntercompanyTotal: mutuosTotal,

      transacoesIntercompanyTotal: transacoes.length,
      transacoesConciliadas: conciliadas,
      transacoesPendentes: pendentes,
      transacoesDivergentes: divergentes,
      valorPendenteReconciliacao: valorPendente,
    };
  }
}
