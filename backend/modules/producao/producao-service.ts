// backend/modules/producao/producao-service.ts

import {
  OrdemProducaoCompleta,
  OpMaterial,
  OpOperacao,
  ApontamentoProducao,
  ParadaProducao,
  RefugoProducao,
  RetrabalhoProducao,
  JustificativaEncerramentoOP,
  OperadorProducao,
  MaquinaCentroTrabalho,
  TipoOrdemProducao,
  PrioridadeProducao,
  MotivoParadaCategoria,
  MotivoRefugoCategoria,
  MotivoRetrabalhoCategoria,
  ExtensaoCorteLaser,
  ExtensaoDobraCNC,
  ExtensaoSoldaCaldeiraria,
  ExtensaoPinturaAcabamento,
  ExtensaoMontagem,
  ExtensaoAcabamento,
  ExtensaoServicoExterno,
} from './producao-types';

class ProducaoService {
  private ordens: OrdemProducaoCompleta[] = [];
  private apontamentos: ApontamentoProducao[] = [];
  private paradas: ParadaProducao[] = [];
  private refugos: RefugoProducao[] = [];
  private retrabalhos: RetrabalhoProducao[] = [];
  private operadores: OperadorProducao[] = [];
  private maquinas: MaquinaCentroTrabalho[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const EMPRESA_PADRAO = 'emp-01';

    // 1. Operadores de Chão de Fábrica
    this.operadores = [
      {
        id: 'op-01',
        nome: 'Carlos Eduardo Silva',
        matricula: 'OP-1042',
        setor: 'CORTE_LASER',
        especialidade: 'Operador Especialista CNC Laser Fibra',
        custoHora: 42.5,
        status: 'EM_OPERACAO',
        opAtualNumero: 'OP-2026-001',
      },
      {
        id: 'op-02',
        nome: 'Marcos Vinícius Santos',
        matricula: 'OP-1088',
        setor: 'DOBRA_CNC',
        especialidade: 'Puncionador e Dobrador CNC Sênior',
        custoHora: 45.0,
        status: 'DISPONIVEL',
      },
      {
        id: 'op-03',
        nome: 'Roberto Alves de Oliveira',
        matricula: 'OP-0943',
        setor: 'CALDEIRARIA_SOLDA',
        especialidade: 'Caldeireiro Soldador Qualificado ASME IX (MIG/TIG)',
        custoHora: 52.0,
        status: 'EM_OPERACAO',
        opAtualNumero: 'OP-2026-002',
      },
      {
        id: 'op-04',
        nome: 'Eduardo Ribeiro Lima',
        matricula: 'OP-1120',
        setor: 'USINAGEM',
        especialidade: 'Torneiro e Fresador CNC 5 Eixos',
        custoHora: 55.0,
        status: 'DISPONIVEL',
      },
      {
        id: 'op-05',
        nome: 'Valmir de Souza Costa',
        matricula: 'OP-0877',
        setor: 'MONTAGEM',
        especialidade: 'Mecânico Montador de Equipamentos Pesados',
        custoHora: 44.0,
        status: 'DISPONIVEL',
      },
      {
        id: 'op-06',
        nome: 'Juliana Mendes Nogueira',
        matricula: 'CQ-0310',
        setor: 'INSPECAO',
        especialidade: 'Inspetora de Qualidade NDT / Tridimensional',
        custoHora: 58.0,
        status: 'DISPONIVEL',
      },
    ];

    // 2. Máquinas e Centros de Trabalho
    this.maquinas = [
      {
        id: 'maq-laser-01',
        codigo: 'LASER-01',
        nome: 'Corte a Laser Fibra Óptica 4kW - Trumpf TruLaser 3030',
        setor: 'CORTE_LASER',
        custoHora: 185.0,
        status: 'EM_PRODUCAO',
        opAtualNumero: 'OP-2026-001',
        operacaoAtualNome: 'Corte a Laser das Longarinas e Travessas',
        oeeAtualPercentual: 88.5,
      },
      {
        id: 'maq-dobra-01',
        codigo: 'DOBRA-01',
        nome: 'Prensa Dobradeira CNC 220t - Bystronic Xpert Pro',
        setor: 'DOBRA_CNC',
        custoHora: 140.0,
        status: 'DISPONIVEL',
        oeeAtualPercentual: 84.2,
      },
      {
        id: 'maq-solda-01',
        codigo: 'SOLDA-01',
        nome: 'Célula Robotizada de Solda MIG/MAG - Fronius TPS/i',
        setor: 'CALDEIRARIA_SOLDA',
        custoHora: 125.0,
        status: 'EM_PRODUCAO',
        opAtualNumero: 'OP-2026-002',
        operacaoAtualNome: 'Soldagem das Virolas e Costuras Longitudinais',
        oeeAtualPercentual: 91.0,
      },
      {
        id: 'maq-cnc-01',
        codigo: 'USINAGEM-01',
        nome: 'Centro de Usinagem Vertical 4 Eixos - Romi D800',
        setor: 'USINAGEM',
        custoHora: 165.0,
        status: 'DISPONIVEL',
        oeeAtualPercentual: 82.0,
      },
      {
        id: 'maq-pintura-01',
        codigo: 'PINTURA-01',
        nome: 'Cabine de Pintura Eletrostática a Pó e Estufa Contínua',
        setor: 'PINTURA',
        custoHora: 110.0,
        status: 'DISPONIVEL',
        oeeAtualPercentual: 79.5,
      },
      {
        id: 'maq-montagem-01',
        codigo: 'MONTAGEM-01',
        nome: 'Bancada e Linha de Montagem Mecânica Pesada',
        setor: 'MONTAGEM',
        custoHora: 95.0,
        status: 'DISPONIVEL',
        oeeAtualPercentual: 86.0,
      },
    ];

    // 3. Ordem de Produção 01: OP-2026-001 (Em andamento - Chassi Rodoviário 8x4)
    const op1: OrdemProducaoCompleta = {
      id: 'op-2026-001',
      numero: 'OP-2026-001',
      empresaId: EMPRESA_PADRAO,
      pedidoId: 'ped-2026-8801',
      pedidoNumero: 'PED-2026-8801',
      clienteNome: 'Metálica Andrade & Filhos Engenharia Ltda',
      produtoId: 'prod-chassi-01',
      produtoCodigo: 'CHAS-8X4-HD',
      produtoDescricao: 'Chassi Estrutural Reforçado 8x4 em Aço SAC-350 / Domex 700',
      unidadeMedida: 'UN',
      projetoId: 'prj-001',
      projetoCodigo: 'PRJ-2026-CHAS-01',
      projetoTitulo: 'Chassi Rodoviário Estruturado 8x4 Heavy Duty',
      revisaoId: 'rev-001',
      revisaoVersao: 'Rev 01',
      bomId: 'bom-001',
      bomCodigo: 'BOM-CHAS-8X4-R01',
      bomVersao: 'Rev 01',
      roteiroId: 'rot-001',
      roteiroCodigo: 'ROT-CHAS-8X4-R01',
      roteiroVersao: 'Rev 01',
      quantidadePlanejada: 10,
      quantidadeProduzida: 0,
      quantidadeRefugada: 0,
      quantidadeEmProcesso: 10,
      saldoRestante: 10,
      dataEmissao: '2026-08-10',
      prazoEntrega: '2026-09-05',
      dataInicioProgramada: '2026-08-12',
      dataFimProgramada: '2026-09-03',
      dataInicioReal: '2026-08-12 07:30:00',
      prioridade: 'ALTA',
      tipoOP: 'TOTAL',
      status: 'EM_PRODUCAO',
      custoPlanejado: {
        materiais: 18450.0,
        maoDeObra: 6800.0,
        maquina: 8200.0,
        total: 33450.0,
      },
      custoReal: {
        materiais: 11200.0,
        maoDeObra: 2840.0,
        maquina: 3700.0,
        retrabalhos: 0.0,
        perdasRefugos: 0.0,
        total: 17740.0,
      },
      materiais: [
        {
          id: 'opmat-01',
          opId: 'op-2026-001',
          itemCodigo: 'MP-SAC350-01',
          itemDescricao: 'Chapa Aço SAC-350 #6.35mm x 1500 x 6000mm',
          tipoItem: 'MATERIA_PRIMA',
          unidadeMedida: 'CHAPA',
          quantidadePorUnidade: 2,
          percentualPerdaPrevisto: 7.5,
          quantidadePrevistaTotal: 22,
          quantidadeRealConsumida: 14,
          saldoRestanteConsumo: 8,
          custoUnitario: 850.0,
          custoTotalPrevisto: 18700.0,
          custoTotalReal: 11900.0,
          loteMateriaPrima: 'LOT-SAC350-USIMINAS-8812',
          certificadoUsina: 'CERT-USI-2026-09412',
          statusConsumo: 'CONSUMO_PARCIAL',
        },
        {
          id: 'opmat-02',
          opId: 'op-2026-001',
          itemCodigo: 'FIX-M16-88',
          itemDescricao: 'Parafuso Sextavado Flangeado M16x50 Classe 8.8',
          tipoItem: 'FIXACAO',
          unidadeMedida: 'UN',
          quantidadePorUnidade: 24,
          percentualPerdaPrevisto: 2.0,
          quantidadePrevistaTotal: 245,
          quantidadeRealConsumida: 0,
          saldoRestanteConsumo: 245,
          custoUnitario: 4.5,
          custoTotalPrevisto: 1102.5,
          custoTotalReal: 0,
          statusConsumo: 'PENDENTE',
        },
      ],
      operacoes: [
        {
          id: 'op-oper-01',
          opId: 'op-2026-001',
          sequencia: 10,
          nomeOperacao: 'Corte a Laser das Longarinas e Travessas',
          setor: 'CORTE_LASER',
          maquinaId: 'maq-laser-01',
          maquinaNome: 'Corte a Laser Fibra 4kW Trumpf',
          ferramenta: 'Bico 2.0mm / Gás O2 Puro',
          operadorDesignado: 'Carlos Eduardo Silva',
          tempoSetupPadraoMinutos: 45,
          tempoCicloPadraoMinutos: 35,
          tempoTotalPadraoMinutos: 395,
          custoHoraMaquina: 185.0,
          custoHoraMaoDeObra: 42.5,
          quantidadeTotalPrevista: 10,
          quantidadeDisponivelEntrada: 10,
          quantidadeProduzidaBoas: 6, // 6 já concluídas e repassadas para dobra
          quantidadeRefugada: 0,
          quantidadeEmRetrabalho: 0,
          saldoOperacaoRestante: 4, // faltam 4
          tempoSetupRealMinutos: 40,
          tempoExecucaoRealMinutos: 210,
          tempoParadasMinutos: 15,
          tempoTotalRealMinutos: 265,
          custoMaoDeObraReal: 187.7,
          custoMaquinaReal: 817.0,
          custoConsumiveisReal: 87.84,
          custoTotalOperacaoReal: 1092.54,
          status: 'EM_PRODUCAO',
          exigeInspecaoQualidade: true,
          dataInicioReal: '2026-08-12 08:00:00',
          extensaoCorte: {
            tipoProcessoCorte: 'LASER_FIBRA',
            material: 'Aço SAC-350 / Domex 700 Alta Resistência',
            espessuraMm: 6.35,
            chapaDescricao: 'Chapa Aço SAC-350 #6.35mm x 1500 x 6000mm',
            formatoChapaLarguraMm: 1500,
            formatoChapaComprimentoMm: 6000,
            formatoChapaAreaM2: 9.0,
            loteChapa: 'LOT-SAC350-USIMINAS-8812',
            programaCncCodigo: 'PRG-CHAS-LONG-6MM-V02.cnc',
            programaCncVersao: 'Rev 02',
            nestingAproveitamentoPercentual: 89.4,
            quantidadePecasPorChapa: 1,
            totalChapasNecessarias: 10,
            totalChapasConsumidasReal: 14,
            tempoPrevistoMinutosTotal: 395,
            tempoPrevistoMinutosPorPeca: 35,
            tempoRealMinutosTotal: 250,
            tempoRealMinutosPorPeca: 35,
            tempoSetupMinutosPrevisto: 45,
            tempoSetupMinutosReal: 40,
            descricaoSetup: 'Troca de bico duplo Ø 2.0 mm, centragem do feixe ótico e limpeza da mesa de apoio',
            quantidadePecasPlanejada: 10,
            quantidadePecasCortadasBoas: 6,
            quantidadePecasRefugadas: 0,
            pesoLiquidoPecaUnitariaKg: 382.4,
            pesoLiquidoTotalPecasKg: 2294.4,
            pesoBrutoChapaUnitariaKg: 448.5,
            pesoBrutoTotalChapasKg: 6279.0,
            temRetalhoAproveitavel: true,
            retalhoDescricao: 'Retalho útil aproveitável 1100 x 4800 mm (#6.35mm)',
            retalhoDimensoes: '1100 x 4800 mm',
            retalhoPesoKg: 263.1,
            retalhoCodigoEstoque: 'RET-SAC350-6MM-001',
            retalhoValorizadoCredito: 1447.05,
            pesoSucataTotalKg: 672.4,
            tipoSucata: 'ESQUELETO_LASER',
            custoSucataPerdida: 369.82,
            gasTipo: 'OXIGENIO_O2',
            gasPressaoBar: 0.8,
            gasConsumoEstimadoM3: 18.5,
            gasConsumoRealM3: 12.2,
            bicoNozzleModelo: 'Duplo cromado Ø 2.0 mm',
            lenteFocalOuVidroProtecao: 'Vidro Óptico TruLaser 3030',
            custoGasConsumiveisTotal: 87.84,
          },
        },
        {
          id: 'op-oper-02',
          opId: 'op-2026-001',
          sequencia: 20,
          nomeOperacao: 'Dobra CNC das Abas Estruturais',
          setor: 'DOBRA_CNC',
          maquinaId: 'maq-dobra-01',
          maquinaNome: 'Prensa Dobradeira CNC 220t Bystronic',
          ferramenta: 'Matriz V80 + Punção R3.0',
          operadorDesignado: 'Marcos Vinícius Santos',
          tempoSetupPadraoMinutos: 60,
          tempoCicloPadraoMinutos: 40,
          tempoTotalPadraoMinutos: 460,
          custoHoraMaquina: 140.0,
          custoHoraMaoDeObra: 45.0,
          quantidadeTotalPrevista: 10,
          quantidadeDisponivelEntrada: 6, // liberado pelo corte
          quantidadeProduzidaBoas: 0,
          quantidadeRefugada: 0,
          quantidadeEmRetrabalho: 0,
          saldoOperacaoRestante: 6,
          tempoSetupRealMinutos: 0,
          tempoExecucaoRealMinutos: 0,
          tempoParadasMinutos: 0,
          tempoTotalRealMinutos: 0,
          custoMaoDeObraReal: 0,
          custoMaquinaReal: 0,
          custoTotalOperacaoReal: 0,
          status: 'PRONTA_PARA_INICIO',
          exigeInspecaoQualidade: true,
          extensaoDobra: {
            maquinaNome: 'Prensa Dobradeira CNC 220t Bystronic Xpert Pro',
            maquinaCodigo: 'DOBRA-01',
            ferramentaConjunto: 'Conjunto Punção Reto Pesado + Matriz Multi-V V80',
            puncaoModelo: 'Punção Reto R=3.0mm 86° Mod. P-102 Pesado',
            matrizModelo: 'Matriz V=80mm 85° Mod. M-204 com insertos temperados',
            aberturaMatrizV_Mm: 80,
            raioInternoDobraMm: 6.5,
            espessuraMaterialMm: 6.35,
            materialDescricao: 'Aço SAC-350 / Domex 700',
            angulosDescricao: '90° nas abas superiores (passo 1/2) e 90° nas abas inferiores (passo 3/4)',
            compensacaoSpringback: 1.8,
            totalDobrasPorPeca: 4,
            sequenciaPassosDobra: [
              { passoNumero: 1, descricaoDobra: 'Dobra Aba Superior Esquerda 90°', anguloNominalGraus: 90, anguloMedidoRealGraus: 90.1, comprimentoDobraMm: 5800, forcaDobraToneladas: 185, puncaoCodigo: 'P-102-R3', matrizCodigo: 'M-204-V80', aberturaMatrizV_Mm: 80, compensacaoSpringbackGraus: 1.8, statusPasso: 'PENDENTE' },
              { passoNumero: 2, descricaoDobra: 'Dobra Aba Superior Direita 90°', anguloNominalGraus: 90, anguloMedidoRealGraus: 89.9, comprimentoDobraMm: 5800, forcaDobraToneladas: 185, puncaoCodigo: 'P-102-R3', matrizCodigo: 'M-204-V80', aberturaMatrizV_Mm: 80, compensacaoSpringbackGraus: 1.8, statusPasso: 'PENDENTE' },
              { passoNumero: 3, descricaoDobra: 'Dobra Aba Inferior Esquerda 90°', anguloNominalGraus: 90, anguloMedidoRealGraus: 90.0, comprimentoDobraMm: 5800, forcaDobraToneladas: 185, puncaoCodigo: 'P-102-R3', matrizCodigo: 'M-204-V80', aberturaMatrizV_Mm: 80, compensacaoSpringbackGraus: 1.8, statusPasso: 'PENDENTE' },
              { passoNumero: 4, descricaoDobra: 'Dobra Aba Inferior Direita 90°', anguloNominalGraus: 90, anguloMedidoRealGraus: 90.0, comprimentoDobraMm: 5800, forcaDobraToneladas: 185, puncaoCodigo: 'P-102-R3', matrizCodigo: 'M-204-V80', aberturaMatrizV_Mm: 80, compensacaoSpringbackGraus: 1.8, statusPasso: 'PENDENTE' },
            ],
            tempoSetupPrevistoMinutos: 60,
            tempoSetupRealMinutos: 0,
            tempoDobraPrevistoPorPecaMinutos: 40,
            tempoDobraRealPorPecaMinutos: 0,
            tempoTotalPrevistoMinutos: 460,
            tempoTotalRealMinutos: 0,
            quantidadePlanejada: 10,
            quantidadeDobradaBoas: 0,
            quantidadeRefugoDobra: 0,
            quantidadeRetrabalhoDobra: 0,
            houveRetrabalhoDobra: false,
            custoRetrabalhoDobra: 0,
          },
        },
        {
          id: 'op-oper-03',
          opId: 'op-2026-001',
          sequencia: 30,
          nomeOperacao: 'Soldagem e Montagem do Chassi no Gabarito',
          setor: 'CALDEIRARIA_SOLDA',
          maquinaId: 'maq-solda-01',
          maquinaNome: 'Célula Robotizada de Solda MIG/MAG Fronius',
          ferramenta: 'Tocha Robótica + Arame ER70S-6 #1.2mm',
          tempoSetupPadraoMinutos: 90,
          tempoCicloPadraoMinutos: 120,
          tempoTotalPadraoMinutos: 1290,
          custoHoraMaquina: 125.0,
          custoHoraMaoDeObra: 52.0,
          quantidadeTotalPrevista: 10,
          quantidadeDisponivelEntrada: 0,
          quantidadeProduzidaBoas: 0,
          quantidadeRefugada: 0,
          quantidadeEmRetrabalho: 0,
          saldoOperacaoRestante: 0,
          tempoSetupRealMinutos: 0,
          tempoExecucaoRealMinutos: 0,
          tempoParadasMinutos: 0,
          tempoTotalRealMinutos: 0,
          custoMaoDeObraReal: 0,
          custoMaquinaReal: 0,
          custoTotalOperacaoReal: 0,
          status: 'AGUARDANDO_ANTERIOR',
          exigeInspecaoQualidade: true,
          extensaoSolda: {
            processo: 'MIG_MAG_GMAW',
            gasProtecao: 'MISTURA_AR_CO2_20',
            gasConsumoLitrosMinuto: 16,
            consumivelArameCodigo: 'AWS ER70S-6 Ø 1.2mm',
            consumivelArameLote: 'LOT-BELGO-ER70S6-4401',
            consumoArameEstimadoKg: 45.0,
            consumoArameRealKg: 0,
            procedimentoEPS_WPS: 'EPS-CHAS-SAC350-MIG-01',
            qualificacaoSoldadorNorma: 'ASME Sec IX / AWS D1.1',
            tipoJunta: 'TOPO_COM_CHANFRO_V',
            inspecaoEnsaioNaoDestrutivo: 'LIQUIDO_PENETRANTE_LP',
            aprovadoQualidadeSolda: true,
            custoConsumiveisSolda: 480.0,
          },
        },
        {
          id: 'op-oper-04',
          opId: 'op-2026-001',
          sequencia: 40,
          nomeOperacao: 'Pintura Eletrostática Epóxi + Estufa',
          setor: 'PINTURA',
          maquinaId: 'maq-pintura-01',
          maquinaNome: 'Cabine de Pintura Eletrostática a Pó',
          ferramenta: 'Pistola Eletrostática + Tinta Epóxi Cinza Chassi',
          tempoSetupPadraoMinutos: 40,
          tempoCicloPadraoMinutos: 25,
          tempoTotalPadraoMinutos: 290,
          custoHoraMaquina: 110.0,
          custoHoraMaoDeObra: 40.0,
          quantidadeTotalPrevista: 10,
          quantidadeDisponivelEntrada: 0,
          quantidadeProduzidaBoas: 0,
          quantidadeRefugada: 0,
          quantidadeEmRetrabalho: 0,
          saldoOperacaoRestante: 0,
          tempoSetupRealMinutos: 0,
          tempoExecucaoRealMinutos: 0,
          tempoParadasMinutos: 0,
          tempoTotalRealMinutos: 0,
          custoMaoDeObraReal: 0,
          custoMaquinaReal: 0,
          custoTotalOperacaoReal: 0,
          status: 'AGUARDANDO_ANTERIOR',
          exigeInspecaoQualidade: true,
          extensaoPintura: {
            tipoPintura: 'ELETROSTATICA_PO',
            corRAL: 'RAL 7016 - Cinza Antracite',
            corDescricao: 'Cinza Antracite Texturizado Alta Durabilidade Industrial',
            tintaCodigo: 'PO-EPOXI-RAL7016',
            espessuraCamadaMicronsPrevista: 100,
            temperaturaEstufaC: 200,
            tempoEstufaMinutos: 25,
            areaTotalPinturaM2: 145.0,
            preTratamentoSuperficie: 'DESENGRAXE_E_FOSFATIZACAO',
            consumoTintaEstimadoKgOuLitros: 32.0,
            consumoTintaRealKgOuLitros: 0,
            custoInsumosPintura: 860.0,
          },
        },
      ],
      criadoPor: 'Eng. Roberto Vasconcelos',
      criadoEm: '2026-08-10 14:00:00',
      atualizadoEm: '2026-08-12 11:30:00',
    };

    // 4. Ordem de Produção 02: OP-2026-002 (Reservatório Cilíndrico com refugo e retrabalho registrado)
    const op2: OrdemProducaoCompleta = {
      id: 'op-2026-002',
      numero: 'OP-2026-002',
      empresaId: EMPRESA_PADRAO,
      pedidoId: 'ped-2026-8805',
      pedidoNumero: 'PED-2026-8805',
      clienteNome: 'Química Industrial Bandeirantes S/A',
      produtoId: 'prod-silo-01',
      produtoCodigo: 'SILO-15M3-INOX',
      produtoDescricao: 'Reservatório Cilíndrico Vertical 15m³ Inox AISI 316L',
      unidadeMedida: 'UN',
      projetoId: 'prj-002',
      projetoCodigo: 'PRJ-2026-SILO-15M3',
      projetoTitulo: 'Reservatório Silo Industrial 15m³ AISI 316L',
      revisaoId: 'rev-002',
      revisaoVersao: 'Rev 00',
      bomId: 'bom-002',
      bomCodigo: 'BOM-SILO-15M3-R00',
      bomVersao: 'Rev 00',
      roteiroId: 'rot-002',
      roteiroCodigo: 'ROT-SILO-15M3-R00',
      roteiroVersao: 'Rev 00',
      quantidadePlanejada: 4,
      quantidadeProduzida: 2,
      quantidadeRefugada: 1,
      quantidadeEmProcesso: 1,
      saldoRestante: 1,
      dataEmissao: '2026-08-01',
      prazoEntrega: '2026-08-30',
      dataInicioProgramada: '2026-08-03',
      dataFimProgramada: '2026-08-28',
      dataInicioReal: '2026-08-03 08:00:00',
      prioridade: 'URGENTE',
      tipoOP: 'TOTAL',
      status: 'EM_PRODUCAO',
      custoPlanejado: {
        materiais: 45600.0,
        maoDeObra: 12400.0,
        maquina: 14200.0,
        total: 72200.0,
      },
      custoReal: {
        materiais: 38200.0,
        maoDeObra: 9800.0,
        maquina: 11400.0,
        retrabalhos: 1250.0,
        perdasRefugos: 4100.0,
        total: 64750.0,
      },
      materiais: [
        {
          id: 'opmat-201',
          opId: 'op-2026-002',
          itemCodigo: 'MP-INOX316L-01',
          itemDescricao: 'Chapa Aço Inox AISI 316L #4.75mm x 1500 x 3000mm',
          tipoItem: 'MATERIA_PRIMA',
          unidadeMedida: 'CHAPA',
          quantidadePorUnidade: 4,
          percentualPerdaPrevisto: 6.0,
          quantidadePrevistaTotal: 17,
          quantidadeRealConsumida: 18,
          saldoRestanteConsumo: 0,
          custoUnitario: 2400.0,
          custoTotalPrevisto: 40800.0,
          custoTotalReal: 43200.0,
          loteMateriaPrima: 'LOT-INOX-APERAM-9901',
          certificadoUsina: 'CERT-APERAM-2026-4411',
          statusConsumo: 'CONSUMO_EXCEDIDO',
        },
      ],
      operacoes: [
        {
          id: 'op-oper-201',
          opId: 'op-2026-002',
          sequencia: 10,
          nomeOperacao: 'Corte e Chanfro das Virolas Inox 316L',
          setor: 'CORTE_LASER',
          maquinaId: 'maq-laser-01',
          maquinaNome: 'Corte a Laser Fibra 4kW Trumpf',
          tempoSetupPadraoMinutos: 60,
          tempoCicloPadraoMinutos: 90,
          tempoTotalPadraoMinutos: 420,
          custoHoraMaquina: 185.0,
          custoHoraMaoDeObra: 42.5,
          quantidadeTotalPrevista: 4,
          quantidadeDisponivelEntrada: 4,
          quantidadeProduzidaBoas: 3,
          quantidadeRefugada: 1, // 1 chapa refugada por erro térmico
          quantidadeEmRetrabalho: 0,
          saldoOperacaoRestante: 0,
          tempoSetupRealMinutos: 65,
          tempoExecucaoRealMinutos: 380,
          tempoParadasMinutos: 20,
          tempoTotalRealMinutos: 465,
          custoMaoDeObraReal: 329.0,
          custoMaquinaReal: 1433.0,
          custoConsumiveisReal: 215.4,
          custoTotalOperacaoReal: 1977.4,
          status: 'CONCLUIDA',
          exigeInspecaoQualidade: true,
          extensaoCorte: {
            tipoProcessoCorte: 'LASER_FIBRA',
            material: 'Aço Inoxidável Austenítico AISI 316L',
            espessuraMm: 4.75,
            chapaDescricao: 'Chapa Aço Inox AISI 316L #4.75mm x 1500 x 3000mm',
            formatoChapaLarguraMm: 1500,
            formatoChapaComprimentoMm: 3000,
            formatoChapaAreaM2: 4.5,
            loteChapa: 'LOT-INOX-APERAM-9901',
            programaCncCodigo: 'PRG-SILO-VIROLA-INOX-R01.cnc',
            programaCncVersao: 'Rev 01',
            nestingAproveitamentoPercentual: 86.8,
            quantidadePecasPorChapa: 1,
            totalChapasNecessarias: 17,
            totalChapasConsumidasReal: 18,
            tempoPrevistoMinutosTotal: 420,
            tempoPrevistoMinutosPorPeca: 90,
            tempoRealMinutosTotal: 445,
            tempoRealMinutosPorPeca: 111.2,
            tempoSetupMinutosPrevisto: 60,
            tempoSetupMinutosReal: 65,
            descricaoSetup: 'Instalação de bico especial alta pressão N2 Ø 2.5 mm, purga da linha de nitrogênio líquido',
            quantidadePecasPlanejada: 4,
            quantidadePecasCortadasBoas: 3,
            quantidadePecasRefugadas: 1,
            pesoLiquidoPecaUnitariaKg: 167.8,
            pesoLiquidoTotalPecasKg: 503.4,
            pesoBrutoChapaUnitariaKg: 171.0,
            pesoBrutoTotalChapasKg: 3078.0,
            temRetalhoAproveitavel: true,
            retalhoDescricao: 'Retalhos Inox 316L 450x3000mm para fabricação de anéis de reforço',
            retalhoDimensoes: '450 x 3000 mm',
            retalhoPesoKg: 51.3,
            retalhoCodigoEstoque: 'RET-INOX316L-4.75-01',
            retalhoValorizadoCredito: 1231.2,
            pesoSucataTotalKg: 185.0,
            tipoSucata: 'SUCATA_INOX_LIMPA',
            custoSucataPerdida: 444.0,
            gasTipo: 'NITROGENIO_N2_ALTA_PRESSAO',
            gasPressaoBar: 18.0,
            gasConsumoEstimadoM3: 65.0,
            gasConsumoRealM3: 78.5,
            bicoNozzleModelo: 'Bico Laser Cônico Ø 2.5 mm',
            lenteFocalOuVidroProtecao: 'Lente Foco 7.5 pol / Vidro Protetor High-Power',
            custoGasConsumiveisTotal: 215.4,
          },
        },
        {
          id: 'op-oper-202',
          opId: 'op-2026-002',
          sequencia: 20,
          nomeOperacao: 'Calandragem das Virolas e Soldagem Longitudinal',
          setor: 'CALDEIRARIA_SOLDA',
          maquinaId: 'maq-solda-01',
          maquinaNome: 'Célula de Solda Robotizada Fronius',
          operadorDesignado: 'Roberto Alves de Oliveira',
          tempoSetupPadraoMinutos: 120,
          tempoCicloPadraoMinutos: 240,
          tempoTotalPadraoMinutos: 1080,
          custoHoraMaquina: 125.0,
          custoHoraMaoDeObra: 52.0,
          quantidadeTotalPrevista: 4,
          quantidadeDisponivelEntrada: 3, // liberado pelo corte (4 menos 1 refugo)
          quantidadeProduzidaBoas: 2, // 2 concluídas
          quantidadeRefugada: 0,
          quantidadeEmRetrabalho: 1, // 1 peça em retrabalho de solda
          saldoOperacaoRestante: 1,
          tempoSetupRealMinutos: 110,
          tempoExecucaoRealMinutos: 520,
          tempoParadasMinutos: 45,
          tempoTotalRealMinutos: 675,
          custoMaoDeObraReal: 585.0,
          custoMaquinaReal: 1406.0,
          custoConsumiveisReal: 340.0,
          custoTotalOperacaoReal: 2331.0,
          status: 'EM_PRODUCAO',
          exigeInspecaoQualidade: true,
          extensaoSolda: {
            processo: 'TIG_GTAW',
            gasProtecao: 'ARGONIO_PURO_100',
            gasConsumoLitrosMinuto: 14,
            consumivelArameCodigo: 'Vareta TIG AWS ER316L Ø 2.4mm',
            consumivelArameLote: 'LOT-OXIGEN-316L-998',
            consumoArameEstimadoKg: 18.0,
            consumoArameRealKg: 21.5,
            procedimentoEPS_WPS: 'EPS-SILO-INOX316L-TIG-02',
            qualificacaoSoldadorNorma: 'ASME Boiler and Pressure Vessel Code Sec VIII Div 1',
            tipoJunta: 'TOPO_COM_CHANFRO_V',
            inspecaoEnsaioNaoDestrutivo: 'RADIOGRAFIA_RX_TOTAL',
            aprovadoQualidadeSolda: false,
            custoConsumiveisSolda: 340.0,
          },
        },
        {
          id: 'op-oper-203',
          opId: 'op-2026-002',
          sequencia: 30,
          nomeOperacao: 'Polimento Sanitário Interno Ra 0.4µm e Teste Hidrostático',
          setor: 'ACABAMENTO',
          maquinaId: 'maq-montagem-01',
          maquinaNome: 'Bancada e Linha de Montagem Mecânica',
          tempoSetupPadraoMinutos: 60,
          tempoCicloPadraoMinutos: 180,
          tempoTotalPadraoMinutos: 780,
          custoHoraMaquina: 95.0,
          custoHoraMaoDeObra: 58.0,
          quantidadeTotalPrevista: 4,
          quantidadeDisponivelEntrada: 2, // 2 repassadas pela solda
          quantidadeProduzidaBoas: 2, // concluídas no produto final!
          quantidadeRefugada: 0,
          quantidadeEmRetrabalho: 0,
          saldoOperacaoRestante: 0,
          tempoSetupRealMinutos: 55,
          tempoExecucaoRealMinutos: 340,
          tempoParadasMinutos: 0,
          tempoTotalRealMinutos: 395,
          custoMaoDeObraReal: 381.8,
          custoMaquinaReal: 625.4,
          custoConsumiveisReal: 180.0,
          custoTotalOperacaoReal: 1187.2,
          status: 'CONCLUIDA_PARCIAL',
          exigeInspecaoQualidade: true,
          extensaoAcabamento: {
            tipoAcabamento: 'POLIMENTO_SANITARIO_ESPELHADO',
            granulometriaLixa: 'Sequência Grão 120 -> 240 -> 320 -> 400 -> Feltro com Pasta Diamantada',
            rugosidadeMaximaRa_Microns: 0.4,
            rugosidadeMedidaRealRa: 0.35,
            insumosAbrasivosUtilizados: 'Discos flap zirconados 3M, rodas scotch-brite e pasta de polimento branca',
            custoInsumosAcabamento: 180.0,
            aprovadoInspecaoVisual: true,
          },
        },
      ],
      criadoPor: 'Eng. Roberto Vasconcelos',
      criadoEm: '2026-08-01 10:00:00',
      atualizadoEm: '2026-08-20 16:45:00',
    };

    // 5. Ordem de Produção 03: OP-2026-003 (OP Parcial para atender entrega urgente)
    const op3: OrdemProducaoCompleta = {
      id: 'op-2026-003',
      numero: 'OP-2026-003-P1',
      empresaId: EMPRESA_PADRAO,
      pedidoId: 'ped-2026-8809',
      pedidoNumero: 'PED-2026-8809',
      clienteNome: 'Construtora Vale do Paraíba',
      produtoId: 'prod-suporte-01',
      produtoCodigo: 'SUP-TUB-120',
      produtoDescricao: 'Conjunto de Suportes de Tubulação Pesada DN 120',
      unidadeMedida: 'PC',
      projetoId: 'prj-003',
      projetoCodigo: 'PRJ-2026-SUP-TUB',
      projetoTitulo: 'Suportação Metálica Articulada DN 120',
      revisaoId: 'rev-003',
      revisaoVersao: 'Rev 02',
      bomId: 'bom-003',
      bomCodigo: 'BOM-SUP-120-R02',
      bomVersao: 'Rev 02',
      roteiroId: 'rot-003',
      roteiroCodigo: 'ROT-SUP-120-R02',
      roteiroVersao: 'Rev 02',
      quantidadePlanejada: 50,
      quantidadeProduzida: 50,
      quantidadeRefugada: 0,
      quantidadeEmProcesso: 0,
      saldoRestante: 0,
      dataEmissao: '2026-08-05',
      prazoEntrega: '2026-08-15',
      dataInicioProgramada: '2026-08-06',
      dataFimProgramada: '2026-08-14',
      dataInicioReal: '2026-08-06 08:00:00',
      dataFimReal: '2026-08-14 17:00:00',
      prioridade: 'MEDIA',
      tipoOP: 'PARCIAL',
      opPaiNumero: 'OP-2026-003 (Lote Total: 100)',
      status: 'CONCLUIDA',
      custoPlanejado: {
        materiais: 12500.0,
        maoDeObra: 3800.0,
        maquina: 4200.0,
        total: 20500.0,
      },
      custoReal: {
        materiais: 12350.0,
        maoDeObra: 3720.0,
        maquina: 4110.0,
        retrabalhos: 0,
        perdasRefugos: 0,
        total: 20180.0,
      },
      materiais: [
        {
          id: 'opmat-301',
          opId: 'op-2026-003',
          itemCodigo: 'MP-PERF-U-100',
          itemDescricao: 'Perfil Estrutural U Dobrado 100x50x3.0mm',
          tipoItem: 'MATERIA_PRIMA',
          unidadeMedida: 'BARRA',
          quantidadePorUnidade: 0.5,
          percentualPerdaPrevisto: 4.0,
          quantidadePrevistaTotal: 26,
          quantidadeRealConsumida: 26,
          saldoRestanteConsumo: 0,
          custoUnitario: 475.0,
          custoTotalPrevisto: 12350.0,
          custoTotalReal: 12350.0,
          loteMateriaPrima: 'LOT-GERDAU-U100-77',
          statusConsumo: 'BAIXADO_TOTAL',
        },
      ],
      operacoes: [
        {
          id: 'op-oper-301',
          opId: 'op-2026-003',
          sequencia: 10,
          nomeOperacao: 'Corte e Furação em Serra de Fita e Furadeira Radial',
          setor: 'CORTE_LASER',
          maquinaId: 'maq-laser-01',
          maquinaNome: 'Corte e Furação Mecânica',
          tempoSetupPadraoMinutos: 30,
          tempoCicloPadraoMinutos: 5,
          tempoTotalPadraoMinutos: 280,
          custoHoraMaquina: 110.0,
          custoHoraMaoDeObra: 40.0,
          quantidadeTotalPrevista: 50,
          quantidadeDisponivelEntrada: 50,
          quantidadeProduzidaBoas: 50,
          quantidadeRefugada: 0,
          quantidadeEmRetrabalho: 0,
          saldoOperacaoRestante: 0,
          tempoSetupRealMinutos: 25,
          tempoExecucaoRealMinutos: 245,
          tempoParadasMinutos: 0,
          tempoTotalRealMinutos: 270,
          custoMaoDeObraReal: 180.0,
          custoMaquinaReal: 495.0,
          custoTotalOperacaoReal: 675.0,
          status: 'CONCLUIDA',
          exigeInspecaoQualidade: false,
          extensaoCorte: {
            tipoProcessoCorte: 'SERRA_FITA_MECANICA',
            material: 'Perfil U Dobrado 100x50x3.0mm Aço SAE 1020',
            espessuraMm: 3.0,
            chapaDescricao: 'Barra Perfil U 100x50 #3.0mm x 6000mm',
            formatoChapaLarguraMm: 100,
            formatoChapaComprimentoMm: 6000,
            totalChapasNecessarias: 26,
            totalChapasConsumidasReal: 26,
            tempoPrevistoMinutosTotal: 280,
            tempoRealMinutosTotal: 270,
            quantidadePecasPlanejada: 50,
            quantidadePecasCortadasBoas: 50,
            quantidadePecasRefugadas: 0,
            pesoLiquidoPecaUnitariaKg: 14.2,
            pesoLiquidoTotalPecasKg: 710.0,
            temRetalhoAproveitavel: false,
            pesoSucataTotalKg: 28.5,
            tipoSucata: 'PONTAS_DE_BARRA',
            custoSucataPerdida: 45.0,
          },
        },
        {
          id: 'op-oper-302',
          opId: 'op-2026-003',
          sequencia: 20,
          nomeOperacao: 'Galvanização a Fogo por Imersão a Quente (Serviço Externo)',
          setor: 'SERVICOS_EXTERNOS',
          maquinaId: 'maq-montagem-01',
          maquinaNome: 'Terceirização Externa',
          tempoSetupPadraoMinutos: 0,
          tempoCicloPadraoMinutos: 0,
          tempoTotalPadraoMinutos: 0,
          custoHoraMaquina: 0,
          custoHoraMaoDeObra: 0,
          custoServicosExternos: 1850.0,
          quantidadeTotalPrevista: 50,
          quantidadeDisponivelEntrada: 50,
          quantidadeProduzidaBoas: 50,
          quantidadeRefugada: 0,
          quantidadeEmRetrabalho: 0,
          saldoOperacaoRestante: 0,
          tempoSetupRealMinutos: 0,
          tempoExecucaoRealMinutos: 0,
          tempoParadasMinutos: 0,
          tempoTotalRealMinutos: 0,
          custoMaoDeObraReal: 0,
          custoMaquinaReal: 0,
          custoTotalOperacaoReal: 1850.0,
          status: 'CONCLUIDA',
          exigeInspecaoQualidade: true,
          extensaoServicoExterno: {
            tipoServico: 'GALVANIZACAO_A_FOGO',
            fornecedorNome: 'GalvanoTech Revestimentos Industriais S/A',
            fornecedorCnpj: '14.882.109/0001-32',
            pedidoCompraNumero: 'PC-2026-0922',
            dataEnvioRemessa: '2026-08-08',
            dataRetornoPrevista: '2026-08-12',
            dataRetornoReal: '2026-08-12',
            notaFiscalRemessa: 'NF-e 045.112',
            notaFiscalRetorno: 'NF-e 089.442',
            quantidadeEnviada: 50,
            quantidadeRetornada: 50,
            quantidadeAprovada: 50,
            quantidadeRejeitada: 0,
            custoTotalServicoExterno: 1850.0,
            certificadoTratamentoNumero: 'CERT-GALV-2026-7881',
            espessuraCamadaMicronsMedida: 85,
            inspecaoAprovada: true,
          },
        },
        {
          id: 'op-oper-303',
          opId: 'op-2026-003',
          sequencia: 30,
          nomeOperacao: 'Montagem Final dos Grampos e Kit de Fixação',
          setor: 'MONTAGEM',
          maquinaId: 'maq-montagem-01',
          maquinaNome: 'Linha de Montagem Mecânica',
          tempoSetupPadraoMinutos: 20,
          tempoCicloPadraoMinutos: 6,
          tempoTotalPadraoMinutos: 320,
          custoHoraMaquina: 95.0,
          custoHoraMaoDeObra: 44.0,
          quantidadeTotalPrevista: 50,
          quantidadeDisponivelEntrada: 50,
          quantidadeProduzidaBoas: 50,
          quantidadeRefugada: 0,
          quantidadeEmRetrabalho: 0,
          saldoOperacaoRestante: 0,
          tempoSetupRealMinutos: 20,
          tempoExecucaoRealMinutos: 290,
          tempoParadasMinutos: 0,
          tempoTotalRealMinutos: 310,
          custoMaoDeObraReal: 227.3,
          custoMaquinaReal: 490.8,
          custoTotalOperacaoReal: 718.1,
          status: 'CONCLUIDA',
          exigeInspecaoQualidade: true,
          extensaoMontagem: {
            tipoMontagem: 'MECANICA_PARAFUSADA',
            torquesEspecificadosNm: 'Torque 65 Nm nos parafusos de fixação M12x45 Classe 8.8',
            ferramentaTorquimetroUtilizada: 'Torquímetro Digital Gedore Dremometer 20-100 Nm (Calibração Vigente)',
            quantidadeComponentesMontadosPorPeca: 8,
            gabaritoMontagemCodigo: 'GAB-MONT-SUP-120',
            inspecaoAprovada: true,
          },
        },
      ],
      criadoPor: 'Eng. Roberto Vasconcelos',
      criadoEm: '2026-08-05 09:00:00',
      atualizadoEm: '2026-08-14 17:05:00',
    };

    this.ordens = [op1, op2, op3];

    // 6. Apontamentos iniciais
    this.apontamentos = [
      {
        id: 'apt-001',
        opId: 'op-2026-001',
        opNumero: 'OP-2026-001',
        opOperacaoId: 'op-oper-01',
        sequenciaOperacao: 10,
        nomeOperacao: 'Corte a Laser das Longarinas e Travessas',
        tipoApontamento: 'SETUP',
        dataHoraInicio: '2026-08-12 08:00:00',
        dataHoraFim: '2026-08-12 08:40:00',
        duracaoMinutos: 40,
        operadorId: 'op-01',
        operadorNome: 'Carlos Eduardo Silva',
        maquinaId: 'maq-laser-01',
        maquinaNome: 'Corte a Laser Fibra 4kW Trumpf',
        quantidadeBoas: 0,
        quantidadeRefugo: 0,
        quantidadeRetrabalho: 0,
        materiaisConsumidos: [],
        custoMaoDeObraCalculado: 28.33,
        custoMaquinaCalculado: 123.33,
        custoMateriaisCalculado: 0,
        custoTotalApontamento: 151.66,
        observacoes: 'Setup de troca de bico e alinhamento de feixe ótico concluído.',
        empresaId: EMPRESA_PADRAO,
        criadoEm: '2026-08-12 08:40:00',
      },
      {
        id: 'apt-002',
        opId: 'op-2026-001',
        opNumero: 'OP-2026-001',
        opOperacaoId: 'op-oper-01',
        sequenciaOperacao: 10,
        nomeOperacao: 'Corte a Laser das Longarinas e Travessas',
        tipoApontamento: 'PRODUCAO',
        dataHoraInicio: '2026-08-12 08:45:00',
        dataHoraFim: '2026-08-12 12:15:00',
        duracaoMinutos: 210,
        operadorId: 'op-01',
        operadorNome: 'Carlos Eduardo Silva',
        maquinaId: 'maq-laser-01',
        maquinaNome: 'Corte a Laser Fibra 4kW Trumpf',
        quantidadeBoas: 6,
        quantidadeRefugo: 0,
        quantidadeRetrabalho: 0,
        materiaisConsumidos: [
          {
            materialId: 'opmat-01',
            itemCodigo: 'MP-SAC350-01',
            itemDescricao: 'Chapa Aço SAC-350 #6.35mm x 1500 x 6000mm',
            quantidadeConsumida: 14,
            unidadeMedida: 'CHAPA',
            custoUnitario: 850.0,
            custoTotal: 11900.0,
            lote: 'LOT-SAC350-USIMINAS-8812',
          },
        ],
        custoMaoDeObraCalculado: 148.75,
        custoMaquinaCalculado: 647.5,
        custoMateriaisCalculado: 11900.0,
        custoTotalApontamento: 12696.25,
        observacoes: 'Corte de 6 conjuntos completos liberados imediatamente para a dobra (seq 20).',
        empresaId: EMPRESA_PADRAO,
        criadoEm: '2026-08-12 12:15:00',
      },
    ];

    // 7. Paradas iniciais
    this.paradas = [
      {
        id: 'par-001',
        opId: 'op-2026-001',
        opNumero: 'OP-2026-001',
        opOperacaoId: 'op-oper-01',
        maquinaId: 'maq-laser-01',
        maquinaNome: 'Corte a Laser Fibra 4kW Trumpf',
        operadorId: 'op-01',
        operadorNome: 'Carlos Eduardo Silva',
        dataHoraInicio: '2026-08-12 10:15:00',
        dataHoraFim: '2026-08-12 10:30:00',
        duracaoMinutos: 15,
        motivoCategoria: 'TROCA_FERRAMENTA',
        motivoDescricao: 'Substituição de lente de proteção e limpeza do cabeçote',
        status: 'FINALIZADA',
        impactoCustoEstimado: 46.25,
        empresaId: EMPRESA_PADRAO,
        criadoEm: '2026-08-12 10:15:00',
      },
    ];

    // 8. Refugo inicial
    this.refugos = [
      {
        id: 'ref-001',
        opId: 'op-2026-002',
        opNumero: 'OP-2026-002',
        opOperacaoId: 'op-oper-201',
        sequenciaOperacao: 10,
        nomeOperacao: 'Corte e Chanfro das Virolas Inox 316L',
        dataHora: '2026-08-04 11:20:00',
        operadorId: 'op-01',
        operadorNome: 'Carlos Eduardo Silva',
        maquinaId: 'maq-laser-01',
        maquinaNome: 'Corte a Laser Fibra 4kW Trumpf',
        quantidadeRefugada: 1,
        unidadeMedida: 'UN',
        motivoRefugo: 'DEFEITO_CORTE_LASER',
        descricaoDefeito: 'Superaquecimento na borda chanfrada com perda da geometria angular da virola #4.75mm.',
        destinoPeca: 'SUCATA_VENDA',
        custoPerdaEstimado: 4100.0,
        disparouOpComplementar: false,
        empresaId: EMPRESA_PADRAO,
        criadoEm: '2026-08-04 11:25:00',
      },
    ];

    // 9. Retrabalho inicial
    this.retrabalhos = [
      {
        id: 'ret-001',
        opOrigemId: 'op-2026-002',
        opOrigemNumero: 'OP-2026-002',
        opOperacaoOrigemId: 'op-oper-202',
        sequenciaOperacaoOrigem: 20,
        nomeOperacaoOrigem: 'Calandragem das Virolas e Soldagem Longitudinal',
        dataHora: '2026-08-07 14:00:00',
        operadorId: 'op-03',
        operadorNome: 'Roberto Alves de Oliveira',
        maquinaId: 'maq-solda-01',
        maquinaNome: 'Célula Robotizada Fronius',
        quantidadeRetrabalho: 1,
        motivoRetrabalho: 'RESSOLDA_RETOQUE',
        descricaoAjuste: 'Poro e mordedura de solda detectada no ensaio visual a 1.2m do topo.',
        instrucaoRetrabalho: 'Goivagem mecânica na raiz do defeito e ressolda manual TIG com passe de acabamento.',
        tempoEstimadoMinutos: 90,
        tempoRealMinutos: 75,
        custoAdicionalEstimado: 1500.0,
        custoAdicionalReal: 1250.0,
        status: 'EM_ANDAMENTO',
        empresaId: EMPRESA_PADRAO,
        criadoEm: '2026-08-07 14:10:00',
      },
    ];
  }

  // ==========================================
  // CONSULTAS
  // ==========================================

  public listarOrdens(empresaId: string, filtros?: {
    status?: string;
    tipoOP?: string;
    prioridade?: string;
    busca?: string;
  }): OrdemProducaoCompleta[] {
    return this.ordens.filter((op) => {
      if (op.empresaId !== empresaId) return false;
      if (filtros?.status && filtros.status !== 'TODOS' && op.status !== filtros.status) return false;
      if (filtros?.tipoOP && filtros.tipoOP !== 'TODOS' && op.tipoOP !== filtros.tipoOP) return false;
      if (filtros?.prioridade && filtros.prioridade !== 'TODOS' && op.prioridade !== filtros.prioridade) return false;
      if (filtros?.busca) {
        const termo = filtros.busca.toLowerCase();
        const bateuNumero = op.numero.toLowerCase().includes(termo);
        const bateuProduto = op.produtoDescricao.toLowerCase().includes(termo) || op.produtoCodigo.toLowerCase().includes(termo);
        const bateuPedido = op.pedidoNumero?.toLowerCase().includes(termo) || false;
        const bateuCliente = op.clienteNome?.toLowerCase().includes(termo) || false;
        const bateuProjeto = op.projetoCodigo?.toLowerCase().includes(termo) || false;
        if (!bateuNumero && !bateuProduto && !bateuPedido && !bateuCliente && !bateuProjeto) return false;
      }
      return true;
    });
  }

  public buscarOrdemPorId(id: string, empresaId: string): OrdemProducaoCompleta | null {
    return this.ordens.find((op) => op.id === id && op.empresaId === empresaId) || null;
  }

  public listarOperadores(empresaId?: string): OperadorProducao[] {
    return this.operadores;
  }

  public listarMaquinas(empresaId?: string): MaquinaCentroTrabalho[] {
    return this.maquinas;
  }

  public listarApontamentos(empresaId: string, opId?: string): ApontamentoProducao[] {
    return this.apontamentos.filter((apt) => {
      if (apt.empresaId !== empresaId) return false;
      if (opId && apt.opId !== opId) return false;
      return true;
    }).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  public listarParadas(empresaId: string, status?: 'EM_ANDAMENTO' | 'FINALIZADA'): ParadaProducao[] {
    return this.paradas.filter((p) => {
      if (p.empresaId !== empresaId) return false;
      if (status && p.status !== status) return false;
      return true;
    }).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  public listarRefugos(empresaId: string, opId?: string): RefugoProducao[] {
    return this.refugos.filter((r) => {
      if (r.empresaId !== empresaId) return false;
      if (opId && r.opId !== opId) return false;
      return true;
    }).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  public listarRetrabalhos(empresaId: string, opId?: string): RetrabalhoProducao[] {
    return this.retrabalhos.filter((ret) => {
      if (ret.empresaId !== empresaId) return false;
      if (opId && ret.opOrigemId !== opId) return false;
      return true;
    }).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  // ==========================================
  // OPERAÇÕES / TRANSAÇÕES DO CHÃO DE FÁBRICA
  // ==========================================

  /**
   * Criação de nova Ordem de Produção (Total ou Parcial)
   */
  public criarOrdemProducao(params: {
    empresaId: string;
    pedidoId?: string;
    pedidoNumero?: string;
    clienteNome?: string;
    produtoId: string;
    produtoCodigo: string;
    produtoDescricao: string;
    unidadeMedida: string;
    projetoId?: string;
    projetoCodigo?: string;
    projetoTitulo?: string;
    revisaoId: string;
    revisaoVersao: string;
    bomId: string;
    bomCodigo: string;
    bomVersao: string;
    roteiroId: string;
    roteiroCodigo: string;
    roteiroVersao: string;
    quantidadePlanejada: number;
    prazoEntrega: string;
    dataInicioProgramada: string;
    dataFimProgramada: string;
    prioridade: PrioridadeProducao;
    tipoOP: TipoOrdemProducao;
    opPaiId?: string;
    opPaiNumero?: string;
    materiais: {
      itemCodigo: string;
      itemDescricao: string;
      tipoItem: string;
      unidadeMedida: string;
      quantidadePorUnidade: number;
      percentualPerda: number;
      custoUnitario: number;
      loteMateriaPrima?: string;
      certificadoUsina?: string;
    }[];
    operacoes: {
      sequencia: number;
      nomeOperacao: string;
      setor: string;
      maquinaId: string;
      maquinaNome: string;
      ferramenta?: string;
      operadorDesignado?: string;
      tempoSetupPadraoMinutos: number;
      tempoCicloPadraoMinutos: number;
      custoHoraMaquina: number;
      custoHoraMaoDeObra: number;
      exigeInspecaoQualidade: boolean;
    }[];
    observacoes?: string;
    criadoPor: string;
  }): OrdemProducaoCompleta {
    const anoAtual = new Date().getFullYear();
    const numeroSeq = (this.ordens.length + 1).toString().padStart(3, '0');
    const sufixoParcial = params.tipoOP === 'PARCIAL' ? '-P' : '';
    const numeroOP = `OP-${anoAtual}-${numeroSeq}${sufixoParcial}`;

    // Construção dos materiais com cálculo de perdas
    const opMateriais: OpMaterial[] = params.materiais.map((mat, idx) => {
      const qtdLiquida = mat.quantidadePorUnidade * params.quantidadePlanejada;
      const fatorPerda = 1 + (mat.percentualPerda || 0) / 100;
      const qtdPrevistaTotal = Number((qtdLiquida * fatorPerda).toFixed(3));
      const custoTotalPrevisto = Number((qtdPrevistaTotal * mat.custoUnitario).toFixed(2));

      return {
        id: `opmat-${Date.now()}-${idx}`,
        opId: '', // preenchido abaixo
        itemCodigo: mat.itemCodigo,
        itemDescricao: mat.itemDescricao,
        tipoItem: mat.tipoItem,
        unidadeMedida: mat.unidadeMedida,
        quantidadePorUnidade: mat.quantidadePorUnidade,
        percentualPerdaPrevisto: mat.percentualPerda,
        quantidadePrevistaTotal: qtdPrevistaTotal,
        quantidadeRealConsumida: 0,
        saldoRestanteConsumo: qtdPrevistaTotal,
        custoUnitario: mat.custoUnitario,
        custoTotalPrevisto: custoTotalPrevisto,
        custoTotalReal: 0,
        loteMateriaPrima: mat.loteMateriaPrima,
        certificadoUsina: mat.certificadoUsina,
        statusConsumo: 'PENDENTE',
      };
    });

    // Construção das operações sequenciais
    const sortedOperacoes = [...params.operacoes].sort((a, b) => a.sequencia - b.sequencia);
    const opOperacoes: OpOperacao[] = sortedOperacoes.map((op, idx) => {
      const tempoTotalMinutos = op.tempoSetupPadraoMinutos + op.tempoCicloPadraoMinutos * params.quantidadePlanejada;
      const isPrimeira = idx === 0;

      return {
        id: `op-oper-${Date.now()}-${idx}`,
        opId: '',
        sequencia: op.sequencia,
        nomeOperacao: op.nomeOperacao,
        setor: op.setor,
        maquinaId: op.maquinaId,
        maquinaNome: op.maquinaNome,
        ferramenta: op.ferramenta,
        operadorDesignado: op.operadorDesignado,
        tempoSetupPadraoMinutos: op.tempoSetupPadraoMinutos,
        tempoCicloPadraoMinutos: op.tempoCicloPadraoMinutos,
        tempoTotalPadraoMinutos: tempoTotalMinutos,
        custoHoraMaquina: op.custoHoraMaquina,
        custoHoraMaoDeObra: op.custoHoraMaoDeObra,
        quantidadeTotalPrevista: params.quantidadePlanejada,
        quantidadeDisponivelEntrada: isPrimeira ? params.quantidadePlanejada : 0,
        quantidadeProduzidaBoas: 0,
        quantidadeRefugada: 0,
        quantidadeEmRetrabalho: 0,
        saldoOperacaoRestante: isPrimeira ? params.quantidadePlanejada : 0,
        tempoSetupRealMinutos: 0,
        tempoExecucaoRealMinutos: 0,
        tempoParadasMinutos: 0,
        tempoTotalRealMinutos: 0,
        custoMaoDeObraReal: 0,
        custoMaquinaReal: 0,
        custoTotalOperacaoReal: 0,
        status: isPrimeira ? 'PRONTA_PARA_INICIO' : 'AGUARDANDO_ANTERIOR',
        exigeInspecaoQualidade: op.exigeInspecaoQualidade,
      };
    });

    // Cálculo do Custo Planejado Total
    let custoMatPrev = 0;
    for (const m of opMateriais) custoMatPrev += m.custoTotalPrevisto;

    let custoModPrev = 0;
    let custoMaqPrev = 0;
    for (const o of opOperacoes) {
      const horasTotais = o.tempoTotalPadraoMinutos / 60;
      custoModPrev += horasTotais * o.custoHoraMaoDeObra;
      custoMaqPrev += horasTotais * o.custoHoraMaquina;
    }

    const novaOPId = `op-${Date.now()}`;
    opMateriais.forEach((m) => (m.opId = novaOPId));
    opOperacoes.forEach((o) => (o.opId = novaOPId));

    const novaOP: OrdemProducaoCompleta = {
      id: novaOPId,
      numero: numeroOP,
      empresaId: params.empresaId,
      pedidoId: params.pedidoId,
      pedidoNumero: params.pedidoNumero,
      clienteNome: params.clienteNome,
      produtoId: params.produtoId,
      produtoCodigo: params.produtoCodigo,
      produtoDescricao: params.produtoDescricao,
      unidadeMedida: params.unidadeMedida,
      projetoId: params.projetoId,
      projetoCodigo: params.projetoCodigo,
      projetoTitulo: params.projetoTitulo,
      revisaoId: params.revisaoId,
      revisaoVersao: params.revisaoVersao,
      bomId: params.bomId,
      bomCodigo: params.bomCodigo,
      bomVersao: params.bomVersao,
      roteiroId: params.roteiroId,
      roteiroCodigo: params.roteiroCodigo,
      roteiroVersao: params.roteiroVersao,
      quantidadePlanejada: params.quantidadePlanejada,
      quantidadeProduzida: 0,
      quantidadeRefugada: 0,
      quantidadeEmProcesso: params.quantidadePlanejada,
      saldoRestante: params.quantidadePlanejada,
      dataEmissao: new Date().toISOString().split('T')[0],
      prazoEntrega: params.prazoEntrega,
      dataInicioProgramada: params.dataInicioProgramada,
      dataFimProgramada: params.dataFimProgramada,
      prioridade: params.prioridade,
      tipoOP: params.tipoOP,
      opPaiId: params.opPaiId,
      opPaiNumero: params.opPaiNumero,
      status: 'LIBERADA',
      custoPlanejado: {
        materiais: Number(custoMatPrev.toFixed(2)),
        maoDeObra: Number(custoModPrev.toFixed(2)),
        maquina: Number(custoMaqPrev.toFixed(2)),
        total: Number((custoMatPrev + custoModPrev + custoMaqPrev).toFixed(2)),
      },
      custoReal: {
        materiais: 0,
        maoDeObra: 0,
        maquina: 0,
        retrabalhos: 0,
        perdasRefugos: 0,
        total: 0,
      },
      materiais: opMateriais,
      operacoes: opOperacoes,
      observacoes: params.observacoes,
      criadoPor: params.criadoPor,
      criadoEm: new Date().toISOString().replace('T', ' ').substring(0, 19),
      atualizadoEm: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    this.ordens.unshift(novaOP);
    return novaOP;
  }

  /**
   * Registro de Apontamento de Produção (Tempo real, Operador, Máquina, Peças Boas, Refugo, Retrabalho e Consumo Real)
   * ATUALIZAÇÃO AUTOMÁTICA DO FLUXO:
   * 1. Atualiza quantidade produzida boa na operação atual.
   * 2. Repassa as peças boas para a quantidadeDisponivelEntrada da próxima operação.
   * 3. Se for a última operação, incrementa quantidadeProduzida final da OP.
   * 4. Registra refugo e retrabalho se apontados.
   * 5. Recalcula custos e tempos reais.
   */
  public registrarApontamento(params: {
    empresaId: string;
    opId: string;
    opOperacaoId: string;
    tipoApontamento: 'SETUP' | 'PRODUCAO' | 'FINALIZACAO_OPERACAO' | 'CONSUMO_MATERIAL';
    dataHoraInicio: string;
    dataHoraFim: string;
    duracaoMinutos: number;
    operadorId: string;
    maquinaId: string;
    quantidadeBoas: number;
    quantidadeRefugo: number;
    quantidadeRetrabalho: number;
    motivoRefugo?: MotivoRefugoCategoria;
    descricaoRefugo?: string;
    motivoRetrabalho?: MotivoRetrabalhoCategoria;
    descricaoRetrabalho?: string;
    materiaisConsumidos: {
      materialId: string;
      quantidadeConsumida: number;
      lote?: string;
    }[];
    custoConsumiveis?: number;
    custoServicosExternos?: number;
    detalhesCorte?: Partial<ExtensaoCorteLaser>;
    detalhesDobra?: Partial<ExtensaoDobraCNC>;
    detalhesSolda?: Partial<ExtensaoSoldaCaldeiraria>;
    detalhesPintura?: Partial<ExtensaoPinturaAcabamento>;
    detalhesMontagem?: Partial<ExtensaoMontagem>;
    detalhesAcabamento?: Partial<ExtensaoAcabamento>;
    detalhesServicoExterno?: Partial<ExtensaoServicoExterno>;
    observacoes?: string;
  }): {
    apontamento: ApontamentoProducao;
    opAtualizada: OrdemProducaoCompleta;
    refugoGerado?: RefugoProducao;
    retrabalhoGerado?: RetrabalhoProducao;
  } {
    const op = this.buscarOrdemPorId(params.opId, params.empresaId);
    if (!op) {
      throw new Error(`Ordem de Produção não encontrada: ID ${params.opId}`);
    }

    const operacaoIndex = op.operacoes.findIndex((o) => o.id === params.opOperacaoId);
    if (operacaoIndex === -1) {
      throw new Error(`Operação não encontrada na OP: ID ${params.opOperacaoId}`);
    }

    const operacao = op.operacoes[operacaoIndex];
    const operador = this.operadores.find((oprd) => oprd.id === params.operadorId);
    const maquina = this.maquinas.find((m) => m.id === params.maquinaId);

    const operadorNome = operador ? operador.nome : (operacao.operadorDesignado || 'Operador Especialista');
    const operadorCustoHora = operador ? operador.custoHora : operacao.custoHoraMaoDeObra;
    const maquinaNome = maquina ? maquina.nome : operacao.maquinaNome;
    const maquinaCustoHora = maquina ? maquina.custoHora : operacao.custoHoraMaquina;

    // 1. Cálculo de Custos com Custo-Hora Parametrizado
    const horasApontadas = params.duracaoMinutos / 60;
    const custoMOD = Number((horasApontadas * operadorCustoHora).toFixed(2));
    const custoCHM = Number((horasApontadas * maquinaCustoHora).toFixed(2));
    const custoConsumiveisApt = Number(params.custoConsumiveis || params.detalhesCorte?.custoGasConsumiveisTotal || params.detalhesSolda?.custoConsumiveisSolda || params.detalhesPintura?.custoInsumosPintura || params.detalhesAcabamento?.custoInsumosAcabamento || 0);
    const custoServExternosApt = Number(params.custoServicosExternos || params.detalhesServicoExterno?.custoTotalServicoExterno || 0);

    // 2. Consumo Real de Materiais
    let custoMateriaisApontamento = 0;
    const materiaisRegistrados: ApontamentoProducao['materiaisConsumidos'] = [];

    for (const matConsumo of params.materiaisConsumidos) {
      const opMat = op.materiais.find((m) => m.id === matConsumo.materialId || m.itemCodigo === matConsumo.materialId);
      if (opMat) {
        opMat.quantidadeRealConsumida += matConsumo.quantidadeConsumida;
        opMat.saldoRestanteConsumo = Math.max(0, opMat.quantidadePrevistaTotal - opMat.quantidadeRealConsumida);
        const custoItem = Number((matConsumo.quantidadeConsumida * opMat.custoUnitario).toFixed(2));
        opMat.custoTotalReal += custoItem;
        custoMateriaisApontamento += custoItem;

        if (opMat.quantidadeRealConsumida >= opMat.quantidadePrevistaTotal) {
          opMat.statusConsumo = opMat.quantidadeRealConsumida > opMat.quantidadePrevistaTotal ? 'CONSUMO_EXCEDIDO' : 'BAIXADO_TOTAL';
        } else {
          opMat.statusConsumo = 'CONSUMO_PARCIAL';
        }

        if (matConsumo.lote) opMat.loteMateriaPrima = matConsumo.lote;

        materiaisRegistrados.push({
          materialId: opMat.id,
          itemCodigo: opMat.itemCodigo,
          itemDescricao: opMat.itemDescricao,
          quantidadeConsumida: matConsumo.quantidadeConsumida,
          unidadeMedida: opMat.unidadeMedida,
          custoUnitario: opMat.custoUnitario,
          custoTotal: custoItem,
          lote: matConsumo.lote || opMat.loteMateriaPrima,
        });
      }
    }

    const custoTotalApontamento = Number((custoMOD + custoCHM + custoMateriaisApontamento + custoConsumiveisApt + custoServExternosApt).toFixed(2));

    // 3. Atualização dos Tempos e Custos da Operação
    if (params.tipoApontamento === 'SETUP') {
      operacao.tempoSetupRealMinutos += params.duracaoMinutos;
    } else {
      operacao.tempoExecucaoRealMinutos += params.duracaoMinutos;
    }
    operacao.tempoTotalRealMinutos = operacao.tempoSetupRealMinutos + operacao.tempoExecucaoRealMinutos + operacao.tempoParadasMinutos;
    operacao.custoMaoDeObraReal = Number((operacao.custoMaoDeObraReal + custoMOD).toFixed(2));
    operacao.custoMaquinaReal = Number((operacao.custoMaquinaReal + custoCHM).toFixed(2));
    operacao.custoConsumiveisReal = Number(((operacao.custoConsumiveisReal || 0) + custoConsumiveisApt).toFixed(2));
    if (custoServExternosApt > 0) {
      operacao.custoServicosExternos = Number(((operacao.custoServicosExternos || 0) + custoServExternosApt).toFixed(2));
    }
    operacao.custoTotalOperacaoReal = Number(
      (operacao.custoMaoDeObraReal + operacao.custoMaquinaReal + (operacao.custoConsumiveisReal || 0) + (operacao.custoServicosExternos || 0)).toFixed(2)
    );

    // 4. Integração das Extensões Específicas na Operação
    if (params.detalhesCorte) {
      operacao.extensaoCorte = {
        ...(operacao.extensaoCorte || {
          tipoProcessoCorte: 'LASER_FIBRA',
          material: op.produtoDescricao,
          espessuraMm: 6.0,
          chapaDescricao: 'Chapa Padrão de Engenharia',
          formatoChapaLarguraMm: 1500,
          formatoChapaComprimentoMm: 6000,
          quantidadePecasPlanejada: op.quantidadePlanejada,
          quantidadePecasCortadasBoas: 0,
          quantidadePecasRefugadas: 0,
          pesoLiquidoPecaUnitariaKg: 50.0,
          pesoLiquidoTotalPecasKg: 50.0 * op.quantidadePlanejada,
          temRetalhoAproveitavel: false,
          pesoSucataTotalKg: 0,
          tipoSucata: 'ESQUELETO_LASER',
        }),
        ...params.detalhesCorte,
      };
      if (params.quantidadeBoas) {
        operacao.extensaoCorte.quantidadePecasCortadasBoas = (operacao.extensaoCorte.quantidadePecasCortadasBoas || 0) + params.quantidadeBoas;
      }
      if (params.quantidadeRefugo) {
        operacao.extensaoCorte.quantidadePecasRefugadas = (operacao.extensaoCorte.quantidadePecasRefugadas || 0) + params.quantidadeRefugo;
      }
    }

    if (params.detalhesDobra) {
      operacao.extensaoDobra = {
        ...(operacao.extensaoDobra || {
          maquinaNome: maquinaNome,
          ferramentaConjunto: operacao.ferramenta || 'Punção e Matriz Standard',
          puncaoModelo: 'Punção Standard',
          matrizModelo: 'Matriz Standard V60',
          aberturaMatrizV_Mm: 60,
          raioInternoDobraMm: 4.0,
          espessuraMaterialMm: 4.0,
          materialDescricao: op.produtoDescricao,
          angulosDescricao: '90 graus',
          compensacaoSpringback: 1.5,
          totalDobrasPorPeca: 2,
          sequenciaPassosDobra: [],
          tempoSetupPrevistoMinutos: operacao.tempoSetupPadraoMinutos,
          tempoSetupRealMinutos: operacao.tempoSetupRealMinutos,
          tempoDobraPrevistoPorPecaMinutos: operacao.tempoCicloPadraoMinutos,
          tempoDobraRealPorPecaMinutos: 0,
          tempoTotalPrevistoMinutos: operacao.tempoTotalPadraoMinutos,
          tempoTotalRealMinutos: operacao.tempoTotalRealMinutos,
          quantidadePlanejada: op.quantidadePlanejada,
          quantidadeDobradaBoas: 0,
          quantidadeRefugoDobra: 0,
          quantidadeRetrabalhoDobra: 0,
          houveRetrabalhoDobra: false,
        }),
        ...params.detalhesDobra,
      };
      if (params.quantidadeBoas) {
        operacao.extensaoDobra.quantidadeDobradaBoas = (operacao.extensaoDobra.quantidadeDobradaBoas || 0) + params.quantidadeBoas;
      }
      if (params.quantidadeRefugo) {
        operacao.extensaoDobra.quantidadeRefugoDobra = (operacao.extensaoDobra.quantidadeRefugoDobra || 0) + params.quantidadeRefugo;
      }
      if (params.quantidadeRetrabalho) {
        operacao.extensaoDobra.quantidadeRetrabalhoDobra = (operacao.extensaoDobra.quantidadeRetrabalhoDobra || 0) + params.quantidadeRetrabalho;
        operacao.extensaoDobra.houveRetrabalhoDobra = true;
      }
    }

    if (params.detalhesSolda) {
      operacao.extensaoSolda = {
        ...(operacao.extensaoSolda || {
          processo: 'MIG_MAG_GMAW',
          gasProtecao: 'MISTURA_AR_CO2_20',
          consumivelArameCodigo: 'AWS ER70S-6 Ø 1.2mm',
          consumoArameEstimadoKg: 20.0,
          procedimentoEPS_WPS: 'EPS-PADRAO-01',
          qualificacaoSoldadorNorma: 'AWS D1.1',
          tipoJunta: 'TOPO_COM_CHANFRO_V',
          aprovadoQualidadeSolda: true,
        }),
        ...params.detalhesSolda,
      };
    }

    if (params.detalhesPintura) {
      operacao.extensaoPintura = {
        ...(operacao.extensaoPintura || {
          tipoPintura: 'ELETROSTATICA_PO',
          corRAL: 'RAL 7016',
          corDescricao: 'Cinza Industrial',
          tintaCodigo: 'TINTA-EPOXI-PADRAO',
          espessuraCamadaMicronsPrevista: 80,
          temperaturaEstufaC: 180,
          tempoEstufaMinutos: 20,
          areaTotalPinturaM2: 50.0,
          preTratamentoSuperficie: 'DESENGRAXE_E_FOSFATIZACAO',
          consumoTintaEstimadoKgOuLitros: 15.0,
        }),
        ...params.detalhesPintura,
      };
    }

    if (params.detalhesMontagem) {
      operacao.extensaoMontagem = {
        ...(operacao.extensaoMontagem || {
          tipoMontagem: 'MECANICA_PARAFUSADA',
          torquesEspecificadosNm: 'Conforme manual de montagem',
          ferramentaTorquimetroUtilizada: 'Torquímetro calibrado',
          quantidadeComponentesMontadosPorPeca: 4,
          inspecaoAprovada: true,
        }),
        ...params.detalhesMontagem,
      };
    }

    if (params.detalhesAcabamento) {
      operacao.extensaoAcabamento = {
        ...(operacao.extensaoAcabamento || {
          tipoAcabamento: 'ESCOVADO',
          granulometriaLixa: 'Grão 240',
          rugosidadeMaximaRa_Microns: 0.8,
          aprovadoInspecaoVisual: true,
        }),
        ...params.detalhesAcabamento,
      };
    }

    if (params.detalhesServicoExterno) {
      operacao.extensaoServicoExterno = {
        ...(operacao.extensaoServicoExterno || {
          tipoServico: 'GALVANIZACAO_A_FOGO',
          fornecedorNome: 'Prestador Terceirizado Qualificado',
          fornecedorCnpj: '00.000.000/0001-00',
          pedidoCompraNumero: 'PC-TERC-01',
          dataEnvioRemessa: new Date().toISOString().split('T')[0],
          dataRetornoPrevista: new Date().toISOString().split('T')[0],
          quantidadeEnviada: op.quantidadePlanejada,
          quantidadeRetornada: 0,
          quantidadeAprovada: 0,
          quantidadeRejeitada: 0,
          custoTotalServicoExterno: 0,
          inspecaoAprovada: true,
        }),
        ...params.detalhesServicoExterno,
      };
    }

    // 5. Quantidades Produzidas, Refugos e Retrabalhos
    const qtdBoas = Number(params.quantidadeBoas || 0);
    const qtdRefugo = Number(params.quantidadeRefugo || 0);
    const qtdRetrabalho = Number(params.quantidadeRetrabalho || 0);

    operacao.quantidadeProduzidaBoas += qtdBoas;
    operacao.quantidadeRefugada += qtdRefugo;
    operacao.quantidadeEmRetrabalho += qtdRetrabalho;
    operacao.saldoOperacaoRestante = Math.max(
      0,
      operacao.quantidadeDisponivelEntrada - (operacao.quantidadeProduzidaBoas + operacao.quantidadeRefugada)
    );

    if (!operacao.dataInicioReal) {
      operacao.dataInicioReal = params.dataHoraInicio;
    }

    // 6. Repasse para a Próxima Operação no Fluxo Sequencial
    const proximaOperacaoIndex = operacaoIndex + 1;
    if (proximaOperacaoIndex < op.operacoes.length) {
      const proximaOperacao = op.operacoes[proximaOperacaoIndex];
      proximaOperacao.quantidadeDisponivelEntrada += qtdBoas;
      proximaOperacao.saldoOperacaoRestante = proximaOperacao.quantidadeDisponivelEntrada - (proximaOperacao.quantidadeProduzidaBoas + proximaOperacao.quantidadeRefugada);
      if (proximaOperacao.status === 'AGUARDANDO_ANTERIOR' && proximaOperacao.quantidadeDisponivelEntrada > 0) {
        proximaOperacao.status = 'PRONTA_PARA_INICIO';
      }
    } else {
      // É a última operação do roteiro -> Conclusão de produto pronto!
      op.quantidadeProduzida += qtdBoas;
    }

    // Status da Operação Atual
    if (operacao.quantidadeProduzidaBoas + operacao.quantidadeRefugada >= operacao.quantidadeTotalPrevista) {
      operacao.status = 'CONCLUIDA';
      operacao.dataFimReal = params.dataHoraFim;
    } else if (operacao.quantidadeProduzidaBoas > 0) {
      operacao.status = 'EM_PRODUCAO';
    } else if (params.tipoApontamento === 'SETUP') {
      operacao.status = 'EM_SETUP';
    }

    // 7. Registro de Refugo (se houver)
    let refugoRegistro: RefugoProducao | undefined;
    if (qtdRefugo > 0) {
      op.quantidadeRefugada += qtdRefugo;
      const custoUnitarioPerda = (op.custoPlanejado.total / op.quantidadePlanejada) * 0.8;
      const custoPerdaTotal = Number((qtdRefugo * custoUnitarioPerda).toFixed(2));

      refugoRegistro = {
        id: `ref-${Date.now()}`,
        opId: op.id,
        opNumero: op.numero,
        opOperacaoId: operacao.id,
        sequenciaOperacao: operacao.sequencia,
        nomeOperacao: operacao.nomeOperacao,
        dataHora: params.dataHoraFim,
        operadorId: params.operadorId,
        operadorNome: operadorNome,
        maquinaId: params.maquinaId,
        maquinaNome: maquinaNome,
        quantidadeRefugada: qtdRefugo,
        unidadeMedida: op.unidadeMedida,
        motivoRefugo: params.motivoRefugo || 'ERRO_OPERACIONAL',
        descricaoDefeito: params.descricaoRefugo || 'Defeito dimensional / estético apontado na operação',
        destinoPeca: 'SUCATA_VENDA',
        custoPerdaEstimado: custoPerdaTotal,
        disparouOpComplementar: false,
        empresaId: params.empresaId,
        criadoEm: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };

      this.refugos.unshift(refugoRegistro);
      op.custoReal.perdasRefugos += custoPerdaTotal;
    }

    // 8. Registro de Retrabalho (se houver)
    let retrabalhoRegistro: RetrabalhoProducao | undefined;
    if (qtdRetrabalho > 0) {
      retrabalhoRegistro = {
        id: `ret-${Date.now()}`,
        opOrigemId: op.id,
        opOrigemNumero: op.numero,
        opOperacaoOrigemId: operacao.id,
        sequenciaOperacaoOrigem: operacao.sequencia,
        nomeOperacaoOrigem: operacao.nomeOperacao,
        dataHora: params.dataHoraFim,
        operadorId: params.operadorId,
        operadorNome: operadorNome,
        maquinaId: params.maquinaId,
        maquinaNome: maquinaNome,
        quantidadeRetrabalho: qtdRetrabalho,
        motivoRetrabalho: params.motivoRetrabalho || 'RECORTE_REBARBA',
        descricaoAjuste: params.descricaoRetrabalho || 'Retrabalho para correção e conformidade',
        instrucaoRetrabalho: 'Realizar ajuste dimensional / solda / acabamento conforme padrão',
        tempoEstimadoMinutos: 45,
        tempoRealMinutos: 0,
        custoAdicionalEstimado: 120.0,
        custoAdicionalReal: 0,
        status: 'PENDENTE',
        empresaId: params.empresaId,
        criadoEm: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };

      this.retrabalhos.unshift(retrabalhoRegistro);
    }

    // 9. Atualização Geral e Custos da OP
    op.saldoRestante = Math.max(0, op.quantidadePlanejada - (op.quantidadeProduzida + op.quantidadeRefugada));
    op.quantidadeEmProcesso = op.quantidadePlanejada - op.quantidadeProduzida - op.quantidadeRefugada;

    // Atualização dos Custos Acumulados da OP
    let somaMOD = 0;
    let somaCHM = 0;
    let somaConsumiveis = 0;
    let somaServicosExt = 0;
    for (const o of op.operacoes) {
      somaMOD += o.custoMaoDeObraReal;
      somaCHM += o.custoMaquinaReal;
      somaConsumiveis += o.custoConsumiveisReal || 0;
      somaServicosExt += o.custoServicosExternos || 0;
    }
    let somaMatReal = 0;
    for (const m of op.materiais) {
      somaMatReal += m.custoTotalReal;
    }

    op.custoReal.materiais = Number(somaMatReal.toFixed(2));
    op.custoReal.maoDeObra = Number(somaMOD.toFixed(2));
    op.custoReal.maquina = Number(somaCHM.toFixed(2));
    op.custoReal.consumiveis = Number(somaConsumiveis.toFixed(2));
    op.custoReal.servicosExternos = Number(somaServicosExt.toFixed(2));
    op.custoReal.total = Number(
      (op.custoReal.materiais + op.custoReal.maoDeObra + op.custoReal.maquina + (op.custoReal.consumiveis || 0) + (op.custoReal.servicosExternos || 0) + op.custoReal.retrabalhos + op.custoReal.perdasRefugos).toFixed(2)
    );

    if (!op.dataInicioReal) {
      op.dataInicioReal = params.dataHoraInicio;
    }
    op.status = 'EM_PRODUCAO';
    op.atualizadoEm = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 10. Criação do Objeto de Apontamento com Custo Parametrizado
    const novoApontamento: ApontamentoProducao = {
      id: `apt-${Date.now()}`,
      opId: op.id,
      opNumero: op.numero,
      opOperacaoId: operacao.id,
      sequenciaOperacao: operacao.sequencia,
      nomeOperacao: operacao.nomeOperacao,
      tipoApontamento: params.tipoApontamento,
      dataHoraInicio: params.dataHoraInicio,
      dataHoraFim: params.dataHoraFim,
      duracaoMinutos: params.duracaoMinutos,
      operadorId: params.operadorId,
      operadorNome: operadorNome,
      maquinaId: params.maquinaId,
      maquinaNome: maquinaNome,
      operadorCustoHoraParametrizado: operadorCustoHora,
      maquinaCustoHoraParametrizado: maquinaCustoHora,
      quantidadeBoas: qtdBoas,
      quantidadeRefugo: qtdRefugo,
      quantidadeRetrabalho: qtdRetrabalho,
      materiaisConsumidos: materiaisRegistrados,
      custoMaoDeObraCalculado: custoMOD,
      custoMaquinaCalculado: custoCHM,
      custoMateriaisCalculado: custoMateriaisApontamento,
      custoConsumiveisCalculado: custoConsumiveisApt,
      custoServicosExternos: custoServExternosApt,
      custoTotalApontamento: custoTotalApontamento,
      detalhesCorte: params.detalhesCorte as ExtensaoCorteLaser,
      detalhesDobra: params.detalhesDobra as ExtensaoDobraCNC,
      detalhesSolda: params.detalhesSolda as ExtensaoSoldaCaldeiraria,
      detalhesPintura: params.detalhesPintura as ExtensaoPinturaAcabamento,
      detalhesMontagem: params.detalhesMontagem as ExtensaoMontagem,
      detalhesAcabamento: params.detalhesAcabamento as ExtensaoAcabamento,
      detalhesServicoExterno: params.detalhesServicoExterno as ExtensaoServicoExterno,
      observacoes: params.observacoes,
      empresaId: params.empresaId,
      criadoEm: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    this.apontamentos.unshift(novoApontamento);

    // Atualiza status do operador e máquina
    if (operador) {
      operador.status = 'DISPONIVEL';
      operador.opAtualNumero = op.numero;
    }
    if (maquina) {
      maquina.status = 'EM_PRODUCAO';
      maquina.opAtualNumero = op.numero;
      maquina.operacaoAtualNome = operacao.nomeOperacao;
    }

    return {
      apontamento: novoApontamento,
      opAtualizada: op,
      refugoGerado: refugoRegistro,
      retrabalhoGerado: retrabalhoRegistro,
    };
  }

  /**
   * Registro de Parada de Produção (Início)
   */
  public iniciarParada(params: {
    empresaId: string;
    maquinaId: string;
    operadorId: string;
    opId?: string;
    opOperacaoId?: string;
    motivoCategoria: MotivoParadaCategoria;
    motivoDescricao: string;
  }): ParadaProducao {
    const maquina = this.maquinas.find((m) => m.id === params.maquinaId);
    const operador = this.operadores.find((op) => op.id === params.operadorId);
    const op = params.opId ? this.ordens.find((o) => o.id === params.opId) : undefined;

    const novaParada: ParadaProducao = {
      id: `par-${Date.now()}`,
      opId: params.opId,
      opNumero: op?.numero,
      opOperacaoId: params.opOperacaoId,
      maquinaId: params.maquinaId,
      maquinaNome: maquina ? maquina.nome : 'Máquina',
      operadorId: params.operadorId,
      operadorNome: operador ? operador.nome : 'Operador',
      dataHoraInicio: new Date().toISOString().replace('T', ' ').substring(0, 19),
      duracaoMinutos: 0,
      motivoCategoria: params.motivoCategoria,
      motivoDescricao: params.motivoDescricao,
      status: 'EM_ANDAMENTO',
      impactoCustoEstimado: 0,
      empresaId: params.empresaId,
      criadoEm: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    if (maquina) {
      maquina.status = 'PARADA';
    }
    if (operador) {
      operador.status = 'INTERVALO';
    }

    this.paradas.unshift(novaParada);
    return novaParada;
  }

  /**
   * Finalização de Parada de Produção (Fim)
   */
  public finalizarParada(paradaId: string, empresaId: string, duracaoMinutosReal?: number): ParadaProducao {
    const parada = this.paradas.find((p) => p.id === paradaId && p.empresaId === empresaId);
    if (!parada) {
      throw new Error(`Parada não encontrada: ID ${paradaId}`);
    }

    parada.dataHoraFim = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // Cálculo do tempo decorrido
    if (duracaoMinutosReal !== undefined && duracaoMinutosReal > 0) {
      parada.duracaoMinutos = duracaoMinutosReal;
    } else {
      const inicio = new Date(parada.dataHoraInicio).getTime();
      const fim = new Date().getTime();
      parada.duracaoMinutos = Math.max(1, Math.round((fim - inicio) / (1000 * 60)));
    }

    const maquina = this.maquinas.find((m) => m.id === parada.maquinaId);
    const custoHora = maquina ? maquina.custoHora : 120.0;
    parada.impactoCustoEstimado = Number(((parada.duracaoMinutos / 60) * custoHora).toFixed(2));
    parada.status = 'FINALIZADA';

    if (maquina) {
      maquina.status = 'DISPONIVEL';
    }

    if (parada.opId && parada.opOperacaoId) {
      const op = this.ordens.find((o) => o.id === parada.opId);
      if (op) {
        const opOper = op.operacoes.find((oper) => oper.id === parada.opOperacaoId);
        if (opOper) {
          opOper.tempoParadasMinutos += parada.duracaoMinutos;
          opOper.tempoTotalRealMinutos += parada.duracaoMinutos;
        }
      }
    }

    return parada;
  }

  /**
   * Concluir Retrabalho
   */
  public concluirRetrabalho(params: {
    retrabalhoId: string;
    empresaId: string;
    tempoRealMinutos: number;
    custoReal: number;
    aprovadoQualidade: boolean;
  }): RetrabalhoProducao {
    const ret = this.retrabalhos.find((r) => r.id === params.retrabalhoId && r.empresaId === params.empresaId);
    if (!ret) {
      throw new Error(`Retrabalho não encontrado: ID ${params.retrabalhoId}`);
    }

    ret.tempoRealMinutos = params.tempoRealMinutos;
    ret.custoAdicionalReal = params.custoReal;
    ret.status = params.aprovadoQualidade ? 'CONCLUIDO' : 'REPROVADO_GEROU_REFUGO';

    // Atualiza custo de retrabalho na OP de origem
    const opOrigem = this.ordens.find((o) => o.id === ret.opOrigemId);
    if (opOrigem) {
      opOrigem.custoReal.retrabalhos += params.custoReal;
      opOrigem.custoReal.total += params.custoReal;
      
      const operOrigem = opOrigem.operacoes.find((o) => o.id === ret.opOperacaoOrigemId);
      if (operOrigem) {
        operOrigem.quantidadeEmRetrabalho = Math.max(0, operOrigem.quantidadeEmRetrabalho - ret.quantidadeRetrabalho);
        if (params.aprovadoQualidade) {
          operOrigem.quantidadeProduzidaBoas += ret.quantidadeRetrabalho;
        } else {
          operOrigem.quantidadeRefugada += ret.quantidadeRetrabalho;
        }
      }
    }

    return ret;
  }

  /**
   * REGRA ESTRITA DE ENCERRAMENTO DE OP
   * - Não permite encerrar OP com pendências sem uma regra explícita (Justificativa técnica + Autorização gerencial).
   * - Se tudo estiver concluído sem pendências, encerra normalmente como CONCLUIDA.
   */
  public encerrarOrdemProducao(params: {
    empresaId: string;
    opId: string;
    justificativaExplicita?: JustificativaEncerramentoOP;
  }): {
    op: OrdemProducaoCompleta;
    statusAnterior: string;
    novoStatus: string;
    pendenciasDetectadas: string[];
    teveJustificativaExplicita: boolean;
  } {
    const op = this.buscarOrdemPorId(params.opId, params.empresaId);
    if (!op) {
      throw new Error(`Ordem de Produção não encontrada: ID ${params.opId}`);
    }

    if (op.status === 'CONCLUIDA' || op.status === 'CANCELADA') {
      throw new Error(`Esta Ordem de Produção já está finalizada com status: ${op.status}`);
    }

    const pendencias: string[] = [];

    // 1. Checagem de saldo não concluído
    const totalConcluido = op.quantidadeProduzida + op.quantidadeRefugada;
    if (totalConcluido < op.quantidadePlanejada) {
      const saldoFaltante = op.quantidadePlanejada - totalConcluido;
      pendencias.push(
        `Saldo de peças não atendido: Planejado ${op.quantidadePlanejada}, Produzido/Refugado ${totalConcluido}. Faltam ${saldoFaltante} unidades.`
      );
    }

    // 2. Checagem de operações não concluídas
    for (const oper of op.operacoes) {
      if (oper.status !== 'CONCLUIDA' && oper.saldoOperacaoRestante > 0) {
        pendencias.push(
          `Operação Seq ${oper.sequencia} (${oper.nomeOperacao}) ainda está pendente/em andamento com saldo de ${oper.saldoOperacaoRestante} peças.`
        );
      }
    }

    // 3. Checagem de paradas abertas
    const paradasAbertas = this.paradas.filter((p) => p.opId === op.id && p.status === 'EM_ANDAMENTO');
    if (paradasAbertas.length > 0) {
      pendencias.push(`Existem ${paradasAbertas.length} parada(s) de produção em aberto para esta OP.`);
    }

    // 4. Checagem de retrabalhos pendentes
    const retrabalhosPendentes = this.retrabalhos.filter(
      (r) => r.opOrigemId === op.id && (r.status === 'PENDENTE' || r.status === 'EM_ANDAMENTO')
    );
    if (retrabalhosPendentes.length > 0) {
      pendencias.push(`Existem ${retrabalhosPendentes.length} retrabalho(s) pendente(s) de conclusão.`);
    }

    const statusAnterior = op.status;

    // REGRA DE VALIDAÇÃO MANDATÓRIA:
    if (pendencias.length > 0) {
      // Se há pendências, EXIGE justificativa explícita e autorização gerencial
      if (!params.justificativaExplicita) {
        throw new Error(
          `BLOQUEIO DE SEGURANÇA: Não é permitido encerrar a OP ${op.numero} com pendências sem uma REGRA EXPLÍCITA (justificativa técnica, motivo formal e autorização gerencial).\n\nPendências encontradas:\n- ${pendencias.join('\n- ')}`
        );
      }

      if (!params.justificativaExplicita.motivo || !params.justificativaExplicita.descricaoDetalhada || params.justificativaExplicita.descricaoDetalhada.trim().length < 10) {
        throw new Error(
          'Para encerramento forçado de OP com pendências, é obrigatório preencher o motivo formal e uma justificativa técnica detalhada (mínimo 10 caracteres).'
        );
      }

      if (!params.justificativaExplicita.autorizacaoGerencia) {
        throw new Error(
          'Encerramento de OP com pendências exige a confirmação explícita de autorização da gerência de produção / diretoria industrial.'
        );
      }

      // Encerramento parcial / forçado aprovado
      op.status = 'ENCERRADA_PARCIAL';
      op.justificativaEncerramento = {
        ...params.justificativaExplicita,
        saldoNaoAtendido: op.quantidadePlanejada - (op.quantidadeProduzida + op.quantidadeRefugada),
        dataHoraEncerramento: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
    } else {
      // Sem pendências -> Conclusão regular
      op.status = 'CONCLUIDA';
    }

    op.dataFimReal = new Date().toISOString().replace('T', ' ').substring(0, 19);
    op.atualizadoEm = new Date().toISOString().replace('T', ' ').substring(0, 19);

    return {
      op,
      statusAnterior,
      novoStatus: op.status,
      pendenciasDetectadas: pendencias,
      teveJustificativaExplicita: !!params.justificativaExplicita,
    };
  }

  /**
   * Estatísticas consolidada do Chão de Fábrica
   */
  public obterEstatisticas(empresaId: string) {
    const ops = this.listarOrdens(empresaId);
    const paradas = this.listarParadas(empresaId);
    const paradasAtivas = paradas.filter((p) => p.status === 'EM_ANDAMENTO');
    const refugos = this.listarRefugos(empresaId);
    const retrabalhos = this.listarRetrabalhos(empresaId);

    const totalOps = ops.length;
    const opsEmProducao = ops.filter((o) => o.status === 'EM_PRODUCAO').length;
    const opsLiberadas = ops.filter((o) => o.status === 'LIBERADA').length;
    const opsConcluidas = ops.filter((o) => o.status === 'CONCLUIDA' || o.status === 'ENCERRADA_PARCIAL').length;

    let totalPecasPlanejadas = 0;
    let totalPecasProduzidas = 0;
    let totalPecasRefugadas = 0;
    let custoTotalPlanejado = 0;
    let custoTotalReal = 0;

    for (const op of ops) {
      totalPecasPlanejadas += op.quantidadePlanejada;
      totalPecasProduzidas += op.quantidadeProduzida;
      totalPecasRefugadas += op.quantidadeRefugada;
      custoTotalPlanejado += op.custoPlanejado.total;
      custoTotalReal += op.custoReal.total;
    }

    const taxaRefugoGeral = totalPecasPlanejadas > 0 ? Number(((totalPecasRefugadas / totalPecasPlanejadas) * 100).toFixed(2)) : 0;
    const taxaAderenciaCusto = custoTotalPlanejado > 0 ? Number(((custoTotalReal / custoTotalPlanejado) * 100).toFixed(1)) : 0;

    return {
      totalOps,
      opsEmProducao,
      opsLiberadas,
      opsConcluidas,
      paradasAtivasCount: paradasAtivas.length,
      refugosTotalCount: refugos.length,
      retrabalhosPendentesCount: retrabalhos.filter((r) => r.status === 'PENDENTE' || r.status === 'EM_ANDAMENTO').length,
      totalPecasPlanejadas,
      totalPecasProduzidas,
      totalPecasRefugadas,
      taxaRefugoGeral,
      custoTotalPlanejado: Number(custoTotalPlanejado.toFixed(2)),
      custoTotalReal: Number(custoTotalReal.toFixed(2)),
      taxaAderenciaCusto,
      maquinasTotal: this.maquinas.length,
      maquinasParadasCount: this.maquinas.filter((m) => m.status === 'PARADA').length,
      operadoresAtivos: this.operadores.filter((o) => o.status === 'EM_OPERACAO').length,
    };
  }

  /**
   * Resumo Consolidado de Corte a Laser / Serra / Plasma
   */
  public obterResumoCorte(empresaId: string, opId?: string) {
    const ops = this.listarOrdens(empresaId, opId ? { busca: opId } : undefined);
    const cortes: Array<{
      opId: string;
      opNumero: string;
      produtoCodigo: string;
      operacaoId: string;
      operacaoNome: string;
      extensaoCorte: ExtensaoCorteLaser;
      status: string;
    }> = [];

    for (const op of ops) {
      for (const oper of op.operacoes) {
        if (oper.extensaoCorte) {
          cortes.push({
            opId: op.id,
            opNumero: op.numero,
            produtoCodigo: op.produtoCodigo,
            operacaoId: oper.id,
            operacaoNome: oper.nomeOperacao,
            extensaoCorte: oper.extensaoCorte,
            status: oper.status,
          });
        }
      }
    }

    return cortes;
  }

  /**
   * Resumo Consolidado de Dobra CNC
   */
  public obterResumoDobra(empresaId: string, opId?: string) {
    const ops = this.listarOrdens(empresaId, opId ? { busca: opId } : undefined);
    const dobras: Array<{
      opId: string;
      opNumero: string;
      produtoCodigo: string;
      operacaoId: string;
      operacaoNome: string;
      extensaoDobra: ExtensaoDobraCNC;
      status: string;
    }> = [];

    for (const op of ops) {
      for (const oper of op.operacoes) {
        if (oper.extensaoDobra) {
          dobras.push({
            opId: op.id,
            opNumero: op.numero,
            produtoCodigo: op.produtoCodigo,
            operacaoId: oper.id,
            operacaoNome: oper.nomeOperacao,
            extensaoDobra: oper.extensaoDobra,
            status: oper.status,
          });
        }
      }
    }

    return dobras;
  }

  /**
   * Análise Detalhada de Custo Parametrizado vs Real por Operação e Recursos
   */
  public obterAnaliseCustosParametrizados(empresaId: string, opId: string) {
    const op = this.buscarOrdemPorId(opId, empresaId);
    if (!op) {
      throw new Error(`Ordem de Produção não encontrada: ID ${opId}`);
    }

    const operacoesAnalise = op.operacoes.map((oper) => {
      const tempoPrevistoHoras = oper.tempoTotalPadraoMinutos / 60;
      const tempoRealHoras = oper.tempoTotalRealMinutos / 60;

      const custoMODPrevisto = Number((tempoPrevistoHoras * oper.custoHoraMaoDeObra).toFixed(2));
      const custoCHMPrevisto = Number((tempoPrevistoHoras * oper.custoHoraMaquina).toFixed(2));
      const custoTotalPrevisto = Number((custoMODPrevisto + custoCHMPrevisto).toFixed(2));

      const custoMODReal = oper.custoMaoDeObraReal;
      const custoCHMReal = oper.custoMaquinaReal;
      const custoConsumiveisReal = oper.custoConsumiveisReal || 0;
      const custoServicosExtReal = oper.custoServicosExternos || 0;
      const custoTotalReal = oper.custoTotalOperacaoReal;

      const variacaoValor = Number((custoTotalReal - custoTotalPrevisto).toFixed(2));
      const variacaoPercentual = custoTotalPrevisto > 0 ? Number(((variacaoValor / custoTotalPrevisto) * 100).toFixed(1)) : 0;

      return {
        operacaoId: oper.id,
        sequencia: oper.sequencia,
        nomeOperacao: oper.nomeOperacao,
        setor: oper.setor,
        maquinaNome: oper.maquinaNome,
        custoHoraParametrizadoMaquina: oper.custoHoraMaquina,
        custoHoraParametrizadoMaoDeObra: oper.custoHoraMaoDeObra,
        tempoPrevistoMinutos: oper.tempoTotalPadraoMinutos,
        tempoRealMinutos: oper.tempoTotalRealMinutos,
        custoMODPrevisto,
        custoCHMPrevisto,
        custoTotalPrevisto,
        custoMODReal,
        custoCHMReal,
        custoConsumiveisReal,
        custoServicosExtReal,
        custoTotalReal,
        variacaoValor,
        variacaoPercentual,
        status: oper.status,
      };
    });

    return {
      opId: op.id,
      opNumero: op.numero,
      produtoCodigo: op.produtoCodigo,
      produtoDescricao: op.produtoDescricao,
      quantidadePlanejada: op.quantidadePlanejada,
      custoPlanejadoTotal: op.custoPlanejado,
      custoRealTotal: op.custoReal,
      variacaoGeralCusto: Number((op.custoReal.total - op.custoPlanejado.total).toFixed(2)),
      operacoes: operacoesAnalise,
    };
  }
}

export const producaoService = new ProducaoService();
