import {
  Projeto,
  ProjetoRevisao,
  EstruturaProduto,
  EstruturaItem,
  Roteiro,
  RoteiroOperacao,
  ArquivoTecnico,
  OrdemProducaoVinculo,
  HistoricoEngenhariaEvento,
  ProjetoDetalhado,
} from './engenharia-types';

class EngenhariaService {
  private projetos: Projeto[] = [];
  private revisoes: ProjetoRevisao[] = [];
  private estruturas: EstruturaProduto[] = [];
  private roteiros: Roteiro[] = [];
  private arquivos: ArquivoTecnico[] = [];
  private ordensProducao: OrdemProducaoVinculo[] = [];
  private historico: HistoricoEngenhariaEvento[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const empresaTritech = '11111111-1111-1111-1111-111111111111'; // Tritech Metalúrgica
    const empresaMwam = '22222222-2222-2222-2222-222222222222'; // MWAM

    // ==========================================
    // PROJETO 1: Chassi Estrutural de Escavadeira
    // ==========================================
    const prj1Id = 'prj-chassi-escavadeira-2026';
    const rev0Id = 'rev-chassi-00';
    const rev1Id = 'rev-chassi-01';

    const projeto1: Projeto = {
      id: prj1Id,
      codigo: 'PRJ-2026-CHAS-01',
      titulo: 'Chassi Estrutural Reforçado para Escavadeira Hidráulica 22T',
      descricao:
        'Conjunto monobloco soldado em chapas de alta resistência SAE 1020 e ASTM A36, com reforços usinados para acoplamento de braço e esteiras.',
      clienteId: 'cli-caterpillar-br',
      clienteNome: 'Caterpillar Brasil Equipamentos Pesados',
      responsavelNome: 'Eng. Gabriel Vasconcelos (CREA-SP 506.882)',
      categoria: 'CHASSI_VEICULAR',
      status: 'EM_PRODUCAO',
      empresaId: empresaTritech,
      dataCriacao: '2026-01-15T08:30:00.000Z',
      dataAtualizacao: '2026-02-20T14:10:00.000Z',
      revisaoAtivaId: rev1Id,
      revisaoAtivaVersao: 'Rev 01',
      custoTotalEstimadoRevisaoAtiva: 18450.0,
      tempoTotalFabricacaoMinutosRevisaoAtiva: 410,
      pesoTotalEstimadoKgRevisaoAtiva: 1420.5,
    };

    // Revisão 00 (Histórica / Obsoleta)
    const revisao0: ProjetoRevisao = {
      id: rev0Id,
      projetoId: prj1Id,
      versao: 'Rev 00',
      numeroSequencial: 0,
      descricaoModificacoes: 'Projeto preliminar para validação do protótipo funcional.',
      motivoRevisao: 'Emissão inicial para homologação e testes de fadiga.',
      status: 'OBSOLETA',
      ativa: false,
      dataCriacao: '2026-01-15T08:30:00.000Z',
      dataLiberacao: '2026-01-20T10:00:00.000Z',
      liberadoPor: 'Diretoria de Engenharia & Qualidade',
      criadoPor: 'Eng. Gabriel Vasconcelos',
      empresaId: empresaTritech,
    };

    // Revisão 01 (Ativa / Vigente com alteração de reforço de solda)
    const revisao1: ProjetoRevisao = {
      id: rev1Id,
      projetoId: prj1Id,
      versao: 'Rev 01',
      numeroSequencial: 1,
      descricaoModificacoes:
        'Aumento da espessura das nervuras inferiores de 6.35mm para 8.00mm e alteração no chanfro de soldagem para eliminar tensão residual.',
      motivoRevisao: 'Relatório RNC-ENG-2026-012 após ensaio de ultrassom.',
      status: 'ATIVA',
      ativa: true,
      dataCriacao: '2026-02-15T09:00:00.000Z',
      dataLiberacao: '2026-02-20T14:00:00.000Z',
      liberadoPor: 'Diretoria de Engenharia & Qualidade',
      criadoPor: 'Eng. Gabriel Vasconcelos',
      parecerAprovacao: 'Aprovado pelo comitê de engenharia mecânica após simulação por elementos finitos (FEA).',
      empresaId: empresaTritech,
    };

    // BOM da Rev 00 (Imutável no passado)
    const est0Id = 'est-bom-chassi-rev00';
    const estruturaRev0: EstruturaProduto = {
      id: est0Id,
      projetoId: prj1Id,
      revisaoId: rev0Id,
      codigoEstrutura: 'BOM-CHAS-01-R00',
      versao: 'Rev 00',
      descricao: 'Lista de Materiais - Chassi Protótipo',
      dataValidadeInicio: '2026-01-20',
      custoTotalEstimado: 16800.0,
      pesoTotalEstimadoKg: 1380.0,
      empresaId: empresaTritech,
      itens: [
        {
          id: 'item-bom-0-1',
          estruturaId: est0Id,
          itemSequencia: 10,
          produtoId: 'prod-chapa-1020-475',
          codigo: 'MP-CH-1020-4.75',
          descricao: 'Chapa Aço SAE 1020 4.75mm x 1500 x 6000mm',
          tipoItem: 'MATERIA_PRIMA',
          quantidadeLiquida: 4,
          unidadeMedida: 'CHAPA',
          percentualPerda: 8.5,
          quantidadeBruta: 4.34,
          nestingOuCorteInfo: 'Nesting Laser #01 - Aproveitamento 91.5%',
          custoUnitarioEstimado: 1150.0,
          custoTotalItem: 4991.0,
          pesoUnitarioKg: 335.5,
          pesoTotalKg: 1456.07,
          observacoesTecnicas: 'Corte a laser com furos de fixação',
        },
        {
          id: 'item-bom-0-2',
          estruturaId: est0Id,
          itemSequencia: 20,
          produtoId: 'prod-chapa-a36-635',
          codigo: 'MP-CH-A36-6.35',
          descricao: 'Chapa Aço ASTM A36 6.35mm x 1500 x 6000mm',
          tipoItem: 'MATERIA_PRIMA',
          quantidadeLiquida: 3,
          unidadeMedida: 'CHAPA',
          percentualPerda: 10.0,
          quantidadeBruta: 3.3,
          nestingOuCorteInfo: 'Nesting Laser #02 - Nervuras estruturais',
          custoUnitarioEstimado: 1450.0,
          custoTotalItem: 4785.0,
          pesoUnitarioKg: 448.8,
          pesoTotalKg: 1481.04,
          observacoesTecnicas: 'Nervuras laterais',
        },
      ],
    };

    // BOM da Rev 01 (Vigente / Ativa com itens reforçados)
    const est1Id = 'est-bom-chassi-rev01';
    const estruturaRev1: EstruturaProduto = {
      id: est1Id,
      projetoId: prj1Id,
      revisaoId: rev1Id,
      codigoEstrutura: 'BOM-CHAS-01-R01',
      versao: 'Rev 01',
      descricao: 'Lista de Materiais - Chassi Reforçado para Produção Seriada',
      dataValidadeInicio: '2026-02-20',
      custoTotalEstimado: 18450.0,
      pesoTotalEstimadoKg: 1420.5,
      empresaId: empresaTritech,
      itens: [
        {
          id: 'item-bom-1-1',
          estruturaId: est1Id,
          itemSequencia: 10,
          produtoId: 'prod-chapa-1020-475',
          codigo: 'MP-CH-1020-4.75',
          descricao: 'Chapa Aço SAE 1020 4.75mm (3/16") x 1500 x 6000mm',
          tipoItem: 'MATERIA_PRIMA',
          quantidadeLiquida: 4,
          unidadeMedida: 'CHAPA',
          percentualPerda: 7.5,
          quantidadeBruta: 4.3,
          nestingOuCorteInfo: 'Nesting Laser Otimizado v2 - Aproveitamento 92.5%',
          custoUnitarioEstimado: 1150.0,
          custoTotalItem: 4945.0,
          pesoUnitarioKg: 335.5,
          pesoTotalKg: 1442.65,
          observacoesTecnicas: 'Corte a laser com tolerância ISO 9013 classe 1',
        },
        {
          id: 'item-bom-1-2',
          estruturaId: est1Id,
          itemSequencia: 20,
          produtoId: 'prod-chapa-a36-800',
          codigo: 'MP-CH-A36-8.00',
          descricao: 'Chapa Aço Estrutural ASTM A36 8.00mm (5/16") x 1500 x 6000mm',
          tipoItem: 'MATERIA_PRIMA',
          quantidadeLiquida: 3,
          unidadeMedida: 'CHAPA',
          percentualPerda: 9.0,
          quantidadeBruta: 3.27,
          nestingOuCorteInfo: 'Nesting Laser Otimizado v2 - Nervuras Reforçadas',
          custoUnitarioEstimado: 1780.0,
          custoTotalItem: 5820.6,
          pesoUnitarioKg: 565.2,
          pesoTotalKg: 1848.2,
          observacoesTecnicas: 'Nervuras inferiores e suporte de esteira',
        },
        {
          id: 'item-bom-1-3',
          estruturaId: est1Id,
          itemSequencia: 30,
          produtoId: 'prod-tubo-quad-100',
          codigo: 'MP-TB-100x100-6.3',
          descricao: 'Tubo Estrutural Quadrado SAE 1020 100x100x6.35mm (Barra 6m)',
          tipoItem: 'MATERIA_PRIMA',
          quantidadeLiquida: 2,
          unidadeMedida: 'BARRA',
          percentualPerda: 4.0,
          quantidadeBruta: 2.08,
          nestingOuCorteInfo: 'Corte serra fita com ângulo 45°',
          custoUnitarioEstimado: 890.0,
          custoTotalItem: 1851.2,
          pesoUnitarioKg: 112.5,
          pesoTotalKg: 234.0,
          observacoesTecnicas: 'Travessas de torção do chassi',
        },
        {
          id: 'item-bom-1-4',
          estruturaId: est1Id,
          itemSequencia: 40,
          produtoId: 'prod-arame-solda-er70s',
          codigo: 'CON-SOLD-ER70S-1.2',
          descricao: 'Arame de Solda Mig/Mag ER70S-6 Ø1.2mm (Carretel 18kg)',
          tipoItem: 'CONSUMIVEL',
          quantidadeLiquida: 3,
          unidadeMedida: 'UN',
          percentualPerda: 12.0,
          quantidadeBruta: 3.36,
          nestingOuCorteInfo: 'Deposição de cordão contínuo AWS D1.1',
          custoUnitarioEstimado: 245.0,
          custoTotalItem: 823.2,
          pesoUnitarioKg: 18.0,
          pesoTotalKg: 60.48,
          observacoesTecnicas: 'Soldagem multipasse com gás Ar+CO2',
        },
        {
          id: 'item-bom-1-5',
          estruturaId: est1Id,
          itemSequencia: 50,
          produtoId: 'prod-bucha-usinada-brz',
          codigo: 'SUB-BC-BRZ-80',
          descricao: 'Bucha de Mancal Usinada em Bronze TM-23 Ø80x120mm',
          tipoItem: 'SUB_CONJUNTO',
          quantidadeLiquida: 4,
          unidadeMedida: 'PC',
          percentualPerda: 0.0,
          quantidadeBruta: 4,
          nestingOuCorteInfo: 'Usinado no torno CNC',
          custoUnitarioEstimado: 410.0,
          custoTotalItem: 1640.0,
          pesoUnitarioKg: 8.5,
          pesoTotalKg: 34.0,
          observacoesTecnicas: 'Ponto de articulação do braço hidráulico',
        },
      ],
    };

    // Roteiro de Fabricação da Rev 01
    const rot1Id = 'rot-chassi-rev01';
    const roteiroRev1: Roteiro = {
      id: rot1Id,
      projetoId: prj1Id,
      revisaoId: rev1Id,
      codigoRoteiro: 'ROT-CHAS-01-R01',
      versao: 'Rev 01',
      descricao: 'Roteiro de Fabricação Industrial - Chassi Reforçado',
      tempoPreparacaoTotalMinutos: 90,
      tempoOperacaoTotalMinutos: 320,
      tempoTotalPadraoMinutos: 410,
      custoTotalMaoDeObra: 3850.0,
      empresaId: empresaTritech,
      operacoes: [
        {
          id: 'op-10',
          roteiroId: rot1Id,
          sequencia: 10,
          operacaoNome: 'Corte a Laser Fibra Óptica',
          setor: 'CORTE_LASER',
          maquina: 'Laser Trumpf TruLaser 3030 4kW',
          ferramenta: 'Bico 1.5mm / Oxigênio 0.6 bar',
          tempoPreparacaoMinutos: 25,
          tempoOperacaoMinutos: 65,
          tempoPadraoTotalMinutos: 90,
          custoHoraMaquina: 380.0,
          custoTotalOperacao: 570.0,
          instrucaoTecnica: 'Carregar programa CAM PRJ-CHAS-R01-P1.nc no CNC. Verificar pureza do gás.',
          desenhosOuFotosRef: 'DES-CORTE-LASER-01.pdf',
          exigeInspecaoQualidade: true,
        },
        {
          id: 'op-20',
          roteiroId: rot1Id,
          sequencia: 20,
          operacaoNome: 'Dobra CNC 4 Eixos',
          setor: 'DOBRA_CNC',
          maquina: 'Dobradeira Hidráulica Bystronic Xpert 150T',
          ferramenta: 'Matriz V16mm / Punção Raio R2.0',
          tempoPreparacaoMinutos: 20,
          tempoOperacaoMinutos: 45,
          tempoPadraoTotalMinutos: 65,
          custoHoraMaquina: 240.0,
          custoTotalOperacao: 260.0,
          instrucaoTecnica: 'Compensar retorno elástico em 1.5°. Conferir ângulo de 90° com goniômetro digital.',
          desenhosOuFotosRef: 'DES-DOBRA-02.pdf',
          exigeInspecaoQualidade: true,
        },
        {
          id: 'op-30',
          roteiroId: rot1Id,
          sequencia: 30,
          operacaoNome: 'Soldagem MIG/MAG Estrutural em Gabarito',
          setor: 'CALDEIRARIA_SOLDA',
          maquina: 'Célula de Solda Fronius TPS 400i Pulse',
          ferramenta: 'Tocha Refrigerada a Água / Arame ER70S-6 1.2mm',
          tempoPreparacaoMinutos: 30,
          tempoOperacaoMinutos: 140,
          tempoPadraoTotalMinutos: 170,
          custoHoraMaquina: 180.0,
          custoTotalOperacao: 510.0,
          instrucaoTecnica: 'Fixar componentes no gabarito hidráulico GAB-CHAS-01. Soldagem multipasse chanfro K.',
          desenhosOuFotosRef: 'DES-SOLDA-03.pdf',
          exigeInspecaoQualidade: true,
        },
        {
          id: 'op-40',
          roteiroId: rot1Id,
          sequencia: 40,
          operacaoNome: 'Usinagem CNC de Alojamento de Buchas',
          setor: 'USINAGEM',
          maquina: 'Centro de Usinagem Vertical Romi D800',
          ferramenta: 'Mandril de Precisão Ø80mm H7 / Fresa Metal Duro',
          tempoPreparacaoMinutos: 35,
          tempoOperacaoMinutos: 50,
          tempoPadraoTotalMinutos: 85,
          custoHoraMaquina: 320.0,
          custoTotalOperacao: 453.33,
          instrucaoTecnica: 'Tolerância dimensional H7 (+0.030 / 0.000). Rugosidade máxima Ra 1.6.',
          desenhosOuFotosRef: 'DES-USINAGEM-04.pdf',
          exigeInspecaoQualidade: true,
        },
        {
          id: 'op-50',
          roteiroId: rot1Id,
          sequencia: 50,
          operacaoNome: 'Pintura Eletrostática a Pó e Cura em Estufa',
          setor: 'PINTURA_TRATAMENTO',
          maquina: 'Linha Contínua de Pintura a Pó Gema / Estufa 200°C',
          ferramenta: 'Pistola Eletrostática Corona / Tinta Epóxi Amarelo Trator',
          tempoPreparacaoMinutos: 15,
          tempoOperacaoMinutos: 40,
          tempoPadraoTotalMinutos: 55,
          custoHoraMaquina: 210.0,
          custoTotalOperacao: 192.5,
          instrucaoTecnica: 'Desengraxe e fosfatização prévia. Espessura de camada de tinta seca mínima 120µm.',
          desenhosOuFotosRef: 'DES-PINTURA-05.pdf',
          exigeInspecaoQualidade: false,
        },
      ],
    };

    // Arquivos Técnicos vinculados por Projeto e Revisão
    const arquivosIniciais: ArquivoTecnico[] = [
      {
        id: 'arq-01',
        projetoId: prj1Id,
        revisaoId: rev1Id,
        revisaoVersao: 'Rev 01',
        nomeArquivo: 'PRJ-CHAS-2026-CONJUNTO-GERAL-R01.pdf',
        tipo: 'DESENHO_2D',
        formato: 'PDF',
        tamanhoBytes: 3450000,
        tamanhoFormatado: '3.45 MB',
        url: '/storage/desenhos/PRJ-CHAS-2026-CONJUNTO-GERAL-R01.pdf',
        hashMd5: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c',
        autor: 'Eng. Gabriel Vasconcelos',
        dataUpload: '2026-02-16T11:20:00.000Z',
        observacoes: 'Desenho de conjunto aprovado para fabricação seriada.',
        empresaId: empresaTritech,
      },
      {
        id: 'arq-02',
        projetoId: prj1Id,
        revisaoId: rev1Id,
        revisaoVersao: 'Rev 01',
        nomeArquivo: 'CHASSI_ESTRUTURAL_3D_ASSEMBLY_R01.step',
        tipo: 'MODELO_3D',
        formato: 'STEP',
        tamanhoBytes: 28400000,
        tamanhoFormatado: '28.4 MB',
        url: '/storage/modelos/CHASSI_ESTRUTURAL_3D_ASSEMBLY_R01.step',
        hashMd5: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
        autor: 'Eng. Gabriel Vasconcelos',
        dataUpload: '2026-02-16T11:25:00.000Z',
        observacoes: 'Modelo CAD 3D completo com nervuras reforçadas.',
        empresaId: empresaTritech,
      },
      {
        id: 'arq-03',
        projetoId: prj1Id,
        revisaoId: rev1Id,
        revisaoVersao: 'Rev 01',
        nomeArquivo: 'MEMORIAL_CALCULO_ESTRUTURAL_FEA_R01.pdf',
        tipo: 'MEMORIAL_CALCULO',
        formato: 'PDF',
        tamanhoBytes: 5200000,
        tamanhoFormatado: '5.20 MB',
        url: '/storage/documentos/MEMORIAL_CALCULO_ESTRUTURAL_FEA_R01.pdf',
        hashMd5: 'e1d2c3b4a5f60718293a4b5c6d7e8f90',
        autor: 'Eng. Gabriel Vasconcelos',
        dataUpload: '2026-02-17T09:40:00.000Z',
        observacoes: 'Análise de tensões de Von Mises sob carga dinâmica de 450 kN.',
        empresaId: empresaTritech,
      },
      {
        id: 'arq-04',
        projetoId: prj1Id,
        revisaoId: rev0Id,
        revisaoVersao: 'Rev 00',
        nomeArquivo: 'PRJ-CHAS-2026-PROTOTIPO-R00.pdf',
        tipo: 'DESENHO_2D',
        formato: 'PDF',
        tamanhoBytes: 3100000,
        tamanhoFormatado: '3.10 MB',
        url: '/storage/desenhos/PRJ-CHAS-2026-PROTOTIPO-R00.pdf',
        hashMd5: '55aa33bb77cc99dd11ee22ff44006688',
        autor: 'Eng. Gabriel Vasconcelos',
        dataUpload: '2026-01-15T09:00:00.000Z',
        observacoes: 'Desenho protótipo (Rev 00 histórica).',
        empresaId: empresaTritech,
      },
    ];

    // Rastreabilidade de Ordem de Produção (OP)
    const opVinculos: OrdemProducaoVinculo[] = [
      {
        id: 'op-vinc-01',
        numeroOp: 'OP-2026-0045',
        projetoId: prj1Id,
        projetoCodigo: projeto1.codigo,
        projetoTitulo: projeto1.titulo,
        revisaoId: rev0Id,
        revisaoVersao: 'Rev 00', // OP histórica produzida na Rev 00
        dataSnapshotBOM: '2026-01-22T08:00:00.000Z',
        statusOp: 'CONCLUIDA',
        quantidadeProduzir: 1,
        dataLiberacao: '2026-01-22',
        empresaId: empresaTritech,
      },
      {
        id: 'op-vinc-02',
        numeroOp: 'OP-2026-0120',
        projetoId: prj1Id,
        projetoCodigo: projeto1.codigo,
        projetoTitulo: projeto1.titulo,
        revisaoId: rev1Id,
        revisaoVersao: 'Rev 01', // OP de produção seriada atual na Rev 01
        dataSnapshotBOM: '2026-02-22T08:00:00.000Z',
        statusOp: 'EM_PRODUCAO',
        quantidadeProduzir: 5,
        dataLiberacao: '2026-02-22',
        empresaId: empresaTritech,
      },
    ];

    // Histórico de Eventos
    const historicoInicial: HistoricoEngenhariaEvento[] = [
      {
        id: 'hist-01',
        projetoId: prj1Id,
        tipoEvento: 'CRIACAO_PROJETO',
        descricao: 'Projeto criado no sistema de engenharia para atendimento à Caterpillar.',
        usuarioNome: 'Eng. Gabriel Vasconcelos',
        dataHora: '2026-01-15T08:30:00.000Z',
        empresaId: empresaTritech,
      },
      {
        id: 'hist-02',
        projetoId: prj1Id,
        revisaoId: rev0Id,
        revisaoVersao: 'Rev 00',
        tipoEvento: 'APROVACAO_REVISAO',
        descricao: 'Revisão Rev 00 liberada para fabricação do lote protótipo.',
        usuarioNome: 'Diretoria de Engenharia & Qualidade',
        dataHora: '2026-01-20T10:00:00.000Z',
        empresaId: empresaTritech,
      },
      {
        id: 'hist-03',
        projetoId: prj1Id,
        revisaoId: rev0Id,
        revisaoVersao: 'Rev 00',
        tipoEvento: 'VINCULO_ORDEM_PRODUCAO',
        descricao: 'Ordem de Produção OP-2026-0045 gerada apontando para a Rev 00.',
        usuarioNome: 'PCP Fábrica',
        dataHora: '2026-01-22T08:00:00.000Z',
        empresaId: empresaTritech,
        detalhes: { numeroOp: 'OP-2026-0045', quantidade: 1 },
      },
      {
        id: 'hist-04',
        projetoId: prj1Id,
        revisaoId: rev1Id,
        revisaoVersao: 'Rev 01',
        tipoEvento: 'CRIACAO_REVISAO',
        descricao: 'Nova revisão Rev 01 criada clonando estrutura e roteiro da Rev 00 para reforço de nervuras.',
        usuarioNome: 'Eng. Gabriel Vasconcelos',
        dataHora: '2026-02-15T09:00:00.000Z',
        empresaId: empresaTritech,
      },
      {
        id: 'hist-05',
        projetoId: prj1Id,
        revisaoId: rev1Id,
        revisaoVersao: 'Rev 01',
        tipoEvento: 'ATIVACAO_REVISAO',
        descricao: 'Revisão Rev 01 ativada como VIGENTE. Revisão Rev 00 tornou-se OBSOLETA automaticamente.',
        usuarioNome: 'Diretoria de Engenharia & Qualidade',
        dataHora: '2026-02-20T14:00:00.000Z',
        empresaId: empresaTritech,
      },
      {
        id: 'hist-06',
        projetoId: prj1Id,
        revisaoId: rev1Id,
        revisaoVersao: 'Rev 01',
        tipoEvento: 'VINCULO_ORDEM_PRODUCAO',
        descricao: 'Ordem de Produção OP-2026-0120 gerada apontando para a Rev 01 com snapshot imutável do BOM.',
        usuarioNome: 'PCP Fábrica',
        dataHora: '2026-02-22T08:00:00.000Z',
        empresaId: empresaTritech,
        detalhes: { numeroOp: 'OP-2026-0120', quantidade: 5 },
      },
    ];

    // ==========================================
    // PROJETO 2: Silo Reservatório em Aço Inox
    // ==========================================
    const prj2Id = 'prj-silo-inox-2026';
    const revSilo0Id = 'rev-silo-00';
    const projeto2: Projeto = {
      id: prj2Id,
      codigo: 'PRJ-2026-SILO-02',
      titulo: 'Silo Vertical Calandrado em Aço Inox 304L - Capacidade 50.000L',
      descricao:
        'Reservatório vertical para indústria alimentícia com camisa dupla de aquecimento e fundo cônico a 60°.',
      clienteId: 'cli-nestle-br',
      clienteNome: 'Nestlé Brasil Indústria de Alimentos',
      responsavelNome: 'Eng. Carlos Eduardo Prado (CREA-MG 104.221)',
      categoria: 'RESERVATORIO_SILO',
      status: 'EM_DESENVOLVIMENTO',
      empresaId: empresaMwam,
      dataCriacao: '2026-02-01T10:00:00.000Z',
      dataAtualizacao: '2026-02-24T16:30:00.000Z',
      revisaoAtivaId: revSilo0Id,
      revisaoAtivaVersao: 'Rev 00',
      custoTotalEstimadoRevisaoAtiva: 34200.0,
      tempoTotalFabricacaoMinutosRevisaoAtiva: 580,
      pesoTotalEstimadoKgRevisaoAtiva: 2150.0,
    };

    const revisaoSilo0: ProjetoRevisao = {
      id: revSilo0Id,
      projetoId: prj2Id,
      versao: 'Rev 00',
      numeroSequencial: 0,
      descricaoModificacoes: 'Projeto estrutural inicial com cálculo ASME Seção VIII Divisão 1.',
      motivoRevisao: 'Aprovação de fabricação junto ao cliente.',
      status: 'ATIVA',
      ativa: true,
      dataCriacao: '2026-02-01T10:00:00.000Z',
      dataLiberacao: '2026-02-10T15:00:00.000Z',
      liberadoPor: 'Diretoria Técnica MWAM',
      criadoPor: 'Eng. Carlos Eduardo Prado',
      empresaId: empresaMwam,
    };

    const estSilo0Id = 'est-bom-silo-rev00';
    const estruturaSilo0: EstruturaProduto = {
      id: estSilo0Id,
      projetoId: prj2Id,
      revisaoId: revSilo0Id,
      codigoEstrutura: 'BOM-SILO-02-R00',
      versao: 'Rev 00',
      descricao: 'Estrutura de Materiais Silo Inox 50kL',
      dataValidadeInicio: '2026-02-10',
      custoTotalEstimado: 34200.0,
      pesoTotalEstimadoKg: 2150.0,
      empresaId: empresaMwam,
      itens: [
        {
          id: 'item-silo-1',
          estruturaId: estSilo0Id,
          itemSequencia: 10,
          produtoId: 'prod-chapa-inox-304-300',
          codigo: 'MP-CH-INX-304-3.0',
          descricao: 'Chapa Aço Inox 304L 3.00mm 2B x 1500 x 3000mm',
          tipoItem: 'MATERIA_PRIMA',
          quantidadeLiquida: 12,
          unidadeMedida: 'CHAPA',
          percentualPerda: 6.0,
          quantidadeBruta: 12.72,
          nestingOuCorteInfo: 'Calandragem de anéis cilíndricos R=1500mm',
          custoUnitarioEstimado: 2100.0,
          custoTotalItem: 26712.0,
          pesoUnitarioKg: 108.0,
          pesoTotalKg: 1373.76,
          observacoesTecnicas: 'Polimento sanitário interno Grana 220',
        },
      ],
    };

    const rotSilo0Id = 'rot-silo-rev00';
    const roteiroSilo0: Roteiro = {
      id: rotSilo0Id,
      projetoId: prj2Id,
      revisaoId: revSilo0Id,
      codigoRoteiro: 'ROT-SILO-02-R00',
      versao: 'Rev 00',
      descricao: 'Processo de Calandragem e Soldagem TIG Sanitária',
      tempoPreparacaoTotalMinutos: 120,
      tempoOperacaoTotalMinutos: 460,
      tempoTotalPadraoMinutos: 580,
      custoTotalMaoDeObra: 7488.0,
      empresaId: empresaMwam,
      operacoes: [
        {
          id: 'op-silo-10',
          roteiroId: rotSilo0Id,
          sequencia: 10,
          operacaoNome: 'Calandragem de Chapas de Inox 304L',
          setor: 'CALDEIRARIA_SOLDA',
          maquina: 'Calandra Hidráulica 4 Rolos Faccin 2000mm',
          ferramenta: 'Rolos Revestidos com Poliuretano anti-contaminação',
          tempoPreparacaoMinutos: 40,
          tempoOperacaoMinutos: 180,
          tempoPadraoTotalMinutos: 220,
          custoHoraMaquina: 280.0,
          custoTotalOperacao: 1026.67,
          instrucaoTecnica: 'Garantir circularidade com gabarito de raio.',
          exigeInspecaoQualidade: true,
        },
      ],
    };

    // Salvar no estado interno
    this.projetos = [projeto1, projeto2];
    this.revisoes = [revisao0, revisao1, revisaoSilo0];
    this.estruturas = [estruturaRev0, estruturaRev1, estruturaSilo0];
    this.roteiros = [roteiroRev1, roteiroSilo0];
    this.arquivos = arquivosIniciais;
    this.ordensProducao = opVinculos;
    this.historico = historicoInicial;
  }

  // =========================================================================
  // PROJETOS (CRUD & CONSULTA)
  // =========================================================================
  public listarProjetos(empresaId: string, filtroStatus?: string): Projeto[] {
    return this.projetos
      .filter((p) => p.empresaId === empresaId)
      .filter((p) => !filtroStatus || filtroStatus === 'TODOS' || p.status === filtroStatus)
      .sort((a, b) => new Date(b.dataAtualizacao).getTime() - new Date(a.dataAtualizacao).getTime());
  }

  public obterProjetoPorId(empresaId: string, projetoId: string): Projeto | null {
    return this.projetos.find((p) => p.empresaId === empresaId && p.id === projetoId) || null;
  }

  public obterProjetoDetalhado(empresaId: string, projetoId: string, revisaoIdOpcional?: string): ProjetoDetalhado | null {
    const projeto = this.obterProjetoPorId(empresaId, projetoId);
    if (!projeto) return null;

    const revisoes = this.revisoes
      .filter((r) => r.empresaId === empresaId && r.projetoId === projetoId)
      .sort((a, b) => b.numeroSequencial - a.numeroSequencial);

    const revisaoAtiva = revisoes.find((r) => r.ativa) || null;

    // Se nenhuma revisão específica for solicitada, usa a revisão ativa, ou a mais recente
    const revisaoSelecionada = revisaoIdOpcional
      ? revisoes.find((r) => r.id === revisaoIdOpcional) || revisaoAtiva || revisoes[0] || null
      : revisaoAtiva || revisoes[0] || null;

    const estruturaBOM = revisaoSelecionada
      ? this.estruturas.find((e) => e.revisaoId === revisaoSelecionada.id) || null
      : null;

    const roteiro = revisaoSelecionada
      ? this.roteiros.find((rt) => rt.revisaoId === revisaoSelecionada.id) || null
      : null;

    const arquivos = this.arquivos.filter(
      (a) => a.empresaId === empresaId && a.projetoId === projetoId && (!revisaoSelecionada || a.revisaoId === revisaoSelecionada.id)
    );

    const ordensProducao = this.ordensProducao.filter(
      (op) => op.empresaId === empresaId && op.projetoId === projetoId
    );

    const historico = this.historico
      .filter((h) => h.empresaId === empresaId && h.projetoId === projetoId)
      .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());

    return {
      projeto,
      revisoes,
      revisaoAtiva,
      revisaoSelecionada,
      estruturaBOM,
      roteiro,
      arquivos,
      ordensProducao,
      historico,
    };
  }

  public criarProjeto(
    empresaId: string,
    dados: {
      codigo: string;
      titulo: string;
      descricao: string;
      clienteId?: string;
      clienteNome: string;
      responsavelNome: string;
      categoria: any;
      itensIniciaisBOM?: Array<{
        codigo: string;
        descricao: string;
        tipoItem: any;
        quantidadeLiquida: number;
        unidadeMedida: string;
        percentualPerda: number;
        custoUnitarioEstimado: number;
        pesoUnitarioKg: number;
        nestingOuCorteInfo?: string;
        observacoesTecnicas?: string;
      }>;
      operacoesIniciaisRoteiro?: Array<{
        sequencia: number;
        operacaoNome: string;
        setor: any;
        maquina: string;
        ferramenta: string;
        tempoPreparacaoMinutos: number;
        tempoOperacaoMinutos: number;
        custoHoraMaquina: number;
        instrucaoTecnica: string;
      }>;
    }
  ): ProjetoDetalhado {
    const projetoId = `prj-${dados.codigo.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${crypto.randomUUID().slice(0, 6)}`;
    const rev0Id = `rev-${projetoId}-00`;
    const est0Id = `est-bom-${projetoId}-00`;
    const rot0Id = `rot-${projetoId}-00`;
    const dataAgora = new Date().toISOString();

    // 1. Criar Revisão Rev 00 Ativa
    const revisao0: ProjetoRevisao = {
      id: rev0Id,
      projetoId,
      versao: 'Rev 00',
      numeroSequencial: 0,
      descricaoModificacoes: 'Emissão inicial da documentação de engenharia.',
      motivoRevisao: 'Cadastro e liberação inicial do projeto.',
      status: 'ATIVA',
      ativa: true,
      dataCriacao: dataAgora,
      dataLiberacao: dataAgora,
      liberadoPor: dados.responsavelNome,
      criadoPor: dados.responsavelNome,
      empresaId,
    };

    // 2. Criar Estrutura de Produto (BOM) inicial
    let custoTotalEstimadoBOM = 0;
    let pesoTotalEstimadoBOM = 0;

    const itensBOM: EstruturaItem[] = (dados.itensIniciaisBOM || []).map((it, idx) => {
      const perda = it.percentualPerda || 0;
      const quantLiquida = it.quantidadeLiquida || 1;
      const quantBruta = Number((quantLiquida * (1 + perda / 100)).toFixed(4));
      const custoUnit = it.custoUnitarioEstimado || 0;
      const custoTot = Number((quantBruta * custoUnit).toFixed(2));
      const pesoUnit = it.pesoUnitarioKg || 0;
      const pesoTot = Number((quantBruta * pesoUnit).toFixed(2));

      custoTotalEstimadoBOM += custoTot;
      pesoTotalEstimadoBOM += pesoTot;

      return {
        id: `item-bom-${crypto.randomUUID().slice(0, 8)}`,
        estruturaId: est0Id,
        itemSequencia: (idx + 1) * 10,
        produtoId: `prod-${it.codigo.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        codigo: it.codigo,
        descricao: it.descricao,
        tipoItem: it.tipoItem,
        quantidadeLiquida: quantLiquida,
        unidadeMedida: it.unidadeMedida,
        percentualPerda: perda,
        quantidadeBruta: quantBruta,
        nestingOuCorteInfo: it.nestingOuCorteInfo,
        custoUnitarioEstimado: custoUnit,
        custoTotalItem: custoTot,
        pesoUnitarioKg: pesoUnit,
        pesoTotalKg: pesoTot,
        observacoesTecnicas: it.observacoesTecnicas,
      };
    });

    const estrutura0: EstruturaProduto = {
      id: est0Id,
      projetoId,
      revisaoId: rev0Id,
      codigoEstrutura: `BOM-${dados.codigo}-R00`,
      versao: 'Rev 00',
      descricao: `Estrutura de Materiais - ${dados.titulo}`,
      dataValidadeInicio: dataAgora.split('T')[0],
      custoTotalEstimado: Number(custoTotalEstimadoBOM.toFixed(2)),
      pesoTotalEstimadoKg: Number(pesoTotalEstimadoBOM.toFixed(2)),
      empresaId,
      itens: itensBOM,
    };

    // 3. Criar Roteiro inicial
    let tempoPrepTotal = 0;
    let tempoOperTotal = 0;
    let custoTotalMaoDeObra = 0;

    const operacoesRoteiro: RoteiroOperacao[] = (dados.operacoesIniciaisRoteiro || []).map((op, idx) => {
      const prep = op.tempoPreparacaoMinutos || 0;
      const ciclo = op.tempoOperacaoMinutos || 0;
      const padrao = prep + ciclo;
      const custoHora = op.custoHoraMaquina || 150;
      const custoOp = Number(((padrao / 60) * custoHora).toFixed(2));

      tempoPrepTotal += prep;
      tempoOperTotal += ciclo;
      custoTotalMaoDeObra += custoOp;

      return {
        id: `op-${crypto.randomUUID().slice(0, 8)}`,
        roteiroId: rot0Id,
        sequencia: op.sequencia || (idx + 1) * 10,
        operacaoNome: op.operacaoNome,
        setor: op.setor,
        maquina: op.maquina,
        ferramenta: op.ferramenta,
        tempoPreparacaoMinutos: prep,
        tempoOperacaoMinutos: ciclo,
        tempoPadraoTotalMinutos: padrao,
        custoHoraMaquina: custoHora,
        custoTotalOperacao: custoOp,
        instrucaoTecnica: op.instrucaoTecnica,
        exigeInspecaoQualidade: true,
      };
    });

    const roteiro0: Roteiro = {
      id: rot0Id,
      projetoId,
      revisaoId: rev0Id,
      codigoRoteiro: `ROT-${dados.codigo}-R00`,
      versao: 'Rev 00',
      descricao: `Roteiro de Processos - ${dados.titulo}`,
      tempoPreparacaoTotalMinutos: tempoPrepTotal,
      tempoOperacaoTotalMinutos: tempoOperTotal,
      tempoTotalPadraoMinutos: tempoPrepTotal + tempoOperTotal,
      custoTotalMaoDeObra: Number(custoTotalMaoDeObra.toFixed(2)),
      empresaId,
      operacoes: operacoesRoteiro,
    };

    // 4. Criar Projeto
    const novoProjeto: Projeto = {
      id: projetoId,
      codigo: dados.codigo.toUpperCase(),
      titulo: dados.titulo,
      descricao: dados.descricao,
      clienteId: dados.clienteId || 'cli-generico',
      clienteNome: dados.clienteNome,
      responsavelNome: dados.responsavelNome,
      categoria: dados.categoria,
      status: 'EM_DESENVOLVIMENTO',
      empresaId,
      dataCriacao: dataAgora,
      dataAtualizacao: dataAgora,
      revisaoAtivaId: rev0Id,
      revisaoAtivaVersao: 'Rev 00',
      custoTotalEstimadoRevisaoAtiva: Number((custoTotalEstimadoBOM + custoTotalMaoDeObra).toFixed(2)),
      tempoTotalFabricacaoMinutosRevisaoAtiva: tempoPrepTotal + tempoOperTotal,
      pesoTotalEstimadoKgRevisaoAtiva: Number(pesoTotalEstimadoBOM.toFixed(2)),
    };

    // 5. Registrar no Histórico
    const eventoHist: HistoricoEngenhariaEvento = {
      id: `hist-${crypto.randomUUID().slice(0, 8)}`,
      projetoId,
      revisaoId: rev0Id,
      revisaoVersao: 'Rev 00',
      tipoEvento: 'CRIACAO_PROJETO',
      descricao: `Projeto ${novoProjeto.codigo} criado com Revisão Inicial Rev 00 (BOM com ${itensBOM.length} itens e Roteiro com ${operacoesRoteiro.length} operações).`,
      usuarioNome: dados.responsavelNome,
      dataHora: dataAgora,
      empresaId,
    };

    this.projetos.unshift(novoProjeto);
    this.revisoes.push(revisao0);
    this.estruturas.push(estrutura0);
    this.roteiros.push(roteiro0);
    this.historico.unshift(eventoHist);

    return this.obterProjetoDetalhado(empresaId, projetoId, rev0Id)!;
  }

  // =========================================================================
  // GESTÃO DE REVISÕES (CLONAGEM, IMUTABILIDADE, REGRA DE ATIVAÇÃO ÚNICA)
  // =========================================================================

  /**
   * REGRA CRÍTICA:
   * "Nenhuma alteração de revisão deve apagar a anterior"
   * Cria uma nova versão (ex: Rev 01, Rev 02) clonando a estrutura da revisão anterior.
   */
  public criarNovaRevisao(
    empresaId: string,
    projetoId: string,
    dados: {
      descricaoModificacoes: string;
      motivoRevisao: string;
      criadoPor: string;
      clonarRevisaoOrigemId?: string;
    }
  ): ProjetoDetalhado {
    const projeto = this.obterProjetoPorId(empresaId, projetoId);
    if (!projeto) throw new Error('Projeto não encontrado');

    const revisoesExistentes = this.revisoes
      .filter((r) => r.empresaId === empresaId && r.projetoId === projetoId)
      .sort((a, b) => a.numeroSequencial - b.numeroSequencial);

    const proximoNumero = revisoesExistentes.length;
    const versaoFormatada = `Rev ${String(proximoNumero).padStart(2, '0')}`;
    const novaRevisaoId = `rev-${projetoId}-${proximoNumero}`;
    const novaEstruturaId = `est-bom-${projetoId}-${proximoNumero}`;
    const novoRoteiroId = `rot-${projetoId}-${proximoNumero}`;
    const dataAgora = new Date().toISOString();

    // Determinar revisão de origem para clonar
    const revisaoOrigem = dados.clonarRevisaoOrigemId
      ? revisoesExistentes.find((r) => r.id === dados.clonarRevisaoOrigemId)
      : revisoesExistentes[revisoesExistentes.length - 1];

    // 1. Criar a nova revisão com status RASCUNHO (Não ativa ainda, preservando a ativa anterior)
    const novaRevisao: ProjetoRevisao = {
      id: novaRevisaoId,
      projetoId,
      versao: versaoFormatada,
      numeroSequencial: proximoNumero,
      descricaoModificacoes: dados.descricaoModificacoes,
      motivoRevisao: dados.motivoRevisao,
      status: 'RASCUNHO',
      ativa: false, // Inicia como rascunho. A revisão anterior continua ativa até homologação!
      dataCriacao: dataAgora,
      criadoPor: dados.criadoPor,
      empresaId,
    };

    // 2. Clonar Estrutura de Produto (BOM) da revisão de origem
    const estruturaOrigem = revisaoOrigem
      ? this.estruturas.find((e) => e.revisaoId === revisaoOrigem.id)
      : null;

    const itensClonados: EstruturaItem[] = (estruturaOrigem?.itens || []).map((it) => ({
      ...it,
      id: `item-bom-${crypto.randomUUID().slice(0, 8)}`,
      estruturaId: novaEstruturaId,
    }));

    const novaEstrutura: EstruturaProduto = {
      id: novaEstruturaId,
      projetoId,
      revisaoId: novaRevisaoId,
      codigoEstrutura: `BOM-${projeto.codigo}-R${String(proximoNumero).padStart(2, '0')}`,
      versao: versaoFormatada,
      descricao: `Lista de Materiais - ${versaoFormatada}`,
      dataValidadeInicio: dataAgora.split('T')[0],
      custoTotalEstimado: estruturaOrigem?.custoTotalEstimado || 0,
      pesoTotalEstimadoKg: estruturaOrigem?.pesoTotalEstimadoKg || 0,
      empresaId,
      itens: itensClonados,
    };

    // 3. Clonar Roteiro da revisão de origem
    const roteiroOrigem = revisaoOrigem
      ? this.roteiros.find((rt) => rt.revisaoId === revisaoOrigem.id)
      : null;

    const operacoesClonadas: RoteiroOperacao[] = (roteiroOrigem?.operacoes || []).map((op) => ({
      ...op,
      id: `op-${crypto.randomUUID().slice(0, 8)}`,
      roteiroId: novoRoteiroId,
    }));

    const novoRoteiro: Roteiro = {
      id: novoRoteiroId,
      projetoId,
      revisaoId: novaRevisaoId,
      codigoRoteiro: `ROT-${projeto.codigo}-R${String(proximoNumero).padStart(2, '0')}`,
      versao: versaoFormatada,
      descricao: `Roteiro de Fabricação - ${versaoFormatada}`,
      tempoPreparacaoTotalMinutos: roteiroOrigem?.tempoPreparacaoTotalMinutos || 0,
      tempoOperacaoTotalMinutos: roteiroOrigem?.tempoOperacaoTotalMinutos || 0,
      tempoTotalPadraoMinutos: roteiroOrigem?.tempoTotalPadraoMinutos || 0,
      custoTotalMaoDeObra: roteiroOrigem?.custoTotalMaoDeObra || 0,
      empresaId,
      operacoes: operacoesClonadas,
    };

    // 4. Copiar/Vincular referências de arquivos técnicos da revisão anterior para a nova
    const arquivosOrigem = revisaoOrigem
      ? this.arquivos.filter((a) => a.revisaoId === revisaoOrigem.id)
      : [];

    const novosArquivos: ArquivoTecnico[] = arquivosOrigem.map((arq) => ({
      ...arq,
      id: `arq-${crypto.randomUUID().slice(0, 8)}`,
      revisaoId: novaRevisaoId,
      revisaoVersao: versaoFormatada,
      dataUpload: dataAgora,
      observacoes: `Copiado da ${revisaoOrigem?.versao || 'revisão anterior'} para edição/manutenção.`,
    }));

    // 5. Histórico
    const eventoHist: HistoricoEngenhariaEvento = {
      id: `hist-${crypto.randomUUID().slice(0, 8)}`,
      projetoId,
      revisaoId: novaRevisaoId,
      revisaoVersao: versaoFormatada,
      tipoEvento: 'CRIACAO_REVISAO',
      descricao: `Nova ${versaoFormatada} criada em RASCUNHO por ${dados.criadoPor}. Motivo: ${dados.motivoRevisao}. A revisão anterior (${revisaoOrigem?.versao || 'Rev 00'}) foi preservada intacta.`,
      usuarioNome: dados.criadoPor,
      dataHora: dataAgora,
      empresaId,
      detalhes: {
        revisaoOrigem: revisaoOrigem?.versao,
        itensClonados: itensClonados.length,
        operacoesClonadas: operacoesClonadas.length,
      },
    };

    // Atualizar data de modificação do projeto
    projeto.dataAtualizacao = dataAgora;

    this.revisoes.push(novaRevisao);
    this.estruturas.push(novaEstrutura);
    this.roteiros.push(novoRoteiro);
    this.arquivos.push(...novosArquivos);
    this.historico.unshift(eventoHist);

    return this.obterProjetoDetalhado(empresaId, projetoId, novaRevisaoId)!;
  }

  /**
   * REGRA CRÍTICA:
   * "Apenas uma revisão pode estar ativa para cada contexto definido"
   * Ao ativar uma revisão:
   * - Todas as outras revisões deste projeto passam a ter ativa = false.
   * - A revisão que estava ativa passa para status 'OBSOLETA'.
   * - A nova revisão passa a ter status 'ATIVA' e ativa = true.
   * - O projeto atualiza seus ponteiros e métricas desnormalizadas.
   */
  public ativarRevisao(
    empresaId: string,
    projetoId: string,
    revisaoIdParaAtivar: string,
    dadosAprovacao: {
      aprovadorNome: string;
      parecerAprovacao?: string;
    }
  ): ProjetoDetalhado {
    const projeto = this.obterProjetoPorId(empresaId, projetoId);
    if (!projeto) throw new Error('Projeto não encontrado');

    const revisaoAlvo = this.revisoes.find(
      (r) => r.empresaId === empresaId && r.projetoId === projetoId && r.id === revisaoIdParaAtivar
    );
    if (!revisaoAlvo) throw new Error('Revisão informada não encontrada');

    const dataAgora = new Date().toISOString();
    let revisaoAnteriorAtivaVersao = '';

    // Desativar todas as outras revisões deste projeto e marcar a anterior como OBSOLETA
    for (const rev of this.revisoes) {
      if (rev.empresaId === empresaId && rev.projetoId === projetoId) {
        if (rev.id === revisaoIdParaAtivar) {
          rev.ativa = true;
          rev.status = 'ATIVA';
          rev.dataLiberacao = dataAgora;
          rev.liberadoPor = dadosAprovacao.aprovadorNome;
          rev.parecerAprovacao = dadosAprovacao.parecerAprovacao || 'Homologado pela Engenharia de Produto.';
        } else {
          if (rev.ativa) {
            revisaoAnteriorAtivaVersao = rev.versao;
            rev.status = 'OBSOLETA'; // Regra: versão antiga torna-se obsoleta/histórica
          }
          rev.ativa = false;
        }
      }
    }

    // Recalcular métricas da revisão ativada para atualizar o projeto
    const estruturaAtiva = this.estruturas.find((e) => e.revisaoId === revisaoAlvo.id);
    const roteiroAtivo = this.roteiros.find((rt) => rt.revisaoId === revisaoAlvo.id);

    const custoMaterial = estruturaAtiva?.custoTotalEstimado || 0;
    const custoMO = roteiroAtivo?.custoTotalMaoDeObra || 0;
    const pesoTotal = estruturaAtiva?.pesoTotalEstimadoKg || 0;
    const tempoTotal = roteiroAtivo?.tempoTotalPadraoMinutos || 0;

    projeto.revisaoAtivaId = revisaoAlvo.id;
    projeto.revisaoAtivaVersao = revisaoAlvo.versao;
    projeto.custoTotalEstimadoRevisaoAtiva = Number((custoMaterial + custoMO).toFixed(2));
    projeto.pesoTotalEstimadoKgRevisaoAtiva = Number(pesoTotal.toFixed(2));
    projeto.tempoTotalFabricacaoMinutosRevisaoAtiva = tempoTotal;
    projeto.status = 'HOMOLOGADO';
    projeto.dataAtualizacao = dataAgora;

    // Registrar histórico
    const eventoHist: HistoricoEngenhariaEvento = {
      id: `hist-${crypto.randomUUID().slice(0, 8)}`,
      projetoId,
      revisaoId: revisaoAlvo.id,
      revisaoVersao: revisaoAlvo.versao,
      tipoEvento: 'ATIVACAO_REVISAO',
      descricao: `Revisão ${revisaoAlvo.versao} ativada como VIGENTE por ${dadosAprovacao.aprovadorNome}. ${
        revisaoAnteriorAtivaVersao ? `Revisão anterior (${revisaoAnteriorAtivaVersao}) tornou-se OBSOLETA.` : ''
      }`,
      usuarioNome: dadosAprovacao.aprovadorNome,
      dataHora: dataAgora,
      empresaId,
      detalhes: {
        versaoAtivada: revisaoAlvo.versao,
        versaoAnterior: revisaoAnteriorAtivaVersao,
        parecer: revisaoAlvo.parecerAprovacao,
      },
    };

    this.historico.unshift(eventoHist);

    return this.obterProjetoDetalhado(empresaId, projetoId, revisaoAlvo.id)!;
  }

  // =========================================================================
  // GESTÃO DE ESTRUTURA DE PRODUTO (BOM) & PERDAS
  // =========================================================================

  /**
   * REGRA: "BOM suporta componentes, quantidades e perdas"
   */
  public adicionarItemBOM(
    empresaId: string,
    revisaoId: string,
    dadosItem: {
      codigo: string;
      descricao: string;
      tipoItem: any;
      quantidadeLiquida: number;
      unidadeMedida: string;
      percentualPerda: number;
      custoUnitarioEstimado: number;
      pesoUnitarioKg: number;
      nestingOuCorteInfo?: string;
      observacoesTecnicas?: string;
      dimensoesBrutasMm?: { espessura?: number; largura?: number; comprimento?: number };
    },
    usuarioNome: string
  ): EstruturaProduto {
    const estrutura = this.estruturas.find((e) => e.empresaId === empresaId && e.revisaoId === revisaoId);
    if (!estrutura) throw new Error('Estrutura de produto (BOM) não encontrada para esta revisão');

    const revisao = this.revisoes.find((r) => r.id === revisaoId);
    if (revisao && revisao.status === 'OBSOLETA') {
      throw new Error('Não é permitido alterar BOM de uma revisão OBSOLETA. Crie uma nova revisão para realizar modificações.');
    }

    const quantLiquida = Number(dadosItem.quantidadeLiquida || 1);
    const perda = Number(dadosItem.percentualPerda || 0);
    const quantBruta = Number((quantLiquida * (1 + perda / 100)).toFixed(4));
    const custoUnit = Number(dadosItem.custoUnitarioEstimado || 0);
    const custoTot = Number((quantBruta * custoUnit).toFixed(2));
    const pesoUnit = Number(dadosItem.pesoUnitarioKg || 0);
    const pesoTot = Number((quantBruta * pesoUnit).toFixed(2));

    const proximaSeq = (estrutura.itens.length + 1) * 10;

    const novoItem: EstruturaItem = {
      id: `item-bom-${crypto.randomUUID().slice(0, 8)}`,
      estruturaId: estrutura.id,
      itemSequencia: proximaSeq,
      produtoId: `prod-${dadosItem.codigo.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      codigo: dadosItem.codigo.toUpperCase(),
      descricao: dadosItem.descricao,
      tipoItem: dadosItem.tipoItem,
      quantidadeLiquida: quantLiquida,
      unidadeMedida: dadosItem.unidadeMedida,
      percentualPerda: perda,
      quantidadeBruta: quantBruta,
      nestingOuCorteInfo: dadosItem.nestingOuCorteInfo,
      custoUnitarioEstimado: custoUnit,
      custoTotalItem: custoTot,
      pesoUnitarioKg: pesoUnit,
      pesoTotalKg: pesoTot,
      observacoesTecnicas: dadosItem.observacoesTecnicas,
      dimensoesBrutasMm: dadosItem.dimensoesBrutasMm,
    };

    estrutura.itens.push(novoItem);

    // Recalcular totais da estrutura
    estrutura.custoTotalEstimado = Number(
      estrutura.itens.reduce((acc, it) => acc + it.custoTotalItem, 0).toFixed(2)
    );
    estrutura.pesoTotalEstimadoKg = Number(
      estrutura.itens.reduce((acc, it) => acc + it.pesoTotalKg, 0).toFixed(2)
    );

    // Registrar no Histórico
    const evento: HistoricoEngenhariaEvento = {
      id: `hist-${crypto.randomUUID().slice(0, 8)}`,
      projetoId: estrutura.projetoId,
      revisaoId: estrutura.revisaoId,
      revisaoVersao: estrutura.versao,
      tipoEvento: 'MODIFICACAO_BOM',
      descricao: `Item ${novoItem.codigo} (${novoItem.descricao}) adicionado ao BOM. Qtde Líquida: ${novoItem.quantidadeLiquida} ${novoItem.unidadeMedida}, Perda: ${novoItem.percentualPerda}%, Qtde Bruta: ${novoItem.quantidadeBruta}.`,
      usuarioNome,
      dataHora: new Date().toISOString(),
      empresaId,
    };
    this.historico.unshift(evento);

    return estrutura;
  }

  public removerItemBOM(empresaId: string, revisaoId: string, itemId: string, usuarioNome: string): EstruturaProduto {
    const estrutura = this.estruturas.find((e) => e.empresaId === empresaId && e.revisaoId === revisaoId);
    if (!estrutura) throw new Error('Estrutura de produto (BOM) não encontrada');

    const index = estrutura.itens.findIndex((it) => it.id === itemId);
    if (index === -1) throw new Error('Item do BOM não encontrado');

    const [itemRemovido] = estrutura.itens.splice(index, 1);

    // Recalcular
    estrutura.custoTotalEstimado = Number(
      estrutura.itens.reduce((acc, it) => acc + it.custoTotalItem, 0).toFixed(2)
    );
    estrutura.pesoTotalEstimadoKg = Number(
      estrutura.itens.reduce((acc, it) => acc + it.pesoTotalKg, 0).toFixed(2)
    );

    const evento: HistoricoEngenhariaEvento = {
      id: `hist-${crypto.randomUUID().slice(0, 8)}`,
      projetoId: estrutura.projetoId,
      revisaoId: estrutura.revisaoId,
      revisaoVersao: estrutura.versao,
      tipoEvento: 'MODIFICACAO_BOM',
      descricao: `Item ${itemRemovido.codigo} removido do BOM da ${estrutura.versao}.`,
      usuarioNome,
      dataHora: new Date().toISOString(),
      empresaId,
    };
    this.historico.unshift(evento);

    return estrutura;
  }

  // =========================================================================
  // GESTÃO DE ROTEIROS DE FABRICAÇÃO & TEMPOS PADRÃO
  // =========================================================================

  /**
   * REGRA: "Roteiro suporta sequência, operação, setor, máquina, ferramenta e tempo padrão"
   */
  public adicionarOperacaoRoteiro(
    empresaId: string,
    revisaoId: string,
    dadosOp: {
      sequencia?: number;
      operacaoNome: string;
      setor: any;
      maquina: string;
      ferramenta: string;
      tempoPreparacaoMinutos: number;
      tempoOperacaoMinutos: number;
      custoHoraMaquina: number;
      instrucaoTecnica: string;
      desenhosOuFotosRef?: string;
      exigeInspecaoQualidade?: boolean;
    },
    usuarioNome: string
  ): Roteiro {
    const roteiro = this.roteiros.find((rt) => rt.empresaId === empresaId && rt.revisaoId === revisaoId);
    if (!roteiro) throw new Error('Roteiro não encontrado para esta revisão');

    const prep = Number(dadosOp.tempoPreparacaoMinutos || 0);
    const ciclo = Number(dadosOp.tempoOperacaoMinutos || 0);
    const tempoPadraoTotal = prep + ciclo;
    const custoHora = Number(dadosOp.custoHoraMaquina || 150);
    const custoTot = Number(((tempoPadraoTotal / 60) * custoHora).toFixed(2));
    const seq = dadosOp.sequencia || (roteiro.operacoes.length + 1) * 10;

    const novaOperacao: RoteiroOperacao = {
      id: `op-${crypto.randomUUID().slice(0, 8)}`,
      roteiroId: roteiro.id,
      sequencia: seq,
      operacaoNome: dadosOp.operacaoNome,
      setor: dadosOp.setor,
      maquina: dadosOp.maquina,
      ferramenta: dadosOp.ferramenta,
      tempoPreparacaoMinutos: prep,
      tempoOperacaoMinutos: ciclo,
      tempoPadraoTotalMinutos: tempoPadraoTotal,
      custoHoraMaquina: custoHora,
      custoTotalOperacao: custoTot,
      instrucaoTecnica: dadosOp.instrucaoTecnica,
      desenhosOuFotosRef: dadosOp.desenhosOuFotosRef,
      exigeInspecaoQualidade: dadosOp.exigeInspecaoQualidade !== false,
    };

    roteiro.operacoes.push(novaOperacao);
    roteiro.operacoes.sort((a, b) => a.sequencia - b.sequencia);

    // Recalcular totais
    roteiro.tempoPreparacaoTotalMinutos = roteiro.operacoes.reduce((acc, o) => acc + o.tempoPreparacaoMinutos, 0);
    roteiro.tempoOperacaoTotalMinutos = roteiro.operacoes.reduce((acc, o) => acc + o.tempoOperacaoMinutos, 0);
    roteiro.tempoTotalPadraoMinutos = roteiro.operacoes.reduce((acc, o) => acc + o.tempoPadraoTotalMinutos, 0);
    roteiro.custoTotalMaoDeObra = Number(
      roteiro.operacoes.reduce((acc, o) => acc + o.custoTotalOperacao, 0).toFixed(2)
    );

    const evento: HistoricoEngenhariaEvento = {
      id: `hist-${crypto.randomUUID().slice(0, 8)}`,
      projetoId: roteiro.projetoId,
      revisaoId: roteiro.revisaoId,
      revisaoVersao: roteiro.versao,
      tipoEvento: 'MODIFICACAO_ROTEIRO',
      descricao: `Operação Seq ${novaOperacao.sequencia} - ${novaOperacao.operacaoNome} (${novaOperacao.setor} / ${novaOperacao.maquina}) adicionada ao roteiro da ${roteiro.versao}. Tempo Padrão: ${novaOperacao.tempoPadraoTotalMinutos} min.`,
      usuarioNome,
      dataHora: new Date().toISOString(),
      empresaId,
    };
    this.historico.unshift(evento);

    return roteiro;
  }

  public removerOperacaoRoteiro(empresaId: string, revisaoId: string, operacaoId: string, usuarioNome: string): Roteiro {
    const roteiro = this.roteiros.find((rt) => rt.empresaId === empresaId && rt.revisaoId === revisaoId);
    if (!roteiro) throw new Error('Roteiro não encontrado');

    const index = roteiro.operacoes.findIndex((op) => op.id === operacaoId);
    if (index === -1) throw new Error('Operação do roteiro não encontrada');

    const [opRemovida] = roteiro.operacoes.splice(index, 1);

    roteiro.tempoPreparacaoTotalMinutos = roteiro.operacoes.reduce((acc, o) => acc + o.tempoPreparacaoMinutos, 0);
    roteiro.tempoOperacaoTotalMinutos = roteiro.operacoes.reduce((acc, o) => acc + o.tempoOperacaoMinutos, 0);
    roteiro.tempoTotalPadraoMinutos = roteiro.operacoes.reduce((acc, o) => acc + o.tempoPadraoTotalMinutos, 0);
    roteiro.custoTotalMaoDeObra = Number(
      roteiro.operacoes.reduce((acc, o) => acc + o.custoTotalOperacao, 0).toFixed(2)
    );

    const evento: HistoricoEngenhariaEvento = {
      id: `hist-${crypto.randomUUID().slice(0, 8)}`,
      projetoId: roteiro.projetoId,
      revisaoId: roteiro.revisaoId,
      revisaoVersao: roteiro.versao,
      tipoEvento: 'MODIFICACAO_ROTEIRO',
      descricao: `Operação Seq ${opRemovida.sequencia} - ${opRemovida.operacaoNome} removida do roteiro.`,
      usuarioNome,
      dataHora: new Date().toISOString(),
      empresaId,
    };
    this.historico.unshift(evento);

    return roteiro;
  }

  // =========================================================================
  // ARQUIVOS TÉCNICOS (VINCULADOS POR PROJETO E REVISÃO)
  // =========================================================================

  /**
   * REGRA: "Arquivos técnicos são vinculados por projeto/revisão"
   */
  public vincularArquivoTecnico(
    empresaId: string,
    dados: {
      projetoId: string;
      revisaoId: string;
      nomeArquivo: string;
      tipo: any;
      formato: any;
      tamanhoBytes?: number;
      url?: string;
      hashMd5?: string;
      autor: string;
      observacoes?: string;
    }
  ): ArquivoTecnico {
    const revisao = this.revisoes.find((r) => r.id === dados.revisaoId);
    if (!revisao) throw new Error('Revisão informada para vincular arquivo não existe');

    const bytes = dados.tamanhoBytes || 2400000;
    const tamanhoFormatado = `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    const hash = dados.hashMd5 || `${crypto.randomUUID().replace(/-/g, '')}`;

    const novoArquivo: ArquivoTecnico = {
      id: `arq-${crypto.randomUUID().slice(0, 8)}`,
      projetoId: dados.projetoId,
      revisaoId: dados.revisaoId,
      revisaoVersao: revisao.versao,
      nomeArquivo: dados.nomeArquivo,
      tipo: dados.tipo,
      formato: dados.formato,
      tamanhoBytes: bytes,
      tamanhoFormatado,
      url: dados.url || `/storage/engenharia/${dados.nomeArquivo}`,
      hashMd5: hash,
      autor: dados.autor,
      dataUpload: new Date().toISOString(),
      observacoes: dados.observacoes,
      empresaId,
    };

    this.arquivos.unshift(novoArquivo);

    const evento: HistoricoEngenhariaEvento = {
      id: `hist-${crypto.randomUUID().slice(0, 8)}`,
      projetoId: dados.projetoId,
      revisaoId: dados.revisaoId,
      revisaoVersao: revisao.versao,
      tipoEvento: 'UPLOAD_ARQUIVO',
      descricao: `Arquivo técnico ${novoArquivo.nomeArquivo} (${novoArquivo.tipo} - ${novoArquivo.formato}) anexado à ${revisao.versao}.`,
      usuarioNome: dados.autor,
      dataHora: novoArquivo.dataUpload,
      empresaId,
    };
    this.historico.unshift(evento);

    return novoArquivo;
  }

  public removerArquivoTecnico(empresaId: string, arquivoId: string, usuarioNome: string): boolean {
    const index = this.arquivos.findIndex((a) => a.empresaId === empresaId && a.id === arquivoId);
    if (index === -1) return false;

    const [removido] = this.arquivos.splice(index, 1);

    const evento: HistoricoEngenhariaEvento = {
      id: `hist-${crypto.randomUUID().slice(0, 8)}`,
      projetoId: removido.projetoId,
      revisaoId: removido.revisaoId,
      revisaoVersao: removido.revisaoVersao,
      tipoEvento: 'UPLOAD_ARQUIVO',
      descricao: `Arquivo ${removido.nomeArquivo} removido da ${removido.revisaoVersao}.`,
      usuarioNome,
      dataHora: new Date().toISOString(),
      empresaId,
    };
    this.historico.unshift(evento);

    return true;
  }

  // =========================================================================
  // RASTREABILIDADE DE ORDEM DE PRODUÇÃO (OP)
  // =========================================================================

  /**
   * REGRA: "OP deve registrar qual revisão foi usada"
   */
  public emitirOrdemProducaoComRevisao(
    empresaId: string,
    projetoId: string,
    dados: {
      quantidade: number;
      numeroOpCustomizado?: string;
      usuarioNome: string;
      forcarRevisaoId?: string; // Opcional se quiser disparar OP para revisão histórica específica
    }
  ): OrdemProducaoVinculo {
    const projeto = this.obterProjetoPorId(empresaId, projetoId);
    if (!projeto) throw new Error('Projeto não encontrado');

    const revisoes = this.revisoes.filter((r) => r.empresaId === empresaId && r.projetoId === projetoId);

    // Se forçar uma revisão específica, usa ela; senão usa a revisão que está ATIVA
    const revisaoUsada = dados.forcarRevisaoId
      ? revisoes.find((r) => r.id === dados.forcarRevisaoId)
      : revisoes.find((r) => r.ativa) || revisoes[0];

    if (!revisaoUsada) throw new Error('Nenhuma revisão encontrada para emitir Ordem de Produção');

    const numeroOp = dados.numeroOpCustomizado || `OP-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const dataAgora = new Date().toISOString();

    const novaOp: OrdemProducaoVinculo = {
      id: `op-vinc-${crypto.randomUUID().slice(0, 8)}`,
      numeroOp,
      projetoId: projeto.id,
      projetoCodigo: projeto.codigo,
      projetoTitulo: projeto.titulo,
      revisaoId: revisaoUsada.id,
      revisaoVersao: revisaoUsada.versao, // Registro imutável da revisão usada!
      dataSnapshotBOM: dataAgora,
      statusOp: 'LIBERADA_FABRICA',
      quantidadeProduzir: dados.quantidade,
      dataLiberacao: dataAgora.split('T')[0],
      empresaId,
    };

    this.ordensProducao.unshift(novaOp);

    const evento: HistoricoEngenhariaEvento = {
      id: `hist-${crypto.randomUUID().slice(0, 8)}`,
      projetoId: projeto.id,
      revisaoId: revisaoUsada.id,
      revisaoVersao: revisaoUsada.versao,
      tipoEvento: 'VINCULO_ORDEM_PRODUCAO',
      descricao: `Ordem de Produção ${novaOp.numeroOp} (Qtde: ${novaOp.quantidadeProduzir}) gerada e congelada na ${revisaoUsada.versao}. Snapshot de BOM e Roteiro gravado com sucesso.`,
      usuarioNome: dados.usuarioNome,
      dataHora: dataAgora,
      empresaId,
      detalhes: {
        numeroOp: novaOp.numeroOp,
        revisaoVinculada: revisaoUsada.versao,
        quantidade: novaOp.quantidadeProduzir,
      },
    };
    this.historico.unshift(evento);

    return novaOp;
  }
}

export const engenhariaService = new EngenhariaService();
