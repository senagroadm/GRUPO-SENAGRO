// backend/modules/pcp/pcp-service.ts
// Motor de Planejamento e Controle da Produção (PCP) & Algoritmo Determinístico de MRP-I e MRP-II
// 100% Determinístico - Sem Inteligência Artificial

import {
  SetorPcp,
  OrdemProducao,
  OperacaoProducaoOP,
  MaterialRequeridoOP,
  NecessidadeLiquidaItem,
  SugestaoCompraMRP,
  SugestaoProducaoMRP,
  RiscoAtrasoProducao,
  CentroTrabalhoMaquina,
  SetorCapacidade,
  OperadorProducao,
  ManutencaoMaquina,
  CalendarioFabril,
  GanttItem,
  ResultadoCalculoMRP,
  PrioridadeProducao,
  AlgoritmoOrdenacaoFila,
  OrigemDemandaRastreavel,
} from './pcp-types';

export interface DemandaEntrada {
  id: string;
  pedidoVendaId?: string;
  pedidoVendaNumero?: string;
  clienteNome?: string;
  codigoItem: string;
  descricaoItem: string;
  tipoItem: 'MATERIA_PRIMA' | 'PRODUTO_FABRICADO' | 'COMPONENTE' | 'SUB_CONJUNTO';
  quantidade: number;
  unidadeMedida: string;
  dataEntregaPrometida: string;
  prioridade: PrioridadeProducao;
  projetoId?: string;
  revisaoId?: string;
}

export interface ItemEstoqueConsulta {
  codigo: string;
  descricao: string;
  unidadeMedida: string;
  estoqueFisicoTotal: number;
  materialBloqueado: number;
  reservasAtivas: number;
  comprasAbertas: number;
  comprasAbertasDocumentos?: string[];
  leadTimeCompraDias: number;
  custoUnitarioEstimado: number;
  fornecedorPreferencial?: string;
}

export interface ItemEngenhariaBOMConsulta {
  projetoId: string;
  projetoCodigo: string;
  projetoTitulo: string;
  revisaoId: string;
  revisaoVersao: string;
  produtoCodigo: string;
  produtoDescricao: string;
  leadTimeFabricacaoHoras: number;
  itensBOM: {
    codigo: string;
    descricao: string;
    tipoItem: 'MATERIA_PRIMA' | 'COMPONENTE' | 'SUB_CONJUNTO' | 'FIXACAO' | 'CONSUMIVEL';
    quantidadeLiquida: number;
    percentualPerda: number;
    unidadeMedida: string;
    custoUnitario: number;
  }[];
  operacoesRoteiro: {
    sequencia: number;
    operacaoNome: string;
    setor: SetorPcp;
    maquinaId: string;
    maquinaNome: string;
    ferramenta?: string;
    tempoSetupMinutos: number;
    tempoCicloMinutos: number;
    instrucaoTecnica?: string;
  }[];
}

class PcpService {
  private ordensProducao: OrdemProducao[] = [];
  private maquinas: CentroTrabalhoMaquina[] = [];
  private operadores: OperadorProducao[] = [];
  private manutencoes: ManutencaoMaquina[] = [];
  private calendarios: Map<string, CalendarioFabril> = new Map();
  private sugestoesCompra: SugestaoCompraMRP[] = [];
  private sugestoesProducao: SugestaoProducaoMRP[] = [];
  private ultimosRiscos: RiscoAtrasoProducao[] = [];
  private ultimasNecessidades: NecessidadeLiquidaItem[] = [];

  // Banco de Dados Simulado de Materiais, Estoques, Compras Abertas e Engenharia
  private catalogoEstoque: Map<string, ItemEstoqueConsulta> = new Map();
  private catalogoEngenharia: Map<string, ItemEngenhariaBOMConsulta> = new Map();
  private carteiraPedidos: DemandaEntrada[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const empresaTritech = '11111111-1111-1111-1111-111111111111'; // Tritech Metalúrgica
    const empresaMwam = '22222222-2222-2222-2222-222222222222'; // MWAM

    // 1. Calendário Fabril Padrão (2 Turnos = 16h/dia, Seg-Sex)
    const calTritech: CalendarioFabril = {
      empresaId: empresaTritech,
      diasUteisSemana: [1, 2, 3, 4, 5],
      turnos: [
        { id: 'T1', nome: '1º Turno (Manhã/Tarde)', inicio: '06:00', fim: '14:48', horasUteis: 8.0 },
        { id: 'T2', nome: '2º Turno (Tarde/Noite)', inicio: '14:48', fim: '23:36', horasUteis: 8.0 },
      ],
      paradas: [
        { id: 'PAR-01', data: '2026-09-07', descricao: 'Feriado Independência do Brasil', tipo: 'FERIADO' },
        { id: 'PAR-02', data: '2026-10-12', descricao: 'Feriado N. Sra. Aparecida', tipo: 'FERIADO' },
      ],
    };
    this.calendarios.set(empresaTritech, calTritech);
    this.calendarios.set(empresaMwam, { ...calTritech, empresaId: empresaMwam });

    // 2. Centros de Trabalho & Máquinas
    this.maquinas = [
      {
        id: 'maq-laser-fibra-01',
        empresaId: empresaTritech,
        codigo: 'MQ-LAS-01',
        nome: 'Corte Laser Fibra Óptica 12kW Trumpf TruLaser 5030',
        setor: 'CORTE_LASER',
        capacidadeHorasDiaNominal: 16.0,
        taxaEficienciaOEE: 85,
        capacidadeHorasDiaLiquida: 13.6,
        cargaProgramadaHoras: 10.5,
        taxaOcupacaoPercentual: 77.2,
        status: 'EM_PROCESSO',
        operadorPadraoNome: 'Carlos Eduardo Silveira',
      },
      {
        id: 'maq-dobra-cnc-01',
        empresaId: empresaTritech,
        codigo: 'MQ-DOB-01',
        nome: 'Prensa Dobradeira CNC 300T x 4000mm Bystronic',
        setor: 'DOBRA_CNC',
        capacidadeHorasDiaNominal: 16.0,
        taxaEficienciaOEE: 82,
        capacidadeHorasDiaLiquida: 13.1,
        cargaProgramadaHoras: 14.2, // Sobrecarga inicial proposital para teste de MRP
        taxaOcupacaoPercentual: 108.4,
        status: 'SOBRECARREGADA',
        operadorPadraoNome: 'Marcos Vinicius Mendes',
      },
      {
        id: 'maq-calandra-01',
        empresaId: empresaTritech,
        codigo: 'MQ-CAL-01',
        nome: 'Calandra Hidráulica 4 Rolos 2500mm Faccin',
        setor: 'CALDEIRARIA_SOLDA',
        capacidadeHorasDiaNominal: 16.0,
        taxaEficienciaOEE: 80,
        capacidadeHorasDiaLiquida: 12.8,
        cargaProgramadaHoras: 8.0,
        taxaOcupacaoPercentual: 62.5,
        status: 'DISPONIVEL',
        operadorPadraoNome: 'Josemar Caldeireiro',
      },
      {
        id: 'maq-solda-robot-01',
        empresaId: empresaTritech,
        codigo: 'MQ-ROB-01',
        nome: 'Célula Robotizada de Solda MIG/MAG Fanuc ArcMate',
        setor: 'CALDEIRARIA_SOLDA',
        capacidadeHorasDiaNominal: 16.0,
        taxaEficienciaOEE: 88,
        capacidadeHorasDiaLiquida: 14.08,
        cargaProgramadaHoras: 12.0,
        taxaOcupacaoPercentual: 85.2,
        status: 'EM_PROCESSO',
        operadorPadraoNome: 'Alexandre Soldador Especialista',
      },
      {
        id: 'maq-cnc-d800-01',
        empresaId: empresaTritech,
        codigo: 'MQ-CNC-01',
        nome: 'Centro de Usinagem Vertical Romi D800 (4 Eixos)',
        setor: 'USINAGEM',
        capacidadeHorasDiaNominal: 16.0,
        taxaEficienciaOEE: 85,
        capacidadeHorasDiaLiquida: 13.6,
        cargaProgramadaHoras: 9.5,
        taxaOcupacaoPercentual: 69.8,
        status: 'DISPONIVEL',
        operadorPadraoNome: 'Rodrigo Usinador CNC',
      },
      {
        id: 'maq-mandrilhadora-01',
        empresaId: empresaTritech,
        codigo: 'MQ-MAND-01',
        nome: 'Mandrilhadora CNC Fuso 110mm Tos Varnsdorf',
        setor: 'USINAGEM',
        capacidadeHorasDiaNominal: 16.0,
        taxaEficienciaOEE: 75,
        capacidadeHorasDiaLiquida: 12.0,
        cargaProgramadaHoras: 6.0,
        taxaOcupacaoPercentual: 50.0,
        status: 'EM_MANUTENCAO',
        operadorPadraoNome: 'Paulo Mecânico CNC',
      },
      {
        id: 'maq-cabine-pintura-01',
        empresaId: empresaTritech,
        codigo: 'MQ-PIN-01',
        nome: 'Cabine de Pintura Eletrostática & Líquida Epóxi 8m',
        setor: 'PINTURA_TRATAMENTO',
        capacidadeHorasDiaNominal: 16.0,
        taxaEficienciaOEE: 85,
        capacidadeHorasDiaLiquida: 13.6,
        cargaProgramadaHoras: 7.0,
        taxaOcupacaoPercentual: 51.5,
        status: 'DISPONIVEL',
        operadorPadraoNome: 'Lucas Pintor Industrial',
      },
      {
        id: 'maq-bancada-montagem-01',
        empresaId: empresaTritech,
        codigo: 'MQ-MONT-01',
        nome: 'Linha de Montagem Mecânica & Teste Hidrostático 100 bar',
        setor: 'MONTAGEM',
        capacidadeHorasDiaNominal: 16.0,
        taxaEficienciaOEE: 90,
        capacidadeHorasDiaLiquida: 14.4,
        cargaProgramadaHoras: 11.0,
        taxaOcupacaoPercentual: 76.4,
        status: 'EM_PROCESSO',
        operadorPadraoNome: 'Gilberto Mecânico Montador',
      },
    ];

    // 3. Operadores Fabris
    this.operadores = [
      {
        id: 'op-01',
        empresaId: empresaTritech,
        matricula: 'TR-1042',
        nome: 'Carlos Eduardo Silveira',
        setor: 'CORTE_LASER',
        turno: 'TURNO_1',
        qualificacoes: ['Operação Laser Fibra Trumpf', 'Nesting Lantek', 'Ponte Rolante'],
        disponibilidadeHorasDia: 8.0,
        horasAlocadasDia: 6.5,
        status: 'ALOCADO',
      },
      {
        id: 'op-02',
        empresaId: empresaTritech,
        matricula: 'TR-1043',
        nome: 'Marcos Vinicius Mendes',
        setor: 'DOBRA_CNC',
        turno: 'TURNO_1',
        qualificacoes: ['Dobra CNC Bystronic', 'Controle Dimensional Paquímetro/Traçador'],
        disponibilidadeHorasDia: 8.0,
        horasAlocadasDia: 8.0,
        status: 'ALOCADO',
      },
      {
        id: 'op-03',
        empresaId: empresaTritech,
        matricula: 'TR-1088',
        nome: 'Alexandre Vieira da Silva',
        setor: 'CALDEIRARIA_SOLDA',
        turno: 'TURNO_1',
        qualificacoes: ['Soldador ASME IX / AWS D1.1', 'Solda MIG/MAG 6G', 'Célula Robótica'],
        disponibilidadeHorasDia: 8.0,
        horasAlocadasDia: 7.0,
        status: 'ALOCADO',
      },
      {
        id: 'op-04',
        empresaId: empresaTritech,
        matricula: 'TR-1090',
        nome: 'Josemar Caldeireiro Silva',
        setor: 'CALDEIRARIA_SOLDA',
        turno: 'TURNO_2',
        qualificacoes: ['Caldeiraria Pesada', 'Calandragem 4 Rolos', 'Gabaritagem'],
        disponibilidadeHorasDia: 8.0,
        horasAlocadasDia: 6.0,
        status: 'ALOCADO',
      },
      {
        id: 'op-05',
        empresaId: empresaTritech,
        matricula: 'TR-1102',
        nome: 'Rodrigo Usinador CNC',
        setor: 'USINAGEM',
        turno: 'TURNO_1',
        qualificacoes: ['Programação ISO Fanuc/Siemens', 'Centro Romi D800', 'Torno CNC'],
        disponibilidadeHorasDia: 8.0,
        horasAlocadasDia: 6.0,
        status: 'ALOCADO',
      },
      {
        id: 'op-06',
        empresaId: empresaTritech,
        matricula: 'TR-1150',
        nome: 'Lucas Pintor Industrial',
        setor: 'PINTURA_TRATAMENTO',
        turno: 'TURNO_1',
        qualificacoes: ['Pintura Epóxi/Poliuretano', 'Jateamento SA 2.5', 'Medição Micragem'],
        disponibilidadeHorasDia: 8.0,
        horasAlocadasDia: 5.5,
        status: 'ALOCADO',
      },
      {
        id: 'op-07',
        empresaId: empresaTritech,
        matricula: 'TR-1180',
        nome: 'Gilberto Mecânico Montador',
        setor: 'MONTAGEM',
        turno: 'TURNO_1',
        qualificacoes: ['Montagem Pesada', 'Torqueamento com Torquímetro', 'Teste Hidrostático'],
        disponibilidadeHorasDia: 8.0,
        horasAlocadasDia: 7.0,
        status: 'ALOCADO',
      },
    ];

    // 4. Manutenções de Máquinas
    this.manutencoes = [
      {
        id: 'manut-01',
        empresaId: empresaTritech,
        maquinaId: 'maq-mandrilhadora-01',
        maquinaNome: 'Mandrilhadora CNC Fuso 110mm Tos Varnsdorf',
        tipo: 'PREVENTIVA',
        descricao: 'Troca de óleo hidráulico do cabeçote e calibração geométrica de guias lineares',
        dataInicio: '2026-08-25T07:00:00.000Z',
        dataFim: '2026-08-27T18:00:00.000Z',
        duracaoHoras: 24,
        impactaCapacidade: true,
        status: 'EM_ANDAMENTO',
        tecnicoResponsavel: 'Eng. Manutenção Mecânica Externa',
      },
      {
        id: 'manut-02',
        empresaId: empresaTritech,
        maquinaId: 'maq-laser-fibra-01',
        maquinaNome: 'Corte Laser Fibra Óptica 12kW Trumpf TruLaser 5030',
        tipo: 'PREDITIVA',
        descricao: 'Limpeza de lentes ópticas de corte e alinhamento de bicos cerâmicos',
        dataInicio: '2026-09-01T12:00:00.000Z',
        dataFim: '2026-09-01T16:00:00.000Z',
        duracaoHoras: 4,
        impactaCapacidade: true,
        status: 'AGENDADA',
        tecnicoResponsavel: 'Técnico Especialista Trumpf',
      },
    ];

    // 5. Catálogo de Estoque & Suprimentos Industriais (com saldos, bloqueados, reservas e compras abertas)
    this.catalogoEstoque.set('MP-CH-A516-12.7', {
      codigo: 'MP-CH-A516-12.7',
      descricao: 'Chapa de Aço Carbono Caldeiraria ASTM A516 Gr 70 - 12.7mm x 2000 x 6000mm',
      unidadeMedida: 'CHAPA',
      estoqueFisicoTotal: 8,
      materialBloqueado: 2, // 2 chapas bloqueadas por laudo químico pendente
      reservasAtivas: 3, // 3 chapas reservadas para OP-2026-0080
      // Saldo líquido livre = 8 - 2 - 3 = 3 chapas livres
      comprasAbertas: 5, // Pedido PC-2026-0045 em trânsito
      comprasAbertasDocumentos: ['PC-2026-0045'],
      leadTimeCompraDias: 12,
      custoUnitarioEstimado: 3800.0,
      fornecedorPreferencial: 'Gerdau Aços Especiais S.A.',
    });

    this.catalogoEstoque.set('MP-CH-1020-6.35', {
      codigo: 'MP-CH-1020-6.35',
      descricao: 'Chapa de Aço SAE 1020 1/4" (6.35mm) x 1500 x 6000mm',
      unidadeMedida: 'CHAPA',
      estoqueFisicoTotal: 10,
      materialBloqueado: 0,
      reservasAtivas: 6,
      // Saldo livre = 10 - 0 - 6 = 4 chapas livres
      comprasAbertas: 0, // NENHUMA COMPRA ABERTA
      leadTimeCompraDias: 7,
      custoUnitarioEstimado: 1250.0,
      fornecedorPreferencial: 'Usiminas Distribuição Aço',
    });

    this.catalogoEstoque.set('MP-TUBO-SCH40-4POL', {
      codigo: 'MP-TUBO-SCH40-4POL',
      descricao: 'Tubo de Aço Carbono Sem Costura ASTM A106 Gr B 4" SCH 40',
      unidadeMedida: 'BARRA_6M',
      estoqueFisicoTotal: 4,
      materialBloqueado: 1, // 1 barra amassada / quarentena
      reservasAtivas: 3,
      // Saldo livre = 4 - 1 - 3 = 0 barras livres! (Gargalo Imediato)
      comprasAbertas: 0,
      leadTimeCompraDias: 10,
      custoUnitarioEstimado: 890.0,
      fornecedorPreferencial: 'Vallourec Tubos do Brasil',
    });

    this.catalogoEstoque.set('COMP-FLANGE-WN-150-4POL', {
      codigo: 'COMP-FLANGE-WN-150-4POL',
      descricao: 'Flange Welding Neck ANSI B16.5 150# 4" ASTM A105',
      unidadeMedida: 'UN',
      estoqueFisicoTotal: 2,
      materialBloqueado: 0,
      reservasAtivas: 2,
      // Saldo livre = 0!
      comprasAbertas: 8, // Já possui compra aberta PC-2026-0048 com 8 unidades que cobre totalmente os 2 vasos (2 x 4 = 8)
      comprasAbertasDocumentos: ['PC-2026-0048'],
      leadTimeCompraDias: 8,
      custoUnitarioEstimado: 210.0,
      fornecedorPreferencial: 'Metalúrgica Flanges Brasil',
    });

    this.catalogoEstoque.set('FIX-ESTOJO-B7-5-8', {
      codigo: 'FIX-ESTOJO-B7-5-8',
      descricao: 'Estojo ASTM A193 B7 5/8" x 100mm com 2 Porcas 2H Galvanizado a Fogo',
      unidadeMedida: 'CONJUNTO',
      estoqueFisicoTotal: 80,
      materialBloqueado: 0,
      reservasAtivas: 40,
      comprasAbertas: 0,
      leadTimeCompraDias: 4,
      custoUnitarioEstimado: 18.5,
      fornecedorPreferencial: 'Ciser Parafusos e Porcas',
    });

    this.catalogoEstoque.set('CONS-ARAME-MIG-ER70S6', {
      codigo: 'CONS-ARAME-MIG-ER70S6',
      descricao: 'Arame de Solda Sólido MIG/MAG AWS A5.18 ER70S-6 1.2mm Carretel 15kg',
      unidadeMedida: 'CARRETEL',
      estoqueFisicoTotal: 5,
      materialBloqueado: 0,
      reservasAtivas: 4,
      // Saldo livre = 1 carretel
      comprasAbertas: 0,
      leadTimeCompraDias: 3,
      custoUnitarioEstimado: 240.0,
      fornecedorPreferencial: 'ESAB Soldagem & Corte',
    });

    // 6. Catálogo de Engenharia & BOMs (BOM multinível com perdas técnicas de nesting)
    this.catalogoEngenharia.set('PRJ-2026-CHAS-01', {
      projetoId: 'prj-chassi-escavadeira-2026',
      projetoCodigo: 'PRJ-2026-CHAS-01',
      projetoTitulo: 'Chassi Estrutural Reforçado para Escavadeira Hidráulica 22T',
      revisaoId: 'rev-chassi-01',
      revisaoVersao: 'Rev 01',
      produtoCodigo: 'CHASSI-ESC-22T',
      produtoDescricao: 'Chassi Estrutural Escavadeira 22T',
      leadTimeFabricacaoHoras: 48,
      itensBOM: [
        {
          codigo: 'MP-CH-1020-6.35',
          descricao: 'Chapa de Aço SAE 1020 1/4" (6.35mm)',
          tipoItem: 'MATERIA_PRIMA',
          quantidadeLiquida: 2,
          percentualPerda: 8.0, // 8% perda nesting
          unidadeMedida: 'CHAPA',
          custoUnitario: 1250.0,
        },
        {
          codigo: 'CONS-ARAME-MIG-ER70S6',
          descricao: 'Arame de Solda ER70S-6 1.2mm',
          tipoItem: 'CONSUMIVEL',
          quantidadeLiquida: 1,
          percentualPerda: 5.0,
          unidadeMedida: 'CARRETEL',
          custoUnitario: 240.0,
        },
      ],
      operacoesRoteiro: [
        {
          sequencia: 10,
          operacaoNome: 'Corte Laser das Chapas do Chassi',
          setor: 'CORTE_LASER',
          maquinaId: 'maq-laser-fibra-01',
          maquinaNome: 'Corte Laser Fibra Óptica 12kW Trumpf',
          tempoSetupMinutos: 30,
          tempoCicloMinutos: 90,
          instrucaoTecnica: 'Nesting programa CNC-CHAS-R01',
        },
        {
          sequencia: 20,
          operacaoNome: 'Dobra e Conformação dos Reforços Longitudinais',
          setor: 'DOBRA_CNC',
          maquinaId: 'maq-dobra-cnc-01',
          maquinaNome: 'Prensa Dobradeira CNC 300T Bystronic',
          tempoSetupMinutos: 45,
          tempoCicloMinutos: 75,
          instrucaoTecnica: 'Controlar ângulo 90° com transferidor digital',
        },
        {
          sequencia: 30,
          operacaoNome: 'Ponteamento e Soldagem Estrutural MIG/MAG',
          setor: 'CALDEIRARIA_SOLDA',
          maquinaId: 'maq-solda-robot-01',
          maquinaNome: 'Célula Robotizada de Solda Fanuc',
          tempoSetupMinutos: 40,
          tempoCicloMinutos: 180,
          instrucaoTecnica: 'Solda contínua penetração total chanfro V',
        },
        {
          sequencia: 40,
          operacaoNome: 'Pintura Epóxi Fundo Primer + Acabamento Amarelo Segurança',
          setor: 'PINTURA_TRATAMENTO',
          maquinaId: 'maq-cabine-pintura-01',
          maquinaNome: 'Cabine de Pintura Eletrostática & Líquida',
          tempoSetupMinutos: 20,
          tempoCicloMinutos: 60,
          instrucaoTecnica: 'Espessura camada seca mínima 120 micrometros',
        },
      ],
    });

    this.catalogoEngenharia.set('PRJ-2026-VASO-02', {
      projetoId: 'prj-vaso-pressao-02',
      projetoCodigo: 'PRJ-2026-VASO-02',
      projetoTitulo: 'Vaso de Pressão Horizontal 12m³ ASME VIII Div 1',
      revisaoId: 'rev-vaso-00',
      revisaoVersao: 'Rev 00',
      produtoCodigo: 'VASO-PRESSAO-12M3',
      produtoDescricao: 'Vaso de Pressão Horizontal 12m³',
      leadTimeFabricacaoHoras: 72,
      itensBOM: [
        {
          codigo: 'MP-CH-A516-12.7',
          descricao: 'Chapa ASTM A516 Gr 70 12.7mm',
          tipoItem: 'MATERIA_PRIMA',
          quantidadeLiquida: 3,
          percentualPerda: 6.0,
          unidadeMedida: 'CHAPA',
          custoUnitario: 3800.0,
        },
        {
          codigo: 'MP-TUBO-SCH40-4POL',
          descricao: 'Tubo Sem Costura 4" SCH 40',
          tipoItem: 'MATERIA_PRIMA',
          quantidadeLiquida: 2,
          percentualPerda: 5.0,
          unidadeMedida: 'BARRA_6M',
          custoUnitario: 890.0,
        },
        {
          codigo: 'COMP-FLANGE-WN-150-4POL',
          descricao: 'Flange WN ANSI 150# 4"',
          tipoItem: 'COMPONENTE',
          quantidadeLiquida: 4,
          percentualPerda: 0.0,
          unidadeMedida: 'UN',
          custoUnitario: 210.0,
        },
        {
          codigo: 'FIX-ESTOJO-B7-5-8',
          descricao: 'Estojo B7 5/8" x 100mm com 2 Porcas 2H',
          tipoItem: 'FIXACAO',
          quantidadeLiquida: 32,
          percentualPerda: 0.0,
          unidadeMedida: 'CONJUNTO',
          custoUnitario: 18.5,
        },
      ],
      operacoesRoteiro: [
        {
          sequencia: 10,
          operacaoNome: 'Corte e Chanframento das Chapas de Casco e Tampos',
          setor: 'CORTE_LASER',
          maquinaId: 'maq-laser-fibra-01',
          maquinaNome: 'Corte Laser Fibra Óptica 12kW Trumpf',
          tempoSetupMinutos: 30,
          tempoCicloMinutos: 120,
          instrucaoTecnica: 'Chanfro X 30° conforme WPS-01',
        },
        {
          sequencia: 20,
          operacaoNome: 'Calandragem do Casco Cilíndrico',
          setor: 'CALDEIRARIA_SOLDA',
          maquinaId: 'maq-calandra-01',
          maquinaNome: 'Calandra Hidráulica 4 Rolos 2500mm Faccin',
          tempoSetupMinutos: 40,
          tempoCicloMinutos: 140,
          instrucaoTecnica: 'Controlar diâmetro interno 1800mm e ovalização < 1%',
        },
        {
          sequencia: 30,
          operacaoNome: 'Soldagem Longitudinal e Circunferencial SAW/MIG',
          setor: 'CALDEIRARIA_SOLDA',
          maquinaId: 'maq-solda-robot-01',
          maquinaNome: 'Célula Robotizada de Solda Fanuc',
          tempoSetupMinutos: 60,
          tempoCicloMinutos: 240,
          instrucaoTecnica: 'Solda qualificada ASME IX, inspeção 100% ultrassom',
        },
        {
          sequencia: 40,
          operacaoNome: 'Usinagem das Faces dos Bocais e Flanges',
          setor: 'USINAGEM',
          maquinaId: 'maq-cnc-d800-01',
          maquinaNome: 'Centro de Usinagem Romi D800',
          tempoSetupMinutos: 45,
          tempoCicloMinutos: 90,
          instrucaoTecnica: 'Rugosidade Ra 3.2 a 6.3 micrometros nas ranhuras',
        },
        {
          sequencia: 50,
          operacaoNome: 'Montagem Final e Teste Hidrostático 1.5x PMTA',
          setor: 'MONTAGEM',
          maquinaId: 'maq-bancada-montagem-01',
          maquinaNome: 'Linha de Montagem Mecânica & Teste Hidrostático',
          tempoSetupMinutos: 60,
          tempoCicloMinutos: 180,
          instrucaoTecnica: 'Pressurizar a 15 kgf/cm² por 30 min sem queda de pressão',
        },
      ],
    });

    // 7. Carteira de Pedidos de Venda Aprovados (Demanda Externa)
    this.carteiraPedidos = [
      {
        id: 'dem-pv-01',
        pedidoVendaId: 'ped-2026-0042',
        pedidoVendaNumero: 'PV-2026-0042',
        clienteNome: 'Caterpillar Brasil Equipamentos Pesados',
        codigoItem: 'CHASSI-ESC-22T',
        descricaoItem: 'Chassi Estrutural Reforçado Escavadeira 22T',
        tipoItem: 'PRODUTO_FABRICADO',
        quantidade: 3,
        unidadeMedida: 'UN',
        dataEntregaPrometida: '2026-09-15T00:00:00.000Z',
        prioridade: 'ALTA',
        projetoId: 'prj-chassi-escavadeira-2026',
        revisaoId: 'rev-chassi-01',
      },
      {
        id: 'dem-pv-02',
        pedidoVendaId: 'ped-2026-0048',
        pedidoVendaNumero: 'PV-2026-0048',
        clienteNome: 'Petrobras S.A. - Refinaria RPBC',
        codigoItem: 'VASO-PRESSAO-12M3',
        descricaoItem: 'Vaso de Pressão Horizontal 12m³ ASME VIII',
        tipoItem: 'PRODUTO_FABRICADO',
        quantidade: 2,
        unidadeMedida: 'UN',
        dataEntregaPrometida: '2026-09-10T00:00:00.000Z', // Prazo curto proposital para gerar alerta de lead time
        prioridade: 'URGENTE',
        projetoId: 'prj-vaso-pressao-02',
        revisaoId: 'rev-vaso-00',
      },
    ];

    // 8. OPs Existentes no Chão de Fábrica
    const op1Id = 'op-2026-0080';
    this.ordensProducao = [
      {
        id: op1Id,
        empresaId: empresaTritech,
        numeroOp: 'OP-2026-0080',
        origemTipo: 'PEDIDO_VENDA',
        pedidoVendaId: 'ped-2026-0030',
        pedidoVendaNumero: 'PV-2026-0030',
        clienteNome: 'Komatsu do Brasil',
        projetoId: 'prj-chassi-escavadeira-2026',
        projetoCodigo: 'PRJ-2026-CHAS-01',
        projetoTitulo: 'Chassi Estrutural Reforçado para Escavadeira 22T',
        revisaoId: 'rev-chassi-01',
        revisaoVersao: 'Rev 01',
        codigoItem: 'CHASSI-ESC-22T',
        descricaoItem: 'Chassi Estrutural Reforçado Escavadeira 22T',
        quantidadePlanejada: 2,
        quantidadeProduzida: 1,
        quantidadeRefugo: 0,
        unidadeMedida: 'UN',
        status: 'EM_PROCESSO',
        prioridade: 'ALTA',
        criticalRatio: 1.15,
        folgaDias: 4,
        dataEmissao: '2026-08-10T08:00:00.000Z',
        dataInicioPrevista: '2026-08-15T07:00:00.000Z',
        dataFimPrevista: '2026-09-02T17:00:00.000Z',
        dataEntregaPrometida: '2026-09-05T00:00:00.000Z',
        leadTimeFabricacaoHoras: 48,
        statusMateriaPrima: 'TOTALMENTE_DISPONIVEL',
        operacoes: [
          {
            id: 'op-0080-seq-10',
            opId: op1Id,
            sequencia: 10,
            operacaoNome: 'Corte Laser das Chapas do Chassi',
            setor: 'CORTE_LASER',
            maquinaId: 'maq-laser-fibra-01',
            maquinaNome: 'Corte Laser Fibra Óptica 12kW Trumpf',
            tempoSetupMinutos: 30,
            tempoCicloMinutos: 180,
            tempoTotalMinutos: 210,
            status: 'CONCLUIDA',
            dataInicioPrevista: '2026-08-15T07:00:00.000Z',
            dataFimPrevista: '2026-08-16T12:00:00.000Z',
            operadorAlocadoId: 'op-01',
            operadorAlocadoNome: 'Carlos Eduardo Silveira',
            posicaoFila: 0,
          },
          {
            id: 'op-0080-seq-20',
            opId: op1Id,
            sequencia: 20,
            operacaoNome: 'Dobra e Conformação dos Reforços Longitudinais',
            setor: 'DOBRA_CNC',
            maquinaId: 'maq-dobra-cnc-01',
            maquinaNome: 'Prensa Dobradeira CNC 300T Bystronic',
            tempoSetupMinutos: 45,
            tempoCicloMinutos: 150,
            tempoTotalMinutos: 195,
            status: 'EM_EXECUCAO',
            dataInicioPrevista: '2026-08-18T08:00:00.000Z',
            dataFimPrevista: '2026-08-26T17:00:00.000Z',
            operadorAlocadoId: 'op-02',
            operadorAlocadoNome: 'Marcos Vinicius Mendes',
            posicaoFila: 1,
          },
          {
            id: 'op-0080-seq-30',
            opId: op1Id,
            sequencia: 30,
            operacaoNome: 'Ponteamento e Soldagem Estrutural MIG/MAG',
            setor: 'CALDEIRARIA_SOLDA',
            maquinaId: 'maq-solda-robot-01',
            maquinaNome: 'Célula Robotizada de Solda Fanuc',
            tempoSetupMinutos: 40,
            tempoCicloMinutos: 360,
            tempoTotalMinutos: 400,
            status: 'NA_FILA',
            dataInicioPrevista: '2026-08-27T08:00:00.000Z',
            dataFimPrevista: '2026-08-31T17:00:00.000Z',
            operadorAlocadoId: 'op-03',
            operadorAlocadoNome: 'Alexandre Vieira da Silva',
            posicaoFila: 1,
          },
          {
            id: 'op-0080-seq-40',
            opId: op1Id,
            sequencia: 40,
            operacaoNome: 'Pintura Epóxi Fundo Primer + Acabamento Amarelo Segurança',
            setor: 'PINTURA_TRATAMENTO',
            maquinaId: 'maq-cabine-pintura-01',
            maquinaNome: 'Cabine de Pintura Eletrostática & Líquida',
            tempoSetupMinutos: 20,
            tempoCicloMinutos: 120,
            tempoTotalMinutos: 140,
            status: 'NA_FILA',
            dataInicioPrevista: '2026-09-01T08:00:00.000Z',
            dataFimPrevista: '2026-09-02T16:00:00.000Z',
            operadorAlocadoId: 'op-06',
            operadorAlocadoNome: 'Lucas Pintor Industrial',
            posicaoFila: 1,
          },
        ],
        materiaisRequeridos: [
          {
            id: 'mat-0080-01',
            codigo: 'MP-CH-1020-6.35',
            descricao: 'Chapa de Aço SAE 1020 1/4" (6.35mm)',
            tipo: 'MATERIA_PRIMA',
            quantidadeLiquidaPorUnidade: 2,
            percentualPerda: 8.0,
            quantidadeTotalNecessaria: 4.32,
            unidadeMedida: 'CHAPA',
            quantidadeDisponivelEstoque: 10,
            quantidadeReservada: 6,
            quantidadePendenteCompra: 0,
            atendido: true,
            custoUnitarioEstimado: 1250.0,
          },
        ],
      },
    ];

    // Executar cálculo inicial do MRP
    this.executarCalculoMRP(empresaTritech);
  }

  // =========================================================================
  // MOTOR DETERMINÍSTICO DE CÁLCULO DE MRP & PCP
  // =========================================================================
  public executarCalculoMRP(empresaId: string): ResultadoCalculoMRP {
    const inicioTimestamp = Date.now();
    const dataAtual = new Date('2026-08-25T08:00:00.000Z'); // Data base operacional

    const necessidadesLiquidas: NecessidadeLiquidaItem[] = [];
    const sugestoesCompra: SugestaoCompraMRP[] = [];
    const sugestoesProducao: SugestaoProducaoMRP[] = [];
    const riscosAtraso: RiscoAtrasoProducao[] = [];

    // Mapa auxiliar para consolidar demanda por item
    const demandaBrutaConsolidada: Map<
      string,
      {
        codigoItem: string;
        descricao: string;
        tipoItem: 'MATERIA_PRIMA' | 'PRODUTO_FABRICADO' | 'COMPONENTE' | 'SUB_CONJUNTO';
        unidadeMedida: string;
        quantidadeTotal: number;
        dataLimiteMinima: string;
        origens: OrigemDemandaRastreavel[];
      }
    > = new Map();

    // 1. PROCESSAR DEMANDA EXTERNA (Pedidos de Venda da Carteira)
    for (const pedido of this.carteiraPedidos) {
      // 1.1 Demanda do produto final
      const keyFinal = pedido.codigoItem;
      if (!demandaBrutaConsolidada.has(keyFinal)) {
        demandaBrutaConsolidada.set(keyFinal, {
          codigoItem: pedido.codigoItem,
          descricao: pedido.descricaoItem,
          tipoItem: pedido.tipoItem,
          unidadeMedida: pedido.unidadeMedida,
          quantidadeTotal: 0,
          dataLimiteMinima: pedido.dataEntregaPrometida,
          origens: [],
        });
      }

      const entryFinal = demandaBrutaConsolidada.get(keyFinal)!;
      entryFinal.quantidadeTotal += pedido.quantidade;
      if (new Date(pedido.dataEntregaPrometida) < new Date(entryFinal.dataLimiteMinima)) {
        entryFinal.dataLimiteMinima = pedido.dataEntregaPrometida;
      }
      entryFinal.origens.push({
        tipoOrigem: 'PEDIDO_VENDA',
        documentoOrigemId: pedido.pedidoVendaId || pedido.id,
        documentoOrigemNumero: pedido.pedidoVendaNumero || 'PV-DIRETO',
        clienteNome: pedido.clienteNome,
        quantidadeDemandada: pedido.quantidade,
        dataPrometida: pedido.dataEntregaPrometida,
        justificativaCalculo: `Demanda de ${pedido.quantidade} ${pedido.unidadeMedida} gerada pelo ${pedido.pedidoVendaNumero} para ${pedido.clienteNome || 'Cliente'} com entrega até ${new Date(pedido.dataEntregaPrometida).toLocaleDateString('pt-BR')}`,
      });

      // 1.2 EXPLOSÃO DE BOM (Lista de Materiais das Revisões Ativas)
      // Procurar engenharia cadastrada
      let eng = Array.from(this.catalogoEngenharia.values()).find(
        (e) => e.produtoCodigo === pedido.codigoItem || (pedido.projetoId && e.projetoId === pedido.projetoId)
      );

      if (eng) {
        for (const itemBOM of eng.itensBOM) {
          // Quantidade com perda técnica: QtdLiquida * (1 + perda/100) * QtdPedido
          const fatorPerda = 1 + itemBOM.percentualPerda / 100;
          const qtdTotalNecessaria = Number((itemBOM.quantidadeLiquida * fatorPerda * pedido.quantidade).toFixed(2));

          const keyMaterial = itemBOM.codigo;
          if (!demandaBrutaConsolidada.has(keyMaterial)) {
            demandaBrutaConsolidada.set(keyMaterial, {
              codigoItem: itemBOM.codigo,
              descricao: itemBOM.descricao,
              tipoItem: itemBOM.tipoItem as any,
              unidadeMedida: itemBOM.unidadeMedida,
              quantidadeTotal: 0,
              dataLimiteMinima: pedido.dataEntregaPrometida,
              origens: [],
            });
          }

          const entryMat = demandaBrutaConsolidada.get(keyMaterial)!;
          entryMat.quantidadeTotal += qtdTotalNecessaria;
          if (new Date(pedido.dataEntregaPrometida) < new Date(entryMat.dataLimiteMinima)) {
            entryMat.dataLimiteMinima = pedido.dataEntregaPrometida;
          }
          entryMat.origens.push({
            tipoOrigem: 'PROJETO_BOM',
            documentoOrigemId: eng.projetoId,
            documentoOrigemNumero: `${eng.projetoCodigo} (${eng.revisaoVersao})`,
            clienteNome: pedido.clienteNome,
            quantidadeDemandada: qtdTotalNecessaria,
            dataPrometida: pedido.dataEntregaPrometida,
            justificativaCalculo: `Explosão da BOM do ${eng.projetoCodigo} (${eng.revisaoVersao}) para suprir ${pedido.quantidade} un de ${pedido.codigoItem} do ${pedido.pedidoVendaNumero}. Cálculo: ${itemBOM.quantidadeLiquida} un líquida + ${itemBOM.percentualPerda}% perda = ${qtdTotalNecessaria} ${itemBOM.unidadeMedida}.`,
          });
        }
      }
    }

    // 2. PROCESSAR DEMANDA DE OPs ATIVAS (se houver consumo planejado)
    for (const op of this.ordensProducao.filter((o) => o.status !== 'CONCLUIDA' && o.status !== 'CANCELADA')) {
      for (const mat of op.materiaisRequeridos) {
        if (!mat.atendido) {
          const keyMat = mat.codigo;
          if (!demandaBrutaConsolidada.has(keyMat)) {
            demandaBrutaConsolidada.set(keyMat, {
              codigoItem: mat.codigo,
              descricao: mat.descricao,
              tipoItem: mat.tipo as any,
              unidadeMedida: mat.unidadeMedida,
              quantidadeTotal: 0,
              dataLimiteMinima: op.dataInicioPrevista,
              origens: [],
            });
          }
          const entryOp = demandaBrutaConsolidada.get(keyMat)!;
          entryOp.quantidadeTotal += mat.quantidadeTotalNecessaria;
          entryOp.origens.push({
            tipoOrigem: 'ORDEM_PRODUCAO',
            documentoOrigemId: op.id,
            documentoOrigemNumero: op.numeroOp,
            clienteNome: op.clienteNome,
            quantidadeDemandada: mat.quantidadeTotalNecessaria,
            dataPrometida: op.dataInicioPrevista,
            justificativaCalculo: `Reserva pendente para a ${op.numeroOp} com início previsto em ${new Date(op.dataInicioPrevista).toLocaleDateString('pt-BR')}`,
          });
        }
      }
    }

    // 3. CALCULAR NECESSIDADES LÍQUIDAS & REGRAS DE ESTOQUE/RESERVAS/BLOQUEIOS
    for (const [, itemDemanda] of demandaBrutaConsolidada) {
      const infoEstoque = this.catalogoEstoque.get(itemDemanda.codigoItem) || {
        codigo: itemDemanda.codigoItem,
        descricao: itemDemanda.descricao,
        unidadeMedida: itemDemanda.unidadeMedida,
        estoqueFisicoTotal: 0,
        materialBloqueado: 0,
        reservasAtivas: 0,
        comprasAbertas: 0,
        comprasAbertasDocumentos: [],
        leadTimeCompraDias: 7,
        custoUnitarioEstimado: 100.0,
        fornecedorPreferencial: 'Fornecedor Padrão Homologado',
      };

      // FÓRMULA DETERMINÍSTICA DO MRP:
      // Saldo Líquido Disponível = Estoque Físico - Material Bloqueado (quarentena) - Reservas Ativas
      const estoqueLiquidoDisponivel = Math.max(
        0,
        infoEstoque.estoqueFisicoTotal - infoEstoque.materialBloqueado - infoEstoque.reservasAtivas
      );

      // OPs em andamento que produzem este item (se for produto fabricado)
      const opsProduzindo = this.ordensProducao
        .filter((o) => o.codigoItem === itemDemanda.codigoItem && (o.status === 'EM_PROCESSO' || o.status === 'PLANEJADA' || o.status === 'LIBERADA'))
        .reduce((sum, o) => sum + (o.quantidadePlanejada - o.quantidadeProduzida), 0);

      // Necessidade Líquida = Demanda Bruta - Estoque Líquido Disponível - Compras Abertas - OPs em Andamento
      const saldoTotalCobertura = estoqueLiquidoDisponivel + infoEstoque.comprasAbertas + opsProduzindo;
      const necessidadeLiquidaCalculada = Math.max(0, Number((itemDemanda.quantidadeTotal - saldoTotalCobertura).toFixed(2)));

      const leadTimeDias = itemDemanda.tipoItem === 'PRODUTO_FABRICADO' ? 5 : infoEstoque.leadTimeCompraDias;

      // Calcular Data de Disparo (Backward Scheduling): Data Limite - Lead Time
      const dataLimite = new Date(itemDemanda.dataLimiteMinima);
      const dataSugeridaDisparo = new Date(dataLimite.getTime() - leadTimeDias * 24 * 60 * 60 * 1000);

      const necessidadeItem: NecessidadeLiquidaItem = {
        id: `nec-${itemDemanda.codigoItem.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        empresaId,
        codigoItem: itemDemanda.codigoItem,
        descricao: itemDemanda.descricao,
        tipoItem: itemDemanda.tipoItem,
        unidadeMedida: itemDemanda.unidadeMedida,
        demandaBruta: Number(itemDemanda.quantidadeTotal.toFixed(2)),
        demandaBrutaTotal: Number(itemDemanda.quantidadeTotal.toFixed(2)),
        estoqueFisicoTotal: infoEstoque.estoqueFisicoTotal,
        materialBloqueado: infoEstoque.materialBloqueado,
        reservasAtivas: infoEstoque.reservasAtivas,
        estoqueLiquidoDisponivel,
        comprasAbertasEmTransito: infoEstoque.comprasAbertas,
        opsEmAndamento: opsProduzindo,
        necessidadeLiquidaCalculada,
        leadTimeDias,
        dataLimiteNecessidade: itemDemanda.dataLimiteMinima,
        dataSugeridaDisparo: dataSugeridaDisparo.toISOString(),
        origensDemanda: itemDemanda.origens,
      };

      necessidadesLiquidas.push(necessidadeItem);

      // 4. GERAR SUGESTÕES DE COMPRA OU DE PRODUÇÃO
      if (itemDemanda.tipoItem === 'PRODUTO_FABRICADO') {
        // Encontrar eng
        const engItem = Array.from(this.catalogoEngenharia.values()).find((e) => e.produtoCodigo === itemDemanda.codigoItem);
        if (necessidadeLiquidaCalculada > 0 && engItem) {
          const leadTimeHoras = engItem.leadTimeFabricacaoHoras;
          const leadTimeDiasFab = Math.ceil(leadTimeHoras / 16); // 2 turnos de 8h = 16h/dia
          const dataInicioFab = new Date(dataLimite.getTime() - leadTimeDiasFab * 24 * 60 * 60 * 1000);

          sugestoesProducao.push({
            id: `sug-prod-${itemDemanda.codigoItem.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            empresaId,
            codigoItem: itemDemanda.codigoItem,
            descricao: itemDemanda.descricao,
            unidadeMedida: itemDemanda.unidadeMedida,
            projetoId: engItem.projetoId,
            projetoCodigo: engItem.projetoCodigo,
            revisaoId: engItem.revisaoId,
            revisaoVersao: engItem.revisaoVersao,
            quantidadeSugerida: necessidadeLiquidaCalculada,
            leadTimeFabricacaoDias: leadTimeDiasFab,
            leadTimeFabricacaoHoras: leadTimeHoras,
            dataNecessidadeEntrega: itemDemanda.dataLimiteMinima,
            dataSugeridaInicioProducao: dataInicioFab.toISOString(),
            status: 'PENDENTE',
            origemRastreavel: itemDemanda.origens,
            motivoCalculo: `Demanda de ${itemDemanda.quantidadeTotal} ${itemDemanda.unidadeMedida} para entrega até ${dataLimite.toLocaleDateString('pt-BR')}. Estoque livre: ${estoqueLiquidoDisponivel}. OPs ativas: ${opsProduzindo}. Necessidade líquida: ${necessidadeLiquidaCalculada} ${itemDemanda.unidadeMedida}.`,
          });
        }
      } else {
        // MATÉRIA PRIMA / COMPONENTE -> Sugestão de Compra
        // REGRA DE NÃO DUPLICAÇÃO DE COMPRA:
        const jaExisteCompraAberta = infoEstoque.comprasAbertas >= itemDemanda.quantidadeTotal;

        if (necessidadeLiquidaCalculada > 0) {
          const valorTotal = Number((necessidadeLiquidaCalculada * infoEstoque.custoUnitarioEstimado).toFixed(2));
          const ehUrgente = dataSugeridaDisparo <= dataAtual;

          sugestoesCompra.push({
            id: `sug-compra-${itemDemanda.codigoItem.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            empresaId,
            codigoItem: itemDemanda.codigoItem,
            descricao: itemDemanda.descricao,
            unidadeMedida: itemDemanda.unidadeMedida,
            quantidadeSugerida: necessidadeLiquidaCalculada,
            precoEstimadoUnitario: infoEstoque.custoUnitarioEstimado,
            valorTotalEstimado: valorTotal,
            fornecedorPreferencialNome: infoEstoque.fornecedorPreferencial || 'Fornecedor Homologado',
            leadTimeCompraDias: infoEstoque.leadTimeCompraDias,
            dataNecessidadeFabrica: itemDemanda.dataLimiteMinima,
            dataSugeridaEmissaoCompra: dataSugeridaDisparo.toISOString(),
            urgencia: ehUrgente ? 'CRITICA' : 'NORMAL',
            jaExisteCompraAberta,
            numeroCompraAbertaExistente: infoEstoque.comprasAbertasDocumentos?.join(', '),
            status: 'PENDENTE',
            origemRastreavel: itemDemanda.origens,
            motivoCalculo: `Necessidade líquida calculada: ${necessidadeLiquidaCalculada} ${itemDemanda.unidadeMedida}. (Demanda Bruta: ${itemDemanda.quantidadeTotal} | Estoque Físico: ${infoEstoque.estoqueFisicoTotal} | Bloqueado: ${infoEstoque.materialBloqueado} | Reservas: ${infoEstoque.reservasAtivas} | Compras em Aberto: ${infoEstoque.comprasAbertas}). Lead Time de compra: ${infoEstoque.leadTimeCompraDias} dias.`,
          });
        }
      }
    }

    // 5. ANÁLISE DETERMINÍSTICA DE RISCOS DE ATRASO (MRP-II & GARGALOS)
    // 5.1 Risco: Material Bloqueado causando falta de suprimento imediato
    for (const nec of necessidadesLiquidas) {
      if (nec.materialBloqueado > 0 && nec.necessidadeLiquidaCalculada > 0) {
        riscosAtraso.push({
          id: `risk-bloq-${nec.codigoItem}`,
          empresaId,
          tipoRisco: 'SUPRIMENTO_ATRASADO',
          nivelSeveridade: 'ALTO',
          codigoItem: nec.codigoItem,
          titulo: `Estoque Bloqueado para o item ${nec.codigoItem}`,
          descricao: `Existem ${nec.materialBloqueado} ${nec.unidadeMedida} bloqueados em inspeção/quarentena que, se liberados pela Qualidade, cobririam parte da necessidade líquida de ${nec.necessidadeLiquidaCalculada} ${nec.unidadeMedida}.`,
          impactoDias: nec.leadTimeDias,
          acaoSugerida: 'Acionar controle de qualidade para agilizar laudo de inspeção do lote retido.',
          dataDeteccao: dataAtual.toISOString(),
        });
      }

      // 5.2 Risco: Data sugerida de disparo já está no passado ou hoje (Lead Time estoura prazo da fábrica)
      const dataDisparo = new Date(nec.dataSugeridaDisparo);
      if (dataDisparo <= dataAtual && nec.necessidadeLiquidaCalculada > 0) {
        const diasAtrasoLeadTime = Math.ceil((dataAtual.getTime() - dataDisparo.getTime()) / (1000 * 60 * 60 * 24));
        riscosAtraso.push({
          id: `risk-lt-${nec.codigoItem}`,
          empresaId,
          tipoRisco: 'PRAZO_ESTOURADO',
          nivelSeveridade: 'CRITICO',
          codigoItem: nec.codigoItem,
          titulo: `Lead Time de Compra Excede Data de Produção: ${nec.codigoItem}`,
          descricao: `A data limite para ter o material na fábrica é ${new Date(nec.dataLimiteNecessidade).toLocaleDateString('pt-BR')}, mas o lead time de ${nec.leadTimeDias} dias exigiria pedido emitido em ${dataDisparo.toLocaleDateString('pt-BR')}.`,
          impactoDias: diasAtrasoLeadTime + 1,
          acaoSugerida: 'Emitir pedido de compra emergencial com frete expresso (aéreo/dedicado) ou negociar adiantamento com fornecedor.',
          dataDeteccao: dataAtual.toISOString(),
        });
      }
    }

    // 5.3 Risco: Sobrecarga de Máquinas (Carga > 100%)
    for (const maq of this.maquinas) {
      if (maq.taxaOcupacaoPercentual > 100) {
        riscosAtraso.push({
          id: `risk-maq-${maq.id}`,
          empresaId,
          tipoRisco: 'SOBRECARGA_CAPACIDADE',
          nivelSeveridade: 'ALTO',
          maquinaId: maq.id,
          maquinaNome: maq.nome,
          setor: maq.setor,
          titulo: `Gargalo por Sobrecarga na Máquina ${maq.codigo}`,
          descricao: `A máquina ${maq.nome} está com ocupação de ${maq.taxaOcupacaoPercentual.toFixed(1)}% (${maq.cargaProgramadaHoras}h alocadas para capacidade líquida de ${maq.capacidadeHorasDiaLiquida}h/dia).`,
          impactoDias: Math.ceil((maq.cargaProgramadaHoras - maq.capacidadeHorasDiaLiquida) / maq.capacidadeHorasDiaLiquida),
          acaoSugerida: 'Autorizar hora extra (3º turno parcial) ou redistribuir operações para postos alternativos / terceirização.',
          dataDeteccao: dataAtual.toISOString(),
        });
      }

      // 5.4 Risco: Manutenção Ativa impactando máquina do caminho crítico
      const manutAtiva = this.manutencoes.find(
        (m) => m.maquinaId === maq.id && (m.status === 'EM_ANDAMENTO' || m.status === 'AGENDADA') && m.impactaCapacidade
      );
      if (manutAtiva) {
        riscosAtraso.push({
          id: `risk-manut-${manutAtiva.id}`,
          empresaId,
          tipoRisco: 'MANUTENCAO_MAQUINA',
          nivelSeveridade: 'MEDIO',
          maquinaId: maq.id,
          maquinaNome: maq.nome,
          setor: maq.setor,
          titulo: `Parada de Manutenção Programada: ${maq.codigo}`,
          descricao: `${manutAtiva.tipo}: "${manutAtiva.descricao}" bloqueia a capacidade por ${manutAtiva.duracaoHoras}h.`,
          impactoDias: Math.ceil(manutAtiva.duracaoHoras / 16),
          acaoSugerida: 'Sequenciar lotes prioritários antes ou após a janela de intervenção mecânica.',
          dataDeteccao: dataAtual.toISOString(),
        });
      }
    }

    // 6. CONSOLIDAR CAPACIDADE POR SETOR
    const setoresMap: Map<SetorPcp, SetorCapacidade> = new Map();
    const setoresNomes: Record<SetorPcp, string> = {
      CORTE_LASER: 'Corte Laser & Plasma CNC',
      DOBRA_CNC: 'Dobra & Conformação Pesada',
      CALDEIRARIA_SOLDA: 'Caldeiraria, Calandragem & Solda Robotizada',
      USINAGEM: 'Usinagem CNC & Mandrilhamento',
      PINTURA_TRATAMENTO: 'Tratamento Superficial & Pintura Industrial',
      MONTAGEM: 'Montagem Mecânica, Hidráulica & Testes',
      INSPECAO_QUALIDADE: 'Inspeção Dimensional & Ensaios Não Destrutivos (END)',
    };

    for (const s of Object.keys(setoresNomes) as SetorPcp[]) {
      setoresMap.set(s, {
        setor: s,
        nome: setoresNomes[s],
        setorNome: setoresNomes[s],
        quantidadeMaquinas: 0,
        quantidadeOperadores: 0,
        capacidadeTotalHorasDia: 0,
        cargaAlocadaHoras: 0,
        cargaAlocadaHorasDia: 0,
        taxaOcupacaoPercentual: 0,
        status: 'NORMAL',
      });
    }

    for (const maq of this.maquinas) {
      const set = setoresMap.get(maq.setor);
      if (set) {
        set.quantidadeMaquinas += 1;
        set.capacidadeTotalHorasDia += maq.capacidadeHorasDiaLiquida;
        set.cargaAlocadaHoras += maq.cargaProgramadaHoras;
        set.cargaAlocadaHorasDia = set.cargaAlocadaHoras;
      }
    }

    for (const op of this.operadores) {
      const set = setoresMap.get(op.setor);
      if (set) {
        set.quantidadeOperadores += 1;
      }
    }

    for (const [, set] of setoresMap) {
      if (set.capacidadeTotalHorasDia > 0) {
        set.taxaOcupacaoPercentual = Number(
          ((set.cargaAlocadaHoras / set.capacidadeTotalHorasDia) * 100).toFixed(1)
        );
        if (set.taxaOcupacaoPercentual > 100) {
          set.status = 'GARGALO';
        } else if (set.taxaOcupacaoPercentual > 80) {
          set.status = 'ATENCAO';
        } else {
          set.status = 'NORMAL';
        }
      }
    }

    // 7. GERAR CRONOGRAMA GANTT INICIAL
    const gantt: GanttItem[] = [];
    for (const op of this.ordensProducao) {
      // Adicionar barra mestre da OP
      const temRiscoOp = riscosAtraso.some((r) => r.opId === op.id || (r.codigoItem && r.codigoItem === op.codigoItem));
      gantt.push({
        id: `gantt-op-${op.id}`,
        opId: op.id,
        opNumero: op.numeroOp,
        projetoCodigo: op.projetoCodigo,
        clienteNome: op.clienteNome,
        codigoItem: op.codigoItem,
        descricao: `${op.numeroOp} - ${op.descricaoItem} (Qtd: ${op.quantidadePlanejada})`,
        setor: 'MONTAGEM',
        maquinaNome: 'Fluxo Fabril Integrado',
        dataInicio: op.dataInicioPrevista,
        dataFim: op.dataFimPrevista,
        progressoPercentual: op.status === 'CONCLUIDA' ? 100 : op.status === 'EM_PROCESSO' ? 45 : 0,
        status: op.status,
        prioridade: op.prioridade,
        temRiscoAtraso: temRiscoOp,
        motivoRisco: temRiscoOp ? 'Risco de suprimento ou sobrecarga na máquina identificada' : undefined,
        dependencias: [],
      });

      // Adicionar barras filhas por operação
      for (const opItem of op.operacoes) {
        const temRiscoMaq = riscosAtraso.some((r) => r.maquinaId === opItem.maquinaId);
        gantt.push({
          id: `gantt-opitem-${opItem.id}`,
          opId: op.id,
          opNumero: op.numeroOp,
          projetoCodigo: op.projetoCodigo,
          clienteNome: op.clienteNome,
          codigoItem: op.codigoItem,
          descricao: `Op ${opItem.sequencia}: ${opItem.operacaoNome}`,
          operacaoId: opItem.id,
          operacaoNome: opItem.operacaoNome,
          sequencia: opItem.sequencia,
          setor: opItem.setor,
          maquinaNome: opItem.maquinaNome,
          dataInicio: opItem.dataInicioPrevista,
          dataFim: opItem.dataFimPrevista,
          progressoPercentual: opItem.status === 'CONCLUIDA' ? 100 : opItem.status === 'EM_EXECUCAO' ? 50 : 0,
          status: opItem.status,
          prioridade: op.prioridade,
          temRiscoAtraso: temRiscoMaq,
          motivoRisco: temRiscoMaq ? 'Posto de trabalho com sobrecarga ou manutenção programada' : undefined,
          dependencias: opItem.sequencia > 10 ? [`gantt-opitem-${op.id}-seq-${opItem.sequencia - 10}`] : [],
        });
      }
    }

    // Salvar referências no serviço
    this.sugestoesCompra = sugestoesCompra;
    this.sugestoesProducao = sugestoesProducao;
    this.ultimosRiscos = riscosAtraso;
    this.ultimasNecessidades = necessidadesLiquidas;

    const fimTimestamp = Date.now();

    return {
      dataExecucao: new Date().toISOString(),
      tempoProcessamentoMs: fimTimestamp - inicioTimestamp,
      necessidadesLiquidas,
      sugestoesCompra,
      sugestoesProducao,
      riscosAtraso,
      capacidadeMaquinas: this.maquinas,
      capacidadeSetores: Array.from(setoresMap.values()),
      gantt,
      ganttInicial: gantt,
      totalDemandaAnalisada: demandaBrutaConsolidada.size,
      totalComprasSugeridas: sugestoesCompra.length,
      totalOpsSugeridas: sugestoesProducao.length,
      totalGargalosIdentificados: riscosAtraso.length,
      resumo: {
        totalDemandasAnalisadas: demandaBrutaConsolidada.size,
        totalItensNecessidadeLiquida: necessidadesLiquidas.filter((n) => n.necessidadeLiquidaCalculada > 0).length,
        totalSugestoesCompra: sugestoesCompra.length,
        valorTotalEstimadoCompras: sugestoesCompra.reduce((acc, s) => acc + s.valorTotalEstimado, 0),
        totalSugestoesProducao: sugestoesProducao.length,
        totalRiscosAtraso: riscosAtraso.length,
        totalRiscosCriticos: riscosAtraso.filter((r) => r.nivelSeveridade === 'CRITICO' || r.nivelSeveridade === 'ALTO').length,
        maquinasGargaloTotal: this.maquinas.filter((m) => m.empresaId === empresaId && m.taxaOcupacaoPercentual > 100).length,
      },
    };
  }

  // =========================================================================
  // GESTÃO DE ORDENS DE PRODUÇÃO (OP) & SEQUENCIAMENTO DE FILA
  // =========================================================================
  public obterOrdensProducao(empresaId: string): OrdemProducao[] {
    return this.ordensProducao.filter((o) => o.empresaId === empresaId);
  }

  public obterOrdemProducaoPorId(empresaId: string, opId: string): OrdemProducao | undefined {
    return this.ordensProducao.find((o) => o.empresaId === empresaId && o.id === opId);
  }

  public criarOrdemProducao(
    empresaId: string,
    dados: {
      origemTipo: 'PEDIDO_VENDA' | 'ESTOQUE_MINIMO' | 'MANUAL' | 'SUGESTAO_MRP';
      pedidoVendaId?: string;
      pedidoVendaNumero?: string;
      clienteNome?: string;
      projetoId: string;
      projetoCodigo: string;
      projetoTitulo: string;
      revisaoId: string;
      revisaoVersao: string;
      codigoItem: string;
      descricaoItem: string;
      quantidadePlanejada: number;
      unidadeMedida: string;
      prioridade?: PrioridadeProducao;
      dataInicioPrevista: string;
      dataEntregaPrometida: string;
      observacoes?: string;
    }
  ): OrdemProducao {
    const totalOps = this.ordensProducao.length + 1;
    const numeroOp = `OP-2026-${String(totalOps).padStart(4, '0')}`;

    // Buscar engenharia para montar operações e materiais
    const eng = Array.from(this.catalogoEngenharia.values()).find(
      (e) => e.projetoId === dados.projetoId || e.produtoCodigo === dados.codigoItem
    );

    const operacoes: OperacaoProducaoOP[] = [];
    const materiaisRequeridos: MaterialRequeridoOP[] = [];
    let leadTimeHoras = 24;

    const opId = `op-${Date.now()}`;

    if (eng) {
      leadTimeHoras = eng.leadTimeFabricacaoHoras;

      // Montar Operações
      eng.operacoesRoteiro.forEach((opRot) => {
        const tempoTotal = opRot.tempoSetupMinutos + opRot.tempoCicloMinutos * dados.quantidadePlanejada;
        operacoes.push({
          id: `op-${opId}-seq-${opRot.sequencia}`,
          opId,
          sequencia: opRot.sequencia,
          operacaoNome: opRot.operacaoNome,
          setor: opRot.setor,
          maquinaId: opRot.maquinaId,
          maquinaNome: opRot.maquinaNome,
          ferramenta: opRot.ferramenta,
          tempoSetupMinutos: opRot.tempoSetupMinutos,
          tempoCicloMinutos: opRot.tempoCicloMinutos * dados.quantidadePlanejada,
          tempoTotalMinutos: tempoTotal,
          status: 'NA_FILA',
          dataInicioPrevista: dados.dataInicioPrevista,
          dataFimPrevista: dados.dataEntregaPrometida,
          posicaoFila: 1,
          instrucaoTecnica: opRot.instrucaoTecnica,
        });
      });

      // Montar Materiais
      eng.itensBOM.forEach((itemBOM) => {
        const fator = 1 + itemBOM.percentualPerda / 100;
        const total = Number((itemBOM.quantidadeLiquida * fator * dados.quantidadePlanejada).toFixed(2));
        const est = this.catalogoEstoque.get(itemBOM.codigo);

        const dispEstoque = est ? est.estoqueFisicoTotal - est.materialBloqueado - est.reservasAtivas : 0;
        const atendido = dispEstoque >= total;

        materiaisRequeridos.push({
          id: `mat-req-${opId}-${itemBOM.codigo}`,
          codigo: itemBOM.codigo,
          descricao: itemBOM.descricao,
          tipo: itemBOM.tipoItem,
          quantidadeLiquidaPorUnidade: itemBOM.quantidadeLiquida,
          percentualPerda: itemBOM.percentualPerda,
          quantidadeTotalNecessaria: total,
          unidadeMedida: itemBOM.unidadeMedida,
          quantidadeDisponivelEstoque: dispEstoque,
          quantidadeReservada: atendido ? total : 0,
          quantidadePendenteCompra: atendido ? 0 : total - dispEstoque,
          atendido,
          custoUnitarioEstimado: itemBOM.custoUnitario,
        });
      });
    }

    const dataInicio = new Date(dados.dataInicioPrevista);
    const dataEntrega = new Date(dados.dataEntregaPrometida);
    const diasTotais = Math.max(1, Math.ceil((dataEntrega.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)));
    const diasFab = Math.ceil(leadTimeHoras / 16);
    const folgaDias = diasTotais - diasFab;
    const criticalRatio = Number((diasTotais / Math.max(1, diasFab)).toFixed(2));

    const novaOp: OrdemProducao = {
      id: opId,
      empresaId,
      numeroOp,
      origemTipo: dados.origemTipo,
      pedidoVendaId: dados.pedidoVendaId,
      pedidoVendaNumero: dados.pedidoVendaNumero,
      clienteNome: dados.clienteNome,
      projetoId: dados.projetoId,
      projetoCodigo: dados.projetoCodigo,
      projetoTitulo: dados.projetoTitulo,
      revisaoId: dados.revisaoId,
      revisaoVersao: dados.revisaoVersao,
      codigoItem: dados.codigoItem,
      descricaoItem: dados.descricaoItem,
      quantidadePlanejada: dados.quantidadePlanejada,
      quantidadeProduzida: 0,
      quantidadeRefugo: 0,
      unidadeMedida: dados.unidadeMedida,
      status: 'PLANEJADA',
      prioridade: dados.prioridade || (criticalRatio < 1.0 ? 'URGENTE' : criticalRatio < 1.2 ? 'ALTA' : 'NORMAL'),
      criticalRatio,
      folgaDias,
      dataEmissao: new Date().toISOString(),
      dataInicioPrevista: dados.dataInicioPrevista,
      dataFimPrevista: dados.dataEntregaPrometida,
      dataEntregaPrometida: dados.dataEntregaPrometida,
      leadTimeFabricacaoHoras: leadTimeHoras,
      statusMateriaPrima: materiaisRequeridos.every((m) => m.atendido)
        ? 'TOTALMENTE_DISPONIVEL'
        : materiaisRequeridos.some((m) => m.atendido)
        ? 'PARCIALMENTE_DISPONIVEL'
        : 'AGUARDANDO_COMPRA',
      operacoes,
      materiaisRequeridos,
      observacoes: dados.observacoes,
    };

    this.ordensProducao.unshift(novaOp);
    return novaOp;
  }

  public atualizarStatusOP(
    empresaId: string,
    opId: string,
    novoStatus: OrdemProducao['status'],
    quantidadeProduzida?: number
  ): OrdemProducao {
    const op = this.obterOrdemProducaoPorId(empresaId, opId);
    if (!op) {
      throw new Error(`Ordem de Produção ${opId} não encontrada.`);
    }

    op.status = novoStatus;
    if (quantidadeProduzida !== undefined) {
      op.quantidadeProduzida = quantidadeProduzida;
    }
    if (novoStatus === 'CONCLUIDA') {
      op.dataFimReal = new Date().toISOString();
      op.quantidadeProduzida = op.quantidadePlanejada;
      op.operacoes.forEach((o) => (o.status = 'CONCLUIDA'));
    } else if (novoStatus === 'EM_PROCESSO' && !op.dataInicioReal) {
      op.dataInicioReal = new Date().toISOString();
    }

    return op;
  }

  // =========================================================================
  // REORDENAÇÃO E SEQUENCIAMENTO FINITO DA FILA POR ALGORITMO
  // =========================================================================
  public sequenciarFilaProducao(
    empresaId: string,
    maquinaId: string,
    algoritmo: AlgoritmoOrdenacaoFila
  ): OperacaoProducaoOP[] {
    const ops = this.obterOrdensProducao(empresaId);
    const operacoesDaMaquina: { operacao: OperacaoProducaoOP; opMae: OrdemProducao }[] = [];

    for (const op of ops) {
      for (const opItem of op.operacoes) {
        if (opItem.maquinaId === maquinaId && opItem.status !== 'CONCLUIDA') {
          operacoesDaMaquina.push({ operacao: opItem, opMae: op });
        }
      }
    }

    // Aplicar Algoritmo Determinístico de Sequenciamento
    operacoesDaMaquina.sort((a, b) => {
      switch (algoritmo) {
        case 'CRITICAL_RATIO':
          return a.opMae.criticalRatio - b.opMae.criticalRatio; // Menor CR primeiro
        case 'EARLIEST_DUE_DATE':
          return new Date(a.opMae.dataEntregaPrometida).getTime() - new Date(b.opMae.dataEntregaPrometida).getTime();
        case 'SHORTEST_PROCESSING_TIME':
          return a.operacao.tempoTotalMinutos - b.operacao.tempoTotalMinutos;
        case 'PRIORIDADE_MANUAL': {
          const pesos: Record<PrioridadeProducao, number> = { URGENTE: 1, ALTA: 2, NORMAL: 3, BAIXA: 4 };
          return pesos[a.opMae.prioridade] - pesos[b.opMae.prioridade];
        }
        case 'FIFO':
        default:
          return new Date(a.opMae.dataEmissao).getTime() - new Date(b.opMae.dataEmissao).getTime();
      }
    });

    // Atualizar posição na fila
    const resultadoOrdenado: OperacaoProducaoOP[] = [];
    operacoesDaMaquina.forEach((item, index) => {
      item.operacao.posicaoFila = index + 1;
      resultadoOrdenado.push(item.operacao);
    });

    return resultadoOrdenado;
  }

  public obterFilaPorMaquina(
    empresaId: string,
    maquinaId: string,
    algoritmo: AlgoritmoOrdenacaoFila = 'CRITICAL_RATIO'
  ): OperacaoProducaoOP[] {
    return this.sequenciarFilaProducao(empresaId, maquinaId, algoritmo);
  }

  // =========================================================================
  // CONVERSÃO DE SUGESTÃO MRP EM DOCUMENTOS FORMAIS
  // =========================================================================
  public converterSugestaoProducaoEmOP(empresaId: string, sugestaoId: string): OrdemProducao {
    const sug = this.sugestoesProducao.find((s) => s.id === sugestaoId && s.empresaId === empresaId);
    if (!sug) {
      throw new Error(`Sugestão de produção ${sugestaoId} não encontrada.`);
    }

    const novaOp = this.criarOrdemProducao(empresaId, {
      origemTipo: 'SUGESTAO_MRP',
      projetoId: sug.projetoId,
      projetoCodigo: sug.projetoCodigo,
      projetoTitulo: sug.descricao,
      revisaoId: sug.revisaoId,
      revisaoVersao: sug.revisaoVersao,
      codigoItem: sug.codigoItem,
      descricaoItem: sug.descricao,
      quantidadePlanejada: sug.quantidadeSugerida,
      unidadeMedida: sug.unidadeMedida,
      prioridade: 'ALTA',
      dataInicioPrevista: sug.dataSugeridaInicioProducao,
      dataEntregaPrometida: sug.dataNecessidadeEntrega,
      observacoes: `Gerada automaticamente pelo motor de MRP a partir da sugestão ${sugestaoId}. ${sug.motivoCalculo}`,
    });

    sug.status = 'CONVERTIDA_OP';
    sug.opGeradaId = novaOp.id;

    return novaOp;
  }

  public converterSugestaoCompraEmSolicitacao(
    empresaId: string,
    sugestaoId: string,
    usuarioNome: string
  ): { solicitacaoId: string; numeroSolicitacao: string } {
    const sug = this.sugestoesCompra.find((s) => s.id === sugestaoId && s.empresaId === empresaId);
    if (!sug) {
      throw new Error(`Sugestão de compra ${sugestaoId} não encontrada.`);
    }

    // REGRA: Impedir criação duplicada se já houver compra aberta que cubra
    if (sug.jaExisteCompraAberta) {
      throw new Error(
        `Operação bloqueada: O item ${sug.codigoItem} já possui ordem de compra em aberto (${sug.numeroCompraAbertaExistente}) que cobre a necessidade calculada.`
      );
    }

    const solId = `sc-${Date.now()}`;
    const numeroSolicitacao = `SC-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;

    sug.status = 'CONVERTIDA_SOLICITACAO';
    sug.solicitacaoCompraGeradaId = solId;

    // Atualizar estoque simulado com a nova compra em aberto
    const est = this.catalogoEstoque.get(sug.codigoItem);
    if (est) {
      est.comprasAbertas += sug.quantidadeSugerida;
      est.comprasAbertasDocumentos = est.comprasAbertasDocumentos || [];
      est.comprasAbertasDocumentos.push(numeroSolicitacao);
    }

    return {
      solicitacaoId: solId,
      numeroSolicitacao,
    };
  }

  // Getters para UI e APIs
  public obterMaquinas(empresaId: string): CentroTrabalhoMaquina[] {
    return this.maquinas.filter((m) => m.empresaId === empresaId);
  }

  public obterOperadores(empresaId: string): OperadorProducao[] {
    return this.operadores.filter((o) => o.empresaId === empresaId);
  }

  public obterManutencoes(empresaId: string): ManutencaoMaquina[] {
    return this.manutencoes.filter((m) => m.empresaId === empresaId);
  }

  public obterCalendario(empresaId: string): CalendarioFabril | undefined {
    return this.calendarios.get(empresaId);
  }

  public obterDemandasCarteira(): DemandaEntrada[] {
    return this.carteiraPedidos;
  }
}

export const pcpService = EngenhariaPcpServiceSingleton();

// Pattern Singleton
function EngenhariaPcpServiceSingleton(): PcpService {
  const globalAny = globalThis as unknown as { __pcpServiceInstance?: PcpService };
  if (!globalAny.__pcpServiceInstance) {
    globalAny.__pcpServiceInstance = new PcpService();
  }
  return globalAny.__pcpServiceInstance;
}
