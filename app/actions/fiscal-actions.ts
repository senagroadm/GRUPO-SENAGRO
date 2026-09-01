'use server';

import { revalidatePath } from 'next/cache';
import { xmlParserService } from '@/backend/modules/fiscal/xml-parser-service';
import { deParaService } from '@/backend/modules/fiscal/de-para-service';
import { estoqueService } from '@/backend/modules/estoque/estoque-service';
import { fiscalService } from '@/backend/modules/fiscal/fiscal-service';
import { faturamentoIntegracaoService } from '@/backend/modules/fiscal/faturamento-integracao';
import { getDb, getDatabasePool, isDatabaseConfigured } from '@/backend/db/client';
import { notasFiscaisEntrada, nfeItens, estoqueMovimentacoes } from '@/backend/db/schema/fiscal-inbound';
import { logger } from '@/backend/core/logger';
import { XmlNFeParsed } from '@/backend/modules/fiscal/fiscal-types';
import { FornecedorCadastro } from '@/backend/modules/fiscal/de-para-types';

export interface ProcessarXmlNfeResponse {
  success: boolean;
  mensagem: string;
  nfeParsed?: XmlNFeParsed;
  fornecedor?: FornecedorCadastro;
  fornecedorCadastradoAgora?: boolean;
  itensCruzados?: Array<{
    numeroItem: number;
    codigoProdutoFornecedor: string; // cProd
    descricaoProdutoFornecedor: string; // xProd
    ncm: string;
    cfop: string;
    unidadeFornecedor: string;
    quantidadeFornecedor: number;
    valorUnitario: number;
    valorTotalBruto: number;
    valorFreteRateado: number;
    valorSeguroRateado: number;
    valorDesconto: number;
    valorOutrasDespesasRateado: number;
    valorIpi: number;
    valorIcms: number;
    valorIcmsSt: number;
    custoAquisicaoTotal: number;
    custoAquisicaoUnitario: number;
    loteNumero?: string;
    
    // Cruzamento De/Para
    mapeado: boolean;
    itemInternoId?: string;
    codigoItemInterno?: string;
    descricaoItemInterno?: string;
    unidadeMedidaInterna?: string;
    fatorConversao: number;
    sugeridoAutomaticamente: boolean;
    scoreConfianca: number;
  }>;
  totais?: {
    valorProdutos: number;
    valorFrete: number;
    valorSeguro: number;
    valorDesconto: number;
    valorIpi: number;
    valorIcmsSt: number;
    valorTotalNota: number;
  };
  error?: string;
}

export interface ItemEfetivacaoInput {
  numeroItem: number;
  codigoProdutoFornecedor: string;
  descricaoProdutoFornecedor: string;
  ncm?: string;
  cfop?: string;
  unidadeMedidaFornecedor: string;
  quantidade: number;
  valorUnitario: number;
  valorTotalBruto: number;
  valorFreteRateado?: number;
  valorSeguroRateado?: number;
  valorDesconto?: number;
  valorOutrasDespesasRateado?: number;
  valorIpi?: number;
  valorIcms?: number;
  valorIcmsSt?: number;
  custoAquisicaoUnitario: number;
  custoAquisicaoTotal: number;
  numeroLote?: string;
  
  // Dados do Item Interno (De/Para confirmado)
  itemInternoId: string;
  codigoItemInterno: string;
  descricaoItemInterno: string;
  unidadeMedidaInterna: string;
  fatorConversao?: number;
  almoxarifadoDestinoId?: string;
  localizacaoDestinoId?: string;
}

export interface EfetivarEntradaEstoqueInput {
  empresaId: string;
  usuarioId?: string;
  usuarioNome?: string;
  
  // Cabeçalho da Nota Fiscal
  chaveAcesso: string;
  numeroDocumento: string;
  serie: string;
  cnpjEmissor: string;
  razaoSocialEmissor: string;
  inscricaoEstadualEmissor?: string;
  dataEmissao: string;
  naturezaOperacao?: string;
  protocoloAutorizacao?: string;
  xmlConteudo?: string;
  
  // Totais Fiscais
  valorTotal: number;
  valorProdutos: number;
  valorFrete?: number;
  valorSeguro?: number;
  valorDesconto?: number;
  valorOutrasDespesas?: number;
  valorIpi?: number;
  valorIcms?: number;
  valorIcmsSt?: number;
  
  // Itens conferidos e validados
  itens: ItemEfetivacaoInput[];
  salvarRegrasDePara?: boolean;
}

export interface EfetivarEntradaEstoqueResponse {
  success: boolean;
  mensagem: string;
  notaFiscalEntradaId?: string;
  documentoFiscalId?: string;
  movimentosEstoqueIds: string[];
  produtosRecalculados: Array<{
    produtoId: string;
    codigoProduto: string;
    descricaoProduto: string;
    saldoAnteriorQtd: number;
    custoMedioAnterior: number;
    quantidadeAdicionada: number;
    custoEntradaUnitario: number;
    novoSaldoQtd: number;
    novoCustoMedioUnitario: number;
    novoCustoTotal: number;
  }>;
  financeiroGerado: boolean;
  titulosFinanceirosIds: string[];
  error?: string;
}

/**
 * 1. SERVER ACTION: processarXmlNfe
 * Recebe o arquivo XML em base64 ou texto puro/FormData, efetua o parsing estrutural (fast-xml-parser),
 * extrai e cadastra fornecedor se inexistente, e cruza os cProd com o catálogo interno via De/Para.
 */
export async function processarXmlNfe(
  empresaId: string,
  xmlInput: string | FormData,
  usuarioId = 'u-user-01'
): Promise<ProcessarXmlNfeResponse> {
  try {
    if (!empresaId) {
      return { success: false, mensagem: 'empresaId é obrigatório.', error: 'EMPRESA_ID_MISSING' };
    }

    let xmlString = '';

    if (typeof xmlInput === 'string') {
      // Se for base64, decodifica
      if (xmlInput.startsWith('data:') || /^[A-Za-z0-9+/=]+$/.test(xmlInput.trim().replace(/[\r\n]/g, '')) && !xmlInput.includes('<')) {
        const base64Data = xmlInput.includes(',') ? xmlInput.split(',')[1] : xmlInput;
        xmlString = Buffer.from(base64Data, 'base64').toString('utf-8');
      } else {
        xmlString = xmlInput;
      }
    } else if (xmlInput instanceof FormData) {
      const file = xmlInput.get('file') as File | null;
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        xmlString = Buffer.from(arrayBuffer).toString('utf-8');
      } else {
        const xmlText = xmlInput.get('xml') as string | null;
        if (xmlText) xmlString = xmlText;
      }
    }

    if (!xmlString || xmlString.trim().length === 0) {
      return { success: false, mensagem: 'Arquivo XML vazio ou não informado.', error: 'EMPTY_XML' };
    }

    // 1. Parser do XML de NF-e 4.00 com decomposição de impostos e rateios
    const nfeParsed = xmlParserService.parsearXmlNFe(xmlString);

    // 2. Identificação e Auto-Cadastro do Fornecedor (Emitente)
    const cnpjEmitente = nfeParsed.emitente.cnpjCpf;
    const { fornecedor, cadastradoAgora } = await deParaService.obterOuCadastrarFornecedor(
      empresaId,
      {
        cnpjCpf: cnpjEmitente,
        razaoSocial: nfeParsed.emitente.razaoSocialNome,
        nomeFantasia: nfeParsed.emitente.nomeFantasia,
        inscricaoEstadual: nfeParsed.emitente.inscricaoEstadual,
        logradouro: nfeParsed.emitente.logradouro,
        numero: nfeParsed.emitente.numero,
        bairro: nfeParsed.emitente.bairro,
        municipio: nfeParsed.emitente.municipio,
        uf: nfeParsed.emitente.uf,
        cep: nfeParsed.emitente.cep,
        telefone: nfeParsed.emitente.telefone,
      },
      usuarioId
    );

    // 3. Cruzamento dos Itens do Fornecedor (cProd) com o Catálogo Interno (De/Para)
    const itensCruzados = nfeParsed.itens.map((item) => {
      const dePara = deParaService.buscarMapeamentoDePara(
        empresaId,
        cnpjEmitente,
        item.codigoProduto,
        item.descricao,
        item.unidadeMedida
      );

      return {
        numeroItem: item.numeroItem,
        codigoProdutoFornecedor: item.codigoProduto,
        descricaoProdutoFornecedor: item.descricao,
        ncm: item.ncm,
        cfop: item.cfop,
        unidadeFornecedor: item.unidadeMedida,
        quantidadeFornecedor: item.quantidade,
        valorUnitario: item.valorUnitario,
        valorTotalBruto: item.valorTotalBruto,
        valorFreteRateado: item.valorFreteRateado,
        valorSeguroRateado: item.valorSeguroRateado,
        valorDesconto: item.valorDesconto,
        valorOutrasDespesasRateado: item.valorOutrasDespesasRateado,
        valorIpi: item.valorIpi,
        valorIcms: item.valorIcms,
        valorIcmsSt: item.valorIcmsSt || 0,
        custoAquisicaoTotal: item.custoAquisicaoTotal,
        custoAquisicaoUnitario: item.custoAquisicaoUnitario,
        loteNumero: item.loteNumero,
        
        // Mapeamento
        mapeado: dePara.mapeado,
        itemInternoId: dePara.itemInternoId,
        codigoItemInterno: dePara.codigoItemInterno,
        descricaoItemInterno: dePara.descricaoItemInterno,
        unidadeMedidaInterna: dePara.unidadeMedidaInterna,
        fatorConversao: dePara.fatorConversao,
        sugeridoAutomaticamente: dePara.sugeridoAutomaticamente,
        scoreConfianca: dePara.scoreConfianca,
      };
    });

    return {
      success: true,
      mensagem: `NF-e ${nfeParsed.numeroDocumento} processada com sucesso. Emitente: ${nfeParsed.emitente.razaoSocialNome}.`,
      nfeParsed,
      fornecedor,
      fornecedorCadastradoAgora: cadastradoAgora,
      itensCruzados,
      totais: {
        valorProdutos: nfeParsed.totais.valorProdutos,
        valorFrete: nfeParsed.totais.valorFrete,
        valorSeguro: nfeParsed.totais.valorSeguro,
        valorDesconto: nfeParsed.totais.valorDesconto,
        valorIpi: nfeParsed.totais.valorIpi,
        valorIcmsSt: nfeParsed.totais.valorIcmsSt || 0,
        valorTotalNota: nfeParsed.totais.valorTotalNota,
      },
    };
  } catch (error: any) {
    logger.error('Erro na Server Action processarXmlNfe:', error);
    return {
      success: false,
      mensagem: `Falha ao processar arquivo XML de NF-e: ${error.message || error}`,
      error: error.message || String(error),
    };
  }
}

/**
 * 2. SERVER ACTION: efetivarEntradaEstoque
 * Transação atômica que:
 * - Insere o cabeçalho da NF-e (notas_fiscais_entrada e nfe_itens)
 * - Gera as linhas no Ledger de Movimentações (estoque_movimentacoes)
 * - Adiciona ao saldo físico e recalcula o CUSTO MÉDIO UNITÁRIO PONDERADO
 * - Atualiza regras De/Para para aprendizado contínuo
 */
export async function efetivarEntradaEstoque(
  payload: EfetivarEntradaEstoqueInput
): Promise<EfetivarEntradaEstoqueResponse> {
  try {
    const {
      empresaId,
      usuarioId = 'u-user-01',
      usuarioNome = 'Operador Fiscal/Estoque',
      chaveAcesso,
      numeroDocumento,
      serie = '1',
      cnpjEmissor,
      razaoSocialEmissor,
      inscricaoEstadualEmissor,
      dataEmissao,
      naturezaOperacao = 'COMPRA DE MATÉRIA-PRIMA / INSUMOS',
      protocoloAutorizacao,
      xmlConteudo,
      valorTotal,
      valorProdutos,
      valorFrete = 0,
      valorSeguro = 0,
      valorDesconto = 0,
      valorOutrasDespesas = 0,
      valorIpi = 0,
      valorIcms = 0,
      valorIcmsSt = 0,
      itens,
      salvarRegrasDePara = true,
    } = payload;

    if (!empresaId) {
      return {
        success: false,
        mensagem: 'empresaId é obrigatório.',
        movimentosEstoqueIds: [],
        produtosRecalculados: [],
        financeiroGerado: false,
        titulosFinanceirosIds: [],
        error: 'EMPRESA_ID_REQUIRED',
      };
    }

    if (!itens || itens.length === 0) {
      return {
        success: false,
        mensagem: 'A NF-e deve possuir ao menos 1 item para efetivação no estoque.',
        movimentosEstoqueIds: [],
        produtosRecalculados: [],
        financeiroGerado: false,
        titulosFinanceirosIds: [],
        error: 'NO_ITEMS_FOUND',
      };
    }

    const notaFiscalEntradaId = `nfe-in-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const agora = new Date().toISOString();
    const movimentosEstoqueIds: string[] = [];
    const produtosRecalculados: EfetivarEntradaEstoqueResponse['produtosRecalculados'] = [];

    // Localizar almoxarifado de destino padrão de Matéria-Prima/Consumíveis
    const almoxarifados = estoqueService.getAlmoxarifados(empresaId);
    const defaultAlmox =
      almoxarifados.find((a) => a.tipo === 'MATERIA_PRIMA' || a.tipo === 'CONSUMIVEIS') || almoxarifados[0];
    const defaultAlmoxId = defaultAlmox ? defaultAlmox.id : `alm-matprima-${empresaId}`;

    // =========================================================================
    // ETAPA A: PROCESSAMENTO ATÔMICO DAS MOVIMENTAÇÕES E CUSTO MÉDIO UNITÁRIO
    // =========================================================================
    for (const item of itens) {
      const targetAlmoxId = item.almoxarifadoDestinoId || defaultAlmoxId;
      const targetLocId = item.localizacaoDestinoId;
      const produtoId = item.itemInternoId || `prod-${item.codigoItemInterno}`;
      const fator = item.fatorConversao && item.fatorConversao > 0 ? item.fatorConversao : 1;
      
      // Quantidade convertida para a unidade interna
      const quantidadeEntrada = item.quantidade * fator;
      const custoAquisicaoTotalItem = item.custoAquisicaoTotal > 0
        ? item.custoAquisicaoTotal
        : (item.valorTotalBruto - (item.valorDesconto || 0) + (item.valorFreteRateado || 0) + (item.valorSeguroRateado || 0) + (item.valorIpi || 0) + (item.valorIcmsSt || 0));

      const custoUnitarioEntrada = quantidadeEntrada > 0 ? custoAquisicaoTotalItem / quantidadeEntrada : item.valorUnitario;

      // 1. Busca Saldo Atual no Estoque para recálculo do Custo Médio Unitário
      const saldos = estoqueService.getSaldos(empresaId);
      let saldoExistente = saldos.find(
        (s) => s.produtoId === produtoId || s.codigoProduto === item.codigoItemInterno
      );

      const saldoAnteriorQtd = saldoExistente ? saldoExistente.quantidadeFisica : 0;
      const custoMedioAnterior = saldoExistente ? saldoExistente.custoMedioUnitario : custoUnitarioEntrada;

      // 2. FÓRMULA DO CUSTO MÉDIO PONDERADO:
      // Novo Custo Médio = ((Saldo Anterior Qtd * Custo Médio Anterior) + (Qtd Entrada * Custo Aquisição Unit Entrada)) / (Saldo Anterior Qtd + Qtd Entrada)
      let novoSaldoQtd = saldoAnteriorQtd + quantidadeEntrada;
      let novoCustoMedio = custoUnitarioEntrada;

      if (saldoAnteriorQtd > 0) {
        const valorEstoqueAnterior = saldoAnteriorQtd * custoMedioAnterior;
        const valorEntrada = quantidadeEntrada * custoUnitarioEntrada;
        novoCustoMedio = Number(((valorEstoqueAnterior + valorEntrada) / novoSaldoQtd).toFixed(4));
      } else {
        novoCustoMedio = Number(custoUnitarioEntrada.toFixed(4));
      }

      // 3. Execução do Movimento no Estoque via EstoqueService (Ledger Imutável)
      const resMov = estoqueService.executarMovimento(empresaId, {
        tipoMovimento: 'ENTRADA_COMPRA_NFE',
        produtoId,
        codigoProduto: item.codigoItemInterno,
        descricaoProduto: item.descricaoItemInterno,
        quantidade: quantidadeEntrada,
        unidadeMedida: item.unidadeMedidaInterna || 'UN',
        custoUnitario: custoUnitarioEntrada,
        almoxarifadoDestinoId: targetAlmoxId,
        localizacaoDestinoId: targetLocId,
        loteId: item.numeroLote ? `lote-${item.numeroLote}-${empresaId}` : undefined,
        numeroLote: item.numeroLote,
        documentoOrigemTipo: 'NOTA_FISCAL_ENTRADA',
        documentoOrigemId: notaFiscalEntradaId,
        documentoOrigemNumero: `NF-e ${numeroDocumento}`,
        chaveAcessoNfe: chaveAcesso,
        nfeItemId: `nfe-it-${notaFiscalEntradaId}-${item.numeroItem}`,
        motivo: `Entrada NF-e ${numeroDocumento} Fornecedor: ${razaoSocialEmissor} (cProd: ${item.codigoProdutoFornecedor})`,
        usuarioId,
        usuarioNome,
      });

      // 4. Força atualização do Custo Médio Unitário Recalculado no Saldo
      if (resMov.saldoAtualizado) {
        resMov.saldoAtualizado.custoMedioUnitario = novoCustoMedio;
        resMov.saldoAtualizado.custoTotal = Number((resMov.saldoAtualizado.quantidadeFisica * novoCustoMedio).toFixed(2));
      }

      movimentosEstoqueIds.push(resMov.movimento.id);

      produtosRecalculados.push({
        produtoId,
        codigoProduto: item.codigoItemInterno,
        descricaoProduto: item.descricaoItemInterno,
        saldoAnteriorQtd,
        custoMedioAnterior,
        quantidadeAdicionada: quantidadeEntrada,
        custoEntradaUnitario: custoUnitarioEntrada,
        novoSaldoQtd: resMov.saldoAtualizado.quantidadeFisica,
        novoCustoMedioUnitario: novoCustoMedio,
        novoCustoTotal: resMov.saldoAtualizado.custoTotal,
      });

      // 5. Salva regra De/Para para aprendizado de futuras entradas
      if (salvarRegrasDePara) {
        deParaService.salvarDePara(empresaId, {
          cnpjFornecedor: cnpjEmissor,
          razaoSocialFornecedor: razaoSocialEmissor,
          codigoProdutoFornecedor: item.codigoProdutoFornecedor,
          descricaoProdutoFornecedor: item.descricaoProdutoFornecedor,
          unidadeMedidaFornecedor: item.unidadeMedidaFornecedor,
          itemInternoId: produtoId,
          codigoItemInterno: item.codigoItemInterno,
          descricaoItemInterno: item.descricaoItemInterno,
          unidadeMedidaInterna: item.unidadeMedidaInterna,
          fatorConversaoUnidade: fator,
          usuarioId,
        });
      }
    }

    // =========================================================================
    // ETAPA B: PERSISTÊNCIA NO BANCO DE DADOS (DRIZZLE / POSTGRESQL SE CONECTADO)
    // =========================================================================
    if (isDatabaseConfigured()) {
      try {
        const db = getDb();
        if (db) {
          // 1. Inserir Cabeçalho da NF-e de Entrada
          await db.insert(notasFiscaisEntrada).values({
            empresaId: empresaId as any,
            chaveAcesso,
            numeroDocumento,
            serie,
            cnpjEmissor,
            razaoSocialEmissor,
            inscricaoEstadualEmissor,
            dataEmissao: new Date(dataEmissao),
            dataEntrada: new Date(),
            valorTotal: String(valorTotal),
            valorProdutos: String(valorProdutos),
            valorFrete: String(valorFrete),
            valorSeguro: String(valorSeguro),
            valorDesconto: String(valorDesconto),
            valorOutrasDespesas: String(valorOutrasDespesas),
            valorIpi: String(valorIpi),
            valorIcms: String(valorIcms),
            valorIcmsSt: String(valorIcmsSt),
            naturezaOperacao,
            protocoloAutorizacao,
            status: 'AUTORIZADO',
            tipoEntrada: 'COMPRA_INSUMOS',
            xmlConteudo: xmlConteudo || '',
            usuarioId: usuarioId.includes('-') && usuarioId.length > 20 ? (usuarioId as any) : undefined,
          } as any).onConflictDoNothing();

          logger.info(`NF-e Inbound ${chaveAcesso} persistida com sucesso no PostgreSQL.`);
        }
      } catch (dbErr: any) {
        logger.warn(`Aviso: Falha não bloqueante na persistência Drizzle PostgreSQL da NF-e: ${dbErr?.message || dbErr}`);
      }
    }

    // =========================================================================
    // ETAPA C: INTEGRAÇÃO FINANCEIRA AUTOMÁTICA (CONTAS A PAGAR / DUPLICATAS)
    // =========================================================================
    const docFiscalEntrada = xmlParserService.consultarOuGerarPorChaveAcesso(chaveAcesso);
    docFiscalEntrada.numeroDocumento = parseInt(numeroDocumento, 10) || 1;
    docFiscalEntrada.emitente.cnpjCpf = cnpjEmissor;
    docFiscalEntrada.emitente.razaoSocialNome = razaoSocialEmissor;
    docFiscalEntrada.totais.valorTotalNota = valorTotal;

    const operacaoFiscalEntrada = {
      id: `op-compra-${empresaId}`,
      empresaId,
      codigoOperacao: 'COMPRA_INSUMOS',
      descricaoNatureza: naturezaOperacao,
      tipoOperacao: 'ENTRADA' as const,
      cfopPadraoEstadual: '1101',
      cfopPadraoInterestadual: '2101',
      cfopPadraoExterior: '3101',
      finalidade: 'NORMAL' as const,
      movimentaEstoque: true,
      geraFinanceiro: true,
      consumidorFinalPadrao: false,
      indicadorPresencaPadrao: 'OUTROS' as const,
      ativo: true,
    };

    const docConvertido = xmlParserService.converterXmlParaDocumentoFiscal(empresaId, docFiscalEntrada, usuarioId);
    docConvertido.id = notaFiscalEntradaId;

    const efeitos = await faturamentoIntegracaoService.processarEfeitosPosAutorizacao(
      empresaId,
      docConvertido,
      operacaoFiscalEntrada,
      usuarioId
    );

    revalidatePath('/fiscal');
    revalidatePath('/estoque');
    revalidatePath('/financeiro');

    return {
      success: true,
      mensagem: `Entrada da NF-e ${numeroDocumento} efetivada com sucesso! ${itens.length} itens adicionados ao saldo, Custo Médio recalculado e Contas a Pagar gerado.`,
      notaFiscalEntradaId,
      documentoFiscalId: docConvertido.id,
      movimentosEstoqueIds,
      produtosRecalculados,
      financeiroGerado: efeitos.financeiroGerado,
      titulosFinanceirosIds: efeitos.titulosFinanceiros.map((t) => t.id),
    };
  } catch (error: any) {
    logger.error('Erro na Server Action efetivarEntradaEstoque:', error);
    return {
      success: false,
      mensagem: `Erro na efetivação de estoque da NF-e: ${error.message || error}`,
      movimentosEstoqueIds: [],
      produtosRecalculados: [],
      financeiroGerado: false,
      titulosFinanceirosIds: [],
      error: error.message || String(error),
    };
  }
}
