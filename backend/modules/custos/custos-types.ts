// backend/modules/custos/custos-types.ts
/**
 * =========================================================================
 * NEXUS ERP - MÓDULO DE MOTOR DE CUSTOS INDUSTRIAIS (TRITECH GROUP)
 * =========================================================================
 * Suporta:
 *  - Custo Padrão (Standard Cost / Engenharia)
 *  - Custo Estimado (Orçamento / Comercial)
 *  - Custo Realizado (Apontamentos Reais / PCP & Chão de Fábrica)
 * 
 * Elementos de Custo Suportados:
 *  - Material Direto (Matéria-prima, chapas, perfis, componentes)
 *  - Perdas & Refugos (Esqueletos, refugos operacionais, retalhos desvalorizados)
 *  - Mão de Obra Direta (MOD)
 *  - Custo-Hora Máquina (CHM / Depreciação + Energia + Manutenção)
 *  - Setup / Troca de Ferramentas / Preparação
 *  - Consumíveis (Gases N2/O2, bicos, arames de solda, tintas, abrasivos)
 *  - Terceiros / Serviços Externos (Galvanização, têmpera, pintura externa)
 *  - Frete (Inbound/Outbound)
 *  - Embalagem & Proteção (Paletes, fitas, filmes stretch, caixas)
 *  - Custos Indiretos de Fabricação (CIF/GGF - Rateio Parametrizado)
 *  - Comissão Comercial (Parametrizada por canal/vendedor)
 *  - Impostos Estimados (ICMS, IPI, PIS, COFINS, ISS)
 * =========================================================================
 */

export type TipoVisaoCusto = 'PADRAO' | 'ESTIMADO' | 'REALIZADO';

export type CategoriaElementoCusto =
  | 'MATERIAL_DIRETO'
  | 'PERDAS_REFUGOS'
  | 'MAO_DE_OBRA'
  | 'MAQUINA_CHM'
  | 'SETUP'
  | 'CONSUMIVEIS'
  | 'TERCEIROS'
  | 'FRETE'
  | 'EMBALAGEM'
  | 'INDIRETOS_GGF'
  | 'COMISSAO'
  | 'IMPOSTOS';

/**
 * Tabela de Parâmetros de Custos com Vigência por Empresa (CNPJ)
 */
export interface ParametroCustoVigencia {
  id: string;
  empresaId: string; // Isolamento estrito por CNPJ
  versao: string; // Ex: 'VIGENCIA-2026-Q1'
  descricao: string;
  dataInicioVigencia: string; // ISO Date YYYY-MM-DD
  dataFimVigencia?: string; // Se nulo, está ativa
  ativo: boolean;

  // Taxas Horárias de Centros de Trabalho / Máquinas (R$/h)
  taxaHoraLaserFibra: number;
  taxaHoraPlasmaHD: number;
  taxaHoraOxicorte: number;
  taxaHoraDobraCNC: number;
  taxaHoraSoldaCaldeiraria: number;
  taxaHoraPinturaEstufa: number;
  taxaHoraMontagemMecanica: number;
  taxaHoraUsinagemCNC: number;
  taxaHoraAcabamentoPolimento: number;

  // Mão de Obra e Encargos
  taxaHoraHomemMODPadrao: number; // R$/h salário base
  fatorEncargosTrabalhistasSociais: number; // Multiplicador (ex: 1.85 para 85% de encargos)
  taxaHoraSetupGeral: number; // Custo horário de preparação

  // Fatores de Custos Indiretos (GGF / CIF)
  fatorCustosIndiretosPercentual: number; // % sobre custo direto de fabricação (ex: 14.5%)
  baseRateioIndiretos: 'HORA_HOMEM' | 'HORA_MAQUINA' | 'CUSTO_DIRETO_TOTAL' | 'PESO_MATERIAL';

  // Consumíveis e Perdas Parametrizadas
  fatorPerdaInerenteMaterialPercentual: number; // Perda natural média (ex: 3.0%)
  precoKwhEnergiaEletrica: number; // R$/kWh para apropriação direta quando aplicável

  // Despesas Comerciais e Logísticas
  taxaComissaoPadraoPercentual: number; // % comissão de vendas
  taxaEmbalagemPadraoPercentual: number; // % sobre custo de materiais ou fixo por kg
  taxaFretePadraoPercentual: number; // % frete ou tabela FOB/CIF
  taxaEmbalagemPorKg?: number; // R$/kg
  taxaFretePorKg?: number; // R$/kg

  // Tributação Estimada Parametrizada
  aliquotaIcmsEstimadaPercentual: number;
  aliquotaIpiEstimadaPercentual: number;
  aliquotaPisEstimadaPercentual: number;
  aliquotaCofinsEstimadaPercentual: number;
  aliquotaIssEstimadaPercentual: number;

  // Preço de Referência de Matérias-Primas por Kg (Snapshot vigente)
  precosReferenciaMateriaisKg: Record<string, number>;

  // Auditoria
  criadoPor: string;
  criadoEm: string;
  atualizadoEm: string;
}

/**
 * Estrutura Unificada de Composição de Custo Industrial
 */
export interface ComposicaoCustoDetalhada {
  // 1. Custos Diretos de Materiais e Perdas
  custoMaterialBruto: number;
  custoPerdasRefugos: number;
  creditoRetalhosAproveitaveis: number;
  custoMaterialLiquido: number; // Bruto + Perdas - Retalhos

  // 2. Custos Diretos de Transformação Fabril
  custoMaoDeObraDireta: number;
  custoMaquinaCHM: number;
  custoSetup: number;
  custoConsumiveisGasesInsumos: number;
  custoServicosTerceiros: number;
  custoTransformacaoTotal: number; // MOD + CHM + Setup + Consumíveis + Terceiros

  // 3. Custo Fabril Direto Total (CPV Direto)
  custoDiretoFabricacaoTotal: number; // Material Líquido + Transformação

  // 4. Custos Indiretos e Absorção
  custosIndiretosFabricacaoGGF: number; // Base rateio da parametrização vigente

  // 5. Custo Industrial Total de Produção
  custoIndustrialTotal: number; // Custo Direto + GGF

  // 6. Custos Logísticos e de Embalagem
  custoEmbalagem: number;
  custoFrete: number;

  // 7. Despesas Comerciais e Tributos Estimados
  despesaComissaoVendas: number;
  tributosEstimadosTotal: number;
  detalhamentoTributos: {
    icms: number;
    ipi: number;
    pis: number;
    cofins: number;
    iss: number;
  };

  // 8. Custo Total Completo (Full Costing)
  custoTotalCompleto: number;
}

/**
 * Item Detalhado por Operação no Roteiro
 */
export interface DetalheCustoOperacao {
  operacaoId: string;
  sequencia: number;
  nomeOperacao: string;
  setor: string;
  maquinaNome?: string;
  
  // Tempos
  tempoSetupMinutos: number;
  tempoCicloMinutos: number;
  tempoTotalMinutos: number;
  
  // Taxas aplicadas da vigência
  taxaHoraMaquina: number;
  taxaHoraMOD: number;
  
  // Valores
  custoMOD: number;
  custoCHM: number;
  custoSetup: number;
  custoConsumiveis: number;
  custoTerceiros: number;
  custoTotalOperacao: number;
}

/**
 * Análise de Custo por Operação (Padrão vs Estimado vs Realizado)
 */
export interface AnaliseCustoPorOperacao {
  operacaoId: string;
  sequencia: number;
  nomeOperacao: string;
  setor: string;
  maquinaNome: string;

  custoPadrao: DetalheCustoOperacao;
  custoEstimado: DetalheCustoOperacao;
  custoRealizado: DetalheCustoOperacao;

  variacaoRealVsPrevistoValor: number;
  variacaoRealVsPrevistoPerc: number;
  statusDesvio: 'NO_PRAZO' | 'SOBRECUSTO_MODERADO' | 'SOBRECUSTO_CRITICO' | 'ECONOMIA';
}

/**
 * 1. Análise de Custo por Ordem de Produção (OP)
 */
export interface AnaliseCustoOP {
  empresaId: string;
  opId: string;
  opNumero: string;
  produtoId: string;
  produtoCodigo: string;
  produtoDescricao: string;
  quantidadePlanejada: number;
  quantidadeProduzida: number;
  quantidadeRefugada: number;
  statusOP: string;
  dataConclusao?: string;
  
  parametroVigenciaUtilizado: string;

  custoPadrao: ComposicaoCustoDetalhada;
  custoEstimado: ComposicaoCustoDetalhada;
  custoRealizado: ComposicaoCustoDetalhada;

  // Custo unitário por peça acabada boa
  custoUnitarioPadrao: number;
  custoUnitarioEstimado: number;
  custoUnitarioRealizado: number;

  // Variação Real x Previsto
  variacaoRealVsEstimadoValor: number;
  variacaoRealVsEstimadoPerc: number;
  variacaoRealVsPadraoValor: number;
  variacaoRealVsPadraoPerc: number;

  operacoes: AnaliseCustoPorOperacao[];
}

/**
 * 2. Análise de Custo por Pedido de Venda
 */
export interface AnaliseCustoPedido {
  empresaId: string;
  pedidoId: string;
  pedidoNumero: string;
  clienteNome: string;
  clienteCnpj: string;
  valorTotalVendaLiquida: number;
  valorTotalVendaBruta: number;
  statusPedido: string;

  custoPadraoTotal: ComposicaoCustoDetalhada;
  custoEstimadoTotal: ComposicaoCustoDetalhada;
  custoRealizadoTotal: ComposicaoCustoDetalhada;

  // Rentabilidade Real vs Prevista
  margemContribuicaoEstimadaValor: number;
  margemContribuicaoEstimadaPerc: number;
  margemContribuicaoRealizadaValor: number;
  margemContribuicaoRealizadaPerc: number;
  desvioMargemPerc: number;

  itens: Array<{
    itemNumero: number;
    produtoCodigo: string;
    descricao: string;
    quantidade: number;
    precoVendaUnitario: number;
    precoVendaTotal: number;
    custoEstimadoUnitario: number;
    custoRealizadoUnitario: number;
    custoEstimadoTotal: number;
    custoRealizadoTotal: number;
    margemEstimadaPerc: number;
    margemRealizadaPerc: number;
    opVinculadaNumero?: string;
  }>;
}

/**
 * 3. Análise de Custo por Produto (Engenharia / Catálogo Industrial)
 */
export interface AnaliseCustoProduto {
  empresaId: string;
  produtoId: string;
  produtoCodigo: string;
  produtoDescricao: string;
  unidadeMedida: string;
  pesoLiquidoKg: number;
  familiaProduto: string;

  custoPadraoUnitario: ComposicaoCustoDetalhada;
  custoEstimadoMedioUnitario: ComposicaoCustoDetalhada;
  custoRealizadoUltimoLoteUnitario: ComposicaoCustoDetalhada;
  custoRealizadoMedioPonderadoUnitario: ComposicaoCustoDetalhada;

  historicoLotesOPs: Array<{
    opNumero: string;
    dataFinalizacao: string;
    quantidade: number;
    custoUnitarioRealizado: number;
    desvioVsPadraoPerc: number;
  }>;
}

/**
 * Resumo Consolidado do Motor de Custos
 */
export interface ResumoMotorCustos {
  totalOpsAnalisadas: number;
  totalPedidosAnalisados: number;
  custoEstimadoTotalGeral: number;
  custoRealizadoTotalGeral: number;
  desvioGeralValor: number;
  desvioGeralPercentual: number;
  taxaAderenciaEstimadoRealPercentual: number;
  maioresSobrecustos: Array<{
    tipo: 'OP' | 'PEDIDO' | 'OPERACAO';
    identificador: string;
    descricao: string;
    previsto: number;
    realizado: number;
    desvioValor: number;
    desvioPerc: number;
  }>;
}
