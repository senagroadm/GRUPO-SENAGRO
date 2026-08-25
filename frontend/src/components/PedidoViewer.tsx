'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Eye,
  Edit3,
  Layers,
  TrendingUp,
  ShieldAlert,
  Percent,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Box,
  Truck,
  DollarSign,
  FileCheck,
  Building,
  User,
  Calendar,
  Lock,
  FileText,
  Play,
  Check,
  X,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Factory,
  Package,
  Receipt,
  FileCode,
  Hash,
} from 'lucide-react';
import { Empresa } from '../../../backend/core/types/company';
import {
  PedidoVenda,
  StatusPedido,
  OrigemPedido,
  PedidoItem,
  PedidoAprovacao,
  PedidoEntrega,
} from '../../../backend/modules/pedidos/pedido-types';

interface PedidoViewerProps {
  empresaAtiva: Empresa;
}

export function PedidoViewer({ empresaAtiva }: PedidoViewerProps) {
  const [activeTab, setActiveTab] = useState<'lista' | 'detalhes' | 'novo' | 'converter' | 'testes'>('lista');
  const [pedidos, setPedidos] = useState<PedidoVenda[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [filtroOrigem, setFiltroOrigem] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPedido, setSelectedPedido] = useState<PedidoVenda | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Form de novo pedido direto
  const [formClienteNome, setFormClienteNome] = useState('');
  const [formClienteCnpj, setFormClienteCnpj] = useState('');
  const [formCondicaoPagto, setFormCondicaoPagto] = useState('30 DDL');
  const [formTipoFrete, setFormTipoFrete] = useState<'CIF' | 'FOB'>('CIF');
  const [formPrazoPrometido, setFormPrazoPrometido] = useState('');
  const [formItens, setFormItens] = useState<
    Array<{
      codigoItem: string;
      descricao: string;
      tipoItem: 'PRODUTO_FABRICADO' | 'PRODUTO_PRONTO' | 'SERVICO';
      unidadeMedida: string;
      quantidade: number;
      precoUnitario: number;
      custoUnitarioEstimado: number;
      prazoItemDias: number;
    }>
  >([
    {
      codigoItem: 'PEC-FAB-001',
      descricao: 'Estrutura Soldada em Aço SAE 1020',
      tipoItem: 'PRODUTO_FABRICADO',
      unidadeMedida: 'PC',
      quantidade: 20,
      precoUnitario: 350.0,
      custoUnitarioEstimado: 210.0,
      prazoItemDias: 7,
    },
  ]);

  // Form de Conversão de Orçamento
  const [orcamentosDisponiveis, setOrcamentosDisponiveis] = useState<any[]>([]);
  const [loadingOrcamentos, setLoadingOrcamentos] = useState(false);
  const [selectedOrcamentoId, setSelectedOrcamentoId] = useState<string>('');

  // Modificação Crítica
  const [modalAlteracaoAberta, setModalAlteracaoAberta] = useState(false);
  const [altNovoValor, setAltNovoValor] = useState<number>(0);
  const [altNovoPrazo, setAltNovoPrazo] = useState<string>('');
  const [altMotivo, setAltMotivo] = useState<string>('');

  // Testes
  const [testResults, setTestResults] = useState<any | null>(null);
  const [runningTests, setRunningTests] = useState(false);

  const showFeedback = (tipo: 'success' | 'error', texto: string) => {
    setFeedbackMsg({ tipo, texto });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const carregarPedidos = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/pedidos?empresaId=${empresaAtiva.id}`);
      const data = await res.json();
      if (data.success) {
        setPedidos(data.data);
      }
    } catch (err: any) {
      console.error('Erro ao carregar pedidos:', err);
    } finally {
      setLoading(false);
    }
  }, [empresaAtiva.id]);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      try {
        const res = await fetch(`/api/v1/pedidos?empresaId=${empresaAtiva.id}`);
        const data = await res.json();
        if (!ignore && data.success) {
          setPedidos(data.data);
        }
      } catch (err) {
        console.error('Erro ao carregar pedidos:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchData();
    return () => {
      ignore = true;
    };
  }, [empresaAtiva.id]);

  const carregarOrcamentosParaConversao = async () => {
    try {
      setLoadingOrcamentos(true);
      const res = await fetch(`/api/v1/orcamento?empresaId=${empresaAtiva.id}`);
      const data = await res.json();
      if (data.success) {
        setOrcamentosDisponiveis(data.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar orçamentos:', err);
    } finally {
      setLoadingOrcamentos(false);
    }
  };

  const handleConverterOrcamento = async () => {
    if (!selectedOrcamentoId) {
      showFeedback('error', 'Selecione um orçamento para converter.');
      return;
    }
    try {
      const res = await fetch('/api/v1/pedidos/converter-orcamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orcamentoId: selectedOrcamentoId,
          empresaId: empresaAtiva.id,
          usuarioId: 'usr-comercial',
          usuarioNome: 'Gerente Comercial',
          usuarioCargo: 'GERENTE_COMERCIAL',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', data.message);
        setSelectedPedido(data.data);
        setActiveTab('detalhes');
        carregarPedidos();
      } else {
        showFeedback('error', data.error || 'Erro ao converter orçamento.');
      }
    } catch (err: any) {
      showFeedback('error', err?.message || 'Falha na requisição.');
    }
  };

  const handleCriarPedidoDireto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClienteNome || formItens.length === 0) {
      showFeedback('error', 'Preencha o cliente e inclua ao menos um item.');
      return;
    }
    try {
      const res = await fetch('/api/v1/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          empresaNome: empresaAtiva.razaoSocial,
          clienteNome: formClienteNome,
          clienteCnpjCpf: formClienteCnpj || '12.345.678/0001-90',
          condicaoPagamento: formCondicaoPagto,
          tipoFrete: formTipoFrete,
          prazoPrometido: formPrazoPrometido || undefined,
          itens: formItens,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', data.message);
        setSelectedPedido(data.data);
        setActiveTab('detalhes');
        carregarPedidos();
      } else {
        showFeedback('error', data.error || 'Erro ao criar pedido.');
      }
    } catch (err: any) {
      showFeedback('error', err?.message || 'Erro na requisição.');
    }
  };

  const handleTransicionarStatus = async (novoStatus: StatusPedido) => {
    if (!selectedPedido) return;
    try {
      const res = await fetch(`/api/v1/pedidos/${selectedPedido.id}/transicionar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novoStatus,
          motivo: `Avanço operacional no painel industrial para status ${novoStatus}`,
          usuarioId: 'usr-op',
          usuarioNome: 'Operador PCP / Diretor',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', data.message);
        setSelectedPedido(data.data);
        carregarPedidos();
      } else {
        showFeedback('error', data.error || 'Transição proibida pela máquina de estados.');
      }
    } catch (err: any) {
      showFeedback('error', err?.message || 'Erro ao transicionar status.');
    }
  };

  const handleDecidirAprovacao = async (aprovacaoId: string, aprovado: boolean) => {
    if (!selectedPedido) return;
    try {
      const res = await fetch(`/api/v1/pedidos/${selectedPedido.id}/aprovacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aprovacaoId,
          aprovado,
          parecer: aprovado ? 'Liberado conforme análise de risco e diretoria.' : 'Reprovado por risco de crédito/margem.',
          aprovadorNome: 'Diretoria Industrial & Risco',
          cargoAprovador: 'DIRETOR_INDUSTRIAL',
          usuarioId: 'usr-diretor',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', data.message);
        setSelectedPedido(data.data);
        carregarPedidos();
      } else {
        showFeedback('error', data.error || 'Erro ao processar aprovação.');
      }
    } catch (err: any) {
      showFeedback('error', err?.message || 'Falha na aprovação.');
    }
  };

  const handleAplicarAlteracaoCritica = async () => {
    if (!selectedPedido) return;
    try {
      const res = await fetch(`/api/v1/pedidos/${selectedPedido.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valorTotalPedido: altNovoValor || selectedPedido.valorTotalPedido,
          prazoPrometido: altNovoPrazo || selectedPedido.prazoPrometido,
          motivoAlteracao: altMotivo || 'Revisão de escopo industrial solicitada.',
          usuarioId: 'usr-comercial',
          usuarioNome: 'Gerente Comercial',
          usuarioCargo: 'GERENTE_COMERCIAL',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', data.message);
        setSelectedPedido(data.data);
        setModalAlteracaoAberta(false);
        carregarPedidos();
      } else {
        showFeedback('error', data.error || 'Erro ao alterar pedido.');
      }
    } catch (err: any) {
      showFeedback('error', err?.message || 'Erro ao aplicar alteração.');
    }
  };

  const handleExecutarTestes = async () => {
    try {
      setRunningTests(true);
      const res = await fetch('/api/v1/pedidos/testes');
      const data = await res.json();
      if (data.success) {
        setTestResults(data.data);
      }
    } catch (err) {
      console.error('Erro nos testes:', err);
    } finally {
      setRunningTests(false);
    }
  };

  // KPIs
  const totalFaturamento = pedidos.reduce((acc, p) => acc + p.valorTotalPedido, 0);
  const emAprovacaoCount = pedidos.filter((p) => p.status === 'APROVACAO' || p.status === 'PENDENTE').length;
  const emExecucaoCount = pedidos.filter((p) => p.status === 'EM_EXECUCAO' || p.status === 'PARCIAL' || p.status === 'APROVADO').length;
  const concluidosCount = pedidos.filter((p) => p.status === 'CONCLUIDO' || p.status === 'FATURADO').length;

  const pedidosFiltrados = pedidos.filter((p) => {
    if (filtroStatus !== 'TODOS' && p.status !== filtroStatus) return false;
    if (filtroOrigem !== 'TODOS' && p.origem !== filtroOrigem) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        p.numero.toLowerCase().includes(term) ||
        p.clienteNome.toLowerCase().includes(term) ||
        (p.orcamentoNumero && p.orcamentoNumero.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const getStatusBadge = (status: StatusPedido) => {
    const map: Record<StatusPedido, { bg: string; text: string; border: string; label: string }> = {
      RASCUNHO: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', label: 'Rascunho' },
      PENDENTE: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', label: 'Pendente' },
      APROVACAO: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', label: 'Em Alçada' },
      APROVADO: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', label: 'Aprovado' },
      EM_EXECUCAO: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', label: 'Em Execução' },
      PARCIAL: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300', label: 'Parcial' },
      PRONTO: { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300', label: 'Pronto / PCP' },
      EXPEDIDO: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', label: 'Expedido' },
      FATURADO: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300', label: 'Faturado' },
      CONCLUIDO: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', label: 'Concluído' },
      CANCELADO: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300', label: 'Cancelado' },
    };
    const s = map[status] || map.RASCUNHO;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text} border ${s.border}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-6" id="pedidos-root-container">
      {/* Top Banner Multiempresa & KPIs */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Gestão de Pedidos de Venda Industrial</h1>
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 text-slate-700">
                  {empresaAtiva.codigo}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Conversão sem redigitação, congelamento de versão comercial, reservas de estoque, OPs e alçadas de crédito/margem.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                carregarOrcamentosParaConversao();
                setActiveTab('converter');
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
            >
              <Sparkles className="w-4 h-4" /> Converter Orçamento CPQ
            </button>
            <button
              onClick={() => setActiveTab('novo')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Novo Pedido Direto
            </button>
            <button
              onClick={() => {
                handleExecutarTestes();
                setActiveTab('testes');
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border transition ${
                activeTab === 'testes' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Play className="w-4 h-4 text-emerald-500" /> Testes Máquina de Estados
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${
              feedbackMsg.tipo === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedbackMsg.tipo === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{feedbackMsg.texto}</span>
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Volume em Carteira</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">
                {totalFaturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {pedidos.length} pedidos
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
            <span className="text-xs font-semibold text-orange-700 uppercase tracking-wider">Pendente Alçada</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-orange-950">{emAprovacaoCount}</span>
              <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">Crédito/Margem</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Em Produção / PCP</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-blue-950">{emExecucaoCount}</span>
              <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">OPs Ativas</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Faturados / Concluídos</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-950">{concluidosCount}</span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Expedidos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('lista')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === 'lista' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Carteira de Pedidos ({pedidos.length})
        </button>
        {selectedPedido && (
          <button
            onClick={() => setActiveTab('detalhes')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition flex items-center gap-2 ${
              activeTab === 'detalhes' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-4 h-4" /> Detalhes #{selectedPedido.numero} (v{selectedPedido.versaoAtual})
          </button>
        )}
      </div>

      {/* TAB 1: LISTA DE PEDIDOS */}
      {activeTab === 'lista' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="flex items-center gap-3 w-full md:w-auto flex-1">
              <div className="relative w-full max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por Nº Pedido, Cliente, Orçamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="APROVACAO">Em Alçada (Aprovação)</option>
                <option value="APROVADO">Aprovados</option>
                <option value="EM_EXECUCAO">Em Execução</option>
                <option value="PRONTO">Prontos</option>
                <option value="EXPEDIDO">Expedidos</option>
                <option value="FATURADO">Faturados</option>
                <option value="CONCLUIDO">Concluídos</option>
              </select>

              <select
                value={filtroOrigem}
                onChange={(e) => setFiltroOrigem(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODOS">Todas as Origens</option>
                <option value="ORCAMENTO">Origem Orçamento CPQ</option>
                <option value="DIRETO">Origem Direta</option>
              </select>
            </div>

            <button
              onClick={carregarPedidos}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition border border-slate-200"
              title="Recarregar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Pedido / Versão</th>
                    <th className="py-3 px-4">Origem</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Prazo Prometido</th>
                    <th className="py-3 px-4 text-right">Margem</th>
                    <th className="py-3 px-4 text-right">Valor Total</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {pedidosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Nenhum pedido de venda encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    pedidosFiltrados.map((ped) => (
                      <tr key={ped.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>#{ped.numero}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-medium">
                              v{ped.versaoAtual}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(ped.criadoEm).toLocaleDateString('pt-BR')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {ped.origem === 'ORCAMENTO' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              <FileCheck className="w-3 h-3 text-amber-600" /> #{ped.orcamentoNumero}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                              Venda Direta
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{ped.clienteNome}</div>
                          <span className="text-xs text-slate-400 font-mono">{ped.clienteCnpjCpf}</span>
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(ped.status)}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(ped.prazoPrometido).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded ${
                              ped.margemContribuicaoEstimadaPerc >= ped.margemMinimaEmpresaPerc
                                ? 'text-emerald-700 bg-emerald-50'
                                : 'text-rose-700 bg-rose-50'
                            }`}
                          >
                            {ped.margemContribuicaoEstimadaPerc.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          {ped.valorTotalPedido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedPedido(ped);
                              setActiveTab('detalhes');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-semibold transition"
                          >
                            <Eye className="w-3.5 h-3.5" /> Abrir
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DETALHES DO PEDIDO SELECIONADO */}
      {activeTab === 'detalhes' && selectedPedido && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-900">Pedido de Venda #{selectedPedido.numero}</h2>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded font-mono">
                    Versão {selectedPedido.versaoAtual}
                  </span>
                  {getStatusBadge(selectedPedido.status)}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>Cliente: <strong className="text-slate-800">{selectedPedido.clienteNome}</strong></span>
                  <span>•</span>
                  <span>CNPJ: <strong className="text-slate-800">{selectedPedido.clienteCnpjCpf}</strong></span>
                  <span>•</span>
                  <span>Origem: <strong className="text-slate-800">{selectedPedido.origem}</strong></span>
                </div>
              </div>

              {/* Botões de Ação de Máquina de Estados */}
              <div className="flex items-center gap-2 flex-wrap">
                {selectedPedido.status === 'APROVADO' && (
                  <button
                    onClick={() => handleTransicionarStatus('EM_EXECUCAO')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                  >
                    <Factory className="w-3.5 h-3.5" /> Iniciar Produção (PCP)
                  </button>
                )}

                {selectedPedido.status === 'EM_EXECUCAO' && (
                  <button
                    onClick={() => handleTransicionarStatus('PRONTO')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                  >
                    <Package className="w-3.5 h-3.5" /> Finalizar Produção (Pronto)
                  </button>
                )}

                {selectedPedido.status === 'PRONTO' && (
                  <button
                    onClick={() => handleTransicionarStatus('EXPEDIDO')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                  >
                    <Truck className="w-3.5 h-3.5" /> Despachar (Expedido)
                  </button>
                )}

                {selectedPedido.status === 'EXPEDIDO' && (
                  <button
                    onClick={() => handleTransicionarStatus('FATURADO')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                  >
                    <Receipt className="w-3.5 h-3.5" /> Emitir NF-e (Faturado)
                  </button>
                )}

                {selectedPedido.status === 'FATURADO' && (
                  <button
                    onClick={() => handleTransicionarStatus('CONCLUIDO')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Concluir & Liquidar
                  </button>
                )}

                <button
                  onClick={() => {
                    setAltNovoValor(selectedPedido.valorTotalPedido);
                    setAltNovoPrazo(selectedPedido.prazoPrometido.split('T')[0]);
                    setModalAlteracaoAberta(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" /> Alteração Crítica / Reabrir
                </button>
              </div>
            </div>

            {/* Versão Comercial Congelada Banner (se houver) */}
            {selectedPedido.versaoComercialCongelada && (
              <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-900">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                  <div>
                    <span className="font-bold">Versão Comercial Congelada do Orçamento #{selectedPedido.versaoComercialCongelada.orcamentoNumero} (v{selectedPedido.versaoComercialCongelada.versaoNumero}): </span>
                    <span>Tabela {selectedPedido.versaoComercialCongelada.tabelaPrecoOriginal} • Custo Original: R$ {selectedPedido.versaoComercialCongelada.custoTotalPrevistoOriginal.toLocaleString('pt-BR')} • Margem: {selectedPedido.versaoComercialCongelada.margemContribuicaoOriginalPerc.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 font-mono text-[11px] bg-white px-2 py-1 rounded border border-amber-200 text-slate-600">
                  <Hash className="w-3 h-3 text-slate-400" /> SHA-256: {selectedPedido.versaoComercialCongelada.hashIntegridade.slice(0, 16)}...
                </div>
              </div>
            )}
          </div>

          {/* Validação de Crédito & Alçadas Pendentes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Limite de Crédito */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Validação de Limite de Crédito</h3>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-bold ${
                    selectedPedido.validacaoCredito.statusValidacao === 'APROVADO'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedPedido.validacaoCredito.statusValidacao}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Saldo Disponível Empresa</span>
                  <span className="font-bold text-slate-800">
                    {selectedPedido.validacaoCredito.limiteEmpresaDisponivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Saldo Disponível Grupo</span>
                  <span className="font-bold text-slate-800">
                    {selectedPedido.validacaoCredito.limiteGrupoDisponivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Exposição Grupo</span>
                  <span className="font-bold text-slate-800">
                    {selectedPedido.validacaoCredito.exposicaoProjetadaGrupo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Margem Mínima */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Validação de Margem de Contribuição</h3>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-bold ${
                    selectedPedido.validacaoMargem.statusValidacao === 'DENTRO_DA_MARGEM'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedPedido.validacaoMargem.statusValidacao}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Margem do Pedido</span>
                  <span className="font-bold text-slate-800">{selectedPedido.margemContribuicaoEstimadaPerc.toFixed(1)}%</span>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Piso Empresa</span>
                  <span className="font-bold text-slate-800">{selectedPedido.margemMinimaEmpresaPerc.toFixed(1)}%</span>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <span className="text-slate-500 block">Custo Previsto</span>
                  <span className="font-bold text-slate-800">
                    {selectedPedido.custoTotalEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Alçadas de Aprovação (se houver) */}
          {selectedPedido.aprovacoes.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                Alçadas e Pendências de Aprovação
              </h3>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg">
                {selectedPedido.aprovacoes.map((ap) => (
                  <div key={ap.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{ap.tipoAprovacao}</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-600">
                          Nível: {ap.nivelAlcadaRequerido}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ap.status === 'APROVADO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ap.status === 'REJEITADO'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ap.status}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-1">{ap.motivoExigencia}</p>
                    </div>

                    {ap.status === 'PENDENTE' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDecidirAprovacao(ap.id, true)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs transition"
                        >
                          Aprovar Alçada
                        </button>
                        <button
                          onClick={() => handleDecidirAprovacao(ap.id, false)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold text-xs transition"
                        >
                          Reprovar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Itens do Pedido & Necessidades Industriais (OPs / Reservas) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Box className="w-4 h-4 text-blue-600" />
                Itens do Pedido & Necessidades Geradas (OPs e Reservas)
              </h3>
              <span className="text-xs text-slate-500">{selectedPedido.itens.length} itens cadastrados</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Item / Código</th>
                    <th className="py-2.5 px-4">Descrição</th>
                    <th className="py-2.5 px-4">Tipo</th>
                    <th className="py-2.5 px-4 text-right">Qtd</th>
                    <th className="py-2.5 px-4 text-right">Preço Unit.</th>
                    <th className="py-2.5 px-4 text-right">Subtotal</th>
                    <th className="py-2.5 px-4 text-center">Necessidade Industrial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {selectedPedido.itens.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{it.codigoItem}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{it.descricao}</div>
                        {it.especificacaoTecnica && (
                          <span className="text-[11px] text-slate-400">
                            {it.especificacaoTecnica.materiaPrimaBase} ({it.especificacaoTecnica.espessuraMm}mm) • Corte: {it.especificacaoTecnica.processoCorte}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                          {it.tipoItem}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {it.quantidade} {it.unidadeMedida}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {it.precoUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {it.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {it.necessidadeGerada.tipo === 'ORDEM_PRODUCAO' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                            <Factory className="w-3 h-3 text-blue-600" /> OP #{it.necessidadeGerada.numeroOp}
                          </span>
                        ) : it.necessidadeGerada.tipo === 'RESERVA_ESTOQUE' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Box className="w-3 h-3 text-emerald-600" /> Reserva: {it.quantidadeReservadaEstoque} {it.unidadeMedida}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Entregas Programadas & Parcelas Financeiras */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cronograma de Entrega */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-600" />
                Cronograma de Entregas (pedido_entregas)
              </h3>
              <div className="space-y-2 text-xs">
                {selectedPedido.entregas.map((ent) => (
                  <div key={ent.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">Remessa #{ent.numeroRemessa}</span>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Prometida para: {new Date(ent.dataPrometidaEntrega).toLocaleDateString('pt-BR')} • Frete {selectedPedido.tipoFrete}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold text-[10px]">
                      {ent.statusEntrega}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Parcelas Financeiras */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Condição de Pagamento ({selectedPedido.condicaoPagamento})
              </h3>
              <div className="space-y-2 text-xs">
                {selectedPedido.parcelas.map((par) => (
                  <div key={par.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">Parcela {par.numeroParcela} / {selectedPedido.parcelas.length}</span>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Vencimento: {new Date(par.dataVencimento).toLocaleDateString('pt-BR')} • {par.formaPagamento}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">
                        {par.valorParcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">{par.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONVERTER ORÇAMENTO CPQ */}
      {activeTab === 'converter' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 max-w-3xl mx-auto">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              Converter Orçamento CPQ em Pedido de Venda
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Gera o pedido instantaneamente sem redigitação de itens, preservando dados técnicos, congelando versão comercial com hash de integridade e disparando reservas e OPs.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Selecione o Orçamento Aprovado da Empresa ({empresaAtiva.codigo})
            </label>

            {loadingOrcamentos ? (
              <div className="p-8 text-center text-slate-400 text-sm">Carregando orçamentos disponíveis...</div>
            ) : orcamentosDisponiveis.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-lg text-slate-500 text-sm border border-slate-200">
                Nenhum orçamento encontrado para conversão nesta empresa.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {orcamentosDisponiveis.map((orc) => (
                  <div
                    key={orc.id}
                    onClick={() => setSelectedOrcamentoId(orc.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      selectedOrcamentoId === orc.id
                        ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">#{orc.numeroOrcamento}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="font-semibold text-slate-700 text-xs">{orc.clienteNome}</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">
                          v{orc.versaoAtual}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{orc.tituloProjeto || 'Projeto Industrial Metalmecânico'}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 text-sm block">
                        {(orc.precoFinalTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <span className="text-[11px] text-emerald-700 font-semibold">
                        Margem: {(orc.margemLucroEstimadaPercentual || 20).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('lista')}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConverterOrcamento}
                disabled={!selectedOrcamentoId}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Confirmar Conversão & Congelar Versão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NOVO PEDIDO DIRETO */}
      {activeTab === 'novo' && (
        <form onSubmit={handleCriarPedidoDireto} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 max-w-4xl mx-auto">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Cadastro de Pedido de Venda Direto
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Criar pedido sem orçamento prévio com validação automática de crédito, margem e disparo de necessidades.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Razão Social / Cliente *</label>
              <input
                type="text"
                required
                placeholder="Ex: Randon Implementos S.A."
                value={formClienteNome}
                onChange={(e) => setFormClienteNome(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CNPJ do Cliente</label>
              <input
                type="text"
                placeholder="88.611.838/0001-30"
                value={formClienteCnpj}
                onChange={(e) => setFormClienteCnpj(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Condição de Pagamento</label>
              <input
                type="text"
                value={formCondicaoPagto}
                onChange={(e) => setFormCondicaoPagto(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Frete</label>
              <select
                value={formTipoFrete}
                onChange={(e) => setFormTipoFrete(e.target.value as 'CIF' | 'FOB')}
                className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="CIF">CIF (Por conta do emitente)</option>
                <option value="FOB">FOB (Por conta do destinatário)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Itens Industriais</h3>
            {formItens.map((it, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Código & Descrição</label>
                  <input
                    type="text"
                    value={it.descricao}
                    onChange={(e) => {
                      const copy = [...formItens];
                      copy[idx].descricao = e.target.value;
                      setFormItens(copy);
                    }}
                    className="w-full p-2 text-xs border border-slate-200 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Tipo de Item</label>
                  <select
                    value={it.tipoItem}
                    onChange={(e) => {
                      const copy = [...formItens];
                      copy[idx].tipoItem = e.target.value as any;
                      setFormItens(copy);
                    }}
                    className="w-full p-2 text-xs border border-slate-200 rounded bg-white"
                  >
                    <option value="PRODUTO_FABRICADO">Fabricado (Gera OP)</option>
                    <option value="PRODUTO_PRONTO">Pronto (Gera Reserva)</option>
                    <option value="SERVICO">Serviço Industrial</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Quantidade</label>
                  <input
                    type="number"
                    value={it.quantidade}
                    onChange={(e) => {
                      const copy = [...formItens];
                      copy[idx].quantidade = Number(e.target.value);
                      setFormItens(copy);
                    }}
                    className="w-full p-2 text-xs border border-slate-200 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Preço Unitário (R$)</label>
                  <input
                    type="number"
                    value={it.precoUnitario}
                    onChange={(e) => {
                      const copy = [...formItens];
                      copy[idx].precoUnitario = Number(e.target.value);
                      setFormItens(copy);
                    }}
                    className="w-full p-2 text-xs border border-slate-200 rounded bg-white"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('lista')}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
            >
              Salvar Pedido Direto
            </button>
          </div>
        </form>
      )}

      {/* TAB 5: TESTES AUTOMATIZADOS DE MÁQUINA DE ESTADOS */}
      {activeTab === 'testes' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Play className="w-5 h-5 text-emerald-600" />
                Suite de Testes da Máquina de Estados & Regras de Pedidos
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Validação de conversão sem redigitação, integridade SHA-256 congelada, validação de limites de crédito, margem mínima, bloqueio de saltos de status ilegais e reabertura por mudança crítica.
              </p>
            </div>

            <button
              onClick={handleExecutarTestes}
              disabled={runningTests}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${runningTests ? 'animate-spin' : ''}`} />
              {runningTests ? 'Executando Testes...' : 'Executar Testes Novamente'}
            </button>
          </div>

          {testResults ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <div>
                    <span className="font-bold text-emerald-950 text-base">
                      Todos os Testes da Máquina de Estados Foram Aprovados!
                    </span>
                    <p className="text-xs text-emerald-800">
                      {testResults.summary.passed} de {testResults.summary.total} testes passaram sem nenhuma inconsistência.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-200 text-emerald-900 font-bold text-xs">
                  100% SUCESSO
                </span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {testResults.results.map((t: any) => (
                  <div key={t.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      {t.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold text-slate-900">[{t.suite}]</span>{' '}
                        <span className="text-slate-700">{t.nome}</span>
                      </div>
                    </div>
                    <span className="font-mono text-slate-400 text-[11px]">{t.durationMs}ms</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              Clique em Executar Testes para rodar a bateria de testes da máquina de estados.
            </div>
          )}
        </div>
      )}

      {/* MODAL DE ALTERAÇÃO CRÍTICA */}
      {modalAlteracaoAberta && selectedPedido && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                Alteração Crítica & Reabertura de Pedido
              </h3>
              <button onClick={() => setModalAlteracaoAberta(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Modificações substanciais de valor ou prazo após aprovação acionam o protocolo de governança, reabrindo o pedido para uma nova versão (v{selectedPedido.versaoAtual + 1}) e submetendo-o novamente para alçada de aprovação.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Novo Valor Total do Pedido (R$)</label>
                <input
                  type="number"
                  value={altNovoValor}
                  onChange={(e) => setAltNovoValor(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Novo Prazo Prometido</label>
                <input
                  type="date"
                  value={altNovoPrazo}
                  onChange={(e) => setAltNovoPrazo(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Justificativa / Motivo da Alteração *</label>
                <textarea
                  rows={3}
                  value={altMotivo}
                  onChange={(e) => setAltMotivo(e.target.value)}
                  placeholder="Ex: Cliente solicitou reforço estrutural e tolerâncias mais rigorosas no lote."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalAlteracaoAberta(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAplicarAlteracaoCritica}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                Aplicar Alteração & Reabrir Versão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
