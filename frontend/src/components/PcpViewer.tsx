'use client';

import React, { useState, useEffect } from 'react';
import {
  Factory,
  Cpu,
  Boxes,
  ShoppingCart,
  Calendar,
  AlertTriangle,
  Clock,
  Play,
  RefreshCw,
  CheckCircle2,
  Filter,
  Search,
  ArrowRight,
  TrendingUp,
  Wrench,
  Users,
  ShieldAlert,
  Layers,
  FileCheck,
  Truck,
  Sparkles,
  Sliders,
  ChevronRight,
  ChevronDown,
  Info,
  Check,
  Flame,
  BarChart3,
  ExternalLink,
  Plus,
} from 'lucide-react';
import {
  ResultadoCalculoMRP,
  NecessidadeLiquidaItem,
  SugestaoCompraMRP,
  SugestaoProducaoMRP,
  RiscoAtrasoPCP,
  CapacidadeMaquinaPCP,
  CapacidadeSetorPCP,
  ItemFilaProducao,
  ItemGanttPCP,
  OrdemProducao,
  AlgoritmoSequenciamento,
} from '@/backend/modules/pcp/pcp-types';

interface PcpViewerProps {
  empresaId: string;
}

export function PcpViewer({ empresaId }: PcpViewerProps) {
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [mrpResult, setMrpResult] = useState<ResultadoCalculoMRP | null>(null);
  const [ordensProducao, setOrdensProducao] = useState<OrdemProducao[]>([]);
  const [maquinas, setMaquinas] = useState<any[]>([]);
  const [operadores, setOperadores] = useState<any[]>([]);
  const [manutencoes, setManutencoes] = useState<any[]>([]);
  const [calendario, setCalendario] = useState<any>(null);
  const [demandasCarteira, setDemandasCarteira] = useState<any[]>([]);

  // Sub-tabs in PCP
  const [activePcpTab, setActivePcpTab] = useState<
    'mrp_overview' | 'necessidades' | 'sugestoes_compra' | 'sugestoes_producao' | 'riscos' | 'filas_capacidade' | 'gantt' | 'ordens' | 'calendario'
  >('mrp_overview');

  // Filters & Search
  const [buscaItem, setBuscaItem] = useState('');
  const [filtroTipoItem, setFiltroTipoItem] = useState<'TODOS' | 'MATERIA_PRIMA' | 'COMPONENTE_COMPRADO' | 'PRODUTO_FABRICADO'>('TODOS');
  const [maquinaFilaSelecionada, setMaquinaFilaSelecionada] = useState<string>('maq-dobra-cnc-01');
  const [algoritmoFila, setAlgoritmoFila] = useState<AlgoritmoSequenciamento>('CRITICAL_RATIO');
  const [filaOrdenada, setFilaOrdenada] = useState<ItemFilaProducao[]>([]);
  const [actionFeedback, setActionFeedback] = useState<{ tipo: 'success' | 'error'; mensagem: string } | null>(null);
  const [modalRastreabilidade, setModalRastreabilidade] = useState<any | null>(null);
  const [modalNovaOp, setModalNovaOp] = useState(false);

  // Nova OP manual form state
  const [novaOpCodigo, setNovaOpCodigo] = useState('VASO-PRESSAO-12M3');
  const [novaOpDescricao, setNovaOpDescricao] = useState('Vaso de Pressão Horizontal 12m³ ASME VIII Div 1');
  const [novaOpQtd, setNovaOpQtd] = useState(1);
  const [novaOpPrioridade, setNovaOpPrioridade] = useState<'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE'>('ALTA');
  const [novaOpDataEntrega, setNovaOpDataEntrega] = useState('2026-09-25');

  useEffect(() => {
    carregarDadosPcp();
  }, [empresaId]);

  useEffect(() => {
    if (maquinaFilaSelecionada && mrpResult) {
      carregarFilaMaquina(maquinaFilaSelecionada, algoritmoFila);
    }
  }, [maquinaFilaSelecionada, mrpResult]);

  async function carregarDadosPcp() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/pcp?empresaId=${empresaId}`);
      const data = await res.json();
      if (data.success) {
        setMrpResult(data.resultadoMRP);
        setOrdensProducao(data.ordensProducao || []);
        setMaquinas(data.maquinas || []);
        setOperadores(data.operadores || []);
        setManutencoes(data.manutencoes || []);
        setCalendario(data.calendario || null);
        setDemandasCarteira(data.demandasCarteira || []);
      }
    } catch (err: any) {
      console.error('Erro ao carregar PCP:', err);
    } finally {
      setLoading(false);
    }
  }

  async function rodarCalculoMRP() {
    setCalculating(true);
    setActionFeedback(null);
    try {
      const res = await fetch('/api/v1/pcp/mrp/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId }),
      });
      const data = await res.json();
      if (data.success && data.resultado) {
        setMrpResult(data.resultado);
        setActionFeedback({
          tipo: 'success',
          mensagem: `Cálculo de MRP reprocessado com sucesso em ${new Date(data.resultado.dataExecucao).toLocaleTimeString('pt-BR')}!`,
        });
      } else {
        setActionFeedback({
          tipo: 'error',
          mensagem: data.error || 'Falha ao reprocessar MRP.',
        });
      }
    } catch (err: any) {
      setActionFeedback({ tipo: 'error', mensagem: err.message || 'Erro de rede.' });
    } finally {
      setCalculating(false);
    }
  }

  async function carregarFilaMaquina(maquinaId: string, algo: AlgoritmoSequenciamento) {
    try {
      const res = await fetch('/api/v1/pcp/fila', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId, maquinaId, algoritmo: algo }),
      });
      const data = await res.json();
      if (data.success && data.fila) {
        setFilaOrdenada(data.fila);
      }
    } catch (err) {
      console.error('Erro ao sequenciar fila:', err);
    }
  }

  async function handleGerarSolicitacaoCompra(sugestao: SugestaoCompraMRP) {
    try {
      const res = await fetch('/api/v1/pcp/mrp/sugestoes-compra/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId,
          sugestaoId: sugestao.id,
          usuarioNome: 'Planejador PCP Sênior',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({
          tipo: 'success',
          mensagem: `Solicitação de compra ${data.resultado.solicitacaoNumero} gerada com sucesso para ${sugestao.codigoItem} (${sugestao.quantidadeSugerida} ${sugestao.unidadeMedida}).`,
        });
        carregarDadosPcp();
      } else {
        setActionFeedback({ tipo: 'error', mensagem: data.error });
      }
    } catch (err: any) {
      setActionFeedback({ tipo: 'error', mensagem: err.message });
    }
  }

  async function handleGerarOP(sugestao: SugestaoProducaoMRP) {
    try {
      const res = await fetch('/api/v1/pcp/mrp/sugestoes-producao/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId, sugestaoId: sugestao.id }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({
          tipo: 'success',
          mensagem: `Ordem de Produção ${data.ordemProducao.numero} criada com sucesso para ${sugestao.codigoItem} (${sugestao.quantidadeSugerida} ${sugestao.unidadeMedida})!`,
        });
        carregarDadosPcp();
      } else {
        setActionFeedback({ tipo: 'error', mensagem: data.error });
      }
    } catch (err: any) {
      setActionFeedback({ tipo: 'error', mensagem: err.message });
    }
  }

  async function handleCriarNovaOPManual(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/pcp/ordens-producao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId,
          dados: {
            codigoItem: novaOpCodigo,
            descricaoItem: novaOpDescricao,
            unidadeMedida: 'UN',
            quantidadePlanejada: novaOpQtd,
            dataEntregaPrometida: new Date(novaOpDataEntrega).toISOString(),
            prioridade: novaOpPrioridade,
            origemTipo: 'MANUAL_PCP',
            observacoes: 'Ordem de Produção criada manualmente pelo painel de controle do PCP.',
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({
          tipo: 'success',
          mensagem: `Ordem de Produção ${data.ordemProducao.numero} criada com sucesso!`,
        });
        setModalNovaOp(false);
        carregarDadosPcp();
      } else {
        setActionFeedback({ tipo: 'error', mensagem: data.error });
      }
    } catch (err: any) {
      setActionFeedback({ tipo: 'error', mensagem: err.message });
    }
  }

  async function handleAtualizarStatusOP(opId: string, novoStatus: any) {
    try {
      const res = await fetch(`/api/v1/pcp/ordens-producao/${opId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId, status: novoStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback({
          tipo: 'success',
          mensagem: `OP atualizada para o status: ${novoStatus}.`,
        });
        carregarDadosPcp();
      } else {
        setActionFeedback({ tipo: 'error', mensagem: data.error });
      }
    } catch (err: any) {
      setActionFeedback({ tipo: 'error', mensagem: err.message });
    }
  }

  // Filtragem de Necessidades Líquidas
  const necessidadesFiltradas = (mrpResult?.necessidadesLiquidas || []).filter((n) => {
    const matchBusca =
      n.codigoItem.toLowerCase().includes(buscaItem.toLowerCase()) ||
      n.descricao.toLowerCase().includes(buscaItem.toLowerCase());
    const matchTipo = filtroTipoItem === 'TODOS' || n.tipoItem === filtroTipoItem;
    return matchBusca && matchTipo;
  });

  return (
    <div className="space-y-6">
      {/* Header com Contexto Industrial e Botão de Execução Determinística */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg">
              <Factory className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">PCP & MRP Industrial Determinístico</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Regras Determinísticas Ativas
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  Sem IA
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Explosão de BOM, deduções líquidas (físico, bloqueado, reservas, compras em trânsito), capacidade de máquinas/setores e sequenciamento fabril.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-recalcular-mrp"
            onClick={rodarCalculoMRP}
            disabled={calculating}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-colors shadow-md disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
            <span>{calculating ? 'Processando MRP...' : 'Executar Cálculo MRP'}</span>
          </button>

          <button
            id="btn-nova-op"
            onClick={() => setModalNovaOp(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-medium text-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>Nova OP Manual</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-lg border flex items-center justify-between text-sm ${
            actionFeedback.tipo === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.tipo === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{actionFeedback.mensagem}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs underline hover:opacity-80 ml-4 font-semibold"
          >
            Fechar
          </button>
        </div>
      )}

      {/* KPIs Rápidos do MRP */}
      {mrpResult && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Demandas Analisadas</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{mrpResult.resumo.totalDemandasAnalisadas}</span>
              <span className="text-xs text-slate-500">pedidos/OPs</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Necessidades Líquidas</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600">{mrpResult.resumo.totalItensNecessidadeLiquida}</span>
              <span className="text-xs text-slate-500">itens faltantes</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Sugestões de Compra</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-600">{mrpResult.resumo.totalSugestoesCompra}</span>
              <span className="text-xs text-slate-500">R$ {mrpResult.resumo.valorTotalEstimadoCompras.toLocaleString('pt-BR')}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Sugestões de Fabricação</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-indigo-600">{mrpResult.resumo.totalSugestoesProducao}</span>
              <span className="text-xs text-slate-500">novas OPs</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Riscos de Atraso</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-600">{mrpResult.resumo.totalRiscosAtraso}</span>
              <span className="text-xs text-slate-500">{mrpResult.resumo.totalRiscosCriticos} críticos</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Gargalos de Máquinas</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-orange-600">{mrpResult.resumo.maquinasGargaloTotal}</span>
              <span className="text-xs text-slate-500">&gt;100% carga</span>
            </div>
          </div>
        </div>
      )}

      {/* Navegação por Sub-Abas do PCP */}
      <div className="border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2">
        <div className="flex space-x-2 overflow-x-auto">
          <button
            id="tab-pcp-overview"
            onClick={() => setActivePcpTab('mrp_overview')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activePcpTab === 'mrp_overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Visão Geral & Demandas</span>
          </button>

          <button
            id="tab-pcp-necessidades"
            onClick={() => setActivePcpTab('necessidades')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activePcpTab === 'necessidades'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Necessidades Líquidas</span>
            {mrpResult && mrpResult.resumo.totalItensNecessidadeLiquida > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-xs bg-amber-100 text-amber-700 font-bold">
                {mrpResult.resumo.totalItensNecessidadeLiquida}
              </span>
            )}
          </button>

          <button
            id="tab-pcp-sugestoes-compra"
            onClick={() => setActivePcpTab('sugestoes_compra')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activePcpTab === 'sugestoes_compra'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Sugestões de Compra</span>
            {mrpResult && mrpResult.sugestoesCompra.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-xs bg-blue-100 text-blue-700 font-bold">
                {mrpResult.sugestoesCompra.length}
              </span>
            )}
          </button>

          <button
            id="tab-pcp-sugestoes-producao"
            onClick={() => setActivePcpTab('sugestoes_producao')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activePcpTab === 'sugestoes_producao'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Sugestões de Produção</span>
            {mrpResult && mrpResult.sugestoesProducao.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-xs bg-indigo-100 text-indigo-700 font-bold">
                {mrpResult.sugestoesProducao.length}
              </span>
            )}
          </button>

          <button
            id="tab-pcp-riscos"
            onClick={() => setActivePcpTab('riscos')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activePcpTab === 'riscos'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Riscos de Atraso</span>
            {mrpResult && mrpResult.riscosAtraso.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-xs bg-rose-100 text-rose-700 font-bold">
                {mrpResult.riscosAtraso.length}
              </span>
            )}
          </button>

          <button
            id="tab-pcp-filas"
            onClick={() => setActivePcpTab('filas_capacidade')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activePcpTab === 'filas_capacidade'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Filas & Capacidade de Máquinas</span>
          </button>

          <button
            id="tab-pcp-gantt"
            onClick={() => setActivePcpTab('gantt')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activePcpTab === 'gantt'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Gantt Inicial</span>
          </button>

          <button
            id="tab-pcp-ordens"
            onClick={() => setActivePcpTab('ordens')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activePcpTab === 'ordens'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Ordens de Produção (OPs)</span>
            <span className="px-1.5 py-0.2 rounded-full text-xs bg-slate-100 text-slate-700 font-bold">
              {ordensProducao.length}
            </span>
          </button>

          <button
            id="tab-pcp-calendario"
            onClick={() => setActivePcpTab('calendario')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activePcpTab === 'calendario'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Calendário & Turnos</span>
          </button>
        </div>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <div className="bg-white rounded-b-xl border border-slate-200 p-6 shadow-xs min-h-[500px]">
        {/* ABA 1: VISÃO GERAL & DEMANDAS */}
        {activePcpTab === 'mrp_overview' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Carteira de Demandas & Entradas do MRP</h3>
                <p className="text-xs text-slate-500">
                  Demandas firmes consolidadas de Pedidos de Venda aprovados e Ordens de Produção em andamento.
                </p>
              </div>
              <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-md border border-slate-200 font-mono">
                Horário da Última Execução: {mrpResult ? new Date(mrpResult.dataExecucao).toLocaleString('pt-BR') : '-'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Demandas de Pedidos de Venda */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                    Pedidos de Venda Firmes (Carteira)
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
                    {demandasCarteira.length} Pedidos
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {demandasCarteira.map((demanda) => (
                    <div key={demanda.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{demanda.numeroPedido}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {demanda.status}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              demanda.prioridade === 'ALTA' || demanda.prioridade === 'URGENTE'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {demanda.prioridade}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-1">{demanda.clienteNome}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Item: <strong className="text-slate-800">{demanda.codigoItem}</strong> ({demanda.quantidade} UN)
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">Data Prometida</span>
                          <span className="text-xs font-bold text-slate-800">
                            {new Date(demanda.dataPrometidaEntrega).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Capacidade Resumida dos Setores */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Factory className="w-4 h-4 text-indigo-600" />
                    Ocupação por Setor Industrial
                  </span>
                  <span className="text-xs bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded">
                    {mrpResult?.capacidadeSetores.length || 0} Setores
                  </span>
                </div>
                <div className="p-4 space-y-4">
                  {mrpResult?.capacidadeSetores.map((setor) => (
                    <div key={setor.setor} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">{setor.setorNome}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-mono">
                            {setor.cargaAlocadaHorasDia}h / {setor.capacidadeTotalHorasDia}h/dia
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              setor.taxaOcupacaoPercentual > 100
                                ? 'bg-rose-100 text-rose-800'
                                : setor.taxaOcupacaoPercentual > 85
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {setor.taxaOcupacaoPercentual.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            setor.taxaOcupacaoPercentual > 100
                              ? 'bg-rose-600'
                              : setor.taxaOcupacaoPercentual > 85
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(setor.taxaOcupacaoPercentual, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Regras e Rastreabilidade do MRP */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-5">
              <h4 className="font-bold text-sm text-blue-900 flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                Matriz de Cálculo Determinístico (Sem IA)
              </h4>
              <p className="text-xs text-blue-800 leading-relaxed">
                O motor do MRP opera por <strong>Programação Regressiva (Backward Scheduling)</strong>:{' '}
                <code className="bg-white/80 px-1 py-0.5 rounded text-blue-900 border border-blue-200 font-mono">
                  Necessidade Líquida = Demanda Bruta (c/ Perda) - (Estoque Físico - Material Bloqueado - Reservas) - Compras em Trânsito - OPs em Processo
                </code>
                . Todas as sugestões possuem origem auditável amarrada ao Pedido de Venda e à revisão de engenharia ativa.
              </p>
            </div>
          </div>
        )}

        {/* ABA 2: NECESSIDADES LÍQUIDAS */}
        {activePcpTab === 'necessidades' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filtrar por código ou item..."
                    value={buscaItem}
                    onChange={(e) => setBuscaItem(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={filtroTipoItem}
                  onChange={(e: any) => setFiltroTipoItem(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="TODOS">Todos os Tipos de Item</option>
                  <option value="MATERIA_PRIMA">Matérias-Primas</option>
                  <option value="COMPONENTE_COMPRADO">Componentes Comprados</option>
                  <option value="PRODUTO_FABRICADO">Fabricados / Conjuntos</option>
                </select>
              </div>

              <span className="text-xs text-slate-500">
                Mostrando <strong>{necessidadesFiltradas.length}</strong> itens calculados
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Código / Descrição</th>
                    <th className="py-3 px-2">Tipo</th>
                    <th className="py-3 px-2 text-right">Demanda Bruta</th>
                    <th className="py-3 px-2 text-right">Estoque Físico</th>
                    <th className="py-3 px-2 text-right">Bloqueado</th>
                    <th className="py-3 px-2 text-right">Reservas</th>
                    <th className="py-3 px-2 text-right text-blue-700">Saldo Livre</th>
                    <th className="py-3 px-2 text-right text-indigo-700">Compras Abertas</th>
                    <th className="py-3 px-3 text-right bg-amber-50 font-bold text-amber-900">Necessidade Líquida</th>
                    <th className="py-3 px-3 text-center">Status / Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {necessidadesFiltradas.map((item) => (
                    <tr key={item.codigoItem} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 font-mono">{item.codigoItem}</div>
                        <div className="text-slate-500 text-[11px] max-w-xs truncate">{item.descricao}</div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {item.tipoItem}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-medium text-slate-800">
                        {item.demandaBrutaTotal} <span className="text-slate-400 text-[10px]">{item.unidadeMedida}</span>
                      </td>
                      <td className="py-3 px-2 text-right text-slate-600 font-mono">{item.estoqueFisicoTotal}</td>
                      <td className="py-3 px-2 text-right text-rose-600 font-mono font-medium">
                        {item.materialBloqueado > 0 ? `-${item.materialBloqueado}` : '0'}
                      </td>
                      <td className="py-3 px-2 text-right text-amber-600 font-mono font-medium">
                        {item.reservasAtivas > 0 ? `-${item.reservasAtivas}` : '0'}
                      </td>
                      <td className="py-3 px-2 text-right text-blue-700 font-mono font-bold">
                        {item.estoqueLiquidoDisponivel}
                      </td>
                      <td className="py-3 px-2 text-right text-indigo-700 font-mono font-medium">
                        {item.comprasAbertasEmTransito > 0 ? `+${item.comprasAbertasEmTransito}` : '0'}
                      </td>
                      <td className="py-3 px-3 text-right bg-amber-50/60 font-mono font-bold text-sm text-amber-900">
                        {item.necessidadeLiquidaCalculada > 0 ? (
                          <span className="text-rose-700 font-bold">{item.necessidadeLiquidaCalculada}</span>
                        ) : (
                          <span className="text-emerald-700 font-medium">0 (Coberto)</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {item.necessidadeLiquidaCalculada > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            Falta Comprar/Produzir
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <Check className="w-3 h-3" />
                            Totalmente Suprido
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 3: SUGESTÕES DE COMPRA */}
        {activePcpTab === 'sugestoes_compra' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div>
                <h3 className="font-bold text-sm text-blue-900">Sugestões de Compra Geradas pelo MRP</h3>
                <p className="text-xs text-blue-800">
                  Data de emissão calculada retroativamente pelo Lead Time do fornecedor. Não gera compras duplicadas se houver pedidos em aberto.
                </p>
              </div>
              <span className="text-xs font-bold text-blue-900 bg-white px-3 py-1.5 rounded-lg border border-blue-300">
                Total Estimado: R$ {mrpResult?.resumo.valorTotalEstimadoCompras.toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {mrpResult?.sugestoesCompra.map((sugestao) => (
                <div
                  key={sugestao.id}
                  className="border border-slate-200 rounded-xl p-5 hover:border-blue-400 transition-all bg-white shadow-xs"
                >
                  <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 font-mono">{sugestao.codigoItem}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
                          {sugestao.quantidadeSugerida} {sugestao.unidadeMedida}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            sugestao.urgencia === 'URGENTE' || sugestao.urgencia === 'CRITICA'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {sugestao.urgencia}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{sugestao.descricao}</p>
                      <p className="text-xs text-slate-500">
                        Fornecedor Recomendado: <strong className="text-slate-800">{sugestao.fornecedorPreferencialNome}</strong>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Data de Emissão (Disparo)</span>
                        <span className="text-xs font-bold text-blue-700">
                          {new Date(sugestao.dataSugeridaEmissaoCompra).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Lead Time</span>
                        <span className="text-xs font-bold text-slate-800">{sugestao.leadTimeCompraDias} dias</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Necessidade na Fábrica</span>
                        <span className="text-xs font-bold text-slate-800">
                          {new Date(sugestao.dataNecessidadeFabrica).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Valor Estimado</span>
                        <span className="text-xs font-bold text-emerald-700">
                          R$ {sugestao.valorTotalEstimado.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setModalRastreabilidade(sugestao)}
                        className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5 text-slate-500" />
                        <span>Rastreabilidade ({sugestao.origemRastreavel.length})</span>
                      </button>

                      <button
                        onClick={() => handleGerarSolicitacaoCompra(sugestao)}
                        className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Gerar Solicitação de Compra</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                    <span>
                      <strong>Justificativa do Cálculo:</strong> {sugestao.motivoCalculo}
                    </span>
                    {sugestao.jaExisteCompraAberta && (
                      <span className="text-amber-600 font-medium">
                        Compra em aberto: {sugestao.numeroCompraAbertaExistente}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 4: SUGESTÕES DE PRODUÇÃO */}
        {activePcpTab === 'sugestoes_producao' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-xl border border-indigo-200">
              <div>
                <h3 className="font-bold text-sm text-indigo-900">Sugestões de Ordens de Produção (MRP)</h3>
                <p className="text-xs text-indigo-800">
                  Calcula OPs necessárias para suprir pedidos de venda ou subconjuntos estruturais de projetos.
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-900 bg-white px-3 py-1.5 rounded-lg border border-indigo-300">
                {mrpResult?.sugestoesProducao.length || 0} OPs Sugeridas
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {mrpResult?.sugestoesProducao.map((sugestao) => (
                <div
                  key={sugestao.id}
                  className="border border-slate-200 rounded-xl p-5 hover:border-indigo-400 transition-all bg-white shadow-xs"
                >
                  <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 font-mono">{sugestao.codigoItem}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800">
                          {sugestao.quantidadeSugerida} {sugestao.unidadeMedida}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            sugestao.prioridade === 'ALTA' || sugestao.prioridade === 'URGENTE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Prioridade: {sugestao.prioridade}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{sugestao.descricao}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Início Sugerido</span>
                        <span className="text-xs font-bold text-slate-800">
                          {new Date(sugestao.dataInicioSugerida).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Lead Time Fabril</span>
                        <span className="text-xs font-bold text-indigo-700">{sugestao.leadTimeFabricacaoDias} dias úteis</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Término / Entrega</span>
                        <span className="text-xs font-bold text-slate-800">
                          {new Date(sugestao.dataFimSugerida).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setModalRastreabilidade(sugestao)}
                        className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5 text-slate-500" />
                        <span>Rastreabilidade</span>
                      </button>

                      <button
                        onClick={() => handleGerarOP(sugestao)}
                        className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Converter em OP Firme</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <strong>Justificativa da Demanda:</strong> {sugestao.motivoCalculo}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 5: RISCOS DE ATRASO */}
        {activePcpTab === 'riscos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-rose-50 p-4 rounded-xl border border-rose-200">
              <div>
                <h3 className="font-bold text-sm text-rose-900">Matriz de Riscos de Atraso e Conflitos</h3>
                <p className="text-xs text-rose-800">
                  Identifica gargalos de capacidade, materiais em quarentena/bloqueio, manutenções concomitantes e prazos estourados.
                </p>
              </div>
              <span className="text-xs font-bold text-rose-900 bg-white px-3 py-1.5 rounded-lg border border-rose-300">
                {mrpResult?.riscosAtraso.length || 0} Alertas Identificados
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {mrpResult?.riscosAtraso.map((risco) => (
                <div
                  key={risco.id}
                  className={`border rounded-xl p-5 transition-all ${
                    risco.severidade === 'CRITICA'
                      ? 'border-rose-300 bg-rose-50/40'
                      : risco.severidade === 'ALTA'
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            risco.severidade === 'CRITICA'
                              ? 'bg-rose-600 text-white'
                              : risco.severidade === 'ALTA'
                              ? 'bg-amber-600 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {risco.severidade}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border">
                          {risco.tipoRisco}
                        </span>
                        {risco.documentoAfetadoNumero && (
                          <span className="text-xs font-semibold text-slate-800">
                            Ref: {risco.documentoAfetadoNumero}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">{risco.descricao}</h4>
                      {risco.maquinaNome && (
                        <p className="text-xs text-slate-600">
                          Recurso: <strong>{risco.maquinaNome}</strong>
                        </p>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 max-w-sm text-xs space-y-1">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Ação Recomendada (PCP):
                      </span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{risco.acaoRecomendada}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 6: FILAS & CAPACIDADE DE MÁQUINAS */}
        {activePcpTab === 'filas_capacidade' && (
          <div className="space-y-6">
            {/* Seletor de Máquina e Algoritmo */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Posto de Trabalho / Máquina:</label>
                  <select
                    value={maquinaFilaSelecionada}
                    onChange={(e) => setMaquinaFilaSelecionada(e.target.value)}
                    className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {maquinas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome} ({m.taxaOcupacaoPercentual.toFixed(0)}% ocupação)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Algoritmo de Sequenciamento:</label>
                  <select
                    value={algoritmoFila}
                    onChange={(e: any) => {
                      setAlgoritmoFila(e.target.value);
                      carregarFilaMaquina(maquinaFilaSelecionada, e.target.value);
                    }}
                    className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CRITICAL_RATIO">Critical Ratio (CR - Relação Crítica de Prazo)</option>
                    <option value="EARLIEST_DUE_DATE">Earliest Due Date (EDD - Menor Prazo de Entrega)</option>
                    <option value="SHORTEST_PROCESSING_TIME">Shortest Processing Time (SPT - Menor Tempo)</option>
                    <option value="FIFO">FIFO (First In, First Out)</option>
                    <option value="PRIORIDADE_MANUAL">Prioridade Manual Fixa</option>
                  </select>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 block">Total de Operações na Fila</span>
                <span className="text-lg font-bold text-blue-700">{filaOrdenada.length} Operações</span>
              </div>
            </div>

            {/* Fila Sequenciada */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                  Fila de Execução Ordenada por: {algoritmoFila}
                </span>
                <span className="text-xs text-slate-500">
                  Sequenciamento em tempo real
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {filaOrdenada.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                        #{item.posicaoFila}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{item.ordemProducaoNumero}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">
                            Op {item.sequenciaOperacao}: {item.operacaoNome}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            item.prioridade === 'ALTA' || item.prioridade === 'URGENTE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.prioridade}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">{item.clienteNome}</p>
                        <p className="text-xs text-slate-500">
                          Item: <strong>{item.codigoItem}</strong> ({item.quantidade} UN)
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tempo Setup + Proc</span>
                        <span className="font-bold text-slate-800">{item.tempoSetupHoras + item.tempoProcessamentoHoras}h</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Critical Ratio (CR)</span>
                        <span className={`font-mono font-bold ${
                          item.criticalRatio < 1 ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                          {item.criticalRatio.toFixed(2)} {item.criticalRatio < 1 ? '(Atrasado/Crítico)' : '(No Prazo)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Data Entrega</span>
                        <span className="font-bold text-slate-800">{new Date(item.dataEntregaPrometida).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Status</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Painel Completo de Capacidade por Máquina */}
            <div className="mt-8 space-y-4">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                Matriz de Capacidade Nominal vs Carga Alocada
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mrpResult?.capacidadeMaquinas.map((maq) => (
                  <div key={maq.maquinaId} className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-xs text-slate-900 line-clamp-1">{maq.maquinaNome}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          maq.taxaOcupacaoPercentual > 100
                            ? 'bg-rose-100 text-rose-800'
                            : maq.taxaOcupacaoPercentual > 85
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {maq.taxaOcupacaoPercentual.toFixed(0)}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full ${
                          maq.taxaOcupacaoPercentual > 100
                            ? 'bg-rose-600'
                            : maq.taxaOcupacaoPercentual > 85
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(maq.taxaOcupacaoPercentual, 100)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 border-t border-slate-100 pt-2">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Capacidade Líquida</span>
                        <strong className="text-slate-800">{maq.capacidadeHorasDiaLiquida} h/dia</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Carga Programada</span>
                        <strong className="text-slate-800">{maq.cargaProgramadaHoras} h</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Eficiência / OEE</span>
                        <strong className="text-slate-800 font-mono">{(maq.eficienciaPadraoPercentual * 100).toFixed(0)}%</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Status</span>
                        <strong className="text-blue-700">{maq.status}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ABA 7: GANTT INICIAL */}
        {activePcpTab === 'gantt' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Cronograma Visual de Produção (Gantt Fabril)</h3>
                <p className="text-xs text-slate-500">
                  Visualização sequencial das OPs por máquina/setor ao longo do horizonte de fabricação.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-emerald-500 rounded-xs" /> Concluído
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-600 rounded-xs" /> Em Andamento
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-slate-400 rounded-xs" /> Programado
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {mrpResult?.ganttInicial.map((gantt) => (
                <div key={gantt.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{gantt.ordemProducaoNumero}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        {gantt.codigoItem}
                      </span>
                      <span className="text-xs text-slate-500">({gantt.quantidade} UN)</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Cliente: <strong className="text-slate-800">{gantt.clienteNome}</strong></span>
                      <span>
                        Início: <strong>{new Date(gantt.dataInicio).toLocaleDateString('pt-BR')}</strong>
                      </span>
                      <span>
                        Fim: <strong>{new Date(gantt.dataFim).toLocaleDateString('pt-BR')}</strong>
                      </span>
                      <span className="font-bold text-blue-700">{gantt.progressoPercentual}%</span>
                    </div>
                  </div>

                  {/* Barra Principal de Progresso da OP */}
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-4">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${gantt.progressoPercentual}%` }}
                    />
                  </div>

                  {/* Operações Detalhadas do Gantt */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                    {gantt.operacoes.map((op) => (
                      <div
                        key={op.operacaoId}
                        className={`p-2.5 rounded-lg border text-xs ${
                          op.status === 'CONCLUIDA'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : op.status === 'EM_ANDAMENTO'
                            ? 'bg-blue-50 border-blue-200 text-blue-900'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-[11px]">
                            Op {op.sequencia}: {op.nome}
                          </span>
                          <span className="text-[10px] font-semibold">{op.duracaoHoras}h</span>
                        </div>
                        <div className="text-[10px] opacity-80 line-clamp-1">{op.maquinaNome}</div>
                        <div className="text-[9px] mt-1 font-mono">
                          {new Date(op.dataInicio).toLocaleDateString('pt-BR')} → {new Date(op.dataFim).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 8: ORDENS DE PRODUÇÃO */}
        {activePcpTab === 'ordens' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Painel de Ordens de Produção (OPs)</h3>
                <p className="text-xs text-slate-500">
                  Gerenciamento de status, materiais consumidos, roteiro operacional e apontamentos.
                </p>
              </div>
              <button
                onClick={() => setModalNovaOp(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar OP</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {ordensProducao.map((op) => (
                <div key={op.id} className="p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-900">{op.numero}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
                          {op.quantidadePlanejada} {op.unidadeMedida}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            op.status === 'CONCLUIDA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : op.status === 'EM_PROCESSO'
                              ? 'bg-blue-100 text-blue-800'
                              : op.status === 'LIBERADA'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {op.status}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          Origem: {op.origemTipo} {op.origemDocumentoNumero ? `(${op.origemDocumentoNumero})` : ''}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-1 font-mono">{op.codigoItem} - {op.descricaoItem}</p>
                      {op.clienteNome && <p className="text-xs text-slate-500">Cliente: {op.clienteNome}</p>}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Início Previsto</span>
                        <span className="font-bold text-slate-800">{new Date(op.dataInicioPrevista).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Entrega Prometida</span>
                        <span className="font-bold text-slate-800">{new Date(op.dataEntregaPrometida).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Operações</span>
                        <span className="font-bold text-indigo-700">{op.operacoes.length} etapas</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Materiais BOM</span>
                        <span className="font-bold text-slate-800">{op.materiaisRequeridos.length} itens</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {op.status === 'PLANEJADA' && (
                        <button
                          onClick={() => handleAtualizarStatusOP(op.id, 'LIBERADA')}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Liberar OP
                        </button>
                      )}
                      {op.status === 'LIBERADA' && (
                        <button
                          onClick={() => handleAtualizarStatusOP(op.id, 'EM_PROCESSO')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Iniciar Produção
                        </button>
                      )}
                      {op.status === 'EM_PROCESSO' && (
                        <button
                          onClick={() => handleAtualizarStatusOP(op.id, 'CONCLUIDA')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Concluir OP
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 9: CALENDÁRIO & TURNOS */}
        {activePcpTab === 'calendario' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">Configuração do Calendário e Regime Fabril</h3>
              <p className="text-xs text-slate-500">
                Turnos de trabalho, paradas programadas de manutenção e cálculo de horas úteis da fábrica.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Turnos */}
              <div className="border border-slate-200 rounded-xl p-5">
                <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Turnos de Produção Ativos
                </h4>
                <div className="space-y-3">
                  {calendario?.turnos?.map((t: any) => (
                    <div key={t.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900">{t.nome}</div>
                        <div className="text-slate-500 text-[11px]">
                          {t.horaInicio} às {t.horaFim} ({t.horasUteisTurno}h líquidas de trabalho)
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-800 text-[10px]">
                        {t.diasSemana.length} Dias / Semana
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manutenções Programadas */}
              <div className="border border-slate-200 rounded-xl p-5">
                <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-orange-600" />
                  Manutenções Industriais Programadas
                </h4>
                <div className="space-y-3">
                  {manutencoes.map((manut: any) => (
                    <div key={manut.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{manut.maquinaNome}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          manut.status === 'EM_ANDAMENTO' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {manut.tipo} ({manut.status})
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{manut.descricao}</p>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(manut.dataInicio).toLocaleDateString('pt-BR')} até {new Date(manut.dataFim).toLocaleDateString('pt-BR')} ({manut.duracaoHoras}h)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE RASTREABILIDADE DA ORIGEM */}
      {modalRastreabilidade && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Rastreabilidade Total da Origem da Demanda
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Item: {modalRastreabilidade.codigoItem} - {modalRastreabilidade.descricao}
                </p>
              </div>
              <button
                onClick={() => setModalRastreabilidade(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {modalRastreabilidade.origemRastreavel?.map((origem: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-blue-700 font-mono">{origem.documentoOrigemNumero}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      {origem.tipoOrigem}
                    </span>
                  </div>
                  {origem.clienteNome && (
                    <p className="text-slate-700">
                      Cliente: <strong>{origem.clienteNome}</strong>
                    </p>
                  )}
                  <p className="text-slate-600 leading-relaxed">{origem.justificativaCalculo}</p>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-mono">
                    <span>Qtd Demandada: {origem.quantidadeDemandada}</span>
                    {origem.dataPrometida && (
                      <span>Prazo: {new Date(origem.dataPrometida).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setModalRastreabilidade(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO MANUAL DE OP */}
      {modalNovaOp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Nova Ordem de Produção Manual</h3>
                <p className="text-xs text-slate-500">
                  Crie uma nova OP com roteiro e materiais alocados pelo PCP.
                </p>
              </div>
              <button
                onClick={() => setModalNovaOp(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCriarNovaOPManual} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Código do Produto / Projeto:</label>
                <input
                  type="text"
                  value={novaOpCodigo}
                  onChange={(e) => setNovaOpCodigo(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descrição do Produto:</label>
                <input
                  type="text"
                  value={novaOpDescricao}
                  onChange={(e) => setNovaOpDescricao(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantidade:</label>
                  <input
                    type="number"
                    min="1"
                    value={novaOpQtd}
                    onChange={(e) => setNovaOpQtd(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prioridade:</label>
                  <select
                    value={novaOpPrioridade}
                    onChange={(e: any) => setNovaOpPrioridade(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value="BAIXA">Baixa</option>
                    <option value="NORMAL">Normal</option>
                    <option value="ALTA">Alta</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Data Prometida de Entrega:</label>
                <input
                  type="date"
                  value={novaOpDataEntrega}
                  onChange={(e) => setNovaOpDataEntrega(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovaOp(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Criar e Alocar OP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
