// frontend/src/components/ProducaoViewer.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Factory,
  Play,
  Square,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Cpu,
  Layers,
  FileSpreadsheet,
  Plus,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Percent,
  DollarSign,
  AlertOctagon,
  Wrench,
  Search,
  ChevronRight,
  Sparkles,
  ClipboardList,
  RefreshCw,
  X,
  Lock,
  Unlock,
  Scissors,
  Sliders,
} from 'lucide-react';
import { ProcessosTecnicosViewer } from './ProcessosTecnicosViewer';
import { MotorCustosViewer } from './MotorCustosViewer';
import {
  OrdemProducaoCompleta,
  OpMaterial,
  OpOperacao,
  ApontamentoProducao,
  ParadaProducao,
  RefugoProducao,
  RetrabalhoProducao,
  OperadorProducao,
  MaquinaCentroTrabalho,
  MotivoParadaCategoria,
  MotivoRefugoCategoria,
  MotivoRetrabalhoCategoria,
  JustificativaEncerramentoOP,
} from '@/backend/modules/producao/producao-types';

interface ProducaoViewerProps {
  empresaId: string;
}

export function ProducaoViewer({ empresaId }: ProducaoViewerProps) {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'ops' | 'processos' | 'kiosk_apontamento' | 'paradas' | 'qualidade' | 'custos'
  >('dashboard');

  const [loading, setLoading] = useState<boolean>(true);
  const [ops, setOps] = useState<OrdemProducaoCompleta[]>([]);
  const [operadores, setOperadores] = useState<OperadorProducao[]>([]);
  const [maquinas, setMaquinas] = useState<MaquinaCentroTrabalho[]>([]);
  const [paradas, setParadas] = useState<ParadaProducao[]>([]);
  const [refugos, setRefugos] = useState<RefugoProducao[]>([]);
  const [retrabalhos, setRetrabalhos] = useState<RetrabalhoProducao[]>([]);
  const [apontamentos, setApontamentos] = useState<ApontamentoProducao[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [resumoCorte, setResumoCorte] = useState<any[]>([]);
  const [resumoDobra, setResumoDobra] = useState<any[]>([]);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('TODOS');
  const [buscaTexto, setBuscaTexto] = useState<string>('');

  // Modais e seleções
  const [opDetalheSelecionada, setOpDetalheSelecionada] = useState<OrdemProducaoCompleta | null>(null);
  const [modalNovaOpAberto, setModalNovaOpAberto] = useState<boolean>(false);
  const [modalEncerramentoAberto, setModalEncerramentoAberto] = useState<boolean>(false);
  const [opParaEncerrar, setOpParaEncerrar] = useState<OrdemProducaoCompleta | null>(null);
  const [modalNovaParadaAberto, setModalNovaParadaAberto] = useState<boolean>(false);

  // Estado do Terminal Kiosk de Apontamento
  const [kioskOpId, setKioskOpId] = useState<string>('');
  const [kioskOperacaoId, setKioskOperacaoId] = useState<string>('');
  const [kioskOperadorId, setKioskOperadorId] = useState<string>('op-01');
  const [kioskMaquinaId, setKioskMaquinaId] = useState<string>('maq-laser-01');
  const [kioskTipoApt, setKioskTipoApt] = useState<'SETUP' | 'PRODUCAO' | 'FINALIZACAO_OPERACAO'>('PRODUCAO');
  const [kioskBoomBoas, setKioskBoomBoas] = useState<number>(1);
  const [kioskRefugo, setKioskRefugo] = useState<number>(0);
  const [kioskMotivoRefugo, setKioskMotivoRefugo] = useState<MotivoRefugoCategoria>('DEFEITO_CORTE_LASER');
  const [kioskDescricaoRefugo, setKioskDescricaoRefugo] = useState<string>('');
  const [kioskRetrabalho, setKioskRetrabalho] = useState<number>(0);
  const [kioskMotivoRetrabalho, setKioskMotivoRetrabalho] = useState<MotivoRetrabalhoCategoria>('RECORTE_REBARBA');
  const [kioskDescricaoRetrabalho, setKioskDescricaoRetrabalho] = useState<string>('');
  const [kioskDuracaoMinutos, setKioskDuracaoMinutos] = useState<number>(35);
  const [kioskConsumoMaterialQtd, setKioskConsumoMaterialQtd] = useState<number>(1);
  const [kioskObservacoes, setKioskObservacoes] = useState<string>('');
  const [salvandoApontamento, setSalvandoApontamento] = useState<boolean>(false);

  // Estado do Encerramento Rígido
  const [motivoEncerramento, setMotivoEncerramento] = useState<JustificativaEncerramentoOP['motivo']>('ENCERRAMENTO_PARCIAL_ACEITO');
  const [descEncerramento, setDescEncerramento] = useState<string>('');
  const [responsavelEncerramento, setResponsavelEncerramento] = useState<string>('Gerente de Produção');
  const [autorizacaoGerencia, setAutorizacaoGerencia] = useState<boolean>(false);
  const [processandoEncerramento, setProcessandoEncerramento] = useState<boolean>(false);
  const [erroEncerramento, setErroEncerramento] = useState<string>('');

  // Estado de Parada
  const [paradaMaquinaId, setParadaMaquinaId] = useState<string>('maq-laser-01');
  const [paradaOperadorId, setParadaOperadorId] = useState<string>('op-01');
  const [paradaCategoria, setParadaCategoria] = useState<MotivoParadaCategoria>('TROCA_FERRAMENTA');
  const [paradaDescricao, setParadaDescricao] = useState<string>('');
  const [salvandoParada, setSalvandoParada] = useState<boolean>(false);

  const carregarDados = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/producao?empresaId=${empresaId}`);
      const data = await res.json();
      if (data.success) {
        setOps(data.ordens || []);
        setOperadores(data.operadores || []);
        setMaquinas(data.maquinas || []);
        setParadas(data.paradas || []);
        setRefugos(data.refugos || []);
        setRetrabalhos(data.retrabalhos || []);
        setApontamentos(data.apontamentos || []);
        setStats(data.stats || null);
        setResumoCorte(data.resumoCorte || []);
        setResumoDobra(data.resumoDobra || []);

        if (data.ordens?.length > 0 && !kioskOpId) {
          const primeiraOp = data.ordens[0];
          setKioskOpId(primeiraOp.id);
          if (primeiraOp.operacoes?.length > 0) {
            setKioskOperacaoId(primeiraOp.operacoes[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados de produção:', err);
    } finally {
      setLoading(false);
    }
  }, [empresaId, kioskOpId]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch(`/api/v1/producao?empresaId=${empresaId}`);
        const data = await res.json();
        if (!ignore && data.success) {
          setOps(data.ordens || []);
          setOperadores(data.operadores || []);
          setMaquinas(data.maquinas || []);
          setParadas(data.paradas || []);
          setRefugos(data.refugos || []);
          setRetrabalhos(data.retrabalhos || []);
          setApontamentos(data.apontamentos || []);
          setStats(data.stats || null);
          setResumoCorte(data.resumoCorte || []);
          setResumoDobra(data.resumoDobra || []);

          if (data.ordens?.length > 0) {
            const primeiraOp = data.ordens[0];
            setKioskOpId(primeiraOp.id);
            if (primeiraOp.operacoes?.length > 0) {
              setKioskOperacaoId(primeiraOp.operacoes[0].id);
            }
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Erro ao carregar dados de produção:', err);
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [empresaId]);

  // Handler de Apontamento Kiosk
  const handleRegistrarApontamento = async () => {
    if (!kioskOpId || !kioskOperacaoId) {
      alert('Selecione a Ordem de Produção e a Operação.');
      return;
    }

    try {
      setSalvandoApontamento(true);
      const opAtual = ops.find((o) => o.id === kioskOpId);
      const operacaoAtual = opAtual?.operacoes.find((op) => op.id === kioskOperacaoId);

      const payload = {
        empresaId,
        opId: kioskOpId,
        opOperacaoId: kioskOperacaoId,
        tipoApontamento: kioskTipoApt,
        duracaoMinutos: Number(kioskDuracaoMinutos),
        operadorId: kioskOperadorId,
        maquinaId: kioskMaquinaId,
        quantidadeBoas: Number(kioskBoomBoas),
        quantidadeRefugo: Number(kioskRefugo),
        quantidadeRetrabalho: Number(kioskRetrabalho),
        motivoRefugo: kioskRefugo > 0 ? kioskMotivoRefugo : undefined,
        descricaoRefugo: kioskRefugo > 0 ? kioskDescricaoRefugo : undefined,
        motivoRetrabalho: kioskRetrabalho > 0 ? kioskMotivoRetrabalho : undefined,
        descricaoRetrabalho: kioskRetrabalho > 0 ? kioskDescricaoRetrabalho : undefined,
        materiaisConsumidos:
          opAtual && opAtual.materiais.length > 0
            ? [
                {
                  materialId: opAtual.materiais[0].id,
                  quantidadeConsumida: Number(kioskConsumoMaterialQtd),
                  lote: opAtual.materiais[0].loteMateriaPrima,
                },
              ]
            : [],
        observacoes: kioskObservacoes,
      };

      const res = await fetch('/api/v1/producao/apontamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!resData.success) {
        alert(`Erro ao registrar apontamento: ${resData.error}`);
        return;
      }

      alert(
        `Apontamento registrado com sucesso!\nPeças Boas: ${kioskBoomBoas}\nRefugo: ${kioskRefugo}\nRetrabalho: ${kioskRetrabalho}\nPróxima operação e custos recalculados automaticamente.`
      );

      setKioskBoomBoas(1);
      setKioskRefugo(0);
      setKioskRetrabalho(0);
      setKioskDescricaoRefugo('');
      setKioskDescricaoRetrabalho('');
      setKioskObservacoes('');

      await carregarDados();
    } catch (err: any) {
      alert(`Erro na requisição: ${err.message}`);
    } finally {
      setSalvandoApontamento(false);
    }
  };

  // Handler de Parada
  const handleRegistrarParada = async () => {
    try {
      setSalvandoParada(true);
      const res = await fetch('/api/v1/producao/parada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId,
          maquinaId: paradaMaquinaId,
          operadorId: paradaOperadorId,
          motivoCategoria: paradaCategoria,
          motivoDescricao: paradaDescricao || 'Parada iniciada no monitor',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Parada iniciada com sucesso. Máquina em status PARADA.');
        setModalNovaParadaAberto(false);
        setParadaDescricao('');
        await carregarDados();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setSalvandoParada(false);
    }
  };

  const handleFinalizarParada = async (paradaId: string) => {
    try {
      const res = await fetch('/api/v1/producao/parada', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paradaId,
          empresaId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        await carregarDados();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  // Handler de Encerramento Rígido de OP
  const handleEncerrarOP = async () => {
    if (!opParaEncerrar) return;

    setProcessandoEncerramento(true);
    setErroEncerramento('');

    try {
      const temPendencias =
        opParaEncerrar.quantidadeProduzida + opParaEncerrar.quantidadeRefugada < opParaEncerrar.quantidadePlanejada ||
        opParaEncerrar.operacoes.some((o) => o.status !== 'CONCLUIDA');

      const payload: any = {
        opId: opParaEncerrar.id,
        empresaId,
      };

      if (temPendencias) {
        payload.justificativaExplicita = {
          motivo: motivoEncerramento,
          descricaoDetalhada: descEncerramento,
          responsavelNome: responsavelEncerramento,
          autorizacaoGerencia: autorizacaoGerencia,
        };
      }

      const res = await fetch('/api/v1/producao/op/encerrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        setErroEncerramento(data.error);
        return;
      }

      alert(data.message);
      setModalEncerramentoAberto(false);
      setOpParaEncerrar(null);
      setDescEncerramento('');
      setAutorizacaoGerencia(false);
      await carregarDados();
    } catch (err: any) {
      setErroEncerramento(err.message);
    } finally {
      setProcessandoEncerramento(false);
    }
  };

  // Handler Concluir Retrabalho
  const handleConcluirRetrabalho = async (retId: string, aprovado: boolean) => {
    try {
      const res = await fetch('/api/v1/producao/retrabalho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retrabalhoId: retId,
          empresaId,
          tempoRealMinutos: 60,
          custoReal: 150.0,
          aprovadoQualidade: aprovado,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        await carregarDados();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  // Filtragem de OPs
  const opsFiltradas = ops.filter((op) => {
    if (filtroStatus !== 'TODOS' && op.status !== filtroStatus) return false;
    if (filtroTipo !== 'TODOS' && op.tipoOP !== filtroTipo) return false;
    if (filtroPrioridade !== 'TODOS' && op.prioridade !== filtroPrioridade) return false;
    if (buscaTexto) {
      const t = buscaTexto.toLowerCase();
      return (
        op.numero.toLowerCase().includes(t) ||
        op.produtoDescricao.toLowerCase().includes(t) ||
        op.produtoCodigo.toLowerCase().includes(t) ||
        (op.pedidoNumero && op.pedidoNumero.toLowerCase().includes(t)) ||
        (op.clienteNome && op.clienteNome.toLowerCase().includes(t))
      );
    }
    return true;
  });

  const opKioskSelecionada = ops.find((o) => o.id === kioskOpId);
  const operacaoKioskSelecionada = opKioskSelecionada?.operacoes.find((o) => o.id === kioskOperacaoId);

  return (
    <div className="space-y-6" id="producao-container">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 rounded-full flex items-center gap-1">
                <Factory className="w-3.5 h-3.5" />
                MÓDULO 10
              </span>
              <span className="text-xs text-slate-500 font-medium">Chão de Fábrica & Execução de OPs</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Gestão da Produção & Chão de Fábrica
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl">
              Execução em tempo real de Ordens de Produção (OPs totais e parciais), apontamentos de setup/ciclo, repasse sequencial de peças boas, registro de refugo, retrabalho, paradas de máquina e encerramento seguro.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setModalNovaParadaAberto(true)}
              className="px-3.5 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Registrar Parada
            </button>
            <button
              onClick={() => setActiveTab('kiosk_apontamento')}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              Terminal Kiosk Apontamento
            </button>
          </div>
        </div>

        {/* STATS RÁPIDOS */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">OPs em Andamento</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-slate-900">{stats.opsEmProducao}</span>
                <span className="text-xs text-slate-500">de {stats.totalOps} OPs</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Peças Produzidas</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-emerald-700">{stats.totalPecasProduzidas}</span>
                <span className="text-xs text-slate-500">/ {stats.totalPecasPlanejadas} un</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Taxa de Refugo</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-xl font-bold ${stats.taxaRefugoGeral > 3 ? 'text-rose-600' : 'text-amber-600'}`}>
                  {stats.taxaRefugoGeral}%
                </span>
                <span className="text-xs text-slate-500">({stats.totalPecasRefugadas} peças)</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Paradas Ativas</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-xl font-bold ${stats.paradasAtivasCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {stats.paradasAtivasCount}
                </span>
                <span className="text-xs text-slate-500">máquinas paradas</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Custo Real Acumulado</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-slate-900">
                  R$ {(stats.custoTotalReal / 1000).toFixed(1)}k
                </span>
                <span className="text-xs text-slate-500">/ {(stats.custoTotalPlanejado / 1000).toFixed(1)}k</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Retrabalhos Pendentes</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-amber-700">{stats.retrabalhosPendentesCount}</span>
                <span className="text-xs text-slate-500">ações abertas</span>
              </div>
            </div>
          </div>
        )}

        {/* NAVEGAÇÃO DE SUB-ABAS */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Visão Geral & Chão de Fábrica
          </button>
          <button
            onClick={() => setActiveTab('ops')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ops'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            Ordens de Produção ({ops.length})
          </button>
          <button
            onClick={() => setActiveTab('processos')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'processos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Scissors className="w-4 h-4" />
            Engenharia & Processos Técnicos
          </button>
          <button
            onClick={() => setActiveTab('kiosk_apontamento')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'kiosk_apontamento'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Play className="w-4 h-4" />
            Terminal do Operador (Kiosk)
          </button>
          <button
            onClick={() => setActiveTab('paradas')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'paradas'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Monitor de Paradas ({paradas.length})
          </button>
          <button
            onClick={() => setActiveTab('qualidade')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'qualidade'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Refugos & Retrabalhos ({refugos.length + retrabalhos.length})
          </button>
          <button
            onClick={() => setActiveTab('custos')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'custos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Custos Reais vs Planejados
          </button>
        </div>
      </div>

      {/* CONTEÚDO DAS ABAS */}

      {/* ABA 1: DASHBOARD GERAL */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status das Máquinas */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  Status em Tempo Real dos Centros de Trabalho & Máquinas
                </h3>
                <span className="text-xs text-slate-500 font-medium">{maquinas.length} máquinas conectadas</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {maquinas.map((m) => {
                  const isParada = m.status === 'PARADA';
                  const isProducao = m.status === 'EM_PRODUCAO';

                  return (
                    <div
                      key={m.id}
                      className={`p-4 rounded-lg border transition-all ${
                        isParada
                          ? 'border-rose-300 bg-rose-50/70'
                          : isProducao
                          ? 'border-blue-200 bg-blue-50/50'
                          : 'border-slate-200 bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">{m.setor}</span>
                          <h4 className="text-xs font-bold text-slate-900 mt-0.5">{m.nome}</h4>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                            isParada
                              ? 'bg-rose-600 text-white animate-pulse'
                              : isProducao
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>

                      {m.opAtualNumero && (
                        <div className="mt-2 text-xs bg-white/80 p-2 rounded border border-slate-200/80">
                          <span className="text-[11px] text-slate-500 block">Executando OP:</span>
                          <span className="font-bold text-slate-800">{m.opAtualNumero}</span>
                          {m.operacaoAtualNome && (
                            <span className="text-slate-600 block text-[11px] truncate mt-0.5">
                              {m.operacaoAtualNome}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-600 mt-3 pt-2 border-t border-slate-200/60">
                        <span>OEE Atual: <strong>{m.oeeAtualPercentual}%</strong></span>
                        <span>Custo/h: <strong>R$ {m.custoHora.toFixed(2)}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Operadores de Turno */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  Operadores de Chão de Fábrica
                </h3>
                <span className="text-xs text-slate-500">{operadores.length} escalados</span>
              </div>

              <div className="space-y-2.5">
                {operadores.map((oprd) => (
                  <div key={oprd.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{oprd.nome}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({oprd.matricula})</span>
                      </div>
                      <span className="text-[11px] text-slate-600 block">{oprd.especialidade}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        oprd.status === 'EM_OPERACAO'
                          ? 'bg-blue-100 text-blue-800'
                          : oprd.status === 'DISPONIVEL'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {oprd.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Últimos Apontamentos Realizados */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-indigo-600" />
                Histórico Recente de Apontamentos de Produção
              </h3>
              <button
                onClick={() => carregarDados()}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-bold"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Atualizar
              </button>
            </div>

            {apontamentos.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Nenhum apontamento registrado ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">Data/Hora</th>
                      <th className="py-2.5 px-3">OP</th>
                      <th className="py-2.5 px-3">Operação</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Operador</th>
                      <th className="py-2.5 px-3 text-center">Boas</th>
                      <th className="py-2.5 px-3 text-center">Refugo</th>
                      <th className="py-2.5 px-3 text-center">Retrabalho</th>
                      <th className="py-2.5 px-3 text-right">Duração</th>
                      <th className="py-2.5 px-3 text-right">Custo Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {apontamentos.slice(0, 8).map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{apt.criadoEm}</td>
                        <td className="py-2.5 px-3 font-bold text-blue-700">{apt.opNumero}</td>
                        <td className="py-2.5 px-3 text-slate-800">
                          <span className="font-semibold text-slate-500 mr-1">Seq {apt.sequenciaOperacao}:</span>
                          {apt.nomeOperacao}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">
                            {apt.tipoApontamento}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{apt.operadorNome}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{apt.quantidadeBoas}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-rose-600">
                          {apt.quantidadeRefugo > 0 ? apt.quantidadeRefugo : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-amber-600">
                          {apt.quantidadeRetrabalho > 0 ? apt.quantidadeRetrabalho : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">{apt.duracaoMinutos} min</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          R$ {apt.custoTotalApontamento.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 2: LISTAGEM DE ORDENS DE PRODUÇÃO */}
      {activeTab === 'ops' && (
        <div className="space-y-6">
          {/* Filtros de OPs */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por OP, produto, pedido, cliente..."
                  value={buscaTexto}
                  onChange={(e) => setBuscaTexto(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="LIBERADA">Liberada</option>
                <option value="EM_PRODUCAO">Em Produção</option>
                <option value="CONCLUIDA">Concluída</option>
                <option value="ENCERRADA_PARCIAL">Encerrada Parcial</option>
                <option value="PAUSADA">Pausada</option>
              </select>

              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium"
              >
                <option value="TODOS">Todos os Tipos de OP</option>
                <option value="TOTAL">OP Total</option>
                <option value="PARCIAL">OP Parcial</option>
                <option value="RETRABALHO">OP Retrabalho</option>
              </select>

              <select
                value={filtroPrioridade}
                onChange={(e) => setFiltroPrioridade(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium"
              >
                <option value="TODOS">Todas as Prioridades</option>
                <option value="URGENTE">Urgente</option>
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Média</option>
                <option value="BAIXA">Baixa</option>
              </select>
            </div>
          </div>

          {/* Cards das OPs */}
          <div className="grid grid-cols-1 gap-4">
            {opsFiltradas.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                <p className="text-sm text-slate-500">Nenhuma Ordem de Produção encontrada com os filtros selecionados.</p>
              </div>
            ) : (
              opsFiltradas.map((op) => {
                const percConcluido =
                  op.quantidadePlanejada > 0
                    ? Math.round((op.quantidadeProduzida / op.quantidadePlanejada) * 100)
                    : 0;

                return (
                  <div
                    key={op.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-blue-300 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Lado Esquerdo: Identificação da OP */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-black text-slate-900 font-mono tracking-tight">{op.numero}</span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                              op.tipoOP === 'PARCIAL'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            Tipo: {op.tipoOP}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                              op.status === 'EM_PRODUCAO'
                                ? 'bg-blue-100 text-blue-800'
                                : op.status === 'CONCLUIDA'
                                ? 'bg-emerald-100 text-emerald-800'
                                : op.status === 'ENCERRADA_PARCIAL'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {op.status}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              op.prioridade === 'URGENTE'
                                ? 'bg-rose-100 text-rose-800'
                                : op.prioridade === 'ALTA'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {op.prioridade}
                          </span>
                        </div>

                        <div className="text-sm font-bold text-slate-800">
                          {op.produtoCodigo} - {op.produtoDescricao}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          {op.pedidoNumero && (
                            <span>
                              Pedido: <strong className="text-slate-700">{op.pedidoNumero}</strong> ({op.clienteNome})
                            </span>
                          )}
                          <span>
                            Revisão Ativa: <strong className="text-slate-700 font-mono">{op.revisaoVersao}</strong>
                          </span>
                          <span>
                            BOM: <strong className="text-slate-700 font-mono">{op.bomCodigo}</strong>
                          </span>
                          <span>
                            Roteiro: <strong className="text-slate-700 font-mono">{op.roteiroCodigo}</strong>
                          </span>
                          <span>
                            Prazo: <strong className="text-rose-600 font-semibold">{op.prazoEntrega}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Lado Direito: Balanço de Quantidades e Ações */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-slate-500 font-medium">Balanço do Lote:</div>
                          <div className="text-sm font-black text-slate-900">
                            <span className="text-emerald-700">{op.quantidadeProduzida} boas</span> /{' '}
                            <span>{op.quantidadePlanejada} {op.unidadeMedida}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 justify-end">
                            {op.quantidadeRefugada > 0 && (
                              <span className="text-rose-600 font-semibold">({op.quantidadeRefugada} refugo)</span>
                            )}
                            <span>Saldo Restante: <strong>{op.saldoRestante}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setOpDetalheSelecionada(op)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" /> Detalhes & Roteiro
                          </button>
                          {op.status !== 'CONCLUIDA' && op.status !== 'ENCERRADA_PARCIAL' && (
                            <button
                              onClick={() => {
                                setOpParaEncerrar(op);
                                setModalEncerramentoAberto(true);
                              }}
                              className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Lock className="w-3.5 h-3.5" /> Encerrar OP
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Barra de Progresso e Operações Sequenciais */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-600">Progresso Sequencial da Rota:</span>
                        <span className="font-bold text-blue-700">{percConcluido}% concluído</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${percConcluido}%` }}
                        />
                        {op.quantidadeRefugada > 0 && (
                          <div
                            className="bg-rose-500 h-full"
                            style={{
                              width: `${(op.quantidadeRefugada / op.quantidadePlanejada) * 100}%`,
                            }}
                          />
                        )}
                      </div>

                      {/* Lista resumida das operações */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                        {op.operacoes.map((oper) => (
                          <div
                            key={oper.id}
                            className={`p-2 rounded border text-[11px] ${
                              oper.status === 'CONCLUIDA'
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                                : oper.status === 'EM_PRODUCAO'
                                ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                                : oper.status === 'PRONTA_PARA_INICIO'
                                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                                : 'bg-slate-50 border-slate-200 text-slate-500'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span>Seq {oper.sequencia}</span>
                              <span className="text-[10px] uppercase font-mono">{oper.status}</span>
                            </div>
                            <div className="truncate font-semibold mt-0.5">{oper.nomeOperacao}</div>
                            <div className="flex items-center justify-between text-[10px] mt-1 text-slate-600">
                              <span>Disp: <strong>{oper.quantidadeDisponivelEntrada}</strong></span>
                              <span>Prontas: <strong className="text-emerald-700">{oper.quantidadeProduzidaBoas}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ABA 2.5: ENGENHARIA DE PROCESSOS & EXTENSÕES TÉCNICAS */}
      {activeTab === 'processos' && (
        <ProcessosTecnicosViewer
          ops={ops}
          resumoCorte={resumoCorte}
          resumoDobra={resumoDobra}
          onOpenOpModal={(op) => setOpDetalheSelecionada(op)}
        />
      )}

      {/* ABA 3: TERMINAL DO OPERADOR (KIOSK DE APONTAMENTO) */}
      {activeTab === 'kiosk_apontamento' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-900 rounded-full flex items-center gap-1 w-fit mb-1">
                <Play className="w-3.5 h-3.5 fill-current" />
                TERMINAL CHÃO DE FÁBRICA
              </span>
              <h2 className="text-xl font-black text-slate-900">Apontamento de Produção em Tempo Real</h2>
              <p className="text-xs text-slate-500">
                Aponte tempo real, operador, máquina, peças boas, refugo e consumo real. Ao concluir, as peças boas são imediatamente liberadas para a próxima operação.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Painel Esquerdo: Seleção de OP e Operação */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">1. Seleção da Ordem & Etapa</h3>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Ordem de Produção (OP)</label>
                <select
                  value={kioskOpId}
                  onChange={(e) => {
                    setKioskOpId(e.target.value);
                    const selOp = ops.find((o) => o.id === e.target.value);
                    if (selOp && selOp.operacoes.length > 0) {
                      setKioskOperacaoId(selOp.operacoes[0].id);
                    }
                  }}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
                >
                  {ops
                    .filter((o) => o.status !== 'CONCLUIDA' && o.status !== 'ENCERRADA_PARCIAL')
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.numero} - {o.produtoCodigo} (Saldo: {o.saldoRestante} un)
                      </option>
                    ))}
                </select>
              </div>

              {opKioskSelecionada && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Operação / Rota de Fabricação</label>
                  <select
                    value={kioskOperacaoId}
                    onChange={(e) => setKioskOperacaoId(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-900"
                  >
                    {opKioskSelecionada.operacoes.map((oper) => (
                      <option key={oper.id} value={oper.id}>
                        Seq {oper.sequencia}: {oper.nomeOperacao} (Disp: {oper.quantidadeDisponivelEntrada} | Concluídas: {oper.quantidadeProduzidaBoas})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {operacaoKioskSelecionada && (
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Setor:</span>
                    <strong className="text-slate-800">{operacaoKioskSelecionada.setor}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Qtd Disponível de Entrada:</span>
                    <strong className="text-blue-700">{operacaoKioskSelecionada.quantidadeDisponivelEntrada} un</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Já Produzido / Boas:</span>
                    <strong className="text-emerald-700">{operacaoKioskSelecionada.quantidadeProduzidaBoas} un</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tempo Padrão Setup + Ciclo:</span>
                    <span className="font-mono">{operacaoKioskSelecionada.tempoTotalPadraoMinutos} min</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Operador Responsável</label>
                <select
                  value={kioskOperadorId}
                  onChange={(e) => setKioskOperadorId(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium"
                >
                  {operadores.map((oprd) => (
                    <option key={oprd.id} value={oprd.id}>
                      {oprd.nome} ({oprd.especialidade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Centro de Trabalho / Máquina</label>
                <select
                  value={kioskMaquinaId}
                  onChange={(e) => setKioskMaquinaId(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium"
                >
                  {maquinas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome} (R$ {m.custoHora}/h)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Painel Central: Quantidades e Tempos */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">2. Peças & Tempos Reais</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tipo de Apontamento</label>
                  <select
                    value={kioskTipoApt}
                    onChange={(e: any) => setKioskTipoApt(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option value="PRODUCAO">Produção Normal</option>
                    <option value="SETUP">Tempo de Setup</option>
                    <option value="FINALIZACAO_OPERACAO">Finalização de Operação</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Duração Real (minutos)</label>
                  <input
                    type="number"
                    value={kioskDuracaoMinutos}
                    onChange={(e) => setKioskDuracaoMinutos(Number(e.target.value))}
                    min={1}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-3">
                <div>
                  <label className="text-xs font-bold text-emerald-800 flex items-center justify-between mb-1">
                    <span>Peças Boas Conformes</span>
                    <span className="text-[10px] text-slate-500 font-normal">Repassadas para próxima operação</span>
                  </label>
                  <input
                    type="number"
                    value={kioskBoomBoas}
                    onChange={(e) => setKioskBoomBoas(Number(e.target.value))}
                    min={0}
                    className="w-full text-base font-black bg-emerald-50/50 border border-emerald-300 rounded-lg p-2 text-emerald-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-xs font-bold text-rose-800 block mb-1">Refugo (Perda)</label>
                    <input
                      type="number"
                      value={kioskRefugo}
                      onChange={(e) => setKioskRefugo(Number(e.target.value))}
                      min={0}
                      className="w-full text-sm font-bold bg-rose-50/50 border border-rose-300 rounded-lg p-1.5 text-rose-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-800 block mb-1">Retrabalho</label>
                    <input
                      type="number"
                      value={kioskRetrabalho}
                      onChange={(e) => setKioskRetrabalho(Number(e.target.value))}
                      min={0}
                      className="w-full text-sm font-bold bg-amber-50/50 border border-amber-300 rounded-lg p-1.5 text-amber-900"
                    />
                  </div>
                </div>
              </div>

              {kioskRefugo > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2 text-xs">
                  <span className="font-bold text-rose-900 block">Classificação do Refugo:</span>
                  <select
                    value={kioskMotivoRefugo}
                    onChange={(e: any) => setKioskMotivoRefugo(e.target.value)}
                    className="w-full text-xs bg-white border border-rose-300 rounded p-1.5 font-medium"
                  >
                    <option value="DEFEITO_CORTE_LASER">Defeito de Corte a Laser / Queima</option>
                    <option value="DEFEITO_DIMENSIONAL">Defeito Dimensional / Fora de Tolerância</option>
                    <option value="TRINCA_SOLDA">Trinca / Poro na Solda</option>
                    <option value="ERRO_PROGRAMACAO_CNC">Erro de Programação CNC</option>
                    <option value="MATERIAL_COM_DEFEITO_USINA">Defeito de Matéria-Prima / Usina</option>
                    <option value="ERRO_OPERACIONAL">Erro Operacional</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Descrição do defeito..."
                    value={kioskDescricaoRefugo}
                    onChange={(e) => setKioskDescricaoRefugo(e.target.value)}
                    className="w-full text-xs bg-white border border-rose-300 rounded p-1.5"
                  />
                </div>
              )}

              {kioskRetrabalho > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2 text-xs">
                  <span className="font-bold text-amber-900 block">Ação de Retrabalho:</span>
                  <select
                    value={kioskMotivoRetrabalho}
                    onChange={(e: any) => setKioskMotivoRetrabalho(e.target.value)}
                    className="w-full text-xs bg-white border border-amber-300 rounded p-1.5 font-medium"
                  >
                    <option value="RECORTE_REBARBA">Desbaste / Remoção de Rebarba</option>
                    <option value="REDOBRA_AJUSTE">Redobra / Correção de Ângulo</option>
                    <option value="RESSOLDA_RETOQUE">Ressolda / Retoque de Solda</option>
                    <option value="LIXAMENTO_POLIMENTO">Lixamento e Polimento</option>
                    <option value="REPINTURA">Repintura</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Instrução do retrabalho..."
                    value={kioskDescricaoRetrabalho}
                    onChange={(e) => setKioskDescricaoRetrabalho(e.target.value)}
                    className="w-full text-xs bg-white border border-amber-300 rounded p-1.5"
                  />
                </div>
              )}
            </div>

            {/* Painel Direito: Consumo de Materiais & Envio */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">3. Insumos & Confirmação</h3>

              {opKioskSelecionada && opKioskSelecionada.materiais.length > 0 && (
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-800 block">Consumo Real de Insumo/Matéria-Prima:</span>
                  <div className="text-[11px] text-slate-600">
                    {opKioskSelecionada.materiais[0].itemCodigo} - {opKioskSelecionada.materiais[0].itemDescricao}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={kioskConsumoMaterialQtd}
                      onChange={(e) => setKioskConsumoMaterialQtd(Number(e.target.value))}
                      min={0}
                      className="w-24 text-xs font-bold bg-slate-50 border border-slate-300 rounded p-1.5"
                    />
                    <span className="text-xs text-slate-600 font-semibold">
                      {opKioskSelecionada.materiais[0].unidadeMedida}
                    </span>
                  </div>
                  {opKioskSelecionada.materiais[0].loteMateriaPrima && (
                    <span className="text-[10px] text-slate-500 font-mono block">
                      Lote: {opKioskSelecionada.materiais[0].loteMateriaPrima}
                    </span>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Observações do Apontamento</label>
                <textarea
                  value={kioskObservacoes}
                  onChange={(e) => setKioskObservacoes(e.target.value)}
                  placeholder="Informações adicionais do turno..."
                  rows={2}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleRegistrarApontamento}
                  disabled={salvandoApontamento}
                  className="w-full py-3 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {salvandoApontamento ? 'Gravando Apontamento...' : 'Concluir Apontamento & Repassar Peças'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: MONITOR DE PARADAS */}
      {activeTab === 'paradas' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Histórico & Ocorrências de Paradas de Produção</h3>
              <p className="text-xs text-slate-500">Cronometragem de interrupções por máquina com cálculo de impacto financeiro.</p>
            </div>
            <button
              onClick={() => setModalNovaParadaAberto(true)}
              className="px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" />
              Abrir Nova Parada
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Início</th>
                  <th className="py-3 px-4">Máquina</th>
                  <th className="py-3 px-4">Operador</th>
                  <th className="py-3 px-4">Categoria / Motivo</th>
                  <th className="py-3 px-4">OP Vinculada</th>
                  <th className="py-3 px-4 text-right">Duração</th>
                  <th className="py-3 px-4 text-right">Impacto Financeiro</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paradas.map((p) => {
                  const isAberta = p.status === 'EM_ANDAMENTO';
                  return (
                    <tr key={p.id} className={isAberta ? 'bg-rose-50/50' : 'hover:bg-slate-50'}>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                            isAberta ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{p.dataHoraInicio}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{p.maquinaNome}</td>
                      <td className="py-3 px-4 text-slate-700">{p.operadorNome}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{p.motivoCategoria}</span>
                        <span className="text-[11px] text-slate-500">{p.motivoDescricao}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-blue-700">{p.opNumero || '-'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {p.duracaoMinutos > 0 ? `${p.duracaoMinutos} min` : 'Em andamento...'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        R$ {p.impactoCustoEstimado.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isAberta && (
                          <button
                            onClick={() => handleFinalizarParada(p.id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded"
                          >
                            Finalizar Parada
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 5: QUALIDADE, REFUGOS & RETRABALHOS */}
      {activeTab === 'qualidade' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tabela de Refugos */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  Registro de Refugos & Perdas Industriais ({refugos.length})
                </h3>
              </div>

              {refugos.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">Nenhum refugo registrado.</p>
              ) : (
                <div className="space-y-3">
                  {refugos.map((r) => (
                    <div key={r.id} className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-900 font-mono">{r.opNumero} - Seq {r.sequenciaOperacao}</span>
                        <span className="font-bold text-rose-700">{r.quantidadeRefugada} {r.unidadeMedida}</span>
                      </div>
                      <div className="font-semibold text-slate-800">{r.motivoRefugo}</div>
                      <div className="text-[11px] text-slate-600">{r.descricaoDefeito}</div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-rose-200/60">
                        <span>Operador: {r.operadorNome}</span>
                        <span>Custo Absorvido: <strong className="text-rose-800">R$ {r.custoPerdaEstimado.toFixed(2)}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tabela de Retrabalhos */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  Plano de Ações Corretivas & Retrabalhos ({retrabalhos.length})
                </h3>
              </div>

              {retrabalhos.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">Nenhum retrabalho em aberto.</p>
              ) : (
                <div className="space-y-3">
                  {retrabalhos.map((ret) => (
                    <div key={ret.id} className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 font-mono">{ret.opOrigemNumero} - Seq {ret.sequenciaOperacaoOrigem}</span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                            ret.status === 'CONCLUIDO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-200 text-amber-900'
                          }`}
                        >
                          {ret.status}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-800">{ret.motivoRetrabalho}</div>
                      <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded border border-amber-200/60">
                        {ret.instrucaoRetrabalho}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Qtd Peças: <strong>{ret.quantidadeRetrabalho}</strong></span>
                        <span>Custo Retrabalho: <strong className="text-amber-800">R$ {ret.custoAdicionalReal || ret.custoAdicionalEstimado}</strong></span>
                      </div>
                      {ret.status !== 'CONCLUIDO' && (
                        <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60">
                          <button
                            onClick={() => handleConcluirRetrabalho(ret.id, true)}
                            className="w-full py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                          >
                            Aprovar e Liberar Peças
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA 6: MOTOR DE CUSTOS (PADRÃO × ESTIMADO × REALIZADO & VIGÊNCIAS) */}
      {activeTab === 'custos' && (
        <MotorCustosViewer
          empresaId={empresaId}
          ops={ops}
          onOpenOpModal={(op) => setOpDetalheSelecionada(op)}
        />
      )}

      {/* MODAL DETALHES DA OP */}
      {opDetalheSelecionada && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                  {opDetalheSelecionada.numero}
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  {opDetalheSelecionada.produtoCodigo} - {opDetalheSelecionada.produtoDescricao}
                </h2>
              </div>
              <button
                onClick={() => setOpDetalheSelecionada(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Materiais (BOM) da OP */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" /> Lista de Materiais Alocados (BOM) & Consumo Real
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Código / Descrição</th>
                      <th className="p-2.5 text-center">Perda %</th>
                      <th className="p-2.5 text-right">Qtd Prevista</th>
                      <th className="p-2.5 text-right">Consumo Real</th>
                      <th className="p-2.5 text-right">Saldo Restante</th>
                      <th className="p-2.5">Lote / Certificado</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {opDetalheSelecionada.materiais.map((mat) => (
                      <tr key={mat.id} className="hover:bg-slate-50">
                        <td className="p-2.5">
                          <span className="font-bold text-slate-800">{mat.itemCodigo}</span>
                          <span className="text-slate-500 block text-[11px]">{mat.itemDescricao}</span>
                        </td>
                        <td className="p-2.5 text-center font-mono">{mat.percentualPerdaPrevisto}%</td>
                        <td className="p-2.5 text-right font-mono font-semibold">
                          {mat.quantidadePrevistaTotal} {mat.unidadeMedida}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-blue-700">
                          {mat.quantidadeRealConsumida} {mat.unidadeMedida}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-600">
                          {mat.saldoRestanteConsumo} {mat.unidadeMedida}
                        </td>
                        <td className="p-2.5 text-[11px] font-mono text-slate-600">
                          {mat.loteMateriaPrima || '-'}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">
                            {mat.statusConsumo}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Operações da Rota */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Factory className="w-4 h-4 text-amber-600" /> Rota de Fabricação & Status Sequencial
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Seq</th>
                      <th className="p-2.5">Operação / Máquina</th>
                      <th className="p-2.5 text-right">Disp. Entrada</th>
                      <th className="p-2.5 text-right">Boas Prontas</th>
                      <th className="p-2.5 text-right">Refugo</th>
                      <th className="p-2.5 text-right">Saldo</th>
                      <th className="p-2.5 text-right">Tempo Total</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {opDetalheSelecionada.operacoes.map((oper) => (
                      <tr key={oper.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold font-mono text-blue-700">{oper.sequencia}</td>
                        <td className="p-2.5">
                          <span className="font-bold text-slate-900">{oper.nomeOperacao}</span>
                          <span className="text-[11px] text-slate-500 block">{oper.maquinaNome}</span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-blue-700">
                          {oper.quantidadeDisponivelEntrada}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                          {oper.quantidadeProduzidaBoas}
                        </td>
                        <td className="p-2.5 text-right font-mono text-rose-600">
                          {oper.quantidadeRefugada > 0 ? oper.quantidadeRefugada : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-600">{oper.saldoOperacaoRestante}</td>
                        <td className="p-2.5 text-right font-mono">
                          {oper.tempoTotalRealMinutos > 0 ? `${oper.tempoTotalRealMinutos} min` : `${oper.tempoTotalPadraoMinutos} min (est)`}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">
                            {oper.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => setOpDetalheSelecionada(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ENCERRAMENTO RÍGIDO DE OP */}
      {modalEncerramentoAberto && opParaEncerrar && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-black text-slate-900">Encerramento da OP {opParaEncerrar.numero}</h3>
              </div>
              <button onClick={() => setModalEncerramentoAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Verificação de Pendências */}
            {opParaEncerrar.quantidadeProduzida + opParaEncerrar.quantidadeRefugada < opParaEncerrar.quantidadePlanejada ||
            opParaEncerrar.operacoes.some((o) => o.status !== 'CONCLUIDA') ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  BLOQUEIO: PENDÊNCIAS DETECTADAS NESTA OP
                </div>
                <p className="text-rose-800">
                  Esta OP ainda possui saldo não atendido ({opParaEncerrar.saldoRestante} un) ou etapas de fabricação pendentes. O encerramento exige uma <strong>REGRA EXPLÍCITA</strong> com motivo formal e autorização gerencial.
                </p>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Motivo Formal</label>
                    <select
                      value={motivoEncerramento}
                      onChange={(e: any) => setMotivoEncerramento(e.target.value)}
                      className="w-full bg-white border border-rose-300 rounded-lg p-2 text-xs font-bold"
                    >
                      <option value="ENCERRAMENTO_PARCIAL_ACEITO">Encerramento Parcial Aceito pelo Cliente</option>
                      <option value="CANCELAMENTO_PEDIDO_CLIENTE">Cancelamento do Pedido pelo Cliente</option>
                      <option value="PERDA_TOTAL_LOTE">Perda Técnica Irreparável do Lote</option>
                      <option value="DESVIO_ENGENHARIA">Alteração de Projeto / Desvio de Engenharia</option>
                      <option value="DECISAO_DIRETORIA">Decisão da Diretoria Industrial</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Justificativa Técnica Detalhada</label>
                    <textarea
                      value={descEncerramento}
                      onChange={(e) => setDescEncerramento(e.target.value)}
                      placeholder="Explique o motivo do encerramento com saldo pendente..."
                      rows={3}
                      className="w-full bg-white border border-rose-300 rounded-lg p-2 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="authGerencia"
                      checked={autorizacaoGerencia}
                      onChange={(e) => setAutorizacaoGerencia(e.target.checked)}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    <label htmlFor="authGerencia" className="text-xs font-bold text-slate-800">
                      Confirmo a autorização formal da Gerência Industrial para encerramento
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-emerald-900 block">Tudo Concluído sem Pendências!</span>
                <p className="text-emerald-800">
                  Todas as {opParaEncerrar.quantidadePlanejada} peças foram concluídas e todas as operações do roteiro foram finalizadas com sucesso.
                </p>
              </div>
            )}

            {erroEncerramento && (
              <div className="p-3 bg-rose-100 border border-rose-300 rounded-lg text-xs font-bold text-rose-800">
                {erroEncerramento}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setModalEncerramentoAberto(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleEncerrarOP}
                disabled={processandoEncerramento}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs disabled:opacity-50"
              >
                {processandoEncerramento ? 'Processando...' : 'Confirmar Encerramento da OP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR PARADA */}
      {modalNovaParadaAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">Registrar Parada de Máquina</h3>
              </div>
              <button onClick={() => setModalNovaParadaAberto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Máquina</label>
                <select
                  value={paradaMaquinaId}
                  onChange={(e) => setParadaMaquinaId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold"
                >
                  {maquinas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome} ({m.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Operador no Posto</label>
                <select
                  value={paradaOperadorId}
                  onChange={(e) => setParadaOperadorId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                >
                  {operadores.map((oprd) => (
                    <option key={oprd.id} value={oprd.id}>
                      {oprd.nome} ({oprd.especialidade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Categoria do Motivo</label>
                <select
                  value={paradaCategoria}
                  onChange={(e: any) => setParadaCategoria(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold"
                >
                  <option value="QUEBRA_MAQUINA">Quebra de Máquina / Falha Eletromecânica</option>
                  <option value="FALTA_MATERIAL">Falta de Matéria-Prima / Insumo</option>
                  <option value="TROCA_FERRAMENTA">Troca de Ferramenta / Setup</option>
                  <option value="MANUTENCAO_CORRETIVA">Manutenção Corretiva</option>
                  <option value="AJUSTE_PROGRAMA_CNC">Ajuste de Programa CNC / CAM</option>
                  <option value="INSPECAO_QUALIDADE_AGUARDANDO">Aguardando Liberação da Qualidade</option>
                  <option value="FALTA_ENERGIA">Queda de Energia</option>
                  <option value="ALMOCO_INTERVALO">Intervalo de Refeição / Turno</option>
                  <option value="OUTROS">Outros</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Descrição do Motivo</label>
                <textarea
                  value={paradaDescricao}
                  onChange={(e) => setParadaDescricao(e.target.value)}
                  placeholder="Detalhes da ocorrência..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setModalNovaParadaAberto(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegistrarParada}
                disabled={salvandoParada}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
              >
                {salvandoParada ? 'Iniciando...' : 'Iniciar Cronometragem de Parada'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
