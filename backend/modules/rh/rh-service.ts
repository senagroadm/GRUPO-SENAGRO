/**
 * backend/modules/rh/rh-service.ts
 * NEXUS ERP (Grupo TRITECH - 5 CNPJs)
 * MÓDULO: RH OPERACIONAL & GESTÃO DO TRABALHO INDUSTRIAL
 */

import {
  Funcionario,
  FuncionarioEmpresa,
  Cargo,
  Cbo,
  Setor,
  Competencia,
  FuncionarioCompetencia,
  FuncionarioMaquina,
  Treinamento,
  FuncionarioTreinamento,
  DocumentoFuncionario,
  Epi,
  EntregaEpi,
  Turno,
  Escala,
  ApontamentoHoras,
  Vaga,
  Candidato,
  Onboarding,
  Desligamento,
  HistoricoCargoSalario,
  RhAuditoriaLog,
  RhDashboardData,
  ResultadoIntegracaoExterna,
  NivelHabilidade,
  StatusValidadeTreinamento,
  StatusValidadeDocumento,
  TipoHoraApontamento,
  TipoRescisao,
} from './rh-types';
import { rhExternalAdapter } from './rh-adapter';
import { EMPRESAS_GRUPO } from '../../core/types/company';

class RhOperacionalService {
  // In-memory persistent database for RH Operacional (per company isolation)
  private cbos: Cbo[] = [];
  private setores: Setor[] = [];
  private cargos: Cargo[] = [];
  private funcionarios: Funcionario[] = [];
  private vinculos: FuncionarioEmpresa[] = [];
  private historicoCargos: HistoricoCargoSalario[] = [];
  private competencias: Competencia[] = [];
  private funcionarioCompetencias: FuncionarioCompetencia[] = [];
  private funcionarioMaquinas: FuncionarioMaquina[] = [];
  private treinamentos: Treinamento[] = [];
  private funcionarioTreinamentos: FuncionarioTreinamento[] = [];
  private documentos: DocumentoFuncionario[] = [];
  private epis: Epi[] = [];
  private entregasEpi: EntregaEpi[] = [];
  private turnos: Turno[] = [];
  private escalas: Escala[] = [];
  private apontamentosHoras: ApontamentoHoras[] = [];
  private vagas: Vaga[] = [];
  private candidatos: Candidato[] = [];
  private onboardings: Onboarding[] = [];
  private desligamentos: Desligamento[] = [];
  private auditoriaLogs: RhAuditoriaLog[] = [];

  constructor() {
    this.seedInitialData();
  }

  // ---------------------------------------------------------------------------
  // SEED DE DADOS INDUSTRIAIS DO GRUPO TRITECH
  // ---------------------------------------------------------------------------
  private seedInitialData() {
    // 1. CBOs
    this.cbos = [
      { id: 'cbo-1', codigo: '7212-15', titulo: 'Operador de Máquinas-Ferramenta Convencionais e CNC', grandeGrupo: 'Trabalhadores da Produção de Bens e Serviços Industriais', ativo: true },
      { id: 'cbo-2', codigo: '7243-15', titulo: 'Soldador (MIG, MAG, TIG, Eletrodo Revestido)', grandeGrupo: 'Trabalhadores da Transformação de Metais e Compósitos', ativo: true },
      { id: 'cbo-3', codigo: '7244-10', titulo: 'Caldeireiro (Chapas de Metais e Estruturas Pesadas)', grandeGrupo: 'Trabalhadores da Transformação de Metais e Compósitos', ativo: true },
      { id: 'cbo-4', codigo: '7241-15', titulo: 'Montador de Estruturas Metálicas e Mecânicas', grandeGrupo: 'Montadores de Veículos e Equipamentos', ativo: true },
      { id: 'cbo-5', codigo: '3141-10', titulo: 'Técnico em Mecânica / Programador CNC', grandeGrupo: 'Técnicos de Nível Médio em Ciências Físicas e Químicas', ativo: true },
      { id: 'cbo-6', codigo: '3912-05', titulo: 'Inspetor de Controle de Qualidade / Metrologista', grandeGrupo: 'Técnicos de Controle da Produção', ativo: true },
      { id: 'cbo-7', codigo: '2144-05', titulo: 'Engenheiro Mecânico / Engenheiro de Produção', grandeGrupo: 'Profissionais das Ciências Exatas e Engenharia', ativo: true },
      { id: 'cbo-8', codigo: '4110-10', titulo: 'Assistente Administrativo / Analista de PCP', grandeGrupo: 'Trabalhadores de Apoio Administrativo', ativo: true },
      { id: 'cbo-9', codigo: '4141-05', titulo: 'Almoxarife / Estoquista Industrial', grandeGrupo: 'Trabalhadores dos Serviços de Transporte e Armazenagem', ativo: true },
      { id: 'cbo-10', codigo: '7822-20', titulo: 'Operador de Ponte Rolante e Empilhadeira', grandeGrupo: 'Operadores de Equipamentos de Movimentação de Cargas', ativo: true },
    ];

    // 2. Setores para as Empresas do Grupo
    EMPRESAS_GRUPO.forEach((emp) => {
      this.setores.push(
        { id: `set-${emp.id}-1`, empresaId: emp.id, codigo: 'CORTE_DOBRA', nome: 'Corte a Laser & Dobra CNC', tipo: 'PRODUCAO_FABRIL', centroCustoCodigo: 'CC-0101', corIdentificacao: '#4f46e5', ativo: true },
        { id: `set-${emp.id}-2`, empresaId: emp.id, codigo: 'SOLDA_CALD', nome: 'Soldagem & Caldeiraria Pesada', tipo: 'PRODUCAO_FABRIL', centroCustoCodigo: 'CC-0102', corIdentificacao: '#ea580c', ativo: true },
        { id: `set-${emp.id}-3`, empresaId: emp.id, codigo: 'USINAGEM', nome: 'Usinagem CNC & Centros 5 Eixos', tipo: 'PRODUCAO_FABRIL', centroCustoCodigo: 'CC-0103', corIdentificacao: '#0284c7', ativo: true },
        { id: `set-${emp.id}-4`, empresaId: emp.id, codigo: 'MONTAGEM', nome: 'Montagem Final & Acabamento', tipo: 'PRODUCAO_FABRIL', centroCustoCodigo: 'CC-0104', corIdentificacao: '#16a34a', ativo: true },
        { id: `set-${emp.id}-5`, empresaId: emp.id, codigo: 'ENG_PCP', nome: 'Engenharia de Produto & PCP', tipo: 'ENGENHARIA_PCP', centroCustoCodigo: 'CC-0201', corIdentificacao: '#9333ea', ativo: true },
        { id: `set-${emp.id}-6`, empresaId: emp.id, codigo: 'QUALIDADE', nome: 'Qualidade, Metrologia & ISO', tipo: 'QUALIDADE_METROLOGIA', centroCustoCodigo: 'CC-0202', corIdentificacao: '#0d9488', ativo: true },
        { id: `set-${emp.id}-7`, empresaId: emp.id, codigo: 'MANUTENCAO', nome: 'Manutenção Mecânica & Elétrica', tipo: 'MANUTENCAO', centroCustoCodigo: 'CC-0301', corIdentificacao: '#d97706', ativo: true },
        { id: `set-${emp.id}-8`, empresaId: emp.id, codigo: 'ALMOXARIFADO', nome: 'Almoxarifado & Logística Interna', tipo: 'ALMOXARIFADO_ESTOQUE', centroCustoCodigo: 'CC-0401', corIdentificacao: '#475569', ativo: true },
        { id: `set-${emp.id}-9`, empresaId: emp.id, codigo: 'ADMINISTRATIVO', nome: 'Recursos Humanos & Financeiro', tipo: 'ADMINISTRATIVO_FINANCEIRO', centroCustoCodigo: 'CC-0501', corIdentificacao: '#64748b', ativo: true }
      );
    });

    // 3. Cargos
    this.cargos = [
      { id: 'car-1', cboId: 'cbo-1', codigoCbo: '7212-15', tituloCbo: 'Operador de Máquinas-Ferramenta Convencionais e CNC', codigo: 'OP_LASER_PL', titulo: 'Operador de Corte a Laser CNC Pleno', nivel: 'OPERACIONAL_PLENO', descricaoSumaria: 'Operação de mesas de corte laser fibra óptica 6kW/12kW, troca de bicos, lentes e gases de assistência.', requisitosMinimos: 'Ensino Médio + Leitura e Interpretação de Desenho + NR-12.', pisoSalarial: 3200, tetoSalarial: 4600, ativo: true },
      { id: 'car-2', cboId: 'cbo-1', codigoCbo: '7212-15', tituloCbo: 'Operador de Máquinas-Ferramenta Convencionais e CNC', codigo: 'OP_DOBRA_SR', titulo: 'Operador de Dobradeira CNC Sênior', nivel: 'OPERACIONAL_SENIOR', descricaoSumaria: 'Setup de matrizes e punções, cálculo de compensação de dobra e programação gráfica CNC Delem.', requisitosMinimos: 'Técnico em Mecânica + 5 anos de experiência em caldeiraria e dobra.', pisoSalarial: 4200, tetoSalarial: 6000, ativo: true },
      { id: 'car-3', cboId: 'cbo-2', codigoCbo: '7243-15', tituloCbo: 'Soldador (MIG, MAG, TIG)', codigo: 'SOLDADOR_TIG', titulo: 'Soldador Especialista TIG / MIG Inox', nivel: 'TECNICO_ESPECIALISTA', descricaoSumaria: 'Soldagem qualificada em aço inoxidável e ligas especiais para implementos industriais e sanitários.', requisitosMinimos: 'Certificação de Qualificação de Soldador (ASME/AWS) + NR-33/NR-35.', pisoSalarial: 4500, tetoSalarial: 6800, ativo: true },
      { id: 'car-4', cboId: 'cbo-3', codigoCbo: '7244-10', tituloCbo: 'Caldeireiro', codigo: 'CALDEIREIRO_SR', titulo: 'Caldeireiro Industrial Sênior', nivel: 'OPERACIONAL_SENIOR', descricaoSumaria: 'Traçado de peças cônicas, transições e montagem de estruturas pesadas soldadas.', requisitosMinimos: 'Experiência comprovada em caldeiraria pesada.', pisoSalarial: 4000, tetoSalarial: 5800, ativo: true },
      { id: 'car-5', cboId: 'cbo-6', codigoCbo: '3912-05', tituloCbo: 'Inspetor de Qualidade', codigo: 'INSP_QUALIDADE', titulo: 'Inspetor de Qualidade & Metrologia', nivel: 'ANALISTA', descricaoSumaria: 'Inspeção dimensional, ensaios não-destrutivos (LP/Partícula Magnética) e liberação de RNCs.', requisitosMinimos: 'Curso Técnico em Qualidade/Metrologia + ISO 9001.', pisoSalarial: 3800, tetoSalarial: 5200, ativo: true },
      { id: 'car-6', cboId: 'cbo-5', codigoCbo: '3141-10', tituloCbo: 'Programador CNC', codigo: 'LIDER_PRODUCAO', titulo: 'Líder de Produção Fabril', nivel: 'LIDER_FABRIL', descricaoSumaria: 'Gestão de turno, distribuição de ordens de produção e apontamento de tempos de máquina.', requisitosMinimos: 'Formação Técnica em Mecânica/Produção + Liderança de Equipes.', pisoSalarial: 5000, tetoSalarial: 7500, ativo: true },
      { id: 'car-7', cboId: 'cbo-7', codigoCbo: '2144-05', tituloCbo: 'Engenheiro Mecânico', codigo: 'ENG_PROCESSO', titulo: 'Engenheiro de Processos & PCP', nivel: 'SUPERVISOR', descricaoSumaria: 'Planejamento de capacidade MRP, cronoanálise de postos fabris e otimização de rotas.', requisitosMinimos: 'Graduação em Engenharia Mecânica/Produção + CREA Ativo.', pisoSalarial: 8500, tetoSalarial: 12500, ativo: true },
    ];

    // 4. Competências Industriais
    this.competencias = [
      { id: 'comp-1', codigo: 'LASER_FIBRA_SETUP', nome: 'Setup e Operação de Laser Fibra (Bystronic/Trumpf)', categoria: 'CORTE_USINAGEM_CNC', descricao: 'Alinhamento de feixe, troca de bico cerâmico, calibração de capacitância e corte N2/O2.', ativo: true },
      { id: 'comp-2', codigo: 'DOBRA_CNC_DELEM', nome: 'Programação de Dobradeira CNC (Delem DA-66T)', categoria: 'CORTE_USINAGEM_CNC', descricao: 'Cálculo de raio de dobra, K-Factor, retorno elástico e sequenciamento de ferramentas.', ativo: true },
      { id: 'comp-3', codigo: 'SOLDA_TIG_QUALIF', nome: 'Soldagem TIG em Aço Inox (Norma ASME IX)', categoria: 'SOLDA_CALDEIRARIA', descricao: 'Purga com gás argônio, controle de poça de fusão e acabamento sanitário alimentício.', ativo: true },
      { id: 'comp-4', codigo: 'LEITURA_DESENHO_CAD', nome: 'Leitura e Interpretação de Desenho Técnico & GD&T', categoria: 'METROLOGIA_QUALIDADE', descricao: 'Tolerâncias geométricas, simbologia de solda AWS e vistas ortogonais.', ativo: true },
      { id: 'comp-5', codigo: 'METROLOGIA_3D', nome: 'Metrologia Dimensional (Braço Tridimensional e Paquímetro)', categoria: 'METROLOGIA_QUALIDADE', descricao: 'Uso de paquímetro digital, micrômetro externo, súbito e braço tridimensional portátil.', ativo: true },
      { id: 'comp-6', codigo: 'NR12_SEGURANCA_PRENSAS', nome: 'Segurança Operacional em Prensas e Dobradeiras (NR-12)', categoria: 'SEGURANCA_NR', descricao: 'Operação com cortinas de luz ópticas, bimanuais, paradas de emergência e intertravamentos.', ativo: true },
      { id: 'comp-7', codigo: 'OPERACAO_PONTE_ROLANTE', nome: 'Operação e Amarração de Cargas com Ponte Rolante', categoria: 'LOGISTICA_MOVIMENTACAO', descricao: 'Inspeção de lingas de cabo de aço, cintas de poliéster, olhais e manobras seguras.', ativo: true },
      { id: 'comp-8', codigo: 'LIDERANCA_5S_LEAN', nome: 'Liderança Kaizen e Gestão do Posto 5S', categoria: 'SOFT_SKILL_LIDERANCA', descricao: 'Disseminação de melhorias contínuas, organização de postos fabris e gestão de conflitos.', ativo: true },
    ];

    // 5. Treinamentos
    this.treinamentos = [
      { id: 'trein-1', codigo: 'NR-12_OP_MAQ', titulo: 'NR-12: Segurança no Trabalho em Máquinas e Equipamentos', tipo: 'NORMA_REGULAMENTADORA_NR', normaRegulamentadora: 'NR-12', cargaHorariaHoras: 16, periodicidadeReciclagemMeses: 12, obrigatorioAdmissao: true, ativo: true },
      { id: 'trein-2', codigo: 'NR-10_SEG_ELET', titulo: 'NR-10: Segurança em Instalações e Serviços em Eletricidade', tipo: 'NORMA_REGULAMENTADORA_NR', normaRegulamentadora: 'NR-10', cargaHorariaHoras: 40, periodicidadeReciclagemMeses: 24, obrigatorioAdmissao: false, ativo: true },
      { id: 'trein-3', codigo: 'NR-35_ALTURA', titulo: 'NR-35: Trabalho em Altura (Montagem de Estruturas)', tipo: 'NORMA_REGULAMENTADORA_NR', normaRegulamentadora: 'NR-35', cargaHorariaHoras: 8, periodicidadeReciclagemMeses: 24, obrigatorioAdmissao: true, ativo: true },
      { id: 'trein-4', codigo: 'NR-06_USO_EPI', titulo: 'NR-06: Guarda, Conservação e Uso Correto de EPIs', tipo: 'NORMA_REGULAMENTADORA_NR', normaRegulamentadora: 'NR-06', cargaHorariaHoras: 4, periodicidadeReciclagemMeses: 12, obrigatorioAdmissao: true, ativo: true },
      { id: 'trein-5', codigo: 'ISO_9001_BPF', titulo: 'ISO 9001:2015 - Boas Práticas Fabris e Não-Conformidades', tipo: 'QUALIDADE_ISO9001', normaRegulamentadora: 'NBR ISO 9001', cargaHorariaHoras: 8, periodicidadeReciclagemMeses: 24, obrigatorioAdmissao: true, ativo: true },
      { id: 'trein-6', codigo: 'NR-11_PONTE_ROL', titulo: 'NR-11: Operação e Movimentação Segura com Ponte Rolante', tipo: 'NORMA_REGULAMENTADORA_NR', normaRegulamentadora: 'NR-11', cargaHorariaHoras: 16, periodicidadeReciclagemMeses: 12, obrigatorioAdmissao: false, ativo: true },
    ];

    // 6. EPIs
    this.epis = [
      { id: 'epi-1', codigo: 'EPI-ABAF-01', nome: 'Protetor Auditivo tipo Concha 24dB', tipoProtecao: 'AUDITIVA_AURICULAR', numeroCa: 'CA-14235', validadeCa: '2028-11-15', caValido: true, fabricante: '3M do Brasil', durabilidadeEstimadaDias: 180, custoUnitario: 48.50, estoqueAtual: 45, estoqueMinimo: 15, ativo: true },
      { id: 'epi-2', codigo: 'EPI-OCUL-02', nome: 'Óculos de Proteção Antirrisco e Antiembaçante', tipoProtecao: 'VISUAL_FACIAL_OCULOS', numeroCa: 'CA-18828', validadeCa: '2027-08-20', caValido: true, fabricante: 'Kalipso', durabilidadeEstimadaDias: 90, custoUnitario: 14.20, estoqueAtual: 120, estoqueMinimo: 30, ativo: true },
      { id: 'epi-3', codigo: 'EPI-BOTA-03', nome: 'Botina de Segurança Couro Nobuck com Bico Composite', tipoProtecao: 'PES_PERNAS_BOTINAS', numeroCa: 'CA-32541', validadeCa: '2029-03-10', caValido: true, fabricante: 'Marluvas', durabilidadeEstimadaDias: 180, custoUnitario: 165.00, estoqueAtual: 28, estoqueMinimo: 10, ativo: true },
      { id: 'epi-4', codigo: 'EPI-LUV-VAQ', nome: 'Luva de Vaqueta e Raspa Mista para Manuseio de Chapas', tipoProtecao: 'MAOS_BRACOS_LUVAS', numeroCa: 'CA-27891', validadeCa: '2027-05-30', caValido: true, fabricante: 'Volk do Brasil', durabilidadeEstimadaDias: 30, custoUnitario: 22.80, estoqueAtual: 85, estoqueMinimo: 25, ativo: true },
      { id: 'epi-5', codigo: 'EPI-MASC-SOL', nome: 'Máscara de Solda com Escurecimento Automático DIN 9-13', tipoProtecao: 'VISUAL_FACIAL_OCULOS', numeroCa: 'CA-39120', validadeCa: '2028-09-18', caValido: true, fabricante: 'Esab / Weld Vision', durabilidadeEstimadaDias: 365, custoUnitario: 340.00, estoqueAtual: 12, estoqueMinimo: 5, ativo: true },
      { id: 'epi-6', codigo: 'EPI-MASC-PFF2', nome: 'Respirador Semifacial Descartável PFF2 contra Fumos Metálicos', tipoProtecao: 'RESPIRATORIA_MASCARA', numeroCa: 'CA-41552', validadeCa: '2028-01-12', caValido: true, fabricante: 'Delta Plus', durabilidadeEstimadaDias: 5, custoUnitario: 4.50, estoqueAtual: 250, estoqueMinimo: 80, ativo: true },
    ];

    // 7. Turnos
    EMPRESAS_GRUPO.forEach((emp) => {
      this.turnos.push(
        { id: `tur-${emp.id}-1`, empresaId: emp.id, codigo: 'T1_MANHA', nome: 'Turno 1 - Manhã (06:00 às 15:18)', horarioEntrada: '06:00', horarioSaida: '15:18', intervaloInicio: '11:30', intervaloFim: '12:30', totalHorasDiarias: 8.8, tipoJornada: 'TURNO_1_MANHA', adicionalNoturnoAplica: false, ativo: true },
        { id: `tur-${emp.id}-2`, empresaId: emp.id, codigo: 'T2_TARDE', nome: 'Turno 2 - Tarde (15:18 às 00:20)', horarioEntrada: '15:18', horarioSaida: '00:20', intervaloInicio: '19:00', intervaloFim: '20:00', totalHorasDiarias: 8.8, tipoJornada: 'TURNO_2_TARDE', adicionalNoturnoAplica: true, ativo: true },
        { id: `tur-${emp.id}-3`, empresaId: emp.id, codigo: 'COMERCIAL', nome: 'Comercial / Administrativo (07:30 às 17:18)', horarioEntrada: '07:30', horarioSaida: '17:18', intervaloInicio: '12:00', intervaloFim: '13:00', totalHorasDiarias: 8.8, tipoJornada: 'COMERCIAL', adicionalNoturnoAplica: false, ativo: true }
      );
    });

    // 8. Colaboradores Mestres e Vínculos
    const colaboradoresSeed = [
      {
        id: 'func-1',
        cpf: '741.852.963-01',
        rg: '1088492019',
        rgOrgaoEmissor: 'SSP/RS',
        nomeCompleto: 'Roberto Albuquerque da Silva',
        dataNascimento: '1988-04-12',
        sexo: 'MASCULINO' as const,
        estadoCivil: 'CASADO' as const,
        nomeMae: 'Tereza Albuquerque',
        pisPasep: '128.49201.88-2',
        ctpsNumero: '48291',
        ctpsSerie: '0012-RS',
        escolaridade: 'Técnico em Mecânica Industrial',
        emailPessoal: 'roberto.albuquerque@gmail.com',
        emailCorporativo: 'roberto.silva@tritech.ind.br',
        telefoneCelular: '(54) 99812-4433',
        contatoEmergenciaNome: 'Mariana Silva (Esposa)',
        telefoneEmergencia: '(54) 99812-4400',
        enderecoLogradouro: 'Rua das Indústrias',
        enderecoNumero: '450',
        enderecoBairro: 'Distrito Industrial',
        enderecoCidade: 'Caxias do Sul',
        enderecoUf: 'RS',
        enderecoCep: '95000-000',
        pcd: false,
        statusGeral: 'ATIVO' as const,
      },
      {
        id: 'func-2',
        cpf: '852.963.741-02',
        rg: '2099384110',
        rgOrgaoEmissor: 'SSP/RS',
        nomeCompleto: 'Marcos Vinicius Fontana',
        dataNascimento: '1992-09-23',
        sexo: 'MASCULINO' as const,
        estadoCivil: 'SOLTEIRO' as const,
        nomeMae: 'Clenir Fontana',
        pisPasep: '139.58291.99-3',
        ctpsNumero: '59102',
        ctpsSerie: '0015-RS',
        escolaridade: 'Ensino Médio Completo + SENAI Solda',
        emailPessoal: 'marcos.fontana@outlook.com',
        emailCorporativo: 'marcos.fontana@tritech.ind.br',
        telefoneCelular: '(54) 99655-2211',
        contatoEmergenciaNome: 'Clenir Fontana (Mãe)',
        telefoneEmergencia: '(54) 99655-2200',
        enderecoLogradouro: 'Avenida Rio Branco',
        enderecoNumero: '1120',
        enderecoBairro: 'São Pelegrino',
        enderecoCidade: 'Caxias do Sul',
        enderecoUf: 'RS',
        enderecoCep: '95010-000',
        pcd: false,
        statusGeral: 'ATIVO' as const,
      },
      {
        id: 'func-3',
        cpf: '963.741.852-03',
        rg: '3088192844',
        rgOrgaoEmissor: 'SSP/RS',
        nomeCompleto: 'Fernanda Martins Carvalho',
        dataNascimento: '1995-11-05',
        sexo: 'FEMININO' as const,
        estadoCivil: 'CASADO' as const,
        nomeMae: 'Luciana Martins',
        pisPasep: '148.29104.77-4',
        ctpsNumero: '68291',
        ctpsSerie: '0020-RS',
        escolaridade: 'Tecnólogo em Qualidade & Produtividade',
        emailPessoal: 'fernanda.carvalho@gmail.com',
        emailCorporativo: 'fernanda.carvalho@tritech.ind.br',
        telefoneCelular: '(54) 99122-3344',
        contatoEmergenciaNome: 'Rodrigo Carvalho (Marido)',
        telefoneEmergencia: '(54) 99122-3300',
        enderecoLogradouro: 'Rua Sinimbu',
        enderecoNumero: '890',
        enderecoBairro: 'Lourdes',
        enderecoCidade: 'Caxias do Sul',
        enderecoUf: 'RS',
        enderecoCep: '95020-000',
        pcd: false,
        statusGeral: 'ATIVO' as const,
      },
      {
        id: 'func-4',
        cpf: '159.357.486-04',
        rg: '4077281900',
        rgOrgaoEmissor: 'SSP/RS',
        nomeCompleto: 'Guilherme Siqueira Lima',
        dataNascimento: '1984-02-18',
        sexo: 'MASCULINO' as const,
        estadoCivil: 'CASADO' as const,
        nomeMae: 'Zilda Siqueira',
        pisPasep: '112.39485.66-1',
        ctpsNumero: '31284',
        ctpsSerie: '0008-RS',
        escolaridade: 'Engenharia Mecânica - CREA 198244/RS',
        emailPessoal: 'guilherme.lima@yahoo.com.br',
        emailCorporativo: 'guilherme.lima@tritech.ind.br',
        telefoneCelular: '(54) 98844-7766',
        contatoEmergenciaNome: 'Carla Lima (Esposa)',
        telefoneEmergencia: '(54) 98844-7700',
        enderecoLogradouro: 'Rua Bento Gonçalves',
        enderecoNumero: '2100',
        enderecoBairro: 'Centro',
        enderecoCidade: 'Caxias do Sul',
        enderecoUf: 'RS',
        enderecoCep: '95030-000',
        pcd: false,
        statusGeral: 'ATIVO' as const,
      },
      {
        id: 'func-5',
        cpf: '357.951.246-05',
        rg: '5011928477',
        rgOrgaoEmissor: 'SSP/RS',
        nomeCompleto: 'Lucas Eduardo Pires',
        dataNascimento: '1999-07-30',
        sexo: 'MASCULINO' as const,
        estadoCivil: 'SOLTEIRO' as const,
        nomeMae: 'Sandra Pires',
        pisPasep: '159.28471.22-9',
        ctpsNumero: '79201',
        ctpsSerie: '0022-RS',
        escolaridade: 'Ensino Médio + Curso Dobra CNC SENAI',
        emailPessoal: 'lucas.pires@gmail.com',
        emailCorporativo: 'lucas.pires@tritech.ind.br',
        telefoneCelular: '(54) 99233-8899',
        contatoEmergenciaNome: 'Sandra Pires (Mãe)',
        telefoneEmergencia: '(54) 99233-8800',
        enderecoLogradouro: 'Rua Marechal Floriano',
        enderecoNumero: '340',
        enderecoBairro: 'Pio X',
        enderecoCidade: 'Caxias do Sul',
        enderecoUf: 'RS',
        enderecoCep: '95040-000',
        pcd: false,
        statusGeral: 'ATIVO' as const,
      },
    ];

    this.funcionarios = colaboradoresSeed;

    // Vínculos com as Empresas
    EMPRESAS_GRUPO.forEach((emp, eIdx) => {
      colaboradoresSeed.forEach((colab, cIdx) => {
        const cargo = this.cargos[cIdx % this.cargos.length];
        const setor = this.setores.find((s) => s.empresaId === emp.id && s.codigo === 'CORTE_DOBRA') || this.setores[0];
        const turno = this.turnos.find((t) => t.empresaId === emp.id) || this.turnos[0];
        const salario = cargo.pisoSalarial + cIdx * 350;
        const custoHora = Number(((salario * 1.68) / 220).toFixed(2)); // Custo hora considerando encargos e provisões industriais

        const vinculoId = `vinc-${emp.id}-${colab.id}`;
        const matricula = `MAT-${(eIdx + 1) * 1000 + cIdx + 1}`;

        this.vinculos.push({
          id: vinculoId,
          empresaId: emp.id,
          funcionarioId: colab.id,
          funcionarioNome: colab.nomeCompleto,
          funcionarioCpf: colab.cpf,
          matricula,
          cargoId: cargo.id,
          cargoTitulo: cargo.titulo,
          setorId: setor.id,
          setorNome: setor.nome,
          turnoId: turno.id,
          turnoNome: turno.nome,
          tipoContrato: 'CLT_INDETERMINADO',
          dataAdmissao: '2023-03-01',
          salarioBase: salario,
          adicionalPericulosidadePerc: cIdx === 1 ? 30 : 0, // Soldador com periculosidade/insalubridade
          adicionalInsalubridadeGrau: cIdx === 1 ? 'MEDIO_20' : 'NENHUM',
          custoHoraIndustrialEstimado: custoHora,
          status: 'ATIVO',
          regimeJornada: 'MENSALISTA_220H',
          gestorDiretoFuncionarioId: colab.id !== 'func-4' ? 'func-4' : undefined,
          gestorNome: colab.id !== 'func-4' ? 'Guilherme Siqueira Lima (Engenheiro)' : undefined,
          observacoes: 'Contrato padrão de produção fabril Grupo TRITECH.',
        });

        // Escala
        this.escalas.push({
          id: `esc-${emp.id}-${colab.id}`,
          empresaId: emp.id,
          funcionarioId: colab.id,
          funcionarioNome: colab.nomeCompleto,
          turnoId: turno.id,
          turnoNome: turno.nome,
          dataInicio: '2026-01-01',
          tipoRegime: 'SEMANAL_5X2',
          ativo: true,
        });
      });
    });

    // 9. Matriz de Polivalência (Habilidades por Nível)
    this.funcionarioCompetencias = [
      // Roberto Albuquerque (Operador Laser Pleno)
      { id: 'fc-1', funcionarioId: 'func-1', funcionarioNome: 'Roberto Albuquerque da Silva', competenciaId: 'comp-1', competenciaCodigo: 'LASER_FIBRA_SETUP', competenciaNome: 'Setup e Operação de Laser Fibra', competenciaCategoria: 'CORTE_USINAGEM_CNC', nivel: 3, dataAvaliacao: '2026-06-10', avaliadorNome: 'Guilherme Lima (Líder)' },
      { id: 'fc-2', funcionarioId: 'func-1', funcionarioNome: 'Roberto Albuquerque da Silva', competenciaId: 'comp-4', competenciaCodigo: 'LEITURA_DESENHO_CAD', competenciaNome: 'Leitura e Interpretação de Desenho', competenciaCategoria: 'METROLOGIA_QUALIDADE', nivel: 3, dataAvaliacao: '2026-06-10', avaliadorNome: 'Guilherme Lima (Líder)' },
      { id: 'fc-3', funcionarioId: 'func-1', funcionarioNome: 'Roberto Albuquerque da Silva', competenciaId: 'comp-6', competenciaCodigo: 'NR12_SEGURANCA_PRENSAS', competenciaNome: 'Segurança Operacional NR-12', competenciaCategoria: 'SEGURANCA_NR', nivel: 4, dataAvaliacao: '2026-05-15', avaliadorNome: 'Eng. Segurança SESMT' },
      { id: 'fc-4', funcionarioId: 'func-1', funcionarioNome: 'Roberto Albuquerque da Silva', competenciaId: 'comp-7', competenciaCodigo: 'OPERACAO_PONTE_ROLANTE', competenciaNome: 'Operação de Ponte Rolante', competenciaCategoria: 'LOGISTICA_MOVIMENTACAO', nivel: 2, dataAvaliacao: '2026-04-20', avaliadorNome: 'Instrutor SENAI' },

      // Marcos Fontana (Soldador Especialista)
      { id: 'fc-5', funcionarioId: 'func-2', funcionarioNome: 'Marcos Vinicius Fontana', competenciaId: 'comp-3', competenciaCodigo: 'SOLDA_TIG_QUALIF', competenciaNome: 'Soldagem TIG em Aço Inox', competenciaCategoria: 'SOLDA_CALDEIRARIA', nivel: 4, dataAvaliacao: '2026-07-01', avaliadorNome: 'Inspetor Nível 2 FBTS' },
      { id: 'fc-6', funcionarioId: 'func-2', funcionarioNome: 'Marcos Vinicius Fontana', competenciaId: 'comp-4', competenciaCodigo: 'LEITURA_DESENHO_CAD', competenciaNome: 'Leitura e Interpretação de Desenho', competenciaCategoria: 'METROLOGIA_QUALIDADE', nivel: 3, dataAvaliacao: '2026-07-01', avaliadorNome: 'Inspetor Nível 2 FBTS' },

      // Fernanda Martins (Qualidade)
      { id: 'fc-7', funcionarioId: 'func-3', funcionarioNome: 'Fernanda Martins Carvalho', competenciaId: 'comp-5', competenciaCodigo: 'METROLOGIA_3D', competenciaNome: 'Metrologia Dimensional 3D', competenciaCategoria: 'METROLOGIA_QUALIDADE', nivel: 4, dataAvaliacao: '2026-07-15', avaliadorNome: 'Auditor Externo ISO' },
      { id: 'fc-8', funcionarioId: 'func-3', funcionarioNome: 'Fernanda Martins Carvalho', competenciaId: 'comp-8', competenciaCodigo: 'LIDERANCA_5S_LEAN', competenciaNome: 'Liderança Kaizen e 5S', competenciaCategoria: 'SOFT_SKILL_LIDERANCA', nivel: 3, dataAvaliacao: '2026-07-15', avaliadorNome: 'Gerência Fabril' },

      // Lucas Pires (Dobrador CNC)
      { id: 'fc-9', funcionarioId: 'func-5', funcionarioNome: 'Lucas Eduardo Pires', competenciaId: 'comp-2', competenciaCodigo: 'DOBRA_CNC_DELEM', competenciaNome: 'Programação de Dobradeira CNC', competenciaCategoria: 'CORTE_USINAGEM_CNC', nivel: 2, dataAvaliacao: '2026-05-10', avaliadorNome: 'Roberto Albuquerque' },
      { id: 'fc-10', funcionarioId: 'func-5', funcionarioNome: 'Lucas Eduardo Pires', competenciaId: 'comp-6', competenciaCodigo: 'NR12_SEGURANCA_PRENSAS', competenciaNome: 'Segurança Operacional NR-12', competenciaCategoria: 'SEGURANCA_NR', nivel: 2, dataAvaliacao: '2026-05-10', avaliadorNome: 'Eng. Segurança' },
    ];

    // 10. Autorização para Operação de Máquinas (funcionario_maquinas)
    EMPRESAS_GRUPO.forEach((emp) => {
      this.funcionarioMaquinas.push(
        {
          id: `fm-${emp.id}-1`,
          empresaId: emp.id,
          funcionarioId: 'func-1',
          funcionarioNome: 'Roberto Albuquerque da Silva',
          maquinaEquipamentoId: 'MAQ-LASER-01',
          maquinaNome: 'Mesa de Corte a Laser Fibra 6kW (Trumpf TruLaser)',
          nivelAutorizacao: 'OPERADOR_PLENO',
          dataAutorizacao: '2026-01-10',
          validadeAutorizacao: '2027-01-10',
          nr12Valida: true,
          treinamentoEspecificoConcluido: true,
          autorizadoPorNome: 'Guilherme Siqueira Lima (Eng. Produção)',
          status: 'LIBERADO',
        },
        {
          id: `fm-${emp.id}-2`,
          empresaId: emp.id,
          funcionarioId: 'func-1',
          funcionarioNome: 'Roberto Albuquerque da Silva',
          maquinaEquipamentoId: 'MAQ-PONTE-01',
          maquinaNome: 'Ponte Rolante Viga Dupla 10T (Vastec)',
          nivelAutorizacao: 'OPERADOR_PLENO',
          dataAutorizacao: '2026-02-15',
          validadeAutorizacao: '2027-02-15',
          nr12Valida: true,
          treinamentoEspecificoConcluido: true,
          autorizadoPorNome: 'SESMT / Técnico de Segurança',
          status: 'LIBERADO',
        },
        {
          id: `fm-${emp.id}-3`,
          empresaId: emp.id,
          funcionarioId: 'func-5',
          funcionarioNome: 'Lucas Eduardo Pires',
          maquinaEquipamentoId: 'MAQ-DOBRA-02',
          maquinaNome: 'Prensa Dobradeira CNC Hidráulica 220T (Newton/Delem)',
          nivelAutorizacao: 'OPERADOR_SOB_SUPERVISAO',
          dataAutorizacao: '2026-05-10',
          validadeAutorizacao: '2026-11-10',
          nr12Valida: true,
          treinamentoEspecificoConcluido: true,
          autorizadoPorNome: 'Guilherme Siqueira Lima (Eng. Produção)',
          status: 'LIBERADO',
        },
        {
          id: `fm-${emp.id}-4`,
          empresaId: emp.id,
          funcionarioId: 'func-2',
          funcionarioNome: 'Marcos Vinicius Fontana',
          maquinaEquipamentoId: 'MAQ-ROBO-SOLDA-01',
          maquinaNome: 'Célula Robotizada de Soldagem MIG/MAG (OTC Daihen)',
          nivelAutorizacao: 'PREPARADOR_SETUP',
          dataAutorizacao: '2026-03-20',
          validadeAutorizacao: '2027-03-20',
          nr12Valida: true,
          treinamentoEspecificoConcluido: true,
          autorizadoPorNome: 'Guilherme Siqueira Lima (Eng. Produção)',
          status: 'LIBERADO',
        }
      );
    });

    // 11. Treinamentos Realizados e Controle de Validade
    EMPRESAS_GRUPO.forEach((emp) => {
      this.funcionarioTreinamentos.push(
        {
          id: `ft-${emp.id}-1`,
          empresaId: emp.id,
          funcionarioId: 'func-1',
          funcionarioNome: 'Roberto Albuquerque da Silva',
          treinamentoId: 'trein-1',
          treinamentoTitulo: 'NR-12: Segurança no Trabalho em Máquinas e Equipamentos',
          normaRegulamentadora: 'NR-12',
          dataRealizacao: '2025-09-10',
          dataVencimento: '2026-09-10', // Vencendo em 15 dias!
          diasAteVencimento: 15,
          entidadeInstrutor: 'SENAI Caxias do Sul',
          cargaHorariaCumprida: 16,
          notaAproveitamento: 9.5,
          frequenciaPerc: 100,
          status: 'VENCENDO_30_DIAS',
          custoTreinamento: 450,
          observacoes: 'Reciclagem programada para próxima semana com turma interna.',
        },
        {
          id: `ft-${emp.id}-2`,
          empresaId: emp.id,
          funcionarioId: 'func-2',
          funcionarioNome: 'Marcos Vinicius Fontana',
          treinamentoId: 'trein-3',
          treinamentoTitulo: 'NR-35: Trabalho em Altura (Montagem de Estruturas)',
          normaRegulamentadora: 'NR-35',
          dataRealizacao: '2024-08-10',
          dataVencimento: '2026-08-10', // Vencido há 16 dias!
          diasAteVencimento: -16,
          entidadeInstrutor: 'PrevSafety Engenharia de Segurança',
          cargaHorariaCumprida: 8,
          notaAproveitamento: 8.8,
          frequenciaPerc: 100,
          status: 'VENCIDO',
          custoTreinamento: 280,
          observacoes: 'URGENTE: Colaborador bloqueado para montagem em altura até reciclagem.',
        },
        {
          id: `ft-${emp.id}-3`,
          empresaId: emp.id,
          funcionarioId: 'func-3',
          funcionarioNome: 'Fernanda Martins Carvalho',
          treinamentoId: 'trein-5',
          treinamentoTitulo: 'ISO 9001:2015 - Boas Práticas Fabris e Não-Conformidades',
          normaRegulamentadora: 'NBR ISO 9001',
          dataRealizacao: '2026-02-10',
          dataVencimento: '2028-02-10',
          diasAteVencimento: 533,
          entidadeInstrutor: 'Bureau Veritas Training',
          cargaHorariaCumprida: 8,
          notaAproveitamento: 10.0,
          frequenciaPerc: 100,
          status: 'VALIDO',
          custoTreinamento: 600,
        }
      );
    });

    // 12. Documentos e ASOs Ocupacionais
    EMPRESAS_GRUPO.forEach((emp) => {
      this.documentos.push(
        {
          id: `doc-${emp.id}-1`,
          empresaId: emp.id,
          funcionarioId: 'func-1',
          funcionarioNome: 'Roberto Albuquerque da Silva',
          tipoDocumento: 'ASO_PERIODICO',
          numeroDocumento: 'ASO-2025-9912',
          dataEmissao: '2025-09-01',
          dataValidade: '2026-09-01', // Vencendo em 6 dias
          diasAteVencimento: 6,
          medicoCrmEmissor: 'Dr. Leonardo Vasconcelos - CRM/RS 38491',
          clinicaEmissora: 'MedTrab Medicina Ocupacional',
          statusAptidao: 'APTO',
          statusValidade: 'VENCENDO',
          observacoes: 'Audiometria e acuidade visual dentro dos padrões normais de tolerância.',
        },
        {
          id: `doc-${emp.id}-2`,
          empresaId: emp.id,
          funcionarioId: 'func-2',
          funcionarioNome: 'Marcos Vinicius Fontana',
          tipoDocumento: 'ASO_PERIODICO',
          numeroDocumento: 'ASO-2026-1102',
          dataEmissao: '2026-03-15',
          dataValidade: '2027-03-15',
          diasAteVencimento: 201,
          medicoCrmEmissor: 'Dra. Camila Sartori - CRM/RS 41029',
          clinicaEmissora: 'MedTrab Medicina Ocupacional',
          statusAptidao: 'APTO',
          statusValidade: 'VALIDO',
          observacoes: 'Espirometria e RX tórax padrão OIT normais para fumos metálicos.',
        },
        {
          id: `doc-${emp.id}-3`,
          empresaId: emp.id,
          funcionarioId: 'func-1',
          funcionarioNome: 'Roberto Albuquerque da Silva',
          tipoDocumento: 'CNH_MOTORISTA_OPERADOR',
          numeroDocumento: 'CNH-0482910482',
          dataEmissao: '2022-04-10',
          dataValidade: '2027-04-10',
          diasAteVencimento: 592,
          statusAptidao: 'APTO',
          statusValidade: 'VALIDO',
          observacoes: 'Categoria B - Habilitado para movimentação interna de utilitários.',
        }
      );
    });

    // 13. Entregas de EPIs
    EMPRESAS_GRUPO.forEach((emp) => {
      this.entregasEpi.push(
        {
          id: `eepi-${emp.id}-1`,
          empresaId: emp.id,
          funcionarioId: 'func-1',
          funcionarioNome: 'Roberto Albuquerque da Silva',
          epiId: 'epi-1',
          epiNome: 'Protetor Auditivo tipo Concha 24dB',
          numeroCa: 'CA-14235',
          quantidade: 1,
          tamanho: 'Único',
          dataEntrega: '2026-03-10',
          dataPrevisaoTroca: '2026-09-10', // Troca em 15 dias
          diasAteTroca: 15,
          motivoEntrega: 'ADMISSAO_INTEGRACAO',
          termoAssinadoDigital: true,
          autenticacaoTermoHash: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
          entreguePorNome: 'Técnico de Segurança SESMT',
          statusDevolucao: 'EM_USO',
          observacoes: 'Termo de responsabilidade e guarda assinado no tablet industrial.',
        },
        {
          id: `eepi-${emp.id}-2`,
          empresaId: emp.id,
          funcionarioId: 'func-2',
          funcionarioNome: 'Marcos Vinicius Fontana',
          epiId: 'epi-5',
          epiNome: 'Máscara de Solda com Escurecimento Automático DIN 9-13',
          numeroCa: 'CA-39120',
          quantidade: 1,
          tamanho: 'Ajustável',
          dataEntrega: '2026-01-15',
          dataPrevisaoTroca: '2027-01-15',
          diasAteTroca: 142,
          motivoEntrega: 'ADMISSAO_INTEGRACAO',
          termoAssinadoDigital: true,
          autenticacaoTermoHash: 'SHA256:4d87b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9111',
          entreguePorNome: 'Técnico de Segurança SESMT',
          statusDevolucao: 'EM_USO',
        },
        {
          id: `eepi-${emp.id}-3`,
          empresaId: emp.id,
          funcionarioId: 'func-1',
          funcionarioNome: 'Roberto Albuquerque da Silva',
          epiId: 'epi-4',
          epiNome: 'Luva de Vaqueta e Raspa Mista',
          numeroCa: 'CA-27891',
          quantidade: 2,
          tamanho: 'G',
          dataEntrega: '2026-07-20',
          dataPrevisaoTroca: '2026-08-20', // Troca atrasada em 6 dias!
          diasAteTroca: -6,
          motivoEntrega: 'SUBSTITUICAO_DESGASTE',
          termoAssinadoDigital: true,
          autenticacaoTermoHash: 'SHA256:9981b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9222',
          entreguePorNome: 'Almoxarife Plantonista',
          statusDevolucao: 'EM_USO',
          observacoes: 'Substituição recomendada por desgaste em manuseio de chapas cortadas.',
        }
      );
    });

    // 14. Apontamentos de Horas para Custeio Industrial
    EMPRESAS_GRUPO.forEach((emp) => {
      this.apontamentosHoras.push(
        {
          id: `ap-${emp.id}-1`,
          empresaId: emp.id,
          funcionarioId: 'func-1',
          funcionarioNome: 'Roberto Albuquerque da Silva',
          matricula: 'MAT-1001',
          setorNome: 'Corte a Laser & Dobra CNC',
          dataApontamento: '2026-08-25',
          tipoHora: 'NORMAL_PRODUTIVA',
          quantidadeHoras: 8.8,
          custoHoraAplicado: 27.50,
          custoTotalCalculado: 242.00,
          ordemProducaoId: 'OP-2026-0891',
          operacaoId: 'OPR-010-CORTE-LASER',
          maquinaId: 'MAQ-LASER-01',
          statusAprovacao: 'CONCILIADO_CUSTO_INDUSTRIAL',
          aprovadorNome: 'Guilherme Lima (Líder)',
          justificativaObservacoes: 'Corte de 45 chapas SAE 1020 1/4" para estrutura chassi.',
        },
        {
          id: `ap-${emp.id}-2`,
          empresaId: emp.id,
          funcionarioId: 'func-1',
          funcionarioNome: 'Roberto Albuquerque da Silva',
          matricula: 'MAT-1001',
          setorNome: 'Corte a Laser & Dobra CNC',
          dataApontamento: '2026-08-25',
          tipoHora: 'EXTRA_50',
          quantidadeHoras: 2.0,
          custoHoraAplicado: 41.25, // 1.5x
          custoTotalCalculado: 82.50,
          ordemProducaoId: 'OP-2026-0891',
          operacaoId: 'OPR-010-CORTE-LASER',
          maquinaId: 'MAQ-LASER-01',
          statusAprovacao: 'APROVADO_LIDER',
          aprovadorNome: 'Guilherme Lima (Líder)',
          justificativaObservacoes: 'Horas extras autorizadas para atendimento de prazo de entrega cliente Senagro.',
        },
        {
          id: `ap-${emp.id}-3`,
          empresaId: emp.id,
          funcionarioId: 'func-2',
          funcionarioNome: 'Marcos Vinicius Fontana',
          matricula: 'MAT-1002',
          setorNome: 'Soldagem & Caldeiraria Pesada',
          dataApontamento: '2026-08-25',
          tipoHora: 'NORMAL_PRODUTIVA',
          quantidadeHoras: 8.8,
          custoHoraAplicado: 34.20,
          custoTotalCalculado: 300.96,
          ordemProducaoId: 'OP-2026-0895',
          operacaoId: 'OPR-020-SOLDA-ESTRUT',
          maquinaId: 'MAQ-ROBO-SOLDA-01',
          statusAprovacao: 'CONCILIADO_CUSTO_INDUSTRIAL',
          aprovadorNome: 'Guilherme Lima (Líder)',
          justificativaObservacoes: 'Soldagem de vigas de sustentação com ensaio visual 100% aprovado.',
        }
      );
    });

    // 15. Vagas e Recrutamento
    EMPRESAS_GRUPO.forEach((emp) => {
      const vagaId = `vaga-${emp.id}-1`;
      this.vagas.push({
        id: vagaId,
        empresaId: emp.id,
        codigoVaga: 'VAG-2026-04',
        titulo: 'Operador de Torno CNC & Centro de Usinagem Pleno',
        cargoId: 'car-1',
        cargoTitulo: 'Operador de Máquinas CNC',
        setorId: this.setores.find((s) => s.empresaId === emp.id && s.codigo === 'USINAGEM')?.id || this.setores[0].id,
        setorNome: 'Usinagem CNC & Centros 5 Eixos',
        quantidadeVagas: 2,
        regimeContratacao: 'CLT Indeterminado',
        salarioPropostoDe: 3500,
        salarioPropostoAte: 4800,
        dataAbertura: '2026-08-01',
        dataPrevisaoFechamento: '2026-09-15',
        status: 'EM_TRIAGEM',
        motivoAbertura: 'AUMENTO_QUADRO_PRODUCAO',
        requisitosObrigatorios: 'Experiência em programação Fanuc/Siemens e leitura de paquímetro/micrômetro.',
        totalCandidatos: 3,
      });

      this.candidatos.push(
        {
          id: `cand-${emp.id}-1`,
          vagaId,
          vagaTitulo: 'Operador de Torno CNC & Centro de Usinagem Pleno',
          empresaId: emp.id,
          nomeCompleto: 'Diego Alencastro Ramos',
          cpf: '456.789.123-09',
          email: 'diego.alencastro@gmail.com',
          telefone: '(54) 99881-2299',
          cidadeUf: 'Caxias do Sul/RS',
          pretensaoSalarial: 4200,
          etapaFunil: 'TESTE_PRATICO_FABRIL',
          scoreAderenciaPerc: 92,
          parecerEntrevistador: 'Excelente conhecimento de comandos ISO e calibração de ferramentas. Aprovado para teste na fábrica.',
          createdAt: '2026-08-10',
        },
        {
          id: `cand-${emp.id}-2`,
          vagaId,
          vagaTitulo: 'Operador de Torno CNC & Centro de Usinagem Pleno',
          empresaId: emp.id,
          nomeCompleto: 'Gabriel Souza Mendes',
          cpf: '567.890.234-10',
          email: 'gabriel.mendes@hotmail.com',
          telefone: '(54) 99112-8877',
          cidadeUf: 'Farroupilha/RS',
          pretensaoSalarial: 3900,
          etapaFunil: 'ENTREVISTA_RH',
          scoreAderenciaPerc: 84,
          parecerEntrevistador: 'Boa postura profissional e disponibilidade para o Turno 2.',
          createdAt: '2026-08-14',
        }
      );
    });

    // 16. Onboarding
    EMPRESAS_GRUPO.forEach((emp) => {
      this.onboardings.push({
        id: `onb-${emp.id}-1`,
        empresaId: emp.id,
        funcionarioId: 'func-5',
        funcionarioNome: 'Lucas Eduardo Pires',
        cargoTitulo: 'Operador de Dobradeira CNC',
        setorNome: 'Corte a Laser & Dobra CNC',
        dataInicio: '2026-08-01',
        previsaoConclusao: '2026-09-01',
        status: 'EM_ANDAMENTO',
        progressoPercentual: 70,
        responsavelRhNome: 'Mariana Duarte (Coordenadora de Gente & Gestão)',
        checklistItens: [
          { id: '1', item: 'Recebimento de Documentos e Ficha Cadastral', categoria: 'DOCUMENTAL', concluido: true, dataConclusao: '2026-08-01', responsavel: 'RH Admissional' },
          { id: '2', item: 'Exame ASO Admissional Apto', categoria: 'SAUDE', concluido: true, dataConclusao: '2026-08-02', responsavel: 'MedTrab' },
          { id: '3', item: 'Entrega de EPIs Obrigatórios e Termo Assinado', categoria: 'SEGURANCA', concluido: true, dataConclusao: '2026-08-03', responsavel: 'SESMT' },
          { id: '4', item: 'Treinamento de Integração Geral e NR-06/NR-12', categoria: 'TREINAMENTO', concluido: true, dataConclusao: '2026-08-05', responsavel: 'Engenharia de Segurança' },
          { id: '5', item: 'Liberação de Crachá, Catraca e Acesso ao ERP Chão de Fábrica', categoria: 'TI_ACESSO', concluido: true, dataConclusao: '2026-08-06', responsavel: 'TI Suporte' },
          { id: '6', item: 'Acompanhamento do Padrinho Fabril (Avaliação 30 dias)', categoria: 'ACOLHIMENTO', concluido: false, responsavel: 'Roberto Albuquerque (Padrinho)' },
        ],
        observacoes: 'Colaborador demonstrando ótima curva de aprendizado nas dobradeiras Newton.',
      });
    });

    // 17. Desligamento
    EMPRESAS_GRUPO.forEach((emp) => {
      this.desligamentos.push({
        id: `desl-${emp.id}-1`,
        empresaId: emp.id,
        funcionarioId: 'func-3',
        funcionarioNome: 'Fernanda Martins Carvalho',
        matricula: 'MAT-1003',
        cargoTitulo: 'Inspetor de Qualidade & Metrologia',
        setorNome: 'Qualidade, Metrologia & ISO',
        tipoRescisao: 'PEDIDO_DEMISSAO_FUNCIONARIO',
        dataComunicacao: '2026-08-15',
        dataDesligamentoEfetivo: '2026-09-15',
        cumpriuAvisoPrevio: true,
        tipoAvisoPrevio: 'TRABALHADO',
        progressoPercentual: 50,
        status: 'EM_ANDAMENTO',
        responsavelRhNome: 'Mariana Duarte (RH)',
        checklistItens: [
          { id: '1', item: 'Exame Médico ASO Demissional', categoria: 'SAUDE', concluido: true, dataConclusao: '2026-08-20', responsavel: 'MedTrab' },
          { id: '2', item: 'Devolução e Baixa de EPIs e Ferramentas Cauteladas', categoria: 'PATRIMONIO_EPI', concluido: true, dataConclusao: '2026-08-22', responsavel: 'Almoxarifado' },
          { id: '3', item: 'Revogação de Acessos a Máquinas e ERP (Lockout/Tagout)', categoria: 'SEGURANCA_TI', concluido: false, responsavel: 'TI Segurança' },
          { id: '4', item: 'Entrevista de Desligamento e Pesquisa de Clima', categoria: 'RH_PESSOAS', concluido: false, responsavel: 'Mariana Duarte (RH)' },
          { id: '5', item: 'Exportação do Pacote Rescisório para Sistema Especializado de Folha', categoria: 'INTEGRACAO_FOLHA', concluido: false, responsavel: 'Folha Pagamento Senior HCM' },
        ],
        entrevistaDesligamento: {
          motivoPrincipal: 'Proposta profissional para transferência para o exterior.',
          climaSetorNota: 9,
          relacionamentoLiderNota: 10,
          pontosFortesEmpresa: 'Estrutura fabril moderna, máquinas CNC de ponta e respeito à segurança.',
          pontosMelhoria: 'Possibilidade de plano de previdência privada corporativa.',
          recomendariaEmpresa: true,
        },
        exportadoSistemaFolha: false,
        observacoes: 'Em cumprimento de aviso prévio trabalhado com transição de bastão para substituto.',
      });
    });

    // 18. Histórico de Cargos e Salários
    this.historicoCargos.push({
      id: 'hc-1',
      empresaId: EMPRESAS_GRUPO[0].id,
      funcionarioId: 'func-1',
      funcionarioNome: 'Roberto Albuquerque da Silva',
      cargoAnteriorTitulo: 'Operador de Corte a Laser Júnior',
      novoCargoId: 'car-1',
      novoCargoTitulo: 'Operador de Corte a Laser CNC Pleno',
      salarioAnterior: 2900,
      novoSalario: 3550,
      novoSetorId: this.setores[0].id,
      novoSetorNome: 'Corte a Laser & Dobra CNC',
      dataMudanca: '2025-03-01',
      motivo: 'PROMOCAO_MERITO',
      justificativa: 'Promoção por mérito após conclusão da matriz de polivalência e autonomia na mesa laser Trumpf.',
      aprovadoPorNome: 'Guilherme Siqueira Lima (Eng. Produção)',
      createdAt: '2025-03-01T10:00:00Z',
    });
  }

  // ---------------------------------------------------------------------------
  // AUDITORIA APPEND-ONLY
  // ---------------------------------------------------------------------------
  private registrarAuditoria(
    empresaId: string,
    usuarioId: string,
    usuarioNome: string,
    acao: string,
    entidadeAfetada: string,
    entidadeId: string,
    funcionarioId?: string,
    funcionarioNome?: string,
    justificativa?: string,
    payloadBefore?: any,
    payloadAfter?: any
  ) {
    const log: RhAuditoriaLog = {
      id: `rh-audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      empresaId,
      usuarioId,
      usuarioNome,
      dataHora: new Date().toISOString(),
      modulo: 'RH_OPERACIONAL',
      acao,
      entidadeAfetada,
      entidadeId,
      funcionarioId,
      funcionarioNome,
      justificativa,
      payloadBefore,
      payloadAfter,
      ipOrigem: '192.168.10.150',
    };
    this.auditoriaLogs.unshift(log);
  }

  // ---------------------------------------------------------------------------
  // DASHBOARD & KPIS
  // ---------------------------------------------------------------------------
  getDashboardData(empresaId: string): RhDashboardData {
    const vinculosEmpresa = this.vinculos.filter((v) => v.empresaId === empresaId);
    const ativos = vinculosEmpresa.filter((v) => v.status === 'ATIVO');
    const totalFolha = vinculosEmpresa.reduce((acc, v) => acc + v.salarioBase * (1 + (v.adicionalPericulosidadePerc || 0) / 100), 0);
    const custoHoraMedio = ativos.length > 0
      ? Number((ativos.reduce((acc, v) => acc + v.custoHoraIndustrialEstimado, 0) / ativos.length).toFixed(2))
      : 0;

    const treinamentosEmp = this.funcionarioTreinamentos.filter((t) => t.empresaId === empresaId);
    const treinVencidos = treinamentosEmp.filter((t) => t.status === 'VENCIDO').length;
    const treinVencendo30d = treinamentosEmp.filter((t) => t.status === 'VENCENDO_30_DIAS').length;

    const episEmp = this.entregasEpi.filter((e) => e.empresaId === empresaId && e.statusDevolucao === 'EM_USO');
    const episVencidos = episEmp.filter((e) => (e.diasAteTroca || 0) <= 0).length;

    const docsEmp = this.documentos.filter((d) => d.empresaId === empresaId);
    const docsVencendo = docsEmp.filter((d) => d.statusValidade === 'VENCENDO' || d.statusValidade === 'VENCIDO').length;

    const maqsEmp = this.funcionarioMaquinas.filter((m) => m.empresaId === empresaId);
    const maqsBloqueadas = maqsEmp.filter((m) => m.status === 'REVOGADO' || m.status === 'SUSPENSO' || !m.nr12Valida).length;

    const vagasAbertas = this.vagas.filter((v) => v.empresaId === empresaId && (v.status === 'ABERTA' || v.status === 'EM_TRIAGEM')).length;
    const onbsAndamento = this.onboardings.filter((o) => o.empresaId === empresaId && o.status === 'EM_ANDAMENTO').length;
    const deslsAndamento = this.desligamentos.filter((d) => d.empresaId === empresaId && d.status === 'EM_ANDAMENTO').length;

    const apontamentos = this.apontamentosHoras.filter((a) => a.empresaId === empresaId);
    const horasNormais = apontamentos.filter((a) => a.tipoHora === 'NORMAL_PRODUTIVA').reduce((acc, a) => acc + a.quantidadeHoras, 0);
    const horasExtras50 = apontamentos.filter((a) => a.tipoHora === 'EXTRA_50').reduce((acc, a) => acc + a.quantidadeHoras, 0);
    const horasExtras100 = apontamentos.filter((a) => a.tipoHora === 'EXTRA_100').reduce((acc, a) => acc + a.quantidadeHoras, 0);
    const horasImprodutivas = apontamentos.filter((a) => a.tipoHora === 'PARADA_IMPRODUTIVA').reduce((acc, a) => acc + a.quantidadeHoras, 0);
    const totalCustoHoras = apontamentos.reduce((acc, a) => acc + a.custoTotalCalculado, 0);

    // Distribuição por Setor
    const setorMap = new Map<string, number>();
    vinculosEmpresa.forEach((v) => {
      const setNome = v.setorNome || 'Não Definido';
      setorMap.set(setNome, (setorMap.get(setNome) || 0) + 1);
    });
    const distribuicaoPorSetor = Array.from(setorMap.entries()).map(([setor, qtd]) => ({
      setor,
      quantidade: qtd,
      percentual: vinculosEmpresa.length > 0 ? Math.round((qtd / vinculosEmpresa.length) * 100) : 0,
    }));

    // Alertas de Criticidade Alta
    const alertas: RhDashboardData['alertasCriticidadeAlta'] = [];

    treinamentosEmp
      .filter((t) => t.status === 'VENCIDO' || t.status === 'VENCENDO_30_DIAS')
      .forEach((t) => {
        alertas.push({
          tipo: 'TREINAMENTO_NR',
          titulo: `Treinamento Obrigatório ${t.normaRegulamentadora || ''} ${t.status === 'VENCIDO' ? 'VENCIDO' : 'Vence em ' + t.diasAteVencimento + ' dias'}`,
          colaboradorNome: t.funcionarioNome,
          setorNome: 'Fábrica',
          diasAtrasoOuValidade: t.diasAteVencimento || 0,
          urgencia: t.status === 'VENCIDO' ? 'CRITICA' : 'ALTA',
        });
      });

    episEmp
      .filter((e) => (e.diasAteTroca || 0) <= 0)
      .forEach((e) => {
        alertas.push({
          tipo: 'EPI_VENCIDO',
          titulo: `Troca Periódica de EPI Atrasada (${e.epiNome})`,
          colaboradorNome: e.funcionarioNome,
          setorNome: 'Chão de Fábrica',
          diasAtrasoOuValidade: e.diasAteTroca || 0,
          urgencia: 'ALTA',
        });
      });

    docsEmp
      .filter((d) => d.statusValidade === 'VENCENDO' || d.statusValidade === 'VENCIDO')
      .forEach((d) => {
        alertas.push({
          tipo: 'ASO_VENCIDO',
          titulo: `Exame Médico Ocupacional ${d.tipoDocumento} (${d.statusValidade})`,
          colaboradorNome: d.funcionarioNome,
          setorNome: 'Geral',
          diasAtrasoOuValidade: d.diasAteVencimento || 0,
          urgencia: d.statusValidade === 'VENCIDO' ? 'CRITICA' : 'MEDIA',
        });
      });

    return {
      totalFuncionariosAtivos: ativos.length,
      totalFuncionariosEmpresa: vinculosEmpresa.length,
      totalCustoFolhaEstimado: Number(totalFolha.toFixed(2)),
      custoHoraMedioFabril: custoHoraMedio,
      treinamentosVencidosQtd: treinVencidos,
      treinamentosVencendo30dQtd: treinVencendo30d,
      episTrocaPendenteQtd: episVencidos,
      documentosAsosVencendoQtd: docsVencendo,
      maquinasBloqueadasQtd: maqsBloqueadas,
      vagasAbertasQtd: vagasAbertas,
      onboardingsEmAndamentoQtd: onbsAndamento,
      desligamentosEmAndamentoQtd: deslsAndamento,
      horasApontadasMesAtual: {
        produtivasNormais: Number(horasNormais.toFixed(1)),
        extras50: Number(horasExtras50.toFixed(1)),
        extras100: Number(horasExtras100.toFixed(1)),
        improdutivasParadas: Number(horasImprodutivas.toFixed(1)),
        totalHoras: Number((horasNormais + horasExtras50 + horasExtras100 + horasImprodutivas).toFixed(1)),
        custoTotalIndustrial: Number(totalCustoHoras.toFixed(2)),
      },
      distribuicaoPorSetor,
      alertasCriticidadeAlta: alertas,
    };
  }

  // ---------------------------------------------------------------------------
  // CRUD & GESTÃO DE COLABORADORES
  // ---------------------------------------------------------------------------
  getColaboradores(empresaId: string): { funcionario: Funcionario; vinculo: FuncionarioEmpresa }[] {
    const vinculos = this.vinculos.filter((v) => v.empresaId === empresaId);
    return vinculos.map((v) => {
      const func = this.funcionarios.find((f) => f.id === v.funcionarioId)!;
      return {
        funcionario: func,
        vinculo: v,
      };
    });
  }

  admitirColaborador(
    empresaId: string,
    params: {
      cpf: string;
      nomeCompleto: string;
      dataNascimento: string;
      telefoneCelular: string;
      emailPessoal?: string;
      cargoId: string;
      setorId: string;
      turnoId: string;
      salarioBase: number;
      adicionalPericulosidadePerc?: number;
      adicionalInsalubridadeGrau?: 'NENHUM' | 'MINIMO_10' | 'MEDIO_20' | 'MAXIMO_40';
      tipoContrato: 'CLT_INDETERMINADO' | 'CLT_DETERMINADO' | 'PJ' | 'ESTAGIO' | 'APRENDIZ';
      dataAdmissao: string;
      usuarioId: string;
      usuarioNome: string;
    }
  ): { funcionario: Funcionario; vinculo: FuncionarioEmpresa } {
    let func = this.funcionarios.find((f) => f.cpf.replace(/\D/g, '') === params.cpf.replace(/\D/g, ''));
    if (!func) {
      func = {
        id: `func-${Date.now()}`,
        cpf: params.cpf,
        nomeCompleto: params.nomeCompleto,
        dataNascimento: params.dataNascimento,
        sexo: 'MASCULINO',
        estadoCivil: 'SOLTEIRO',
        telefoneCelular: params.telefoneCelular,
        emailPessoal: params.emailPessoal,
        pcd: false,
        statusGeral: 'ATIVO',
      };
      this.funcionarios.push(func);
    }

    const cargo = this.cargos.find((c) => c.id === params.cargoId) || this.cargos[0];
    const setor = this.setores.find((s) => s.id === params.setorId) || this.setores[0];
    const turno = this.turnos.find((t) => t.id === params.turnoId) || this.turnos[0];

    const matricula = `MAT-${(this.vinculos.filter((v) => v.empresaId === empresaId).length + 1) * 100 + Math.floor(Math.random() * 90 + 10)}`;
    const custoHora = Number(((params.salarioBase * 1.68) / 220).toFixed(2));

    const vinculo: FuncionarioEmpresa = {
      id: `vinc-${empresaId}-${func.id}`,
      empresaId,
      funcionarioId: func.id,
      funcionarioNome: func.nomeCompleto,
      funcionarioCpf: func.cpf,
      matricula,
      cargoId: cargo.id,
      cargoTitulo: cargo.titulo,
      setorId: setor.id,
      setorNome: setor.nome,
      turnoId: turno.id,
      turnoNome: turno.nome,
      tipoContrato: params.tipoContrato,
      dataAdmissao: params.dataAdmissao,
      salarioBase: params.salarioBase,
      adicionalPericulosidadePerc: params.adicionalPericulosidadePerc || 0,
      adicionalInsalubridadeGrau: params.adicionalInsalubridadeGrau || 'NENHUM',
      custoHoraIndustrialEstimado: custoHora,
      status: 'ATIVO',
      regimeJornada: 'MENSALISTA_220H',
    };

    this.vinculos.push(vinculo);

    // Inicia Onboarding Automático
    this.iniciarOnboarding(empresaId, func.id, func.nomeCompleto, cargo.titulo, setor.nome, params.usuarioNome);

    // Histórico de Cargo Inicial
    this.historicoCargos.push({
      id: `hc-${Date.now()}`,
      empresaId,
      funcionarioId: func.id,
      funcionarioNome: func.nomeCompleto,
      novoCargoId: cargo.id,
      novoCargoTitulo: cargo.titulo,
      novoSalario: params.salarioBase,
      novoSetorId: setor.id,
      novoSetorNome: setor.nome,
      dataMudanca: params.dataAdmissao,
      motivo: 'ADMISSAO',
      justificativa: 'Admissão de colaborador no quadro fabril.',
      aprovadoPorNome: params.usuarioNome,
      createdAt: new Date().toISOString(),
    });

    this.registrarAuditoria(
      empresaId,
      params.usuarioId,
      params.usuarioNome,
      'ADMITIR_COLABORADOR',
      'rh_funcionario_empresas',
      vinculo.id,
      func.id,
      func.nomeCompleto,
      `Admissão de ${func.nomeCompleto} como ${cargo.titulo} com salário R$ ${params.salarioBase.toFixed(2)}.`
    );

    return { funcionario: func, vinculo };
  }

  // ---------------------------------------------------------------------------
  // HISTÓRICO DE CARGOS E ALTERAÇÃO SALARIAL
  // ---------------------------------------------------------------------------
  alterarCargoOuSalario(
    empresaId: string,
    params: {
      funcionarioId: string;
      novoCargoId: string;
      novoSetorId: string;
      novoSalario: number;
      dataMudanca: string;
      motivo: 'PROMOCAO_MERITO' | 'ENQUADRAMENTO_CCT_DISSIDIO' | 'TRANSFERENCIA_SETOR' | 'REESTRUTURACAO' | 'AJUSTE_MERCADO';
      justificativa: string;
      usuarioId: string;
      usuarioNome: string;
    }
  ) {
    const vinculo = this.vinculos.find((v) => v.empresaId === empresaId && v.funcionarioId === params.funcionarioId);
    if (!vinculo) throw new Error('Vínculo do colaborador não encontrado nesta empresa.');

    const cargoAnt = this.cargos.find((c) => c.id === vinculo.cargoId);
    const cargoNovo = this.cargos.find((c) => c.id === params.novoCargoId);
    const setorAnt = this.setores.find((s) => s.id === vinculo.setorId);
    const setorNovo = this.setores.find((s) => s.id === params.novoSetorId);

    if (!cargoNovo || !setorNovo) throw new Error('Novo cargo ou setor inválido.');

    const salarioAnt = vinculo.salarioBase;

    // Atualiza vínculo
    vinculo.cargoId = cargoNovo.id;
    vinculo.cargoTitulo = cargoNovo.titulo;
    vinculo.setorId = setorNovo.id;
    vinculo.setorNome = setorNovo.nome;
    vinculo.salarioBase = params.novoSalario;
    vinculo.custoHoraIndustrialEstimado = Number(((params.novoSalario * 1.68) / 220).toFixed(2));

    const hist: HistoricoCargoSalario = {
      id: `hc-${Date.now()}`,
      empresaId,
      funcionarioId: params.funcionarioId,
      funcionarioNome: vinculo.funcionarioNome || 'Colaborador',
      cargoAnteriorId: cargoAnt?.id,
      cargoAnteriorTitulo: cargoAnt?.titulo,
      novoCargoId: cargoNovo.id,
      novoCargoTitulo: cargoNovo.titulo,
      salarioAnterior: salarioAnt,
      novoSalario: params.novoSalario,
      setorAnteriorId: setorAnt?.id,
      setorAnteriorNome: setorAnt?.nome,
      novoSetorId: setorNovo.id,
      novoSetorNome: setorNovo.nome,
      dataMudanca: params.dataMudanca,
      motivo: params.motivo,
      justificativa: params.justificativa,
      aprovadoPorNome: params.usuarioNome,
      createdAt: new Date().toISOString(),
    };

    this.historicoCargos.unshift(hist);

    this.registrarAuditoria(
      empresaId,
      params.usuarioId,
      params.usuarioNome,
      'ALTERAR_CARGO_SALARIO',
      'rh_funcionario_empresas',
      vinculo.id,
      params.funcionarioId,
      vinculo.funcionarioNome,
      params.justificativa,
      { cargo: cargoAnt?.titulo, salario: salarioAnt },
      { cargo: cargoNovo.titulo, salario: params.novoSalario }
    );

    return hist;
  }

  getHistoricoCargos(empresaId: string, funcionarioId?: string): HistoricoCargoSalario[] {
    return this.historicoCargos.filter((h) => h.empresaId === empresaId && (!funcionarioId || h.funcionarioId === funcionarioId));
  }

  // ---------------------------------------------------------------------------
  // MATRIZ DE POLIVALÊNCIA & COMPETÊNCIAS (Habilidades 1 a 4)
  // ---------------------------------------------------------------------------
  getCompetencias(): Competencia[] {
    return this.competencias;
  }

  getMatrizPolivalencia(empresaId: string): {
    competencias: Competencia[];
    colaboradores: {
      funcionarioId: string;
      funcionarioNome: string;
      cargoTitulo: string;
      setorNome: string;
      avaliacoes: { [competenciaId: string]: NivelHabilidade };
      mediaGeral: number;
    }[];
  } {
    const vinculosEmpresa = this.vinculos.filter((v) => v.empresaId === empresaId);

    const colaboradores = vinculosEmpresa.map((v) => {
      const avs = this.funcionarioCompetencias.filter((fc) => fc.funcionarioId === v.funcionarioId);
      const avaliacoesMap: { [competenciaId: string]: NivelHabilidade } = {};
      let soma = 0;

      avs.forEach((a) => {
        avaliacoesMap[a.competenciaId] = a.nivel;
        soma += a.nivel;
      });

      const media = avs.length > 0 ? Number((soma / avs.length).toFixed(1)) : 0;

      return {
        funcionarioId: v.funcionarioId,
        funcionarioNome: v.funcionarioNome || 'Colaborador',
        cargoTitulo: v.cargoTitulo || 'Cargo',
        setorNome: v.setorNome || 'Setor',
        avaliacoes: avaliacoesMap,
        mediaGeral: media,
      };
    });

    return {
      competencias: this.competencias,
      colaboradores,
    };
  }

  salvarAvaliacaoCompetencia(
    empresaId: string,
    params: {
      funcionarioId: string;
      competenciaId: string;
      nivel: NivelHabilidade;
      observacoes?: string;
      usuarioId: string;
      usuarioNome: string;
    }
  ) {
    const comp = this.competencias.find((c) => c.id === params.competenciaId);
    const func = this.funcionarios.find((f) => f.id === params.funcionarioId);
    if (!comp || !func) throw new Error('Competência ou Funcionário não encontrado.');

    let fc = this.funcionarioCompetencias.find(
      (item) => item.funcionarioId === params.funcionarioId && item.competenciaId === params.competenciaId
    );

    const nivelAnterior = fc ? fc.nivel : undefined;

    if (fc) {
      fc.nivel = params.nivel;
      fc.dataAvaliacao = new Date().toISOString().substring(0, 10);
      fc.avaliadorNome = params.usuarioNome;
      fc.observacoes = params.observacoes;
    } else {
      fc = {
        id: `fc-${Date.now()}`,
        funcionarioId: params.funcionarioId,
        funcionarioNome: func.nomeCompleto,
        competenciaId: params.competenciaId,
        competenciaCodigo: comp.codigo,
        competenciaNome: comp.nome,
        competenciaCategoria: comp.categoria,
        nivel: params.nivel,
        dataAvaliacao: new Date().toISOString().substring(0, 10),
        avaliadorNome: params.usuarioNome,
        observacoes: params.observacoes,
      };
      this.funcionarioCompetencias.push(fc);
    }

    this.registrarAuditoria(
      empresaId,
      params.usuarioId,
      params.usuarioNome,
      'AVALIAR_COMPETENCIA_POLIVALENCIA',
      'rh_funcionario_competencias',
      fc.id,
      func.id,
      func.nomeCompleto,
      `Competência ${comp.nome} avaliada com Nível ${params.nivel} (1-Aprendiz, 2-Autônomo, 3-Avançado, 4-Especialista).`,
      { nivelAnterior },
      { novoNivel: params.nivel }
    );

    return fc;
  }

  // ---------------------------------------------------------------------------
  // AUTORIZAÇÃO PARA OPERAÇÃO DE MÁQUINAS (NR-12 & Postos Fabris)
  // ---------------------------------------------------------------------------
  getAutorizacoesMaquinas(empresaId: string): FuncionarioMaquina[] {
    return this.funcionarioMaquinas.filter((m) => m.empresaId === empresaId);
  }

  concederAutorizacaoMaquina(
    empresaId: string,
    params: {
      funcionarioId: string;
      maquinaEquipamentoId: string;
      maquinaNome: string;
      nivelAutorizacao: FuncionarioMaquina['nivelAutorizacao'];
      validadeAutorizacao?: string;
      nr12Valida: boolean;
      treinamentoEspecificoConcluido: boolean;
      usuarioId: string;
      usuarioNome: string;
    }
  ): FuncionarioMaquina {
    const func = this.funcionarios.find((f) => f.id === params.funcionarioId);
    if (!func) throw new Error('Funcionário não encontrado.');

    let aut = this.funcionarioMaquinas.find(
      (m) => m.empresaId === empresaId && m.funcionarioId === params.funcionarioId && m.maquinaEquipamentoId === params.maquinaEquipamentoId
    );

    if (aut) {
      aut.nivelAutorizacao = params.nivelAutorizacao;
      aut.validadeAutorizacao = params.validadeAutorizacao;
      aut.nr12Valida = params.nr12Valida;
      aut.treinamentoEspecificoConcluido = params.treinamentoEspecificoConcluido;
      aut.status = 'LIBERADO';
      aut.dataAutorizacao = new Date().toISOString().substring(0, 10);
      aut.autorizadoPorNome = params.usuarioNome;
    } else {
      aut = {
        id: `fm-${Date.now()}`,
        empresaId,
        funcionarioId: params.funcionarioId,
        funcionarioNome: func.nomeCompleto,
        maquinaEquipamentoId: params.maquinaEquipamentoId,
        maquinaNome: params.maquinaNome,
        nivelAutorizacao: params.nivelAutorizacao,
        dataAutorizacao: new Date().toISOString().substring(0, 10),
        validadeAutorizacao: params.validadeAutorizacao,
        nr12Valida: params.nr12Valida,
        treinamentoEspecificoConcluido: params.treinamentoEspecificoConcluido,
        autorizadoPorNome: params.usuarioNome,
        status: 'LIBERADO',
      };
      this.funcionarioMaquinas.push(aut);
    }

    this.registrarAuditoria(
      empresaId,
      params.usuarioId,
      params.usuarioNome,
      'CONCEDER_AUTORIZACAO_MAQUINA',
      'rh_funcionario_maquinas',
      aut.id,
      func.id,
      func.nomeCompleto,
      `Autorização concedida para operação de ${params.maquinaNome} com nível ${params.nivelAutorizacao}.`
    );

    return aut;
  }

  bloquearOperadorMaquina(
    empresaId: string,
    autorizacaoId: string,
    motivoBloqueio: string,
    usuarioId: string,
    usuarioNome: string
  ) {
    const aut = this.funcionarioMaquinas.find((m) => m.id === autorizacaoId && m.empresaId === empresaId);
    if (!aut) throw new Error('Autorização de máquina não encontrada.');

    aut.status = 'REVOGADO';
    aut.motivoBloqueioRevogacao = motivoBloqueio;

    this.registrarAuditoria(
      empresaId,
      usuarioId,
      usuarioNome,
      'BLOQUEAR_OPERADOR_MAQUINA',
      'rh_funcionario_maquinas',
      aut.id,
      aut.funcionarioId,
      aut.funcionarioNome,
      `Bloqueio de segurança aplicado na máquina ${aut.maquinaNome}: ${motivoBloqueio}.`
    );

    return aut;
  }

  // ---------------------------------------------------------------------------
  // GESTÃO DE TREINAMENTOS & NRs (Controle de Validade)
  // ---------------------------------------------------------------------------
  getTreinamentosCatalogo(): Treinamento[] {
    return this.treinamentos;
  }

  getTreinamentosColaboradores(empresaId: string): FuncionarioTreinamento[] {
    return this.funcionarioTreinamentos.filter((t) => t.empresaId === empresaId);
  }

  registrarConclusaoTreinamento(
    empresaId: string,
    params: {
      funcionarioId: string;
      treinamentoId: string;
      dataRealizacao: string;
      dataVencimento?: string;
      entidadeInstrutor: string;
      cargaHorariaCumprida: number;
      notaAproveitamento?: number;
      custoTreinamento?: number;
      observacoes?: string;
      usuarioId: string;
      usuarioNome: string;
    }
  ): FuncionarioTreinamento {
    const func = this.funcionarios.find((f) => f.id === params.funcionarioId);
    const trein = this.treinamentos.find((t) => t.id === params.treinamentoId);
    if (!func || !trein) throw new Error('Funcionário ou Treinamento não encontrado.');

    let dataVenc = params.dataVencimento;
    if (!dataVenc && trein.periodicidadeReciclagemMeses > 0) {
      const d = new Date(params.dataRealizacao);
      d.setMonth(d.getMonth() + trein.periodicidadeReciclagemMeses);
      dataVenc = d.toISOString().substring(0, 10);
    }

    const ft: FuncionarioTreinamento = {
      id: `ft-${Date.now()}`,
      empresaId,
      funcionarioId: func.id,
      funcionarioNome: func.nomeCompleto,
      treinamentoId: trein.id,
      treinamentoTitulo: trein.titulo,
      normaRegulamentadora: trein.normaRegulamentadora,
      dataRealizacao: params.dataRealizacao,
      dataVencimento: dataVenc,
      diasAteVencimento: dataVenc ? Math.ceil((new Date(dataVenc).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 365,
      entidadeInstrutor: params.entidadeInstrutor,
      cargaHorariaCumprida: params.cargaHorariaCumprida,
      notaAproveitamento: params.notaAproveitamento,
      frequenciaPerc: 100,
      status: 'VALIDO',
      custoTreinamento: params.custoTreinamento || 0,
      observacoes: params.observacoes,
    };

    this.funcionarioTreinamentos.unshift(ft);

    this.registrarAuditoria(
      empresaId,
      params.usuarioId,
      params.usuarioNome,
      'REGISTRAR_TREINAMENTO_NR',
      'rh_funcionario_treinamentos',
      ft.id,
      func.id,
      func.nomeCompleto,
      `Conclusão do treinamento ${trein.titulo} com validade até ${dataVenc || 'Indeterminada'}.`
    );

    return ft;
  }

  // ---------------------------------------------------------------------------
  // DOCUMENTOS & ASOS OCUPACIONAIS
  // ---------------------------------------------------------------------------
  getDocumentos(empresaId: string): DocumentoFuncionario[] {
    return this.documentos.filter((d) => d.empresaId === empresaId);
  }

  registrarDocumento(
    empresaId: string,
    params: {
      funcionarioId: string;
      tipoDocumento: DocumentoFuncionario['tipoDocumento'];
      numeroDocumento?: string;
      dataEmissao: string;
      dataValidade?: string;
      medicoCrmEmissor?: string;
      clinicaEmissora?: string;
      statusAptidao: DocumentoFuncionario['statusAptidao'];
      observacoes?: string;
      usuarioId: string;
      usuarioNome: string;
    }
  ): DocumentoFuncionario {
    const func = this.funcionarios.find((f) => f.id === params.funcionarioId);
    if (!func) throw new Error('Funcionário não encontrado.');

    let statusVal: StatusValidadeDocumento = 'VALIDO';
    let diasAte = 365;

    if (params.dataValidade) {
      diasAte = Math.ceil((new Date(params.dataValidade).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (diasAte < 0) statusVal = 'VENCIDO';
      else if (diasAte <= 30) statusVal = 'VENCENDO';
    } else {
      statusVal = 'PERMANENTE';
    }

    const doc: DocumentoFuncionario = {
      id: `doc-${Date.now()}`,
      empresaId,
      funcionarioId: func.id,
      funcionarioNome: func.nomeCompleto,
      tipoDocumento: params.tipoDocumento,
      numeroDocumento: params.numeroDocumento,
      dataEmissao: params.dataEmissao,
      dataValidade: params.dataValidade,
      diasAteVencimento: diasAte,
      medicoCrmEmissor: params.medicoCrmEmissor,
      clinicaEmissora: params.clinicaEmissora,
      statusAptidao: params.statusAptidao,
      statusValidade: statusVal,
      observacoes: params.observacoes,
    };

    this.documentos.unshift(doc);

    this.registrarAuditoria(
      empresaId,
      params.usuarioId,
      params.usuarioNome,
      'REGISTRAR_DOCUMENTO_ASO',
      'rh_documentos_funcionarios',
      doc.id,
      func.id,
      func.nomeCompleto,
      `Registro de ${params.tipoDocumento} com parecer ${params.statusAptidao} e validade ${params.dataValidade || 'Permanente'}.`
    );

    return doc;
  }

  // ---------------------------------------------------------------------------
  // CONTROLE DE EPIS (CA, Termos & Alertas)
  // ---------------------------------------------------------------------------
  getEpisCatalogo(): Epi[] {
    return this.epis;
  }

  getEntregasEpi(empresaId: string): EntregaEpi[] {
    return this.entregasEpi.filter((e) => e.empresaId === empresaId);
  }

  entregarEpi(
    empresaId: string,
    params: {
      funcionarioId: string;
      epiId: string;
      quantidade: number;
      tamanho?: string;
      dataEntrega: string;
      motivoEntrega: EntregaEpi['motivoEntrega'];
      observacoes?: string;
      usuarioId: string;
      usuarioNome: string;
    }
  ): EntregaEpi {
    const func = this.funcionarios.find((f) => f.id === params.funcionarioId);
    const epi = this.epis.find((e) => e.id === params.epiId);
    if (!func || !epi) throw new Error('Funcionário ou EPI não encontrado.');

    if (epi.estoqueAtual < params.quantidade) {
      throw new Error(`Estoque insuficiente do EPI ${epi.nome}. Disponível: ${epi.estoqueAtual}, Solicitado: ${params.quantidade}.`);
    }

    // Baixa estoque do EPI
    epi.estoqueAtual -= params.quantidade;

    const dataPrev = new Date(params.dataEntrega);
    dataPrev.setDate(dataPrev.getDate() + epi.durabilidadeEstimadaDias);
    const dataPrevisaoTroca = dataPrev.toISOString().substring(0, 10);

    const hashTermo = `SHA256:${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`;

    const entrega: EntregaEpi = {
      id: `eepi-${Date.now()}`,
      empresaId,
      funcionarioId: func.id,
      funcionarioNome: func.nomeCompleto,
      epiId: epi.id,
      epiNome: epi.nome,
      numeroCa: epi.numeroCa,
      quantidade: params.quantidade,
      tamanho: params.tamanho,
      dataEntrega: params.dataEntrega,
      dataPrevisaoTroca,
      diasAteTroca: epi.durabilidadeEstimadaDias,
      motivoEntrega: params.motivoEntrega,
      termoAssinadoDigital: true,
      autenticacaoTermoHash: hashTermo,
      entreguePorNome: params.usuarioNome,
      statusDevolucao: 'EM_USO',
      observacoes: params.observacoes,
    };

    this.entregasEpi.unshift(entrega);

    this.registrarAuditoria(
      empresaId,
      params.usuarioId,
      params.usuarioNome,
      'ENTREGAR_EPI_TERMO_ASSINADO',
      'rh_entregas_epi',
      entrega.id,
      func.id,
      func.nomeCompleto,
      `Entrega de ${params.quantidade}x ${epi.nome} (CA: ${epi.numeroCa}) com assinatura digital e previsão de troca em ${dataPrevisaoTroca}.`
    );

    return entrega;
  }

  // ---------------------------------------------------------------------------
  // APONTAMENTO DE HORAS PARA CUSTEIO INDUSTRIAL
  // ---------------------------------------------------------------------------
  getApontamentosHoras(empresaId: string): ApontamentoHoras[] {
    return this.apontamentosHoras.filter((a) => a.empresaId === empresaId);
  }

  registrarApontamentoHoras(
    empresaId: string,
    params: {
      funcionarioId: string;
      dataApontamento: string;
      tipoHora: TipoHoraApontamento;
      quantidadeHoras: number;
      ordemProducaoId?: string;
      operacaoId?: string;
      maquinaId?: string;
      justificativaObservacoes?: string;
      usuarioId: string;
      usuarioNome: string;
    }
  ): ApontamentoHoras {
    const vinculo = this.vinculos.find((v) => v.empresaId === empresaId && v.funcionarioId === params.funcionarioId);
    if (!vinculo) throw new Error('Vínculo do colaborador não encontrado nesta empresa.');

    let multiplicador = 1.0;
    if (params.tipoHora === 'EXTRA_50') multiplicador = 1.5;
    if (params.tipoHora === 'EXTRA_100') multiplicador = 2.0;

    const custoHora = Number((vinculo.custoHoraIndustrialEstimado * multiplicador).toFixed(2));
    const custoTotal = Number((custoHora * params.quantidadeHoras).toFixed(2));

    const apontamento: ApontamentoHoras = {
      id: `ap-${Date.now()}`,
      empresaId,
      funcionarioId: vinculo.funcionarioId,
      funcionarioNome: vinculo.funcionarioNome || 'Colaborador',
      matricula: vinculo.matricula,
      setorNome: vinculo.setorNome || 'Setor',
      dataApontamento: params.dataApontamento,
      tipoHora: params.tipoHora,
      quantidadeHoras: params.quantidadeHoras,
      custoHoraAplicado: custoHora,
      custoTotalCalculado: custoTotal,
      ordemProducaoId: params.ordemProducaoId,
      operacaoId: params.operacaoId,
      maquinaId: params.maquinaId,
      statusAprovacao: 'APROVADO_LIDER',
      aprovadorNome: params.usuarioNome,
      justificativaObservacoes: params.justificativaObservacoes,
    };

    this.apontamentosHoras.unshift(apontamento);

    this.registrarAuditoria(
      empresaId,
      params.usuarioId,
      params.usuarioNome,
      'APONTAR_HORAS_CUSTO_INDUSTRIAL',
      'rh_apontamentos_horas',
      apontamento.id,
      vinculo.funcionarioId,
      vinculo.funcionarioNome,
      `Apontamento de ${params.quantidadeHoras}h (${params.tipoHora}) com custo fabril R$ ${custoTotal.toFixed(2)} para OP ${params.ordemProducaoId || 'Geral'}.`
    );

    return apontamento;
  }

  // ---------------------------------------------------------------------------
  // RECRUTAMENTO, VAGAS & CANDIDATOS
  // ---------------------------------------------------------------------------
  getVagas(empresaId: string): Vaga[] {
    return this.vagas.filter((v) => v.empresaId === empresaId);
  }

  getCandidatos(empresaId: string, vagaId?: string): Candidato[] {
    return this.candidatos.filter((c) => c.empresaId === empresaId && (!vagaId || c.vagaId === vagaId));
  }

  avancarEtapaCandidato(
    empresaId: string,
    candidatoId: string,
    novaEtapa: Candidato['etapaFunil'],
    parecer: string,
    usuarioId: string,
    usuarioNome: string
  ) {
    const cand = this.candidatos.find((c) => c.id === candidatoId && c.empresaId === empresaId);
    if (!cand) throw new Error('Candidato não encontrado.');

    cand.etapaFunil = novaEtapa;
    cand.parecerEntrevistador = parecer;

    this.registrarAuditoria(
      empresaId,
      usuarioId,
      usuarioNome,
      'AVANCAR_ETAPA_CANDIDATO',
      'rh_candidatos',
      cand.id,
      undefined,
      cand.nomeCompleto,
      `Candidato avançou para a etapa ${novaEtapa}: ${parecer}`
    );

    return cand;
  }

  // ---------------------------------------------------------------------------
  // ONBOARDING & DESLIGAMENTO ESTRUTURADOS
  // ---------------------------------------------------------------------------
  getOnboardings(empresaId: string): Onboarding[] {
    return this.onboardings.filter((o) => o.empresaId === empresaId);
  }

  iniciarOnboarding(
    empresaId: string,
    funcionarioId: string,
    funcionarioNome: string,
    cargoTitulo: string,
    setorNome: string,
    responsavelNome: string
  ): Onboarding {
    const onb: Onboarding = {
      id: `onb-${Date.now()}`,
      empresaId,
      funcionarioId,
      funcionarioNome,
      cargoTitulo,
      setorNome,
      dataInicio: new Date().toISOString().substring(0, 10),
      previsaoConclusao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      status: 'EM_ANDAMENTO',
      progressoPercentual: 20,
      responsavelRhNome: responsavelNome,
      checklistItens: [
        { id: '1', item: 'Recebimento de Documentos e Ficha Cadastral', categoria: 'DOCUMENTAL', concluido: true, dataConclusao: new Date().toISOString().substring(0, 10), responsavel: responsavelNome },
        { id: '2', item: 'Exame ASO Admissional Apto', categoria: 'SAUDE', concluido: false, responsavel: 'MedTrab' },
        { id: '3', item: 'Entrega de EPIs Obrigatórios e Termo Assinado', categoria: 'SEGURANCA', concluido: false, responsavel: 'SESMT' },
        { id: '4', item: 'Treinamento de Integração Geral e NR-06/NR-12', categoria: 'TREINAMENTO', concluido: false, responsavel: 'Engenharia de Segurança' },
        { id: '5', item: 'Liberação de Crachá, Catraca e Acesso ao ERP Chão de Fábrica', categoria: 'TI_ACESSO', concluido: false, responsavel: 'TI Suporte' },
        { id: '6', item: 'Acompanhamento do Padrinho Fabril (Avaliação 30 dias)', categoria: 'ACOLHIMENTO', concluido: false, responsavel: 'Líder do Setor' },
      ],
    };

    this.onboardings.unshift(onb);
    return onb;
  }

  concluirItemOnboarding(
    empresaId: string,
    onboardingId: string,
    itemId: string,
    usuarioId: string,
    usuarioNome: string
  ) {
    const onb = this.onboardings.find((o) => o.id === onboardingId && o.empresaId === empresaId);
    if (!onb) throw new Error('Processo de Onboarding não encontrado.');

    const item = onb.checklistItens.find((i) => i.id === itemId);
    if (!item) throw new Error('Item do checklist não encontrado.');

    item.concluido = true;
    item.dataConclusao = new Date().toISOString().substring(0, 10);
    item.responsavel = usuarioNome;

    const concluidos = onb.checklistItens.filter((i) => i.concluido).length;
    onb.progressoPercentual = Math.round((concluidos / onb.checklistItens.length) * 100);

    if (onb.progressoPercentual === 100) {
      onb.status = 'CONCLUIDO';
      onb.dataConclusao = new Date().toISOString();
    }

    this.registrarAuditoria(
      empresaId,
      usuarioId,
      usuarioNome,
      'CONCLUIR_ITEM_ONBOARDING',
      'rh_onboarding',
      onb.id,
      onb.funcionarioId,
      onb.funcionarioNome,
      `Conclusão da etapa: ${item.item} (${onb.progressoPercentual}% concluído).`
    );

    return onb;
  }

  getDesligamentos(empresaId: string): Desligamento[] {
    return this.desligamentos.filter((d) => d.empresaId === empresaId);
  }

  iniciarDesligamento(
    empresaId: string,
    params: {
      funcionarioId: string;
      tipoRescisao: TipoRescisao;
      dataComunicacao: string;
      dataDesligamentoEfetivo: string;
      cumpriuAvisoPrevio: boolean;
      tipoAvisoPrevio: 'TRABALHADO' | 'INDENIZADO' | 'DISPENSADO';
      observacoes?: string;
      usuarioId: string;
      usuarioNome: string;
    }
  ): Desligamento {
    const vinculo = this.vinculos.find((v) => v.empresaId === empresaId && v.funcionarioId === params.funcionarioId);
    if (!vinculo) throw new Error('Vínculo do colaborador não encontrado.');

    vinculo.status = 'EM_AVISO_PREVIO';

    const desl: Desligamento = {
      id: `desl-${Date.now()}`,
      empresaId,
      funcionarioId: vinculo.funcionarioId,
      funcionarioNome: vinculo.funcionarioNome || 'Colaborador',
      matricula: vinculo.matricula,
      cargoTitulo: vinculo.cargoTitulo || 'Cargo',
      setorNome: vinculo.setorNome || 'Setor',
      tipoRescisao: params.tipoRescisao,
      dataComunicacao: params.dataComunicacao,
      dataDesligamentoEfetivo: params.dataDesligamentoEfetivo,
      cumpriuAvisoPrevio: params.cumpriuAvisoPrevio,
      tipoAvisoPrevio: params.tipoAvisoPrevio,
      progressoPercentual: 0,
      status: 'EM_ANDAMENTO',
      responsavelRhNome: params.usuarioNome,
      exportadoSistemaFolha: false,
      checklistItens: [
        { id: '1', item: 'Exame Médico ASO Demissional', categoria: 'SAUDE', concluido: false, responsavel: 'MedTrab' },
        { id: '2', item: 'Devolução e Baixa de EPIs e Ferramentas Cauteladas', categoria: 'PATRIMONIO_EPI', concluido: false, responsavel: 'Almoxarifado' },
        { id: '3', item: 'Revogação de Acessos a Máquinas e ERP (Lockout/Tagout)', categoria: 'SEGURANCA_TI', concluido: false, responsavel: 'TI Segurança' },
        { id: '4', item: 'Entrevista de Desligamento e Pesquisa de Clima', categoria: 'RH_PESSOAS', concluido: false, responsavel: params.usuarioNome },
        { id: '5', item: 'Exportação do Pacote Rescisório para Sistema Especializado de Folha', categoria: 'INTEGRACAO_FOLHA', concluido: false, responsavel: 'Folha Pagamento' },
      ],
      observacoes: params.observacoes,
    };

    this.desligamentos.unshift(desl);

    this.registrarAuditoria(
      empresaId,
      params.usuarioId,
      params.usuarioNome,
      'INICIAR_DESLIGAMENTO',
      'rh_desligamento',
      desl.id,
      vinculo.funcionarioId,
      vinculo.funcionarioNome,
      `Iniciado processo de rescisão (${params.tipoRescisao}) para ${vinculo.funcionarioNome}.`
    );

    return desl;
  }

  concluirItemDesligamento(
    empresaId: string,
    desligamentoId: string,
    itemId: string,
    usuarioId: string,
    usuarioNome: string
  ) {
    const desl = this.desligamentos.find((d) => d.id === desligamentoId && d.empresaId === empresaId);
    if (!desl) throw new Error('Processo de Desligamento não encontrado.');

    const item = desl.checklistItens.find((i) => i.id === itemId);
    if (!item) throw new Error('Item de checklist não encontrado.');

    item.concluido = true;
    item.dataConclusao = new Date().toISOString().substring(0, 10);
    item.responsavel = usuarioNome;

    const concluidos = desl.checklistItens.filter((i) => i.concluido).length;
    desl.progressoPercentual = Math.round((concluidos / desl.checklistItens.length) * 100);

    if (desl.progressoPercentual === 100) {
      desl.status = 'CONCLUIDO';
      desl.dataConclusao = new Date().toISOString();

      // Atualiza status do vínculo para DESLIGADO (não-destrutivo)
      const vinc = this.vinculos.find((v) => v.empresaId === empresaId && v.funcionarioId === desl.funcionarioId);
      if (vinc) {
        vinc.status = 'DESLIGADO';
        vinc.dataDemissao = desl.dataDesligamentoEfetivo;
      }
    }

    this.registrarAuditoria(
      empresaId,
      usuarioId,
      usuarioNome,
      'CONCLUIR_ITEM_DESLIGAMENTO',
      'rh_desligamento',
      desl.id,
      desl.funcionarioId,
      desl.funcionarioNome,
      `Conclusão da etapa demissional: ${item.item} (${desl.progressoPercentual}% concluído).`
    );

    return desl;
  }

  // ---------------------------------------------------------------------------
  // INTEGRAÇÃO DESACOPLADA COM SISTEMAS EXTERNOS (Folha & Ponto)
  // ---------------------------------------------------------------------------
  async exportarLoteParaFolhaExterna(
    empresaId: string,
    tipoLote: 'ADMISSOES' | 'RESCISOES' | 'HORAS_CUSTOS',
    usuarioId: string,
    usuarioNome: string
  ): Promise<ResultadoIntegracaoExterna> {
    const emp = EMPRESAS_GRUPO.find((e) => e.id === empresaId);
    const cnpj = emp?.cnpj || '00.000.000/0001-00';

    let res: ResultadoIntegracaoExterna;

    if (tipoLote === 'ADMISSOES') {
      const colaboradores = this.getColaboradores(empresaId);
      res = await rhExternalAdapter.exportarAdmissoes(empresaId, cnpj, colaboradores);
    } else if (tipoLote === 'RESCISOES') {
      const rescisoes = this.getDesligamentos(empresaId);
      res = await rhExternalAdapter.exportarRescisoes(empresaId, cnpj, rescisoes);
      rescisoes.forEach((r) => {
        r.exportadoSistemaFolha = true;
        r.protocoloExportacaoFolha = res.protocoloTransmissao;
      });
    } else {
      const apontamentos = this.getApontamentosHoras(empresaId);
      res = await rhExternalAdapter.exportarApontamentosHorasParaCustoEFolha(empresaId, cnpj, apontamentos);
    }

    this.registrarAuditoria(
      empresaId,
      usuarioId,
      usuarioNome,
      'EXPORTAR_LOTE_SISTEMA_FOLHA_EXTERNO',
      'rh_integracoes_externas',
      res.protocoloTransmissao,
      undefined,
      undefined,
      `Exportado lote de ${tipoLote} para sistema de folha externo com protocolo ${res.protocoloTransmissao}.`,
      undefined,
      res
    );

    return res;
  }

  async importarPontoPortaria671(
    empresaId: string,
    periodoInicio: string,
    periodoFim: string,
    usuarioId: string,
    usuarioNome: string
  ): Promise<ResultadoIntegracaoExterna> {
    const emp = EMPRESAS_GRUPO.find((e) => e.id === empresaId);
    const cnpj = emp?.cnpj || '00.000.000/0001-00';

    const res = await rhExternalAdapter.importarMarcacoesPonto(empresaId, cnpj, periodoInicio, periodoFim);

    this.registrarAuditoria(
      empresaId,
      usuarioId,
      usuarioNome,
      'IMPORTAR_PONTO_EXTERNO_REP',
      'rh_integracoes_externas',
      res.protocoloTransmissao,
      undefined,
      undefined,
      `Importadas marcações de ponto do período ${periodoInicio} a ${periodoFim}. Protocolo: ${res.protocoloTransmissao}.`
    );

    return res;
  }

  // ---------------------------------------------------------------------------
  // AUDITORIA LOGS
  // ---------------------------------------------------------------------------
  getAuditoriaLogs(empresaId: string): RhAuditoriaLog[] {
    return this.auditoriaLogs.filter((l) => l.empresaId === empresaId);
  }

  getCargos(): Cargo[] {
    return this.cargos;
  }

  getSetores(empresaId: string): Setor[] {
    return this.setores.filter((s) => s.empresaId === empresaId);
  }

  getTurnos(empresaId: string): Turno[] {
    return this.turnos.filter((t) => t.empresaId === empresaId);
  }
}

export const rhOperacionalService = new RhOperacionalService();
