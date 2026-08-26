/**
 * ============================================================================
 * PARSER CONFIGURÁVEL DE EXTRATOS CSV
 * NEXUS ERP (Grupo TRITECH)
 * ============================================================================
 * 
 * Suporta presets dos principais bancos brasileiros e mapeamento flexível de
 * colunas, separadores, formatos de data e valor monetário.
 * ============================================================================
 */

import { ConfigMapeamentoCsv, ExtratoBancarioItem, PresetMapeamentoCsv, TipoTransacaoExtrato } from './conciliacao-types';

export const PRESETS_CSV_BANCARIOS: PresetMapeamentoCsv[] = [
  {
    id: 'itau-csv',
    nome: 'Itaú Unibanco (CSV Padrão)',
    descricao: 'Layout exportado pelo Itaú Empresas (Data, Histórico, Valor, Saldo)',
    bancoCodigo: '341',
    config: {
      separador: ';',
      encoding: 'utf-8',
      temCabecalho: true,
      linhaInicioDados: 2,
      formatoData: 'DD/MM/YYYY',
      formatoValor: 'BR',
      formatoTipoTransacao: 'COLUNA_VALOR_COM_SINAL',
      colunas: {
        dataCol: 'data',
        descricaoCol: 'historico',
        valorCol: 'valor',
        documentoCol: 'documento',
        saldoCol: 'saldo',
      },
    },
  },
  {
    id: 'bb-csv',
    nome: 'Banco do Brasil (CSV)',
    descricao: 'Layout do Autoatendimento BB PJ (Data, Histórico, Documento, Valor, Saldo)',
    bancoCodigo: '001',
    config: {
      separador: ',',
      encoding: 'utf-8',
      temCabecalho: true,
      linhaInicioDados: 2,
      formatoData: 'DD/MM/YYYY',
      formatoValor: 'BR',
      formatoTipoTransacao: 'COLUNA_VALOR_COM_SINAL',
      colunas: {
        dataCol: 'Data',
        descricaoCol: 'Histórico',
        documentoCol: 'Documento',
        valorCol: 'Valor',
        saldoCol: 'Saldo',
      },
    },
  },
  {
    id: 'bradesco-csv',
    nome: 'Bradesco Net Empresa (CSV)',
    descricao: 'Layout Net Empresa com colunas separadas para Débito e Crédito',
    bancoCodigo: '237',
    config: {
      separador: ';',
      encoding: 'utf-8',
      temCabecalho: true,
      linhaInicioDados: 2,
      formatoData: 'DD/MM/YYYY',
      formatoValor: 'BR',
      formatoTipoTransacao: 'COLUNAS_DEBITO_CREDITO',
      colunas: {
        dataCol: 'Data',
        descricaoCol: 'Descrição',
        documentoCol: 'Docto.',
        debitoCol: 'Débito',
        creditoCol: 'Crédito',
        saldoCol: 'Saldo',
      },
    },
  },
  {
    id: 'santander-csv',
    nome: 'Santander Empresas (CSV)',
    descricao: 'Layout Santander com coluna Tipo (D/C)',
    bancoCodigo: '033',
    config: {
      separador: ';',
      encoding: 'utf-8',
      temCabecalho: true,
      linhaInicioDados: 2,
      formatoData: 'DD/MM/YYYY',
      formatoValor: 'BR',
      formatoTipoTransacao: 'COLUNA_TIPO_SEPARADA',
      colunas: {
        dataCol: 'DATA',
        descricaoCol: 'DESCRICAO',
        documentoCol: 'DOCUMENTO',
        valorCol: 'VALOR',
        tipoTransacaoCol: 'TIPO',
        saldoCol: 'SALDO',
      },
    },
  },
  {
    id: 'sicoob-csv',
    nome: 'Sicoob Cooperativa (CSV)',
    descricao: 'Layout Sicoobnet Empresarial',
    bancoCodigo: '756',
    config: {
      separador: ';',
      encoding: 'utf-8',
      temCabecalho: true,
      linhaInicioDados: 2,
      formatoData: 'DD/MM/YYYY',
      formatoValor: 'BR',
      formatoTipoTransacao: 'COLUNA_VALOR_COM_SINAL',
      colunas: {
        dataCol: 'Data Lançamento',
        descricaoCol: 'Histórico',
        documentoCol: 'Documento',
        valorCol: 'Valor',
        saldoCol: 'Saldo',
      },
    },
  },
  {
    id: 'generico-csv',
    nome: 'Genérico Flexível (Vírgula / Ponto e Vírgula)',
    descricao: 'Mapeamento universal com autodetecção de colunas',
    config: {
      separador: ';',
      encoding: 'utf-8',
      temCabecalho: true,
      linhaInicioDados: 2,
      formatoData: 'DD/MM/YYYY',
      formatoValor: 'BR',
      formatoTipoTransacao: 'COLUNA_VALOR_COM_SINAL',
      colunas: {
        dataCol: 'Data',
        descricaoCol: 'Historico',
        valorCol: 'Valor',
        documentoCol: 'Documento',
      },
    },
  },
];

export interface CsvParseResult {
  dataInicio: string;
  dataFim: string;
  totalLinhasLidas: number;
  itens: Omit<ExtratoBancarioItem, 'id' | 'extratoId' | 'empresaId' | 'contaBancariaId' | 'status' | 'createdAt' | 'updatedAt'>[];
}

export class CsvParser {
  /**
   * Converte data em vários formatos para YYYY-MM-DD
   */
  private static parseDate(rawDate: string, format: ConfigMapeamentoCsv['formatoData']): string {
    if (!rawDate) return new Date().toISOString().split('T')[0];
    const clean = rawDate.trim();

    if (format === 'DD/MM/YYYY' || format === 'DD-MM-YYYY') {
      const parts = clean.split(/[\/\-.]/);
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        let year = parts[2];
        if (year.length === 2) year = `20${year}`;
        return `${year}-${month}-${day}`;
      }
    } else if (format === 'MM/DD/YYYY') {
      const parts = clean.split(/[\/\-.]/);
      if (parts.length === 3) {
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        let year = parts[2];
        if (year.length === 2) year = `20${year}`;
        return `${year}-${month}-${day}`;
      }
    } else if (format === 'YYYY-MM-DD') {
      const parts = clean.split(/[\/\-.]/);
      if (parts.length === 3) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    }

    return new Date().toISOString().split('T')[0];
  }

  /**
   * Converte valor monetário formatado (BR ou US) para number
   */
  private static parseAmount(rawVal: string | number | undefined, format: 'BR' | 'US'): number {
    if (rawVal === undefined || rawVal === null || rawVal === '') return 0;
    if (typeof rawVal === 'number') return rawVal;

    let clean = rawVal.trim().replace(/[R$\s]/g, '');

    if (format === 'BR') {
      // Ex: 1.234,56 ou -1.234,56 ou 1234,56
      // Remove pontos de milhar e troca vírgula por ponto
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      // Ex: 1,234.56 -> remove vírgulas
      clean = clean.replace(/,/g, '');
    }

    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Analisa linhas de CSV respeitando aspas e delimitadores
   */
  private static parseCsvLine(line: string, separator: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^["']|["']$/g, ''));
    return result;
  }

  /**
   * Processa o arquivo CSV com base na configuração
   */
  public static parse(csvContent: string, config: ConfigMapeamentoCsv): CsvParseResult {
    if (!csvContent || typeof csvContent !== 'string') {
      throw new Error('Conteúdo CSV inválido ou vazio.');
    }

    const rawLines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (rawLines.length === 0) {
      throw new Error('Arquivo CSV não contém linhas válidas.');
    }

    let headers: string[] = [];
    let dataLines: string[][] = [];

    if (config.temCabecalho) {
      headers = this.parseCsvLine(rawLines[0], config.separador).map((h) => h.trim());
      for (let i = config.linhaInicioDados - 1; i < rawLines.length; i++) {
        if (rawLines[i]) {
          dataLines.push(this.parseCsvLine(rawLines[i], config.separador));
        }
      }
    } else {
      for (let i = 0; i < rawLines.length; i++) {
        dataLines.push(this.parseCsvLine(rawLines[i], config.separador));
      }
    }

    // Helper para obter valor da coluna por nome do cabeçalho ou índice numérico
    const getColValue = (row: string[], colDef?: string): string => {
      if (!colDef) return '';
      // Se for número direto (índice 0-based)
      if (/^\d+$/.test(colDef)) {
        const idx = parseInt(colDef, 10);
        return row[idx] || '';
      }
      // Se tiver cabeçalho, procura pelo nome
      if (headers.length > 0) {
        const foundIdx = headers.findIndex((h) => h.toLowerCase() === colDef.toLowerCase());
        if (foundIdx >= 0) {
          return row[foundIdx] || '';
        }
        // Procura por substring
        const partialIdx = headers.findIndex((h) => h.toLowerCase().includes(colDef.toLowerCase()));
        if (partialIdx >= 0) {
          return row[partialIdx] || '';
        }
      }
      return '';
    };

    const itens: CsvParseResult['itens'] = [];
    let minDate = '9999-12-31';
    let maxDate = '0000-01-01';

    for (let i = 0; i < dataLines.length; i++) {
      const row = dataLines[i];
      if (row.length < 2) continue; // Pula linhas vazias ou corrompidas

      const rawDate = getColValue(row, config.colunas.dataCol);
      const memo = getColValue(row, config.colunas.descricaoCol) || 'LANÇAMENTO CSV';
      const doc = getColValue(row, config.colunas.documentoCol) || undefined;
      const fitidColVal = getColValue(row, config.colunas.fitidCol);

      if (!rawDate && !memo) continue;

      const dataTransacao = this.parseDate(rawDate, config.formatoData);
      if (dataTransacao < minDate) minDate = dataTransacao;
      if (dataTransacao > maxDate) maxDate = dataTransacao;

      let valorAbsoluto = 0;
      let valorSinal = 0;
      let tipoTransacao: TipoTransacaoExtrato = 'CREDITO';

      if (config.formatoTipoTransacao === 'COLUNA_VALOR_COM_SINAL') {
        const rawVal = getColValue(row, config.colunas.valorCol);
        valorSinal = this.parseAmount(rawVal, config.formatoValor);
        valorAbsoluto = Math.abs(valorSinal);
        tipoTransacao = valorSinal >= 0 ? 'CREDITO' : 'DEBITO';
      } else if (config.formatoTipoTransacao === 'COLUNAS_DEBITO_CREDITO') {
        const rawDeb = getColValue(row, config.colunas.debitoCol);
        const rawCred = getColValue(row, config.colunas.creditoCol);
        const debVal = this.parseAmount(rawDeb, config.formatoValor);
        const credVal = this.parseAmount(rawCred, config.formatoValor);

        if (credVal > 0) {
          valorAbsoluto = credVal;
          valorSinal = credVal;
          tipoTransacao = 'CREDITO';
        } else if (debVal > 0) {
          valorAbsoluto = debVal;
          valorSinal = -debVal;
          tipoTransacao = 'DEBITO';
        }
      } else if (config.formatoTipoTransacao === 'COLUNA_TIPO_SEPARADA') {
        const rawVal = getColValue(row, config.colunas.valorCol);
        const rawTipo = getColValue(row, config.colunas.tipoTransacaoCol).toUpperCase();
        valorAbsoluto = Math.abs(this.parseAmount(rawVal, config.formatoValor));
        if (rawTipo.startsWith('D') || rawTipo.includes('DEB')) {
          tipoTransacao = 'DEBITO';
          valorSinal = -valorAbsoluto;
        } else {
          tipoTransacao = 'CREDITO';
          valorSinal = valorAbsoluto;
        }
      }

      if (valorAbsoluto === 0) continue;

      const fitid = fitidColVal || `CSV-${dataTransacao}-${Math.round(valorAbsoluto * 100)}-${doc || i + 1}`;

      itens.push({
        dataTransacao,
        tipoTransacao,
        valor: valorAbsoluto,
        valorOriginalSinal: valorSinal,
        fitid,
        checknum: doc,
        memo: memo.trim(),
        rawPayload: { rowData: row },
      });
    }

    return {
      dataInicio: minDate === '9999-12-31' ? new Date().toISOString().split('T')[0] : minDate,
      dataFim: maxDate === '0000-01-01' ? new Date().toISOString().split('T')[0] : maxDate,
      totalLinhasLidas: dataLines.length,
      itens,
    };
  }
}
