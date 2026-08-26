/**
 * NEXUS ERP - Motor Fiscal Desacoplado
 * Cálculos Tributários Parametrizados, Enquadramento de Regras e Suporte à Reforma Tributária (IBS/CBS)
 */

import {
  ConfiguracaoFiscal,
  RegraTributaria,
  OperacaoFiscal,
  TributacaoProduto,
  TributacaoServico,
  DocumentoFiscalItem,
  MemoriaCalculoIbsCbs,
  DocumentoFiscal,
} from './fiscal-types';

export interface ParametrosCalculoItem {
  produto?: TributacaoProduto;
  servico?: TributacaoServico;
  codigoItem: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorDesconto?: number;
  valorFreteRateado?: number;
  valorSeguroRateado?: number;
  valorOutrasDespesasRateado?: number;
  cfopManual?: string;
  ncmManual?: string;
  loteNumero?: string;
}

export interface ContextoEmissaoFiscal {
  configuracaoEmpresa: ConfiguracaoFiscal;
  operacao: OperacaoFiscal;
  ufOrigem: string;
  ufDestino: string;
  indicadorIeDestinatario: '1_CONTRIBUINTE' | '2_ISENTO' | '9_NAO_CONTRIBUINTE';
  regrasTributarias: RegraTributaria[];
}

export class MotorFiscalService {
  /**
   * Localiza a regra tributária mais específica para a operação
   */
  public encontrarRegraTributaria(
    contexto: ContextoEmissaoFiscal,
    codigoProduto?: string
  ): RegraTributaria | null {
    const { ufOrigem, ufDestino, indicadorIeDestinatario, regrasTributarias } = contexto;
    const tipoContribuinte =
      indicadorIeDestinatario === '1_CONTRIBUINTE'
        ? 'CONTRIBUINTE_ICMS'
        : 'NAO_CONTRIBUINTE';

    // Ordena por prioridade (menor número = maior prioridade)
    const regrasOrdenadas = [...regrasTributarias]
      .filter((r) => r.ativo)
      .sort((a, b) => a.prioridade - b.prioridade);

    for (const regra of regrasOrdenadas) {
      const matchUfOrigem = regra.ufOrigem === '*' || regra.ufOrigem === ufOrigem;
      const matchUfDestino = regra.ufDestino === '*' || regra.ufDestino === ufDestino;
      const matchContribuinte =
        regra.tipoContribuinteDestino === tipoContribuinte ||
        regra.tipoContribuinteDestino === 'CONTRIBUINTE_ICMS'; // default fallback

      if (matchUfOrigem && matchUfDestino && matchContribuinte) {
        return regra;
      }
    }

    return null;
  }

  /**
   * Determina o CFOP correto com base no local de destino
   */
  public determinarCfop(operacao: OperacaoFiscal, ufOrigem: string, ufDestino: string): string {
    if (ufDestino === 'EX') {
      return operacao.cfopPadraoExterior;
    }
    if (ufOrigem === ufDestino) {
      return operacao.cfopPadraoEstadual;
    }
    return operacao.cfopPadraoInterestadual;
  }

  /**
   * Executa o cálculo tributário completo de um item
   */
  public calcularTributosItem(
    itemParam: ParametrosCalculoItem,
    contexto: ContextoEmissaoFiscal,
    numeroItem: number
  ): DocumentoFiscalItem {
    const { configuracaoEmpresa, operacao, ufOrigem, ufDestino } = contexto;
    const regra = this.encontrarRegraTributaria(contexto, itemParam.codigoItem);

    const valorBruto = itemParam.quantidade * itemParam.valorUnitario;
    const valorDesconto = itemParam.valorDesconto || 0;
    const valorFrete = itemParam.valorFreteRateado || 0;
    const valorSeguro = itemParam.valorSeguroRateado || 0;
    const valorOutrasDespesas = itemParam.valorOutrasDespesasRateado || 0;
    const valorLiquido = valorBruto - valorDesconto + valorFrete + valorSeguro + valorOutrasDespesas;

    const cfop = itemParam.cfopManual || this.determinarCfop(operacao, ufOrigem, ufDestino);
    const ncm = itemParam.ncmManual || itemParam.produto?.ncm || '84818099';
    const cest = itemParam.produto?.cest;
    const origemMercadoria = itemParam.produto?.origemMercadoria || '0_NACIONAL';

    // 1. CÁLCULO DE ICMS
    let cstCsosnIcms = '00';
    let baseIcms = 0;
    let aliquotaIcms = 0;
    let valorIcms = 0;
    let baseIcmsSt = 0;
    let aliquotaIcmsSt = 0;
    let valorIcmsSt = 0;
    let valorFcp = 0;

    if (configuracaoEmpresa.regimeTributario === 'SIMPLES_NACIONAL') {
      cstCsosnIcms = regra?.csosnIcms || '102'; // Padrão Simples sem permissão de crédito
      if (['101', '201', '900'].includes(cstCsosnIcms)) {
        aliquotaIcms = configuracaoEmpresa.aliquotaSimplesNacionalPercentual || 2.82;
        baseIcms = valorLiquido;
        valorIcms = (baseIcms * aliquotaIcms) / 100;
      }
    } else {
      // Regime Normal (Lucro Presumido / Real)
      cstCsosnIcms = regra?.cstIcms || '00';
      aliquotaIcms = regra?.aliquotaIcmsBasePercentual ?? (ufOrigem === ufDestino ? 18.0 : 12.0);
      
      const redBase = (regra?.reducaoBaseIcmsPercentual || 0) / 100;
      baseIcms = valorLiquido * (1 - redBase);
      valorIcms = (baseIcms * aliquotaIcms) / 100;

      // ICMS-ST se parametrizado
      if (regra?.possuiStIcms && regra.mvaStPercentual) {
        const mva = regra.mvaStPercentual / 100;
        baseIcmsSt = valorLiquido * (1 + mva);
        aliquotaIcmsSt = regra.aliquotaIcmsInternaDestinoSt || 18.0;
        const debitoSt = (baseIcmsSt * aliquotaIcmsSt) / 100;
        valorIcmsSt = Math.max(0, debitoSt - valorIcms);
      }
    }

    // 2. CÁLCULO DE IPI
    let cstIpi = regra?.cstIpi || '50';
    let baseIpi = 0;
    let aliquotaIpi = 0;
    let valorIpi = 0;

    if (!itemParam.produto?.isentoIpi && regra?.aliquotaIpiPercentual) {
      aliquotaIpi = itemParam.produto?.aliquotaIpiPropria ?? regra.aliquotaIpiPercentual;
      baseIpi = valorBruto - valorDesconto;
      valorIpi = (baseIpi * aliquotaIpi) / 100;
    }

    // 3. CÁLCULO DE PIS / COFINS
    let cstPis = regra?.cstPis || (configuracaoEmpresa.regimeTributario === 'SIMPLES_NACIONAL' ? '99' : '01');
    let aliquotaPis = regra?.aliquotaPisPercentual ?? (configuracaoEmpresa.regimeTributario === 'LUCRO_REAL' ? 1.65 : 0.65);
    let basePis = valorLiquido;
    let valorPis = (basePis * aliquotaPis) / 100;

    let cstCofins = regra?.cstCofins || (configuracaoEmpresa.regimeTributario === 'SIMPLES_NACIONAL' ? '99' : '01');
    let aliquotaCofins = regra?.aliquotaCofinsPercentual ?? (configuracaoEmpresa.regimeTributario === 'LUCRO_REAL' ? 7.6 : 3.0);
    let baseCofins = valorLiquido;
    let valorCofins = (baseCofins * aliquotaCofins) / 100;

    // Se Simples Nacional e não tributado monofásico
    if (configuracaoEmpresa.regimeTributario === 'SIMPLES_NACIONAL') {
      valorPis = 0;
      valorCofins = 0;
    }

    // 4. CÁLCULO DE ISS (Se for serviço)
    let baseIss = 0;
    let aliquotaIss = 0;
    let valorIss = 0;
    let issRetido = false;

    if (itemParam.servico) {
      baseIss = valorBruto - valorDesconto;
      aliquotaIss = itemParam.servico.aliquotaIssPercentual || 5.0;
      valorIss = (baseIss * aliquotaIss) / 100;
      issRetido = itemParam.servico.issRetidoPadrao;
    }

    // 5. EXTENSÃO REFORMA TRIBUTÁRIA: IBS & CBS (EC 132/2023)
    let memoriaIbsCbs: MemoriaCalculoIbsCbs | undefined = undefined;
    if (configuracaoEmpresa.habilitarReformaTributariaIbsCbs) {
      const cfgIbs = itemParam.produto?.ibsCbsConfig || regra?.tributacaoIbsCbs || {
        cstIbsCbs: '01',
        aliquotaIbsEstadualPercentual: 17.5,
        aliquotaIbsMunicipalPercentual: 2.5,
        aliquotaCbsFederalPercentual: 8.8,
        aliquotaImpostoSeletivoPercentual: 0,
      };

      const baseIbsCbs = valorLiquido;
      const vIbsEst = (baseIbsCbs * cfgIbs.aliquotaIbsEstadualPercentual) / 100;
      const vIbsMun = (baseIbsCbs * cfgIbs.aliquotaIbsMunicipalPercentual) / 100;
      const vIbsTot = vIbsEst + vIbsMun;
      const vCbsFed = (baseIbsCbs * cfgIbs.aliquotaCbsFederalPercentual) / 100;
      const vIS = ((cfgIbs.aliquotaImpostoSeletivoPercentual || 0) * baseIbsCbs) / 100;

      memoriaIbsCbs = {
        baseCalculoIbsCbs: baseIbsCbs,
        valorIbsEstadual: parseFloat(vIbsEst.toFixed(2)),
        valorIbsMunicipal: parseFloat(vIbsMun.toFixed(2)),
        valorIbsTotal: parseFloat(vIbsTot.toFixed(2)),
        valorCbsFederal: parseFloat(vCbsFed.toFixed(2)),
        valorImpostoSeletivo: parseFloat(vIS.toFixed(2)),
        valorTotalTributosNovaReforma: parseFloat((vIbsTot + vCbsFed + vIS).toFixed(2)),
      };
    }

    return {
      id: `item-${numeroItem}-${Date.now()}`,
      numeroItem,
      produtoId: itemParam.produto?.produtoId,
      servicoId: itemParam.servico?.servicoId,
      codigoItem: itemParam.codigoItem,
      descricao: itemParam.descricao,
      ncm,
      cest,
      cfop,
      unidadeMedida: itemParam.produto?.unidadeTributavel || 'UN',
      quantidade: itemParam.quantidade,
      valorUnitario: itemParam.valorUnitario,
      valorBrutoTotal: parseFloat(valorBruto.toFixed(2)),
      valorDescontoItem: parseFloat(valorDesconto.toFixed(2)),
      valorFreteRateado: parseFloat(valorFrete.toFixed(2)),
      valorSeguroRateado: parseFloat(valorSeguro.toFixed(2)),
      valorOutrasDespesasRateado: parseFloat(valorOutrasDespesas.toFixed(2)),
      valorTotalLiquido: parseFloat((valorLiquido + valorIpi + valorIcmsSt).toFixed(2)),

      origemMercadoria,
      cstCsosnIcms,
      baseCalculoIcms: parseFloat(baseIcms.toFixed(2)),
      aliquotaIcmsPercentual: aliquotaIcms,
      valorIcms: parseFloat(valorIcms.toFixed(2)),
      baseCalculoIcmsSt: parseFloat(baseIcmsSt.toFixed(2)),
      aliquotaIcmsStPercentual: aliquotaIcmsSt,
      valorIcmsSt: parseFloat(valorIcmsSt.toFixed(2)),
      valorFcp: parseFloat(valorFcp.toFixed(2)),

      cstIpi,
      baseCalculoIpi: parseFloat(baseIpi.toFixed(2)),
      aliquotaIpiPercentual: aliquotaIpi,
      valorIpi: parseFloat(valorIpi.toFixed(2)),

      cstPis,
      baseCalculoPis: parseFloat(basePis.toFixed(2)),
      aliquotaPisPercentual: aliquotaPis,
      valorPis: parseFloat(valorPis.toFixed(2)),
      cstCofins,
      baseCalculoCofins: parseFloat(baseCofins.toFixed(2)),
      aliquotaCofinsPercentual: aliquotaCofins,
      valorCofins: parseFloat(valorCofins.toFixed(2)),

      baseCalculoIss: baseIss ? parseFloat(baseIss.toFixed(2)) : undefined,
      aliquotaIssPercentual: aliquotaIss || undefined,
      valorIss: valorIss ? parseFloat(valorIss.toFixed(2)) : undefined,
      issRetido: itemParam.servico ? issRetido : undefined,

      memoriaIbsCbs,
      loteNumero: itemParam.loteNumero,
    };
  }

  /**
   * Consolida os totais do Documento Fiscal a partir dos itens
   */
  public consolidarTotaisDocumento(
    itens: DocumentoFiscalItem[],
    freteTotal = 0,
    seguroTotal = 0,
    outrasDespesasTotal = 0,
    descontoTotal = 0
  ): DocumentoFiscal['totais'] {
    let valorProdutosServicos = 0;
    let baseCalculoIcms = 0;
    let valorTotalIcms = 0;
    let baseCalculoIcmsSt = 0;
    let valorTotalIcmsSt = 0;
    let valorTotalFcp = 0;
    let valorTotalIpi = 0;
    let baseCalculoPis = 0;
    let valorTotalPis = 0;
    let baseCalculoCofins = 0;
    let valorTotalCofins = 0;
    let valorTotalIss = 0;
    let valorTotalIbs = 0;
    let valorTotalCbs = 0;
    let valorTotalImpostoSeletivo = 0;

    for (const item of itens) {
      valorProdutosServicos += item.valorBrutoTotal;
      baseCalculoIcms += item.baseCalculoIcms;
      valorTotalIcms += item.valorIcms;
      baseCalculoIcmsSt += item.baseCalculoIcmsSt;
      valorTotalIcmsSt += item.valorIcmsSt;
      valorTotalFcp += item.valorFcp;
      valorTotalIpi += item.valorIpi;
      baseCalculoPis += item.baseCalculoPis;
      valorTotalPis += item.valorPis;
      baseCalculoCofins += item.baseCalculoCofins;
      valorTotalCofins += item.valorCofins;
      if (item.valorIss) valorTotalIss += item.valorIss;

      if (item.memoriaIbsCbs) {
        valorTotalIbs += item.memoriaIbsCbs.valorIbsTotal;
        valorTotalCbs += item.memoriaIbsCbs.valorCbsFederal;
        valorTotalImpostoSeletivo += item.memoriaIbsCbs.valorImpostoSeletivo;
      }
    }

    const valorTotalDocumento =
      valorProdutosServicos -
      descontoTotal +
      freteTotal +
      seguroTotal +
      outrasDespesasTotal +
      valorTotalIpi +
      valorTotalIcmsSt;

    return {
      valorProdutosServicos: parseFloat(valorProdutosServicos.toFixed(2)),
      valorDescontos: parseFloat(descontoTotal.toFixed(2)),
      valorFrete: parseFloat(freteTotal.toFixed(2)),
      valorSeguro: parseFloat(seguroTotal.toFixed(2)),
      valorOutrasDespesas: parseFloat(outrasDespesasTotal.toFixed(2)),
      baseCalculoIcms: parseFloat(baseCalculoIcms.toFixed(2)),
      valorTotalIcms: parseFloat(valorTotalIcms.toFixed(2)),
      baseCalculoIcmsSt: parseFloat(baseCalculoIcmsSt.toFixed(2)),
      valorTotalIcmsSt: parseFloat(valorTotalIcmsSt.toFixed(2)),
      valorTotalFcp: parseFloat(valorTotalFcp.toFixed(2)),
      valorTotalIpi: parseFloat(valorTotalIpi.toFixed(2)),
      baseCalculoPis: parseFloat(baseCalculoPis.toFixed(2)),
      valorTotalPis: parseFloat(valorTotalPis.toFixed(2)),
      baseCalculoCofins: parseFloat(baseCalculoCofins.toFixed(2)),
      valorTotalCofins: parseFloat(valorTotalCofins.toFixed(2)),
      valorTotalIss: valorTotalIss > 0 ? parseFloat(valorTotalIss.toFixed(2)) : undefined,
      valorTotalDocumento: parseFloat(valorTotalDocumento.toFixed(2)),
      valorTotalIbs: valorTotalIbs > 0 ? parseFloat(valorTotalIbs.toFixed(2)) : undefined,
      valorTotalCbs: valorTotalCbs > 0 ? parseFloat(valorTotalCbs.toFixed(2)) : undefined,
      valorTotalImpostoSeletivo: valorTotalImpostoSeletivo > 0 ? parseFloat(valorTotalImpostoSeletivo.toFixed(2)) : undefined,
    };
  }
}

export const motorFiscalService = new MotorFiscalService();
