'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  RefreshCw,
  Award,
  TrendingUp,
  FileSpreadsheet,
  Receipt,
  FileText,
  Check,
  X,
  Sliders,
} from 'lucide-react';
import { Empresa } from '../../../backend/core/types/company';
import {
  SolicitacaoCompra,
  CotacaoCompra,
  PedidoCompra,
  RecebimentoCompra,
  DevolucaoCompra,
  HistoricoPrecoCompra,
  AvaliacaoFornecedorIQF,
  PrioridadeCompra,
} from '../../../backend/modules/compras/compras-types';

interface ComprasViewerProps {
  empresaAtiva: Empresa;
}

export function ComprasViewer({ empresaAtiva }: ComprasViewerProps) {
  const [activeTab, setActiveTab] = useState<
    'solicitacoes' | 'cotacoes' | 'pedidos' | 'recebimentos' | 'devolucoes' | 'iqf_precos' | 'nova_solicitacao'
  >('solicitacoes');

  const [loading, setLoading] = useState<boolean>(true);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCompra[]>([]);
  const [cotacoes, setCotacoes] = useState<CotacaoCompra[]>([]);
  const [pedidos, setPedidos] = useState<PedidoCompra[]>([]);
  const [recebimentos, setRecebimentos] = useState<RecebimentoCompra[]>([]);
  const [devolucoes, setDevolucoes] = useState<DevolucaoCompra[]>([]);
  const [historicoPrecos, setHistoricoPrecos] = useState<HistoricoPrecoCompra[]>([]);
  const [fornecedoresIQF, setFornecedoresIQF] = useState<AvaliacaoFornecedorIQF[]>([]);

  // Selected items for modal/detail views
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<SolicitacaoCompra | null>(null);
  const [selectedPedido, setSelectedPedido] = useState<PedidoCompra | null>(null);
  const [selectedRecebimento, setSelectedRecebimento] = useState<RecebimentoCompra | null>(null);

  // Filters
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');

  // Action status feedback toast
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State for Nova Solicitação
  const [formTipoGeracao, setFormTipoGeracao] = useState<'MANUAL' | 'MRP' | 'ESTOQUE_MINIMO' | 'ORDEM_PRODUCAO'>('MRP');
  const [formPrioridade, setFormPrioridade] = useState<PrioridadeCompra>('URGENTE');
  const [formSolicitante, setFormSolicitante] = useState<string>('Engenharia de Suprimentos');
  const [formDepartamento, setFormDepartamento] = useState<string>('PCP & Suprimentos');
  const [formDataNecessidade, setFormDataNecessidade] = useState<string>('2026-09-05');
  const [formJustificativa, setFormJustificativa] = useState<string>(
    'Aquisição de chapas estruturais para atendimento à Ordem de Produção OP-2026-088'
  );
  const [formNumeroOp, setFormNumeroOp] = useState<string>('OP-2026-088');
  const [formClienteNome, setFormClienteNome] = useState<string>('Vale S.A. Mineração');
  const [formItens] = useState<Array<{
    produtoId: string;
    codigoProduto: string;
    descricao: string;
    quantidade: number;
    unidadeMedida: string;
    precoEstimadoUnitario: number;
  }>>([
    {
      produtoId: 'prod-chapa-1020-475',
      codigoProduto: 'MP-CH-1020-4.75',
      descricao: 'Chapa Aço SAE 1020 4.75mm (3/16") x 1500 x 6000mm',
      quantidade: 8,
      unidadeMedida: 'CHAPA',
      precoEstimadoUnitario: 1150.0,
    },
  ]);

  // Quick Recebimento Form State
  const [formRecNumeroNf] = useState<string>('49120');
  const [formRecSerieNf] = useState<string>('1');
  const [formRecChaveNfe] = useState<string>(
    '31260260870004000140550010000491201098421008'
  );
  const [formRecObservacoes] = useState<string>(
    'Conferência física e fiscal realizada. Certificado de usina aprovado pelo controle de qualidade.'
  );

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/compras?empresaId=${empresaAtiva.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSolicitacoes(json.data.solicitacoes || []);
        setCotacoes(json.data.cotacoes || []);
        setPedidos(json.data.pedidos || []);
        setRecebimentos(json.data.recebimentos || []);
        setDevolucoes(json.data.devolucoes || []);
        setHistoricoPrecos(json.data.historicoPrecos || []);
        setFornecedoresIQF(json.data.fornecedoresIQF || []);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados de compras:', err);
    } finally {
      setLoading(false);
    }
  }, [empresaAtiva.id]);

  useEffect(() => {
    let active = true;
    const fetchAll = async () => {
      if (!active) return;
      await carregarDados();
    };
    fetchAll();
    return () => {
      active = false;
    };
  }, [carregarDados]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 6000);
  };

  // Actions
  const handleAprovarSolicitacao = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/compras/solicitacoes/${id}/aprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aprovadorNome: 'Diretoria de Suprimentos',
          parecer: 'Aprovado para cotação competitiva com fornecedores homologados.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || 'Solicitação aprovada com sucesso.');
        carregarDados();
      } else {
        showToast('error', data.error || 'Erro ao aprovar solicitação.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Erro inesperado.');
    }
  };

  const handleCriarCotacao = async (solicitacaoId: string) => {
    try {
      const res = await fetch('/api/v1/compras/cotacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          solicitacaoId,
          compradorNome: 'Especialista em Suprimentos Siderúrgicos',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || 'Cotação multi-critério calculada.');
        setActiveTab('cotacoes');
        carregarDados();
      } else {
        showToast('error', data.error || 'Erro ao criar cotação.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Erro inesperado.');
    }
  };

  const handleAprovarCotacao = async (cotacaoId: string, fornecedorIdVencedor?: string) => {
    try {
      const res = await fetch(`/api/v1/compras/cotacoes/${cotacaoId}/aprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fornecedorIdVencedor,
          aprovadorNome: 'Diretoria de Operações & Compras',
          justificativaEscolha: 'Melhor pontuação ponderada de score IQF, menor lead time e preço competitivo.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || 'Cotação aprovada e Pedido de Compra gerado.');
        setActiveTab('pedidos');
        carregarDados();
      } else {
        showToast('error', data.error || 'Erro ao aprovar cotação.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Erro inesperado.');
    }
  };

  const handleSalvarSolicitacao = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/compras/solicitacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          tipoGeracao: formTipoGeracao,
          prioridade: formPrioridade,
          solicitanteNome: formSolicitante,
          departamento: formDepartamento,
          dataNecessidade: formDataNecessidade,
          justificativa: formJustificativa,
          numeroOp: formNumeroOp,
          clienteNome: formClienteNome,
          itens: formItens,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || 'Solicitação de compra cadastrada com sucesso.');
        setActiveTab('solicitacoes');
        carregarDados();
      } else {
        showToast('error', data.error || 'Erro ao salvar solicitação.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Erro inesperado.');
    }
  };

  const handleProcessarRecebimento = async (pedido: PedidoCompra) => {
    try {
      const res = await fetch('/api/v1/compras/recebimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          pedidoCompraId: pedido.id,
          numeroNf: formRecNumeroNf || '51920',
          serieNf: formRecSerieNf || '1',
          chaveAcessoNfe: formRecChaveNfe,
          observacoes: formRecObservacoes,
          itens: pedido.itens.map((it) => ({
            pedidoCompraItemId: it.id,
            quantidadeEntregue: it.quantidadePendente || it.quantidade,
            quantidadeAprovada: it.quantidadePendente || it.quantidade,
            quantidadeRejeitada: 0,
            numeroLoteUsina: 'USI-2026-LOTE-09',
            numeroCorrida: 'USI-RUN-2026-9988',
            certificadoUsinaNumero: 'CERT-USI-88992-BR',
            laudoQualidadeNumero: 'LAUDO-2026-001',
            almoxarifadoDestinoId: 'alm-chapas-tritech-01',
            localizacaoDestinoId: 'loc-rack-chapa-01',
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || 'Recebimento físico e fiscal processado com entrada no estoque.');
        setActiveTab('recebimentos');
        carregarDados();
      } else {
        showToast('error', data.error || 'Erro ao processar recebimento.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Erro inesperado.');
    }
  };

  // KPIs
  const totalSolicitacoes = solicitacoes.length;
  const solicitacoesAprovadas = solicitacoes.filter((s) => s.status === 'APROVADA' || s.status === 'EM_COTACAO').length;
  const totalCotacoes = cotacoes.length;
  const totalPedidos = pedidos.length;
  const valorTotalPedidos = pedidos.reduce((acc, p) => acc + p.valorTotalItens, 0);
  const totalRecebimentos = recebimentos.length;
  const totalDevolucoes = devolucoes.length;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              MÓDULO 07
            </span>
            <span className="text-xs text-slate-400 font-mono">SUPRIMENTOS & SIDERURGIA</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            Compras & Gestão de Suprimentos
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Requisições disparadas por MRP/OP, mapa de cotação multi-critério ponderado com alçadas de aprovação, pedidos de compra oficiais, conferência física/fiscal com entrada em estoque e IQF de fornecedores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={carregarDados}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={() => setActiveTab('nova_solicitacao')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Solicitação de Compra
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Solicitações</div>
          <div className="text-xl font-bold text-slate-900">{totalSolicitacoes}</div>
          <div className="text-[10px] text-blue-600 font-medium mt-1">{solicitacoesAprovadas} aptas para cotação</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mapas de Cotação</div>
          <div className="text-xl font-bold text-slate-900">{totalCotacoes}</div>
          <div className="text-[10px] text-purple-600 font-medium mt-1">Multi-critério ponderado</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ordens de Compra</div>
          <div className="text-xl font-bold text-slate-900">{totalPedidos}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">
            R$ {valorTotalPedidos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Recebimentos NF-e</div>
          <div className="text-xl font-bold text-slate-900">{totalRecebimentos}</div>
          <div className="text-[10px] text-teal-600 font-medium mt-1">Entrada em Estoque + AP</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Devoluções / RNC</div>
          <div className="text-xl font-bold text-slate-900">{totalDevolucoes}</div>
          <div className="text-[10px] text-amber-600 font-medium mt-1">Com estorno de estoque</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fornecedores IQF</div>
          <div className="text-xl font-bold text-slate-900">{fornecedoresIQF.length}</div>
          <div className="text-[10px] text-indigo-600 font-medium mt-1">Siderurgia Homologada</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex flex-wrap gap-1 shadow-xs">
        <button
          onClick={() => setActiveTab('solicitacoes')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'solicitacoes'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Solicitações ({solicitacoes.length})
        </button>

        <button
          onClick={() => setActiveTab('cotacoes')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'cotacoes'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Mapa de Cotação Multi-critério ({cotacoes.length})
        </button>

        <button
          onClick={() => setActiveTab('pedidos')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'pedidos'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Pedidos de Compra ({pedidos.length})
        </button>

        <button
          onClick={() => setActiveTab('recebimentos')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'recebimentos'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          Recebimento Físico/Fiscal ({recebimentos.length})
        </button>

        <button
          onClick={() => setActiveTab('devolucoes')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'devolucoes'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Devoluções ({devolucoes.length})
        </button>

        <button
          onClick={() => setActiveTab('iqf_precos')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'iqf_precos'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          IQF & Histórico de Preços
        </button>
      </div>

      {/* TAB 1: SOLICITAÇÕES DE COMPRA */}
      {activeTab === 'solicitacoes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Filtro de Status:</span>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="bg-slate-50 text-slate-800 text-xs font-semibold rounded-md px-2.5 py-1.5 border border-slate-200"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="RASCUNHO">Rascunho</option>
                <option value="PENDENTE_APROVACAO">Pendente Aprovação</option>
                <option value="APROVADA">Aprovadas (Prontas para Cotação)</option>
                <option value="EM_COTACAO">Em Cotação</option>
                <option value="ATENDIDA_TOTAL">Atendida Total</option>
              </select>
            </div>

            <div className="text-xs text-slate-500">
              Mostrando {solicitacoes.length} solicitações vinculadas à empresa ativa.
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Número / Origem</th>
                    <th className="px-4 py-3">Solicitante & Depto</th>
                    <th className="px-4 py-3">Necessidade / OP</th>
                    <th className="px-4 py-3">Itens</th>
                    <th className="px-4 py-3">Prioridade</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {solicitacoes
                    .filter((s) => filtroStatus === 'TODOS' || s.status === filtroStatus)
                    .map((sol) => (
                      <tr key={sol.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5 font-medium">
                          <div className="font-bold text-slate-900">{sol.numero}</div>
                          <div className="text-[10px] text-blue-600 font-mono">
                            Origem: {sol.tipoGeracao}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-slate-900 font-semibold">{sol.solicitanteNome}</div>
                          <div className="text-[10px] text-slate-400">{sol.departamento}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-slate-800 font-mono">
                            {new Date(sol.dataNecessidade).toLocaleDateString('pt-BR')}
                          </div>
                          {sol.numeroOp && (
                            <div className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 inline-block mt-0.5">
                              {sol.numeroOp}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">
                          {sol.itens.length} {sol.itens.length === 1 ? 'item' : 'itens'}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sol.prioridade === 'EMERGENCIAL' || sol.prioridade === 'URGENTE'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {sol.prioridade}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sol.status === 'APROVADA'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : sol.status === 'EM_COTACAO'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {sol.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {sol.status === 'RASCUNHO' && (
                            <button
                              onClick={() => handleAprovarSolicitacao(sol.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-colors"
                            >
                              Aprovar
                            </button>
                          )}
                          {sol.status === 'APROVADA' && (
                            <button
                              onClick={() => handleCriarCotacao(sol.id)}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[11px] font-bold transition-colors flex items-center gap-1 inline-flex"
                            >
                              <Sliders className="w-3 h-3" />
                              Cotar no Mercado
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedSolicitacao(sol)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold transition-colors"
                          >
                            Ver Itens
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MAPA DE COTAÇÃO MULTI-CRITÉRIO */}
      {activeTab === 'cotacoes' && (
        <div className="space-y-6">
          {cotacoes.map((cot) => (
            <div key={cot.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200">
                      MAPA DE COTAÇÃO {cot.numero}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Solicitação: {cot.solicitacaoNumero}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Cotação Competitiva Multi-critério de Matéria-Prima Siderúrgica
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Comprador: <strong className="text-slate-800">{cot.compradorNome}</strong> | Limite Resposta: {new Date(cot.prazoLimiteResposta).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded text-xs font-bold ${
                      cot.status === 'FINALIZADA'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : cot.status === 'ABERTA'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {cot.status}
                  </span>
                </div>
              </div>

              {/* Pesos dos Critérios */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-700">
                  <Sliders className="w-4 h-4 text-purple-600" />
                  Pesos Multi-critério Ponderados:
                </div>
                <div className="flex flex-wrap gap-3 font-mono text-[11px]">
                  <span className="bg-white px-2 py-1 rounded border border-slate-200 text-slate-700">
                    Preço: <strong>{cot.pesosCriterios.pesoPreco}%</strong>
                  </span>
                  <span className="bg-white px-2 py-1 rounded border border-slate-200 text-slate-700">
                    Frete: <strong>{cot.pesosCriterios.pesoFrete}%</strong>
                  </span>
                  <span className="bg-white px-2 py-1 rounded border border-slate-200 text-slate-700">
                    Prazo: <strong>{cot.pesosCriterios.pesoPrazo}%</strong>
                  </span>
                  <span className="bg-white px-2 py-1 rounded border border-slate-200 text-slate-700">
                    Qualidade (IQF): <strong>{cot.pesosCriterios.pesoQualidade}%</strong>
                  </span>
                  <span className="bg-white px-2 py-1 rounded border border-slate-200 text-slate-700">
                    Histórico: <strong>{cot.pesosCriterios.pesoHistorico}%</strong>
                  </span>
                </div>
              </div>

              {/* Tabela de Propostas dos Fornecedores */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Fornecedor</th>
                      <th className="px-4 py-3">Valor Total</th>
                      <th className="px-4 py-3">Prazo Entrega</th>
                      <th className="px-4 py-3">Cond. Pagto</th>
                      <th className="px-4 py-3">Frete</th>
                      <th className="px-4 py-3">Qualidade (IQF)</th>
                      <th className="px-4 py-3 text-center">Score Calculado</th>
                      <th className="px-4 py-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cot.fornecedores.map((forn) => {
                      const valorTotal = forn.itens.reduce((acc, it) => acc + it.valorTotalItem, 0) + (forn.valorFrete || 0);
                      const isVencedor = forn.fornecedorId === cot.fornecedorVencedorId || forn.selecionadoVencedor;

                      return (
                        <tr
                          key={forn.id}
                          className={`${
                            isVencedor ? 'bg-emerald-50/40 font-medium' : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {forn.fornecedorNome}
                              {forn.rankingGeral === 1 && (
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded border border-emerald-200">
                                  Top 1 Score
                                </span>
                              )}
                              {isVencedor && (
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded border border-blue-200">
                                  Vencedor
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{forn.fornecedorCnpj}</div>
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-900">
                            R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-slate-800">{forn.prazoEntregaDiasGeral} dias</span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-700">{forn.condicaoPagamento}</td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                forn.tipoFrete === 'CIF' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {forn.tipoFrete} {forn.valorFrete > 0 ? `(R$ ${forn.valorFrete.toFixed(2)})` : '(Incluso)'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-indigo-700">{forn.pontuacaoQualidade.toFixed(1)}%</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="font-mono font-bold text-sm text-slate-900">
                              {(forn.pontuacaoGeralFinal || 0).toFixed(1)} / 100
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            {cot.status !== 'FINALIZADA' ? (
                              <button
                                onClick={() => handleAprovarCotacao(cot.id, forn.fornecedorId)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1 inline-flex"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Escolher & Emitir Pedido
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-semibold">Cotação Finalizada</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Informações de Alçada de Aprovação */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>
                    <strong>Governança de Alçadas:</strong> Comprador até R$ 20.000,00 | Gerente até R$ 100.000,00 | Diretoria acima de R$ 100.000,00
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: PEDIDOS DE COMPRA (ORDENS OFICIAIS) */}
      {activeTab === 'pedidos' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Número Pedido</th>
                    <th className="px-4 py-3">Fornecedor</th>
                    <th className="px-4 py-3">Emissão / Previsão</th>
                    <th className="px-4 py-3">Valor Total</th>
                    <th className="px-4 py-3">Cond. Pagto / Frete</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pedidos.map((ped) => (
                    <tr key={ped.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-medium">
                        <div className="font-bold text-slate-900">{ped.numero}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {ped.itens.length} {ped.itens.length === 1 ? 'item' : 'itens'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-slate-900 font-semibold">{ped.fornecedorNome}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{ped.fornecedorCnpj}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-slate-800">
                          {new Date(ped.dataEmissao).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-[10px] text-blue-600 font-semibold">
                          Prev: {new Date(ped.dataPrevisaoEntrega).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        <div>
                          R$ {ped.valorTotalItens.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-normal">
                          Líquido: R$ {ped.valorTotalProdutos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-slate-700">{ped.condicaoPagamento}</div>
                        <div className="text-[10px] font-mono text-slate-400">{ped.tipoFrete}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ped.status === 'APROVADO' || ped.status === 'CONFIRMADO_FORNECEDOR'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : ped.status === 'RECEBIDO_TOTAL'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {ped.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {ped.status !== 'RECEBIDO_TOTAL' && (
                          <button
                            onClick={() => handleProcessarRecebimento(ped)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                          >
                            <Receipt className="w-3 h-3" />
                            Receber NF-e
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedPedido(ped)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold transition-colors"
                        >
                          Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RECEBIMENTOS FÍSICO/FISCAL */}
      {activeTab === 'recebimentos' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Recebimento / Data</th>
                    <th className="px-4 py-3">NF-e & Chave de Acesso</th>
                    <th className="px-4 py-3">Fornecedor & Pedido</th>
                    <th className="px-4 py-3">Qualidade / Certificado Usina</th>
                    <th className="px-4 py-3">Estoque & AP</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recebimentos.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-medium">
                        <div className="font-bold text-slate-900">{rec.numero}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(rec.dataRecebimento).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-800">
                          NF-e {rec.numeroNf} - Série {rec.serieNf}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]" title={rec.chaveAcessoNfe}>
                          {rec.chaveAcessoNfe}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-slate-900 font-semibold">{rec.fornecedorNome}</div>
                        <div className="text-[10px] text-blue-600 font-mono">Pedido: {rec.pedidoCompraNumero}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>100% Conforme</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Certificados de Usina OK</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-emerald-700 font-bold">Lotes Gerados</div>
                        <div className="text-[10px] text-slate-500">Contas a Pagar Emitido</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {rec.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedRecebimento(rec)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold transition-colors"
                        >
                          Ver Lotes & Certificados
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DEVOLUÇÕES A FORNECEDOR */}
      {activeTab === 'devolucoes' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-2">Devoluções de Matéria-Prima & Estornos de Estoque</h3>
            <p className="text-xs text-slate-500 mb-4">
              Registro formal de não conformidades com emissão de NF-e de Saída por Devolução e estorno automático de lotes do almoxarifado.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Número Devolução</th>
                    <th className="px-4 py-3">Fornecedor</th>
                    <th className="px-4 py-3">Motivo / RNC</th>
                    <th className="px-4 py-3">NF-e Devolução</th>
                    <th className="px-4 py-3">Estorno Estoque</th>
                    <th className="px-4 py-3">Valor Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {devolucoes.map((dev) => (
                    <tr key={dev.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3.5 font-bold text-slate-900">{dev.numero}</td>
                      <td className="px-4 py-3.5 text-slate-800">{dev.fornecedorNome}</td>
                      <td className="px-4 py-3.5 text-slate-600">{dev.motivoGeral}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-800">
                        {dev.numeroNfDevolucao ? `NF ${dev.numeroNfDevolucao}` : 'Em Emissão Fiscal'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {dev.statusIntegracaoEstoque ? 'ESTORNADO' : 'PENDENTE'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        R$ {dev.valorTotalDevolvido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: IQF & HISTÓRICO DE PREÇOS */}
      {activeTab === 'iqf_precos' && (
        <div className="space-y-6">
          {/* IQF Ranking */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  Índice de Qualificação de Fornecedores (IQF)
                </h3>
                <p className="text-xs text-slate-500">
                  Avaliação automatizada ponderada por pontualidade de entrega, taxa de conformidade técnica, certificados de usina e histórico de relacionamento.
                </p>
              </div>
              <span className="text-xs font-mono bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-md border border-indigo-200">
                Siderurgia Homologada
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {fornecedoresIQF.map((forn) => (
                <div key={forn.fornecedorId} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{forn.fornecedorNome}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{forn.fornecedorCnpj}</span>
                    </div>
                    <span className="text-base font-bold text-indigo-700 font-mono">
                      {forn.iqfPontuacaoGeral.toFixed(1)}%
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Qualidade Técnica:</span>
                      <span className="font-bold text-slate-800">{forn.mediaAprovacaoQualidadePercentual.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pontualidade (OTD):</span>
                      <span className="font-bold text-slate-800">{forn.mediaCumprimentoPrazoPercentual.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Histórico de Fornecimento:</span>
                      <span className="font-bold text-slate-800">{forn.pontuacaoHistorico.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Classificação:</span>
                    <span className="font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {forn.categoriaFornecedor}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Histórico de Preços */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Histórico de Preços Pagos por Matéria-Prima
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Rastreabilidade das últimas compras por produto para subsidiar cotações e orçamentos do CPQ.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Código / Produto</th>
                    <th className="px-4 py-3">Fornecedor</th>
                    <th className="px-4 py-3">Data Compra</th>
                    <th className="px-4 py-3">Qtd Comprada</th>
                    <th className="px-4 py-3">Preço Unitário</th>
                    <th className="px-4 py-3">Tendência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historicoPrecos.map((hp) => (
                    <tr key={hp.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{hp.codigoProduto}</div>
                        <div className="text-[10px] text-slate-500">{hp.descricao}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-800">{hp.fornecedorNome}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-700">
                        {new Date(hp.dataCompra).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3.5 text-slate-800 font-semibold">
                        {hp.quantidadeComprada} un
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        R$ {hp.precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-emerald-700 font-bold">
                        {hp.tendenciaPreco}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: NOVA SOLICITAÇÃO FORM */}
      {activeTab === 'nova_solicitacao' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Nova Solicitação de Compra</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gere uma requisição de suprimentos por disparo do MRP, Estoque Mínimo, OP ou cadastro manual.
            </p>
          </div>

          <form onSubmit={handleSalvarSolicitacao} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tipo de Geração / Origem</label>
                <select
                  value={formTipoGeracao}
                  onChange={(e) => setFormTipoGeracao(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  <option value="MRP">Disparo por Cálculo MRP I</option>
                  <option value="ESTOQUE_MINIMO">Ponto de Reposição / Estoque Mínimo</option>
                  <option value="ORDEM_PRODUCAO">Vinculado a Ordem de Produção (OP)</option>
                  <option value="MANUAL">Cadastro Manual</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Prioridade</label>
                <select
                  value={formPrioridade}
                  onChange={(e) => setFormPrioridade(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  <option value="BAIXA">Baixa</option>
                  <option value="NORMAL">Normal (7 a 15 dias)</option>
                  <option value="URGENTE">Urgente (3 a 5 dias)</option>
                  <option value="EMERGENCIAL">Emergencial (Parada de Fábrica / Imediato)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Data de Necessidade</label>
                <input
                  type="date"
                  value={formDataNecessidade}
                  onChange={(e) => setFormDataNecessidade(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Número da OP (Opcional)</label>
                <input
                  type="text"
                  value={formNumeroOp}
                  onChange={(e) => setFormNumeroOp(e.target.value)}
                  placeholder="Ex: OP-2026-088"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Cliente / Projeto (Opcional)</label>
                <input
                  type="text"
                  value={formClienteNome}
                  onChange={(e) => setFormClienteNome(e.target.value)}
                  placeholder="Ex: Vale S.A. Mineração"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Justificativa da Aquisição</label>
              <textarea
                rows={2}
                value={formJustificativa}
                onChange={(e) => setFormJustificativa(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('solicitacoes')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Gravar Solicitação
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal / Dialog: Ver Itens da Solicitação */}
      {selectedSolicitacao && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Itens da Solicitação {selectedSolicitacao.numero}
              </h3>
              <button onClick={() => setSelectedSolicitacao(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {selectedSolicitacao.itens.map((it) => (
                <div key={it.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-900">{it.descricao}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Código: {it.codigoProduto}
                  </div>
                  <div className="flex justify-between pt-1 font-semibold text-slate-800">
                    <span>
                      Quantidade: {it.quantidade} {it.unidadeMedida}
                    </span>
                    <span>Preço Est.: R$ {it.precoEstimadoUnitario.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedSolicitacao(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Dialog: Ver Pedido Detalhes */}
      {selectedPedido && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-3xl w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ordem de Compra #{selectedPedido.numero}
                </h3>
                <span className="text-xs text-slate-400 font-mono">Fornecedor: {selectedPedido.fornecedorNome}</span>
              </div>
              <button onClick={() => setSelectedPedido(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-bold block">Emissão:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(selectedPedido.dataEmissao).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Previsão:</span>
                <span className="font-semibold text-blue-700">
                  {new Date(selectedPedido.dataPrevisaoEntrega).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Condição:</span>
                <span className="font-semibold text-slate-800">{selectedPedido.condicaoPagamento}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Frete:</span>
                <span className="font-semibold text-slate-800">{selectedPedido.tipoFrete}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Itens do Pedido</h4>
              {selectedPedido.itens.map((it) => (
                <div key={it.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-900">{it.descricao}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{it.codigoProduto}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">
                      {it.quantidade} {it.unidadeMedida} x R$ {it.precoUnitario.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold">
                      R$ {it.valorTotalItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Valor Total:</span>
              <span className="text-base font-bold text-slate-900 font-mono">
                R$ {selectedPedido.valorTotalItens.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPedido(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Dialog: Ver Recebimento Detalhes */}
      {selectedRecebimento && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-3xl w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Recebimento Físico & Fiscal #{selectedRecebimento.numero}
                </h3>
                <span className="text-xs text-slate-400 font-mono">NF-e: {selectedRecebimento.numeroNf} - Fornecedor: {selectedRecebimento.fornecedorNome}</span>
              </div>
              <button onClick={() => setSelectedRecebimento(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-bold block">Recebimento:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(selectedRecebimento.dataRecebimento).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Conferente:</span>
                <span className="font-semibold text-blue-700">
                  {selectedRecebimento.conferenteQualidadeNome}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Estoque:</span>
                <span className="font-semibold text-emerald-700">
                  {selectedRecebimento.gerouMovimentoEstoque ? 'Movimentado' : 'Pendente'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Financeiro:</span>
                <span className="font-semibold text-emerald-700">
                  {selectedRecebimento.gerouIntegracaoFinanceira ? 'AP Gerado' : 'Pendente'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Itens Recebidos & Lotes Usina</h4>
              {selectedRecebimento.itens.map((it) => (
                <div key={it.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between items-center font-bold text-slate-900">
                    <span>{it.descricao}</span>
                    <span className="text-emerald-700">{it.statusInspecao}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Lote Usina: {it.numeroLoteUsina || 'N/A'} | Corrida: {it.numeroCorrida || 'N/A'} | Certificado: {it.certificadoUsinaNumero || 'N/A'}
                  </div>
                  <div className="flex justify-between pt-1 font-semibold text-slate-800 text-[11px]">
                    <span>Entregue: {it.quantidadeEntregue} {it.unidadeMedida}</span>
                    <span>Aprovado: {it.quantidadeAprovada} {it.unidadeMedida}</span>
                    <span>Valor: R$ {it.valorTotalItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedRecebimento(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold"
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
