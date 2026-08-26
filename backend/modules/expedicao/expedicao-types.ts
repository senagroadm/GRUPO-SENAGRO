/**
 * NEXUS ERP - Módulo 14: Expedição & Logística de Cargas (TMS Fabril)
 * Isolamento Multiempresa: Toda transação exige e valida empresaId.
 */

export type StatusExpedicao =
  | 'PENDENTE' // Pedido pronto aguardando liberação
  | 'EM_SEPARACAO' // Picking em andamento
  | 'SEPARADO' // Separado aguardando conferência
  | 'EM_CONFERENCIA' // Conferência cega / bipada em andamento
  | 'CONFERIDO' // Itens validados 100%
  | 'EMBALADO' // Volumes gerados e etiquetados
  | 'DOCUMENTADO' // Romaneio, DANFE e CTe gerados
  | 'EM_CARGA' // Alocado na carga/veículo
  | 'DESPACHADO' // Saiu da fábrica
  | 'EM_TRANSITO' // Em transporte na rota
  | 'ENTREGUE' // Concluído com canhoto/comprovante
  | 'ENTREGUE_PARCIAL' // Entregue com ressalva/devolução parcial
  | 'DEVOLVIDO' // Recusado / Devolvido integralmente
  | 'CANCELADO';

export type ModalidadeFrete = 'CIF' | 'FOB' | 'RETIRA' | 'SEM_FRETE';

export type TipoTransporte = 'TRANSPORTADORA_TERCEIRA' | 'FROTA_PROPRIA' | 'CLIENTE_RETIRA' | 'CORREIOS_EXPRESSO';

export type TipoEmbalagem =
  | 'CAIXA_PAPELAO'
  | 'PALLET_MADEIRA'
  | 'ENGRADADO_ACO'
  | 'TAMBOR'
  | 'FARDO'
  | 'CONTAINER'
  | 'SKID_INDUSTRIAL'
  | 'AVULSO';

export type StatusSeparacao = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'DIVERGENCIA' | 'CANCELADA';

export type StatusConferencia = 'PENDENTE' | 'EM_ANDAMENTO' | 'APROVADA' | 'DIVERGENCIA' | 'REJEITADA';

export type StatusCarga = 'EM_MONTAGEM' | 'FECHADA' | 'CARREGADA' | 'EM_VIAGEM' | 'CONCLUIDA' | 'CANCELADA';

export type TipoOcorrenciaTransporte =
  | 'ATRASO_TRAFEGO'
  | 'AVARIA_PARCIAL'
  | 'AVARIA_TOTAL'
  | 'RECUSA_CLIENTE'
  | 'DESTINATARIO_AUSENTE'
  | 'ENDERECO_NAO_LOCALIZADO'
  | 'PROBLEMA_MECANICO_VEICULO'
  | 'RETENCAO_POSTO_FISCAL'
  | 'SINISTRO_ROUBO'
  | 'EXTRAVIO_VOLUME'
  | 'DEVOLUCAO_LOGISTICA_REVERSA'
  | 'OUTRO';

export type GravidadeOcorrencia = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

/**
 * Item a ser expedido (originado de um Pedido de Venda)
 */
export interface ExpedicaoItem {
  id: string;
  expedicaoId: string;
  pedidoId: string;
  pedidoItemId: string;
  codigoProduto: string;
  descricao: string;
  unidadeMedida: string;
  quantidadePedida: number;
  quantidadeSeparada: number;
  quantidadeConferida: number;
  quantidadeExpedida: number;
  pesoUnitarioKg: number;
  pesoTotalKg: number;
  volumeM3Unitario: number;
  loteNumero?: string;
  localizacaoEstoque?: string;
  precoUnitario: number;
  valorTotalItem: number;
  volumeId?: string; // ID do volume/caixa onde foi embalado
}

/**
 * Separação (Picking List)
 */
export interface SeparacaoExpedicao {
  id: string;
  empresaId: string;
  expedicaoId: string;
  codigoSeparacao: string;
  status: StatusSeparacao;
  operadorId: string;
  operadorNome: string;
  dataInicio?: string;
  dataConclusao?: string;
  tempoGastoMinutos?: number;
  divergenciasAnotadas?: string;
  itens: {
    itemId: string;
    codigoProduto: string;
    descricao: string;
    localizacao: string;
    lote?: string;
    quantidadeSugerida: number;
    quantidadeColetada: number;
    bipado: boolean;
  }[];
}

/**
 * Conferência (Blind Checking / Barcode Verification)
 */
export interface ConferenciaExpedicao {
  id: string;
  empresaId: string;
  expedicaoId: string;
  codigoConferencia: string;
  status: StatusConferencia;
  conferenteId: string;
  conferenteNome: string;
  metodo: 'BIPAGEM_CODIGO_BARRAS' | 'CONFERENCIA_CEGA_MANUAL' | 'PESAGEM_DINAMICA';
  dataInicio?: string;
  dataConclusao?: string;
  pesoTeoricoTotalKg: number;
  pesoAferidoBalancaKg?: number;
  diferencaPesoPercentual?: number;
  divergencias: {
    codigoProduto: string;
    descricao: string;
    quantidadeEsperada: number;
    quantidadeAferida: number;
    motivoDivergencia?: string;
  }[];
  itensConferidos: {
    codigoProduto: string;
    codigoBarrasLido: string;
    quantidadeLida: number;
    timestamp: string;
  }[];
}

/**
 * Volume Embalado (Caixa, Pallet, Engradado)
 */
export interface VolumeExpedicao {
  id: string;
  empresaId: string;
  expedicaoId: string;
  numeroVolume: number;
  totalVolumesExpedicao: number;
  codigoVolume: string; // Ex: VOL-0001-01/03
  codigoBarrasEtiqueta: string; // GS1-128 / Código único
  tipoEmbalagem: TipoEmbalagem;
  dimensoesCm: {
    comprimento: number;
    largura: number;
    altura: number;
  };
  volumeM3: number;
  pesoLiquidoKg: number;
  pesoBrutoKg: number;
  pesoCubadoKg: number; // (C x L x A / 6000) ou fator 300 kg/m3
  itensContidos: {
    expedicaoItemId: string;
    codigoProduto: string;
    descricao: string;
    quantidade: number;
  }[];
  etiquetaGerada: boolean;
  lacreSegurancaNumero?: string;
}

/**
 * Rastreamento de Transporte (Tracking Event)
 */
export interface EventoRastreamento {
  id: string;
  expedicaoId: string;
  cargaId?: string;
  timestamp: string;
  etapa: string; // 'DESPACHO_FABRICA' | 'EM_TRANSITO' | 'POSTO_FISCAL' | 'CD_TRANSPORTADORA' | 'SAIU_ENTREGA' | 'ENTREGUE' | 'OCORRENCIA'
  cidade: string;
  uf: string;
  descricao: string;
  latitude?: number;
  longitude?: number;
  responsavelNome?: string;
}

/**
 * Ocorrência de Transporte & Logística Reversa
 */
export interface OcorrenciaTransporte {
  id: string;
  empresaId: string;
  expedicaoId: string;
  codigoOcorrencia: string;
  tipo: TipoOcorrenciaTransporte;
  gravidade: GravidadeOcorrencia;
  dataHora: string;
  descricaoDetalhada: string;
  acaoTomada?: string;
  fotosEvidenciaUrls?: string[];
  valorPrejuizoEstimado?: number;
  gerouLogisticaReversa: boolean;
  gerouRncQualidade: boolean;
  rncQualidadeId?: string;
  resolvido: boolean;
  dataResolucao?: string;
  responsavelResolucao?: string;
}

/**
 * Comprovante de Entrega (Canhoto Digitalizado)
 */
export interface ComprovanteEntrega {
  id: string;
  empresaId: string;
  expedicaoId: string;
  dataHoraEntrega: string;
  nomeRecebedor: string;
  documentoRecebedor: string; // CPF ou RG
  parentescoOuCargo?: string;
  assinaturaDigitalUrl?: string;
  canhotoFotoUrl?: string;
  geolocalizacao?: {
    latitude: number;
    longitude: number;
    precisaoMetros?: number;
  };
  ressalvasCliente?: string;
  entregueNoPrazo: boolean;
  entregueCompleto: boolean;
  otifConforme: boolean;
}

/**
 * Frete (Cálculo Previsto x Real)
 */
export interface FreteCalculado {
  modalidade: ModalidadeFrete;
  transportadoraId?: string;
  transportadoraNome?: string;
  tipoTransporte: TipoTransporte;
  tabelaFreteId?: string;
  valorFretePrevisto: number;
  valorFreteReal: number;
  variacaoValor: number; // Real - Previsto
  variacaoPercentual: number;
  baseCalculoKg: number; // Maior entre peso real e cubado
  pesoCubadoTotalKg: number;
  pesoRealTotalKg: number;
  adValoremValor: number;
  grisValor: number;
  pedagioValor: number;
  taxaDespachoValor: number;
  outrasTaxas: number;
  numeroCTe?: string;
  chaveAcessoCTe?: string;
}

/**
 * Expedição Principal (Ordem de Expedição)
 */
export interface Expedicao {
  id: string;
  empresaId: string;
  numeroExpedicao: string; // Ex: EXP-2026-0089
  pedidoId: string;
  numeroPedidoVenda: string;
  clienteId: string;
  clienteRazaoSocial: string;
  clienteCnpjCpf: string;
  enderecoEntrega: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  dataEmissao: string;
  dataPrometidaEntrega: string;
  dataPrevisaoDespacho: string;
  dataEfetivaDespacho?: string;
  dataEfetivaEntrega?: string;
  status: StatusExpedicao;
  modalidadeFrete: ModalidadeFrete;
  tipoTransporte: TipoTransporte;
  transportadoraId?: string;
  transportadoraNome?: string;
  veiculoId?: string;
  veiculoPlaca?: string;
  motoristaId?: string;
  motoristaNome?: string;
  cargaId?: string;
  numeroCarga?: string;
  numeroNotaFiscal?: string;
  serieNotaFiscal?: string;
  chaveNFe?: string;
  valorMercadorias: number;
  valorTotalExpedicao: number;
  pesoLiquidoTotalKg: number;
  pesoBrutoTotalKg: number;
  volumeM3Total: number;
  quantidadeTotalVolumes: number;
  itens: ExpedicaoItem[];
  separacao?: SeparacaoExpedicao;
  conferencia?: ConferenciaExpedicao;
  volumes: VolumeExpedicao[];
  frete: FreteCalculado;
  rastreamento: EventoRastreamento[];
  ocorrencias: OcorrenciaTransporte[];
  comprovanteEntrega?: ComprovanteEntrega;
  observacoes?: string;
  criadoEm: string;
  atualizadoEm: string;
  criadoPor: string;
}

/**
 * Carga Consolidada (Romaneio de Carregamento)
 */
export interface CargaExpedicao {
  id: string;
  empresaId: string;
  numeroCarga: string; // Ex: CARGA-2026-042
  dataCriacao: string;
  dataCarregamentoPrevisto: string;
  dataSaidaEfetiva?: string;
  status: StatusCarga;
  tipoTransporte: TipoTransporte;
  transportadoraId?: string;
  transportadoraNome?: string;
  veiculoId?: string;
  veiculoPlaca?: string;
  veiculoModelo?: string;
  motoristaId?: string;
  motoristaNome?: string;
  motoristaCelular?: string;
  rotaNome: string;
  cidadesAtendidas: string[];
  capacidadeVeiculoKg: number;
  capacidadeVeiculoM3: number;
  pesoTotalCargaKg: number;
  volumeTotalCargaM3: number;
  ocupacaoPesoPercentual: number;
  ocupacaoVolumePercentual: number;
  valorTotalMercadoriasCarga: number;
  quantidadeTotalVolumesCarga: number;
  pedidosVinculados: {
    expedicaoId: string;
    pedidoId: string;
    numeroPedido: string;
    clienteNome: string;
    cidadeUf: string;
    ordemEntrega: number;
    pesoKg: number;
    volumeM3: number;
    quantidadeVolumes: number;
    valorMercadorias: number;
    statusEntrega: StatusExpedicao;
  }[];
  observacoes?: string;
  criadoPor: string;
}

/**
 * Transportadora Homologada
 */
export interface Transportadora {
  id: string;
  empresaId: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  rntrc: string; // Registro Nacional de Transportadores Rodoviários de Carga
  ie: string;
  telefone: string;
  emailOperacional: string;
  emailTracking?: string;
  contatoNome: string;
  cidade: string;
  uf: string;
  modalidadesAtendidas: ('FRACIONADA' | 'DEDICADA_LOTACAO' | 'EXPRESSA')[];
  prazoMedioDias: number;
  taxaPontualidadePercentual: number; // Histórico de entregas no prazo
  ativo: boolean;
}

/**
 * Tabela de Frete Parametrizada
 */
export interface TabelaFrete {
  id: string;
  empresaId: string;
  transportadoraId: string;
  transportadoraNome: string;
  nomeTabela: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  ufOrigem: string;
  ufDestino: string;
  regiaoDestino?: string;
  valorFixoDespacho: number;
  faixasPeso: {
    pesoAteKg: number;
    valorKgOuFixo: number;
    tipoCobranca: 'VALOR_FIXO' | 'VALOR_POR_KG';
  }[];
  aliquotaAdValoremPercentual: number; // % sobre valor da NF (Seguro/Risco)
  aliquotaGrisPercentual: number; // Gerenciamento de Risco
  valorPedagioPorFracao100kg: number;
  fatorCubagemKgPorM3: number; // Padrão rodoviário: 300 kg/m³
  prazoEstimadoDias: number;
  ativo: boolean;
}

/**
 * Veículo da Frota Própria
 */
export interface VeiculoFrota {
  id: string;
  empresaId: string;
  placa: string;
  modelo: string;
  marca: string;
  anoFabricacao: number;
  tipoVeiculo: 'UTILITARIO_LEVE' | 'VUC' | 'TOCO_3_4' | 'TRUCK' | 'CARRETA_BAU' | 'SIDER' | 'CARRETA_PRANCHA';
  capacidadeCargaKg: number;
  capacidadeVolumeM3: number;
  tipoCombustivel: 'DIESEL' | 'GASOLINA' | 'FLEX' | 'ELETRICO';
  consumoMedioKmL: number;
  rntrcProprio?: string;
  status: 'DISPONIVEL' | 'EM_VIAGEM' | 'EM_MANUTENCAO' | 'INATIVO';
  kmAtual: number;
  ultimaRevisaoKm?: number;
}

/**
 * Motorista
 */
export interface Motorista {
  id: string;
  empresaId: string;
  nomeCompleto: string;
  cpf: string;
  cnhNumero: string;
  cnhCategoria: 'B' | 'C' | 'D' | 'E';
  cnhValidade: string;
  celularWhatsApp: string;
  tipoVinculo: 'CLT_PROPRIO' | 'TERCEIRO_AGREGADO' | 'AUTONOMO';
  status: 'DISPONIVEL' | 'EM_VIAGEM' | 'FOLGA' | 'INATIVO';
  veiculoFixoId?: string;
}

/**
 * Indicadores e Métricas OTIF & Custos
 */
export interface IndicadoresLogisticaOTIF {
  totalExpedicoes: number;
  expedicoesEntregues: number;
  expedicoesEmTransito: number;
  expedicoesEmSeparacaoConferencia: number;
  taxaOtifGeral: number; // % (On-Time AND In-Full)
  taxaOnTime: number; // % entregas dentro do prazo prometido
  taxaInFull: number; // % entregas 100% completas sem faltas/avarias
  custoFretePrevistoTotal: number;
  custoFreteRealTotal: number;
  variacaoFreteTotal: number;
  variacaoFretePercentual: number;
  custoMedioPorKg: number;
  pesoTotalExpedidoKg: number;
  totalVolumesExpedidos: number;
  totalOcorrencias: number;
  ocorrenciasPorTipo: {
    tipo: TipoOcorrenciaTransporte;
    quantidade: number;
    percentual: number;
  }[];
  causasPerdaOTIF: {
    causa: string;
    impactoPercentual: number;
  }[];
}
