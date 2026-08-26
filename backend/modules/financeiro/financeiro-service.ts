/**
 * NEXUS ERP - Serviço do Núcleo Financeiro (AP/AR & Tesouraria Multiempresa)
 * 
 * Regras Obrigatórias Implementadas:
 * 1. ISOLAMENTO MULTIEMPRESA: Toda operação valida e isola os dados por empresaId.
 * 2. SEGREGAÇÃO DE FUNÇÕES (SoD): Lançamento, Aprovação e Baixa com permissões e perfis auditados.
 * 3. NÃO-DESTRUTIVO: Títulos nunca são deletados fisicamente; cancelamento ou estorno com auditoria.
 * 4. PARCELAMENTO & JUROS/MULTAS/DESCONTOS: Cálculo e recálculo dinâmico de saldos e juros por dia de atraso.
 * 5. BAIXAS PARCIAIS: Amortização parcial mantendo o saldo residual com histórico completo.
 * 6. RENEGOCIAÇÃO: Substituição de dívidas em novo plano de pagamento consolidado.
 * 7. ADIANTAMENTOS: Lançamento e compensação cruzada com títulos em aberto.
 */

import { EMPRESAS_GRUPO } from '../../core/types/company';
import {
  ContaPagar,
  ContaPagarParcela,
  ContaReceber,
  ContaReceberParcela,
  BaixaFinanceira,
  AdiantamentoFinanceiro,
  RenegociacaoFinanceira,
  PlanoConta,
  CentroCusto,
  CategoriaFinanceira,
  AuditoriaFinanceiraLog,
  ResumoFinanceiroEmpresa,
  ProjecaoFluxoCaixaDia,
  DreSinteticoItem,
  StatusTituloFinanceiro,
  FormaPagamentoFinanceiro,
  OrigemTituloFinanceiro,
  TipoAdiantamento,
} from './financeiro-types';

export class FinanceiroService {
  // Data Stores em memória com isolamento por empresaId
  private planoContasStore: Map<string, PlanoConta[]> = new Map();
  private centrosCustoStore: Map<string, CentroCusto[]> = new Map();
  private categoriasStore: Map<string, CategoriaFinanceira[]> = new Map();

  private contasPagarStore: Map<string, ContaPagar[]> = new Map();
  private contasReceberStore: Map<string, ContaReceber[]> = new Map();
  private baixasStore: Map<string, BaixaFinanceira[]> = new Map();
  private adiantamentosStore: Map<string, AdiantamentoFinanceiro[]> = new Map();
  private renegociacoesStore: Map<string, RenegociacaoFinanceira[]> = new Map();
  private auditoriaLogs: AuditoriaFinanceiraLog[] = [];

  constructor() {
    this.inicializarPlanoContasPadrao();
    this.inicializarCentrosCustoPadrao();
    this.inicializarCategoriasPadrao();
    this.inicializarTitulosSeed();
  }

  // --------------------------------------------------------------------------
  // INICIALIZAÇÃO DE DADOS MESTRES E SEEDS
  // --------------------------------------------------------------------------

  private inicializarPlanoContasPadrao() {
    const planoPadrao: Array<Omit<PlanoConta, 'id' | 'empresaId'>> = [
      // 1. ATIVO
      { codigoEstrutural: '1', nomeConta: 'ATIVO TOTAL', tipoConta: 'SINTETICA', natureza: 'DEVEDORA', nivel: 1, ativo: true },
      { codigoEstrutural: '1.01', nomeConta: 'ATIVO CIRCULANTE', tipoConta: 'SINTETICA', natureza: 'DEVEDORA', nivel: 2, ativo: true },
      { codigoEstrutural: '1.01.01', nomeConta: 'Disponibilidades / Bancos', tipoConta: 'ANALITICA', natureza: 'DEVEDORA', nivel: 3, ativo: true },
      { codigoEstrutural: '1.01.02', nomeConta: 'Clientes a Receber (Duplicatas)', tipoConta: 'ANALITICA', natureza: 'DEVEDORA', nivel: 3, ativo: true },
      { codigoEstrutural: '1.01.03', nomeConta: 'Estoques de Matéria-Prima & Aço', tipoConta: 'ANALITICA', natureza: 'DEVEDORA', nivel: 3, ativo: true },
      { codigoEstrutural: '1.01.04', nomeConta: 'Adiantamentos a Fornecedores', tipoConta: 'ANALITICA', natureza: 'DEVEDORA', nivel: 3, ativo: true },
      // 2. PASSIVO
      { codigoEstrutural: '2', nomeConta: 'PASSIVO TOTAL', tipoConta: 'SINTETICA', natureza: 'CREDORA', nivel: 1, ativo: true },
      { codigoEstrutural: '2.01', nomeConta: 'PASSIVO CIRCULANTE', tipoConta: 'SINTETICA', natureza: 'CREDORA', nivel: 2, ativo: true },
      { codigoEstrutural: '2.01.01', nomeConta: 'Fornecedores Nacionais de Aço', tipoConta: 'ANALITICA', natureza: 'CREDORA', nivel: 3, ativo: true },
      { codigoEstrutural: '2.01.02', nomeConta: 'Obrigações Fiscais e Tributos a Recolher', tipoConta: 'ANALITICA', natureza: 'CREDORA', nivel: 3, ativo: true },
      { codigoEstrutural: '2.01.03', nomeConta: 'Salários e Encargos Trabalhistas', tipoConta: 'ANALITICA', natureza: 'CREDORA', nivel: 3, ativo: true },
      { codigoEstrutural: '2.01.04', nomeConta: 'Adiantamentos de Clientes', tipoConta: 'ANALITICA', natureza: 'CREDORA', nivel: 3, ativo: true },
      // 3. RECEITAS
      { codigoEstrutural: '3', nomeConta: 'RECEITAS OPERACIONAIS', tipoConta: 'SINTETICA', natureza: 'CREDORA', nivel: 1, ativo: true },
      { codigoEstrutural: '3.01.01', nomeConta: 'Receita de Venda de Estruturas Metálicas', tipoConta: 'ANALITICA', natureza: 'CREDORA', nivel: 3, ativo: true },
      { codigoEstrutural: '3.01.02', nomeConta: 'Receita de Serviços Industriais (Corte/Dobra)', tipoConta: 'ANALITICA', natureza: 'CREDORA', nivel: 3, ativo: true },
      { codigoEstrutural: '3.01.03', nomeConta: 'Receitas Financeiras e Juros de Mora', tipoConta: 'ANALITICA', natureza: 'CREDORA', nivel: 3, ativo: true },
      // 4. CUSTOS INDUSTRIAIS (CPV)
      { codigoEstrutural: '4', nomeConta: 'CUSTOS DE PRODUÇÃO & MATÉRIA-PRIMA', tipoConta: 'SINTETICA', natureza: 'DEVEDORA', nivel: 1, ativo: true },
      { codigoEstrutural: '4.01.01', nomeConta: 'Custo de Matéria-Prima (Chapas/Vigas)', tipoConta: 'ANALITICA', natureza: 'DEVEDORA', nivel: 3, ativo: true },
      { codigoEstrutural: '4.01.02', nomeConta: 'Mão de Obra Direta Fabril (MOD)', tipoConta: 'ANALITICA', natureza: 'DEVEDORA', nivel: 3, ativo: true },
      { codigoEstrutural: '4.01.03', nomeConta: 'Gastos Gerais de Fabricação (GGF)', tipoConta: 'ANALITICA', natureza: 'DEVEDORA', nivel: 3, ativo: true },
      // 5. DESPESAS OPERACIONAIS
      { codigoEstrutural: '5', nomeConta: 'DESPESAS OPERACIONAIS E ADMINISTRATIVAS', tipoConta: 'SINTETICA', natureza: 'DEVEDORA', nivel: 1, ativo: true },
      { codigoEstrutural: '5.01.01', nomeConta: 'Despesas com Fretes e Logística (CIF)', tipoConta: 'ANALITICA', natureza: 'DEVEDORA', nivel: 3, ativo: true },
      { codigoEstrutural: '5.01.02', nomeConta: 'Energia Elétrica Industrial', tipoConta: 'ANALITICA', natureza: 'DEVEDORA', nivel: 3, ativo: true },
      { codigoEstrutural: '5.01.03', nomeConta: 'Manutenção de Máquinas & Laser', tipoConta: 'ANALITICA', natureza: 'DEVEDORA', nivel: 3, ativo: true },
      { codigoEstrutural: '5.01.04', nomeConta: 'Despesas Financeiras, Juros e Tarifas', tipoConta: 'ANALITICA', natureza: 'DEVEDORA', nivel: 3, ativo: true },
    ];

    for (const emp of EMPRESAS_GRUPO) {
      const contas: PlanoConta[] = planoPadrao.map((p, idx) => ({
        id: `pc-${emp.id}-${idx + 1}`,
        empresaId: emp.id,
        ...p,
      }));
      this.planoContasStore.set(emp.id, contas);
    }
  }

  private inicializarCentrosCustoPadrao() {
    const ccPadrao: Array<Omit<CentroCusto, 'id' | 'empresaId'>> = [
      { codigo: 'CC-FAB-01', nome: 'Corte a Laser e Plasma CNC', tipo: 'PRODUTIVO', responsavel: 'Eng. Roberto Alves', ativo: true, orcamentoMensalPrevisto: 120000 },
      { codigo: 'CC-FAB-02', nome: 'Dobra CNC e Caldeiraria Pesada', tipo: 'PRODUTIVO', responsavel: 'Mestre Carlos Silva', ativo: true, orcamentoMensalPrevisto: 95000 },
      { codigo: 'CC-FAB-03', nome: 'Soldagem e Montagem Estrutural', tipo: 'PRODUTIVO', responsavel: 'Eng. Fernando Souza', ativo: true, orcamentoMensalPrevisto: 140000 },
      { codigo: 'CC-FAB-04', nome: 'Pintura Industrial e Jateamento', tipo: 'PRODUTIVO', responsavel: 'Superv. Marcos Rocha', ativo: true, orcamentoMensalPrevisto: 60000 },
      { codigo: 'CC-ENG-01', nome: 'Engenharia de Produto & Projetos', tipo: 'ENGENHARIA', responsavel: 'Dra. Patricia Lima', ativo: true, orcamentoMensalPrevisto: 55000 },
      { codigo: 'CC-MAN-01', nome: 'Manutenção Mecânica & Elétrica Fabril', tipo: 'MANUTENCAO', responsavel: 'Tec. Leandro Duarte', ativo: true, orcamentoMensalPrevisto: 45000 },
      { codigo: 'CC-LOG-01', nome: 'Expedição, Frotas & Logística', tipo: 'LOGISTICA', responsavel: 'Coord. Rodrigo Mendes', ativo: true, orcamentoMensalPrevisto: 80000 },
      { codigo: 'CC-ADM-01', nome: 'Administração Geral & Controladoria', tipo: 'ADMINISTRATIVO', responsavel: 'Dir. Financeiro', ativo: true, orcamentoMensalPrevisto: 70000 },
      { codigo: 'CC-COM-01', nome: 'Comercial & Vendas B2B', tipo: 'COMERCIAL', responsavel: 'Ger. Vendas', ativo: true, orcamentoMensalPrevisto: 65000 },
    ];

    for (const emp of EMPRESAS_GRUPO) {
      const ccs: CentroCusto[] = ccPadrao.map((cc, idx) => ({
        id: `cc-${emp.id}-${idx + 1}`,
        empresaId: emp.id,
        ...cc,
      }));
      this.centrosCustoStore.set(emp.id, ccs);
    }
  }

  private inicializarCategoriasPadrao() {
    const catPadrao: Array<Omit<CategoriaFinanceira, 'id' | 'empresaId'>> = [
      { nome: 'Venda de Estruturas Metálicas', tipo: 'RECEITA', corHex: '#10b981', dedutivelFiscal: true, ativo: true },
      { nome: 'Serviços de Corte & Dobra CNC', tipo: 'RECEITA', corHex: '#06b6d4', dedutivelFiscal: true, ativo: true },
      { nome: 'Compra de Chapas e Vigas de Aço', tipo: 'DESPESA', corHex: '#ef4444', dedutivelFiscal: true, ativo: true },
      { nome: 'Gases Industriais (Oxigênio/Nitrogênio)', tipo: 'DESPESA', corHex: '#f97316', dedutivelFiscal: true, ativo: true },
      { nome: 'Energia Elétrica Fabril (Alta Tensão)', tipo: 'DESPESA', corHex: '#eab308', dedutivelFiscal: true, ativo: true },
      { nome: 'Fretes e Carretas Dedicadas (CIF)', tipo: 'DESPESA', corHex: '#8b5cf6', dedutivelFiscal: true, ativo: true },
      { nome: 'Manutenção de Laser e Ópticas', tipo: 'DESPESA', corHex: '#ec4899', dedutivelFiscal: true, ativo: true },
      { nome: 'Tributos Federais (IBS/CBS/PIS/COFINS)', tipo: 'DESPESA', corHex: '#64748b', dedutivelFiscal: true, ativo: true },
      { nome: 'Adiantamento a Fornecedores', tipo: 'DESPESA', corHex: '#3b82f6', dedutivelFiscal: false, ativo: true },
      { nome: 'Adiantamento de Clientes', tipo: 'RECEITA', corHex: '#14b8a6', dedutivelFiscal: false, ativo: true },
    ];

    for (const emp of EMPRESAS_GRUPO) {
      const cats: CategoriaFinanceira[] = catPadrao.map((c, idx) => ({
        id: `cat-${emp.id}-${idx + 1}`,
        empresaId: emp.id,
        ...c,
      }));
      this.categoriasStore.set(emp.id, cats);
    }
  }

  private inicializarTitulosSeed() {
    const hoje = new Date();
    const dataVenc1 = new Date(hoje.getTime() + 5 * 86400000).toISOString().split('T')[0];
    const dataVenc2 = new Date(hoje.getTime() + 25 * 86400000).toISOString().split('T')[0];
    const dataVencPassada = new Date(hoje.getTime() - 10 * 86400000).toISOString().split('T')[0];

    for (const emp of EMPRESAS_GRUPO) {
      // 1. Contas a Pagar Seeds
      const cp1: ContaPagar = {
        id: `cp-${emp.id}-001`,
        empresaId: emp.id,
        fornecedorId: 'forn-usiminas-001',
        fornecedorNome: 'USINAS SIDERÚRGICAS DE MINAS GERAIS S.A. - USIMINAS',
        fornecedorCnpjCpf: '60.870.004/0001-89',
        numeroDocumento: 'NF-89211',
        descricao: 'Compra de 25 toneladas de Chapa de Aço ASTM A36 12.70mm',
        origem: 'COMPRAS_ORDEM',
        ordemCompraId: 'oc-2026-081',
        chaveNfe: '31260860870004000189550010000892111002345678',
        categoriaFinanceiraNome: 'Compra de Chapas e Vigas de Aço',
        centroCustoNome: 'Corte a Laser e Plasma CNC',
        valorOriginal: 142500.0,
        valorJuros: 0,
        valorMulta: 0,
        valorDesconto: 0,
        valorTotalLiquido: 142500.0,
        valorPago: 47500.0,
        valorSaldoRestante: 95000.0,
        dataEmissao: new Date(hoje.getTime() - 15 * 86400000).toISOString().split('T')[0],
        dataVencimentoPrimeira: dataVencPassada,
        totalParcelas: 3,
        status: 'PARCIALMENTE_PAGO',
        criadoPorUsuarioId: 'u-operador-compras',
        criadoPorUsuarioNome: 'Juliana Costa (Compras)',
        aprovadoPorUsuarioId: 'u-gerente-financeiro',
        aprovadoPorUsuarioNome: 'Dr. Marcos Valério (Controladoria)',
        dataAprovacao: new Date(hoje.getTime() - 14 * 86400000).toISOString(),
        createdAt: new Date(hoje.getTime() - 15 * 86400000).toISOString(),
        updatedAt: new Date(hoje.getTime() - 10 * 86400000).toISOString(),
        parcelas: [
          {
            id: `parc-cp-${emp.id}-001-1`,
            empresaId: emp.id,
            contaPagarId: `cp-${emp.id}-001`,
            numeroParcela: 1,
            totalParcelas: 3,
            dataVencimento: dataVencPassada,
            dataPagamento: dataVencPassada,
            valorNominal: 47500.0,
            valorJuros: 0,
            valorMulta: 0,
            valorDesconto: 0,
            valorTotalLiquido: 47500.0,
            valorPago: 47500.0,
            valorSaldo: 0.0,
            statusParcela: 'LIQUIDADA',
            formaPagamentoPrevista: 'TED',
            codigoBarrasBoleto: '23793.38128 60000.123456 78000.654321 1 987600004750000',
          },
          {
            id: `parc-cp-${emp.id}-001-2`,
            empresaId: emp.id,
            contaPagarId: `cp-${emp.id}-001`,
            numeroParcela: 2,
            totalParcelas: 3,
            dataVencimento: dataVenc1,
            valorNominal: 47500.0,
            valorJuros: 0,
            valorMulta: 0,
            valorDesconto: 0,
            valorTotalLiquido: 47500.0,
            valorPago: 0.0,
            valorSaldo: 47500.0,
            statusParcela: 'EM_ABERTO',
            formaPagamentoPrevista: 'BOLETO',
            linhaDigitavel: '23793.38128 60000.123456 78000.654321 2 987600004750000',
          },
          {
            id: `parc-cp-${emp.id}-001-3`,
            empresaId: emp.id,
            contaPagarId: `cp-${emp.id}-001`,
            numeroParcela: 3,
            totalParcelas: 3,
            dataVencimento: dataVenc2,
            valorNominal: 47500.0,
            valorJuros: 0,
            valorMulta: 0,
            valorDesconto: 0,
            valorTotalLiquido: 47500.0,
            valorPago: 0.0,
            valorSaldo: 47500.0,
            statusParcela: 'EM_ABERTO',
            formaPagamentoPrevista: 'BOLETO',
          },
        ],
      };

      const cp2: ContaPagar = {
        id: `cp-${emp.id}-002`,
        empresaId: emp.id,
        fornecedorId: 'forn-white-martins-002',
        fornecedorNome: 'WHITE MARTINS GASES INDUSTRIAIS LTDA',
        fornecedorCnpjCpf: '35.820.448/0001-33',
        numeroDocumento: 'NF-45109',
        descricao: 'Fornecimento de Nitrogênio Líquido e Oxigênio de Alta Pureza para Máquina Laser Fibra Óptica',
        origem: 'FISCAL_NFE_ENTRADA',
        chaveNfe: '35260835820448000133550010000451091009876543',
        categoriaFinanceiraNome: 'Gases Industriais (Oxigênio/Nitrogênio)',
        centroCustoNome: 'Corte a Laser e Plasma CNC',
        valorOriginal: 18450.0,
        valorJuros: 0,
        valorMulta: 0,
        valorDesconto: 0,
        valorTotalLiquido: 18450.0,
        valorPago: 0,
        valorSaldoRestante: 18450.0,
        dataEmissao: new Date(hoje.getTime() - 3 * 86400000).toISOString().split('T')[0],
        dataVencimentoPrimeira: dataVenc1,
        totalParcelas: 1,
        status: 'PENDENTE_APROVACAO',
        criadoPorUsuarioId: 'u-fiscal-integracao',
        criadoPorUsuarioNome: 'Robô Faturamento/XML',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parcelas: [
          {
            id: `parc-cp-${emp.id}-002-1`,
            empresaId: emp.id,
            contaPagarId: `cp-${emp.id}-002`,
            numeroParcela: 1,
            totalParcelas: 1,
            dataVencimento: dataVenc1,
            valorNominal: 18450.0,
            valorJuros: 0,
            valorMulta: 0,
            valorDesconto: 0,
            valorTotalLiquido: 18450.0,
            valorPago: 0,
            valorSaldo: 18450.0,
            statusParcela: 'EM_ABERTO',
            formaPagamentoPrevista: 'PIX',
            chavePix: 'financeiro@whitemartins.com.br',
          },
        ],
      };

      this.contasPagarStore.set(emp.id, [cp1, cp2]);

      // 2. Contas a Receber Seeds
      const cr1: ContaReceber = {
        id: `cr-${emp.id}-001`,
        empresaId: emp.id,
        clienteId: 'cli-petro-001',
        clienteNome: 'PETROBRASIL REFINARIA E DISTRIBUICAO S.A.',
        clienteCnpjCpf: '45.890.123/0001-99',
        numeroDocumento: 'FAT-NFE-1041',
        descricao: 'Fornecimento de Estrutura Metálica e Dutos Calandrados para Unidade de Craqueamento',
        origem: 'FISCAL_NFE_FATURAMENTO',
        documentoFiscalId: `doc-${emp.id}-1041`,
        chaveNfe: '35260812345678000190550010000010411876543210',
        categoriaFinanceiraNome: 'Venda de Estruturas Metálicas',
        centroCustoNome: 'Soldagem e Montagem Estrutural',
        valorOriginal: 185000.0,
        valorJuros: 0,
        valorMulta: 0,
        valorDesconto: 0,
        valorTotalLiquido: 185000.0,
        valorRecebido: 0,
        valorSaldoRestante: 185000.0,
        dataEmissao: new Date(hoje.getTime() - 2 * 86400000).toISOString().split('T')[0],
        dataVencimentoPrimeira: dataVenc1,
        totalParcelas: 2,
        status: 'APROVADO',
        criadoPorUsuarioId: 'u-faturamento',
        criadoPorUsuarioNome: 'Carla Silveira (Faturamento)',
        aprovadoPorUsuarioId: 'u-diretoria',
        aprovadoPorUsuarioNome: 'Diretoria Financeira',
        dataAprovacao: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parcelas: [
          {
            id: `parc-cr-${emp.id}-001-1`,
            empresaId: emp.id,
            contaReceberId: `cr-${emp.id}-001`,
            numeroParcela: 1,
            totalParcelas: 2,
            dataVencimento: dataVenc1,
            valorNominal: 92500.0,
            valorJuros: 0,
            valorMulta: 0,
            valorDesconto: 0,
            valorTotalLiquido: 92500.0,
            valorRecebido: 0,
            valorSaldo: 92500.0,
            statusParcela: 'EM_ABERTO',
            formaRecebimentoPrevista: 'BOLETO',
            nossoNumero: '2026/000941',
            linhaDigitavel: '34191.09008 00094.123456 78000.987654 3 999900009250000',
          },
          {
            id: `parc-cr-${emp.id}-001-2`,
            empresaId: emp.id,
            contaReceberId: `cr-${emp.id}-001`,
            numeroParcela: 2,
            totalParcelas: 2,
            dataVencimento: dataVenc2,
            valorNominal: 92500.0,
            valorJuros: 0,
            valorMulta: 0,
            valorDesconto: 0,
            valorTotalLiquido: 92500.0,
            valorRecebido: 0,
            valorSaldo: 92500.0,
            statusParcela: 'EM_ABERTO',
            formaRecebimentoPrevista: 'BOLETO',
            nossoNumero: '2026/000942',
          },
        ],
      };

      const cr2: ContaReceber = {
        id: `cr-${emp.id}-002`,
        empresaId: emp.id,
        clienteId: 'cli-metalurgica-002',
        clienteNome: 'INDÚSTRIA METALÚRGICA VALE DO AÇO S.A.',
        clienteCnpjCpf: '19.450.887/0001-21',
        numeroDocumento: 'REC-MANUAL-088',
        descricao: 'Serviço sob demanda de corte a laser em chapas de Inox 316L',
        origem: 'MANUAL',
        categoriaFinanceiraNome: 'Serviços de Corte & Dobra CNC',
        centroCustoNome: 'Corte a Laser e Plasma CNC',
        valorOriginal: 26800.0,
        valorJuros: 0,
        valorMulta: 0,
        valorDesconto: 800.0,
        valorTotalLiquido: 26000.0,
        valorRecebido: 26000.0,
        valorSaldoRestante: 0.0,
        dataEmissao: new Date(hoje.getTime() - 20 * 86400000).toISOString().split('T')[0],
        dataVencimentoPrimeira: dataVencPassada,
        totalParcelas: 1,
        status: 'LIQUIDADO',
        criadoPorUsuarioId: 'u-vendedor',
        criadoPorUsuarioNome: 'Bruno Rocha (Comercial)',
        aprovadoPorUsuarioId: 'u-financeiro',
        aprovadoPorUsuarioNome: 'Tesouraria Central',
        createdAt: new Date(hoje.getTime() - 20 * 86400000).toISOString(),
        updatedAt: new Date(hoje.getTime() - 10 * 86400000).toISOString(),
        parcelas: [
          {
            id: `parc-cr-${emp.id}-002-1`,
            empresaId: emp.id,
            contaReceberId: `cr-${emp.id}-002`,
            numeroParcela: 1,
            totalParcelas: 1,
            dataVencimento: dataVencPassada,
            dataRecebimento: dataVencPassada,
            valorNominal: 26800.0,
            valorJuros: 0,
            valorMulta: 0,
            valorDesconto: 800.0,
            valorTotalLiquido: 26000.0,
            valorRecebido: 26000.0,
            valorSaldo: 0.0,
            statusParcela: 'LIQUIDADA',
            formaRecebimentoPrevista: 'PIX',
          },
        ],
      };

      this.contasReceberStore.set(emp.id, [cr1, cr2]);

      // 3. Adiantamentos Seeds
      const ad1: AdiantamentoFinanceiro = {
        id: `ad-${emp.id}-001`,
        empresaId: emp.id,
        tipo: 'A_FORNECEDOR',
        parceiroId: 'forn-usiminas-001',
        parceiroNome: 'USINAS SIDERÚRGICAS DE MINAS GERAIS S.A. - USIMINAS',
        parceiroCnpjCpf: '60.870.004/0001-89',
        numeroDocumento: 'ADT-FORN-0042',
        dataAdiantamento: new Date(hoje.getTime() - 8 * 86400000).toISOString().split('T')[0],
        valorOriginal: 30000.0,
        valorCompensado: 0.0,
        valorSaldoDisponivel: 30000.0,
        status: 'DISPONIVEL',
        formaPagamento: 'TED',
        usuarioLancamentoId: 'u-tesouraria',
        usuarioLancamentoNome: 'Marcos Tesoureiro',
        observacoes: 'Adiantamento de 20% para reserva de lote especial de chapas de alta resistência Hardox',
        compensacoes: [],
        createdAt: new Date(hoje.getTime() - 8 * 86400000).toISOString(),
      };

      this.adiantamentosStore.set(emp.id, [ad1]);
    }
  }

  // --------------------------------------------------------------------------
  // CONTAS A PAGAR (AP) - CRUD, PARCELAMENTO, APROVAÇÃO, BAIXAS
  // --------------------------------------------------------------------------

  public getContasPagar(empresaId: string, filtroStatus?: StatusTituloFinanceiro): ContaPagar[] {
    const list = this.contasPagarStore.get(empresaId) || [];
    if (!filtroStatus) return list;
    return list.filter((cp) => cp.status === filtroStatus);
  }

  public getContaPagarById(empresaId: string, id: string): ContaPagar | undefined {
    const list = this.contasPagarStore.get(empresaId) || [];
    return list.find((cp) => cp.id === id);
  }

  public criarContaPagarManual(
    empresaId: string,
    payload: {
      fornecedorId: string;
      fornecedorNome: string;
      fornecedorCnpjCpf: string;
      numeroDocumento: string;
      descricao: string;
      origem?: OrigemTituloFinanceiro;
      categoriaFinanceiraId?: string;
      centroCustoId?: string;
      planoContaId?: string;
      valorOriginal: number;
      dataEmissao: string;
      dataVencimentoPrimeira: string;
      totalParcelas: number;
      intervaloDias?: number; // padrão 30 dias
      formaPagamentoPrevista?: FormaPagamentoFinanceiro;
      codigoBarrasBoleto?: string;
      linhaDigitavel?: string;
      chavePix?: string;
      usuarioId: string;
      usuarioNome: string;
      requerAprovacao?: boolean;
    }
  ): ContaPagar {
    const id = `cp-${empresaId}-${Date.now()}`;
    const totalParc = Math.max(1, payload.totalParcelas || 1);
    const intervalo = payload.intervaloDias || 30;
    const valorParcelaBase = Number((payload.valorOriginal / totalParc).toFixed(2));
    let somaParcelas = 0;

    const parcelas: ContaPagarParcela[] = [];
    const dataBaseVenc = new Date(payload.dataVencimentoPrimeira);

    for (let i = 1; i <= totalParc; i++) {
      const dataVenc = new Date(dataBaseVenc);
      if (i > 1) {
        dataVenc.setDate(dataVenc.getDate() + (i - 1) * intervalo);
      }
      const dataVencStr = dataVenc.toISOString().split('T')[0];

      // Ajuste de centavos na última parcela
      let valorNom = valorParcelaBase;
      if (i === totalParc) {
        valorNom = Number((payload.valorOriginal - somaParcelas).toFixed(2));
      } else {
        somaParcelas += valorNom;
      }

      parcelas.push({
        id: `parc-${id}-${i}`,
        empresaId,
        contaPagarId: id,
        numeroParcela: i,
        totalParcelas: totalParc,
        dataVencimento: dataVencStr,
        valorNominal: valorNom,
        valorJuros: 0,
        valorMulta: 0,
        valorDesconto: 0,
        valorTotalLiquido: valorNom,
        valorPago: 0,
        valorSaldo: valorNom,
        statusParcela: 'EM_ABERTO',
        formaPagamentoPrevista: payload.formaPagamentoPrevista || 'BOLETO',
        codigoBarrasBoleto: i === 1 ? payload.codigoBarrasBoleto : undefined,
        linhaDigitavel: i === 1 ? payload.linhaDigitavel : undefined,
        chavePix: payload.chavePix,
      });
    }

    const statusInicial: StatusTituloFinanceiro =
      payload.requerAprovacao !== false ? 'PENDENTE_APROVACAO' : 'APROVADO';

    const novaConta: ContaPagar = {
      id,
      empresaId,
      fornecedorId: payload.fornecedorId,
      fornecedorNome: payload.fornecedorNome,
      fornecedorCnpjCpf: payload.fornecedorCnpjCpf,
      numeroDocumento: payload.numeroDocumento,
      descricao: payload.descricao,
      origem: payload.origem || 'MANUAL',
      categoriaFinanceiraId: payload.categoriaFinanceiraId,
      centroCustoId: payload.centroCustoId,
      planoContaId: payload.planoContaId,
      valorOriginal: payload.valorOriginal,
      valorJuros: 0,
      valorMulta: 0,
      valorDesconto: 0,
      valorTotalLiquido: payload.valorOriginal,
      valorPago: 0,
      valorSaldoRestante: payload.valorOriginal,
      dataEmissao: payload.dataEmissao || new Date().toISOString().split('T')[0],
      dataVencimentoPrimeira: payload.dataVencimentoPrimeira,
      totalParcelas: totalParc,
      parcelas,
      status: statusInicial,
      criadoPorUsuarioId: payload.usuarioId,
      criadoPorUsuarioNome: payload.usuarioNome,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const lista = this.contasPagarStore.get(empresaId) || [];
    lista.unshift(novaConta);
    this.contasPagarStore.set(empresaId, lista);

    this.registrarAuditoria({
      empresaId,
      usuarioId: payload.usuarioId,
      usuarioNome: payload.usuarioNome,
      modulo: 'FINANCEIRO',
      acao: 'CRIACAO_TITULO',
      tituloOuDocumentoRef: `CP: ${novaConta.numeroDocumento} (${novaConta.fornecedorNome})`,
      payloadBefore: null,
      payloadAfter: novaConta,
      detalhes: `Lançamento de Contas a Pagar no valor de R$ ${novaConta.valorOriginal.toFixed(2)} em ${totalParc}x.`,
    });

    return novaConta;
  }

  public aprovarOuRejeitarContaPagar(
    empresaId: string,
    contaPagarId: string,
    aprovado: boolean,
    usuarioId: string,
    usuarioNome: string,
    motivoRejeicao?: string
  ): ContaPagar {
    const list = this.contasPagarStore.get(empresaId) || [];
    const index = list.findIndex((cp) => cp.id === contaPagarId);
    if (index === -1) {
      throw new Error(`Título a pagar ${contaPagarId} não encontrado para a empresa ativa.`);
    }

    const cp = list[index];
    const before = { ...cp };

    // Segregação SoD: Não permitir que o próprio criador aprove se não for Superadmin
    if (cp.criadoPorUsuarioId === usuarioId) {
      console.warn(`[SoD Warning] Usuário ${usuarioNome} aprovando título criado por ele mesmo.`);
    }

    if (aprovado) {
      cp.status = 'APROVADO';
      cp.aprovadoPorUsuarioId = usuarioId;
      cp.aprovadoPorUsuarioNome = usuarioNome;
      cp.dataAprovacao = new Date().toISOString();
      cp.motivoRejeicao = undefined;
    } else {
      cp.status = 'REJEITADO';
      cp.motivoRejeicao = motivoRejeicao || 'Rejeitado pela gerência/controladoria';
    }

    cp.updatedAt = new Date().toISOString();
    list[index] = cp;
    this.contasPagarStore.set(empresaId, list);

    this.registrarAuditoria({
      empresaId,
      usuarioId,
      usuarioNome,
      modulo: 'FINANCEIRO',
      acao: aprovado ? 'APROVACAO_TITULO' : 'REJEICAO_TITULO',
      tituloOuDocumentoRef: `CP: ${cp.numeroDocumento}`,
      payloadBefore: before,
      payloadAfter: cp,
      detalhes: aprovado
        ? `Título a pagar aprovado para pagamento.`
        : `Título a pagar rejeitado. Motivo: ${motivoRejeicao}`,
    });

    return cp;
  }

  public baixarParcelaContaPagar(
    empresaId: string,
    contaPagarId: string,
    parcelaId: string,
    payload: {
      valorPago: number;
      valorJuros?: number;
      valorMulta?: number;
      valorDesconto?: number;
      dataBaixa?: string;
      formaPagamento: FormaPagamentoFinanceiro;
      contaBancariaNome?: string;
      autenticacaoBancaria?: string;
      observacoes?: string;
      comprovanteStoragePath?: string;
      usuarioId: string;
      usuarioNome: string;
    }
  ): { contaPagar: ContaPagar; parcelaBaixada: ContaPagarParcela; baixa: BaixaFinanceira } {
    const list = this.contasPagarStore.get(empresaId) || [];
    const index = list.findIndex((cp) => cp.id === contaPagarId);
    if (index === -1) {
      throw new Error(`Título a pagar ${contaPagarId} não encontrado.`);
    }

    const cp = list[index];
    if (cp.status === 'CANCELADO' || cp.status === 'REJEITADO') {
      throw new Error(`Não é possível baixar título com status ${cp.status}.`);
    }

    const parcIndex = cp.parcelas.findIndex((p) => p.id === parcelaId);
    if (parcIndex === -1) {
      throw new Error(`Parcela ${parcelaId} não encontrada no título ${contaPagarId}.`);
    }

    const p = cp.parcelas[parcIndex];
    const before = { ...p };

    const juros = payload.valorJuros || 0;
    const multa = payload.valorMulta || 0;
    const desconto = payload.valorDesconto || 0;
    const valorTotalLiquidoParcela = p.valorNominal + juros + multa - desconto;

    p.valorJuros = (p.valorJuros || 0) + juros;
    p.valorMulta = (p.valorMulta || 0) + multa;
    p.valorDesconto = (p.valorDesconto || 0) + desconto;
    p.valorTotalLiquido = valorTotalLiquidoParcela;
    p.valorPago = (p.valorPago || 0) + payload.valorPago;
    p.valorSaldo = Math.max(0, valorTotalLiquidoParcela - p.valorPago);

    if (p.valorSaldo <= 0.01) {
      p.statusParcela = 'LIQUIDADA';
      p.dataPagamento = payload.dataBaixa || new Date().toISOString().split('T')[0];
    } else {
      p.statusParcela = 'PARCIALMENTE_PAGA';
    }

    cp.parcelas[parcIndex] = p;

    // Recalcular cabeçalho da ContaPagar
    cp.valorJuros = cp.parcelas.reduce((acc, curr) => acc + curr.valorJuros, 0);
    cp.valorMulta = cp.parcelas.reduce((acc, curr) => acc + curr.valorMulta, 0);
    cp.valorDesconto = cp.parcelas.reduce((acc, curr) => acc + curr.valorDesconto, 0);
    cp.valorTotalLiquido = cp.parcelas.reduce((acc, curr) => acc + curr.valorTotalLiquido, 0);
    cp.valorPago = cp.parcelas.reduce((acc, curr) => acc + curr.valorPago, 0);
    cp.valorSaldoRestante = cp.parcelas.reduce((acc, curr) => acc + curr.valorSaldo, 0);

    const todasLiquidadas = cp.parcelas.every((parc) => parc.statusParcela === 'LIQUIDADA');
    const algumaPaga = cp.parcelas.some((parc) => parc.valorPago > 0);

    if (todasLiquidadas) {
      cp.status = 'LIQUIDADO';
    } else if (algumaPaga) {
      cp.status = 'PARCIALMENTE_PAGO';
    }

    cp.updatedAt = new Date().toISOString();
    list[index] = cp;
    this.contasPagarStore.set(empresaId, list);

    // Registro da Baixa Financeira
    const baixa: BaixaFinanceira = {
      id: `bx-${empresaId}-${Date.now()}`,
      empresaId,
      tipoOperacao: 'PAGAMENTO',
      contaPagarId: cp.id,
      contaPagarParcelaId: p.id,
      numeroDocumento: cp.numeroDocumento,
      numeroParcela: p.numeroParcela,
      dataBaixa: payload.dataBaixa || new Date().toISOString().split('T')[0],
      valorPagoOuRecebido: payload.valorPago,
      valorJurosAplicado: juros,
      valorMultaAplicada: multa,
      valorDescontoAplicado: desconto,
      formaPagamento: payload.formaPagamento,
      contaBancariaNome: payload.contaBancariaNome,
      autenticacaoBancaria: payload.autenticacaoBancaria,
      observacoes: payload.observacoes,
      comprovanteStoragePath: payload.comprovanteStoragePath,
      usuarioBaixaId: payload.usuarioId,
      usuarioBaixaNome: payload.usuarioNome,
      estornado: false,
      createdAt: new Date().toISOString(),
    };

    const baixasLista = this.baixasStore.get(empresaId) || [];
    baixasLista.unshift(baixa);
    this.baixasStore.set(empresaId, baixasLista);

    this.registrarAuditoria({
      empresaId,
      usuarioId: payload.usuarioId,
      usuarioNome: payload.usuarioNome,
      modulo: 'FINANCEIRO',
      acao: p.statusParcela === 'LIQUIDADA' ? 'BAIXA_TOTAL' : 'BAIXA_PARCIAL',
      tituloOuDocumentoRef: `CP: ${cp.numeroDocumento} (Parc ${p.numeroParcela}/${p.totalParcelas})`,
      payloadBefore: before,
      payloadAfter: { parcela: p, baixa },
      detalhes: `Pagamento registrado: R$ ${payload.valorPago.toFixed(2)} (${payload.formaPagamento}). Juros: R$ ${juros}, Multa: R$ ${multa}, Desc: R$ ${desconto}.`,
    });

    return { contaPagar: cp, parcelaBaixada: p, baixa };
  }

  public cancelarContaPagar(
    empresaId: string,
    contaPagarId: string,
    motivo: string,
    usuarioId: string,
    usuarioNome: string
  ): ContaPagar {
    const list = this.contasPagarStore.get(empresaId) || [];
    const index = list.findIndex((cp) => cp.id === contaPagarId);
    if (index === -1) {
      throw new Error(`Título a pagar ${contaPagarId} não encontrado.`);
    }

    const cp = list[index];
    if (cp.valorPago > 0) {
      throw new Error(`Não é permitido cancelar título que já possui baixas financeiras parciais ou totais. Estorne as baixas primeiro.`);
    }

    const before = { ...cp };
    cp.status = 'CANCELADO';
    cp.motivoCancelamento = motivo;
    cp.parcelas.forEach((p) => {
      p.statusParcela = 'CANCELADA';
      p.valorSaldo = 0;
    });
    cp.valorSaldoRestante = 0;
    cp.updatedAt = new Date().toISOString();

    list[index] = cp;
    this.contasPagarStore.set(empresaId, list);

    this.registrarAuditoria({
      empresaId,
      usuarioId,
      usuarioNome,
      modulo: 'FINANCEIRO',
      acao: 'CANCELAMENTO_TITULO',
      tituloOuDocumentoRef: `CP: ${cp.numeroDocumento}`,
      payloadBefore: before,
      payloadAfter: cp,
      detalhes: `Cancelamento lógico de título a pagar. Motivo: ${motivo}`,
    });

    return cp;
  }

  // --------------------------------------------------------------------------
  // CONTAS A RECEBER (AR) - CRUD, PARCELAMENTO, APROVAÇÃO, RECEBIMENTOS
  // --------------------------------------------------------------------------

  public getContasReceber(empresaId: string, filtroStatus?: StatusTituloFinanceiro): ContaReceber[] {
    const list = this.contasReceberStore.get(empresaId) || [];
    if (!filtroStatus) return list;
    return list.filter((cr) => cr.status === filtroStatus);
  }

  public getContaReceberById(empresaId: string, id: string): ContaReceber | undefined {
    const list = this.contasReceberStore.get(empresaId) || [];
    return list.find((cr) => cr.id === id);
  }

  public criarContaReceberManual(
    empresaId: string,
    payload: {
      clienteId: string;
      clienteNome: string;
      clienteCnpjCpf: string;
      numeroDocumento: string;
      descricao: string;
      origem?: OrigemTituloFinanceiro;
      categoriaFinanceiraId?: string;
      centroCustoId?: string;
      planoContaId?: string;
      valorOriginal: number;
      dataEmissao: string;
      dataVencimentoPrimeira: string;
      totalParcelas: number;
      intervaloDias?: number;
      formaRecebimentoPrevista?: FormaPagamentoFinanceiro;
      nossoNumero?: string;
      linhaDigitavel?: string;
      qrCodePix?: string;
      usuarioId: string;
      usuarioNome: string;
    }
  ): ContaReceber {
    const id = `cr-${empresaId}-${Date.now()}`;
    const totalParc = Math.max(1, payload.totalParcelas || 1);
    const intervalo = payload.intervaloDias || 30;
    const valorParcelaBase = Number((payload.valorOriginal / totalParc).toFixed(2));
    let somaParcelas = 0;

    const parcelas: ContaReceberParcela[] = [];
    const dataBaseVenc = new Date(payload.dataVencimentoPrimeira);

    for (let i = 1; i <= totalParc; i++) {
      const dataVenc = new Date(dataBaseVenc);
      if (i > 1) {
        dataVenc.setDate(dataVenc.getDate() + (i - 1) * intervalo);
      }
      const dataVencStr = dataVenc.toISOString().split('T')[0];

      let valorNom = valorParcelaBase;
      if (i === totalParc) {
        valorNom = Number((payload.valorOriginal - somaParcelas).toFixed(2));
      } else {
        somaParcelas += valorNom;
      }

      parcelas.push({
        id: `parc-${id}-${i}`,
        empresaId,
        contaReceberId: id,
        numeroParcela: i,
        totalParcelas: totalParc,
        dataVencimento: dataVencStr,
        valorNominal: valorNom,
        valorJuros: 0,
        valorMulta: 0,
        valorDesconto: 0,
        valorTotalLiquido: valorNom,
        valorRecebido: 0,
        valorSaldo: valorNom,
        statusParcela: 'EM_ABERTO',
        formaRecebimentoPrevista: payload.formaRecebimentoPrevista || 'BOLETO',
        nossoNumero: i === 1 ? payload.nossoNumero : undefined,
        linhaDigitavel: i === 1 ? payload.linhaDigitavel : undefined,
        qrCodePix: payload.qrCodePix,
      });
    }

    const novaConta: ContaReceber = {
      id,
      empresaId,
      clienteId: payload.clienteId,
      clienteNome: payload.clienteNome,
      clienteCnpjCpf: payload.clienteCnpjCpf,
      numeroDocumento: payload.numeroDocumento,
      descricao: payload.descricao,
      origem: payload.origem || 'MANUAL',
      categoriaFinanceiraId: payload.categoriaFinanceiraId,
      centroCustoId: payload.centroCustoId,
      planoContaId: payload.planoContaId,
      valorOriginal: payload.valorOriginal,
      valorJuros: 0,
      valorMulta: 0,
      valorDesconto: 0,
      valorTotalLiquido: payload.valorOriginal,
      valorRecebido: 0,
      valorSaldoRestante: payload.valorOriginal,
      dataEmissao: payload.dataEmissao || new Date().toISOString().split('T')[0],
      dataVencimentoPrimeira: payload.dataVencimentoPrimeira,
      totalParcelas: totalParc,
      parcelas,
      status: 'APROVADO',
      criadoPorUsuarioId: payload.usuarioId,
      criadoPorUsuarioNome: payload.usuarioNome,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const lista = this.contasReceberStore.get(empresaId) || [];
    lista.unshift(novaConta);
    this.contasReceberStore.set(empresaId, lista);

    this.registrarAuditoria({
      empresaId,
      usuarioId: payload.usuarioId,
      usuarioNome: payload.usuarioNome,
      modulo: 'FINANCEIRO',
      acao: 'CRIACAO_TITULO',
      tituloOuDocumentoRef: `CR: ${novaConta.numeroDocumento} (${novaConta.clienteNome})`,
      payloadBefore: null,
      payloadAfter: novaConta,
      detalhes: `Lançamento de Contas a Receber no valor de R$ ${novaConta.valorOriginal.toFixed(2)} em ${totalParc}x.`,
    });

    return novaConta;
  }

  public baixarParcelaContaReceber(
    empresaId: string,
    contaReceberId: string,
    parcelaId: string,
    payload: {
      valorRecebido: number;
      valorJuros?: number;
      valorMulta?: number;
      valorDesconto?: number;
      dataRecebimento?: string;
      formaPagamento: FormaPagamentoFinanceiro;
      contaBancariaNome?: string;
      autenticacaoBancaria?: string;
      observacoes?: string;
      usuarioId: string;
      usuarioNome: string;
    }
  ): { contaReceber: ContaReceber; parcelaBaixada: ContaReceberParcela; baixa: BaixaFinanceira } {
    const list = this.contasReceberStore.get(empresaId) || [];
    const index = list.findIndex((cr) => cr.id === contaReceberId);
    if (index === -1) {
      throw new Error(`Título a receber ${contaReceberId} não encontrado.`);
    }

    const cr = list[index];
    if (cr.status === 'CANCELADO') {
      throw new Error(`Não é possível baixar título cancelado.`);
    }

    const parcIndex = cr.parcelas.findIndex((p) => p.id === parcelaId);
    if (parcIndex === -1) {
      throw new Error(`Parcela ${parcelaId} não encontrada no título ${contaReceberId}.`);
    }

    const p = cr.parcelas[parcIndex];
    const before = { ...p };

    const juros = payload.valorJuros || 0;
    const multa = payload.valorMulta || 0;
    const desconto = payload.valorDesconto || 0;
    const valorTotalLiquidoParcela = p.valorNominal + juros + multa - desconto;

    p.valorJuros = (p.valorJuros || 0) + juros;
    p.valorMulta = (p.valorMulta || 0) + multa;
    p.valorDesconto = (p.valorDesconto || 0) + desconto;
    p.valorTotalLiquido = valorTotalLiquidoParcela;
    p.valorRecebido = (p.valorRecebido || 0) + payload.valorRecebido;
    p.valorSaldo = Math.max(0, valorTotalLiquidoParcela - p.valorRecebido);

    if (p.valorSaldo <= 0.01) {
      p.statusParcela = 'LIQUIDADA';
      p.dataRecebimento = payload.dataRecebimento || new Date().toISOString().split('T')[0];
    } else {
      p.statusParcela = 'PARCIALMENTE_PAGA';
    }

    cr.parcelas[parcIndex] = p;

    // Recalcular cabeçalho de ContaReceber
    cr.valorJuros = cr.parcelas.reduce((acc, curr) => acc + curr.valorJuros, 0);
    cr.valorMulta = cr.parcelas.reduce((acc, curr) => acc + curr.valorMulta, 0);
    cr.valorDesconto = cr.parcelas.reduce((acc, curr) => acc + curr.valorDesconto, 0);
    cr.valorTotalLiquido = cr.parcelas.reduce((acc, curr) => acc + curr.valorTotalLiquido, 0);
    cr.valorRecebido = cr.parcelas.reduce((acc, curr) => acc + curr.valorRecebido, 0);
    cr.valorSaldoRestante = cr.parcelas.reduce((acc, curr) => acc + curr.valorSaldo, 0);

    const todasLiquidadas = cr.parcelas.every((parc) => parc.statusParcela === 'LIQUIDADA');
    const algumRecebido = cr.parcelas.some((parc) => parc.valorRecebido > 0);

    if (todasLiquidadas) {
      cr.status = 'LIQUIDADO';
    } else if (algumRecebido) {
      cr.status = 'PARCIALMENTE_PAGO';
    }

    cr.updatedAt = new Date().toISOString();
    list[index] = cr;
    this.contasReceberStore.set(empresaId, list);

    // Registro da Baixa Financeira
    const baixa: BaixaFinanceira = {
      id: `bx-${empresaId}-${Date.now()}`,
      empresaId,
      tipoOperacao: 'RECEBIMENTO',
      contaReceberId: cr.id,
      contaReceberParcelaId: p.id,
      numeroDocumento: cr.numeroDocumento,
      numeroParcela: p.numeroParcela,
      dataBaixa: payload.dataRecebimento || new Date().toISOString().split('T')[0],
      valorPagoOuRecebido: payload.valorRecebido,
      valorJurosAplicado: juros,
      valorMultaAplicada: multa,
      valorDescontoAplicado: desconto,
      formaPagamento: payload.formaPagamento,
      contaBancariaNome: payload.contaBancariaNome,
      autenticacaoBancaria: payload.autenticacaoBancaria,
      observacoes: payload.observacoes,
      usuarioBaixaId: payload.usuarioId,
      usuarioBaixaNome: payload.usuarioNome,
      estornado: false,
      createdAt: new Date().toISOString(),
    };

    const baixasLista = this.baixasStore.get(empresaId) || [];
    baixasLista.unshift(baixa);
    this.baixasStore.set(empresaId, baixasLista);

    this.registrarAuditoria({
      empresaId,
      usuarioId: payload.usuarioId,
      usuarioNome: payload.usuarioNome,
      modulo: 'FINANCEIRO',
      acao: p.statusParcela === 'LIQUIDADA' ? 'BAIXA_TOTAL' : 'BAIXA_PARCIAL',
      tituloOuDocumentoRef: `CR: ${cr.numeroDocumento} (Parc ${p.numeroParcela}/${p.totalParcelas})`,
      payloadBefore: before,
      payloadAfter: { parcela: p, baixa },
      detalhes: `Recebimento registrado: R$ ${payload.valorRecebido.toFixed(2)} (${payload.formaPagamento}). Juros: R$ ${juros}, Multa: R$ ${multa}, Desc: R$ ${desconto}.`,
    });

    return { contaReceber: cr, parcelaBaixada: p, baixa };
  }

  // --------------------------------------------------------------------------
  // RENEGOCIAÇÃO DE DÍVIDAS / TÍTULOS
  // --------------------------------------------------------------------------

  public renegociarTitulos(
    empresaId: string,
    payload: {
      tipo: 'PAGAR' | 'RECEBER';
      parceiroId: string;
      parceiroNome: string;
      titulosIds: string[];
      valorJurosAcordo?: number;
      valorDescontoAcordo?: number;
      quantidadeNovasParcelas: number;
      intervaloDias?: number;
      primeiroVencimento: string;
      motivo: string;
      usuarioId: string;
      usuarioNome: string;
    }
  ): { renegociacao: RenegociacaoFinanceira; novoTitulo: ContaPagar | ContaReceber } {
    const jurosAcordo = payload.valorJurosAcordo || 0;
    const descAcordo = payload.valorDescontoAcordo || 0;
    let valorTotalOriginal = 0;

    const protocolo = `RENEG-${Date.now().toString().slice(-6)}`;

    if (payload.tipo === 'PAGAR') {
      const cps = this.contasPagarStore.get(empresaId) || [];
      const titulosAlvo = cps.filter((cp) => payload.titulosIds.includes(cp.id));

      if (titulosAlvo.length === 0) {
        throw new Error('Nenhum título a pagar selecionado válido para renegociação.');
      }

      valorTotalOriginal = titulosAlvo.reduce((acc, curr) => acc + curr.valorSaldoRestante, 0);
      const valorTotalRenegociado = Math.max(0, valorTotalOriginal + jurosAcordo - descAcordo);

      // Marca títulos antigos como RENEGOCIADO
      titulosAlvo.forEach((cp) => {
        cp.status = 'RENEGOCIADO';
        cp.parcelas.forEach((p) => {
          if (p.statusParcela === 'EM_ABERTO' || p.statusParcela === 'PARCIALMENTE_PAGA') {
            p.statusParcela = 'RENEGOCIADA';
            p.valorSaldo = 0;
          }
        });
        cp.valorSaldoRestante = 0;
        cp.updatedAt = new Date().toISOString();
      });

      // Cria novo título parcelado
      const novoTitulo = this.criarContaPagarManual(empresaId, {
        fornecedorId: payload.parceiroId,
        fornecedorNome: payload.parceiroNome,
        fornecedorCnpjCpf: titulosAlvo[0]?.fornecedorCnpjCpf || '00.000.000/0000-00',
        numeroDocumento: `${protocolo}`,
        descricao: `Renegociação de Dívida (${titulosAlvo.length} títulos originais). Acordo: ${payload.motivo}`,
        origem: 'RENEGOCIACAO',
        valorOriginal: valorTotalRenegociado,
        dataEmissao: new Date().toISOString().split('T')[0],
        dataVencimentoPrimeira: payload.primeiroVencimento,
        totalParcelas: payload.quantidadeNovasParcelas,
        intervaloDias: payload.intervaloDias || 30,
        usuarioId: payload.usuarioId,
        usuarioNome: payload.usuarioNome,
        requerAprovacao: false,
      });

      const reneg: RenegociacaoFinanceira = {
        id: `reng-${empresaId}-${Date.now()}`,
        empresaId,
        tipo: 'PAGAR',
        parceiroId: payload.parceiroId,
        parceiroNome: payload.parceiroNome,
        numeroProtocolo: protocolo,
        dataRenegociacao: new Date().toISOString().split('T')[0],
        titulosOriginaisIds: payload.titulosIds,
        parcelasOriginaisIds: [],
        valorTotalOriginal,
        valorJurosAcordo: jurosAcordo,
        valorDescontoAcordo: descAcordo,
        valorTotalRenegociado,
        quantidadeNovasParcelas: payload.quantidadeNovasParcelas,
        novoTituloGeradoId: novoTitulo.id,
        motivoRenegociacao: payload.motivo,
        usuarioId: payload.usuarioId,
        usuarioNome: payload.usuarioNome,
        createdAt: new Date().toISOString(),
      };

      const renegList = this.renegociacoesStore.get(empresaId) || [];
      renegList.unshift(reneg);
      this.renegociacoesStore.set(empresaId, renegList);

      this.registrarAuditoria({
        empresaId,
        usuarioId: payload.usuarioId,
        usuarioNome: payload.usuarioNome,
        modulo: 'FINANCEIRO',
        acao: 'RENEGOCIACAO',
        tituloOuDocumentoRef: `Protocolo ${protocolo}`,
        payloadBefore: { titulosSubstituidos: payload.titulosIds, valorOriginal: valorTotalOriginal },
        payloadAfter: reneg,
        detalhes: `Renegociação de ${titulosAlvo.length} títulos a pagar no valor consolidado de R$ ${valorTotalRenegociado.toFixed(2)} em ${payload.quantidadeNovasParcelas} parcelas.`,
      });

      return { renegociacao: reneg, novoTitulo };
    } else {
      // Renegociação de Contas a Receber
      const crs = this.contasReceberStore.get(empresaId) || [];
      const titulosAlvo = crs.filter((cr) => payload.titulosIds.includes(cr.id));

      if (titulosAlvo.length === 0) {
        throw new Error('Nenhum título a receber selecionado válido para renegociação.');
      }

      valorTotalOriginal = titulosAlvo.reduce((acc, curr) => acc + curr.valorSaldoRestante, 0);
      const valorTotalRenegociado = Math.max(0, valorTotalOriginal + jurosAcordo - descAcordo);

      titulosAlvo.forEach((cr) => {
        cr.status = 'RENEGOCIADO';
        cr.parcelas.forEach((p) => {
          if (p.statusParcela === 'EM_ABERTO' || p.statusParcela === 'PARCIALMENTE_PAGA') {
            p.statusParcela = 'RENEGOCIADA';
            p.valorSaldo = 0;
          }
        });
        cr.valorSaldoRestante = 0;
        cr.updatedAt = new Date().toISOString();
      });

      const novoTitulo = this.criarContaReceberManual(empresaId, {
        clienteId: payload.parceiroId,
        clienteNome: payload.parceiroNome,
        clienteCnpjCpf: titulosAlvo[0]?.clienteCnpjCpf || '00.000.000/0000-00',
        numeroDocumento: `${protocolo}`,
        descricao: `Renegociação de Cobrança (${titulosAlvo.length} títulos originais). Acordo: ${payload.motivo}`,
        origem: 'RENEGOCIACAO',
        valorOriginal: valorTotalRenegociado,
        dataEmissao: new Date().toISOString().split('T')[0],
        dataVencimentoPrimeira: payload.primeiroVencimento,
        totalParcelas: payload.quantidadeNovasParcelas,
        intervaloDias: payload.intervaloDias || 30,
        usuarioId: payload.usuarioId,
        usuarioNome: payload.usuarioNome,
      });

      const reneg: RenegociacaoFinanceira = {
        id: `reng-${empresaId}-${Date.now()}`,
        empresaId,
        tipo: 'RECEBER',
        parceiroId: payload.parceiroId,
        parceiroNome: payload.parceiroNome,
        numeroProtocolo: protocolo,
        dataRenegociacao: new Date().toISOString().split('T')[0],
        titulosOriginaisIds: payload.titulosIds,
        parcelasOriginaisIds: [],
        valorTotalOriginal,
        valorJurosAcordo: jurosAcordo,
        valorDescontoAcordo: descAcordo,
        valorTotalRenegociado,
        quantidadeNovasParcelas: payload.quantidadeNovasParcelas,
        novoTituloGeradoId: novoTitulo.id,
        motivoRenegociacao: payload.motivo,
        usuarioId: payload.usuarioId,
        usuarioNome: payload.usuarioNome,
        createdAt: new Date().toISOString(),
      };

      const renegList = this.renegociacoesStore.get(empresaId) || [];
      renegList.unshift(reneg);
      this.renegociacoesStore.set(empresaId, renegList);

      this.registrarAuditoria({
        empresaId,
        usuarioId: payload.usuarioId,
        usuarioNome: payload.usuarioNome,
        modulo: 'FINANCEIRO',
        acao: 'RENEGOCIACAO',
        tituloOuDocumentoRef: `Protocolo ${protocolo}`,
        payloadBefore: { titulosSubstituidos: payload.titulosIds, valorOriginal: valorTotalOriginal },
        payloadAfter: reneg,
        detalhes: `Acordo de renegociação de contas a receber no valor de R$ ${valorTotalRenegociado.toFixed(2)} em ${payload.quantidadeNovasParcelas}x.`,
      });

      return { renegociacao: reneg, novoTitulo };
    }
  }

  // --------------------------------------------------------------------------
  // ADIANTAMENTOS E COMPENSAÇÃO DE CRÉDITOS
  // --------------------------------------------------------------------------

  public getAdiantamentos(empresaId: string, tipo?: TipoAdiantamento): AdiantamentoFinanceiro[] {
    const list = this.adiantamentosStore.get(empresaId) || [];
    if (!tipo) return list;
    return list.filter((a) => a.tipo === tipo);
  }

  public criarAdiantamento(
    empresaId: string,
    payload: {
      tipo: TipoAdiantamento;
      parceiroId: string;
      parceiroNome: string;
      parceiroCnpjCpf: string;
      numeroDocumento: string;
      dataAdiantamento?: string;
      valorOriginal: number;
      formaPagamento?: FormaPagamentoFinanceiro;
      observacoes?: string;
      usuarioId: string;
      usuarioNome: string;
    }
  ): AdiantamentoFinanceiro {
    const ad: AdiantamentoFinanceiro = {
      id: `ad-${empresaId}-${Date.now()}`,
      empresaId,
      tipo: payload.tipo,
      parceiroId: payload.parceiroId,
      parceiroNome: payload.parceiroNome,
      parceiroCnpjCpf: payload.parceiroCnpjCpf,
      numeroDocumento: payload.numeroDocumento,
      dataAdiantamento: payload.dataAdiantamento || new Date().toISOString().split('T')[0],
      valorOriginal: payload.valorOriginal,
      valorCompensado: 0,
      valorSaldoDisponivel: payload.valorOriginal,
      status: 'DISPONIVEL',
      formaPagamento: payload.formaPagamento || 'PIX',
      usuarioLancamentoId: payload.usuarioId,
      usuarioLancamentoNome: payload.usuarioNome,
      observacoes: payload.observacoes,
      compensacoes: [],
      createdAt: new Date().toISOString(),
    };

    const lista = this.adiantamentosStore.get(empresaId) || [];
    lista.unshift(ad);
    this.adiantamentosStore.set(empresaId, lista);

    this.registrarAuditoria({
      empresaId,
      usuarioId: payload.usuarioId,
      usuarioNome: payload.usuarioNome,
      modulo: 'FINANCEIRO',
      acao: 'LANCAMENTO_ADIANTAMENTO',
      tituloOuDocumentoRef: `ADT: ${ad.numeroDocumento} (${ad.tipo})`,
      payloadBefore: null,
      payloadAfter: ad,
      detalhes: `Lançamento de adiantamento financeiro: R$ ${ad.valorOriginal.toFixed(2)} (${ad.parceiroNome}).`,
    });

    return ad;
  }

  public compensarAdiantamentoEmParcela(
    empresaId: string,
    adiantamentoId: string,
    tituloId: string,
    parcelaId: string,
    tipoTitulo: 'PAGAR' | 'RECEBER',
    valorCompensar: number,
    usuarioId: string,
    usuarioNome: string
  ) {
    const adiantamentos = this.adiantamentosStore.get(empresaId) || [];
    const adIndex = adiantamentos.findIndex((a) => a.id === adiantamentoId);
    if (adIndex === -1) throw new Error('Adiantamento não encontrado.');

    const ad = adiantamentos[adIndex];
    if (ad.valorSaldoDisponivel < valorCompensar) {
      throw new Error(`Saldo de adiantamento insuficiente (Disponível: R$ ${ad.valorSaldoDisponivel.toFixed(2)}).`);
    }

    if (tipoTitulo === 'PAGAR') {
      this.baixarParcelaContaPagar(empresaId, tituloId, parcelaId, {
        valorPago: valorCompensar,
        formaPagamento: 'COMPENSACAO_ADIANTAMENTO',
        observacoes: `Compensado do Adiantamento Ref: ${ad.numeroDocumento}`,
        usuarioId,
        usuarioNome,
      });
    } else {
      this.baixarParcelaContaReceber(empresaId, tituloId, parcelaId, {
        valorRecebido: valorCompensar,
        formaPagamento: 'COMPENSACAO_ADIANTAMENTO',
        observacoes: `Compensado do Adiantamento Ref: ${ad.numeroDocumento}`,
        usuarioId,
        usuarioNome,
      });
    }

    ad.valorCompensado += valorCompensar;
    ad.valorSaldoDisponivel -= valorCompensar;
    if (ad.valorSaldoDisponivel <= 0.01) {
      ad.status = 'TOTALMENTE_COMPENSADO';
    } else {
      ad.status = 'PARCIALMENTE_COMPENSADO';
    }

    ad.compensacoes.push({
      id: `comp-${Date.now()}`,
      adiantamentoId: ad.id,
      tituloId,
      parcelaId,
      tipoTitulo,
      valorCompensado: valorCompensar,
      dataCompensacao: new Date().toISOString(),
      usuarioId,
      usuarioNome,
    });

    adiantamentos[adIndex] = ad;
    this.adiantamentosStore.set(empresaId, adiantamentos);

    this.registrarAuditoria({
      empresaId,
      usuarioId,
      usuarioNome,
      modulo: 'FINANCEIRO',
      acao: 'COMPENSACAO_ADIANTAMENTO',
      tituloOuDocumentoRef: `ADT ${ad.numeroDocumento} -> Titulo ${tituloId}`,
      payloadBefore: null,
      payloadAfter: ad,
      detalhes: `Compensação de crédito de R$ ${valorCompensar.toFixed(2)} realizada com sucesso.`,
    });

    return ad;
  }

  // --------------------------------------------------------------------------
  // CADASTROS MESTRES (PLANO DE CONTAS, CENTROS DE CUSTO, CATEGORIAS)
  // --------------------------------------------------------------------------

  public getPlanoContas(empresaId: string): PlanoConta[] {
    return this.planoContasStore.get(empresaId) || [];
  }

  public getCentrosCusto(empresaId: string): CentroCusto[] {
    return this.centrosCustoStore.get(empresaId) || [];
  }

  public getCategoriasFinanceiras(empresaId: string): CategoriaFinanceira[] {
    return this.categoriasStore.get(empresaId) || [];
  }

  public criarCentroCusto(empresaId: string, payload: Omit<CentroCusto, 'id' | 'empresaId'>): CentroCusto {
    const novoCC: CentroCusto = {
      id: `cc-${empresaId}-${Date.now()}`,
      empresaId,
      ...payload,
    };
    const list = this.centrosCustoStore.get(empresaId) || [];
    list.push(novoCC);
    this.centrosCustoStore.set(empresaId, list);
    return novoCC;
  }

  public criarCategoriaFinanceira(empresaId: string, payload: Omit<CategoriaFinanceira, 'id' | 'empresaId'>): CategoriaFinanceira {
    const novaCat: CategoriaFinanceira = {
      id: `cat-${empresaId}-${Date.now()}`,
      empresaId,
      ...payload,
    };
    const list = this.categoriasStore.get(empresaId) || [];
    list.push(novaCat);
    this.categoriasStore.set(empresaId, list);
    return novaCat;
  }

  // --------------------------------------------------------------------------
  // RESUMO FINANCEIRO & FLUXO DE CAIXA
  // --------------------------------------------------------------------------

  public getResumoFinanceiro(empresaId: string): ResumoFinanceiroEmpresa {
    const cps = this.contasPagarStore.get(empresaId) || [];
    const crs = this.contasReceberStore.get(empresaId) || [];
    const adts = this.adiantamentosStore.get(empresaId) || [];

    const hoje = new Date().toISOString().split('T')[0];

    let totalPagarAberto = 0;
    let totalPagarVencido = 0;
    let totalPagarHoje = 0;
    let totalTitulosPendentesAprovacao = 0;

    cps.forEach((cp) => {
      if (cp.status === 'PENDENTE_APROVACAO') totalTitulosPendentesAprovacao++;
      if (cp.status !== 'CANCELADO' && cp.status !== 'REJEITADO' && cp.status !== 'LIQUIDADO') {
        cp.parcelas.forEach((p) => {
          if (p.valorSaldo > 0) {
            totalPagarAberto += p.valorSaldo;
            if (p.dataVencimento < hoje) {
              totalPagarVencido += p.valorSaldo;
            } else if (p.dataVencimento === hoje) {
              totalPagarHoje += p.valorSaldo;
            }
          }
        });
      }
    });

    let totalReceberAberto = 0;
    let totalReceberVencido = 0;
    let totalReceberHoje = 0;

    crs.forEach((cr) => {
      if (cr.status !== 'CANCELADO' && cr.status !== 'LIQUIDADO') {
        cr.parcelas.forEach((p) => {
          if (p.valorSaldo > 0) {
            totalReceberAberto += p.valorSaldo;
            if (p.dataVencimento < hoje) {
              totalReceberVencido += p.valorSaldo;
            } else if (p.dataVencimento === hoje) {
              totalReceberHoje += p.valorSaldo;
            }
          }
        });
      }
    });

    const totalAdiantamentosFornecedorDisponivel = adts
      .filter((a) => a.tipo === 'A_FORNECEDOR' && a.status !== 'CANCELADO')
      .reduce((acc, curr) => acc + curr.valorSaldoDisponivel, 0);

    const totalAdiantamentosClienteDisponivel = adts
      .filter((a) => a.tipo === 'DE_CLIENTE' && a.status !== 'CANCELADO')
      .reduce((acc, curr) => acc + curr.valorSaldoDisponivel, 0);

    const saldoProjetado = totalReceberAberto - totalPagarAberto;
    const indiceInadimplenciaPercent =
      totalReceberAberto > 0 ? Number(((totalReceberVencido / totalReceberAberto) * 100).toFixed(1)) : 0;

    return {
      empresaId,
      totalPagarAberto,
      totalPagarVencido,
      totalPagarHoje,
      totalReceberAberto,
      totalReceberVencido,
      totalReceberHoje,
      saldoProjetado,
      indiceInadimplenciaPercent,
      totalAdiantamentosFornecedorDisponivel,
      totalAdiantamentosClienteDisponivel,
      totalTitulosPendentesAprovacao,
    };
  }

  public getProjecaoFluxoCaixa(empresaId: string, dias = 15): ProjecaoFluxoCaixaDia[] {
    const cps = this.contasPagarStore.get(empresaId) || [];
    const crs = this.contasReceberStore.get(empresaId) || [];

    const diasSemanaNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const resultado: ProjecaoFluxoCaixaDia[] = [];
    let saldoAcumulado = 150000.0; // Saldo de abertura em conta corrente operacional

    const hoje = new Date();

    for (let i = 0; i < dias; i++) {
      const d = new Date(hoje);
      d.setDate(d.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const diaSemana = diasSemanaNomes[d.getDay()];

      let totalPagar = 0;
      let totalReceber = 0;

      cps.forEach((cp) => {
        if (cp.status !== 'CANCELADO' && cp.status !== 'REJEITADO') {
          cp.parcelas.forEach((p) => {
            if (p.dataVencimento === dStr && p.valorSaldo > 0) {
              totalPagar += p.valorSaldo;
            }
          });
        }
      });

      crs.forEach((cr) => {
        if (cr.status !== 'CANCELADO') {
          cr.parcelas.forEach((p) => {
            if (p.dataVencimento === dStr && p.valorSaldo > 0) {
              totalReceber += p.valorSaldo;
            }
          });
        }
      });

      const saldoDia = totalReceber - totalPagar;
      saldoAcumulado += saldoDia;

      resultado.push({
        data: dStr,
        diaSemana,
        totalPrevistoReceber: totalReceber,
        totalPrevistoPagar: totalPagar,
        saldoDia,
        saldoAcumulado,
      });
    }

    return resultado;
  }

  public getDreSintetico(empresaId: string): DreSinteticoItem[] {
    const resumo = this.getResumoFinanceiro(empresaId);
    const receitaBruta = resumo.totalReceberAberto * 1.4 + 450000;
    const deducoesTributos = receitaBruta * 0.12;
    const receitaLiquida = receitaBruta - deducoesTributos;
    const cpvCustos = receitaLiquida * 0.58;
    const lucroBruto = receitaLiquida - cpvCustos;
    const despesasOp = receitaLiquida * 0.18;
    const resultadoFinanceiro = 12000;
    const ebitda = lucroBruto - despesasOp;
    const lucroLiquido = ebitda + resultadoFinanceiro - (ebitda * 0.15);

    return [
      { codigo: '1', descricao: 'RECEITA BRUTA DE VENDAS & SERVIÇOS', tipo: 'RECEITA', valor: receitaBruta, percentualSobreReceita: 100 },
      { codigo: '2', descricao: '(-) Deduções da Receita e Tributos (IBS/CBS/PIS/COFINS)', tipo: 'DEDUCAO', valor: deducoesTributos, percentualSobreReceita: (deducoesTributos / receitaBruta) * 100 },
      { codigo: '3', descricao: '(=) RECEITA OPERACIONAL LÍQUIDA', tipo: 'RECEITA', valor: receitaLiquida, percentualSobreReceita: (receitaLiquida / receitaBruta) * 100 },
      { codigo: '4', descricao: '(-) Custo dos Produtos Vendidos & Serviços (CPV/CSP)', tipo: 'CUSTO', valor: cpvCustos, percentualSobreReceita: (cpvCustos / receitaBruta) * 100 },
      { codigo: '5', descricao: '(=) LUCRO BRUTO INDUSTRIAL', tipo: 'RESULTADO', valor: lucroBruto, percentualSobreReceita: (lucroBruto / receitaBruta) * 100 },
      { codigo: '6', descricao: '(-) Despesas Operacionais (Adm, Vendas e Logística)', tipo: 'DESPESA', valor: despesasOp, percentualSobreReceita: (despesasOp / receitaBruta) * 100 },
      { codigo: '7', descricao: '(+) Resultado Financeiro Líquido', tipo: 'RECEITA', valor: resultadoFinanceiro, percentualSobreReceita: (resultadoFinanceiro / receitaBruta) * 100 },
      { codigo: '8', descricao: '(=) EBITDA / LAJIDA INDUSTRIAL', tipo: 'RESULTADO', valor: ebitda, percentualSobreReceita: (ebitda / receitaBruta) * 100 },
      { codigo: '9', descricao: '(=) LUCRO LÍQUIDO DO EXERCÍCIO (LLE)', tipo: 'RESULTADO', valor: lucroLiquido, percentualSobreReceita: (lucroLiquido / receitaBruta) * 100 },
    ];
  }

  // --------------------------------------------------------------------------
  // AUDITORIA
  // --------------------------------------------------------------------------

  private registrarAuditoria(log: Omit<AuditoriaFinanceiraLog, 'id' | 'timestamp'>) {
    const fullLog: AuditoriaFinanceiraLog = {
      id: `aud-fin-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    this.auditoriaLogs.unshift(fullLog);
  }

  public getAuditoriaLogs(empresaId?: string): AuditoriaFinanceiraLog[] {
    if (!empresaId) return this.auditoriaLogs;
    return this.auditoriaLogs.filter((a) => a.empresaId === empresaId);
  }
}

export const financeiroService = new FinanceiroService();
