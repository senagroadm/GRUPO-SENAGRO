// backend/modules/pcp/pcp-service.ts
import {
  OrdemProducao,
  CentroTrabalhoMaquina,
  ManutencaoProgramada,
  OperacaoProducaoOP,
  DemandaBrutaConsolidada,
  NecessidadeLiquidaItem,
  SugestaoCompraMRP,
  SugestaoProducaoMRP,
  RiscoAtrasoProducao,
  SetorCapacidade,
  GanttItem,
  ResultadoCalculoMRP,
  AlgoritmoOrdenacaoFila,
  PrioridadeProducao,
  SetorPcp,
} from './pcp-types';

export class PcpService {
  private ordensProducao: OrdemProducao[] = [];
  private maquinas: CentroTrabalhoMaquina[] = [];
  private manutenções: ManutencaoProgramada[] = [];
  private sugestoesCompra: SugestaoCompraMRP[] = [];
  private sugestoesProducao: SugestaoProducaoMRP[] = [];
  private ultimoResultadoMrp: Map<string, ResultadoCalculoMRP> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const empresaTritech = '11111111-1111-1111-1111-111111111111'; // Tritech Metalúrgica
    const empresaMwam = '22222222-2222-2222-2222-222222222222'; // MWAM
    const empresaOliveira = '33333333-3333-3333-3333-333333333333'; // Oliveira & Amorim

    // =========================================================================
    // 1. CENTROS DE TRABALHO / MÁQUINAS (COM OEE, TURNOS, OPERADORES E CAPACIDADE)
    // =========================================================================
    this.maquinas = [
      // SETOR: CORTE E DOBRA
      {
        id: 'maq-laser-fiber-12kw',
        codigo: 'COR-LSR-01',
        nome: 'Corte a Laser Fibra Óptica 12kW Trumpf TruLaser 5030',
        setor: 'CORTE_DOBRA',
        empresaId: empresaTritech,
        capacidadeHorasDiaNominal: 16.0, // 2 turnos de 8h
        turnosTrabalho: 2,
        eficienciaOEE: 0.88, // 88% OEE
        capacidadeHorasDiaLiquida: 14.08,
        operadoresDisponiveis: 2,
        operadoresNecessarios: 2,
        taxaOcupacaoPercentual: 115.0, // GARGALO CRÍTICO
        cargaProgramadaHoras: 16.2,
        statusOperacional: 'GARGALO',
        manutencoesAgendadas: [],
      },
      {
        id: 'maq-dobradeira-cnc-320t',
        codigo: 'DOB-CNC-01',
        nome: 'Dobradeira CNC Hidráulica 320T x 4000mm Bystronic',
        setor: 'CORTE_DOBRA',
        empresaId: empresaTritech,
        capacidadeHorasDiaNominal: 16.0,
        turnosTrabalho: 2,
        eficienciaOEE: 0.85,
        capacidadeHorasDiaLiquida: 13.6,
        operadoresDisponiveis: 2,
        operadoresNecessarios: 2,
        taxaOcupacaoPercentual: 78.5,
        cargaProgramadaHoras: 10.67,
        statusOperacional: 'EM_OPERACAO',
        manutencoesAgendadas: [],
      },

      // SETOR: USINAGEM CNC
      {
        id: 'maq-centro-usinagem-5eixos',
        codigo: 'USI-CNC-01',
        nome: 'Centro de Usinagem Vertical 5 Eixos Mazak Variaxis i-700',
        setor: 'USINAGEM',
        empresaId: empresaTritech,
        capacidadeHorasDiaNominal: 24.0, // 3 turnos
        turnosTrabalho: 3,
        eficienciaOEE: 0.9,
        capacidadeHorasDiaLiquida: 18.0, // 21.6h - 3.6h manutenção programada
        operadoresDisponiveis: 3,
        operadoresNecessarios: 3,
        taxaOcupacaoPercentual: 108.3, // GARGALO
        cargaProgramadaHoras: 19.5,
        statusOperacional: 'GARGALO',
        manutencoesAgendadas: [
          {
            id: 'manut-usi-01',
            maquinaId: 'maq-centro-usinagem-5eixos',
            maquinaNome: 'Centro de Usinagem Vertical 5 Eixos Mazak Variaxis i-700',
            tipo: 'PREVENTIVA',
            dataInicio: '2026-03-02T08:00:00Z',
            dataFim: '2026-03-02T12:00:00Z',
            horasParada: 4.0,
            descricao: 'Troca de guias lineares e calibração laser do fuso Spindle 18.000 RPM',
            status: 'AGENDADA',
          },
        ],
      },
      {
        id: 'maq-torno-cnc-heavy-duty',
        codigo: 'USI-TRN-01',
        nome: 'Torno CNC Barramento Inclinado Romi GL 450M com Ferramenta Acionada',
        setor: 'USINAGEM',
        empresaId: empresaTritech,
        capacidadeHorasDiaNominal: 16.0,
        turnosTrabalho: 2,
        eficienciaOEE: 0.85,
        capacidadeHorasDiaLiquida: 13.6,
        operadoresDisponiveis: 2,
        operadoresNecessarios: 2,
        taxaOcupacaoPercentual: 62.0,
        cargaProgramadaHoras: 8.43,
        statusOperacional: 'DISPONIVEL',
        manutencoesAgendadas: [],
      },

      // SETOR: CALDEIRARIA E SOLDA
      {
        id: 'maq-celula-solda-robotica',
        codigo: 'SOL-ROB-01',
        nome: 'Célula Robotizada de Solda MIG/MAG Arco Duplo Fanuc ArcMate 120iD',
        setor: 'CALDEIRARIA_SOLDA',
        empresaId: empresaTritech,
        capacidadeHorasDiaNominal: 16.0,
        turnosTrabalho: 2,
        eficienciaOEE: 0.92,
        capacidadeHorasDiaLiquida: 14.72,
        operadoresDisponiveis: 2,
        operadoresNecessarios: 2,
        taxaOcupacaoPercentual: 88.0,
        cargaProgramadaHoras: 12.95,
        statusOperacional: 'EM_OPERACAO',
        manutencoesAgendadas: [],
      },
      {
        id: 'maq-bancada-solda-manual',
        codigo: 'SOL-MAN-01',
        nome: 'Posto de Caldeiraria Pesada e Soldagem TIG/Eletrodo Revestido',
        setor: 'CALDEIRARIA_SOLDA',
        empresaId: empresaTritech,
        capacidadeHorasDiaNominal: 8.0,
        turnosTrabalho: 1,
        eficienciaOEE: 0.8,
        capacidadeHorasDiaLiquida: 6.4,
        operadoresDisponiveis: 1,
        operadoresNecessarios: 2, // ALERTA: FALTA DE 1 OPERADOR
        taxaOcupacaoPercentual: 110.0,
        cargaProgramadaHoras: 7.04,
        statusOperacional: 'GARGALO',
        manutencoesAgendadas: [],
      },

      // SETOR: MONTAGEM E ACOPLAMENTO
      {
        id: 'maq-linha-montagem-mecanica',
        codigo: 'MON-LIN-01',
        nome: 'Linha de Montagem Estrutural e Acoplamento Hidráulico',
        setor: 'MONTAGEM',
        empresaId: empresaTritech,
        capacidadeHorasDiaNominal: 16.0,
        turnosTrabalho: 2,
        eficienciaOEE: 0.9,
        capacidadeHorasDiaLiquida: 14.4,
        operadoresDisponiveis: 4,
        operadoresNecessarios: 4,
        taxaOcupacaoPercentual: 72.0,
        cargaProgramadaHoras: 10.36,
        statusOperacional: 'EM_OPERACAO',
        manutencoesAgendadas: [],
      },

      // SETOR: PINTURA E ACABAMENTO
      {
        id: 'maq-cabine-pintura-liquida',
        codigo: 'PIN-CAB-01',
        nome: 'Cabine de Pintura Eletrostática e Estufa de Cura a Gás',
        setor: 'PINTURA',
        empresaId: empresaTritech,
        capacidadeHorasDiaNominal: 16.0,
        turnosTrabalho: 2,
        eficienciaOEE: 0.85,
        capacidadeHorasDiaLiquida: 13.6,
        operadoresDisponiveis: 2,
        operadoresNecessarios: 2,
        taxaOcupacaoPercentual: 55.0,
        cargaProgramadaHoras: 7.48,
        statusOperacional: 'DISPONIVEL',
        manutencoesAgendadas: [],
      },

      // SETOR: INSPEÇÃO E QUALIDADE
      {
        id: 'maq-tridimensional-cmm',
        codigo: 'QLD-CMM-01',
        nome: 'Máquina Tridimensional de Medição por Coordenadas (CMM) Zeiss Contura',
        setor: 'INSPECAO_QUALIDADE',
        empresaId: empresaTritech,
        capacidadeHorasDiaNominal: 8.0,
        turnosTrabalho: 1,
        eficienciaOEE: 0.95,
        capacidadeHorasDiaLiquida: 7.6,
        operadoresDisponiveis: 1,
        operadoresNecessarios: 1,
        taxaOcupacaoPercentual: 60.0,
        cargaProgramadaHoras: 4.56,
        statusOperacional: 'DISPONIVEL',
        manutencoesAgendadas: [],
      },
    ];

    // =========================================================================
    // 2. ORDENS DE PRODUÇÃO (OPS) ATIVAS COM OPERAÇÕES DETALHADAS
    // =========================================================================
    this.ordensProducao = [
      {
        id: 'op-2026-001',
        numero: 'OP-2026-001',
        empresaId: empresaTritech,
        codigoItem: 'PA-CHAS-ESC-22T',
        descricaoItem: 'Chassi Estrutural de Escavadeira 22T',
        tipoItem: 'PRODUTO_FABRICADO',
        projetoId: 'prj-chassi-escavadeira-2026',
        revisaoId: 'rev-chassi-01',
        pedidoVendaId: 'ped-2026-cat-01',
        pedidoVendaNumero: 'PED-2026-001',
        clienteNome: 'Caterpillar Brasil Equipamentos',
        quantidadePlanejada: 5,
        quantidadeProduzida: 1,
        unidadeMedida: 'UN',
        prioridade: 'URGENTE',
        status: 'EM_ANDAMENTO',
        dataEmissao: '2026-02-18T08:00:00Z',
        dataInicioPrevista: '2026-02-20T07:00:00Z',
        dataFimPrevista: '2026-03-05T17:00:00Z',
        dataEntregaPrometida: '2026-03-10T18:00:00Z',
        leadTimeDias: 12,
        loteMinimo: 1,
        multiploLote: 1,
        custoTotalEstimado: 92250.0,
        origemRastreabilidade: {
          tipoOrigem: 'PEDIDO_VENDA',
          documentoOrigemId: 'ped-2026-cat-01',
          documentoOrigemNumero: 'PED-2026-001',
          solicitante: 'Dept. Vendas Industriais',
          motivo: 'Atendimento a contrato nº CT-2026-CAT com penalidade por dia de atraso.',
        },
        materiaisNecessarios: [
          {
            itemCodigo: 'MP-CHAPA-1020-1/2',
            itemDescricao: 'Chapa Aço SAE 1020 1/2" (12.7mm) x 1500 x 6000mm',
            quantidadePorUnidade: 4,
            quantidadeTotal: 20,
            unidadeMedida: 'CH',
            percentualPerda: 4.5,
            estoqueDisponivel: 6,
            quantidadeReservada: 6,
            quantidadeBloqueada: 0,
            statusDisponibilidade: 'PARCIAL',
          },
          {
            itemCodigo: 'MP-CHAPA-HARDOX-450',
            itemDescricao: 'Chapa Aço Antidesgaste HARDOX 450 16mm x 2000 x 6000mm',
            quantidadePorUnidade: 2,
            quantidadeTotal: 10,
            unidadeMedida: 'CH',
            percentualPerda: 3.0,
            estoqueDisponivel: 1,
            quantidadeReservada: 1,
            quantidadeBloqueada: 2, // BLOQUEADO EM QUARENTENA LAUDO DE DUREZA
            statusDisponibilidade: 'INDISPONIVEL',
          },
          {
            itemCodigo: 'SUB-BRACO-ARTIC-01',
            itemDescricao: 'Subconjunto Mancal Articulado Usinado',
            quantidadePorUnidade: 2,
            quantidadeTotal: 10,
            unidadeMedida: 'PC',
            percentualPerda: 0.0,
            estoqueDisponivel: 2,
            quantidadeReservada: 2,
            quantidadeBloqueada: 0,
            statusDisponibilidade: 'PARCIAL',
          },
        ],
        operacoes: [
          {
            id: 'op-001-seq-10',
            opId: 'op-2026-001',
            ordemProducaoNumero: 'OP-2026-001',
            sequenciaOperacao: 10,
            operacaoNome: 'Corte a Laser das Chapas do Chassi e Reforços',
            setor: 'CORTE_DOBRA',
            maquinaId: 'maq-laser-fiber-12kw',
            maquinaNome: 'Corte a Laser Fibra Óptica 12kW Trumpf TruLaser 5030',
            codigoItem: 'PA-CHAS-ESC-22T',
            descricaoItem: 'Chassi Estrutural de Escavadeira 22T',
            clienteNome: 'Caterpillar Brasil',
            pedidoVendaId: 'ped-2026-cat-01',
            quantidade: 5,
            tempoSetupHoras: 1.0,
            tempoProcessamentoHoras: 7.5,
            tempoTotalEstimadoHoras: 8.5,
            dataInicioPrevista: '2026-02-20T07:00:00Z',
            dataFimPrevista: '2026-02-21T16:00:00Z',
            dataEntregaPrometida: '2026-03-10T18:00:00Z',
            prioridade: 'URGENTE',
            criticalRatio: 0.85, // CR < 1.0 = Risco de Atraso
            posicaoFila: 1,
            status: 'CONCLUIDA',
            operadorDesignado: 'Marcos Silveira (Op. Laser N2)',
          },
          {
            id: 'op-001-seq-20',
            opId: 'op-2026-001',
            ordemProducaoNumero: 'OP-2026-001',
            sequenciaOperacao: 20,
            operacaoNome: 'Dobra CNC das Longarinas e Travessas',
            setor: 'CORTE_DOBRA',
            maquinaId: 'maq-dobradeira-cnc-320t',
            maquinaNome: 'Dobradeira CNC Hidráulica 320T x 4000mm Bystronic',
            codigoItem: 'PA-CHAS-ESC-22T',
            descricaoItem: 'Chassi Estrutural de Escavadeira 22T',
            clienteNome: 'Caterpillar Brasil',
            pedidoVendaId: 'ped-2026-cat-01',
            quantidade: 5,
            tempoSetupHoras: 0.8,
            tempoProcessamentoHoras: 5.2,
            tempoTotalEstimadoHoras: 6.0,
            dataInicioPrevista: '2026-02-22T08:00:00Z',
            dataFimPrevista: '2026-02-23T14:30:00Z',
            dataEntregaPrometida: '2026-03-10T18:00:00Z',
            prioridade: 'URGENTE',
            criticalRatio: 0.88,
            posicaoFila: 1,
            status: 'EM_PROCESSO',
            operadorDesignado: 'Claudio Peixoto (Dobra CNC)',
          },
          {
            id: 'op-001-seq-30',
            opId: 'op-2026-001',
            ordemProducaoNumero: 'OP-2026-001',
            sequenciaOperacao: 30,
            operacaoNome: 'Soldagem Robotizada e Caldeiraria dos Reforços',
            setor: 'CALDEIRARIA_SOLDA',
            maquinaId: 'maq-celula-solda-robotica',
            maquinaNome: 'Célula Robotizada de Solda MIG/MAG Arco Duplo Fanuc',
            codigoItem: 'PA-CHAS-ESC-22T',
            descricaoItem: 'Chassi Estrutural de Escavadeira 22T',
            clienteNome: 'Caterpillar Brasil',
            pedidoVendaId: 'ped-2026-cat-01',
            quantidade: 5,
            tempoSetupHoras: 1.5,
            tempoProcessamentoHoras: 9.0,
            tempoTotalEstimadoHoras: 10.5,
            dataInicioPrevista: '2026-02-24T08:00:00Z',
            dataFimPrevista: '2026-02-26T17:00:00Z',
            dataEntregaPrometida: '2026-03-10T18:00:00Z',
            prioridade: 'URGENTE',
            criticalRatio: 0.92,
            posicaoFila: 2,
            status: 'PENDENTE',
            operadorDesignado: 'Equipe Solda Robótica A',
          },
          {
            id: 'op-001-seq-40',
            opId: 'op-2026-001',
            ordemProducaoNumero: 'OP-2026-001',
            sequenciaOperacao: 40,
            operacaoNome: 'Usinagem CNC de Precisão das Faces de Acoplamento',
            setor: 'USINAGEM',
            maquinaId: 'maq-centro-usinagem-5eixos',
            maquinaNome: 'Centro de Usinagem Vertical 5 Eixos Mazak Variaxis i-700',
            codigoItem: 'PA-CHAS-ESC-22T',
            descricaoItem: 'Chassi Estrutural de Escavadeira 22T',
            clienteNome: 'Caterpillar Brasil',
            pedidoVendaId: 'ped-2026-cat-01',
            quantidade: 5,
            tempoSetupHoras: 2.0,
            tempoProcessamentoHoras: 12.0,
            tempoTotalEstimadoHoras: 14.0,
            dataInicioPrevista: '2026-02-27T08:00:00Z',
            dataFimPrevista: '2026-03-02T16:00:00Z',
            dataEntregaPrometida: '2026-03-10T18:00:00Z',
            prioridade: 'URGENTE',
            criticalRatio: 0.95,
            posicaoFila: 3,
            status: 'PENDENTE',
          },
          {
            id: 'op-001-seq-50',
            opId: 'op-2026-001',
            ordemProducaoNumero: 'OP-2026-001',
            sequenciaOperacao: 50,
            operacaoNome: 'Pintura Eletrostática Epóxi e Estufa',
            setor: 'PINTURA',
            maquinaId: 'maq-cabine-pintura-liquida',
            maquinaNome: 'Cabine de Pintura Eletrostática e Estufa de Cura a Gás',
            codigoItem: 'PA-CHAS-ESC-22T',
            descricaoItem: 'Chassi Estrutural de Escavadeira 22T',
            clienteNome: 'Caterpillar Brasil',
            quantidade: 5,
            tempoSetupHoras: 0.5,
            tempoProcessamentoHoras: 4.5,
            tempoTotalEstimadoHoras: 5.0,
            dataInicioPrevista: '2026-03-03T08:00:00Z',
            dataFimPrevista: '2026-03-04T13:00:00Z',
            dataEntregaPrometida: '2026-03-10T18:00:00Z',
            prioridade: 'URGENTE',
            criticalRatio: 1.1,
            posicaoFila: 1,
            status: 'PENDENTE',
          },
          {
            id: 'op-001-seq-60',
            opId: 'op-2026-001',
            ordemProducaoNumero: 'OP-2026-001',
            sequenciaOperacao: 60,
            operacaoNome: 'Inspeção Dimensional CMM Zeiss e Emissão de RNC/Laudo',
            setor: 'INSPECAO_QUALIDADE',
            maquinaId: 'maq-tridimensional-cmm',
            maquinaNome: 'Máquina Tridimensional CMM Zeiss Contura',
            codigoItem: 'PA-CHAS-ESC-22T',
            descricaoItem: 'Chassi Estrutural de Escavadeira 22T',
            clienteNome: 'Caterpillar Brasil',
            quantidade: 5,
            tempoSetupHoras: 0.5,
            tempoProcessamentoHoras: 2.5,
            tempoTotalEstimadoHoras: 3.0,
            dataInicioPrevista: '2026-03-05T08:00:00Z',
            dataFimPrevista: '2026-03-05T12:00:00Z',
            dataEntregaPrometida: '2026-03-10T18:00:00Z',
            prioridade: 'URGENTE',
            criticalRatio: 1.25,
            posicaoFila: 1,
            status: 'PENDENTE',
          },
        ],
      },
      {
        id: 'op-2026-002',
        numero: 'OP-2026-002',
        empresaId: empresaTritech,
        codigoItem: 'PA-SILO-AGRO-60T',
        descricaoItem: 'Silo Graneleiro Metálico Cônico 60 Toneladas',
        tipoItem: 'PRODUTO_FABRICADO',
        projetoId: 'prj-silo-agricola-2026',
        revisaoId: 'rev-silo-01',
        pedidoVendaId: 'ped-2026-sen-02',
        pedidoVendaNumero: 'PED-2026-002',
        clienteNome: 'Senagro Agronegócios S.A.',
        quantidadePlanejada: 2,
        quantidadeProduzida: 0,
        unidadeMedida: 'UN',
        prioridade: 'ALTA',
        status: 'LIBERADA',
        dataEmissao: '2026-02-21T10:00:00Z',
        dataInicioPrevista: '2026-02-25T07:00:00Z',
        dataFimPrevista: '2026-03-12T17:00:00Z',
        dataEntregaPrometida: '2026-03-18T18:00:00Z',
        leadTimeDias: 15,
        loteMinimo: 1,
        multiploLote: 1,
        custoTotalEstimado: 64800.0,
        origemRastreabilidade: {
          tipoOrigem: 'PEDIDO_VENDA',
          documentoOrigemId: 'ped-2026-sen-02',
          documentoOrigemNumero: 'PED-2026-002',
          solicitante: 'Dept. Agrícola',
          motivo: 'Safra de soja 2026 - Entrega no silo regional de Rio Verde/GO.',
        },
        materiaisNecessarios: [
          {
            itemCodigo: 'MP-CHAPA-GALV-2.0',
            itemDescricao: 'Chapa de Aço Galvanizado Z275 2.0mm x 1200 x 3000mm',
            quantidadePorUnidade: 30,
            quantidadeTotal: 60,
            unidadeMedida: 'CH',
            percentualPerda: 2.0,
            estoqueDisponivel: 20,
            quantidadeReservada: 20,
            quantidadeBloqueada: 0,
            statusDisponibilidade: 'PARCIAL',
          },
          {
            itemCodigo: 'MP-PERFIL-U-6POL',
            itemDescricao: 'Perfil Estrutural U Laminado 6" x 12.2 kg/m',
            quantidadePorUnidade: 12,
            quantidadeTotal: 24,
            unidadeMedida: 'BR',
            percentualPerda: 3.5,
            estoqueDisponivel: 8,
            quantidadeReservada: 8,
            quantidadeBloqueada: 0,
            statusDisponibilidade: 'PARCIAL',
          },
        ],
        operacoes: [
          {
            id: 'op-002-seq-10',
            opId: 'op-2026-002',
            ordemProducaoNumero: 'OP-2026-002',
            sequenciaOperacao: 10,
            operacaoNome: 'Corte a Laser dos Painéis Curvos Galvanizados',
            setor: 'CORTE_DOBRA',
            maquinaId: 'maq-laser-fiber-12kw',
            maquinaNome: 'Corte a Laser Fibra Óptica 12kW Trumpf TruLaser 5030',
            codigoItem: 'PA-SILO-AGRO-60T',
            descricaoItem: 'Silo Graneleiro Metálico Cônico 60 Toneladas',
            clienteNome: 'Senagro Agronegócios',
            pedidoVendaId: 'ped-2026-sen-02',
            quantidade: 2,
            tempoSetupHoras: 1.2,
            tempoProcessamentoHoras: 6.5,
            tempoTotalEstimadoHoras: 7.7,
            dataInicioPrevista: '2026-02-25T07:00:00Z',
            dataFimPrevista: '2026-02-26T15:00:00Z',
            dataEntregaPrometida: '2026-03-18T18:00:00Z',
            prioridade: 'ALTA',
            criticalRatio: 1.45,
            posicaoFila: 2,
            status: 'PENDENTE',
          },
          {
            id: 'op-002-seq-20',
            opId: 'op-2026-002',
            ordemProducaoNumero: 'OP-2026-002',
            sequenciaOperacao: 20,
            operacaoNome: 'Calandragem e Dobra dos Anéis do Silo',
            setor: 'CORTE_DOBRA',
            maquinaId: 'maq-dobradeira-cnc-320t',
            maquinaNome: 'Dobradeira CNC Hidráulica 320T x 4000mm Bystronic',
            codigoItem: 'PA-SILO-AGRO-60T',
            descricaoItem: 'Silo Graneleiro Metálico Cônico 60 Toneladas',
            clienteNome: 'Senagro Agronegócios',
            quantidade: 2,
            tempoSetupHoras: 0.8,
            tempoProcessamentoHoras: 3.87,
            tempoTotalEstimadoHoras: 4.67,
            dataInicioPrevista: '2026-02-27T08:00:00Z',
            dataFimPrevista: '2026-02-27T14:00:00Z',
            dataEntregaPrometida: '2026-03-18T18:00:00Z',
            prioridade: 'ALTA',
            criticalRatio: 1.5,
            posicaoFila: 2,
            status: 'PENDENTE',
          },
          {
            id: 'op-002-seq-30',
            opId: 'op-2026-002',
            ordemProducaoNumero: 'OP-2026-002',
            sequenciaOperacao: 30,
            operacaoNome: 'Caldeiraria Pesada e Montagem Estrutural das Colunas',
            setor: 'CALDEIRARIA_SOLDA',
            maquinaId: 'maq-bancada-solda-manual',
            maquinaNome: 'Posto de Caldeiraria Pesada e Soldagem TIG/Eletrodo Revestido',
            codigoItem: 'PA-SILO-AGRO-60T',
            descricaoItem: 'Silo Graneleiro Metálico Cônico 60 Toneladas',
            clienteNome: 'Senagro Agronegócios',
            quantidade: 2,
            tempoSetupHoras: 1.0,
            tempoProcessamentoHoras: 6.04,
            tempoTotalEstimadoHoras: 7.04,
            dataInicioPrevista: '2026-03-01T08:00:00Z',
            dataFimPrevista: '2026-03-04T17:00:00Z',
            dataEntregaPrometida: '2026-03-18T18:00:00Z',
            prioridade: 'ALTA',
            criticalRatio: 1.35,
            posicaoFila: 1,
            status: 'PENDENTE',
          },
        ],
      },
    ];
  }

  // =========================================================================
  // MÉTODOS DE CONSULTA BÁSICA
  // =========================================================================
  public obterOrdensProducao(empresaId: string): OrdemProducao[] {
    return this.ordensProducao.filter((op) => op.empresaId === empresaId);
  }

  public obterOrdemProducaoPorId(id: string): OrdemProducao | undefined {
    return this.ordensProducao.find((op) => op.id === id);
  }

  public obterMaquinas(empresaId: string): CentroTrabalhoMaquina[] {
    return this.maquinas.filter((m) => m.empresaId === empresaId);
  }

  public obterManutencoes(empresaId: string): ManutencaoProgramada[] {
    const maqsEmpresa = new Set(this.obterMaquinas(empresaId).map((m) => m.id));
    const manuts: ManutencaoProgramada[] = [];
    for (const m of this.maquinas) {
      if (maqsEmpresa.has(m.id)) {
        manuts.push(...m.manutencoesAgendadas);
      }
    }
    return manuts;
  }

  public criarOrdemProducao(novaOp: Partial<OrdemProducao>): OrdemProducao {
    const opCompleta: OrdemProducao = {
      id: novaOp.id || `op-manual-${Date.now()}`,
      numero: novaOp.numero || `OP-${new Date().getFullYear()}-${String(this.ordensProducao.length + 1).padStart(3, '0')}`,
      empresaId: novaOp.empresaId || '11111111-1111-1111-1111-111111111111',
      codigoItem: novaOp.codigoItem || 'ITEM-NOVO',
      descricaoItem: novaOp.descricaoItem || 'Item Fabricado sob Encomenda',
      tipoItem: novaOp.tipoItem || 'PRODUTO_FABRICADO',
      quantidadePlanejada: novaOp.quantidadePlanejada || 1,
      quantidadeProduzida: 0,
      unidadeMedida: novaOp.unidadeMedida || 'UN',
      prioridade: novaOp.prioridade || 'MEDIA',
      status: novaOp.status || 'PLANEJADA',
      dataEmissao: novaOp.dataEmissao || new Date().toISOString(),
      dataInicioPrevista: novaOp.dataInicioPrevista || new Date().toISOString(),
      dataFimPrevista: novaOp.dataFimPrevista || new Date(Date.now() + 7 * 86400000).toISOString(),
      dataEntregaPrometida: novaOp.dataEntregaPrometida || new Date(Date.now() + 10 * 86400000).toISOString(),
      leadTimeDias: novaOp.leadTimeDias || 7,
      loteMinimo: novaOp.loteMinimo || 1,
      multiploLote: novaOp.multiploLote || 1,
      custoTotalEstimado: novaOp.custoTotalEstimado || 0,
      origemRastreabilidade: novaOp.origemRastreabilidade || {
        tipoOrigem: 'DEMANDA_INDEPENDENTE',
        motivo: 'Abertura manual de OP via interface PCP.',
      },
      materiaisNecessarios: novaOp.materiaisNecessarios || [],
      operacoes: novaOp.operacoes || [],
    };

    this.ordensProducao.push(opCompleta);
    return opCompleta;
  }

  // =========================================================================
  // MOTOR DETERMINÍSTICO MRP INICIAL
  // =========================================================================
  public calcularMrp(empresaId: string): ResultadoCalculoMRP {
    const inicioMs = Date.now();

    // 1. BASE DE CONSOLIDAÇÃO DE DEMANDA (PEDIDOS + OPS ATIVAS + ESTOQUE DE SEGURANÇA)
    const demandaBrutaConsolidada: Map<string, DemandaBrutaConsolidada> = new Map();

    // Inserção de Demandas de Pedidos de Venda em Carteira
    const pedidosCarteira = [
      {
        pedidoId: 'ped-2026-cat-01',
        pedidoNumero: 'PED-2026-001',
        clienteNome: 'Caterpillar Brasil Equipamentos',
        codigoItem: 'PA-CHAS-ESC-22T',
        descricaoItem: 'Chassi Estrutural de Escavadeira 22T',
        tipoItem: 'PRODUTO_FABRICADO' as const,
        unidadeMedida: 'UN',
        quantidade: 5,
        dataPrometida: '2026-03-10T18:00:00Z',
        prioridade: 'URGENTE' as PrioridadeProducao,
        nivelEstrutura: 0,
      },
      {
        pedidoId: 'ped-2026-sen-02',
        pedidoNumero: 'PED-2026-002',
        clienteNome: 'Senagro Agronegócios S.A.',
        codigoItem: 'PA-SILO-AGRO-60T',
        descricaoItem: 'Silo Graneleiro Metálico Cônico 60 Toneladas',
        tipoItem: 'PRODUTO_FABRICADO' as const,
        unidadeMedida: 'UN',
        quantidade: 2,
        dataPrometida: '2026-03-18T18:00:00Z',
        prioridade: 'ALTA' as PrioridadeProducao,
        nivelEstrutura: 0,
      },
      {
        pedidoId: 'ped-2026-val-03',
        pedidoNumero: 'PED-2026-003',
        clienteNome: 'Vale S.A. Mineração',
        codigoItem: 'SUB-BRACO-ARTIC-01',
        descricaoItem: 'Subconjunto Mancal Articulado Usinado',
        tipoItem: 'SUB_CONJUNTO' as const,
        unidadeMedida: 'PC',
        quantidade: 8,
        dataPrometida: '2026-03-08T18:00:00Z',
        prioridade: 'URGENTE' as PrioridadeProducao,
        nivelEstrutura: 1,
      },
    ];

    for (const ped of pedidosCarteira) {
      if (!demandaBrutaConsolidada.has(ped.codigoItem)) {
        demandaBrutaConsolidada.set(ped.codigoItem, {
          id: `dem-${ped.codigoItem}`,
          codigoItem: ped.codigoItem,
          descricaoItem: ped.descricaoItem,
          tipoItem: ped.tipoItem,
          unidadeMedida: ped.unidadeMedida,
          quantidadeTotal: 0,
          dataNecessidadeMaisProxima: ped.dataPrometida,
          origens: [],
        });
      }
      const d = demandaBrutaConsolidada.get(ped.codigoItem)!;
      d.quantidadeTotal += ped.quantidade;
      d.origens.push({
        tipo: 'PEDIDO_VENDA',
        documentoId: ped.pedidoId,
        documentoNumero: ped.pedidoNumero,
        clienteNome: ped.clienteNome,
        quantidade: ped.quantidade,
        dataPrometida: ped.dataPrometida,
        prioridade: ped.prioridade,
        nivelEstrutura: ped.nivelEstrutura,
      });
    }

    // 2. EXPLOSÃO MULTINÍVEL DE ESTRUTURA (BOM COM SUCATA / PERDAS DA ENGENHARIA)
    const bomEngenharia: Record<
      string,
      Array<{
        codigoItem: string;
        descricaoItem: string;
        tipoItem: 'MATERIA_PRIMA' | 'COMPONENTE' | 'SUB_CONJUNTO';
        unidadeMedida: string;
        quantidadePorUnidadePai: number;
        percentualPerda: number;
        leadTimeDias: number;
        loteMinimo: number;
        multiplo: number;
        fornecedorPreferencial: { nome: string; cnpj: string; precoUnitario: number };
      }>
    > = {
      'PA-CHAS-ESC-22T': [
        {
          codigoItem: 'MP-CHAPA-1020-1/2',
          descricaoItem: 'Chapa Aço SAE 1020 1/2" (12.7mm) x 1500 x 6000mm',
          tipoItem: 'MATERIA_PRIMA',
          unidadeMedida: 'CH',
          quantidadePorUnidadePai: 4.0,
          percentualPerda: 5.0, // 5% de sucata/esqueleto de corte
          leadTimeDias: 10,
          loteMinimo: 10,
          multiplo: 5,
          fornecedorPreferencial: {
            nome: 'Gerdau Aços Especiais S.A.',
            cnpj: '33.611.500/0001-19',
            precoUnitario: 1450.0,
          },
        },
        {
          codigoItem: 'MP-CHAPA-HARDOX-450',
          descricaoItem: 'Chapa Aço Antidesgaste HARDOX 450 16mm x 2000 x 6000mm',
          tipoItem: 'MATERIA_PRIMA',
          unidadeMedida: 'CH',
          quantidadePorUnidadePai: 2.0,
          percentualPerda: 4.0,
          leadTimeDias: 15,
          loteMinimo: 5,
          multiplo: 5,
          fornecedorPreferencial: {
            nome: 'SSAB Swedish Steel do Brasil',
            cnpj: '02.455.990/0001-44',
            precoUnitario: 3850.0,
          },
        },
        {
          codigoItem: 'SUB-BRACO-ARTIC-01',
          descricaoItem: 'Subconjunto Mancal Articulado Usinado',
          tipoItem: 'SUB_CONJUNTO',
          unidadeMedida: 'PC',
          quantidadePorUnidadePai: 2.0,
          percentualPerda: 0.0,
          leadTimeDias: 5,
          loteMinimo: 4,
          multiplo: 2,
          fornecedorPreferencial: {
            nome: 'Fabricação Interna Tritech',
            cnpj: '11.111.111/0001-11',
            precoUnitario: 890.0,
          },
        },
        {
          codigoItem: 'CMP-PARAF-M24-CL10.9',
          descricaoItem: 'Parafuso Sextavado M24x120mm Classe 10.9 Geomet',
          tipoItem: 'COMPONENTE',
          unidadeMedida: 'PC',
          quantidadePorUnidadePai: 32.0,
          percentualPerda: 2.0,
          leadTimeDias: 4,
          loteMinimo: 100,
          multiplo: 50,
          fornecedorPreferencial: {
            nome: 'Ciser Parafusos e Porcas',
            cnpj: '84.683.899/0001-90',
            precoUnitario: 18.5,
          },
        },
      ],
      'PA-SILO-AGRO-60T': [
        {
          codigoItem: 'MP-CHAPA-GALV-2.0',
          descricaoItem: 'Chapa de Aço Galvanizado Z275 2.0mm x 1200 x 3000mm',
          tipoItem: 'MATERIA_PRIMA',
          unidadeMedida: 'CH',
          quantidadePorUnidadePai: 30.0,
          percentualPerda: 3.0,
          leadTimeDias: 7,
          loteMinimo: 50,
          multiplo: 25,
          fornecedorPreferencial: {
            nome: 'CSN - Companhia Siderúrgica Nacional',
            cnpj: '33.042.730/0001-04',
            precoUnitario: 420.0,
          },
        },
        {
          codigoItem: 'MP-PERFIL-U-6POL',
          descricaoItem: 'Perfil Estrutural U Laminado 6" x 12.2 kg/m (Barra 6m)',
          tipoItem: 'MATERIA_PRIMA',
          unidadeMedida: 'BR',
          quantidadePorUnidadePai: 12.0,
          percentualPerda: 4.0,
          leadTimeDias: 8,
          loteMinimo: 20,
          multiplo: 10,
          fornecedorPreferencial: {
            nome: 'Açovisa Comércio de Aços',
            cnpj: '59.105.894/0001-70',
            precoUnitario: 310.0,
          },
        },
      ],
      'SUB-BRACO-ARTIC-01': [
        {
          codigoItem: 'MP-BARRA-REDONDA-1045-4POL',
          descricaoItem: 'Barra Redonda Aço SAE 1045 Ø 4" (101.6mm) Laminada',
          tipoItem: 'MATERIA_PRIMA',
          unidadeMedida: 'KG',
          quantidadePorUnidadePai: 18.5,
          percentualPerda: 8.0, // Perda cavaco de usinagem
          leadTimeDias: 6,
          loteMinimo: 100,
          multiplo: 50,
          fornecedorPreferencial: {
            nome: 'Villares Metals S.A.',
            cnpj: '01.554.890/0001-01',
            precoUnitario: 14.2,
          },
        },
        {
          codigoItem: 'CMP-BUCHA-BRONZE-TM23',
          descricaoItem: 'Bucha Autolubrificante em Bronze TM-23 Ø Int 70mm',
          tipoItem: 'COMPONENTE',
          unidadeMedida: 'PC',
          quantidadePorUnidadePai: 2.0,
          percentualPerda: 0.0,
          leadTimeDias: 12,
          loteMinimo: 10,
          multiplo: 5,
          fornecedorPreferencial: {
            nome: 'Federal-Mogul Powertrain',
            cnpj: '43.210.987/0001-55',
            precoUnitario: 185.0,
          },
        },
      ],
    };

    // Realizar explosão recursiva de demandas
    const explodirDemanda = (codigoPai: string, qtdPai: number, dataPai: string, pedidoOrigem: any, nivel: number) => {
      const filhos = bomEngenharia[codigoPai];
      if (!filhos) return;

      for (const filho of filhos) {
        const perdaFator = 1 + filho.percentualPerda / 100;
        const qtdFilho = qtdPai * filho.quantidadePorUnidadePai * perdaFator;

        if (!demandaBrutaConsolidada.has(filho.codigoItem)) {
          demandaBrutaConsolidada.set(filho.codigoItem, {
            id: `dem-${filho.codigoItem}`,
            codigoItem: filho.codigoItem,
            descricaoItem: filho.descricaoItem,
            tipoItem: filho.tipoItem,
            unidadeMedida: filho.unidadeMedida,
            quantidadeTotal: 0,
            dataNecessidadeMaisProxima: dataPai,
            origens: [],
          });
        }

        const d = demandaBrutaConsolidada.get(filho.codigoItem)!;
        d.quantidadeTotal += qtdFilho;
        d.origens.push({
          tipo: 'OP_EM_ANDAMENTO',
          documentoId: pedidoOrigem?.pedidoId || 'demanda-mrp',
          documentoNumero: pedidoOrigem?.pedidoNumero || 'MRP-EXPLOSAO',
          clienteNome: pedidoOrigem?.clienteNome,
          quantidade: qtdFilho,
          dataPrometida: dataPai,
          prioridade: pedidoOrigem?.prioridade || 'MEDIA',
          nivelEstrutura: nivel,
        });

        // Se o filho também tem BOM (subconjunto), explodir recursivamente
        if (bomEngenharia[filho.codigoItem]) {
          explodirDemanda(filho.codigoItem, qtdFilho, dataPai, pedidoOrigem, nivel + 1);
        }
      }
    };

    for (const ped of pedidosCarteira) {
      explodirDemanda(ped.codigoItem, ped.quantidade, ped.dataPrometida, ped, 1);
    }

    // 3. TABELA DE SALDOS DE ESTOQUE, RESERVAS, MATERIAL BLOQUEADO E COMPRAS EM TRÂNSITO
    const estoquesSaldos: Record<
      string,
      {
        estoqueFisico: number;
        materialBloqueadoQuarentena: number;
        reservasAtivas: number;
        comprasEmTransito: number;
        pedidosCompraExistentesNumero?: string;
        producaoEmProcesso: number;
        estoqueSeguranca: number;
        leadTimeDias: number;
        loteMinimo: number;
        multiplo: number;
        fornecedor: { nome: string; cnpj: string; preco: number };
        ehFabricadoInterno?: boolean;
      }
    > = {
      'PA-CHAS-ESC-22T': {
        estoqueFisico: 1,
        materialBloqueadoQuarentena: 0,
        reservasAtivas: 1,
        comprasEmTransito: 0,
        producaoEmProcesso: 5, // OP-2026-001
        estoqueSeguranca: 0,
        leadTimeDias: 12,
        loteMinimo: 1,
        multiplo: 1,
        fornecedor: { nome: 'Fabricação Própria', cnpj: '11.111.111/0001-11', preco: 18450.0 },
        ehFabricadoInterno: true,
      },
      'PA-SILO-AGRO-60T': {
        estoqueFisico: 0,
        materialBloqueadoQuarentena: 0,
        reservasAtivas: 0,
        comprasEmTransito: 0,
        producaoEmProcesso: 2, // OP-2026-002
        estoqueSeguranca: 0,
        leadTimeDias: 15,
        loteMinimo: 1,
        multiplo: 1,
        fornecedor: { nome: 'Fabricação Própria', cnpj: '11.111.111/0001-11', preco: 32400.0 },
        ehFabricadoInterno: true,
      },
      'MP-CHAPA-1020-1/2': {
        estoqueFisico: 8,
        materialBloqueadoQuarentena: 0,
        reservasAtivas: 6,
        comprasEmTransito: 10, // Pedido de Compra PC-2026-042 já emitido
        pedidosCompraExistentesNumero: 'PC-2026-042 (Previsão: 28/02)',
        producaoEmProcesso: 0,
        estoqueSeguranca: 4,
        leadTimeDias: 10,
        loteMinimo: 10,
        multiplo: 5,
        fornecedor: { nome: 'Gerdau Aços Especiais S.A.', cnpj: '33.611.500/0001-19', preco: 1450.0 },
      },
      'MP-CHAPA-HARDOX-450': {
        estoqueFisico: 3,
        materialBloqueadoQuarentena: 2, // BLOQUEADO QUARENTENA LAUDO DE DUREZA
        reservasAtivas: 1,
        comprasEmTransito: 0, // NÃO TEM COMPRA ABERTA
        producaoEmProcesso: 0,
        estoqueSeguranca: 2,
        leadTimeDias: 15,
        loteMinimo: 5,
        multiplo: 5,
        fornecedor: { nome: 'SSAB Swedish Steel do Brasil', cnpj: '02.455.990/0001-44', preco: 3850.0 },
      },
      'SUB-BRACO-ARTIC-01': {
        estoqueFisico: 4,
        materialBloqueadoQuarentena: 0,
        reservasAtivas: 2,
        comprasEmTransito: 0,
        producaoEmProcesso: 0,
        estoqueSeguranca: 2,
        leadTimeDias: 5,
        loteMinimo: 4,
        multiplo: 2,
        fornecedor: { nome: 'Usinagem Interna Tritech', cnpj: '11.111.111/0001-11', preco: 890.0 },
        ehFabricadoInterno: true,
      },
      'CMP-PARAF-M24-CL10.9': {
        estoqueFisico: 80,
        materialBloqueadoQuarentena: 0,
        reservasAtivas: 50,
        comprasEmTransito: 100, // Pedido PC-2026-048 cobre a demanda
        pedidosCompraExistentesNumero: 'PC-2026-048 (Previsão: 26/02)',
        producaoEmProcesso: 0,
        estoqueSeguranca: 20,
        leadTimeDias: 4,
        loteMinimo: 100,
        multiplo: 50,
        fornecedor: { nome: 'Ciser Parafusos e Porcas', cnpj: '84.683.899/0001-90', preco: 18.5 },
      },
      'MP-CHAPA-GALV-2.0': {
        estoqueFisico: 25,
        materialBloqueadoQuarentena: 0,
        reservasAtivas: 20,
        comprasEmTransito: 0,
        producaoEmProcesso: 0,
        estoqueSeguranca: 10,
        leadTimeDias: 7,
        loteMinimo: 50,
        multiplo: 25,
        fornecedor: { nome: 'CSN - Companhia Siderúrgica Nacional', cnpj: '33.042.730/0001-04', preco: 420.0 },
      },
      'MP-PERFIL-U-6POL': {
        estoqueFisico: 10,
        materialBloqueadoQuarentena: 0,
        reservasAtivas: 8,
        comprasEmTransito: 20, // Já existe compra cobrindo parte
        pedidosCompraExistentesNumero: 'PC-2026-051 (Previsão: 01/03)',
        producaoEmProcesso: 0,
        estoqueSeguranca: 5,
        leadTimeDias: 8,
        loteMinimo: 20,
        multiplo: 10,
        fornecedor: { nome: 'Açovisa Comércio de Aços', cnpj: '59.105.894/0001-70', preco: 310.0 },
      },
      'MP-BARRA-REDONDA-1045-4POL': {
        estoqueFisico: 150.0,
        materialBloqueadoQuarentena: 0,
        reservasAtivas: 100.0,
        comprasEmTransito: 0,
        producaoEmProcesso: 0,
        estoqueSeguranca: 50.0,
        leadTimeDias: 6,
        loteMinimo: 100,
        multiplo: 50,
        fornecedor: { nome: 'Villares Metals S.A.', cnpj: '01.554.890/0001-01', preco: 14.2 },
      },
      'CMP-BUCHA-BRONZE-TM23': {
        estoqueFisico: 6,
        materialBloqueadoQuarentena: 0,
        reservasAtivas: 4,
        comprasEmTransito: 0,
        producaoEmProcesso: 0,
        estoqueSeguranca: 4,
        leadTimeDias: 12,
        loteMinimo: 10,
        multiplo: 5,
        fornecedor: { nome: 'Federal-Mogul Powertrain', cnpj: '43.210.987/0001-55', preco: 185.0 },
      },
    };

    // 4. PROCESSAMENTO DAS NECESSIDADES LÍQUIDAS E GERAÇÃO DE SUGESTÕES
    const necessidadesLiquidas: NecessidadeLiquidaItem[] = [];
    const sugestoesCompra: SugestaoCompraMRP[] = [];
    const sugestoesProducao: SugestaoProducaoMRP[] = [];
    const riscosAtraso: RiscoAtrasoProducao[] = [];

    const hoje = new Date('2026-02-22T08:00:00Z');

    for (const [codigo, itemDemanda] of demandaBrutaConsolidada.entries()) {
      const infoEstoque = estoquesSaldos[codigo] || {
        estoqueFisico: 0,
        materialBloqueadoQuarentena: 0,
        reservasAtivas: 0,
        comprasEmTransito: 0,
        producaoEmProcesso: 0,
        estoqueSeguranca: 0,
        leadTimeDias: 7,
        loteMinimo: 1,
        multiplo: 1,
        fornecedor: { nome: 'Fornecedor Padrão', cnpj: '00.000.000/0001-00', preco: 100.0 },
        ehFabricadoInterno: false,
      };

      // FÓRMULA DETERMINÍSTICA DO MRP:
      // Estoque Disponível Real = Estoque Físico - Material Bloqueado (Quarentena) - Reservas Ativas
      const estoqueDisponivelReal = Math.max(
        0,
        infoEstoque.estoqueFisico - infoEstoque.materialBloqueadoQuarentena - infoEstoque.reservasAtivas
      );

      // Necessidade Líquida = (Demanda Bruta + Estoque de Segurança) - (Estoque Disponível Real + Compras em Trânsito + Produção em Processo)
      const saldoFuturoTotal = estoqueDisponivelReal + infoEstoque.comprasEmTransito + infoEstoque.producaoEmProcesso;
      const necessidadeLiquidaCalculada = Math.max(
        0,
        itemDemanda.quantidadeTotal + infoEstoque.estoqueSeguranca - saldoFuturoTotal
      );

      // Cálculo Regressivo de Lead Time (Backward Scheduling)
      const dataNecessidadeDate = new Date(itemDemanda.dataNecessidadeMaisProxima);
      const dataDisparoRecomendadaDate = new Date(
        dataNecessidadeDate.getTime() - infoEstoque.leadTimeDias * 86400000
      );

      let categoriaAcao: 'COMPRA' | 'PRODUCAO' | 'COBERTO_ESTOQUE' | 'COBERTO_PEDIDOS_ABERTOS' = 'COBERTO_ESTOQUE';

      if (necessidadeLiquidaCalculada > 0) {
        categoriaAcao = infoEstoque.ehFabricadoInterno ? 'PRODUCAO' : 'COMPRA';
      } else if (infoEstoque.comprasEmTransito > 0 || infoEstoque.producaoEmProcesso > 0) {
        categoriaAcao = 'COBERTO_PEDIDOS_ABERTOS';
      }

      const itemNecessidade: NecessidadeLiquidaItem = {
        id: `nec-${codigo}`,
        codigoItem: codigo,
        descricaoItem: itemDemanda.descricaoItem,
        tipoItem: itemDemanda.tipoItem,
        unidadeMedida: itemDemanda.unidadeMedida,
        demandaBruta: Number(itemDemanda.quantidadeTotal.toFixed(2)),
        demandaBrutaTotal: Number(itemDemanda.quantidadeTotal.toFixed(2)),
        estoqueFisicoTotal: infoEstoque.estoqueFisico,
        materialBloqueado: infoEstoque.materialBloqueadoQuarentena,
        reservasAtivas: infoEstoque.reservasAtivas,
        estoqueDisponivelReal: Number(estoqueDisponivelReal.toFixed(2)),
        comprasEmTransito: infoEstoque.comprasEmTransito,
        producaoEmProcesso: infoEstoque.producaoEmProcesso,
        estoqueSegurancaConfigurado: infoEstoque.estoqueSeguranca,
        necessidadeLiquidaCalculada: Number(necessidadeLiquidaCalculada.toFixed(2)),
        leadTimeDias: infoEstoque.leadTimeDias,
        loteMinimo: infoEstoque.loteMinimo,
        multiploLote: infoEstoque.multiplo,
        dataNecessidade: itemDemanda.dataNecessidadeMaisProxima,
        dataDisparoRecomendada: dataDisparoRecomendadaDate.toISOString(),
        categoriaAcao,
        origemRastreavel: {
          pedidoVendaId: itemDemanda.origens[0]?.documentoId,
          pedidoNumero: itemDemanda.origens[0]?.documentoNumero,
          clienteNome: itemDemanda.origens[0]?.clienteNome,
          nivelBOM: itemDemanda.origens[0]?.nivelEstrutura || 0,
        },
      };

      necessidadesLiquidas.push(itemNecessidade);

      // Dimensionamento de Lotes (Lote Mínimo e Múltiplos)
      if (necessidadeLiquidaCalculada > 0) {
        let quantidadeComLote = Math.max(necessidadeLiquidaCalculada, infoEstoque.loteMinimo);
        if (infoEstoque.multiplo > 1) {
          quantidadeComLote = Math.ceil(quantidadeComLote / infoEstoque.multiplo) * infoEstoque.multiplo;
        }

        // GERAR SUGESTÃO DE COMPRA (SE NÃO FOR FABRICADO INTERNO)
        if (!infoEstoque.ehFabricadoInterno) {
          const compraSugerida: SugestaoCompraMRP = {
            id: `sc-sug-${codigo}`,
            codigoItem: codigo,
            descricaoItem: itemDemanda.descricaoItem,
            unidadeMedida: itemDemanda.unidadeMedida,
            quantidadeCalculada: Number(necessidadeLiquidaCalculada.toFixed(2)),
            quantidadeSugeridaComLote: Number(quantidadeComLote.toFixed(2)),
            loteMinimo: infoEstoque.loteMinimo,
            multiploCompra: infoEstoque.multiplo,
            fornecedorPreferencialNome: infoEstoque.fornecedor.nome,
            fornecedorPreferencialCnpj: infoEstoque.fornecedor.cnpj,
            precoUnitarioEstimado: infoEstoque.fornecedor.preco,
            valorTotalEstimado: Number((quantidadeComLote * infoEstoque.fornecedor.preco).toFixed(2)),
            leadTimeFornecedorDias: infoEstoque.leadTimeDias,
            dataNecessidadeProducao: itemDemanda.dataNecessidadeMaisProxima,
            dataDisparoPedidoCompra: dataDisparoRecomendadaDate.toISOString(),
            pedidoCompraExistenteCobriu: false,
            numeroPedidoCompraExistente: infoEstoque.pedidosCompraExistentesNumero,
            origemRastreavel: {
              pedidoVendaId: itemDemanda.origens[0]?.documentoId,
              pedidoNumero: itemDemanda.origens[0]?.documentoNumero,
              clienteNome: itemDemanda.origens[0]?.clienteNome,
              nivelBOM: itemDemanda.origens[0]?.nivelEstrutura || 0,
              motivo: `Necessidade líquida apurada de ${necessidadeLiquidaCalculada} ${itemDemanda.unidadeMedida} originada de ${itemDemanda.origens[0]?.documentoNumero || 'Carteira'}.`,
            },
            status: 'PENDENTE',
          };
          sugestoesCompra.push(compraSugerida);

          // VERIFICAÇÃO DE RISCO DE LEAD TIME ESTOURADO
          if (dataDisparoRecomendadaDate < hoje) {
            const diasAtraso = Math.ceil((hoje.getTime() - dataDisparoRecomendadaDate.getTime()) / 86400000);
            riscosAtraso.push({
              id: `rsk-lead-${codigo}`,
              tipoRisco: 'LEAD_TIME_COMPRA_EXCEDIDO',
              nivelSeveridade: diasAtraso > 5 ? 'CRITICO' : 'ALTO',
              codigoItem: codigo,
              descricaoItem: itemDemanda.descricaoItem,
              pedidoRelacionado: itemDemanda.origens[0]?.documentoNumero,
              clienteNome: itemDemanda.origens[0]?.clienteNome,
              dataPrometida: itemDemanda.dataNecessidadeMaisProxima,
              dataPrevisaoCalculada: new Date(hoje.getTime() + infoEstoque.leadTimeDias * 86400000).toISOString(),
              diasAtrasoEstimados: diasAtraso,
              mensagem: `Data ideal de disparo da compra (${dataDisparoRecomendadaDate.toLocaleDateString('pt-BR')}) já foi ultrapassada pelo lead time de ${infoEstoque.leadTimeDias} dias do fornecedor ${infoEstoque.fornecedor.nome}.`,
              impactoDescricao: `Atraso na liberação da montagem final do pedido ${itemDemanda.origens[0]?.documentoNumero || ''}.`,
              acaoRecomendada: `Aprovar Solicitação de Compra emergencial hoje e negociar frete expresso (dedicado) com o fornecedor.`,
            });
          }
        } else {
          // GERAR SUGESTÃO DE PRODUÇÃO (PRODUTO ACABADO OU SUBCONJUNTO)
          const opSugerida: SugestaoProducaoMRP = {
            id: `op-sug-${codigo}`,
            codigoItem: codigo,
            descricaoItem: itemDemanda.descricaoItem,
            unidadeMedida: itemDemanda.unidadeMedida,
            quantidadeCalculada: Number(necessidadeLiquidaCalculada.toFixed(2)),
            quantidadeSugeridaComLote: Number(quantidadeComLote.toFixed(2)),
            loteMinimoFabricacao: infoEstoque.loteMinimo,
            multiploFabricacao: infoEstoque.multiplo,
            leadTimeFabricacaoDias: infoEstoque.leadTimeDias,
            dataNecessidadeEntrega: itemDemanda.dataNecessidadeMaisProxima,
            dataInicioProgramacao: dataDisparoRecomendadaDate.toISOString(),
            prioridadeSugerida: itemDemanda.origens[0]?.prioridade || 'ALTA',
            roteiroPadraoId: `rot-${codigo}`,
            setorPrincipal: codigo.includes('SILO') ? 'CALDEIRARIA_SOLDA' : 'USINAGEM',
            origemRastreavel: {
              pedidoVendaId: itemDemanda.origens[0]?.documentoId,
              pedidoNumero: itemDemanda.origens[0]?.documentoNumero,
              clienteNome: itemDemanda.origens[0]?.clienteNome,
              motivo: `Necessidade líquida de ${necessidadeLiquidaCalculada} ${itemDemanda.unidadeMedida} para atender pedido ${itemDemanda.origens[0]?.documentoNumero}.`,
            },
            status: 'PENDENTE',
          };
          sugestoesProducao.push(opSugerida);
        }
      }

      // IDENTIFICAÇÃO DE RISCO: MATERIAL BLOQUEADO EM QUARENTENA
      if (infoEstoque.materialBloqueadoQuarentena > 0) {
        riscosAtraso.push({
          id: `rsk-blq-${codigo}`,
          tipoRisco: 'MATERIAL_BLOQUEADO_QUARENTENA',
          nivelSeveridade: 'ALTO',
          codigoItem: codigo,
          descricaoItem: itemDemanda.descricaoItem,
          dataPrometida: itemDemanda.dataNecessidadeMaisProxima,
          dataPrevisaoCalculada: 'Pendente inspeção de qualidade',
          diasAtrasoEstimados: 3,
          mensagem: `Existem ${infoEstoque.materialBloqueadoQuarentena} ${itemDemanda.unidadeMedida} retidos no almoxarifado sob quarentena/laudo não-conforme.`,
          impactoDescricao: `Estoque físico não pôde ser alocado para a OP-2026-001, gerando déficit de matéria-prima.`,
          acaoRecomendada: `Acionar Engenharia da Qualidade para laudo técnico emergencial ou devolução ao fornecedor com reposição imediata.`,
        });
      }
    }

    // 5. APURAÇÃO DE CAPACIDADE POR SETOR E GARGALOS
    const setoresNomes: Record<SetorPcp, string> = {
      CORTE_DOBRA: 'Corte a Laser e Dobra CNC',
      USINAGEM: 'Usinagem CNC de Alta Precisão',
      CALDEIRARIA_SOLDA: 'Caldeiraria Pesada e Soldagem Robotizada',
      MONTAGEM: 'Montagem Mecânica e Acoplamento Hidráulico',
      PINTURA: 'Pintura Eletrostática e Acabamento',
      INSPECAO_QUALIDADE: 'Controle de Qualidade e Metrologia CMM',
    };

    const setoresMap: Map<SetorPcp, SetorCapacidade> = new Map();
    const setoresLista: SetorPcp[] = [
      'CORTE_DOBRA',
      'USINAGEM',
      'CALDEIRARIA_SOLDA',
      'MONTAGEM',
      'PINTURA',
      'INSPECAO_QUALIDADE',
    ];

    for (const s of setoresLista) {
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
      if (maq.empresaId !== empresaId) continue;
      const set = setoresMap.get(maq.setor);
      if (set) {
        set.quantidadeMaquinas += 1;
        set.quantidadeOperadores += maq.operadoresDisponiveis;
        set.capacidadeTotalHorasDia += maq.capacidadeHorasDiaLiquida;
        set.cargaAlocadaHoras += maq.cargaProgramadaHoras;
        set.cargaAlocadaHorasDia = set.cargaAlocadaHoras;
      }

      // IDENTIFICAÇÃO DE RISCOS DE GARGALO EM MÁQUINAS
      if (maq.taxaOcupacaoPercentual > 100) {
        riscosAtraso.push({
          id: `rsk-maq-${maq.id}`,
          tipoRisco: 'SOBRECARGA_MAQUINA',
          nivelSeveridade: maq.taxaOcupacaoPercentual > 110 ? 'CRITICO' : 'ALTO',
          codigoItem: maq.codigo,
          descricaoItem: maq.nome,
          dataPrometida: '2026-03-05T17:00:00Z',
          dataPrevisaoCalculada: 'Sobrecarga de capacidade finita',
          diasAtrasoEstimados: 2,
          mensagem: `Centro de trabalho ${maq.nome} com taxa de ocupação de ${maq.taxaOcupacaoPercentual}% (${maq.cargaProgramadaHoras}h alocadas vs ${maq.capacidadeHorasDiaLiquida}h líquidas/dia).`,
          impactoDescricao: `Fila de espera para operações sequenciais de corte e usinagem.`,
          acaoRecomendada: `Autorizar turno extraordinário (horas extras) ou terceirizar lote parcial de corte com parceiro homologado.`,
          setorAfetado: maq.setor,
          maquinaAfetada: maq.nome,
        });
      }

      // IDENTIFICAÇÃO DE RISCO: FALTA DE OPERADORES
      if (maq.operadoresDisponiveis < maq.operadoresNecessarios) {
        riscosAtraso.push({
          id: `rsk-op-${maq.id}`,
          tipoRisco: 'FALTA_OPERADORES',
          nivelSeveridade: 'ALTO',
          codigoItem: maq.codigo,
          descricaoItem: maq.nome,
          dataPrometida: 'Imediato',
          dataPrevisaoCalculada: 'Déficit de mão-de-obra',
          diasAtrasoEstimados: 3,
          mensagem: `Máquina ${maq.nome} operando com ${maq.operadoresDisponiveis} operador(es), mas exige ${maq.operadoresNecessarios} operadores para plena capacidade.`,
          impactoDescricao: `Queda de rendimento e formação de gargalo no setor de ${setoresNomes[maq.setor]}.`,
          acaoRecomendada: `Remanejar operador qualificado do setor de montagem ou convocar folguista.`,
          setorAfetado: maq.setor,
        });
      }
    }

    for (const set of setoresMap.values()) {
      if (set.capacidadeTotalHorasDia > 0) {
        set.taxaOcupacaoPercentual = Number(
          ((set.cargaAlocadaHoras / set.capacidadeTotalHorasDia) * 100).toFixed(1)
        );
        if (set.taxaOcupacaoPercentual >= 100) {
          set.status = 'GARGALO';
        } else if (set.taxaOcupacaoPercentual >= 85) {
          set.status = 'ATENCAO';
        } else {
          set.status = 'NORMAL';
        }
      }
    }

    // 6. GERAÇÃO DO CRONOGRAMA GANTT DETERMINÍSTICO INICIAL
    const gantt: GanttItem[] = [];
    for (const op of this.ordensProducao) {
      if (op.empresaId !== empresaId) continue;
      for (const oper of op.operacoes) {
        gantt.push({
          id: oper.id,
          opId: op.id,
          opNumero: op.numero,
          operacaoNome: oper.operacaoNome,
          itemCodigo: op.codigoItem,
          itemDescricao: op.descricaoItem,
          setor: oper.setor,
          maquinaId: oper.maquinaId,
          maquinaNome: oper.maquinaNome,
          dataInicio: oper.dataInicioPrevista,
          dataFim: oper.dataFimPrevista,
          duracaoHoras: oper.tempoTotalEstimadoHoras,
          progressoPercentual: oper.status === 'CONCLUIDA' ? 100 : oper.status === 'EM_PROCESSO' ? 45 : 0,
          prioridade: oper.prioridade,
          status: oper.status,
          dependencias: oper.sequenciaOperacao > 10 ? [`op-${op.numero}-seq-${oper.sequenciaOperacao - 10}`] : [],
        });
      }
    }

    const resultado: ResultadoCalculoMRP = {
      dataExecucao: new Date().toISOString(),
      tempoProcessamentoMs: Date.now() - inicioMs,
      demandasBrutas: Array.from(demandaBrutaConsolidada.values()),
      necessidadesLiquidas,
      sugestoesCompra,
      sugestoesProducao,
      riscosAtraso,
      capacidadeMaquinas: this.maquinas.filter((m) => m.empresaId === empresaId),
      capacidadeSetores: Array.from(setoresMap.values()),
      gantt,
      ganttInicial: gantt,
      totalDemandaAnalisada: demandaBrutaConsolidada.size,
      totalComprasSugeridas: sugestoesCompra.length,
      totalOpsSugeridas: sugestoesProducao.length,
      totalRiscosIdentificados: riscosAtraso.length,
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

    this.sugestoesCompra = sugestoesCompra;
    this.sugestoesProducao = sugestoesProducao;
    this.ultimoResultadoMrp.set(empresaId, resultado);

    return resultado;
  }

  // =========================================================================
  // SEQUENCIAMENTO DE FILA DE PRODUÇÃO COM ALGORITMOS INDUSTRIAIS
  // =========================================================================
  public sequenciarFilaProducao(
    empresaId: string,
    maquinaId: string,
    algoritmo: AlgoritmoOrdenacaoFila = 'CRITICAL_RATIO'
  ): OperacaoProducaoOP[] {
    const opsEmpresa = this.obterOrdensProducao(empresaId);
    const todasOperacoes: OperacaoProducaoOP[] = [];

    for (const op of opsEmpresa) {
      for (const opItem of op.operacoes) {
        if (opItem.maquinaId === maquinaId && opItem.status !== 'CONCLUIDA') {
          todasOperacoes.push({ ...opItem });
        }
      }
    }

    const agora = new Date('2026-02-22T08:00:00Z').getTime();

    // Recalcular Critical Ratio (CR = Tempo até entrega prometida / Tempo total estimado restante)
    for (const op of todasOperacoes) {
      const dataEntrega = new Date(op.dataEntregaPrometida).getTime();
      const diasRestantes = Math.max(0.5, (dataEntrega - agora) / 86400000);
      const horasRestantes = diasRestantes * 8; // base 8h dia
      op.criticalRatio = Number((horasRestantes / Math.max(1, op.tempoTotalEstimadoHoras)).toFixed(2));
    }

    // Ordenação conforme o algoritmo selecionado
    let resultadoOrdenado = [...todasOperacoes];

    switch (algoritmo) {
      case 'CRITICAL_RATIO':
        // Menor CR tem maior urgência (CR < 1.0 significa que já está atrasado ou em risco crítico)
        resultadoOrdenado.sort((a, b) => a.criticalRatio - b.criticalRatio);
        break;

      case 'EDD':
        // Earliest Due Date (Data de Entrega Prometida Mais Cedo)
        resultadoOrdenado.sort(
          (a, b) => new Date(a.dataEntregaPrometida).getTime() - new Date(b.dataEntregaPrometida).getTime()
        );
        break;

      case 'SPT':
        // Shortest Processing Time (Menor Tempo de Processamento)
        resultadoOrdenado.sort((a, b) => a.tempoTotalEstimadoHoras - b.tempoTotalEstimadoHoras);
        break;

      case 'PRIORIDADE_MANUAL': {
        const pesoPrioridade: Record<PrioridadeProducao, number> = {
          URGENTE: 4,
          ALTA: 3,
          MEDIA: 2,
          BAIXA: 1,
        };
        resultadoOrdenado.sort((a, b) => pesoPrioridade[b.prioridade] - pesoPrioridade[a.prioridade]);
        break;
      }

      case 'FIFO':
      default:
        // Ordem cronológica da sequência e data de criação
        resultadoOrdenado.sort((a, b) => a.sequenciaOperacao - b.sequenciaOperacao);
        break;
    }

    // Atribuir posição sequencial na fila
    resultadoOrdenado = resultadoOrdenado.map((op, idx) => ({
      ...op,
      posicaoFila: idx + 1,
    }));

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
  public converterSugestaoCompra(sugestaoId: string): {
    sucesso: boolean;
    solicitacaoCompraNumero: string;
    mensagem: string;
  } {
    const sug = this.sugestoesCompra.find((s) => s.id === sugestaoId);
    if (!sug) {
      return { sucesso: false, solicitacaoCompraNumero: '', mensagem: 'Sugestão de compra não encontrada.' };
    }

    sug.status = 'CONVERTIDA_EM_SC';
    const numeroSc = `SC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      sucesso: true,
      solicitacaoCompraNumero: numeroSc,
      mensagem: `Solicitação de compra ${numeroSc} gerada com sucesso para o fornecedor ${sug.fornecedorPreferencialNome}.`,
    };
  }

  public converterSugestaoProducao(sugestaoId: string): {
    sucesso: boolean;
    ordemProducaoNumero: string;
    mensagem: string;
  } {
    const sug = this.sugestoesProducao.find((s) => s.id === sugestaoId);
    if (!sug) {
      return { sucesso: false, ordemProducaoNumero: '', mensagem: 'Sugestão de produção não encontrada.' };
    }

    sug.status = 'CONVERTIDA_EM_OP';
    const numeroOp = `OP-${new Date().getFullYear()}-${String(this.ordensProducao.length + 1).padStart(3, '0')}`;

    const novaOp = this.criarOrdemProducao({
      numero: numeroOp,
      codigoItem: sug.codigoItem,
      descricaoItem: sug.descricaoItem,
      tipoItem: 'PRODUTO_FABRICADO',
      quantidadePlanejada: sug.quantidadeSugeridaComLote,
      prioridade: sug.prioridadeSugerida,
      status: 'PLANEJADA',
      dataInicioPrevista: sug.dataInicioProgramacao,
      dataEntregaPrometida: sug.dataNecessidadeEntrega,
      origemRastreabilidade: {
        tipoOrigem: 'SUGESTAO_MRP',
        motivo: sug.origemRastreavel.motivo,
      },
    });

    return {
      sucesso: true,
      ordemProducaoNumero: novaOp.numero,
      mensagem: `Ordem de Produção ${novaOp.numero} criada e liberada no plano mestre.`,
    };
  }
}

// Pattern Singleton
let _pcpServiceInstance: PcpService | null = null;

export function getPcpService(): PcpService {
  if (!_pcpServiceInstance) {
    _pcpServiceInstance = new PcpService();
  }
  return _pcpServiceInstance;
}

export const pcpService = getPcpService();
