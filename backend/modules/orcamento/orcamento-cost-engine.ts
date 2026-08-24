import {
  ParametrosCustoEmpresa,
  CustoMaterialDetalhado,
  CustoCorteDetalhado,
  CustoDobraDetalhado,
  CustoSoldaDetalhado,
  CustoPinturaDetalhado,
  CustoMontagemDetalhado,
  ComposicaoCustoItem,
  TipoItemOrcamento,
  TipoProcessoCorte,
  TipoProcessoDobra,
  TipoProcessoSolda,
  TipoProcessoPintura,
} from './orcamento-types';

/**
 * Parâmetros padrão industriais parametrizáveis por empresa
 */
export const PARAMETROS_PADRAO_EMPRESA: Record<string, ParametrosCustoEmpresa> = {
  // Tritech Corte e Dobra
  'emp-tritech-corte': {
    empresaId: 'emp-tritech-corte',
    taxaHoraLaser: 380.0, // R$/h Laser Fibra 6kW
    taxaHoraPlasma: 260.0, // R$/h Plasma HD
    taxaHoraOxicorte: 190.0, // R$/h Oxicorte CNC
    taxaHoraDobra: 220.0, // R$/h Dobradeira CNC 220t
    taxaHoraSolda: 140.0, // R$/h Estação Solda MIG/MAG
    taxaHoraPintura: 160.0, // R$/h Cabine Pintura Pó
    taxaHoraMontagem: 110.0, // R$/h Bancada Montagem
    taxaHoraUsinagem: 240.0, // R$/h Centro de Usinagem
    taxaHoraEngenharia: 180.0, // R$/h Cadista/Projetista
    taxaMaoDeObraDiretaPadrao: 45.0, // R$/h salário base
    fatorEncargosSociais: 1.85, // 85% encargos
    fatorCustosIndiretosPercentual: 14.0, // 14% GGF
    aliquotaIcmsPadrao: 12.0, // 12% ICMS Interestadual/Interno
    aliquotaIpiPadrao: 5.0, // 5% IPI
    aliquotaPisPadrao: 1.65, // 1.65% PIS
    aliquotaCofinsPadrao: 7.6, // 7.60% COFINS
    aliquotaIssqnPadrao: 5.0, // 5.00% ISSQN
    margemLucroAlvoPadrao: 25.0, // 25% Margem Alvo
    margemLucroMinimaPermitida: 15.0, // 15% Margem Mínima
    aliquotaComissaoPadrao: 3.5, // 3.5% Comissão
    limiteDescontoVendedorPercentual: 5.0, // 5% Vendedor
    limiteDescontoGerentePercentual: 12.0, // 12% Gerente
    precosMateriaisKg: {
      'AÇO CARBONO SAE 1020': 8.5,
      'AÇO ESTRUTURAL ASTM A36': 9.2,
      'AÇO SAC 350 / CORTEN': 13.8,
      'AÇO INOX AISI 304': 29.5,
      'AÇO INOX AISI 316': 42.0,
      'ALUMÍNIO 5052-H32': 34.0,
      'AÇO ALTA RESISTÊNCIA DOMEX': 21.0,
    },
  },
  // MWAM Estruturas e Caldeiraria
  'emp-mwam': {
    empresaId: 'emp-mwam',
    taxaHoraLaser: 420.0,
    taxaHoraPlasma: 280.0,
    taxaHoraOxicorte: 210.0,
    taxaHoraDobra: 250.0,
    taxaHoraSolda: 160.0,
    taxaHoraPintura: 180.0,
    taxaHoraMontagem: 130.0,
    taxaHoraUsinagem: 260.0,
    taxaHoraEngenharia: 200.0,
    taxaMaoDeObraDiretaPadrao: 50.0,
    fatorEncargosSociais: 1.88,
    fatorCustosIndiretosPercentual: 16.0,
    aliquotaIcmsPadrao: 18.0,
    aliquotaIpiPadrao: 6.5,
    aliquotaPisPadrao: 1.65,
    aliquotaCofinsPadrao: 7.6,
    aliquotaIssqnPadrao: 5.0,
    margemLucroAlvoPadrao: 28.0,
    margemLucroMinimaPermitida: 18.0,
    aliquotaComissaoPadrao: 4.0,
    limiteDescontoVendedorPercentual: 6.0,
    limiteDescontoGerentePercentual: 15.0,
    precosMateriaisKg: {
      'AÇO CARBONO SAE 1020': 8.8,
      'AÇO ESTRUTURAL ASTM A36': 9.5,
      'AÇO SAC 350 / CORTEN': 14.2,
      'AÇO INOX AISI 304': 31.0,
      'AÇO INOX AISI 316': 44.5,
      'ALUMÍNIO 5052-H32': 36.0,
    },
  },
  // Default fallback for any other company
  default: {
    empresaId: 'default',
    taxaHoraLaser: 390.0,
    taxaHoraPlasma: 270.0,
    taxaHoraOxicorte: 200.0,
    taxaHoraDobra: 230.0,
    taxaHoraSolda: 150.0,
    taxaHoraPintura: 170.0,
    taxaHoraMontagem: 120.0,
    taxaHoraUsinagem: 250.0,
    taxaHoraEngenharia: 190.0,
    taxaMaoDeObraDiretaPadrao: 48.0,
    fatorEncargosSociais: 1.85,
    fatorCustosIndiretosPercentual: 15.0,
    aliquotaIcmsPadrao: 12.0,
    aliquotaIpiPadrao: 5.0,
    aliquotaPisPadrao: 1.65,
    aliquotaCofinsPadrao: 7.6,
    aliquotaIssqnPadrao: 5.0,
    margemLucroAlvoPadrao: 25.0,
    margemLucroMinimaPermitida: 16.0,
    aliquotaComissaoPadrao: 3.0,
    limiteDescontoVendedorPercentual: 5.0,
    limiteDescontoGerentePercentual: 12.0,
    precosMateriaisKg: {
      'AÇO CARBONO SAE 1020': 8.5,
      'AÇO ESTRUTURAL ASTM A36': 9.2,
      'AÇO SAC 350 / CORTEN': 13.8,
      'AÇO INOX AISI 304': 30.0,
      'AÇO INOX AISI 316': 43.0,
      'ALUMÍNIO 5052-H32': 35.0,
    },
  },
};

export class IndustrialCostEngine {
  /**
   * Obtém os parâmetros de custo de uma empresa específica
   */
  static getParametros(empresaId: string): ParametrosCustoEmpresa {
    return PARAMETROS_PADRAO_EMPRESA[empresaId] || PARAMETROS_PADRAO_EMPRESA['default'];
  }

  /**
   * 1. MOTOR DE CUSTO DE MATERIAL
   * Calcula peso líquido, peso com perda/aproveitamento de ninho e custo de matéria-prima
   */
  static calcularCustoMaterial(input: {
    tipoMaterial: string;
    formato: 'CHAPA' | 'TUBO_REDONDO' | 'TUBO_QUADRADO' | 'PERFIL_W' | 'BARRA_CHATA' | 'COMPONENTE_PRONTO';
    especificacao?: string;
    espessuraMm?: number;
    larguraMm?: number;
    comprimentoMm?: number;
    diametroMm?: number;
    pesoInformadoKg?: number;
    fatorPerdaAproveitamento?: number; // Ex: 1.15 = 15% de perda no ninho de corte
    precoKgCustom?: number;
    parametros: ParametrosCustoEmpresa;
  }): CustoMaterialDetalhado {
    const { tipoMaterial, formato, parametros } = input;
    const perda = input.fatorPerdaAproveitamento && input.fatorPerdaAproveitamento >= 1 ? input.fatorPerdaAproveitamento : 1.12;

    // Determina densidade por material
    let densidade = 7.85; // Aço carbono kg/dm³
    const matUpper = tipoMaterial.toUpperCase();
    if (matUpper.includes('INOX') || matUpper.includes('304') || matUpper.includes('316')) {
      densidade = 7.93;
    } else if (matUpper.includes('ALUM')) {
      densidade = 2.7;
    }

    let pesoLiquido = input.pesoInformadoKg || 0;

    if (!pesoLiquido && formato === 'CHAPA' && input.espessuraMm && input.larguraMm && input.comprimentoMm) {
      // Volume em dm³ = (espessura mm / 10) * (largura mm / 100) * (comprimento mm / 100)
      const volumeDm3 = (input.espessuraMm / 10) * (input.larguraMm / 100) * (input.comprimentoMm / 100);
      pesoLiquido = Number((volumeDm3 * densidade).toFixed(3));
    } else if (!pesoLiquido && formato === 'TUBO_REDONDO' && input.diametroMm && input.espessuraMm && input.comprimentoMm) {
      const raioExtDm = input.diametroMm / 200;
      const raioIntDm = (input.diametroMm - 2 * input.espessuraMm) / 200;
      const areaSecaoDm2 = Math.PI * (raioExtDm * raioExtDm - raioIntDm * raioIntDm);
      const volumeDm3 = areaSecaoDm2 * (input.comprimentoMm / 100);
      pesoLiquido = Number((volumeDm3 * densidade).toFixed(3));
    } else if (!pesoLiquido && formato === 'BARRA_CHATA' && input.espessuraMm && input.larguraMm && input.comprimentoMm) {
      const volumeDm3 = (input.espessuraMm / 10) * (input.larguraMm / 100) * (input.comprimentoMm / 100);
      pesoLiquido = Number((volumeDm3 * densidade).toFixed(3));
    } else if (!pesoLiquido) {
      pesoLiquido = 1.0;
    }

    const pesoBruto = Number((pesoLiquido * perda).toFixed(3));
    const precoKg = input.precoKgCustom || parametros.precosMateriaisKg[tipoMaterial] || parametros.precosMateriaisKg['AÇO CARBONO SAE 1020'] || 8.5;
    const custoTotalMaterial = Number((pesoBruto * precoKg).toFixed(2));

    return {
      tipoMaterial,
      formato,
      especificacao: input.especificacao || `${tipoMaterial} ${formato}`,
      densidadeMaterialKgDm3: densidade,
      espessuraMm: input.espessuraMm,
      larguraMm: input.larguraMm,
      comprimentoMm: input.comprimentoMm,
      diametroMm: input.diametroMm,
      pesoLiquidoKg: pesoLiquido,
      fatorPerdaAproveitamento: perda,
      pesoBrutoKg: pesoBruto,
      precoKg,
      custoTotalMaterial,
    };
  }

  /**
   * 2. MOTOR DE CUSTO DE CORTE (LASER / PLASMA / OXICORTE / SERRA)
   * Baseado em espessura, velocidade de avanço mm/min, furos/piercings e taxa horária do equipamento
   */
  static calcularCustoCorte(input: {
    processo: TipoProcessoCorte;
    espessuraMm: number;
    comprimentoCorteMetros: number;
    numeroPerfuracoes?: number;
    velocidadeCorteCustomMmMin?: number;
    parametros: ParametrosCustoEmpresa;
  }): CustoCorteDetalhado {
    const { processo, espessuraMm, comprimentoCorteMetros, parametros } = input;
    if (processo === 'NAO_APLICA' || comprimentoCorteMetros <= 0) {
      return {
        processo: 'NAO_APLICA',
        espessuraMm: 0,
        comprimentoCorteMetros: 0,
        numeroPerfuracoes: 0,
        velocidadeCorteMmMin: 0,
        tempoCorteMinutos: 0,
        taxaHoraAplicada: 0,
        custoTotalCorte: 0,
      };
    }

    let taxaHora = parametros.taxaHoraLaser;
    let velocidadeMmMin = input.velocidadeCorteCustomMmMin || 2500;
    let tempoPiercingSegundos = 0.5;

    switch (processo) {
      case 'LASER_FIBRA':
        taxaHora = parametros.taxaHoraLaser;
        if (espessuraMm <= 2) velocidadeMmMin = 8000;
        else if (espessuraMm <= 4.75) velocidadeMmMin = 3500;
        else if (espessuraMm <= 8) velocidadeMmMin = 2200;
        else if (espessuraMm <= 12.7) velocidadeMmMin = 1400;
        else if (espessuraMm <= 19) velocidadeMmMin = 900;
        else velocidadeMmMin = 600;
        tempoPiercingSegundos = Math.max(0.3, espessuraMm * 0.15);
        break;

      case 'PLASMA_HD':
        taxaHora = parametros.taxaHoraPlasma;
        if (espessuraMm <= 6) velocidadeMmMin = 3000;
        else if (espessuraMm <= 16) velocidadeMmMin = 1800;
        else if (espessuraMm <= 25) velocidadeMmMin = 1100;
        else velocidadeMmMin = 700;
        tempoPiercingSegundos = Math.max(1.0, espessuraMm * 0.25);
        break;

      case 'OXICORTE':
        taxaHora = parametros.taxaHoraOxicorte;
        velocidadeMmMin = Math.max(250, 600 - espessuraMm * 5);
        tempoPiercingSegundos = Math.max(5.0, espessuraMm * 0.8);
        break;

      case 'SERRA_FITA':
      case 'GUILHOTINA':
        taxaHora = parametros.taxaHoraMontagem * 1.2;
        velocidadeMmMin = 1200;
        tempoPiercingSegundos = 0;
        break;
    }

    const comprimentoMm = comprimentoCorteMetros * 1000;
    const tempoCortePuroMin = comprimentoMm / velocidadeMmMin;
    const numPerfuracoes = input.numeroPerfuracoes || Math.max(1, Math.round(comprimentoCorteMetros / 2));
    const tempoPiercingMin = (numPerfuracoes * tempoPiercingSegundos) / 60;
    const tempoTotalMin = Number((tempoCortePuroMin + tempoPiercingMin).toFixed(2));
    const custoTotalCorte = Number(((tempoTotalMin / 60) * taxaHora).toFixed(2));

    return {
      processo,
      espessuraMm,
      comprimentoCorteMetros,
      numeroPerfuracoes: numPerfuracoes,
      velocidadeCorteMmMin: velocidadeMmMin,
      tempoCorteMinutos: tempoTotalMin,
      taxaHoraAplicada: taxaHora,
      custoTotalCorte: Math.max(5.0, custoTotalCorte),
    };
  }

  /**
   * 3. MOTOR DE CUSTO DE DOBRA (CNC / CONVENCIONAL / CALANDRA)
   * Baseado em número de dobras, tempo de ciclo por golpe, tempo de setup de ferramentas e taxa horária
   */
  static calcularCustoDobra(input: {
    processo: TipoProcessoDobra;
    espessuraMm: number;
    comprimentoDobraMm: number;
    numeroDobras: number;
    tempoSetupMinutos?: number;
    parametros: ParametrosCustoEmpresa;
  }): CustoDobraDetalhado {
    const { processo, espessuraMm, comprimentoDobraMm, numeroDobras, parametros } = input;
    if (processo === 'NAO_APLICA' || numeroDobras <= 0) {
      return {
        processo: 'NAO_APLICA',
        espessuraMm: 0,
        comprimentoDobraMm: 0,
        numeroDobras: 0,
        tempoSetupMinutos: 0,
        tempoPorDobraSegundos: 0,
        tempoTotalMinutos: 0,
        taxaHoraAplicada: 0,
        custoTotalDobra: 0,
      };
    }

    const taxaHora = parametros.taxaHoraDobra;
    // Tempo por golpe/dobra em segundos (aumenta com espessura e comprimento pela manipulação de chapa pesada)
    let tempoPorDobraSeg = 20;
    if (espessuraMm > 6.35 || comprimentoDobraMm > 1500) tempoPorDobraSeg = 45;
    if (espessuraMm > 12.7 || comprimentoDobraMm > 2500) tempoPorDobraSeg = 80;

    const setupMin = input.tempoSetupMinutos !== undefined ? input.tempoSetupMinutos : 5.0; // 5 min setup médio de matriz/punção
    const tempoOperacaoMin = (numeroDobras * tempoPorDobraSeg) / 60;
    const tempoTotalMin = Number((setupMin + tempoOperacaoMin).toFixed(2));
    const custoTotalDobra = Number(((tempoTotalMin / 60) * taxaHora).toFixed(2));

    return {
      processo,
      espessuraMm,
      comprimentoDobraMm,
      numeroDobras,
      tempoSetupMinutos: setupMin,
      tempoPorDobraSegundos: tempoPorDobraSeg,
      tempoTotalMinutos: tempoTotalMin,
      taxaHoraAplicada: taxaHora,
      custoTotalDobra: Math.max(8.0, custoTotalDobra),
    };
  }

  /**
   * 4. MOTOR DE CUSTO DE SOLDA (MIG/MAG, TIG, ELETRODO)
   * Baseado em comprimento de cordão, consumo de arame/eletrodo kg, gás m³, horas de soldador e taxa horária
   */
  static calcularCustoSolda(input: {
    processo: TipoProcessoSolda;
    tipoJunta?: string;
    comprimentoSoldaMm: number;
    pernaSoldaMm?: number; // Dimensão z do filete (ex: 5mm)
    horasSoldadorInformadas?: number;
    parametros: ParametrosCustoEmpresa;
  }): CustoSoldaDetalhado {
    const { processo, comprimentoSoldaMm, parametros } = input;
    if (processo === 'NAO_APLICA' || comprimentoSoldaMm <= 0) {
      return {
        processo: 'NAO_APLICA',
        tipoJunta: 'N/A',
        comprimentoSoldaMm: 0,
        horasSoldador: 0,
        consumoArameKg: 0,
        precoArameKg: 0,
        consumoGasM3: 0,
        precoGasM3: 0,
        taxaHoraSolda: 0,
        custoMaoObraSolda: 0,
        custoConsumiveisSolda: 0,
        custoTotalSolda: 0,
      };
    }

    const perna = input.pernaSoldaMm || 5.0;
    const taxaHora = parametros.taxaHoraSolda;

    // Volume do cordão de solda em filete: Area = 0.5 * perna * perna mm²
    const areaSecaoMm2 = 0.5 * perna * perna;
    const volumeMm3 = areaSecaoMm2 * comprimentoSoldaMm;
    const volumeDm3 = volumeMm3 / 1000000;
    const pesoDepositadoKg = volumeDm3 * 7.85;

    // Rendimento de deposição: MIG/MAG ~90%, Eletrodo ~65%, TIG ~95%
    const eficiencia = processo === 'MIG_MAG' ? 0.9 : processo === 'ELETRODO' ? 0.65 : 0.95;
    const consumoArameKg = Number((pesoDepositadoKg / eficiencia).toFixed(3));
    const precoArameKg = processo === 'TIG' ? 45.0 : 18.0;

    // Consumo de gás de proteção (15 L/min = 0.9 m³/h)
    const velocidadeSoldaMmMin = processo === 'MIG_MAG' ? 250 : 120;
    const tempoArcoMin = comprimentoSoldaMm / velocidadeSoldaMmMin;
    const fatorFatorOperacionalSoldador = 0.35; // Fator de arco aberto (35% do tempo do soldador)
    const tempoSoldadorTotalHoras = Number((input.horasSoldadorInformadas || (tempoArcoMin / (60 * fatorFatorOperacionalSoldador))).toFixed(2));

    const consumoGasM3 = Number(((tempoArcoMin / 60) * 0.9).toFixed(3));
    const precoGasM3 = 35.0; // R$/m³ Mistura Argônio/CO2

    const custoMaoObraSolda = Number((tempoSoldadorTotalHoras * taxaHora).toFixed(2));
    const custoConsumiveisSolda = Number((consumoArameKg * precoArameKg + consumoGasM3 * precoGasM3).toFixed(2));
    const custoTotalSolda = Number((custoMaoObraSolda + custoConsumiveisSolda).toFixed(2));

    return {
      processo,
      tipoJunta: input.tipoJunta || 'Filete Contínuo',
      comprimentoSoldaMm,
      horasSoldador: tempoSoldadorTotalHoras,
      consumoArameKg,
      precoArameKg,
      consumoGasM3,
      precoGasM3,
      taxaHoraSolda: taxaHora,
      custoMaoObraSolda,
      custoConsumiveisSolda,
      custoTotalSolda: Math.max(10.0, custoTotalSolda),
    };
  }

  /**
   * 5. MOTOR DE CUSTO DE PINTURA E TRATAMENTO DE SUPERFÍCIE
   * Baseado em área m², tipo de revestimento, consumo de tinta/pó por m², tempo de cabine/estufa e taxa horária
   */
  static calcularCustoPintura(input: {
    processo: TipoProcessoPintura;
    areaPinturaM2: number;
    numeroDemaos?: number;
    tempoCabineMinutos?: number;
    parametros: ParametrosCustoEmpresa;
  }): CustoPinturaDetalhado {
    const { processo, areaPinturaM2, parametros } = input;
    if (processo === 'NAO_APLICA' || areaPinturaM2 <= 0) {
      return {
        processo: 'NAO_APLICA',
        areaPinturaM2: 0,
        numeroDemaos: 0,
        espessuraCamadaMicrons: 0,
        rendimentoTintaM2Litro: 0,
        precoTintaLitroOuKg: 0,
        tempoCabineMinutos: 0,
        taxaHoraPintura: 0,
        custoInsumoPintura: 0,
        custoOperacionalPintura: 0,
        custoTotalPintura: 0,
      };
    }

    const taxaHora = parametros.taxaHoraPintura;
    const demaos = input.numeroDemaos || 2;
    let custoInsumoPorM2 = 18.0; // R$/m² insumo base
    let espessuraMicrons = 80;
    let precoLitroOuKg = 45.0;

    switch (processo) {
      case 'PO_ELETROSTATICA':
        custoInsumoPorM2 = 22.0;
        espessuraMicrons = 90;
        precoLitroOuKg = 38.0;
        break;
      case 'LIQUIDA_PU_EPOXI':
        custoInsumoPorM2 = 28.0;
        espessuraMicrons = 120;
        precoLitroOuKg = 55.0;
        break;
      case 'PRIMER_ANTICORROSIVO':
        custoInsumoPorM2 = 14.0;
        espessuraMicrons = 50;
        precoLitroOuKg = 32.0;
        break;
      case 'JATEAMENTO_GRANALHA':
        custoInsumoPorM2 = 16.0;
        espessuraMicrons = 0;
        precoLitroOuKg = 12.0;
        break;
      case 'GALVANIZACAO_FOGO':
        custoInsumoPorM2 = 45.0;
        espessuraMicrons = 100;
        precoLitroOuKg = 8.5; // por kg
        break;
    }

    const custoInsumoPintura = Number((areaPinturaM2 * custoInsumoPorM2 * (demaos / 2)).toFixed(2));
    // Tempo operacional estimado (10 min por m² + 20 min setup/estufa)
    const tempoCabineMin = input.tempoCabineMinutos || Number((areaPinturaM2 * 8 + 15).toFixed(1));
    const custoOperacionalPintura = Number(((tempoCabineMin / 60) * taxaHora).toFixed(2));
    const custoTotalPintura = Number((custoInsumoPintura + custoOperacionalPintura).toFixed(2));

    return {
      processo,
      areaPinturaM2,
      numeroDemaos: demaos,
      espessuraCamadaMicrons: espessuraMicrons,
      rendimentoTintaM2Litro: 6.5,
      precoTintaLitroOuKg: precoLitroOuKg,
      tempoCabineMinutos: tempoCabineMin,
      taxaHoraPintura: taxaHora,
      custoInsumoPintura,
      custoOperacionalPintura,
      custoTotalPintura: Math.max(15.0, custoTotalPintura),
    };
  }

  /**
   * 6. MOTOR DE CUSTO DE MONTAGEM E AJUSTAGEM
   */
  static calcularCustoMontagem(input: {
    horasMontador: number;
    insumosFixacaoValor?: number;
    tempoAjusteMinutos?: number;
    parametros: ParametrosCustoEmpresa;
  }): CustoMontagemDetalhado {
    const { horasMontador, parametros } = input;
    if (horasMontador <= 0 && (!input.insumosFixacaoValor || input.insumosFixacaoValor <= 0)) {
      return {
        horasMontador: 0,
        taxaHoraMontador: 0,
        tempoAjusteMinutos: 0,
        insumosFixacaoValor: 0,
        custoTotalMontagem: 0,
      };
    }

    const taxaHora = parametros.taxaHoraMontagem;
    const insumosFixacao = input.insumosFixacaoValor || 0;
    const tempoAjusteMin = input.tempoAjusteMinutos || 0;
    const totalHoras = horasMontador + tempoAjusteMin / 60;
    const custoTotalMontagem = Number((totalHoras * taxaHora + insumosFixacao).toFixed(2));

    return {
      horasMontador: totalHoras,
      taxaHoraMontador: taxaHora,
      tempoAjusteMinutos: tempoAjusteMin,
      insumosFixacaoValor: insumosFixacao,
      custoTotalMontagem,
    };
  }

  /**
   * 7. MOTOR CONSOLIDADOR DE PREÇO & MARGEM INDUSTRIAL (CPQ)
   * Formulação completa com mark-up divisor por dentro:
   * Preço Final = (Custo Direto + Custo Indireto) / [1 - (Impostos% + Comissão% + Margem% + Desconto%)]
   */
  static consolidarPrecoItem(input: {
    tipoItem: TipoItemOrcamento;
    custoMaterial?: CustoMaterialDetalhado;
    custoCorte?: CustoCorteDetalhado;
    custoDobra?: CustoDobraDetalhado;
    custoSolda?: CustoSoldaDetalhado;
    custoPintura?: CustoPinturaDetalhado;
    custoMontagem?: CustoMontagemDetalhado;
    custoDiretoInformado?: number;
    custoInsumosTerceirizados?: number;
    margemLucroDesejadaPercentual?: number;
    descontoItemPercentual?: number;
    parametros: ParametrosCustoEmpresa;
  }): ComposicaoCustoItem {
    const { parametros, tipoItem } = input;

    const valMaterial = input.custoMaterial?.custoTotalMaterial || 0;
    const valCorte = input.custoCorte?.custoTotalCorte || 0;
    const valDobra = input.custoDobra?.custoTotalDobra || 0;
    const valSolda = input.custoSolda?.custoTotalSolda || 0;
    const valPintura = input.custoPintura?.custoTotalPintura || 0;
    const valMontagem = input.custoMontagem?.custoTotalMontagem || 0;
    const valTerceiros = input.custoInsumosTerceirizados || 0;
    const valDiretoCustom = input.custoDiretoInformado || 0;

    // Se for produto pronto ou serviço simples sem quebra detalhada
    const totalCustoDireto =
      valDiretoCustom > 0
        ? valDiretoCustom
        : Number((valMaterial + valCorte + valDobra + valSolda + valPintura + valMontagem + valTerceiros).toFixed(2));

    // Custos Indiretos de Fabricação (GGF / Absorção)
    const percGGF = parametros.fatorCustosIndiretosPercentual / 100;
    const custosIndiretos = Number((totalCustoDireto * percGGF).toFixed(2));
    const custoUnitarioTotal = Number((totalCustoDireto + custosIndiretos).toFixed(2));

    // Tributos Estimados: se serviço, usa ISSQN + PIS/COFINS; se produto/fabricado, usa ICMS + IPI + PIS/COFINS
    let aliquotaImpostosTotal = 0;
    if (tipoItem === 'SERVICO') {
      aliquotaImpostosTotal = parametros.aliquotaIssqnPadrao + parametros.aliquotaPisPadrao + parametros.aliquotaCofinsPadrao;
    } else {
      aliquotaImpostosTotal =
        parametros.aliquotaIcmsPadrao + parametros.aliquotaIpiPadrao + parametros.aliquotaPisPadrao + parametros.aliquotaCofinsPadrao;
    }

    const margemAlvo =
      input.margemLucroDesejadaPercentual !== undefined ? input.margemLucroDesejadaPercentual : parametros.margemLucroAlvoPadrao;
    const margemMinima = parametros.margemLucroMinimaPermitida;
    const comissao = parametros.aliquotaComissaoPadrao;
    const desconto = input.descontoItemPercentual || 0;

    // Divisor de Mark-up Sugerido: 1 - (Impostos + Comissao + MargemAlvo)
    const divisorSugerido = Math.max(0.15, 1 - (aliquotaImpostosTotal + comissao + margemAlvo) / 100);
    const precoUnitarioSugerido = Number((custoUnitarioTotal / divisorSugerido).toFixed(2));

    // Divisor de Preço Mínimo: 1 - (Impostos + Comissao + MargemMinima)
    const divisorMinimo = Math.max(0.15, 1 - (aliquotaImpostosTotal + comissao + margemMinima) / 100);
    const precoUnitarioMinimo = Number((custoUnitarioTotal / divisorMinimo).toFixed(2));

    // Preço Final após desconto sobre o sugerido
    const fatorDesconto = 1 - Math.min(0.5, Math.max(0, desconto)) / 100;
    const precoUnitarioFinal = Number((precoUnitarioSugerido * fatorDesconto).toFixed(2));

    const valorImpostos = Number((precoUnitarioFinal * (aliquotaImpostosTotal / 100)).toFixed(2));
    const valorComissao = Number((precoUnitarioFinal * (comissao / 100)).toFixed(2));
    const valorMargemLucro = Number((precoUnitarioFinal - custoUnitarioTotal - valorImpostos - valorComissao).toFixed(2));
    const margemLucroRealPercentual =
      precoUnitarioFinal > 0 ? Number(((valorMargemLucro / precoUnitarioFinal) * 100).toFixed(2)) : 0;

    return {
      custoMaterial: valMaterial,
      detalheMaterial: input.custoMaterial,
      custoCorte: valCorte,
      detalheCorte: input.custoCorte,
      custoDobra: valDobra,
      detalheDobra: input.custoDobra,
      custoSolda: valSolda,
      detalheSolda: input.custoSolda,
      custoPintura: valPintura,
      detalhePintura: input.custoPintura,
      custoMontagem: valMontagem,
      detalheMontagem: input.custoMontagem,
      custoMaoDeObraDiretaOutros: 0,
      custoInsumosTerceirizados: valTerceiros,
      totalCustoDireto,
      custosIndiretosFabricacao: custosIndiretos,
      custoUnitarioTotal,
      aliquotaImpostosTotalPercentual: aliquotaImpostosTotal,
      valorImpostosEstimados: valorImpostos,
      aliquotaComissaoPercentual: comissao,
      valorComissaoEstimada: valorComissao,
      margemLucroPercentual: margemLucroRealPercentual,
      valorMargemLucro,
      precoUnitarioMinimo,
      precoUnitarioSugerido,
      precoUnitarioFinal,
    };
  }
}
