// frontend/src/components/MotorCustosViewer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  Calendar,
  Layers,
  FileText,
  Package,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Settings,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Truck,
  Percent,
  Sliders,
  Scissors,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  ParametroCustoVigencia,
  AnaliseCustoOP,
  AnaliseCustoPedido,
  AnaliseCustoProduto,
  ResumoMotorCustos,
} from '@/backend/modules/custos/custos-types';
import { OrdemProducaoCompleta } from '@/backend/modules/producao/producao-types';
import { safeFetchJson } from '../api/safe-fetch';

interface MotorCustosViewerProps {
  empresaId: string;
  ops: OrdemProducaoCompleta[];
  onOpenOpModal?: (op: OrdemProducaoCompleta) => void;
}

export function MotorCustosViewer({ empresaId, ops, onOpenOpModal }: MotorCustosViewerProps) {
  const [subTab, setSubTab] = useState<'geral' | 'por_op' | 'por_pedido' | 'por_produto' | 'vigencias'>('geral');
  const [loading, setLoading] = useState<boolean>(true);
  const [resumo, setResumo] = useState<ResumoMotorCustos | null>(null);
  const [vigenciaAtiva, setVigenciaAtiva] = useState<ParametroCustoVigencia | null>(null);
  const [todasVigencias, setTodasVigencias] = useState<ParametroCustoVigencia[]>([]);

  // Seleções para detalhe
  const [opSelecionadaId, setOpSelecionadaId] = useState<string>(ops[0]?.id || '');
  const [analiseOpAtual, setAnaliseOpAtual] = useState<AnaliseCustoOP | null>(null);
  const [analisePedidoAtual, setAnalisePedidoAtual] = useState<AnaliseCustoPedido | null>(null);
  const [analiseProdutoAtual, setAnaliseProdutoAtual] = useState<AnaliseCustoProduto | null>(null);
  const [produtoCodigoSelecionado, setProdutoCodigoSelecionado] = useState<string>(ops[0]?.produtoCodigo || 'CJ-CHAS-01');

  // Modo edição de vigência
  const [editandoVigencia, setEditandoVigencia] = useState<boolean>(false);
  const [formVigencia, setFormVigencia] = useState<Partial<ParametroCustoVigencia>>({});
  const [salvandoVigencia, setSalvandoVigencia] = useState<boolean>(false);

  const carregarDadosGerais = async () => {
    setLoading(true);
    try {
      const [resResumo, resVig] = await Promise.all([
        safeFetchJson<{ resumo: ResumoMotorCustos; vigenciaAtiva: ParametroCustoVigencia }>(`/api/v1/producao/custos-motor?empresaId=${empresaId}&tipo=resumo`),
        safeFetchJson<{ vigencias: ParametroCustoVigencia[] }>(`/api/v1/producao/custos-motor?empresaId=${empresaId}&tipo=vigencias`),
      ]);

      if (resResumo.success && resResumo.data) {
        setResumo(resResumo.data.resumo);
        setVigenciaAtiva(resResumo.data.vigenciaAtiva);
        setFormVigencia(resResumo.data.vigenciaAtiva || {});
      }

      if (resVig.success && resVig.data) {
        setTodasVigencias(resVig.data.vigencias || []);
      }
    } catch (e) {
      console.error('Erro ao carregar dados do motor de custos:', e);
    } finally {
      setLoading(false);
    }
  };

  const carregarAnaliseOP = async (id: string) => {
    if (!id) return;
    try {
      const res = await safeFetchJson<{ data: AnaliseCustoOP }>(`/api/v1/producao/custos-motor?empresaId=${empresaId}&tipo=op&id=${id}`);
      if (res.success && res.data) {
        setAnaliseOpAtual(res.data.data);
      }
    } catch (e) {
      console.error('Erro ao carregar análise de custo da OP:', e);
    }
  };

  const carregarAnalisePedido = async (id: string) => {
    try {
      const res = await safeFetchJson<{ data: AnaliseCustoPedido }>(`/api/v1/producao/custos-motor?empresaId=${empresaId}&tipo=pedido&id=${id || 'ped-01'}`);
      if (res.success && res.data) {
        setAnalisePedidoAtual(res.data.data);
      }
    } catch (e) {
      console.error('Erro ao carregar análise de custo do Pedido:', e);
    }
  };

  const carregarAnaliseProduto = async (codigo: string) => {
    try {
      const res = await safeFetchJson<{ data: AnaliseCustoProduto }>(`/api/v1/producao/custos-motor?empresaId=${empresaId}&tipo=produto&id=${codigo}`);
      if (res.success && res.data) {
        setAnaliseProdutoAtual(res.data.data);
      }
    } catch (e) {
      console.error('Erro ao carregar análise de custo do Produto:', e);
    }
  };

  useEffect(() => {
    carregarDadosGerais();
  }, [empresaId]);

  useEffect(() => {
    if (opSelecionadaId) {
      carregarAnaliseOP(opSelecionadaId);
    }
  }, [opSelecionadaId, empresaId]);

  useEffect(() => {
    if (subTab === 'por_pedido') {
      carregarAnalisePedido('ped-01');
    } else if (subTab === 'por_produto' && produtoCodigoSelecionado) {
      carregarAnaliseProduto(produtoCodigoSelecionado);
    }
  }, [subTab, produtoCodigoSelecionado, empresaId]);

  const handleSalvarVigencia = async () => {
    setSalvandoVigencia(true);
    try {
      const res = await safeFetchJson<{ data: ParametroCustoVigencia }>('/api/v1/producao/custos-motor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-empresa-id': empresaId,
        },
        body: JSON.stringify(formVigencia),
      });
      if (res.success && res.data?.data) {
        setVigenciaAtiva(res.data.data);
        setEditandoVigencia(false);
        await carregarDadosGerais();
        if (opSelecionadaId) carregarAnaliseOP(opSelecionadaId);
      }
    } catch (e) {
      console.error('Erro ao salvar vigência:', e);
    } finally {
      setSalvandoVigencia(false);
    }
  };

  const formatBRL = (val: number = 0) => {
    return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatPerc = (val: number = 0) => {
    return `${Number(val || 0).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* HEADER SUPERIOR DO MOTOR DE CUSTOS */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-emerald-400" />
            Motor de Custos Industriais (Padrão × Estimado × Realizado)
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => carregarDadosGerais()}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition border border-slate-700 text-xs flex items-center gap-1.5"
            title="Recarregar Análise de Custos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={() => setSubTab('vigencias')}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition text-xs flex items-center gap-2 shadow-xs"
          >
            <Settings className="w-4 h-4" />
            Tabela de Parâmetros & Vigência
          </button>
        </div>
      </div>

      {/* NAVEGAÇÃO DE SUB-ABAS DO MOTOR DE CUSTOS */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 text-sm font-medium">
        <button
          onClick={() => setSubTab('geral')}
          className={`pb-3 px-3 flex items-center gap-2 transition-colors whitespace-nowrap ${
            subTab === 'geral'
              ? 'border-b-2 border-emerald-600 text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          Dashboard Executivo Geral
        </button>

        <button
          onClick={() => setSubTab('por_op')}
          className={`pb-3 px-3 flex items-center gap-2 transition-colors whitespace-nowrap ${
            subTab === 'por_op'
              ? 'border-b-2 border-emerald-600 text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Custo por Ordem de Produção (OP)
        </button>

        <button
          onClick={() => setSubTab('por_pedido')}
          className={`pb-3 px-3 flex items-center gap-2 transition-colors whitespace-nowrap ${
            subTab === 'por_pedido'
              ? 'border-b-2 border-emerald-600 text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Custo por Pedido de Venda
        </button>

        <button
          onClick={() => setSubTab('por_produto')}
          className={`pb-3 px-3 flex items-center gap-2 transition-colors whitespace-nowrap ${
            subTab === 'por_produto'
              ? 'border-b-2 border-emerald-600 text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          Custo por Produto & Catálogo
        </button>

        <button
          onClick={() => setSubTab('vigencias')}
          className={`pb-3 px-3 flex items-center gap-2 transition-colors whitespace-nowrap ${
            subTab === 'vigencias'
              ? 'border-b-2 border-emerald-600 text-emerald-700 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Parâmetros & Vigências ({todasVigencias.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. ABA GERAL: DASHBOARD EXECUTIVO DE CUSTOS */}
      {/* ========================================================================= */}
      {subTab === 'geral' && resumo && (
        <div className="space-y-6">
          {/* CARDS DE INDICADORES MACRO */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                <span>Custo Estimado Global</span>
                <Calculator className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-black text-slate-800 mt-2">{formatBRL(resumo.custoEstimadoTotalGeral)}</p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                <span>{resumo.totalOpsAnalisadas} OPs</span> • <span>{resumo.totalPedidosAnalisados} Pedidos</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                <span>Custo Realizado Global</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{formatBRL(resumo.custoRealizadoTotalGeral)}</p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                <span>Apontamentos Reais de MOD + CHM</span>
              </div>
            </div>

            <div className={`p-5 rounded-xl border shadow-2xs ${
              resumo.desvioGeralValor > 0 ? 'bg-amber-50/50 border-amber-200' : 'bg-emerald-50/50 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between text-slate-600 text-xs font-semibold uppercase">
                <span>Desvio Real × Estimado</span>
                {resumo.desvioGeralValor > 0 ? (
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <p className={`text-2xl font-black mt-2 ${
                resumo.desvioGeralValor > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                {resumo.desvioGeralValor > 0 ? '+' : ''}{formatBRL(resumo.desvioGeralValor)}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-600">
                <span>Variação: {resumo.desvioGeralPercentual > 0 ? '+' : ''}{resumo.desvioGeralPercentual}%</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                <span>Aderência Orçamentária</span>
                <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-black text-indigo-600 mt-2">{resumo.taxaAderenciaEstimadoRealPercentual}%</p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, resumo.taxaAderenciaEstimadoRealPercentual)}%` }}
                />
              </div>
            </div>
          </div>

          {/* TABELA DE MAIORES DESVIOS / SOBRECUSTOS DETECTADOS */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Destaques de Sobrecusto e Desvios Críticos (Real × Previsto)
              </h3>
              <span className="text-xs text-slate-400">Classificação por impacto financeiro</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-semibold">Tipo</th>
                    <th className="py-2.5 px-3 font-semibold">Identificador</th>
                    <th className="py-2.5 px-3 font-semibold">Descrição / Objeto</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Previsto</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Realizado</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Sobrecusto (R$)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Desvio %</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resumo.maioresSobrecustos.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          item.tipo === 'OP' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {item.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{item.identificador}</td>
                      <td className="py-3 px-3 text-slate-600">{item.descricao}</td>
                      <td className="py-3 px-3 text-right font-medium text-slate-600">{formatBRL(item.previsto)}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">{formatBRL(item.realizado)}</td>
                      <td className="py-3 px-3 text-right font-bold text-amber-700">+{formatBRL(item.desvioValor)}</td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center text-amber-700 font-bold">
                          <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                          +{item.desvioPerc}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            if (item.tipo === 'OP') {
                              const found = ops.find((o) => o.numero === item.identificador);
                              if (found) setOpSelecionadaId(found.id);
                              setSubTab('por_op');
                            } else {
                              setSubTab('por_pedido');
                            }
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition"
                        >
                          Auditar
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

      {/* ========================================================================= */}
      {/* 2. ABA CUSTO POR ORDEM DE PRODUÇÃO (OP) */}
      {/* ========================================================================= */}
      {subTab === 'por_op' && (
        <div className="space-y-6">
          {/* BARRA DE SELEÇÃO DA OP */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Selecione a Ordem de Produção</h3>
                <p className="text-xs text-slate-500">Compare Custo Padrão (Engenharia), Estimado (Orçamento) e Realizado (Chão de Fábrica)</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={opSelecionadaId}
                onChange={(e) => setOpSelecionadaId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              >
                {ops.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.numero} - {op.produtoCodigo} ({op.quantidadePlanejada} {op.unidadeMedida}) - {op.status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {analiseOpAtual && (
            <div className="space-y-6">
              {/* COMPARATIVO 3 VISÕES: PADRÃO × ESTIMADO × REALIZADO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* VISÃO 1: PADRÃO */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Engenharia / BOM</span>
                      <h4 className="text-base font-bold text-slate-700">1. Custo Padrão</h4>
                    </div>
                    <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded">Standard</span>
                  </div>

                  <div>
                    <div className="text-2xl font-black text-slate-800">{formatBRL(analiseOpAtual.custoPadrao.custoTotalCompleto)}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Unitário: <strong className="text-slate-700">{formatBRL(analiseOpAtual.custoUnitarioPadrao)}</strong> / peça
                    </div>
                  </div>

                  <div className="space-y-2 text-xs divide-y divide-slate-50 pt-2 text-slate-600">
                    <div className="flex justify-between py-1">
                      <span>Material Líquido:</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoPadrao.custoMaterialLiquido)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Mão de Obra (MOD):</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoPadrao.custoMaoDeObraDireta)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Máquina (CHM):</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoPadrao.custoMaquinaCHM)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Setup & Preparação:</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoPadrao.custoSetup)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Consumíveis & Gases:</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoPadrao.custoConsumiveisGasesInsumos)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Terceiros / Tratamento:</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoPadrao.custoServicosTerceiros)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Custos Indiretos (GGF):</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoPadrao.custosIndiretosFabricacaoGGF)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Embalagem & Frete:</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoPadrao.custoEmbalagem + analiseOpAtual.custoPadrao.custoFrete)}</span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-500">
                      <span>Comissão + Tributos Estimados:</span>
                      <span>{formatBRL(analiseOpAtual.custoPadrao.despesaComissaoVendas + analiseOpAtual.custoPadrao.tributosEstimadosTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* VISÃO 2: ESTIMADO */}
                <div className="bg-blue-50/40 rounded-xl border border-blue-200 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Comercial / Orçamento</span>
                      <h4 className="text-base font-bold text-blue-900">2. Custo Estimado</h4>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">Orçado</span>
                  </div>

                  <div>
                    <div className="text-2xl font-black text-blue-950">{formatBRL(analiseOpAtual.custoEstimado.custoTotalCompleto)}</div>
                    <div className="text-xs text-blue-700 mt-1">
                      Unitário: <strong className="text-blue-900">{formatBRL(analiseOpAtual.custoUnitarioEstimado)}</strong> / peça
                    </div>
                  </div>

                  <div className="space-y-2 text-xs divide-y divide-blue-100/60 pt-2 text-slate-700">
                    <div className="flex justify-between py-1">
                      <span>Material Líquido:</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoEstimado.custoMaterialLiquido)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Mão de Obra (MOD):</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoEstimado.custoMaoDeObraDireta)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Máquina (CHM):</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoEstimado.custoMaquinaCHM)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Setup & Preparação:</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoEstimado.custoSetup)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Consumíveis & Gases:</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoEstimado.custoConsumiveisGasesInsumos)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Terceiros / Tratamento:</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoEstimado.custoServicosTerceiros)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Custos Indiretos (GGF):</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoEstimado.custosIndiretosFabricacaoGGF)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Embalagem & Frete:</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoEstimado.custoEmbalagem + analiseOpAtual.custoEstimado.custoFrete)}</span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-500">
                      <span>Comissão + Tributos Estimados:</span>
                      <span>{formatBRL(analiseOpAtual.custoEstimado.despesaComissaoVendas + analiseOpAtual.custoEstimado.tributosEstimadosTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* VISÃO 3: REALIZADO */}
                <div className="bg-emerald-50/40 rounded-xl border border-emerald-300 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Chão de Fábrica / Real</span>
                      <h4 className="text-base font-bold text-emerald-950">3. Custo Realizado</h4>
                    </div>
                    <span className="bg-emerald-200 text-emerald-900 text-xs font-bold px-2 py-0.5 rounded">Apontado</span>
                  </div>

                  <div>
                    <div className="text-2xl font-black text-emerald-950">{formatBRL(analiseOpAtual.custoRealizado.custoTotalCompleto)}</div>
                    <div className="text-xs text-emerald-800 mt-1">
                      Unitário: <strong className="text-emerald-950">{formatBRL(analiseOpAtual.custoUnitarioRealizado)}</strong> / peça
                    </div>
                  </div>

                  <div className="space-y-2 text-xs divide-y divide-emerald-100 pt-2 text-slate-800">
                    <div className="flex justify-between py-1">
                      <span>Material Consumido Real:</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoRealizado.custoMaterialBruto)}</span>
                    </div>
                    <div className="flex justify-between py-1 text-red-700 font-medium">
                      <span>+ Perdas / Refugos / Retrabalhos:</span>
                      <span>+{formatBRL(analiseOpAtual.custoRealizado.custoPerdasRefugos)}</span>
                    </div>
                    {analiseOpAtual.custoRealizado.creditoRetalhosAproveitaveis > 0 && (
                      <div className="flex justify-between py-1 text-emerald-700 font-medium">
                        <span>- Crédito Retalhos Aproveitados:</span>
                        <span>-{formatBRL(analiseOpAtual.custoRealizado.creditoRetalhosAproveitaveis)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1">
                      <span>Mão de Obra Real (Apontamentos):</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoRealizado.custoMaoDeObraDireta)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Custo-Hora Máquina Real:</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoRealizado.custoMaquinaCHM)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Setup Real:</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoRealizado.custoSetup)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Consumíveis Reais (Gases/Tintas):</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoRealizado.custoConsumiveisGasesInsumos)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Serviços de Terceiros:</span>
                      <span className="font-semibold">{formatBRL(analiseOpAtual.custoRealizado.custoServicosTerceiros)}</span>
                    </div>
                    <div className="flex justify-between py-1 font-semibold text-slate-700">
                      <span>Custos Indiretos (GGF Absorvido):</span>
                      <span>{formatBRL(analiseOpAtual.custoRealizado.custosIndiretosFabricacaoGGF)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DETALHAMENTO DE CUSTO POR OPERAÇÃO INDIVIDUAL DA OP */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-emerald-600" />
                    Apropriação de Custo por Operação do Roteiro (Chão de Fábrica)
                  </h3>
                  <span className="text-xs text-slate-400">Cruzamento de Custo-Hora Parametrizado × Horas Apontadas</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <th className="py-2.5 px-3 font-semibold">Seq.</th>
                        <th className="py-2.5 px-3 font-semibold">Operação / Máquina</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Taxa CHM</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Taxa MOD</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Tempo Prev.</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Tempo Real</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Custo Previsto</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Custo Realizado</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Variação (R$)</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analiseOpAtual.operacoes.map((opItem) => (
                        <tr key={opItem.operacaoId} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-500">{opItem.sequencia}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-800">{opItem.nomeOperacao}</div>
                            <div className="text-[11px] text-slate-500">{opItem.maquinaNome} • {opItem.setor}</div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700">
                            {formatBRL(opItem.custoRealizado.taxaHoraMaquina)}/h
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700">
                            {formatBRL(opItem.custoRealizado.taxaHoraMOD)}/h
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600">
                            {opItem.custoPadrao.tempoTotalMinutos} min
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900">
                            {opItem.custoRealizado.tempoTotalMinutos} min
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600">
                            {formatBRL(opItem.custoEstimado.custoTotalOperacao)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900">
                            {formatBRL(opItem.custoRealizado.custoTotalOperacao)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold">
                            <span className={opItem.variacaoRealVsPrevistoValor > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                              {opItem.variacaoRealVsPrevistoValor > 0 ? '+' : ''}{formatBRL(opItem.variacaoRealVsPrevistoValor)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              opItem.statusDesvio === 'SOBRECUSTO_CRITICO'
                                ? 'bg-red-100 text-red-800'
                                : opItem.statusDesvio === 'SOBRECUSTO_MODERADO'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {opItem.statusDesvio}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ABA CUSTO POR PEDIDO DE VENDA */}
      {/* ========================================================================= */}
      {subTab === 'por_pedido' && analisePedidoAtual && (
        <div className="space-y-6">
          {/* HEADER DO PEDIDO */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                  Pedido #{analisePedidoAtual.pedidoNumero}
                </span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                  {analisePedidoAtual.statusPedido}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-800 mt-1">{analisePedidoAtual.clienteNome}</h3>
              <p className="text-xs text-slate-500">CNPJ: {analisePedidoAtual.clienteCnpj}</p>
            </div>

            <div className="flex items-center gap-6 text-right">
              <div>
                <span className="text-[11px] text-slate-500 font-medium">Valor Total da Venda</span>
                <div className="text-lg font-black text-slate-900">{formatBRL(analisePedidoAtual.valorTotalVendaLiquida)}</div>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium">Margem Realizada</span>
                <div className={`text-lg font-black ${
                  analisePedidoAtual.margemContribuicaoRealizadaPerc >= 20 ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {analisePedidoAtual.margemContribuicaoRealizadaPerc}%
                </div>
              </div>
            </div>
          </div>

          {/* ITENS DO PEDIDO E RENTABILIDADE REAL X ORÇADA */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              Rentabilidade por Item do Pedido (Custo Realizado × Preço de Venda)
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-semibold">Item</th>
                    <th className="py-2.5 px-3 font-semibold">Produto / Descrição</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Qtd</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Preço Unit.</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Custo Est. Unit.</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Custo Real Unit.</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Margem Est. %</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Margem Real %</th>
                    <th className="py-2.5 px-3 font-semibold text-center">OP Vinculada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analisePedidoAtual.itens.map((it) => (
                    <tr key={it.itemNumero} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-400">{it.itemNumero}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{it.produtoCodigo}</div>
                        <div className="text-[11px] text-slate-500">{it.descricao}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-800">{it.quantidade}</td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700">{formatBRL(it.precoVendaUnitario)}</td>
                      <td className="py-3 px-3 text-right text-slate-600">{formatBRL(it.custoEstimadoUnitario)}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">{formatBRL(it.custoRealizadoUnitario)}</td>
                      <td className="py-3 px-3 text-right text-slate-600">{it.margemEstimadaPerc}%</td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span className={it.margemRealizadaPerc >= it.margemEstimadaPerc ? 'text-emerald-700' : 'text-amber-700'}>
                          {it.margemRealizadaPerc}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {it.opVinculadaNumero ? (
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                            {it.opVinculadaNumero}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
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
      {/* 4. ABA CUSTO POR PRODUTO / CATÁLOGO */}
      {/* ========================================================================= */}
      {subTab === 'por_produto' && analiseProdutoAtual && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  {analiseProdutoAtual.produtoCodigo}
                </span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                  {analiseProdutoAtual.familiaProduto}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-800 mt-1">{analiseProdutoAtual.produtoDescricao}</h3>
              <p className="text-xs text-slate-500">Peso Líquido Estimado: {analiseProdutoAtual.pesoLiquidoKg} kg</p>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={produtoCodigoSelecionado}
                onChange={(e) => setProdutoCodigoSelecionado(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800 outline-hidden"
              >
                <option value="CJ-CHAS-01">CJ-CHAS-01 - Chassi Tubular</option>
                <option value="FLG-INOX-04">FLG-INOX-04 - Flange Inox 304</option>
                <option value="SUP-CALD-09">SUP-CALD-09 - Suporte Caldeiraria</option>
              </select>
            </div>
          </div>

          {/* HISTÓRICO DE LOTES FABRICADOS */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Evolução Histórica do Custo Unitário por Lote Fabricado
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-semibold">OP Número</th>
                    <th className="py-2.5 px-3 font-semibold">Data Conclusão</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Qtd Lote</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Custo Unitário Realizado</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Desvio vs Custo Padrão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analiseProdutoAtual.historicoLotesOPs.map((lote, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{lote.opNumero}</td>
                      <td className="py-3 px-3 text-slate-600">{lote.dataFinalizacao.split('T')[0]}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">{lote.quantidade} UN</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">{formatBRL(lote.custoUnitarioRealizado)}</td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span className={lote.desvioVsPadraoPerc > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                          {lote.desvioVsPadraoPerc > 0 ? '+' : ''}{lote.desvioVsPadraoPerc}%
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

      {/* ========================================================================= */}
      {/* 5. ABA TABELA DE PARÂMETROS E VIGÊNCIAS */}
      {/* ========================================================================= */}
      {subTab === 'vigencias' && vigenciaAtiva && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-600" />
                  Parametrização de Custos por Vigência & Centro de Trabalho
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Taxas horárias de máquinas, encargos de mão de obra, GGF, fretes, embalagens e impostos estimados vinculados a este CNPJ.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!editandoVigencia ? (
                  <button
                    onClick={() => {
                      setFormVigencia({ ...vigenciaAtiva });
                      setEditandoVigencia(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <Settings className="w-4 h-4" />
                    Editar Parâmetros Vigentes
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setEditandoVigencia(false)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSalvarVigencia}
                      disabled={salvandoVigencia}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {salvandoVigencia ? 'Salvando...' : 'Salvar Nova Versão'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* FORMULÁRIO DE TAXAS HORÁRIAS (CHM) */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Custo-Hora Máquina / Centros de Trabalho (R$/hora)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Laser Fibra Óptica 6kW</label>
                  <input
                    type="number"
                    disabled={!editandoVigencia}
                    value={formVigencia.taxaHoraLaserFibra || 0}
                    onChange={(e) => setFormVigencia({ ...formVigencia, taxaHoraLaserFibra: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 border rounded-lg bg-slate-50 font-mono font-bold text-slate-800 disabled:opacity-75"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Plasma HD Alta Definição</label>
                  <input
                    type="number"
                    disabled={!editandoVigencia}
                    value={formVigencia.taxaHoraPlasmaHD || 0}
                    onChange={(e) => setFormVigencia({ ...formVigencia, taxaHoraPlasmaHD: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 border rounded-lg bg-slate-50 font-mono font-bold text-slate-800 disabled:opacity-75"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Dobra CNC 220t</label>
                  <input
                    type="number"
                    disabled={!editandoVigencia}
                    value={formVigencia.taxaHoraDobraCNC || 0}
                    onChange={(e) => setFormVigencia({ ...formVigencia, taxaHoraDobraCNC: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 border rounded-lg bg-slate-50 font-mono font-bold text-slate-800 disabled:opacity-75"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Estação de Solda MIG/TIG</label>
                  <input
                    type="number"
                    disabled={!editandoVigencia}
                    value={formVigencia.taxaHoraSoldaCaldeiraria || 0}
                    onChange={(e) => setFormVigencia({ ...formVigencia, taxaHoraSoldaCaldeiraria: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 border rounded-lg bg-slate-50 font-mono font-bold text-slate-800 disabled:opacity-75"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Cabine de Pintura & Estufa</label>
                  <input
                    type="number"
                    disabled={!editandoVigencia}
                    value={formVigencia.taxaHoraPinturaEstufa || 0}
                    onChange={(e) => setFormVigencia({ ...formVigencia, taxaHoraPinturaEstufa: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 border rounded-lg bg-slate-50 font-mono font-bold text-slate-800 disabled:opacity-75"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Centro de Usinagem CNC</label>
                  <input
                    type="number"
                    disabled={!editandoVigencia}
                    value={formVigencia.taxaHoraUsinagemCNC || 0}
                    onChange={(e) => setFormVigencia({ ...formVigencia, taxaHoraUsinagemCNC: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 border rounded-lg bg-slate-50 font-mono font-bold text-slate-800 disabled:opacity-75"
                  />
                </div>
              </div>
            </div>

            {/* FORMULÁRIO DE MOD E GGF */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Mão de Obra Direta, Encargos & Custos Indiretos (GGF)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Salário-Base MOD (R$/h)</label>
                  <input
                    type="number"
                    disabled={!editandoVigencia}
                    value={formVigencia.taxaHoraHomemMODPadrao || 0}
                    onChange={(e) => setFormVigencia({ ...formVigencia, taxaHoraHomemMODPadrao: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 border rounded-lg bg-slate-50 font-mono font-bold text-slate-800 disabled:opacity-75"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fator Multiplicador de Encargos</label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={!editandoVigencia}
                    value={formVigencia.fatorEncargosTrabalhistasSociais || 0}
                    onChange={(e) => setFormVigencia({ ...formVigencia, fatorEncargosTrabalhistasSociais: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 border rounded-lg bg-slate-50 font-mono font-bold text-slate-800 disabled:opacity-75"
                  />
                  <span className="text-[10px] text-slate-400">Ex: 1.85 = 85% de encargos trabalhistas</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Rateio Custos Indiretos GGF (%)</label>
                  <input
                    type="number"
                    disabled={!editandoVigencia}
                    value={formVigencia.fatorCustosIndiretosPercentual || 0}
                    onChange={(e) => setFormVigencia({ ...formVigencia, fatorCustosIndiretosPercentual: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 border rounded-lg bg-slate-50 font-mono font-bold text-slate-800 disabled:opacity-75"
                  />
                </div>
              </div>
            </div>

            {/* FORMULÁRIO DE LOGÍSTICA, COMISSÃO E IMPOSTOS ESTIMADOS */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Embalagem, Frete, Comissão & Tributação Estimada
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Comissão Comercial (%)</label>
                  <input
                    type="number"
                    disabled={!editandoVigencia}
                    value={formVigencia.taxaComissaoPadraoPercentual || 0}
                    onChange={(e) => setFormVigencia({ ...formVigencia, taxaComissaoPadraoPercentual: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 border rounded-lg bg-slate-50 font-mono text-slate-800 disabled:opacity-75"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Embalagem (R$/kg ou %)</label>
                  <input
                    type="number"
                    disabled={!editandoVigencia}
                    value={formVigencia.taxaEmbalagemPorKg || 0}
                    onChange={(e) => setFormVigencia({ ...formVigencia, taxaEmbalagemPorKg: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 border rounded-lg bg-slate-50 font-mono text-slate-800 disabled:opacity-75"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Frete Médio Estimado (R$/kg)</label>
                  <input
                    type="number"
                    disabled={!editandoVigencia}
                    value={formVigencia.taxaFretePorKg || 0}
                    onChange={(e) => setFormVigencia({ ...formVigencia, taxaFretePorKg: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 border rounded-lg bg-slate-50 font-mono text-slate-800 disabled:opacity-75"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ICMS Estimado (%)</label>
                  <input
                    type="number"
                    disabled={!editandoVigencia}
                    value={formVigencia.aliquotaIcmsEstimadaPercentual || 0}
                    onChange={(e) => setFormVigencia({ ...formVigencia, aliquotaIcmsEstimadaPercentual: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 border rounded-lg bg-slate-50 font-mono text-slate-800 disabled:opacity-75"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
