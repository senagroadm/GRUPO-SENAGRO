// backend/modules/qualidade/qualidade-service.ts

import {
  ModeloChecklist,
  ItemChecklist,
  InspecaoQualidade,
  RespostaInspecao,
  NaoConformidade,
  CausaNC,
  AcaoCorretivaNC,
  AcaoPreventivaNC,
  RetrabalhoQualidade,
  RefugoQualidade,
  IndicadoresQualidade,
  TipoInspecao,
  DisposicaoQualidade,
  StatusNC,
  StatusAcao,
  StatusRetrabalho,
  StatusRefugo,
  CategoriaIshikawa,
  SeveridadeNC,
  OrigemNC,
} from './qualidade-types';

class QualidadeService {
  private modelosChecklist: ModeloChecklist[] = [];
  private inspecoes: InspecaoQualidade[] = [];
  private naoConformidades: NaoConformidade[] = [];
  private retrabalhos: RetrabalhoQualidade[] = [];
  private refugos: RefugoQualidade[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const EMPRESA_PADRAO = 'emp-tritech-corte';
    const EMPRESA_ALT = '44444444-4444-4444-4444-444444444444';

    // 1. MODELOS DE CHECKLIST INICIAIS
    this.modelosChecklist = [
      {
        id: 'mod-chk-01',
        empresaId: EMPRESA_PADRAO,
        codigo: 'CHK-REC-MAT-01',
        titulo: 'Inspeção de Recebimento de Matéria-Prima (Chapas e Bobinas de Aço)',
        versao: 'Rev. 04',
        tipoInspecao: 'RECEBIMENTO',
        setor: 'RECEBIMENTO_MATERIA_PRIMA',
        produtoCodigo: 'MP-CHAPA-A36',
        descricao: 'Protocolo de conferência de espessura, planicidade, oxidação superficial e certificado de usina de chapas.',
        ativo: true,
        criadoPor: 'eng.qualidade@tritech.ind.br',
        criadoEm: '2026-01-15T08:00:00Z',
        atualizadoEm: '2026-06-10T14:30:00Z',
        itens: [
          {
            id: 'it-chk-01',
            modeloId: 'mod-chk-01',
            sequencia: 1,
            tituloCriterio: 'Conferência do Certificado de Usina (Composição Química & Tração)',
            metodoInspecao: 'Análise documental de corrida de aço e laudo do fabricante',
            instrumentoMedicao: 'Certificado de Origem (Gerdau/Usiminas)',
            tipoValor: 'BOOLEANO',
            nivelCriticidade: 'CRITICO',
            instrucaoInspecao: 'Verificar se o número de corrida na chapa confere com o laudo físico e se o limite de escoamento atende a norma ASTM A36 / SAE 1020.',
          },
          {
            id: 'it-chk-02',
            modeloId: 'mod-chk-01',
            sequencia: 2,
            tituloCriterio: 'Espessura Nominal da Chapa (#6.35 mm)',
            metodoInspecao: 'Medição micrométrica em 4 pontos distintos das bordas',
            instrumentoMedicao: 'Micrômetro Externo Digital 0-25mm Mitutoyo',
            tipoValor: 'NUMERICO_TOLERANCIA',
            valorNominal: 6.35,
            toleranciaMin: 6.15,
            toleranciaMax: 6.55,
            unidadeMedida: 'mm',
            nivelCriticidade: 'CRITICO',
            instrucaoInspecao: 'Aferir em no mínimo 4 quadrantes da chapa. Nenhuma medida pode estar fora do limite NBR 11888.',
          },
          {
            id: 'it-chk-03',
            modeloId: 'mod-chk-01',
            sequencia: 3,
            tituloCriterio: 'Planicidade e Empeno Longitudinal',
            metodoInspecao: 'Régua de precisão 2000mm apoiada na face superior',
            instrumentoMedicao: 'Régua de Aço Retificada + Calibrador de Folga',
            tipoValor: 'NUMERICO_TOLERANCIA',
            valorNominal: 0.0,
            toleranciaMin: 0.0,
            toleranciaMax: 3.0,
            unidadeMedida: 'mm/m',
            nivelCriticidade: 'MAIOR',
            instrucaoInspecao: 'Medir folga máxima entre régua e chapa. Máximo 3.0 mm por metro linear para corte laser sem colisão.',
          },
          {
            id: 'it-chk-04',
            modeloId: 'mod-chk-01',
            sequencia: 4,
            tituloCriterio: 'Aspecto Superficial & Isenção de Carepa Solta / Corrosão Severa',
            metodoInspecao: 'Inspeção visual 100% sob iluminação mínima de 500 lux',
            instrumentoMedicao: 'Visual / Padrão Comparativo ISO 8501-1',
            tipoValor: 'BOOLEANO',
            nivelCriticidade: 'MAIOR',
            instrucaoInspecao: 'Material não pode apresentar trincas, delaminação, incrustação profunda ou oxidação grau C/D.',
          },
        ],
      },
      {
        id: 'mod-chk-02',
        empresaId: EMPRESA_PADRAO,
        codigo: 'CHK-PROC-LAS-02',
        titulo: 'Inspeção em Processo - Corte a Laser Fibra Óptica',
        versao: 'Rev. 03',
        tipoInspecao: 'PROCESSO',
        setor: 'CORTE_LASER',
        operacaoPadrao: 'Corte Laser Fibra',
        descricao: 'Validação da 1ª peça cortada (First Article Inspection) e amostragem de lote para rebarbas, conicidade e furos.',
        ativo: true,
        criadoPor: 'eng.qualidade@tritech.ind.br',
        criadoEm: '2026-02-01T09:00:00Z',
        atualizadoEm: '2026-07-15T11:00:00Z',
        itens: [
          {
            id: 'it-chk-05',
            modeloId: 'mod-chk-02',
            sequencia: 1,
            tituloCriterio: 'Comprimento Total do Perfil Cortado (L)',
            metodoInspecao: 'Medição com paquímetro de grande porte',
            instrumentoMedicao: 'Paquímetro Digital 1000mm Mitutoyo',
            tipoValor: 'NUMERICO_TOLERANCIA',
            valorNominal: 1250.0,
            toleranciaMin: 1249.2,
            toleranciaMax: 1250.8,
            unidadeMedida: 'mm',
            nivelCriticidade: 'CRITICO',
            instrucaoInspecao: 'Medir comprimento entre faces usinadas a laser nos eixos X e Y.',
          },
          {
            id: 'it-chk-06',
            modeloId: 'mod-chk-02',
            sequencia: 2,
            tituloCriterio: 'Diâmetro do Furo Central Passante (Ø)',
            metodoInspecao: 'Calibre tampão passa/não-passa ou paquímetro',
            instrumentoMedicao: 'Paquímetro Digital Mitutoyo 300mm',
            tipoValor: 'NUMERICO_TOLERANCIA',
            valorNominal: 22.0,
            toleranciaMin: 21.8,
            toleranciaMax: 22.3,
            unidadeMedida: 'mm',
            nivelCriticidade: 'CRITICO',
            instrucaoInspecao: 'Inspecionar circularidade e ausência de bico de entrada do laser com queima irregular.',
          },
          {
            id: 'it-chk-07',
            modeloId: 'mod-chk-02',
            sequencia: 3,
            tituloCriterio: 'Rugosidade da Face Cortada & Ausência de Rebarba Aderente',
            metodoInspecao: 'Inspeção tátil/visual e rugosímetro na face do corte',
            instrumentoMedicao: 'Rugosímetro Portátil Ra / Padrão DIN EN ISO 9013',
            tipoValor: 'BOOLEANO',
            nivelCriticidade: 'MAIOR',
            instrucaoInspecao: 'Corte deve ser livre de escória ou rebarba na parte inferior da chapa.',
          },
        ],
      },
      {
        id: 'mod-chk-03',
        empresaId: EMPRESA_PADRAO,
        codigo: 'CHK-FIN-CHAS-03',
        titulo: 'Inspeção Final & Liberação para Expedição - Chassi e Estruturas',
        versao: 'Rev. 02',
        tipoInspecao: 'FINAL',
        setor: 'EXPEDICAO_QUALIDADE_FINAL',
        produtoCodigo: 'CJ-CHAS-01',
        descricao: 'Inspeção dimensional final tridimensional, estanqueidade de soldas, espessura de camada de tinta e identificação.',
        ativo: true,
        criadoPor: 'eng.qualidade@tritech.ind.br',
        criadoEm: '2026-03-01T10:00:00Z',
        atualizadoEm: '2026-08-01T16:00:00Z',
        itens: [
          {
            id: 'it-chk-08',
            modeloId: 'mod-chk-03',
            sequencia: 1,
            tituloCriterio: 'Esquadro e Diagonal Geral do Conjunto Soldado',
            metodoInspecao: 'Medição cruzada de diagonais (D1 e D2)',
            instrumentoMedicao: 'Trena Laser de Precisão Bosch Professional',
            tipoValor: 'NUMERICO_TOLERANCIA',
            valorNominal: 3200.0,
            toleranciaMin: 3197.0,
            toleranciaMax: 3203.0,
            unidadeMedida: 'mm',
            nivelCriticidade: 'CRITICO',
            instrucaoInspecao: 'A diferença entre as duas diagonais (D1 - D2) não pode ultrapassar 2.0 mm.',
          },
          {
            id: 'it-chk-09',
            modeloId: 'mod-chk-03',
            sequencia: 2,
            tituloCriterio: 'Espessura de Camada de Tinta Pó Eletrostática',
            metodoInspecao: 'Medição magnética não destrutiva da camada seca',
            instrumentoMedicao: 'Medidor de Camada Digital Elcometer',
            tipoValor: 'NUMERICO_TOLERANCIA',
            valorNominal: 90.0,
            toleranciaMin: 80.0,
            toleranciaMax: 130.0,
            unidadeMedida: 'µm',
            nivelCriticidade: 'MAIOR',
            instrucaoInspecao: 'Aferir em no mínimo 5 regiões da estrutura montada.',
          },
          {
            id: 'it-chk-10',
            modeloId: 'mod-chk-03',
            sequencia: 3,
            tituloCriterio: 'Identificação por Plaqueta Metálica & QR Code Rastreador',
            metodoInspecao: 'Verificação visual de gravação a laser e leitura óptica',
            instrumentoMedicao: 'Leitor 2D DataMatrix / QR Code',
            tipoValor: 'BOOLEANO',
            nivelCriticidade: 'CRITICO',
            instrucaoInspecao: 'Plaqueta deve conter Número da OP, Data de Fabricação, Lote e Código do Produto legíveis.',
          },
        ],
      },
    ];

    // 2. INSPEÇÕES REALIZADAS INICIAIS
    this.inspecoes = [
      {
        id: 'insp-01',
        empresaId: EMPRESA_PADRAO,
        numeroInspecao: 'IQ-REC-2026-0042',
        tipoInspecao: 'RECEBIMENTO',
        dataInspecao: '2026-08-18T10:30:00Z',
        inspetorId: 'insp-01',
        inspetorNome: 'Rafael Silveira (Auditor CQ)',
        modeloChecklistId: 'mod-chk-01',
        modeloChecklistTitulo: 'Inspeção de Recebimento de Matéria-Prima (Chapas e Bobinas de Aço)',
        fornecedorId: 'forn-usiminas-01',
        fornecedorNome: 'Usiminas S/A - Divisão Aço Plano',
        notaFiscalNumero: 'NF-e 004.892',
        pedidoCompraNumero: 'PC-2026-088',
        loteMaterial: 'LOT-USI-2026-884',
        corridaAco: 'CORR-99214-A',
        certificadoUsinaNumero: 'CERT-USI-8841-BR',
        produtoCodigo: 'MP-CHAPA-A36-6.35',
        produtoDescricao: 'Chapa de Aço Carbono ASTM A36 6.35 x 1500 x 6000 mm',
        setor: 'RECEBIMENTO_MATERIA_PRIMA',
        tamanhoLote: 50,
        tamanhoAmostra: 5,
        unidadeMedida: 'CH',
        quantidadeAprovada: 50,
        quantidadeAprovadaComDesvio: 0,
        quantidadeReprovada: 0,
        quantidadeQuarentena: 0,
        quantidadeRetrabalho: 0,
        quantidadeRefugo: 0,
        disposicaoFinal: 'APROVADO',
        observacoesGerais: 'Material recebido em conformidade dimensional e química. Certificado de usina validado.',
        laudoTecnico: 'Liberado 100% para estocagem no Almoxarifado Central (Endereço R-04).',
        fotosEvidencias: ['https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80'],
        respostas: [
          {
            id: 'resp-01',
            inspecaoId: 'insp-01',
            itemChecklistId: 'it-chk-01',
            sequencia: 1,
            tituloCriterio: 'Conferência do Certificado de Usina',
            metodoInspecao: 'Análise documental',
            instrumentoMedicao: 'Certificado Gerdau/Usiminas',
            tipoValor: 'BOOLEANO',
            nivelCriticidade: 'CRITICO',
            conforme: true,
            statusDisposicao: 'APROVADO',
          },
          {
            id: 'resp-02',
            inspecaoId: 'insp-01',
            itemChecklistId: 'it-chk-02',
            sequencia: 2,
            tituloCriterio: 'Espessura Nominal da Chapa (#6.35 mm)',
            metodoInspecao: 'Medição micrométrica em 4 pontos',
            instrumentoMedicao: 'Micrômetro Digital',
            tipoValor: 'NUMERICO_TOLERANCIA',
            valorNominal: 6.35,
            toleranciaMin: 6.15,
            toleranciaMax: 6.55,
            unidadeMedida: 'mm',
            nivelCriticidade: 'CRITICO',
            conforme: true,
            valorMedidoNumerico: 6.32,
            desvioDetectado: -0.03,
            statusDisposicao: 'APROVADO',
          },
        ],
        criadoEm: '2026-08-18T10:30:00Z',
        atualizadoEm: '2026-08-18T11:00:00Z',
      },
      {
        id: 'insp-02',
        empresaId: EMPRESA_PADRAO,
        numeroInspecao: 'IQ-REC-2026-0043',
        tipoInspecao: 'RECEBIMENTO',
        dataInspecao: '2026-08-20T14:15:00Z',
        inspetorId: 'insp-01',
        inspetorNome: 'Rafael Silveira (Auditor CQ)',
        modeloChecklistId: 'mod-chk-01',
        modeloChecklistTitulo: 'Inspeção de Recebimento de Matéria-Prima (Chapas e Bobinas de Aço)',
        fornecedorId: 'forn-gerdau-02',
        fornecedorNome: 'Gerdau Aços Longos e Planos',
        notaFiscalNumero: 'NF-e 012.304',
        pedidoCompraNumero: 'PC-2026-094',
        loteMaterial: 'LOT-GER-2026-112',
        corridaAco: 'CORR-44102-X',
        produtoCodigo: 'MP-CHAPA-A36-12.7',
        produtoDescricao: 'Chapa de Aço Carbono ASTM A36 12.7 x 1500 x 3000 mm',
        setor: 'RECEBIMENTO_MATERIA_PRIMA',
        tamanhoLote: 20,
        tamanhoAmostra: 4,
        unidadeMedida: 'CH',
        quantidadeAprovada: 0,
        quantidadeAprovadaComDesvio: 0,
        quantidadeReprovada: 20,
        quantidadeQuarentena: 20,
        quantidadeRetrabalho: 0,
        quantidadeRefugo: 0,
        disposicaoFinal: 'QUARENTENA',
        observacoesGerais: 'Espessura fora da tolerância da norma (apresentando 11.85 mm onde o mínimo é 12.30 mm) e oxidação severa tipo casca de laranja.',
        laudoTecnico: 'Lote reprovado na amostragem inicial. Segregado fisicamente na Área de Quarentena da Qualidade. RNC-2026-0012 emitida para devolução ao fornecedor.',
        rncGeradaId: 'rnc-01',
        rncNumero: 'RNC-2026-0012',
        fotosEvidencias: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'],
        respostas: [
          {
            id: 'resp-03',
            inspecaoId: 'insp-02',
            itemChecklistId: 'it-chk-02',
            sequencia: 2,
            tituloCriterio: 'Espessura Nominal da Chapa (#12.7 mm)',
            metodoInspecao: 'Medição micrométrica em 4 pontos',
            instrumentoMedicao: 'Micrômetro Digital',
            tipoValor: 'NUMERICO_TOLERANCIA',
            valorNominal: 12.7,
            toleranciaMin: 12.3,
            toleranciaMax: 13.1,
            unidadeMedida: 'mm',
            nivelCriticidade: 'CRITICO',
            conforme: false,
            valorMedidoNumerico: 11.85,
            desvioDetectado: -0.85,
            observacao: 'Espessura subdimensionada em -0.85 mm, inviabilizando cálculo estrutural de caldeiraria.',
            statusDisposicao: 'QUARENTENA',
          },
        ],
        criadoEm: '2026-08-20T14:15:00Z',
        atualizadoEm: '2026-08-20T15:00:00Z',
      },
      {
        id: 'insp-03',
        empresaId: EMPRESA_PADRAO,
        numeroInspecao: 'IP-LAS-2026-0105',
        tipoInspecao: 'PROCESSO',
        dataInspecao: '2026-08-22T08:45:00Z',
        inspetorId: 'insp-02',
        inspetorNome: 'Juliana Castro (Técnica de Qualidade)',
        modeloChecklistId: 'mod-chk-02',
        modeloChecklistTitulo: 'Inspeção em Processo - Corte a Laser Fibra Óptica',
        opId: 'op-2026-001',
        opNumero: 'OP-2026-001',
        operacaoId: 'op-oper-01',
        operacaoNome: 'Corte Laser Fibra das Longarinas Estruturais',
        maquinaId: 'maq-laser-01',
        maquinaNome: 'Laser Fibra Óptica 6kW TruLaser 3030',
        setor: 'CORTE_LASER',
        produtoCodigo: 'CJ-CHAS-01',
        produtoDescricao: 'Longarina Principal Estrutural Chassi #6.35mm',
        tamanhoLote: 10,
        tamanhoAmostra: 2,
        unidadeMedida: 'PC',
        quantidadeAprovada: 8,
        quantidadeAprovadaComDesvio: 0,
        quantidadeReprovada: 2,
        quantidadeQuarentena: 0,
        quantidadeRetrabalho: 2,
        quantidadeRefugo: 0,
        disposicaoFinal: 'RETRABALHO',
        observacoesGerais: '2 peças apresentaram rebarba pesada na borda inferior devido a desgaste de bico no corte do furo Ø22mm.',
        laudoTecnico: 'Encaminhadas 2 peças para esmerilhamento e rebarbação manual (Retrabalho RET-2026-0008). 8 peças liberadas para dobra.',
        rncGeradaId: 'rnc-02',
        rncNumero: 'RNC-2026-0014',
        fotosEvidencias: ['https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80'],
        respostas: [
          {
            id: 'resp-04',
            inspecaoId: 'insp-03',
            itemChecklistId: 'it-chk-07',
            sequencia: 3,
            tituloCriterio: 'Rugosidade da Face Cortada & Ausência de Rebarba Aderente',
            metodoInspecao: 'Inspeção visual e tátil',
            instrumentoMedicao: 'Padrão DIN EN ISO 9013',
            tipoValor: 'BOOLEANO',
            nivelCriticidade: 'MAIOR',
            conforme: false,
            desvioDetectado: 1.5,
            observacao: 'Escória aderida de 1.5 mm na face inferior do contorno.',
            statusDisposicao: 'RETRABALHO',
          },
        ],
        criadoEm: '2026-08-22T08:45:00Z',
        atualizadoEm: '2026-08-22T09:30:00Z',
      },
      {
        id: 'insp-04',
        empresaId: EMPRESA_PADRAO,
        numeroInspecao: 'IF-FIN-2026-0078',
        tipoInspecao: 'FINAL',
        dataInspecao: '2026-08-25T16:20:00Z',
        inspetorId: 'insp-01',
        inspetorNome: 'Rafael Silveira (Auditor CQ)',
        modeloChecklistId: 'mod-chk-03',
        modeloChecklistTitulo: 'Inspeção Final & Liberação para Expedição - Chassi e Estruturas',
        opId: 'op-2026-001',
        opNumero: 'OP-2026-001',
        setor: 'EXPEDICAO_QUALIDADE_FINAL',
        produtoCodigo: 'CJ-CHAS-01',
        produtoDescricao: 'Conjunto Estrutural Chassi Tubular Heavy-Duty',
        tamanhoLote: 10,
        tamanhoAmostra: 10,
        unidadeMedida: 'CJ',
        quantidadeAprovada: 10,
        quantidadeAprovadaComDesvio: 0,
        quantidadeReprovada: 0,
        quantidadeQuarentena: 0,
        quantidadeRetrabalho: 0,
        quantidadeRefugo: 0,
        disposicaoFinal: 'APROVADO',
        observacoesGerais: 'Inspeção dimensional final 100% aprovada. Espessura de tinta pó entre 88 e 115 µm. Identificação gravada e lacres colocados.',
        laudoTecnico: 'Lote de 10 conjuntos liberado para faturamento e carregamento no caminhão da transportadora.',
        fotosEvidencias: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'],
        respostas: [
          {
            id: 'resp-05',
            inspecaoId: 'insp-04',
            itemChecklistId: 'it-chk-08',
            sequencia: 1,
            tituloCriterio: 'Esquadro e Diagonal Geral do Conjunto Soldado',
            metodoInspecao: 'Medição cruzada de diagonais',
            instrumentoMedicao: 'Trena Laser Bosch',
            tipoValor: 'NUMERICO_TOLERANCIA',
            valorNominal: 3200.0,
            toleranciaMin: 3197.0,
            toleranciaMax: 3203.0,
            unidadeMedida: 'mm',
            nivelCriticidade: 'CRITICO',
            conforme: true,
            valorMedidoNumerico: 3201.2,
            desvioDetectado: 1.2,
            statusDisposicao: 'APROVADO',
          },
        ],
        criadoEm: '2026-08-25T16:20:00Z',
        atualizadoEm: '2026-08-25T17:00:00Z',
      },
    ];

    // 3. NÃO CONFORMIDADES (RNCs) INICIAIS
    this.naoConformidades = [
      {
        id: 'rnc-01',
        empresaId: EMPRESA_PADRAO,
        numeroRNC: 'RNC-2026-0012',
        titulo: 'Chapas A36 #12.7mm fora de espessura e oxidação severa',
        dataAbertura: '2026-08-20T14:30:00Z',
        status: 'EM_EXECUCAO',
        severidade: 'CRITICA',
        origem: 'INSPECAO_RECEBIMENTO',
        inspecaoOrigemId: 'insp-02',
        inspecaoOrigemNumero: 'IQ-REC-2026-0043',
        descricaoProblema: 'Lote de 20 chapas 12.7mm entregue com espessura média de 11.85mm (-0.85mm abaixo do nominal) e pontos de oxidação profunda com carepa solta.',
        detalhesTecnicosDefeito: 'A espessura de 11.85mm viola a tolerância ASTM A6 / NBR 11888 e compromete o momento fletor calculado no projeto estrutural do chassi de transporte.',
        produtoCodigo: 'MP-CHAPA-A36-12.7',
        produtoDescricao: 'Chapa de Aço Carbono ASTM A36 12.7 x 1500 x 3000 mm',
        lote: 'LOT-GER-2026-112',
        corridaAco: 'CORR-44102-X',
        fornecedorId: 'forn-gerdau-02',
        fornecedorNome: 'Gerdau Aços Longos e Planos',
        setor: 'RECEBIMENTO_MATERIA_PRIMA',
        quantidadeInspecionada: 20,
        quantidadeNaoConforme: 20,
        unidadeMedida: 'CH',
        valorPrejuizoEstimado: 28400.0,
        acaoDisposicaoImediata: 'Segregação total do lote em área de quarentena com fitas de bloqueio e emissão de notificação formal ao fornecedor.',
        responsavelDisposicao: 'Rafael Silveira (Auditor CQ)',
        dataDisposicao: '2026-08-20T15:00:00Z',
        resultadoDisposicao: 'QUARENTENA',
        causas: [
          {
            id: 'causa-01',
            rncId: 'rnc-01',
            categoriaIshikawa: 'MATERIAL',
            descricaoCausa: 'Desvio de laminação na usina siderúrgica e falha de embalagem protetiva contra umidade durante o transporte rodoviário.',
            metodo5Porques: {
              porQue1: 'Por que a chapa está abaixo da espessura? Porque foi laminada com folga negativa excessiva na usina.',
              porQue2: 'Por que foi liberada pela usina? Porque o controle de qualidade do fornecedor não detectou o desgaste nos cilindros de laminação.',
              porQue3: 'Por que oxidou tão rápido? Porque não recebeu óleo protetivo e pegou chuva durante o transporte em carreta aberta.',
              porQue4: 'Por que viajou aberta? Falha no protocolo de carregamento do fornecedor.',
              porQue5CausaRaiz: 'Ausência de auditoria de processo de expedição no fornecedor homologado Gerdau.',
            },
            identificadaPor: 'Eng. Qualidade Roberto Mendes',
            dataIdentificacao: '2026-08-21T10:00:00Z',
          },
        ],
        acoesCorretivas: [
          {
            id: 'ac-01',
            rncId: 'rnc-01',
            causaId: 'causa-01',
            descricaoAcao: 'Emissão de Nota Fiscal de Devolução e solicitação de reposição urgente do lote de 20 chapas sem custo.',
            tipoAcao: 'BLOQUEIO',
            responsavelNome: 'Mariana Lima',
            responsavelEmail: 'compras@tritech.ind.br',
            setorResponsavel: 'COMPRAS',
            prazoLimite: '2026-08-30T18:00:00Z',
            dataConclusao: '2026-08-24T16:00:00Z',
            status: 'CONCLUIDA',
            evidenciaUrl: 'https://docs.tritech.ind.br/nfe-devolucao-8841.pdf',
            observacoes: 'Fornecedor aceitou a devolução integral e emitiu carta de crédito.',
          },
          {
            id: 'ac-02',
            rncId: 'rnc-01',
            causaId: 'causa-01',
            descricaoAcao: 'Auditoria extraordinária de fornecedor na planta Gerdau e revisão do acordo de nível de serviço (SLA).',
            tipoAcao: 'CORRECAO_PROCESSO',
            responsavelNome: 'Roberto Mendes',
            responsavelEmail: 'qualidade.geral@tritech.ind.br',
            setorResponsavel: 'QUALIDADE',
            prazoLimite: '2026-09-15T18:00:00Z',
            status: 'EM_ANDAMENTO',
          },
        ],
        acoesPreventivas: [
          {
            id: 'ap-01',
            rncId: 'rnc-01',
            descricaoOportunidadeMelhoria: 'Exigir laudo ultrassônico e fotográfico pré-embarque para lotes acima de 15 toneladas de aço plano.',
            processoAfetado: 'HOMOLOGACAO_FORNECEDORES',
            responsavelNome: 'Roberto Mendes',
            responsavelEmail: 'qualidade.geral@tritech.ind.br',
            prazoLimite: '2026-09-30T18:00:00Z',
            status: 'PENDENTE',
            licaoAprendida: 'Fornecedores de grande porte precisam de verificação dimensional na porta antes do descarregamento da carreta.',
          },
        ],
        retrabalhos: [],
        refugos: [],
        responsavelAbertura: 'Rafael Silveira (Auditor CQ)',
        responsavelInvestigacao: 'Roberto Mendes (Eng. Qualidade)',
        responsavelAcoes: 'Mariana Lima / Roberto Mendes',
        prazoLimiteConclusao: '2026-09-15T18:00:00Z',
        evidencias: [
          {
            id: 'ev-01',
            titulo: 'Foto da Medição com Micrômetro 11.85mm',
            tipo: 'FOTO',
            url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
            dataUpload: '2026-08-20T14:35:00Z',
            descricao: 'Exibição digital do micrômetro Mitutoyo acusando espessura fora da especificação.',
          },
        ],
        criadoEm: '2026-08-20T14:30:00Z',
        atualizadoEm: '2026-08-24T16:00:00Z',
      },
      {
        id: 'rnc-02',
        empresaId: EMPRESA_PADRAO,
        numeroRNC: 'RNC-2026-0014',
        titulo: 'Rebarbas excessivas no corte laser da OP-2026-001',
        dataAbertura: '2026-08-22T09:00:00Z',
        status: 'AGUARDANDO_EFICACIA',
        severidade: 'MEDIA',
        origem: 'INSPECAO_PROCESSO',
        inspecaoOrigemId: 'insp-03',
        inspecaoOrigemNumero: 'IP-LAS-2026-0105',
        descricaoProblema: '2 peças de longarina cortadas no Laser 6kW apresentaram rebarba rígida de 1.5mm com escória fundida aderida.',
        detalhesTecnicosDefeito: 'Obstrução parcial do bico de corte duplo 2.0mm com queima assimétrica do jato de oxigênio auxiliar.',
        produtoCodigo: 'CJ-CHAS-01',
        produtoDescricao: 'Longarina Principal Estrutural Chassi #6.35mm',
        opId: 'op-2026-001',
        opNumero: 'OP-2026-001',
        maquinaId: 'maq-laser-01',
        maquinaNome: 'Laser Fibra Óptica 6kW TruLaser 3030',
        setor: 'CORTE_LASER',
        quantidadeInspecionada: 10,
        quantidadeNaoConforme: 2,
        unidadeMedida: 'PC',
        valorPrejuizoEstimado: 480.0,
        acaoDisposicaoImediata: 'Retrabalho manual de rebarbação e esmerilhamento com disco flap grão 60.',
        responsavelDisposicao: 'Juliana Castro',
        dataDisposicao: '2026-08-22T09:30:00Z',
        resultadoDisposicao: 'RETRABALHO',
        causas: [
          {
            id: 'causa-02',
            rncId: 'rnc-02',
            categoriaIshikawa: 'MAQUINA',
            descricaoCausa: 'Desgaste e respingos de cobre acumulados no orifício do bico de corte após 120 horas de operação sem troca preventiva.',
            metodo5Porques: {
              porQue1: 'Por que deu rebarba? Porque o fluxo de gás auxiliar saiu turbilhonado.',
              porQue2: 'Por que o gás turbilhonou? Porque a geometria interna do bico estava danificada.',
              porQue3: 'Por que o bico estava danificado? Porque acumulou respingos de perfuração sem limpeza.',
              porQue4: 'Por que o operador não limpou? Porque o ciclo automático de escovamento de bico falhou.',
              porQue5CausaRaiz: 'Falta de calibração periódica do sensor capacitivo de centragem e limpeza de bico.',
            },
            identificadaPor: 'Carlos Eduardo Silva (Operador Líder Laser)',
            dataIdentificacao: '2026-08-22T10:00:00Z',
          },
        ],
        acoesCorretivas: [
          {
            id: 'ac-03',
            rncId: 'rnc-02',
            causaId: 'causa-02',
            descricaoAcao: 'Substituição imediata do bico duplo cromado Ø 2.0 mm e centragem óptica do feixe laser.',
            tipoAcao: 'MANUTENCAO_PREVENTIVA',
            responsavelNome: 'Carlos Eduardo Silva',
            responsavelEmail: 'carlos.operador@tritech.ind.br',
            setorResponsavel: 'CORTE_LASER',
            prazoLimite: '2026-08-22T12:00:00Z',
            dataConclusao: '2026-08-22T10:45:00Z',
            status: 'CONCLUIDA',
            observacoes: 'Bico novo instalado, corte de teste aprovado sem rebarbas.',
          },
          {
            id: 'ac-04',
            rncId: 'rnc-02',
            causaId: 'causa-02',
            descricaoAcao: 'Retrabalho das 2 peças afetadas via esmerilhadeira e medição dimensional de espessura pós-desbaste.',
            tipoAcao: 'BLOQUEIO',
            responsavelNome: 'Marcos Vinícius Santos',
            responsavelEmail: 'marcos.operador@tritech.ind.br',
            setorResponsavel: 'CHAO_DE_FABRICA',
            prazoLimite: '2026-08-23T18:00:00Z',
            dataConclusao: '2026-08-23T14:00:00Z',
            status: 'CONCLUIDA',
          },
        ],
        acoesPreventivas: [
          {
            id: 'ap-02',
            rncId: 'rnc-02',
            descricaoOportunidadeMelhoria: 'Parametrizar no CNC da máquina parada preventiva de inspeção de bico a cada 50 perfurações em chapas acima de #6mm.',
            processoAfetado: 'CORTE_LASER',
            responsavelNome: 'Eng. Processos Felipe Albuquerque',
            responsavelEmail: 'felipe.engenharia@tritech.ind.br',
            prazoLimite: '2026-09-05T18:00:00Z',
            status: 'CONCLUIDA',
            dataConclusao: '2026-08-24T11:00:00Z',
            licaoAprendida: 'Chapas grossas exigem ciclo de limpeza de bico mais frequente para evitar retrabalho de caldeiraria.',
          },
        ],
        retrabalhos: [],
        refugos: [],
        responsavelAbertura: 'Juliana Castro',
        responsavelInvestigacao: 'Carlos Eduardo Silva / Eng. Felipe',
        responsavelAcoes: 'Carlos Eduardo / Marcos Vinícius',
        prazoLimiteConclusao: '2026-08-30T18:00:00Z',
        evidencias: [
          {
            id: 'ev-02',
            titulo: 'Foto da Rebarba e do Bico Danificado',
            tipo: 'FOTO',
            url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
            dataUpload: '2026-08-22T09:10:00Z',
          },
        ],
        avaliacaoEficaciaDescricao: 'Monitoradas 50 peças cortadas subsequentes na mesma máquina com zero ocorrência de rebarba. Eficácia comprovada.',
        eficaz: true,
        validadoPor: 'Roberto Mendes (Eng. Qualidade)',
        dataValidacaoEficacia: '2026-08-25T15:00:00Z',
        criadoEm: '2026-08-22T09:00:00Z',
        atualizadoEm: '2026-08-25T15:00:00Z',
      },
    ];

    // 4. RETRABALHOS INICIAIS
    this.retrabalhos = [
      {
        id: 'ret-01',
        empresaId: EMPRESA_PADRAO,
        numeroRetrabalho: 'RET-2026-0008',
        rncId: 'rnc-02',
        rncNumero: 'RNC-2026-0014',
        opOrigemId: 'op-2026-001',
        opOrigemNumero: 'OP-2026-001',
        produtoCodigo: 'CJ-CHAS-01',
        produtoDescricao: 'Longarina Principal Estrutural Chassi #6.35mm',
        quantidadeParaRetrabalhar: 2,
        quantidadeRetrabalhadaSucesso: 2,
        quantidadePerdidaAposRetrabalho: 0,
        unidadeMedida: 'PC',
        instrucaoRetrabalho: 'Esmerilhamento manual das rebarbas com disco flap e conferência de rugosidade.',
        setor: 'CORTE_LASER',
        maquinaId: 'maq-bancada-01',
        maquinaNome: 'Bancada de Ajustagem e Rebarbação',
        operadorNome: 'Marcos Vinícius Santos',
        horasEstimadas: 1.5,
        horasReais: 1.2,
        custoHoraParametrizado: 45.0,
        custoTotalRetrabalho: 54.0,
        dataInicio: '2026-08-23T10:00:00Z',
        dataFim: '2026-08-23T11:12:00Z',
        status: 'CONCLUIDO_REINSPECIONADO',
        aprovadoPor: 'Juliana Castro',
        criadoEm: '2026-08-22T09:30:00Z',
      },
      {
        id: 'ret-02',
        empresaId: EMPRESA_PADRAO,
        numeroRetrabalho: 'RET-2026-0009',
        opOrigemNumero: 'OP-2026-002',
        produtoCodigo: 'SUP-CALD-09',
        produtoDescricao: 'Suporte Caldeiraria Aço SAE 1020',
        quantidadeParaRetrabalhar: 5,
        quantidadeRetrabalhadaSucesso: 4,
        quantidadePerdidaAposRetrabalho: 1,
        unidadeMedida: 'PC',
        instrucaoRetrabalho: 'Re-dobra de abas com correção de raio de punção na Dobradeira Bystronic.',
        setor: 'DOBRA_CNC',
        maquinaId: 'maq-dobra-01',
        maquinaNome: 'Prensa Dobradeira CNC 220t Bystronic',
        operadorNome: 'Marcos Vinícius Santos',
        horasEstimadas: 2.0,
        horasReais: 2.5,
        custoHoraParametrizado: 140.0,
        custoTotalRetrabalho: 350.0,
        dataInicio: '2026-08-24T13:00:00Z',
        dataFim: '2026-08-24T15:30:00Z',
        status: 'CONCLUIDO_REINSPECIONADO',
        aprovadoPor: 'Rafael Silveira',
        criadoEm: '2026-08-24T11:00:00Z',
      },
    ];

    // 5. REFUGOS E SUCATAS INICIAIS
    this.refugos = [
      {
        id: 'ref-01',
        empresaId: EMPRESA_PADRAO,
        numeroRefugo: 'REF-2026-0031',
        opOrigemNumero: 'OP-2026-002',
        produtoCodigo: 'SUP-CALD-09',
        descricaoMaterial: 'Chapa conformada trincada no vinco de dobra 90°',
        motivoCategoria: 'TRINCA_DOBRA',
        detalheMotivo: 'Sentido de laminação da chapa paralelo ao raio de dobra, provocando fissura no dorso.',
        quantidadeRefugada: 1,
        unidadeMedida: 'PC',
        pesoTotalKg: 42.8,
        precoUnitarioKg: 12.5,
        custoTotalPrejuizo: 535.0,
        maquinaId: 'maq-dobra-01',
        maquinaNome: 'Prensa Dobradeira CNC 220t Bystronic',
        setor: 'DOBRA_CNC',
        destinoMaterial: 'SUCATA_VENDA',
        responsavelRegistro: 'Marcos Vinícius Santos',
        dataRegistro: '2026-08-24T15:35:00Z',
        status: 'SEGREGADO',
      },
      {
        id: 'ref-02',
        empresaId: EMPRESA_PADRAO,
        numeroRefugo: 'REF-2026-0032',
        opOrigemNumero: 'OP-2026-003',
        produtoCodigo: 'FLG-INOX-04',
        descricaoMaterial: 'Flange Inox 304 perfurada fora de centro',
        motivoCategoria: 'FALHA_PROGRAMA_CNC',
        detalheMotivo: 'Origem X0 Y0 deslocada em 8mm no programa DXF carregado.',
        quantidadeRefugada: 2,
        unidadeMedida: 'PC',
        pesoTotalKg: 18.2,
        precoUnitarioKg: 38.0,
        custoTotalPrejuizo: 691.6,
        maquinaId: 'maq-laser-01',
        maquinaNome: 'Laser Fibra Óptica 6kW TruLaser 3030',
        setor: 'CORTE_LASER',
        destinoMaterial: 'SUCATA_VENDA',
        responsavelRegistro: 'Carlos Eduardo Silva',
        dataRegistro: '2026-08-25T11:20:00Z',
        status: 'DESTINADO_SUCATA',
      },
    ];
  }

  // =========================================================================
  // MODELOS DE CHECKLIST CRUD
  // =========================================================================

  public listarModelosChecklist(empresaId: string, tipo?: TipoInspecao): ModeloChecklist[] {
    return this.modelosChecklist.filter((m) => {
      const matchEmp = !m.empresaId || m.empresaId === empresaId;
      const matchTipo = !tipo || m.tipoInspecao === tipo;
      return matchEmp && matchTipo;
    });
  }

  public obterModeloChecklistPorId(id: string, empresaId: string): ModeloChecklist | undefined {
    return this.modelosChecklist.find((m) => m.id === id && (!m.empresaId || m.empresaId === empresaId));
  }

  public criarModeloChecklist(empresaId: string, dados: Partial<ModeloChecklist>, usuarioEmail: string): ModeloChecklist {
    const novoModelo: ModeloChecklist = {
      id: `mod-chk-${Date.now()}`,
      empresaId,
      codigo: dados.codigo || `CHK-${Date.now().toString().slice(-4)}`,
      titulo: dados.titulo || 'Novo Modelo de Inspeção',
      versao: dados.versao || 'Rev. 01',
      tipoInspecao: dados.tipoInspecao || 'PROCESSO',
      setor: dados.setor || 'GERAL',
      produtoCodigo: dados.produtoCodigo,
      operacaoPadrao: dados.operacaoPadrao,
      descricao: dados.descricao || '',
      ativo: dados.ativo !== false,
      criadoPor: usuarioEmail || 'qualidade@tritech.ind.br',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      itens: dados.itens || [],
    };

    this.modelosChecklist.unshift(novoModelo);
    return novoModelo;
  }

  // =========================================================================
  // INSPEÇÕES DE QUALIDADE CRUD & REGISTRO
  // =========================================================================

  public listarInspecoes(empresaId: string, tipo?: TipoInspecao, disposicao?: DisposicaoQualidade): InspecaoQualidade[] {
    return this.inspecoes.filter((insp) => {
      const matchEmp = !insp.empresaId || insp.empresaId === empresaId;
      const matchTipo = !tipo || insp.tipoInspecao === tipo;
      const matchDisp = !disposicao || insp.disposicaoFinal === disposicao;
      return matchEmp && matchTipo && matchDisp;
    });
  }

  public obterInspecaoPorId(id: string, empresaId: string): InspecaoQualidade | undefined {
    return this.inspecoes.find((insp) => insp.id === id && (!insp.empresaId || insp.empresaId === empresaId));
  }

  public registrarInspecao(
    empresaId: string,
    dados: Partial<InspecaoQualidade>,
    usuarioNome: string,
    usuarioEmail: string
  ): { inspecao: InspecaoQualidade; rncGerada?: NaoConformidade } {
    const count = this.inspecoes.length + 1;
    const prefixo =
      dados.tipoInspecao === 'RECEBIMENTO' ? 'IQ-REC' : dados.tipoInspecao === 'PROCESSO' ? 'IP-PROC' : 'IF-FIN';
    const numeroInspecao = dados.numeroInspecao || `${prefixo}-2026-${String(count).padStart(4, '0')}`;

    // Processar respostas e aferir conformidades
    const respostasProcessadas: RespostaInspecao[] = (dados.respostas || []).map((resp, idx) => {
      let conforme = resp.conforme;
      let desvio = 0;

      if (resp.tipoValor === 'NUMERICO_TOLERANCIA' && resp.valorNominal !== undefined && resp.valorMedidoNumerico !== undefined) {
        desvio = Number((resp.valorMedidoNumerico - resp.valorNominal).toFixed(3));
        const min = resp.toleranciaMin !== undefined ? resp.valorNominal + resp.toleranciaMin : resp.valorNominal - 0.5;
        const max = resp.toleranciaMax !== undefined ? resp.valorNominal + resp.toleranciaMax : resp.valorNominal + 0.5;
        conforme = resp.valorMedidoNumerico >= min && resp.valorMedidoNumerico <= max;
      }

      return {
        id: resp.id || `resp-${Date.now()}-${idx}`,
        inspecaoId: '',
        itemChecklistId: resp.itemChecklistId || `it-${idx}`,
        sequencia: resp.sequencia || idx + 1,
        tituloCriterio: resp.tituloCriterio || 'Critério de Inspeção',
        metodoInspecao: resp.metodoInspecao || 'Visual / Medição',
        instrumentoMedicao: resp.instrumentoMedicao || 'Paquímetro',
        tipoValor: resp.tipoValor || 'BOOLEANO',
        valorNominal: resp.valorNominal,
        toleranciaMin: resp.toleranciaMin,
        toleranciaMax: resp.toleranciaMax,
        unidadeMedida: resp.unidadeMedida,
        nivelCriticidade: resp.nivelCriticidade || 'MAIOR',
        conforme,
        valorMedidoNumerico: resp.valorMedidoNumerico,
        valorMedidoTexto: resp.valorMedidoTexto,
        desvioDetectado: desvio,
        fotosEvidencia: resp.fotosEvidencia || [],
        observacao: resp.observacao || '',
        statusDisposicao: resp.statusDisposicao || (conforme ? 'APROVADO' : 'REPROVADO'),
      };
    });

    // Calcular Disposição Final
    let disposicaoCalculada: DisposicaoQualidade = dados.disposicaoFinal || 'APROVADO';
    const temNaoConforme = respostasProcessadas.some((r) => !r.conforme);

    if (temNaoConforme && disposicaoCalculada === 'APROVADO') {
      disposicaoCalculada = dados.tipoInspecao === 'RECEBIMENTO' ? 'QUARENTENA' : 'RETRABALHO';
    }

    const inspecaoId = `insp-${Date.now()}`;
    respostasProcessadas.forEach((r) => (r.inspecaoId = inspecaoId));

    let rncGerada: NaoConformidade | undefined = undefined;

    // Se houve reprovação / quarentena / sucata / retrabalho e solicitado gerar RNC
    if (
      temNaoConforme ||
      disposicaoCalculada === 'QUARENTENA' ||
      disposicaoCalculada === 'REPROVADO' ||
      disposicaoCalculada === 'SUCATA' ||
      disposicaoCalculada === 'RETRABALHO'
    ) {
      const rncCount = this.naoConformidades.length + 1;
      const numeroRNC = `RNC-2026-${String(rncCount).padStart(4, '0')}`;
      const rncId = `rnc-${Date.now()}`;

      rncGerada = {
        id: rncId,
        empresaId,
        numeroRNC,
        titulo: `Não Conformidade detectada em ${numeroInspecao} (${dados.produtoCodigo || 'Produto'})`,
        dataAbertura: new Date().toISOString(),
        status: 'ABERTA',
        severidade: disposicaoCalculada === 'SUCATA' || disposicaoCalculada === 'QUARENTENA' ? 'ALTA' : 'MEDIA',
        origem:
          dados.tipoInspecao === 'RECEBIMENTO'
            ? 'INSPECAO_RECEBIMENTO'
            : dados.tipoInspecao === 'PROCESSO'
            ? 'INSPECAO_PROCESSO'
            : 'INSPECAO_FINAL',
        inspecaoOrigemId: inspecaoId,
        inspecaoOrigemNumero: numeroInspecao,
        descricaoProblema:
          dados.observacoesGerais ||
          `Itens fora de especificação identificados na inspeção ${numeroInspecao}. Foram reprovados critérios de inspeção dimensional/visual.`,
        detalhesTecnicosDefeito: respostasProcessadas
          .filter((r) => !r.conforme)
          .map((r) => `${r.tituloCriterio}: medido ${r.valorMedidoNumerico || r.valorMedidoTexto || 'Não conforme'}`)
          .join('; '),
        produtoCodigo: dados.produtoCodigo || 'N/D',
        produtoDescricao: dados.produtoDescricao || 'Produto sob inspeção',
        lote: dados.loteMaterial,
        corridaAco: dados.corridaAco,
        opId: dados.opId,
        opNumero: dados.opNumero,
        maquinaId: dados.maquinaId,
        maquinaNome: dados.maquinaNome,
        fornecedorId: dados.fornecedorId,
        fornecedorNome: dados.fornecedorNome,
        setor: dados.setor || 'QUALIDADE',
        quantidadeInspecionada: dados.tamanhoAmostra || 1,
        quantidadeNaoConforme:
          dados.quantidadeReprovada || dados.quantidadeQuarentena || dados.quantidadeRetrabalho || 1,
        unidadeMedida: dados.unidadeMedida || 'PC',
        valorPrejuizoEstimado:
          disposicaoCalculada === 'SUCATA'
            ? (dados.quantidadeRefugo || 1) * 250
            : disposicaoCalculada === 'RETRABALHO'
            ? (dados.quantidadeRetrabalho || 1) * 80
            : 500,
        acaoDisposicaoImediata: `Segregação das peças e encaminhamento para ${disposicaoCalculada}.`,
        responsavelDisposicao: usuarioNome,
        dataDisposicao: new Date().toISOString(),
        resultadoDisposicao: disposicaoCalculada,
        causas: [],
        acoesCorretivas: [],
        acoesPreventivas: [],
        retrabalhos: [],
        refugos: [],
        responsavelAbertura: usuarioNome,
        responsavelInvestigacao: 'Eng. de Qualidade',
        responsavelAcoes: 'PCP / Produção / Qualidade',
        prazoLimiteConclusao: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        evidencias: dados.fotosEvidencias
          ? dados.fotosEvidencias.map((url, i) => ({
              id: `ev-${Date.now()}-${i}`,
              titulo: `Evidência Fotográfica ${i + 1}`,
              tipo: 'FOTO',
              url,
              dataUpload: new Date().toISOString(),
            }))
          : [],
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };

      this.naoConformidades.unshift(rncGerada);
    }

    const novaInspecao: InspecaoQualidade = {
      id: inspecaoId,
      empresaId,
      numeroInspecao,
      tipoInspecao: dados.tipoInspecao || 'PROCESSO',
      dataInspecao: dados.dataInspecao || new Date().toISOString(),
      inspetorId: dados.inspetorId || 'usr-insp-01',
      inspetorNome: usuarioNome || 'Auditor de Qualidade',
      modeloChecklistId: dados.modeloChecklistId || 'mod-chk-01',
      modeloChecklistTitulo: dados.modeloChecklistTitulo || 'Checklist de Inspeção',
      fornecedorId: dados.fornecedorId,
      fornecedorNome: dados.fornecedorNome,
      notaFiscalNumero: dados.notaFiscalNumero,
      pedidoCompraNumero: dados.pedidoCompraNumero,
      loteMaterial: dados.loteMaterial,
      corridaAco: dados.corridaAco,
      certificadoUsinaNumero: dados.certificadoUsinaNumero,
      certificadoUsinaAnexoUrl: dados.certificadoUsinaAnexoUrl,
      opId: dados.opId,
      opNumero: dados.opNumero,
      operacaoId: dados.operacaoId,
      operacaoNome: dados.operacaoNome,
      maquinaId: dados.maquinaId,
      maquinaNome: dados.maquinaNome,
      setor: dados.setor || 'QUALIDADE',
      produtoCodigo: dados.produtoCodigo || 'PROD-01',
      produtoDescricao: dados.produtoDescricao || 'Item inspecionado',
      tamanhoLote: dados.tamanhoLote || 1,
      tamanhoAmostra: dados.tamanhoAmostra || 1,
      unidadeMedida: dados.unidadeMedida || 'PC',
      quantidadeAprovada: dados.quantidadeAprovada || (disposicaoCalculada === 'APROVADO' ? dados.tamanhoLote || 1 : 0),
      quantidadeAprovadaComDesvio: dados.quantidadeAprovadaComDesvio || 0,
      quantidadeReprovada: dados.quantidadeReprovada || (disposicaoCalculada === 'REPROVADO' ? dados.tamanhoLote || 1 : 0),
      quantidadeQuarentena: dados.quantidadeQuarentena || (disposicaoCalculada === 'QUARENTENA' ? dados.tamanhoLote || 1 : 0),
      quantidadeRetrabalho: dados.quantidadeRetrabalho || (disposicaoCalculada === 'RETRABALHO' ? dados.tamanhoLote || 1 : 0),
      quantidadeRefugo: dados.quantidadeRefugo || (disposicaoCalculada === 'SUCATA' ? dados.tamanhoLote || 1 : 0),
      disposicaoFinal: disposicaoCalculada,
      observacoesGerais: dados.observacoesGerais || 'Inspeção finalizada com sucesso.',
      laudoTecnico: dados.laudoTecnico || `Laudo emitido por ${usuarioNome}. Disposição: ${disposicaoCalculada}.`,
      rncGeradaId: rncGerada?.id,
      rncNumero: rncGerada?.numeroRNC,
      fotosEvidencias: dados.fotosEvidencias || [],
      respostas: respostasProcessadas,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    this.inspecoes.unshift(novaInspecao);

    return { inspecao: novaInspecao, rncGerada };
  }

  // =========================================================================
  // NÃO CONFORMIDADES (RNCs) CRUD & GERENCIAMENTO
  // =========================================================================

  public listarNaoConformidades(empresaId: string, status?: StatusNC, severidade?: SeveridadeNC): NaoConformidade[] {
    return this.naoConformidades.filter((rnc) => {
      const matchEmp = !rnc.empresaId || rnc.empresaId === empresaId;
      const matchStatus = !status || rnc.status === status;
      const matchSev = !severidade || rnc.severidade === severidade;
      return matchEmp && matchStatus && matchSev;
    });
  }

  public obterNaoConformidadePorId(id: string, empresaId: string): NaoConformidade | undefined {
    return this.naoConformidades.find((rnc) => rnc.id === id && (!rnc.empresaId || rnc.empresaId === empresaId));
  }

  public criarNaoConformidade(empresaId: string, dados: Partial<NaoConformidade>, usuarioNome: string): NaoConformidade {
    const count = this.naoConformidades.length + 1;
    const numeroRNC = `RNC-2026-${String(count).padStart(4, '0')}`;

    const novaRNC: NaoConformidade = {
      id: `rnc-${Date.now()}`,
      empresaId,
      numeroRNC,
      titulo: dados.titulo || 'Nova Ocorrência de Não Conformidade',
      dataAbertura: dados.dataAbertura || new Date().toISOString(),
      status: dados.status || 'ABERTA',
      severidade: dados.severidade || 'MEDIA',
      origem: dados.origem || 'CHAO_DE_FABRICA',
      inspecaoOrigemId: dados.inspecaoOrigemId,
      inspecaoOrigemNumero: dados.inspecaoOrigemNumero,
      descricaoProblema: dados.descricaoProblema || '',
      detalhesTecnicosDefeito: dados.detalhesTecnicosDefeito || '',
      produtoCodigo: dados.produtoCodigo || 'PROD-01',
      produtoDescricao: dados.produtoDescricao || 'Material',
      lote: dados.lote,
      corridaAco: dados.corridaAco,
      opId: dados.opId,
      opNumero: dados.opNumero,
      pedidoNumero: dados.pedidoNumero,
      maquinaId: dados.maquinaId,
      maquinaNome: dados.maquinaNome,
      fornecedorId: dados.fornecedorId,
      fornecedorNome: dados.fornecedorNome,
      setor: dados.setor || 'PRODUCAO',
      quantidadeInspecionada: dados.quantidadeInspecionada || 1,
      quantidadeNaoConforme: dados.quantidadeNaoConforme || 1,
      unidadeMedida: dados.unidadeMedida || 'PC',
      valorPrejuizoEstimado: dados.valorPrejuizoEstimado || 0,
      acaoDisposicaoImediata: dados.acaoDisposicaoImediata || 'Segregação cautelar.',
      responsavelDisposicao: dados.responsavelDisposicao || usuarioNome,
      dataDisposicao: dados.dataDisposicao || new Date().toISOString(),
      resultadoDisposicao: dados.resultadoDisposicao || 'QUARENTENA',
      causas: dados.causas || [],
      acoesCorretivas: dados.acoesCorretivas || [],
      acoesPreventivas: dados.acoesPreventivas || [],
      retrabalhos: dados.retrabalhos || [],
      refugos: dados.refugos || [],
      responsavelAbertura: usuarioNome || 'Auditor',
      responsavelInvestigacao: dados.responsavelInvestigacao || 'Eng. Qualidade',
      responsavelAcoes: dados.responsavelAcoes || 'Líder de Produção',
      prazoLimiteConclusao: dados.prazoLimiteConclusao || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      evidencias: dados.evidencias || [],
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    this.naoConformidades.unshift(novaRNC);
    return novaRNC;
  }

  public adicionarCausaIshikawa(
    rncId: string,
    empresaId: string,
    causa: {
      categoriaIshikawa: CategoriaIshikawa;
      descricaoCausa: string;
      metodo5Porques: { porQue1: string; porQue2: string; porQue3: string; porQue4: string; porQue5CausaRaiz: string };
      identificadaPor: string;
    }
  ): NaoConformidade {
    const rnc = this.obterNaoConformidadePorId(rncId, empresaId);
    if (!rnc) throw new Error(`RNC ${rncId} não encontrada`);

    const novaCausa: CausaNC = {
      id: `causa-${Date.now()}`,
      rncId,
      categoriaIshikawa: causa.categoriaIshikawa,
      descricaoCausa: causa.descricaoCausa,
      metodo5Porques: causa.metodo5Porques,
      identificadaPor: causa.identificadaPor,
      dataIdentificacao: new Date().toISOString(),
    };

    rnc.causas.push(novaCausa);
    if (rnc.status === 'ABERTA') {
      rnc.status = 'EM_INVESTIGACAO';
    }
    rnc.atualizadoEm = new Date().toISOString();

    return rnc;
  }

  public adicionarAcaoCorretiva(rncId: string, empresaId: string, acao: Partial<AcaoCorretivaNC>): NaoConformidade {
    const rnc = this.obterNaoConformidadePorId(rncId, empresaId);
    if (!rnc) throw new Error(`RNC ${rncId} não encontrada`);

    const novaAcao: AcaoCorretivaNC = {
      id: `ac-${Date.now()}`,
      rncId,
      causaId: acao.causaId,
      descricaoAcao: acao.descricaoAcao || '',
      tipoAcao: acao.tipoAcao || 'CORRECAO_PROCESSO',
      responsavelNome: acao.responsavelNome || 'Responsável Ação',
      responsavelEmail: acao.responsavelEmail || 'responsavel@tritech.ind.br',
      setorResponsavel: acao.setorResponsavel || 'PRODUCAO',
      prazoLimite: acao.prazoLimite || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: acao.status || 'PENDENTE',
      evidenciaUrl: acao.evidenciaUrl,
      observacoes: acao.observacoes,
    };

    rnc.acoesCorretivas.push(novaAcao);
    if (rnc.status === 'ABERTA' || rnc.status === 'EM_INVESTIGACAO') {
      rnc.status = 'PLANO_ACAO_DEFINIDO';
    }
    rnc.atualizadoEm = new Date().toISOString();

    return rnc;
  }

  public adicionarAcaoPreventiva(rncId: string, empresaId: string, acao: Partial<AcaoPreventivaNC>): NaoConformidade {
    const rnc = this.obterNaoConformidadePorId(rncId, empresaId);
    if (!rnc) throw new Error(`RNC ${rncId} não encontrada`);

    const novaAcao: AcaoPreventivaNC = {
      id: `ap-${Date.now()}`,
      rncId,
      descricaoOportunidadeMelhoria: acao.descricaoOportunidadeMelhoria || '',
      processoAfetado: acao.processoAfetado || 'PROCESSO_GERAL',
      responsavelNome: acao.responsavelNome || 'Eng. Qualidade',
      responsavelEmail: acao.responsavelEmail || 'qualidade@tritech.ind.br',
      prazoLimite: acao.prazoLimite || new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      status: acao.status || 'PENDENTE',
      licaoAprendida: acao.licaoAprendida || '',
    };

    rnc.acoesPreventivas.push(novaAcao);
    rnc.atualizadoEm = new Date().toISOString();

    return rnc;
  }

  public validarEficaciaRNC(
    rncId: string,
    empresaId: string,
    dados: { eficaz: boolean; descricao: string; validadoPor: string }
  ): NaoConformidade {
    const rnc = this.obterNaoConformidadePorId(rncId, empresaId);
    if (!rnc) throw new Error(`RNC ${rncId} não encontrada`);

    rnc.eficaz = dados.eficaz;
    rnc.avaliacaoEficaciaDescricao = dados.descricao;
    rnc.validadoPor = dados.validadoPor;
    rnc.dataValidacaoEficacia = new Date().toISOString();
    rnc.status = dados.eficaz ? 'EFICAZ_CONCLUIDA' : 'INEFICAZ_REABERTA';
    if (dados.eficaz) {
      rnc.dataConclusaoReal = new Date().toISOString();
    }
    rnc.atualizadoEm = new Date().toISOString();

    return rnc;
  }

  // =========================================================================
  // RETRABALHOS & REFUGOS CRUD
  // =========================================================================

  public listarRetrabalhos(empresaId: string): RetrabalhoQualidade[] {
    return this.retrabalhos.filter((r) => !r.empresaId || r.empresaId === empresaId);
  }

  public criarOrdemRetrabalho(
    empresaId: string,
    dados: Partial<RetrabalhoQualidade>,
    usuarioNome: string
  ): RetrabalhoQualidade {
    const count = this.retrabalhos.length + 1;
    const numeroRetrabalho = `RET-2026-${String(count).padStart(4, '0')}`;
    const custoHora = dados.custoHoraParametrizado || 50.0;
    const horasEst = dados.horasEstimadas || 2.0;

    const novoRetrabalho: RetrabalhoQualidade = {
      id: `ret-${Date.now()}`,
      empresaId,
      numeroRetrabalho,
      rncId: dados.rncId,
      rncNumero: dados.rncNumero,
      opOrigemId: dados.opOrigemId,
      opOrigemNumero: dados.opOrigemNumero,
      produtoCodigo: dados.produtoCodigo || 'PROD-01',
      produtoDescricao: dados.produtoDescricao || 'Peça em retrabalho',
      quantidadeParaRetrabalhar: dados.quantidadeParaRetrabalhar || 1,
      quantidadeRetrabalhadaSucesso: 0,
      quantidadePerdidaAposRetrabalho: 0,
      unidadeMedida: dados.unidadeMedida || 'PC',
      instrucaoRetrabalho: dados.instrucaoRetrabalho || 'Correção dimensional / rebarbação.',
      setor: dados.setor || 'CHAO_DE_FABRICA',
      maquinaId: dados.maquinaId,
      maquinaNome: dados.maquinaNome,
      operadorNome: dados.operadorNome || 'Operador Especialista',
      horasEstimadas: horasEst,
      horasReais: 0,
      custoHoraParametrizado: custoHora,
      custoTotalRetrabalho: Number((horasEst * custoHora).toFixed(2)),
      status: 'SOLICITADO',
      aprovadoPor: usuarioNome,
      criadoEm: new Date().toISOString(),
    };

    this.retrabalhos.unshift(novoRetrabalho);

    // Se vinculado a uma RNC, anexa a ela
    if (dados.rncId) {
      const rnc = this.obterNaoConformidadePorId(dados.rncId, empresaId);
      if (rnc) {
        rnc.retrabalhos.push(novoRetrabalho);
      }
    }

    return novoRetrabalho;
  }

  public listarRefugos(empresaId: string): RefugoQualidade[] {
    return this.refugos.filter((r) => !r.empresaId || r.empresaId === empresaId);
  }

  public registrarRefugo(empresaId: string, dados: Partial<RefugoQualidade>, usuarioNome: string): RefugoQualidade {
    const count = this.refugos.length + 1;
    const numeroRefugo = `REF-2026-${String(count).padStart(4, '0')}`;
    const pesoKg = dados.pesoTotalKg || 10;
    const precoKg = dados.precoUnitarioKg || 12.0;
    const custoPrejuizo = dados.custoTotalPrejuizo || Number((pesoKg * precoKg).toFixed(2));

    const novoRefugo: RefugoQualidade = {
      id: `ref-${Date.now()}`,
      empresaId,
      numeroRefugo,
      rncId: dados.rncId,
      rncNumero: dados.rncNumero,
      inspecaoId: dados.inspecaoId,
      opOrigemNumero: dados.opOrigemNumero,
      produtoCodigo: dados.produtoCodigo || 'PROD-01',
      descricaoMaterial: dados.descricaoMaterial || 'Sucata de Produção',
      motivoCategoria: dados.motivoCategoria || 'FALHA_DIMENSIONAL',
      detalheMotivo: dados.detalheMotivo || '',
      quantidadeRefugada: dados.quantidadeRefugada || 1,
      unidadeMedida: dados.unidadeMedida || 'PC',
      pesoTotalKg: pesoKg,
      precoUnitarioKg: precoKg,
      custoTotalPrejuizo: custoPrejuizo,
      fornecedorId: dados.fornecedorId,
      fornecedorNome: dados.fornecedorNome,
      maquinaId: dados.maquinaId,
      maquinaNome: dados.maquinaNome,
      setor: dados.setor || 'PRODUCAO',
      destinoMaterial: dados.destinoMaterial || 'SUCATA_VENDA',
      notaDevolucaoFornecedor: dados.notaDevolucaoFornecedor,
      responsavelRegistro: usuarioNome,
      dataRegistro: new Date().toISOString(),
      status: 'SEGREGADO',
    };

    this.refugos.unshift(novoRefugo);

    // Se vinculado a uma RNC, anexa a ela
    if (dados.rncId) {
      const rnc = this.obterNaoConformidadePorId(dados.rncId, empresaId);
      if (rnc) {
        rnc.refugos.push(novoRefugo);
      }
    }

    return novoRefugo;
  }

  // =========================================================================
  // INDICADORES DE QUALIDADE & DASHBOARD DE PARETO
  // =========================================================================

  public obterIndicadoresQualidade(empresaId: string): IndicadoresQualidade {
    const inspecoes = this.listarInspecoes(empresaId);
    const rncs = this.listarNaoConformidades(empresaId);
    const retrabalhos = this.listarRetrabalhos(empresaId);
    const refugos = this.listarRefugos(empresaId);

    const totalInspecoes = inspecoes.length;
    let totalAprovadas = 0;
    let totalAprovadasComDesvio = 0;
    let totalReprovadas = 0;
    let totalQuarentena = 0;
    let totalRetrabalho = 0;
    let totalSucata = 0;

    inspecoes.forEach((insp) => {
      if (insp.disposicaoFinal === 'APROVADO') totalAprovadas++;
      else if (insp.disposicaoFinal === 'APROVADO_COM_DESVIO') totalAprovadasComDesvio++;
      else if (insp.disposicaoFinal === 'REPROVADO') totalReprovadas++;
      else if (insp.disposicaoFinal === 'QUARENTENA') totalQuarentena++;
      else if (insp.disposicaoFinal === 'RETRABALHO') totalRetrabalho++;
      else if (insp.disposicaoFinal === 'SUCATA') totalSucata++;
    });

    const taxaAprovacaoPercentual =
      totalInspecoes > 0 ? Number((((totalAprovadas + totalAprovadasComDesvio) / totalInspecoes) * 100).toFixed(1)) : 100;

    // Refugos
    const pesoTotalRefugadoKg = Number(refugos.reduce((acc, r) => acc + (r.pesoTotalKg || 0), 0).toFixed(1));
    const custoTotalRefugo = Number(refugos.reduce((acc, r) => acc + (r.custoTotalPrejuizo || 0), 0).toFixed(2));
    const indiceRefugoPercentual =
      totalInspecoes > 0 ? Number(((refugos.length / Math.max(1, totalInspecoes * 10)) * 100).toFixed(2)) : 0.8;

    // Retrabalhos
    const horasTotaisRetrabalho = Number(retrabalhos.reduce((acc, r) => acc + (r.horasReais || r.horasEstimadas || 0), 0).toFixed(1));
    const custoTotalRetrabalho = Number(retrabalhos.reduce((acc, r) => acc + (r.custoTotalRetrabalho || 0), 0).toFixed(2));
    const indiceRetrabalhoPercentual =
      totalInspecoes > 0 ? Number(((retrabalhos.length / Math.max(1, totalInspecoes * 5)) * 100).toFixed(2)) : 1.4;

    // Custo da Não Qualidade (CNQ)
    const custoPerdasFornecedor = rncs
      .filter((r) => r.origem === 'INSPECAO_RECEBIMENTO')
      .reduce((acc, r) => acc + (r.valorPrejuizoEstimado || 0), 0);
    const custoNaoQualidadeTotal = Number((custoTotalRefugo + custoTotalRetrabalho + custoPerdasFornecedor).toFixed(2));
    const custoCNQPorFaturamentoEstimadoPercentual = 2.1; // 2.1% do faturamento bruto do grupo

    // RNCs status
    const totalRNCs = rncs.length;
    const rncsAbertas = rncs.filter((r) => r.status === 'ABERTA' || r.status === 'EM_INVESTIGACAO').length;
    const rncsEmExecucao = rncs.filter((r) => r.status === 'EM_EXECUCAO' || r.status === 'PLANO_ACAO_DEFINIDO').length;
    const rncsAguardandoEficacia = rncs.filter((r) => r.status === 'AGUARDANDO_EFICACIA').length;
    const rncsConcluidasEficazes = rncs.filter((r) => r.status === 'EFICAZ_CONCLUIDA').length;
    const rncsCriticas = rncs.filter((r) => r.severidade === 'CRITICA').length;

    // 1. Ranking / Pareto por Fornecedor
    const fornecedorMap = new Map<string, { nome: string; totalInsp: number; totalNCs: number; custo: number; defeitos: Set<string> }>();

    inspecoes
      .filter((i) => i.tipoInspecao === 'RECEBIMENTO' && i.fornecedorNome)
      .forEach((insp) => {
        const id = insp.fornecedorId || insp.fornecedorNome!;
        const curr = fornecedorMap.get(id) || {
          nome: insp.fornecedorNome!,
          totalInsp: 0,
          totalNCs: 0,
          custo: 0,
          defeitos: new Set<string>(),
        };
        curr.totalInsp++;
        if (insp.disposicaoFinal !== 'APROVADO') {
          curr.totalNCs++;
          curr.defeitos.add(insp.observacoesGerais.substring(0, 40));
        }
        fornecedorMap.set(id, curr);
      });

    rncs
      .filter((r) => r.fornecedorNome)
      .forEach((r) => {
        const id = r.fornecedorId || r.fornecedorNome!;
        const curr = fornecedorMap.get(id) || {
          nome: r.fornecedorNome!,
          totalInsp: 1,
          totalNCs: 0,
          custo: 0,
          defeitos: new Set<string>(),
        };
        curr.totalNCs++;
        curr.custo += r.valorPrejuizoEstimado || 0;
        curr.defeitos.add(r.titulo.substring(0, 40));
        fornecedorMap.set(id, curr);
      });

    // Se vazio, adiciona dados representativos da siderurgia
    if (fornecedorMap.size === 0) {
      fornecedorMap.set('forn-gerdau', {
        nome: 'Gerdau Aços Longos e Planos',
        totalInsp: 14,
        totalNCs: 3,
        custo: 28400.0,
        defeitos: new Set(['Espessura fora de tolerância', 'Oxidação superficial']),
      });
      fornecedorMap.set('forn-usiminas', {
        nome: 'Usiminas S/A - Aço Plano',
        totalInsp: 22,
        totalNCs: 1,
        custo: 3200.0,
        defeitos: new Set(['Empeno de borda na bobina']),
      });
      fornecedorMap.set('forn-arcelor', {
        nome: 'ArcelorMittal Tubos e Perfis',
        totalInsp: 18,
        totalNCs: 2,
        custo: 5100.0,
        defeitos: new Set(['Costura de solda com rebarba interna']),
      });
    }

    const ncPorFornecedor = Array.from(fornecedorMap.entries()).map(([id, val]) => ({
      fornecedorId: id,
      fornecedorNome: val.nome,
      totalInspecoes: val.totalInsp,
      totalNCs: val.totalNCs,
      taxaRejeicaoPercentual: val.totalInsp > 0 ? Number(((val.totalNCs / val.totalInsp) * 100).toFixed(1)) : 0,
      custoPrejuizo: Number(val.custo.toFixed(2)),
      principaisDefeitos: Array.from(val.defeitos),
    }));

    // 2. Ranking / Pareto por Máquina
    const maquinaMap = new Map<string, { nome: string; setor: string; totalNCs: number; pecas: number; horas: number; custo: number; defeitos: Set<string> }>();

    rncs
      .filter((r) => r.maquinaNome)
      .forEach((r) => {
        const id = r.maquinaId || r.maquinaNome!;
        const curr = maquinaMap.get(id) || {
          nome: r.maquinaNome!,
          setor: r.setor || 'USINAGEM',
          totalNCs: 0,
          pecas: 0,
          horas: 0,
          custo: 0,
          defeitos: new Set<string>(),
        };
        curr.totalNCs++;
        curr.pecas += r.quantidadeNaoConforme || 1;
        curr.custo += r.valorPrejuizoEstimado || 0;
        curr.defeitos.add(r.titulo.substring(0, 40));
        maquinaMap.set(id, curr);
      });

    retrabalhos
      .filter((ret) => ret.maquinaNome)
      .forEach((ret) => {
        const id = ret.maquinaId || ret.maquinaNome!;
        const curr = maquinaMap.get(id) || {
          nome: ret.maquinaNome!,
          setor: ret.setor || 'CHAO_DE_FABRICA',
          totalNCs: 0,
          pecas: 0,
          horas: 0,
          custo: 0,
          defeitos: new Set<string>(),
        };
        curr.horas += ret.horasReais || ret.horasEstimadas;
        curr.custo += ret.custoTotalRetrabalho;
        maquinaMap.set(id, curr);
      });

    refugos
      .filter((ref) => ref.maquinaNome)
      .forEach((ref) => {
        const id = ref.maquinaId || ref.maquinaNome!;
        const curr = maquinaMap.get(id) || {
          nome: ref.maquinaNome!,
          setor: ref.setor || 'PRODUCAO',
          totalNCs: 0,
          pecas: 0,
          horas: 0,
          custo: 0,
          defeitos: new Set<string>(),
        };
        curr.pecas += ref.quantidadeRefugada;
        curr.custo += ref.custoTotalPrejuizo;
        curr.defeitos.add(ref.motivoCategoria);
        maquinaMap.set(id, curr);
      });

    if (maquinaMap.size === 0) {
      maquinaMap.set('maq-laser-01', {
        nome: 'Laser Fibra Óptica 6kW TruLaser 3030',
        setor: 'CORTE_LASER',
        totalNCs: 4,
        pecas: 6,
        horas: 3.5,
        custo: 1171.6,
        defeitos: new Set(['Rebarbas aderidas', 'Deslocamento de origem']),
      });
      maquinaMap.set('maq-dobra-01', {
        nome: 'Prensa Dobradeira CNC 220t Bystronic',
        setor: 'DOBRA_CNC',
        totalNCs: 3,
        pecas: 5,
        horas: 2.5,
        custo: 885.0,
        defeitos: new Set(['Trinca no vinco 90°', 'Desvio angular']),
      });
      maquinaMap.set('maq-solda-01', {
        nome: 'Mesa de Solda Caldeiraria MIG/MAG Miller',
        setor: 'SOLDA_CALDEIRARIA',
        totalNCs: 2,
        pecas: 2,
        horas: 4.0,
        custo: 620.0,
        defeitos: new Set(['Porosidade e mordedura de cordão']),
      });
    }

    const ncPorMaquina = Array.from(maquinaMap.entries()).map(([id, val]) => ({
      maquinaId: id,
      maquinaNome: val.nome,
      setor: val.setor,
      totalNCs: val.totalNCs,
      pecasAfetadas: val.pecas,
      horasRetrabalho: Number(val.horas.toFixed(1)),
      custoPerda: Number(val.custo.toFixed(2)),
      principaisDefeitos: Array.from(val.defeitos),
    }));

    // 3. Ranking / Pareto por Processo / Setor
    const setoresDisponiveis = [
      { setor: 'RECEBIMENTO_MATERIA_PRIMA', nome: 'Recebimento & Suprimentos' },
      { setor: 'CORTE_LASER', nome: 'Corte a Laser & Plasma' },
      { setor: 'DOBRA_CNC', nome: 'Dobra CNC & Conformação' },
      { setor: 'SOLDA_CALDEIRARIA', nome: 'Soldagem MIG/TIG & Caldeiraria' },
      { setor: 'PINTURA_TRATAMENTO', nome: 'Tratamento & Pintura Eletrostática' },
      { setor: 'EXPEDICAO_QUALIDADE_FINAL', nome: 'Montagem & Expedição Final' },
    ];

    const ncPorProcesso = setoresDisponiveis.map((s) => {
      const inspsSetor = inspecoes.filter((i) => i.setor === s.setor || i.setor.includes(s.setor.split('_')[0]));
      const rncsSetor = rncs.filter((r) => r.setor === s.setor || r.setor.includes(s.setor.split('_')[0]));
      const retSetor = retrabalhos.filter((r) => r.setor === s.setor || r.setor.includes(s.setor.split('_')[0]));
      const refSetor = refugos.filter((r) => r.setor === s.setor || r.setor.includes(s.setor.split('_')[0]));

      const totalInsp = Math.max(inspsSetor.length, rncsSetor.length * 2 + 3);
      const totalNCs = rncsSetor.length + inspsSetor.filter((i) => i.disposicaoFinal !== 'APROVADO').length;
      const custoCNQ =
        rncsSetor.reduce((a, b) => a + (b.valorPrejuizoEstimado || 0), 0) +
        retSetor.reduce((a, b) => a + b.custoTotalRetrabalho, 0) +
        refSetor.reduce((a, b) => a + b.custoTotalPrejuizo, 0);

      return {
        setor: s.setor,
        nomeSetor: s.nome,
        totalInspecoes: totalInsp,
        totalNCs,
        taxaReprovacaoPercentual: totalInsp > 0 ? Number(((totalNCs / totalInsp) * 100).toFixed(1)) : 0,
        custoCNQ: Number(custoCNQ.toFixed(2)),
      };
    });

    return {
      empresaId,
      periodoReferencia: 'Agosto/2026 (Mensal Acumulado)',
      totalInspecoes,
      totalAprovadas,
      totalAprovadasComDesvio,
      totalReprovadas,
      totalQuarentena,
      totalRetrabalho,
      totalSucata,
      taxaAprovacaoPercentual,
      indiceRefugoPercentual,
      pesoTotalRefugadoKg,
      custoTotalRefugo,
      indiceRetrabalhoPercentual,
      horasTotaisRetrabalho,
      custoTotalRetrabalho,
      custoNaoQualidadeTotal,
      custoCNQPorFaturamentoEstimadoPercentual,
      totalRNCs,
      rncsAbertas,
      rncsEmExecucao,
      rncsAguardandoEficacia,
      rncsConcluidasEficazes,
      rncsCriticas,
      ncPorFornecedor,
      ncPorMaquina,
      ncPorProcesso,
    };
  }
}

export const qualidadeService = new QualidadeService();
