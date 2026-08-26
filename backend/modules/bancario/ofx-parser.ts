/**
 * ============================================================================
 * PARSER ROBUSTO DE ARQUIVOS OFX (OPEN FINANCIAL EXCHANGE)
 * NEXUS ERP (Grupo TRITECH)
 * ============================================================================
 * 
 * Suporta formatos OFX 1.x (SGML sem tags de fechamento) e OFX 2.x (XML estrito).
 * Extrai dados de conta, período, saldo e transações com geração de FITID idempotente.
 * ============================================================================
 */

import { ExtratoBancarioItem, TipoTransacaoExtrato } from './conciliacao-types';

export interface OfxParseResult {
  bancoCodigo?: string;
  agencia?: string;
  contaCorrente?: string;
  tipoConta?: string;
  dataInicio: string;
  dataFim: string;
  saldoFinal?: number;
  dataSaldo?: string;
  itens: Omit<ExtratoBancarioItem, 'id' | 'extratoId' | 'empresaId' | 'contaBancariaId' | 'status' | 'createdAt' | 'updatedAt'>[];
}

export class OfxParser {
  /**
   * Converte uma string de data OFX (ex: 20260825120000[-3:BRT] ou 20260825) em YYYY-MM-DD
   */
  private static parseOfxDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    const cleaned = dateStr.trim().replace(/\[.*\]/, '');
    const year = cleaned.substring(0, 4);
    const month = cleaned.substring(4, 6);
    const day = cleaned.substring(6, 8);
    if (year && month && day) {
      return `${year}-${month}-${day}`;
    }
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Extrai o valor de uma tag OFX seja no formato SGML (<TAG>VALOR) ou XML (<TAG>VALOR</TAG>)
   */
  private static extractTagValue(content: string, tagName: string): string | null {
    // Tenta primeiro formato XML com tag de fechamento
    const xmlRegex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const xmlMatch = content.match(xmlRegex);
    if (xmlMatch && xmlMatch[1]) {
      return xmlMatch[1].trim();
    }

    // Tenta formato SGML sem tag de fechamento (até próxima tag ou quebra de linha)
    const sgmlRegex = new RegExp(`<${tagName}>([^<\\r\\n]+)`, 'i');
    const sgmlMatch = content.match(sgmlRegex);
    if (sgmlMatch && sgmlMatch[1]) {
      return sgmlMatch[1].trim();
    }

    return null;
  }

  /**
   * Detecta categoria preliminar com base no histórico
   */
  private static detectCategory(memo: string): string | undefined {
    const upper = memo.toUpperCase();
    if (upper.includes('TAR ') || upper.includes('TARIFA') || upper.includes('MANUT') || upper.includes('PACOTE SERVICO') || upper.includes('IOF')) {
      return 'TARIFA_BANCARIA';
    }
    if (upper.includes('PIX TRANSF') || upper.includes('PIX RECEB') || upper.includes('PIX ENVIADO') || upper.includes('PIX PAGTO')) {
      return 'PIX';
    }
    if (upper.includes('TED ') || upper.includes('DOC ')) {
      return 'TED_DOC';
    }
    if (upper.includes('BOLETO') || upper.includes('TITULO') || upper.includes('COB ')) {
      return 'BOLETO';
    }
    if (upper.includes('TRANSF') || upper.includes('TEF')) {
      return 'TRANSFERENCIA';
    }
    if (upper.includes('FOLHA') || upper.includes('SALARIO') || upper.includes('GPS') || upper.includes('FGTS')) {
      return 'FOLHA_TRIBUTO';
    }
    return undefined;
  }

  /**
   * Realiza o parse completo do conteúdo de um arquivo OFX
   */
  public static parse(ofxContent: string): OfxParseResult {
    if (!ofxContent || typeof ofxContent !== 'string') {
      throw new Error('Conteúdo OFX inválido ou vazio.');
    }

    // 1. Extração de Metadados da Conta
    const bancoCodigo = this.extractTagValue(ofxContent, 'BANKID') || undefined;
    const agencia = this.extractTagValue(ofxContent, 'BRANCHID') || undefined;
    const contaCorrente = this.extractTagValue(ofxContent, 'ACCTID') || undefined;
    const tipoConta = this.extractTagValue(ofxContent, 'ACCTTYPE') || undefined;

    // 2. Extração do Período
    const rawDtStart = this.extractTagValue(ofxContent, 'DTSTART');
    const rawDtEnd = this.extractTagValue(ofxContent, 'DTEND');
    const dataInicio = rawDtStart ? this.parseOfxDate(rawDtStart) : new Date().toISOString().split('T')[0];
    const dataFim = rawDtEnd ? this.parseOfxDate(rawDtEnd) : new Date().toISOString().split('T')[0];

    // 3. Extração de Saldo
    let saldoFinal: number | undefined;
    let dataSaldo: string | undefined;
    const ledgerBalBlockMatch = ofxContent.match(/<LEDGERBAL>([\s\S]*?)<\/LEDGERBAL>/i) || ofxContent.match(/<LEDGERBAL>([\s\S]*?)(?:<\/BANKTRANLIST>|<\/STMTRS>)/i);
    if (ledgerBalBlockMatch) {
      const rawBalAmt = this.extractTagValue(ledgerBalBlockMatch[1], 'BALAMT');
      if (rawBalAmt) saldoFinal = parseFloat(rawBalAmt.replace(',', '.'));
      const rawDtAsOf = this.extractTagValue(ledgerBalBlockMatch[1], 'DTASOF');
      if (rawDtAsOf) dataSaldo = this.parseOfxDate(rawDtAsOf);
    }

    // 4. Extração de Transações (<STMTTRN>...</STMTTRN> ou <STMTTRN> até próximo <STMTTRN>)
    const itens: OfxParseResult['itens'] = [];
    
    // Normalização para dividir por blocos <STMTTRN>
    const trnBlocks = ofxContent.split(/<STMTTRN>/i);
    trnBlocks.shift(); // Remove cabeçalho antes do primeiro STMTTRN

    for (let i = 0; i < trnBlocks.length; i++) {
      const block = trnBlocks[i];
      
      const trnType = this.extractTagValue(block, 'TRNTYPE') || 'OTHER';
      const rawDtPosted = this.extractTagValue(block, 'DTPOSTED') || '';
      const rawTrnAmt = this.extractTagValue(block, 'TRNAMT') || '0';
      const rawFitId = this.extractTagValue(block, 'FITID') || '';
      const checknum = this.extractTagValue(block, 'CHECKNUM') || undefined;
      const refnum = this.extractTagValue(block, 'REFNUM') || undefined;
      const memo = this.extractTagValue(block, 'MEMO') || this.extractTagValue(block, 'NAME') || 'TRANSAÇÃO BANCÁRIA';

      const valorNumerico = parseFloat(rawTrnAmt.replace(',', '.'));
      if (isNaN(valorNumerico)) continue;

      const dataTransacao = this.parseOfxDate(rawDtPosted);
      const isCredito = valorNumerico > 0 || trnType.toUpperCase() === 'CREDIT';
      const valorAbsoluto = Math.abs(valorNumerico);
      const tipoTransacao: TipoTransacaoExtrato = isCredito ? 'CREDITO' : 'DEBITO';

      // FITID deve ser único e idempotente
      const fitid = rawFitId.trim() || `OFX-${dataTransacao}-${Math.round(valorAbsoluto * 100)}-${i + 1}`;
      const categoriaDetectada = this.detectCategory(memo);

      itens.push({
        dataTransacao,
        tipoTransacao,
        valor: valorAbsoluto,
        valorOriginalSinal: valorNumerico,
        fitid,
        checknum,
        refnum,
        memo: memo.trim(),
        categoriaDetectada,
        rawPayload: {
          ofxTrnType: trnType,
          ofxDtPosted: rawDtPosted,
          ofxTrnAmt: rawTrnAmt,
        },
      });
    }

    return {
      bancoCodigo,
      agencia,
      contaCorrente,
      tipoConta,
      dataInicio,
      dataFim,
      saldoFinal,
      dataSaldo,
      itens,
    };
  }
}
