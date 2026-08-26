'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Send,
  Lock,
  Unlock,
  PhoneCall,
  Mail,
  MessageSquare,
  Building2,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Layers,
  ArrowRight,
  Sliders,
  Check,
  X,
  FileCheck2,
  FileSpreadsheet,
  PieChart,
} from 'lucide-react';
import { Empresa } from '../../../backend/core/types/company';
import { EmpresaRecord } from '../../../backend/modules/multi-tenant/types';
import {
  CentralCobrancaDashboardData,
  AgingClienteItem,
  GatilhoReguaCobranca,
  ReguaCobrancaConfig,
  LembreteCobranca,
  BloqueioComercialCliente,
  PromessaPagamento,
  HistoricoContatoCobranca,
  RenegociacaoDivida,
  ExposicaoCreditoCliente,
} from '../../../backend/modules/financeiro/cobranca-risco-types';
import { cobrancaRiscoService } from '../../../backend/modules/financeiro/cobranca-risco-service';

interface CentralCobrancaRiscoViewerProps {
  empresaAtiva: Empresa | EmpresaRecord;
}

export function CentralCobrancaRiscoViewer({ empresaAtiva }: CentralCobrancaRiscoViewerProps) {
  const [subTab, setSubTab] = useState<
    'fila' | 'aging' | 'bloqueios' | 'regua' | 'lembretes' | 'renegociacao' | 'promessas' | 'crm' | 'credito' | 'auditoria'
  >('fila');

  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null);

  const [dashboard, setDashboard] = useState<CentralCobrancaDashboardData | null>(null);
  const [reguaConfig, setReguaConfig] = useState<ReguaCobrancaConfig | null>(null);
  const [buscaTexto, setBuscaTexto] = useState('');

  // Modais de Ação
  const [modalContato, setModalContato] = useState<AgingClienteItem | null>(null);
  const [modalPromessa, setModalPromessa] = useState<AgingClienteItem | null>(null);
  const [modalBloqueio, setModalBloqueio] = useState<AgingClienteItem | null>(null);
  const [modalRenegociacao, setModalRenegociacao] = useState<AgingClienteItem | null>(null);
  const [modalLimite, setModalLimite] = useState<ExposicaoCreditoCliente | null>(null);
  const [modalLembreteManual, setModalLembreteManual] = useState<AgingClienteItem | null>(null);

  // Formulário de Contato CRM
  const [formContato, setFormContato] = useState({
    tipoContato: 'LIGACAO_TELEFONICA' as HistoricoContatoCobranca['tipoContato'],
    canal: 'LIGACAO' as HistoricoContatoCobranca['canal'],
    contatoNomeCliente: '',
    telefoneOuEmail: '',
    resumoConversa: '',
    sentimento: 'COOPERATIVO' as HistoricoContatoCobranca['sentimentoCliente'],
  });

  // Formulário de Promessa
  const [formPromessa, setFormPromessa] = useState({
    dataPrometida: '2026-08-30',
    valorPrometido: 0,
    formaPagamento: 'PIX' as PromessaPagamento['formaPagamentoPrevista'],
    contatoNome: '',
    contatoTelefoneOuEmail: '',
    observacoes: '',
    suspenderBloqueio: true,
  });

  // Formulário de Renegociação
  const [formRng, setFormRng] = useState({
    descontoPrincipal: 0,
    descontoJurosMulta: 0,
    valorEntrada: 0,
    quantidadeParcelas: 3,
    taxaJurosMensal: 0.8,
    intervaloDias: 30,
    primeiroVencimento: '2026-09-15',
    justificativa: '',
  });

  // Formulário de Limite de Crédito
  const [formLimite, setFormLimite] = useState({
    novoLimiteConcedido: 0,
    novoLimiteTemporario: 0,
    validadeTemporario: '',
    justificativa: '',
  });

  const carregarDados = useCallback(() => {
    setLoading(true);
    try {
      const data = cobrancaRiscoService.getCentralCobrancaDashboard(empresaAtiva.id);
      const reg = cobrancaRiscoService.getReguaConfig(empresaAtiva.id);
      setDashboard(data);
      setReguaConfig(reg);
    } catch (err: any) {
      setFeedback({ tipo: 'erro', msg: `Erro ao carregar dados: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [empresaAtiva.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarDados();
    }, 0);
    return () => clearTimeout(timer);
  }, [carregarDados]);

  const handleExecutarRegua = () => {
    setActionLoading(true);
    try {
      const res = cobrancaRiscoService.processarExecucaoReguaAutomatica(
        empresaAtiva.id,
        'u1111111-1111-1111-1111-111111111111',
        'Carlos Eduardo (Gerente Financeiro)'
      );
      setFeedback({
        tipo: 'sucesso',
        msg: `Régua executada com sucesso! ${res.lembretesCriados} lembretes gerados e ${res.bloqueiosGerados} bloqueios automáticos aplicados.`,
      });
      carregarDados();
    } catch (err: any) {
      setFeedback({ tipo: 'erro', msg: `Erro ao executar régua: ${err.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSalvarRegua = () => {
    if (!reguaConfig) return;
    setActionLoading(true);
    try {
      cobrancaRiscoService.salvarReguaConfig(
        empresaAtiva.id,
        reguaConfig,
        'u1111111-1111-1111-1111-111111111111',
        'Carlos Eduardo'
      );
      setFeedback({ tipo: 'sucesso', msg: 'Parâmetros da régua de cobrança salvos com trilha de auditoria.' });
      carregarDados();
    } catch (err: any) {
      setFeedback({ tipo: 'erro', msg: `Erro ao salvar régua: ${err.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSalvarContato = () => {
    if (!modalContato) return;
    setActionLoading(true);
    try {
      cobrancaRiscoService.registrarContatoCobranca(empresaAtiva.id, {
        clienteId: modalContato.clienteId,
        clienteNome: modalContato.clienteNome,
        cnpjCpf: modalContato.cnpjCpf,
        tipoContato: formContato.tipoContato,
        canal: formContato.canal,
        contatoNomeCliente: formContato.contatoNomeCliente || 'Contato Financeiro',
        telefoneOuEmailUtilizado: formContato.telefoneOuEmail || '(54) 9999-8888',
        resumoConversa: formContato.resumoConversa,
        sentimentoCliente: formContato.sentimento,
        gerouPromessaPagamento: false,
        operadorUsuarioId: 'u1111111-1111-1111-1111-111111111111',
        operadorUsuarioNome: 'Carlos Eduardo (Gerente Financeiro)',
      });
      setFeedback({ tipo: 'sucesso', msg: 'Contato registrado no CRM de cobrança com sucesso.' });
      setModalContato(null);
      carregarDados();
    } catch (err: any) {
      setFeedback({ tipo: 'erro', msg: `Erro: ${err.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSalvarPromessa = () => {
    if (!modalPromessa) return;
    setActionLoading(true);
    try {
      cobrancaRiscoService.registrarPromessaPagamento(empresaAtiva.id, {
        clienteId: modalPromessa.clienteId,
        clienteNome: modalPromessa.clienteNome,
        cnpjCpf: modalPromessa.cnpjCpf,
        dataPrometida: formPromessa.dataPrometida,
        valorPrometido: formPromessa.valorPrometido || modalPromessa.totalVencido,
        formaPagamentoPrevista: formPromessa.formaPagamento,
        contatoNome: formPromessa.contatoNome || 'Contato Autorizado',
        contatoTelefoneOuEmail: formPromessa.contatoTelefoneOuEmail || '(54) 3322-1100',
        observacoes: formPromessa.observacoes,
        suspenderBloqueio: formPromessa.suspenderBloqueio,
        titulosVinculados: [
          {
            contaReceberId: `cr-${modalPromessa.clienteId}-venc`,
            numeroDocumento: 'Títulos em Atraso',
            numeroParcela: 1,
            valorOriginal: modalPromessa.totalVencido,
            valorSaldoRestante: modalPromessa.totalVencido,
          },
        ],
        usuarioId: 'u1111111-1111-1111-1111-111111111111',
        usuarioNome: 'Carlos Eduardo (Gerente Financeiro)',
      });
      setFeedback({ tipo: 'sucesso', msg: 'Promessa de pagamento registrada! Bloqueio suspenso temporariamente.' });
      setModalPromessa(null);
      carregarDados();
    } catch (err: any) {
      setFeedback({ tipo: 'erro', msg: `Erro: ${err.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEfetivarRenegociacao = () => {
    if (!modalRenegociacao) return;
    setActionLoading(true);
    try {
      const res = cobrancaRiscoService.efetivarRenegociacao(empresaAtiva.id, {
        clienteId: modalRenegociacao.clienteId,
        clienteNome: modalRenegociacao.clienteNome,
        cnpjCpf: modalRenegociacao.cnpjCpf,
        titulosOrigem: [
          {
            contaReceberId: `cr-${modalRenegociacao.clienteId}-rng`,
            numeroDocumento: 'NF-e Consolidada',
            numeroParcela: 1,
            dataVencimentoOriginal: '2026-07-20',
            diasAtraso: modalRenegociacao.diasMaiorAtraso,
            valorOriginal: modalRenegociacao.totalVencido,
            valorJurosOriginal: Number((modalRenegociacao.totalVencido * 0.03).toFixed(2)),
            valorMultaOriginal: Number((modalRenegociacao.totalVencido * 0.02).toFixed(2)),
            valorSaldoOriginal: modalRenegociacao.totalVencido,
          },
        ],
        descontoPrincipal: formRng.descontoPrincipal,
        descontoJurosMulta: formRng.descontoJurosMulta,
        valorEntrada: formRng.valorEntrada,
        dataVencimentoEntrada: '2026-08-28',
        quantidadeParcelas: formRng.quantidadeParcelas,
        intervaloDiasParcelas: formRng.intervaloDias,
        taxaJurosParcelamentoMensal: formRng.taxaJurosMensal,
        primeiroVencimentoParcelas: formRng.primeiroVencimento,
        justificativaComercial: formRng.justificativa || 'Acordo de renegociação firmado com entrada e parcelamento.',
        usuarioId: 'u1111111-1111-1111-1111-111111111111',
        usuarioNome: 'Carlos Eduardo (Gerente Financeiro)',
      });
      setFeedback({
        tipo: 'sucesso',
        msg: `Acordo ${res.codigoAcordo} efetivado! Títulos originais marcados como RENEGOCIADO com auditoria.`,
      });
      setModalRenegociacao(null);
      carregarDados();
    } catch (err: any) {
      setFeedback({ tipo: 'erro', msg: `Erro: ${err.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSalvarLimite = () => {
    if (!modalLimite) return;
    setActionLoading(true);
    try {
      cobrancaRiscoService.alterarLimiteCredito(empresaAtiva.id, {
        clienteId: modalLimite.clienteId,
        clienteNome: modalLimite.clienteNome,
        cnpjCpf: modalLimite.cnpjCpf,
        novoLimiteConcedido: formLimite.novoLimiteConcedido,
        novoLimiteTemporario: formLimite.novoLimiteTemporario,
        validadeLimiteTemporario: formLimite.validadeTemporario,
        justificativa: formLimite.justificativa || 'Revisão periódica de crédito aprovada.',
        usuarioId: 'u1111111-1111-1111-1111-111111111111',
        usuarioNome: 'Carlos Eduardo (Gerente Financeiro)',
      });
      setFeedback({ tipo: 'sucesso', msg: 'Limite de crédito atualizado com registro em trilha de auditoria.' });
      setModalLimite(null);
      carregarDados();
    } catch (err: any) {
      setFeedback({ tipo: 'erro', msg: `Erro: ${err.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDesbloquear = (bloqueioId: string, tipo: 'DEFINITIVA' | 'TEMPORARIA_EXCEPCIONAL') => {
    const just = prompt('Informe a justificativa obrigatória para auditoria de desbloqueio:');
    if (!just) return;
    setActionLoading(true);
    try {
      cobrancaRiscoService.desbloquearCliente(empresaAtiva.id, {
        bloqueioId,
        tipoLiberacao: tipo,
        justificativa: just,
        usuarioId: 'u1111111-1111-1111-1111-111111111111',
        usuarioNome: 'Carlos Eduardo (Gerente Financeiro)',
      });
      setFeedback({ tipo: 'sucesso', msg: 'Desbloqueio registrado na trilha de auditoria com sucesso.' });
      carregarDados();
    } catch (err: any) {
      setFeedback({ tipo: 'erro', msg: `Erro: ${err.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnviarLembreteManual = () => {
    if (!modalLembreteManual) return;
    setActionLoading(true);
    try {
      cobrancaRiscoService.enviarLembreteManual(empresaAtiva.id, {
        clienteId: modalLembreteManual.clienteId,
        clienteNome: modalLembreteManual.clienteNome,
        clienteCnpjCpf: modalLembreteManual.cnpjCpf,
        contaReceberId: `cr-${modalLembreteManual.clienteId}`,
        numeroDocumento: 'Extrato Débitos em Aberto',
        numeroParcela: 1,
        valorTotalLiquido: modalLembreteManual.totalVencido || modalLembreteManual.totalGeral,
        dataVencimento: '2026-08-26',
        canal: 'WHATSAPP',
        assunto: 'Aviso de Cobrança e Regularização Financeira',
        conteudoMensagem: `Olá ${modalLembreteManual.clienteNome}, identificamos débitos pendentes de R$ ${(modalLembreteManual.totalVencido || modalLembreteManual.totalGeral).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Por favor, regularize via PIX ou solicite segunda via.`,
        usuarioId: 'u1111111-1111-1111-1111-111111111111',
        usuarioNome: 'Carlos Eduardo (Gerente Financeiro)',
      });
      setFeedback({ tipo: 'sucesso', msg: 'Lembrete manual enviado com sucesso via WhatsApp/E-mail.' });
      setModalLembreteManual(null);
      carregarDados();
    } catch (err: any) {
      setFeedback({ tipo: 'erro', msg: `Erro: ${err.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !dashboard) {
    return (
      <div className="p-8 flex items-center justify-center text-slate-500 gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
        Carregando Central de Cobrança & Risco...
      </div>
    );
  }

  const clientesFiltrados = (dashboard?.filaCobrancaPriorizada || []).filter((c) =>
    c.clienteNome.toLowerCase().includes(buscaTexto.toLowerCase()) || c.cnpjCpf.includes(buscaTexto)
  );

  return (
    <div className="space-y-6">
      {/* Header Central de Cobrança */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-rose-300 uppercase">
              Módulo Financeiro & Risco Industrial
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Central de Cobrança & Gestão de Risco</h2>
          <p className="text-slate-300 text-xs mt-1">
            Empresa Ativa: <span className="font-bold text-white">{empresaAtiva.nomeFantasia}</span> ({empresaAtiva.cnpj}) — Régua Parametrizável, Aging List, Bloqueios e Exposição Total
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExecutarRegua}
            disabled={actionLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Executar Régua Automática
          </button>
          <button
            onClick={carregarDados}
            disabled={actionLoading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
            title="Recarregar dados"
          >
            <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between ${
            feedback.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.tipo === 'sucesso' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-500 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPIs Estratégicos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total a Receber</span>
          <span className="text-lg font-extrabold text-slate-900 font-mono mt-1 block">
            R$ {(dashboard?.totalCarteiraReceber || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">DSO Médio: {dashboard?.dsoMedioDias || 38} dias</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">Inadimplência (Atraso)</span>
          <span className="text-lg font-extrabold text-rose-600 font-mono mt-1 block">
            R$ {(dashboard?.totalVencidoInadimplente || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-rose-500 font-semibold mt-1 block">
            Taxa: {dashboard?.percentualInadimplencia || 0}% da carteira
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Provisão PDD</span>
          <span className="text-lg font-extrabold text-amber-700 font-mono mt-1 block">
            R$ {(dashboard?.pddTotalEstimada || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Risco Ponderado por Faixa</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">Promessas Ativas</span>
          <span className="text-lg font-extrabold text-indigo-700 font-mono mt-1 block">
            {dashboard?.promessasPagamentoAtivasQtd || 0}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            R$ {(dashboard?.promessasPagamentoAtivasValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">Clientes Bloqueados</span>
          <span className="text-lg font-extrabold text-rose-700 font-mono mt-1 block">
            {dashboard?.clientesBloqueadosTotal || 0}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Faturamento e pedidos travados</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Renegociações</span>
          <span className="text-lg font-extrabold text-emerald-700 font-mono mt-1 block">
            {dashboard?.renegociacoesVigentesQtd || 0}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            R$ {(dashboard?.renegociacoesVigentesValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Sub-Navegação */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 gap-1 overflow-x-auto">
        {[
          { id: 'fila', label: 'Fila de Cobrança Diária', icon: PhoneCall },
          { id: 'aging', label: 'Aging List & PDD', icon: PieChart },
          { id: 'bloqueios', label: 'Bloqueios Comerciais', icon: Lock },
          { id: 'regua', label: 'Régua & Regras (-7d, -2d, Venc, Atraso)', icon: Sliders },
          { id: 'lembretes', label: 'Lembretes Enviados', icon: Mail },
          { id: 'renegociacao', label: 'Renegociação & Acordos', icon: FileCheck2 },
          { id: 'promessas', label: 'Promessas de Pagamento', icon: Calendar },
          { id: 'crm', label: 'Histórico de Contato (CRM)', icon: MessageSquare },
          { id: 'credito', label: 'Crédito & Exposição Atual/Futura', icon: CreditCard },
          { id: 'auditoria', label: 'Auditoria Append-Only', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                isActive ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Conteúdo das Abas */}
      <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-6">
        {/* ABA 1: FILA DE COBRANÇA */}
        {subTab === 'fila' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar devedor por Razão Social ou CNPJ..."
                  value={buscaTexto}
                  onChange={(e) => setBuscaTexto(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <span className="text-xs text-slate-500">
                Mostrando <b>{clientesFiltrados.length}</b> clientes na fila priorizada
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Cliente / CNPJ</th>
                    <th className="py-3 px-4">Status Bloqueio</th>
                    <th className="py-3 px-4">Maior Atraso</th>
                    <th className="py-3 px-4 text-right">Vencido (R$)</th>
                    <th className="py-3 px-4 text-right">A Vencer (R$)</th>
                    <th className="py-3 px-4 text-right">Exposição Total</th>
                    <th className="py-3 px-4">Ação Sugerida</th>
                    <th className="py-3 px-4 text-center">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientesFiltrados.map((cli) => (
                    <tr key={cli.clienteId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div>{cli.clienteNome}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{cli.cnpjCpf}</div>
                      </td>
                      <td className="py-3 px-4">
                        {cli.statusBloqueio === 'ATIVO' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            BLOQUEADO
                          </span>
                        ) : cli.statusBloqueio === 'SUSPENSO_POR_PROMESSA' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            SUSPENSO P/ PROMESSA
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            LIBERADO
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {cli.diasMaiorAtraso > 0 ? (
                          <span className={cli.diasMaiorAtraso > 30 ? 'text-rose-600' : 'text-amber-600'}>
                            {cli.diasMaiorAtraso} dias
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-normal">Em dia</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        R$ {cli.totalVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        R$ {cli.totalAVencer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-900">
                        R$ {cli.exposicaoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-indigo-700 font-medium">{cli.proximaAcaoSugerida}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setModalContato(cli);
                              setFormContato((prev) => ({ ...prev, contatoNomeCliente: cli.clienteNome }));
                            }}
                            title="Registrar Contato no CRM"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setModalPromessa(cli);
                              setFormPromessa((prev) => ({ ...prev, valorPrometido: cli.totalVencido }));
                            }}
                            title="Registrar Promessa de Pagamento"
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setModalRenegociacao(cli);
                              setFormRng((prev) => ({ ...prev, valorEntrada: Number((cli.totalVencido * 0.3).toFixed(2)) }));
                            }}
                            title="Simular Renegociação"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setModalLembreteManual(cli)}
                            title="Enviar Lembrete WhatsApp / E-mail"
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 2: AGING LIST */}
        {subTab === 'aging' && dashboard?.aging && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {dashboard.aging.faixas.map((f) => (
                <div key={f.faixa} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">{f.label}</span>
                  <span className="text-sm font-bold text-slate-900 font-mono mt-1 block">
                    R$ {f.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>{f.percentualTotal}% total</span>
                    <span className="text-amber-700 font-semibold">PDD: {f.taxaPddPerc}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4 text-right">A Vencer &gt;30d</th>
                    <th className="py-3 px-4 text-right">A Vencer 1-30d</th>
                    <th className="py-3 px-4 text-right">1-30d</th>
                    <th className="py-3 px-4 text-right">31-60d</th>
                    <th className="py-3 px-4 text-right">61-90d</th>
                    <th className="py-3 px-4 text-right">91-120d</th>
                    <th className="py-3 px-4 text-right">&gt;120d (PDD 70%)</th>
                    <th className="py-3 px-4 text-right font-bold">Total Geral</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {dashboard.aging.clientes.map((c) => (
                    <tr key={c.clienteId} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-sans font-semibold text-slate-900">{c.clienteNome}</td>
                      <td className="py-3 px-4 text-right text-slate-600">R$ {c.valoresPorFaixa.aVencerMais30.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right text-slate-600">R$ {c.valoresPorFaixa.aVencer1a30.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right text-amber-600">R$ {c.valoresPorFaixa.vencido1a30.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right text-amber-700">R$ {c.valoresPorFaixa.vencido31a60.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right text-rose-600">R$ {c.valoresPorFaixa.vencido61a90.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right text-rose-700">R$ {c.valoresPorFaixa.vencido91a120.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right text-rose-900 font-bold">R$ {c.valoresPorFaixa.vencidoMais120.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">R$ {c.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 3: BLOQUEIOS COMERCIAIS */}
        {subTab === 'bloqueios' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Bloqueios Comerciais e de Faturamento Ativos</h3>
              <span className="text-xs text-slate-500">Bloqueios automáticos por atraso/limite ou manuais</span>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Cliente / CNPJ</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Motivo</th>
                    <th className="py-3 px-4">Inadimplente / Exposição</th>
                    <th className="py-3 px-4">Data do Bloqueio</th>
                    <th className="py-3 px-4 text-center">Desbloqueio / Liberação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(dashboard?.bloqueiosAtivos || []).map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div>{b.clienteNome}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{b.cnpjCpf}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{b.motivo}</div>
                        <div className="text-[11px] text-slate-500">{b.detalhesMotivo}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div>Inadimplente: R$ {(b.valorInadimplente || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <div className="text-slate-500">Exposição: R$ {(b.exposicaoNoMomento || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{b.bloqueadoEm.substring(0, 10)}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDesbloquear(b.id, 'DEFINITIVA')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                          >
                            Desbloquear Total
                          </button>
                          <button
                            onClick={() => handleDesbloquear(b.id, 'TEMPORARIA_EXCEPCIONAL')}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold"
                          >
                            Liberação Temporária
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(dashboard?.bloqueiosAtivos || []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        Nenhum cliente bloqueado no momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 4: RÉGUA DE COBRANÇA PARAMETRIZÁVEL */}
        {subTab === 'regua' && reguaConfig && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Parametrização da Régua de Cobrança Industrial</h3>
                <p className="text-xs text-slate-500">
                  Gatilhos de 7 dias antes, 2 dias antes, vencimento e atraso (+3d, +7d, +15d, +30d) customizáveis por empresa.
                </p>
              </div>
              <button
                onClick={handleSalvarRegua}
                disabled={actionLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                Salvar Parâmetros da Régua
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tolerância Antes do Bloqueio (Dias)</label>
                <input
                  type="number"
                  value={reguaConfig.diasToleranciaAntesBloqueio}
                  onChange={(e) => setReguaConfig({ ...reguaConfig, diasToleranciaAntesBloqueio: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Juros Mora Mensal (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={reguaConfig.jurosMoraMensalPerc}
                  onChange={(e) => setReguaConfig({ ...reguaConfig, jurosMoraMensalPerc: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Multa por Atraso (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={reguaConfig.multaAtrasoPerc}
                  onChange={(e) => setReguaConfig({ ...reguaConfig, multaAtrasoPerc: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Gatilhos Configurados da Régua</h4>
              {reguaConfig.gatilhos.map((g, idx) => (
                <div key={g.id} className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        {g.diasRelativoVencimento < 0
                          ? `${Math.abs(g.diasRelativoVencimento)} dias antes`
                          : g.diasRelativoVencimento === 0
                          ? 'No Vencimento (D-0)'
                          : `+${g.diasRelativoVencimento} dias de atraso`}
                      </span>
                      <span className="font-bold text-xs text-slate-900">{g.nomeRegra}</span>
                      {g.acaoAutomaticaBloqueio && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                          Bloqueio Automático
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">{g.descricao}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate max-w-xl">Template: {g.templateMensagem}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 font-semibold">Canais: {g.canaisHabilitados.join(', ')}</span>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={g.ativo}
                        onChange={(e) => {
                          const novosGatilhos = [...reguaConfig.gatilhos];
                          novosGatilhos[idx].ativo = e.target.checked;
                          setReguaConfig({ ...reguaConfig, gatilhos: novosGatilhos });
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      Ativo
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 5: LEMBRETES ENVIADOS */}
        {subTab === 'lembretes' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Histórico de Lembretes e Disparos de Cobrança</h3>
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Data/Hora</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Documento / Parcela</th>
                    <th className="py-3 px-4">Canal</th>
                    <th className="py-3 px-4">Regra / Gatilho</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(dashboard?.lembretesDisparadosHoje ? cobrancaRiscoService.getLembretes(empresaAtiva.id) : []).map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-500">{l.createdAt.substring(0, 16).replace('T', ' ')}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{l.clienteNome}</td>
                      <td className="py-3 px-4 text-slate-700 font-mono">{l.numeroDocumento}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {l.canal}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{l.nomeRegraGatilho}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        R$ {l.valorTotalLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 6: RENEGOCIAÇÃO & ACORDOS */}
        {subTab === 'renegociacao' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Acordos de Renegociação de Dívidas Efetivados</h3>
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Código Acordo</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4 text-right">Dívida Original</th>
                    <th className="py-3 px-4 text-right">Descontos Concedidos</th>
                    <th className="py-3 px-4 text-right">Valor Final Acordado</th>
                    <th className="py-3 px-4">Condição de Pagamento</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {(dashboard?.renegociacoesRecentes || []).map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-indigo-700 font-sans">{r.codigoAcordo}</td>
                      <td className="py-3 px-4 font-sans font-semibold text-slate-900">{r.clienteNome}</td>
                      <td className="py-3 px-4 text-right text-slate-600">R$ {r.totalDividaBruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-bold">- R$ {r.totalDescontoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right text-slate-900 font-bold">R$ {r.valorFinalAcordado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 font-sans text-slate-700">
                        Entrada de R$ {r.valorEntrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + {r.quantidadeParcelas}x
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 7: PROMESSAS DE PAGAMENTO */}
        {subTab === 'promessas' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Controle de Promessas de Pagamento Firmadas</h3>
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Data Prometida</th>
                    <th className="py-3 px-4 text-right">Valor Prometido</th>
                    <th className="py-3 px-4">Forma</th>
                    <th className="py-3 px-4">Contato / Telefone</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(dashboard?.promessasRecentes || []).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.clienteNome}</td>
                      <td className="py-3 px-4 font-bold text-indigo-600">{p.dataPrometida}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        R$ {p.valorPrometido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{p.formaPagamentoPrevista}</td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{p.contatoNome}</div>
                        <div className="text-[10px] text-slate-400">{p.contatoTelefoneOuEmail}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'CUMPRIDA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'QUEBRADA'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.status === 'PENDENTE' && (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                cobrancaRiscoService.resolverPromessa(empresaAtiva.id, {
                                  promessaId: p.id,
                                  status: 'CUMPRIDA',
                                  valorPago: p.valorPrometido,
                                  usuarioId: 'u1111111-1111-1111-1111-111111111111',
                                  usuarioNome: 'Carlos Eduardo',
                                });
                                carregarDados();
                              }}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold"
                            >
                              Baixar Cumprida
                            </button>
                            <button
                              onClick={() => {
                                cobrancaRiscoService.resolverPromessa(empresaAtiva.id, {
                                  promessaId: p.id,
                                  status: 'QUEBRADA',
                                  motivo: 'Cliente não efetuou pagamento no prazo.',
                                  usuarioId: 'u1111111-1111-1111-1111-111111111111',
                                  usuarioNome: 'Carlos Eduardo',
                                });
                                carregarDados();
                              }}
                              className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-bold"
                            >
                              Marcar Quebra
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 8: CRM & HISTÓRICO DE CONTATOS */}
        {subTab === 'crm' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Timeline de Contatos & Ações de Cobrança (CRM)</h3>
            <div className="space-y-3">
              {(dashboard?.contatosRecentes || []).map((cnt) => (
                <div key={cnt.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        {cnt.tipoContato}
                      </span>
                      <span className="font-bold text-xs text-slate-900">{cnt.clienteNome}</span>
                      <span className="text-[10px] text-slate-400">({cnt.contatoNomeCliente})</span>
                    </div>
                    <span className="text-[11px] text-slate-500">{cnt.dataHora.substring(0, 16).replace('T', ' ')}</span>
                  </div>
                  <p className="text-xs text-slate-700 mb-2">{cnt.resumoConversa}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200 pt-2">
                    <span>Operador: <b>{cnt.operadorUsuarioNome}</b></span>
                    <span>Sentimento: <b className="text-slate-800">{cnt.sentimentoCliente}</b></span>
                    {cnt.dataProximoFollowUp && <span>Follow-up: <b className="text-indigo-600">{cnt.dataProximoFollowUp.substring(0, 10)}</b></span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 9: CRÉDITO & EXPOSIÇÃO ATUAL / FUTURA */}
        {subTab === 'credito' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Gestão de Limite de Crédito & Exposição Multiempresa</h3>
                <p className="text-xs text-slate-500">
                  Cálculo obrigatório: Exposição Atual (títulos faturados) + Exposição Futura (pedidos aprovados em carteira/produção) vs Limite Concedido
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboard?.aging.clientes.map((c) => {
                const exp = cobrancaRiscoService.calcularExposicaoCredito(empresaAtiva.id, c.clienteId, c.clienteNome, c.cnpjCpf);
                const perc = exp.percentualUtilizacaoLimite;
                return (
                  <div key={c.clienteId} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{exp.clienteNome}</h4>
                        <span className="text-[10px] text-slate-500 font-mono">{exp.cnpjCpf}</span>
                      </div>
                      <button
                        onClick={() => {
                          setModalLimite(exp);
                          setFormLimite({
                            novoLimiteConcedido: exp.limiteConcedido,
                            novoLimiteTemporario: exp.limiteTemporario,
                            validadeTemporario: exp.validadeLimiteTemporario || '',
                            justificativa: '',
                          });
                        }}
                        className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold"
                      >
                        Ajustar Limite
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-600">Utilização de Crédito:</span>
                        <span className={`font-bold font-mono ${perc > 100 ? 'text-rose-600' : 'text-slate-900'}`}>{perc}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${perc > 100 ? 'bg-rose-600' : perc > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, perc)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-400 block uppercase">Limite Total</span>
                        <span className="font-bold font-mono text-slate-900">
                          R$ {exp.limiteTotalEfetivo.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-400 block uppercase">Exposição Total</span>
                        <span className="font-bold font-mono text-slate-900">
                          R$ {exp.exposicaoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-400 block uppercase">Disponível</span>
                        <span className={`font-bold font-mono ${exp.limiteDisponivel < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          R$ {exp.limiteDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 flex justify-between border-t border-slate-200 pt-2">
                      <span>Exposição Atual (Faturado): <b>R$ {exp.exposicaoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></span>
                      <span>Exposição Futura (Pedidos): <b>R$ {exp.exposicaoFutura.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ABA 10: AUDITORIA */}
        {subTab === 'auditoria' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Trilha de Auditoria Append-Only (Não-Destrutiva)</h3>
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Data/Hora</th>
                    <th className="py-3 px-4">Usuário</th>
                    <th className="py-3 px-4">Módulo</th>
                    <th className="py-3 px-4">Ação</th>
                    <th className="py-3 px-4">Cliente / Entidade</th>
                    <th className="py-3 px-4">Justificativa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(dashboard?.auditoriaRecente || []).map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-500 font-mono">{a.dataHora.substring(0, 19).replace('T', ' ')}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{a.usuarioNome}</td>
                      <td className="py-3 px-4 text-slate-600">{a.modulo}</td>
                      <td className="py-3 px-4 font-bold text-indigo-700">{a.acao}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{a.clienteNome || a.entidadeId}</td>
                      <td className="py-3 px-4 text-slate-600">{a.justificativa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: REGISTRAR CONTATO CRM */}
      {modalContato && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Registrar Contato de Cobrança — {modalContato.clienteNome}</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Contato</label>
                <select
                  value={formContato.tipoContato}
                  onChange={(e) => setFormContato({ ...formContato, tipoContato: e.target.value as any })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="LIGACAO_TELEFONICA">Ligação Telefônica</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EMAIL_MANUAL">E-mail Manual</option>
                  <option value="REUNIAO_PRESENCIAL">Reunião Presencial</option>
                  <option value="NOTIFICACAO_EXTRAJUDICIAL">Notificação Extrajudicial</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Contato no Cliente</label>
                <input
                  type="text"
                  value={formContato.contatoNomeCliente}
                  onChange={(e) => setFormContato({ ...formContato, contatoNomeCliente: e.target.value })}
                  placeholder="Ex: Sra. Maria (Gerente Financeiro)"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Resumo da Conversa</label>
                <textarea
                  rows={3}
                  value={formContato.resumoConversa}
                  onChange={(e) => setFormContato({ ...formContato, resumoConversa: e.target.value })}
                  placeholder="Descreva os pontos acordados..."
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalContato(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
                Cancelar
              </button>
              <button onClick={handleSalvarContato} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold">
                Salvar no CRM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: NOVA PROMESSA */}
      {modalPromessa && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Registrar Promessa de Pagamento — {modalPromessa.clienteNome}</h3>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data Prometida</label>
                  <input
                    type="date"
                    value={formPromessa.dataPrometida}
                    onChange={(e) => setFormPromessa({ ...formPromessa, dataPrometida: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor Prometido (R$)</label>
                  <input
                    type="number"
                    value={formPromessa.valorPrometido}
                    onChange={(e) => setFormPromessa({ ...formPromessa, valorPrometido: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Forma de Pagamento</label>
                <select
                  value={formPromessa.formaPagamento}
                  onChange={(e) => setFormPromessa({ ...formPromessa, formaPagamento: e.target.value as any })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="PIX">PIX (Chave EMV)</option>
                  <option value="BOLETO">Boleto Bancário</option>
                  <option value="TED">TED / Transferência</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={formPromessa.observacoes}
                  onChange={(e) => setFormPromessa({ ...formPromessa, observacoes: e.target.value })}
                  placeholder="Informações adicionais..."
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formPromessa.suspenderBloqueio}
                  onChange={(e) => setFormPromessa({ ...formPromessa, suspenderBloqueio: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Suspender Bloqueio Comercial até a data da promessa
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalPromessa(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
                Cancelar
              </button>
              <button onClick={handleSalvarPromessa} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold">
                Efetivar Promessa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SIMULADOR DE RENEGOCIAÇÃO */}
      {modalRenegociacao && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Simulador de Renegociação de Dívida — {modalRenegociacao.clienteNome}</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between font-mono">
                <span>Dívida em Atraso: <b>R$ {modalRenegociacao.totalVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></span>
                <span>Maior Atraso: <b>{modalRenegociacao.diasMaiorAtraso} dias</b></span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Entrada (R$)</label>
                  <input
                    type="number"
                    value={formRng.valorEntrada}
                    onChange={(e) => setFormRng({ ...formRng, valorEntrada: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Qtd Parcelas Restantes</label>
                  <input
                    type="number"
                    value={formRng.quantidadeParcelas}
                    onChange={(e) => setFormRng({ ...formRng, quantidadeParcelas: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Desconto Concedido em Juros (R$)</label>
                  <input
                    type="number"
                    value={formRng.descontoJurosMulta}
                    onChange={(e) => setFormRng({ ...formRng, descontoJurosMulta: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Taxa Juros Parcelamento (%/mês)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formRng.taxaJurosMensal}
                    onChange={(e) => setFormRng({ ...formRng, taxaJurosMensal: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Justificativa Comercial (Obrigatória para Auditoria)</label>
                <textarea
                  rows={2}
                  value={formRng.justificativa}
                  onChange={(e) => setFormRng({ ...formRng, justificativa: e.target.value })}
                  placeholder="Justificativa da alçada..."
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalRenegociacao(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
                Cancelar
              </button>
              <button onClick={handleEfetivarRenegociacao} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold">
                Efetivar Acordo Não-Destrutivo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: AJUSTAR LIMITE */}
      {modalLimite && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Ajuste de Limite de Crédito — {modalLimite.clienteNome}</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Novo Limite Concedido (R$)</label>
                <input
                  type="number"
                  value={formLimite.novoLimiteConcedido}
                  onChange={(e) => setFormLimite({ ...formLimite, novoLimiteConcedido: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Limite Temporário Excepcional (R$)</label>
                <input
                  type="number"
                  value={formLimite.novoLimiteTemporario}
                  onChange={(e) => setFormLimite({ ...formLimite, novoLimiteTemporario: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Justificativa da Alteração</label>
                <textarea
                  rows={2}
                  value={formLimite.justificativa}
                  onChange={(e) => setFormLimite({ ...formLimite, justificativa: e.target.value })}
                  placeholder="Justificativa de governança..."
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalLimite(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
                Cancelar
              </button>
              <button onClick={handleSalvarLimite} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold">
                Salvar Limite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: LEMBRETE MANUAL */}
      {modalLembreteManual && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Disparar Lembrete Manual — {modalLembreteManual.clienteNome}</h3>
            <p className="text-xs text-slate-600">
              Será gerada uma mensagem contendo a chave PIX Copia e Cola e link do boleto para quitação do saldo devedor.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalLembreteManual(null)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
                Cancelar
              </button>
              <button onClick={handleEnviarLembreteManual} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                Confirmar Disparo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
