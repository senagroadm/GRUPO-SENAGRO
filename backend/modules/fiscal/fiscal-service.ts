/**
 * NEXUS ERP - Fiscal Service (Orquestrador da Camada Fiscal Desacoplada)
 * Gerencia isolamento multiempresa, numeração atômica, regras tributárias,
 * adapters desacoplados para NF-e/NFS-e e rastreabilidade por Idempotency Key.
 */

import {
  ConfiguracaoFiscal,
  RegraTributaria,
  OperacaoFiscal,
  TributacaoProduto,
  TributacaoServico,
  SerieFiscal,
  NumeracaoFiscalLog,
  DocumentoFiscal,
  EventoFiscal,
  CertificadoReferencia,
  IntegracaoFiscalLog,
  EmissaoDocumentoRequest,
  ModeloDocumentoFiscal,
  AmbienteFiscal,
  PreValidacaoResult,
  InutilizacaoRequest,
  InutilizacaoResponse,
  ImportacaoXmlResult,
  FaturamentoIntegradoEfeitos,
} from './fiscal-types';
import { motorFiscalService } from './fiscal-motor';
import { NFeMockAdapter } from './adapters/nfe-mock-adapter';
import { NFSeMockAdapter } from './adapters/nfse-mock-adapter';
import { fiscalValidator } from './fiscal-validator';
import { xmlParserService } from './xml-parser-service';
import { faturamentoIntegracaoService } from './faturamento-integracao';


export class FiscalService {
  private configuracoes: Map<string, ConfiguracaoFiscal> = new Map();
  private regrasTributarias: Map<string, RegraTributaria[]> = new Map();
  private operacoesFiscais: Map<string, OperacaoFiscal[]> = new Map();
  private tributacoesProdutos: Map<string, TributacaoProduto[]> = new Map();
  private tributacoesServicos: Map<string, TributacaoServico[]> = new Map();
  private seriesFiscais: Map<string, SerieFiscal[]> = new Map();
  private numeracoesLog: Map<string, NumeracaoFiscalLog[]> = new Map();
  private documentosFiscais: Map<string, DocumentoFiscal[]> = new Map();
  private eventosFiscais: Map<string, EventoFiscal[]> = new Map();
  private certificados: Map<string, CertificadoReferencia[]> = new Map();
  private integracaoLogs: Map<string, IntegracaoFiscalLog[]> = new Map();

  // Adapters desacoplados
  private nfeAdapter = new NFeMockAdapter();
  private nfseAdapter = new NFSeMockAdapter();

  constructor() {
    this.inicializarDadosBase();
  }

  private inicializarDadosBase() {
    const empresas = ['empresa-1', 'empresa-2', 'empresa-3', 'empresa-4', 'empresa-5'];

    for (const empId of empresas) {
      // 1. Configuração Fiscal
      this.configuracoes.set(empId, {
        id: `cfg-${empId}`,
        empresaId: empId,
        ambientePadrao: 'HOMOLOGACAO',
        regimeTributario: empId === 'empresa-1' ? 'LUCRO_REAL' : 'LUCRO_PRESUMIDO',
        inscricaoEstadual: '111.222.333.444',
        inscricaoMunicipal: '5544332-1',
        cnaePrincipal: '2869-1/00',
        codigoMunicipioIBGE: '3550308', // São Paulo
        ufEmissao: 'SP',
        incentivadorCultural: false,
        certificadoReferenciaId: `cert-${empId}-a1`,
        danfePadraoLogotipoUrl: '/images/tritech_logo.png',
        observacoesFiscoPadrao: 'Documento emitido por ME ou EPP optante pelo Simples Nacional se aplicavel / Tributos calculados conf. parametrizacao fiscal NEXUS.',
        observacoesContribuintePadrao: 'Trib aprox R$: Fed / Est / Mun. Fonte: IBPT. Pagamento via TED/PIX.',
        habilitarReformaTributariaIbsCbs: true,
        criadoEm: '2026-01-10T08:00:00Z',
        atualizadoEm: '2026-08-20T10:00:00Z',
      });

      // 2. Séries Fiscais
      this.seriesFiscais.set(empId, [
        {
          id: `serie-${empId}-nfe-1`,
          empresaId: empId,
          modelo: 'NFE_55',
          serieNumero: 1,
          ambiente: 'HOMOLOGACAO',
          descricao: 'Série 1 - Vendas & Transferências Industriais',
          ultimoNumeroUtilizado: 1042,
          bloqueadoParaUso: false,
          ativo: true,
          criadoEm: '2026-01-01T00:00:00Z',
        },
        {
          id: `serie-${empId}-nfe-2`,
          empresaId: empId,
          modelo: 'NFE_55',
          serieNumero: 2,
          ambiente: 'HOMOLOGACAO',
          descricao: 'Série 2 - Devoluções & Remessas',
          ultimoNumeroUtilizado: 115,
          bloqueadoParaUso: false,
          ativo: true,
          criadoEm: '2026-01-01T00:00:00Z',
        },
        {
          id: `serie-${empId}-nfse-1`,
          empresaId: empId,
          modelo: 'NFSE',
          serieNumero: 1,
          ambiente: 'HOMOLOGACAO',
          descricao: 'Série 1 - Serviços Técnicos & Manutenção',
          ultimoNumeroUtilizado: 520,
          bloqueadoParaUso: false,
          ativo: true,
          criadoEm: '2026-01-01T00:00:00Z',
        },
      ]);

      // 3. Operações Fiscais (CFOPs)
      this.operacoesFiscais.set(empId, [
        {
          id: `op-${empId}-venda-ind`,
          empresaId: empId,
          codigoOperacao: 'VENDA_IND_ESTADUAL',
          descricaoNatureza: 'VENDA DE PRODUCAO DO ESTABELECIMENTO',
          tipoOperacao: 'SAIDA',
          cfopPadraoEstadual: '5101',
          cfopPadraoInterestadual: '6101',
          cfopPadraoExterior: '7101',
          finalidade: 'NORMAL',
          movimentaEstoque: true,
          geraFinanceiro: true,
          consumidorFinalPadrao: false,
          indicadorPresencaPadrao: 'OUTROS',
          textoPadraoDadosAdicionais: 'Venda de produtos fabricados conforme pedido comercial.',
          ativo: true,
        },
        {
          id: `op-${empId}-remessa-ind`,
          empresaId: empId,
          codigoOperacao: 'REMESSA_INDUSTRIALIZACAO',
          descricaoNatureza: 'REMESSA PARA INDUSTRIALIZACAO POR ENCOMENDA',
          tipoOperacao: 'SAIDA',
          cfopPadraoEstadual: '5901',
          cfopPadraoInterestadual: '6901',
          cfopPadraoExterior: '7949',
          finalidade: 'NORMAL',
          movimentaEstoque: true,
          geraFinanceiro: false,
          consumidorFinalPadrao: false,
          indicadorPresencaPadrao: 'OUTROS',
          textoPadraoDadosAdicionais: 'Mercadoria remetida para beneficiamento e posterior retorno.',
          ativo: true,
        },
        {
          id: `op-${empId}-devolucao-venda`,
          empresaId: empId,
          codigoOperacao: 'DEVOLUCAO_VENDA',
          descricaoNatureza: 'DEVOLUCAO DE VENDA DE PRODUCAO DO ESTABELECIMENTO',
          tipoOperacao: 'ENTRADA',
          cfopPadraoEstadual: '1201',
          cfopPadraoInterestadual: '2201',
          cfopPadraoExterior: '3201',
          finalidade: 'DEVOLUCAO_RETORNO',
          movimentaEstoque: true,
          geraFinanceiro: true,
          consumidorFinalPadrao: false,
          indicadorPresencaPadrao: 'OUTROS',
          textoPadraoDadosAdicionais: 'Devolucao referente a NF-e de venda anterior.',
          ativo: true,
        },
        {
          id: `op-${empId}-servico`,
          empresaId: empId,
          codigoOperacao: 'PRESTACAO_SERVICOS',
          descricaoNatureza: 'PRESTACAO DE SERVICOS DE ENGENHARIA E MANUTENCAO',
          tipoOperacao: 'SAIDA',
          cfopPadraoEstadual: '5933',
          cfopPadraoInterestadual: '6933',
          cfopPadraoExterior: '7933',
          finalidade: 'NORMAL',
          movimentaEstoque: false,
          geraFinanceiro: true,
          consumidorFinalPadrao: false,
          indicadorPresencaPadrao: 'OUTROS',
          textoPadraoDadosAdicionais: 'Prestacao de servicos conforme LC 116/2003.',
          ativo: true,
        },
        {
          id: `op-${empId}-transferencia`,
          empresaId: empId,
          codigoOperacao: 'TRANSFERENCIA_INTERCOMPANY',
          descricaoNatureza: 'TRANSFERENCIA DE MERCADORIA OU PRODUCAO ENTRE ESTABELECIMENTOS DO GRUPO',
          tipoOperacao: 'SAIDA',
          cfopPadraoEstadual: '5152',
          cfopPadraoInterestadual: '6152',
          cfopPadraoExterior: '7152',
          finalidade: 'NORMAL',
          movimentaEstoque: true,
          geraFinanceiro: false,
          consumidorFinalPadrao: false,
          indicadorPresencaPadrao: 'OUTROS',
          textoPadraoDadosAdicionais: 'Transferencia intercompany entre empresas do Grupo TRITECH.',
          ativo: true,
        },
        {
          id: `op-${empId}-retorno-ind`,
          empresaId: empId,
          codigoOperacao: 'RETORNO_INDUSTRIALIZACAO',
          descricaoNatureza: 'RETORNO DE MERCADORIA OU INSUMO RECEBIDO PARA INDUSTRIALIZACAO',
          tipoOperacao: 'ENTRADA',
          cfopPadraoEstadual: '1902',
          cfopPadraoInterestadual: '2902',
          cfopPadraoExterior: '3902',
          finalidade: 'DEVOLUCAO_RETORNO',
          movimentaEstoque: true,
          geraFinanceiro: false,
          consumidorFinalPadrao: false,
          indicadorPresencaPadrao: 'OUTROS',
          textoPadraoDadosAdicionais: 'Retorno de insumo beneficiado com base em remessa anterior.',
          ativo: true,
        },
        {
          id: `op-${empId}-devolucao-compra`,
          empresaId: empId,
          codigoOperacao: 'DEVOLUCAO_COMPRA_FORNECEDOR',
          descricaoNatureza: 'DEVOLUCAO DE COMPRA PARA INDUSTRIALIZACAO OU COMERCIALIZACAO',
          tipoOperacao: 'SAIDA',
          cfopPadraoEstadual: '5201',
          cfopPadraoInterestadual: '6201',
          cfopPadraoExterior: '7201',
          finalidade: 'DEVOLUCAO_RETORNO',
          movimentaEstoque: true,
          geraFinanceiro: true,
          consumidorFinalPadrao: false,
          indicadorPresencaPadrao: 'OUTROS',
          textoPadraoDadosAdicionais: 'Devolucao de insumo adquirido com avaria ou especificacao divergente.',
          ativo: true,
        },
        {
          id: `op-${empId}-compra-insumo`,
          empresaId: empId,
          codigoOperacao: 'COMPRA_INSUMOS',
          descricaoNatureza: 'COMPRA PARA INDUSTRIALIZACAO',
          tipoOperacao: 'ENTRADA',
          cfopPadraoEstadual: '1101',
          cfopPadraoInterestadual: '2101',
          cfopPadraoExterior: '3101',
          finalidade: 'NORMAL',
          movimentaEstoque: true,
          geraFinanceiro: true,
          consumidorFinalPadrao: false,
          indicadorPresencaPadrao: 'OUTROS',
          textoPadraoDadosAdicionais: 'Entrada de insumos e materias-primas para fabricacao.',
          ativo: true,
        },
      ]);

      // 4. Regras Tributárias
      this.regrasTributarias.set(empId, [
        {
          id: `regra-${empId}-sp-geral`,
          empresaId: empId,
          nomeRegra: 'SP Interno - Contribuinte Geral (ICMS 18% + IPI 5%)',
          prioridade: 1,
          ufOrigem: 'SP',
          ufDestino: 'SP',
          tipoContribuinteDestino: 'CONTRIBUINTE_ICMS',
          regimeDestino: 'QUALQUER',
          cstIcms: '00',
          aliquotaIcmsBasePercentual: 18.0,
          possuiStIcms: false,
          calculaDifal: false,
          cstIpi: '50',
          aliquotaIpiPercentual: 5.0,
          cstPis: '01',
          aliquotaPisPercentual: 1.65,
          cstCofins: '01',
          aliquotaCofinsPercentual: 7.6,
          tributacaoIbsCbs: {
            cstIbsCbs: '01',
            aliquotaIbsEstadualPercentual: 17.5,
            aliquotaIbsMunicipalPercentual: 2.5,
            aliquotaCbsFederalPercentual: 8.8,
            aliquotaImpostoSeletivoPercentual: 0,
          },
          observacaoLegal: 'Operacao interna paulista tributada integralmente.',
          ativo: true,
        },
        {
          id: `regra-${empId}-interestadual-sul-sudeste`,
          empresaId: empId,
          nomeRegra: 'Interestadual Sul/Sudeste (ICMS 12% + IPI 5%)',
          prioridade: 2,
          ufOrigem: 'SP',
          ufDestino: '*',
          tipoContribuinteDestino: 'CONTRIBUINTE_ICMS',
          regimeDestino: 'QUALQUER',
          cstIcms: '00',
          aliquotaIcmsBasePercentual: 12.0,
          possuiStIcms: false,
          calculaDifal: false,
          cstIpi: '50',
          aliquotaIpiPercentual: 5.0,
          cstPis: '01',
          aliquotaPisPercentual: 1.65,
          cstCofins: '01',
          aliquotaCofinsPercentual: 7.6,
          tributacaoIbsCbs: {
            cstIbsCbs: '01',
            aliquotaIbsEstadualPercentual: 17.5,
            aliquotaIbsMunicipalPercentual: 2.5,
            aliquotaCbsFederalPercentual: 8.8,
            aliquotaImpostoSeletivoPercentual: 0,
          },
          observacaoLegal: 'Operacao interestadual para contribuinte do ICMS conf. Art 52 RICMS/SP.',
          ativo: true,
        },
      ]);

      // 5. Tributação de Produtos
      this.tributacoesProdutos.set(empId, [
        {
          id: `trib-prod-1-${empId}`,
          empresaId: empId,
          produtoId: 'prod-001',
          codigoProduto: 'VLV-IND-300',
          descricao: 'Válvula Esfera Industrial DN 50 Inox 316',
          ncm: '84818099',
          cest: '0105000',
          origemMercadoria: '0_NACIONAL',
          tipoItemSped: '04_PRODUTO_ACABADO',
          gtinEan: '7891234567890',
          gtinEanTributavel: '7891234567890',
          unidadeTributavel: 'UN',
          fatorConversaoTributavel: 1,
          isentoIpi: false,
          aliquotaIpiPropria: 5.0,
          ibsCbsConfig: {
            cstIbsCbs: '01',
            aliquotaIbsEstadualPercentual: 17.5,
            aliquotaIbsMunicipalPercentual: 2.5,
            aliquotaCbsFederalPercentual: 8.8,
            aliquotaImpostoSeletivoPercentual: 0,
          },
          ativo: true,
        },
        {
          id: `trib-prod-2-${empId}`,
          empresaId: empId,
          produtoId: 'prod-002',
          codigoProduto: 'ACT-PNEUM-90',
          descricao: 'Atuador Pneumático Rotativo Dupla Ação 90°',
          ncm: '84123110',
          origemMercadoria: '0_NACIONAL',
          tipoItemSped: '04_PRODUTO_ACABADO',
          gtinEan: '7891234567891',
          gtinEanTributavel: '7891234567891',
          unidadeTributavel: 'UN',
          fatorConversaoTributavel: 1,
          isentoIpi: false,
          aliquotaIpiPropria: 6.5,
          ibsCbsConfig: {
            cstIbsCbs: '01',
            aliquotaIbsEstadualPercentual: 17.5,
            aliquotaIbsMunicipalPercentual: 2.5,
            aliquotaCbsFederalPercentual: 8.8,
            aliquotaImpostoSeletivoPercentual: 0,
          },
          ativo: true,
        },
      ]);

      // 6. Tributação de Serviços
      this.tributacoesServicos.set(empId, [
        {
          id: `trib-serv-1-${empId}`,
          empresaId: empId,
          servicoId: 'serv-001',
          codigoServico: 'SRV-CALIB-01',
          descricao: 'Calibração e Manutenção Especializada de Válvulas e Atuadores',
          itemListaServicoLc116: '14.01',
          codigoTributacaoMunicipio: '1401001',
          cnaeCodigo: '3314710',
          aliquotaIssPercentual: 5.0,
          issRetidoPadrao: false,
          exigibilidadeIss: 'EXIGIVEL',
          retencaoPisPercentual: 0.65,
          retencaoCofinsPercentual: 3.0,
          retencaoCsllPercentual: 1.0,
          retencaoIrrfPercentual: 1.5,
          minimoRetencaoFederal: 10.0,
          ativo: true,
        },
      ]);

      // 7. Certificado Digital Referência
      this.certificados.set(empId, [
        {
          id: `cert-${empId}-a1`,
          empresaId: empId,
          tipo: 'A1_ARQUIVO',
          aliasNome: `Certificado A1 - TRITECH ${empId.toUpperCase()}`,
          cnpjTitular: '12.345.678/0001-90',
          razaoSocialTitular: 'TRITECH INDUSTRIAL DO BRASIL S.A.',
          emissorAutoridadeCertificadora: 'AC SERPRO RFB v5',
          numeroSerieHex: '7A4F82B91C0E45D2',
          validoDe: '2026-01-01T00:00:00Z',
          validoAte: '2027-01-01T23:59:59Z',
          status: 'VALIDO',
          diasAteVencimento: 128,
          vaultSecretKeyRef: `vault://tritech/certificates/${empId}/a1_pfx`,
          ativo: true,
        },
      ]);

      // 8. Documentos Fiscais Iniciais com Chave de 44 dígitos
      const chaveInit = `35260812345678000190550010000010411876543210`;
      this.documentosFiscais.set(empId, [
        {
          id: `doc-${empId}-1041`,
          empresaId: empId,
          modelo: 'NFE_55',
          serie: 1,
          numeroDocumento: 1041,
          tipoEmissao: 'NORMAL',
          ambiente: 'HOMOLOGACAO',
          status: 'AUTORIZADO',
          chaveAcesso: chaveInit,
          naturezaOperacao: 'VENDA DE PRODUCAO DO ESTABELECIMENTO',
          operacaoFiscalId: `op-${empId}-venda-ind`,
          tipoOperacao: 'SAIDA',
          dataHoraEmissao: '2026-08-25T14:30:00Z',
          destinatario: {
            tipoPessoa: 'PJ',
            cnpjCpf: '45.890.123/0001-99',
            razaoSocialNome: 'PETROBRASIL REFINARIA E DISTRIBUICAO S.A.',
            nomeFantasia: 'PETROBRASIL',
            indicadorIe: '1_CONTRIBUINTE',
            inscricaoEstadual: '334.556.778.990',
            emailNotificacao: 'nfe@petrobrasil.com.br',
            telefone: '(11) 3456-7890',
            endereco: {
              logradouro: 'Rodovia dos Imigrantes',
              numero: 'km 42',
              bairro: 'Distrito Portuario',
              codigoMunicipioIBGE: '3548500', // Santos
              cidade: 'Santos',
              uf: 'SP',
              cep: '11015-000',
              pais: 'BRASIL',
            },
          },
          itens: [
            {
              id: 'it-1',
              numeroItem: 1,
              codigoItem: 'VLV-IND-300',
              descricao: 'Válvula Esfera Industrial DN 50 Inox 316',
              ncm: '84818099',
              cest: '0105000',
              cfop: '5101',
              unidadeMedida: 'UN',
              quantidade: 10,
              valorUnitario: 3500.0,
              valorBrutoTotal: 35000.0,
              valorDescontoItem: 0,
              valorFreteRateado: 0,
              valorSeguroRateado: 0,
              valorOutrasDespesasRateado: 0,
              valorTotalLiquido: 36750.0,
              origemMercadoria: '0_NACIONAL',
              cstCsosnIcms: '00',
              baseCalculoIcms: 35000.0,
              aliquotaIcmsPercentual: 18.0,
              valorIcms: 6300.0,
              baseCalculoIcmsSt: 0,
              aliquotaIcmsStPercentual: 0,
              valorIcmsSt: 0,
              valorFcp: 0,
              cstIpi: '50',
              baseCalculoIpi: 35000.0,
              aliquotaIpiPercentual: 5.0,
              valorIpi: 1750.0,
              cstPis: '01',
              baseCalculoPis: 35000.0,
              aliquotaPisPercentual: 1.65,
              valorPis: 577.5,
              cstCofins: '01',
              baseCalculoCofins: 35000.0,
              aliquotaCofinsPercentual: 7.6,
              valorCofins: 2660.0,
              memoriaIbsCbs: {
                baseCalculoIbsCbs: 35000.0,
                valorIbsEstadual: 6125.0,
                valorIbsMunicipal: 875.0,
                valorIbsTotal: 7000.0,
                valorCbsFederal: 3080.0,
                valorImpostoSeletivo: 0,
                valorTotalTributosNovaReforma: 10080.0,
              },
            },
          ],
          totais: {
            valorProdutosServicos: 35000.0,
            valorDescontos: 0,
            valorFrete: 0,
            valorSeguro: 0,
            valorOutrasDespesas: 0,
            baseCalculoIcms: 35000.0,
            valorTotalIcms: 6300.0,
            baseCalculoIcmsSt: 0,
            valorTotalIcmsSt: 0,
            valorTotalFcp: 0,
            valorTotalIpi: 1750.0,
            baseCalculoPis: 35000.0,
            valorTotalPis: 577.5,
            baseCalculoCofins: 35000.0,
            valorTotalCofins: 2660.0,
            valorTotalDocumento: 36750.0,
            valorTotalIbs: 7000.0,
            valorTotalCbs: 3080.0,
            valorTotalImpostoSeletivo: 0,
          },
          transporte: {
            modalidadeFrete: '0_CIF_EMITENTE',
            transportadoraRazaoSocial: 'LOGÍSTICA TRANSVALE S.A.',
            quantidadeVolumes: 2,
            pesoLiquidoKg: 420,
            pesoBrutoKg: 450,
          },
          protocoloAutorizacao: '135260049281726',
          dataHoraAutorizacao: '2026-08-25T14:30:05Z',
          codigoStatusSefaz: 100,
          motivoStatusSefaz: 'Autorizado o uso da NF-e',
          pdfDanfeUrl: `/api/v1/fiscal/danfe/${chaveInit}.pdf`,
          idempotencyKey: `idemp-1041-${empId}`,
          usuarioEmissorId: 'user-fiscal-01',
          criadoEm: '2026-08-25T14:29:50Z',
          atualizadoEm: '2026-08-25T14:30:05Z',
        },
      ]);

      // 9. Eventos Iniciais
      this.eventosFiscais.set(empId, []);

      // 10. Logs Iniciais
      this.integracaoLogs.set(empId, [
        {
          id: `log-init-${empId}`,
          empresaId: empId,
          documentoFiscalId: `doc-${empId}-1041`,
          servico: 'SEFAZ_AUTORIZACAO',
          ambiente: 'HOMOLOGACAO',
          idempotencyKey: `idemp-1041-${empId}`,
          endpointChamado: 'https://nfe.sefaz.gov.br/ws/NFeAutorizacao4?env=HOMOLOGACAO',
          tempoRespostaMs: 142,
          statusHttp: 200,
          payloadEnvioFormatado: JSON.stringify({ chNFe: chaveInit, mod: 55, nNF: 1041 }),
          payloadRetornoFormatado: JSON.stringify({ cStat: 100, xMotivo: 'Autorizado o uso da NF-e', nProt: '135260049281726' }),
          sucesso: true,
          timestamp: '2026-08-25T14:30:05Z',
        },
      ]);
    }
  }

  // ==========================================================
  // GETTERS MULTIEMPRESA
  // ==========================================================
  public getConfiguracao(empresaId: string): ConfiguracaoFiscal | null {
    return this.configuracoes.get(empresaId) || null;
  }

  public salvarConfiguracao(empresaId: string, payload: Partial<ConfiguracaoFiscal>): ConfiguracaoFiscal {
    const atual = this.getConfiguracao(empresaId);
    const atualizada: ConfiguracaoFiscal = {
      ...(atual || {
        id: `cfg-${empresaId}`,
        empresaId,
        ambientePadrao: 'HOMOLOGACAO',
        regimeTributario: 'LUCRO_REAL',
        inscricaoEstadual: '',
        codigoMunicipioIBGE: '3550308',
        ufEmissao: 'SP',
        incentivadorCultural: false,
        habilitarReformaTributariaIbsCbs: true,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      }),
      ...payload,
      empresaId,
      atualizadoEm: new Date().toISOString(),
    };
    this.configuracoes.set(empresaId, atualizada);
    return atualizada;
  }

  public getSeriesFiscais(empresaId: string, modelo?: ModeloDocumentoFiscal): SerieFiscal[] {
    const series = this.seriesFiscais.get(empresaId) || [];
    if (modelo) {
      return series.filter((s) => s.modelo === modelo);
    }
    return series;
  }

  public salvarSerieFiscal(empresaId: string, serie: Partial<SerieFiscal>): SerieFiscal {
    const series = this.seriesFiscais.get(empresaId) || [];
    const index = series.findIndex((s) => s.id === serie.id);
    const novaSerie: SerieFiscal = {
      id: serie.id || `serie-${empresaId}-${Date.now()}`,
      empresaId,
      modelo: serie.modelo || 'NFE_55',
      serieNumero: serie.serieNumero || 1,
      ambiente: serie.ambiente || 'HOMOLOGACAO',
      descricao: serie.descricao || `Série ${serie.serieNumero || 1}`,
      ultimoNumeroUtilizado: serie.ultimoNumeroUtilizado || 0,
      bloqueadoParaUso: !!serie.bloqueadoParaUso,
      ativo: serie.ativo !== false,
      criadoEm: serie.criadoEm || new Date().toISOString(),
    };

    if (index >= 0) {
      series[index] = novaSerie;
    } else {
      series.push(novaSerie);
    }
    this.seriesFiscais.set(empresaId, series);
    return novaSerie;
  }

  public getOperacoesFiscais(empresaId: string): OperacaoFiscal[] {
    return this.operacoesFiscais.get(empresaId) || [];
  }

  public salvarOperacaoFiscal(empresaId: string, operacao: Partial<OperacaoFiscal>): OperacaoFiscal {
    const ops = this.operacoesFiscais.get(empresaId) || [];
    const index = ops.findIndex((o) => o.id === operacao.id);
    const novaOp: OperacaoFiscal = {
      id: operacao.id || `op-${empresaId}-${Date.now()}`,
      empresaId,
      codigoOperacao: operacao.codigoOperacao || 'NOVA_OPERACAO',
      descricaoNatureza: operacao.descricaoNatureza || 'NATUREZA DE OPERACAO',
      tipoOperacao: operacao.tipoOperacao || 'SAIDA',
      cfopPadraoEstadual: operacao.cfopPadraoEstadual || '5101',
      cfopPadraoInterestadual: operacao.cfopPadraoInterestadual || '6101',
      cfopPadraoExterior: operacao.cfopPadraoExterior || '7101',
      finalidade: operacao.finalidade || 'NORMAL',
      movimentaEstoque: operacao.movimentaEstoque !== false,
      geraFinanceiro: operacao.geraFinanceiro !== false,
      consumidorFinalPadrao: !!operacao.consumidorFinalPadrao,
      indicadorPresencaPadrao: operacao.indicadorPresencaPadrao || 'OUTROS',
      textoPadraoDadosAdicionais: operacao.textoPadraoDadosAdicionais || '',
      ativo: operacao.ativo !== false,
    };

    if (index >= 0) {
      ops[index] = novaOp;
    } else {
      ops.push(novaOp);
    }
    this.operacoesFiscais.set(empresaId, ops);
    return novaOp;
  }

  public getRegrasTributarias(empresaId: string): RegraTributaria[] {
    return this.regrasTributarias.get(empresaId) || [];
  }

  public salvarRegraTributaria(empresaId: string, regra: Partial<RegraTributaria>): RegraTributaria {
    const regras = this.regrasTributarias.get(empresaId) || [];
    const index = regras.findIndex((r) => r.id === regra.id);
    const novaRegra: RegraTributaria = {
      id: regra.id || `regra-${empresaId}-${Date.now()}`,
      empresaId,
      nomeRegra: regra.nomeRegra || 'Nova Regra Tributária',
      prioridade: regra.prioridade || (regras.length + 1),
      ufOrigem: regra.ufOrigem || 'SP',
      ufDestino: regra.ufDestino || '*',
      tipoContribuinteDestino: regra.tipoContribuinteDestino || 'CONTRIBUINTE_ICMS',
      regimeDestino: regra.regimeDestino || 'QUALQUER',
      cstIcms: regra.cstIcms,
      csosnIcms: regra.csosnIcms,
      aliquotaIcmsBasePercentual: regra.aliquotaIcmsBasePercentual,
      reducaoBaseIcmsPercentual: regra.reducaoBaseIcmsPercentual,
      possuiStIcms: !!regra.possuiStIcms,
      mvaStPercentual: regra.mvaStPercentual,
      aliquotaIcmsInternaDestinoSt: regra.aliquotaIcmsInternaDestinoSt,
      calculaDifal: !!regra.calculaDifal,
      cstIpi: regra.cstIpi,
      aliquotaIpiPercentual: regra.aliquotaIpiPercentual,
      cstPis: regra.cstPis,
      aliquotaPisPercentual: regra.aliquotaPisPercentual,
      cstCofins: regra.cstCofins,
      aliquotaCofinsPercentual: regra.aliquotaCofinsPercentual,
      tributacaoIbsCbs: regra.tributacaoIbsCbs,
      observacaoLegal: regra.observacaoLegal,
      ativo: regra.ativo !== false,
    };

    if (index >= 0) {
      regras[index] = novaRegra;
    } else {
      regras.push(novaRegra);
    }
    this.regrasTributarias.set(empresaId, regras);
    return novaRegra;
  }

  public getTributacoesProdutos(empresaId: string): TributacaoProduto[] {
    return this.tributacoesProdutos.get(empresaId) || [];
  }

  public salvarTributacaoProduto(empresaId: string, trib: Partial<TributacaoProduto>): TributacaoProduto {
    const list = this.tributacoesProdutos.get(empresaId) || [];
    const index = list.findIndex((p) => p.id === trib.id || p.codigoProduto === trib.codigoProduto);
    const novo: TributacaoProduto = {
      id: trib.id || `trib-prod-${Date.now()}`,
      empresaId,
      produtoId: trib.produtoId || `prod-${Date.now()}`,
      codigoProduto: trib.codigoProduto || 'NOVO_CODIGO',
      descricao: trib.descricao || 'Produto',
      ncm: trib.ncm || '84818099',
      cest: trib.cest,
      origemMercadoria: trib.origemMercadoria || '0_NACIONAL',
      tipoItemSped: trib.tipoItemSped || '04_PRODUTO_ACABADO',
      gtinEan: trib.gtinEan,
      gtinEanTributavel: trib.gtinEanTributavel,
      unidadeTributavel: trib.unidadeTributavel || 'UN',
      fatorConversaoTributavel: trib.fatorConversaoTributavel || 1,
      isentoIpi: !!trib.isentoIpi,
      aliquotaIpiPropria: trib.aliquotaIpiPropria,
      ibsCbsConfig: trib.ibsCbsConfig,
      ativo: trib.ativo !== false,
    };

    if (index >= 0) {
      list[index] = novo;
    } else {
      list.push(novo);
    }
    this.tributacoesProdutos.set(empresaId, list);
    return novo;
  }

  public getTributacoesServicos(empresaId: string): TributacaoServico[] {
    return this.tributacoesServicos.get(empresaId) || [];
  }

  public getCertificados(empresaId: string): CertificadoReferencia[] {
    return this.certificados.get(empresaId) || [];
  }

  public getDocumentosFiscais(
    empresaId: string,
    filtro?: { modelo?: ModeloDocumentoFiscal; search?: string; status?: string }
  ): DocumentoFiscal[] {
    let docs = this.documentosFiscais.get(empresaId) || [];
    if (filtro?.modelo) {
      docs = docs.filter((d) => d.modelo === filtro.modelo);
    }
    if (filtro?.status && filtro.status !== 'TODOS') {
      docs = docs.filter((d) => d.status === filtro.status);
    }
    if (filtro?.search) {
      const q = filtro.search.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.numeroDocumento.toString().includes(q) ||
          d.destinatario.razaoSocialNome.toLowerCase().includes(q) ||
          d.destinatario.cnpjCpf.includes(q) ||
          (d.chaveAcesso && d.chaveAcesso.includes(q))
      );
    }
    return docs.sort((a, b) => new Date(b.dataHoraEmissao).getTime() - new Date(a.dataHoraEmissao).getTime());
  }

  public getDocumentoById(empresaId: string, id: string): DocumentoFiscal | null {
    const docs = this.documentosFiscais.get(empresaId) || [];
    return docs.find((d) => d.id === id || d.chaveAcesso === id) || null;
  }

  public getLogsIntegracao(empresaId: string): IntegracaoFiscalLog[] {
    const logs = this.integracaoLogs.get(empresaId) || [];
    return [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getEventosFiscais(empresaId: string, documentoFiscalId?: string): EventoFiscal[] {
    let evs = this.eventosFiscais.get(empresaId) || [];
    if (documentoFiscalId) {
      evs = evs.filter((e) => e.documentoFiscalId === documentoFiscalId);
    }
    return evs;
  }

  // ==========================================================
  // RESERVA ATÔMICA DE NUMERAÇÃO DE SÉRIE FISCAL
  // ==========================================================
  public reservarProximoNumeroFiscal(
    empresaId: string,
    modelo: ModeloDocumentoFiscal,
    serieNumero: number,
    ambiente: AmbienteFiscal,
    usuarioId: string
  ): { numeroReservado: number; serieFiscal: SerieFiscal } {
    const series = this.seriesFiscais.get(empresaId) || [];
    let serie = series.find(
      (s) => s.modelo === modelo && s.serieNumero === serieNumero && s.ambiente === ambiente && s.ativo
    );

    if (!serie) {
      // Cria a série automaticamente se não existir
      serie = {
        id: `serie-${empresaId}-${modelo}-${serieNumero}-${ambiente}`,
        empresaId,
        modelo,
        serieNumero,
        ambiente,
        descricao: `Série ${serieNumero} - ${modelo}`,
        ultimoNumeroUtilizado: 0,
        bloqueadoParaUso: false,
        ativo: true,
        criadoEm: new Date().toISOString(),
      };
      series.push(serie);
      this.seriesFiscais.set(empresaId, series);
    }

    if (serie.bloqueadoParaUso) {
      throw new Error(`Série ${serieNumero} do modelo ${modelo} está bloqueada para novas emissões.`);
    }

    const proximoNumero = serie.ultimoNumeroUtilizado + 1;
    serie.ultimoNumeroUtilizado = proximoNumero;

    const logNum: NumeracaoFiscalLog = {
      id: `num-log-${Date.now()}-${proximoNumero}`,
      empresaId,
      serieFiscalId: serie.id,
      numeroReservado: proximoNumero,
      status: 'RESERVADO',
      reservadoPorUsuarioId: usuarioId,
      timestamp: new Date().toISOString(),
    };

    const logs = this.numeracoesLog.get(empresaId) || [];
    logs.push(logNum);
    this.numeracoesLog.set(empresaId, logs);

    return { numeroReservado: proximoNumero, serieFiscal: serie };
  }

  // ==========================================================
  // PRÉ-VALIDAÇÃO FISCAL ESTRUTURADA
  // ==========================================================
  public preValidarEmissao(empresaId: string, request: EmissaoDocumentoRequest): PreValidacaoResult {
    const config = this.getConfiguracao(empresaId) || null;
    const series = this.getSeriesFiscais(empresaId);
    const certificados = this.getCertificados(empresaId);
    const operacoes = this.getOperacoesFiscais(empresaId);
    const operacao = operacoes.find((o) => o.codigoOperacao === request.operacaoFiscalCodigo) || null;

    return fiscalValidator.validarEmissao(request, {
      configuracao: config,
      series,
      certificados,
      operacao,
    });
  }

  // ==========================================================
  // EMISSÃO DE DOCUMENTO FISCAL COM IDEMPOTÊNCIA & FATURAMENTO
  // ==========================================================
  public async emitirDocumentoFiscal(
    empresaId: string,
    request: EmissaoDocumentoRequest
  ): Promise<{
    documento: DocumentoFiscal;
    logs: IntegracaoFiscalLog[];
    reutilizadoPorIdempotencia: boolean;
    efeitosFaturamento?: FaturamentoIntegradoEfeitos;
    preValidacao?: PreValidacaoResult;
  }> {
    const docs = this.documentosFiscais.get(empresaId) || [];

    // 1. CHECAGEM DE IDEMPOTÊNCIA
    const docExistente = docs.find((d) => d.idempotencyKey === request.idempotencyKey);
    if (docExistente) {
      return {
        documento: docExistente,
        logs: [],
        reutilizadoPorIdempotencia: true,
      };
    }

    // 2. PRÉ-VALIDAÇÃO DE NEGÓCIO E SEFAZ
    const preValidacao = this.preValidarEmissao(empresaId, request);
    if (!preValidacao.valido) {
      // Cria log de rejeição prévia estruturado
      const logRejeicaoPrevia: IntegracaoFiscalLog = {
        id: `log-preval-${Date.now()}`,
        empresaId,
        documentoFiscalId: `preval-${Date.now()}`,
        servico: request.modelo === 'NFSE' ? 'NFSE_PREFEITURA' : 'SEFAZ_AUTORIZACAO',
        ambiente: request.ambiente || 'HOMOLOGACAO',
        idempotencyKey: request.idempotencyKey,
        endpointChamado: 'VAL_INTERNA_PRE_SEFAZ',
        tempoRespostaMs: 15,
        statusHttp: 422,
        payloadEnvioFormatado: JSON.stringify({ itensQtd: request.itens.length, destinatario: request.destinatario.cnpjCpf }),
        payloadRetornoFormatado: JSON.stringify({ erros: preValidacao.erros }),
        sucesso: false,
        mensagemErro: `Rejeição Pré-Emissão: ${preValidacao.erros[0]?.mensagem}`,
        timestamp: new Date().toISOString(),
      };

      const logsGlobais = this.integracaoLogs.get(empresaId) || [];
      logsGlobais.push(logRejeicaoPrevia);
      this.integracaoLogs.set(empresaId, logsGlobais);

      throw new Error(`Falha na pré-validação fiscal: ${preValidacao.erros.map((e) => e.mensagem).join(' | ')}`);
    }

    // 3. CONFIGURAÇÃO & OPERAÇÃO FISCAL
    const config = this.getConfiguracao(empresaId);
    if (!config) {
      throw new Error(`Configuração fiscal da empresa ${empresaId} não encontrada.`);
    }

    const operacoes = this.getOperacoesFiscais(empresaId);
    const operacao = operacoes.find((o) => o.codigoOperacao === request.operacaoFiscalCodigo) || operacoes[0];
    if (!operacao) {
      throw new Error(`Operação fiscal ${request.operacaoFiscalCodigo} não cadastrada.`);
    }

    const ambiente = request.ambiente || config.ambientePadrao;
    const serieNumero = request.serieNumero || 1;

    // 4. RESERVA ATÔMICA DO NÚMERO FISCAL
    const { numeroReservado, serieFiscal } = this.reservarProximoNumeroFiscal(
      empresaId,
      request.modelo,
      serieNumero,
      ambiente,
      request.usuarioId
    );

    // 5. MOTOR FISCAL: CÁLCULO DE ITENS E TRIBUTOS
    const produtos = this.getTributacoesProdutos(empresaId);
    const servicos = this.getTributacoesServicos(empresaId);
    const regras = this.getRegrasTributarias(empresaId);

    const contexto = {
      configuracaoEmpresa: config,
      operacao,
      ufOrigem: config.ufEmissao,
      ufDestino: request.destinatario.endereco.uf,
      indicadorIeDestinatario: request.destinatario.indicadorIe,
      regrasTributarias: regras,
    };

    const itensCalculados = request.itens.map((it, idx) => {
      const prod = produtos.find((p) => p.codigoProduto === it.codigoItem || p.produtoId === it.produtoId);
      const serv = servicos.find((s) => s.codigoServico === it.codigoItem || s.servicoId === it.servicoId);

      return motorFiscalService.calcularTributosItem(
        {
          produto: prod,
          servico: serv,
          codigoItem: it.codigoItem,
          descricao: it.descricao,
          quantidade: it.quantidade,
          valorUnitario: it.valorUnitario,
          valorDesconto: it.valorDesconto,
          cfopManual: it.cfopManual,
          ncmManual: it.ncmManual,
          loteNumero: it.loteNumero,
        },
        contexto,
        idx + 1
      );
    });

    const totais = motorFiscalService.consolidarTotaisDocumento(itensCalculados);

    // 6. CRIAÇÃO DO DOCUMENTO EM ESTADO RASCUNHO / VALIDADO
    const novoDocId = `doc-${empresaId}-${Date.now()}`;
    const dataHoraEmissao = new Date().toISOString();

    const novoDocumento: DocumentoFiscal = {
      id: novoDocId,
      empresaId,
      modelo: request.modelo,
      serie: serieFiscal.serieNumero,
      numeroDocumento: numeroReservado,
      tipoEmissao: 'NORMAL',
      ambiente,
      status: 'RASCUNHO',
      naturezaOperacao: operacao.descricaoNatureza,
      operacaoFiscalId: operacao.id,
      tipoOperacao: operacao.tipoOperacao,
      dataHoraEmissao,
      destinatario: request.destinatario,
      itens: itensCalculados,
      totais,
      transporte: request.transporte,
      cobranca: request.cobranca,
      informacoesAdicionais: {
        dadosAdicionaisFisco: config.observacoesFiscoPadrao,
        dadosAdicionaisContribuinte: [
          request.observacoesContribuinte,
          request.chaveReferenciadaNFe ? `NF-e Ref: ${request.chaveReferenciadaNFe}` : null,
          config.observacoesContribuintePadrao,
        ]
          .filter(Boolean)
          .join(' | '),
      },
      idempotencyKey: request.idempotencyKey,
      pedidoOrigemId: request.pedidoOrigemId,
      usuarioEmissorId: request.usuarioId,
      criadoEm: dataHoraEmissao,
      atualizadoEm: dataHoraEmissao,
    };

    // 7. TRANSMISSÃO ATRAVÉS DO ADAPTER APROPRIADO
    let respostaEmissao;
    const certAlias = config.certificadoReferenciaId || 'cert-default';

    if (request.modelo === 'NFE_55' || request.modelo === 'NFCE_65') {
      respostaEmissao = await this.nfeAdapter.transmitirNFe(empresaId, novoDocumento, ambiente, certAlias);
    } else if (request.modelo === 'NFSE') {
      respostaEmissao = await this.nfseAdapter.transmitirNFS(empresaId, novoDocumento, ambiente, certAlias);
    } else {
      throw new Error(`Modelo fiscal ${request.modelo} não possui adapter configurado.`);
    }

    // 8. ATUALIZAÇÃO DO STATUS E PROTOCOLO
    let efeitosFaturamento: FaturamentoIntegradoEfeitos | undefined;

    if (respostaEmissao.sucesso) {
      novoDocumento.status = 'AUTORIZADO';
      novoDocumento.chaveAcesso = respostaEmissao.chaveAcesso;
      novoDocumento.protocoloAutorizacao = respostaEmissao.protocoloAutorizacao;
      novoDocumento.dataHoraAutorizacao = respostaEmissao.dataHoraAutorizacao;
      novoDocumento.codigoStatusSefaz = respostaEmissao.codigoStatusSefaz;
      novoDocumento.motivoStatusSefaz = respostaEmissao.motivoStatusSefaz;
      novoDocumento.xmlAssinado = respostaEmissao.xmlAssinado;
      novoDocumento.xmlDistribuicaoProtocolado = respostaEmissao.xmlDistribuicaoProtocolado;
      novoDocumento.pdfDanfeUrl = respostaEmissao.pdfDanfeUrl;
      novoDocumento.codigoVerificacaoNfse = respostaEmissao.codigoVerificacaoNfse;
      novoDocumento.numeroRps = respostaEmissao.numeroRps;
      novoDocumento.serieRps = respostaEmissao.serieRps;

      // DISPARO DE EFEITOS PÓS-AUTORIZAÇÃO (Estoque, Financeiro, Transferência Intercompany)
      efeitosFaturamento = await faturamentoIntegracaoService.processarEfeitosPosAutorizacao(
        empresaId,
        novoDocumento,
        operacao,
        request.usuarioId,
        request.empresaDestinoIntercompanyId
      );
    } else {
      novoDocumento.status = 'REJEITADO';
      novoDocumento.codigoStatusSefaz = respostaEmissao.codigoStatusSefaz;
      novoDocumento.motivoStatusSefaz = respostaEmissao.motivoStatusSefaz;
    }

    novoDocumento.atualizadoEm = new Date().toISOString();

    // 9. PERSISTÊNCIA DOS LOGS E DO DOCUMENTO
    docs.push(novoDocumento);
    this.documentosFiscais.set(empresaId, docs);

    const logsGlobais = this.integracaoLogs.get(empresaId) || [];
    logsGlobais.push(...respostaEmissao.logsIntegracao);
    this.integracaoLogs.set(empresaId, logsGlobais);

    return {
      documento: novoDocumento,
      logs: respostaEmissao.logsIntegracao,
      reutilizadoPorIdempotencia: false,
      efeitosFaturamento,
      preValidacao,
    };
  }

  // ==========================================================
  // INUTILIZAÇÃO DE FAIXA DE NUMERAÇÃO FISCAL
  // ==========================================================
  public async inutilizarNumeracaoFiscal(
    empresaId: string,
    request: InutilizacaoRequest
  ): Promise<InutilizacaoResponse> {
    if (!request.justificativa || request.justificativa.trim().length < 15) {
      throw new Error('A justificativa para inutilização deve conter no mínimo 15 caracteres.');
    }
    if (request.numeroInicial > request.numeroFinal) {
      throw new Error('Número fiscal inicial não pode ser maior que o número final.');
    }

    const config = this.getConfiguracao(empresaId);
    const ambiente = request.ambiente || config?.ambientePadrao || 'HOMOLOGACAO';
    const protocolo = `135260${Math.floor(100000000 + Math.random() * 900000000)}`;
    const dataHora = new Date().toISOString();

    const logIntegracao: IntegracaoFiscalLog = {
      id: `log-inut-${Date.now()}`,
      empresaId,
      documentoFiscalId: `inut-${request.serie}-${request.numeroInicial}-${request.numeroFinal}`,
      servico: 'SEFAZ_INUTILIZACAO',
      ambiente,
      idempotencyKey: `inut-${empresaId}-${request.serie}-${request.numeroInicial}-${request.numeroFinal}`,
      endpointChamado: `https://nfe.sefaz.gov.br/ws/NFeInutilizacao4?env=${ambiente}`,
      tempoRespostaMs: 140,
      statusHttp: 200,
      payloadEnvioFormatado: JSON.stringify({
        tpAmb: ambiente === 'PRODUCAO' ? 1 : 2,
        ano: request.ano,
        CNPJ: '12345678000190',
        mod: 55,
        serie: request.serie,
        nNFIni: request.numeroInicial,
        nNFFin: request.numeroFinal,
        xJust: request.justificativa,
      }),
      payloadRetornoFormatado: JSON.stringify({
        cStat: 102,
        xMotivo: 'Inutilizacao de numero homologada',
        nProt: protocolo,
        dhRecbto: dataHora,
      }),
      sucesso: true,
      timestamp: dataHora,
    };

    const logs = this.integracaoLogs.get(empresaId) || [];
    logs.push(logIntegracao);
    this.integracaoLogs.set(empresaId, logs);

    // Registra evento fiscal de inutilização
    const eventos = this.eventosFiscais.get(empresaId) || [];
    eventos.push({
      id: `ev-inut-${Date.now()}`,
      empresaId,
      documentoFiscalId: `inut-${request.serie}-${request.numeroInicial}-${request.numeroFinal}`,
      chaveAcesso: '',
      tipoEvento: 'INUTILIZACAO',
      numeroSequencialEvento: 1,
      dataHoraEvento: dataHora,
      detalhesEvento: {
        justificativa: request.justificativa,
        serieInutilizada: request.serie,
        numeroInicialInutilizado: request.numeroInicial,
        numeroFinalInutilizado: request.numeroFinal,
      },
      statusSefaz: 'AUTORIZADO',
      protocoloEvento: protocolo,
      codigoStatusSefaz: 102,
      motivoStatusSefaz: 'Inutilização de número homologada com sucesso',
      usuarioSolicitanteId: request.usuarioId,
      criadoEm: dataHora,
    });
    this.eventosFiscais.set(empresaId, eventos);

    return {
      sucesso: true,
      protocoloInutilizacao: protocolo,
      dataHoraInutilizacao: dataHora,
      codigoStatusSefaz: 102,
      motivoStatusSefaz: 'Inutilização de número homologada com sucesso',
      logsIntegracao: [logIntegracao],
    };
  }

  // ==========================================================
  // IMPORTAÇÃO E PARSER DE XML DE NOTAS FISCAIS
  // ==========================================================
  public async importarXmlFiscal(
    empresaId: string,
    xmlConteudo: string,
    usuarioId: string
  ): Promise<ImportacaoXmlResult> {
    try {
      const parsed = xmlParserService.parsearXmlNFe(xmlConteudo);
      const docFiscal = xmlParserService.converterXmlParaDocumentoFiscal(empresaId, parsed, usuarioId);

      // Adiciona aos documentos da empresa
      const docs = this.documentosFiscais.get(empresaId) || [];
      docs.push(docFiscal);
      this.documentosFiscais.set(empresaId, docs);

      // Efeitos de estoque e financeiro para o documento importado
      const operacaoImport: OperacaoFiscal = {
        id: `op-import-${empresaId}`,
        empresaId,
        codigoOperacao: 'COMPRA_INSUMOS',
        descricaoNatureza: parsed.naturezaOperacao,
        tipoOperacao: 'ENTRADA',
        cfopPadraoEstadual: '1101',
        cfopPadraoInterestadual: '2101',
        cfopPadraoExterior: '3101',
        finalidade: 'NORMAL',
        movimentaEstoque: true,
        geraFinanceiro: true,
        consumidorFinalPadrao: false,
        indicadorPresencaPadrao: 'OUTROS',
        ativo: true,
      };

      const efeitos = await faturamentoIntegracaoService.processarEfeitosPosAutorizacao(
        empresaId,
        docFiscal,
        operacaoImport,
        usuarioId
      );

      return {
        sucesso: true,
        documentoId: docFiscal.id,
        documentoParsed: parsed,
        documentoCriado: docFiscal,
        estoqueAtualizado: efeitos.estoqueAtualizado,
        financeiroGerado: efeitos.financeiroGerado,
        movimentosEstoqueIds: efeitos.movimentosEstoque.map((m) => m.id),
        titulosFinanceirosIds: efeitos.titulosFinanceiros.map((t) => t.id),
        mensagem: `NF-e ${parsed.numeroDocumento} importada com sucesso. Estoque e Contas a Pagar alimentados.`,
      };
    } catch (err: any) {
      return {
        sucesso: false,
        estoqueAtualizado: false,
        financeiroGerado: false,
        movimentosEstoqueIds: [],
        titulosFinanceirosIds: [],
        mensagem: `Erro ao importar XML: ${err.message || err}`,
        erros: [err.message || String(err)],
      };
    }
  }

  // ==========================================================
  // REPROCESSAMENTO SEGURO DE NOTA REJEITADA
  // ==========================================================
  public async reprocessarTentativaRejeitada(
    empresaId: string,
    documentoId: string,
    requestCorrigido: EmissaoDocumentoRequest,
    usuarioId: string
  ): Promise<{ documento: DocumentoFiscal; logs: IntegracaoFiscalLog[] }> {
    const docOriginal = this.getDocumentoById(empresaId, documentoId);
    if (!docOriginal) {
      throw new Error(`Documento fiscal ${documentoId} não encontrado.`);
    }

    if (docOriginal.status !== 'REJEITADO') {
      throw new Error(`Apenas documentos com status REJEITADO podem ser reprocessados.`);
    }

    // Gera nova idempotencyKey segura com timestamp de retry
    const retryRequest: EmissaoDocumentoRequest = {
      ...requestCorrigido,
      idempotencyKey: `retry-${docOriginal.numeroDocumento}-${Date.now()}`,
      serieNumero: docOriginal.serie,
      usuarioId,
    };

    const resultado = await this.emitirDocumentoFiscal(empresaId, retryRequest);

    // Atualiza status do rascunho anterior para mantê-lo no histórico
    docOriginal.motivoStatusSefaz = `Substituído por reprocessamento seguro (Nova chave: ${resultado.documento.chaveAcesso})`;
    docOriginal.status = 'SUBSTITUIDO';

    return {
      documento: resultado.documento,
      logs: resultado.logs,
    };
  }

  public getTitulosFinanceiros(empresaId: string) {
    return faturamentoIntegracaoService.getTitulosFinanceiros(empresaId);
  }

  public getAuditoriaLogsFaturamento(empresaId: string) {
    return faturamentoIntegracaoService.getAuditoriaLogs(empresaId);
  }

  // ==========================================================
  // REGISTRO DE EVENTO FISCAL (CC-e / CANCELAMENTO)
  // ==========================================================
  public async registrarEventoFiscal(
    empresaId: string,
    documentoFiscalId: string,
    tipoEvento: 'CANCELAMENTO' | 'CARTA_CORRECAO_CCE',
    detalhes: { justificativa?: string; textoCorrecao?: string },
    usuarioId: string
  ): Promise<{ evento: EventoFiscal; documento: DocumentoFiscal }> {
    const doc = this.getDocumentoById(empresaId, documentoFiscalId);
    if (!doc) {
      throw new Error(`Documento fiscal ${documentoFiscalId} não encontrado.`);
    }

    if (doc.status !== 'AUTORIZADO') {
      throw new Error(`Apenas documentos AUTORIZADOS podem receber eventos. Status atual: ${doc.status}`);
    }

    const config = this.getConfiguracao(empresaId);
    const ambiente = doc.ambiente;
    const certAlias = config?.certificadoReferenciaId || 'cert-default';

    const eventos = this.eventosFiscais.get(empresaId) || [];
    const seq = eventos.filter((e) => e.documentoFiscalId === doc.id && e.tipoEvento === tipoEvento).length + 1;

    const novoEvento: EventoFiscal = {
      id: `ev-${Date.now()}`,
      empresaId,
      documentoFiscalId: doc.id,
      chaveAcesso: doc.chaveAcesso || '',
      tipoEvento,
      numeroSequencialEvento: seq,
      dataHoraEvento: new Date().toISOString(),
      detalhesEvento: detalhes,
      statusSefaz: 'PENDENTE',
      usuarioSolicitanteId: usuarioId,
      criadoEm: new Date().toISOString(),
    };

    let resposta;
    if (doc.modelo === 'NFE_55' || doc.modelo === 'NFCE_65') {
      resposta = await this.nfeAdapter.transmitirEvento(empresaId, novoEvento, ambiente, certAlias);
    } else if (doc.modelo === 'NFSE' && tipoEvento === 'CANCELAMENTO') {
      resposta = await this.nfseAdapter.cancelarNFSe(
        empresaId,
        doc.numeroDocumento,
        doc.codigoVerificacaoNfse || '',
        detalhes.justificativa || 'Cancelamento solicitado pelo usuário',
        ambiente
      );
    } else {
      throw new Error(`Evento ${tipoEvento} não suportado para o modelo ${doc.modelo}.`);
    }

    if (resposta.sucesso) {
      novoEvento.statusSefaz = 'AUTORIZADO';
      novoEvento.protocoloEvento = resposta.protocoloEvento;
      novoEvento.codigoStatusSefaz = resposta.codigoStatusSefaz;
      novoEvento.motivoStatusSefaz = resposta.motivoStatusSefaz;
      novoEvento.xmlEventoAssinado = resposta.xmlEventoAssinado;

      if (tipoEvento === 'CANCELAMENTO') {
        doc.status = 'CANCELADO';
        doc.atualizadoEm = new Date().toISOString();
      }
    } else {
      novoEvento.statusSefaz = 'REJEITADO';
      novoEvento.codigoStatusSefaz = resposta.codigoStatusSefaz;
      novoEvento.motivoStatusSefaz = resposta.motivoStatusSefaz;
    }

    eventos.push(novoEvento);
    this.eventosFiscais.set(empresaId, eventos);

    const logs = this.integracaoLogs.get(empresaId) || [];
    logs.push(...resposta.logsIntegracao);
    this.integracaoLogs.set(empresaId, logs);

    return { evento: novoEvento, documento: doc };
  }

  // ==========================================================
  // STATUS DOS SERVIÇOS FISCAIS (SEFAZ / PREFEITURAS)
  // ==========================================================
  public async verificarStatusServicos(empresaId: string): Promise<{
    sefazNfe: any;
    nfseMunicipal: any;
    ambienteAtivo: AmbienteFiscal;
  }> {
    const config = this.getConfiguracao(empresaId);
    const amb = config?.ambientePadrao || 'HOMOLOGACAO';
    const uf = config?.ufEmissao || 'SP';
    const ibge = config?.codigoMunicipioIBGE || '3550308';

    const sefaz = await this.nfeAdapter.consultarStatusServico(empresaId, uf, amb);
    const nfse = await this.nfseAdapter.consultarStatusServicoMunicipal(empresaId, ibge, amb);

    return {
      sefazNfe: sefaz,
      nfseMunicipal: nfse,
      ambienteAtivo: amb,
    };
  }
}

export const fiscalService = new FiscalService();
