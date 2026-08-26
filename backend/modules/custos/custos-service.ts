// backend/modules/custos/custos-service.ts
import crypto from 'crypto';
import {
  ParametroCustoVigencia,
  ComposicaoCustoDetalhada,
  DetalheCustoOperacao,
  AnaliseCustoPorOperacao,
  AnaliseCustoOP,
  AnaliseCustoPedido,
  AnaliseCustoProduto,
  ResumoMotorCustos,
} from './custos-types';
import { producaoService } from '../producao/producao-service';
import { pedidoService } from '../pedidos/pedido-service';

/**
 * Tabela de Parâmetros e Vigências Padrão por Empresa do Grupo TRITECH
 */
const PARAMETROS_VIGENCIA_INICIAIS: ParametroCustoVigencia[] = [
  // 1. Tritech Corte e Dobra (Industrial / Chapas / Laser / Dobra CNC)
  {
    id: 'param-tritech-corte-2026-q1',
    empresaId: 'emp-tritech-corte',
    versao: 'VIG-2026-Q1-CORTE',
    descricao: 'Tabela Paramétrica de Custos Industriais - Corte Laser & Dobra CNC Q1/2026',
    dataInicioVigencia: '2026-01-01',
    ativo: true,

    taxaHoraLaserFibra: 380.0,
    taxaHoraPlasmaHD: 260.0,
    taxaHoraOxicorte: 190.0,
    taxaHoraDobraCNC: 220.0,
    taxaHoraSoldaCaldeiraria: 140.0,
    taxaHoraPinturaEstufa: 160.0,
    taxaHoraMontagemMecanica: 110.0,
    taxaHoraUsinagemCNC: 240.0,
    taxaHoraAcabamentoPolimento: 95.0,

    taxaHoraHomemMODPadrao: 45.0,
    fatorEncargosTrabalhistasSociais: 1.85, // 85% encargos
    taxaHoraSetupGeral: 120.0,

    fatorCustosIndiretosPercentual: 14.0, // 14% GGF
    baseRateioIndiretos: 'CUSTO_DIRETO_TOTAL',

    fatorPerdaInerenteMaterialPercentual: 3.5, // 3.5%
    precoKwhEnergiaEletrica: 0.85,

    taxaComissaoPadraoPercentual: 3.5,
    taxaEmbalagemPadraoPercentual: 2.0,
    taxaFretePadraoPercentual: 4.5,
    taxaEmbalagemPorKg: 0.45,
    taxaFretePorKg: 1.2,

    aliquotaIcmsEstimadaPercentual: 12.0,
    aliquotaIpiEstimadaPercentual: 5.0,
    aliquotaPisEstimadaPercentual: 1.65,
    aliquotaCofinsEstimadaPercentual: 7.6,
    aliquotaIssEstimadaPercentual: 0.0,

    precosReferenciaMateriaisKg: {
      'AÇO CARBONO SAE 1020': 8.5,
      'AÇO SAC 350 / DOMEX': 14.0,
      'AÇO ESTRUTURAL ASTM A36': 9.2,
      'AÇO INOX AISI 304': 29.5,
      'AÇO INOX AISI 316': 42.0,
      'ALUMÍNIO 5052': 34.0,
    },

    criadoPor: 'sistema.custos@tritech.ind.br',
    criadoEm: '2026-01-01T00:00:00.000Z',
    atualizadoEm: '2026-01-01T00:00:00.000Z',
  },

  // 2. Tritech Caldeiraria Pesada & Estruturas (MWAM)
  {
    id: 'param-mwam-2026-q1',
    empresaId: 'emp-tritech-caldeiraria',
    versao: 'VIG-2026-Q1-CALD',
    descricao: 'Tabela Paramétrica de Custos - Caldeiraria Pesada e Soldagem Industrial Q1/2026',
    dataInicioVigencia: '2026-01-01',
    ativo: true,

    taxaHoraLaserFibra: 410.0,
    taxaHoraPlasmaHD: 280.0,
    taxaHoraOxicorte: 210.0,
    taxaHoraDobraCNC: 250.0,
    taxaHoraSoldaCaldeiraria: 160.0,
    taxaHoraPinturaEstufa: 180.0,
    taxaHoraMontagemMecanica: 130.0,
    taxaHoraUsinagemCNC: 260.0,
    taxaHoraAcabamentoPolimento: 105.0,

    taxaHoraHomemMODPadrao: 50.0,
    fatorEncargosTrabalhistasSociais: 1.88,
    taxaHoraSetupGeral: 135.0,

    fatorCustosIndiretosPercentual: 16.0,
    baseRateioIndiretos: 'CUSTO_DIRETO_TOTAL',

    fatorPerdaInerenteMaterialPercentual: 4.0,
    precoKwhEnergiaEletrica: 0.9,

    taxaComissaoPadraoPercentual: 4.0,
    taxaEmbalagemPadraoPercentual: 2.5,
    taxaFretePadraoPercentual: 5.0,
    taxaEmbalagemPorKg: 0.55,
    taxaFretePorKg: 1.45,

    aliquotaIcmsEstimadaPercentual: 18.0,
    aliquotaIpiEstimadaPercentual: 6.5,
    aliquotaPisEstimadaPercentual: 1.65,
    aliquotaCofinsEstimadaPercentual: 7.6,
    aliquotaIssEstimadaPercentual: 0.0,

    precosReferenciaMateriaisKg: {
      'AÇO CARBONO SAE 1020': 8.8,
      'AÇO SAC 350 / DOMEX': 14.5,
      'AÇO ESTRUTURAL ASTM A36': 9.5,
      'AÇO INOX AISI 304': 31.0,
    },

    criadoPor: 'sistema.custos@tritech.ind.br',
    criadoEm: '2026-01-01T00:00:00.000Z',
    atualizadoEm: '2026-01-01T00:00:00.000Z',
  },

  // 3. Fallback Genérico para demais empresas
  {
    id: 'param-tritech-geral-2026-q1',
    empresaId: 'default',
    versao: 'VIG-2026-Q1-GERAL',
    descricao: 'Tabela Padrão Geral Grupo TRITECH Q1/2026',
    dataInicioVigencia: '2026-01-01',
    ativo: true,

    taxaHoraLaserFibra: 390.0,
    taxaHoraPlasmaHD: 270.0,
    taxaHoraOxicorte: 200.0,
    taxaHoraDobraCNC: 230.0,
    taxaHoraSoldaCaldeiraria: 150.0,
    taxaHoraPinturaEstufa: 170.0,
    taxaHoraMontagemMecanica: 120.0,
    taxaHoraUsinagemCNC: 250.0,
    taxaHoraAcabamentoPolimento: 100.0,

    taxaHoraHomemMODPadrao: 48.0,
    fatorEncargosTrabalhistasSociais: 1.85,
    taxaHoraSetupGeral: 125.0,

    fatorCustosIndiretosPercentual: 15.0,
    baseRateioIndiretos: 'CUSTO_DIRETO_TOTAL',

    fatorPerdaInerenteMaterialPercentual: 3.5,
    precoKwhEnergiaEletrica: 0.88,

    taxaComissaoPadraoPercentual: 3.5,
    taxaEmbalagemPadraoPercentual: 2.0,
    taxaFretePadraoPercentual: 4.5,
    taxaEmbalagemPorKg: 0.5,
    taxaFretePorKg: 1.3,

    aliquotaIcmsEstimadaPercentual: 12.0,
    aliquotaIpiEstimadaPercentual: 5.0,
    aliquotaPisEstimadaPercentual: 1.65,
    aliquotaCofinsEstimadaPercentual: 7.6,
    aliquotaIssEstimadaPercentual: 0.0,

    precosReferenciaMateriaisKg: {
      'AÇO CARBONO SAE 1020': 8.5,
      'AÇO SAC 350 / DOMEX': 14.0,
      'AÇO INOX AISI 304': 30.0,
    },

    criadoPor: 'sistema.custos@tritech.ind.br',
    criadoEm: '2026-01-01T00:00:00.000Z',
    atualizadoEm: '2026-01-01T00:00:00.000Z',
  },
];

export class MotorCustosService {
  private parametrosVigencia: Map<string, ParametroCustoVigencia[]> = new Map(); // empresaId -> lista de vigências

  constructor() {
    this.inicializarParametros();
  }

  private inicializarParametros() {
    PARAMETROS_VIGENCIA_INICIAIS.forEach((param) => {
      const lista = this.parametrosVigencia.get(param.empresaId) || [];
      lista.push(param);
      this.parametrosVigencia.set(param.empresaId, lista);
    });
  }

  /**
   * Obtém a vigência de parâmetros de custo ativa para a empresa
   */
  public obterParametrosVigentes(empresaId: string, dataReferencia: string = new Date().toISOString()): ParametroCustoVigencia {
    const lista = this.parametrosVigencia.get(empresaId) || this.parametrosVigencia.get('default') || [];
    const dataRef = dataReferencia.split('T')[0];

    // Busca primeiro uma vigência ativa cuja data início <= dataRef e (sem dataFim ou dataFim >= dataRef)
    const vigente = lista.find((p) => {
      if (!p.ativo) return false;
      const inicioOk = p.dataInicioVigencia <= dataRef;
      const fimOk = !p.dataFimVigencia || p.dataFimVigencia >= dataRef;
      return inicioOk && fimOk;
    });

    if (vigente) return vigente;

    // Fallback: primeira ativa ou default
    const fallbackAtivo = lista.find((p) => p.ativo) || lista[0];
    if (fallbackAtivo) return fallbackAtivo;

    return PARAMETROS_VIGENCIA_INICIAIS[0];
  }

  /**
   * Lista todas as vigências e históricos de parametrização da empresa
   */
  public listarParametrosVigencia(empresaId: string): ParametroCustoVigencia[] {
    const listaEmpresa = this.parametrosVigencia.get(empresaId) || [];
    const listaDefault = this.parametrosVigencia.get('default') || [];
    return [...listaEmpresa, ...listaDefault];
  }

  /**
   * Salva ou cria uma nova vigência de parâmetros de custos
   */
  public salvarParametroVigencia(
    empresaId: string,
    dados: Partial<ParametroCustoVigencia>,
    usuarioEmail: string = 'admin@tritech.ind.br'
  ): ParametroCustoVigencia {
    const lista = this.parametrosVigencia.get(empresaId) || [];
    const id = dados.id || `param-${empresaId}-${Date.now()}`;
    const agora = new Date().toISOString();

    const paramVigente = this.obterParametrosVigentes(empresaId);

    const novoParametro: ParametroCustoVigencia = {
      ...paramVigente,
      ...dados,
      id,
      empresaId,
      criadoPor: usuarioEmail,
      criadoEm: dados.criadoEm || agora,
      atualizadoEm: agora,
    };

    const index = lista.findIndex((p) => p.id === id);
    if (index >= 0) {
      lista[index] = novoParametro;
    } else {
      // Se for marcar como ativo, podemos arquivar ou manter histórico
      lista.unshift(novoParametro);
    }

    this.parametrosVigencia.set(empresaId, lista);
    return novoParametro;
  }

  /**
   * Resolve a Taxa-Hora Máquina (CHM) correta com base no nome do setor / operação e vigência
   */
  public resolverTaxaHoraMaquina(setorOuOperacao: string, vigencia: ParametroCustoVigencia): number {
    const s = setorOuOperacao.toUpperCase();
    if (s.includes('LASER') || s.includes('CORTE LASER')) return vigencia.taxaHoraLaserFibra;
    if (s.includes('PLASMA')) return vigencia.taxaHoraPlasmaHD;
    if (s.includes('OXICORTE')) return vigencia.taxaHoraOxicorte;
    if (s.includes('DOBRA') || s.includes('CONFORMA')) return vigencia.taxaHoraDobraCNC;
    if (s.includes('SOLDA') || s.includes('CALDEIRARIA')) return vigencia.taxaHoraSoldaCaldeiraria;
    if (s.includes('PINTURA') || s.includes('ESTUFA') || s.includes('TRATAMENTO')) return vigencia.taxaHoraPinturaEstufa;
    if (s.includes('MONTAGEM') || s.includes('MECANICA')) return vigencia.taxaHoraMontagemMecanica;
    if (s.includes('USINAGEM') || s.includes('TORNO') || s.includes('FRESA')) return vigencia.taxaHoraUsinagemCNC;
    if (s.includes('ACABAMENTO') || s.includes('LIXA') || s.includes('POLIMENTO')) return vigencia.taxaHoraAcabamentoPolimento;
    return vigencia.taxaHoraSetupGeral;
  }

  /**
   * =========================================================================
   * 1. MOTOR DE CUSTO POR ORDEM DE PRODUÇÃO (OP) - Padrão vs Estimado vs Real
   * =========================================================================
   */
  public calcularCustoPorOP(empresaId: string, opId: string): AnaliseCustoOP {
    const op = producaoService.buscarOrdemPorId(opId, empresaId);
    if (!op) {
      throw new Error(`Ordem de Produção ${opId} não encontrada para a empresa ${empresaId}`);
    }

    const vigencia = this.obterParametrosVigentes(empresaId, op.dataEmissao);
    const qtdPlanejada = Math.max(1, op.quantidadePlanejada);
    const qtdProduzida = Math.max(1, op.quantidadeProduzida || op.quantidadePlanejada);

    // ==========================================
    // A. CUSTO PADRÃO (Engenharia / Roteiro Base)
    // ==========================================
    let materialBrutoPadrao = 0;
    let pesoTotalEstimadoKg = 0;

    op.materiais.forEach((mat) => {
      const precoUnit = mat.custoUnitario || vigencia.precosReferenciaMateriaisKg[mat.itemDescricao.toUpperCase()] || 12.0;
      materialBrutoPadrao += mat.quantidadePrevistaTotal * precoUnit;
      pesoTotalEstimadoKg += mat.quantidadePrevistaTotal * 2.5; // Estimativa de kg se não houver campo peso
    });

    const perdasPadrao = materialBrutoPadrao * (vigencia.fatorPerdaInerenteMaterialPercentual / 100);
    const retalhosPadrao = 0; // Padrão não projeta retalho além do balanço líquido
    const materialLiquidoPadrao = materialBrutoPadrao + perdasPadrao - retalhosPadrao;

    let modPadrao = 0;
    let chmPadrao = 0;
    let setupPadrao = 0;
    let consumiveisPadrao = 0;
    let terceirosPadrao = 0;

    const analiseOperacoes: AnaliseCustoPorOperacao[] = [];

    op.operacoes.forEach((oper) => {
      const taxaCHM = oper.custoHoraMaquina || this.resolverTaxaHoraMaquina(oper.nomeOperacao, vigencia);
      const taxaMOD = oper.custoHoraMaoDeObra || (vigencia.taxaHoraHomemMODPadrao * vigencia.fatorEncargosTrabalhistasSociais);

      const tempoSetupPadraoH = (oper.tempoSetupPadraoMinutos || 20) / 60;
      const tempoCicloPadraoH = ((oper.tempoTotalPadraoMinutos - (oper.tempoSetupPadraoMinutos || 20))) / 60;
      const tempoTotalPadraoH = oper.tempoTotalPadraoMinutos / 60;

      const custoMODOpPadrao = Number((tempoTotalPadraoH * taxaMOD).toFixed(2));
      const custoCHMOpPadrao = Number((tempoCicloPadraoH * taxaCHM).toFixed(2));
      const custoSetupOpPadrao = Number((tempoSetupPadraoH * (taxaCHM * 0.8 + taxaMOD)).toFixed(2));
      const custoConsumiveisOpPadrao = Number((tempoTotalPadraoH * 15.0).toFixed(2)); // taxa média consumíveis
      const custoTerceirosOpPadrao = oper.extensaoServicoExterno?.custoTotalServicoExterno || 0;
      const custoTotalOpPadrao = custoMODOpPadrao + custoCHMOpPadrao + custoSetupOpPadrao + custoConsumiveisOpPadrao + custoTerceirosOpPadrao;

      modPadrao += custoMODOpPadrao;
      chmPadrao += custoCHMOpPadrao;
      setupPadrao += custoSetupOpPadrao;
      consumiveisPadrao += custoConsumiveisOpPadrao;
      terceirosPadrao += custoTerceirosOpPadrao;

      // ==========================================
      // B. CUSTO ESTIMADO DA OPERAÇÃO (Orçamento)
      // ==========================================
      const tempoTotalEstH = (oper.tempoTotalPadraoMinutos * 1.05) / 60; // 5% tolerância comercial estimada
      const custoMODOpEst = Number((tempoTotalEstH * taxaMOD).toFixed(2));
      const custoCHMOpEst = Number((tempoTotalEstH * taxaCHM).toFixed(2));
      const custoSetupOpEst = custoSetupOpPadrao;
      const custoConsumiveisOpEst = custoConsumiveisOpPadrao * 1.05;
      const custoTerceirosOpEst = custoTerceirosOpPadrao;
      const custoTotalOpEst = custoMODOpEst + custoCHMOpEst + custoSetupOpEst + custoConsumiveisOpEst + custoTerceirosOpEst;

      // ==========================================
      // C. CUSTO REALIZADO DA OPERAÇÃO (Chão de Fábrica)
      // ==========================================
      const tempoSetupRealH = (oper.tempoSetupRealMinutos || oper.tempoSetupPadraoMinutos || 20) / 60;
      const tempoTotalRealH = (oper.tempoTotalRealMinutos || oper.tempoTotalPadraoMinutos) / 60;
      const tempoCicloRealH = Math.max(0, tempoTotalRealH - tempoSetupRealH);

      const custoMODOpReal = oper.custoMaoDeObraReal || Number((tempoTotalRealH * taxaMOD).toFixed(2));
      const custoCHMOpReal = oper.custoMaquinaReal || Number((tempoCicloRealH * taxaCHM).toFixed(2));
      const custoSetupOpReal = Number((tempoSetupRealH * (taxaCHM * 0.85 + taxaMOD)).toFixed(2));
      const custoConsumiveisOpReal = oper.custoConsumiveisReal || (oper.extensaoCorte?.custoGasConsumiveisTotal || 0) + (oper.extensaoPintura?.custoInsumosPintura || 0);
      const custoTerceirosOpReal = oper.custoServicosExternos || (oper.extensaoServicoExterno?.custoTotalServicoExterno || 0);
      const custoTotalOpReal = oper.custoTotalOperacaoReal || (custoMODOpReal + custoCHMOpReal + custoSetupOpReal + custoConsumiveisOpReal + custoTerceirosOpReal);

      const desvioOpValor = Number((custoTotalOpReal - custoTotalOpEst).toFixed(2));
      const desvioOpPerc = custoTotalOpEst > 0 ? Number(((desvioOpValor / custoTotalOpEst) * 100).toFixed(1)) : 0;

      let statusDesvio: 'NO_PRAZO' | 'SOBRECUSTO_MODERADO' | 'SOBRECUSTO_CRITICO' | 'ECONOMIA' = 'NO_PRAZO';
      if (desvioOpPerc > 15) statusDesvio = 'SOBRECUSTO_CRITICO';
      else if (desvioOpPerc > 5) statusDesvio = 'SOBRECUSTO_MODERADO';
      else if (desvioOpPerc < -3) statusDesvio = 'ECONOMIA';

      analiseOperacoes.push({
        operacaoId: oper.id,
        sequencia: oper.sequencia,
        nomeOperacao: oper.nomeOperacao,
        setor: oper.setor,
        maquinaNome: oper.maquinaNome || oper.maquinaId,
        custoPadrao: {
          operacaoId: oper.id,
          sequencia: oper.sequencia,
          nomeOperacao: oper.nomeOperacao,
          setor: oper.setor,
          maquinaNome: oper.maquinaNome,
          tempoSetupMinutos: oper.tempoSetupPadraoMinutos || 20,
          tempoCicloMinutos: oper.tempoTotalPadraoMinutos - (oper.tempoSetupPadraoMinutos || 20),
          tempoTotalMinutos: oper.tempoTotalPadraoMinutos,
          taxaHoraMaquina: taxaCHM,
          taxaHoraMOD: taxaMOD,
          custoMOD: custoMODOpPadrao,
          custoCHM: custoCHMOpPadrao,
          custoSetup: custoSetupOpPadrao,
          custoConsumiveis: custoConsumiveisOpPadrao,
          custoTerceiros: custoTerceirosOpPadrao,
          custoTotalOperacao: custoTotalOpPadrao,
        },
        custoEstimado: {
          operacaoId: oper.id,
          sequencia: oper.sequencia,
          nomeOperacao: oper.nomeOperacao,
          setor: oper.setor,
          maquinaNome: oper.maquinaNome,
          tempoSetupMinutos: oper.tempoSetupPadraoMinutos || 20,
          tempoCicloMinutos: Math.round(oper.tempoTotalPadraoMinutos * 1.05),
          tempoTotalMinutos: Math.round(oper.tempoTotalPadraoMinutos * 1.05),
          taxaHoraMaquina: taxaCHM,
          taxaHoraMOD: taxaMOD,
          custoMOD: custoMODOpEst,
          custoCHM: custoCHMOpEst,
          custoSetup: custoSetupOpEst,
          custoConsumiveis: custoConsumiveisOpEst,
          custoTerceiros: custoTerceirosOpEst,
          custoTotalOperacao: custoTotalOpEst,
        },
        custoRealizado: {
          operacaoId: oper.id,
          sequencia: oper.sequencia,
          nomeOperacao: oper.nomeOperacao,
          setor: oper.setor,
          maquinaNome: oper.maquinaNome,
          tempoSetupMinutos: oper.tempoSetupRealMinutos || 20,
          tempoCicloMinutos: (oper.tempoTotalRealMinutos || oper.tempoTotalPadraoMinutos) - (oper.tempoSetupRealMinutos || 20),
          tempoTotalMinutos: oper.tempoTotalRealMinutos || oper.tempoTotalPadraoMinutos,
          taxaHoraMaquina: taxaCHM,
          taxaHoraMOD: taxaMOD,
          custoMOD: custoMODOpReal,
          custoCHM: custoCHMOpReal,
          custoSetup: custoSetupOpReal,
          custoConsumiveis: custoConsumiveisOpReal,
          custoTerceiros: custoTerceirosOpReal,
          custoTotalOperacao: custoTotalOpReal,
        },
        variacaoRealVsPrevistoValor: desvioOpValor,
        variacaoRealVsPrevistoPerc: desvioOpPerc,
        statusDesvio,
      });
    });

    const composicaoPadrao = this.construirComposicaoCusto(
      materialBrutoPadrao,
      perdasPadrao,
      retalhosPadrao,
      modPadrao,
      chmPadrao,
      setupPadrao,
      consumiveisPadrao,
      terceirosPadrao,
      pesoTotalEstimadoKg,
      vigencia
    );

    // Estimado (Margens orçadas)
    const composicaoEstimada = this.construirComposicaoCusto(
      materialBrutoPadrao * 1.03,
      perdasPadrao * 1.05,
      retalhosPadrao,
      modPadrao * 1.05,
      chmPadrao * 1.05,
      setupPadrao,
      consumiveisPadrao * 1.05,
      terceirosPadrao,
      pesoTotalEstimadoKg,
      vigencia
    );

    // ==========================================
    // D. CUSTO REALIZADO CONSOLIDADO DA OP
    // ==========================================
    let materialBrutoReal = 0;
    let perdasReal = 0;
    let creditoRetalhosReal = 0;

    op.materiais.forEach((mat) => {
      materialBrutoReal += (mat.custoTotalReal || mat.custoTotalPrevisto || (mat.quantidadeRealConsumida * 12.0));
      if (mat.quantidadeRealConsumida > mat.quantidadePrevistaTotal) {
        perdasReal += (mat.quantidadeRealConsumida - mat.quantidadePrevistaTotal) * (mat.custoUnitario || 10.0);
      }
    });

    // Se houver extensão de corte com retalhos e sucatas
    op.operacoes.forEach((oper) => {
      if (oper.extensaoCorte) {
        creditoRetalhosReal += oper.extensaoCorte.retalhoValorizadoCredito || 0;
        perdasReal += oper.extensaoCorte.custoSucataPerdida || 0;
      }
      if (oper.extensaoDobra?.houveRetrabalhoDobra) {
        perdasReal += oper.extensaoDobra.custoRetrabalhoDobra || 0;
      }
    });

    let modReal = 0;
    let chmReal = 0;
    let setupReal = 0;
    let consumiveisReal = 0;
    let terceirosReal = 0;

    analiseOperacoes.forEach((an) => {
      modReal += an.custoRealizado.custoMOD;
      chmReal += an.custoRealizado.custoCHM;
      setupReal += an.custoRealizado.custoSetup;
      consumiveisReal += an.custoRealizado.custoConsumiveis;
      terceirosReal += an.custoRealizado.custoTerceiros;
    });

    const composicaoRealizada = this.construirComposicaoCusto(
      materialBrutoReal,
      perdasReal,
      creditoRetalhosReal,
      modReal,
      chmReal,
      setupReal,
      consumiveisReal,
      terceirosReal,
      pesoTotalEstimadoKg,
      vigencia
    );

    const variacaoRealVsEstimadoValor = Number((composicaoRealizada.custoTotalCompleto - composicaoEstimada.custoTotalCompleto).toFixed(2));
    const variacaoRealVsEstimadoPerc = composicaoEstimada.custoTotalCompleto > 0
      ? Number(((variacaoRealVsEstimadoValor / composicaoEstimada.custoTotalCompleto) * 100).toFixed(1))
      : 0;

    const variacaoRealVsPadraoValor = Number((composicaoRealizada.custoTotalCompleto - composicaoPadrao.custoTotalCompleto).toFixed(2));
    const variacaoRealVsPadraoPerc = composicaoPadrao.custoTotalCompleto > 0
      ? Number(((variacaoRealVsPadraoValor / composicaoPadrao.custoTotalCompleto) * 100).toFixed(1))
      : 0;

    return {
      empresaId,
      opId: op.id,
      opNumero: op.numero,
      produtoId: op.produtoId,
      produtoCodigo: op.produtoCodigo,
      produtoDescricao: op.produtoDescricao,
      quantidadePlanejada: op.quantidadePlanejada,
      quantidadeProduzida: op.quantidadeProduzida,
      quantidadeRefugada: op.quantidadeRefugada,
      statusOP: op.status,
      dataConclusao: op.dataFimReal || op.dataFimProgramada,
      parametroVigenciaUtilizado: vigencia.versao,
      custoPadrao: composicaoPadrao,
      custoEstimado: composicaoEstimada,
      custoRealizado: composicaoRealizada,
      custoUnitarioPadrao: Number((composicaoPadrao.custoTotalCompleto / qtdPlanejada).toFixed(2)),
      custoUnitarioEstimado: Number((composicaoEstimada.custoTotalCompleto / qtdPlanejada).toFixed(2)),
      custoUnitarioRealizado: Number((composicaoRealizada.custoTotalCompleto / qtdProduzida).toFixed(2)),
      variacaoRealVsEstimadoValor,
      variacaoRealVsEstimadoPerc,
      variacaoRealVsPadraoValor,
      variacaoRealVsPadraoPerc,
      operacoes: analiseOperacoes,
    };
  }

  /**
   * Constrói a estrutura detalhada de custo com base nas parametrizações vigentes (sem percentuais hardcoded)
   */
  private construirComposicaoCusto(
    materialBruto: number,
    perdasRefugos: number,
    creditoRetalhos: number,
    mod: number,
    chm: number,
    setup: number,
    consumiveis: number,
    terceiros: number,
    pesoTotalKg: number,
    vigencia: ParametroCustoVigencia
  ): ComposicaoCustoDetalhada {
    const custoMaterialLiquido = Math.max(0, materialBruto + perdasRefugos - creditoRetalhos);
    const custoTransformacaoTotal = mod + chm + setup + consumiveis + terceiros;
    const custoDiretoFabricacaoTotal = custoMaterialLiquido + custoTransformacaoTotal;

    // Rateio de Custos Indiretos (GGF)
    let custosIndiretosFabricacaoGGF = 0;
    if (vigencia.baseRateioIndiretos === 'CUSTO_DIRETO_TOTAL') {
      custosIndiretosFabricacaoGGF = custoDiretoFabricacaoTotal * (vigencia.fatorCustosIndiretosPercentual / 100);
    } else if (vigencia.baseRateioIndiretos === 'HORA_HOMEM') {
      custosIndiretosFabricacaoGGF = mod * (vigencia.fatorCustosIndiretosPercentual / 100);
    } else {
      custosIndiretosFabricacaoGGF = custoDiretoFabricacaoTotal * (vigencia.fatorCustosIndiretosPercentual / 100);
    }

    const custoIndustrialTotal = custoDiretoFabricacaoTotal + custosIndiretosFabricacaoGGF;

    // Logística e Embalagem parametrizada
    const custoEmbalagem = vigencia.taxaEmbalagemPorKg
      ? pesoTotalKg * vigencia.taxaEmbalagemPorKg
      : custoIndustrialTotal * (vigencia.taxaEmbalagemPadraoPercentual / 100);

    const custoFrete = vigencia.taxaFretePorKg
      ? pesoTotalKg * vigencia.taxaFretePorKg
      : custoIndustrialTotal * (vigencia.taxaFretePadraoPercentual / 100);

    // Comercial e Impostos Estimados
    const baseComercial = custoIndustrialTotal + custoEmbalagem + custoFrete;
    const despesaComissaoVendas = baseComercial * (vigencia.taxaComissaoPadraoPercentual / 100);

    const icms = baseComercial * (vigencia.aliquotaIcmsEstimadaPercentual / 100);
    const ipi = baseComercial * (vigencia.aliquotaIpiEstimadaPercentual / 100);
    const pis = baseComercial * (vigencia.aliquotaPisEstimadaPercentual / 100);
    const cofins = baseComercial * (vigencia.aliquotaCofinsEstimadaPercentual / 100);
    const iss = baseComercial * (vigencia.aliquotaIssEstimadaPercentual / 100);
    const tributosEstimadosTotal = icms + ipi + pis + cofins + iss;

    const custoTotalCompleto = Number((baseComercial + despesaComissaoVendas + tributosEstimadosTotal).toFixed(2));

    return {
      custoMaterialBruto: Number(materialBruto.toFixed(2)),
      custoPerdasRefugos: Number(perdasRefugos.toFixed(2)),
      creditoRetalhosAproveitaveis: Number(creditoRetalhos.toFixed(2)),
      custoMaterialLiquido: Number(custoMaterialLiquido.toFixed(2)),
      custoMaoDeObraDireta: Number(mod.toFixed(2)),
      custoMaquinaCHM: Number(chm.toFixed(2)),
      custoSetup: Number(setup.toFixed(2)),
      custoConsumiveisGasesInsumos: Number(consumiveis.toFixed(2)),
      custoServicosTerceiros: Number(terceiros.toFixed(2)),
      custoTransformacaoTotal: Number(custoTransformacaoTotal.toFixed(2)),
      custoDiretoFabricacaoTotal: Number(custoDiretoFabricacaoTotal.toFixed(2)),
      custosIndiretosFabricacaoGGF: Number(custosIndiretosFabricacaoGGF.toFixed(2)),
      custoIndustrialTotal: Number(custoIndustrialTotal.toFixed(2)),
      custoEmbalagem: Number(custoEmbalagem.toFixed(2)),
      custoFrete: Number(custoFrete.toFixed(2)),
      despesaComissaoVendas: Number(despesaComissaoVendas.toFixed(2)),
      tributosEstimadosTotal: Number(tributosEstimadosTotal.toFixed(2)),
      detalhamentoTributos: {
        icms: Number(icms.toFixed(2)),
        ipi: Number(ipi.toFixed(2)),
        pis: Number(pis.toFixed(2)),
        cofins: Number(cofins.toFixed(2)),
        iss: Number(iss.toFixed(2)),
      },
      custoTotalCompleto,
    };
  }

  /**
   * =========================================================================
   * 2. MOTOR DE CUSTO POR PEDIDO DE VENDA - Análise Comercial & Margem Real
   * =========================================================================
   */
  public calcularCustoPorPedido(empresaId: string, pedidoId: string): AnaliseCustoPedido {
    const pedidos = pedidoService.getPedidos({ empresaId });
    const pedido = pedidoService.getPedidoById(pedidoId) || pedidos.find((p) => p.id === pedidoId || p.numero === pedidoId) || pedidos[0];
    if (!pedido) {
      throw new Error(`Nenhum Pedido de Venda encontrado para a empresa ${empresaId}`);
    }

    const vigencia = this.obterParametrosVigentes(empresaId, pedido.criadoEm);
    const opsEmpresa = producaoService.listarOrdens(empresaId);

    let totalCustoEstimado = 0;
    let totalCustoRealizado = 0;

    const itensAnalisados = pedido.itens.map((item) => {
      // Procura se tem OP vinculada ao pedido ou ao produto do item
      const opVinculada = opsEmpresa.find((op) => op.produtoCodigo === item.codigoItem || op.produtoId === item.produtoId);

      let analiseOp: AnaliseCustoOP | null = null;
      if (opVinculada) {
        try {
          analiseOp = this.calcularCustoPorOP(empresaId, opVinculada.id);
        } catch {
          analiseOp = null;
        }
      }

      const precoVendaTotal = item.precoLiquido * item.quantidade || item.valorTotal;
      const custoEstimadoUnit = item.custoUnitarioEstimado || analiseOp?.custoUnitarioEstimado || (item.precoUnitario * 0.68);
      const custoRealizadoUnit = analiseOp?.custoUnitarioRealizado || (item.precoUnitario * 0.71);

      const custoEstimadoItemTotal = Number((custoEstimadoUnit * item.quantidade).toFixed(2));
      const custoRealizadoItemTotal = Number((custoRealizadoUnit * item.quantidade).toFixed(2));

      totalCustoEstimado += custoEstimadoItemTotal;
      totalCustoRealizado += custoRealizadoItemTotal;

      const margemEstimadaPerc = precoVendaTotal > 0 ? Number((((precoVendaTotal - custoEstimadoItemTotal) / precoVendaTotal) * 100).toFixed(1)) : 0;
      const margemRealizadaPerc = precoVendaTotal > 0 ? Number((((precoVendaTotal - custoRealizadoItemTotal) / precoVendaTotal) * 100).toFixed(1)) : 0;

      return {
        itemNumero: item.numeroItem,
        produtoCodigo: item.codigoItem,
        descricao: item.descricao,
        quantidade: item.quantidade,
        precoVendaUnitario: item.precoUnitario,
        precoVendaTotal,
        custoEstimadoUnitario: custoEstimadoUnit,
        custoRealizadoUnitario: custoRealizadoUnit,
        custoEstimadoTotal: custoEstimadoItemTotal,
        custoRealizadoTotal: custoRealizadoItemTotal,
        margemEstimadaPerc,
        margemRealizadaPerc,
        opVinculadaNumero: opVinculada?.numero,
      };
    });

    const valorVendaLiquida = pedido.valorTotalPedido || pedido.valorTotalProdutos || 1000;
    const valorVendaBruta = pedido.valorTotalPedido || valorVendaLiquida * 1.1;

    const margemEstimadaValor = Number((valorVendaLiquida - totalCustoEstimado).toFixed(2));
    const margemEstimadaPerc = valorVendaLiquida > 0 ? Number(((margemEstimadaValor / valorVendaLiquida) * 100).toFixed(1)) : 0;

    const margemRealizadaValor = Number((valorVendaLiquida - totalCustoRealizado).toFixed(2));
    const margemRealizadaPerc = valorVendaLiquida > 0 ? Number(((margemRealizadaValor / valorVendaLiquida) * 100).toFixed(1)) : 0;

    const desvioMargemPerc = Number((margemRealizadaPerc - margemEstimadaPerc).toFixed(1));

    // Composições estimadas/realizadas totais do pedido
    const compEstimada = this.construirComposicaoCusto(
      totalCustoEstimado * 0.5,
      totalCustoEstimado * 0.03,
      0,
      totalCustoEstimado * 0.18,
      totalCustoEstimado * 0.15,
      totalCustoEstimado * 0.04,
      totalCustoEstimado * 0.05,
      totalCustoEstimado * 0.05,
      500,
      vigencia
    );

    const compRealizada = this.construirComposicaoCusto(
      totalCustoRealizado * 0.52,
      totalCustoRealizado * 0.04,
      totalCustoRealizado * 0.01,
      totalCustoRealizado * 0.18,
      totalCustoRealizado * 0.14,
      totalCustoRealizado * 0.04,
      totalCustoRealizado * 0.04,
      totalCustoRealizado * 0.05,
      500,
      vigencia
    );

    return {
      empresaId,
      pedidoId: pedido.id,
      pedidoNumero: pedido.numero,
      clienteNome: pedido.clienteNome,
      clienteCnpj: pedido.clienteCnpjCpf || '',
      valorTotalVendaLiquida: valorVendaLiquida,
      valorTotalVendaBruta: valorVendaBruta,
      statusPedido: pedido.status,
      custoPadraoTotal: compEstimada,
      custoEstimadoTotal: compEstimada,
      custoRealizadoTotal: compRealizada,
      margemContribuicaoEstimadaValor: margemEstimadaValor,
      margemContribuicaoEstimadaPerc: margemEstimadaPerc,
      margemContribuicaoRealizadaValor: margemRealizadaValor,
      margemContribuicaoRealizadaPerc: margemRealizadaPerc,
      desvioMargemPerc,
      itens: itensAnalisados,
    };
  }

  /**
   * =========================================================================
   * 3. MOTOR DE CUSTO POR PRODUTO (Catálogo & Engenharia Industrial)
   * =========================================================================
   */
  public calcularCustoPorProduto(empresaId: string, produtoCodigo: string): AnaliseCustoProduto {
    const vigencia = this.obterParametrosVigentes(empresaId);
    const ops = producaoService.listarOrdens(empresaId).filter((o) => o.produtoCodigo === produtoCodigo);

    const historicoLotes: Array<{
      opNumero: string;
      dataFinalizacao: string;
      quantidade: number;
      custoUnitarioRealizado: number;
      desvioVsPadraoPerc: number;
    }> = [];

    let somaCustosPonderados = 0;
    let somaQuantidades = 0;

    ops.forEach((op) => {
      try {
        const analise = this.calcularCustoPorOP(empresaId, op.id);
        const custoUnit = analise.custoUnitarioRealizado;
        const qtd = Math.max(1, op.quantidadeProduzida || op.quantidadePlanejada);

        somaCustosPonderados += custoUnit * qtd;
        somaQuantidades += qtd;

        historicoLotes.push({
          opNumero: op.numero,
          dataFinalizacao: op.dataFimReal || op.dataFimProgramada || op.dataEmissao,
          quantidade: qtd,
          custoUnitarioRealizado: custoUnit,
          desvioVsPadraoPerc: analise.variacaoRealVsPadraoPerc,
        });
      } catch {
        // ignora se op não puder ser calculada
      }
    });

    const custoMedioPonderadoUnit = somaQuantidades > 0 ? Number((somaCustosPonderados / somaQuantidades).toFixed(2)) : 450.0;
    const ultimoLote = historicoLotes[historicoLotes.length - 1];

    const compPadrao = this.construirComposicaoCusto(220, 10, 0, 80, 75, 20, 25, 20, 45, vigencia);
    const compEstimada = this.construirComposicaoCusto(230, 12, 0, 84, 78, 20, 26, 20, 45, vigencia);
    const compRealizadaUltima = this.construirComposicaoCusto(
      ultimoLote ? ultimoLote.custoUnitarioRealizado * 0.5 : 240,
      15,
      5,
      85,
      80,
      25,
      30,
      20,
      45,
      vigencia
    );

    return {
      empresaId,
      produtoId: `prod-${produtoCodigo.toLowerCase()}`,
      produtoCodigo,
      produtoDescricao: ops[0]?.produtoDescricao || `Conjunto Soldado / Peça Industrial ${produtoCodigo}`,
      unidadeMedida: ops[0]?.unidadeMedida || 'UN',
      pesoLiquidoKg: 45.0,
      familiaProduto: 'CHASSIS_ESTRUTURAS',
      custoPadraoUnitario: compPadrao,
      custoEstimadoMedioUnitario: compEstimada,
      custoRealizadoUltimoLoteUnitario: compRealizadaUltima,
      custoRealizadoMedioPonderadoUnitario: {
        ...compRealizadaUltima,
        custoTotalCompleto: custoMedioPonderadoUnit,
      },
      historicoLotesOPs: historicoLotes,
    };
  }

  /**
   * =========================================================================
   * 4. RESUMO CONSOLIDADO GERAL (DASHBOARD EXECUTIVO DE CUSTOS)
   * =========================================================================
   */
  public obterResumoGeralCustos(empresaId: string): ResumoMotorCustos {
    const ops = producaoService.listarOrdens(empresaId);
    const pedidos = pedidoService.getPedidos({ empresaId });

    let totalEst = 0;
    let totalReal = 0;
    const maioresSobrecustos: ResumoMotorCustos['maioresSobrecustos'] = [];

    ops.forEach((op) => {
      try {
        const analise = this.calcularCustoPorOP(empresaId, op.id);
        totalEst += analise.custoEstimado.custoTotalCompleto;
        totalReal += analise.custoRealizado.custoTotalCompleto;

        if (analise.variacaoRealVsEstimadoValor > 0) {
          maioresSobrecustos.push({
            tipo: 'OP',
            identificador: op.numero,
            descricao: `${op.produtoCodigo} - ${op.produtoDescricao}`,
            previsto: analise.custoEstimado.custoTotalCompleto,
            realizado: analise.custoRealizado.custoTotalCompleto,
            desvioValor: analise.variacaoRealVsEstimadoValor,
            desvioPerc: analise.variacaoRealVsEstimadoPerc,
          });
        }
      } catch {
        // ignora
      }
    });

    pedidos.forEach((ped) => {
      try {
        const analisePed = this.calcularCustoPorPedido(empresaId, ped.id);
        if (analisePed.desvioMargemPerc < -2.0) {
          maioresSobrecustos.push({
            tipo: 'PEDIDO',
            identificador: ped.numero,
            descricao: `Pedido Cliente ${ped.clienteNome}`,
            previsto: analisePed.custoEstimadoTotal.custoTotalCompleto,
            realizado: analisePed.custoRealizadoTotal.custoTotalCompleto,
            desvioValor: Number((analisePed.custoRealizadoTotal.custoTotalCompleto - analisePed.custoEstimadoTotal.custoTotalCompleto).toFixed(2)),
            desvioPerc: Number((((analisePed.custoRealizadoTotal.custoTotalCompleto - analisePed.custoEstimadoTotal.custoTotalCompleto) / Math.max(1, analisePed.custoEstimadoTotal.custoTotalCompleto)) * 100).toFixed(1)),
          });
        }
      } catch {
        // ignora
      }
    });

    maioresSobrecustos.sort((a, b) => b.desvioValor - a.desvioValor);

    const desvioGeralValor = Number((totalReal - totalEst).toFixed(2));
    const desvioGeralPercentual = totalEst > 0 ? Number(((desvioGeralValor / totalEst) * 100).toFixed(1)) : 0;
    const taxaAderencia = totalEst > 0 ? Number((100 - Math.abs(desvioGeralPercentual)).toFixed(1)) : 100;

    return {
      totalOpsAnalisadas: ops.length,
      totalPedidosAnalisados: pedidos.length,
      custoEstimadoTotalGeral: Number(totalEst.toFixed(2)),
      custoRealizadoTotalGeral: Number(totalReal.toFixed(2)),
      desvioGeralValor,
      desvioGeralPercentual,
      taxaAderenciaEstimadoRealPercentual: Math.max(0, taxaAderencia),
      maioresSobrecustos: maioresSobrecustos.slice(0, 5),
    };
  }
}

export const motorCustosService = new MotorCustosService();
