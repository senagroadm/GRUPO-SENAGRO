/**
 * ============================================================================
 * SERVIÇO BANCÁRIO & COBRANÇA MULTIEMPRESA (NEXUS ERP - GRUPO TRITECH)
 * ============================================================================
 * Implementa a autoridade de negócio para:
 * - Contas Bancárias e Caixas Fabris
 * - Configurações de Cobrança por Provedor (Itaú, BB, Bradesco, Santander, Sicoob, Mock)
 * - Cobranças (Boletos, PIX, Boletos Híbridos)
 * - Trilha de Auditoria e Eventos de Cobrança
 * - Movimentos Financeiros e Conciliação Bancária
 *
 * RASTREABILIDADE OBRIGATÓRIA:
 * [ EMPRESA ] ➔ [ CONTA BANCÁRIA ] ➔ [ TÍTULO A RECEBER ] ➔ [ COBRANÇA ]
 * ============================================================================
 */

import {
  ContaBancaria,
  Caixa,
  ConfiguracaoCobranca,
  Cobranca,
  CobrancaEvento,
  MovimentoFinanceiro,
  TipoCobranca,
  StatusCobranca,
  TipoEventoCobranca,
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
} from './bancario-types';
import { BillingProviderFactory } from '../../adapters/banking/billing-provider.factory';
import { EMPRESAS_GRUPO } from '../../core/types/company';

class BancarioService {
  // In-Memory multi-tenant stores (key = empresaId)
  private contasBancarias: Map<string, ContaBancaria[]> = new Map();
  private caixas: Map<string, Caixa[]> = new Map();
  private configsCobranca: Map<string, ConfiguracaoCobranca[]> = new Map();
  private cobrancas: Map<string, Cobranca[]> = new Map();
  private cobrancaEventos: Map<string, CobrancaEvento[]> = new Map();
  private movimentos: Map<string, MovimentoFinanceiro[]> = new Map();

  constructor() {
    this.seedInitialData();
  }

  /**
   * Inicialização com dados mestres corporativos para os 5 CNPJs do Grupo TRITECH
   */
  private seedInitialData() {
    EMPRESAS_GRUPO.forEach((empresa) => {
      const empId = empresa.id;

      // 1. Contas Bancárias por Empresa
      const contas: ContaBancaria[] = [
        {
          id: `cta-itau-${empresa.codigo.toLowerCase()}`,
          empresaId: empId,
          bancoCodigo: '341',
          bancoNome: 'Banco Itaú Unibanco S.A.',
          descricao: `Itaú Principal - ${empresa.nomeFantasia}`,
          agencia: '0435',
          contaCorrente: '91020',
          contaDigito: '8',
          carteira: '109',
          convenio: `CONV-ITAU-${empresa.codigo}`,
          codigoBeneficiario: `0435910208`,
          chavePix: `${empresa.cnpj.replace(/\D/g, '')}@pix.itau.com.br`,
          tipoChavePix: 'CNPJ',
          tipoConta: 'CONTA_CORRENTE',
          saldoAtual: 345800.50,
          saldoDisponivel: 320000.00,
          ambiente: 'SANDBOX',
          metadataCredenciais: {
            clientId: `itau-client-${empresa.codigo.toLowerCase()}`,
            hasCertificate: true,
          },
          ativo: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `cta-bb-${empresa.codigo.toLowerCase()}`,
          empresaId: empId,
          bancoCodigo: '001',
          bancoNome: 'Banco do Brasil S.A.',
          descricao: `BB Cobrança Agro & Ind - ${empresa.nomeFantasia}`,
          agencia: '3128',
          agenciaDigito: '9',
          contaCorrente: '48291',
          contaDigito: '2',
          carteira: '17',
          convenio: `3128557`,
          codigoBeneficiario: '3128557',
          chavePix: `financeiro@${empresa.codigo.toLowerCase()}.tritech.com.br`,
          tipoChavePix: 'EMAIL',
          tipoConta: 'CONTA_CORRENTE',
          saldoAtual: 189400.00,
          saldoDisponivel: 185000.00,
          ambiente: 'SANDBOX',
          metadataCredenciais: {
            developerKey: 'dev-bb-gw-key-998822',
          },
          ativo: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `cta-sicoob-${empresa.codigo.toLowerCase()}`,
          empresaId: empId,
          bancoCodigo: '756',
          bancoNome: 'Bancoob / Sicoob Confederação',
          descricao: `Sicoob Cooperativa Fabril - ${empresa.nomeFantasia}`,
          agencia: '3007',
          contaCorrente: '72918',
          contaDigito: '5',
          carteira: '01',
          convenio: `COOP-SC-3007`,
          chavePix: `+5547999881122`,
          tipoChavePix: 'TELEFONE',
          tipoConta: 'CONTA_CORRENTE',
          saldoAtual: 92350.20,
          saldoDisponivel: 92350.20,
          ambiente: 'SANDBOX',
          ativo: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      this.contasBancarias.set(empId, contas);

      // 2. Caixas da Empresa
      const caixasEmpresa: Caixa[] = [
        {
          id: `cx-tesouraria-${empresa.codigo.toLowerCase()}`,
          empresaId: empId,
          codigo: 'CX-01-TESOURARIA',
          nome: `Tesouraria Central - ${empresa.nomeFantasia}`,
          tipo: 'TESOURARIA_CENTRAL',
          responsavelNome: 'Rogério Medeiros (Tesouraria)',
          saldoAtual: 15400.00,
          status: 'ABERTO',
          ativo: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `cx-fabrica-${empresa.codigo.toLowerCase()}`,
          empresaId: empId,
          codigo: 'CX-02-CHAO-FABRICA',
          nome: `Fundo Fixo Manutenção & Fábrica - ${empresa.nomeFantasia}`,
          tipo: 'CAIXA_CHAO_FABRICA',
          responsavelNome: 'Marcio Silva (Coord. Fábrica)',
          saldoAtual: 3200.00,
          status: 'ABERTO',
          ativo: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      this.caixas.set(empId, caixasEmpresa);

      // 3. Configurações de Cobrança por Conta
      const configs: ConfiguracaoCobranca[] = [
        {
          id: `cfg-itau-${empresa.codigo.toLowerCase()}`,
          empresaId: empId,
          contaBancariaId: contas[0].id,
          descricao: 'Itaú API Cobrança v2 (Boleto Híbrido + PIX)',
          providerType: 'MOCK',
          jurosMensalPercentual: 1.0,
          multaPercentual: 2.0,
          diasProtesto: 0,
          diasBaixaDevolucao: 30,
          instrucao1: 'NÃO RECEBER APÓS 30 DIAS DO VENCIMENTO.',
          instrucao2: 'APÓS O VENCIMENTO COBRAR JUROS DE 1% A.M. E MULTA DE 2%.',
          aceitaPixHibrido: true,
          webhookUrl: `https://api.nexus-erp.tritech.com.br/api/cobrancas/webhook/itau?empresa=${empId}`,
          webhookSecret: 'whsec_itau_998877_live_mock',
          ambiente: 'SANDBOX',
          ativo: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `cfg-bb-${empresa.codigo.toLowerCase()}`,
          empresaId: empId,
          contaBancariaId: contas[1].id,
          descricao: 'Banco do Brasil API v2 (Convênio 3128557)',
          providerType: 'MOCK',
          jurosMensalPercentual: 1.0,
          multaPercentual: 2.0,
          diasProtesto: 5,
          diasBaixaDevolucao: 30,
          instrucao1: 'PROTESTAR NO 5º DIA ÚTIL APÓS O VENCIMENTO.',
          instrucao2: 'RECEBÍVEL EM TODA A REDE BANCÁRIA ATÉ O VENCIMENTO.',
          aceitaPixHibrido: true,
          ambiente: 'SANDBOX',
          ativo: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      this.configsCobranca.set(empId, configs);

      // 4. Cobranças Iniciais de Demonstração
      const cobrancasIniciais: Cobranca[] = [
        {
          id: `cob-${empresa.codigo.toLowerCase()}-001`,
          empresaId: empId,
          contaBancariaId: contas[0].id,
          tituloId: `tit-ar-001`,
          configCobrancaId: configs[0].id,
          nossoNumero: '109/24891823',
          seuNumero: `FAT-${empresa.codigo}-8901/01`,
          tipoCobranca: 'BOLETO_HIBRIDO',
          valorOriginal: 14850.00,
          valorDesconto: 0,
          valorAcrescimos: 0,
          valorCobrado: 14850.00,
          valorPago: 0,
          dataEmissao: new Date().toISOString().split('T')[0],
          dataVencimento: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
          status: 'REGISTRADA',
          pagadorNome: 'WEG Equipamentos Elétricos S.A.',
          pagadorCnpjCpf: '07.175.725/0001-63',
          pagadorEmail: 'financeiro.contas@weg.net',
          pagadorTelefone: '(47) 3276-4000',
          pagadorEnderecoCompleto: 'Av. Prefeito Waldemar Grubba, 3300 - Vila Lalau',
          pagadorCep: '89256-900',
          pagadorCidade: 'Jaraguá do Sul',
          pagadorUf: 'SC',
          linhaDigitavel: '34191.79001 01043.510047 91020.150008 5 99990001485000',
          codigoBarras: '341959999000014850001790001043510049102015000',
          qrCodePix: '00020126580014BR.GOV.BCB.PIX0136' + empId + '520400005303986540814850.005802BR5915TRITECH IND MET6009JOINVILLE62190515WEG-FAT-8901-016304ABCD',
          txidPix: 'WEGFAT890101',
          urlPdf: 'https://nexus-erp.tritech.com.br/boletos/pdf/109-24891823',
          protocoloBancario: `REG-ITAU-${Date.now()}`,
          bancoCodigo: '341',
          bancoNome: 'Banco Itaú Unibanco S.A.',
          contaBancariaNome: contas[0].descricao,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `cob-${empresa.codigo.toLowerCase()}-002`,
          empresaId: empId,
          contaBancariaId: contas[1].id,
          tituloId: `tit-ar-002`,
          configCobrancaId: configs[1].id,
          nossoNumero: '017/99182736',
          seuNumero: `FAT-${empresa.codigo}-8902/01`,
          tipoCobranca: 'BOLETO_HIBRIDO',
          valorOriginal: 28900.00,
          valorDesconto: 0,
          valorAcrescimos: 0,
          valorCobrado: 28900.00,
          valorPago: 28900.00,
          dataEmissao: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
          dataVencimento: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
          dataPagamento: new Date().toISOString(),
          status: 'PAGA_TOTAL',
          pagadorNome: 'SCHULZ S.A. Compressores & Automotivo',
          pagadorCnpjCpf: '84.693.183/0001-68',
          pagadorEmail: 'contas.pagar@schulz.com.br',
          pagadorTelefone: '(47) 3451-6000',
          pagadorEnderecoCompleto: 'Rua Dona Francisca, 6901 - Zona Industrial Norte',
          pagadorCep: '89219-600',
          pagadorCidade: 'Joinville',
          pagadorUf: 'SC',
          linhaDigitavel: '00191.00009 01799.182738 60000.000001 8 99990002890000',
          codigoBarras: '0019899990000289000010000017991827360000000000',
          qrCodePix: '00020126580014BR.GOV.BCB.PIX0136' + empId + '520400005303986540828900.005802BR5915TRITECH IND MET6009JOINVILLE62190515SCHULZ-8902-016304EF01',
          txidPix: 'SCHULZ890201',
          urlPdf: 'https://nexus-erp.tritech.com.br/boletos/pdf/017-99182736',
          protocoloBancario: `REG-BB-${Date.now()}`,
          bancoCodigo: '001',
          bancoNome: 'Banco do Brasil S.A.',
          contaBancariaNome: contas[1].descricao,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      this.cobrancas.set(empId, cobrancasIniciais);

      // 5. Eventos das Cobranças Iniciais
      const eventos: CobrancaEvento[] = [
        {
          id: `evt-${Date.now()}-1`,
          empresaId: empId,
          cobrancaId: cobrancasIniciais[0].id,
          tipoEvento: 'CRIACAO',
          descricao: 'Cobrança gerada a partir do Título a Receber FAT-8901/01.',
          usuarioNome: 'Sistema Automático / SoD',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: `evt-${Date.now()}-2`,
          empresaId: empId,
          cobrancaId: cobrancasIniciais[0].id,
          tipoEvento: 'REGISTRO_API',
          descricao: 'Boleto e QR Code PIX registrados com sucesso no Itaú Cobrança v2.',
          providerResponse: { protocolo: cobrancasIniciais[0].protocoloBancario },
          usuarioNome: 'Robô de Integração Bancária',
          timestamp: new Date().toISOString(),
        },
        {
          id: `evt-${Date.now()}-3`,
          empresaId: empId,
          cobrancaId: cobrancasIniciais[1].id,
          tipoEvento: 'BAIXA_RETORNO',
          descricao: 'Liquidação total de R$ 28.900,00 via PIX QR Code Dinâmico.',
          providerResponse: { canal: 'PIX_BACEN', liquidadoEm: new Date().toISOString() },
          usuarioNome: 'Webhook Santander / BB',
          timestamp: new Date().toISOString(),
        },
      ];
      this.cobrancaEventos.set(empId, eventos);

      // 6. Movimentos Financeiros
      const movs: MovimentoFinanceiro[] = [
        {
          id: `mov-${Date.now()}-1`,
          empresaId: empId,
          contaBancariaId: contas[1].id,
          cobrancaId: cobrancasIniciais[1].id,
          tipoMovimento: 'ENTRADA',
          origemMovimento: 'LIQUIDACAO_COBRANCA',
          valor: 28900.00,
          dataMovimento: new Date().toISOString().split('T')[0],
          dataCompetencia: new Date().toISOString().split('T')[0],
          descricao: `Liquidação de Cobrança ${cobrancasIniciais[1].nossoNumero} - Schulz S.A.`,
          saldoAnterior: 160500.00,
          saldoPosterior: 189400.00,
          conciliado: true,
          dataConciliacao: new Date().toISOString(),
          documentoReferencia: cobrancasIniciais[1].seuNumero,
          usuarioId: 'u-sistema',
          createdAt: new Date().toISOString(),
        },
      ];
      this.movimentos.set(empId, movs);
    });
  }

  // ==========================================================================
  // MÉTODOS DE CONTAS BANCÁRIAS E CAIXAS
  // ==========================================================================

  getContasBancarias(empresaId: string): ContaBancaria[] {
    return (this.contasBancarias.get(empresaId) || []).filter((c) => c.ativo);
  }

  getContaBancariaById(empresaId: string, contaId: string): ContaBancaria | undefined {
    return (this.contasBancarias.get(empresaId) || []).find((c) => c.id === contaId);
  }

  salvarContaBancaria(empresaId: string, dados: Partial<ContaBancaria>): ContaBancaria {
    const contas = this.contasBancarias.get(empresaId) || [];
    let conta: ContaBancaria;

    if (dados.id) {
      const idx = contas.findIndex((c) => c.id === dados.id);
      if (idx >= 0) {
        conta = {
          ...contas[idx],
          ...dados,
          updatedAt: new Date().toISOString(),
        } as ContaBancaria;
        contas[idx] = conta;
      } else {
        throw new Error(`Conta bancária ${dados.id} não encontrada.`);
      }
    } else {
      conta = {
        id: `cta-${Date.now()}`,
        empresaId,
        bancoCodigo: dados.bancoCodigo || '341',
        bancoNome: dados.bancoNome || 'Banco Itaú',
        descricao: dados.descricao || 'Nova Conta Corrente',
        agencia: dados.agencia || '0001',
        agenciaDigito: dados.agenciaDigito,
        contaCorrente: dados.contaCorrente || '12345',
        contaDigito: dados.contaDigito || '0',
        carteira: dados.carteira || '109',
        convenio: dados.convenio,
        codigoBeneficiario: dados.codigoBeneficiario,
        chavePix: dados.chavePix,
        tipoChavePix: dados.tipoChavePix || 'CNPJ',
        tipoConta: dados.tipoConta || 'CONTA_CORRENTE',
        saldoAtual: dados.saldoAtual || 0,
        saldoDisponivel: dados.saldoDisponivel || 0,
        ambiente: dados.ambiente || 'SANDBOX',
        metadataCredenciais: dados.metadataCredenciais || {},
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      contas.push(conta);
    }

    this.contasBancarias.set(empresaId, contas);
    return conta;
  }

  getCaixas(empresaId: string): Caixa[] {
    return (this.caixas.get(empresaId) || []).filter((c) => c.ativo);
  }

  getConfigsCobranca(empresaId: string): ConfiguracaoCobranca[] {
    return (this.configsCobranca.get(empresaId) || []).filter((c) => c.ativo);
  }

  salvarConfigCobranca(empresaId: string, dados: Partial<ConfiguracaoCobranca>): ConfiguracaoCobranca {
    const configs = this.configsCobranca.get(empresaId) || [];
    let config: ConfiguracaoCobranca;

    if (dados.id) {
      const idx = configs.findIndex((c) => c.id === dados.id);
      if (idx >= 0) {
        config = {
          ...configs[idx],
          ...dados,
          updatedAt: new Date().toISOString(),
        } as ConfiguracaoCobranca;
        configs[idx] = config;
      } else {
        throw new Error(`Configuração ${dados.id} não encontrada.`);
      }
    } else {
      config = {
        id: `cfg-${Date.now()}`,
        empresaId,
        contaBancariaId: dados.contaBancariaId!,
        descricao: dados.descricao || 'Configuração Padrão',
        providerType: dados.providerType || 'MOCK',
        jurosMensalPercentual: dados.jurosMensalPercentual ?? 1.0,
        multaPercentual: dados.multaPercentual ?? 2.0,
        diasProtesto: dados.diasProtesto ?? 0,
        diasBaixaDevolucao: dados.diasBaixaDevolucao ?? 30,
        instrucao1: dados.instrucao1 || 'NÃO RECEBER APÓS O VENCIMENTO.',
        instrucao2: dados.instrucao2 || 'APÓS O VENCIMENTO COBRAR ENCARGOS CONTRATUAIS.',
        aceitaPixHibrido: dados.aceitaPixHibrido ?? true,
        webhookUrl: dados.webhookUrl,
        webhookSecret: dados.webhookSecret,
        ambiente: dados.ambiente || 'SANDBOX',
        clientIdConfig: dados.clientIdConfig,
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      configs.push(config);
    }

    this.configsCobranca.set(empresaId, configs);
    return config;
  }

  // ==========================================================================
  // FUNÇÕES CORE DE COBRANÇA BANCÁRIA
  // ==========================================================================

  getCobrancas(empresaId: string): Cobranca[] {
    const list = this.cobrancas.get(empresaId) || [];
    const contas = this.getContasBancarias(empresaId);
    
    // Anexa dados visuais da conta bancária
    return list.map((cob) => {
      const conta = contas.find((c) => c.id === cob.contaBancariaId);
      return {
        ...cob,
        contaBancariaNome: conta ? conta.descricao : 'Conta Bancária',
        bancoCodigo: conta?.bancoCodigo,
        bancoNome: conta?.bancoNome,
      };
    });
  }

  getCobrancaById(empresaId: string, cobrancaId: string): Cobranca | undefined {
    const cobrancas = this.getCobrancas(empresaId);
    return cobrancas.find((c) => c.id === cobrancaId);
  }

  getEventosCobranca(empresaId: string, cobrancaId?: string): CobrancaEvento[] {
    const eventos = this.cobrancaEventos.get(empresaId) || [];
    if (cobrancaId) {
      return eventos.filter((e) => e.cobrancaId === cobrancaId).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }
    return eventos.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  /**
   * 1. GERAR BOLETO / COBRANÇA (Vínculo: Empresa + Conta Bancária + Título + Cobrança)
   */
  async gerarCobranca(
    empresaId: string,
    params: {
      contaBancariaId: string;
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
      usuarioId?: string;
      usuarioNome?: string;
      registrarAutomatico?: boolean;
    }
  ): Promise<{ cobranca: Cobranca; resultado: ResultadoCobranca }> {
    const conta = this.getContaBancariaById(empresaId, params.contaBancariaId);
    if (!conta) {
      throw new Error(`Conta bancária ${params.contaBancariaId} não encontrada para a empresa ${empresaId}.`);
    }

    const configs = this.getConfigsCobranca(empresaId);
    const config = configs.find((c) => c.contaBancariaId === conta.id) || configs[0];
    if (!config) {
      throw new Error(`Nenhuma configuração de cobrança vinculada à conta ${conta.descricao}.`);
    }

    // Instancia o adapter apropriado pelo padrão Factory
    const provider = BillingProviderFactory.getProvider(
      config.providerType,
      conta.bancoCodigo,
      conta.bancoNome
    );

    const inputGeracao: GerarCobrancaInput = {
      empresaId,
      contaBancaria: conta,
      configuracao: config,
      tituloId: params.tituloId,
      seuNumero: params.seuNumero,
      tipoCobranca: params.tipoCobranca,
      valorNominal: params.valorNominal,
      dataVencimento: params.dataVencimento,
      pagador: params.pagador,
      jurosPercentual: config.jurosMensalPercentual,
      multaPercentual: config.multaPercentual,
      usuarioId: params.usuarioId,
      usuarioNome: params.usuarioNome,
    };

    const resultado = await provider.gerarCobranca(inputGeracao);

    const novaCobranca: Cobranca = {
      id: `cob-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      empresaId,
      contaBancariaId: conta.id,
      tituloId: params.tituloId,
      configCobrancaId: config.id,
      nossoNumero: resultado.nossoNumero,
      seuNumero: params.seuNumero,
      tipoCobranca: params.tipoCobranca,
      valorOriginal: params.valorNominal,
      valorDesconto: 0,
      valorAcrescimos: 0,
      valorCobrado: params.valorNominal,
      valorPago: 0,
      dataEmissao: new Date().toISOString().split('T')[0],
      dataVencimento: params.dataVencimento,
      status: 'GERADA',
      pagadorNome: params.pagador.nome,
      pagadorCnpjCpf: params.pagador.cnpjCpf,
      pagadorEmail: params.pagador.email,
      pagadorTelefone: params.pagador.telefone,
      pagadorEnderecoCompleto: params.pagador.enderecoCompleto,
      pagadorCep: params.pagador.cep,
      pagadorCidade: params.pagador.cidade,
      pagadorUf: params.pagador.uf,
      linhaDigitavel: resultado.linhaDigitavel,
      codigoBarras: resultado.codigoBarras,
      qrCodePix: resultado.qrCodePix,
      txidPix: resultado.txidPix,
      urlPdf: resultado.urlPdf,
      protocoloBancario: resultado.protocoloBancario,
      rawProviderPayload: resultado.rawResponse,
      createdBy: params.usuarioId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contaBancariaNome: conta.descricao,
      bancoCodigo: conta.bancoCodigo,
      bancoNome: conta.bancoNome,
    };

    const cobrancas = this.cobrancas.get(empresaId) || [];
    cobrancas.unshift(novaCobranca);
    this.cobrancas.set(empresaId, cobrancas);

    // Registra Evento de Criação
    this.registrarEvento(empresaId, {
      cobrancaId: novaCobranca.id,
      tipoEvento: 'CRIACAO',
      descricao: `Cobrança ${novaCobranca.nossoNumero} emitida para ${novaCobranca.pagadorNome} no valor de R$ ${novaCobranca.valorCobrado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      payloadAfter: novaCobranca,
      usuarioId: params.usuarioId,
      usuarioNome: params.usuarioNome || 'Operador Financeiro',
    });

    // Registro automático na API se solicitado
    if (params.registrarAutomatico) {
      await this.registrarCobranca(empresaId, novaCobranca.id, params.usuarioId, params.usuarioNome);
    }

    return { cobranca: novaCobranca, resultado };
  }

  /**
   * 2. REGISTRAR COBRANÇA NO BANCO (Aciona API / Adapter)
   */
  async registrarCobranca(
    empresaId: string,
    cobrancaId: string,
    usuarioId?: string,
    usuarioNome?: string
  ): Promise<ResultadoRegistro> {
    const cobranca = this.getCobrancaById(empresaId, cobrancaId);
    if (!cobranca) throw new Error('Cobrança não encontrada.');

    const conta = this.getContaBancariaById(empresaId, cobranca.contaBancariaId)!;
    const configs = this.getConfigsCobranca(empresaId);
    const config = configs.find((c) => c.id === cobranca.configCobrancaId) || configs[0];

    const provider = BillingProviderFactory.getProvider(config.providerType, conta.bancoCodigo, conta.bancoNome);
    const resultado = await provider.registrarCobranca({
      cobranca,
      contaBancaria: conta,
      configuracao: config,
    });

    if (resultado.sucesso) {
      cobranca.status = resultado.statusRegistrado;
      cobranca.protocoloBancario = resultado.protocoloBancario;
      cobranca.updatedAt = new Date().toISOString();

      this.registrarEvento(empresaId, {
        cobrancaId: cobranca.id,
        tipoEvento: 'REGISTRO_API',
        descricao: resultado.mensagem,
        providerResponse: resultado.rawResponse || { protocolo: resultado.protocoloBancario },
        usuarioId,
        usuarioNome: usuarioNome || 'Sistema / Adapter',
      });
    }

    return resultado;
  }

  /**
   * 3. CONSULTAR STATUS DA COBRANÇA
   */
  async consultarCobranca(empresaId: string, cobrancaId: string): Promise<ResultadoConsulta> {
    const cobranca = this.getCobrancaById(empresaId, cobrancaId);
    if (!cobranca) throw new Error('Cobrança não encontrada.');

    const conta = this.getContaBancariaById(empresaId, cobranca.contaBancariaId)!;
    const configs = this.getConfigsCobranca(empresaId);
    const config = configs.find((c) => c.id === cobranca.configCobrancaId) || configs[0];

    const provider = BillingProviderFactory.getProvider(config.providerType, conta.bancoCodigo, conta.bancoNome);
    const resultado = await provider.consultarCobranca({
      cobranca,
      contaBancaria: conta,
      configuracao: config,
    });

    this.registrarEvento(empresaId, {
      cobrancaId: cobranca.id,
      tipoEvento: 'CONSULTA_STATUS',
      descricao: `Consulta de status realizada no ${conta.bancoNome}: ${resultado.statusAtual}.`,
      providerResponse: resultado.rawResponse,
      usuarioNome: 'Sondagem / Consulta',
    });

    return resultado;
  }

  /**
   * 4. ALTERAR COBRANÇA (Prorrogação, Desconto, Valor)
   */
  async alterarCobranca(
    empresaId: string,
    cobrancaId: string,
    alteracoes: {
      novoVencimento?: string;
      novoValorCobrado?: number;
      novoDesconto?: number;
      motivo: string;
      usuarioId?: string;
      usuarioNome?: string;
    }
  ): Promise<ResultadoAlteracao> {
    const cobranca = this.getCobrancaById(empresaId, cobrancaId);
    if (!cobranca) throw new Error('Cobrança não encontrada.');

    if (cobranca.status === 'PAGA_TOTAL' || cobranca.status === 'BAIXADA') {
      throw new Error(`Não é possível alterar cobrança no status ${cobranca.status}.`);
    }

    const conta = this.getContaBancariaById(empresaId, cobranca.contaBancariaId)!;
    const configs = this.getConfigsCobranca(empresaId);
    const config = configs.find((c) => c.id === cobranca.configCobrancaId) || configs[0];

    const provider = BillingProviderFactory.getProvider(config.providerType, conta.bancoCodigo, conta.bancoNome);
    const resultado = await provider.alterarCobranca({
      cobranca,
      contaBancaria: conta,
      configuracao: config,
      ...alteracoes,
    });

    if (resultado.sucesso) {
      const payloadBefore = { ...cobranca };

      if (alteracoes.novoVencimento) cobranca.dataVencimento = alteracoes.novoVencimento;
      if (alteracoes.novoValorCobrado !== undefined) cobranca.valorCobrado = alteracoes.novoValorCobrado;
      if (alteracoes.novoDesconto !== undefined) cobranca.valorDesconto = alteracoes.novoDesconto;
      if (resultado.novaLinhaDigitavel) cobranca.linhaDigitavel = resultado.novaLinhaDigitavel;
      if (resultado.novoCodigoBarras) cobranca.codigoBarras = resultado.novoCodigoBarras;

      cobranca.updatedAt = new Date().toISOString();

      this.registrarEvento(empresaId, {
        cobrancaId: cobranca.id,
        tipoEvento: alteracoes.novoVencimento ? 'ALTERACAO_VENCIMENTO' : 'ALTERACAO_VALOR',
        descricao: `Alteração de cobrança: ${alteracoes.motivo}.`,
        payloadBefore,
        payloadAfter: cobranca,
        providerResponse: resultado.rawResponse,
        usuarioId: alteracoes.usuarioId,
        usuarioNome: alteracoes.usuarioNome || 'Operador Financeiro',
      });
    }

    return resultado;
  }

  /**
   * 5. BAIXAR COBRANÇA (Pagamento ou Cancelamento + Movimento Financeiro)
   */
  async baixarCobranca(
    empresaId: string,
    cobrancaId: string,
    dadosBaixa: {
      motivoBaixa: 'PAGAMENTO' | 'CANCELAMENTO_PEDIDO' | 'SUBSTITUICAO_TITULO' | 'DEVOLUCAO' | 'ACORDO_COMERCIAL';
      valorRecebido?: number;
      dataPagamento?: string;
      usuarioId?: string;
      usuarioNome?: string;
    }
  ): Promise<ResultadoBaixa> {
    const cobranca = this.getCobrancaById(empresaId, cobrancaId);
    if (!cobranca) throw new Error('Cobrança não encontrada.');

    const conta = this.getContaBancariaById(empresaId, cobranca.contaBancariaId)!;
    const configs = this.getConfigsCobranca(empresaId);
    const config = configs.find((c) => c.id === cobranca.configCobrancaId) || configs[0];

    const provider = BillingProviderFactory.getProvider(config.providerType, conta.bancoCodigo, conta.bancoNome);
    const resultado = await provider.baixarCobranca({
      cobranca,
      contaBancaria: conta,
      configuracao: config,
      ...dadosBaixa,
    });

    if (resultado.sucesso) {
      cobranca.status = resultado.statusFinal;
      cobranca.valorPago = dadosBaixa.valorRecebido ?? cobranca.valorCobrado;
      cobranca.dataPagamento = dadosBaixa.dataPagamento || new Date().toISOString();
      cobranca.updatedAt = new Date().toISOString();

      // Se for liquidação/pagamento, gera o movimento financeiro na conta bancária
      if (dadosBaixa.motivoBaixa === 'PAGAMENTO') {
        const saldoAnterior = conta.saldoAtual;
        const valorCreditado = cobranca.valorPago;
        conta.saldoAtual += valorCreditado;
        conta.saldoDisponivel += valorCreditado;
        conta.updatedAt = new Date().toISOString();

        this.registrarMovimentoFinanceiro(empresaId, {
          contaBancariaId: conta.id,
          cobrancaId: cobranca.id,
          tituloId: cobranca.tituloId,
          tipoMovimento: 'ENTRADA',
          origemMovimento: 'LIQUIDACAO_COBRANCA',
          valor: valorCreditado,
          dataMovimento: new Date().toISOString().split('T')[0],
          dataCompetencia: cobranca.dataVencimento,
          descricao: `Liquidação Boleto/PIX ${cobranca.nossoNumero} - ${cobranca.pagadorNome}`,
          saldoAnterior,
          saldoPosterior: conta.saldoAtual,
          conciliado: true,
          dataConciliacao: new Date().toISOString(),
          documentoReferencia: cobranca.seuNumero,
          usuarioId: dadosBaixa.usuarioId,
        });
      }

      this.registrarEvento(empresaId, {
        cobrancaId: cobranca.id,
        tipoEvento: dadosBaixa.motivoBaixa === 'PAGAMENTO' ? 'BAIXA_MANUAL' : 'CANCELAMENTO',
        descricao: `Baixa efetuada: ${dadosBaixa.motivoBaixa}. Valor: R$ ${(dadosBaixa.valorRecebido || cobranca.valorCobrado).toFixed(2)}.`,
        providerResponse: resultado.rawResponse,
        usuarioId: dadosBaixa.usuarioId,
        usuarioNome: dadosBaixa.usuarioNome || 'Tesouraria / Baixa',
      });
    }

    return resultado;
  }

  /**
   * 6. SEGUNDA VIA DE COBRANÇA
   */
  async gerarSegundaVia(
    empresaId: string,
    cobrancaId: string,
    novoVencimento?: string,
    incluirEncargos?: boolean,
    usuarioId?: string,
    usuarioNome?: string
  ): Promise<ResultadoSegundaVia> {
    const cobranca = this.getCobrancaById(empresaId, cobrancaId);
    if (!cobranca) throw new Error('Cobrança não encontrada.');

    const conta = this.getContaBancariaById(empresaId, cobranca.contaBancariaId)!;
    const configs = this.getConfigsCobranca(empresaId);
    const config = configs.find((c) => c.id === cobranca.configCobrancaId) || configs[0];

    const provider = BillingProviderFactory.getProvider(config.providerType, conta.bancoCodigo, conta.bancoNome);
    const resultado = await provider.gerarSegundaVia({
      cobranca,
      contaBancaria: conta,
      configuracao: config,
      novoVencimento,
      incluirEncargosAtraso: incluirEncargos,
    });

    if (resultado.sucesso) {
      cobranca.linhaDigitavel = resultado.linhaDigitavel;
      cobranca.codigoBarras = resultado.codigoBarras;
      cobranca.qrCodePix = resultado.qrCodePix;
      cobranca.valorCobrado = resultado.valorAtualizado;
      cobranca.dataVencimento = resultado.dataVencimentoAtualizada;
      cobranca.updatedAt = new Date().toISOString();

      this.registrarEvento(empresaId, {
        cobrancaId: cobranca.id,
        tipoEvento: 'SEGUNDA_VIA_EMITIDA',
        descricao: `Segunda via emitida com vencimento para ${resultado.dataVencimentoAtualizada} e valor atualizado de R$ ${resultado.valorAtualizado.toFixed(2)}.`,
        usuarioId,
        usuarioNome: usuarioNome || 'Atendimento / 2ª Via',
      });
    }

    return resultado;
  }

  /**
   * 7. ENVIO DE COBRANÇA POR E-MAIL
   */
  async enviarEmailCobranca(
    empresaId: string,
    params: EnvioEmailInput & { usuarioId?: string; usuarioNome?: string }
  ): Promise<ResultadoEnvioEmail> {
    const conta = this.getContaBancariaById(empresaId, params.cobranca.contaBancariaId)!;
    const configs = this.getConfigsCobranca(empresaId);
    const config = configs.find((c) => c.id === params.cobranca.configCobrancaId) || configs[0];

    const provider = BillingProviderFactory.getProvider(config.providerType, conta.bancoCodigo, conta.bancoNome);
    const resultado = await provider.enviarEmailCobranca(params);

    if (resultado.sucesso) {
      this.registrarEvento(empresaId, {
        cobrancaId: params.cobranca.id,
        tipoEvento: 'ENVIO_EMAIL',
        descricao: `Cobrança enviada por e-mail para ${params.destinatarioNome} <${params.destinatarioEmail}>.`,
        providerResponse: { mensagemId: resultado.mensagemId, dataEnvio: resultado.dataHoraEnvio },
        usuarioId: params.usuarioId,
        usuarioNome: params.usuarioNome || 'Envio Automático',
      });
    }

    return resultado;
  }

  // ==========================================================================
  // MOVIMENTAÇÕES FINANCEIRAS & AUDITORIA
  // ==========================================================================

  getMovimentosFinanceiros(empresaId: string): MovimentoFinanceiro[] {
    return (this.movimentos.get(empresaId) || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private registrarMovimentoFinanceiro(
    empresaId: string,
    mov: Omit<MovimentoFinanceiro, 'id' | 'empresaId' | 'createdAt'>
  ): MovimentoFinanceiro {
    const list = this.movimentos.get(empresaId) || [];
    const novoMov: MovimentoFinanceiro = {
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      empresaId,
      ...mov,
      createdAt: new Date().toISOString(),
    };
    list.unshift(novoMov);
    this.movimentos.set(empresaId, list);
    return novoMov;
  }

  private registrarEvento(
    empresaId: string,
    evento: Omit<CobrancaEvento, 'id' | 'empresaId' | 'timestamp'>
  ): CobrancaEvento {
    const list = this.cobrancaEventos.get(empresaId) || [];
    const novoEvento: CobrancaEvento = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      empresaId,
      ...evento,
      timestamp: new Date().toISOString(),
    };
    list.unshift(novoEvento);
    this.cobrancaEventos.set(empresaId, list);
    return novoEvento;
  }
}

export const bancarioService = new BancarioService();
