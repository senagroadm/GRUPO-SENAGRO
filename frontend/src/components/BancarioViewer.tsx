'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Receipt,
  QrCode,
  Send,
  RefreshCw,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Search,
  Plus,
  ArrowUpDown,
  Download,
  FileText,
  DollarSign,
  Landmark,
  ShieldCheck,
  Ban,
  Calendar,
  Layers,
  ChevronRight,
  Printer,
  History,
  Edit3,
  Mail,
  Wallet,
  XCircle,
  HelpCircle,
  AlertTriangle,
  ArrowRightLeft,
} from 'lucide-react';
import { Empresa } from '../../../backend/core/types/company';
import {
  Cobranca,
  ContaBancaria,
  Caixa,
  ConfiguracaoCobranca,
  CobrancaEvento,
  MovimentoFinanceiro,
  TipoCobranca,
  StatusCobranca,
  ProviderType,
} from '../../../backend/modules/bancario/bancario-types';
import { bancarioService } from '../../../backend/modules/bancario/bancario-service';
import { ConciliacaoBancariaViewer } from './ConciliacaoBancariaViewer';

interface BancarioViewerProps {
  empresaAtiva: Empresa;
}

export function BancarioViewer({ empresaAtiva }: BancarioViewerProps) {
  // Tabs internas
  const [subTab, setSubTab] = useState<'cobrancas' | 'conciliacao' | 'contas' | 'extrato' | 'configs' | 'docs'>('conciliacao');

  // Estados dos dados da empresa
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [configs, setConfigs] = useState<ConfiguracaoCobranca[]>([]);
  const [movimentos, setMovimentos] = useState<MovimentoFinanceiro[]>([]);
  const [eventos, setEventos] = useState<CobrancaEvento[]>([]);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modais
  const [modalBoleto, setModalBoleto] = useState<Cobranca | null>(null);
  const [modalNovaCobranca, setModalNovaCobranca] = useState(false);
  const [modalAlterar, setModalAlterar] = useState<Cobranca | null>(null);
  const [modalBaixar, setModalBaixar] = useState<Cobranca | null>(null);
  const [modalEmail, setModalEmail] = useState<Cobranca | null>(null);
  const [modalEventos, setModalEventos] = useState<Cobranca | null>(null);
  const [modalNovaConta, setModalNovaConta] = useState(false);

  // Form states
  const [novaCobrancaForm, setNovaCobrancaForm] = useState({
    contaBancariaId: '',
    seuNumero: '',
    tipoCobranca: 'BOLETO_HIBRIDO' as TipoCobranca,
    valorNominal: 5000,
    dataVencimento: '2026-09-15',
    pagadorNome: 'TUPY S.A. Fundição & Metalurgia',
    pagadorCnpjCpf: '84.683.457/0001-70',
    pagadorEmail: 'contas@tupy.com.br',
    pagadorTelefone: '(47) 4009-8111',
    pagadorEnderecoCompleto: 'Rua Albano Schmidt, 3400 - Boa Vista',
    pagadorCep: '89206-900',
    pagadorCidade: 'Joinville',
    pagadorUf: 'SC',
    registrarAutomatico: true,
  });

  const [alterarForm, setAlterarForm] = useState({
    novoVencimento: '',
    novoValorCobrado: 0,
    novoDesconto: 0,
    motivo: 'Prorrogação comercial autorizada pela Diretoria.',
  });

  const [baixarForm, setBaixarForm] = useState({
    motivoBaixa: 'PAGAMENTO' as 'PAGAMENTO' | 'CANCELAMENTO_PEDIDO' | 'SUBSTITUICAO_TITULO' | 'DEVOLUCAO',
    valorRecebido: 0,
    dataPagamento: '2026-08-26',
  });

  const [emailForm, setEmailForm] = useState({
    destinatarioEmail: '',
    destinatarioNome: '',
    assunto: '',
    mensagemPersonalizada: 'Prezado cliente,\n\nSegue em anexo o boleto bancário e QR Code PIX para quitação do documento.',
  });

  // Toasts / Feedbacks
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // Carrega dados da empresa ativa
  const carregarDados = useCallback(() => {
    const cobs = bancarioService.getCobrancas(empresaAtiva.id);
    const ctas = bancarioService.getContasBancarias(empresaAtiva.id);
    const cxs = bancarioService.getCaixas(empresaAtiva.id);
    const cfgs = bancarioService.getConfigsCobranca(empresaAtiva.id);
    const movs = bancarioService.getMovimentosFinanceiros(empresaAtiva.id);
    const evts = bancarioService.getEventosCobranca(empresaAtiva.id);

    setCobrancas(cobs);
    setContas(ctas);
    setCaixas(cxs);
    setConfigs(cfgs);
    setMovimentos(movs);
    setEventos(evts);

    if (ctas.length > 0 && !novaCobrancaForm.contaBancariaId) {
      setNovaCobrancaForm((prev) => ({ ...prev, contaBancariaId: ctas[0].id }));
    }
  }, [empresaAtiva.id, novaCobrancaForm.contaBancariaId]);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        carregarDados();
      }
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [carregarDados]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Copiar para o Clipboard com feedback
  const copiarTexto = (texto: string, label: string) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    showToast(`✓ ${label} copiado para a área de transferência!`);
  };

  // 1. Gerar Cobrança
  const handleGerarCobranca = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      const { cobranca } = await bancarioService.gerarCobranca(empresaAtiva.id, {
        contaBancariaId: novaCobrancaForm.contaBancariaId,
        seuNumero: novaCobrancaForm.seuNumero || `FAT-${empresaAtiva.codigo}-${Math.floor(1000 + Math.random() * 9000)}/01`,
        tipoCobranca: novaCobrancaForm.tipoCobranca,
        valorNominal: Number(novaCobrancaForm.valorNominal),
        dataVencimento: novaCobrancaForm.dataVencimento,
        pagador: {
          nome: novaCobrancaForm.pagadorNome,
          cnpjCpf: novaCobrancaForm.pagadorCnpjCpf,
          email: novaCobrancaForm.pagadorEmail,
          telefone: novaCobrancaForm.pagadorTelefone,
          enderecoCompleto: novaCobrancaForm.pagadorEnderecoCompleto,
          cep: novaCobrancaForm.pagadorCep,
          cidade: novaCobrancaForm.pagadorCidade,
          uf: novaCobrancaForm.pagadorUf,
        },
        registrarAutomatico: novaCobrancaForm.registrarAutomatico,
        usuarioNome: 'Operador Financeiro',
      });

      showToast(`Cobrança ${cobranca.nossoNumero} gerada e registrada com sucesso!`);
      setModalNovaCobranca(false);
      carregarDados();
      setModalBoleto(cobranca);
    } catch (err: any) {
      showToast(`Erro ao gerar cobrança: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // 2. Registrar na API Bancária
  const handleRegistrarNaApi = async (cobranca: Cobranca) => {
    setLoadingAction(true);
    try {
      const res = await bancarioService.registrarCobranca(empresaAtiva.id, cobranca.id, undefined, 'Operador Financeiro');
      showToast(res.mensagem);
      carregarDados();
    } catch (err: any) {
      showToast(`Erro ao registrar: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // 3. Consultar Status no Banco
  const handleConsultarBanco = async (cobranca: Cobranca) => {
    setLoadingAction(true);
    try {
      const res = await bancarioService.consultarCobranca(empresaAtiva.id, cobranca.id);
      showToast(res.mensagem);
      carregarDados();
    } catch (err: any) {
      showToast(`Erro ao consultar: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // 4. Alterar Cobrança
  const handleAlterarCobranca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAlterar) return;
    setLoadingAction(true);
    try {
      const res = await bancarioService.alterarCobranca(empresaAtiva.id, modalAlterar.id, {
        novoVencimento: alterarForm.novoVencimento || undefined,
        novoValorCobrado: alterarForm.novoValorCobrado > 0 ? Number(alterarForm.novoValorCobrado) : undefined,
        novoDesconto: alterarForm.novoDesconto > 0 ? Number(alterarForm.novoDesconto) : undefined,
        motivo: alterarForm.motivo,
      });
      showToast(res.mensagem);
      setModalAlterar(null);
      carregarDados();
    } catch (err: any) {
      showToast(`Erro ao alterar: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // 5. Baixar Cobrança
  const handleBaixarCobranca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalBaixar) return;
    setLoadingAction(true);
    try {
      const res = await bancarioService.baixarCobranca(empresaAtiva.id, modalBaixar.id, {
        motivoBaixa: baixarForm.motivoBaixa,
        valorRecebido: Number(baixarForm.valorRecebido) || modalBaixar.valorCobrado,
        dataPagamento: baixarForm.dataPagamento,
      });
      showToast(res.mensagem);
      setModalBaixar(null);
      carregarDados();
    } catch (err: any) {
      showToast(`Erro na baixa: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // 6. Segunda Via
  const handleSegundaVia = async (cobranca: Cobranca) => {
    setLoadingAction(true);
    try {
      const novoVenc = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
      const res = await bancarioService.gerarSegundaVia(empresaAtiva.id, cobranca.id, novoVenc, true, undefined, 'Atendimento');
      showToast(`2ª Via gerada com sucesso! Vencimento: ${res.dataVencimentoAtualizada}.`);
      carregarDados();
      const cobAtualizada = bancarioService.getCobrancaById(empresaAtiva.id, cobranca.id);
      if (cobAtualizada) setModalBoleto(cobAtualizada);
    } catch (err: any) {
      showToast(`Erro ao gerar 2ª via: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // 7. Enviar E-mail
  const handleEnviarEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEmail) return;
    setLoadingAction(true);
    try {
      const res = await bancarioService.enviarEmailCobranca(empresaAtiva.id, {
        cobranca: modalEmail,
        destinatarioEmail: emailForm.destinatarioEmail,
        destinatarioNome: emailForm.destinatarioNome,
        assunto: emailForm.assunto,
        mensagemPersonalizada: emailForm.mensagemPersonalizada,
        anexarPdfBoleto: true,
      });
      showToast(res.mensagem);
      setModalEmail(null);
      carregarDados();
    } catch (err: any) {
      showToast(`Erro ao enviar e-mail: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  // Cálculos de Totais
  const totalCobrancas = cobrancas.reduce((acc, c) => acc + c.valorCobrado, 0);
  const totalRecebido = cobrancas.filter((c) => c.status === 'PAGA_TOTAL').reduce((acc, c) => acc + c.valorPago, 0);
  const totalEmAberto = cobrancas.filter((c) => c.status === 'REGISTRADA' || c.status === 'EM_ABERTO').reduce((acc, c) => acc + c.valorCobrado, 0);
  const totalSaldosBancarios = contas.reduce((acc, c) => acc + c.saldoAtual, 0) + caixas.reduce((acc, cx) => acc + cx.saldoAtual, 0);

  // Filtro de cobranças
  const cobrancasFiltradas = cobrancas.filter((c) => {
    const matchStatus = statusFilter === 'TODOS' || c.status === statusFilter;
    const matchSearch =
      searchQuery === '' ||
      c.pagadorNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nossoNumero.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.seuNumero.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.pagadorCnpjCpf.includes(searchQuery);
    return matchStatus && matchSearch;
  });

  const getStatusBadge = (status: StatusCobranca) => {
    switch (status) {
      case 'REGISTRADA':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200"><CheckCircle2 className="w-3 h-3" /> Registrada</span>;
      case 'EM_ABERTO':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200"><Clock className="w-3 h-3" /> Em Aberto</span>;
      case 'PAGA_TOTAL':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Liquidada</span>;
      case 'PAGA_PARCIAL':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200"><ArrowUpDown className="w-3 h-3" /> Parcial</span>;
      case 'BAIXADA':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300"><Ban className="w-3 h-3" /> Baixada</span>;
      case 'CANCELADA':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200"><XCircle className="w-3 h-3" /> Cancelada</span>;
      case 'GERADA':
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200"><Layers className="w-3 h-3" /> Gerada</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-slate-700 text-sm font-medium animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Header com Contexto Multiempresa e Rastreabilidade */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
                Módulo 11 • Bancário & Cobrança
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Rastreabilidade: Empresa + Conta + Título + Cobrança
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Landmark className="w-7 h-7 text-indigo-600" />
              Gestão Bancária, Boletos & PIX Híbrido
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Operações de cobrança desacopladas com padrão <strong>BillingProvider / BancoAdapter</strong> para a empresa{' '}
              <strong className="text-slate-900">{empresaAtiva.razaoSocial}</strong> (CNPJ {empresaAtiva.cnpj}).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setNovaCobrancaForm((prev) => ({
                  ...prev,
                  seuNumero: `FAT-${empresaAtiva.codigo}-${Math.floor(1000 + Math.random() * 9000)}/01`,
                }));
                setModalNovaCobranca(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm flex items-center gap-2 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Emitir Nova Cobrança
            </button>
          </div>
        </div>

        {/* KPIs Rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500 uppercase">Saldos Disponíveis em Contas & Caixas</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              R$ {totalSaldosBancarios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">{contas.length} contas correntes ativas</span>
          </div>

          <div className="bg-amber-50/70 p-4 rounded-lg border border-amber-200/70">
            <span className="text-xs font-semibold text-amber-700 uppercase">Carteira em Aberto</span>
            <div className="text-2xl font-bold text-amber-900 mt-1">
              R$ {totalEmAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-amber-700 mt-1 block">Aguardando liquidação bancária</span>
          </div>

          <div className="bg-emerald-50/70 p-4 rounded-lg border border-emerald-200/70">
            <span className="text-xs font-semibold text-emerald-700 uppercase">Total Liquidado (Boletos + PIX)</span>
            <div className="text-2xl font-bold text-emerald-900 mt-1">
              R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-emerald-700 mt-1 block">Conciliado no extrato financeiro</span>
          </div>

          <div className="bg-indigo-50/70 p-4 rounded-lg border border-indigo-200/70">
            <span className="text-xs font-semibold text-indigo-700 uppercase">Adapters Bancários</span>
            <div className="text-xl font-bold text-indigo-900 mt-1 flex items-center gap-1.5">
              <span>Itaú • BB • Sicoob</span>
            </div>
            <span className="text-xs text-indigo-600 mt-1 block">Padrão Mock / Sandbox Ativo</span>
          </div>
        </div>
      </div>

      {/* Sub-navegação do Módulo Bancário */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 gap-2 overflow-x-auto">
        <button
          onClick={() => setSubTab('conciliacao')}
          className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            subTab === 'conciliacao'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
          Conciliação Bancária (OFX / CSV / Auto-Matching)
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-800 font-bold">
            NOVO
          </span>
        </button>

        <button
          onClick={() => setSubTab('cobrancas')}
          className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            subTab === 'cobrancas'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Central de Cobranças (Boletos & PIX)
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-bold">
            {cobrancas.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('contas')}
          className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            subTab === 'contas'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Landmark className="w-4 h-4" />
          Contas Bancárias & Caixas Fabris
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-bold">
            {contas.length + caixas.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('extrato')}
          className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            subTab === 'extrato'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Extrato & Movimentos Financeiros
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-bold">
            {movimentos.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('configs')}
          className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            subTab === 'configs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          Configurações de Provedores
        </button>

        <button
          onClick={() => setSubTab('docs')}
          className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            subTab === 'docs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Guia de Integração Bancária
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA: CONCILIAÇÃO BANCÁRIA (OFX / CSV / AUTO-MATCHING / INTERCOMPANY)      */}
      {/* ========================================================================= */}
      {subTab === 'conciliacao' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-6">
          <ConciliacaoBancariaViewer empresaAtiva={empresaAtiva as any} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 1: CENTRAL DE COBRANÇAS                                              */}
      {/* ========================================================================= */}
      {subTab === 'cobrancas' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-6">
          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por Pagador, Nosso Número ou Documento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="REGISTRADA">Registrada</option>
                <option value="EM_ABERTO">Em Aberto</option>
                <option value="PAGA_TOTAL">Liquidada (Paga)</option>
                <option value="BAIXADA">Baixada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={carregarDados}
                className="px-3 py-2 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg text-sm flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
                title="Atualizar lista"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </button>
            </div>
          </div>

          {/* Tabela de Cobranças */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Nosso Número / Doc</th>
                  <th className="px-4 py-3">Pagador (Sacado)</th>
                  <th className="px-4 py-3">Conta / Banco</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3 text-right">Valor Cobrado</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Ações Operacionais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cobrancasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Nenhuma cobrança encontrada para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  cobrancasFiltradas.map((cob) => (
                    <tr key={cob.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{cob.nossoNumero}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <span>{cob.seuNumero}</span>
                          {cob.tipoCobranca === 'BOLETO_HIBRIDO' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              PIX+Boleto
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{cob.pagadorNome}</div>
                        <div className="text-xs text-slate-500">{cob.pagadorCnpjCpf}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{cob.bancoNome || 'Banco'}</div>
                        <div className="text-xs text-slate-500">{cob.contaBancariaNome}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {new Date(cob.dataVencimento + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-slate-500">
                          Emissão: {new Date(cob.dataEmissao + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-bold text-slate-900">
                          R$ {cob.valorCobrado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        {cob.valorPago > 0 && (
                          <div className="text-xs text-emerald-600 font-semibold">
                            Pago: R$ {cob.valorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(cob.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Visualizar / Imprimir Boleto */}
                          <button
                            onClick={() => setModalBoleto(cob)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Visualizar Boleto / Ficha de Compensação"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Copiar Linha Digitável */}
                          {cob.linhaDigitavel && (
                            <button
                              onClick={() => copiarTexto(cob.linhaDigitavel!, 'Linha Digitável')}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                              title="Copiar Linha Digitável"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          )}

                          {/* Copiar PIX */}
                          {cob.qrCodePix && (
                            <button
                              onClick={() => copiarTexto(cob.qrCodePix!, 'Chave PIX Copia e Cola')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                              title="Copiar PIX Copia e Cola"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          )}

                          {/* Enviar E-mail */}
                          <button
                            onClick={() => {
                              setEmailForm({
                                destinatarioEmail: cob.pagadorEmail || '',
                                destinatarioNome: cob.pagadorNome,
                                assunto: `Boleto Bancário e QR Code PIX - Documento ${cob.seuNumero} - ${empresaAtiva.nomeFantasia}`,
                                mensagemPersonalizada: `Prezado cliente,\n\nSegue a cobrança referente ao documento ${cob.seuNumero} com vencimento para ${new Date(cob.dataVencimento + 'T12:00:00Z').toLocaleDateString('pt-BR')} no valor de R$ ${cob.valorCobrado.toFixed(2)}.\n\nLinha Digitável: ${cob.linhaDigitavel}\n\nVocê também pode pagar instantaneamente pelo QR Code PIX anexado.`,
                              });
                              setModalEmail(cob);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Enviar por E-mail"
                          >
                            <Mail className="w-4 h-4" />
                          </button>

                          {/* Consultar Banco */}
                          <button
                            onClick={() => handleConsultarBanco(cob)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            title="Consultar Status no Banco"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>

                          {/* Alterar */}
                          {cob.status !== 'PAGA_TOTAL' && cob.status !== 'BAIXADA' && (
                            <button
                              onClick={() => {
                                setAlterarForm({
                                  novoVencimento: cob.dataVencimento,
                                  novoValorCobrado: cob.valorCobrado,
                                  novoDesconto: cob.valorDesconto,
                                  motivo: 'Prorrogação comercial autorizada.',
                                });
                                setModalAlterar(cob);
                              }}
                              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                              title="Alterar Vencimento / Valor"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Baixar / Liquidar */}
                          {cob.status !== 'PAGA_TOTAL' && cob.status !== 'BAIXADA' && (
                            <button
                              onClick={() => {
                                setBaixarForm({
                                  motivoBaixa: 'PAGAMENTO',
                                  valorRecebido: cob.valorCobrado,
                                  dataPagamento: new Date().toISOString().split('T')[0],
                                });
                                setModalBaixar(cob);
                              }}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                              title="Baixar / Liquidar Cobrança"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* 2ª Via */}
                          <button
                            onClick={() => handleSegundaVia(cob)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                            title="Emitir 2ª Via Atualizada"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Histórico / Eventos */}
                          <button
                            onClick={() => setModalEventos(cob)}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                            title="Ver Trilha de Eventos e Auditoria"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: CONTAS BANCÁRIAS E CAIXAS                                         */}
      {/* ========================================================================= */}
      {subTab === 'contas' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-indigo-600" />
                Contas Correntes Bancárias ({empresaAtiva.nomeFantasia})
              </h2>
              <p className="text-sm text-slate-500">
                Contas bancárias vinculadas para emissão de boletos, recebimento de PIX e liquidações.
              </p>
            </div>
            <button
              onClick={() => setModalNovaConta(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Conta Bancária
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contas.map((cta) => (
              <div key={cta.id} className="bg-slate-50 rounded-xl p-5 border border-slate-200 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">
                    Banco {cta.bancoCodigo}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    {cta.ambiente}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{cta.descricao}</h3>
                <p className="text-xs text-slate-500 mb-4">{cta.bancoNome}</p>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-200 pt-3">
                  <div className="flex justify-between">
                    <span>Agência / Conta:</span>
                    <strong className="text-slate-800">{cta.agencia} / {cta.contaCorrente}-{cta.contaDigito}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Carteira / Convênio:</span>
                    <strong className="text-slate-800">{cta.carteira} / {cta.convenio || 'N/A'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Chave PIX:</span>
                    <span className="text-slate-800 font-mono truncate max-w-[150px]">{cta.chavePix || 'N/A'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-xs text-slate-500">Saldo Atual:</span>
                  <span className="text-lg font-bold text-slate-900">
                    R$ {cta.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Caixas Físicos e Tesouraria */}
          <div className="pt-6 border-t border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              Caixas Físicos & Tesouraria Fabril
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Fundos fixos de fábrica, manutenção e tesouraria central isolados por CNPJ.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {caixas.map((cx) => (
                <div key={cx.id} className="bg-emerald-50/40 rounded-xl p-5 border border-emerald-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      {cx.codigo}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-800">
                      {cx.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{cx.nome}</h3>
                  <p className="text-xs text-slate-600 mb-3">Responsável: {cx.responsavelNome}</p>

                  <div className="flex justify-between items-baseline border-t border-emerald-200/60 pt-3">
                    <span className="text-xs text-slate-600 font-medium">Saldo em Dinheiro:</span>
                    <span className="text-xl font-bold text-emerald-900">
                      R$ {cx.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: EXTRATO & MOVIMENTOS FINANCEIROS                                   */}
      {/* ========================================================================= */}
      {subTab === 'extrato' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-600" />
                Extrato Financeiro & Conciliação Bancária
              </h2>
              <p className="text-sm text-slate-500">
                Movimentações de entradas por liquidação de boletos, PIX e transferências de tesouraria.
              </p>
            </div>
            <button
              onClick={carregarDados}
              className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" /> Atualizar Extrato
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Descrição / Origem</th>
                  <th className="px-4 py-3">Doc Referência</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-right">Saldo Posterior</th>
                  <th className="px-4 py-3 text-center">Conciliação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movimentos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Nenhuma movimentação financeira registrada para esta empresa.
                    </td>
                  </tr>
                ) : (
                  movimentos.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {new Date(mov.dataMovimento + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{mov.descricao}</div>
                        <div className="text-xs text-slate-500">{mov.origemMovimento}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-mono text-xs">
                        {mov.documentoReferencia || '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        + R$ {mov.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        R$ {mov.saldoPosterior.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {mov.conciliado ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Conciliado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" /> Pendente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: CONFIGURAÇÕES DE PROVEDORES                                       */}
      {/* ========================================================================= */}
      {subTab === 'configs' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Parâmetros de Cobrança por Provedor Bancário
            </h2>
            <p className="text-sm text-slate-500">
              Configurações de juros, multas, protestos, webhook e tipo de provider bancário para cada conta.
            </p>
          </div>

          <div className="space-y-4">
            {configs.map((cfg) => (
              <div key={cfg.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800">
                      Provider: {cfg.providerType}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">{cfg.descricao}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Ambiente {cfg.ambiente}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-700 bg-white p-4 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-400 block font-medium">Juros Mensal:</span>
                    <strong className="text-slate-900">{cfg.jurosMensalPercentual}% ao mês</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Multa por Atraso:</span>
                    <strong className="text-slate-900">{cfg.multaPercentual}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Dias para Protesto:</span>
                    <strong className="text-slate-900">{cfg.diasProtesto === 0 ? 'Sem protesto' : `${cfg.diasProtesto} dias`}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Boleto Híbrido (PIX):</span>
                    <strong className="text-emerald-700">{cfg.aceitaPixHibrido ? '✓ Habilitado' : 'Desabilitado'}</strong>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-600 space-y-1">
                  <div><strong>Instrução 1:</strong> {cfg.instrucao1}</div>
                  <div><strong>Instrução 2:</strong> {cfg.instrucao2}</div>
                  {cfg.webhookUrl && (
                    <div className="font-mono text-slate-500 truncate">
                      <strong>Webhook:</strong> {cfg.webhookUrl}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 5: GUIA DE INTEGRAÇÃO BANCÁRIA                                        */}
      {/* ========================================================================= */}
      {subTab === 'docs' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Especificação de Integração Bancária & Campos Dependentes
              </h2>
              <p className="text-sm text-slate-500">
                Documentação técnica detalhada dos campos marcados como <code className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">[TODO/BANCO-DEPENDENT]</code>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-indigo-600" />
                Banco Itaú Unibanco (API Cobrança v2)
              </h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Integração REST com mTLS (Certificado A1 .pfx) e token OAuth2 Client Credentials.
              </p>
              <div className="space-y-2 text-xs">
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="font-bold text-amber-800 block">[TODO/BANCO-DEPENDENT]</span>
                  <span className="text-slate-700">Certificado Digital A1 (.pfx) carregado no Key Vault e senha da chave privada.</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="font-bold text-amber-800 block">[TODO/BANCO-DEPENDENT]</span>
                  <span className="text-slate-700">Client ID & Client Secret obtidos no Portal Itaú Developers.</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="font-bold text-slate-800 block">Endpoints:</span>
                  <span className="font-mono text-slate-600 text-[11px]">POST https://api.itau.com.br/cobranca/v2/boletos</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-amber-600" />
                Banco do Brasil (API Cobrança v2)
              </h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Integração REST com Basic Auth para OAuth2 e chave developer application.
              </p>
              <div className="space-y-2 text-xs">
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="font-bold text-amber-800 block">[TODO/BANCO-DEPENDENT]</span>
                  <span className="text-slate-700">Developer Application Key (Portal Developers BB) e número do convênio líder (7 dígitos).</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="font-bold text-amber-800 block">[TODO/BANCO-DEPENDENT]</span>
                  <span className="text-slate-700">Variação de carteira de cobrança simples (ex: 019).</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="font-bold text-slate-800 block">Endpoints:</span>
                  <span className="font-mono text-slate-600 text-[11px]">POST https://api.bb.com.br/cobrancas/v2/boletos</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-red-600" />
                Banco Bradesco (API ShopFácil / Net Empresa)
              </h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Assinatura de requisições com tokens JWT assinados via chave RSA privada PKI.
              </p>
              <div className="space-y-2 text-xs">
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="font-bold text-amber-800 block">[TODO/BANCO-DEPENDENT]</span>
                  <span className="text-slate-700">Merchant ID e Chave Privada RSA cadastrada no portal Bradesco.</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base mb-2 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600" />
                Sicoob Cooperativa (API Cobrança v3)
              </h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Padrão Open Finance com escopo de Cooperativa e cliente cooperado.
              </p>
              <div className="space-y-2 text-xs">
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="font-bold text-amber-800 block">[TODO/BANCO-DEPENDENT]</span>
                  <span className="text-slate-700">Código da Cooperativa Sicoob filiada e número da conta do cooperado.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VISUALIZADOR DE BOLETO BANCÁRIO / FICHA DE COMPENSAÇÃO             */}
      {/* ========================================================================= */}
      {modalBoleto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-6 my-8 border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Header do Modal */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Boleto Bancário & QR Code PIX (Boleto Híbrido)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Documento de cobrança oficial gerado conforme normas FEBRABAN e Banco Central.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalBoleto(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg text-lg"
              >
                ✕
              </button>
            </div>

            {/* Layout Real do Boleto */}
            <div className="border-2 border-slate-900 rounded-lg p-5 font-mono text-xs bg-white text-slate-900 space-y-4">
              {/* Topo do Boleto */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                <div className="flex items-center gap-3">
                  <strong className="text-base font-black tracking-tight">{modalBoleto.bancoNome?.toUpperCase() || 'BANCO'}</strong>
                  <span className="text-lg font-bold border-l-2 border-r-2 border-slate-900 px-3">
                    {modalBoleto.bancoCodigo || '341'}-9
                  </span>
                </div>
                <div className="text-right text-xs font-bold tracking-wider">
                  {modalBoleto.linhaDigitavel || '34191.79001 01043.510047 91020.150008 5 99990000000000'}
                </div>
              </div>

              {/* Grid de Informações */}
              <div className="grid grid-cols-4 gap-2 border-b border-slate-900 pb-2">
                <div className="col-span-3 border-r border-slate-900 pr-2">
                  <span className="text-[10px] text-slate-500 block uppercase">Local de Pagamento</span>
                  <span className="font-semibold text-[11px]">PAGÁVEL EM QUALQUER BANCO OU CORRESPONDENTE ATÉ O VENCIMENTO</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Vencimento</span>
                  <strong className="text-sm">
                    {new Date(modalBoleto.dataVencimento + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 border-b border-slate-900 pb-2">
                <div className="col-span-3 border-r border-slate-900 pr-2">
                  <span className="text-[10px] text-slate-500 block uppercase">Beneficiário</span>
                  <strong className="text-xs">{empresaAtiva.razaoSocial} - CNPJ: {empresaAtiva.cnpj}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Agência / Código Beneficiário</span>
                  <strong>0435 / 91020-8</strong>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 border-b border-slate-900 pb-2">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Data Documento</span>
                  <span>{new Date(modalBoleto.dataEmissao + 'T12:00:00Z').toLocaleDateString('pt-BR')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Número Documento</span>
                  <strong>{modalBoleto.seuNumero}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Espécie</span>
                  <span>DM (Duplicata Mercantil)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Nosso Número</span>
                  <strong>{modalBoleto.nossoNumero}</strong>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 border-b border-slate-900 pb-2">
                <div className="col-span-3 border-r border-slate-900 pr-2 space-y-1">
                  <span className="text-[10px] text-slate-500 block uppercase">Instruções de Responsabilidade do Beneficiário</span>
                  <p className="text-[10px]">- NÃO RECEBER APÓS 30 DIAS DO VENCIMENTO.</p>
                  <p className="text-[10px]">- APÓS O VENCIMENTO COBRAR JUROS DE 1% AO MÊS E MULTA DE 2%.</p>
                  <p className="text-[10px]">- EM CASO DE DÚVIDAS CONTATE O DEPARTAMENTO FINANCEIRO DO GRUPO TRITECH.</p>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">(=) Valor do Documento</span>
                    <strong className="text-base text-slate-900">
                      R$ {modalBoleto.valorCobrado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Pagador */}
              <div className="border-b border-slate-900 pb-2">
                <span className="text-[10px] text-slate-500 block uppercase">Pagador</span>
                <div className="font-bold text-xs">{modalBoleto.pagadorNome} - CNPJ/CPF: {modalBoleto.pagadorCnpjCpf}</div>
                <div className="text-[11px] text-slate-700">{modalBoleto.pagadorEnderecoCompleto} - CEP {modalBoleto.pagadorCep} - {modalBoleto.pagadorCidade}/{modalBoleto.pagadorUf}</div>
              </div>

              {/* QR Code PIX (Boleto Híbrido) + Código de Barras */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 border border-slate-300 rounded bg-slate-50 text-center">
                    <QrCode className="w-16 h-16 text-slate-900 mx-auto" />
                    <span className="text-[9px] font-bold text-emerald-700 block mt-1">PIX HÍBRIDO</span>
                  </div>
                  <div className="text-[10px] text-slate-600 max-w-xs">
                    <strong>Pague instantaneamente com o PIX:</strong>
                    <p className="mt-0.5">Abra o app do seu banco e escaneie o QR Code ou utilize o código Copia e Cola.</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="tracking-[6px] font-mono text-base font-bold bg-slate-100 p-2 rounded border border-slate-300">
                    ||||| | |||| || |||||| | ||||| ||
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 block mt-1">
                    {modalBoleto.codigoBarras || '34195999900000000001790001043510049102015000'}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações do Modal */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copiarTexto(modalBoleto.linhaDigitavel || '', 'Linha Digitável')}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar Linha Digitável
                </button>
                {modalBoleto.qrCodePix && (
                  <button
                    onClick={() => copiarTexto(modalBoleto.qrCodePix || '', 'PIX Copia e Cola')}
                    className="px-3.5 py-2 border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Copiar PIX
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-4 h-4" /> Imprimir Boleto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVA COBRANÇA (EMPRESA + CONTA + TÍTULO + COBRANÇA)               */}
      {/* ========================================================================= */}
      {modalNovaCobranca && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-6 my-8 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Emitir Nova Cobrança Bancária</h3>
                  <p className="text-xs text-slate-500">
                    Vínculo estrito com a conta bancária da empresa <strong>{empresaAtiva.nomeFantasia}</strong>.
                  </p>
                </div>
              </div>
              <button onClick={() => setModalNovaCobranca(false)} className="text-slate-400 hover:text-slate-700 text-lg">✕</button>
            </div>

            <form onSubmit={handleGerarCobranca} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Conta Bancária de Destino *
                  </label>
                  <select
                    value={novaCobrancaForm.contaBancariaId}
                    onChange={(e) => setNovaCobrancaForm({ ...novaCobrancaForm, contaBancariaId: e.target.value })}
                    required
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white"
                  >
                    {contas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.descricao} ({c.bancoNome} - Carteira {c.carteira})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tipo de Cobrança
                  </label>
                  <select
                    value={novaCobrancaForm.tipoCobranca}
                    onChange={(e) => setNovaCobrancaForm({ ...novaCobrancaForm, tipoCobranca: e.target.value as TipoCobranca })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white font-semibold"
                  >
                    <option value="BOLETO_HIBRIDO">Boleto Híbrido (Boleto + PIX)</option>
                    <option value="BOLETO">Boleto Tradicional</option>
                    <option value="PIX">PIX Dinâmico</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Seu Número (Doc/Fatura) *
                  </label>
                  <input
                    type="text"
                    required
                    value={novaCobrancaForm.seuNumero}
                    onChange={(e) => setNovaCobrancaForm({ ...novaCobrancaForm, seuNumero: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Valor Cobrado (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={novaCobrancaForm.valorNominal}
                    onChange={(e) => setNovaCobrancaForm({ ...novaCobrancaForm, valorNominal: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Data de Vencimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={novaCobrancaForm.dataVencimento}
                    onChange={(e) => setNovaCobrancaForm({ ...novaCobrancaForm, dataVencimento: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              {/* Dados do Pagador */}
              <div className="border-t border-slate-200 pt-3 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Dados do Pagador (Sacado)</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Razão Social / Nome *</label>
                    <input
                      type="text"
                      required
                      value={novaCobrancaForm.pagadorNome}
                      onChange={(e) => setNovaCobrancaForm({ ...novaCobrancaForm, pagadorNome: e.target.value })}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">CNPJ / CPF *</label>
                    <input
                      type="text"
                      required
                      value={novaCobrancaForm.pagadorCnpjCpf}
                      onChange={(e) => setNovaCobrancaForm({ ...novaCobrancaForm, pagadorCnpjCpf: e.target.value })}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">E-mail para Envio</label>
                    <input
                      type="email"
                      value={novaCobrancaForm.pagadorEmail}
                      onChange={(e) => setNovaCobrancaForm({ ...novaCobrancaForm, pagadorEmail: e.target.value })}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Endereço Completo</label>
                    <input
                      type="text"
                      value={novaCobrancaForm.pagadorEnderecoCompleto}
                      onChange={(e) => setNovaCobrancaForm({ ...novaCobrancaForm, pagadorEnderecoCompleto: e.target.value })}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="regAuto"
                  checked={novaCobrancaForm.registrarAutomatico}
                  onChange={(e) => setNovaCobrancaForm({ ...novaCobrancaForm, registrarAutomatico: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="regAuto" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Registrar automaticamente na API do banco (comunicação síncrona via Adapter)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalNovaCobranca(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm shadow-xs flex items-center gap-2"
                >
                  {loadingAction ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Gerar e Emitir Cobrança
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ALTERAR COBRANÇA                                                  */}
      {/* ========================================================================= */}
      {modalAlterar && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                Alterar Cobrança ({modalAlterar.nossoNumero})
              </h3>
              <button onClick={() => setModalAlterar(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleAlterarCobranca} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Novo Vencimento</label>
                <input
                  type="date"
                  value={alterarForm.novoVencimento}
                  onChange={(e) => setAlterarForm({ ...alterarForm, novoVencimento: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Novo Valor Cobrado (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={alterarForm.novoValorCobrado}
                  onChange={(e) => setAlterarForm({ ...alterarForm, novoValorCobrado: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Motivo / Justificativa *</label>
                <textarea
                  required
                  rows={3}
                  value={alterarForm.motivo}
                  onChange={(e) => setAlterarForm({ ...alterarForm, motivo: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalAlterar(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs"
                >
                  Confirmar Alteração
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BAIXAR / LIQUIDAR COBRANÇA                                        */}
      {/* ========================================================================= */}
      {modalBaixar && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Baixa / Liquidação de Cobrança
              </h3>
              <button onClick={() => setModalBaixar(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleBaixarCobranca} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Motivo da Baixa *</label>
                <select
                  value={baixarForm.motivoBaixa}
                  onChange={(e) => setBaixarForm({ ...baixarForm, motivoBaixa: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white"
                >
                  <option value="PAGAMENTO">Pagamento / Liquidação Financeira</option>
                  <option value="CANCELAMENTO_PEDIDO">Cancelamento de Pedido / Venda</option>
                  <option value="SUBSTITUICAO_TITULO">Substituição por Outro Título</option>
                  <option value="DEVOLUCAO">Devolução de Mercadoria</option>
                </select>
              </div>

              {baixarForm.motivoBaixa === 'PAGAMENTO' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Valor Recebido (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={baixarForm.valorRecebido}
                      onChange={(e) => setBaixarForm({ ...baixarForm, valorRecebido: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data da Liquidação</label>
                    <input
                      type="date"
                      required
                      value={baixarForm.dataPagamento}
                      onChange={(e) => setBaixarForm({ ...baixarForm, dataPagamento: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200">
                A baixa por pagamento gera automaticamente o movimento financeiro de entrada no extrato da conta bancária.
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalBaixar(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
                >
                  Efetivar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ENVIAR COBRANÇA POR E-MAIL                                        */}
      {/* ========================================================================= */}
      {modalEmail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Enviar Cobrança por E-mail
              </h3>
              <button onClick={() => setModalEmail(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleEnviarEmail} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Destinatário *</label>
                <input
                  type="email"
                  required
                  value={emailForm.destinatarioEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, destinatarioEmail: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assunto *</label>
                <input
                  type="text"
                  required
                  value={emailForm.assunto}
                  onChange={(e) => setEmailForm({ ...emailForm, assunto: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mensagem</label>
                <textarea
                  rows={4}
                  value={emailForm.mensagemPersonalizada}
                  onChange={(e) => setEmailForm({ ...emailForm, mensagemPersonalizada: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-800 space-y-1">
                <div className="font-bold">Anexos automáticos incluídos no disparo:</div>
                <div>• PDF do Boleto Bancário formatado com código de barras</div>
                <div>• Imagem do QR Code PIX e chave Copia e Cola</div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalEmail(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Disparar E-mail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: HISTÓRICO & EVENTOS DE AUDITORIA                                  */}
      {/* ========================================================================= */}
      {modalEventos && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Trilha de Auditoria • Cobrança {modalEventos.nossoNumero}
              </h3>
              <button onClick={() => setModalEventos(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
              {eventos.filter((e) => e.cobrancaId === modalEventos.id).length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Nenhum evento registrado ainda.</p>
              ) : (
                eventos
                  .filter((e) => e.cobrancaId === modalEventos.id)
                  .map((evt) => (
                    <div key={evt.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px]">
                          {evt.tipoEvento}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          {new Date(evt.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-slate-700 pt-1">{evt.descricao}</p>
                      <div className="text-[11px] text-slate-500">
                        Operador: <strong>{evt.usuarioNome || 'Sistema'}</strong>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setModalEventos(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold"
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
