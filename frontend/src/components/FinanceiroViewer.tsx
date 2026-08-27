'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Calendar,
  Building2,
  Plus,
  Search,
  Filter,
  ArrowRightLeft,
  ShieldCheck,
  CreditCard,
  Receipt,
  PieChart,
  BarChart3,
  RefreshCw,
  Eye,
  Check,
  X,
  Layers,
  ChevronDown,
  ChevronRight,
  FolderLock,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  FileCheck2,
  AlertCircle,
} from 'lucide-react';
import { Empresa } from '@/backend/core/types/company';
import { safeFetchJson } from '../api/safe-fetch';
import {
  ContaPagar,
  ContaReceber,
  ContaPagarParcela,
  ContaReceberParcela,
  AdiantamentoFinanceiro,
  RenegociacaoFinanceira,
  PlanoConta,
  CentroCusto,
  CategoriaFinanceira,
  AuditoriaFinanceiraLog,
  ResumoFinanceiroEmpresa,
  ProjecaoFluxoCaixaDia,
  DreSinteticoItem,
  StatusTituloFinanceiro,
  FormaPagamentoFinanceiro,
} from '@/backend/modules/financeiro/financeiro-types';

interface FinanceiroViewerProps {
  empresaAtiva: Empresa;
}

export function FinanceiroViewer({ empresaAtiva }: FinanceiroViewerProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    'visao_geral' | 'contas_pagar' | 'contas_receber' | 'novo_lancamento' | 'renegociacao' | 'adiantamentos' | 'cadastros' | 'auditoria'
  >('visao_geral');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados dos dados
  const [resumo, setResumo] = useState<ResumoFinanceiroEmpresa | null>(null);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [adiantamentos, setAdiantamentos] = useState<AdiantamentoFinanceiro[]>([]);
  const [fluxoCaixa, setFluxoCaixa] = useState<ProjecaoFluxoCaixaDia[]>([]);
  const [dre, setDre] = useState<DreSinteticoItem[]>([]);
  const [planoContas, setPlanoContas] = useState<PlanoConta[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [auditoriaLogs, setAuditoriaLogs] = useState<AuditoriaFinanceiraLog[]>([]);

  // Filtros e busca
  const [filtroStatusPagar, setFiltroStatusPagar] = useState<string>('TODOS');
  const [filtroStatusReceber, setFiltroStatusReceber] = useState<string>('TODOS');
  const [buscaTexto, setBuscaTexto] = useState('');

  // Modal de Detalhes / Ações
  const [selectedContaPagar, setSelectedContaPagar] = useState<ContaPagar | null>(null);
  const [selectedContaReceber, setSelectedContaReceber] = useState<ContaReceber | null>(null);
  const [modalBaixa, setModalBaixa] = useState<{
    tipo: 'PAGAR' | 'RECEBER';
    tituloId: string;
    parcela: ContaPagarParcela | ContaReceberParcela;
    tituloDoc: string;
    parceiroNome: string;
  } | null>(null);

  // Form de Baixa
  const [baixaForm, setBaixaForm] = useState({
    valorBaixa: 0,
    valorJuros: 0,
    valorMulta: 0,
    valorDesconto: 0,
    formaPagamento: 'PIX' as FormaPagamentoFinanceiro,
    contaBancaria: 'Banco do Brasil - Ag 1234 C/C 98765-0 (Operacional)',
    autenticacaoBancaria: '',
    observacoes: '',
    dataBaixa: new Date().toISOString().split('T')[0],
  });

  // Form de Novo Lançamento
  const [novoLancamento, setNovoLancamento] = useState({
    tipo: 'PAGAR' as 'PAGAR' | 'RECEBER',
    parceiroNome: '',
    parceiroCnpjCpf: '',
    numeroDocumento: '',
    descricao: '',
    origem: 'MANUAL',
    categoriaFinanceiraId: '',
    centroCustoId: '',
    planoContaId: '',
    valorOriginal: 10000,
    dataEmissao: '2026-08-26',
    dataVencimentoPrimeira: '2026-09-26',
    totalParcelas: 1,
    intervaloDias: 30,
    formaPagamentoPrevista: 'BOLETO' as FormaPagamentoFinanceiro,
    codigoBarras: '',
    linhaDigitavel: '',
    chavePix: '',
    requerAprovacao: true,
  });

  // Form de Renegociação
  const [renegForm, setRenegForm] = useState({
    tipo: 'PAGAR' as 'PAGAR' | 'RECEBER',
    parceiroId: '',
    parceiroNome: '',
    titulosIdsSelecionados: [] as string[],
    valorJurosAcordo: 0,
    valorDescontoAcordo: 0,
    quantidadeNovasParcelas: 3,
    intervaloDias: 30,
    primeiroVencimento: '2026-09-10',
    motivo: 'Acordo amigável para alongamento de fluxo de caixa',
  });

  // Form de Adiantamento
  const [adiantamentoForm, setAdiantamentoForm] = useState({
    tipo: 'A_FORNECEDOR' as 'A_FORNECEDOR' | 'DE_CLIENTE',
    parceiroNome: '',
    parceiroCnpjCpf: '',
    numeroDocumento: '',
    valorOriginal: 5000,
    formaPagamento: 'PIX' as FormaPagamentoFinanceiro,
    observacoes: '',
  });

  // Modal de Compensação de Adiantamento
  const [modalCompensacao, setModalCompensacao] = useState<{
    adiantamento: AdiantamentoFinanceiro;
    tipo: 'PAGAR' | 'RECEBER';
  } | null>(null);
  const [compensacaoAlvo, setCompensacaoAlvo] = useState({
    tituloId: '',
    parcelaId: '',
    valorCompensar: 0,
  });

  // Carregar dados da API
  const carregarDadosFinanceiros = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await safeFetchJson<{
        resumo: ResumoFinanceiroEmpresa;
        contasPagar: ContaPagar[];
        contasReceber: ContaReceber[];
        adiantamentos: AdiantamentoFinanceiro[];
        fluxoCaixa: ProjecaoFluxoCaixaDia[];
        dre: DreSinteticoItem[];
        planoContas: PlanoConta[];
        centrosCusto: CentroCusto[];
        categorias: CategoriaFinanceira[];
        auditoria: AuditoriaFinanceiraLog[];
      }>(`/api/v1/financeiro?empresaId=${empresaAtiva.id}&action=dashboard`);

      if (res.success && res.data) {
        if (res.data.resumo) setResumo(res.data.resumo);
        setContasPagar(res.data.contasPagar || []);
        setContasReceber(res.data.contasReceber || []);
        setAdiantamentos(res.data.adiantamentos || []);
        setFluxoCaixa(res.data.fluxoCaixa || []);
        setDre(res.data.dre || []);
        setPlanoContas(res.data.planoContas || []);
        setCentrosCusto(res.data.centrosCusto || []);
        setCategorias(res.data.categorias || []);
        setAuditoriaLogs(res.data.auditoria || []);
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(`Erro de conexão: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [empresaAtiva.id]);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        carregarDadosFinanceiros();
      }
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [carregarDadosFinanceiros]);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // -------------------------------------------------------------
  // HANDLERS DE AÇÕES
  // -------------------------------------------------------------

  const handleAprovarRejeitarPagar = async (contaPagarId: string, aprovado: boolean) => {
    try {
      const res = await safeFetchJson('/api/v1/financeiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          action: 'aprovar-rejeitar-pagar',
          contaPagarId,
          aprovado,
          usuarioId: 'u-controladoria',
          usuarioNome: 'Gerência de Controladoria (SoD)',
          motivoRejeicao: aprovado ? undefined : 'Reprovado por divergência orçamentária',
        }),
      });
      if (res.success) {
        showToast(aprovado ? 'Título a pagar APROVADO com sucesso!' : 'Título a pagar REJEITADO.');
        carregarDadosFinanceiros();
      } else {
        setErrorMsg(res.error || 'Erro ao processar aprovação');
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleAbrirModalBaixa = (
    tipo: 'PAGAR' | 'RECEBER',
    tituloId: string,
    parcela: ContaPagarParcela | ContaReceberParcela,
    tituloDoc: string,
    parceiroNome: string
  ) => {
    setModalBaixa({
      tipo,
      tituloId,
      parcela,
      tituloDoc,
      parceiroNome,
    });
    setBaixaForm({
      valorBaixa: parcela.valorSaldo,
      valorJuros: 0,
      valorMulta: 0,
      valorDesconto: 0,
      formaPagamento: 'PIX',
      contaBancaria: 'Banco do Brasil - Ag 1234 C/C 98765-0 (Operacional)',
      autenticacaoBancaria: 'AUT-98471203',
      observacoes: '',
      dataBaixa: '2026-08-26',
    });
  };

  const handleExecutarBaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalBaixa) return;

    try {
      const endpointAction = modalBaixa.tipo === 'PAGAR' ? 'baixar-conta-pagar' : 'baixar-conta-receber';
      const bodyPayload =
        modalBaixa.tipo === 'PAGAR'
          ? {
              empresaId: empresaAtiva.id,
              action: endpointAction,
              contaPagarId: modalBaixa.tituloId,
              parcelaId: modalBaixa.parcela.id,
              payload: {
                valorPago: Number(baixaForm.valorBaixa),
                valorJuros: Number(baixaForm.valorJuros),
                valorMulta: Number(baixaForm.valorMulta),
                valorDesconto: Number(baixaForm.valorDesconto),
                dataBaixa: baixaForm.dataBaixa,
                formaPagamento: baixaForm.formaPagamento,
                contaBancariaNome: baixaForm.contaBancaria,
                autenticacaoBancaria: baixaForm.autenticacaoBancaria,
                observacoes: baixaForm.observacoes,
                usuarioId: 'u-tesoureiro',
                usuarioNome: 'Tesouraria Industrial (SoD)',
              },
            }
          : {
              empresaId: empresaAtiva.id,
              action: endpointAction,
              contaReceberId: modalBaixa.tituloId,
              parcelaId: modalBaixa.parcela.id,
              payload: {
                valorRecebido: Number(baixaForm.valorBaixa),
                valorJuros: Number(baixaForm.valorJuros),
                valorMulta: Number(baixaForm.valorMulta),
                valorDesconto: Number(baixaForm.valorDesconto),
                dataRecebimento: baixaForm.dataBaixa,
                formaPagamento: baixaForm.formaPagamento,
                contaBancariaNome: baixaForm.contaBancaria,
                autenticacaoBancaria: baixaForm.autenticacaoBancaria,
                observacoes: baixaForm.observacoes,
                usuarioId: 'u-tesoureiro',
                usuarioNome: 'Tesouraria Industrial (SoD)',
              },
            };

      const res = await fetch('/api/v1/financeiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Baixa ${modalBaixa.tipo === 'PAGAR' ? 'de pagamento' : 'de recebimento'} registrada com sucesso!`);
        setModalBaixa(null);
        setSelectedContaPagar(null);
        setSelectedContaReceber(null);
        carregarDadosFinanceiros();
      } else {
        setErrorMsg(data.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCriarNovoLancamento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const action = novoLancamento.tipo === 'PAGAR' ? 'criar-conta-pagar' : 'criar-conta-receber';
      const payload =
        novoLancamento.tipo === 'PAGAR'
          ? {
              fornecedorId: `forn-${Date.now().toString().slice(-4)}`,
              fornecedorNome: novoLancamento.parceiroNome,
              fornecedorCnpjCpf: novoLancamento.parceiroCnpjCpf || '00.000.000/0001-00',
              numeroDocumento: novoLancamento.numeroDocumento,
              descricao: novoLancamento.descricao,
              origem: novoLancamento.origem,
              categoriaFinanceiraId: novoLancamento.categoriaFinanceiraId || undefined,
              centroCustoId: novoLancamento.centroCustoId || undefined,
              planoContaId: novoLancamento.planoContaId || undefined,
              valorOriginal: Number(novoLancamento.valorOriginal),
              dataEmissao: novoLancamento.dataEmissao,
              dataVencimentoPrimeira: novoLancamento.dataVencimentoPrimeira,
              totalParcelas: Number(novoLancamento.totalParcelas),
              intervaloDias: Number(novoLancamento.intervaloDias),
              formaPagamentoPrevista: novoLancamento.formaPagamentoPrevista,
              codigoBarrasBoleto: novoLancamento.codigoBarras,
              linhaDigitavel: novoLancamento.linhaDigitavel,
              chavePix: novoLancamento.chavePix,
              usuarioId: 'u-digitador',
              usuarioNome: 'Operador Financeiro (Lançamento)',
              requerAprovacao: novoLancamento.requerAprovacao,
            }
          : {
              clienteId: `cli-${Date.now().toString().slice(-4)}`,
              clienteNome: novoLancamento.parceiroNome,
              clienteCnpjCpf: novoLancamento.parceiroCnpjCpf || '00.000.000/0001-00',
              numeroDocumento: novoLancamento.numeroDocumento,
              descricao: novoLancamento.descricao,
              origem: novoLancamento.origem,
              categoriaFinanceiraId: novoLancamento.categoriaFinanceiraId || undefined,
              centroCustoId: novoLancamento.centroCustoId || undefined,
              planoContaId: novoLancamento.planoContaId || undefined,
              valorOriginal: Number(novoLancamento.valorOriginal),
              dataEmissao: novoLancamento.dataEmissao,
              dataVencimentoPrimeira: novoLancamento.dataVencimentoPrimeira,
              totalParcelas: Number(novoLancamento.totalParcelas),
              intervaloDias: Number(novoLancamento.intervaloDias),
              formaRecebimentoPrevista: novoLancamento.formaPagamentoPrevista,
              linhaDigitavel: novoLancamento.linhaDigitavel,
              usuarioId: 'u-digitador',
              usuarioNome: 'Operador Comercial/Financeiro',
            };

      const res = await fetch('/api/v1/financeiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          action,
          payload,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Título ${novoLancamento.tipo === 'PAGAR' ? 'a Pagar' : 'a Receber'} gerado com sucesso em ${novoLancamento.totalParcelas}x!`);
        setActiveSubTab(novoLancamento.tipo === 'PAGAR' ? 'contas_pagar' : 'contas_receber');
        carregarDadosFinanceiros();
      } else {
        setErrorMsg(data.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleExecutarRenegociacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (renegForm.titulosIdsSelecionados.length === 0) {
      setErrorMsg('Selecione pelo menos um título para renegociação.');
      return;
    }

    try {
      const res = await fetch('/api/v1/financeiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          action: 'renegociar-titulos',
          payload: {
            tipo: renegForm.tipo,
            parceiroId: renegForm.parceiroId || 'parc-reneg-01',
            parceiroNome: renegForm.parceiroNome || 'Parceiro em Renegociação',
            titulosIds: renegForm.titulosIdsSelecionados,
            valorJurosAcordo: Number(renegForm.valorJurosAcordo),
            valorDescontoAcordo: Number(renegForm.valorDescontoAcordo),
            quantidadeNovasParcelas: Number(renegForm.quantidadeNovasParcelas),
            intervaloDias: Number(renegForm.intervaloDias),
            primeiroVencimento: renegForm.primeiroVencimento,
            motivo: renegForm.motivo,
            usuarioId: 'u-gerente-financeiro',
            usuarioNome: 'Gerente Financeiro (Acordo SoD)',
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Acordo de Renegociação formalizado! Títulos anteriores liquidados e novo plano ativo.');
        setRenegForm({
          tipo: 'PAGAR',
          parceiroId: '',
          parceiroNome: '',
          titulosIdsSelecionados: [],
          valorJurosAcordo: 0,
          valorDescontoAcordo: 0,
          quantidadeNovasParcelas: 3,
          intervaloDias: 30,
          primeiroVencimento: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
          motivo: 'Acordo amigável para alongamento de fluxo de caixa',
        });
        setActiveSubTab('contas_pagar');
        carregarDadosFinanceiros();
      } else {
        setErrorMsg(data.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCriarAdiantamento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/financeiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          action: 'criar-adiantamento',
          payload: {
            tipo: adiantamentoForm.tipo,
            parceiroId: `parc-ad-${Date.now()}`,
            parceiroNome: adiantamentoForm.parceiroNome,
            parceiroCnpjCpf: adiantamentoForm.parceiroCnpjCpf || '00.000.000/0001-00',
            numeroDocumento: adiantamentoForm.numeroDocumento,
            valorOriginal: Number(adiantamentoForm.valorOriginal),
            formaPagamento: adiantamentoForm.formaPagamento,
            observacoes: adiantamentoForm.observacoes,
            usuarioId: 'u-tesoureiro',
            usuarioNome: 'Tesoureiro (Adiantamento)',
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Adiantamento registrado com sucesso!');
        setAdiantamentoForm({
          tipo: 'A_FORNECEDOR',
          parceiroNome: '',
          parceiroCnpjCpf: '',
          numeroDocumento: '',
          valorOriginal: 5000,
          formaPagamento: 'PIX',
          observacoes: '',
        });
        carregarDadosFinanceiros();
      } else {
        setErrorMsg(data.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCompensarAdiantamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalCompensacao || !compensacaoAlvo.tituloId || !compensacaoAlvo.parcelaId) {
      setErrorMsg('Selecione o título e a parcela para compensação.');
      return;
    }

    try {
      const res = await fetch('/api/v1/financeiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: empresaAtiva.id,
          action: 'compensar-adiantamento',
          adiantamentoId: modalCompensacao.adiantamento.id,
          tituloId: compensacaoAlvo.tituloId,
          parcelaId: compensacaoAlvo.parcelaId,
          tipoTitulo: modalCompensacao.tipo,
          valorCompensar: Number(compensacaoAlvo.valorCompensar),
          usuarioId: 'u-controladoria',
          usuarioNome: 'Controladoria (Compensação)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Crédito de adiantamento compensado com sucesso na parcela selecionada!');
        setModalCompensacao(null);
        carregarDadosFinanceiros();
      } else {
        setErrorMsg(data.error);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Filtragem de Contas a Pagar
  const filteredContasPagar = contasPagar.filter((cp) => {
    const matchStatus = filtroStatusPagar === 'TODOS' || cp.status === filtroStatusPagar;
    const matchBusca =
      cp.fornecedorNome.toLowerCase().includes(buscaTexto.toLowerCase()) ||
      cp.numeroDocumento.toLowerCase().includes(buscaTexto.toLowerCase()) ||
      cp.descricao.toLowerCase().includes(buscaTexto.toLowerCase());
    return matchStatus && matchBusca;
  });

  // Filtragem de Contas a Receber
  const filteredContasReceber = contasReceber.filter((cr) => {
    const matchStatus = filtroStatusReceber === 'TODOS' || cr.status === filtroStatusReceber;
    const matchBusca =
      cr.clienteNome.toLowerCase().includes(buscaTexto.toLowerCase()) ||
      cr.numeroDocumento.toLowerCase().includes(buscaTexto.toLowerCase()) ||
      cr.descricao.toLowerCase().includes(buscaTexto.toLowerCase());
    return matchStatus && matchBusca;
  });

  const getStatusBadge = (status: StatusTituloFinanceiro) => {
    switch (status) {
      case 'APROVADO':
      case 'EM_ABERTO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">EM ABERTO</span>;
      case 'PENDENTE_APROVACAO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">PENDENTE APROVAÇÃO</span>;
      case 'PARCIALMENTE_PAGO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">PARCIALMENTE PAGO</span>;
      case 'LIQUIDADO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">LIQUIDADO</span>;
      case 'CANCELADO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">CANCELADO</span>;
      case 'RENEGOCIADO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">RENEGOCIADO</span>;
      case 'REJEITADO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">REJEITADO</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {successMsg && (
        <div className="bg-emerald-600 text-white text-xs px-4 py-3 rounded-lg shadow-sm flex items-center justify-between font-sans">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-600 text-white text-xs px-4 py-3 rounded-lg shadow-sm flex items-center justify-between font-sans">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner: Módulo Financeiro & Contexto Multiempresa */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                MÓDULO FINANCEIRO • AP/AR & TESOURARIA
              </span>
              <span className="text-xs text-slate-400 font-mono">SoD & Isolamento Estrito</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-600" />
              Gestão Financeira & Controladoria — {empresaAtiva.nomeFantasia}
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Núcleo transacional financeiro com controle de títulos a pagar e a receber, parcelamentos, baixas parciais,
              juros/multas, renegociações de dívidas, adiantamentos, segregação de funções (SoD) e plano de contas industrial.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setNovoLancamento((prev) => ({ ...prev, tipo: 'PAGAR' }));
                setActiveSubTab('novo_lancamento');
              }}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo a Pagar
            </button>
            <button
              onClick={() => {
                setNovoLancamento((prev) => ({ ...prev, tipo: 'RECEBER' }));
                setActiveSubTab('novo_lancamento');
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo a Receber
            </button>
            <button
              onClick={carregarDadosFinanceiros}
              disabled={loading}
              className="p-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
              title="Recarregar dados"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Subtabs Navigation */}
        <div className="flex overflow-x-auto gap-2 border-t border-slate-100 mt-6 pt-4 scrollbar-none">
          <button
            onClick={() => setActiveSubTab('visao_geral')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'visao_geral' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            Visão Geral & Fluxo de Caixa
          </button>
          <button
            onClick={() => setActiveSubTab('contas_pagar')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'contas_pagar' ? 'bg-rose-600 text-white' : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Contas a Pagar ({contasPagar.length})
          </button>
          <button
            onClick={() => setActiveSubTab('contas_receber')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'contas_receber' ? 'bg-emerald-600 text-white' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Contas a Receber ({contasReceber.length})
          </button>
          <button
            onClick={() => setActiveSubTab('novo_lancamento')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'novo_lancamento' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Lançamento / Parcelamento
          </button>
          <button
            onClick={() => setActiveSubTab('renegociacao')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'renegociacao' ? 'bg-purple-600 text-white' : 'text-purple-700 bg-purple-50 hover:bg-purple-100'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Renegociação de Dívidas
          </button>
          <button
            onClick={() => setActiveSubTab('adiantamentos')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'adiantamentos' ? 'bg-amber-600 text-white' : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            Adiantamentos & Créditos ({adiantamentos.length})
          </button>
          <button
            onClick={() => setActiveSubTab('cadastros')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'cadastros' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Plano de Contas & C.Custo
          </button>
          <button
            onClick={() => setActiveSubTab('auditoria')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'auditoria' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Auditoria & SoD ({auditoriaLogs.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: VISÃO GERAL & FLUXO DE CAIXA */}
      {/* ========================================================================= */}
      {activeSubTab === 'visao_geral' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total a Receber */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total a Receber</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                R$ {(resumo?.totalReceberAberto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-emerald-600 font-semibold">
                  Hoje: R$ {(resumo?.totalReceberHoje || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-rose-600 font-semibold">
                  Vencido: R$ {(resumo?.totalReceberVencido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Total a Pagar */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total a Pagar</span>
                <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <TrendingDown className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                R$ {(resumo?.totalPagarAberto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-rose-600 font-semibold">
                  Hoje: R$ {(resumo?.totalPagarHoje || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-amber-600 font-semibold">
                  {resumo?.totalTitulosPendentesAprovacao || 0} Pend. Aprovação
                </span>
              </div>
            </div>

            {/* Saldo Líquido Projetado */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Saldo Projetado</span>
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className={`text-2xl font-bold mt-2 ${(resumo?.saldoProjetado || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                R$ {(resumo?.saldoProjetado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1.5"></span>
                Diferença AR - AP em Aberto
              </div>
            </div>

            {/* Adiantamentos & Inadimplência */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inadimplência & Adiant.</span>
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {resumo?.indiceInadimplenciaPercent || 0}% <span className="text-xs font-normal text-slate-400">taxa</span>
              </div>
              <div className="mt-2 text-xs text-amber-700 font-medium">
                Adiant. Fornecedor: R$ {(resumo?.totalAdiantamentosFornecedorDisponivel || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Gráfico / Grade de Fluxo de Caixa Projetado */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Fluxo de Caixa Diário Projetado (Próximos 15 dias)
                </h3>
                <p className="text-xs text-slate-500">Saldo de abertura operacional projetado com vencimentos e recebimentos diários</p>
              </div>
              <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded font-bold border border-blue-200">
                Regime de Competência & Caixa
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-3">Data</th>
                    <th className="p-3">Dia</th>
                    <th className="p-3 text-emerald-700">Previsto Receber</th>
                    <th className="p-3 text-rose-700">Previsto Pagar</th>
                    <th className="p-3">Saldo do Dia</th>
                    <th className="p-3 text-right">Saldo Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fluxoCaixa.map((f, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-medium">{f.data}</td>
                      <td className="p-3 text-slate-500 font-semibold">{f.diaSemana}</td>
                      <td className="p-3 font-mono text-emerald-700 font-semibold">
                        {f.totalPrevistoReceber > 0
                          ? `+ R$ ${f.totalPrevistoReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </td>
                      <td className="p-3 font-mono text-rose-700 font-semibold">
                        {f.totalPrevistoPagar > 0
                          ? `- R$ ${f.totalPrevistoPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </td>
                      <td className={`p-3 font-mono font-bold ${f.saldoDia >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {f.saldoDia !== 0
                          ? `${f.saldoDia > 0 ? '+' : ''} R$ ${f.saldoDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : 'R$ 0,00'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        R$ {f.saldoAcumulado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DRE Gerencial Sintético */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  DRE Gerencial Industrial Sintético
                </h3>
                <p className="text-xs text-slate-500">Demonstrativo de Resultado do Exercício com EBITDA e Lucro Líquido</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {dre.map((item) => (
                <div
                  key={item.codigo}
                  className={`p-3 rounded-lg flex items-center justify-between ${
                    item.tipo === 'RESULTADO'
                      ? 'bg-slate-900 text-white font-bold'
                      : item.tipo === 'RECEITA'
                      ? 'bg-emerald-50 text-emerald-950 font-semibold'
                      : item.tipo === 'CUSTO' || item.tipo === 'DESPESA' || item.tipo === 'DEDUCAO'
                      ? 'bg-slate-50 text-slate-800'
                      : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-400 font-bold">{item.codigo}.</span>
                    <span>{item.descricao}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-mono text-slate-400">{item.percentualSobreReceita.toFixed(1)}%</span>
                    <span className="font-mono font-bold min-w-[120px] text-right">
                      R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: CONTAS A PAGAR (AP) */}
      {/* ========================================================================= */}
      {activeSubTab === 'contas_pagar' && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por fornecedor, documento ou descrição..."
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md px-3 py-2 w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-rose-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filtroStatusPagar}
                onChange={(e) => setFiltroStatusPagar(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-600 font-semibold"
              >
                <option value="TODOS">Todos os Status ({contasPagar.length})</option>
                <option value="PENDENTE_APROVACAO">Pendente Aprovação (SoD)</option>
                <option value="APROVADO">Aprovados / Em Aberto</option>
                <option value="PARCIALMENTE_PAGO">Parcialmente Pagos</option>
                <option value="LIQUIDADO">Liquidados</option>
                <option value="RENEGOCIADO">Renegociados</option>
                <option value="CANCELADO">Cancelados</option>
              </select>
            </div>
          </div>

          {/* Tabela de Contas a Pagar */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3">Documento</th>
                    <th className="p-3">Fornecedor</th>
                    <th className="p-3">Origem / Centro de Custo</th>
                    <th className="p-3">1º Vencimento</th>
                    <th className="p-3">Valor Total</th>
                    <th className="p-3">Saldo Restante</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredContasPagar.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">
                        Nenhum título a pagar encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredContasPagar.map((cp) => (
                      <React.Fragment key={cp.id}>
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-900">
                            {cp.numeroDocumento}
                            <span className="text-[10px] text-slate-400 block font-normal">{cp.totalParcelas} parcela(s)</span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-800 block">{cp.fornecedorNome}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{cp.fornecedorCnpjCpf}</span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {cp.origem}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{cp.centroCustoNome || 'Geral'}</span>
                          </td>
                          <td className="p-3 font-mono text-slate-700">{cp.dataVencimentoPrimeira}</td>
                          <td className="p-3 font-mono font-bold text-slate-900">
                            R$ {cp.valorTotalLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 font-mono font-bold text-rose-700">
                            R$ {cp.valorSaldoRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3">{getStatusBadge(cp.status)}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botão de Segregação SoD: Aprovar */}
                              {cp.status === 'PENDENTE_APROVACAO' && (
                                <>
                                  <button
                                    onClick={() => handleAprovarRejeitarPagar(cp.id, true)}
                                    title="Aprovar Título (SoD)"
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200 transition-colors"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleAprovarRejeitarPagar(cp.id, false)}
                                    title="Rejeitar Título"
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md border border-rose-200 transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => setSelectedContaPagar(selectedContaPagar?.id === cp.id ? null : cp)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                {selectedContaPagar?.id === cp.id ? 'Recolher' : 'Parcelas'}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Detalhamento de Parcelas Expandido */}
                        {selectedContaPagar?.id === cp.id && (
                          <tr className="bg-slate-50/90 border-b border-slate-200">
                            <td colSpan={8} className="p-4">
                              <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Grade de Parcelas & Baixas ({cp.parcelas.length}) — Título: {cp.numeroDocumento}
                                  </span>
                                  <span className="text-xs text-slate-500 font-mono">
                                    Criado por: {cp.criadoPorUsuarioNome} {cp.aprovadoPorUsuarioNome && `| Aprovado por: ${cp.aprovadoPorUsuarioNome}`}
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  {cp.parcelas.map((parc) => (
                                    <div
                                      key={parc.id}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs gap-3"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-bold flex items-center justify-center font-mono text-[11px]">
                                          {parc.numeroParcela}
                                        </span>
                                        <div>
                                          <span className="font-bold text-slate-800">
                                            Vencimento: {parc.dataVencimento}
                                          </span>
                                          <span className="text-[10px] text-slate-500 block">
                                            Previsto: {parc.formaPagamentoPrevista}{' '}
                                            {parc.codigoBarrasBoleto && `• Código de Barras: ${parc.codigoBarrasBoleto.slice(0, 15)}...`}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-4">
                                        <div>
                                          <span className="text-[10px] text-slate-400 block uppercase">Nominal</span>
                                          <span className="font-mono font-semibold">R$ {parc.valorNominal.toFixed(2)}</span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-slate-400 block uppercase">Pago</span>
                                          <span className="font-mono font-semibold text-emerald-700">R$ {parc.valorPago.toFixed(2)}</span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-slate-400 block uppercase">Saldo</span>
                                          <span className="font-mono font-bold text-rose-700">R$ {parc.valorSaldo.toFixed(2)}</span>
                                        </div>
                                        <div>{getStatusBadge(parc.statusParcela as any)}</div>

                                        {parc.statusParcela !== 'LIQUIDADA' && cp.status !== 'CANCELADO' && cp.status !== 'PENDENTE_APROVACAO' && (
                                          <button
                                            onClick={() =>
                                              handleAbrirModalBaixa('PAGAR', cp.id, parc, cp.numeroDocumento, cp.fornecedorNome)
                                            }
                                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-md shadow-xs transition-colors flex items-center gap-1"
                                          >
                                            <DollarSign className="w-3 h-3" />
                                            Pagar / Baixar
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: CONTAS A RECEBER (AR) */}
      {/* ========================================================================= */}
      {activeSubTab === 'contas_receber' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, duplicata ou pedido..."
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md px-3 py-2 w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filtroStatusReceber}
                onChange={(e) => setFiltroStatusReceber(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
              >
                <option value="TODOS">Todos os Status ({contasReceber.length})</option>
                <option value="APROVADO">Em Aberto</option>
                <option value="PARCIALMENTE_PAGO">Parcialmente Recebidos</option>
                <option value="LIQUIDADO">Liquidados</option>
                <option value="RENEGOCIADO">Renegociados</option>
                <option value="CANCELADO">Cancelados</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3">Documento</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Origem / Vínculo</th>
                    <th className="p-3">1º Vencimento</th>
                    <th className="p-3">Valor Total</th>
                    <th className="p-3">Saldo a Receber</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredContasReceber.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">
                        Nenhum título a receber encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredContasReceber.map((cr) => (
                      <React.Fragment key={cr.id}>
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-900">
                            {cr.numeroDocumento}
                            <span className="text-[10px] text-slate-400 block font-normal">{cr.totalParcelas} parcela(s)</span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-800 block">{cr.clienteNome}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{cr.clienteCnpjCpf}</span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {cr.origem}
                            </span>
                            {cr.documentoFiscalId && (
                              <span className="text-[10px] text-blue-600 block mt-0.5 font-mono">NF-e Vinculada</span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-slate-700">{cr.dataVencimentoPrimeira}</td>
                          <td className="p-3 font-mono font-bold text-slate-900">
                            R$ {cr.valorTotalLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-700">
                            R$ {cr.valorSaldoRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3">{getStatusBadge(cr.status)}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedContaReceber(selectedContaReceber?.id === cr.id ? null : cr)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-[11px] font-semibold flex items-center gap-1 ml-auto transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              {selectedContaReceber?.id === cr.id ? 'Recolher' : 'Parcelas'}
                            </button>
                          </td>
                        </tr>

                        {selectedContaReceber?.id === cr.id && (
                          <tr className="bg-slate-50/90 border-b border-slate-200">
                            <td colSpan={8} className="p-4">
                              <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Grade de Duplicatas / Recebimento — Título: {cr.numeroDocumento}
                                  </span>
                                  <span className="text-xs text-slate-500 font-mono">
                                    Criado por: {cr.criadoPorUsuarioNome}
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  {cr.parcelas.map((parc) => (
                                    <div
                                      key={parc.id}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs gap-3"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-md bg-emerald-800 text-white font-bold flex items-center justify-center font-mono text-[11px]">
                                          {parc.numeroParcela}
                                        </span>
                                        <div>
                                          <span className="font-bold text-slate-800">
                                            Vencimento: {parc.dataVencimento}
                                          </span>
                                          <span className="text-[10px] text-slate-500 block">
                                            Previsto: {parc.formaRecebimentoPrevista}{' '}
                                            {parc.nossoNumero && `• Nosso Nº: ${parc.nossoNumero}`}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-4">
                                        <div>
                                          <span className="text-[10px] text-slate-400 block uppercase">Nominal</span>
                                          <span className="font-mono font-semibold">R$ {parc.valorNominal.toFixed(2)}</span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-slate-400 block uppercase">Recebido</span>
                                          <span className="font-mono font-semibold text-emerald-700">R$ {parc.valorRecebido.toFixed(2)}</span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-slate-400 block uppercase">Saldo</span>
                                          <span className="font-mono font-bold text-emerald-700">R$ {parc.valorSaldo.toFixed(2)}</span>
                                        </div>
                                        <div>{getStatusBadge(parc.statusParcela as any)}</div>

                                        {parc.statusParcela !== 'LIQUIDADA' && cr.status !== 'CANCELADO' && (
                                          <button
                                            onClick={() =>
                                              handleAbrirModalBaixa('RECEBER', cr.id, parc, cr.numeroDocumento, cr.clienteNome)
                                            }
                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-md shadow-xs transition-colors flex items-center gap-1"
                                          >
                                            <DollarSign className="w-3 h-3" />
                                            Baixar Recebimento
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: NOVO LANÇAMENTO / PARCELAMENTO INTELIGENTE */}
      {/* ========================================================================= */}
      {activeSubTab === 'novo_lancamento' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-4xl mx-auto">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Lançamento Financeiro Manual com Parcelamento Automático
            </h3>
            <p className="text-xs text-slate-500">
              Gere títulos a pagar ou a receber com parametrização de centros de custo, categorias e regras de aprovação SoD.
            </p>
          </div>

          <form onSubmit={handleCriarNovoLancamento} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tipo de Título */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Título *</label>
                <div className="flex rounded-md shadow-xs">
                  <button
                    type="button"
                    onClick={() => setNovoLancamento({ ...novoLancamento, tipo: 'PAGAR' })}
                    className={`flex-1 py-2 text-xs font-bold rounded-l-md border ${
                      novoLancamento.tipo === 'PAGAR'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Contas a Pagar (AP)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNovoLancamento({ ...novoLancamento, tipo: 'RECEBER' })}
                    className={`flex-1 py-2 text-xs font-bold rounded-r-md border ${
                      novoLancamento.tipo === 'RECEBER'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Contas a Receber (AR)
                  </button>
                </div>
              </div>

              {/* Número do Documento */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Número do Documento / Nota Fiscal *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: NF-12984, DUP-0041, CTR-2026"
                  value={novoLancamento.numeroDocumento}
                  onChange={(e) => setNovoLancamento({ ...novoLancamento, numeroDocumento: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md p-2 focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nome do Fornecedor / Cliente */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {novoLancamento.tipo === 'PAGAR' ? 'Nome do Fornecedor *' : 'Nome do Cliente *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Razão Social ou Nome Fantasia"
                  value={novoLancamento.parceiroNome}
                  onChange={(e) => setNovoLancamento({ ...novoLancamento, parceiroNome: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md p-2 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* CNPJ / CPF */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ / CPF do Parceiro</label>
                <input
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={novoLancamento.parceiroCnpjCpf}
                  onChange={(e) => setNovoLancamento({ ...novoLancamento, parceiroCnpjCpf: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md p-2 focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Descrição do Título *</label>
              <input
                type="text"
                required
                placeholder="Ex: Aquisição de matéria-prima para OP-882, Serviços de Usinagem, etc."
                value={novoLancamento.descricao}
                onChange={(e) => setNovoLancamento({ ...novoLancamento, descricao: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md p-2 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Classificações */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Centro de Custo</label>
                <select
                  value={novoLancamento.centroCustoId}
                  onChange={(e) => setNovoLancamento({ ...novoLancamento, centroCustoId: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md p-2 focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Selecione o Centro de Custo</option>
                  {centrosCusto.map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      {cc.codigo} — {cc.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoria Financeira</label>
                <select
                  value={novoLancamento.categoriaFinanceiraId}
                  onChange={(e) => setNovoLancamento({ ...novoLancamento, categoriaFinanceiraId: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md p-2 focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Selecione a Categoria</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome} ({cat.tipo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Plano de Contas</label>
                <select
                  value={novoLancamento.planoContaId}
                  onChange={(e) => setNovoLancamento({ ...novoLancamento, planoContaId: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md p-2 focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Selecione a Conta Contábil</option>
                  {planoContas.map((pc) => (
                    <option key={pc.id} value={pc.id}>
                      {pc.codigoEstrutural} — {pc.nomeConta}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Parâmetros Financeiros e Parcelamento */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                Valores & Grade de Parcelamento
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valor Total (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={novoLancamento.valorOriginal}
                    onChange={(e) => setNovoLancamento({ ...novoLancamento, valorOriginal: Number(e.target.value) })}
                    className="w-full text-xs bg-white border border-slate-200 rounded-md p-2 font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nº de Parcelas *</label>
                  <select
                    value={novoLancamento.totalParcelas}
                    onChange={(e) => setNovoLancamento({ ...novoLancamento, totalParcelas: Number(e.target.value) })}
                    className="w-full text-xs bg-white border border-slate-200 rounded-md p-2 font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 10, 12, 24, 36, 48].map((n) => (
                      <option key={n} value={n}>
                        {n}x de R$ {(novoLancamento.valorOriginal / n).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">1º Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={novoLancamento.dataVencimentoPrimeira}
                    onChange={(e) => setNovoLancamento({ ...novoLancamento, dataVencimentoPrimeira: e.target.value })}
                    className="w-full text-xs bg-white border border-slate-200 rounded-md p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Forma de Pagamento</label>
                  <select
                    value={novoLancamento.formaPagamentoPrevista}
                    onChange={(e) =>
                      setNovoLancamento({ ...novoLancamento, formaPagamentoPrevista: e.target.value as any })
                    }
                    className="w-full text-xs bg-white border border-slate-200 rounded-md p-2 font-semibold"
                  >
                    <option value="BOLETO">Boleto Bancário</option>
                    <option value="PIX">PIX Dinâmico</option>
                    <option value="TED">Transferência TED</option>
                    <option value="CARTAO_CREDITO">Cartão Corporativo</option>
                    <option value="CHEQUE">Cheque Custodiado</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSubTab('visao_geral')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Salvar e Gerar Parcelas
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 5: RENEGOCIAÇÃO DE DÍVIDAS */}
      {/* ========================================================================= */}
      {activeSubTab === 'renegociacao' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-4xl mx-auto">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-purple-600" />
              Módulo de Renegociação de Dívidas & Consolidação de Títulos
            </h3>
            <p className="text-xs text-slate-500">
              Substitui múltiplos títulos vencidos ou a vencer em um novo acordo parcelado com auditoria completa.
            </p>
          </div>

          <form onSubmit={handleExecutarRenegociacao} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Renegociação *</label>
                <select
                  value={renegForm.tipo}
                  onChange={(e) =>
                    setRenegForm({ ...renegForm, tipo: e.target.value as any, titulosIdsSelecionados: [] })
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md p-2 font-bold"
                >
                  <option value="PAGAR">Renegociação com Fornecedor (Contas a Pagar)</option>
                  <option value="RECEBER">Renegociação com Cliente (Contas a Receber)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo do Acordo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Prorrogação de prazo com juros de 1.5% a.m."
                  value={renegForm.motivo}
                  onChange={(e) => setRenegForm({ ...renegForm, motivo: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md p-2"
                />
              </div>
            </div>

            {/* Seleção de Títulos */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Selecione os Títulos em Aberto para Consolidar
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {(renegForm.tipo === 'PAGAR' ? contasPagar : contasReceber)
                  .filter((t) => t.status === 'EM_ABERTO' || t.status === 'APROVADO' || t.status === 'PARCIALMENTE_PAGO')
                  .map((t: any) => {
                    const isSelected = renegForm.titulosIdsSelecionados.includes(t.id);
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          const novos = isSelected
                            ? renegForm.titulosIdsSelecionados.filter((id) => id !== t.id)
                            : [...renegForm.titulosIdsSelecionados, t.id];
                          setRenegForm({
                            ...renegForm,
                            titulosIdsSelecionados: novos,
                            parceiroId: t.fornecedorId || t.clienteId,
                            parceiroNome: t.fornecedorNome || t.clienteNome,
                          });
                        }}
                        className={`p-3 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-purple-50 border-purple-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={isSelected} readOnly className="rounded text-purple-600" />
                          <div>
                            <span className="font-bold text-slate-900">{t.numeroDocumento}</span> —{' '}
                            <span className="text-slate-600">{t.fornecedorNome || t.clienteNome}</span>
                            <span className="text-[10px] text-slate-400 block">{t.descricao}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900">
                            Saldo: R$ {t.valorSaldoRestante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-400 block">Venc: {t.dataVencimentoPrimeira}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Ajustes de Acordo */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Acréscimo / Juros (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={renegForm.valorJurosAcordo}
                  onChange={(e) => setRenegForm({ ...renegForm, valorJurosAcordo: Number(e.target.value) })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-md p-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Desconto / Abatimento (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={renegForm.valorDescontoAcordo}
                  onChange={(e) => setRenegForm({ ...renegForm, valorDescontoAcordo: Number(e.target.value) })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-md p-2 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Novas Parcelas</label>
                <select
                  value={renegForm.quantidadeNovasParcelas}
                  onChange={(e) => setRenegForm({ ...renegForm, quantidadeNovasParcelas: Number(e.target.value) })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-md p-2 font-bold"
                >
                  {[1, 2, 3, 4, 6, 12, 18, 24].map((n) => (
                    <option key={n} value={n}>
                      {n} parcelas mensais
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">1º Novo Vencimento</label>
                <input
                  type="date"
                  required
                  value={renegForm.primeiroVencimento}
                  onChange={(e) => setRenegForm({ ...renegForm, primeiroVencimento: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-md p-2 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={renegForm.titulosIdsSelecionados.length === 0}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Formalizar Acordo de Renegociação
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 6: ADIANTAMENTOS & CRÉDITOS */}
      {/* ========================================================================= */}
      {activeSubTab === 'adiantamentos' && (
        <div className="space-y-6">
          {/* Form Rápido de Novo Adiantamento */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-600" />
              Lançar Novo Adiantamento Financeiro
            </h3>

            <form onSubmit={handleCriarAdiantamento} className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo</label>
                <select
                  value={adiantamentoForm.tipo}
                  onChange={(e) => setAdiantamentoForm({ ...adiantamentoForm, tipo: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 font-semibold"
                >
                  <option value="A_FORNECEDOR">A Fornecedor (Pagar)</option>
                  <option value="DE_CLIENTE">De Cliente (Receber)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Parceiro *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do Parceiro"
                  value={adiantamentoForm.parceiroNome}
                  onChange={(e) => setAdiantamentoForm({ ...adiantamentoForm, parceiroNome: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nº Documento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ADT-098"
                  value={adiantamentoForm.numeroDocumento}
                  onChange={(e) => setAdiantamentoForm({ ...adiantamentoForm, numeroDocumento: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={adiantamentoForm.valorOriginal}
                  onChange={(e) => setAdiantamentoForm({ ...adiantamentoForm, valorOriginal: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 font-mono font-bold"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-md shadow-xs transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Lançar Adiantamento
                </button>
              </div>
            </form>
          </div>

          {/* Tabela de Adiantamentos */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Saldos de Adiantamento Disponíveis para Compensação
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3">Documento</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Parceiro</th>
                    <th className="p-3">Data</th>
                    <th className="p-3">Valor Original</th>
                    <th className="p-3">Compensado</th>
                    <th className="p-3">Saldo Disponível</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adiantamentos.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-400">
                        Nenhum adiantamento registrado.
                      </td>
                    </tr>
                  ) : (
                    adiantamentos.map((ad) => (
                      <tr key={ad.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-900">{ad.numeroDocumento}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ad.tipo === 'A_FORNECEDOR' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {ad.tipo === 'A_FORNECEDOR' ? 'A Fornecedor' : 'De Cliente'}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-800">{ad.parceiroNome}</td>
                        <td className="p-3 font-mono text-slate-600">{ad.dataAdiantamento}</td>
                        <td className="p-3 font-mono font-semibold">
                          R$ {ad.valorOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 font-mono text-slate-500">
                          R$ {ad.valorCompensado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-700">
                          R$ {ad.valorSaldoDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                            {ad.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {ad.valorSaldoDisponivel > 0 && (
                            <button
                              onClick={() => {
                                setModalCompensacao({
                                  adiantamento: ad,
                                  tipo: ad.tipo === 'A_FORNECEDOR' ? 'PAGAR' : 'RECEBER',
                                });
                                setCompensacaoAlvo({
                                  tituloId: '',
                                  parcelaId: '',
                                  valorCompensar: ad.valorSaldoDisponivel,
                                });
                              }}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold shadow-xs transition-colors"
                            >
                              Compensar em Título
                            </button>
                          )}
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
      {/* SUBTAB 7: PLANO DE CONTAS & CENTROS DE CUSTO */}
      {/* ========================================================================= */}
      {activeSubTab === 'cadastros' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plano de Contas */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Estrutura do Plano de Contas ({planoContas.length})
              </h3>
              <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                Padrão IFRS / Gerencial
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-1 text-xs">
              {planoContas.map((pc) => (
                <div
                  key={pc.id}
                  className={`p-2 rounded flex items-center justify-between font-mono ${
                    pc.tipoConta === 'SINTETICA' ? 'bg-slate-100 font-bold text-slate-900' : 'pl-6 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">{pc.codigoEstrutural}</span>
                    <span>{pc.nomeConta}</span>
                  </div>
                  <span className={`text-[10px] ${pc.natureza === 'DEVEDORA' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {pc.natureza}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Centros de Custo & Categorias */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Centros de Custo Fabris & Administrativos
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                {centrosCusto.map((cc) => (
                  <div key={cc.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900">{cc.codigo}</span> —{' '}
                      <span className="font-semibold text-slate-800">{cc.nome}</span>
                      <span className="text-[10px] text-slate-400 block">Resp: {cc.responsavel}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">{cc.tipo}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-purple-600" />
                  Categorias Financeiras
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {categorias.map((cat) => (
                  <span
                    key={cat.id}
                    className="px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5"
                    style={{ borderColor: cat.corHex, color: cat.corHex, backgroundColor: `${cat.corHex}10` }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.corHex }}></span>
                    {cat.nome} ({cat.tipo})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 8: TRILHA DE AUDITORIA & SEGREGAÇÃO (SoD) */}
      {/* ========================================================================= */}
      {activeSubTab === 'auditoria' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Trilha de Auditoria Imutável (SoD - Segregação de Funções)
              </h3>
              <p className="text-xs text-slate-500">Histórico detalhado de criações, aprovações, baixas e renegociações</p>
            </div>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-bold border border-slate-200">
              Append-Only No-Delete
            </span>
          </div>

          <div className="space-y-3">
            {auditoriaLogs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-white">
                      {log.acao}
                    </span>
                    <span className="font-bold text-slate-800">{log.tituloOuDocumentoRef}</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-slate-600">{log.detalhes}</p>
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-3">
                  <span>Usuário: {log.usuarioNome}</span>
                  <span>ID: {log.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE BAIXA / PAGAMENTO / RECEBIMENTO */}
      {/* ========================================================================= */}
      {modalBaixa && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  {modalBaixa.tipo === 'PAGAR' ? 'Efetivar Pagamento (Baixa AP)' : 'Registrar Recebimento (Baixa AR)'}
                </h3>
                <p className="text-xs text-slate-500">
                  {modalBaixa.parceiroNome} • Doc: {modalBaixa.tituloDoc} (Parc {modalBaixa.parcela.numeroParcela}/
                  {modalBaixa.parcela.totalParcelas})
                </p>
              </div>
              <button onClick={() => setModalBaixa(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecutarBaixa} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Saldo da Parcela</span>
                  <span className="text-base font-mono font-bold text-slate-900">
                    R$ {modalBaixa.parcela.valorSaldo.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Vencimento Original</span>
                  <span className="text-sm font-mono text-slate-700">{modalBaixa.parcela.dataVencimento}</span>
                </div>
              </div>

              {/* Valores da Baixa */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor Efetivo da Baixa (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={baixaForm.valorBaixa}
                    onChange={(e) => setBaixaForm({ ...baixaForm, valorBaixa: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-md p-2 font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data da Baixa *</label>
                  <input
                    type="date"
                    required
                    value={baixaForm.dataBaixa}
                    onChange={(e) => setBaixaForm({ ...baixaForm, dataBaixa: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-md p-2 font-mono"
                  />
                </div>
              </div>

              {/* Acréscimos e Descontos */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Juros (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={baixaForm.valorJuros}
                    onChange={(e) => setBaixaForm({ ...baixaForm, valorJuros: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-md p-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Multa (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={baixaForm.valorMulta}
                    onChange={(e) => setBaixaForm({ ...baixaForm, valorMulta: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-md p-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Desconto (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={baixaForm.valorDesconto}
                    onChange={(e) => setBaixaForm({ ...baixaForm, valorDesconto: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-md p-1.5 font-mono"
                  />
                </div>
              </div>

              {/* Meio e Conta */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Meio de Pagamento</label>
                  <select
                    value={baixaForm.formaPagamento}
                    onChange={(e) => setBaixaForm({ ...baixaForm, formaPagamento: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-md p-2 font-semibold"
                  >
                    <option value="PIX">PIX Instantâneo</option>
                    <option value="TED">Transferência TED</option>
                    <option value="BOLETO">Boleto Liquidado</option>
                    <option value="CARTAO_CREDITO">Cartão Corporativo</option>
                    <option value="CHEQUE">Cheque Compensado</option>
                    <option value="DINHEIRO">Espécie / Caixa Pequeno</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Autenticação Bancária</label>
                  <input
                    type="text"
                    placeholder="Código do comprovante"
                    value={baixaForm.autenticacaoBancaria}
                    onChange={(e) => setBaixaForm({ ...baixaForm, autenticacaoBancaria: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-md p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Conta Bancária / Caixa</label>
                <input
                  type="text"
                  value={baixaForm.contaBancaria}
                  onChange={(e) => setBaixaForm({ ...baixaForm, contaBancaria: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-md p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalBaixa(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE COMPENSAÇÃO DE ADIANTAMENTO */}
      {/* ========================================================================= */}
      {modalCompensacao && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-600" />
                  Compensar Crédito de Adiantamento
                </h3>
                <p className="text-xs text-slate-500">
                  Adiantamento {modalCompensacao.adiantamento.numeroDocumento} • Saldo: R${' '}
                  {modalCompensacao.adiantamento.valorSaldoDisponivel.toFixed(2)}
                </p>
              </div>
              <button onClick={() => setModalCompensacao(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompensarAdiantamento} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Selecione o Título em Aberto do Parceiro ({modalCompensacao.adiantamento.parceiroNome}) *
                </label>
                <select
                  required
                  value={compensacaoAlvo.tituloId}
                  onChange={(e) => {
                    const tId = e.target.value;
                    const tit: any = (
                      modalCompensacao.tipo === 'PAGAR' ? contasPagar : contasReceber
                    ).find((t) => t.id === tId);
                    const parc = tit?.parcelas.find((p: any) => p.valorSaldo > 0);
                    setCompensacaoAlvo({
                      ...compensacaoAlvo,
                      tituloId: tId,
                      parcelaId: parc ? parc.id : '',
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 font-semibold"
                >
                  <option value="">Selecione o título...</option>
                  {(modalCompensacao.tipo === 'PAGAR' ? contasPagar : contasReceber)
                    .filter((t) => t.status !== 'CANCELADO' && t.status !== 'LIQUIDADO')
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.numeroDocumento} — Saldo: R$ {t.valorSaldoRestante.toFixed(2)} ({t.descricao.slice(0, 30)}...)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Valor a Compensar (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  max={modalCompensacao.adiantamento.valorSaldoDisponivel}
                  required
                  value={compensacaoAlvo.valorCompensar}
                  onChange={(e) => setCompensacaoAlvo({ ...compensacaoAlvo, valorCompensar: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 rounded-md p-2 font-mono font-bold text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalCompensacao(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Efetivar Compensação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
