'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  TrendingUp,
  Layers,
  ArrowRightLeft,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  PieChart as PieChartIcon,
  BarChart3,
  Sliders,
  Filter,
  FileSpreadsheet,
  FileText,
  Download,
  Plus,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Boxes,
  Landmark,
  Eye,
  Check,
  X,
  Lock,
  Sparkles,
} from 'lucide-react';
import {
  ConsolidacaoService,
  GRUPO_EMPRESAS_FIXAS,
} from '../../../backend/modules/consolidacao/consolidacao-service';
import {
  TipoTransacaoIntercompany,
  StatusReconciliacao,
  TransacaoIntercompanyRecord,
  FiltroConsolidacao,
  RegraEliminacaoConfig,
} from '../../../backend/modules/consolidacao/consolidacao-types';
import { EmpresaRecord } from '../../../backend/modules/multi-tenant/types';

interface ConsolidacaoViewerProps {
  empresaAtiva: EmpresaRecord;
}

export function ConsolidacaoViewer({ empresaAtiva }: ConsolidacaoViewerProps) {
  const service = useMemo(() => ConsolidacaoService.getInstance(), []);

  // Sub-abas de relatórios
  const [activeReportTab, setActiveReportTab] = useState<
    | 'visao_grupo'
    | 'faturamento_empresa'
    | 'resultado_dre'
    | 'intercompany_eliminar'
    | 'rateios_csc'
    | 'exposicao_clientes'
    | 'estoque_empresa'
    | 'caixa_empresa'
  >('visao_grupo');

  // Filtros
  const [competencia, setCompetencia] = useState<string>('2026-08');
  const [empresasSelecionadas, setEmpresasSelecionadas] = useState<string[]>(
    GRUPO_EMPRESAS_FIXAS.map(e => e.id)
  );
  const [filtroTipoIntercompany, setFiltroTipoIntercompany] = useState<string>('TODOS');
  const [filtroStatusReconciliacao, setFiltroStatusReconciliacao] = useState<string>('TODOS');
  const [apenasDivergentes, setApenasDivergentes] = useState<boolean>(false);
  const [filtroSegmentoCliente, setFiltroSegmentoCliente] = useState<string>('TODOS');
  const [apenasClientesRisco, setApenasClientesRisco] = useState<boolean>(false);

  // Estado de configuração das regras de eliminação
  const [regrasState, setRegrasState] = useState<RegraEliminacaoConfig[]>(() =>
    service.getRegras()
  );
  const [showConfigRegrasModal, setShowConfigRegrasModal] = useState<boolean>(false);
  const [showNovaTransacaoModal, setShowNovaTransacaoModal] = useState<boolean>(false);
  const [feedbackMensagem, setFeedbackMensagem] = useState<string | null>(null);

  // Formulário de Nova Transação Intercompany
  const [novaTransacao, setNovaTransacao] = useState<{
    tipo: TipoTransacaoIntercompany;
    empresaOrigemId: string;
    empresaDestinoId: string;
    documentoRef: string;
    cfop: string;
    dataEmissao: string;
    dataCompetencia: string;
    descricao: string;
    categoria: string;
    valorBruto: number;
    custoOrigem: number;
    margemLucroEmbutida: number;
    statusReconciliacao: StatusReconciliacao;
  }>({
    tipo: 'VENDA_MERCANTIL',
    empresaOrigemId: '22222222-2222-2222-2222-222222222222',
    empresaDestinoId: '44444444-4444-4444-4444-444444444444',
    documentoRef: 'NF-e 004210/1',
    cfop: '5.151',
    dataEmissao: '2026-08-26',
    dataCompetencia: '2026-08',
    descricao: 'Fornecimento de Tubos Redondos Aço Carbono Schedule 40',
    categoria: 'Matéria-Prima Aço',
    valorBruto: 45000.0,
    custoOrigem: 38000.0,
    margemLucroEmbutida: 7000.0,
    statusReconciliacao: 'CONCILIADO',
  });

  // Toggle de Regra de Eliminação
  const handleToggleRegra = (regraId: string, atualAtivo: boolean) => {
    service.toggleRegra(regraId, !atualAtivo);
    setRegrasState(service.getRegras());
    setFeedbackMensagem('Regra de eliminação atualizada! Relatórios recalculados dinamicamente.');
    setTimeout(() => setFeedbackMensagem(null), 4000);
  };

  // Toggle de seleção de empresa no filtro
  const handleToggleEmpresaFiltro = (empId: string) => {
    if (empresasSelecionadas.includes(empId)) {
      if (empresasSelecionadas.length > 1) {
        setEmpresasSelecionadas(empresasSelecionadas.filter(id => id !== empId));
      }
    } else {
      setEmpresasSelecionadas([...empresasSelecionadas, empId]);
    }
  };

  const handleSelectAllEmpresas = () => {
    setEmpresasSelecionadas(GRUPO_EMPRESAS_FIXAS.map(e => e.id));
  };

  // Reconciliar Transação
  const handleReconciliar = (txId: string) => {
    const success = service.reconciliarTransacao(txId, 'Auditoria Central Grupo TRITECH');
    if (success) {
      setFeedbackMensagem(`Transação ${txId} reconciliada e validada com sucesso!`);
      setTimeout(() => setFeedbackMensagem(null), 4000);
    }
  };

  // Salvar Nova Transação
  const handleSalvarNovaTransacao = (e: React.FormEvent) => {
    e.preventDefault();
    const orig = GRUPO_EMPRESAS_FIXAS.find(x => x.id === novaTransacao.empresaOrigemId);
    const dest = GRUPO_EMPRESAS_FIXAS.find(x => x.id === novaTransacao.empresaDestinoId);

    if (novaTransacao.empresaOrigemId === novaTransacao.empresaDestinoId) {
      alert('A empresa de origem e destino não podem ser a mesma.');
      return;
    }

    const valorLiquido = novaTransacao.valorBruto * 0.88;
    const percMargem =
      novaTransacao.valorBruto > 0
        ? (novaTransacao.margemLucroEmbutida / novaTransacao.valorBruto) * 100
        : 0;

    service.adicionarTransacao({
      tipo: novaTransacao.tipo,
      empresaOrigemId: novaTransacao.empresaOrigemId,
      empresaOrigemCodigo: orig?.codigo || 'EMPRESA',
      empresaOrigemNome: orig?.nomeFantasia || 'Empresa Origem',
      empresaDestinoId: novaTransacao.empresaDestinoId,
      empresaDestinoCodigo: dest?.codigo || 'EMPRESA',
      empresaDestinoNome: dest?.nomeFantasia || 'Empresa Destino',
      documentoRef: novaTransacao.documentoRef,
      cfop: novaTransacao.cfop,
      dataEmissao: novaTransacao.dataEmissao,
      dataCompetencia: novaTransacao.dataCompetencia,
      descricao: novaTransacao.descricao,
      categoria: novaTransacao.categoria,
      valorBruto: novaTransacao.valorBruto,
      valorDeducoesImpostos: novaTransacao.valorBruto * 0.12,
      valorLiquido: valorLiquido,
      custoOrigem: novaTransacao.custoOrigem,
      margemLucroEmbutida: novaTransacao.margemLucroEmbutida,
      percentualMargem: percMargem,
      statusReconciliacao: novaTransacao.statusReconciliacao,
      valorLancadoDestino:
        novaTransacao.statusReconciliacao === 'CONCILIADO' ? novaTransacao.valorBruto : 0,
      divergenciaValor:
        novaTransacao.statusReconciliacao === 'CONCILIADO' ? 0 : novaTransacao.valorBruto,
      eliminavel: true,
      statusEliminacao: 'A_ELIMINAR',
    });

    setShowNovaTransacaoModal(false);
    setFeedbackMensagem('Nova transação intercompany registrada e processada para consolidação!');
    setTimeout(() => setFeedbackMensagem(null), 4000);
  };

  // Dados calculados para relatórios
  const filtroParam: FiltroConsolidacao = {
    competencia,
    empresasIds: empresasSelecionadas,
    tiposOperacao:
      filtroTipoIntercompany === 'TODOS'
        ? []
        : [filtroTipoIntercompany as TipoTransacaoIntercompany],
    statusReconciliacao: filtroStatusReconciliacao,
    regrasAtivas: {},
    apenasDivergentes,
  };

  const resumo = useMemo(
    () => service.getResumoConsolidacao(filtroParam),
    [service, filtroParam, regrasState]
  );
  const faturamentos = useMemo(
    () => service.getFaturamentoPorEmpresa(filtroParam),
    [service, filtroParam, regrasState]
  );
  const dreLinhas = useMemo(
    () => service.getDreConsolidado(filtroParam),
    [service, filtroParam, regrasState]
  );
  const transacoesIntercompany = useMemo(
    () => service.getTransacoes(filtroParam),
    [service, filtroParam, regrasState]
  );
  const rateiosCsc = useMemo(
    () => service.getRateios(competencia),
    [service, competencia]
  );
  const exposicoesClientes = useMemo(
    () => service.getExposicoesClientes(filtroSegmentoCliente, apenasClientesRisco),
    [service, filtroSegmentoCliente, apenasClientesRisco]
  );
  const estoquesEmpresa = useMemo(() => service.getEstoquePorEmpresa(), [service]);
  const caixasEmpresa = useMemo(() => service.getCaixaPorEmpresa(), [service]);

  // Exportação simulada
  const handleExport = (tipo: 'PDF' | 'EXCEL' | 'CSV') => {
    setFeedbackMensagem(`Exportando relatório consolidado em formato ${tipo}... Download pronto.`);
    setTimeout(() => setFeedbackMensagem(null), 4000);
  };

  return (
    <div className="space-y-6" id="modulo-consolidacao-container">
      {/* Toast Feedback */}
      {feedbackMensagem && (
        <div className="bg-indigo-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between border border-indigo-700 animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-300 animate-spin-slow" />
            <span className="text-sm font-medium">{feedbackMensagem}</span>
          </div>
          <button
            onClick={() => setFeedbackMensagem(null)}
            className="text-indigo-300 hover:text-white text-xs font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Principal */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-lg shadow-xs">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Consolidação das 5 Empresas & Intercompany
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    5 CNPJs Ativos
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Eliminações Ativas
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consolidação contábil e gerencial do Grupo TRITECH com identificação e eliminação
                  automática de operações entre partes relacionadas.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowConfigRegrasModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-2 transition-colors shadow-2xs"
            >
              <Sliders className="w-4 h-4" />
              Regras de Eliminação ({regrasState.filter(r => r.ativo).length}/{regrasState.length})
            </button>

            <button
              onClick={() => setShowNovaTransacaoModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              Nova Operação Intercompany
            </button>

            <div className="relative group">
              <button className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-2 transition-colors shadow-2xs">
                <Download className="w-4 h-4 text-slate-600" />
                Exportar Consolidado
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>
              <div className="hidden group-hover:block absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30">
                <button
                  onClick={() => handleExport('PDF')}
                  className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-red-600" />
                  Relatório Executivo (PDF)
                </button>
                <button
                  onClick={() => handleExport('EXCEL')}
                  className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  Planilha de Consolidação (XLSX)
                </button>
                <button
                  onClick={() => handleExport('CSV')}
                  className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  Exportar CSV Contábil
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Cards Macro de Consolidação */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Soma Bruta Combinada
            </span>
            <div className="text-base font-extrabold text-slate-900 mt-1">
              R$ {resumo.faturamentoBrutoCombinado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500">5 CNPJs agregados</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
              (-) Eliminações Intercompany
            </span>
            <div className="text-base font-extrabold text-amber-800 mt-1">
              -R$ {resumo.faturamentoIntercompanyEliminado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-amber-600 font-medium">
              {resumo.percentualEliminacaoFaturamento.toFixed(1)}% do faturamento bruto
            </span>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block">
              (=) Consolidado Real
            </span>
            <div className="text-base font-extrabold text-indigo-900 mt-1">
              R$ {resumo.faturamentoConsolidadoTerceiros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-indigo-600 font-medium">Apenas terceiros de mercado</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
              EBITDA Consolidado
            </span>
            <div className="text-base font-extrabold text-emerald-900 mt-1">
              R$ {resumo.ebitdaConsolidado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">
              Margem {resumo.margemEbitdaConsolidada.toFixed(1)}%
            </span>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider block">
              Lucro Líquido Real
            </span>
            <div className="text-base font-extrabold text-teal-900 mt-1">
              R$ {resumo.lucroLiquidoConsolidado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-teal-600 font-medium">
              Margem {resumo.margemLiquidaConsolidada.toFixed(1)}%
            </span>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider block">
              Reconciliação Intercompany
            </span>
            <div className="text-base font-extrabold text-purple-900 mt-1">
              {resumo.transacoesConciliadas}/{resumo.transacoesIntercompanyTotal} Casadas
            </div>
            <div className="flex items-center gap-1 text-[10px] font-medium text-purple-700 mt-0.5">
              {resumo.transacoesDivergentes > 0 ? (
                <span className="text-amber-700 flex items-center gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                  {resumo.transacoesDivergentes} divergente(s)
                </span>
              ) : (
                <span className="text-emerald-700 flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  100% Conciliado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Barra de Filtros Integrada */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              Empresas na Consolidação:
            </span>
            {GRUPO_EMPRESAS_FIXAS.map(emp => {
              const isSelected = empresasSelecionadas.includes(emp.id);
              return (
                <button
                  key={emp.id}
                  onClick={() => handleToggleEmpresaFiltro(emp.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                  title={`${emp.razaoSocial} (${emp.cnpj})`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isSelected ? '#FFFFFF' : emp.cor }}
                  />
                  {emp.nomeFantasia}
                  {isSelected && <Check className="w-3 h-3" />}
                </button>
              );
            })}
            <button
              onClick={handleSelectAllEmpresas}
              className="text-xs text-indigo-600 hover:underline font-semibold ml-1"
            >
              (Selecionar Todas)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Competência:</span>
            <select
              value={competencia}
              onChange={e => setCompetencia(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
            >
              <option value="2026-08">Agosto / 2026 (Mês Vigente)</option>
              <option value="2026-07">Julho / 2026</option>
              <option value="2026-06">Junho / 2026</option>
              <option value="TODOS">Ano 2026 Consolidado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navegação de Sub-Relatórios */}
      <div className="bg-white border-b border-slate-200 rounded-t-xl px-4 pt-2 shadow-2xs">
        <div className="flex overflow-x-auto gap-1 scrollbar-none">
          <button
            onClick={() => setActiveReportTab('visao_grupo')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap border-b-2 ${
              activeReportTab === 'visao_grupo'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            1. Visão Grupo & Consolidado Real
          </button>

          <button
            onClick={() => setActiveReportTab('faturamento_empresa')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap border-b-2 ${
              activeReportTab === 'faturamento_empresa'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            2. Faturamento por Empresa
          </button>

          <button
            onClick={() => setActiveReportTab('resultado_dre')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap border-b-2 ${
              activeReportTab === 'resultado_dre'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            3. Resultado por Empresa (DRE)
          </button>

          <button
            onClick={() => setActiveReportTab('intercompany_eliminar')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap border-b-2 ${
              activeReportTab === 'intercompany_eliminar'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            4. Intercompany a Eliminar ({transacoesIntercompany.length})
          </button>

          <button
            onClick={() => setActiveReportTab('rateios_csc')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap border-b-2 ${
              activeReportTab === 'rateios_csc'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <PieChartIcon className="w-4 h-4" />
            5. Rateios CSC Corporativo
          </button>

          <button
            onClick={() => setActiveReportTab('exposicao_clientes')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap border-b-2 ${
              activeReportTab === 'exposicao_clientes'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            6. Exposição de Clientes no Grupo
          </button>

          <button
            onClick={() => setActiveReportTab('estoque_empresa')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap border-b-2 ${
              activeReportTab === 'estoque_empresa'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Boxes className="w-4 h-4" />
            7. Estoque por Empresa
          </button>

          <button
            onClick={() => setActiveReportTab('caixa_empresa')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap border-b-2 ${
              activeReportTab === 'caixa_empresa'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Landmark className="w-4 h-4" />
            8. Caixa & Mútuos por Empresa
          </button>
        </div>
      </div>

      {/* ==========================================
          SUB-ABA 1: VISÃO GRUPO & CONSOLIDADO REAL
          ========================================== */}
      {activeReportTab === 'visao_grupo' && (
        <div className="space-y-6">
          {/* Card Explicativo da Eliminação */}
          <div className="bg-linear-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm border border-indigo-800">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-lg shrink-0 border border-indigo-400/30">
                <Info className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Princípio de Consolidação Gerencial do Grupo TRITECH
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O relatório consolidado <strong>NÃO é uma simples soma aritmética</strong> das 5 empresas. Para evitar duplicação contábil artificial e inflação de faturamento, todas as vendas mercantis de insumos (ex: Oliveira & Amorim vendendo aço para Tritech Corte e Tritech Industrial), prestação de serviços de usinagem/laser (Tritech Corte para Senagro) e projetos de engenharia (MWAM para as outras unidades) são <strong>identificadas, cruzadas e eliminadas contra o custo correspondente na adquirente</strong>.
                </p>
                <div className="flex flex-wrap gap-4 pt-1 text-xs">
                  <span className="text-emerald-300 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Faturamento Externo Efetivo: R$ {resumo.faturamentoConsolidadoTerceiros.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-amber-300 flex items-center gap-1 font-semibold">
                    <ArrowRightLeft className="w-3.5 h-3.5" /> Operações Internas Eliminadas: R$ {resumo.faturamentoIntercompanyEliminado.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-indigo-300 flex items-center gap-1 font-semibold">
                    <Sliders className="w-3.5 h-3.5" /> Margem em Estoque Expurgada: R$ {resumo.lucroEstoqueEliminado.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico Visual Comparativo: Faturamento Bruto vs Intercompany vs Terceiros */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Composição de Faturamento por Unidade (Terceiros vs Intercompany)
            </h3>
            <div className="space-y-4">
              {faturamentos.map(f => {
                const percTerceiros = (f.faturamentoMercadoTerceiros / f.faturamentoBrutoTotal) * 100;
                const percIntercompany = (f.totalIntercompany / f.faturamentoBrutoTotal) * 100;
                return (
                  <div key={f.empresaId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <span>{f.empresaNome}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          (Total Bruto: R$ {f.faturamentoBrutoTotal.toLocaleString('pt-BR')})
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="text-indigo-700">
                          Terceiros: R$ {f.faturamentoMercadoTerceiros.toLocaleString('pt-BR')} ({percTerceiros.toFixed(1)}%)
                        </span>
                        {f.totalIntercompany > 0 && (
                          <span className="text-amber-700">
                            Intercompany: R$ {f.totalIntercompany.toLocaleString('pt-BR')} ({percIntercompany.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Barra bi-color */}
                    <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${percTerceiros}%` }}
                        className="bg-indigo-600 h-full transition-all"
                        title={`Terceiros: R$ ${f.faturamentoMercadoTerceiros.toLocaleString('pt-BR')}`}
                      />
                      {f.totalIntercompany > 0 && (
                        <div
                          style={{ width: `${percIntercompany}%` }}
                          className="bg-amber-500 h-full transition-all"
                          title={`Intercompany: R$ ${f.totalIntercompany.toLocaleString('pt-BR')}`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-6 mt-4 pt-3 border-t border-slate-100 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-indigo-600 rounded-xs" />
                Venda Efetiva para Mercado / Terceiros
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-amber-500 rounded-xs" />
                Operações Intercompany (Eliminadas)
              </span>
            </div>
          </div>

          {/* DRE Consolidado Completo - Tabela com Colunas por Empresa + Eliminações + Consolidado */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  DRE Gerencial Consolidado do Grupo TRITECH (Visão Multiempresa)
                </h3>
                <p className="text-xs text-slate-500">
                  Valores individuais por CNPJ, soma combinada bruta, eliminações intercompany parametrizadas e resultado consolidado real.
                </p>
              </div>
              <button
                onClick={() => handleExport('EXCEL')}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Exportar DRE (XLSX)
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-2.5 px-3 min-w-[200px]">Conta / Descrição</th>
                    {GRUPO_EMPRESAS_FIXAS.map(emp => (
                      <th key={emp.id} className="py-2.5 px-2 text-right min-w-[110px]">
                        {emp.codigo}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-right bg-slate-200 text-slate-900 min-w-[130px]">
                      Soma Combinada
                    </th>
                    <th className="py-2.5 px-3 text-right bg-amber-100 text-amber-900 min-w-[130px]">
                      (-) Eliminações
                    </th>
                    <th className="py-2.5 px-3 text-right bg-indigo-600 text-white font-extrabold min-w-[140px]">
                      (=) Consolidado Real
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dreLinhas.map(linha => {
                    const isTotal = linha.destaque;
                    return (
                      <tr
                        key={linha.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          isTotal ? 'bg-slate-50 font-bold text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono text-slate-600 font-semibold">
                              {linha.contaCodigo}
                            </span>
                            <span className={isTotal ? 'font-bold' : ''}>{linha.descricao}</span>
                          </div>
                          {linha.detalheEliminacoes && (
                            <span className="text-[10px] text-amber-900 font-medium block mt-0.5">
                              • {linha.detalheEliminacoes}
                            </span>
                          )}
                        </td>
                        {GRUPO_EMPRESAS_FIXAS.map(emp => {
                          const val = linha.valoresPorEmpresa[emp.id] || 0;
                          return (
                            <td
                              key={emp.id}
                              className={`py-2.5 px-2 text-right font-mono ${
                                val < 0 ? 'text-red-600' : 'text-slate-800'
                              }`}
                            >
                              {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 text-right font-mono font-bold bg-slate-100/70 text-slate-900">
                          {linha.somaBrutaCombinada.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold bg-amber-50 text-amber-800">
                          {linha.eliminacoesIntercompany !== 0
                            ? linha.eliminacoesIntercompany.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                              })
                            : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold bg-indigo-50 text-indigo-900">
                          {linha.consolidadoGrupo.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SUB-ABA 2: FATURAMENTO POR EMPRESA
          ========================================== */}
      {activeReportTab === 'faturamento_empresa' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Relatório: Faturamento Bruto vs Intercompany vs Mercado de Terceiros
                </h3>
                <p className="text-xs text-slate-500">
                  Segregação exata de faturamento por empresa com dedução de vendas e serviços prestados a outras empresas do grupo.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-3">Empresa (CNPJ)</th>
                    <th className="py-3 px-3 text-right">Faturamento Bruto Total</th>
                    <th className="py-3 px-3 text-right text-amber-700">(-) Vendas Intercompany</th>
                    <th className="py-3 px-3 text-right text-amber-700">(-) Serviços Intercompany</th>
                    <th className="py-3 px-3 text-right font-extrabold text-indigo-700 bg-indigo-50">
                      (=) Vendas Terceiros (Mercado)
                    </th>
                    <th className="py-3 px-3 text-right">Margem Bruta Terceiros</th>
                    <th className="py-3 px-3 text-right font-bold text-slate-900">Share no Grupo (%)</th>
                    <th className="py-3 px-3 text-right">Ticket Médio</th>
                    <th className="py-3 px-3 text-right">Pedidos Terceiros</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {faturamentos.map(item => (
                    <tr key={item.empresaId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                GRUPO_EMPRESAS_FIXAS.find(e => e.id === item.empresaId)?.cor || '#6366F1',
                            }}
                          />
                          <div>
                            <div>{item.empresaNome}</div>
                            <span className="text-[10px] text-slate-600 font-medium">
                              {GRUPO_EMPRESAS_FIXAS.find(e => e.id === item.empresaId)?.cnpj}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                        R$ {item.faturamentoBrutoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-700">
                        {item.vendasIntercompany > 0
                          ? `-R$ ${item.vendasIntercompany.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-700">
                        {item.servicosIntercompany > 0
                          ? `-R$ ${item.servicosIntercompany.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-indigo-900 bg-indigo-50/70">
                        R$ {item.faturamentoMercadoTerceiros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700">
                        {item.margemBrutaTerceirosPerc.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{item.shareFaturamentoGrupoPerc.toFixed(1)}%</span>
                          <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${item.shareFaturamentoGrupoPerc}%` }}
                              className="h-full bg-indigo-600"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        R$ {item.ticketMedioTerceiros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {item.volumePedidosTerceiros} pedidos
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-extrabold border-t-2 border-slate-300 text-slate-900">
                    <td className="py-3 px-3">TOTAL CONSOLIDADO</td>
                    <td className="py-3 px-3 text-right font-mono">
                      R$ {resumo.faturamentoBrutoCombinado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-amber-800" colSpan={2}>
                      -R$ {resumo.faturamentoIntercompanyEliminado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-indigo-900 bg-indigo-100">
                      R$ {resumo.faturamentoConsolidadoTerceiros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-800">
                      33.4% Médio
                    </td>
                    <td className="py-3 px-3 text-right font-mono">100.0%</td>
                    <td className="py-3 px-3 text-right font-mono" colSpan={2}>
                      338 Pedidos no Mercado
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SUB-ABA 3: RESULTADO POR EMPRESA (DRE)
          ========================================== */}
      {activeReportTab === 'resultado_dre' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              DRE Gerencial Individualizado por Empresa vs Consolidado Líquido
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Análise comparativa das margens de contribuição, EBITDA e Lucro Líquido gerados por cada empresa individual e o impacto das eliminações intercompany no resultado global.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              {GRUPO_EMPRESAS_FIXAS.map(emp => {
                const fat = faturamentos.find(f => f.empresaId === emp.id);
                return (
                  <div
                    key={emp.id}
                    className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: emp.cor }} />
                      <span className="font-bold text-xs text-slate-900">{emp.codigo}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">{emp.nomeFantasia}</div>
                    <div className="mt-3 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Fat. Terceiros:</span>
                        <span className="font-bold text-slate-800 font-mono">
                          R$ {(fat?.faturamentoMercadoTerceiros || 0).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Intercompany:</span>
                        <span className="font-semibold text-amber-700 font-mono">
                          R$ {(fat?.totalIntercompany || 0).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-700 font-bold">Margem Bruta:</span>
                        <span className="font-bold text-emerald-700 font-mono">
                          {fat?.margemBrutaTerceirosPerc}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tabela Resumo dos Indicadores de Resultado */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-2.5 px-3">Indicador Financeiro</th>
                    {GRUPO_EMPRESAS_FIXAS.map(emp => (
                      <th key={emp.id} className="py-2.5 px-3 text-right">
                        {emp.nomeFantasia}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-right bg-indigo-600 text-white font-extrabold">
                      Consolidado Grupo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {dreLinhas
                    .filter(d => d.destaque)
                    .map(linha => (
                      <tr key={linha.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-900">
                          {linha.descricao}
                        </td>
                        {GRUPO_EMPRESAS_FIXAS.map(emp => {
                          const val = linha.valoresPorEmpresa[emp.id] || 0;
                          return (
                            <td key={emp.id} className="py-2.5 px-3 text-right font-semibold text-slate-800">
                              R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 text-right font-extrabold bg-indigo-50 text-indigo-900">
                          R$ {linha.consolidadoGrupo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SUB-ABA 4: INTERCOMPANY A ELIMINAR
          ========================================== */}
      {activeReportTab === 'intercompany_eliminar' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Painel de Reconciliação & Eliminação de Partes Relacionadas
                </h3>
                <p className="text-xs text-slate-500">
                  Rastreabilidade ponta a ponta de vendas, serviços, rateios CSC, transferências de materiais e mútuos entre as 5 empresas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filtroTipoIntercompany}
                  onChange={e => setFiltroTipoIntercompany(e.target.value)}
                  className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-800"
                >
                  <option value="TODOS">Todos os Tipos de Operação</option>
                  <option value="VENDA_MERCANTIL">Venda Mercantil de Insumos</option>
                  <option value="PRESTACAO_SERVICO">Prestação de Serviços / Laser / Eng</option>
                  <option value="RATEIO_CSC">Rateios CSC Corporativo</option>
                  <option value="TRANSFERENCIA_ESTOQUE">Transferência de Estoque / Sobras</option>
                  <option value="MUTUO_FINANCEIRO">Mútuo Financeiro Intercompany</option>
                </select>

                <select
                  value={filtroStatusReconciliacao}
                  onChange={e => setFiltroStatusReconciliacao(e.target.value)}
                  className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-800"
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="CONCILIADO">Conciliadas / Casadas</option>
                  <option value="DIVERGENTE">Com Divergência</option>
                  <option value="PENDENTE">Pendentes</option>
                </select>

                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={apenasDivergentes}
                    onChange={e => setApenasDivergentes(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Apenas Divergentes / Pendentes
                </label>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-2.5 px-3">Código / Doc</th>
                    <th className="py-2.5 px-3">Tipo / CFOP</th>
                    <th className="py-2.5 px-3">Origem ➔ Destino</th>
                    <th className="py-2.5 px-3">Descrição da Operação</th>
                    <th className="py-2.5 px-3 text-right">Valor Origem</th>
                    <th className="py-2.5 px-3 text-right">Valor Destino</th>
                    <th className="py-2.5 px-3 text-right">Margem Embutida</th>
                    <th className="py-2.5 px-3 text-center">Status Conciliação</th>
                    <th className="py-2.5 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {transacoesIntercompany.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{tx.documentoRef}</div>
                        <span className="text-[10px] text-slate-500 font-mono">{tx.id}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            tx.tipo === 'VENDA_MERCANTIL'
                              ? 'bg-blue-100 text-blue-800'
                              : tx.tipo === 'PRESTACAO_SERVICO'
                              ? 'bg-purple-100 text-purple-800'
                              : tx.tipo === 'RATEIO_CSC'
                              ? 'bg-amber-100 text-amber-800'
                              : tx.tipo === 'TRANSFERENCIA_ESTOQUE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {tx.tipo.replace('_', ' ')}
                        </span>
                        {tx.cfop && (
                          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                            CFOP {tx.cfop}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-indigo-700">{tx.empresaOrigemCodigo}</span>
                          <span className="text-slate-400">➔</span>
                          <span className="font-bold text-emerald-700">{tx.empresaDestinoCodigo}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{tx.dataEmissao}</span>
                      </td>
                      <td className="py-3 px-3 max-w-[240px]">
                        <div className="truncate font-medium text-slate-800" title={tx.descricao}>
                          {tx.descricao}
                        </div>
                        <span className="text-[10px] text-slate-500">{tx.categoria}</span>
                        {tx.motivoDivergencia && (
                          <div className="text-[10px] text-amber-800 font-semibold mt-0.5 bg-amber-50 p-1 rounded-sm border border-amber-200">
                            ⚠ {tx.motivoDivergencia}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        R$ {tx.valorBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-800">
                        {tx.valorLancadoDestino > 0
                          ? `R$ ${tx.valorLancadoDestino.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {tx.margemLucroEmbutida > 0 ? (
                          <div>
                            <span className="font-semibold text-emerald-700">
                              R$ {tx.margemLucroEmbutida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-600 block font-medium">
                              ({tx.percentualMargem.toFixed(1)}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">0.0%</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {tx.statusReconciliacao === 'CONCILIADO' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Casado
                          </span>
                        ) : tx.statusReconciliacao === 'DIVERGENTE' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" /> Divergente (R$ {tx.divergenciaValor.toLocaleString('pt-BR')})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {tx.statusReconciliacao !== 'CONCILIADO' ? (
                          <button
                            onClick={() => handleReconciliar(tx.id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-2xs"
                          >
                            Reconciliar
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-semibold">Validado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SUB-ABA 5: RATEIOS CSC
          ========================================== */}
      {activeReportTab === 'rateios_csc' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Rateios do Centro de Serviços Compartilhados (CSC Corporativo)
                </h3>
                <p className="text-xs text-slate-500">
                  Distribuição de custos comuns (TI, Infraestrutura, Jurídico, RH Corporativo) entre as 5 empresas do Grupo TRITECH.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {rateiosCsc.map(rat => (
                <div key={rat.id} className="border border-slate-200 rounded-xl p-5 bg-slate-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{rat.departamentoOrigem}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          Critério: {rat.criterioRateio.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{rat.descricao}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500">Total Rateado:</span>
                      <div className="text-base font-extrabold text-indigo-900 font-mono">
                        R$ {rat.valorTotalRateado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {rat.distribuicao.map(dist => (
                      <div
                        key={dist.empresaId}
                        className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs"
                      >
                        <div className="font-bold text-xs text-slate-900 mb-1">{dist.empresaNome}</div>
                        <div className="text-sm font-extrabold text-slate-800 font-mono">
                          R$ {dist.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 pt-1 border-t border-slate-100">
                          <span>{dist.percentual}% share</span>
                          <span className="truncate max-w-[90px]" title={dist.baseCalculoDescricao}>
                            {dist.baseCalculoDescricao}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SUB-ABA 6: EXPOSIÇÃO DE CLIENTES NO GRUPO
          ========================================== */}
      {activeReportTab === 'exposicao_clientes' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Exposição de Clientes no Grupo (Limite Corporativo Global)
                </h3>
                <p className="text-xs text-slate-500">
                  Visão agregada de risco de crédito para clientes atendidos simultaneamente por múltiplos CNPJs do grupo.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={filtroSegmentoCliente}
                  onChange={e => setFiltroSegmentoCliente(e.target.value)}
                  className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-800"
                >
                  <option value="TODOS">Todos os Segmentos</option>
                  <option value="Agro">Agroindustrial / Sucroalcooleiro</option>
                  <option value="Montadora">Montadoras OEM</option>
                  <option value="Mineração">Mineração / Infraestrutura</option>
                  <option value="Implementos">Implementos Rodoviários</option>
                </select>

                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={apenasClientesRisco}
                    onChange={e => setApenasClientesRisco(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Apenas Clientes com Alerta / Inadimplência
                </label>
              </div>
            </div>

            <div className="space-y-4">
              {exposicoesClientes.map(cli => (
                <div
                  key={cli.clienteId}
                  className={`border rounded-xl p-4 transition-all ${
                    cli.statusLimite === 'LIMITE_ESTOURADO'
                      ? 'border-red-300 bg-red-50/40'
                      : cli.statusLimite === 'ALERTA_80'
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{cli.razaoSocial}</span>
                        <span className="text-xs text-slate-500 font-mono">({cli.cnpj})</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {cli.segmento}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          {cli.empresasComOperacao} CNPJs Ativos
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Score / Rating:</span>
                        <span className="font-bold text-slate-900">
                          {cli.scoreCreditoGrupo} pts ({cli.ratingRisco})
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px]">Limite Global Aprovado:</span>
                        <span className="font-bold text-slate-900 font-mono">
                          R$ {cli.limiteCreditoGlobalAprovado.toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block text-[10px]">Exposição Total Grupo:</span>
                        <span
                          className={`font-extrabold font-mono ${
                            cli.statusLimite === 'LIMITE_ESTOURADO'
                              ? 'text-red-700'
                              : cli.statusLimite === 'ALERTA_80'
                              ? 'text-amber-700'
                              : 'text-indigo-700'
                          }`}
                        >
                          R$ {cli.exposicaoTotalGrupo.toLocaleString('pt-BR')} ({cli.percentualUtilizacaoGlobal.toFixed(1)}%)
                        </span>
                      </div>

                      {cli.titulosVencidosTotal > 0 && (
                        <div>
                          <span className="text-red-600 block text-[10px] font-bold">Vencidos Total:</span>
                          <span className="font-extrabold text-red-700 font-mono">
                            R$ {cli.titulosVencidosTotal.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detalhe da Exposição em Cada Empresa */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    {cli.posicaoPorEmpresa.map(pos => (
                      <div
                        key={pos.empresaId}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs"
                      >
                        <div className="flex justify-between items-center font-bold text-slate-800 mb-1">
                          <span>{pos.empresaNome}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-xs font-semibold ${
                              pos.statusCreditoNaEmpresa === 'LIBERADO'
                                ? 'bg-emerald-100 text-emerald-800'
                                : pos.statusCreditoNaEmpresa === 'ALERTA'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {pos.statusCreditoNaEmpresa}
                          </span>
                        </div>
                        <div className="space-y-0.5 text-[11px] font-mono">
                          <div className="flex justify-between text-slate-600">
                            <span>Saldo Aberto:</span>
                            <span className="font-semibold text-slate-900">
                              R$ {pos.saldoAberto.toLocaleString('pt-BR')}
                            </span>
                          </div>
                          {pos.saldoVencido > 0 && (
                            <div className="flex justify-between text-red-600 font-bold">
                              <span>Vencido ({pos.diasMaiorAtraso}d):</span>
                              <span>R$ {pos.saldoVencido.toLocaleString('pt-BR')}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-slate-500">
                            <span>Pedidos Carteira:</span>
                            <span>R$ {pos.pedidosEmCarteira.toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SUB-ABA 7: ESTOQUE POR EMPRESA
          ========================================== */}
      {activeReportTab === 'estoque_empresa' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Estoque Físico e Financeiro por Empresa & Expurgo de Lucro Não Realizado
                </h3>
                <p className="text-xs text-slate-500">
                  Posição consolidada de matérias-primas, produtos em processo, estoque em trânsito e eliminação de margem agregada entre empresas.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-3">Empresa</th>
                    <th className="py-3 px-3 text-right">Matéria-Prima</th>
                    <th className="py-3 px-3 text-right">Em Processo</th>
                    <th className="py-3 px-3 text-right">Produto Acabado</th>
                    <th className="py-3 px-3 text-right text-indigo-700">Trânsito Intercompany</th>
                    <th className="py-3 px-3 text-right font-bold text-slate-900">Estoque Bruto Total</th>
                    <th className="py-3 px-3 text-right text-amber-700 font-bold bg-amber-50">
                      (-) Margem Não Realizada
                    </th>
                    <th className="py-3 px-3 text-right font-extrabold text-emerald-800 bg-emerald-50">
                      (=) Estoque Consolidado Líquido
                    </th>
                    <th className="py-3 px-3 text-right">Giro (Dias)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {estoquesEmpresa.map(est => (
                    <tr key={est.empresaId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-sans font-bold text-slate-900">
                        {est.empresaNome}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-800">
                        R$ {est.materiaPrimaValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-800">
                        R$ {est.emProcessoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-800">
                        R$ {est.produtoAcabadoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-indigo-700">
                        {est.estoqueTransitoIntercompanyValor > 0
                          ? `R$ ${est.estoqueTransitoIntercompanyValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        R$ {est.totalEstoqueBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-amber-700 bg-amber-50/70">
                        {est.margemIntercompanyNaoRealizada > 0
                          ? `-R$ ${est.margemIntercompanyNaoRealizada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-emerald-900 bg-emerald-50">
                        R$ {est.totalEstoqueConsolidadoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-sans text-slate-700">
                        {est.giroEstoqueDias} dias
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-extrabold border-t-2 border-slate-300 text-slate-900 font-mono">
                    <td className="py-3 px-3 font-sans">TOTAL CONSOLIDADO GRUPO</td>
                    <td className="py-3 px-3 text-right" colSpan={4}>
                      Estoque Bruto Total das 5 Unidades
                    </td>
                    <td className="py-3 px-3 text-right">
                      R$ {resumo.estoqueBrutoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right text-amber-800 bg-amber-100">
                      -R$ {resumo.lucroEstoqueEliminado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-900 bg-emerald-100">
                      R$ {resumo.estoqueLiquidoConsolidado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-sans">51 Dias Médio</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SUB-ABA 8: CAIXA POR EMPRESA & MÚTUOS
          ========================================== */}
      {activeReportTab === 'caixa_empresa' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Posição Consolidada de Caixa, Aplicações & Mútuos Intercompany
                </h3>
                <p className="text-xs text-slate-500">
                  Disponibilidade financeira em bancos, aplicações de liquidez diária e conciliação de saldos de mútuos/créditos mútuos entre os 5 CNPJs.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-3">Empresa</th>
                    <th className="py-3 px-3 text-right">Contas Correntes</th>
                    <th className="py-3 px-3 text-right">Aplicações CDI</th>
                    <th className="py-3 px-3 text-right font-bold text-slate-900">Caixa Disponível Real</th>
                    <th className="py-3 px-3 text-right text-emerald-700">Mútuo a Receber</th>
                    <th className="py-3 px-3 text-right text-red-700">Mútuo a Pagar</th>
                    <th className="py-3 px-3 text-right font-bold">Saldo Mútuo Líquido</th>
                    <th className="py-3 px-3 text-right text-indigo-700">Fluxo Projetado 30d</th>
                    <th className="py-3 px-3 text-right">Liquidez Seca</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {caixasEmpresa.map(c => (
                    <tr key={c.empresaId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-sans font-bold text-slate-900">{c.empresaNome}</td>
                      <td className="py-3 px-3 text-right text-slate-800">
                        R$ {c.saldoBancosContaCorrente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-800">
                        R$ {c.saldoAplicacoesLiquidez.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-indigo-900 bg-indigo-50/50">
                        R$ {c.caixaDisponivelEfetivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-700">
                        {c.saldoMutuoReceberIntercompany > 0
                          ? `R$ ${c.saldoMutuoReceberIntercompany.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '-'}
                      </td>
                      <td className="py-3 px-3 text-right text-red-700">
                        {c.saldoMutuoPagarIntercompany > 0
                          ? `R$ ${c.saldoMutuoPagarIntercompany.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '-'}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-bold ${
                          c.saldoMutuoLiquido >= 0 ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {c.saldoMutuoLiquido !== 0
                          ? `R$ ${c.saldoMutuoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : 'R$ 0,00'}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-indigo-700">
                        +R$ {c.projecaoFluxo30d.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-sans text-slate-700 font-semibold">
                        {c.indiceLiquidezSeca.toFixed(2)}x
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-extrabold border-t-2 border-slate-300 text-slate-900 font-mono">
                    <td className="py-3 px-3 font-sans">TOTAL CONSOLIDADO GRUPO</td>
                    <td className="py-3 px-3 text-right" colSpan={2}>
                      Disponibilidade Total do Grupo TRITECH
                    </td>
                    <td className="py-3 px-3 text-right text-indigo-900 bg-indigo-100 font-extrabold">
                      R$ {resumo.caixaDisponivelTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-800">
                      R$ {resumo.mutuosIntercompanyTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right text-red-800">
                      -R$ {resumo.mutuosIntercompanyTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-800">R$ 0,00 (Zero Líquido)</td>
                    <td className="py-3 px-3 text-right text-indigo-800">+R$ 1.785.000,00</td>
                    <td className="py-3 px-3 text-right font-sans">1.43x Médio</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: CONFIGURAÇÃO DE REGRAS DE ELIMINAÇÃO
          ========================================== */}
      {showConfigRegrasModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Parametrização de Regras de Eliminação Gerencial</h3>
              </div>
              <button
                onClick={() => setShowConfigRegrasModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <p className="text-xs text-slate-600">
                Ative ou desative regras de eliminação contábil para simular cenários de consolidação bruta vs líquida do Grupo TRITECH:
              </p>

              <div className="space-y-3">
                {regrasState.map(regra => (
                  <div
                    key={regra.id}
                    className={`border rounded-lg p-4 transition-all ${
                      regra.ativo ? 'border-indigo-300 bg-indigo-50/40' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{regra.nome}</span>
                          <span className="text-[10px] font-mono bg-slate-200 px-1.5 py-0.5 rounded-sm text-slate-700">
                            {regra.codigo}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{regra.descricao}</p>
                        <p className="text-[11px] text-indigo-700 font-medium pt-1">
                          📌 {regra.observacaoContabil}
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggleRegra(regra.id, regra.ativo)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all shrink-0 ${
                          regra.ativo
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {regra.ativo ? 'Ativa (Eliminando)' : 'Desativada (Somando)'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowConfigRegrasModal(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
              >
                Concluir Parametrização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: NOVA TRANSAÇÃO INTERCOMPANY
          ========================================== */}
      {showNovaTransacaoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-5 bg-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ArrowRightLeft className="w-5 h-5 text-indigo-300" />
                <h3 className="font-bold text-sm">Lançar Nova Operação Intercompany</h3>
              </div>
              <button
                onClick={() => setShowNovaTransacaoModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarNovaTransacao} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Operação:
                  </label>
                  <select
                    value={novaTransacao.tipo}
                    onChange={e =>
                      setNovaTransacao({
                        ...novaTransacao,
                        tipo: e.target.value as TipoTransacaoIntercompany,
                      })
                    }
                    className="w-full text-xs border border-slate-300 rounded-md p-2"
                  >
                    <option value="VENDA_MERCANTIL">Venda Mercantil de Insumos (NF-e)</option>
                    <option value="PRESTACAO_SERVICO">Prestação de Serviços / Laser (NFS-e)</option>
                    <option value="RATEIO_CSC">Rateio CSC Corporativo</option>
                    <option value="TRANSFERENCIA_ESTOQUE">Transferência de Estoque (CFOP 5.152)</option>
                    <option value="MUTUO_FINANCEIRO">Mútuo Financeiro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Documento / NF-e:
                  </label>
                  <input
                    type="text"
                    required
                    value={novaTransacao.documentoRef}
                    onChange={e =>
                      setNovaTransacao({ ...novaTransacao, documentoRef: e.target.value })
                    }
                    className="w-full text-xs border border-slate-300 rounded-md p-2"
                    placeholder="NF-e 004210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Empresa Origem (Emissora):
                  </label>
                  <select
                    value={novaTransacao.empresaOrigemId}
                    onChange={e =>
                      setNovaTransacao({ ...novaTransacao, empresaOrigemId: e.target.value })
                    }
                    className="w-full text-xs border border-slate-300 rounded-md p-2"
                  >
                    {GRUPO_EMPRESAS_FIXAS.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nomeFantasia} ({emp.codigo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Empresa Destino (Tomadora):
                  </label>
                  <select
                    value={novaTransacao.empresaDestinoId}
                    onChange={e =>
                      setNovaTransacao({ ...novaTransacao, empresaDestinoId: e.target.value })
                    }
                    className="w-full text-xs border border-slate-300 rounded-md p-2"
                  >
                    {GRUPO_EMPRESAS_FIXAS.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nomeFantasia} ({emp.codigo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição da Operação:
                </label>
                <input
                  type="text"
                  required
                  value={novaTransacao.descricao}
                  onChange={e => setNovaTransacao({ ...novaTransacao, descricao: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-md p-2"
                  placeholder="Ex: Fornecimento de Perfis I para Estruturas Metálicas"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Valor Bruto (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={novaTransacao.valorBruto}
                    onChange={e =>
                      setNovaTransacao({
                        ...novaTransacao,
                        valorBruto: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full text-xs border border-slate-300 rounded-md p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Custo Origem (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={novaTransacao.custoOrigem}
                    onChange={e =>
                      setNovaTransacao({
                        ...novaTransacao,
                        custoOrigem: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full text-xs border border-slate-300 rounded-md p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Margem Embutida (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={novaTransacao.margemLucroEmbutida}
                    onChange={e =>
                      setNovaTransacao({
                        ...novaTransacao,
                        margemLucroEmbutida: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full text-xs border border-slate-300 rounded-md p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CFOP:</label>
                  <input
                    type="text"
                    value={novaTransacao.cfop}
                    onChange={e => setNovaTransacao({ ...novaTransacao, cfop: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-md p-2 font-mono"
                    placeholder="5.151 / 6.151 / 5.152"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Reconciliação:
                  </label>
                  <select
                    value={novaTransacao.statusReconciliacao}
                    onChange={e =>
                      setNovaTransacao({
                        ...novaTransacao,
                        statusReconciliacao: e.target.value as StatusReconciliacao,
                      })
                    }
                    className="w-full text-xs border border-slate-300 rounded-md p-2"
                  >
                    <option value="CONCILIADO">Conciliado / Casado</option>
                    <option value="PENDENTE">Pendente de Entrada no Destino</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNovaTransacaoModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
                >
                  Gravar Operação Intercompany
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
