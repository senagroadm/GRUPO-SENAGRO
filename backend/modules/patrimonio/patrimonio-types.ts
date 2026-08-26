// backend/modules/patrimonio/patrimonio-types.ts

export type CategoriaPatrimonio =
  | 'MAQUINAS_EQUIPAMENTOS'
  | 'FERRAMENTAL_MATRIZES'
  | 'INSTRUMENTOS_MEDICAO'
  | 'VEICULOS_LOGISTICA'
  | 'TI_INFRAESTRUTURA'
  | 'MOVEIS_UTENSILIOS'
  | 'EDIFICACOES_INSTALACOES';

export type StatusPatrimonio = 'ATIVO' | 'EM_MANUTENCAO' | 'TRANSFERIDO' | 'BAIXADO';

export type MotivoBaixaPatrimonio =
  | 'OBSOLESCENCIA_TECNOLOGICA'
  | 'AVARIA_IRREPARAVEL'
  | 'VENDA'
  | 'SUCATA'
  | 'FURTO_EXTRAVIO'
  | 'DOACAO';

export interface EventoHistoricoPatrimonio {
  id: string;
  data: string; // ISO String ou YYYY-MM-DD
  tipo: 'AQUISICAO' | 'TRANSFERENCIA_LOCAL' | 'TROCA_RESPONSAVEL' | 'MANUTENCAO' | 'INVENTARIO' | 'BAIXA';
  descricao: string;
  usuario: string;
  localAnterior?: string;
  localNovo?: string;
  responsavelAnterior?: string;
  responsavelNovo?: string;
}

export interface BaixaPatrimonio {
  dataBaixa: string;
  motivo: MotivoBaixaPatrimonio;
  justificativa: string;
  responsavelBaixa: string;
  valorRecuperadoVendaOuSucata?: number;
  documentoReferencia?: string;
}

export interface EstruturaDepreciacaoFutura {
  metodo: 'LINEAR' | 'HORAS_PRODUCAO' | 'UNIDADES_PRODUZIDAS';
  vidaUtilMeses: number;
  taxaAnualPercentual: number;
  valorResidualEstimado: number;
  depreciacaoAcumuladaEstimada: number;
  valorContabilProjetado: number;
  observacaoIntegracao: string; // Nota informativa sobre futura integração contábil
}

export interface AtivoPatrimonial {
  id: string;
  codigoPatrimonio: string; // ex: 'PAT-TRI-00124'
  nome: string;
  categoria: CategoriaPatrimonio;
  empresaId: string; // Multiempresa
  empresaNome: string;
  localizacao: string; // ex: 'Galpão 1 - Setor de Dobra CNC'
  responsavel: string | null; // ex: 'Carlos Eduardo' ou null para gerar alerta
  departamento: string;
  valorAquisicao: number;
  dataAquisicao: string; // YYYY-MM-DD
  numeroNotaFiscal: string;
  fornecedor: string;
  status: StatusPatrimonio;
  especificacoesTecnicas?: string;
  numeroSerie?: string;
  historico: EventoHistoricoPatrimonio[];
  baixa?: BaixaPatrimonio;
  estruturaDepreciacaoFutura: EstruturaDepreciacaoFutura;
  criadoEm: string;
  atualizadoEm: string;
}

// ----------------------------------------------------
// FERRAMENTAS & MATRIZES
// ----------------------------------------------------
export type CategoriaFerramenta =
  | 'PUNCAO_MATRIZ_DOBRA'
  | 'ESTAMPO_CORTE'
  | 'DISPOSITIVO_SOLDA_FIXACAO'
  | 'FRESA_CNC'
  | 'BROCA_ESPECIAL'
  | 'MOLDE_INJECAO'
  | 'FERRAMENTA_MANUAL_ESPECIAL';

export type CondicaoFerramenta =
  | 'EXCELENTE'
  | 'BOA'
  | 'DESGASTADA'
  | 'INADEQUADA_AVARIADA'
  | 'EM_MANUTENCAO';

export interface HistoricoManutencaoFerramenta {
  id: string;
  data: string;
  tipo: 'AFIACAO' | 'POLIMENTO' | 'RETOQUE_GEOMETRICO' | 'INSPECAO_DIMENSIONAL' | 'SUBSTITUICAO_ELEMENTO';
  descricao: string;
  responsavel: string;
  custo: number;
  horasParada?: number;
}

export interface MovimentacaoFerramenta {
  id: string;
  data: string;
  tipo: 'CHECKOUT_CHAO_FABRICA' | 'CHECKIN_DEVOLUCAO' | 'ENVIO_AFIACAO' | 'RETORNO_AFIACAO' | 'TRANSFERENCIA_SETOR';
  maquinaOuSetorDestino: string;
  responsavelRetirada: string;
  condicaoNoMomento?: CondicaoFerramenta;
  observacoes?: string;
}

export interface FerramentaControle {
  id: string;
  codigo: string; // ex: 'FER-PUNC-88'
  nome: string;
  categoria: CategoriaFerramenta;
  empresaId: string;
  localizacao: string; // ex: 'Armário Ferramentaria Gaveta C2'
  responsavel: string; // ex: 'Marcio Silva - Chefe de Ferramentaria'
  condicao: CondicaoFerramenta;
  ciclosUsoAtual: number;
  limiteCiclosAfiacao: number;
  necessitaManutencaoOuAfiacao: boolean;
  motivoCondicaoInadequada?: string;
  historicoManutencao: HistoricoManutencaoFerramenta[];
  movimentacoes: MovimentacaoFerramenta[];
  criadoEm: string;
  atualizadoEm: string;
}

// ----------------------------------------------------
// CALIBRAÇÃO & METROLOGIA (INSTRUMENTOS DE MEDIÇÃO)
// ----------------------------------------------------
export type TipoInstrumentoCalibracao =
  | 'PAQUIMETRO'
  | 'MICROMETRO'
  | 'RELOGIO_COMPARADOR'
  | 'MANOMETRO'
  | 'BALANCA_DINAMOMETRICA'
  | 'TERMOMETRO_INFRAVERMELHO'
  | 'TORQUIMETRO'
  | 'RUGOSIMETRO'
  | 'DURÔMETRO'
  | 'GABARITO_FIXO';

export type StatusCalibracao =
  | 'CALIBRADO'
  | 'PROXIMO_VENCER'
  | 'VENCIDO'
  | 'EM_CALIBRACAO'
  | 'REPROVADO';

export interface RegistroHistoricoCalibracao {
  id: string;
  dataCalibracao: string; // YYYY-MM-DD
  numeroCertificado: string;
  laboratorioRbc: string;
  resultado: 'APROVADO' | 'APROVADO_COM_RESTRICAO' | 'REPROVADO';
  erroMaximoEncontrado: string;
  incertezaMedicao: string;
  responsavelHomologacao: string;
  observacoes?: string;
}

export interface InstrumentoCalibracao {
  id: string;
  codigoInstrumento: string; // ex: 'CAL-PAQ-014'
  nomeInstrumento: string;
  tipoInstrumento: TipoInstrumentoCalibracao;
  empresaId: string;
  localizacao: string; // ex: 'Metrologia / Sala de Controle de Qualidade'
  responsavel: string; // ex: 'Juliana Paes - Inspetora de Qualidade'
  faixaMedicao: string; // ex: '0 - 150 mm (Resolução 0.01 mm)'
  toleranciaAdmissivel: string; // ex: '± 0.02 mm'
  frequenciaMeses: number; // ex: 6 ou 12 meses
  dataUltimaCalibracao: string; // YYYY-MM-DD
  dataProximaCalibracao: string; // YYYY-MM-DD
  diasParaVencer: number; // calculado dinamicamente
  numeroCertificado: string; // ex: 'CERT-RBC-2025-992'
  laboratorioCalibrador: string; // ex: 'Laboratório RBC Metrologia Industrial SP'
  status: StatusCalibracao;
  bloqueadoParaUso: boolean; // True se vencido ou reprovado
  historicoCalibracoes: RegistroHistoricoCalibracao[];
  criadoEm: string;
  atualizadoEm: string;
}

// ----------------------------------------------------
// PAINEL DE ALERTAS & KPIS DO MÓDULO
// ----------------------------------------------------
export interface AlertaPatrimonioCalibracao {
  id: string;
  tipo:
    | 'CALIBRACAO_VENCIDA'
    | 'CALIBRACAO_PROXIMA'
    | 'FERRAMENTA_CONDICAO_INADEQUADA'
    | 'ATIVO_SEM_RESPONSAVEL';
  gravidade: 'CRITICA' | 'ALTA' | 'MEDIA' | 'INFO';
  titulo: string;
  descricao: string;
  referenciaId: string;
  referenciaCodigo: string;
  empresaId: string;
  dataIdentificacao: string;
  acaoRecomendada: string;
}

export interface IndicadoresPatrimonioCalibracao {
  totalAtivosCadastrados: number;
  totalAtivosAtivos: number;
  totalAtivosBaixados: number;
  valorTotalImobilizado: number;
  totalAtivosSemResponsavel: number;
  
  totalFerramentas: number;
  totalFerramentasEmOperacao: number;
  totalFerramentasInadequadas: number;
  totalFerramentasAguardandoAfiacao: number;

  totalInstrumentosMedicao: number;
  instrumentosCalibradosEmDia: number;
  instrumentosProximosVencer: number;
  instrumentosVencidosOuBloqueados: number;
  indiceConformidadeMetrologicaPercentual: number;

  alertasAtivos: AlertaPatrimonioCalibracao[];
}
