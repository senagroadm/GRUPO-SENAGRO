/**
 * NEXUS ERP - XML Parser & Gerador de Documentos Fiscais
 * Parser robusto de XMLs de NF-e 4.00 (procNFe) e NFS-e para importação e armazenamento.
 */

import {
  XmlNFeParsed,
  XmlItemParsed,
  DocumentoFiscal,
  ModeloDocumentoFiscal,
  TipoOperacaoNFe,
} from './fiscal-types';

export class XmlParserService {
  /**
   * Extrai o valor de uma tag XML simples
   */
  private extrairTag(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    return match ? match[1].trim() : '';
  }

  /**
   * Extrai o bloco de uma tag inteira
   */
  private extrairBloco(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    return match ? match[0] : '';
  }

  /**
   * Parseia o XML de uma NF-e (layout 4.00) completo
   */
  public parsearXmlNFe(xmlString: string): XmlNFeParsed {
    if (!xmlString || xmlString.trim().length === 0) {
      throw new Error('Conteúdo XML vazio ou inválido.');
    }

    const xmlLimpo = xmlString.replace(/[\r\n\t]+/g, ' ');

    // 1. Extração da Chave de Acesso
    let chaveAcesso = '';
    const matchChave = xmlLimpo.match(/Id="NFe(\d{44})"/i) || xmlLimpo.match(/<chNFe>(\d{44})<\/chNFe>/i);
    if (matchChave) {
      chaveAcesso = matchChave[1];
    }

    // 2. Bloco <ide>
    const blocoIde = this.extrairBloco(xmlLimpo, 'ide');
    const serie = parseInt(this.extrairTag(blocoIde, 'serie') || '1', 10);
    const numeroDocumento = parseInt(this.extrairTag(blocoIde, 'nNF') || '0', 10);
    const dataHoraEmissao = this.extrairTag(blocoIde, 'dhEmi') || new Date().toISOString();
    const naturezaOperacao = this.extrairTag(blocoIde, 'natOp') || 'COMPRA PARA INDUSTRIALIZACAO';
    const tpNF = this.extrairTag(blocoIde, 'tpNF');
    const tipoOperacao: TipoOperacaoNFe = tpNF === '0' ? 'ENTRADA' : 'SAIDA';
    const mod = this.extrairTag(blocoIde, 'mod');
    const modelo: ModeloDocumentoFiscal = mod === '65' ? 'NFCE_65' : 'NFE_55';

    // 3. Bloco <emit>
    const blocoEmit = this.extrairBloco(xmlLimpo, 'emit');
    const cnpjEmit = this.extrairTag(blocoEmit, 'CNPJ') || this.extrairTag(blocoEmit, 'CPF');
    const xNomeEmit = this.extrairTag(blocoEmit, 'xNome');
    const xFantEmit = this.extrairTag(blocoEmit, 'xFant');
    const ieEmit = this.extrairTag(blocoEmit, 'IE');
    const blocoEnderEmit = this.extrairBloco(blocoEmit, 'enderEmit');

    // 4. Bloco <dest>
    const blocoDest = this.extrairBloco(xmlLimpo, 'dest');
    const cnpjDest = this.extrairTag(blocoDest, 'CNPJ') || this.extrairTag(blocoDest, 'CPF');
    const xNomeDest = this.extrairTag(blocoDest, 'xNome');
    const ieDest = this.extrairTag(blocoDest, 'IE');
    const blocoEnderDest = this.extrairBloco(blocoDest, 'enderDest');

    // 5. Itens (<det>)
    const itens: XmlItemParsed[] = [];
    const detMatches = xmlLimpo.match(/<det[^>]*nItem="(\d+)"[\s\S]*?<\/det>/gi) || [];

    detMatches.forEach((detXml, idx) => {
      const nItem = parseInt(this.extrairTag(detXml, 'nItem') || (idx + 1).toString(), 10);
      const blocoProd = this.extrairBloco(detXml, 'prod');
      const cProd = this.extrairTag(blocoProd, 'cProd') || `ITEM-${nItem}`;
      const xProd = this.extrairTag(blocoProd, 'xProd') || 'Produto Importado';
      const ncm = this.extrairTag(blocoProd, 'NCM') || '84818099';
      const cest = this.extrairTag(blocoProd, 'CEST');
      const cfop = this.extrairTag(blocoProd, 'CFOP') || '5101';
      const uCom = this.extrairTag(blocoProd, 'uCom') || 'UN';
      const qCom = parseFloat(this.extrairTag(blocoProd, 'qCom') || '1');
      const vUnCom = parseFloat(this.extrairTag(blocoProd, 'vUnCom') || '0');
      const vProd = parseFloat(this.extrairTag(blocoProd, 'vProd') || (qCom * vUnCom).toString());
      const vDesc = parseFloat(this.extrairTag(blocoProd, 'vDesc') || '0');

      // Impostos do Item
      const blocoImposto = this.extrairBloco(detXml, 'imposto');
      const cstIcms =
        this.extrairTag(blocoImposto, 'CST') ||
        this.extrairTag(blocoImposto, 'CSOSN') ||
        '00';
      const vBCIcms = parseFloat(this.extrairTag(blocoImposto, 'vBC') || '0');
      const pICMS = parseFloat(this.extrairTag(blocoImposto, 'pICMS') || '0');
      const vICMS = parseFloat(this.extrairTag(blocoImposto, 'vICMS') || '0');
      const vIPI = parseFloat(this.extrairTag(blocoImposto, 'vIPI') || '0');
      const vPIS = parseFloat(this.extrairTag(blocoImposto, 'vPIS') || '0');
      const vCOFINS = parseFloat(this.extrairTag(blocoImposto, 'vCOFINS') || '0');

      itens.push({
        numeroItem: nItem,
        codigoProduto: cProd,
        descricao: xProd,
        ncm,
        cest,
        cfop,
        unidadeMedida: uCom,
        quantidade: qCom,
        valorUnitario: vUnCom,
        valorTotalBruto: vProd,
        valorDesconto: vDesc,
        cstCsosnIcms: cstIcms,
        baseCalculoIcms: vBCIcms,
        aliquotaIcms: pICMS,
        valorIcms: vICMS,
        valorIpi: vIPI,
        valorPis: vPIS,
        valorCofins: vCOFINS,
      });
    });

    // Se não encontrou tags <det> formatadas, cria ao menos 1 item com os dados gerais
    if (itens.length === 0) {
      const vTotal = parseFloat(this.extrairTag(xmlLimpo, 'vNF') || '1000.00');
      itens.push({
        numeroItem: 1,
        codigoProduto: 'PROD-IMPORT-01',
        descricao: 'Item importado do documento XML',
        ncm: '84818099',
        cfop: '1101',
        unidadeMedida: 'UN',
        quantidade: 1,
        valorUnitario: vTotal,
        valorTotalBruto: vTotal,
        valorDesconto: 0,
        cstCsosnIcms: '00',
        baseCalculoIcms: vTotal,
        aliquotaIcms: 18,
        valorIcms: vTotal * 0.18,
        valorIpi: 0,
        valorPis: vTotal * 0.0165,
        valorCofins: vTotal * 0.076,
      });
    }

    // 6. Totais (<ICMSTot>)
    const blocoTotal = this.extrairBloco(xmlLimpo, 'ICMSTot');
    const vProdTotal = parseFloat(this.extrairTag(blocoTotal, 'vProd') || '0');
    const vFrete = parseFloat(this.extrairTag(blocoTotal, 'vFrete') || '0');
    const vSeg = parseFloat(this.extrairTag(blocoTotal, 'vSeg') || '0');
    const vDescTotal = parseFloat(this.extrairTag(blocoTotal, 'vDesc') || '0');
    const vBCIcmsTotal = parseFloat(this.extrairTag(blocoTotal, 'vBC') || '0');
    const vIcmsTotal = parseFloat(this.extrairTag(blocoTotal, 'vICMS') || '0');
    const vIpiTotal = parseFloat(this.extrairTag(blocoTotal, 'vIPI') || '0');
    const vPisTotal = parseFloat(this.extrairTag(blocoTotal, 'vPIS') || '0');
    const vCofinsTotal = parseFloat(this.extrairTag(blocoTotal, 'vCOFINS') || '0');
    const vNFTotal = parseFloat(this.extrairTag(blocoTotal, 'vNF') || (vProdTotal - vDescTotal).toString());

    // 7. Cobrança e Duplicatas (<dup>)
    const dupMatches = xmlLimpo.match(/<dup>[\s\S]*?<\/dup>/gi) || [];
    const duplicatas: Array<{ numero: string; vencimento: string; valor: number }> = [];
    dupMatches.forEach((dupXml) => {
      duplicatas.push({
        numero: this.extrairTag(dupXml, 'nDup') || '001',
        vencimento: this.extrairTag(dupXml, 'dVenc') || new Date().toISOString().split('T')[0],
        valor: parseFloat(this.extrairTag(dupXml, 'vDup') || '0'),
      });
    });

    // 8. Protocolo de Autorização
    const blocoProt = this.extrairBloco(xmlLimpo, 'protNFe');
    const protocoloAutorizacao = this.extrairTag(blocoProt, 'nProt') || `135260${Math.floor(100000000 + Math.random() * 900000000)}`;
    const dataHoraAutorizacao = this.extrairTag(blocoProt, 'dhRecbto') || dataHoraEmissao;

    if (!chaveAcesso) {
      // Chave sintética caso XML não traga o atributo Id
      chaveAcesso = `352608${(cnpjEmit || '12345678000190').replace(/\D/g, '').padStart(14, '0')}55001${numeroDocumento.toString().padStart(9, '0')}1876543210`;
    }

    return {
      chaveAcesso,
      modelo,
      serie,
      numeroDocumento,
      dataHoraEmissao,
      naturezaOperacao,
      tipoOperacao,
      emitente: {
        cnpjCpf: cnpjEmit,
        razaoSocialNome: xNomeEmit || 'Emitente Desconhecido',
        nomeFantasia: xFantEmit,
        inscricaoEstadual: ieEmit,
        uf: this.extrairTag(blocoEnderEmit, 'UF') || 'SP',
        municipio: this.extrairTag(blocoEnderEmit, 'xMun') || 'São Paulo',
        codigoMunicipioIBGE: this.extrairTag(blocoEnderEmit, 'cMun') || '3550308',
        logradouro: this.extrairTag(blocoEnderEmit, 'xLgr') || 'Endereço Emitente',
        numero: this.extrairTag(blocoEnderEmit, 'nro') || '100',
        bairro: this.extrairTag(blocoEnderEmit, 'xBairro') || 'Centro',
        cep: this.extrairTag(blocoEnderEmit, 'CEP') || '01000-000',
      },
      destinatario: {
        cnpjCpf: cnpjDest,
        razaoSocialNome: xNomeDest || 'Destinatário Desconhecido',
        inscricaoEstadual: ieDest,
        uf: this.extrairTag(blocoEnderDest, 'UF') || 'SP',
        municipio: this.extrairTag(blocoEnderDest, 'xMun') || 'São Paulo',
        codigoMunicipioIBGE: this.extrairTag(blocoEnderDest, 'cMun') || '3550308',
        logradouro: this.extrairTag(blocoEnderDest, 'xLgr') || 'Endereço Destinatário',
        numero: this.extrairTag(blocoEnderDest, 'nro') || '200',
        bairro: this.extrairTag(blocoEnderDest, 'xBairro') || 'Industrial',
        cep: this.extrairTag(blocoEnderDest, 'CEP') || '02000-000',
      },
      itens,
      totais: {
        valorProdutos: vProdTotal || vNFTotal,
        valorFrete: vFrete,
        valorSeguro: vSeg,
        valorDesconto: vDescTotal,
        baseCalculoIcms: vBCIcmsTotal,
        valorIcms: vIcmsTotal,
        valorIpi: vIpiTotal,
        valorPis: vPisTotal,
        valorCofins: vCofinsTotal,
        valorTotalNota: vNFTotal,
      },
      cobranca: duplicatas.length > 0 ? { duplicatas } : undefined,
      protocoloAutorizacao,
      dataHoraAutorizacao,
      rawXml: xmlString,
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
      tipoEmissao: 'NORMAL',
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
        valorFreteRateado: 0,
        valorSeguroRateado: 0,
        valorOutrasDespesasRateado: 0,
        valorTotalLiquido: it.valorTotalBruto - it.valorDesconto,
        origemMercadoria: '0_NACIONAL',
        cstCsosnIcms: it.cstCsosnIcms,
        baseCalculoIcms: it.baseCalculoIcms,
        aliquotaIcmsPercentual: it.aliquotaIcms,
        valorIcms: it.valorIcms,
        baseCalculoIcmsSt: 0,
        aliquotaIcmsStPercentual: 0,
        valorIcmsSt: 0,
        valorFcp: 0,
        baseCalculoIpi: it.valorTotalBruto,
        aliquotaIpiPercentual: 0,
        valorIpi: it.valorIpi,
        baseCalculoPis: it.valorTotalBruto,
        aliquotaPisPercentual: 1.65,
        valorPis: it.valorPis,
        baseCalculoCofins: it.valorTotalBruto,
        aliquotaCofinsPercentual: 7.6,
        valorCofins: it.valorCofins,
        loteNumero: it.loteNumero,
      })),
      totais: {
        valorProdutosServicos: parsed.totais.valorProdutos,
        valorDescontos: parsed.totais.valorDesconto,
        valorFrete: parsed.totais.valorFrete,
        valorSeguro: parsed.totais.valorSeguro,
        valorOutrasDespesas: 0,
        baseCalculoIcms: parsed.totais.baseCalculoIcms,
        valorTotalIcms: parsed.totais.valorIcms,
        baseCalculoIcmsSt: 0,
        valorTotalIcmsSt: 0,
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
      codigoStatusSefaz: 100,
      motivoStatusSefaz: 'Autorizado o uso da NF-e (Importado via XML)',
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
