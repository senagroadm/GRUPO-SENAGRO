'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Target,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Plus,
  ArrowRight,
  Filter,
  Search,
  Building2,
  Calendar,
  Phone,
  Mail,
  FileText,
  Paperclip,
  Check,
  ChevronRight,
  RefreshCw,
  XCircle,
  HelpCircle,
  Briefcase,
  Layers,
  Sparkles,
  AlertCircle,
  UserCheck,
  Award,
} from 'lucide-react';
import { Empresa } from '../../../backend/core/types/company';

interface CrmDashboardMetrics {
  totalLeads: number;
  leadsNovos: number;
  leadsQualificados: number;
  leadsConvertidos: number;
  taxaConversaoLeads: number;
  totalOportunidades: number;
  oportunidadesAbertas: number;
  oportunidadesGanhas: number;
  oportunidadesPerdidas: number;
  valorPotencialPipeline: number;
  valorPonderadoPipeline: number;
  valorTotalGanho: number;
  taxaConversaoOportunidades: number;
  tempoMedioFechamentoDias: number;
  motivosDePerdaRanking: Array<{
    motivoId: string;
    motivoNome: string;
    categoria: string;
    quantidade: number;
    valorPerdidoTotal: number;
    percentual: number;
  }>;
  oportunidadesPorEtapa: Array<{
    etapaId: string;
    etapaNome: string;
    ordem: number;
    corHex: string;
    quantidade: number;
    valorTotal: number;
  }>;
  followUpsAtrasados: number;
  followUpsPendentesHoje: number;
}

interface CrmLead {
  id: string;
  empresaId: string;
  nomeContato: string;
  empresaLead: string;
  cargo?: string;
  email: string;
  telefone?: string;
  cidade?: string;
  uf?: string;
  segmentoIndustrial?: string;
  valorEstimado?: number;
  status: 'NOVO' | 'EM_QUALIFICACAO' | 'QUALIFICADO' | 'CONVERTIDO' | 'DESQUALIFICADO';
  origemNome?: string;
  atribuidoUsuarioNome?: string;
  clienteGeradoId?: string;
  oportunidadeGeradaId?: string;
  notas?: string;
  criadoEm: string;
}

interface CrmOportunidade {
  id: string;
  empresaId: string;
  codigo: string;
  titulo: string;
  clienteId?: string;
  clienteNome?: string;
  origemNome?: string;
  etapaId: string;
  etapaNome?: string;
  vendedorNome?: string;
  valorEstimado: number;
  valorFechado?: number;
  probabilidadePercentual: number;
  status: 'ABERTA' | 'GANHA' | 'PERDIDA' | 'CANCELADA';
  motivoPerdaNome?: string;
  detalhesPerda?: string;
  itensSolicitados?: string;
  observacoes?: string;
  criadoEm: string;
  dataPrevisaoFechamento?: string;
}

interface CrmAtividade {
  id: string;
  empresaId: string;
  oportunidadeId?: string;
  oportunidadeTitulo?: string;
  leadId?: string;
  leadNome?: string;
  usuarioNome?: string;
  tipo: string;
  titulo: string;
  dataInicio: string;
  duracaoMinutos: number;
  descricao: string;
  resultado: string;
  concluida: boolean;
  criadoEm: string;
}

interface CrmFollowUp {
  id: string;
  empresaId: string;
  oportunidadeId?: string;
  oportunidadeTitulo?: string;
  leadId?: string;
  leadNome?: string;
  usuarioResponsavelNome?: string;
  tituloPendencia: string;
  descricao?: string;
  dataLimite: string;
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA';
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
}

export function CrmViewer({ empresaAtiva }: { empresaAtiva: Empresa }) {
  const [metrics, setMetrics] = useState<CrmDashboardMetrics | null>(null);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [oportunidades, setOportunidades] = useState<CrmOportunidade[]>([]);
  const [atividades, setAtividades] = useState<CrmAtividade[]>([]);
  const [followUps, setFollowUps] = useState<CrmFollowUp[]>([]);
  const [auxiliares, setAuxiliares] = useState<any>({ origens: [], motivosPerda: [], etapasFunil: [], clientes: [] });
  const [loading, setLoading] = useState(false);

  // Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pipeline' | 'leads' | 'atividades' | 'pendencias'>('dashboard');

  // Modais
  const [showNovoLeadModal, setShowNovoLeadModal] = useState(false);
  const [showNovaOptModal, setShowNovaOptModal] = useState(false);
  const [showNovaAtivModal, setShowNovaAtivModal] = useState(false);
  const [showConvertLeadModal, setShowConvertLeadModal] = useState<CrmLead | null>(null);
  const [showPerdaModal, setShowPerdaModal] = useState<CrmOportunidade | null>(null);

  // Form states
  const [novoLeadForm, setNovoLeadForm] = useState({
    nomeContato: '',
    empresaLead: '',
    cargo: '',
    email: '',
    telefone: '',
    cidade: '',
    uf: 'SP',
    segmentoIndustrial: 'CALDEIRARIA_PESADA',
    valorEstimado: 50000,
    origemId: '',
    notas: '',
  });

  const [novaOptForm, setNovaOptForm] = useState({
    titulo: '',
    clienteId: '',
    etapaId: '',
    valorEstimado: 100000,
    origemId: '',
    itensSolicitados: '',
  });

  const [convertForm, setConvertForm] = useState({
    tituloOportunidade: '',
    valorEstimado: 100000,
    cnpjCpf: '12.345.678/0001-99',
    etapaInicialId: '',
  });

  const [perdaForm, setPerdaForm] = useState({
    motivoPerdaId: '',
    detalhesPerda: '',
    concorrenteVencedor: '',
  });

  const [novaAtivForm, setNovaAtivForm] = useState({
    oportunidadeId: '',
    tipo: 'REUNIAO_ONLINE',
    titulo: '',
    descricao: '',
    resultado: '', // Obrigatório
    proximaAcao: '',
    proximaData: '',
  });

  const carregarDadosCRM = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, lRes, oRes, aRes, fRes, auxRes] = await Promise.all([
        fetch(`/api/v1/crm/dashboard?empresaId=${empresaAtiva.id}`, { headers: { 'x-empresa-id': empresaAtiva.id } }),
        fetch(`/api/v1/crm/leads?empresaId=${empresaAtiva.id}`, { headers: { 'x-empresa-id': empresaAtiva.id } }),
        fetch(`/api/v1/crm/oportunidades?empresaId=${empresaAtiva.id}`, { headers: { 'x-empresa-id': empresaAtiva.id } }),
        fetch(`/api/v1/crm/atividades?empresaId=${empresaAtiva.id}`, { headers: { 'x-empresa-id': empresaAtiva.id } }),
        fetch(`/api/v1/crm/follow-ups?empresaId=${empresaAtiva.id}`, { headers: { 'x-empresa-id': empresaAtiva.id } }),
        fetch(`/api/v1/crm/auxiliares?empresaId=${empresaAtiva.id}`, { headers: { 'x-empresa-id': empresaAtiva.id } }),
      ]);

      const [mData, lData, oData, aData, fData, auxData] = await Promise.all([
        mRes.json(),
        lRes.json(),
        oRes.json(),
        aRes.json(),
        fRes.json(),
        auxRes.json(),
      ]);

      if (mData.success) setMetrics(mData.data);
      if (lData.success) setLeads(lData.data || []);
      if (oData.success) setOportunidades(oData.data || []);
      if (aData.success) setAtividades(aData.data || []);
      if (fData.success) setFollowUps(fData.data || []);
      if (auxData.success) setAuxiliares(auxData.data || { origens: [], motivosPerda: [], etapasFunil: [], clientes: [] });
    } catch (err) {
      console.error('Erro ao carregar dados CRM:', err);
    } finally {
      setLoading(false);
    }
  }, [empresaAtiva.id]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) {
        await carregarDadosCRM();
      }
    })();
    return () => {
      active = false;
    };
  }, [carregarDadosCRM]);

  const handleCriarLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-empresa-id': empresaAtiva.id },
        body: JSON.stringify(novoLeadForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowNovoLeadModal(false);
        carregarDadosCRM();
      }
    } catch (err) {
      console.error('Erro ao criar lead:', err);
    }
  };

  const handleConverterLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showConvertLeadModal) return;

    try {
      const res = await fetch(`/api/v1/crm/leads/${showConvertLeadModal.id}/converter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-empresa-id': empresaAtiva.id },
        body: JSON.stringify(convertForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowConvertLeadModal(null);
        carregarDadosCRM();
      }
    } catch (err) {
      console.error('Erro ao converter lead:', err);
    }
  };

  const handleCriarOportunidade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/crm/oportunidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-empresa-id': empresaAtiva.id },
        body: JSON.stringify(novaOptForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowNovaOptModal(false);
        carregarDadosCRM();
      }
    } catch (err) {
      console.error('Erro ao criar oportunidade:', err);
    }
  };

  const handleMoverEtapa = async (optId: string, novaEtapaId: string) => {
    const etapaObj = auxiliares.etapasFunil.find((e: any) => e.id === novaEtapaId);
    if (etapaObj?.isFinalPerdida) {
      const opt = oportunidades.find((o) => o.id === optId);
      if (opt) {
        setShowPerdaModal(opt);
        return;
      }
    }

    try {
      const res = await fetch(`/api/v1/crm/oportunidades/${optId}/etapa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-empresa-id': empresaAtiva.id },
        body: JSON.stringify({ etapaId: novaEtapaId }),
      });
      const data = await res.json();
      if (data.success) {
        carregarDadosCRM();
      }
    } catch (err) {
      console.error('Erro ao mover etapa:', err);
    }
  };

  const handleFecharPerdida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPerdaModal || !perdaForm.motivoPerdaId) return;

    try {
      const res = await fetch(`/api/v1/crm/oportunidades/${showPerdaModal.id}/fechar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-empresa-id': empresaAtiva.id },
        body: JSON.stringify({
          status: 'PERDIDA',
          motivoPerdaId: perdaForm.motivoPerdaId,
          detalhesPerda: perdaForm.detalhesPerda,
          concorrenteVencedor: perdaForm.concorrenteVencedor,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPerdaModal(null);
        setPerdaForm({ motivoPerdaId: '', detalhesPerda: '', concorrenteVencedor: '' });
        carregarDadosCRM();
      }
    } catch (err) {
      console.error('Erro ao fechar com perda:', err);
    }
  };

  const handleMarcarGanha = async (opt: CrmOportunidade) => {
    try {
      const res = await fetch(`/api/v1/crm/oportunidades/${opt.id}/fechar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-empresa-id': empresaAtiva.id },
        body: JSON.stringify({
          status: 'GANHA',
          valorFechado: opt.valorEstimado,
        }),
      });
      const data = await res.json();
      if (data.success) {
        carregarDadosCRM();
      }
    } catch (err) {
      console.error('Erro ao fechar como ganha:', err);
    }
  };

  const handleRegistrarAtividade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaAtivForm.descricao || !novaAtivForm.resultado) return;

    try {
      const res = await fetch('/api/v1/crm/atividades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-empresa-id': empresaAtiva.id },
        body: JSON.stringify({
          oportunidadeId: novaAtivForm.oportunidadeId || undefined,
          tipo: novaAtivForm.tipo,
          titulo: novaAtivForm.titulo || `Contato Comercial (${novaAtivForm.tipo})`,
          descricao: novaAtivForm.descricao,
          resultado: novaAtivForm.resultado,
          proximaAcaoPendencia: novaAtivForm.proximaAcao
            ? {
                titulo: novaAtivForm.proximaAcao,
                dataLimite: novaAtivForm.proximaData || new Date(Date.now() + 3600000 * 24 * 3).toISOString(),
                prioridade: 'ALTA',
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowNovaAtivModal(false);
        setNovaAtivForm({ oportunidadeId: '', tipo: 'REUNIAO_ONLINE', titulo: '', descricao: '', resultado: '', proximaAcao: '', proximaData: '' });
        carregarDadosCRM();
      }
    } catch (err) {
      console.error('Erro ao registrar atividade:', err);
    }
  };

  const handleToggleFollowUp = async (folId: string, statusAtual: string) => {
    const novoStatus = statusAtual === 'PENDENTE' ? 'CONCLUIDO' : 'PENDENTE';
    try {
      const res = await fetch(`/api/v1/crm/follow-ups/${folId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-empresa-id': empresaAtiva.id },
        body: JSON.stringify({ status: novoStatus }),
      });
      const data = await res.json();
      if (data.success) {
        carregarDadosCRM();
      }
    } catch (err) {
      console.error('Erro ao atualizar follow-up:', err);
    }
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <div id="crm-module-viewer" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">CRM Industrial & Ciclo Comercial</h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                  Sem IA • Regras Determinísticas
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Funil de vendas B2B, conversão de leads, follow-ups de obras e análise de perdas para{' '}
                <span className="font-semibold text-slate-700">{empresaAtiva.nomeFantasia}</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={carregarDadosCRM}
              className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
              title="Atualizar painel"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Recarregar
            </button>
            <button
              onClick={() => setShowNovoLeadModal(true)}
              className="px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-slate-600" />
              Novo Lead
            </button>
            <button
              onClick={() => setShowNovaOptModal(true)}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition-colors flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              Nova Oportunidade
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 border-b border-slate-200 mt-6 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Dashboard Comercial
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'pipeline'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            Funil Kanban ({oportunidades.filter((o) => o.status === 'ABERTA').length} Abertas)
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'leads'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Leads & Conversão ({leads.length})
          </button>
          <button
            onClick={() => setActiveTab('atividades')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'atividades'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Phone className="w-4 h-4" />
            Atividades & Histórico ({atividades.length})
          </button>
          <button
            onClick={() => setActiveTab('pendencias')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'pendencias'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            Pendências / Follow-ups ({followUps.filter((f) => f.status === 'PENDENTE').length})
          </button>
        </div>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && metrics && (
        <div className="space-y-6">
          {/* Main KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Pipeline em Aberto</span>
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{formatBRL(metrics.valorPotencialPipeline)}</div>
              <p className="text-xs text-slate-500 mt-1">
                Ponderado por probabilidade: <strong className="text-slate-700">{formatBRL(metrics.valorPonderadoPipeline)}</strong>
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Contratos Ganhos</span>
                <Award className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{formatBRL(metrics.valorTotalGanho)}</div>
              <p className="text-xs text-slate-500 mt-1">
                {metrics.oportunidadesGanhas} oportunidades fechadas com êxito
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Taxa de Conversão</span>
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{metrics.taxaConversaoOportunidades}%</div>
              <p className="text-xs text-slate-500 mt-1">
                Leads para Oportunidades: <strong className="text-slate-700">{metrics.taxaConversaoLeads}%</strong>
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Ciclo Médio de Venda</span>
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{metrics.tempoMedioFechamentoDias} dias</div>
              <p className="text-xs text-slate-500 mt-1">
                Do contato inicial até a emissão do pedido
              </p>
            </div>
          </div>

          {/* Funnel Stages and Loss Reasons Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Oportunidades por Etapa */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Distribuição por Etapa do Funil</h3>
                <span className="text-xs font-medium text-slate-500">{oportunidades.length} totais</span>
              </div>

              <div className="space-y-3">
                {metrics.oportunidadesPorEtapa.map((etapa) => (
                  <div key={etapa.etapaId} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{etapa.etapaNome}</span>
                      <span>{etapa.quantidade} propostas • {formatBRL(etapa.valorTotal)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: etapa.corHex,
                          width: `${Math.min(100, Math.max(8, (etapa.valorTotal / (metrics.valorPotencialPipeline + metrics.valorTotalGanho || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivos de Perda Obrigatórios */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Análise de Motivos de Perda</h3>
                  <p className="text-xs text-slate-500">Mapeamento obrigatório de negócios perdidos</p>
                </div>
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-rose-100 text-rose-700 border border-rose-200">
                  {metrics.oportunidadesPerdidas} Perdidas
                </span>
              </div>

              {metrics.motivosDePerdaRanking.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhuma oportunidade perdida registrada nesta empresa.
                </div>
              ) : (
                <div className="space-y-3">
                  {metrics.motivosDePerdaRanking.map((motivo) => (
                    <div key={motivo.motivoId} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between font-semibold text-slate-800">
                        <span>{motivo.motivoNome}</span>
                        <span className="text-rose-600 font-bold">{formatBRL(motivo.valorPerdidoTotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Categoria: {motivo.categoria}</span>
                        <span>{motivo.quantidade} ocorrência(s) ({motivo.percentual}% do valor perdido)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PIPELINE KANBAN TAB */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500">
              Pipeline de Oportunidades Industriais • <strong className="text-slate-800">{empresaAtiva.nomeFantasia}</strong>
            </div>
            <button
              onClick={() => setShowNovaOptModal(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Oportunidade
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto pb-4">
            {auxiliares.etapasFunil
              .filter((e: any) => !e.isFinalPerdida)
              .map((etapa: any) => {
                const optsEtapa = oportunidades.filter((o) => o.etapaId === etapa.id);
                const totalValor = optsEtapa.reduce((acc, o) => acc + (Number(o.valorEstimado) || 0), 0);

                return (
                  <div key={etapa.id} className="bg-slate-100/90 rounded-xl p-3 border border-slate-200 flex flex-col min-w-[240px]">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 truncate" title={etapa.nome}>{etapa.nome}</h4>
                        <span className="text-[10px] text-slate-500 font-semibold">{formatBRL(totalValor)}</span>
                      </div>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-white text-slate-700 shadow-xs">
                        {optsEtapa.length}
                      </span>
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto max-h-[600px]">
                      {optsEtapa.length === 0 ? (
                        <div className="text-center py-6 text-[11px] text-slate-400 border border-dashed border-slate-300 rounded-lg">
                          Nenhuma proposta
                        </div>
                      ) : (
                        optsEtapa.map((opt) => (
                          <div
                            key={opt.id}
                            className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-2"
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                {opt.codigo}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500">
                                {opt.probabilidadePercentual}% prob.
                              </span>
                            </div>

                            <h5 className="text-xs font-bold text-slate-900 line-clamp-2">{opt.titulo}</h5>
                            <p className="text-[11px] text-slate-600 font-medium truncate">
                              🏢 {opt.clienteNome || 'Cliente não definido'}
                            </p>

                            <div className="text-xs font-bold text-emerald-700 pt-1 border-t border-slate-100">
                              {formatBRL(opt.valorEstimado)}
                            </div>

                            {/* Actions on Card */}
                            <div className="flex items-center justify-between pt-1 gap-1">
                              <div className="flex gap-1">
                                {opt.status === 'ABERTA' && (
                                  <>
                                    <button
                                      onClick={() => handleMarcarGanha(opt)}
                                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                      title="Marcar como Ganha"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setShowPerdaModal(opt)}
                                      className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                      title="Marcar como Perdida (Exige Motivo)"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>

                              {/* Advance Stage Selector */}
                              <select
                                value={opt.etapaId}
                                onChange={(e) => handleMoverEtapa(opt.id, e.target.value)}
                                className="text-[10px] px-1.5 py-0.5 border border-slate-200 rounded bg-slate-50 text-slate-700 font-medium"
                              >
                                {auxiliares.etapasFunil.map((e: any) => (
                                  <option key={e.id} value={e.id}>
                                    Mover: {e.nome.split('.')[1] || e.nome}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* LEADS TAB */}
      {activeTab === 'leads' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Base de Prospecção & Leads Industriais</h3>
              <p className="text-xs text-slate-500">Qualifique leads e converta-os atomicamente em Clientes + Oportunidades.</p>
            </div>
            <button
              onClick={() => setShowNovoLeadModal(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              Cadastrar Lead
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Contato & Empresa</th>
                  <th className="px-6 py-3.5">Segmento & Local</th>
                  <th className="px-6 py-3.5">Valor Estimado</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Origem</th>
                  <th className="px-6 py-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{lead.nomeContato}</div>
                      <div className="text-xs text-slate-700 font-medium">{lead.empresaLead}</div>
                      <div className="text-[11px] text-slate-400">{lead.email} • {lead.telefone || 'Sem telefone'}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                        {lead.segmentoIndustrial || 'Geral'}
                      </span>
                      <div className="text-xs text-slate-500 mt-1">{lead.cidade}/{lead.uf}</div>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {formatBRL(lead.valorEstimado || 0)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          lead.status === 'CONVERTIDO'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : lead.status === 'QUALIFICADO'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : lead.status === 'EM_QUALIFICACAO'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {lead.origemNome || 'Indicação'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {lead.status !== 'CONVERTIDO' ? (
                        <button
                          onClick={() => {
                            setShowConvertLeadModal(lead);
                            setConvertForm({
                              tituloOportunidade: `Fornecimento Industrial - ${lead.empresaLead}`,
                              valorEstimado: lead.valorEstimado || 100000,
                              cnpjCpf: '12.345.678/0001-99',
                              etapaInicialId: auxiliares.etapasFunil[0]?.id || '',
                            });
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Converter Lead
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-bold flex items-center justify-end gap-1">
                          <Check className="w-4 h-4" /> Convertido
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

      {/* ATIVIDADES TAB */}
      {activeTab === 'atividades' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Histórico de Contatos & Atividades Comerciais</h3>
              <p className="text-xs text-slate-500">Registros obrigatórios com usuário, data, tipo e resultado da negociação.</p>
            </div>
            <button
              onClick={() => setShowNovaAtivModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              Registrar Atividade
            </button>
          </div>

          <div className="space-y-3">
            {atividades.map((ativ) => (
              <div key={ativ.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-blue-100 text-blue-800">
                      {ativ.tipo}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{ativ.titulo}</h4>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {new Date(ativ.dataInicio).toLocaleString('pt-BR')} • {ativ.usuarioNome}
                  </span>
                </div>

                <p className="text-xs text-slate-600">{ativ.descricao}</p>

                <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs">
                  <strong className="text-emerald-900 block mb-0.5">Resultado Obtido:</strong>
                  <span className="text-emerald-800">{ativ.resultado}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PENDÊNCIAS / FOLLOW-UPS TAB */}
      {activeTab === 'pendencias' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pendências & Follow-ups Comerciais</h3>
              <p className="text-xs text-slate-500">Ações agendadas geradas a partir de reuniões e propostas.</p>
            </div>
          </div>

          <div className="space-y-2">
            {followUps.map((fol) => (
              <div
                key={fol.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  fol.status === 'CONCLUIDO'
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleFollowUp(fol.id, fol.status)}
                    className={`p-1.5 rounded-lg border mt-0.5 ${
                      fol.status === 'CONCLUIDO'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-slate-300 text-transparent hover:border-emerald-600'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </button>

                  <div>
                    <h4 className={`text-sm font-bold ${fol.status === 'CONCLUIDO' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {fol.tituloPendencia}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{fol.descricao || 'Sem detalhes adicionais'}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span>Prazo: <strong>{new Date(fol.dataLimite).toLocaleDateString('pt-BR')}</strong></span>
                      <span>•</span>
                      <span>Responsável: {fol.usuarioResponsavelNome}</span>
                      <span>•</span>
                      <span className="font-bold text-amber-700">Prioridade {fol.prioridade}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                    fol.status === 'CONCLUIDO'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {fol.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CONVERSÃO DE LEAD (Obrigatório do Prompt) */}
      {showConvertLeadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">Converter Lead em Cliente + Oportunidade</h3>
              </div>
              <button onClick={() => setShowConvertLeadModal(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                &times;
              </button>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
              <p className="font-bold">Lead: {showConvertLeadModal.nomeContato} ({showConvertLeadModal.empresaLead})</p>
              <p className="mt-0.5">Esta ação cadastrará a empresa na base de clientes e abrirá uma nova oportunidade no pipeline.</p>
            </div>

            <form onSubmit={handleConverterLead} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título da Oportunidade</label>
                <input
                  type="text"
                  required
                  value={convertForm.tituloOportunidade}
                  onChange={(e) => setConvertForm({ ...convertForm, tituloOportunidade: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CNPJ do Novo Cliente</label>
                  <input
                    type="text"
                    required
                    value={convertForm.cnpjCpf}
                    onChange={(e) => setConvertForm({ ...convertForm, cnpjCpf: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    required
                    value={convertForm.valorEstimado}
                    onChange={(e) => setConvertForm({ ...convertForm, valorEstimado: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConvertLeadModal(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition-colors"
                >
                  Confirmar Conversão Atômica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOTIVO DE PERDA OBRIGATÓRIO */}
      {showPerdaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-lg font-bold text-slate-900">Motivo de Perda Obrigatório</h3>
              </div>
              <button onClick={() => setShowPerdaModal(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                &times;
              </button>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
              <p className="font-bold">Oportunidade: {showPerdaModal.codigo} - {showPerdaModal.titulo}</p>
              <p className="mt-0.5">O preenchimento do motivo de perda é estritamente obrigatório para encerramento comercial.</p>
            </div>

            <form onSubmit={handleFecharPerdida} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo Padronizado de Perda *</label>
                <select
                  required
                  value={perdaForm.motivoPerdaId}
                  onChange={(e) => setPerdaForm({ ...perdaForm, motivoPerdaId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                >
                  <option value="">Selecione o motivo oficial...</option>
                  {auxiliares.motivosPerda.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      [{m.categoria}] {m.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Concorrente Vencedor (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Metalúrgica Aliança, Usinagem São Pedro..."
                  value={perdaForm.concorrenteVencedor}
                  onChange={(e) => setPerdaForm({ ...perdaForm, concorrenteVencedor: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detalhes do Feedback do Cliente</label>
                <textarea
                  rows={3}
                  value={perdaForm.detalhesPerda}
                  onChange={(e) => setPerdaForm({ ...perdaForm, detalhesPerda: e.target.value })}
                  placeholder="Descreva o que faltou (ex: prazo de entrega 10 dias mais lento, diferença de R$ 15k no lote)..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPerdaModal(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!perdaForm.motivoPerdaId}
                  className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg shadow transition-colors"
                >
                  Confirmar Perda no Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO LEAD */}
      {showNovoLeadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">Novo Lead Industrial</h3>
              </div>
              <button onClick={() => setShowNovoLeadModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCriarLead} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nome do Contato *</label>
                  <input
                    type="text"
                    required
                    value={novoLeadForm.nomeContato}
                    onChange={(e) => setNovoLeadForm({ ...novoLeadForm, nomeContato: e.target.value })}
                    placeholder="Ex: Carlos Andrade"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Empresa Lead *</label>
                  <input
                    type="text"
                    required
                    value={novoLeadForm.empresaLead}
                    onChange={(e) => setNovoLeadForm({ ...novoLeadForm, empresaLead: e.target.value })}
                    placeholder="Ex: Usinagem Delta"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={novoLeadForm.email}
                    onChange={(e) => setNovoLeadForm({ ...novoLeadForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={novoLeadForm.telefone}
                    onChange={(e) => setNovoLeadForm({ ...novoLeadForm, telefone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    value={novoLeadForm.valorEstimado}
                    onChange={(e) => setNovoLeadForm({ ...novoLeadForm, valorEstimado: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Origem de Captação</label>
                  <select
                    value={novoLeadForm.origemId}
                    onChange={(e) => setNovoLeadForm({ ...novoLeadForm, origemId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">Selecione a origem...</option>
                    {auxiliares.origens.map((o: any) => (
                      <option key={o.id} value={o.id}>{o.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Necessidade Técnica / Notas</label>
                <textarea
                  rows={2}
                  value={novoLeadForm.notas}
                  onChange={(e) => setNovoLeadForm({ ...novoLeadForm, notas: e.target.value })}
                  placeholder="Ex: Corte laser de 30 chapas 19mm e caldeiraria de dutos..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNovoLeadModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition-colors"
                >
                  Salvar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVA OPORTUNIDADE */}
      {showNovaOptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">Nova Oportunidade Comercial</h3>
              </div>
              <button onClick={() => setShowNovaOptModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCriarOportunidade} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título da Proposta *</label>
                <input
                  type="text"
                  required
                  value={novaOptForm.titulo}
                  onChange={(e) => setNovaOptForm({ ...novaOptForm, titulo: e.target.value })}
                  placeholder="Ex: Fornecimento de 200 Flanges Usinadas SAE 1045"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cliente Vinculado</label>
                  <select
                    value={novaOptForm.clienteId}
                    onChange={(e) => setNovaOptForm({ ...novaOptForm, clienteId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">Selecione o cliente...</option>
                    {auxiliares.clientes.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.nomeFantasia || c.razaoSocial}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Etapa Inicial do Funil</label>
                  <select
                    value={novaOptForm.etapaId}
                    onChange={(e) => setNovaOptForm({ ...novaOptForm, etapaId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">Selecione a etapa...</option>
                    {auxiliares.etapasFunil.map((e: any) => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Valor Estimado (R$)</label>
                <input
                  type="number"
                  required
                  value={novaOptForm.valorEstimado}
                  onChange={(e) => setNovaOptForm({ ...novaOptForm, valorEstimado: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNovaOptModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition-colors"
                >
                  Salvar Oportunidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR ATIVIDADE */}
      {showNovaAtivModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">Registrar Contato / Atividade</h3>
              </div>
              <button onClick={() => setShowNovaAtivModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleRegistrarAtividade} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Interação</label>
                  <select
                    value={novaAtivForm.tipo}
                    onChange={(e) => setNovaAtivForm({ ...novaAtivForm, tipo: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="REUNIAO_ONLINE">Reunião Online (Teams/Meet)</option>
                    <option value="LIGACAO">Ligação Telefônica</option>
                    <option value="VISITA_TECNICA">Visita Técnica em Fábrica</option>
                    <option value="WHATSAPP">WhatsApp Comercial</option>
                    <option value="EMAIL">E-mail / Proposta Formal</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Oportunidade Vinculada</label>
                  <select
                    value={novaAtivForm.oportunidadeId}
                    onChange={(e) => setNovaAtivForm({ ...novaAtivForm, oportunidadeId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">Geral / Sem Oportunidade</option>
                    {oportunidades.map((o) => (
                      <option key={o.id} value={o.id}>[{o.codigo}] {o.titulo}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição do Assunto Tratado *</label>
                <textarea
                  rows={2}
                  required
                  value={novaAtivForm.descricao}
                  onChange={(e) => setNovaAtivForm({ ...novaAtivForm, descricao: e.target.value })}
                  placeholder="Ex: Alinhamento de prazos de entrega para os lotes de caldeiraria..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Resultado / Feedback da Conversa (Obrigatório) *</label>
                <textarea
                  rows={2}
                  required
                  value={novaAtivForm.resultado}
                  onChange={(e) => setNovaAtivForm({ ...novaAtivForm, resultado: e.target.value })}
                  placeholder="Ex: Cliente aceitou o preço e solicitou envio formal do contrato com prazo de 30 dias..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-emerald-50/50"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <span className="font-bold text-slate-800 block text-[11px]">Gerar Próxima Ação / Pendência (Follow-up)</span>
                <input
                  type="text"
                  placeholder="Ex: Enviar minuta comercial e comprovante de limite de crédito..."
                  value={novaAtivForm.proximaAcao}
                  onChange={(e) => setNovaAtivForm({ ...novaAtivForm, proximaAcao: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNovaAtivModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition-colors"
                >
                  Salvar Registro de Atividade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
