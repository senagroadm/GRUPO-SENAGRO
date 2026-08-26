/**
 * ============================================================================
 * MOTOR DE CORRESPONDÊNCIA BANCÁRIA (MATCHING ENGINE)
 * NEXUS ERP (Grupo TRITECH)
 * ============================================================================
 * 
 * Executa matching multivariável ponderado com cálculo de confiança:
 * - ALTA (>= 85%): Auto-conciliável
 * - MÉDIA (60% - 84%): Sugestão para confirmação em 1 clique
 * - BAIXA (< 60%): Exige decisão do usuário
 * ============================================================================
 */

import {
  ExtratoBancarioItem,
  MatchSugerido,
  NivelConfiancaMatch,
  DetalhesScoreMatch,
} from './conciliacao-types';
import { Cobranca } from './bancario-types';
import { ContaPagar, ContaReceber } from '../financeiro/financeiro-types';
import { EMPRESAS_GRUPO } from '../../core/types/company';

export class ConciliacaoMatcher {
  /**
   * Remove acentos e caracteres especiais para comparação fonética/textual
   */
  private static sanitizeText(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extrai apenas dígitos de strings como CNPJ/CPF ou telefones
   */
  private static extractDigits(str?: string): string {
    if (!str) return '';
    return str.replace(/\D/g, '');
  }

  /**
   * Calcula a diferença em dias entre duas datas (YYYY-MM-DD)
   */
  private static getDaysDifference(date1: string, date2: string): number {
    const d1 = new Date(date1).getTime();
    const d2 = new Date(date2).getTime();
    return Math.round(Math.abs(d1 - d2) / 86400000);
  }

  /**
   * Avalia a pontuação de valor (Max 35 pts)
   */
  private static scoreValor(extratoValor: number, targetValor: number): { score: number; motivo?: string } {
    const diffAbs = Math.abs(extratoValor - targetValor);
    if (diffAbs < 0.01) {
      return { score: 35, motivo: `Valor idêntico: R$ ${extratoValor.toFixed(2)}` };
    }
    const percentDiff = (diffAbs / targetValor) * 100;
    if (percentDiff <= 2) {
      return {
        score: 25,
        motivo: `Valor compatível com variação de juros/desconto (diff R$ ${diffAbs.toFixed(2)})`,
      };
    }
    if (percentDiff <= 5) {
      return { score: 15, motivo: `Valor aproximado com diferença de R$ ${diffAbs.toFixed(2)}` };
    }
    return { score: 0 };
  }

  /**
   * Avalia a pontuação de data (Max 25 pts)
   */
  private static scoreData(extratoData: string, targetData: string): { score: number; motivo?: string } {
    const days = this.getDaysDifference(extratoData, targetData);
    if (days === 0) {
      return { score: 25, motivo: `Data de vencimento exata (${extratoData})` };
    }
    if (days === 1) {
      return { score: 20, motivo: `Data com tolerância D±1 (${days} dia)` };
    }
    if (days <= 3) {
      return { score: 12, motivo: `Data com tolerância D±3 (${days} dias)` };
    }
    if (days <= 7) {
      return { score: 5, motivo: `Data com tolerância D±7 (${days} dias)` };
    }
    return { score: 0 };
  }

  /**
   * Avalia parceiro (CNPJ/CPF ou Nome) (Max 25 pts)
   */
  private static scoreParceiro(memo: string, parceiroNome?: string, parceiroCnpj?: string): { score: number; motivo?: string } {
    if (!memo) return { score: 0 };
    const cleanMemo = this.sanitizeText(memo);
    const digitsMemo = this.extractDigits(memo);

    // Match de CNPJ/CPF por dígitos
    if (parceiroCnpj) {
      const cleanCnpj = this.extractDigits(parceiroCnpj);
      // Se tiver mais de 8 dígitos do CNPJ base no memo
      if (cleanCnpj.length >= 8 && digitsMemo.includes(cleanCnpj.substring(0, 8))) {
        return { score: 25, motivo: `CNPJ do parceiro (${parceiroCnpj}) encontrado no histórico` };
      }
    }

    // Match por palavras significativas do nome
    if (parceiroNome) {
      const cleanNome = this.sanitizeText(parceiroNome);
      const words = cleanNome.split(' ').filter((w) => w.length > 3 && !['LTDA', 'EIRELI', 'DISTRIBUICAO', 'INDUSTRIA', 'COMERCIO', 'SERVICOS'].includes(w));
      
      for (const word of words) {
        if (cleanMemo.includes(word)) {
          return { score: 18, motivo: `Nome do parceiro "${word}" identificado no histórico bancário` };
        }
      }
    }

    return { score: 0 };
  }

  /**
   * Avalia número de documento / NF (Max 30 pts)
   */
  private static scoreDocumento(item: ExtratoBancarioItem, numeroDoc?: string): { score: number; motivo?: string } {
    if (!numeroDoc) return { score: 0 };
    const cleanDoc = this.sanitizeText(numeroDoc);
    const digitsDoc = this.extractDigits(numeroDoc);
    const cleanMemo = this.sanitizeText(item.memo);
    const cleanCheck = item.checknum ? this.sanitizeText(item.checknum) : '';

    if (cleanCheck && cleanCheck.includes(cleanDoc)) {
      return { score: 30, motivo: `Número de documento "${numeroDoc}" coincide com doc do extrato` };
    }
    if (cleanMemo.includes(cleanDoc)) {
      return { score: 25, motivo: `Número de documento "${numeroDoc}" encontrado no histórico` };
    }
    if (digitsDoc.length >= 4 && (cleanMemo.includes(digitsDoc) || cleanCheck.includes(digitsDoc))) {
      return { score: 20, motivo: `Dígitos do documento "${digitsDoc}" encontrados no extrato` };
    }

    return { score: 0 };
  }

  /**
   * Avalia referências específicas de cobrança bancária (Nosso Número, Linha Digitável, TXID PIX) (Max 35 pts)
   */
  private static scoreCobranca(item: ExtratoBancarioItem, cobranca: Cobranca): { score: number; motivo?: string } {
    const cleanMemo = this.sanitizeText(item.memo);
    const cleanCheck = item.checknum ? this.sanitizeText(item.checknum) : '';

    if (cobranca.txidPix && cleanMemo.includes(this.sanitizeText(cobranca.txidPix))) {
      return { score: 35, motivo: `TXID do PIX "${cobranca.txidPix}" identificado` };
    }

    const digitsNossoNumero = this.extractDigits(cobranca.nossoNumero);
    if (digitsNossoNumero && (cleanMemo.includes(digitsNossoNumero) || cleanCheck.includes(digitsNossoNumero))) {
      return { score: 35, motivo: `Nosso Número "${cobranca.nossoNumero}" encontrado no histórico` };
    }

    const cleanSeuNumero = this.sanitizeText(cobranca.seuNumero);
    if (cleanSeuNumero && cleanMemo.includes(cleanSeuNumero)) {
      return { score: 30, motivo: `Seu Número/Fatura "${cobranca.seuNumero}" encontrado no histórico` };
    }

    return { score: 0 };
  }

  /**
   * Processa o matching completo de um item de extrato contra todas as entidades financeiras da empresa
   */
  public static findBestMatch(
    item: ExtratoBancarioItem,
    cobrancas: Cobranca[],
    contasReceber: ContaReceber[],
    contasPagar: ContaPagar[]
  ): MatchSugerido | undefined {
    let bestMatch: MatchSugerido | undefined;

    // ------------------------------------------------------------------------
    // REGRA 1: DETECÇÃO AUTOMÁTICA DE TARIFA BANCÁRIA
    // ------------------------------------------------------------------------
    if (item.tipoTransacao === 'DEBITO') {
      const upperMemo = item.memo.toUpperCase();
      const isTarifa =
        upperMemo.includes('TAR ') ||
        upperMemo.includes('TARIFA') ||
        upperMemo.includes('MANUT CONTA') ||
        upperMemo.includes('PACOTE SERVICO') ||
        upperMemo.includes('IOF ') ||
        upperMemo.includes('TAXA BANC');

      if (isTarifa) {
        const scoreTotal = 95;
        return {
          nivelConfianca: 'ALTA',
          scoreTotal,
          tipo: 'TARIFA_BANCARIA',
          targetId: `tarifa-${item.fitid}`,
          targetDescricao: `Tarifa/Despesa Bancária: ${item.memo}`,
          targetValor: item.valor,
          detalhesScore: {
            scoreValor: 35,
            scoreData: 25,
            scoreParceiro: 0,
            scoreDocumento: 0,
            scoreIdentificador: 20,
            scoreDescricao: 15,
            scoreCobrancaRef: 0,
            scoreTotal,
            explicacoes: [
              `Padrão de tarifa/encargo bancário identificado no histórico "${item.memo}"`,
              `Classificação automática em Despesas Bancárias`,
            ],
          },
        };
      }

      // Detecção de Transferência Intercompany (entre CNPJs do grupo TRITECH)
      const empDestino = EMPRESAS_GRUPO.find(
        (e) =>
          e.id !== item.empresaId &&
          (upperMemo.includes(this.sanitizeText(e.nomeFantasia)) ||
            upperMemo.includes(this.sanitizeText(e.razaoSocial)) ||
            upperMemo.includes(this.extractDigits(e.cnpj).substring(0, 8)))
      );

      if (empDestino) {
        return {
          nivelConfianca: 'ALTA',
          scoreTotal: 90,
          tipo: 'TRANSFERENCIA_INTERCOMPANY',
          targetId: empDestino.id,
          targetDescricao: `Transferência Intercompany para ${empDestino.nomeFantasia} (CNPJ ${empDestino.cnpj})`,
          targetParceiroNome: empDestino.nomeFantasia,
          targetParceiroCnpjCpf: empDestino.cnpj,
          targetValor: item.valor,
          detalhesScore: {
            scoreValor: 35,
            scoreData: 25,
            scoreParceiro: 25,
            scoreDocumento: 0,
            scoreIdentificador: 0,
            scoreDescricao: 10,
            scoreCobrancaRef: 0,
            scoreTotal: 90,
            explicacoes: [
              `Transferência entre empresas do Grupo TRITECH identificada`,
              `Empresa Destino: ${empDestino.nomeFantasia}`,
            ],
          },
        };
      }
    }

    // ------------------------------------------------------------------------
    // REGRA 2: MATCH COM COBRANÇAS EMITIDAS (CRÉDITO)
    // ------------------------------------------------------------------------
    if (item.tipoTransacao === 'CREDITO') {
      for (const cob of cobrancas) {
        // Ignora cobranças já liquidadas ou canceladas
        if (cob.status === 'PAGA_TOTAL' || cob.status === 'CANCELADA') continue;

        const valResult = this.scoreValor(item.valor, cob.valorCobrado || cob.valorOriginal);
        if (valResult.score === 0) continue; // Valor incompatível

        const dataResult = this.scoreData(item.dataTransacao, cob.dataVencimento);
        const parcResult = this.scoreParceiro(item.memo, cob.pagadorNome, cob.pagadorCnpjCpf);
        const docResult = this.scoreDocumento(item, cob.seuNumero);
        const cobResult = this.scoreCobranca(item, cob);

        let scoreTotal = valResult.score + dataResult.score + parcResult.score + docResult.score + cobResult.score;
        if (scoreTotal > 100) scoreTotal = 100;

        const explicacoes: string[] = [];
        if (valResult.motivo) explicacoes.push(valResult.motivo);
        if (dataResult.motivo) explicacoes.push(dataResult.motivo);
        if (parcResult.motivo) explicacoes.push(parcResult.motivo);
        if (docResult.motivo) explicacoes.push(docResult.motivo);
        if (cobResult.motivo) explicacoes.push(cobResult.motivo);

        let nivelConfianca: NivelConfiancaMatch = 'BAIXA';
        if (scoreTotal >= 85) nivelConfianca = 'ALTA';
        else if (scoreTotal >= 60) nivelConfianca = 'MEDIA';

        if (!bestMatch || scoreTotal > bestMatch.scoreTotal) {
          bestMatch = {
            nivelConfianca,
            scoreTotal,
            tipo: 'BAIXA_COBRANCA',
            targetId: cob.id,
            targetDescricao: `Cobrança ${cob.nossoNumero} - ${cob.pagadorNome}`,
            targetDocumento: cob.seuNumero,
            targetParceiroNome: cob.pagadorNome,
            targetParceiroCnpjCpf: cob.pagadorCnpjCpf,
            targetValor: cob.valorCobrado,
            targetDataVencimento: cob.dataVencimento,
            detalhesScore: {
              scoreValor: valResult.score,
              scoreData: dataResult.score,
              scoreParceiro: parcResult.score,
              scoreDocumento: docResult.score,
              scoreIdentificador: 0,
              scoreDescricao: 0,
              scoreCobrancaRef: cobResult.score,
              scoreTotal,
              explicacoes,
            },
          };
        }
      }

      // Match com Contas a Receber (AR)
      for (const cr of contasReceber) {
        if (cr.status === 'LIQUIDADO' || cr.status === 'CANCELADO') continue;

        for (const parc of cr.parcelas) {
          if (parc.statusParcela === 'LIQUIDADA' || parc.statusParcela === 'CANCELADA') continue;

          const valorAlvo = parc.valorSaldo > 0 ? parc.valorSaldo : parc.valorTotalLiquido;
          const valResult = this.scoreValor(item.valor, valorAlvo);
          if (valResult.score === 0) continue;

          const dataResult = this.scoreData(item.dataTransacao, parc.dataVencimento);
          const parcResult = this.scoreParceiro(item.memo, cr.clienteNome, cr.clienteCnpjCpf);
          const docResult = this.scoreDocumento(item, `${cr.numeroDocumento}/${parc.numeroParcela}`);

          let scoreTotal = valResult.score + dataResult.score + parcResult.score + docResult.score;
          if (scoreTotal > 100) scoreTotal = 100;

          const explicacoes: string[] = [];
          if (valResult.motivo) explicacoes.push(valResult.motivo);
          if (dataResult.motivo) explicacoes.push(dataResult.motivo);
          if (parcResult.motivo) explicacoes.push(parcResult.motivo);
          if (docResult.motivo) explicacoes.push(docResult.motivo);

          let nivelConfianca: NivelConfiancaMatch = 'BAIXA';
          if (scoreTotal >= 85) nivelConfianca = 'ALTA';
          else if (scoreTotal >= 60) nivelConfianca = 'MEDIA';

          if (!bestMatch || scoreTotal > bestMatch.scoreTotal) {
            bestMatch = {
              nivelConfianca,
              scoreTotal,
              tipo: 'BAIXA_RECEBER',
              targetId: cr.id,
              targetDescricao: `Contas a Receber ${cr.numeroDocumento} Parc ${parc.numeroParcela}/${parc.totalParcelas} - ${cr.clienteNome}`,
              targetDocumento: `${cr.numeroDocumento} - Parc ${parc.numeroParcela}`,
              targetParceiroNome: cr.clienteNome,
              targetParceiroCnpjCpf: cr.clienteCnpjCpf,
              targetValor: valorAlvo,
              targetDataVencimento: parc.dataVencimento,
              detalhesScore: {
                scoreValor: valResult.score,
                scoreData: dataResult.score,
                scoreParceiro: parcResult.score,
                scoreDocumento: docResult.score,
                scoreIdentificador: 0,
                scoreDescricao: 0,
                scoreCobrancaRef: 0,
                scoreTotal,
                explicacoes,
              },
            };
          }
        }
      }
    }

    // ------------------------------------------------------------------------
    // REGRA 3: MATCH COM CONTAS A PAGAR (DÉBITO)
    // ------------------------------------------------------------------------
    if (item.tipoTransacao === 'DEBITO') {
      for (const cp of contasPagar) {
        if (cp.status === 'LIQUIDADO' || cp.status === 'CANCELADO') continue;

        for (const parc of cp.parcelas) {
          if (parc.statusParcela === 'LIQUIDADA' || parc.statusParcela === 'CANCELADA') continue;

          const valorAlvo = parc.valorSaldo > 0 ? parc.valorSaldo : parc.valorTotalLiquido;
          const valResult = this.scoreValor(item.valor, valorAlvo);
          if (valResult.score === 0) continue;

          const dataResult = this.scoreData(item.dataTransacao, parc.dataVencimento);
          const parcResult = this.scoreParceiro(item.memo, cp.fornecedorNome, cp.fornecedorCnpjCpf);
          const docResult = this.scoreDocumento(item, `${cp.numeroDocumento}/${parc.numeroParcela}`);

          let scoreTotal = valResult.score + dataResult.score + parcResult.score + docResult.score;
          if (scoreTotal > 100) scoreTotal = 100;

          const explicacoes: string[] = [];
          if (valResult.motivo) explicacoes.push(valResult.motivo);
          if (dataResult.motivo) explicacoes.push(dataResult.motivo);
          if (parcResult.motivo) explicacoes.push(parcResult.motivo);
          if (docResult.motivo) explicacoes.push(docResult.motivo);

          let nivelConfianca: NivelConfiancaMatch = 'BAIXA';
          if (scoreTotal >= 85) nivelConfianca = 'ALTA';
          else if (scoreTotal >= 60) nivelConfianca = 'MEDIA';

          if (!bestMatch || scoreTotal > bestMatch.scoreTotal) {
            bestMatch = {
              nivelConfianca,
              scoreTotal,
              tipo: 'BAIXA_PAGAR',
              targetId: cp.id,
              targetDescricao: `Contas a Pagar ${cp.numeroDocumento} Parc ${parc.numeroParcela}/${parc.totalParcelas} - ${cp.fornecedorNome}`,
              targetDocumento: `${cp.numeroDocumento} - Parc ${parc.numeroParcela}`,
              targetParceiroNome: cp.fornecedorNome,
              targetParceiroCnpjCpf: cp.fornecedorCnpjCpf,
              targetValor: valorAlvo,
              targetDataVencimento: parc.dataVencimento,
              detalhesScore: {
                scoreValor: valResult.score,
                scoreData: dataResult.score,
                scoreParceiro: parcResult.score,
                scoreDocumento: docResult.score,
                scoreIdentificador: 0,
                scoreDescricao: 0,
                scoreCobrancaRef: 0,
                scoreTotal,
                explicacoes,
              },
            };
          }
        }
      }
    }

    return bestMatch;
  }
}
