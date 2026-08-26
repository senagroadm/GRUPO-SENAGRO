/**
 * ============================================================================
 * MÓDULO BANCÁRIO & COBRANÇA - TIPOS E INTERFACES
 * NEXUS ERP (Grupo TRITECH)
 * ============================================================================
 */

export type ProviderType =
  | 'MOCK'
  | 'ITAU_API'
  | 'BB_API'
  | 'BRADESCO_API'
  | 'SANTANDER_API'
  | 'SICOOB_API'
  | 'CNAB240'
  | 'CNAB400';

export type StatusCobranca =
  | 'GERADA'
  | 'REGISTRADA'
  | 'EM_ABERTO'
  | 'PAGA_TOTAL'
  | 'PAGA_PARCIAL'
  | 'BAIXADA'
  | 'CANCELADA'
  | 'PROTESTADA'
  | 'EXPIRADA';

export type TipoCobranca = 'BOLETO' | 'PIX' | 'BOLETO_HIBRIDO' | 'CARTAO';

export type TipoEventoCobranca =
  | 'CRIACAO'
  | 'REGISTRO_API'
  | 'CONSULTA_STATUS'
  | 'ALTERACAO_VENCIMENTO'
  | 'ALTERACAO_VALOR'
  | 'BAIXA_MANUAL'
  | 'BAIXA_RETORNO'
  | 'WEBHOOK_RECEBIDO'
  | 'ENVIO_EMAIL'
  | 'SEGUNDA_VIA_EMITIDA'
  | 'CANCELAMENTO';

export type TipoMovimentoFinanceiro = 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA';

export type OrigemMovimentoFinanceiro =
  | 'LIQUIDACAO_COBRANCA'
  | 'BAIXA_TITULO'
  | 'TRANSFERENCIA_CONTA'
  | 'SUPRIMENTO_CAIXA'
  | 'SANGRIA_CAIXA'
  | 'AJUSTE_SALDO'
  | 'TARIFA_BANCARIA';

export interface ContaBancaria {
  id: string;
  empresaId: string;
  bancoCodigo: string; // Ex: '341', '001', '237', '033', '756'
  bancoNome: string;
  descricao: string;
  agencia: string;
  agenciaDigito?: string;
  contaCorrente: string;
  contaDigito: string;
  carteira: string;
  convenio?: string;
  codigoBeneficiario?: string;
  chavePix?: string;
  tipoChavePix?: 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA';
  tipoConta: 'CONTA_CORRENTE' | 'POUPANCA' | 'APLICACAO';
  saldoAtual: number;
  saldoDisponivel: number;
  ambiente: 'SANDBOX' | 'PRODUCAO';
  metadataCredenciais?: Record<string, any>; // [TODO/BANCO-DEPENDENT]
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Caixa {
  id: string;
  empresaId: string;
  codigo: string;
  nome: string;
  tipo: 'TESOURARIA_CENTRAL' | 'FUNDO_FIXO' | 'CAIXA_CHAO_FABRICA';
  responsavelUsuarioId?: string;
  responsavelNome?: string;
  saldoAtual: number;
  status: 'ABERTO' | 'FECHADO' | 'BLOQUEADO';
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConfiguracaoCobranca {
  id: string;
  empresaId: string;
  contaBancariaId: string;
  descricao: string;
  providerType: ProviderType;
  jurosMensalPercentual: number;
  multaPercentual: number;
  diasProtesto: number;
  diasBaixaDevolucao: number;
  instrucao1: string;
  instrucao2: string;
  aceitaPixHibrido: boolean;
  webhookUrl?: string;
  webhookSecret?: string;
  ambiente: 'SANDBOX' | 'PRODUCAO';
  clientIdConfig?: string; // [TODO/BANCO-DEPENDENT]
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Cobranca {
  id: string;
  empresaId: string;
  contaBancariaId: string;
  tituloId?: string;
  configCobrancaId: string;
  nossoNumero: string;
  seuNumero: string;
  tipoCobranca: TipoCobranca;
  valorOriginal: number;
  valorDesconto: number;
  valorAcrescimos: number;
  valorCobrado: number;
  valorPago: number;
  dataEmissao: string; // YYYY-MM-DD
  dataVencimento: string; // YYYY-MM-DD
  dataLimitePagamento?: string;
  dataPagamento?: string;
  status: StatusCobranca;
  pagadorNome: string;
  pagadorCnpjCpf: string;
  pagadorEmail?: string;
  pagadorTelefone?: string;
  pagadorEnderecoCompleto?: string;
  pagadorCep?: string;
  pagadorCidade?: string;
  pagadorUf?: string;
  linhaDigitavel?: string;
  codigoBarras?: string;
  qrCodePix?: string; // Payload EMV / Copia e Cola
  qrCodeEmv?: string;
  txidPix?: string;
  urlPdf?: string;
  urlCheckout?: string;
  mensagemBanco?: string;
  protocoloBancario?: string;
  rawProviderPayload?: Record<string, any>;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  // Campos auxiliares para visualização
  contaBancariaNome?: string;
  bancoCodigo?: string;
  bancoNome?: string;
}

export interface CobrancaEvento {
  id: string;
  empresaId: string;
  cobrancaId: string;
  tipoEvento: TipoEventoCobranca;
  descricao: string;
  payloadBefore?: Record<string, any>;
  payloadAfter?: Record<string, any>;
  providerResponse?: Record<string, any>;
  usuarioId?: string;
  usuarioNome?: string;
  timestamp: string;
}

export interface MovimentoFinanceiro {
  id: string;
  empresaId: string;
  contaBancariaId?: string;
  caixaId?: string;
  cobrancaId?: string;
  tituloId?: string;
  tipoMovimento: TipoMovimentoFinanceiro;
  origemMovimento: OrigemMovimentoFinanceiro;
  valor: number;
  dataMovimento: string;
  dataCompetencia: string;
  descricao: string;
  saldoAnterior: number;
  saldoPosterior: number;
  conciliado: boolean;
  dataConciliacao?: string;
  documentoReferencia?: string;
  usuarioId?: string;
  createdAt: string;
}

// Interfaces de Entrada e Saída do Provider/Adapter
export interface GerarCobrancaInput {
  empresaId: string;
  contaBancaria: ContaBancaria;
  configuracao: ConfiguracaoCobranca;
  tituloId?: string;
  seuNumero: string;
  tipoCobranca: TipoCobranca;
  valorNominal: number;
  dataVencimento: string;
  pagador: {
    nome: string;
    cnpjCpf: string;
    email?: string;
    telefone?: string;
    enderecoCompleto?: string;
    cep?: string;
    cidade?: string;
    uf?: string;
  };
  jurosPercentual?: number;
  multaPercentual?: number;
  descontoValor?: number;
  instrucoes?: string[];
  usuarioId?: string;
  usuarioNome?: string;
}

export interface ResultadoCobranca {
  sucesso: boolean;
  nossoNumero: string;
  linhaDigitavel: string;
  codigoBarras: string;
  qrCodePix?: string;
  txidPix?: string;
  urlPdf?: string;
  mensagem?: string;
  protocoloBancario?: string;
  rawResponse?: Record<string, any>;
}

export interface RegistrarCobrancaInput {
  cobranca: Cobranca;
  contaBancaria: ContaBancaria;
  configuracao: ConfiguracaoCobranca;
}

export interface ResultadoRegistro {
  sucesso: boolean;
  statusRegistrado: StatusCobranca;
  protocoloBancario: string;
  mensagem: string;
  linhaDigitavel?: string;
  codigoBarras?: string;
  qrCodePix?: string;
  rawResponse?: Record<string, any>;
}

export interface ConsultarCobrancaInput {
  cobranca: Cobranca;
  contaBancaria: ContaBancaria;
  configuracao: ConfiguracaoCobranca;
}

export interface ResultadoConsulta {
  sucesso: boolean;
  statusAtual: StatusCobranca;
  valorPago?: number;
  dataPagamento?: string;
  mensagem: string;
  rawResponse?: Record<string, any>;
}

export interface AlterarCobrancaInput {
  cobranca: Cobranca;
  contaBancaria: ContaBancaria;
  configuracao: ConfiguracaoCobranca;
  novoVencimento?: string;
  novoValorCobrado?: number;
  novoDesconto?: number;
  motivo: string;
  usuarioId?: string;
  usuarioNome?: string;
}

export interface ResultadoAlteracao {
  sucesso: boolean;
  mensagem: string;
  novaLinhaDigitavel?: string;
  novoCodigoBarras?: string;
  rawResponse?: Record<string, any>;
}

export interface BaixarCobrancaInput {
  cobranca: Cobranca;
  contaBancaria: ContaBancaria;
  configuracao: ConfiguracaoCobranca;
  motivoBaixa: 'PAGAMENTO' | 'CANCELAMENTO_PEDIDO' | 'SUBSTITUICAO_TITULO' | 'DEVOLUCAO' | 'ACORDO_COMERCIAL';
  valorRecebido?: number;
  dataPagamento?: string;
  usuarioId?: string;
  usuarioNome?: string;
}

export interface ResultadoBaixa {
  sucesso: boolean;
  statusFinal: StatusCobranca;
  mensagem: string;
  rawResponse?: Record<string, any>;
}

export interface SegundaViaInput {
  cobranca: Cobranca;
  contaBancaria: ContaBancaria;
  configuracao: ConfiguracaoCobranca;
  novoVencimento?: string;
  incluirEncargosAtraso?: boolean;
}

export interface ResultadoSegundaVia {
  sucesso: boolean;
  linhaDigitavel: string;
  codigoBarras: string;
  qrCodePix?: string;
  urlPdf: string;
  valorAtualizado: number;
  dataVencimentoAtualizada: string;
}

export interface EnvioEmailInput {
  cobranca: Cobranca;
  destinatarioEmail: string;
  destinatarioNome: string;
  copiaEmails?: string[];
  assunto?: string;
  mensagemPersonalizada?: string;
  anexarPdfBoleto?: boolean;
}

export interface ResultadoEnvioEmail {
  sucesso: boolean;
  mensagemId: string;
  dataHoraEnvio: string;
  destinatario: string;
  mensagem: string;
}
