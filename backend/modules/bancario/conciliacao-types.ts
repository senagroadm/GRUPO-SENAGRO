/**
 * ============================================================================
 * MÓDULO BANCÁRIO & CONCILIAÇÃO - TIPOS E ESTRUTURAS
 * NEXUS ERP (Grupo TRITECH - 5 CNPJs)
 * ============================================================================
 * 
 * Regras Obrigatórias:
 * 1. ISOLAMENTO MULTIEMPRESA: Toda transação e conciliação valida o empresaId.
 * 2. IDEMPOTÊNCIA: FITID / Hash de transação previne duplicidade de importação e de conciliação.
 * 3. NÍVEIS DE CONFIANÇA (CONFIDENCE):
 *    - ALTA (>= 85%): Conciliação e baixa automáticas.
 *    - MÉDIA (60% - 84%): Sugestão de correspondência para confirmação em 1 clique.
 *    - BAIXA (< 60%): Exige decisão manual do operador (busca ou lançamento).
 * 4. AUDITORIA COMPLETA: Log append-only com match score, motivo, usuário e payloads.
 * ============================================================================
 */

export type TipoTransacaoExtrato = 'CREDITO' | 'DEBITO';

export type StatusExtrato = 'IMPORTADO' | 'PARCIALMENTE_CONCILIADO' | 'TOTALMENTE_CONCILIADO' | 'CANCELADO';

export type StatusConciliacaoItem = 'PENDENTE' | 'SUGERIDO' | 'CONCILIADO' | 'IGNORADO';

export type NivelConfiancaMatch = 'ALTA' | 'MEDIA' | 'BAIXA' | 'NENHUMA';

export type TipoConciliacao =
  | 'BAIXA_RECEBER'
  | 'BAIXA_PAGAR'
  | 'BAIXA_COBRANCA'
  | 'TARIFA_BANCARIA'
  | 'TRANSFERENCIA_INTERNA'
  | 'TRANSFERENCIA_INTERCOMPANY'
  | 'LANCAMENTO_AVULSO';

export type FormatoArquivoExtrato = 'OFX' | 'CSV';

/**
 * Detalhamento dos fatores ponderados que compõem o Score de Matching
 */
export interface DetalhesScoreMatch {
  scoreValor: number;         // Max: 35 pts (valor exato ou tolerância)
  scoreData: number;          // Max: 25 pts (mesmo dia, D±1, D±3, D±7)
  scoreParceiro: number;      // Max: 25 pts (CNPJ/CPF ou similaridade de nome)
  scoreDocumento: number;     // Max: 30 pts (número do documento / NF / parcela)
  scoreIdentificador: number; // Max: 35 pts (FITID / autenticação / NSU)
  scoreDescricao: number;     // Max: 15 pts (palavras-chave no histórico)
  scoreCobrancaRef: number;   // Max: 35 pts (Nosso Número, Linha Digitável, TXID PIX)
  scoreTotal: number;         // 0 - 100
  explicacoes: string[];
}

/**
 * Sugestão de correspondência calculada pelo motor de matching
 */
export interface MatchSugerido {
  nivelConfianca: NivelConfiancaMatch;
  scoreTotal: number;
  tipo: TipoConciliacao;
  targetId: string;
  targetDescricao: string;
  targetDocumento?: string;
  targetParceiroNome?: string;
  targetParceiroCnpjCpf?: string;
  targetValor: number;
  targetDataVencimento?: string;
  detalhesScore: DetalhesScoreMatch;
}

/**
 * Registro da conciliação efetivada
 */
export interface ConciliacaoEfetiva {
  tipoConciliacao: TipoConciliacao;
  targetId?: string;
  targetDescricao: string;
  movimentoFinanceiroId: string;
  tituloPagarId?: string;
  tituloReceberId?: string;
  parcelaId?: string;
  cobrancaId?: string;
  categoriaId?: string;
  categoriaNome?: string;
  centroCustoId?: string;
  centroCustoNome?: string;
  contaDestinoId?: string;
  contaDestinoNome?: string;
  empresaDestinoId?: string;
  empresaDestinoNome?: string;
  usuarioId?: string;
  usuarioNome?: string;
  dataHoraConciliacao: string;
  autoConciliado: boolean;
  motivoConciliacao: string;
  valorConciliado: number;
}

/**
 * Linha individual de um extrato bancário
 */
export interface ExtratoBancarioItem {
  id: string;
  extratoId: string;
  empresaId: string;
  contaBancariaId: string;
  contaBancariaNome?: string;
  dataTransacao: string; // YYYY-MM-DD
  tipoTransacao: TipoTransacaoExtrato;
  valor: number; // Sempre positivo
  valorOriginalSinal?: number; // Positivo para crédito, negativo para débito
  fitid: string; // Identificador único (idempotência)
  checknum?: string; // Número do documento / cheque / doc
  refnum?: string;
  memo: string; // Histórico bancário original
  categoriaDetectada?: string;
  status: StatusConciliacaoItem;
  matchSugerido?: MatchSugerido;
  conciliacaoEfetiva?: ConciliacaoEfetiva;
  rawPayload?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cabeçalho do Extrato Bancário Importado
 */
export interface ExtratoBancario {
  id: string;
  empresaId: string;
  contaBancariaId: string;
  contaBancariaNome: string;
  bancoCodigo: string;
  agencia: string;
  contaCorrente: string;
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
  saldoInicial?: number;
  saldoFinal?: number;
  formato: FormatoArquivoExtrato;
  nomeArquivo: string;
  hashArquivo: string; // Hash SHA-256 para idempotência de arquivo
  status: StatusExtrato;
  totalItens: number;
  totalConciliados: number;
  totalCreditos: number;
  totalDebitos: number;
  valorTotalCreditos: number;
  valorTotalDebitos: number;
  itens: ExtratoBancarioItem[];
  usuarioImportadorId?: string;
  usuarioImportadorNome?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Configuração de Mapeamento Flexível de CSV
 */
export interface ConfigMapeamentoCsv {
  separador: ',' | ';' | '\t' | '|';
  encoding: 'utf-8' | 'iso-8859-1';
  temCabecalho: boolean;
  linhaInicioDados: number;
  formatoData: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD-MM-YYYY';
  formatoValor: 'BR' | 'US'; // BR: 1.234,56 / US: 1,234.56
  formatoTipoTransacao: 'COLUNA_VALOR_COM_SINAL' | 'COLUNAS_DEBITO_CREDITO' | 'COLUNA_TIPO_SEPARADA';
  colunas: {
    dataCol: string; // Nome da coluna ou índice
    descricaoCol: string;
    valorCol?: string;
    debitoCol?: string;
    creditoCol?: string;
    tipoTransacaoCol?: string;
    documentoCol?: string;
    fitidCol?: string;
    saldoCol?: string;
  };
}

export interface PresetMapeamentoCsv {
  id: string;
  nome: string;
  descricao: string;
  bancoCodigo?: string;
  config: ConfigMapeamentoCsv;
}

/**
 * Log de Auditoria de Conciliação
 */
export interface AuditoriaConciliacaoLog {
  id: string;
  empresaId: string;
  extratoItemId: string;
  fitid: string;
  acao:
    | 'IMPORTACAO_EXTRATO'
    | 'AUTO_MATCH_CONCILIADO'
    | 'MATCH_SUGERIDO'
    | 'CONCILIACAO_MANUAL'
    | 'DESCONCILIACAO_ESTORNO'
    | 'TARIFA_REGISTRADA'
    | 'TRANSFERENCIA_INTERNA'
    | 'TRANSFERENCIA_INTERCOMPANY';
  matchScore?: number;
  nivelConfianca?: NivelConfiancaMatch;
  motivo: string;
  usuarioId?: string;
  usuarioNome?: string;
  payloadBefore?: Record<string, any>;
  payloadAfter?: Record<string, any>;
  timestamp: string;
}

/**
 * Parâmetros para Ações Manuais de Conciliação
 */
export interface ConciliarManualInput {
  empresaId: string;
  extratoItemId: string;
  tipoConciliacao: TipoConciliacao;
  targetId?: string; // ID do Título a Pagar/Receber ou Cobrança
  targetParcelaId?: string;
  categoriaId?: string;
  centroCustoId?: string;
  contaDestinoId?: string; // Para Transferência Interna
  empresaDestinoId?: string; // Para Transferência Intercompany (outro CNPJ TRITECH)
  contaEmpresaDestinoId?: string; // Conta no outro CNPJ
  motivo: string;
  usuarioId?: string;
  usuarioNome?: string;
}

export interface ResultadoProcessamentoExtrato {
  sucesso: boolean;
  extrato: ExtratoBancario;
  itensNovos: number;
  itensDuplicadosIgnorados: number;
  autoConciliadosAltaConfianca: number;
  sugestoesMediaConfianca: number;
  pendentesBaixaConfianca: number;
  mensagem: string;
}
