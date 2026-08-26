/**
 * backend/modules/rh/rh-types.ts
 * NEXUS ERP (Grupo TRITECH - 5 CNPJs)
 * MÓDULO: RH OPERACIONAL & GESTÃO DO TRABALHO INDUSTRIAL
 * 
 * Regras de Arquitetura:
 * 1. Isolamento Multiempresa rigoroso por empresa_id.
 * 2. Dados Mestres de Colaboradores e Cargos com vínculos isolados por empresa.
 * 3. Habilidades por nível (Matriz de Polivalência 1 a 4).
 * 4. Autorizações para Operação de Máquinas Fabris (NR-12, Segurança).
 * 5. Validade de Treinamentos (NRs, reciclagem e certificados).
 * 6. Controle de EPIs (CA, termo assinado e alertas de troca).
 * 7. Documentos e ASOs com status de aptidão e validade.
 * 8. Onboarding e Desligamento estruturados com checklists.
 * 9. Apontamento de Horas para Custo Industrial.
 * 10. Desacoplamento para integração futura com sistemas especializados de Folha/Ponto (Adapter Pattern).
 */

export type TipoContratoTrabalho = 
  | 'CLT_INDETERMINADO' 
  | 'CLT_DETERMINADO' 
  | 'PJ' 
  | 'ESTAGIO' 
  | 'APRENDIZ' 
  | 'TEMPORARIO';

export type StatusFuncionarioEmpresa = 
  | 'ATIVO' 
  | 'FERIAS' 
  | 'AFASTADO_INSS' 
  | 'LICENCA_MATERNIDADE' 
  | 'EM_AVISO_PREVIO' 
  | 'DESLIGADO';

export type GrauInsalubridade = 'NENHUM' | 'MINIMO_10' | 'MEDIO_20' | 'MAXIMO_40';

export type NivelCargo = 
  | 'OPERACIONAL_INICIAL' 
  | 'OPERACIONAL_PLENO' 
  | 'OPERACIONAL_SENIOR' 
  | 'LIDER_FABRIL' 
  | 'TECNICO_ESPECIALISTA' 
  | 'ANALISTA' 
  | 'SUPERVISOR' 
  | 'GERENTE' 
  | 'DIRETOR';

export type TipoSetor = 
  | 'PRODUCAO_FABRIL' 
  | 'MANUTENCAO' 
  | 'QUALIDADE_METROLOGIA' 
  | 'ENGENHARIA_PCP' 
  | 'ALMOXARIFADO_ESTOQUE' 
  | 'EXPEDICAO_LOGISTICA' 
  | 'ADMINISTRATIVO_FINANCEIRO' 
  | 'COMERCIAL_VENDAS' 
  | 'DIRETORIA_EXECUTIVA';

export type CategoriaCompetencia = 
  | 'OPERACIONAL_FABRIL' 
  | 'SOLDA_CALDEIRARIA' 
  | 'CORTE_USINAGEM_CNC' 
  | 'METROLOGIA_QUALIDADE' 
  | 'SEGURANCA_NR' 
  | 'MANUTENCAO_PREVENTIVA' 
  | 'LOGISTICA_MOVIMENTACAO' 
  | 'SOFT_SKILL_LIDERANCA';

export type NivelHabilidade = 1 | 2 | 3 | 4; 
// 1: Aprendiz/Básico (opera com apoio)
// 2: Autônomo/Intermediário (opera sem apoio)
// 3: Avançado/Multiplicador (domina setup e instrui colegas)
// 4: Especialista/Auditor (domina programação, otimização e homologação)

export type NivelAutorizacaoMaquina = 
  | 'OPERADOR_PLENO' 
  | 'OPERADOR_SOB_SUPERVISAO' 
  | 'PREPARADOR_SETUP' 
  | 'MANUTENTOR_AUTORIZADO' 
  | 'BLOQUEADO_RESTRITO';

export type StatusAutorizacaoMaquina = 'LIBERADO' | 'SUSPENSO' | 'VENCIDO' | 'REVOGADO';

export type TipoTreinamento = 
  | 'NORMA_REGULAMENTADORA_NR' 
  | 'TECNICO_OPERACIONAL' 
  | 'QUALIDADE_ISO9001' 
  | 'SEGURANCA_MEIO_AMBIENTE' 
  | 'INTEGRACAO_INSTITUCIONAL' 
  | 'DESENVOLVIMENTO_LIDERANCA';

export type StatusValidadeTreinamento = 
  | 'VALIDO' 
  | 'VENCENDO_30_DIAS' 
  | 'VENCIDO' 
  | 'RECICLAGEM_AGENDADA' 
  | 'CANCELADO';

export type TipoDocumentoFuncionario = 
  | 'ASO_ADMISSIONAL' 
  | 'ASO_PERIODICO' 
  | 'ASO_RETORNO_TRABALHO' 
  | 'ASO_MUDANCA_RISCO' 
  | 'ASO_DEMISSIONAL' 
  | 'CNH_MOTORISTA_OPERADOR' 
  | 'CARTEIRA_VACINACAO' 
  | 'CERTIFICADO_TECNICO' 
  | 'FICHA_REGISTRO_CTPS' 
  | 'TERMO_CONFIDENCIALIDADE_LGPD' 
  | 'COMPROVANTE_RESIDENCIA' 
  | 'CONTRATO_TRABALHO';

export type StatusAptidaoExame = 'APTO' | 'APTO_COM_RESTRICAO' | 'INAPTO' | 'NAO_APLICAVEL';

export type StatusValidadeDocumento = 'VALIDO' | 'VENCENDO' | 'VENCIDO' | 'PERMANENTE';

export type TipoProtecaoEPI = 
  | 'AUDITIVA_AURICULAR' 
  | 'RESPIRATORIA_MASCARA' 
  | 'VISUAL_FACIAL_OCULOS' 
  | 'CABECA_CAPACETE' 
  | 'MAOS_BRACOS_LUVAS' 
  | 'PES_PERNAS_BOTINAS' 
  | 'ALTURA_CINTO_TALABARTE' 
  | 'CORPO_INTEIRO_AVENTAL_RASPA';

export type StatusDevolucaoEPI = 'EM_USO' | 'SUBSTITUIDO' | 'DEVOLVIDO_DESLIGAMENTO' | 'DESCARTADO';

export type MotivoEntregaEPI = 'ADMISSAO_INTEGRACAO' | 'SUBSTITUICAO_DESGASTE' | 'EXTRAVIO_DANO' | 'MUDANCA_POSTO_RISCO';

export type TipoJornadaTurno = 'COMERCIAL' | 'TURNO_1_MANHA' | 'TURNO_2_TARDE' | 'TURNO_3_NOTURNO' | 'ESCALA_12X36';

export type TipoHoraApontamento = 
  | 'NORMAL_PRODUTIVA' 
  | 'EXTRA_50' 
  | 'EXTRA_100' 
  | 'BANCO_HORAS' 
  | 'PARADA_IMPRODUTIVA' 
  | 'TREINAMENTO_NR' 
  | 'AUSENCIA_JUSTIFICADA' 
  | 'FALTA_NAO_JUSTIFICADA';

export type StatusAprovacaoHora = 'PENDENTE' | 'APROVADO_LIDER' | 'REJEITADO' | 'CONCILIADO_CUSTO_INDUSTRIAL';

export type StatusVaga = 'ABERTA' | 'EM_TRIAGEM' | 'ENTREVISTAS' | 'FINALISTA' | 'PREENCHIDA' | 'CANCELADA';

export type EtapaFunilCandidato = 
  | 'INSCRITO' 
  | 'TRIAGEM' 
  | 'ENTREVISTA_RH' 
  | 'TESTE_PRATICO_FABRIL' 
  | 'EXAME_ASO_ADMISSAO' 
  | 'APROVADO_CONTRATADO' 
  | 'REPROVADO' 
  | 'BANCO_TALENTOS';

export type StatusOnboarding = 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ATRASADO' | 'CANCELADO';

export type TipoRescisao = 
  | 'DISPENSA_SEM_JUSTA_CAUSA' 
  | 'DISPENSA_COM_JUSTA_CAUSA' 
  | 'PEDIDO_DEMISSAO_FUNCIONARIO' 
  | 'TERMINO_CONTRATO_EXPERIENCIA' 
  | 'ACORDO_MUTUO_ART484A';

export type StatusDesligamento = 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

// -----------------------------------------------------------------------------
// INTERFACES PRINCIPAIS DO RH OPERACIONAL
// -----------------------------------------------------------------------------

export interface Cbo {
  id: string;
  codigo: string;
  titulo: string;
  grandeGrupo?: string;
  ativo: boolean;
}

export interface Setor {
  id: string;
  empresaId: string;
  codigo: string;
  nome: string;
  tipo: TipoSetor;
  centroCustoCodigo?: string;
  responsavelFuncionarioId?: string;
  responsavelNome?: string;
  corIdentificacao: string;
  ativo: boolean;
}

export interface Cargo {
  id: string;
  cboId?: string;
  codigoCbo?: string;
  tituloCbo?: string;
  codigo: string;
  titulo: string;
  nivel: NivelCargo;
  descricaoSumaria: string;
  requisitosMinimos: string;
  pisoSalarial: number;
  tetoSalarial: number;
  ativo: boolean;
}

export interface Funcionario {
  id: string;
  cpf: string;
  rg?: string;
  rgOrgaoEmissor?: string;
  nomeCompleto: string;
  nomeSocial?: string;
  dataNascimento: string;
  sexo: 'MASCULINO' | 'FEMININO' | 'OUTRO' | 'NAO_INFORMADO';
  estadoCivil: 'SOLTEIRO' | 'CASADO' | 'UNIAO_ESTAVEL' | 'DIVORCIADO' | 'VIUVO';
  nomeMae?: string;
  pisPasep?: string;
  ctpsNumero?: string;
  ctpsSerie?: string;
  escolaridade?: string;
  emailPessoal?: string;
  emailCorporativo?: string;
  telefoneCelular: string;
  telefoneEmergencia?: string;
  contatoEmergenciaNome?: string;
  enderecoLogradouro?: string;
  enderecoNumero?: string;
  enderecoBairro?: string;
  enderecoCidade?: string;
  enderecoUf?: string;
  enderecoCep?: string;
  pcd: boolean;
  pcdDetalhes?: string;
  avatarUrl?: string;
  statusGeral: 'ATIVO' | 'INATIVO' | 'AFASTADO' | 'BLOQUEADO';
  
  // Vínculos com as empresas do grupo TRITECH
  vinculosEmpresas?: FuncionarioEmpresa[];
}

export interface FuncionarioEmpresa {
  id: string;
  empresaId: string;
  funcionarioId: string;
  funcionarioNome?: string;
  funcionarioCpf?: string;
  matricula: string;
  cargoId: string;
  cargoTitulo?: string;
  setorId: string;
  setorNome?: string;
  turnoId?: string;
  turnoNome?: string;
  tipoContrato: TipoContratoTrabalho;
  dataAdmissao: string;
  dataDemissao?: string;
  salarioBase: number;
  adicionalPericulosidadePerc: number;
  adicionalInsalubridadeGrau: GrauInsalubridade;
  custoHoraIndustrialEstimado: number;
  status: StatusFuncionarioEmpresa;
  regimeJornada: 'MENSALISTA_220H' | 'MENSALISTA_180H' | 'HORISTA' | 'ESCALA_12X36';
  gestorDiretoFuncionarioId?: string;
  gestorNome?: string;
  observacoes?: string;
}

export interface HistoricoCargoSalario {
  id: string;
  empresaId: string;
  funcionarioId: string;
  funcionarioNome: string;
  cargoAnteriorId?: string;
  cargoAnteriorTitulo?: string;
  novoCargoId: string;
  novoCargoTitulo: string;
  salarioAnterior?: number;
  novoSalario: number;
  setorAnteriorId?: string;
  setorAnteriorNome?: string;
  novoSetorId: string;
  novoSetorNome: string;
  dataMudanca: string;
  motivo: 'ADMISSAO' | 'PROMOCAO_MERITO' | 'ENQUADRAMENTO_CCT_DISSIDIO' | 'TRANSFERENCIA_SETOR' | 'REESTRUTURACAO' | 'AJUSTE_MERCADO';
  justificativa?: string;
  aprovadoPorNome?: string;
  createdAt: string;
}

export interface Competencia {
  id: string;
  codigo: string;
  nome: string;
  categoria: CategoriaCompetencia;
  descricao: string;
  ativo: boolean;
}

export interface FuncionarioCompetencia {
  id: string;
  funcionarioId: string;
  funcionarioNome?: string;
  competenciaId: string;
  competenciaCodigo?: string;
  competenciaNome?: string;
  competenciaCategoria?: CategoriaCompetencia;
  nivel: NivelHabilidade;
  dataAvaliacao: string;
  avaliadorNome?: string;
  observacoes?: string;
}

export interface FuncionarioMaquina {
  id: string;
  empresaId: string;
  funcionarioId: string;
  funcionarioNome: string;
  maquinaEquipamentoId: string;
  maquinaNome: string;
  nivelAutorizacao: NivelAutorizacaoMaquina;
  dataAutorizacao: string;
  validadeAutorizacao?: string;
  nr12Valida: boolean;
  treinamentoEspecificoConcluido: boolean;
  autorizadoPorNome: string;
  status: StatusAutorizacaoMaquina;
  motivoBloqueioRevogacao?: string;
}

export interface Treinamento {
  id: string;
  codigo: string;
  titulo: string;
  tipo: TipoTreinamento;
  normaRegulamentadora?: string;
  cargaHorariaHoras: number;
  periodicidadeReciclagemMeses: number;
  obrigatorioAdmissao: boolean;
  ativo: boolean;
}

export interface FuncionarioTreinamento {
  id: string;
  empresaId: string;
  funcionarioId: string;
  funcionarioNome: string;
  treinamentoId: string;
  treinamentoTitulo: string;
  normaRegulamentadora?: string;
  dataRealizacao: string;
  dataVencimento?: string;
  diasAteVencimento?: number;
  entidadeInstrutor: string;
  cargaHorariaCumprida: number;
  notaAproveitamento?: number;
  frequenciaPerc: number;
  status: StatusValidadeTreinamento;
  certificadoAnexoUrl?: string;
  custoTreinamento: number;
  observacoes?: string;
}

export interface DocumentoFuncionario {
  id: string;
  empresaId: string;
  funcionarioId: string;
  funcionarioNome: string;
  tipoDocumento: TipoDocumentoFuncionario;
  numeroDocumento?: string;
  dataEmissao: string;
  dataValidade?: string;
  diasAteVencimento?: number;
  medicoCrmEmissor?: string;
  clinicaEmissora?: string;
  statusAptidao: StatusAptidaoExame;
  arquivoUrl?: string;
  statusValidade: StatusValidadeDocumento;
  observacoes?: string;
}

export interface Epi {
  id: string;
  codigo: string;
  nome: string;
  tipoProtecao: TipoProtecaoEPI;
  numeroCa: string;
  validadeCa: string;
  caValido: boolean;
  fabricante?: string;
  durabilidadeEstimadaDias: number;
  custoUnitario: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  ativo: boolean;
}

export interface EntregaEpi {
  id: string;
  empresaId: string;
  funcionarioId: string;
  funcionarioNome: string;
  epiId: string;
  epiNome: string;
  numeroCa: string;
  quantidade: number;
  tamanho?: string;
  dataEntrega: string;
  dataPrevisaoTroca: string;
  diasAteTroca?: number;
  motivoEntrega: MotivoEntregaEPI;
  termoAssinadoDigital: boolean;
  autenticacaoTermoHash?: string;
  entreguePorNome: string;
  statusDevolucao: StatusDevolucaoEPI;
  dataDevolucao?: string;
  observacoes?: string;
}

export interface Turno {
  id: string;
  empresaId: string;
  codigo: string;
  nome: string;
  horarioEntrada: string;
  horarioSaida: string;
  intervaloInicio?: string;
  intervaloFim?: string;
  totalHorasDiarias: number;
  tipoJornada: TipoJornadaTurno;
  adicionalNoturnoAplica: boolean;
  ativo: boolean;
}

export interface Escala {
  id: string;
  empresaId: string;
  funcionarioId: string;
  funcionarioNome: string;
  turnoId: string;
  turnoNome: string;
  dataInicio: string;
  dataFim?: string;
  tipoRegime: 'SEMANAL_5X2' | 'SEMANAL_6X1' | 'REVEZAMENTO_6X2' | 'CONTINUA_12X36';
  ativo: boolean;
}

export interface ApontamentoHoras {
  id: string;
  empresaId: string;
  funcionarioId: string;
  funcionarioNome: string;
  matricula: string;
  setorNome: string;
  dataApontamento: string;
  tipoHora: TipoHoraApontamento;
  quantidadeHoras: number;
  custoHoraAplicado: number;
  custoTotalCalculado: number;
  ordemProducaoId?: string;
  operacaoId?: string;
  maquinaId?: string;
  statusAprovacao: StatusAprovacaoHora;
  aprovadorNome?: string;
  justificativaObservacoes?: string;
}

export interface Vaga {
  id: string;
  empresaId: string;
  codigoVaga: string;
  titulo: string;
  cargoId: string;
  cargoTitulo: string;
  setorId: string;
  setorNome: string;
  quantidadeVagas: number;
  regimeContratacao: string;
  salarioPropostoDe?: number;
  salarioPropostoAte?: number;
  dataAbertura: string;
  dataPrevisaoFechamento?: string;
  status: StatusVaga;
  motivoAbertura: 'AUMENTO_QUADRO_PRODUCAO' | 'SUBSTITUICAO_DESLIGAMENTO' | 'COBERTURA_LICENCA' | 'NOVA_LINHA_MAQUINA';
  requisitosObrigatorios?: string;
  totalCandidatos?: number;
}

export interface Candidato {
  id: string;
  vagaId: string;
  vagaTitulo?: string;
  empresaId: string;
  nomeCompleto: string;
  cpf: string;
  email?: string;
  telefone: string;
  cidadeUf?: string;
  pretensaoSalarial?: number;
  etapaFunil: EtapaFunilCandidato;
  scoreAderenciaPerc: number;
  parecerEntrevistador?: string;
  curriculoUrl?: string;
  createdAt: string;
}

export interface ItemChecklistOnboarding {
  id: string;
  item: string;
  categoria: 'DOCUMENTAL' | 'SAUDE' | 'SEGURANCA' | 'TREINAMENTO' | 'TI_ACESSO' | 'ACOLHIMENTO';
  concluido: boolean;
  dataConclusao?: string;
  responsavel?: string;
}

export interface Onboarding {
  id: string;
  empresaId: string;
  funcionarioId: string;
  funcionarioNome: string;
  cargoTitulo: string;
  setorNome: string;
  candidatoId?: string;
  dataInicio: string;
  previsaoConclusao: string;
  status: StatusOnboarding;
  progressoPercentual: number;
  checklistItens: ItemChecklistOnboarding[];
  responsavelRhNome: string;
  dataConclusao?: string;
  observacoes?: string;
}

export interface ItemChecklistDesligamento {
  id: string;
  item: string;
  categoria: 'SAUDE' | 'PATRIMONIO_EPI' | 'SEGURANCA_TI' | 'RH_PESSOAS' | 'INTEGRACAO_FOLHA';
  concluido: boolean;
  dataConclusao?: string;
  responsavel?: string;
}

export interface EntrevistaDesligamento {
  motivoPrincipal: string;
  climaSetorNota: number; // 1 a 10
  relacionamentoLiderNota: number; // 1 a 10
  pontosFortesEmpresa: string;
  pontosMelhoria: string;
  recomendariaEmpresa: boolean;
}

export interface Desligamento {
  id: string;
  empresaId: string;
  funcionarioId: string;
  funcionarioNome: string;
  matricula: string;
  cargoTitulo: string;
  setorNome: string;
  tipoRescisao: TipoRescisao;
  dataComunicacao: string;
  dataDesligamentoEfetivo: string;
  cumpriuAvisoPrevio: boolean;
  tipoAvisoPrevio: 'TRABALHADO' | 'INDENIZADO' | 'DISPENSADO';
  checklistItens: ItemChecklistDesligamento[];
  progressoPercentual: number;
  status: StatusDesligamento;
  entrevistaDesligamento?: EntrevistaDesligamento;
  exportadoSistemaFolha: boolean;
  protocoloExportacaoFolha?: string;
  dataConclusao?: string;
  responsavelRhNome: string;
  observacoes?: string;
}

export interface RhAuditoriaLog {
  id: string;
  empresaId: string;
  usuarioId: string;
  usuarioNome: string;
  dataHora: string;
  modulo: string;
  acao: string;
  entidadeAfetada: string;
  entidadeId: string;
  funcionarioId?: string;
  funcionarioNome?: string;
  justificativa?: string;
  payloadBefore?: any;
  payloadAfter?: any;
  ipOrigem?: string;
}

// -----------------------------------------------------------------------------
// INTEGRAÇÃO DESACOPLADA COM SISTEMAS EXTERNOS DE FOLHA & PONTO
// -----------------------------------------------------------------------------

export interface RhIntegracaoFolhaPontoPayload {
  sistemaDestino: 'TOTVS_DATASUL_PROTHEUS' | 'SENIOR_HCM' | 'ADP' | 'SECULLUM_PONTO' | 'GENERIC_REST_API';
  tipoOperacao: 'EXPORT_ADMISSAO' | 'EXPORT_RESCISAO' | 'EXPORT_APONTAMENTOS_HORAS' | 'EXPORT_AFASTAMENTOS' | 'IMPORT_BATIDAS_PONTO';
  empresaId: string;
  empresaCnpj: string;
  dataGeracao: string;
  quantidadeRegistros: number;
  conteudoPayloadJson: any;
}

export interface ResultadoIntegracaoExterna {
  sucesso: boolean;
  protocoloTransmissao: string;
  sistemaDestino: string;
  dataHora: string;
  registrosProcessados: number;
  mensagens: string[];
  payloadExportado?: any;
}

// -----------------------------------------------------------------------------
// DASHBOARD & KPIS RH OPERACIONAL
// -----------------------------------------------------------------------------

export interface RhDashboardData {
  totalFuncionariosAtivos: number;
  totalFuncionariosEmpresa: number;
  totalCustoFolhaEstimado: number;
  custoHoraMedioFabril: number;
  treinamentosVencidosQtd: number;
  treinamentosVencendo30dQtd: number;
  episTrocaPendenteQtd: number;
  documentosAsosVencendoQtd: number;
  maquinasBloqueadasQtd: number;
  vagasAbertasQtd: number;
  onboardingsEmAndamentoQtd: number;
  desligamentosEmAndamentoQtd: number;
  horasApontadasMesAtual: {
    produtivasNormais: number;
    extras50: number;
    extras100: number;
    improdutivasParadas: number;
    totalHoras: number;
    custoTotalIndustrial: number;
  };
  distribuicaoPorSetor: { setor: string; quantidade: number; percentual: number }[];
  alertasCriticidadeAlta: {
    tipo: 'TREINAMENTO_NR' | 'EPI_VENCIDO' | 'ASO_VENCIDO' | 'MAQUINA_BLOQUEADA' | 'ONBOARDING_ATRASADO';
    titulo: string;
    colaboradorNome: string;
    setorNome: string;
    diasAtrasoOuValidade: number;
    urgencia: 'CRITICA' | 'ALTA' | 'MEDIA';
  }[];
}
