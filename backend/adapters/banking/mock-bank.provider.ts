import { IBancoAdapter } from './banco-adapter.interface';
import {
  GerarCobrancaInput,
  ResultadoCobranca,
  RegistrarCobrancaInput,
  ResultadoRegistro,
  ConsultarCobrancaInput,
  ResultadoConsulta,
  AlterarCobrancaInput,
  ResultadoAlteracao,
  BaixarCobrancaInput,
  ResultadoBaixa,
  SegundaViaInput,
  ResultadoSegundaVia,
  EnvioEmailInput,
  ResultadoEnvioEmail,
  ProviderType,
} from '../../modules/bancario/bancario-types';

/**
 * ============================================================================
 * UTILITÁRIOS MATEMÁTICOS DE COBRANÇA BANCÁRIA (PADRÃO FEBRABAN & BACEN)
 * ============================================================================
 */

/**
 * Calcula o Fator de Vencimento FEBRABAN a partir de 07/10/1997 (Fator 1000)
 */
export function calcularFatorVencimento(dataVencimentoStr: string): string {
  try {
    const dataVenc = new Date(dataVencimentoStr + 'T12:00:00Z');
    const dataBase = new Date('1997-10-07T12:00:00Z');
    const diffTime = dataVenc.getTime() - dataBase.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Tratamento de virada de fator após 22/02/2025 (Fator 9999)
    let fator = diffDays + 1000;
    if (fator > 9999) {
      fator = 1000 + (fator - 10000);
    }
    return String(Math.max(1000, fator)).padStart(4, '0');
  } catch {
    return '9999';
  }
}

/**
 * Calcula Dígito Verificador Módulo 10 (usado nos 3 primeiros campos da Linha Digitável)
 */
export function modulo10(bloco: string): number {
  let soma = 0;
  let multiplicador = 2;

  for (let i = bloco.length - 1; i >= 0; i--) {
    let parcial = parseInt(bloco.charAt(i), 10) * multiplicador;
    if (parcial > 9) {
      parcial = Math.floor(parcial / 10) + (parcial % 10);
    }
    soma += parcial;
    multiplicador = multiplicador === 2 ? 1 : 2;
  }

  const resto = soma % 10;
  return resto === 0 ? 0 : 10 - resto;
}

/**
 * Calcula Dígito Verificador Módulo 11 (usado no Código de Barras FEBRABAN de 44 dígitos)
 */
export function modulo11Febraban(bloco: string): number {
  let soma = 0;
  let peso = 2;

  for (let i = bloco.length - 1; i >= 0; i--) {
    soma += parseInt(bloco.charAt(i), 10) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }

  const resto = soma % 11;
  const dv = 11 - resto;
  if (dv === 0 || dv === 10 || dv === 11) {
    return 1;
  }
  return dv;
}

/**
 * Calcula CRC16 CCITT (0x1021) para o payload do PIX EMV (BR Code)
 */
export function calcularCrc16Pix(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Gera payload EMV PIX (BR Code Copia e Cola) compatível com padrão Banco Central
 */
export function gerarPayloadPixEmv(params: {
  chavePix: string;
  nomeRecebedor: string;
  cidade: string;
  valor: number;
  txid: string;
  descricao?: string;
}): string {
  const chave = params.chavePix.trim();
  const nome = params.nomeRecebedor.slice(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const cidade = params.cidade.slice(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const valorFormatado = params.valor.toFixed(2);
  const txid = params.txid.replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || 'TRITECH01';

  // Merchant Account Info (Tag 26)
  const gui = '0014br.gov.bcb.pix';
  const tagChave = `01${String(chave.length).padStart(2, '0')}${chave}`;
  const descTag = params.descricao
    ? `02${String(params.descricao.slice(0, 20).length).padStart(2, '0')}${params.descricao.slice(0, 20)}`
    : '';
  const maiContent = `${gui}${tagChave}${descTag}`;
  const maiTag = `26${String(maiContent.length).padStart(2, '0')}${maiContent}`;

  // Additional Data Field Template (Tag 62)
  const txidTag = `05${String(txid.length).padStart(2, '0')}${txid}`;
  const adfTag = `62${String(txidTag.length).padStart(2, '0')}${txidTag}`;

  // Montagem base do payload
  let payload =
    '000201' + // Payload Format Indicator
    '010212' + // Point of Initiation (12 = QR Dinâmico / 11 = Estático)
    maiTag +
    '52040000' + // MCC
    '5303986' + // Moeda 986 = Real
    `54${String(valorFormatado.length).padStart(2, '0')}${valorFormatado}` + // Valor
    '5802BR' + // País
    `59${String(nome.length).padStart(2, '0')}${nome}` + // Nome Recebedor
    `60${String(cidade.length).padStart(2, '0')}${cidade}` + // Cidade
    adfTag +
    '6304'; // CRC16 Header

  const crc = calcularCrc16Pix(payload);
  return payload + crc;
}

/**
 * ============================================================================
 * PROVIDER DE DESENVOLVIMENTO & HOMOLOGAÇÃO: MockBankProvider
 * Implementa de forma fidedigna todo o ciclo de vida bancário sem dependência externa
 * ============================================================================
 */
export class MockBankProvider implements IBancoAdapter {
  readonly providerType: ProviderType = 'MOCK';
  readonly bancoCodigo: string = '341';
  readonly bancoNome: string = 'Itaú Unibanco (Mock Sandbox)';

  constructor(bancoCodigo = '341', bancoNome = 'Itaú Unibanco (Mock Sandbox)') {
    this.bancoCodigo = bancoCodigo;
    this.bancoNome = bancoNome;
  }

  async gerarCobranca(input: GerarCobrancaInput): Promise<ResultadoCobranca> {
    const bancoCod = (input.contaBancaria.bancoCodigo || this.bancoCodigo).padStart(3, '0');
    const moeda = '9'; // Real
    const fatorVenc = calcularFatorVencimento(input.dataVencimento);
    const valorCentavos = Math.round(input.valorNominal * 100);
    const valorStr = String(valorCentavos).padStart(10, '0');

    // Nosso Número: Carteira (3) + Sequencial (8)
    const sequencialNossoNum = Math.floor(10000000 + Math.random() * 90000000).toString();
    const carteira = (input.contaBancaria.carteira || '109').padStart(3, '0');
    const nossoNumero = `${carteira}/${sequencialNossoNum}`;

    // Campo Livre FEBRABAN (25 posições): Carteira (3) + Nosso Número (8) + Agência (4) + Conta (7) + Zero (3)
    const agencia = input.contaBancaria.agencia.replace(/\D/g, '').padStart(4, '0');
    const conta = input.contaBancaria.contaCorrente.replace(/\D/g, '').padStart(7, '0');
    const campoLivre = `${carteira}${sequencialNossoNum}${agencia}${conta}000`.slice(0, 25);

    // 1. Código de Barras (44 dígitos)
    // Posições: 01-03(Banco) 04(Moeda) 05(DV) 06-09(Fator) 10-19(Valor) 20-44(CampoLivre)
    const semDv = `${bancoCod}${moeda}${fatorVenc}${valorStr}${campoLivre}`;
    const dvGeral = modulo11Febraban(semDv);
    const codigoBarras = `${bancoCod}${moeda}${dvGeral}${fatorVenc}${valorStr}${campoLivre}`;

    // 2. Linha Digitável (47 dígitos / 5 campos)
    // Campo 1: Banco(3) + Moeda(1) + CampoLivre[0..4](5) + DV1(1)
    const c1SemDv = `${bancoCod}${moeda}${campoLivre.slice(0, 5)}`;
    const dv1 = modulo10(c1SemDv);
    const campo1 = `${c1SemDv.slice(0, 5)}.${c1SemDv.slice(5, 9)}${dv1}`;

    // Campo 2: CampoLivre[5..14](10) + DV2(1)
    const c2SemDv = campoLivre.slice(5, 15);
    const dv2 = modulo10(c2SemDv);
    const campo2 = `${c2SemDv.slice(0, 5)}.${c2SemDv.slice(5, 10)}${dv2}`;

    // Campo 3: CampoLivre[15..24](10) + DV3(1)
    const c3SemDv = campoLivre.slice(15, 25);
    const dv3 = modulo10(c3SemDv);
    const campo3 = `${c3SemDv.slice(0, 5)}.${c3SemDv.slice(5, 10)}${dv3}`;

    // Campo 4: DV Geral Código de Barras (1)
    const campo4 = `${dvGeral}`;

    // Campo 5: Fator de Vencimento (4) + Valor (10)
    const campo5 = `${fatorVenc}${valorStr}`;

    const linhaDigitavel = `${campo1} ${campo2} ${campo3} ${campo4} ${campo5}`;

    // 3. QR Code PIX (Boleto Híbrido)
    const chavePix = input.contaBancaria.chavePix || `${input.empresaId}@pix.tritech.com.br`;
    const txid = `TRI${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100)}`;
    const qrCodePix = gerarPayloadPixEmv({
      chavePix,
      nomeRecebedor: 'TRITECH IND METAL',
      cidade: 'JOINVILLE',
      valor: input.valorNominal,
      txid,
      descricao: `Cobrança ${input.seuNumero}`,
    });

    return {
      sucesso: true,
      nossoNumero,
      linhaDigitavel,
      codigoBarras,
      qrCodePix,
      txidPix: txid,
      urlPdf: `https://nexus-erp.tritech.com.br/boletos/pdf/${nossoNumero.replace('/', '-')}`,
      protocoloBancario: `PROTO-MOCK-${Date.now()}`,
      mensagem: 'Cobrança gerada com sucesso via MockBankProvider.',
      rawResponse: {
        engine: 'MockBankProvider-v2.5',
        fatorVencimento: fatorVenc,
        campoLivre,
        dvGeral,
        geradoEm: new Date().toISOString(),
      },
    };
  }

  async registrarCobranca(input: RegistrarCobrancaInput): Promise<ResultadoRegistro> {
    // Simula registro síncrono no webservice do banco
    const protocolo = `REG-${input.cobranca.contaBancariaId.slice(0, 4).toUpperCase()}-${Date.now()}`;
    return {
      sucesso: true,
      statusRegistrado: 'REGISTRADA',
      protocoloBancario: protocolo,
      mensagem: `Boleto ${input.cobranca.nossoNumero} registrado com sucesso no ${this.bancoNome} (Ambiente ${input.configuracao.ambiente}).`,
      linhaDigitavel: input.cobranca.linhaDigitavel,
      codigoBarras: input.cobranca.codigoBarras,
      qrCodePix: input.cobranca.qrCodePix,
      rawResponse: {
        codigoRetorno: '00',
        mensagemRetorno: 'OPERACAO REALIZADA COM SUCESSO - TITULO REGISTRADO EM CARTEIRA',
        timestampRegistro: new Date().toISOString(),
        convenioUtilizado: input.contaBancaria.convenio || 'CONV-998877',
      },
    };
  }

  async consultarCobranca(input: ConsultarCobrancaInput): Promise<ResultadoConsulta> {
    // Simula consulta de status no banco
    return {
      sucesso: true,
      statusAtual: input.cobranca.status === 'GERADA' ? 'REGISTRADA' : input.cobranca.status,
      valorPago: input.cobranca.status === 'PAGA_TOTAL' ? input.cobranca.valorCobrado : 0,
      dataPagamento: input.cobranca.dataPagamento,
      mensagem: `Consulta realizada com sucesso. Título ${input.cobranca.nossoNumero} está com status ${input.cobranca.status}.`,
      rawResponse: {
        situacaoTitulo: 'EM_ABERTO',
        diasAtraso: 0,
        jurosAcumulados: 0,
        saldoEmAberto: input.cobranca.valorCobrado,
        dataUltimaConsulta: new Date().toISOString(),
      },
    };
  }

  async alterarCobranca(input: AlterarCobrancaInput): Promise<ResultadoAlteracao> {
    // Recalcula linha digitável e código de barras se houver alteração de vencimento ou valor
    let novaLinha = input.cobranca.linhaDigitavel;
    let novoBarras = input.cobranca.codigoBarras;

    if (input.novoVencimento || input.novoValorCobrado) {
      const venc = input.novoVencimento || input.cobranca.dataVencimento;
      const valor = input.novoValorCobrado || input.cobranca.valorCobrado;
      const novaCobranca = await this.gerarCobranca({
        empresaId: input.cobranca.empresaId,
        contaBancaria: input.contaBancaria,
        configuracao: input.configuracao,
        seuNumero: input.cobranca.seuNumero,
        tipoCobranca: input.cobranca.tipoCobranca,
        valorNominal: valor,
        dataVencimento: venc,
        pagador: {
          nome: input.cobranca.pagadorNome,
          cnpjCpf: input.cobranca.pagadorCnpjCpf,
        },
      });
      novaLinha = novaCobranca.linhaDigitavel;
      novoBarras = novaCobranca.codigoBarras;
    }

    return {
      sucesso: true,
      mensagem: `Instrução de alteração acatada pelo ${this.bancoNome}. Motivo: ${input.motivo}.`,
      novaLinhaDigitavel: novaLinha,
      novoCodigoBarras: novoBarras,
      rawResponse: {
        protocoloAlteracao: `ALT-${Date.now()}`,
        statusInstrucao: 'PROCESSADA',
        motivoRegistrado: input.motivo,
      },
    };
  }

  async baixarCobranca(input: BaixarCobrancaInput): Promise<ResultadoBaixa> {
    const statusFinal = input.motivoBaixa === 'PAGAMENTO' ? 'PAGA_TOTAL' : 'BAIXADA';
    return {
      sucesso: true,
      statusFinal,
      mensagem: `Comando de baixa processado com sucesso no ${this.bancoNome}. Motivo: ${input.motivoBaixa}.`,
      rawResponse: {
        protocoloBaixa: `BX-${Date.now()}`,
        dataEfetivacao: new Date().toISOString(),
        tipoBaixa: input.motivoBaixa,
      },
    };
  }

  async gerarSegundaVia(input: SegundaViaInput): Promise<ResultadoSegundaVia> {
    const dataVenc = input.novoVencimento || input.cobranca.dataVencimento;
    let valorFinal = input.cobranca.valorCobrado;

    // Se estiver vencido e optar por incluir encargos
    if (input.incluirEncargosAtraso) {
      const hoje = new Date().toISOString().split('T')[0];
      if (input.cobranca.dataVencimento < hoje) {
        const juros = (input.configuracao.jurosMensalPercentual / 30) * 5 * (valorFinal / 100);
        const multa = (input.configuracao.multaPercentual / 100) * valorFinal;
        valorFinal = Math.round((valorFinal + juros + multa) * 100) / 100;
      }
    }

    const resultado = await this.gerarCobranca({
      empresaId: input.cobranca.empresaId,
      contaBancaria: input.contaBancaria,
      configuracao: input.configuracao,
      seuNumero: `${input.cobranca.seuNumero}-2VIA`,
      tipoCobranca: input.cobranca.tipoCobranca,
      valorNominal: valorFinal,
      dataVencimento: dataVenc,
      pagador: {
        nome: input.cobranca.pagadorNome,
        cnpjCpf: input.cobranca.pagadorCnpjCpf,
      },
    });

    return {
      sucesso: true,
      linhaDigitavel: resultado.linhaDigitavel,
      codigoBarras: resultado.codigoBarras,
      qrCodePix: resultado.qrCodePix,
      urlPdf: `https://nexus-erp.tritech.com.br/boletos/2via/${input.cobranca.nossoNumero.replace('/', '-')}`,
      valorAtualizado: valorFinal,
      dataVencimentoAtualizada: dataVenc,
    };
  }

  async enviarEmailCobranca(input: EnvioEmailInput): Promise<ResultadoEnvioEmail> {
    // Simulação do serviço de disparo de e-mails transacionais (SES / SendGrid / SMTP Corporativo)
    const msgId = `MSG-COB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return {
      sucesso: true,
      mensagemId: msgId,
      dataHoraEnvio: new Date().toISOString(),
      destinatario: input.destinatarioEmail,
      mensagem: `Boleto e QR Code PIX enviados com sucesso para ${input.destinatarioNome} <${input.destinatarioEmail}>.`,
    };
  }
}
