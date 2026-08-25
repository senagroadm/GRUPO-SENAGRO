// frontend/src/components/PcpViewer.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Factory,
  Cpu,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShoppingCart,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertOctagon,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Zap,
  Wrench,
  Search,
  CheckSquare,
  Activity,
  FileCheck,
  Package,
} from 'lucide-react';
import {
  ResultadoCalculoMRP,
  OrdemProducao,
  CentroTrabalhoMaquina,
  AlgoritmoSequenciamento,
  ItemFilaProducao,
} from '@/backend/modules/pcp/pcp-types';

interface PcpViewerProps {
  empresaId: string;
}

export function PcpViewer({ empresaId }: PcpViewerProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    'mrp_necessidades' | 'sugestoes_compra' | 'sugestoes_producao' | 'capacidade_maquinas' | 'fila_sequenciamento' | 'riscos_matriz' | 'gantt'
  >('mrp_necessidades');

  const [loading, setLoading] = useState<boolean>(true);
  const [calculandoMrp, setCalculandoMrp] = useState<boolean>(false);
  const [mrpResult, setMrpResult] = useState<ResultadoCalculoMRP | null>(null);
  const [ordensProducao, setOrdensProducao] = useState<OrdemProducao[]>([]);
  const [maquinas, setMaquinas] = useState<CentroTrabalhoMaquina[]>([]);
  const [maquinaFilaSelecionada, setMaquinaFilaSelecionada] = useState<string>('maq-laser-fiber-12kw');
  const [algoritmoFila, setAlgoritmoFila] = useState<AlgoritmoSequenciamento>('CRITICAL_RATIO');
  const [filaMaquina, setFilaMaquina] = useState<ItemFilaProducao[]>([]);
  const [filtroTexto, setFiltroTexto] = useState<string>('');
  const [notificacao, setNotificacao] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const carregarDadosPcp = useCallback(async () => {
    setLoading(true);
    try {
      const resMrp = await fetch(`/api/v1/pcp/mrp/calcular?empresaId=${empresaId}`);
      const jsonMrp = await resMrp.json();
      if (jsonMrp.success && jsonMrp.data) {
        setMrpResult(jsonMrp.data);
      }

      const resPcp = await fetch(`/api/v1/pcp?empresaId=${empresaId}`);
      const jsonPcp = await resPcp.json();
      if (jsonPcp.success) {
        setOrdensProducao(jsonPcp.ordensProducao || []);
        setMaquinas(jsonPcp.maquinas || []);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados de PCP:', err);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  const carregarFilaMaquina = useCallback(async (maqId: string, alg: AlgoritmoSequenciamento) => {
    try {
      const res = await fetch(`/api/v1/pcp/fila?empresaId=${empresaId}&maquinaId=${maqId}&algoritmo=${alg}`);
      const json = await res.json();
      if (json.success && json.fila) {
        setFilaMaquina(json.fila);
      }
    } catch (err: any) {
      console.error('Erro ao carregar fila:', err);
    }
  }, [empresaId]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [resMrp, resPcp] = await Promise.all([
          fetch(`/api/v1/pcp/mrp/calcular?empresaId=${empresaId}`).then((r) => r.json()),
          fetch(`/api/v1/pcp?empresaId=${empresaId}`).then((r) => r.json()),
        ]);
        if (!ignore) {
          if (resMrp.success && resMrp.data) setMrpResult(resMrp.data);
          if (resPcp.success) {
            setOrdensProducao(resPcp.ordensProducao || []);
            setMaquinas(resPcp.maquinas || []);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Erro ao carregar dados de PCP:', err);
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [empresaId]);

  useEffect(() => {
    let ignore = false;
    if (!maquinaFilaSelecionada) return;
    async function loadFila() {
      try {
        const res = await fetch(`/api/v1/pcp/fila?empresaId=${empresaId}&maquinaId=${maquinaFilaSelecionada}&algoritmo=${algoritmoFila}`);
        const json = await res.json();
        if (!ignore && json.success && json.fila) {
          setFilaMaquina(json.fila);
        }
      } catch (err) {
        console.error('Erro ao carregar fila:', err);
      }
    }
    loadFila();
    return () => {
      ignore = true;
    };
  }, [empresaId, maquinaFilaSelecionada, algoritmoFila]);

  const handleRecalcularMRP = async () => {
    setCalculandoMrp(true);
    try {
      const res = await fetch('/api/v1/pcp/mrp/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId }),
      });
      const json = await res.json();
      if (json.success) {
        setMrpResult(json.data);
        setNotificacao({
          tipo: 'sucesso',
          texto: `Cálculo MRP executado em ${json.data.tempoProcessamentoMs}ms com sucesso!`,
        });
        setTimeout(() => setNotificacao(null), 5000);
      }
    } catch (err: any) {
      setNotificacao({ tipo: 'erro', texto: 'Falha ao executar cálculo MRP.' });
    } finally {
      setCalculandoMrp(false);
    }
  };

  const handleConverterSugestaoCompra = async (sugId: string) => {
    try {
      const res = await fetch('/api/v1/pcp/mrp/sugestoes-compra/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sugestaoId: sugId }),
      });
      const json = await res.json();
      if (json.success) {
        setNotificacao({ tipo: 'sucesso', texto: json.mensagem });
        setTimeout(() => setNotificacao(null), 6000);
        carregarDadosPcp();
      } else {
        setNotificacao({ tipo: 'erro', texto: json.error });
      }
    } catch (err: any) {
      setNotificacao({ tipo: 'erro', texto: 'Erro de comunicação ao converter compra.' });
    }
  };

  const handleConverterSugestaoProducao = async (sugId: string) => {
    try {
      const res = await fetch('/api/v1/pcp/mrp/sugestoes-producao/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sugestaoId: sugId }),
      });
      const json = await res.json();
      if (json.success) {
        setNotificacao({ tipo: 'sucesso', texto: json.mensagem });
        setTimeout(() => setNotificacao(null), 6000);
        carregarDadosPcp();
      } else {
        setNotificacao({ tipo: 'erro', texto: json.error });
      }
    } catch (err: any) {
      setNotificacao({ tipo: 'erro', texto: 'Erro de comunicação ao converter produção.' });
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (loading && !mrpResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Carregando motor PCP & MRP Industrial...</p>
      </div>
    );
  }

  const filteredNecessidades = mrpResult?.necessidadesLiquidas.filter(
    (n) =>
      n.codigoItem.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      n.descricaoItem.toLowerCase().includes(filtroTexto.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notificacao && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between shadow-md transition-all ${
            notificacao.tipo === 'sucesso'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {notificacao.tipo === 'sucesso' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-semibold">{notificacao.texto}</span>
          </div>
          <button
            onClick={() => setNotificacao(null)}
            className="text-xs uppercase font-bold text-slate-500 hover:text-slate-800"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Top Banner & Action Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-xs">
                <Factory className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Planejamento e Controle da Produção (PCP) & MRP Inicial
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Motor determinístico de cálculo de necessidades líquidas, sequenciamento de filas e matriz de riscos.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRecalcularMRP}
              disabled={calculandoMrp}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${calculandoMrp ? 'animate-spin' : ''}`} />
              {calculandoMrp ? 'Calculando MRP...' : 'Executar Cálculo MRP'}
            </button>
          </div>
        </div>

        {/* Resumo Métricas KPI */}
        {mrpResult && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Demandas Analisadas</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{mrpResult.resumo.totalDemandasAnalisadas}</span>
                <span className="text-xs text-slate-500">pedidos/OPs</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Necessidades Líquidas</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-blue-700">{mrpResult.resumo.totalItensNecessidadeLiquida}</span>
                <span className="text-xs text-slate-500">itens em déficit</span>
              </div>
            </div>

            <div className="bg-amber-50/70 p-3.5 rounded-lg border border-amber-100">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">Sugestões de Compra</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-900">{mrpResult.resumo.totalSugestoesCompra}</span>
                <span className="text-xs text-amber-700">{formatCurrency(mrpResult.resumo.valorTotalEstimadoCompras)}</span>
              </div>
            </div>

            <div className="bg-indigo-50/70 p-3.5 rounded-lg border border-indigo-100">
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider block">Sugestões de Produção</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-indigo-900">{mrpResult.resumo.totalSugestoesProducao}</span>
                <span className="text-xs text-indigo-700">novas OPs</span>
              </div>
            </div>

            <div className="bg-rose-50/70 p-3.5 rounded-lg border border-rose-100">
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block">Riscos de Atraso</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-rose-900">{mrpResult.resumo.totalRiscosAtraso}</span>
                <span className="text-xs text-rose-700">{mrpResult.resumo.totalRiscosCriticos} críticos</span>
              </div>
            </div>

            <div className="bg-purple-50/70 p-3.5 rounded-lg border border-purple-100">
              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider block">Máquinas Gargalo</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-purple-900">{mrpResult.resumo.maquinasGargaloTotal}</span>
                <span className="text-xs text-purple-700">&gt;100% carga</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navegação Secundária em Abas */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveSubTab('mrp_necessidades')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'mrp_necessidades'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          Necessidades Líquidas (MRP)
        </button>

        <button
          onClick={() => setActiveSubTab('sugestoes_compra')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'sugestoes_compra'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Sugestões de Compra ({mrpResult?.sugestoesCompra.length || 0})
        </button>

        <button
          onClick={() => setActiveSubTab('sugestoes_producao')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'sugestoes_producao'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Factory className="w-4 h-4" />
          Sugestões de Produção ({mrpResult?.sugestoesProducao.length || 0})
        </button>

        <button
          onClick={() => setActiveSubTab('capacidade_maquinas')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'capacidade_maquinas'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Carga Máquina & Setores
        </button>

        <button
          onClick={() => setActiveSubTab('fila_sequenciamento')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'fila_sequenciamento'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Fila de Sequenciamento (CR/EDD)
        </button>

        <button
          onClick={() => setActiveSubTab('riscos_matriz')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'riscos_matriz'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          Matriz de Riscos ({mrpResult?.riscosAtraso.length || 0})
        </button>

        <button
          onClick={() => setActiveSubTab('gantt')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'gantt'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Cronograma Gantt Inicial
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: NECESSIDADES LÍQUIDAS MRP                                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'mrp_necessidades' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por código ou descrição do item..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>Fórmula: Líquida = (Demanda + Segurança) - (Físico - Bloq - Reservas + Compras + OPs)</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Item / Especificação</th>
                    <th className="py-3 px-2 text-right">Demanda Bruta</th>
                    <th className="py-3 px-2 text-right">Físico</th>
                    <th className="py-3 px-2 text-right text-rose-600">Bloqueado</th>
                    <th className="py-3 px-2 text-right text-amber-600">Reservas</th>
                    <th className="py-3 px-2 text-right text-emerald-700 font-bold">Disp. Real</th>
                    <th className="py-3 px-2 text-right text-sky-600">Em Trânsito</th>
                    <th className="py-3 px-2 text-right">Segurança</th>
                    <th className="py-3 px-3 text-right bg-blue-50/50 text-blue-900 font-bold">Nec. Líquida</th>
                    <th className="py-3 px-2 text-center">Lead Time</th>
                    <th className="py-3 px-2 text-center">Data Disparo</th>
                    <th className="py-3 px-4 text-center">Ação MRP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredNecessidades.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.codigoItem}</div>
                        <div className="text-slate-500 text-[11px] truncate max-w-xs">{item.descricaoItem}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Origem: {item.origemRastreavel.pedidoNumero || 'Plano Mestre'} (Nível {item.origemRastreavel.nivelBOM})
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right font-medium text-slate-800">
                        {item.demandaBruta} <span className="text-slate-400 text-[10px]">{item.unidadeMedida}</span>
                      </td>
                      <td className="py-3 px-2 text-right text-slate-600 font-mono">{item.estoqueFisicoTotal}</td>
                      <td className="py-3 px-2 text-right text-rose-600 font-mono font-medium">
                        {item.materialBloqueado > 0 ? `-${item.materialBloqueado}` : '0'}
                      </td>
                      <td className="py-3 px-2 text-right text-amber-600 font-mono font-medium">
                        {item.reservasAtivas > 0 ? `-${item.reservasAtivas}` : '0'}
                      </td>
                      <td className="py-3 px-2 text-right text-emerald-700 font-mono font-bold">
                        {item.estoqueDisponivelReal}
                      </td>
                      <td className="py-3 px-2 text-right text-sky-600 font-mono">
                        {item.comprasEmTransito + item.producaoEmProcesso > 0 ? `+${item.comprasEmTransito + item.producaoEmProcesso}` : '0'}
                      </td>
                      <td className="py-3 px-2 text-right text-slate-500 font-mono">{item.estoqueSegurancaConfigurado}</td>
                      <td className="py-3 px-3 text-right bg-blue-50/40 text-blue-900 font-mono font-bold text-sm">
                        {item.necessidadeLiquidaCalculada > 0 ? (
                          <span className="text-blue-700">{item.necessidadeLiquidaCalculada}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">0.00</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center font-medium text-slate-700">{item.leadTimeDias} dias</td>
                      <td className="py-3 px-2 text-center text-slate-600 text-[11px]">
                        {formatDate(item.dataDisparoRecomendada)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.categoriaAcao === 'COMPRA' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center gap-1">
                            <ShoppingCart className="w-3 h-3" /> Gerar Compra
                          </span>
                        )}
                        {item.categoriaAcao === 'PRODUCAO' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center justify-center gap-1">
                            <Factory className="w-3 h-3" /> Gerar OP
                          </span>
                        )}
                        {item.categoriaAcao === 'COBERTO_ESTOQUE' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Estoque Suficiente
                          </span>
                        )}
                        {item.categoriaAcao === 'COBERTO_PEDIDOS_ABERTOS' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                            Pedido em Trânsito
                          </span>
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

      {/* ========================================================================= */}
      {/* ABA 2: SUGESTÕES DE COMPRA                                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'sugestoes_compra' && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">Regras Anti-Duplicação e Lote Mínimo de Fornecedores</h4>
              <p className="text-xs text-amber-700 mt-0.5">
                O MRP agrupa demandas líquidas, aplica o lote mínimo e múltiplos de compra, respeitando a data de disparo regressiva via Lead Time cadastrado na Engenharia.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mrpResult?.sugestoesCompra.map((sug) => (
              <div
                key={sug.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                      {sug.codigoItem}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        sug.status === 'CONVERTIDA_EM_SC'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sug.status === 'CONVERTIDA_EM_SC' ? 'Convertida em SC' : 'Pendente de Disparo'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2">{sug.descricaoItem}</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    Fornecedor: <strong className="text-slate-700">{sug.fornecedorPreferencialNome}</strong>
                  </p>

                  <div className="bg-slate-50 rounded-lg p-3 mt-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Qtd. Calculada:</span>
                      <span className="font-semibold text-slate-800">
                        {sug.quantidadeCalculada} {sug.unidadeMedida}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Qtd. Ajustada (Lote Mínimo {sug.loteMinimo}):</span>
                      <span className="font-bold text-blue-700 text-sm">
                        {sug.quantidadeSugeridaComLote} {sug.unidadeMedida}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <span className="text-slate-500">Valor Unitário:</span>
                      <span className="text-slate-700">{formatCurrency(sug.precoUnitarioEstimado)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-700">Total Estimado:</span>
                      <span className="text-slate-900">{formatCurrency(sug.valorTotalEstimado)}</span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                    <div className="flex justify-between">
                      <span>Lead Time: <strong>{sug.leadTimeFornecedorDias} dias</strong></span>
                      <span>Disparo: <strong className="text-rose-600">{formatDate(sug.dataDisparoPedidoCompra)}</strong></span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-1">
                      {sug.origemRastreavel.motivo}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleConverterSugestaoCompra(sug.id)}
                    disabled={sug.status === 'CONVERTIDA_EM_SC'}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <FileCheck className="w-4 h-4" />
                    {sug.status === 'CONVERTIDA_EM_SC' ? 'Solicitação Emitida' : 'Converter em Solicitação de Compra'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: SUGESTÕES DE PRODUÇÃO                                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'sugestoes_producao' && (
        <div className="space-y-4">
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
            <Factory className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-indigo-900">Ordens de Produção Recomendadas pelo MRP</h4>
              <p className="text-xs text-indigo-700 mt-0.5">
                Criação automática de OPs para itens fabricados internamente e subconjuntos, alocando roteiros de fabricação e dimensionamento de lotes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mrpResult?.sugestoesProducao.map((sug) => (
              <div
                key={sug.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                      {sug.codigoItem}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800">
                      Prioridade {sug.prioridadeSugerida}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2">{sug.descricaoItem}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Setor Principal: <strong className="text-slate-700">{sug.setorPrincipal}</strong>
                  </p>

                  <div className="bg-slate-50 rounded-lg p-3 mt-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Qtd. Sugerida:</span>
                      <span className="font-bold text-indigo-700 text-sm">
                        {sug.quantidadeSugeridaComLote} {sug.unidadeMedida}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Lead Time de Fabricação:</span>
                      <span className="font-semibold text-slate-800">{sug.leadTimeFabricacaoDias} dias</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 text-[11px]">
                      <span className="text-slate-500">Início Programado:</span>
                      <span className="font-medium text-slate-800">{formatDate(sug.dataInicioProgramacao)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Entrega Prometida:</span>
                      <span className="font-bold text-blue-700">{formatDate(sug.dataNecessidadeEntrega)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-3">{sug.origemRastreavel.motivo}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleConverterSugestaoProducao(sug.id)}
                    disabled={sug.status === 'CONVERTIDA_EM_OP'}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckSquare className="w-4 h-4" />
                    {sug.status === 'CONVERTIDA_EM_OP' ? 'Ordem Gerada' : 'Converter em Ordem de Produção (OP)'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: CARGA MÁQUINA & SETORES                                            */}
      {/* ========================================================================= */}
      {activeSubTab === 'capacidade_maquinas' && (
        <div className="space-y-6">
          {/* Apuração por Setor */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Balanço de Capacidade Finita por Setor Fabril
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mrpResult?.capacidadeSetores.map((setor) => (
                <div key={setor.setor} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">{setor.nome || setor.setorNome}</span>
                      <span className="text-[11px] text-slate-500">
                        {setor.quantidadeMaquinas} máquinas • {setor.quantidadeOperadores} operadores
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        setor.status === 'GARGALO'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : setor.status === 'ATENCAO'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {setor.status}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Carga Alocada: <strong>{setor.cargaAlocadaHoras}h/dia</strong></span>
                      <span>Cap. Líquida: <strong>{setor.capacidadeTotalHorasDia}h/dia</strong></span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          setor.taxaOcupacaoPercentual > 100
                            ? 'bg-rose-600'
                            : setor.taxaOcupacaoPercentual > 85
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, setor.taxaOcupacaoPercentual)}%` }}
                      ></div>
                    </div>
                    <div className="text-right text-[11px] font-bold mt-1 text-slate-700">
                      Taxa de Ocupação: {setor.taxaOcupacaoPercentual}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detalhe por Centro de Trabalho / Máquina */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              Carga Máquina Individual, OEE e Manutenções Programadas
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {maquinas.map((maq) => (
                <div
                  key={maq.id}
                  className={`p-4 rounded-xl border transition-all ${
                    maq.taxaOcupacaoPercentual > 100
                      ? 'border-rose-300 bg-rose-50/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-sm">
                          {maq.codigo}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{maq.nome}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Setor: <strong>{maq.setor}</strong> • {maq.turnosTrabalho} turno(s) • OEE: {(maq.eficienciaOEE * 100).toFixed(0)}%
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        maq.taxaOcupacaoPercentual > 100
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {maq.taxaOcupacaoPercentual > 100 ? 'Gargalo Crítico' : 'Operação Normal'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">
                        Carga Programada: <strong>{maq.cargaProgramadaHoras}h</strong>
                      </span>
                      <span className="text-slate-600">
                        Cap. Líquida: <strong>{maq.capacidadeHorasDiaLiquida}h/dia</strong>
                      </span>
                      <span className={`font-bold ${maq.taxaOcupacaoPercentual > 100 ? 'text-rose-600' : 'text-slate-900'}`}>
                        {maq.taxaOcupacaoPercentual}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          maq.taxaOcupacaoPercentual > 100
                            ? 'bg-rose-600'
                            : maq.taxaOcupacaoPercentual > 85
                            ? 'bg-amber-500'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(100, maq.taxaOcupacaoPercentual)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                      <span>
                        Operadores: {maq.operadoresDisponiveis} / {maq.operadoresNecessarios}
                        {maq.operadoresDisponiveis < maq.operadoresNecessarios && (
                          <strong className="text-rose-600 ml-1">(Déficit de Mão-de-Obra)</strong>
                        )}
                      </span>
                    </div>
                  </div>

                  {maq.manutencoesAgendadas && maq.manutencoesAgendadas.length > 0 && (
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-amber-700 shrink-0" />
                      <span className="text-amber-800 text-[11px]">
                        <strong>Manutenção Preventiva Agendada:</strong> {maq.manutencoesAgendadas[0].descricao} ({maq.manutencoesAgendadas[0].horasParada}h parada)
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 5: FILA DE SEQUENCIAMENTO INTERATIVO                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'fila_sequenciamento' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  Sequenciamento de Fila de Operações por Centro de Trabalho
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simule e compare algoritmos de ordenação da carga produtiva.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Máquina</label>
                  <select
                    value={maquinaFilaSelecionada}
                    onChange={(e) => setMaquinaFilaSelecionada(e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white font-medium text-slate-800"
                  >
                    {maquinas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.codigo} - {m.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Algoritmo de Priorização</label>
                  <select
                    value={algoritmoFila}
                    onChange={(e) => setAlgoritmoFila(e.target.value as AlgoritmoSequenciamento)}
                    className="text-xs border border-blue-300 rounded-lg px-3 py-1.5 bg-blue-50/50 font-bold text-blue-900"
                  >
                    <option value="CRITICAL_RATIO">Critical Ratio (CR = Dias Restantes / Lead Time)</option>
                    <option value="EDD">Earliest Due Date (Data Prometida Mais Cedo)</option>
                    <option value="SPT">Shortest Processing Time (Menor Tempo Processo)</option>
                    <option value="PRIORIDADE_MANUAL">Prioridade Manual (Urgente &gt; Alta &gt; Média)</option>
                    <option value="FIFO">FIFO (Ordem de Entrada / Criação)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3 text-center w-16">Posição</th>
                    <th className="py-3 px-4">Ordem / Operação</th>
                    <th className="py-3 px-3">Item / Cliente</th>
                    <th className="py-3 px-2 text-right">Qtd</th>
                    <th className="py-3 px-2 text-right">Tempo Setup</th>
                    <th className="py-3 px-2 text-right">Tempo Proc.</th>
                    <th className="py-3 px-3 text-right font-bold text-slate-900">Total Horas</th>
                    <th className="py-3 px-3 text-center">Entrega Prometida</th>
                    <th className="py-3 px-3 text-center">Critical Ratio (CR)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filaMaquina.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        Nenhuma operação pendente nesta máquina.
                      </td>
                    </tr>
                  ) : (
                    filaMaquina.map((op) => (
                      <tr key={op.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 text-center">
                          <span className="w-7 h-7 inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                            #{op.posicaoFila}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{op.ordemProducaoNumero} (Seq {op.sequenciaOperacao})</div>
                          <div className="text-slate-600 text-[11px]">{op.operacaoNome}</div>
                          {op.operadorDesignado && (
                            <div className="text-[10px] text-slate-400 mt-0.5">Op: {op.operadorDesignado}</div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{op.codigoItem}</div>
                          <div className="text-slate-500 text-[10px] truncate max-w-xs">{op.clienteNome || 'Demanda Interna'}</div>
                        </td>
                        <td className="py-3 px-2 text-right font-medium text-slate-800">{op.quantidade} un</td>
                        <td className="py-3 px-2 text-right text-slate-500 font-mono">{op.tempoSetupHoras}h</td>
                        <td className="py-3 px-2 text-right text-slate-500 font-mono">{op.tempoProcessamentoHoras}h</td>
                        <td className="py-3 px-3 text-right font-bold text-blue-900 font-mono">{op.tempoTotalEstimadoHoras}h</td>
                        <td className="py-3 px-3 text-center text-slate-700">{formatDate(op.dataEntregaPrometida)}</td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-bold font-mono ${
                              op.criticalRatio < 1.0
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : op.criticalRatio <= 1.2
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            CR: {op.criticalRatio}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              op.status === 'EM_PROCESSO'
                                ? 'bg-blue-100 text-blue-800'
                                : op.status === 'CONCLUIDA'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {op.status}
                          </span>
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

      {/* ========================================================================= */}
      {/* ABA 6: MATRIZ DE RISCOS & ATRASOS                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'riscos_matriz' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mrpResult?.riscosAtraso.map((risco) => (
              <div
                key={risco.id}
                className={`p-5 rounded-xl border shadow-xs bg-white flex flex-col justify-between ${
                  risco.nivelSeveridade === 'CRITICO'
                    ? 'border-rose-300'
                    : risco.nivelSeveridade === 'ALTO'
                    ? 'border-amber-300'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                        risco.nivelSeveridade === 'CRITICO'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : risco.nivelSeveridade === 'ALTO'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      Severidade {risco.nivelSeveridade}
                    </span>

                    <span className="text-xs font-mono font-bold text-slate-700">
                      +{risco.diasAtrasoEstimados} dias estimados
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2 flex items-center gap-2">
                    <AlertTriangle
                      className={`w-4 h-4 ${
                        risco.nivelSeveridade === 'CRITICO'
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}
                    />
                    {risco.tipoRisco.replace(/_/g, ' ')}
                  </h3>

                  <p className="text-xs text-slate-700 mt-2 font-medium">{risco.mensagem}</p>

                  <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1">
                    <div>
                      <strong className="text-slate-600">Impacto:</strong>{' '}
                      <span className="text-slate-700">{risco.impactoDescricao}</span>
                    </div>
                    {risco.pedidoRelacionado && (
                      <div>
                        <strong className="text-slate-600">Pedido Afetado:</strong>{' '}
                        <span className="text-blue-700 font-semibold">{risco.pedidoRelacionado}</span> ({risco.clienteNome})
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 bg-blue-50/50 -mx-5 -mb-5 p-4 rounded-b-xl border-t-blue-100">
                  <span className="text-[11px] font-bold text-blue-900 block mb-1 uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-blue-600" /> Plano de Ação Recomendado:
                  </span>
                  <p className="text-xs text-blue-800 leading-relaxed font-medium">{risco.acaoRecomendada}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 7: CRONOGRAMA GANTT INICIAL                                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'gantt' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Cronograma Temporal das Operações (Gantt Inicial)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Alocação visual das ordens de produção nos centros de trabalho ao longo do horizonte de planejamento.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <div className="min-w-[800px] p-4 space-y-4">
              {mrpResult?.gantt.map((g) => (
                <div key={g.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      {g.opNumero} - {g.operacaoNome}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {g.maquinaNome} ({formatDate(g.dataInicio)} até {formatDate(g.dataFim)} - {g.duracaoHoras}h)
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-lg h-7 p-1 border border-slate-200 relative overflow-hidden flex items-center">
                    <div
                      className={`h-full rounded-md flex items-center px-3 text-[11px] font-bold text-white transition-all shadow-xs ${
                        g.status === 'CONCLUIDA'
                          ? 'bg-emerald-600'
                          : g.status === 'EM_PROCESSO'
                          ? 'bg-blue-600'
                          : 'bg-indigo-500'
                      }`}
                      style={{
                        width: `${Math.max(25, g.duracaoHoras * 6)}%`,
                        marginLeft: `${g.id.includes('seq-10') ? '0%' : g.id.includes('seq-20') ? '20%' : g.id.includes('seq-30') ? '40%' : '60%'}`,
                      }}
                    >
                      <span className="truncate">{g.operacaoNome} ({g.duracaoHoras}h)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
