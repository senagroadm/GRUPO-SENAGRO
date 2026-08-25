// backend/modules/estoque/estoque-types.ts
// Módulo de Estoque Multiempresa Industrial (Metalmecânica, Chapas, Lotes, Retalhos, Sucatas, Reservas e Inventário)

export type TipoAlmoxarifado =
  | 'MATERIA_PRIMA'
  | 'PRODUTO_ACABADO'
  | 'RETALHOS'
  | 'SUCATA'
  | 'CONSUMIVEIS'
  | 'INTERMEDIARIO'
  | 'QUARENTENA_INSPECAO'
  | 'TERCEIROS_CONSIGNADO';

export interface Almoxarifado {
  id: string;
  empresaId: string;
  codigo: string;
  nome: string;
  tipo: TipoAlmoxarifado;
  ativo: boolean;
  enderecoFisico: string;
  responsavelNome: string;
  permiteSaldoNegativo: boolean;
  criadoEm: string;
}

export type TipoArmazenamento =
  | 'RACK_CHAPAS'
  | 'PORTA_PALLET'
  | 'GAVETEIRO'
  | 'PISO_PESADO'
  | 'CANTEIRO_RETALHOS'
  | 'CACAMBA_SUCATA'
  | 'AREA_QUARENTENA';

export interface LocalizacaoEstoque {
  id: string;
  empresaId: string;
  almoxarifadoId: string;
  codigo: string; // Ex: 'RUA-01-PRAT-03-NIVEL-A'
  rua: string;
  prateleira: string;
  nivel: string;
  gaveta?: string;
  tipoArmazenamento: TipoArmazenamento;
  capacidadePesoKg: number;
  ocupacaoAtualKg: number;
  ativo: boolean;
}

export type StatusEstoqueItem =
  | 'DISPONIVEL'
  | 'RESERVADO'
  | 'BLOQUEADO'
  | 'EM_INSPECAO'
  | 'EM_PRODUCAO'
  | 'PRODUTO_ACABADO'
  | 'RETALHO'
  | 'SUCATA'
  | 'CONSIGNADO';

export interface SaldoEstoque {
  id: string;
  empresaId: string;
  produtoId: string;
  codigoProduto: string;
  descricaoProduto: string;
  unidadeMedida: string; // UN, KG, M2, M, CHAPA
  almoxarifadoId: string;
  almoxarifadoCodigo: string;
  almoxarifadoNome: string;
  localizacaoId: string;
  localizacaoCodigo: string;
  loteId?: string;
  numeroLote?: string;
  statusEstoque: StatusEstoqueItem;
  
  // Balanço de Quantidades
  quantidadeFisica: number;
  quantidadeReservada: number;
  quantidadeBloqueada: number;
  quantidadeEmInspecao: number;
  quantidadeDisponivel: number; // Formula: fisica - reservada - bloqueada - em_inspecao

  // Valoração
  custoMedioUnitario: number;
  custoTotal: number;

  // Rastreabilidade Industrial
  categoriaItem: 'CHAPA_ACO' | 'PERFIL_TUBO' | 'COMPONENTE' | 'INSUMO_SOLDA' | 'RETALHO_SOBRA' | 'PRODUTO_ACABADO' | 'SUCATA';
  dataUltimoMovimento: string;
  atualizadoEm: string;
}

export type TipoMovimentoEstoque =
  | 'ENTRADA_COMPRA'
  | 'ENTRADA_TRANSFERENCIA'
  | 'ENTRADA_AJUSTE_INVENTARIO'
  | 'ENTRADA_SOBRA_RETALHO'
  | 'SAIDA_PRODUCAO_OP'
  | 'SAIDA_VENDA_PEDIDO'
  | 'SAIDA_TRANSFERENCIA'
  | 'SAIDA_AJUSTE_INVENTARIO'
  | 'SAIDA_SUCATEAMENTO'
  | 'REVERSAO_ESTORNO'
  | 'BLOQUEIO_QUALIDADE'
  | 'DESBLOQUEIO_QUALIDADE'
  | 'RESERVA_PEDIDO'
  | 'CANCELAMENTO_RESERVA';

export type TipoDocumentoOrigem =
  | 'PEDIDO_VENDA'
  | 'PEDIDO_COMPRA'
  | 'ORDEM_PRODUCAO'
  | 'NOTA_FISCAL_ENTRADA'
  | 'NOTA_FISCAL_DEVOLUCAO'
  | 'INVENTARIO'
  | 'AJUSTE_MANUAL'
  | 'TRANSFERENCIA_INTERNA'
  | 'LAUDO_QUALIDADE';

export interface MovimentoEstoque {
  id: string;
  empresaId: string;
  tipoMovimento: TipoMovimentoEstoque;
  produtoId: string;
  codigoProduto: string;
  descricaoProduto: string;
  quantidade: number;
  unidadeMedida: string;
  custoUnitario: number;
  custoTotal: number;

  // Origem e Destino
  almoxarifadoOrigemId?: string;
  localizacaoOrigemId?: string;
  almoxarifadoDestinoId?: string;
  localizacaoDestinoId?: string;
  
  loteId?: string;
  numeroLote?: string;

  // Documento Vínculo
  documentoOrigemTipo: TipoDocumentoOrigem;
  documentoOrigemId?: string;
  documentoOrigemNumero?: string;

  motivo: string;
  observacoes?: string;

  // Estorno & Auditoria
  movimentoOriginalId?: string; // Preenchido quando for REVERSAO_ESTORNO
  estornado: boolean;
  estornadoPorMovimentoId?: string;

  usuarioId: string;
  usuarioNome: string;
  exigeAprovacao: boolean;
  aprovadoPor?: string;
  dataHora: string;
  hashAuditoria: string;
}

export type StatusLote = 'APROVADO' | 'QUARENTENA' | 'REPROVADO' | 'BLOQUEADO' | 'ESGOTADO';

export interface LoteEstoque {
  id: string;
  empresaId: string;
  numeroLote: string;
  numeroCorridaAco: string;
  certificadoUsinaNumero: string;
  fornecedorNome: string;
  dataEntrada: string;
  dataValidade?: string;
  materialTipo: string; // Ex: 'AÇO SAE 1020', 'AÇO INOX 304', 'AÇO SAC 350', 'ALUMÍNIO 5052'
  espessuraMm?: number;
  certificadoUrl?: string;
  composicaoQuimica?: {
    c?: number;
    mn?: number;
    si?: number;
    p?: number;
    s?: number;
    cr?: number;
    ni?: number;
  };
  propriedadesMecanicas?: {
    limiteEscoamentoMpa?: number;
    limiteResistenciaMpa?: number;
    alongamentoPerc?: number;
    durezaHrb?: number;
  };
  statusLote: StatusLote;
  quantidadeOriginal: number;
  quantidadeAtualSaldo: number;
  unidadeMedida: string;
}

export type StatusReserva = 'ATIVA' | 'CONSUMIDA' | 'CANCELADA';

export interface ReservaEstoque {
  id: string;
  empresaId: string;
  produtoId: string;
  codigoProduto: string;
  descricaoProduto: string;
  almoxarifadoId: string;
  localizacaoId: string;
  loteId?: string;
  quantidadeReservada: number;
  unidadeMedida: string;
  tipoOrigem: 'PEDIDO_VENDA' | 'ORDEM_PRODUCAO' | 'RESERVA_MANUAL';
  documentoOrigemId: string;
  documentoOrigemNumero: string;
  statusReserva: StatusReserva;
  criadoEm: string;
  expiraEm?: string;
  usuarioId: string;
  usuarioNome: string;
  observacoes?: string;
}

// Controle Especializado de Chapas Industriais
export type StatusChapa = 'DISPONIVEL' | 'RESERVADA' | 'EM_MAQUINA_CORTE' | 'CONSUMIDA' | 'BLOQUEADA';

export interface ChapaEstoque {
  id: string;
  empresaId: string;
  codigoChapa: string;
  produtoId: string;
  material: string; // Ex: 'Aço Carbono SAE 1020', 'Aço Galvanizado', 'Aço Inox 304'
  espessuraMm: number;
  larguraMm: number;
  comprimentoMm: number;
  areaM2: number;
  pesoKg: number;
  densidadeMaterialKgM3: number; // Ex: 7850 para aço carbono
  loteId: string;
  numeroLote: string;
  numeroCorrida: string;
  custoPorKg: number;
  custoTotalChapa: number;
  almoxarifadoId: string;
  localizacaoId: string;
  localizacaoCodigo: string;
  status: StatusChapa;
  dataRecebimento: string;
  observacoes?: string;
}

// Controle de Retalhos / Sobras Úteis de Corte
export type FormatoGeometricoRetalho = 'RETANGULAR' | 'TRIANGULAR' | 'TRAPEZOIDAL' | 'IRREGULAR_DXF';
export type StatusRetalho = 'DISPONIVEL' | 'RESERVADO' | 'CONSUMIDO' | 'DESCARTADO_SUCATA';

export interface RetalhoChapa {
  id: string;
  empresaId: string;
  codigoRetalho: string;
  loteOrigemId: string;
  numeroLoteOrigem: string;
  chapaMaeId?: string;
  ordemProducaoOrigemId?: string;
  material: string;
  espessuraMm: number;
  larguraMm: number;
  comprimentoMm: number;
  formatoGeometrico: FormatoGeometricoRetalho;
  areaM2: number;
  pesoKg: number;
  aproveitamentoEstimadoPerc: number; // Ex: 85% de área útil para nesting
  almoxarifadoId: string;
  localizacaoId: string;
  localizacaoCodigo: string;
  statusRetalho: StatusRetalho;
  custoUnitarioKg: number;
  custoEstimadoTotal: number;
  dataCriacao: string;
  observacoes?: string;
}

// Registro de Sucata / Cavaco / Descarte de Metal
export type TipoMaterialSucata =
  | 'ACO_CARBONO_OXICORTE'
  | 'ACO_CARBONO_ESTAMPO'
  | 'INOX_304'
  | 'INOX_316'
  | 'ALUMINIO'
  | 'COBRE'
  | 'LATAO'
  | 'MISTO_CALDEIRARIA';

export type StatusSucata = 'ARMAZENADO' | 'VENDIDO_RECICLADORA' | 'DESCARTADO';

export interface RegistroSucata {
  id: string;
  empresaId: string;
  codigoSucata: string;
  tipoMaterial: TipoMaterialSucata;
  pesoKg: number;
  origemDescarte: 'SOBRA_CORTE_INUTILIZAVEL' | 'PECA_REPROVADA_QUALIDADE' | 'APARA_ESTAMPAGEM' | 'AJUSTE_INVENTARIO';
  ordemProducaoId?: string;
  almoxarifadoId: string;
  localizacaoId: string;
  cacambaNumero?: string;
  valorEstimadoVendaPorKg: number;
  valorTotalEstimado: number;
  dataGeracao: string;
  statusSucata: StatusSucata;
  notaVendaId?: string;
  responsavelId: string;
  responsavelNome: string;
  observacoes?: string;
}

// Inventário Físico, Contagens e Divergências
export type TipoInventario = 'GERAL' | 'ROTATIVO_CICLICO' | 'POR_ALMOXARIFADO' | 'POR_FAMILIA_CHAPAS';
export type StatusInventario = 'PLANEJADO' | 'EM_CONTAGEM' | 'APURACAO_DIVERGENCIAS' | 'AGUARDANDO_APROVACAO' | 'CONCILIADO' | 'CANCELADO';

export interface InventarioSessao {
  id: string;
  empresaId: string;
  numeroSessao: string;
  titulo: string;
  tipo: TipoInventario;
  almoxarifadoId?: string;
  status: StatusInventario;
  dataInicio: string;
  dataEncerramento?: string;
  responsavelNome: string;
  totalItensContados: number;
  totalDivergenciasEncontradas: number;
  impactoFinanceiroTotalDivergencia: number;
  observacoes?: string;
}

export interface InventarioContagemItem {
  id: string;
  inventarioId: string;
  produtoId: string;
  codigoProduto: string;
  descricaoProduto: string;
  unidadeMedida: string;
  almoxarifadoId: string;
  localizacaoId: string;
  loteId?: string;
  numeroLote?: string;
  
  saldoSistemaQuantidade: number;
  primeiraContagemQuantidade: number;
  segundaContagemQuantidade?: number;
  contagemFinalApurada: number;
  divergenciaQuantidade: number; // contagemFinalApurada - saldoSistemaQuantidade
  percentualDivergencia: number;
  custoMedioUnitario: number;
  impactoFinanceiroDivergencia: number;
  
  statusItem: 'CONFERIDO_OK' | 'DIVERGENCIA_POSITIVA' | 'DIVERGENCIA_NEGATIVA' | 'AJUSTE_APLICADO';
  justificativaDivergencia?: string;
  aprovadoPor?: string;
}

export interface PoliticaEstoqueEmpresa {
  empresaId: string;
  permiteSaldoNegativo: boolean;
  limiteValorAjusteSemAprovacao: number; // Ex: R$ 1.500,00
  limitePercentualDivergenciaSemAprovacao: number; // Ex: 10%
  exigeLoteObrigatorioParaChapas: boolean;
  permiteConsumoRetalhoSemOp: boolean;
}
