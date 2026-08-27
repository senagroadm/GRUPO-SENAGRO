'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  Building2,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Plus,
  RefreshCw,
  Sliders,
  DollarSign,
  UserCheck,
  Users,
  AlertCircle,
  FileText,
  Lock,
  Unlock,
  ChevronRight,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowUpRight,
  Scale,
  Building,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  AnaliseCredito,
  LimiteCredito,
  BloqueioCredito,
  PoliticaCredito,
  ConsultaCreditoBureau,
  HistoricoPagamentoItem,
  RelacionamentoClienteEmpresa,
  TipoGarantiaExigida,
  NivelAlcadaAprovacao,
  StatusAnaliseCredito,
} from '../../../backend/modules/credito/credito-types';
import { Empresa } from '../../../backend/core/types/company';
import { EmpresaRecord } from '../../../backend/modules/multi-tenant/types';
import { safeFetchJson } from '../api/safe-fetch';

interface CreditoViewerProps {
  empresaAtiva: Empresa | EmpresaRecord;
}

export function CreditoViewer({ empresaAtiva }: CreditoViewerProps) {
  // Tabs do Módulo
  const [subTab, setSubTab] = useState<'analises' | 'limites' | 'bloqueios' | 'bureau' | 'politicas'>('analises');

  // Estados principais
  const [analises, setAnalises] = useState<AnaliseCredito[]>([]);
  const [limites, setLimites] = useState<LimiteCredito[]>([]);
  const [bloqueios, setBloqueios] = useState<BloqueioCredito[]>([]);
  const [politicas, setPoliticas] = useState<PoliticaCredito[]>([]);
  const [consultasBureau, setConsultasBureau] = useState<ConsultaCreditoBureau[]>([]);
  const [historicoPagamentos, setHistoricoPagamentos] = useState<HistoricoPagamentoItem[]>([]);
  const [relacionamentos, setRelacionamentos] = useState<RelacionamentoClienteEmpresa[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null);

  // Modais e Detalhes
  const [analiseSelecionada, setAnaliseSelecionada] = useState<AnaliseCredito | null>(null);
  const [modalNovaAnalise, setModalNovaAnalise] = useState<boolean>(false);
  const [modalDecisao, setModalDecisao] = useState<boolean>(false);
  const [modalDesbloqueio, setModalDesbloqueio] = useState<BloqueioCredito | null>(null);
  const [modalNovoBloqueio, setModalNovoBloqueio] = useState<boolean>(false);
  const [modalConsultaAvulsa, setModalConsultaAvulsa] = useState<boolean>(false);

  // Filtros
  const [filtroStatusAnalise, setFiltroStatusAnalise] = useState<string>('TODOS');
  const [buscaTexto, setBuscaTexto] = useState<string>('');

  // Formulário Nova Análise
  const [formNovaAnalise, setFormNovaAnalise] = useState({
    clienteId: 'cli-002',
    clienteNome: 'Marcopolo Carrocerias e Ônibus S/A',
    cnpjCpf: '88.611.834/0001-00',
    limiteSolicitado: 180000,
    prazoPagamentoSolicitadoDias: 35,
    motivoSolicitacao: 'AUMENTO_LIMITE' as const,
    solicitanteNome: 'Vendedor Técnico - ERP',
    consultarBureauAutomatico: true,
  });

  // Formulário Decisão Aprovador
  const [formDecisao, setFormDecisao] = useState({
    status: 'APROVADO' as 'APROVADO' | 'APROVADO_COM_RESTRICAO' | 'REPROVADO',
    limiteAprovado: 0,
    limiteConsolidadoAprovado: 0,
    prazoMaximoDias: 30,
    garantiaExigida: 'NENHUMA' as TipoGarantiaExigida,
    parecerAprovador: '',
    aprovadorNome: 'Eduardo Martins',
    aprovadorCargo: 'Gerente Financeiro',
    nivelAlcada: 'GERENTE_FINANCEIRO' as NivelAlcadaAprovacao,
    mesesValidade: 6,
  });

  // Formulário Desbloqueio
  const [justificativaDesbloqueio, setJustificativaDesbloqueio] = useState('');

  // Formulário Consulta Avulsa Bureau
  const [docConsultaAvulsa, setDocConsultaAvulsa] = useState('51.800.222/0001-88');
  const [resultadoConsultaAvulsa, setResultadoConsultaAvulsa] = useState<any>(null);

  // ---------------------------------------------------------------------------
  // CARREGAR DADOS
  // ---------------------------------------------------------------------------
  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const [resAnalises, resLimites, resBloqueios, resPoliticas, resConsultas, resHist] = await Promise.all([
        safeFetchJson<{ data: AnaliseCredito[] }>(`/api/v1/credito/analises?empresaId=${empresaAtiva.id}`),
        safeFetchJson<{ data: LimiteCredito[] }>(`/api/v1/credito/limites?empresaId=${empresaAtiva.id}`),
        safeFetchJson<{ data: BloqueioCredito[] }>(`/api/v1/credito/bloqueios?empresaId=${empresaAtiva.id}`),
        safeFetchJson<{ data: PoliticaCredito[] }>(`/api/v1/credito/politicas?empresaId=${empresaAtiva.id}`),
        safeFetchJson<{ data: ConsultaCreditoBureau[] }>(`/api/v1/credito/consultar-bureau?empresaId=${empresaAtiva.id}`),
        safeFetchJson<{ pagamentos?: HistoricoPagamentoItem[]; relacionamentos?: RelacionamentoClienteEmpresa[] }>(`/api/v1/credito/historico?empresaId=${empresaAtiva.id}`),
      ]);

      if (resAnalises.success && resAnalises.data?.data) setAnalises(resAnalises.data.data);
      if (resLimites.success && resLimites.data?.data) setLimites(resLimites.data.data);
      if (resBloqueios.success && resBloqueios.data?.data) setBloqueios(resBloqueios.data.data);
      if (resPoliticas.success && resPoliticas.data?.data) setPoliticas(resPoliticas.data.data);
      if (resConsultas.success && resConsultas.data?.data) setConsultasBureau(resConsultas.data.data);
      if (resHist.success && resHist.data) {
        setHistoricoPagamentos(resHist.data.pagamentos || []);
        setRelacionamentos(resHist.data.relacionamentos || []);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados de crédito:', err);
    } finally {
      setLoading(false);
    }
  }, [empresaAtiva.id]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const showToast = (tipo: 'sucesso' | 'erro', msg: string) => {
    setFeedback({ tipo, msg });
    setTimeout(() => setFeedback(null), 5000);
  };

  // ---------------------------------------------------------------------------
  // AÇÕES
  // ---------------------------------------------------------------------------
  const handleCriarAnalise = async () => {
    setActionLoading(true);
    try {
      const res = await safeFetchJson<{ data: AnaliseCredito }>('/api/v1/credito/analises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formNovaAnalise,
          empresaId: empresaAtiva.id,
          empresaNome: empresaAtiva.nomeFantasia || empresaAtiva.razaoSocial,
        }),
      });
      if (!res.success || !res.data?.data) throw new Error(res.error || 'Erro ao criar análise');

      showToast('sucesso', `Análise de crédito ${res.data.data.protocolo} gerada pelo motor com sucesso!`);
      setModalNovaAnalise(false);
      setAnaliseSelecionada(res.data.data);
      await carregarDados();
    } catch (err: any) {
      showToast('erro', `Erro ao criar análise: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmeterDecisao = async () => {
    if (!analiseSelecionada) return;
    setActionLoading(true);
    try {
      const res = await safeFetchJson<{ data: AnaliseCredito }>(`/api/v1/credito/analises/${analiseSelecionada.id}/decidir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDecisao),
      });
      if (!res.success || !res.data?.data) throw new Error(res.error || 'Erro ao registrar decisão');

      showToast('sucesso', `Decisão de crédito registrada com sucesso! Novo limite atualizado no ERP.`);
      setModalDecisao(false);
      setAnaliseSelecionada(res.data.data);
      await carregarDados();
    } catch (err: any) {
      showToast('erro', `Erro ao registrar decisão: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDesbloquear = async () => {
    if (!modalDesbloqueio || !justificativaDesbloqueio) return;
    setActionLoading(true);
    try {
      const res = await safeFetchJson<{ error?: string }>(`/api/v1/credito/bloqueios/${modalDesbloqueio.id}/desbloquear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          justificativa: justificativaDesbloqueio,
          usuarioId: 'usr-fin-001',
          usuarioNome: 'Gerente Financeiro - ERP',
        }),
      });
      if (!res.success) throw new Error(res.error || 'Erro no desbloqueio');

      showToast('sucesso', 'Cliente desbloqueado no ERP com justificativa auditável.');
      setModalDesbloqueio(null);
      setJustificativaDesbloqueio('');
      await carregarDados();
    } catch (err: any) {
      showToast('erro', `Erro no desbloqueio: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConsultaAvulsa = async () => {
    setActionLoading(true);
    try {
      const res = await safeFetchJson<{ provider?: string }>('/api/v1/credito/consultar-bureau', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documento: docConsultaAvulsa,
          empresaId: empresaAtiva.id,
          solicitanteNome: 'Analista de Crédito',
        }),
      });
      if (!res.success || !res.data) throw new Error(res.error || 'Erro na consulta externa');

      setResultadoConsultaAvulsa(res.data);
      showToast('sucesso', `Consulta via adapter ${res.data.provider || 'Bureau'} realizada com sucesso.`);
      await carregarDados();
    } catch (err: any) {
      showToast('erro', `Erro na consulta externa: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Abrir modal de decisão preenchendo sugestão do motor
  const abrirModalDecisao = (analise: AnaliseCredito) => {
    const sug = analise.resultadoScoreInterno;
    setFormDecisao({
      status: sug.recomendacao === 'RECOMENDA_REPROVACAO' ? 'REPROVADO' : sug.garantiaSugerida !== 'NENHUMA' ? 'APROVADO_COM_RESTRICAO' : 'APROVADO',
      limiteAprovado: sug.limiteSugeridoMotor,
      limiteConsolidadoAprovado: Math.round(sug.limiteSugeridoMotor * 1.5),
      prazoMaximoDias: sug.prazoMaximoSugeridoDias,
      garantiaExigida: sug.garantiaSugerida,
      parecerAprovador: `Aprovado com base no Score Interno ${sug.scoreInternoFinal} (${sug.faixaScore}) e na recomendação do motor de crédito.`,
      aprovadorNome: 'Eduardo Martins',
      aprovadorCargo: 'Gerente Financeiro',
      nivelAlcada: 'GERENTE_FINANCEIRO',
      mesesValidade: 6,
    });
    setModalDecisao(true);
  };

  // Helpers de Badge e Cor
  const getBadgeStatus = (status: StatusAnaliseCredito) => {
    switch (status) {
      case 'APROVADO':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"><CheckCircle2 className="w-3 h-3" /> Aprovado</span>;
      case 'APROVADO_COM_RESTRICAO':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300"><AlertTriangle className="w-3 h-3" /> Aprovado c/ Restrição</span>;
      case 'REPROVADO':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300"><XCircle className="w-3 h-3" /> Reprovado</span>;
      case 'PENDENTE_APROVACAO':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300"><Clock className="w-3 h-3" /> Aguardando Alçada</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const getBadgeRecomendacao = (rec: string) => {
    switch (rec) {
      case 'APROVACAO_AUTOMATICA':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Aprovação Automática</span>;
      case 'RECOMENDA_APROVACAO':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">Recomenda Aprovação</span>;
      case 'SUBMETER_COMITE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Submeter ao Comitê</span>;
      case 'RECOMENDA_RESTRICAO':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Aprovação Condicionada</span>;
      case 'RECOMENDA_REPROVACAO':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Recomenda Reprovação</span>;
      case 'BLOQUEIO_IMEDIATO':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 font-extrabold">Bloqueio Imediato</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">{rec}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between shadow-md transition-all ${
            feedback.tipo === 'sucesso'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.tipo === 'sucesso' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
            <p className="text-sm font-semibold">{feedback.msg}</p>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header com Contexto da Empresa e Indicadores Chave */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {empresaAtiva.codigo}
              </span>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-indigo-600" />
                Módulo de Crédito & Risco Industrial
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Avaliação de limites por empresa, limite consolidado do grupo, exposição atual/projetada, motor de score interno e adapter de bureau (MockSerasa).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setModalConsultaAvulsa(true)}
              className="px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-all flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              Consultar Bureau (Serasa Adapter)
            </button>
            <button
              onClick={() => setModalNovaAnalise(true)}
              className="px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Nova Análise de Crédito
            </button>
            <button
              onClick={carregarDados}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200"
              title="Recarregar dados"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mini KPI Cards de Risco */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Análises Pendentes</span>
            <span className="text-lg font-bold text-slate-900">
              {analises.filter((a) => a.status === 'PENDENTE_APROVACAO').length}
            </span>
            <span className="text-[10px] text-blue-600 font-medium block mt-0.5">Aguardando alçada</span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Clientes Bloqueados</span>
            <span className="text-lg font-bold text-rose-600">
              {bloqueios.filter((b) => b.ativo).length}
            </span>
            <span className="text-[10px] text-rose-500 font-medium block mt-0.5">Inadimplência ou Risco</span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Exposição Grupo (Ativa)</span>
            <span className="text-lg font-bold text-slate-900">
              R$ {limites.reduce((acc, l) => acc + l.exposicaoConsolidadaAtual, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Títulos em aberto no grupo</span>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Adapter de Bureau</span>
            <span className="text-sm font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              MockSerasaProvider (Ativo)
            </span>
            <span className="text-[10px] text-slate-400 block">Pronto para contrato real</span>
          </div>
        </div>
      </div>

      {/* Sub-navegação do Módulo */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => { setSubTab('analises'); setAnaliseSelecionada(null); }}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === 'analises'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-b-0 border-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Análises de Crédito ({analises.length})
        </button>

        <button
          onClick={() => setSubTab('limites')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === 'limites'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-b-0 border-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Limites & Grupo Econômico ({limites.length})
        </button>

        <button
          onClick={() => setSubTab('bloqueios')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === 'bloqueios'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-b-0 border-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          Bloqueios de Crédito ({bloqueios.filter((b) => b.ativo).length})
        </button>

        <button
          onClick={() => setSubTab('bureau')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === 'bureau'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-b-0 border-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          Bureau & Consultas Externas ({consultasBureau.length})
        </button>

        <button
          onClick={() => setSubTab('politicas')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === 'politicas'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 bg-white border border-b-0 border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Políticas & Matriz de Risco
        </button>
      </div>

      {/* ---------------------------------------------------------------------
          ABA 1: ANÁLISES DE CRÉDITO & DOSSIÊ COMPLETO
      --------------------------------------------------------------------- */}
      {subTab === 'analises' && (
        <div className="space-y-6">
          {!analiseSelecionada ? (
            // LISTAGEM DE ANÁLISES
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar por cliente, CNPJ ou protocolo..."
                      value={buscaTexto}
                      onChange={(e) => setBuscaTexto(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <select
                    value={filtroStatusAnalise}
                    onChange={(e) => setFiltroStatusAnalise(e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="TODOS">Todos os Status</option>
                    <option value="PENDENTE_APROVACAO">Pendente Aprovação</option>
                    <option value="APROVADO">Aprovados</option>
                    <option value="APROVADO_COM_RESTRICAO">Aprovados c/ Restrição</option>
                    <option value="REPROVADO">Reprovados</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Protocolo / Data</th>
                      <th className="py-3 px-4">Cliente / CNPJ</th>
                      <th className="py-3 px-4 text-right">Limite Solicitado</th>
                      <th className="py-3 px-4 text-center">Score Interno</th>
                      <th className="py-3 px-4">Recomendação do Motor</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analises
                      .filter((a) => {
                        const matchFiltro = filtroStatusAnalise === 'TODOS' || a.status === filtroStatusAnalise;
                        const matchBusca =
                          !buscaTexto ||
                          a.clienteNome.toLowerCase().includes(buscaTexto.toLowerCase()) ||
                          a.cnpjCpf.includes(buscaTexto) ||
                          a.protocolo.toLowerCase().includes(buscaTexto.toLowerCase());
                        return matchFiltro && matchBusca;
                      })
                      .map((anl) => (
                        <tr key={anl.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{anl.protocolo}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(anl.criadoEm).toLocaleDateString('pt-BR')} às{' '}
                              {new Date(anl.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800 block">{anl.clienteNome}</span>
                            <span className="text-[11px] text-slate-500 font-mono">{anl.cnpjCpf}</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-slate-900 block">
                              R$ {anl.limiteSolicitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-500">{anl.prazoPagamentoSolicitadoDias} dias</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span
                                className={`text-sm font-extrabold ${
                                  anl.resultadoScoreInterno.scoreInternoFinal >= 750
                                    ? 'text-emerald-600'
                                    : anl.resultadoScoreInterno.scoreInternoFinal >= 550
                                    ? 'text-indigo-600'
                                    : anl.resultadoScoreInterno.scoreInternoFinal >= 400
                                    ? 'text-amber-600'
                                    : 'text-rose-600'
                                }`}
                              >
                                {anl.resultadoScoreInterno.scoreInternoFinal}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                Faixa {anl.resultadoScoreInterno.faixaScore}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {getBadgeRecomendacao(anl.resultadoScoreInterno.recomendacao)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {getBadgeStatus(anl.status)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setAnaliseSelecionada(anl)}
                              className="px-3 py-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-all inline-flex items-center gap-1"
                            >
                              Ver Dossiê Completo
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // =================================================================
            // DETALHE DO DOSSIÊ DA ANÁLISE DE CRÉDITO
            // =================================================================
            <div className="space-y-6">
              {/* Barra superior de navegação do Dossiê */}
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAnaliseSelecionada(null)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                  >
                    ← Voltar para a lista
                  </button>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      Dossiê de Crédito: <span className="text-indigo-600">{analiseSelecionada.protocolo}</span>
                      {getBadgeStatus(analiseSelecionada.status)}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {analiseSelecionada.clienteNome} ({analiseSelecionada.cnpjCpf})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {analiseSelecionada.status === 'PENDENTE_APROVACAO' && (
                    <button
                      onClick={() => abrirModalDecisao(analiseSelecionada)}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Julgar / Decidir Alçada
                    </button>
                  )}
                </div>
              </div>

              {/* Grid Principal do Dossiê */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLUNA ESQUERDA: DADOS CADASTRAIS & EXPOSIÇÃO */}
                <div className="space-y-6">
                  {/* CARD 1: DADOS CADASTRAIS */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                      <Building className="w-4 h-4 text-indigo-600" />
                      Dados Cadastrais Oficiais
                    </h3>

                    <div className="mt-3 space-y-2.5 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Razão Social</span>
                        <span className="font-semibold text-slate-800">{analiseSelecionada.dadosCadastrais.razaoSocial}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Nome Fantasia</span>
                        <span className="font-medium text-slate-700">{analiseSelecionada.dadosCadastrais.nomeFantasia || '-'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-400 block text-[11px]">CNPJ / CPF</span>
                          <span className="font-mono font-medium text-slate-700">{analiseSelecionada.dadosCadastrais.cnpjCpf}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Inscrição Estadual</span>
                          <span className="font-mono text-slate-700">{analiseSelecionada.dadosCadastrais.inscricaoEstadual || 'Isento'}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Fundação / Abertura</span>
                          <span className="text-slate-700">{analiseSelecionada.dadosCadastrais.dataFundacao || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Localização</span>
                          <span className="text-slate-700">{analiseSelecionada.dadosCadastrais.cidade} - {analiseSelecionada.dadosCadastrais.uf}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Atividade Econômica (CNAE)</span>
                        <span className="text-slate-700">{analiseSelecionada.dadosCadastrais.ramoAtividade}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Capital Social</span>
                          <span className="font-bold text-slate-900">
                            R$ {(analiseSelecionada.dadosCadastrais.capitalSocial || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Fat. Mensal Estimado</span>
                          <span className="font-bold text-emerald-700">
                            R$ {analiseSelecionada.dadosCadastrais.faturamentoMensalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Quadro Societário */}
                      <div className="pt-3 border-t border-slate-100">
                        <span className="text-[11px] font-bold text-slate-600 block mb-1.5 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          Quadro Societário (QSA)
                        </span>
                        <div className="space-y-1.5">
                          {analiseSelecionada.dadosCadastrais.quadroSocietario.map((socio, idx) => (
                            <div key={idx} className="bg-slate-50 p-2 rounded border border-slate-100 flex items-center justify-between">
                              <div>
                                <span className="font-medium text-slate-800 block text-[11px]">{socio.nome}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{socio.cargo}</span>
                              </div>
                              <span className="font-bold text-indigo-700 text-xs">{socio.participacaoPerc}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: EXPOSIÇÃO ATUAL & PROJETADA */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                      <TrendingUp className="w-4 h-4 text-amber-600" />
                      Exposição Atual & Projetada
                    </h3>

                    <div className="mt-3 space-y-3 text-xs">
                      <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200/80">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-amber-900">Exposição Projetada ({analiseSelecionada.empresaNome})</span>
                          <span className="font-extrabold text-amber-900">
                            R$ {analiseSelecionada.exposicaoNoMomento.exposicaoProjetadaEmpresa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-[10px] text-amber-800">
                          Inclui R$ {analiseSelecionada.exposicaoNoMomento.exposicaoAtualEmpresa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} faturado + R$ {analiseSelecionada.exposicaoNoMomento.pedidosEmCarteiraValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em pedidos em carteira.
                        </p>
                      </div>

                      <div className="bg-indigo-50/70 p-3 rounded-lg border border-indigo-200/80">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-indigo-900">Exposição Consolidada (Grupo Econômico)</span>
                          <span className="font-extrabold text-indigo-900">
                            R$ {analiseSelecionada.exposicaoNoMomento.exposicaoProjetadaGrupo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-[10px] text-indigo-800">
                          Soma da exposição em todas as 5 empresas do grupo (MWAM, Tritech, Senagro, etc.).
                        </p>
                      </div>

                      {/* Títulos Vencidos no Momento */}
                      <div className={`p-3 rounded-lg border ${
                        analiseSelecionada.exposicaoNoMomento.quantidadeTitulosVencidos > 0
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Títulos Vencidos Atuais:</span>
                          <span className="font-bold">
                            {analiseSelecionada.exposicaoNoMomento.quantidadeTitulosVencidos > 0
                              ? `${analiseSelecionada.exposicaoNoMomento.quantidadeTitulosVencidos} título(s) (R$ ${analiseSelecionada.exposicaoNoMomento.titulosVencidosValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`
                              : 'Nenhum título vencido (Zero Inadimplência)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUNA DO MEIO: HISTÓRICO INTERNO & RESULTADO EXTERNO BUREAU */}
                <div className="space-y-6">
                  {/* CARD 3: HISTÓRICO INTERNO DE PAGAMENTOS */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Histórico Interno de Pagamentos
                    </h3>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">Tempo de Relacionamento</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {analiseSelecionada.historicoInterno.mesesRelacionamento} meses
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">Taxa de Pontualidade</span>
                        <span className="font-bold text-emerald-600 text-sm">
                          {analiseSelecionada.historicoInterno.taxaPontualidadePerc}%
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">Média de Atraso</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {analiseSelecionada.historicoInterno.mediaAtrasoDias} dias
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">Total de Pedidos</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {analiseSelecionada.historicoInterno.quantidadePedidosHistorico} pedidos
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 col-span-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[10px]">Faturamento Total Acumulado:</span>
                          <span className="font-bold text-slate-900">
                            R$ {analiseSelecionada.historicoInterno.totalFaturadoHistorico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between mt-1 pt-1 border-t border-slate-200/50">
                          <span className="text-slate-400 text-[10px]">Maior Acúmulo Histórico:</span>
                          <span className="font-semibold text-slate-800">
                            R$ {analiseSelecionada.historicoInterno.maiorAcumuloValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: RESULTADO EXTERNO BUREAU (SERASA MOCK ADAPTER) */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-purple-600" />
                        Resultado Bureau Externo
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-semibold">
                        {analiseSelecionada.consultaBureau?.provedor || 'MockSerasa'}
                      </span>
                    </div>

                    {analiseSelecionada.consultaBureau ? (
                      <div className="mt-3 space-y-3 text-xs">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Score Bureau (0-1000)</span>
                            <span className="text-xl font-extrabold text-purple-700">
                              {analiseSelecionada.consultaBureau.scoreBureau}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium block">
                              {analiseSelecionada.consultaBureau.faixaRiscoBureau}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 block text-[10px]">Probabilidade Inadimplência</span>
                            <span className="text-base font-bold text-slate-800">
                              {analiseSelecionada.consultaBureau.probabilidadeInadimplencia}%
                            </span>
                          </div>
                        </div>

                        {/* Tabela de Restrições */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between p-2 rounded bg-slate-50 text-[11px]">
                            <span className="text-slate-600">Protestos em Cartório:</span>
                            <span className={`font-bold ${analiseSelecionada.consultaBureau.protestosQtd > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {analiseSelecionada.consultaBureau.protestosQtd} ocorrência(s) (R$ {analiseSelecionada.consultaBureau.protestosValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                            </span>
                          </div>
                          <div className="flex justify-between p-2 rounded bg-slate-50 text-[11px]">
                            <span className="text-slate-600">Pendências Comerciais (PEFIN):</span>
                            <span className={`font-bold ${analiseSelecionada.consultaBureau.pefinQtd > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {analiseSelecionada.consultaBureau.pefinQtd} apontamento(s)
                            </span>
                          </div>
                          <div className="flex justify-between p-2 rounded bg-slate-50 text-[11px]">
                            <span className="text-slate-600">Ações Judiciais / Execuções:</span>
                            <span className={`font-bold ${analiseSelecionada.consultaBureau.acoesJudiciaisQtd > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {analiseSelecionada.consultaBureau.acoesJudiciaisQtd} processo(s)
                            </span>
                          </div>
                          <div className="flex justify-between p-2 rounded bg-slate-50 text-[11px]">
                            <span className="text-slate-600">Falência ou Recup. Judicial:</span>
                            <span className={`font-bold ${analiseSelecionada.consultaBureau.falenciasOuRecuperacoes ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {analiseSelecionada.consultaBureau.falenciasOuRecuperacoes ? 'Sim (Crítico)' : 'Não'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 mt-2">Consulta de bureau não associada a esta análise.</p>
                    )}
                  </div>
                </div>

                {/* COLUNA DIREITA: PARECER DO MOTOR & DECISÃO DO APROVADOR */}
                <div className="space-y-6">
                  {/* CARD 5: PARECER TÉCNICO DO MOTOR DE REGRAS */}
                  <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl p-5 shadow-md">
                    <div className="flex items-center justify-between pb-3 border-b border-indigo-700/50">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        Parecer do Motor de Crédito
                      </h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-500/30 rounded border border-indigo-400/40">
                        Score {analiseSelecionada.resultadoScoreInterno.scoreInternoFinal}/1000
                      </span>
                    </div>

                    <div className="mt-4 space-y-3 text-xs">
                      <div>
                        <span className="text-indigo-300 text-[11px] block">Recomendação do Sistema:</span>
                        <div className="mt-1">
                          {getBadgeRecomendacao(analiseSelecionada.resultadoScoreInterno.recomendacao)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-indigo-950/60 p-3 rounded-lg border border-indigo-800/40">
                        <div>
                          <span className="text-indigo-300 text-[10px] block">Limite Sugerido:</span>
                          <span className="font-extrabold text-sm text-emerald-300">
                            R$ {analiseSelecionada.resultadoScoreInterno.limiteSugeridoMotor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-indigo-300 text-[10px] block">Prazo Máximo Sugerido:</span>
                          <span className="font-bold text-sm text-white">
                            {analiseSelecionada.resultadoScoreInterno.prazoMaximoSugeridoDias} dias
                          </span>
                        </div>
                        <div className="col-span-2 pt-1.5 border-t border-indigo-800/50">
                          <span className="text-indigo-300 text-[10px] block">Garantia Sugerida:</span>
                          <span className="font-semibold text-amber-300">
                            {analiseSelecionada.resultadoScoreInterno.garantiaSugerida}
                          </span>
                        </div>
                      </div>

                      {/* Motivos da Recomendação */}
                      <div>
                        <span className="text-indigo-300 text-[11px] font-semibold block mb-1">Fundamentação das Regras:</span>
                        <ul className="space-y-1 text-[11px] text-indigo-100">
                          {analiseSelecionada.resultadoScoreInterno.motivosRecomendacao.map((m, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-indigo-400 font-bold">•</span>
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* CARD 6: DECISÃO FORMAL DO APROVADOR HUMANO */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      Julgamento & Alçada de Aprovação
                    </h3>

                    {analiseSelecionada.decisao ? (
                      <div className="mt-3 space-y-3 text-xs">
                        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-emerald-900">Decisão: {analiseSelecionada.decisao.status}</span>
                            <span className="text-[10px] text-emerald-700 font-semibold">{analiseSelecionada.decisao.nivelAlcada}</span>
                          </div>
                          <p className="text-xs text-emerald-800 italic">
                            &ldquo;{analiseSelecionada.decisao.parecerAprovador}&rdquo;
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                            <span className="text-slate-400 text-[10px] block">Limite Aprovado ({analiseSelecionada.empresaNome}):</span>
                            <span className="font-bold text-slate-900">
                              R$ {analiseSelecionada.decisao.limiteAprovado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                            <span className="text-slate-400 text-[10px] block">Limite Consolidado Grupo:</span>
                            <span className="font-bold text-indigo-700">
                              R$ {analiseSelecionada.decisao.limiteConsolidadoAprovado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                            <span className="text-slate-400 text-[10px] block">Prazo Concedido:</span>
                            <span className="font-semibold text-slate-800">{analiseSelecionada.decisao.prazoMaximoDias} dias</span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded border border-slate-100">
                            <span className="text-slate-400 text-[10px] block">Garantia Exigida:</span>
                            <span className="font-semibold text-slate-800">{analiseSelecionada.decisao.garantiaExigida}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                          <p>
                            <strong className="text-slate-700">Aprovador:</strong> {analiseSelecionada.decisao.aprovadorNome} ({analiseSelecionada.decisao.aprovadorCargo})
                          </p>
                          <p>
                            <strong className="text-slate-700">Data da Decisão:</strong> {new Date(analiseSelecionada.decisao.decididoEm).toLocaleDateString('pt-BR')} às {new Date(analiseSelecionada.decisao.decididoEm).toLocaleTimeString('pt-BR')}
                          </p>
                          <p>
                            <strong className="text-slate-700">Validade do Limite:</strong> Até {analiseSelecionada.decisao.validadeAprovacao}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-center py-6">
                        <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2 opacity-60" />
                        <p className="text-xs font-semibold text-slate-700">Esta análise ainda não foi decidida.</p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                          O motor de regras gerou a recomendação técnica. A decisão formal deve ser submetida pela alçada responsável.
                        </p>
                        <button
                          onClick={() => abrirModalDecisao(analiseSelecionada)}
                          className="mt-4 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-all"
                        >
                          Julgar / Decidir Agora
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------
          ABA 2: LIMITES & GRUPO ECONÔMICO
      --------------------------------------------------------------------- */}
      {subTab === 'limites' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Limites de Crédito por Cliente & Consolidado do Grupo</h2>
                <p className="text-xs text-slate-500">
                  Visão dos limites concedidos, exposição atual/projetada e saldo disponível com suporte a teto guarda-chuva global.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Cliente / CNPJ</th>
                    <th className="py-3 px-4">Grupo Econômico</th>
                    <th className="py-3 px-4 text-right">Limite ({empresaAtiva.codigo})</th>
                    <th className="py-3 px-4 text-right">Limite Consolidado Grupo</th>
                    <th className="py-3 px-4 text-right">Exposição Projetada</th>
                    <th className="py-3 px-4 text-right">Saldo Disponível</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Validade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {limites.map((lim) => {
                    const empLim = lim.limitesPorEmpresa.find((e) => e.empresaId === empresaAtiva.id);
                    const percUso = lim.limiteConsolidadoGrupo > 0 ? (lim.exposicaoConsolidadaProjetada / lim.limiteConsolidadoGrupo) * 100 : 0;

                    return (
                      <tr key={lim.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{lim.clienteNome}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{lim.cnpjCpf}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {lim.grupoEconomicoCliente || '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {empLim ? `R$ ${empLim.limiteConcedido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não Concedido'}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-indigo-700">
                          R$ {lim.limiteConsolidadoGrupo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold text-amber-700 block">
                            R$ {lim.exposicaoConsolidadaProjetada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <div className="w-24 bg-slate-200 h-1.5 rounded-full ml-auto mt-1 overflow-hidden">
                            <div
                              className={`h-full ${percUso > 90 ? 'bg-rose-500' : percUso > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, percUso)}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">
                          R$ {lim.saldoConsolidadoDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {lim.statusGeral === 'BLOQUEADO' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Bloqueado</span>
                          ) : lim.statusGeral === 'ALERTA_EXPOSICAO' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Alerta</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Liberado</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500 text-[11px]">
                          {lim.dataValidade}
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

      {/* ---------------------------------------------------------------------
          ABA 3: BLOQUEIOS DE CRÉDITO
      --------------------------------------------------------------------- */}
      {subTab === 'bloqueios' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Bloqueios de Faturamento & Inadimplência</h2>
                <p className="text-xs text-slate-500">
                  Controle preventivo que impede emissão de faturamento ou liberação de novos pedidos para clientes com títulos vencidos ou restrições graves.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Cliente / CNPJ</th>
                    <th className="py-3 px-4">Origem / Motivo</th>
                    <th className="py-3 px-4">Detalhes do Bloqueio</th>
                    <th className="py-3 px-4">Data Bloqueio</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bloqueios.map((blq) => (
                    <tr key={blq.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{blq.clienteNome}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{blq.cnpjCpf}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-rose-700 block">{blq.motivo}</span>
                        <span className="text-[10px] text-slate-400">{blq.tipoBloqueio}</span>
                      </td>
                      <td className="py-3 px-4 max-w-xs text-slate-600">
                        {blq.detalhesMotivo}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(blq.bloqueadoEm).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {blq.ativo ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 inline-flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Ativo
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 inline-flex items-center gap-1">
                            <Unlock className="w-3 h-3" /> Desbloqueado
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {blq.ativo && (
                          <button
                            onClick={() => {
                              setModalDesbloqueio(blq);
                              setJustificativaDesbloqueio('');
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-all inline-flex items-center gap-1"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            Desbloquear
                          </button>
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

      {/* ---------------------------------------------------------------------
          ABA 4: BUREAU & CONSULTAS EXTERNAS (ADAPTER SERASA MOCK)
      --------------------------------------------------------------------- */}
      {subTab === 'bureau' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Search className="w-4 h-4 text-indigo-600" />
                  Simulador de Consultas via Adapter (CreditProvider)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Testes conceituais com o <code className="text-indigo-600 font-mono font-bold">MockSerasaProvider</code> que implementa a interface <code className="text-indigo-600 font-mono font-bold">CreditProvider</code>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="CNPJ ou CPF de teste..."
                  value={docConsultaAvulsa}
                  onChange={(e) => setDocConsultaAvulsa(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
                />
                <button
                  onClick={handleConsultaAvulsa}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Search className="w-4 h-4" />
                  {actionLoading ? 'Consultando...' : 'Consultar Bureau'}
                </button>
              </div>
            </div>

            {/* Dicas de Cenários de Teste Mock */}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-1">Cenários de Teste Disponíveis no Mock:</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-mono font-bold text-emerald-700 block">51.800.222/0001-88</span>
                  <span className="text-slate-600">Perfil AAA: Score 920, sem protestos, baixo risco.</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-mono font-bold text-amber-700 block">11.222.333/0001-6666</span>
                  <span className="text-slate-600">Perfil Médio: Score 540, 1 protesto leve.</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-mono font-bold text-rose-700 block">99.888.777/0001-9999</span>
                  <span className="text-slate-600">Perfil Crítico: Score 215, 3 protestos e PEFIN.</span>
                </div>
              </div>
            </div>

            {/* Resultado da Consulta Avulsa */}
            {resultadoConsultaAvulsa && (
              <div className="mt-6 p-4 rounded-xl bg-slate-900 text-white space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs text-indigo-400 font-bold block">Resposta Estruturada do Provider:</span>
                    <span className="text-sm font-bold text-white">{resultadoConsultaAvulsa.dados.cadastro.razaoSocialOuNome}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 rounded text-xs font-bold">
                    {resultadoConsultaAvulsa.provider}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-800/80 p-3 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Score Bureau Retornado</span>
                    <span className="text-xl font-extrabold text-indigo-400">{resultadoConsultaAvulsa.dados.score.score}/1000</span>
                    <p className="text-[10px] text-slate-300 mt-1">{resultadoConsultaAvulsa.dados.score.textoExplicativo}</p>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Restrições & Protestos</span>
                    <span className="text-lg font-bold text-white">
                      {resultadoConsultaAvulsa.dados.restricoes.protestos.length} protesto(s)
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Total R$ {resultadoConsultaAvulsa.dados.restricoes.valorTotalRestricoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Sugestão de Limite Bureau</span>
                    <span className="text-lg font-bold text-emerald-400">
                      R$ {resultadoConsultaAvulsa.dados.resumoFinanceiro.limiteCreditoSugeridoBureau.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Fat. Estimado: R$ {resultadoConsultaAvulsa.dados.resumoFinanceiro.faturamentoEstimadoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          ABA 5: POLÍTICAS & MATRIZ DE RISCO
      --------------------------------------------------------------------- */}
      {subTab === 'politicas' && (
        <div className="space-y-6">
          {politicas.map((pol) => (
            <div key={pol.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{pol.nome}</h2>
                    <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded">
                      v{pol.versao}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{pol.descricao}</p>
                </div>
              </div>

              {/* Grid dos Pesos do Score Interno */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  1. Ponderação do Score Interno (Soma = 100%)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[11px] block">Histórico Interno</span>
                    <span className="text-base font-extrabold text-indigo-700">{pol.pesoHistoricoInterno}%</span>
                    <span className="text-[10px] text-slate-400 block">Pontualidade / Atrasos</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[11px] block">Tempo Relacionamento</span>
                    <span className="text-base font-extrabold text-indigo-700">{pol.pesoTempoRelacionamento}%</span>
                    <span className="text-[10px] text-slate-400 block">Meses com o grupo</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[11px] block">Volume Faturado</span>
                    <span className="text-base font-extrabold text-indigo-700">{pol.pesoVolumeFaturamento}%</span>
                    <span className="text-[10px] text-slate-400 block">Acúmulo histórico</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[11px] block">Score Bureau Serasa</span>
                    <span className="text-base font-extrabold text-indigo-700">{pol.pesoScoreBureauExterno}%</span>
                    <span className="text-[10px] text-slate-400 block">Pontuação externa</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[11px] block">Restrições / Protestos</span>
                    <span className="text-base font-extrabold text-indigo-700">{pol.pesoRestricoesExternas}%</span>
                    <span className="text-[10px] text-slate-400 block">Penalidades de mercado</span>
                  </div>
                </div>
              </div>

              {/* Faixas de Score */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  2. Faixas de Score & Fatores de Limite
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Faixa</th>
                        <th className="py-2.5 px-3">Score Mín - Máx</th>
                        <th className="py-2.5 px-3">Fator Faturamento</th>
                        <th className="py-2.5 px-3">Teto Sem Comitê</th>
                        <th className="py-2.5 px-3">Prazo Máx</th>
                        <th className="py-2.5 px-3">Garantia Obrigatória</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pol.faixasScore.map((f, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-indigo-700">{f.faixa}</td>
                          <td className="py-2.5 px-3 font-mono">{f.scoreMin} a {f.scoreMax} pts</td>
                          <td className="py-2.5 px-3">{(f.fatorLimiteFaturamento * 100).toFixed(0)}% do faturamento</td>
                          <td className="py-2.5 px-3 font-bold">R$ {f.limiteMaximoSemComite.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2.5 px-3">{f.prazoMaximoDias} dias</td>
                          <td className="py-2.5 px-3">
                            {f.exigeGarantia ? (
                              <span className="text-amber-700 font-bold">Sim (Aval/Sinal)</span>
                            ) : (
                              <span className="text-emerald-700">Não (Crédito Limpo)</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Alçadas */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  3. Alçadas de Aprovação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  {pol.alcadas.map((alc, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-800 block text-[11px]">{alc.nivel}</span>
                      <span className="text-sm font-extrabold text-indigo-700 block mt-1">
                        Até R$ {alc.limiteMaximo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================================
          MODAL: NOVA ANÁLISE DE CRÉDITO
      ===================================================================== */}
      {modalNovaAnalise && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Solicitar Nova Análise de Crédito
              </h3>
              <button onClick={() => setModalNovaAnalise(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Cliente Solicitante</label>
                <input
                  type="text"
                  value={formNovaAnalise.clienteNome}
                  onChange={(e) => setFormNovaAnalise({ ...formNovaAnalise, clienteNome: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">CNPJ / CPF</label>
                  <input
                    type="text"
                    value={formNovaAnalise.cnpjCpf}
                    onChange={(e) => setFormNovaAnalise({ ...formNovaAnalise, cnpjCpf: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Motivo da Solicitação</label>
                  <select
                    value={formNovaAnalise.motivoSolicitacao}
                    onChange={(e: any) => setFormNovaAnalise({ ...formNovaAnalise, motivoSolicitacao: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PRIMEIRA_ANALISE">Primeira Análise</option>
                    <option value="AUMENTO_LIMITE">Aumento de Limite</option>
                    <option value="NOVO_PEDIDO_GRANDE">Novo Pedido Vultoso</option>
                    <option value="REVISAO_PERIODICA">Revisão Periódica</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Limite Solicitado (R$)</label>
                  <input
                    type="number"
                    value={formNovaAnalise.limiteSolicitado}
                    onChange={(e) => setFormNovaAnalise({ ...formNovaAnalise, limiteSolicitado: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Prazo Solicitado (Dias)</label>
                  <input
                    type="number"
                    value={formNovaAnalise.prazoPagamentoSolicitadoDias}
                    onChange={(e) => setFormNovaAnalise({ ...formNovaAnalise, prazoPagamentoSolicitadoDias: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <input
                  type="checkbox"
                  id="consultarBureauAuto"
                  checked={formNovaAnalise.consultarBureauAutomatico}
                  onChange={(e) => setFormNovaAnalise({ ...formNovaAnalise, consultarBureauAutomatico: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="consultarBureauAuto" className="text-[11px] text-indigo-900 font-medium cursor-pointer">
                  Executar consulta automática no adapter de bureau de crédito (MockSerasaProvider)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalNovaAnalise(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCriarAnalise}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
              >
                {actionLoading ? 'Processando Motor...' : 'Processar Análise no Motor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: DECIDIR ALÇADA (APROVADOR)
      ===================================================================== */}
      {modalDecisao && analiseSelecionada && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                Decisão da Alçada de Crédito
              </h3>
              <button onClick={() => setModalDecisao(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Status da Decisão</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormDecisao({ ...formDecisao, status: 'APROVADO' })}
                    className={`py-2 text-xs font-bold rounded-lg border text-center ${
                      formDecisao.status === 'APROVADO'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Aprovar
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormDecisao({ ...formDecisao, status: 'APROVADO_COM_RESTRICAO' })}
                    className={`py-2 text-xs font-bold rounded-lg border text-center ${
                      formDecisao.status === 'APROVADO_COM_RESTRICAO'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Aprovar c/ Restrição
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormDecisao({ ...formDecisao, status: 'REPROVADO' })}
                    className={`py-2 text-xs font-bold rounded-lg border text-center ${
                      formDecisao.status === 'REPROVADO'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Reprovar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Limite Concedido ({empresaAtiva.codigo})</label>
                  <input
                    type="number"
                    value={formDecisao.limiteAprovado}
                    onChange={(e) => setFormDecisao({ ...formDecisao, limiteAprovado: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Limite Consolidado Grupo</label>
                  <input
                    type="number"
                    value={formDecisao.limiteConsolidadoAprovado}
                    onChange={(e) => setFormDecisao({ ...formDecisao, limiteConsolidadoAprovado: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Prazo Concedido (Dias)</label>
                  <input
                    type="number"
                    value={formDecisao.prazoMaximoDias}
                    onChange={(e) => setFormDecisao({ ...formDecisao, prazoMaximoDias: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Garantia Exigida</label>
                  <select
                    value={formDecisao.garantiaExigida}
                    onChange={(e: any) => setFormDecisao({ ...formDecisao, garantiaExigida: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="NENHUMA">Nenhuma (Crédito Limpo)</option>
                    <option value="AVAL_SOCIOS">Aval dos Sócios (QSA)</option>
                    <option value="SINAL_50_RESTANTE_FATURADO">Sinal de 50% + Saldo Faturado</option>
                    <option value="PAGAMENTO_ANTECIPADO">Pagamento 100% Antecipado</option>
                    <option value="ALIENACAO_FIDUCIARIA">Alienação Fiduciária</option>
                    <option value="CARTA_FIANCA_BANCARIA">Carta Fiança Bancária</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Parecer Técnico do Aprovador</label>
                <textarea
                  rows={3}
                  value={formDecisao.parecerAprovador}
                  onChange={(e) => setFormDecisao({ ...formDecisao, parecerAprovador: e.target.value })}
                  placeholder="Justifique a decisão, concessão de limites e eventuais exceções..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 block">Nome do Aprovador:</span>
                  <span className="font-semibold text-slate-800">{formDecisao.aprovadorNome}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Nível de Alçada:</span>
                  <span className="font-semibold text-indigo-700">{formDecisao.nivelAlcada}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalDecisao(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmeterDecisao}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
              >
                {actionLoading ? 'Registrando...' : 'Confirmar Decisão & Gravar Limite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: DESBLOQUEIO FORMAL
      ===================================================================== */}
      {modalDesbloqueio && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Unlock className="w-5 h-5 text-emerald-600" />
                Desbloqueio de Crédito
              </h3>
              <button onClick={() => setModalDesbloqueio(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Você está desbloqueando o cliente <strong className="text-slate-900">{modalDesbloqueio.clienteNome}</strong>.
              </p>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Justificativa Formal Obrigatória</label>
                <textarea
                  rows={3}
                  value={justificativaDesbloqueio}
                  onChange={(e) => setJustificativaDesbloqueio(e.target.value)}
                  placeholder="Ex: Título liquidado via comprovante bancário ou acordo com a diretoria..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalDesbloqueio(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleDesbloquear}
                disabled={actionLoading || !justificativaDesbloqueio}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs disabled:opacity-50"
              >
                {actionLoading ? 'Desbloqueando...' : 'Confirmar Desbloqueio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: CONSULTA AVULSA BUREAU (SERASA ADAPTER)
      ===================================================================== */}
      {modalConsultaAvulsa && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-600" />
                Consulta de Crédito Bureau (Adapter)
              </h3>
              <button onClick={() => setModalConsultaAvulsa(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Documento (CNPJ ou CPF)</label>
                <input
                  type="text"
                  value={docConsultaAvulsa}
                  onChange={(e) => setDocConsultaAvulsa(e.target.value)}
                  placeholder="Ex: 51.800.222/0001-88"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-slate-600 space-y-1 text-[11px]">
                <p>
                  <strong>Provider Ativo:</strong> MockSerasaProvider (Simulação de Bureau)
                </p>
                <p>
                  <strong>Métodos Invocados:</strong> <code className="font-mono text-indigo-700">consultarCadastro()</code>, <code className="font-mono text-indigo-700">consultarScore()</code>, <code className="font-mono text-indigo-700">consultarRestricoes()</code>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalConsultaAvulsa(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg"
              >
                Fechar
              </button>
              <button
                onClick={async () => {
                  await handleConsultaAvulsa();
                  setSubTab('bureau');
                  setModalConsultaAvulsa(false);
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
              >
                {actionLoading ? 'Consultando...' : 'Executar Consulta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
