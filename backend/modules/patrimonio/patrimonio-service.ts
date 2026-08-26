// backend/modules/patrimonio/patrimonio-service.ts

import {
  AtivoPatrimonial,
  FerramentaControle,
  InstrumentoCalibracao,
  AlertaPatrimonioCalibracao,
  IndicadoresPatrimonioCalibracao,
  CategoriaPatrimonio,
  CondicaoFerramenta,
  MotivoBaixaPatrimonio,
  CategoriaFerramenta,
  TipoInstrumentoCalibracao,
} from './patrimonio-types';

export class PatrimonioCalibracaoService {
  private ativos: Map<string, AtivoPatrimonial[]> = new Map();
  private ferramentas: Map<string, FerramentaControle[]> = new Map();
  private instrumentos: Map<string, InstrumentoCalibracao[]> = new Map();

  constructor() {
    this.inicializarDadosMock();
  }

  private inicializarDadosMock() {
    // Empresa 1: TRITECH MATRIZ SP (emp-01)
    const emp01Ativos: AtivoPatrimonial[] = [
      {
        id: 'pat-001',
        codigoPatrimonio: 'PAT-TRI-00101',
        nome: 'Centro de Usinagem 5 Eixos Hermle C42U',
        categoria: 'MAQUINAS_EQUIPAMENTOS',
        empresaId: 'emp-01',
        empresaNome: 'TRITECH Matriz Industrial SP',
        localizacao: 'Galpão 1 - Célula Usinagem Pesada',
        responsavel: 'Carlos Eduardo Mendes',
        departamento: 'Usinagem CNC',
        valorAquisicao: 2850000.0,
        dataAquisicao: '2023-03-15',
        numeroNotaFiscal: 'NF-e 88.421',
        fornecedor: 'Hermle AG Alemanha Import',
        status: 'ATIVO',
        numeroSerie: 'HERM-2023-9941',
        historico: [
          {
            id: 'hist-pat-1',
            data: '2023-03-15',
            tipo: 'AQUISICAO',
            descricao: 'Aquisição e ativação patrimonial com montagem técnica de base.',
            usuario: 'Diretoria de Operações',
          },
          {
            id: 'hist-pat-2',
            data: '2024-02-10',
            tipo: 'INVENTARIO',
            descricao: 'Conferência física no inventário cíclico anual - Etiqueta RFID OK.',
            usuario: 'Auditor Patrimonial',
          },
        ],
        estruturaDepreciacaoFutura: {
          metodo: 'LINEAR',
          vidaUtilMeses: 120, // 10 anos
          taxaAnualPercentual: 10.0,
          valorResidualEstimado: 285000.0,
          depreciacaoAcumuladaEstimada: 807500.0,
          valorContabilProjetado: 2042500.0,
          observacaoIntegracao: 'Estrutura preparada para depreciação contábil futura linear (10% a.a.). Sem lançamentos fiscais automáticos nesta fase.',
        },
        criadoEm: '2023-03-15T09:00:00Z',
        atualizadoEm: '2026-08-20T14:30:00Z',
      },
      {
        id: 'pat-002',
        codigoPatrimonio: 'PAT-TRI-00102',
        nome: 'Máquina de Corte a Laser Fibra Óptica 12kW',
        categoria: 'MAQUINAS_EQUIPAMENTOS',
        empresaId: 'emp-01',
        empresaNome: 'TRITECH Matriz Industrial SP',
        localizacao: 'Galpão 2 - Corte & Conformação',
        responsavel: 'Ricardo Fonseca',
        departamento: 'Caldeiraria & Corte',
        valorAquisicao: 1950000.0,
        dataAquisicao: '2022-11-20',
        numeroNotaFiscal: 'NF-e 76.104',
        fornecedor: 'Bodor Laser Indústria',
        status: 'ATIVO',
        numeroSerie: 'BOD-12KW-7721',
        historico: [
          {
            id: 'hist-pat-3',
            data: '2022-11-20',
            tipo: 'AQUISICAO',
            descricao: 'Recebimento e tombamento patrimonial.',
            usuario: 'Engenharia de Fábrica',
          },
        ],
        estruturaDepreciacaoFutura: {
          metodo: 'LINEAR',
          vidaUtilMeses: 120,
          taxaAnualPercentual: 10.0,
          valorResidualEstimado: 195000.0,
          depreciacaoAcumuladaEstimada: 682500.0,
          valorContabilProjetado: 1267500.0,
          observacaoIntegracao: 'Preparado para módulo contábil futuro.',
        },
        criadoEm: '2022-11-20T10:00:00Z',
        atualizadoEm: '2026-08-20T10:00:00Z',
      },
      {
        id: 'pat-003',
        codigoPatrimonio: 'PAT-TRI-00103',
        nome: 'Empilhadeira Elétrica Retrátil 2.5 Toneladas',
        categoria: 'VEICULOS_LOGISTICA',
        empresaId: 'emp-01',
        empresaNome: 'TRITECH Matriz Industrial SP',
        localizacao: 'Almoxarifado Geral de Chapas',
        responsavel: null, // ALERTA: Ativo sem responsável
        departamento: 'Logística & Expedição',
        valorAquisicao: 240000.0,
        dataAquisicao: '2023-08-10',
        numeroNotaFiscal: 'NF-e 44.119',
        fornecedor: 'Toyota Material Handling Brasil',
        status: 'ATIVO',
        numeroSerie: 'TOY-EMP-2023-55',
        historico: [
          {
            id: 'hist-pat-4',
            data: '2023-08-10',
            tipo: 'AQUISICAO',
            descricao: 'Aquisição da frota logística interna.',
            usuario: 'Gerência de Suprimentos',
          },
          {
            id: 'hist-pat-5',
            data: '2026-07-01',
            tipo: 'TROCA_RESPONSAVEL',
            descricao: 'Desligamento do operador anterior. Pendente indicação de novo encarregado custodiante.',
            usuario: 'RH / Gestão de Pessoas',
            responsavelAnterior: 'Marcos Vinicius',
            responsavelNovo: 'PENDENTE',
          },
        ],
        estruturaDepreciacaoFutura: {
          metodo: 'LINEAR',
          vidaUtilMeses: 60, // 5 anos para veículos
          taxaAnualPercentual: 20.0,
          valorResidualEstimado: 24000.0,
          depreciacaoAcumuladaEstimada: 144000.0,
          valorContabilProjetado: 96000.0,
          observacaoIntegracao: 'Veículo operacional interno (taxa de depreciação de 20% a.a.).',
        },
        criadoEm: '2023-08-10T11:00:00Z',
        atualizadoEm: '2026-08-20T11:00:00Z',
      },
      {
        id: 'pat-004',
        codigoPatrimonio: 'PAT-TRI-00088',
        nome: 'Compressor de Parafuso Atlas Copco 50HP (Desativado)',
        categoria: 'MAQUINAS_EQUIPAMENTOS',
        empresaId: 'emp-01',
        empresaNome: 'TRITECH Matriz Industrial SP',
        localizacao: 'Área de Descarte e Sucatas',
        responsavel: 'Carlos Eduardo Mendes',
        departamento: 'Manutenção Predial',
        valorAquisicao: 85000.0,
        dataAquisicao: '2015-05-10',
        numeroNotaFiscal: 'NF-e 12.890',
        fornecedor: 'Atlas Copco Brasil',
        status: 'BAIXADO',
        historico: [
          {
            id: 'hist-pat-6',
            data: '2015-05-10',
            tipo: 'AQUISICAO',
            descricao: 'Tombamento inicial do sistema de ar comprimido.',
            usuario: 'Engenharia',
          },
          {
            id: 'hist-pat-7',
            data: '2026-05-18',
            tipo: 'BAIXA',
            descricao: 'Baixa patrimonial aprovada por fim de vida útil e avaria catastrófica de bloco compressor.',
            usuario: 'Comitê de Patrimônio & Controladoria',
          },
        ],
        baixa: {
          dataBaixa: '2026-05-18',
          motivo: 'SUCATA',
          justificativa: 'Bloco compressor fundido com custo de retífica superior a 75% do valor de equipamento novo. Vendido para sucateiro homologado.',
          responsavelBaixa: 'Auditoria Interna / Roberto Matos',
          valorRecuperadoVendaOuSucata: 3500.0,
          documentoReferencia: 'LAUDO-MANUT-2026-112',
        },
        estruturaDepreciacaoFutura: {
          metodo: 'LINEAR',
          vidaUtilMeses: 120,
          taxaAnualPercentual: 10.0,
          valorResidualEstimado: 0.0,
          depreciacaoAcumuladaEstimada: 85000.0,
          valorContabilProjetado: 0.0,
          observacaoIntegracao: 'Bem 100% depreciado e baixado no inventário.',
        },
        criadoEm: '2015-05-10T08:00:00Z',
        atualizadoEm: '2026-05-18T16:00:00Z',
      },
    ];

    const emp01Ferramentas: FerramentaControle[] = [
      {
        id: 'fer-001',
        codigo: 'FER-DOB-PUNC-01',
        nome: 'Punção Reto 86° R0.6 H100 Aço Ferramenta 42CrMo4',
        categoria: 'PUNCAO_MATRIZ_DOBRA',
        empresaId: 'emp-01',
        localizacao: 'Armário Ferramentaria - Gaveta A1',
        responsavel: 'Marcio Silva (Ferramenteiro Chefe)',
        condicao: 'EXCELENTE',
        ciclosUsoAtual: 14200,
        limiteCiclosAfiacao: 50000,
        necessitaManutencaoOuAfiacao: false,
        historicoManutencao: [
          {
            id: 'man-fer-1',
            data: '2026-04-10',
            tipo: 'POLIMENTO',
            descricao: 'Polimento da crista de raio e desmagnetização.',
            responsavel: 'Marcio Silva',
            custo: 180.0,
          },
        ],
        movimentacoes: [
          {
            id: 'mov-fer-1',
            data: '2026-08-25',
            tipo: 'CHECKOUT_CHAO_FABRICA',
            maquinaOuSetorDestino: 'Dobradeira CNC Trumpf TruBend 5170',
            responsavelRetirada: 'Operador Fabiano Lima',
            condicaoNoMomento: 'EXCELENTE',
            observacoes: 'Setup para produção do lote OP-2026-4401.',
          },
        ],
        criadoEm: '2024-01-10T08:00:00Z',
        atualizadoEm: '2026-08-25T07:30:00Z',
      },
      {
        id: 'fer-002',
        codigo: 'FER-EST-CORTE-08',
        nome: 'Estampo Progressivo de Estampagem Suporte Chassi',
        categoria: 'ESTAMPO_CORTE',
        empresaId: 'emp-01',
        localizacao: 'Bancada de Manutenção / Ferramentaria',
        responsavel: 'Marcio Silva (Ferramenteiro Chefe)',
        condicao: 'INADEQUADA_AVARIADA', // ALERTA: Ferramenta em condição inadequada
        ciclosUsoAtual: 125400,
        limiteCiclosAfiacao: 100000, // Ultrapassou o limite de ciclos
        necessitaManutencaoOuAfiacao: true,
        motivoCondicaoInadequada: 'Puncionador central com lascamento na aresta de corte e folga excessiva no guia superior. Risco de rebarba e trinca nas peças!',
        historicoManutencao: [
          {
            id: 'man-fer-2',
            data: '2026-01-15',
            tipo: 'AFIACAO',
            descricao: 'Retífica plana da matriz inferior e troca de molas.',
            responsavel: 'Oficina Externa Retífica Precision',
            custo: 2400.0,
            horasParada: 24,
          },
        ],
        movimentacoes: [
          {
            id: 'mov-fer-2',
            data: '2026-08-24',
            tipo: 'ENVIO_AFIACAO',
            maquinaOuSetorDestino: 'Setor de Ajustagem e Retífica Interna',
            responsavelRetirada: 'Marcio Silva',
            condicaoNoMomento: 'INADEQUADA_AVARIADA',
            observacoes: 'Interrompida no chão de fábrica após inspeção de rebarbas.',
          },
        ],
        criadoEm: '2023-06-12T08:00:00Z',
        atualizadoEm: '2026-08-24T15:00:00Z',
      },
      {
        id: 'fer-003',
        codigo: 'FER-MOL-INJ-04',
        nome: 'Molde de Injeção de Termoplástico Conector Elétrico IP67',
        categoria: 'MOLDE_INJECAO',
        empresaId: 'emp-01',
        localizacao: 'Armário de Moldes - Posição B4',
        responsavel: 'Leandro Castro (Engenharia de Processos)',
        condicao: 'BOA',
        ciclosUsoAtual: 42300,
        limiteCiclosAfiacao: 80000,
        necessitaManutencaoOuAfiacao: false,
        historicoManutencao: [],
        movimentacoes: [
          {
            id: 'mov-fer-3',
            data: '2026-08-10',
            tipo: 'CHECKIN_DEVOLUCAO',
            maquinaOuSetorDestino: 'Injetora Romi Sandretto',
            responsavelRetirada: 'Operador Leandro',
            condicaoNoMomento: 'BOA',
            observacoes: 'Limpeza e aplicação de protetivo antioxidante após desmontagem.',
          },
        ],
        criadoEm: '2024-03-20T09:00:00Z',
        atualizadoEm: '2026-08-10T17:00:00Z',
      },
    ];

    const emp01Instrumentos: InstrumentoCalibracao[] = [
      {
        id: 'cal-001',
        codigoInstrumento: 'CAL-PAQ-014',
        nomeInstrumento: 'Paquímetro Digital 150mm Mitutoyo IP67',
        tipoInstrumento: 'PAQUIMETRO',
        empresaId: 'emp-01',
        localizacao: 'Ilha de Inspeção de Processo - Usinagem',
        responsavel: 'Juliana Paes (Inspetora de Qualidade)',
        faixaMedicao: '0 - 150 mm (Resolução: 0.01 mm)',
        toleranciaAdmissivel: '± 0.02 mm',
        frequenciaMeses: 12,
        dataUltimaCalibracao: '2026-02-15',
        dataProximaCalibracao: '2027-02-15',
        diasParaVencer: 173,
        numeroCertificado: 'CERT-RBC-2026-9941',
        laboratorioCalibrador: 'Laboratório Metrológico Acreditado RBC/Inmetro',
        status: 'CALIBRADO',
        bloqueadoParaUso: false,
        historicoCalibracoes: [
          {
            id: 'hist-cal-1',
            dataCalibracao: '2026-02-15',
            numeroCertificado: 'CERT-RBC-2026-9941',
            laboratorioRbc: 'Laboratório Metrológico Acreditado RBC/Inmetro',
            resultado: 'APROVADO',
            erroMaximoEncontrado: '+0.006 mm',
            incertezaMedicao: '0.004 mm (k=2)',
            responsavelHomologacao: 'Juliana Paes',
            observacoes: 'Instrumento aprovado sem restrições.',
          },
          {
            id: 'hist-cal-2',
            dataCalibracao: '2025-02-10',
            numeroCertificado: 'CERT-RBC-2025-4102',
            laboratorioRbc: 'Laboratório Metrológico Acreditado RBC/Inmetro',
            resultado: 'APROVADO',
            erroMaximoEncontrado: '+0.008 mm',
            incertezaMedicao: '0.004 mm (k=2)',
            responsavelHomologacao: 'Juliana Paes',
          },
        ],
        criadoEm: '2024-02-10T08:00:00Z',
        atualizadoEm: '2026-02-15T11:00:00Z',
      },
      {
        id: 'cal-002',
        codigoInstrumento: 'CAL-MIC-007',
        nomeInstrumento: 'Micrômetro Externo Digital 25-50mm Mitutoyo',
        tipoInstrumento: 'MICROMETRO',
        empresaId: 'emp-01',
        localizacao: 'Laboratório de Metrologia e Sala Limpa',
        responsavel: 'Juliana Paes (Inspetora de Qualidade)',
        faixaMedicao: '25 - 50 mm (Resolução: 0.001 mm / 1 µm)',
        toleranciaAdmissivel: '± 0.002 mm',
        frequenciaMeses: 6,
        dataUltimaCalibracao: '2026-03-05',
        dataProximaCalibracao: '2026-09-05', // Vence em 10 dias! (ALERTA: Calibração Próxima)
        diasParaVencer: 10,
        numeroCertificado: 'CERT-RBC-2026-3120',
        laboratorioCalibrador: 'Metrologia TecCalibra SP',
        status: 'PROXIMO_VENCER',
        bloqueadoParaUso: false,
        historicoCalibracoes: [
          {
            id: 'hist-cal-3',
            dataCalibracao: '2026-03-05',
            numeroCertificado: 'CERT-RBC-2026-3120',
            laboratorioRbc: 'Metrologia TecCalibra SP',
            resultado: 'APROVADO',
            erroMaximoEncontrado: '+0.0008 mm',
            incertezaMedicao: '0.0005 mm (k=2)',
            responsavelHomologacao: 'Juliana Paes',
            observacoes: 'Calibração em 5 pontos com padrões cerâmicos classe 0.',
          },
        ],
        criadoEm: '2023-03-05T08:00:00Z',
        atualizadoEm: '2026-03-05T10:00:00Z',
      },
      {
        id: 'cal-003',
        codigoInstrumento: 'CAL-TORQ-002',
        nomeInstrumento: 'Torquímetro de Estalo 20-100 N.m Gedore',
        tipoInstrumento: 'TORQUIMETRO',
        empresaId: 'emp-01',
        localizacao: 'Bancada de Montagem Estrutural',
        responsavel: 'Marcos Vinicius (Supervisor Montagem)',
        faixaMedicao: '20 - 100 N.m',
        toleranciaAdmissivel: '± 4.0%',
        frequenciaMeses: 6,
        dataUltimaCalibracao: '2026-01-10',
        dataProximaCalibracao: '2026-07-10', // VENCEU há mais de 45 dias! (ALERTA: Calibração Vencida)
        diasParaVencer: -47,
        numeroCertificado: 'CERT-RBC-2026-0811',
        laboratorioCalibrador: 'LabTorque Metrologia Dinâmica',
        status: 'VENCIDO',
        bloqueadoParaUso: true, // Bloqueado para evitar liberação de produto não conforme
        historicoCalibracoes: [
          {
            id: 'hist-cal-4',
            dataCalibracao: '2026-01-10',
            numeroCertificado: 'CERT-RBC-2026-0811',
            laboratorioRbc: 'LabTorque Metrologia Dinâmica',
            resultado: 'APROVADO',
            erroMaximoEncontrado: '+1.8%',
            incertezaMedicao: '0.8%',
            responsavelHomologacao: 'Marcos Vinicius',
          },
        ],
        criadoEm: '2024-01-10T08:00:00Z',
        atualizadoEm: '2026-07-11T08:00:00Z',
      },
    ];

    this.ativos.set('emp-01', emp01Ativos);
    this.ferramentas.set('emp-01', emp01Ferramentas);
    this.instrumentos.set('emp-01', emp01Instrumentos);

    // Inicializa empresas vazias com arrays padrão
    ['emp-02', 'emp-03', 'emp-04', 'emp-05'].forEach((id) => {
      if (!this.ativos.has(id)) this.ativos.set(id, []);
      if (!this.ferramentas.has(id)) this.ferramentas.set(id, []);
      if (!this.instrumentos.has(id)) this.instrumentos.set(id, []);
    });
  }

  // ----------------------------------------------------
  // MÉTODOS DE PATRIMÔNIO (ATIVOS FIXOS)
  // ----------------------------------------------------
  public listarAtivos(empresaId: string): AtivoPatrimonial[] {
    return this.ativos.get(empresaId) || [];
  }

  public obterAtivoPorId(empresaId: string, id: string): AtivoPatrimonial | undefined {
    const list = this.listarAtivos(empresaId);
    return list.find((a) => a.id === id);
  }

  public cadastrarAtivo(
    empresaId: string,
    empresaNome: string,
    dados: {
      codigoPatrimonio: string;
      nome: string;
      categoria: CategoriaPatrimonio;
      localizacao: string;
      responsavel?: string | null;
      departamento: string;
      valorAquisicao: number;
      dataAquisicao: string;
      numeroNotaFiscal: string;
      fornecedor: string;
      numeroSerie?: string;
      especificacoesTecnicas?: string;
      vidaUtilMeses?: number;
      taxaAnualPercentual?: number;
      valorResidualEstimado?: number;
      usuarioCriador: string;
    }
  ): AtivoPatrimonial {
    const list = this.listarAtivos(empresaId);
    const id = `pat-${Date.now().toString(36)}`;
    const agora = new Date().toISOString();

    const vidaUtil = dados.vidaUtilMeses || 120;
    const taxaAnual = dados.taxaAnualPercentual || 10;
    const residual = dados.valorResidualEstimado || dados.valorAquisicao * 0.1;

    const novoAtivo: AtivoPatrimonial = {
      id,
      codigoPatrimonio: dados.codigoPatrimonio,
      nome: dados.nome,
      categoria: dados.categoria,
      empresaId,
      empresaNome,
      localizacao: dados.localizacao,
      responsavel: dados.responsavel?.trim() || null,
      departamento: dados.departamento,
      valorAquisicao: dados.valorAquisicao,
      dataAquisicao: dados.dataAquisicao,
      numeroNotaFiscal: dados.numeroNotaFiscal,
      fornecedor: dados.fornecedor,
      numeroSerie: dados.numeroSerie,
      especificacoesTecnicas: dados.especificacoesTecnicas,
      status: 'ATIVO',
      historico: [
        {
          id: `hist-${Date.now()}-1`,
          data: dados.dataAquisicao,
          tipo: 'AQUISICAO',
          descricao: `Tombamento patrimonial inicial: ${dados.nome} cadastrado com valor de R$ ${dados.valorAquisicao.toLocaleString('pt-BR')}.`,
          usuario: dados.usuarioCriador,
        },
      ],
      estruturaDepreciacaoFutura: {
        metodo: 'LINEAR',
        vidaUtilMeses: vidaUtil,
        taxaAnualPercentual: taxaAnual,
        valorResidualEstimado: residual,
        depreciacaoAcumuladaEstimada: 0,
        valorContabilProjetado: dados.valorAquisicao,
        observacaoIntegracao: 'Estrutura preparada para integração com módulo contábil futuro. Cálculos automáticos de amortização/depreciação provisionados.',
      },
      criadoEm: agora,
      atualizadoEm: agora,
    };

    list.push(novoAtivo);
    this.ativos.set(empresaId, list);
    return novoAtivo;
  }

  public transferirLocalizacaoResponsavel(
    empresaId: string,
    id: string,
    dados: {
      novaLocalizacao?: string;
      novoResponsavel?: string | null;
      novoDepartamento?: string;
      motivoTransferencia: string;
      usuarioResponsavel: string;
    }
  ): AtivoPatrimonial {
    const list = this.listarAtivos(empresaId);
    const ativo = list.find((a) => a.id === id);
    if (!ativo) throw new Error(`Ativo patrimonial ${id} não encontrado na empresa ${empresaId}.`);
    if (ativo.status === 'BAIXADO') throw new Error(`Não é possível transferir um ativo que já foi baixado.`);

    const localAnterior = ativo.localizacao;
    const respAnterior = ativo.responsavel || 'NENHUM (SEM RESPONSÁVEL)';

    if (dados.novaLocalizacao) ativo.localizacao = dados.novaLocalizacao;
    if (dados.novoResponsavel !== undefined) ativo.responsavel = dados.novoResponsavel?.trim() || null;
    if (dados.novoDepartamento) ativo.departamento = dados.novoDepartamento;

    ativo.atualizadoEm = new Date().toISOString();
    ativo.historico.push({
      id: `hist-${Date.now()}`,
      data: new Date().toISOString().split('T')[0],
      tipo: dados.novoResponsavel !== undefined ? 'TROCA_RESPONSAVEL' : 'TRANSFERENCIA_LOCAL',
      descricao: `Movimentação/Transferência: ${dados.motivoTransferencia}`,
      usuario: dados.usuarioResponsavel,
      localAnterior,
      localNovo: ativo.localizacao,
      responsavelAnterior: respAnterior,
      responsavelNovo: ativo.responsavel || 'SEM RESPONSÁVEL',
    });

    return ativo;
  }

  public baixarAtivo(
    empresaId: string,
    id: string,
    dados: {
      dataBaixa: string;
      motivo: MotivoBaixaPatrimonio;
      justificativa: string;
      responsavelBaixa: string;
      valorRecuperadoVendaOuSucata?: number;
      documentoReferencia?: string;
    }
  ): AtivoPatrimonial {
    const list = this.listarAtivos(empresaId);
    const ativo = list.find((a) => a.id === id);
    if (!ativo) throw new Error(`Ativo patrimonial ${id} não encontrado.`);
    if (ativo.status === 'BAIXADO') throw new Error(`O ativo ${ativo.codigoPatrimonio} já foi baixado anteriormente.`);

    ativo.status = 'BAIXADO';
    ativo.atualizadoEm = new Date().toISOString();
    ativo.baixa = {
      dataBaixa: dados.dataBaixa,
      motivo: dados.motivo,
      justificativa: dados.justificativa,
      responsavelBaixa: dados.responsavelBaixa,
      valorRecuperadoVendaOuSucata: dados.valorRecuperadoVendaOuSucata || 0,
      documentoReferencia: dados.documentoReferencia,
    };

    ativo.historico.push({
      id: `hist-${Date.now()}`,
      data: dados.dataBaixa,
      tipo: 'BAIXA',
      descricao: `Baixa Patrimonial (${dados.motivo}): ${dados.justificativa}. Valor residual/venda: R$ ${(dados.valorRecuperadoVendaOuSucata || 0).toLocaleString('pt-BR')}.`,
      usuario: dados.responsavelBaixa,
    });

    return ativo;
  }

  // ----------------------------------------------------
  // MÉTODOS DE FERRAMENTAS & MATRIZES
  // ----------------------------------------------------
  public listarFerramentas(empresaId: string): FerramentaControle[] {
    return this.ferramentas.get(empresaId) || [];
  }

  public cadastrarFerramenta(
    empresaId: string,
    dados: {
      codigo: string;
      nome: string;
      categoria: CategoriaFerramenta;
      localizacao: string;
      responsavel: string;
      condicao: CondicaoFerramenta;
      ciclosUsoAtual?: number;
      limiteCiclosAfiacao?: number;
      motivoCondicaoInadequada?: string;
    }
  ): FerramentaControle {
    const list = this.listarFerramentas(empresaId);
    const id = `fer-${Date.now().toString(36)}`;
    const agora = new Date().toISOString();

    const novaFerramenta: FerramentaControle = {
      id,
      codigo: dados.codigo,
      nome: dados.nome,
      categoria: dados.categoria,
      empresaId,
      localizacao: dados.localizacao,
      responsavel: dados.responsavel,
      condicao: dados.condicao,
      ciclosUsoAtual: dados.ciclosUsoAtual || 0,
      limiteCiclosAfiacao: dados.limiteCiclosAfiacao || 50000,
      necessitaManutencaoOuAfiacao:
        dados.condicao === 'INADEQUADA_AVARIADA' ||
        (dados.ciclosUsoAtual || 0) >= (dados.limiteCiclosAfiacao || 50000),
      motivoCondicaoInadequada: dados.motivoCondicaoInadequada,
      historicoManutencao: [],
      movimentacoes: [],
      criadoEm: agora,
      atualizadoEm: agora,
    };

    list.push(novaFerramenta);
    this.ferramentas.set(empresaId, list);
    return novaFerramenta;
  }

  public atualizarCondicaoFerramenta(
    empresaId: string,
    id: string,
    dados: {
      novaCondicao: CondicaoFerramenta;
      motivoOuDiagnostico?: string;
      usuario: string;
    }
  ): FerramentaControle {
    const list = this.listarFerramentas(empresaId);
    const fer = list.find((f) => f.id === id);
    if (!fer) throw new Error(`Ferramenta ${id} não encontrada.`);

    fer.condicao = dados.novaCondicao;
    fer.motivoCondicaoInadequada = dados.motivoOuDiagnostico;
    fer.necessitaManutencaoOuAfiacao =
      dados.novaCondicao === 'INADEQUADA_AVARIADA' ||
      dados.novaCondicao === 'EM_MANUTENCAO' ||
      fer.ciclosUsoAtual >= fer.limiteCiclosAfiacao;
    fer.atualizadoEm = new Date().toISOString();

    return fer;
  }

  public registrarMovimentacaoFerramenta(
    empresaId: string,
    id: string,
    dados: {
      tipo: 'CHECKOUT_CHAO_FABRICA' | 'CHECKIN_DEVOLUCAO' | 'ENVIO_AFIACAO' | 'RETORNO_AFIACAO' | 'TRANSFERENCIA_SETOR';
      maquinaOuSetorDestino: string;
      responsavelRetirada: string;
      condicaoNoMomento?: CondicaoFerramenta;
      ciclosAdicionados?: number;
      observacoes?: string;
    }
  ): FerramentaControle {
    const list = this.listarFerramentas(empresaId);
    const fer = list.find((f) => f.id === id);
    if (!fer) throw new Error(`Ferramenta ${id} não encontrada.`);

    if (dados.ciclosAdicionados && dados.ciclosAdicionados > 0) {
      fer.ciclosUsoAtual += dados.ciclosAdicionados;
    }

    if (dados.condicaoNoMomento) {
      fer.condicao = dados.condicaoNoMomento;
    }

    if (fer.ciclosUsoAtual >= fer.limiteCiclosAfiacao) {
      fer.necessitaManutencaoOuAfiacao = true;
    }

    fer.movimentacoes.unshift({
      id: `mov-${Date.now()}`,
      data: new Date().toISOString().split('T')[0],
      tipo: dados.tipo,
      maquinaOuSetorDestino: dados.maquinaOuSetorDestino,
      responsavelRetirada: dados.responsavelRetirada,
      condicaoNoMomento: fer.condicao,
      observacoes: dados.observacoes,
    });

    fer.atualizadoEm = new Date().toISOString();
    return fer;
  }

  public registrarManutencaoAfiacaoFerramenta(
    empresaId: string,
    id: string,
    dados: {
      tipo: 'AFIACAO' | 'POLIMENTO' | 'RETOQUE_GEOMETRICO' | 'INSPECAO_DIMENSIONAL' | 'SUBSTITUICAO_ELEMENTO';
      descricao: string;
      responsavel: string;
      custo: number;
      zerarCiclosAposAfiacao?: boolean;
    }
  ): FerramentaControle {
    const list = this.listarFerramentas(empresaId);
    const fer = list.find((f) => f.id === id);
    if (!fer) throw new Error(`Ferramenta ${id} não encontrada.`);

    fer.historicoManutencao.unshift({
      id: `man-fer-${Date.now()}`,
      data: new Date().toISOString().split('T')[0],
      tipo: dados.tipo,
      descricao: dados.descricao,
      responsavel: dados.responsavel,
      custo: dados.custo,
    });

    if (dados.zerarCiclosAposAfiacao) {
      fer.ciclosUsoAtual = 0;
      fer.condicao = 'EXCELENTE';
      fer.necessitaManutencaoOuAfiacao = false;
      fer.motivoCondicaoInadequada = undefined;
    }

    fer.atualizadoEm = new Date().toISOString();
    return fer;
  }

  // ----------------------------------------------------
  // MÉTODOS DE CALIBRAÇÃO (METROLOGIA INDUSTRIAL)
  // ----------------------------------------------------
  public listarInstrumentos(empresaId: string): InstrumentoCalibracao[] {
    const list = this.instrumentos.get(empresaId) || [];
    const hoje = new Date();

    // Recalcula dias para vencer e status dinamicamente
    return list.map((inst) => {
      const dataProx = new Date(inst.dataProximaCalibracao);
      const diffMs = dataProx.getTime() - hoje.getTime();
      const diasParaVencer = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let status = inst.status;
      let bloqueado = false;

      if (diasParaVencer < 0) {
        status = 'VENCIDO';
        bloqueado = true;
      } else if (diasParaVencer <= 30 && status !== 'EM_CALIBRACAO' && status !== 'REPROVADO') {
        status = 'PROXIMO_VENCER';
      } else if (status === 'REPROVADO') {
        bloqueado = true;
      }

      return {
        ...inst,
        diasParaVencer,
        status,
        bloqueadoParaUso: bloqueado,
      };
    });
  }

  public cadastrarInstrumento(
    empresaId: string,
    dados: {
      codigoInstrumento: string;
      nomeInstrumento: string;
      tipoInstrumento: TipoInstrumentoCalibracao;
      localizacao: string;
      responsavel: string;
      faixaMedicao: string;
      toleranciaAdmissivel: string;
      frequenciaMeses: number;
      dataUltimaCalibracao: string;
      numeroCertificado: string;
      laboratorioCalibrador: string;
      resultadoInicial?: 'APROVADO' | 'APROVADO_COM_RESTRICAO' | 'REPROVADO';
    }
  ): InstrumentoCalibracao {
    const list = this.instrumentos.get(empresaId) || [];
    const id = `cal-${Date.now().toString(36)}`;
    const agora = new Date().toISOString();

    // Calcula próxima calibração a partir da última + frequência em meses
    const dUltima = new Date(dados.dataUltimaCalibracao);
    dUltima.setMonth(dUltima.getMonth() + dados.frequenciaMeses);
    const dataProximaCalibracao = dUltima.toISOString().split('T')[0];

    const hoje = new Date();
    const diffMs = dUltima.getTime() - hoje.getTime();
    const diasParaVencer = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let status: InstrumentoCalibracao['status'] = 'CALIBRADO';
    let bloqueadoParaUso = false;

    if (dados.resultadoInicial === 'REPROVADO') {
      status = 'REPROVADO';
      bloqueadoParaUso = true;
    } else if (diasParaVencer < 0) {
      status = 'VENCIDO';
      bloqueadoParaUso = true;
    } else if (diasParaVencer <= 30) {
      status = 'PROXIMO_VENCER';
    }

    const novoInst: InstrumentoCalibracao = {
      id,
      codigoInstrumento: dados.codigoInstrumento,
      nomeInstrumento: dados.nomeInstrumento,
      tipoInstrumento: dados.tipoInstrumento,
      empresaId,
      localizacao: dados.localizacao,
      responsavel: dados.responsavel,
      faixaMedicao: dados.faixaMedicao,
      toleranciaAdmissivel: dados.toleranciaAdmissivel,
      frequenciaMeses: dados.frequenciaMeses,
      dataUltimaCalibracao: dados.dataUltimaCalibracao,
      dataProximaCalibracao,
      diasParaVencer,
      numeroCertificado: dados.numeroCertificado,
      laboratorioCalibrador: dados.laboratorioCalibrador,
      status,
      bloqueadoParaUso,
      historicoCalibracoes: [
        {
          id: `hist-cal-${Date.now()}`,
          dataCalibracao: dados.dataUltimaCalibracao,
          numeroCertificado: dados.numeroCertificado,
          laboratorioRbc: dados.laboratorioCalibrador,
          resultado: dados.resultadoInicial || 'APROVADO',
          erroMaximoEncontrado: 'Em conformidade com critérios de aceitação',
          incertezaMedicao: 'Acreditado CGCRE/Inmetro',
          responsavelHomologacao: dados.responsavel,
          observacoes: 'Registro de calibração inicial de entrada no sistema.',
        },
      ],
      criadoEm: agora,
      atualizadoEm: agora,
    };

    list.push(novoInst);
    this.instrumentos.set(empresaId, list);
    return novoInst;
  }

  public registrarNovaCalibracao(
    empresaId: string,
    id: string,
    dados: {
      dataCalibracao: string;
      numeroCertificado: string;
      laboratorioRbc: string;
      resultado: 'APROVADO' | 'APROVADO_COM_RESTRICAO' | 'REPROVADO';
      erroMaximoEncontrado: string;
      incertezaMedicao: string;
      responsavelHomologacao: string;
      observacoes?: string;
    }
  ): InstrumentoCalibracao {
    const list = this.instrumentos.get(empresaId) || [];
    const inst = list.find((i) => i.id === id);
    if (!inst) throw new Error(`Instrumento de medição ${id} não encontrado.`);

    // Recalcula próxima data
    const dNova = new Date(dados.dataCalibracao);
    dNova.setMonth(dNova.getMonth() + inst.frequenciaMeses);
    const dataProxima = dNova.toISOString().split('T')[0];

    const hoje = new Date();
    const diffMs = dNova.getTime() - hoje.getTime();
    const diasParaVencer = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    inst.dataUltimaCalibracao = dados.dataCalibracao;
    inst.dataProximaCalibracao = dataProxima;
    inst.numeroCertificado = dados.numeroCertificado;
    inst.laboratorioCalibrador = dados.laboratorioRbc;
    inst.diasParaVencer = diasParaVencer;

    if (dados.resultado === 'REPROVADO') {
      inst.status = 'REPROVADO';
      inst.bloqueadoParaUso = true;
    } else {
      inst.status = diasParaVencer <= 30 ? 'PROXIMO_VENCER' : 'CALIBRADO';
      inst.bloqueadoParaUso = false;
    }

    inst.historicoCalibracoes.unshift({
      id: `hist-cal-${Date.now()}`,
      dataCalibracao: dados.dataCalibracao,
      numeroCertificado: dados.numeroCertificado,
      laboratorioRbc: dados.laboratorioRbc,
      resultado: dados.resultado,
      erroMaximoEncontrado: dados.erroMaximoEncontrado,
      incertezaMedicao: dados.incertezaMedicao,
      responsavelHomologacao: dados.responsavelHomologacao,
      observacoes: dados.observacoes,
    });

    inst.atualizadoEm = new Date().toISOString();
    return inst;
  }

  // ----------------------------------------------------
  // GERAÇÃO DE ALERTAS & INDICADORES CONSOLIDADOS
  // ----------------------------------------------------
  public obterIndicadoresEAlertas(empresaId: string): IndicadoresPatrimonioCalibracao {
    const ativos = this.listarAtivos(empresaId);
    const ferramentas = this.listarFerramentas(empresaId);
    const instrumentos = this.listarInstrumentos(empresaId);

    const alertas: AlertaPatrimonioCalibracao[] = [];
    const hojeStr = new Date().toISOString().split('T')[0];

    // 1. Alerta: Calibração Vencida
    instrumentos
      .filter((i) => i.status === 'VENCIDO' || i.diasParaVencer < 0)
      .forEach((inst) => {
        alertas.push({
          id: `alt-cal-venc-${inst.id}`,
          tipo: 'CALIBRACAO_VENCIDA',
          gravidade: 'CRITICA',
          titulo: `Instrumento Vencido: ${inst.codigoInstrumento} (${inst.nomeInstrumento})`,
          descricao: `A calibração do instrumento venceu em ${inst.dataProximaCalibracao} (${Math.abs(inst.diasParaVencer)} dias atrás). O instrumento foi BLOQUEADO para uso nas inspeções fabris.`,
          referenciaId: inst.id,
          referenciaCodigo: inst.codigoInstrumento,
          empresaId,
          dataIdentificacao: hojeStr,
          acaoRecomendada: `Enviar imediatamente para calibração no laboratório RBC acreditado e recolher do posto de trabalho.`,
        });
      });

    // 2. Alerta: Calibração Próxima (< 30 dias)
    instrumentos
      .filter((i) => i.status === 'PROXIMO_VENCER' && i.diasParaVencer >= 0 && i.diasParaVencer <= 30)
      .forEach((inst) => {
        alertas.push({
          id: `alt-cal-prox-${inst.id}`,
          tipo: 'CALIBRACAO_PROXIMA',
          gravidade: 'ALTA',
          titulo: `Calibração Vencendo em Breve: ${inst.codigoInstrumento}`,
          descricao: `O instrumento ${inst.nomeInstrumento} vencerá em ${inst.diasParaVencer} dias (${inst.dataProximaCalibracao}).`,
          referenciaId: inst.id,
          referenciaCodigo: inst.codigoInstrumento,
          empresaId,
          dataIdentificacao: hojeStr,
          acaoRecomendada: `Agendar coleta/remessa com o laboratório credenciado (${inst.laboratorioCalibrador}) antes do vencimento para evitar parada de posto.`,
        });
      });

    // 3. Alerta: Ferramenta em Condição Inadequada
    ferramentas
      .filter((f) => f.condicao === 'INADEQUADA_AVARIADA' || f.necessitaManutencaoOuAfiacao)
      .forEach((fer) => {
        alertas.push({
          id: `alt-fer-inad-${fer.id}`,
          tipo: 'FERRAMENTA_CONDICAO_INADEQUADA',
          gravidade: fer.condicao === 'INADEQUADA_AVARIADA' ? 'CRITICA' : 'MEDIA',
          titulo: `Ferramenta Avariada / Desgastada: ${fer.codigo}`,
          descricao: fer.motivoCondicaoInadequada || `Ferramenta atingiu ${fer.ciclosUsoAtual.toLocaleString('pt-BR')} ciclos (limite de afiação: ${fer.limiteCiclosAfiacao.toLocaleString('pt-BR')} ciclos).`,
          referenciaId: fer.id,
          referenciaCodigo: fer.codigo,
          empresaId,
          dataIdentificacao: hojeStr,
          acaoRecomendada: `Interromper uso no setup de máquinas e encaminhar para retífica, afiação ou substituição na ferramentaria.`,
        });
      });

    // 4. Alerta: Ativo Sem Responsável
    ativos
      .filter((a) => a.status !== 'BAIXADO' && (!a.responsavel || a.responsavel.trim() === ''))
      .forEach((atv) => {
        alertas.push({
          id: `alt-atv-sem-resp-${atv.id}`,
          tipo: 'ATIVO_SEM_RESPONSAVEL',
          gravidade: 'MEDIA',
          titulo: `Ativo sem Responsável Formal: ${atv.codigoPatrimonio}`,
          descricao: `O equipamento ${atv.nome} (R$ ${atv.valorAquisicao.toLocaleString('pt-BR')}) localizado em "${atv.localizacao}" não possui custodiante formal atribuído.`,
          referenciaId: atv.id,
          referenciaCodigo: atv.codigoPatrimonio,
          empresaId,
          dataIdentificacao: hojeStr,
          acaoRecomendada: `Atribuir um gestor/operador responsável para manter a custódia patrimonial e inventário regularizados.`,
        });
      });

    const totalAtivos = ativos.length;
    const totalAtivosAtivos = ativos.filter((a) => a.status === 'ATIVO').length;
    const totalAtivosBaixados = ativos.filter((a) => a.status === 'BAIXADO').length;
    const valorTotalImobilizado = ativos
      .filter((a) => a.status !== 'BAIXADO')
      .reduce((sum, a) => sum + a.valorAquisicao, 0);
    const totalAtivosSemResponsavel = ativos.filter((a) => a.status !== 'BAIXADO' && (!a.responsavel || a.responsavel.trim() === '')).length;

    const totalFerramentas = ferramentas.length;
    const totalFerramentasEmOperacao = ferramentas.filter((f) => f.condicao === 'EXCELENTE' || f.condicao === 'BOA').length;
    const totalFerramentasInadequadas = ferramentas.filter((f) => f.condicao === 'INADEQUADA_AVARIADA').length;
    const totalFerramentasAguardandoAfiacao = ferramentas.filter((f) => f.necessitaManutencaoOuAfiacao).length;

    const totalInstrumentos = instrumentos.length;
    const instrumentosCalibradosEmDia = instrumentos.filter((i) => i.status === 'CALIBRADO').length;
    const instrumentosProximosVencer = instrumentos.filter((i) => i.status === 'PROXIMO_VENCER').length;
    const instrumentosVencidosOuBloqueados = instrumentos.filter((i) => i.status === 'VENCIDO' || i.bloqueadoParaUso).length;
    const indiceConformidadeMetrologicaPercentual = totalInstrumentos > 0
      ? Number((((instrumentosCalibradosEmDia + instrumentosProximosVencer) / totalInstrumentos) * 100).toFixed(1))
      : 100;

    return {
      totalAtivosCadastrados: totalAtivos,
      totalAtivosAtivos,
      totalAtivosBaixados,
      valorTotalImobilizado,
      totalAtivosSemResponsavel,

      totalFerramentas,
      totalFerramentasEmOperacao,
      totalFerramentasInadequadas,
      totalFerramentasAguardandoAfiacao,

      totalInstrumentosMedicao: totalInstrumentos,
      instrumentosCalibradosEmDia,
      instrumentosProximosVencer,
      instrumentosVencidosOuBloqueados,
      indiceConformidadeMetrologicaPercentual,

      alertasAtivos: alertas,
    };
  }
}

// Instância Singleton para persistência em memória durante o ciclo do dev server
export const patrimonioCalibracaoService = new PatrimonioCalibracaoService();
