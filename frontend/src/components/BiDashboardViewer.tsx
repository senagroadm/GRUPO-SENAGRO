// frontend/src/components/BiDashboardViewer.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Factory,
  DollarSign,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Download,
  RefreshCw,
  Layers,
  ChevronRight,
  Filter,
  ShieldCheck,
  Building2,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  Target,
  Sparkles,
  Info,
  Maximize2,
  Search,
  ExternalLink,
  ChevronDown,
  Percent,
  Check,
  X,
} from 'lucide-react';
import { Empresa, EMPRESAS_GRUPO } from '@/backend/core/types/company';
import {
  DashboardGrupoData,
  DashboardEmpresaData,
  DashboardIndustrialData,
  DashboardComercialData,
  DashboardFinanceiroData,
  DrillDownGrupo,
  DrillDownEmpresa,
  DrillDownSetor,
  DrillDownCliente,
  DrillDownPedido,
  DrillDownItem,
  IndicadorDefinicao,
  MetaIndicador,
  BiAlerta,
  BiDashboardConfig,
  KpiCardItem,
} from '@/backend/modules/bi/bi-types';
import { biAnalyticsService } from '@/backend/modules/bi/bi-service';

interface BiDashboardViewerProps {
  empresaAtiva: Empresa;
}

export function BiDashboardViewer({ empresaAtiva }: BiDashboardViewerProps) {
  // Abas principais do BI
  const [activeTab, setActiveTab] = useState<
    | 'dashboard_grupo'
    | 'dashboard_empresa'
    | 'dashboard_industrial'
    | 'dashboard_comercial'
    | 'dashboard_financeiro'
    | 'drilldown'
    | 'metas_indicadores'
    | 'alertas'
    | 'configuracoes'
  >('dashboard_grupo');

  // Estados dos dados de BI
  const [dashGrupo, setDashGrupo] = useState<DashboardGrupoData | null>(null);
  const [dashEmpresa, setDashEmpresa] = useState<DashboardEmpresaData | null>(null);
  const [dashIndustrial, setDashIndustrial] = useState<DashboardIndustrialData | null>(null);
  const [dashComercial, setDashComercial] = useState<DashboardComercialData | null>(null);
  const [dashFinanceiro, setDashFinanceiro] = useState<DashboardFinanceiroData | null>(null);
  const [drillDownData, setDrillDownData] = useState<DrillDownGrupo | null>(null);
  const [indicadores, setIndicadores] = useState<IndicadorDefinicao[]>([]);
  const [metas, setMetas] = useState<MetaIndicador[]>([]);
  const [alertas, setAlertas] = useState<BiAlerta[]>([]);
  const [config, setConfig] = useState<BiDashboardConfig | null>(null);

  // Estados do Drill-Down Hierárquico (6 níveis)
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('');
  const [selectedSetorId, setSelectedSetorId] = useState<string>('');
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [selectedPedidoId, setSelectedPedidoId] = useState<string>('');

  // Modais e Feedback
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('2026-08');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportResult, setExportResult] = useState<any>(null);

  // Nova Meta Modal
  const [showNovaMetaModal, setShowNovaMetaModal] = useState(false);
  const [formMetaIndicadorId, setFormMetaIndicadorId] = useState<string>('');
  const [formMetaValor, setFormMetaValor] = useState<number>(0);
  const [formMetaAmarelo, setFormMetaAmarelo] = useState<number>(0);
  const [formMetaVermelho, setFormMetaVermelho] = useState<number>(0);
  const [formMetaEscopo, setFormMetaEscopo] = useState<string>('GRUPO');

  const carregarDados = useCallback(() => {
    try {
      setIsRefreshing(true);
      const grp = biAnalyticsService.getDashboardGrupo();
      const emp = biAnalyticsService.getDashboardEmpresa(empresaAtiva.id);
      const ind = biAnalyticsService.getDashboardIndustrial(empresaAtiva.id);
      const com = biAnalyticsService.getDashboardComercial(empresaAtiva.id);
      const fin = biAnalyticsService.getDashboardFinanceiro(empresaAtiva.id);
      const dd = biAnalyticsService.getDrillDownCompleto();
      const inds = biAnalyticsService.getIndicadoresCatalogo();
      const mts = biAnalyticsService.getMetas(empresaAtiva.id);
      const alts = biAnalyticsService.getAlertas(empresaAtiva.id);
      const cfg = biAnalyticsService.getConfigDashboard('GRUPO');

      setDashGrupo(grp);
      setDashEmpresa(emp);
      setDashIndustrial(ind);
      setDashComercial(com);
      setDashFinanceiro(fin);
      setDrillDownData(dd);
      setIndicadores(inds);
      setMetas(mts);
      setAlertas(alts);
      setConfig(cfg);

      if (inds.length > 0 && !formMetaIndicadorId) {
        setFormMetaIndicadorId(inds[0].id);
      }

      // Inicializa seleções do Drill-Down
      if (dd && dd.empresas.length > 0) {
        const emp0 = dd.empresas.find((e) => e.id === empresaAtiva.id) || dd.empresas[0];
        setSelectedEmpresaId(emp0.id);
        if (emp0.setores.length > 0) {
          setSelectedSetorId(emp0.setores[0].id);
          if (emp0.setores[0].clientes.length > 0) {
            setSelectedClienteId(emp0.setores[0].clientes[0].id);
            if (emp0.setores[0].clientes[0].pedidos.length > 0) {
              setSelectedPedidoId(emp0.setores[0].clientes[0].pedidos[0].id);
            }
          }
        }
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  }, [empresaAtiva.id, formMetaIndicadorId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarDados();
    }, 0);
    return () => clearTimeout(timer);
  }, [carregarDados]);

  const showMsg = (tipo: 'sucesso' | 'erro', msg: string) => {
    setFeedback({ tipo, msg });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleSalvarNovaMeta = () => {
    if (!formMetaIndicadorId || formMetaValor <= 0) {
      showMsg('erro', 'Selecione o indicador e informe um valor alvo válido.');
      return;
    }
    const ind = indicadores.find((i) => i.id === formMetaIndicadorId);
    biAnalyticsService.salvarMeta({
      indicadorId: formMetaIndicadorId,
      indicadorCodigo: ind?.codigo || 'METRICA',
      empresaId: formMetaEscopo,
      ano: 2026,
      valorAlvo: formMetaValor,
      limiteAlertaAmarelo: formMetaAmarelo || formMetaValor * 0.9,
      limiteCriticoVermelho: formMetaVermelho || formMetaValor * 0.8,
      responsavelNome: 'Controladoria BI',
    });
    showMsg('sucesso', 'Meta parametrizada com sucesso.');
    setShowNovaMetaModal(false);
    carregarDados();
  };

  const handleReconhecerAlerta = (alertaId: string) => {
    biAnalyticsService.reconhecerAlerta(alertaId, 'Gestor BI Industrial');
    showMsg('sucesso', 'Alerta reconhecido e arquivado na trilha de auditoria.');
    carregarDados();
  };

  const handleExportar = (formato: 'PDF' | 'EXCEL' | 'CSV') => {
    const res = biAnalyticsService.exportarRelatorioExecutivo(
      formato,
      activeTab,
      activeTab === 'dashboard_grupo' ? 'GRUPO_TRITECH' : empresaAtiva.nomeFantasia
    );
    setExportResult(res);
    showMsg('sucesso', `Relatório executivo ${formato} gerado: ${res.nomeArquivo}`);
  };

  // Objetos selecionados no Drill-Down
  const currentEmpresa = drillDownData?.empresas.find((e) => e.id === selectedEmpresaId) || drillDownData?.empresas[0];
  const currentSetor = currentEmpresa?.setores.find((s) => s.id === selectedSetorId) || currentEmpresa?.setores[0];
  const currentCliente = currentSetor?.clientes.find((c) => c.id === selectedClienteId) || currentSetor?.clientes[0];
  const currentPedido = currentCliente?.pedidos.find((p) => p.id === selectedPedidoId) || currentCliente?.pedidos[0];

  return (
    <div className="space-y-6" id="bi-dashboard-viewer-root">
      {/* Top Header com Identificação & Ações Rápidas */}
      <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-indigo-50 text-indigo-700 rounded-md">
            <BarChart3 className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">BI & Indicadores Industriais Consolidados</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                5 CNPJs Grupo TRITECH
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Contexto Ativo:{' '}
              <strong className="text-slate-800">{empresaAtiva.nomeFantasia}</strong> ({empresaAtiva.cnpj}) • Período: Agosto/2026
            </p>
          </div>
        </div>

        {/* Controles de Período e Ações */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="2026-08">Mês Atual (Agosto/2026)</option>
              <option value="2026-Q3">3º Trimestre 2026 (YTD)</option>
              <option value="2026-ANO">Ano Fechado 2026</option>
            </select>
          </div>

          <button
            id="btn-bi-refresh"
            onClick={carregarDados}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          <button
            id="btn-bi-exportar"
            onClick={() => setExportModalOpen(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-md text-xs font-medium flex items-center justify-between ${
            feedback.tipo === 'sucesso'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.tipo === 'sucesso' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* Navegação de Abas do BI */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-medium">
        {[
          { id: 'dashboard_grupo', label: 'Dashboard do Grupo (10 KPIs)', icon: Building2 },
          { id: 'dashboard_empresa', label: `Dashboard Empresa (${empresaAtiva.codigo})`, icon: Layers },
          { id: 'dashboard_industrial', label: 'Dashboard Industrial (OEE)', icon: Factory },
          { id: 'dashboard_comercial', label: 'Dashboard Comercial & Funil', icon: Briefcase },
          { id: 'dashboard_financeiro', label: 'Dashboard Financeiro & Caixa', icon: DollarSign },
          { id: 'drilldown', label: 'Drill-Down Analítico (6 Níveis)', icon: ChevronRight },
          { id: 'metas_indicadores', label: `Metas & Indicadores (${metas.length})`, icon: Target },
          { id: 'alertas', label: `Central de Alertas (${alertas.filter((a) => !a.reconhecido).length})`, icon: AlertTriangle },
          { id: 'configuracoes', label: 'Configurações & Painéis', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-bi-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2.5 rounded-md flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 1. DASHBOARD DO GRUPO (10 INDICADORES MACRO CONSOLIDADOS) */}
      {/* ========================================================= */}
      {activeTab === 'dashboard_grupo' && dashGrupo && (
        <div className="space-y-6">
          {/* Grid de 10 KPIs Principais do Grupo */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            {dashGrupo.kpis.map((kpi) => (
              <div key={kpi.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{kpi.titulo}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        kpi.status === 'NORMAL' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {kpi.status}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-slate-900 mt-2">
                    {kpi.unidade === 'BRL'
                      ? `R$ ${(kpi.valor / 1000).toFixed(0)}k`
                      : kpi.unidade === 'PERCENTUAL'
                      ? `${kpi.valor.toFixed(1)}%`
                      : `${kpi.valor} un`}
                  </p>
                  {kpi.meta && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Meta:{' '}
                      <strong className="text-slate-600">
                        {kpi.unidade === 'BRL' ? `R$ ${(kpi.meta / 1000).toFixed(0)}k` : `${kpi.meta}%`}
                      </strong>
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 truncate" title={kpi.descricaoAjuda}>
                    {kpi.descricaoAjuda}
                  </span>
                  {kpi.variacaoPeriodoAnterior !== undefined && (
                    <span
                      className={`font-semibold flex items-center gap-0.5 ${
                        kpi.variacaoPeriodoAnterior >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {kpi.variacaoPeriodoAnterior >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(kpi.variacaoPeriodoAnterior)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Consolidação por Empresa do Grupo TRITECH */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Consolidação de Desempenho por Empresa do Grupo</h3>
                <p className="text-xs text-slate-500">Distribuição de receita, margem, caixa, OEE, inadimplência e OTIF nos 5 CNPJs</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700">
                Total Consolidado: R$ {(dashGrupo.faturamentoConsolidado / 1000000).toFixed(2)}M
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Código / Empresa</th>
                    <th className="p-3 text-right">Faturamento (R$)</th>
                    <th className="p-3 text-center">Share (%)</th>
                    <th className="p-3 text-right">Margem (%)</th>
                    <th className="p-3 text-right">Saldo Caixa</th>
                    <th className="p-3 text-center">OEE Fabril</th>
                    <th className="p-3 text-center">Inadimplência</th>
                    <th className="p-3 text-center">OTIF Entregas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashGrupo.distribuicaoEmpresas.map((item) => (
                    <tr key={item.empresaId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <strong className="text-slate-900 block">{item.nomeFantasia}</strong>
                        <span className="font-mono text-[10px] text-slate-400">{item.empresaCodigo}</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        R$ {item.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-semibold text-slate-700">{item.shareFaturamento}%</span>
                          <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${item.shareFaturamento * 2}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right font-semibold text-slate-800">{item.margemLucro}%</td>
                      <td className="p-3 text-right font-mono text-emerald-700 font-bold">
                        R$ {item.caixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            item.oee >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.oee}%
                        </span>
                      </td>
                      <td className="p-3 text-center font-semibold">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            item.inadimplencia <= 2.0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.inadimplencia}%
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-indigo-700">{item.otif}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gráfico de Evolução Mensal Consolidada (Últimos 6 Meses) */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Evolução Mensal do Faturamento vs Meta & Custo Operacional</h3>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              {dashGrupo.evolucaoMensalConsolidada.map((mes, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-slate-900">{mes.mes}</strong>
                    <span className="text-[10px] font-bold text-indigo-700">{mes.margem}% mrg</span>
                  </div>
                  <p className="text-xs font-mono font-bold text-slate-800">R$ {(mes.faturamento / 1000000).toFixed(2)}M</p>
                  <div className="text-[10px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-200">
                    <div className="flex justify-between">
                      <span>Meta:</span>
                      <strong>R$ {(mes.metaFaturamento / 1000000).toFixed(2)}M</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Resultado:</span>
                      <strong className="text-emerald-700">R$ {(mes.resultado / 1000).toFixed(0)}k</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. DASHBOARD DA EMPRESA (FILTRADO PELO CONTEXTO ATIVO)    */}
      {/* ========================================================= */}
      {activeTab === 'dashboard_empresa' && dashEmpresa && (
        <div className="space-y-6">
          {/* Top KPIs da Empresa */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5">
            {dashEmpresa.kpis.map((kpi) => (
              <div key={kpi.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">{kpi.titulo}</span>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {kpi.unidade === 'BRL'
                    ? `R$ ${(kpi.valor / 1000).toFixed(0)}k`
                    : `${kpi.valor.toFixed(1)}%`}
                </p>
                <span
                  className={`mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    kpi.status === 'NORMAL' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {kpi.status}
                </span>
              </div>
            ))}
          </div>

          {/* DRE Sintético & Desempenho por Setor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DRE Gerencial Sintético */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">DRE Gerencial Sintético</h3>
                <span className="text-xs text-slate-500 font-medium">Competência 08/2026</span>
              </div>

              <div className="space-y-2 text-xs divide-y divide-slate-100">
                <div className="flex justify-between py-1.5">
                  <span className="font-semibold text-slate-800">(+) Receita Operacional Bruta</span>
                  <strong className="font-mono text-slate-900">R$ {dashEmpresa.dreSintetico.receitaBruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className="flex justify-between py-1.5 text-rose-700">
                  <span>(-) Deduções e Impostos sobre Vendas (11.5%)</span>
                  <span className="font-mono">- R$ {dashEmpresa.dreSintetico.deducoesImpostos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-1.5 font-bold text-slate-900 bg-slate-50 px-2 rounded">
                  <span>(=) Receita Operacional Líquida</span>
                  <span className="font-mono">R$ {dashEmpresa.dreSintetico.receitaLiquida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-1.5 text-rose-700">
                  <span>(-) Custo dos Produtos Vendidos (CPV)</span>
                  <span className="font-mono">- R$ {dashEmpresa.dreSintetico.custosProdutosVendidos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-1.5 font-semibold text-indigo-900">
                  <span>(=) Lucro Bruto Industrial ({dashEmpresa.dreSintetico.margemBrutaPercentual}%)</span>
                  <span className="font-mono">R$ {dashEmpresa.dreSintetico.lucroBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-1.5 text-slate-600">
                  <span>(-) Despesas Operacionais / Administrativas</span>
                  <span className="font-mono">- R$ {dashEmpresa.dreSintetico.despesasOperacionais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-1.5 font-bold text-slate-900 bg-indigo-50 px-2 rounded text-indigo-900">
                  <span>(=) EBITDA Operacional ({dashEmpresa.dreSintetico.margemEbitdaPercentual}%)</span>
                  <span className="font-mono">R$ {dashEmpresa.dreSintetico.ebitda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-1.5 font-bold text-emerald-800 bg-emerald-50 px-2 rounded text-sm">
                  <span>(=) Lucro Líquido do Exercício ({dashEmpresa.dreSintetico.margemLiquidaPercentual}%)</span>
                  <span className="font-mono">R$ {dashEmpresa.dreSintetico.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Desempenho por Setor Industrial */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Eficiência e Horas Apontadas por Setor</h3>
              <div className="space-y-3">
                {dashEmpresa.desempenhoSetores.map((setor) => (
                  <div key={setor.setorId} className="p-3.5 bg-slate-50 rounded-md border border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <strong className="text-slate-900">{setor.setorNome}</strong>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-bold rounded text-[10px]">
                        OEE: {setor.eficienciaMedia}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 mt-2">
                      <div>
                        <span>Horas Apontadas:</span>
                        <strong className="block text-slate-800">{setor.horasApontadas}h</strong>
                      </div>
                      <div>
                        <span>Volume Peças:</span>
                        <strong className="block text-slate-800">{setor.volumeProduzido} un</strong>
                      </div>
                      <div>
                        <span>Custo Absorvido:</span>
                        <strong className="block text-slate-900">R$ {(setor.custoSetor / 1000).toFixed(0)}k</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. DASHBOARD INDUSTRIAL (OEE, PRODUÇÃO, PARADAS, REFUGO)  */}
      {/* ========================================================= */}
      {activeTab === 'dashboard_industrial' && dashIndustrial && (
        <div className="space-y-6">
          {/* Decomposição do OEE Geral */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">OEE Fabril Geral & Fatores Componentes</h3>
                <p className="text-xs text-slate-500">Disponibilidade (D) × Performance (P) × Qualidade (Q)</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-indigo-600">{dashIndustrial.oeeGeral.oee}%</span>
                <span className="text-xs text-slate-400 block">Meta: {dashIndustrial.oeeGeral.metaOee}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-semibold text-slate-600 block">Disponibilidade (D)</span>
                <p className="text-xl font-bold text-slate-900 mt-1">{dashIndustrial.oeeGeral.disponibilidade}%</p>
                <p className="text-[11px] text-slate-500 mt-1">Tempo em operação real / Tempo planejado</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-semibold text-slate-600 block">Performance (P)</span>
                <p className="text-xl font-bold text-slate-900 mt-1">{dashIndustrial.oeeGeral.performance}%</p>
                <p className="text-[11px] text-slate-500 mt-1">Velocidade real vs velocidade padrão de ciclo</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-semibold text-slate-600 block">Qualidade (Q)</span>
                <p className="text-xl font-bold text-emerald-700 mt-1">{dashIndustrial.oeeGeral.qualidade}%</p>
                <p className="text-[11px] text-slate-500 mt-1">Peças conformes na 1ª passagem (FTY)</p>
              </div>
            </div>
          </div>

          {/* Paradas de Produção & Pareto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Pareto de Paradas de Produção (Tempo & Ocorrências)</h3>
              <div className="space-y-3">
                {dashIndustrial.paradasProducao.map((parada, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">{parada.motivo}</strong>
                      <span className="font-mono font-bold text-rose-700">{parada.tempoMinutos} min</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>Categoria: {parada.categoria}</span>
                      <span>{parada.ocorrenciasQtd} paradas ({parada.percentualTempoTotal}% do tempo)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div className="bg-rose-600 h-1.5 rounded-full" style={{ width: `${parada.percentualTempoTotal * 2}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Refugo, Retrabalho & Custos */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Perdas Industriais: Refugo & Retrabalho</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-md text-xs">
                  <span className="font-semibold text-rose-900 block">Refugo Total</span>
                  <p className="text-lg font-bold text-rose-700 mt-1">
                    {dashIndustrial.refugoRetrabalho.totalPecasRefugadas} peças ({dashIndustrial.refugoRetrabalho.taxaRefugoPercentual}%)
                  </p>
                  <span className="text-[11px] font-mono text-rose-800">
                    Custo: R$ {dashIndustrial.refugoRetrabalho.custoTotalRefugo.toFixed(2)}
                  </span>
                </div>

                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-md text-xs">
                  <span className="font-semibold text-amber-900 block">Retrabalho Total</span>
                  <p className="text-lg font-bold text-amber-700 mt-1">
                    {dashIndustrial.refugoRetrabalho.totalHorasRetrabalho}h ({dashIndustrial.refugoRetrabalho.taxaRetrabalhoPercentual}%)
                  </p>
                  <span className="text-[11px] font-mono text-amber-800">
                    Custo: R$ {dashIndustrial.refugoRetrabalho.custoTotalRetrabalho.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-800 block">Principais Causas de Refugo</span>
                {dashIndustrial.refugoRetrabalho.principaisCausasRefugo.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-700">{c.causa}</span>
                    <strong className="text-slate-900 font-mono">
                      {c.pecas} un (R$ {c.custo.toFixed(2)})
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pedidos em Risco de Atraso */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Ordens de Produção & Pedidos em Risco de Atraso (OTIF)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Pedido / OP</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Data Prometida</th>
                    <th className="p-3">Estágio Atual</th>
                    <th className="p-3">Diagnóstico do Risco</th>
                    <th className="p-3 text-right">Valor Pedido</th>
                    <th className="p-3 text-center">Criticidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashIndustrial.pedidosEmRisco.map((rsk) => (
                    <tr key={rsk.pedidoId} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {rsk.numeroPedido}
                        <span className="block text-[10px] text-indigo-700 font-normal">{rsk.opRelacionada}</span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{rsk.clienteNome}</td>
                      <td className="p-3 font-mono text-slate-700">
                        {rsk.dataPrometida}
                        <span className="block text-rose-600 text-[10px] font-bold">+{rsk.diasAtrasoEstimado}d estim.</span>
                      </td>
                      <td className="p-3 text-slate-700">{rsk.estagioAtual}</td>
                      <td className="p-3 text-slate-600 max-w-xs">{rsk.motivoRisco}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        R$ {rsk.valorPedido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rsk.criticidade === 'CRITICA'
                              ? 'bg-rose-100 text-rose-800'
                              : rsk.criticidade === 'ALTA'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {rsk.criticidade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. DASHBOARD COMERCIAL (FUNIL, CONVERSÃO, VENDEDORES)     */}
      {/* ========================================================= */}
      {activeTab === 'dashboard_comercial' && dashComercial && (
        <div className="space-y-6">
          {/* Funil de Vendas Visual & Taxa de Conversão */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Funil de Vendas & Taxas de Passagem entre Etapas</h3>
                <p className="text-xs text-slate-500">Taxa de Conversão Global: <strong>{dashComercial.taxaConversaoGeral}%</strong> • Ticket Médio: <strong>R$ {dashComercial.ticketMedioVendas.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</strong></p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded">
                Meta Atingida: {dashComercial.vendasRealizadas.percentualMetaAtingido}%
              </span>
            </div>

            <div className="space-y-2.5">
              {dashComercial.funilVendas.map((etapa, idx) => {
                const widthPct = 100 - idx * 12;
                return (
                  <div key={etapa.etapa} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{etapa.nomeEtapa}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">{etapa.quantidadeOportunidades} propostas</span>
                        <strong className="font-mono text-slate-900">
                          R$ {(etapa.valorTotalEtapa / 1000000).toFixed(2)}M
                        </strong>
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                          {etapa.taxaConversaoEtapa}% conv
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded h-3 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-3 rounded transition-all"
                        style={{ width: `${widthPct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ranking de Vendedores & Margem por Linha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ranking dos Consultores Técnicos */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Ranking Comercial (Realizado vs Meta)</h3>
              <div className="space-y-3">
                {dashComercial.rankingVendedores.map((v, i) => (
                  <div key={v.vendedorId} className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">#{i + 1} {v.vendedorNome}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.atingimentoMetaPercentual >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {v.atingimentoMetaPercentual}% da meta
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1">
                      <span>Vendido: <strong>R$ {(v.totalVendido / 1000).toFixed(0)}k</strong></span>
                      <span>Meta: R$ {(v.metaVendedor / 1000).toFixed(0)}k</span>
                      <span>Ticket: R$ {(v.ticketMedio / 1000).toFixed(0)}k</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Margem de Contribuição por Linha */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Margem por Família de Produtos</h3>
              <div className="space-y-3">
                {dashComercial.margemContribuicaoPorLinha.map((linha, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs">
                    <strong className="text-slate-900 block mb-1">{linha.linhaProduto}</strong>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Fat: R$ {(linha.faturamento / 1000000).toFixed(2)}M</span>
                      <span className="text-indigo-700 font-semibold">Margem Bruta: {linha.margemBrutaPercentual}%</span>
                      <span className="text-emerald-700 font-bold">Líquida: {linha.margemLiquidaPercentual}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. DASHBOARD FINANCEIRO (CAIXA, PROJETADO, AGING, BANCOS) */}
      {/* ========================================================= */}
      {activeTab === 'dashboard_financeiro' && dashFinanceiro && (
        <div className="space-y-6">
          {/* Posição de Caixa & Saldos por Banco */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {dashFinanceiro.distribuicaoBancos.map((banco) => (
              <div key={banco.bancoId} className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-900 block">{banco.bancoNome}</span>
                <span className="text-[11px] font-mono text-slate-400 block mt-0.5">{banco.numeroConta}</span>
                <p className="text-xl font-bold font-mono text-emerald-700 mt-2">
                  R$ {banco.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="mt-2 text-[10px] text-slate-500 flex justify-between">
                  <span>{banco.percentualTotal}% do caixa</span>
                  {banco.chavePixPadrao && <span className="text-indigo-600 font-semibold">PIX Configurado</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Curva de Fluxo de Caixa Projetado D+30 / D+60 / D+90 */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Fluxo de Caixa Projetado (D+30 / D+60 / D+90)</h3>
                <p className="text-xs text-slate-500">Projeção considerando recebíveis em carteira e compromissos operacionais confirmados</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-800">
                Taxa de Conciliação: {dashFinanceiro.conciliacaoStatus.taxaConciliacaoExtratos}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              {dashFinanceiro.fluxoProjetadoCurvas.map((curva, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs space-y-1">
                  <strong className="text-slate-900 block">{curva.diaOuMes}</strong>
                  <div className="text-[11px] space-y-0.5">
                    <div className="text-emerald-700 flex justify-between">
                      <span>Entradas:</span>
                      <span className="font-mono">R$ {(curva.entradasPrevistas / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="text-rose-700 flex justify-between">
                      <span>Saídas:</span>
                      <span className="font-mono">- R$ {(curva.saidasPrevistas / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="font-bold text-slate-900 pt-1 border-t border-slate-200 flex justify-between">
                      <span>Saldo Acum:</span>
                      <span className="font-mono">R$ {(curva.saldoAcumuladoProjetado / 1000).toFixed(0)}k</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Aging List de Recebíveis com Provisão de Devedores Duvidosos (PDD) */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Aging List de Contas a Receber com PDD Ponderada</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Faixa de Vencimento</th>
                    <th className="p-3 text-right">Valor em Carteira (R$)</th>
                    <th className="p-3 text-center">Títulos</th>
                    <th className="p-3 text-center">Share (%)</th>
                    <th className="p-3 text-center">% PDD Estimada</th>
                    <th className="p-3 text-right">Provisão PDD (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashFinanceiro.agingListRecebiveis.map((faixa) => (
                    <tr key={faixa.faixa} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{faixa.faixaTitulo}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        R$ {faixa.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center text-slate-600">{faixa.quantidadeTitulos}</td>
                      <td className="p-3 text-center font-semibold text-slate-700">{faixa.percentualTotal}%</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold">{faixa.percentualPddEstimada}%</span>
                      </td>
                      <td className="p-3 text-right font-mono text-rose-700 font-semibold">
                        R$ {faixa.provisaoPddValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. DRILL-DOWN ANALÍTICO COMPLETO (6 NÍVEIS HIERÁRQUICOS)  */}
      {/* Grupo ➔ Empresa ➔ Setor ➔ Cliente ➔ Pedido ➔ Item          */}
      {/* ========================================================= */}
      {activeTab === 'drilldown' && drillDownData && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Drill-Down Analítico Multidimensional</h3>
                <p className="text-xs text-slate-500">Navegue pelas 6 camadas: Grupo ➔ Empresa ➔ Setor ➔ Cliente ➔ Pedido ➔ Item</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded">
                6 Níveis Integrados
              </span>
            </div>

            {/* Breadcrumb Interativo do Drill-Down */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs mb-5">
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                {drillDownData.nomeGrupo}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

              {/* Seletor Empresa */}
              <select
                value={selectedEmpresaId}
                onChange={(e) => {
                  setSelectedEmpresaId(e.target.value);
                  const emp = drillDownData.empresas.find((empItem) => empItem.id === e.target.value);
                  if (emp && emp.setores.length > 0) {
                    setSelectedSetorId(emp.setores[0].id);
                    if (emp.setores[0].clientes.length > 0) {
                      setSelectedClienteId(emp.setores[0].clientes[0].id);
                      if (emp.setores[0].clientes[0].pedidos.length > 0) {
                        setSelectedPedidoId(emp.setores[0].clientes[0].pedidos[0].id);
                      }
                    }
                  }
                }}
                className="bg-white px-2 py-1 rounded border border-slate-300 font-bold text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500"
              >
                {drillDownData.empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nomeFantasia} ({emp.codigo})
                  </option>
                ))}
              </select>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

              {/* Seletor Setor */}
              {currentEmpresa && currentEmpresa.setores.length > 0 && (
                <>
                  <select
                    value={selectedSetorId}
                    onChange={(e) => {
                      setSelectedSetorId(e.target.value);
                      const st = currentEmpresa.setores.find((s) => s.id === e.target.value);
                      if (st && st.clientes.length > 0) {
                        setSelectedClienteId(st.clientes[0].id);
                        if (st.clientes[0].pedidos.length > 0) {
                          setSelectedPedidoId(st.clientes[0].pedidos[0].id);
                        }
                      }
                    }}
                    className="bg-white px-2 py-1 rounded border border-slate-300 font-semibold text-slate-800 text-xs"
                  >
                    {currentEmpresa.setores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </>
              )}

              {/* Seletor Cliente */}
              {currentSetor && currentSetor.clientes.length > 0 && (
                <>
                  <select
                    value={selectedClienteId}
                    onChange={(e) => {
                      setSelectedClienteId(e.target.value);
                      const cl = currentSetor.clientes.find((c) => c.id === e.target.value);
                      if (cl && cl.pedidos.length > 0) {
                        setSelectedPedidoId(cl.pedidos[0].id);
                      }
                    }}
                    className="bg-white px-2 py-1 rounded border border-slate-300 font-semibold text-slate-800 text-xs"
                  >
                    {currentSetor.clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nomeFantasia}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </>
              )}

              {/* Seletor Pedido */}
              {currentCliente && currentCliente.pedidos.length > 0 && (
                <select
                  value={selectedPedidoId}
                  onChange={(e) => setSelectedPedidoId(e.target.value)}
                  className="bg-white px-2 py-1 rounded border border-slate-300 font-mono font-bold text-slate-800 text-xs"
                >
                  {currentCliente.pedidos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.numeroPedido}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Painéis com os Detalhes de Cada Nível */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Nível 2: Empresa */}
              {currentEmpresa && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase">2. Unidade de Negócio</span>
                  <strong className="text-slate-900 block">{currentEmpresa.nomeFantasia}</strong>
                  <p className="text-slate-500">CNPJ: {currentEmpresa.cnpj}</p>
                  <div className="pt-2 border-t border-slate-200 mt-2 flex justify-between font-semibold">
                    <span>Faturamento:</span>
                    <span className="text-slate-900 font-mono">R$ {(currentEmpresa.faturamento / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              )}

              {/* Nível 3: Setor */}
              {currentSetor && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase">3. Setor / Centro de Custo</span>
                  <strong className="text-slate-900 block">{currentSetor.nome}</strong>
                  <p className="text-slate-500">Resp: {currentSetor.responsavelNome}</p>
                  <div className="pt-2 border-t border-slate-200 mt-2 flex justify-between font-semibold">
                    <span>OEE Médio:</span>
                    <span className="text-indigo-700 font-bold">{currentSetor.oeeMedio}%</span>
                  </div>
                </div>
              )}

              {/* Nível 4: Cliente */}
              {currentCliente && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase">4. Conta Cliente</span>
                  <strong className="text-slate-900 block">{currentCliente.nomeFantasia}</strong>
                  <p className="text-slate-500">Segmento: {currentCliente.segmentoMercado}</p>
                  <div className="pt-2 border-t border-slate-200 mt-2 flex justify-between font-semibold">
                    <span>Score de Crédito:</span>
                    <span className="text-emerald-700 font-bold">{currentCliente.scoreCredito} pts</span>
                  </div>
                </div>
              )}

              {/* Nível 5: Pedido */}
              {currentPedido && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase">5. Pedido & OP Vinculada</span>
                  <strong className="font-mono text-slate-900 block">{currentPedido.numeroPedido}</strong>
                  <p className="text-slate-500">Entrega: {currentPedido.dataEntregaPrometida}</p>
                  <div className="pt-2 border-t border-slate-200 mt-2 flex justify-between font-semibold">
                    <span>OTIF Status:</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        currentPedido.otifStatus === 'NO_PRAZO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {currentPedido.otifStatus}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Nível 6: Itens / Peças / Insumos do Pedido */}
            {currentPedido && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    6. Itens / Partes Fabricadas do Pedido ({currentPedido.itens.length})
                  </h4>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    Valor Total: R$ {currentPedido.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Margem: {currentPedido.margemTotalPercentual}%)
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Código Item</th>
                        <th className="p-3">Descrição & Especificação</th>
                        <th className="p-3 text-center">Qtd Pedida / Prod.</th>
                        <th className="p-3 text-right">Preço Venda (un)</th>
                        <th className="p-3 text-right">Custo Real (un)</th>
                        <th className="p-3 text-center">Margem (%)</th>
                        <th className="p-3 text-center">Refugo</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentPedido.itens.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-slate-800">{item.codigo}</td>
                          <td className="p-3">
                            <strong className="text-slate-900 block">{item.descricao}</strong>
                            <span className="text-slate-500 text-[11px]">{item.especificacaoTecnica}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-bold text-slate-900">
                              {item.quantidadeProduzida} / {item.quantidadePedida} {item.unidadeMedida}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono text-slate-900">
                            R$ {item.precoUnitarioVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-600">
                            R$ {item.custoUnitarioReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-center font-bold text-emerald-700">
                            {item.margemUnitarioPercentual}%
                          </td>
                          <td className="p-3 text-center font-mono text-slate-600">
                            {item.taxaRefugoItem}%
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.statusProducao === 'CONCLUIDO'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {item.statusProducao}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. CATÁLOGO DE INDICADORES & METAS PARAMETRIZADAS        */}
      {/* ========================================================= */}
      {activeTab === 'metas_indicadores' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Metas Parametrizadas por Período e Empresa</h3>
                <p className="text-xs text-slate-500">Definição de valores alvo, limites de alerta amarelo e tolerância crítica vermelha</p>
              </div>
              <button
                id="btn-nova-meta"
                onClick={() => setShowNovaMetaModal(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5"
              >
                <Target className="w-3.5 h-3.5" />
                Cadastrar Nova Meta
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Código / Indicador</th>
                    <th className="p-3">Escopo</th>
                    <th className="p-3">Ano</th>
                    <th className="p-3 text-right">Valor Alvo</th>
                    <th className="p-3 text-right">Alerta (Amarelo)</th>
                    <th className="p-3 text-right">Crítico (Vermelho)</th>
                    <th className="p-3">Responsável</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metas.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <strong className="text-slate-900 block">{m.indicadorCodigo}</strong>
                        <span className="text-slate-500 text-[11px]">
                          {indicadores.find((i) => i.id === m.indicadorId)?.nome || m.indicadorCodigo}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                          {m.empresaId === 'GRUPO' ? '🌐 GRUPO GLOBAL' : '🏢 UNIDADE'}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{m.ano}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        {m.valorAlvo.toLocaleString('pt-BR')}
                      </td>
                      <td className="p-3 text-right font-mono text-amber-700 font-semibold">
                        {m.limiteAlertaAmarelo.toLocaleString('pt-BR')}
                      </td>
                      <td className="p-3 text-right font-mono text-rose-700 font-semibold">
                        {m.limiteCriticoVermelho.toLocaleString('pt-BR')}
                      </td>
                      <td className="p-3 text-slate-600">{m.responsavelNome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Catálogo Mestre de Indicadores */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Catálogo Mestre de Indicadores do GRUPO SENAGRO</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {indicadores.map((ind) => (
                <div key={ind.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 text-sm">{ind.nome}</strong>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-200 rounded text-slate-800">
                      {ind.codigo}
                    </span>
                  </div>
                  <p className="text-slate-600">{ind.descricao}</p>
                  <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[11px] text-indigo-900">
                    Fórmula: {ind.formula}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Categoria: <strong>{ind.categoria}</strong></span>
                    <span>Periodicidade: <strong>{ind.periodicidade}</strong></span>
                    <span>Polaridade: <strong>{ind.polaridade}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. CENTRAL DE ALERTAS DE CRITICIDADE & PLANOS DE AÇÃO     */}
      {/* ========================================================= */}
      {activeTab === 'alertas' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Central de Alertas & Diagnósticos de BI</h3>
              <p className="text-xs text-slate-500">Monitoramento contínuo de desvios de metas com planos de ação sugeridos</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
              {alertas.filter((a) => !a.reconhecido).length} Alertas Pendentes
            </span>
          </div>

          <div className="space-y-3">
            {alertas.map((alt) => (
              <div
                key={alt.id}
                className={`p-4 rounded-lg border text-xs transition-all ${
                  alt.status === 'CRITICO'
                    ? 'bg-rose-50/60 border-rose-200'
                    : 'bg-amber-50/60 border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${alt.status === 'CRITICO' ? 'text-rose-600' : 'text-amber-600'}`} />
                    <strong className="text-slate-900 text-sm">{alt.indicadorNome}</strong>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded">
                      {alt.empresaNome}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">{alt.dataDisparo}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alt.status === 'CRITICO' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {alt.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 my-2.5 p-2 bg-white rounded border border-slate-200 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500">Valor Realizado: </span>
                    <strong className="text-rose-700">{alt.valorAtual}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Meta Estabelecida: </span>
                    <strong className="text-slate-800">{alt.valorMeta}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Limite Violado: </span>
                    <strong className="text-amber-800">{alt.limiteViolado}</strong>
                  </div>
                </div>

                <p className="text-slate-700 my-2">
                  <strong>Diagnóstico:</strong> {alt.mensagemDiagnostico}
                </p>

                <div className="p-2.5 bg-white rounded border border-indigo-100 text-indigo-950 font-medium">
                  <strong>Plano de Ação Recomendado:</strong> {alt.planoAcaoSugerido}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">
                    {alt.reconhecido
                      ? `Reconhecido por ${alt.reconhecidoPor} em ${alt.dataReconhecimento}`
                      : 'Aguardando reconhecimento de gestor responsável'}
                  </span>
                  {!alt.reconhecido ? (
                    <button
                      onClick={() => handleReconhecerAlerta(alt.id)}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Reconhecer & Iniciar Ação
                    </button>
                  ) : (
                    <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Reconhecido
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. CONFIGURAÇÕES & PERSONALIZAÇÃO DE PAINÉIS               */}
      {/* ========================================================= */}
      {activeTab === 'configuracoes' && config && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Configurações e Preferências dos Painéis de BI</h3>
            <p className="text-xs text-slate-500">Parametrize o tempo de auto-atualização, layout de widgets e preferências visuais</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 text-xs">
              <strong className="text-slate-900 block text-sm">Frequência de Auto-Refresh dos Dashboards</strong>
              <p className="text-slate-500">Intervalo automático para reconsulta dos bancos das 5 empresas</p>
              <select
                value={config.autoRefreshIntervalSegundos}
                onChange={(e) => {
                  const novo = { ...config, autoRefreshIntervalSegundos: Number(e.target.value) };
                  setConfig(novo);
                  biAnalyticsService.salvarConfigDashboard(novo);
                  showMsg('sucesso', 'Configuração de auto-refresh salva.');
                }}
                className="w-full p-2 bg-white rounded border border-slate-300 font-semibold text-slate-800"
              >
                <option value="0">Desativado (Atualização Manual)</option>
                <option value="30">A cada 30 segundos (Tempo Real)</option>
                <option value="60">A cada 60 segundos (Recomendado)</option>
                <option value="300">A cada 5 minutos</option>
              </select>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 text-xs">
              <strong className="text-slate-900 block text-sm">Tema Visual do Dashboard</strong>
              <p className="text-slate-500">Padrão técnico industrial otimizado para chão de fábrica e salas de controle</p>
              <select
                value={config.temaCores}
                onChange={(e) => {
                  const novo = { ...config, temaCores: e.target.value as any };
                  setConfig(novo);
                  biAnalyticsService.salvarConfigDashboard(novo);
                  showMsg('sucesso', 'Tema visual atualizado.');
                }}
                className="w-full p-2 bg-white rounded border border-slate-300 font-semibold text-slate-800"
              >
                <option value="PADRAO_TECNICO">Padrão Técnico Industrial (Neutro / Alta Legibilidade)</option>
                <option value="ALTO_CONTRASTE">Alto Contraste Fabril (Para TVs & Andon)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Widgets do Painel Principal</h4>
            <div className="space-y-2">
              {config.widgetsVisiveis.map((w, idx) => (
                <div key={w.widgetId} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">#{idx + 1}</span>
                    <strong className="text-slate-800">{w.titulo}</strong>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                    Ativo
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: NOVA META                                          */}
      {/* ========================================================= */}
      {showNovaMetaModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                Cadastrar Meta de Indicador
              </h3>
              <button onClick={() => setShowNovaMetaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Indicador Mestre</label>
                <select
                  value={formMetaIndicadorId}
                  onChange={(e) => setFormMetaIndicadorId(e.target.value)}
                  className="w-full p-2 rounded border border-slate-300 text-slate-800 font-semibold"
                >
                  {indicadores.map((ind) => (
                    <option key={ind.id} value={ind.id}>
                      {ind.nome} ({ind.codigo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Escopo de Aplicação</label>
                <select
                  value={formMetaEscopo}
                  onChange={(e) => setFormMetaEscopo(e.target.value)}
                  className="w-full p-2 rounded border border-slate-300 text-slate-800 font-semibold"
                >
                  <option value="GRUPO">🌐 GRUPO TRITECH (Consolidado)</option>
                  {EMPRESAS_GRUPO.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      🏢 {emp.nomeFantasia}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Valor Alvo da Meta</label>
                <input
                  type="number"
                  value={formMetaValor}
                  onChange={(e) => setFormMetaValor(Number(e.target.value))}
                  placeholder="Ex: 8500000 ou 85.0"
                  className="w-full p-2 rounded border border-slate-300 text-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Limite Amarelo (Alerta)</label>
                  <input
                    type="number"
                    value={formMetaAmarelo}
                    onChange={(e) => setFormMetaAmarelo(Number(e.target.value))}
                    placeholder="Tolerância"
                    className="w-full p-2 rounded border border-slate-300 text-amber-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Limite Vermelho (Crítico)</label>
                  <input
                    type="number"
                    value={formMetaVermelho}
                    onChange={(e) => setFormMetaVermelho(Number(e.target.value))}
                    placeholder="Crítico"
                    className="w-full p-2 rounded border border-slate-300 text-rose-800 font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowNovaMetaModal(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarNovaMeta}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
              >
                Salvar Meta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EXPORTAÇÃO DE RELATÓRIO EXECUTIVO                  */}
      {/* ========================================================= */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-600" />
                Exportação de Relatório Executivo BI
              </h3>
              <button onClick={() => setExportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Selecione o formato desejado para exportar o relatório do painel atual (
              <strong className="text-slate-900">{activeTab}</strong>):
            </p>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleExportar('PDF')}
                className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-center transition-all"
              >
                <FileSpreadsheet className="w-6 h-6 text-rose-600 mx-auto mb-1" />
                <span className="font-bold text-xs text-slate-900 block">PDF Executivo</span>
                <span className="text-[10px] text-slate-500">Pronto para Reunião</span>
              </button>

              <button
                onClick={() => handleExportar('EXCEL')}
                className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-center transition-all"
              >
                <FileSpreadsheet className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <span className="font-bold text-xs text-slate-900 block">Planilha XLSX</span>
                <span className="text-[10px] text-slate-500">Dados & Fórmulas</span>
              </button>

              <button
                onClick={() => handleExportar('CSV')}
                className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-center transition-all"
              >
                <FileSpreadsheet className="w-6 h-6 text-indigo-600 mx-auto mb-1" />
                <span className="font-bold text-xs text-slate-900 block">Arquivo CSV</span>
                <span className="text-[10px] text-slate-500">Carga Externa</span>
              </button>
            </div>

            {exportResult && (
              <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <p className="font-bold">Arquivo gerado com sucesso:</p>
                <p className="font-mono text-[11px]">{exportResult.nomeArquivo}</p>
                <p className="text-[10px] text-emerald-700">Tamanho: {(exportResult.tamanhoBytes / 1024).toFixed(1)} KB • Hash: {exportResult.hashDownload}</p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setExportModalOpen(false);
                  setExportResult(null);
                }}
                className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
