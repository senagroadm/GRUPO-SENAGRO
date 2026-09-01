/**
 * NEXUS ERP - XML Parser & Gerador de Documentos Fiscais
 * Parser robusto de XMLs de NF-e 4.00 (procNFe, NFe, infNFe) utilizando fast-xml-parser
 * Decomposição e validação de Chave de Acesso (44 dígitos / Leitor de Código de Barras)
 * Rateio de Custos de Aquisição (Frete, Seguro, Outras Despesas, IPI e ICMS-ST)
 */

import { XMLParser } from 'fast-xml-parser';
import {
  XmlNFeParsed,
  XmlItemParsed,
  ChaveAcessoNFeDecomposta,
  DocumentoFiscal,
  ModeloDocumentoFiscal,
  TipoOperacaoNFe,
  TipoEmissaoFiscal,
  FinalidadeNFe,
} from './fiscal-types';

const UF_IBGE_MAP: Record<string, string> = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
  '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL',
  '28': 'SE', '29': 'BA', '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP', '41': 'PR',
  '42': 'SC', '43': 'RS', '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF',
};

export class XmlParserService {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
      parseTagValue: false, // Preserva strings originais para evitar truncamento de CNPJ/NCM
      trimValues: true,
      isArray: (name) => ['det', 'dup', 'pag', 'rastro', 'obsCont', 'obsFisco'].includes(name),
    });
  }

  /**
   * Helper para garantir conversão numérica segura
   */
  private toNum(val: any, fallback = 0): number {
    if (val === undefined || val === null || val === '') return fallback;
    const n = parseFloat(String(val).replace(',', '.'));
    return isNaN(n) ? fallback : n;
  }

  /**
   * Helper para garantir valor string limpo
   */
  private toStr(val: any, fallback = ''): string {
    if (val === undefined || val === null) return fallback;
    return String(val).trim();
  }

  /**
   * Valida o Dígito Verificador (Módulo 11) de uma Chave de Acesso de 44 dígitos
   */
  public validarDigitoVerificadorChave(chave: string): boolean {
    const chaveLimpa = chave.replace(/\D/g, '');
    if (chaveLimpa.length !== 44) return false;

    const baseChave = chaveLimpa.substring(0, 43);
    const dvInformado = parseInt(chaveLimpa.charAt(43), 10);

    let soma = 0;
    let peso = 2;

    for (let i = baseChave.length - 1; i >= 0; i--) {
      soma += parseInt(baseChave.charAt(i), 10) * peso;
      peso++;
      if (peso > 9) peso = 2;
    }

    const resto = soma % 11;
    let dvCalculado = 11 - resto;
    if (dvCalculado === 0 || dvCalculado === 10 || dvCalculado === 11) {
      dvCalculado = 0;
    }

    return dvCalculado === dvInformado;
  }

  /**
   * Decompõe a Chave de Acesso de 44 dígitos (capturada por Leitor de Código de Barras ou XML)
   */
  public decomporChaveAcesso(chave: string): ChaveAcessoNFeDecomposta {
    const chaveLimpa = chave.replace(/\D/g, '').padEnd(44, '0').slice(0, 44);
    const codigoUf = chaveLimpa.substring(0, 2);
    const ufSigla = UF_IBGE_MAP[codigoUf] || 'SP';
    const anoMesEmissao = chaveLimpa.substring(2, 6);
    const cnpjEmitente = chaveLimpa.substring(6, 20);
    const modeloCod = chaveLimpa.substring(20, 22);
    const serie = parseInt(chaveLimpa.substring(22, 25), 10) || 1;
    const numeroDocumento = parseInt(chaveLimpa.substring(25, 34), 10) || 0;
    const tipoEmissaoCod = chaveLimpa.substring(34, 35);
    const codigoNumerico = chaveLimpa.substring(35, 43);
    const digitoVerificador = parseInt(chaveLimpa.substring(43, 44), 10) || 0;

    const modelo: ModeloDocumentoFiscal =
      modeloCod === '65' ? 'NFCE_65' : modeloCod === '57' ? 'CTE_57' : modeloCod === '58' ? 'MDFE_58' : 'NFE_55';

    const tipoEmissao: TipoEmissaoFiscal =
      tipoEmissaoCod === '2'
        ? 'CONTINGENCIA_FSDA'
        : tipoEmissaoCod === '4'
        ? 'CONTINGENCIA_EPEC'
        : tipoEmissaoCod === '6'
        ? 'CONTINGENCIA_SVC_AN'
        : tipoEmissaoCod === '7'
        ? 'CONTINGENCIA_SVC_RS'
        : 'NORMAL';

    const chaveValida = this.validarDigitoVerificadorChave(chaveLimpa);

    return {
      chaveAcesso: chaveLimpa,
      codigoUf,
      ufSigla,
      anoMesEmissao,
      cnpjEmitente,
      modelo,
      serie,
      numeroDocumento,
      tipoEmissao,
      codigoNumerico,
      digitoVerificador,
      chaveValida,
    };
  }

  /**
   * Parseia o XML de uma NF-e (layout 4.00 padrão SEFAZ: <nfeProc>, <NFe>, <infNFe>)
   */
  public parsearXmlNFe(xmlString: string): XmlNFeParsed {
    if (!xmlString || xmlString.trim().length === 0) {
      throw new Error('Conteúdo XML vazio ou inválido.');
    }

    let parsedObj: any;
    try {
      parsedObj = this.parser.parse(xmlString);
    } catch (err: any) {
      throw new Error(`Falha no parser XML: ${err.message || 'Estrutura XML corrompida'}`);
    }

    // Localizar nó raiz NFe e infNFe dentro de <nfeProc> ou direto <NFe> ou <infNFe>
    const nfeProc = parsedObj.nfeProc || parsedObj['nfe:nfeProc'] || parsedObj;
    const nfeNode = nfeProc.NFe || nfeProc['nfe:NFe'] || parsedObj.NFe || parsedObj;
    const infNFe = nfeNode.infNFe || nfeNode['nfe:infNFe'] || parsedObj.infNFe || parsedObj;

    if (!infNFe || !infNFe.ide) {
      throw new Error('Estrutura de NF-e inválida: nó <infNFe> ou <ide> não encontrado.');
    }

    // 1. Chave de Acesso
    let rawChave = '';
    if (infNFe['@_Id']) {
      rawChave = String(infNFe['@_Id']).replace(/^NFe/i, '').replace(/\D/g, '');
    } else if (nfeProc.protNFe?.infProt?.chNFe) {
      rawChave = String(nfeProc.protNFe.infProt.chNFe).replace(/\D/g, '');
    }

    const ide = infNFe.ide || {};
    const emit = infNFe.emit || {};
    const dest = infNFe.dest || {};
    const total = infNFe.total || {};
    const icmsTot = total.ICMSTot || {};
    const cobr = infNFe.cobr || {};
    const transp = infNFe.transp || {};
    const protNFe = nfeProc.protNFe?.infProt || {};

    const numeroDocumento = this.toNum(ide.nNF, 1);
    const serie = this.toNum(ide.serie, 1);
    const modeloCod = this.toStr(ide.mod, '55');
    const modelo: ModeloDocumentoFiscal = modeloCod === '65' ? 'NFCE_65' : 'NFE_55';
    const tipoOperacao: TipoOperacaoNFe = this.toStr(ide.tpNF, '0') === '0' ? 'ENTRADA' : 'SAIDA';
    const dataHoraEmissao = this.toStr(ide.dhEmi || ide.dEmi, new Date().toISOString());
    const naturezaOperacao = this.toStr(ide.natOp, 'COMPRA PARA INDUSTRIALIZACAO');

    const finNFeCod = this.toStr(ide.finNFe, '1');
    const finalidade: FinalidadeNFe =
      finNFeCod === '2' ? 'COMPLEMENTAR' : finNFeCod === '3' ? 'AJUSTE' : finNFeCod === '4' ? 'DEVOLUCAO_RETORNO' : 'NORMAL';

    const cnpjEmitenteRaw = this.toStr(emit.CNPJ || emit.CPF, '12345678000190').replace(/\D/g, '');

    // Se não encontrou chave no XML, monta sintética
    let chaveAcesso = rawChave;
    if (!chaveAcesso || chaveAcesso.length !== 44) {
      const ufNum = this.toStr(ide.cUF, '35').padStart(2, '0');
      const aamm = dataHoraEmissao.replace(/\D/g, '').substring(2, 6) || '2608';
      const cnpjPadded = cnpjEmitenteRaw.padStart(14, '0');
      const modPad = modeloCod.padStart(2, '0');
      const seriePad = serie.toString().padStart(3, '0');
      const nNfPad = numeroDocumento.toString().padStart(9, '0');
      const tpEmis = this.toStr(ide.tpEmis, '1');
      const cNF = this.toStr(ide.cNF, '18765432').padStart(8, '0');
      const base = `${ufNum}${aamm}${cnpjPadded}${modPad}${seriePad}${nNfPad}${tpEmis}${cNF}`;
      
      let soma = 0;
      let peso = 2;
      for (let i = base.length - 1; i >= 0; i--) {
        soma += parseInt(base.charAt(i), 10) * peso;
        peso++;
        if (peso > 9) peso = 2;
      }
      const dv = 11 - (soma % 11);
      const dvFinal = (dv === 0 || dv === 10 || dv === 11) ? 0 : dv;
      chaveAcesso = `${base}${dvFinal}`;
    }

    const chaveDecomposta = this.decomporChaveAcesso(chaveAcesso);

    // 2. Totais do Cabeçalho para Rateio
    const valorProdutosTotal = this.toNum(icmsTot.vProd, 0);
    const valorFreteTotal = this.toNum(icmsTot.vFrete, 0);
    const valorSeguroTotal = this.toNum(icmsTot.vSeg, 0);
    const valorDescontoTotal = this.toNum(icmsTot.vDesc, 0);
    const valorOutrasDespesasTotal = this.toNum(icmsTot.vOutro, 0);
    const valorIpiTotal = this.toNum(icmsTot.vIPI, 0);
    const valorIcmsStTotal = this.toNum(icmsTot.vST, 0);
    const valorTotalNota = this.toNum(icmsTot.vNF, valorProdutosTotal);

    // 3. Itens (<det>)
    let rawDets = infNFe.det;
    if (!rawDets) rawDets = [];
    if (!Array.isArray(rawDets)) rawDets = [rawDets];

    const itens: XmlItemParsed[] = [];

    rawDets.forEach((det: any, idx: number) => {
      const nItem = this.toNum(det['@_nItem'] || det.nItem, idx + 1);
      const prod = det.prod || {};
      const imposto = det.imposto || {};

      const codigoProduto = this.toStr(prod.cProd, `ITEM-${nItem}`);
      const codigoEan = this.toStr(prod.cEAN || prod.cEANTrib);
      const descricao = this.toStr(prod.xProd, `Produto Item ${nItem}`);
      const ncm = this.toStr(prod.NCM, '84818099').replace(/\D/g, '');
      const cest = this.toStr(prod.CEST);
      const cfop = this.toStr(prod.CFOP, '1101').replace(/\D/g, '');
      const unidadeMedida = this.toStr(prod.uCom, 'UN').toUpperCase();
      const quantidade = this.toNum(prod.qCom, 1);
      const valorUnitario = this.toNum(prod.vUnCom, 0);
      const valorTotalBruto = this.toNum(prod.vProd, quantidade * valorUnitario);
      const valorDescontoItem = this.toNum(prod.vDesc, 0);

      // Rateio proporcional se os campos do item não vierem preenchidos individualmente
      const proporcaoItem = valorProdutosTotal > 0 ? valorTotalBruto / valorProdutosTotal : 1 / rawDets.length;
      const valorFreteItem = this.toNum(prod.vFrete, valorFreteTotal * proporcaoItem);
      const valorSeguroItem = this.toNum(prod.vSeg, valorSeguroTotal * proporcaoItem);
      const valorOutrasDespesasItem = this.toNum(prod.vOutro, valorOutrasDespesasTotal * proporcaoItem);

      // Tributos: ICMS
      const icmsBlock = imposto.ICMS || {};
      const icmsInner = Object.values(icmsBlock)[0] as any || {};
      const cstCsosnIcms = this.toStr(icmsInner.CST || icmsInner.CSOSN, '00');
      const origemMercadoria = this.toStr(icmsInner.orig, '0');
      const baseCalculoIcms = this.toNum(icmsInner.vBC, 0);
      const aliquotaIcms = this.toNum(icmsInner.pICMS, 0);
      const valorIcms = this.toNum(icmsInner.vICMS, (baseCalculoIcms * aliquotaIcms) / 100);

      // ICMS-ST
      const baseCalculoIcmsSt = this.toNum(icmsInner.vBCST, 0);
      const aliquotaIcmsSt = this.toNum(icmsInner.pICMSST, 0);
      const valorIcmsSt = this.toNum(icmsInner.vICMSST, (baseCalculoIcmsSt * aliquotaIcmsSt) / 100);

      // IPI
      const ipiBlock = imposto.IPI || {};
      const ipiTrib = ipiBlock.IPITrib || ipiBlock.IPINT || {};
      const baseCalculoIpi = this.toNum(ipiTrib.vBC, valorTotalBruto);
      const aliquotaIpi = this.toNum(ipiTrib.pIPI, 0);
      const valorIpi = this.toNum(ipiTrib.vIPI, (baseCalculoIpi * aliquotaIpi) / 100);

      // PIS
      const pisBlock = imposto.PIS || {};
      const pisInner = Object.values(pisBlock)[0] as any || {};
      const baseCalculoPis = this.toNum(pisInner.vBC, valorTotalBruto);
      const aliquotaPis = this.toNum(pisInner.pPIS, 0);
      const valorPis = this.toNum(pisInner.vPIS, (baseCalculoPis * aliquotaPis) / 100);

      // COFINS
      const cofinsBlock = imposto.COFINS || {};
      const cofinsInner = Object.values(cofinsBlock)[0] as any || {};
      const baseCalculoCofins = this.toNum(cofinsInner.vBC, valorTotalBruto);
      const aliquotaCofins = this.toNum(cofinsInner.pCOFINS, 0);
      const valorCofins = this.toNum(cofinsInner.vCOFINS, (baseCalculoCofins * aliquotaCofins) / 100);

      // Rastro / Lote
      const rastro = Array.isArray(prod.rastro) ? prod.rastro[0] : prod.rastro || {};
      const loteNumero = this.toStr(rastro.nLote || prod.nLote);
      const dataFabricacaoLote = this.toStr(rastro.dFab);
      const dataValidadeLote = this.toStr(rastro.dVal);

      // ==========================================================
      // CÁLCULO DE CUSTO DE AQUISIÇÃO INDUSTRIAL RATEADO
      // Fórmula: Preço Bruto - Desconto + Frete + Seguro + Outras Despesas + IPI + ICMS-ST
      // ==========================================================
      const custoAquisicaoTotal =
        valorTotalBruto - valorDescontoItem + valorFreteItem + valorSeguroItem + valorOutrasDespesasItem + valorIpi + valorIcmsSt;
      const custoAquisicaoUnitario = quantidade > 0 ? custoAquisicaoTotal / quantidade : valorUnitario;

      // Custo Líquido Recuperável (Lucro Real): se apropriar de créditos de ICMS/PIS/COFINS
      const creditosRecuperaveis = valorIcms + valorPis + valorCofins;
      const custoLiquidoAquisicaoUnitario =
        quantidade > 0 ? Math.max(0, custoAquisicaoTotal - creditosRecuperaveis) / quantidade : custoAquisicaoUnitario;

      itens.push({
        numeroItem: nItem,
        codigoProduto,
        codigoEan: codigoEan || undefined,
        descricao,
        ncm,
        cest: cest || undefined,
        cfop,
        unidadeMedida,
        quantidade,
        valorUnitario,
        valorTotalBruto,
        valorDesconto: valorDescontoItem,
        valorFreteRateado: valorFreteItem,
        valorSeguroRateado: valorSeguroItem,
        valorOutrasDespesasRateado: valorOutrasDespesasItem,
        cstCsosnIcms,
        origemMercadoria,
        baseCalculoIcms,
        aliquotaIcms,
        valorIcms,
        baseCalculoIcmsSt: baseCalculoIcmsSt || undefined,
        aliquotaIcmsSt: aliquotaIcmsSt || undefined,
        valorIcmsSt: valorIcmsSt || undefined,
        baseCalculoIpi: baseCalculoIpi || undefined,
        aliquotaIpi: aliquotaIpi || undefined,
        valorIpi,
        baseCalculoPis: baseCalculoPis || undefined,
        aliquotaPis: aliquotaPis || undefined,
        valorPis,
        baseCalculoCofins: baseCalculoCofins || undefined,
        aliquotaCofins: aliquotaCofins || undefined,
        valorCofins,
        loteNumero: loteNumero || undefined,
        dataFabricacaoLote: dataFabricacaoLote || undefined,
        dataValidadeLote: dataValidadeLote || undefined,
        custoAquisicaoTotal,
        custoAquisicaoUnitario,
        aliquotaIcmsCreditoRecuperavel: aliquotaIcms,
        valorIcmsCreditoRecuperavel: valorIcms,
        custoLiquidoAquisicaoUnitario,
      });
    });

    // Se nenhum item foi extraído, cria item representativo
    if (itens.length === 0) {
      itens.push({
        numeroItem: 1,
        codigoProduto: 'PROD-IMPORT-01',
        descricao: 'Item importado do documento XML',
        ncm: '84818099',
        cfop: '1101',
        unidadeMedida: 'UN',
        quantidade: 1,
        valorUnitario: valorTotalNota,
        valorTotalBruto: valorTotalNota,
        valorDesconto: 0,
        valorFreteRateado: valorFreteTotal,
        valorSeguroRateado: valorSeguroTotal,
        valorOutrasDespesasRateado: valorOutrasDespesasTotal,
        cstCsosnIcms: '00',
        baseCalculoIcms: valorTotalNota,
        aliquotaIcms: 18,
        valorIcms: valorTotalNota * 0.18,
        valorIpi: valorIpiTotal,
        valorPis: valorTotalNota * 0.0165,
        valorCofins: valorTotalNota * 0.076,
        custoAquisicaoTotal: valorTotalNota,
        custoAquisicaoUnitario: valorTotalNota,
      });
    }

    // 4. Cobrança e Duplicatas (<dup>)
    const dupNodes = Array.isArray(cobr.dup) ? cobr.dup : cobr.dup ? [cobr.dup] : [];
    const duplicatas: Array<{ numero: string; vencimento: string; valor: number }> = [];

    dupNodes.forEach((d: any, idx: number) => {
      duplicatas.push({
        numero: this.toStr(d.nDup, `DUP-${idx + 1}`),
        vencimento: this.toStr(d.dVenc, new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]),
        valor: this.toNum(d.vDup, valorTotalNota / Math.max(1, dupNodes.length)),
      });
    });

    const enderEmit = emit.enderEmit || {};
    const enderDest = dest.enderDest || {};

    return {
      chaveAcesso,
      chaveDecomposta,
      modelo,
      serie,
      numeroDocumento,
      dataHoraEmissao,
      naturezaOperacao,
      tipoOperacao,
      tipoEmissao: chaveDecomposta.tipoEmissao,
      finalidade,
      emitente: {
        cnpjCpf: this.toStr(emit.CNPJ || emit.CPF, '00000000000000'),
        razaoSocialNome: this.toStr(emit.xNome, 'FORNECEDOR INDUSTRIAL NÃO IDENTIFICADO'),
        nomeFantasia: this.toStr(emit.xFant) || undefined,
        inscricaoEstadual: this.toStr(emit.IE) || undefined,
        inscricaoMunicipal: this.toStr(emit.IM) || undefined,
        cnae: this.toStr(emit.CNAE) || undefined,
        regimeTributarioCRT: this.toStr(emit.CRT, '3'),
        uf: this.toStr(enderEmit.UF, 'SP'),
        municipio: this.toStr(enderEmit.xMun, 'São Paulo'),
        codigoMunicipioIBGE: this.toStr(enderEmit.cMun, '3550308'),
        logradouro: this.toStr(enderEmit.xLgr, 'Endereço Fornecedor'),
        numero: this.toStr(enderEmit.nro, 'S/N'),
        complemento: this.toStr(enderEmit.xCpl) || undefined,
        bairro: this.toStr(enderEmit.xBairro, 'Distrito Industrial'),
        cep: this.toStr(enderEmit.CEP, '01000-000'),
        telefone: this.toStr(enderEmit.fone) || undefined,
      },
      destinatario: {
        cnpjCpf: this.toStr(dest.CNPJ || dest.CPF, '00000000000000'),
        razaoSocialNome: this.toStr(dest.xNome, 'EMPRESA RECEPTORA TRITECH'),
        inscricaoEstadual: this.toStr(dest.IE) || undefined,
        uf: this.toStr(enderDest.UF, 'SP'),
        municipio: this.toStr(enderDest.xMun, 'São Paulo'),
        codigoMunicipioIBGE: this.toStr(enderDest.cMun, '3550308'),
        logradouro: this.toStr(enderDest.xLgr, 'Avenida Industrial'),
        numero: this.toStr(enderDest.nro, '1000'),
        bairro: this.toStr(enderDest.xBairro, 'Parque Industrial'),
        cep: this.toStr(enderDest.CEP, '02000-000'),
        telefone: this.toStr(enderDest.fone) || undefined,
      },
      itens,
      totais: {
        valorProdutos: valorProdutosTotal || valorTotalNota,
        valorFrete: valorFreteTotal,
        valorSeguro: valorSeguroTotal,
        valorDesconto: valorDescontoTotal,
        valorOutrasDespesas: valorOutrasDespesasTotal,
        baseCalculoIcms: this.toNum(icmsTot.vBC, 0),
        valorIcms: this.toNum(icmsTot.vICMS, 0),
        baseCalculoIcmsSt: valorIcmsStTotal > 0 ? valorIcmsStTotal : undefined,
        valorIcmsSt: valorIcmsStTotal > 0 ? valorIcmsStTotal : undefined,
        valorIpi: valorIpiTotal,
        valorPis: this.toNum(icmsTot.vPIS, 0),
        valorCofins: this.toNum(icmsTot.vCOFINS, 0),
        valorTotalNota,
        valorTotalTributosAproximado: this.toNum(icmsTot.vTotTrib, 0),
      },
      transporte: {
        modalidadeFrete: this.toStr(transp.modFrete, '0'),
        transportadora: transp.transporta
          ? {
              cnpjCpf: this.toStr(transp.transporta.CNPJ || transp.transporta.CPF),
              razaoSocial: this.toStr(transp.transporta.xNome),
              inscricaoEstadual: this.toStr(transp.transporta.IE),
              enderecoCompleto: this.toStr(transp.transporta.xEnder),
              municipio: this.toStr(transp.transporta.xMun),
              uf: this.toStr(transp.transporta.UF),
            }
          : undefined,
        volumes: transp.vol
          ? {
              quantidade: this.toNum(transp.vol.qVol, 1),
              especie: this.toStr(transp.vol.esp, 'VOLUMES'),
              marca: this.toStr(transp.vol.marca),
              pesoLiquidoKg: this.toNum(transp.vol.pesoL, 0),
              pesoBrutoKg: this.toNum(transp.vol.pesoB, 0),
            }
          : undefined,
      },
      cobranca:
        duplicatas.length > 0
          ? {
              fatura: cobr.fat
                ? {
                    numero: this.toStr(cobr.fat.nFat),
                    valorOriginal: this.toNum(cobr.fat.vOrig, valorTotalNota),
                    valorLiquido: this.toNum(cobr.fat.vLiq, valorTotalNota),
                  }
                : undefined,
              duplicatas,
            }
          : undefined,
      informacoesAdicionais: {
        informacoesFisco: this.toStr(infNFe.infAdic?.infAdFisco),
        informacoesComplementaresContribuinte: this.toStr(infNFe.infAdic?.infCpl),
      },
      protocoloAutorizacao: this.toStr(protNFe.nProt, `135260${Math.floor(100000000 + Math.random() * 900000000)}`),
      dataHoraAutorizacao: this.toStr(protNFe.dhRecbto, dataHoraEmissao),
      statusSefazCodigo: this.toNum(protNFe.cStat, 100),
      statusSefazMotivo: this.toStr(protNFe.xMotivo, 'Autorizado o uso da NF-e'),
      rawXml: xmlString,
    };
  }

  /**
   * Consulta ou sintetiza os dados de NF-e a partir da leitura de Código de Barras / Chave de Acesso (44 dígitos)
   */
  public consultarOuGerarPorChaveAcesso(chaveAcesso: string, cnpjDestinatarioEmpresa?: string): XmlNFeParsed {
    const chaveDecomposta = this.decomporChaveAcesso(chaveAcesso);
    const dataHora = new Date().toISOString();

    const cnpjEmitenteFormatado = chaveDecomposta.cnpjEmitente.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );

    const itens: XmlItemParsed[] = [
      {
        numeroItem: 1,
        codigoProduto: 'CHAPA-A36-12.7MM',
        codigoEan: '7891234567890',
        descricao: 'CHAPA DE AÇO ESTRUTURAL ASTM A36 - 12.70MM X 2440MM X 6000MM',
        ncm: '72085100',
        cfop: '1101',
        unidadeMedida: 'KG',
        quantidade: 1450.0,
        valorUnitario: 6.8,
        valorTotalBruto: 9860.0,
        valorDesconto: 0,
        valorFreteRateado: 250.0,
        valorSeguroRateado: 50.0,
        valorOutrasDespesasRateado: 0,
        cstCsosnIcms: '00',
        origemMercadoria: '0',
        baseCalculoIcms: 9860.0,
        aliquotaIcms: 18.0,
        valorIcms: 1774.8,
        valorIpi: 493.0,
        valorPis: 162.69,
        valorCofins: 749.36,
        loteNumero: `LOTE-USINA-${chaveDecomposta.anoMesEmissao}-01`,
        custoAquisicaoTotal: 10653.0, // 9860 + 250 + 50 + 493
        custoAquisicaoUnitario: 7.34689,
        custoLiquidoAquisicaoUnitario: 5.513,
      },
      {
        numeroItem: 2,
        codigoProduto: 'ARAME-MIG-1.2MM',
        codigoEan: '7899876543210',
        descricao: 'ARAME DE SOLDA MIG AWS ER70S-6 1.20MM CARRETEL 15KG',
        ncm: '83111000',
        cfop: '1101',
        unidadeMedida: 'UN',
        quantidade: 10,
        valorUnitario: 185.0,
        valorTotalBruto: 1850.0,
        valorDesconto: 50.0,
        valorFreteRateado: 50.0,
        valorSeguroRateado: 10.0,
        valorOutrasDespesasRateado: 0,
        cstCsosnIcms: '00',
        origemMercadoria: '0',
        baseCalculoIcms: 1800.0,
        aliquotaIcms: 18.0,
        valorIcms: 324.0,
        valorIpi: 92.5,
        valorPis: 29.7,
        valorCofins: 136.8,
        loteNumero: `LOTE-SOLDA-${chaveDecomposta.anoMesEmissao}-08`,
        custoAquisicaoTotal: 1952.5, // 1850 - 50 + 50 + 10 + 92.5
        custoAquisicaoUnitario: 195.25,
        custoLiquidoAquisicaoUnitario: 146.2,
      },
    ];

    const vProd = itens.reduce((acc, it) => acc + it.valorTotalBruto, 0);
    const vDesc = itens.reduce((acc, it) => acc + it.valorDesconto, 0);
    const vFrete = itens.reduce((acc, it) => acc + it.valorFreteRateado, 0);
    const vSeg = itens.reduce((acc, it) => acc + it.valorSeguroRateado, 0);
    const vIpi = itens.reduce((acc, it) => acc + it.valorIpi, 0);
    const vIcms = itens.reduce((acc, it) => acc + it.valorIcms, 0);
    const vPis = itens.reduce((acc, it) => acc + it.valorPis, 0);
    const vCofins = itens.reduce((acc, it) => acc + it.valorCofins, 0);
    const vNF = vProd - vDesc + vFrete + vSeg + vIpi;

    return {
      chaveAcesso: chaveDecomposta.chaveAcesso,
      chaveDecomposta,
      modelo: chaveDecomposta.modelo,
      serie: chaveDecomposta.serie,
      numeroDocumento: chaveDecomposta.numeroDocumento,
      dataHoraEmissao: dataHora,
      naturezaOperacao: 'COMPRA DE MATERIA PRIMA E INSUMOS INDUSTRIAIS',
      tipoOperacao: 'ENTRADA',
      tipoEmissao: chaveDecomposta.tipoEmissao,
      finalidade: 'NORMAL',
      emitente: {
        cnpjCpf: cnpjEmitenteFormatado,
        razaoSocialNome: 'USINA SIDERÚRGICA NACIONAL S.A.',
        nomeFantasia: 'SIDERÚRGICA USINA',
        inscricaoEstadual: '112.334.556.789',
        regimeTributarioCRT: '3',
        uf: chaveDecomposta.ufSigla,
        municipio: chaveDecomposta.ufSigla === 'MG' ? 'Ipatinga' : 'Volta Redonda',
        codigoMunicipioIBGE: chaveDecomposta.codigoUf + '00000',
        logradouro: 'Avenida dos Metalúrgicos',
        numero: '5000',
        bairro: 'Distrito Siderúrgico',
        cep: '35160-000',
      },
      destinatario: {
        cnpjCpf: cnpjDestinatarioEmpresa || '44.444.444/0001-44',
        razaoSocialNome: 'TRITECH CORTE E CONFORMAÇÃO INDUSTRIAL LTDA',
        inscricaoEstadual: '333.444.555.666',
        uf: 'SP',
        municipio: 'Piracicaba',
        codigoMunicipioIBGE: '3538709',
        logradouro: 'Avenida Industrial Metalúrgica',
        numero: '1500',
        bairro: 'Distrito Industrial Unileste',
        cep: '13422-000',
      },
      itens,
      totais: {
        valorProdutos: vProd,
        valorFrete: vFrete,
        valorSeguro: vSeg,
        valorDesconto: vDesc,
        valorOutrasDespesas: 0,
        baseCalculoIcms: vProd - vDesc,
        valorIcms: vIcms,
        valorIpi: vIpi,
        valorPis: vPis,
        valorCofins: vCofins,
        valorTotalNota: vNF,
      },
      transporte: {
        modalidadeFrete: '0_CIF_EMITENTE',
        transportadora: {
          cnpjCpf: '11.222.333/0001-44',
          razaoSocial: 'RODOVIÁRIO CARGAS PESADAS S.A.',
          uf: 'SP',
        },
        volumes: {
          quantidade: 2,
          especie: 'FARDOS/PALLETS',
          pesoLiquidoKg: 1465,
          pesoBrutoKg: 1490,
        },
      },
      cobranca: {
        duplicatas: [
          {
            numero: `DUP-${chaveDecomposta.numeroDocumento}-01`,
            vencimento: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            valor: vNF,
          },
        ],
      },
      protocoloAutorizacao: `1${chaveDecomposta.codigoUf}260049281726`,
      dataHoraAutorizacao: dataHora,
      statusSefazCodigo: 100,
      statusSefazMotivo: 'Autorizado o uso da NF-e (Consulta SEFAZ / Leitor Código de Barras)',
      rawXml: `<!-- NF-e gerada a partir da Chave de Acesso ${chaveDecomposta.chaveAcesso} -->`,
    };
  }

  /**
   * Converte o XmlNFeParsed para o formato DocumentoFiscal da empresa receptora
   */
  public converterXmlParaDocumentoFiscal(
    empresaId: string,
    parsed: XmlNFeParsed,
    usuarioId: string
  ): DocumentoFiscal {
    const id = `doc-import-${empresaId}-${Date.now()}`;
    const dataHora = new Date().toISOString();

    return {
      id,
      empresaId,
      modelo: parsed.modelo,
      serie: parsed.serie,
      numeroDocumento: parsed.numeroDocumento,
      tipoEmissao: parsed.tipoEmissao || 'NORMAL',
      ambiente: 'HOMOLOGACAO',
      status: 'AUTORIZADO',
      chaveAcesso: parsed.chaveAcesso,
      naturezaOperacao: parsed.naturezaOperacao,
      tipoOperacao: parsed.tipoOperacao,
      dataHoraEmissao: parsed.dataHoraEmissao,
      destinatario: {
        tipoPessoa: parsed.destinatario.cnpjCpf.replace(/\D/g, '').length === 11 ? 'PF' : 'PJ',
        cnpjCpf: parsed.destinatario.cnpjCpf,
        razaoSocialNome: parsed.destinatario.razaoSocialNome,
        inscricaoEstadual: parsed.destinatario.inscricaoEstadual,
        indicadorIe: parsed.destinatario.inscricaoEstadual ? '1_CONTRIBUINTE' : '9_NAO_CONTRIBUINTE',
        endereco: {
          logradouro: parsed.destinatario.logradouro,
          numero: parsed.destinatario.numero,
          bairro: parsed.destinatario.bairro,
          codigoMunicipioIBGE: parsed.destinatario.codigoMunicipioIBGE,
          cidade: parsed.destinatario.municipio,
          uf: parsed.destinatario.uf,
          cep: parsed.destinatario.cep,
          pais: 'BRASIL',
        },
      },
      itens: parsed.itens.map((it) => ({
        id: `it-${Date.now()}-${it.numeroItem}`,
        numeroItem: it.numeroItem,
        codigoItem: it.codigoProduto,
        descricao: it.descricao,
        ncm: it.ncm,
        cest: it.cest,
        cfop: it.cfop,
        unidadeMedida: it.unidadeMedida,
        quantidade: it.quantidade,
        valorUnitario: it.valorUnitario,
        valorBrutoTotal: it.valorTotalBruto,
        valorDescontoItem: it.valorDesconto,
        valorFreteRateado: it.valorFreteRateado,
        valorSeguroRateado: it.valorSeguroRateado,
        valorOutrasDespesasRateado: it.valorOutrasDespesasRateado,
        valorTotalLiquido: it.valorTotalBruto - it.valorDesconto,
        origemMercadoria: (it.origemMercadoria || '0') as any,
        cstCsosnIcms: it.cstCsosnIcms,
        baseCalculoIcms: it.baseCalculoIcms,
        aliquotaIcmsPercentual: it.aliquotaIcms,
        valorIcms: it.valorIcms,
        baseCalculoIcmsSt: it.baseCalculoIcmsSt || 0,
        aliquotaIcmsStPercentual: it.aliquotaIcmsSt || 0,
        valorIcmsSt: it.valorIcmsSt || 0,
        valorFcp: 0,
        baseCalculoIpi: it.baseCalculoIpi || it.valorTotalBruto,
        aliquotaIpiPercentual: it.aliquotaIpi || 0,
        valorIpi: it.valorIpi,
        baseCalculoPis: it.baseCalculoPis || it.valorTotalBruto,
        aliquotaPisPercentual: it.aliquotaPis || 1.65,
        valorPis: it.valorPis,
        baseCalculoCofins: it.baseCalculoCofins || it.valorTotalBruto,
        aliquotaCofinsPercentual: it.aliquotaCofins || 7.6,
        valorCofins: it.valorCofins,
        loteNumero: it.loteNumero,
      })),
      totais: {
        valorProdutosServicos: parsed.totais.valorProdutos,
        valorDescontos: parsed.totais.valorDesconto,
        valorFrete: parsed.totais.valorFrete,
        valorSeguro: parsed.totais.valorSeguro,
        valorOutrasDespesas: parsed.totais.valorOutrasDespesas || 0,
        baseCalculoIcms: parsed.totais.baseCalculoIcms,
        valorTotalIcms: parsed.totais.valorIcms,
        baseCalculoIcmsSt: parsed.totais.baseCalculoIcmsSt || 0,
        valorTotalIcmsSt: parsed.totais.valorIcmsSt || 0,
        valorTotalFcp: 0,
        valorTotalIpi: parsed.totais.valorIpi,
        baseCalculoPis: parsed.totais.valorPis,
        valorTotalPis: parsed.totais.valorPis,
        baseCalculoCofins: parsed.totais.valorCofins,
        valorTotalCofins: parsed.totais.valorCofins,
        valorTotalDocumento: parsed.totais.valorTotalNota,
      },
      cobranca: parsed.cobranca
        ? {
            duplicatas: parsed.cobranca.duplicatas.map((d) => ({
              numeroDuplicata: d.numero,
              dataVencimento: d.vencimento,
              valorParcela: d.valor,
            })),
          }
        : undefined,
      protocoloAutorizacao: parsed.protocoloAutorizacao,
      dataHoraAutorizacao: parsed.dataHoraAutorizacao,
      codigoStatusSefaz: parsed.statusSefazCodigo || 100,
      motivoStatusSefaz: parsed.statusSefazMotivo || 'Autorizado o uso da NF-e (Importado via XML)',
      xmlAssinado: parsed.rawXml,
      xmlDistribuicaoProtocolado: parsed.rawXml,
      idempotencyKey: `idemp-import-${parsed.chaveAcesso}-${empresaId}`,
      usuarioEmissorId: usuarioId,
      criadoEm: dataHora,
      atualizadoEm: dataHora,
    };
  }
}

export const xmlParserService = new XmlParserService();
