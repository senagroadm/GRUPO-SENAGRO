'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Calculator,
  Sliders,
  FileText,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  History,
  Eye,
  Edit3,
  Layers,
  ChevronRight,
  TrendingUp,
  Scale,
  ShieldAlert,
  Percent,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Box,
  Wrench,
  Flame,
  Paintbrush,
  Cog,
  Paperclip,
  Check,
  X,
  FileCheck,
  Building,
  User,
  Users,
  Calendar,
  DollarSign,
  Info,
} from 'lucide-react';
import { Empresa } from '../../../backend/core/types/company';
import {
  Orcamento,
  OrcamentoItem,
  OrcamentoVersao,
  HistoricoNegociacaoOrcamento,
  ParametrosCustoEmpresa,
  TipoItemOrcamento,
  TipoProcessoCorte,
  TipoProcessoDobra,
  TipoProcessoSolda,
  TipoProcessoPintura,
  ComposicaoCustoItem,
} from '../../../backend/modules/orcamento/orcamento-types';

interface OrcamentoViewerProps {
  empresaAtiva: Empresa;
}

export function OrcamentoViewer({ empresaAtiva }: OrcamentoViewerProps) {
  const [activeTab, setActiveTab] = useState<'lista' | 'editor' | 'simulador' | 'parametros' | 'proposta' | 'versoes'>('lista');
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [kpis, setKpis] = useState({
    totalOrcado: 0,
    totalAprovados: 0,
    totalPendentes: 0,
    taxaConversao: 0,
    ticketMedio: 0,
  });

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Orçamento Selecionado para Visualização / Proposta / Versões
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null);
  const [selectedVersoes, setSelectedVersoes] = useState<OrcamentoVersao[]>([]);
  const [selectedHistorico, setSelectedHistorico] = useState<HistoricoNegociacaoOrcamento[]>([]);

  // Parâmetros de Custo da Empresa
  const [parametrosCusto, setParametrosCusto] = useState<ParametrosCustoEmpresa | null>(null);
  const [savingParametros, setSavingParametros] = useState<boolean>(false);
  const [paramSuccessMessage, setParamSuccessMessage] = useState<string | null>(null);

  // Estado do Formulário de Criação/Edição
  const [formTitulo, setFormTitulo] = useState<string>('');
  const [formClienteNome, setFormClienteNome] = useState<string>('');
  const [formClienteCnpj, setFormClienteCnpj] = useState<string>('');
  const [formContatoNome, setFormContatoNome] = useState<string>('');
  const [formContatoEmail, setFormContatoEmail] = useState<string>('');
  const [formContatoTelefone, setFormContatoTelefone] = useState<string>('');
  const [formVendedorNome, setFormVendedorNome] = useState<string>('Engenharia Comercial');
  const [formValidadeDias, setFormValidadeDias] = useState<number>(15);
  const [formPrazoEntregaDias, setFormPrazoEntregaDias] = useState<number>(12);
  const [formCondicaoPagamento, setFormCondicaoPagamento] = useState<string>('28 / 42 dias Boleto Bancário');
  const [formTipoFrete, setFormTipoFrete] = useState<'CIF' | 'FOB' | 'RETIRA' | 'SEM_FRETE'>('FOB');
  const [formValorFrete, setFormValorFrete] = useState<number>(0);
  const [formCidadeEntrega, setFormCidadeEntrega] = useState<string>('Goiânia');
  const [formUfEntrega, setFormUfEntrega] = useState<string>('GO');
  const [formObservacoes, setFormObservacoes] = useState<string>(
    'Itens fabricados e cortados com tolerâncias conforme ISO 2768-m. Certificados de matéria-prima inclusos.'
  );

  // Itens em construção no formulário
  const [formItens, setFormItens] = useState<OrcamentoItem[]>([]);

  // Item Modal / Builder State
  const [itemModalOpen, setItemModalOpen] = useState<boolean>(false);
  const [itemTipo, setItemTipo] = useState<TipoItemOrcamento>('PRODUTO_FABRICADO');
  const [itemDescricao, setItemDescricao] = useState<string>('');
  const [itemCodigo, setItemCodigo] = useState<string>('');
  const [itemNcm, setItemNcm] = useState<string>('7326.90.90');
  const [itemUnidade, setItemUnidade] = useState<'UN' | 'PC' | 'KG' | 'M' | 'M2' | 'CJ' | 'HORA' | 'SERVICO'>('UN');
  const [itemQtd, setItemQtd] = useState<number>(1);
  const [itemDescontoPerc, setItemDescontoPerc] = useState<number>(0);
  const [itemMargemAlvoPerc, setItemMargemAlvoPerc] = useState<number>(25);

  // Motores de Custo do Item Modal
  // 1. Material
  const [itemMatTipo, setItemMatTipo] = useState<string>('AÇO CARBONO SAE 1020');
  const [itemMatFormato, setItemMatFormato] = useState<'CHAPA' | 'TUBO_REDONDO' | 'TUBO_QUADRADO' | 'BARRA_CHATA' | 'COMPONENTE_PRONTO'>('CHAPA');
  const [itemMatEspessura, setItemMatEspessura] = useState<number>(4.75);
  const [itemMatLargura, setItemMatLargura] = useState<number>(1500);
  const [itemMatComprimento, setItemMatComprimento] = useState<number>(3000);
  const [itemMatPerda, setItemMatPerda] = useState<number>(1.12);
  const [itemMatPrecoKg, setItemMatPrecoKg] = useState<number>(8.5);

  // 2. Corte
  const [itemCorteProc, setItemCorteProc] = useState<TipoProcessoCorte>('LASER_FIBRA');
  const [itemCorteComprimentoM, setItemCorteComprimentoM] = useState<number>(15);
  const [itemCorteFuros, setItemCorteFuros] = useState<number>(20);

  // 3. Dobra
  const [itemDobraProc, setItemDobraProc] = useState<TipoProcessoDobra>('CNC_SINCRONIZADA');
  const [itemDobraNum, setItemDobraNum] = useState<number>(4);
  const [itemDobraCompMm, setItemDobraCompMm] = useState<number>(1000);

  // 4. Solda
  const [itemSoldaProc, setItemSoldaProc] = useState<TipoProcessoSolda>('NAO_APLICA');
  const [itemSoldaCompMm, setItemSoldaCompMm] = useState<number>(0);
  const [itemSoldaTipoJunta, setItemSoldaTipoJunta] = useState<string>('Filete Contínuo');

  // 5. Pintura
  const [itemPinturaProc, setItemPinturaProc] = useState<TipoProcessoPintura>('NAO_APLICA');
  const [itemPinturaAreaM2, setItemPinturaAreaM2] = useState<number>(0);

  // 6. Montagem
  const [itemMontagemHoras, setItemMontagemHoras] = useState<number>(0);
  const [itemMontagemInsumos, setItemMontagemInsumos] = useState<number>(0);

  // 7. Custo Direto Fixo (caso Produto Pronto ou Serviço Puro)
  const [itemCustoDiretoCustom, setItemCustoDiretoCustom] = useState<number>(0);

  // Simulação do Item em tempo real
  const [itemSimuladoComposicao, setItemSimuladoComposicao] = useState<ComposicaoCustoItem | null>(null);

  // Modal de Aprovação / Rejeição
  const [aprovacaoModalOpen, setAprovacaoModalOpen] = useState<boolean>(false);
  const [aprovacaoAcao, setAprovacaoAcao] = useState<'APROVAR' | 'REJEITAR'>('APROVAR');
  const [aprovacaoJustificativa, setAprovacaoJustificativa] = useState<string>('');

  // Modal de Nova Versão
  const [versaoModalOpen, setVersaoModalOpen] = useState<boolean>(false);
  const [versaoMotivo, setVersaoMotivo] = useState<string>('');

  // Carregar dados de orçamentos e parâmetros da empresa
  const carregarOrcamentos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/orcamentos?empresaId=${empresaAtiva.id}`, {
        headers: { 'x-empresa-id': empresaAtiva.id },
      });
      const data = await res.json();
      if (data.success) {
        setOrcamentos(data.data || []);
        if (data.kpis) setKpis(data.kpis);
      }
    } catch (err) {
      console.error('Erro ao carregar orçamentos:', err);
    } finally {
      setLoading(false);
    }
  }, [empresaAtiva.id]);

  const carregarParametrosCusto = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/orcamentos/parametros-custo?empresaId=${empresaAtiva.id}`, {
        headers: { 'x-empresa-id': empresaAtiva.id },
      });
      const data = await res.json();
      if (data.success) {
        setParametrosCusto(data.data);
      }
    } catch (err) {
      console.error('Erro ao carregar parâmetros de custo:', err);
    }
  }, [empresaAtiva.id]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) {
        await carregarOrcamentos();
        await carregarParametrosCusto();
      }
    })();
    return () => {
      active = false;
    };
  }, [carregarOrcamentos, carregarParametrosCusto]);

  // Recalcular simulação do item em construção
  const simularItemAtual = useCallback(async () => {
    try {
      const bodyPayload: any = {
        empresaId: empresaAtiva.id,
        tipoItem: itemTipo,
        margemLucroDesejadaPercentual: itemMargemAlvoPerc,
        descontoItemPercentual: itemDescontoPerc,
      };

      if (itemTipo === 'PRODUTO_PRONTO' || itemCustoDiretoCustom > 0) {
        bodyPayload.custoDiretoInformado = itemCustoDiretoCustom;
      }

      if (itemTipo === 'PRODUTO_FABRICADO' || itemTipo === 'PRODUTO_SERVICO') {
        bodyPayload.material = {
          tipoMaterial: itemMatTipo,
          formato: itemMatFormato,
          espessuraMm: itemMatEspessura,
          larguraMm: itemMatLargura,
          comprimentoMm: itemMatComprimento,
          fatorPerdaAproveitamento: itemMatPerda,
          precoKgCustom: itemMatPrecoKg,
        };
      }

      if (itemTipo === 'PRODUTO_FABRICADO' || itemTipo === 'SERVICO' || itemTipo === 'PRODUTO_SERVICO') {
        if (itemCorteProc !== 'NAO_APLICA' && itemCorteComprimentoM > 0) {
          bodyPayload.corte = {
            processo: itemCorteProc,
            espessuraMm: itemMatEspessura,
            comprimentoCorteMetros: itemCorteComprimentoM,
            numeroPerfuracoes: itemCorteFuros,
          };
        }
        if (itemDobraProc !== 'NAO_APLICA' && itemDobraNum > 0) {
          bodyPayload.dobra = {
            processo: itemDobraProc,
            espessuraMm: itemMatEspessura,
            comprimentoDobraMm: itemDobraCompMm,
            numeroDobras: itemDobraNum,
          };
        }
        if (itemSoldaProc !== 'NAO_APLICA' && itemSoldaCompMm > 0) {
          bodyPayload.solda = {
            processo: itemSoldaProc,
            comprimentoSoldaMm: itemSoldaCompMm,
            tipoJunta: itemSoldaTipoJunta,
          };
        }
        if (itemPinturaProc !== 'NAO_APLICA' && itemPinturaAreaM2 > 0) {
          bodyPayload.pintura = {
            processo: itemPinturaProc,
            areaPinturaM2: itemPinturaAreaM2,
          };
        }
        if (itemMontagemHoras > 0 || itemMontagemInsumos > 0) {
          bodyPayload.montagem = {
            horasMontador: itemMontagemHoras,
            insumosFixacaoValor: itemMontagemInsumos,
          };
        }
      }

      const res = await fetch('/api/v1/orcamentos/simular-custo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-empresa-id': empresaAtiva.id },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();
      if (data.success) {
        setItemSimuladoComposicao(data.data);
      }
    } catch (err) {
      console.error('Erro na simulação do item:', err);
    }
  }, [
    empresaAtiva.id,
    itemTipo,
    itemMargemAlvoPerc,
    itemDescontoPerc,
    itemCustoDiretoCustom,
    itemMatTipo,
    itemMatFormato,
    itemMatEspessura,
    itemMatLargura,
    itemMatComprimento,
    itemMatPerda,
    itemMatPrecoKg,
    itemCorteProc,
    itemCorteComprimentoM,
    itemCorteFuros,
    itemDobraProc,
    itemDobraNum,
    itemDobraCompMm,
    itemSoldaProc,
    itemSoldaCompMm,
    itemSoldaTipoJunta,
    itemPinturaProc,
    itemPinturaAreaM2,
    itemMontagemHoras,
    itemMontagemInsumos,
  ]);

  useEffect(() => {
    let isMounted = true;
    if (itemModalOpen || activeTab === 'simulador') {
      const timer = setTimeout(() => {
        if (isMounted) {
          simularItemAtual();
        }
      }, 50);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [itemModalOpen, activeTab, simularItemAtual]);

  const handleAdicionarItemAoOrcamento = () => {
    if (!itemDescricao) {
      alert('Informe a descrição do item.');
      return;
    }
    const comp = itemSimuladoComposicao;
    const custoUnit = comp ? comp.custoUnitarioTotal : itemCustoDiretoCustom || 50;
    const precoSugerido = comp ? comp.precoUnitarioSugerido : custoUnit * 1.35;
    const precoFinal = comp ? comp.precoUnitarioFinal : precoSugerido * (1 - itemDescontoPerc / 100);
    const precoMinimo = comp ? comp.precoUnitarioMinimo : custoUnit * 1.18;
    const subtotalCusto = Number((custoUnit * itemQtd).toFixed(2));
    const subtotalFinal = Number((precoFinal * itemQtd).toFixed(2));
    const margemValor = Number((subtotalFinal - subtotalCusto).toFixed(2));
    const margemPerc = subtotalFinal > 0 ? Number(((margemValor / subtotalFinal) * 100).toFixed(2)) : 0;

    const novoItem: OrcamentoItem = {
      id: `item-${Date.now()}`,
      orcamentoId: '',
      sequencia: formItens.length + 1,
      tipoItem: itemTipo,
      codigoItem: itemCodigo || `ITEM-${String(formItens.length + 1).padStart(2, '0')}`,
      descricao: itemDescricao,
      ncm: itemNcm,
      unidadeMedida: itemUnidade,
      quantidade: itemQtd,
      custoUnitario: custoUnit,
      precoUnitarioMinimo: precoMinimo,
      precoUnitarioSugerido: precoSugerido,
      precoUnitarioFinal: precoFinal,
      percentualDesconto: itemDescontoPerc,
      valorDescontoUnitario: Number((precoSugerido * (itemDescontoPerc / 100)).toFixed(2)),
      subtotalCusto,
      subtotalFinal,
      margemContribuicaoValor: margemValor,
      margemContribuicaoPercentual: margemPerc,
      composicaoCusto: comp || undefined,
    };

    setFormItens([...formItens, novoItem]);
    setItemModalOpen(false);
    // Limpar campos
    setItemDescricao('');
    setItemCodigo('');
    setItemQtd(1);
    setItemDescontoPerc(0);
  };

  const handleRemoverItem = (index: number) => {
    const atualizados = formItens.filter((_, i) => i !== index).map((it, i) => ({ ...it, sequencia: i + 1 }));
    setFormItens(atualizados);
  };

  const handleSalvarNovoOrcamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo || !formClienteNome) {
      alert('Título e Nome do Cliente são obrigatórios.');
      return;
    }
    if (formItens.length === 0) {
      alert('Adicione pelo menos 1 item ao orçamento.');
      return;
    }

    try {
      const payload = {
        empresaId: empresaAtiva.id,
        tituloProjeto: formTitulo,
        clienteNome: formClienteNome,
        clienteCnpj: formClienteCnpj || '00.000.000/0001-00',
        contatoNome: formContatoNome,
        contatoEmail: formContatoEmail,
        contatoTelefone: formContatoTelefone,
        vendedorNome: formVendedorNome,
        validadeDias: formValidadeDias,
        prazoEntregaDias: formPrazoEntregaDias,
        condicaoPagamento: formCondicaoPagamento,
        tipoFrete: formTipoFrete,
        valorFrete: formValorFrete,
        localEntregaCidade: formCidadeEntrega,
        localEntregaUf: formUfEntrega,
        observacoesGerais: formObservacoes,
        itens: formItens,
      };

      const res = await fetch('/api/v1/orcamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-empresa-id': empresaAtiva.id },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        alert('Orçamento criado com sucesso!');
        setFormItens([]);
        setFormTitulo('');
        setFormClienteNome('');
        setActiveTab('lista');
        carregarOrcamentos();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (err) {
      console.error('Erro ao salvar orçamento:', err);
      alert('Erro ao processar criação do orçamento.');
    }
  };

  const handleAbrirDetalhes = async (orc: Orcamento) => {
    try {
      const res = await fetch(`/api/v1/orcamentos/${orc.id}`, {
        headers: { 'x-empresa-id': empresaAtiva.id },
      });
      const data = await res.json();
      if (data.success) {
        setSelectedOrcamento(data.data);
        setSelectedVersoes(data.data.versoes || []);
        setSelectedHistorico(data.data.historico || []);
        setActiveTab('proposta');
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
      setSelectedOrcamento(orc);
      setActiveTab('proposta');
    }
  };

  const handleAprovarRejeitar = async () => {
    if (!selectedOrcamento || !aprovacaoJustificativa) {
      alert('Informe a justificativa da alçada.');
      return;
    }
    try {
      const res = await fetch(`/api/v1/orcamentos/${selectedOrcamento.id}/aprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-empresa-id': empresaAtiva.id },
        body: JSON.stringify({
          acao: aprovacaoAcao,
          justificativa: aprovacaoJustificativa,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Orçamento ${aprovacaoAcao === 'APROVAR' ? 'aprovado' : 'rejeitado'} com sucesso!`);
        setAprovacaoModalOpen(false);
        setAprovacaoJustificativa('');
        carregarOrcamentos();
        if (selectedOrcamento) {
          handleAbrirDetalhes(selectedOrcamento);
        }
      }
    } catch (err) {
      console.error('Erro ao aprovar/rejeitar:', err);
    }
  };

  const handleSalvarParametros = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parametrosCusto) return;
    setSavingParametros(true);
    setParamSuccessMessage(null);
    try {
      const res = await fetch('/api/v1/orcamentos/parametros-custo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-empresa-id': empresaAtiva.id },
        body: JSON.stringify(parametrosCusto),
      });
      const data = await res.json();
      if (data.success) {
        setParamSuccessMessage('Parâmetros de custos industriais e alçadas atualizados com sucesso!');
        setTimeout(() => setParamSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error('Erro ao salvar parâmetros:', err);
    } finally {
      setSavingParametros(false);
    }
  };

  const handleImprimirProposta = () => {
    window.print();
  };

  // Filtrar lista
  const orcamentosFiltrados = orcamentos.filter((o) => {
    if (filtroStatus !== 'TODOS' && o.status !== filtroStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        o.numeroOrcamento.toLowerCase().includes(term) ||
        o.clienteNome.toLowerCase().includes(term) ||
        o.tituloProjeto.toLowerCase().includes(term) ||
        o.codigoIdentificacao.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APROVADO':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" /> Aprovado</span>;
      case 'PENDENTE_APROVACAO':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300"><AlertTriangle className="w-3.5 h-3.5" /> Pendente Alçada</span>;
      case 'ENVIADO_CLIENTE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300"><Send className="w-3.5 h-3.5" /> Enviado ao Cliente</span>;
      case 'GANHO':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300"><Check className="w-3.5 h-3.5" /> Venda Ganha</span>;
      case 'PERDIDO':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300"><X className="w-3.5 h-3.5" /> Perdido</span>;
      case 'REJEITADO_INTERNO':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300"><ShieldAlert className="w-3.5 h-3.5" /> Rejeitado Diretoria</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300"><Clock className="w-3.5 h-3.5" /> Rascunho</span>;
    }
  };

  return (
    <div className="space-y-6" id="orcamento-root-container">
      {/* Top Banner Multiempresa & KPIs */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Orçamento Técnico & Formação de Preço Industrial</h1>
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 text-slate-700">
                  {empresaAtiva.codigo}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                CPQ completo para produto pronto, fabricado (corte, dobra, solda, pintura, montagem) e serviços industriais.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setFormItens([]);
                setActiveTab('editor');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Novo Orçamento
            </button>
            <button
              onClick={() => setActiveTab('simulador')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border transition ${
                activeTab === 'simulador' ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Calculator className="w-4 h-4 text-amber-600" /> Simulador CPQ
            </button>
            <button
              onClick={() => setActiveTab('parametros')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border transition ${
                activeTab === 'parametros' ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Sliders className="w-4 h-4 text-slate-600" /> Parâmetros de Custo
            </button>
          </div>
        </div>

        {/* KPIs Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-5">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Total em Propostas</span>
            <div className="text-lg font-bold text-slate-900 mt-1">
              R$ {kpis.totalOrcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3.5 bg-emerald-50 rounded-lg border border-emerald-200">
            <span className="text-xs text-emerald-700 font-medium">Aprovados / Ganhos</span>
            <div className="text-lg font-bold text-emerald-900 mt-1">
              R$ {kpis.totalAprovados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200">
            <span className="text-xs text-amber-700 font-medium">Pendentes Alçada</span>
            <div className="text-lg font-bold text-amber-900 mt-1">
              R$ {kpis.totalPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3.5 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-xs text-blue-700 font-medium">Taxa de Conversão</span>
            <div className="text-lg font-bold text-blue-900 mt-1">{kpis.taxaConversao}%</div>
          </div>
          <div className="p-3.5 bg-purple-50 rounded-lg border border-purple-200 col-span-2 sm:col-span-1">
            <span className="text-xs text-purple-700 font-medium">Ticket Médio</span>
            <div className="text-lg font-bold text-purple-900 mt-1">
              R$ {kpis.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="flex items-center gap-2 border-t border-slate-100 mt-5 pt-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('lista')}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition ${
              activeTab === 'lista' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Lista de Orçamentos ({orcamentos.length})
          </button>
          <button
            onClick={() => {
              setFormItens([]);
              setActiveTab('editor');
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition ${
              activeTab === 'editor' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Criador de Orçamento
          </button>
          <button
            onClick={() => setActiveTab('simulador')}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition ${
              activeTab === 'simulador' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Simulador de Custo CPQ
          </button>
          <button
            onClick={() => setActiveTab('parametros')}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition ${
              activeTab === 'parametros' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Tabela de Parâmetros Industriais
          </button>
          {selectedOrcamento && (
            <button
              onClick={() => setActiveTab('proposta')}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition ${
                activeTab === 'proposta' ? 'bg-amber-600 text-white' : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
              }`}
            >
              Visualizar Proposta ({selectedOrcamento.codigoIdentificacao})
            </button>
          )}
        </div>
      </div>

      {/* ABA 1: LISTA DE ORÇAMENTOS */}
      {activeTab === 'lista' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Barra de Filtros e Busca */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por número, cliente, CNPJ ou projeto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              {['TODOS', 'RASCUNHO', 'PENDENTE_APROVACAO', 'APROVADO', 'ENVIADO_CLIENTE', 'GANHO', 'PERDIDO'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFiltroStatus(st)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition ${
                    filtroStatus === st
                      ? 'bg-amber-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
              <button
                onClick={carregarOrcamentos}
                className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-600 hover:bg-slate-100"
                title="Recarregar"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tabela de Orçamentos */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Código / Rev.</th>
                  <th className="px-4 py-3">Cliente / CNPJ</th>
                  <th className="px-4 py-3">Projeto / Escopo</th>
                  <th className="px-4 py-3">Itens</th>
                  <th className="px-4 py-3 text-right">Custo Estimado</th>
                  <th className="px-4 py-3 text-right">Preço Final</th>
                  <th className="px-4 py-3 text-right">Margem %</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orcamentosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400">
                      Nenhum orçamento encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  orcamentosFiltrados.map((orc) => (
                    <tr key={orc.id} className="hover:bg-amber-50/40 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 font-mono text-xs">{orc.codigoIdentificacao}</div>
                        <div className="text-xs text-slate-400">Validade: {orc.validadeDias}d ({orc.dataValidade})</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{orc.clienteNome}</div>
                        <div className="text-xs text-slate-400 font-mono">{orc.clienteCnpj}</div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="truncate font-medium text-slate-700">{orc.tituloProjeto}</div>
                        <div className="text-xs text-slate-400">Vend: {orc.vendedorNome}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold">
                          {orc.quantidadeItens} itens
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">
                        R$ {orc.custoTotalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold text-slate-900">
                        R$ {orc.precoFinalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${
                            orc.margemLucroEstimadaPercentual >= 20
                              ? 'bg-emerald-100 text-emerald-800'
                              : orc.margemLucroEstimadaPercentual >= 15
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {orc.margemLucroEstimadaPercentual}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(orc.status)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleAbrirDetalhes(orc)}
                            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded transition"
                            title="Ver Proposta Oficial A4"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {orc.status === 'PENDENTE_APROVACAO' && (
                            <button
                              onClick={() => {
                                setSelectedOrcamento(orc);
                                setAprovacaoModalOpen(true);
                              }}
                              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded transition"
                              title="Avaliar Alçada de Aprovação"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                          )}
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

      {/* ABA 2: CRIADOR / EDITOR DE ORÇAMENTOS */}
      {activeTab === 'editor' && (
        <form onSubmit={handleSalvarNovoOrcamento} className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Novo Orçamento Técnico e Comercial</h2>
                <p className="text-sm text-slate-500">
                  Emissão de proposta para {empresaAtiva.razaoSocial}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('lista')}
                  className="px-3.5 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
                >
                  Salvar Orçamento
                </button>
              </div>
            </div>

            {/* Cabeçalho do Orçamento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título do Projeto / Objeto da Proposta *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fornecimento de Painéis Inox 304 e Chassi Metálico para Linha de Montagem"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vendedor / Responsável Técnico</label>
                <input
                  type="text"
                  value={formVendedorNome}
                  onChange={(e) => setFormVendedorNome(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Razão Social / Nome do Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Usina São João Bioenergia S.A."
                  value={formClienteNome}
                  onChange={(e) => setFormClienteNome(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">CNPJ / CPF do Cliente</label>
                <input
                  type="text"
                  placeholder="00.000.000/0001-00"
                  value={formClienteCnpj}
                  onChange={(e) => setFormClienteCnpj(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contato / E-mail</label>
                <input
                  type="text"
                  placeholder="Eng. Comprador / email@cliente.com"
                  value={formContatoEmail}
                  onChange={(e) => setFormContatoEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Validade da Proposta (Dias)</label>
                <input
                  type="number"
                  value={formValidadeDias}
                  onChange={(e) => setFormValidadeDias(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Prazo de Entrega (Dias Úteis)</label>
                <input
                  type="number"
                  value={formPrazoEntregaDias}
                  onChange={(e) => setFormPrazoEntregaDias(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Condição de Pagamento</label>
                <input
                  type="text"
                  value={formCondicaoPagamento}
                  onChange={(e) => setFormCondicaoPagamento(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Modalidade de Frete</label>
                <select
                  value={formTipoFrete}
                  onChange={(e: any) => setFormTipoFrete(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="FOB">FOB (Cliente Retira / Frete por conta do Destinatário)</option>
                  <option value="CIF">CIF (Frete Incluso por conta do Emitente)</option>
                  <option value="RETIRA">Retira em Fábrica</option>
                  <option value="SEM_FRETE">Sem Frete</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Valor do Frete (R$ se CIF)</label>
                <input
                  type="number"
                  value={formValorFrete}
                  onChange={(e) => setFormValorFrete(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade / UF de Entrega</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={formCidadeEntrega}
                    onChange={(e) => setFormCidadeEntrega(e.target.value)}
                    className="w-2/3 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="UF"
                    value={formUfEntrega}
                    onChange={(e) => setFormUfEntrega(e.target.value)}
                    className="w-1/3 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO DE ITENS DO ORÇAMENTO */}
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Itens e Composições Industriais</h3>
                  <p className="text-xs text-slate-500">
                    Cadastre produtos prontos, fabricados (corte/dobra/solda/pintura), serviços puros ou híbridos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setItemSimuladoComposicao(null);
                    setItemModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Item Industrial
                </button>
              </div>

              {/* Tabela de Itens Cadastrados no Formulário */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5">Seq</th>
                      <th className="px-3 py-2.5">Tipo</th>
                      <th className="px-3 py-2.5">Código / Descrição</th>
                      <th className="px-3 py-2.5 text-center">Qtd / Un</th>
                      <th className="px-3 py-2.5 text-right">Custo Unit.</th>
                      <th className="px-3 py-2.5 text-right">Preço Sugerido</th>
                      <th className="px-3 py-2.5 text-right">Desc. %</th>
                      <th className="px-3 py-2.5 text-right">Preço Final</th>
                      <th className="px-3 py-2.5 text-right">Subtotal</th>
                      <th className="px-3 py-2.5 text-right">Margem %</th>
                      <th className="px-3 py-2.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formItens.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-slate-400 text-xs">
                          Nenhum item adicionado. Clique no botão acima para adicionar peças, corte, dobra ou serviços.
                        </td>
                      </tr>
                    ) : (
                      formItens.map((it, idx) => (
                        <tr key={it.id || idx} className="hover:bg-slate-50 text-xs">
                          <td className="px-3 py-2 font-mono font-medium">{idx + 1}</td>
                          <td className="px-3 py-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                              {it.tipoItem}
                            </span>
                          </td>
                          <td className="px-3 py-2 max-w-xs">
                            <div className="font-medium text-slate-900">{it.descricao}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{it.codigoItem} | NCM: {it.ncm}</div>
                          </td>
                          <td className="px-3 py-2 text-center font-medium">
                            {it.quantidade} {it.unidadeMedida}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-slate-600">
                            R$ {it.custoUnitario.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-slate-500">
                            R$ {it.precoUnitarioSugerido.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-amber-700">
                            {it.percentualDesconto}%
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                            R$ {it.precoUnitarioFinal.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                            R$ {it.subtotalFinal.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700">
                            {it.margemContribuicaoPercentual}%
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoverItem(idx)}
                              className="text-red-500 hover:text-red-700 font-bold p-1"
                              title="Remover Item"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totais do Orçamento em Construção */}
              {formItens.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">Custo Total Estimado:</span>
                    <div className="font-bold text-slate-800 text-sm font-mono mt-0.5">
                      R$ {formItens.reduce((acc, it) => acc + it.subtotalCusto, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Preço Sugerido:</span>
                    <div className="font-bold text-slate-600 text-sm font-mono mt-0.5">
                      R$ {formItens.reduce((acc, it) => acc + it.precoUnitarioSugerido * it.quantidade, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Preço Final com Desconto:</span>
                    <div className="font-bold text-slate-900 text-sm font-mono mt-0.5">
                      R$ {formItens.reduce((acc, it) => acc + it.subtotalFinal, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Margem Média de Lucro:</span>
                    {(() => {
                      const totCusto = formItens.reduce((acc, it) => acc + it.subtotalCusto, 0);
                      const totFinal = formItens.reduce((acc, it) => acc + it.subtotalFinal, 0);
                      const perc = totFinal > 0 ? (((totFinal - totCusto) / totFinal) * 100).toFixed(1) : '0';
                      return (
                        <div className="font-bold text-emerald-700 text-sm font-mono mt-0.5">
                          {perc}% (R$ {(totFinal - totCusto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Observações e Cláusulas */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Observações Técnicas e Cláusulas Comerciais</label>
              <textarea
                rows={3}
                value={formObservacoes}
                onChange={(e) => setFormObservacoes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </form>
      )}

      {/* ABA 3: SIMULADOR DE CUSTO CPQ (INTERATIVO AO VIVO) */}
      {activeTab === 'simulador' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna da Esquerda: Motores de Entrada */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-600" />
                  <h2 className="text-base font-bold text-slate-900">Motores de Formação de Preço Industrial</h2>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-semibold">
                  {empresaAtiva.codigo}
                </span>
              </div>

              {/* Tipo de Item */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Item Industrial</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['PRODUTO_FABRICADO', 'SERVICO', 'PRODUTO_PRONTO', 'PRODUTO_SERVICO'] as TipoItemOrcamento[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setItemTipo(t)}
                      className={`p-2 rounded-lg text-xs font-medium border text-center transition ${
                        itemTipo === t ? 'bg-amber-600 text-white border-amber-600 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {t.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* 1. MOTOR DE MATERIAL */}
              {(itemTipo === 'PRODUTO_FABRICADO' || itemTipo === 'PRODUTO_SERVICO') && (
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Box className="w-4 h-4 text-amber-600" /> 1. Matéria-Prima & Formato
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="text-slate-600">Material / Liga</label>
                      <select
                        value={itemMatTipo}
                        onChange={(e) => setItemMatTipo(e.target.value)}
                        className="w-full mt-1 p-1.5 bg-white border border-slate-200 rounded"
                      >
                        {parametrosCusto &&
                          Object.keys(parametrosCusto.precosMateriaisKg).map((mat) => (
                            <option key={mat} value={mat}>
                              {mat}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-600">Espessura (mm)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={itemMatEspessura}
                        onChange={(e) => setItemMatEspessura(Number(e.target.value))}
                        className="w-full mt-1 p-1.5 bg-white border border-slate-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600">Formato</label>
                      <select
                        value={itemMatFormato}
                        onChange={(e: any) => setItemMatFormato(e.target.value)}
                        className="w-full mt-1 p-1.5 bg-white border border-slate-200 rounded"
                      >
                        <option value="CHAPA">Chapa Plana</option>
                        <option value="TUBO_REDONDO">Tubo Redondo</option>
                        <option value="TUBO_QUADRADO">Tubo Quadrado</option>
                        <option value="BARRA_CHATA">Barra Chata</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-600">Largura (mm)</label>
                      <input
                        type="number"
                        value={itemMatLargura}
                        onChange={(e) => setItemMatLargura(Number(e.target.value))}
                        className="w-full mt-1 p-1.5 bg-white border border-slate-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600">Comprimento (mm)</label>
                      <input
                        type="number"
                        value={itemMatComprimento}
                        onChange={(e) => setItemMatComprimento(Number(e.target.value))}
                        className="w-full mt-1 p-1.5 bg-white border border-slate-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600">Fator Perda Ninho</label>
                      <input
                        type="number"
                        step="0.01"
                        value={itemMatPerda}
                        onChange={(e) => setItemMatPerda(Number(e.target.value))}
                        className="w-full mt-1 p-1.5 bg-white border border-slate-200 rounded"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. MOTOR DE CORTE */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Flame className="w-4 h-4 text-orange-600" /> 2. Corte Industrial
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-slate-600">Processo</label>
                    <select
                      value={itemCorteProc}
                      onChange={(e: any) => setItemCorteProc(e.target.value)}
                      className="w-full mt-1 p-1.5 bg-white border border-slate-200 rounded"
                    >
                      <option value="LASER_FIBRA">Laser Fibra Óptica</option>
                      <option value="PLASMA_HD">Plasma HD</option>
                      <option value="OXICORTE">Oxicorte CNC</option>
                      <option value="SERRA_FITA">Serra de Fita</option>
                      <option value="NAO_APLICA">Não Aplica</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-600">Comp. Corte (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={itemCorteComprimentoM}
                      onChange={(e) => setItemCorteComprimentoM(Number(e.target.value))}
                      className="w-full mt-1 p-1.5 bg-white border border-slate-200 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600">Perfuracões (Piercing)</label>
                    <input
                      type="number"
                      value={itemCorteFuros}
                      onChange={(e) => setItemCorteFuros(Number(e.target.value))}
                      className="w-full mt-1 p-1.5 bg-white border border-slate-200 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* 3. MOTOR DE DOBRA */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Cog className="w-4 h-4 text-blue-600" /> 3. Dobra CNC
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-slate-600">Processo</label>
                    <select
                      value={itemDobraProc}
                      onChange={(e: any) => setItemDobraProc(e.target.value)}
                      className="w-full mt-1 p-1.5 bg-white border border-slate-200 rounded"
                    >
                      <option value="CNC_SINCRONIZADA">CNC Sincronizada</option>
                      <option value="CONVENCIONAL">Convencional</option>
                      <option value="CALANDRA">Calandra</option>
                      <option value="NAO_APLICA">Não Aplica</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-600">Número de Dobras</label>
                    <input
                      type="number"
                      value={itemDobraNum}
                      onChange={(e) => setItemDobraNum(Number(e.target.value))}
                      className="w-full mt-1 p-1.5 bg-white border border-slate-200 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600">Comp. Dobra (mm)</label>
                    <input
                      type="number"
                      value={itemDobraCompMm}
                      onChange={(e) => setItemDobraCompMm(Number(e.target.value))}
                      className="w-full mt-1 p-1.5 bg-white border border-slate-200 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* 4. SOLDA, PINTURA E MONTAGEM */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-1 font-bold text-slate-800">
                    <Wrench className="w-3.5 h-3.5 text-purple-600" /> Soldagem
                  </div>
                  <select
                    value={itemSoldaProc}
                    onChange={(e: any) => setItemSoldaProc(e.target.value)}
                    className="w-full p-1 bg-white border border-slate-200 rounded text-xs"
                  >
                    <option value="NAO_APLICA">Sem Solda</option>
                    <option value="MIG_MAG">MIG / MAG</option>
                    <option value="TIG">TIG Especial</option>
                    <option value="ELETRODO">Eletrodo</option>
                  </select>
                  {itemSoldaProc !== 'NAO_APLICA' && (
                    <div>
                      <label className="text-slate-500 text-[10px]">Cordão (mm)</label>
                      <input
                        type="number"
                        value={itemSoldaCompMm}
                        onChange={(e) => setItemSoldaCompMm(Number(e.target.value))}
                        className="w-full p-1 bg-white border border-slate-200 rounded text-xs"
                      />
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-1 font-bold text-slate-800">
                    <Paintbrush className="w-3.5 h-3.5 text-emerald-600" /> Pintura
                  </div>
                  <select
                    value={itemPinturaProc}
                    onChange={(e: any) => setItemPinturaProc(e.target.value)}
                    className="w-full p-1 bg-white border border-slate-200 rounded text-xs"
                  >
                    <option value="NAO_APLICA">Sem Pintura</option>
                    <option value="PO_ELETROSTATICA">Pó Eletrostática</option>
                    <option value="LIQUIDA_PU_EPOXI">Líquida PU/Epóxi</option>
                  </select>
                  {itemPinturaProc !== 'NAO_APLICA' && (
                    <div>
                      <label className="text-slate-500 text-[10px]">Área (m²)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={itemPinturaAreaM2}
                        onChange={(e) => setItemPinturaAreaM2(Number(e.target.value))}
                        className="w-full p-1 bg-white border border-slate-200 rounded text-xs"
                      />
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-1 font-bold text-slate-800">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" /> Montagem
                  </div>
                  <div>
                    <label className="text-slate-500 text-[10px]">Horas Montador</label>
                    <input
                      type="number"
                      step="0.5"
                      value={itemMontagemHoras}
                      onChange={(e) => setItemMontagemHoras(Number(e.target.value))}
                      className="w-full p-1 bg-white border border-slate-200 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* POLÍTICA COMERCIAL & MARGEM */}
              <div className="p-3.5 bg-amber-50/60 rounded-lg border border-amber-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-amber-900">Margem Alvo Desejada (%)</label>
                  <input
                    type="number"
                    value={itemMargemAlvoPerc}
                    onChange={(e) => setItemMargemAlvoPerc(Number(e.target.value))}
                    className="w-full mt-1 p-1.5 bg-white border border-amber-300 rounded font-bold text-amber-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-amber-900">Desconto Concedido (%)</label>
                  <input
                    type="number"
                    value={itemDescontoPerc}
                    onChange={(e) => setItemDescontoPerc(Number(e.target.value))}
                    className="w-full mt-1 p-1.5 bg-white border border-amber-300 rounded font-bold text-amber-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Coluna da Direita: Memória de Cálculo e Preço Final */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Memória de Cálculo & Formação de Preço</h3>
                <p className="text-xs text-slate-500">Decomposição detalhada dos custos diretos, GGF, impostos e margem</p>
              </div>

              {itemSimuladoComposicao ? (
                <div className="space-y-4 text-xs">
                  {/* Custos Diretos Breakdown */}
                  <div className="space-y-2">
                    <div className="font-bold text-slate-700 text-xs">1. Custos Diretos de Fabricação</div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Matéria-Prima / Insumos:</span>
                        <span className="font-mono font-medium">R$ {itemSimuladoComposicao.custoMaterial.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Corte Industrial:</span>
                        <span className="font-mono font-medium">R$ {itemSimuladoComposicao.custoCorte.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Dobra CNC:</span>
                        <span className="font-mono font-medium">R$ {itemSimuladoComposicao.custoDobra.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Solda MIG/TIG:</span>
                        <span className="font-mono font-medium">R$ {itemSimuladoComposicao.custoSolda.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Pintura & Tratamento:</span>
                        <span className="font-mono font-medium">R$ {itemSimuladoComposicao.custoPintura.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Montagem & Ajustagem:</span>
                        <span className="font-mono font-medium">R$ {itemSimuladoComposicao.custoMontagem.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-slate-800">
                        <span>Total Custo Direto:</span>
                        <span className="font-mono">R$ {itemSimuladoComposicao.totalCustoDireto.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Custos Indiretos & Absorção */}
                  <div className="space-y-2">
                    <div className="font-bold text-slate-700 text-xs">2. Custos Indiretos (GGF / CIF)</div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between font-bold text-slate-800">
                      <span className="text-slate-600 font-normal">Rateio de Absorção de Fábrica:</span>
                      <span className="font-mono">R$ {itemSimuladoComposicao.custosIndiretosFabricacao.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Custo Total Unitário */}
                  <div className="bg-slate-800 text-white p-3 rounded-lg flex justify-between items-center">
                    <span className="font-semibold text-xs">CUSTO TOTAL FABRIL (CTF):</span>
                    <span className="text-base font-bold font-mono">R$ {itemSimuladoComposicao.custoUnitarioTotal.toFixed(2)}</span>
                  </div>

                  {/* Formação de Preço Divisor */}
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2">
                    <div className="font-bold text-amber-950 text-xs">3. Tributos, Comissões e Margem Real</div>
                    <div className="flex justify-between text-slate-700">
                      <span>Impostos Estimados ({itemSimuladoComposicao.aliquotaImpostosTotalPercentual}%):</span>
                      <span className="font-mono font-medium">R$ {itemSimuladoComposicao.valorImpostosEstimados.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Comissão Vendedor ({itemSimuladoComposicao.aliquotaComissaoPercentual}%):</span>
                      <span className="font-mono font-medium">R$ {itemSimuladoComposicao.valorComissaoEstimada.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-800 font-bold border-t border-amber-200 pt-1">
                      <span>Margem Líquida Real ({itemSimuladoComposicao.margemLucroPercentual}%):</span>
                      <span className="font-mono">R$ {itemSimuladoComposicao.valorMargemLucro.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Box de Preços Comparativos */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-2">
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg">
                      <span className="text-[10px] text-rose-700 font-semibold block">Preço Mínimo</span>
                      <span className="text-xs font-bold text-rose-900 font-mono">
                        R$ {itemSimuladoComposicao.precoUnitarioMinimo.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="text-[10px] text-blue-700 font-semibold block">Preço Sugerido</span>
                      <span className="text-xs font-bold text-blue-900 font-mono">
                        R$ {itemSimuladoComposicao.precoUnitarioSugerido.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg">
                      <span className="text-[10px] text-emerald-700 font-semibold block">Preço Final</span>
                      <span className="text-xs font-bold text-emerald-900 font-mono">
                        R$ {itemSimuladoComposicao.precoUnitarioFinal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Calculando parâmetros de custo...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: TABELA DE PARÂMETROS INDUSTRIAIS POR EMPRESA */}
      {activeTab === 'parametros' && parametrosCusto && (
        <form onSubmit={handleSalvarParametros} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Parâmetros de Custo e Alçadas ({empresaAtiva.razaoSocial})</h2>
              <p className="text-sm text-slate-500">
                Taxas horárias de centros de trabalho, coeficientes de indiretos, alíquotas fiscais e alçadas de aprovação.
              </p>
            </div>
            <button
              type="submit"
              disabled={savingParametros}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg shadow-sm transition flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> {savingParametros ? 'Salvando...' : 'Salvar Parâmetros'}
            </button>
          </div>

          {paramSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm font-medium">
              {paramSuccessMessage}
            </div>
          )}

          {/* Centros de Trabalho & Taxas Horárias (R$/hora) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Cog className="w-4 h-4 text-amber-600" /> Centros de Trabalho & Taxas Horárias (CHM - R$/hora)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="text-slate-600 font-medium">Laser Fibra Óptica (R$/h)</label>
                <input
                  type="number"
                  value={parametrosCusto.taxaHoraLaser}
                  onChange={(e) => setParametrosCusto({ ...parametrosCusto, taxaHoraLaser: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium">Plasma HD (R$/h)</label>
                <input
                  type="number"
                  value={parametrosCusto.taxaHoraPlasma}
                  onChange={(e) => setParametrosCusto({ ...parametrosCusto, taxaHoraPlasma: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium">Oxicorte CNC (R$/h)</label>
                <input
                  type="number"
                  value={parametrosCusto.taxaHoraOxicorte}
                  onChange={(e) => setParametrosCusto({ ...parametrosCusto, taxaHoraOxicorte: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium">Dobradeira CNC (R$/h)</label>
                <input
                  type="number"
                  value={parametrosCusto.taxaHoraDobra}
                  onChange={(e) => setParametrosCusto({ ...parametrosCusto, taxaHoraDobra: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium">Estação de Solda (R$/h)</label>
                <input
                  type="number"
                  value={parametrosCusto.taxaHoraSolda}
                  onChange={(e) => setParametrosCusto({ ...parametrosCusto, taxaHoraSolda: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium">Cabine de Pintura (R$/h)</label>
                <input
                  type="number"
                  value={parametrosCusto.taxaHoraPintura}
                  onChange={(e) => setParametrosCusto({ ...parametrosCusto, taxaHoraPintura: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium">Bancada Montagem (R$/h)</label>
                <input
                  type="number"
                  value={parametrosCusto.taxaHoraMontagem}
                  onChange={(e) => setParametrosCusto({ ...parametrosCusto, taxaHoraMontagem: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium">Usinagem CNC (R$/h)</label>
                <input
                  type="number"
                  value={parametrosCusto.taxaHoraUsinagem}
                  onChange={(e) => setParametrosCusto({ ...parametrosCusto, taxaHoraUsinagem: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Mão de Obra e Custos Indiretos */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" /> Mão de Obra Direta & Custos Indiretos (GGF)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-600 font-medium">MOD Salário Base (R$/h)</label>
                <input
                  type="number"
                  value={parametrosCusto.taxaMaoDeObraDiretaPadrao}
                  onChange={(e) => setParametrosCusto({ ...parametrosCusto, taxaMaoDeObraDiretaPadrao: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium">Multiplicador de Encargos Sociais (ex: 1.85)</label>
                <input
                  type="number"
                  step="0.01"
                  value={parametrosCusto.fatorEncargosSociais}
                  onChange={(e) => setParametrosCusto({ ...parametrosCusto, fatorEncargosSociais: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium">Custos Indiretos GGF / CIF (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={parametrosCusto.fatorCustosIndiretosPercentual}
                  onChange={(e) => setParametrosCusto({ ...parametrosCusto, fatorCustosIndiretosPercentual: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Tributação e Alçadas de Desconto */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600" /> Tributação Média Estimada e Alçadas Comerciais (%)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="text-slate-600 font-medium">ICMS (%)</label>
                <input
                  type="number"
                  value={parametrosCusto.aliquotaIcmsPadrao}
                  onChange={(e) => setParametrosCusto({ ...parametrosCusto, aliquotaIcmsPadrao: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium">IPI (%)</label>
                <input
                  type="number"
                  value={parametrosCusto.aliquotaIpiPadrao}
                  onChange={(e) => setParametrosCusto({ ...parametrosCusto, aliquotaIpiPadrao: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium">PIS (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={parametrosCusto.aliquotaPisPadrao}
                  onChange={(e) => setParametrosCusto({ ...parametrosCusto, aliquotaPisPadrao: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium">COFINS (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={parametrosCusto.aliquotaCofinsPadrao}
                  onChange={(e) => setParametrosCusto({ ...parametrosCusto, aliquotaCofinsPadrao: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium">ISSQN Serviços (%)</label>
                <input
                  type="number"
                  value={parametrosCusto.aliquotaIssqnPadrao}
                  onChange={(e) => setParametrosCusto({ ...parametrosCusto, aliquotaIssqnPadrao: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="text-slate-600 font-medium">Margem Alvo (%)</label>
                <input
                  type="number"
                  value={parametrosCusto.margemLucroAlvoPadrao}
                  onChange={(e) => setParametrosCusto({ ...parametrosCusto, margemLucroAlvoPadrao: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium">Margem Mínima Piso (%)</label>
                <input
                  type="number"
                  value={parametrosCusto.margemLucroMinimaPermitida}
                  onChange={(e) => setParametrosCusto({ ...parametrosCusto, margemLucroMinimaPermitida: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium">Comissão Vendedor (%)</label>
                <input
                  type="number"
                  value={parametrosCusto.aliquotaComissaoPadrao}
                  onChange={(e) => setParametrosCusto({ ...parametrosCusto, aliquotaComissaoPadrao: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium">Limite Desc. Vendedor (%)</label>
                <input
                  type="number"
                  value={parametrosCusto.limiteDescontoVendedorPercentual}
                  onChange={(e) => setParametrosCusto({ ...parametrosCusto, limiteDescontoVendedorPercentual: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium">Limite Desc. Gerente (%)</label>
                <input
                  type="number"
                  value={parametrosCusto.limiteDescontoGerentePercentual}
                  onChange={(e) => setParametrosCusto({ ...parametrosCusto, limiteDescontoGerentePercentual: Number(e.target.value) })}
                  className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ABA 5: VISUALIZADOR DE PROPOSTA COMERCIAL A4 & IMPRESSÃO */}
      {activeTab === 'proposta' && selectedOrcamento && (
        <div className="space-y-4">
          {/* Barra de Ações da Proposta */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('lista')}
                className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-50"
              >
                ← Voltar para Lista
              </button>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">{selectedOrcamento.codigoIdentificacao}</span>
                {getStatusBadge(selectedOrcamento.status)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setVersaoModalOpen(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <History className="w-3.5 h-3.5" /> Nova Revisão / Versão
              </button>
              {selectedOrcamento.status === 'PENDENTE_APROVACAO' && (
                <button
                  onClick={() => setAprovacaoModalOpen(true)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Avaliar Alçada
                </button>
              )}
              <button
                onClick={handleImprimirProposta}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
              </button>
            </div>
          </div>

          {/* FOLHA OFICIAL DA PROPOSTA COMERCIAL (LAYOUT INDUSTRIAL A4) */}
          <div className="bg-white rounded-xl border border-slate-300 p-8 sm:p-12 shadow-lg max-w-4xl mx-auto text-slate-900 space-y-6 print:shadow-none print:border-none print:p-0 print:m-0">
            {/* Cabeçalho da Proposta */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  {empresaAtiva.razaoSocial}
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  CNPJ: {empresaAtiva.cnpj} | IE: {empresaAtiva.inscricaoEstadual}
                </p>
                <p className="text-xs text-slate-500">
                  Ramo de Atividade: {empresaAtiva.ramoAtividade}
                </p>
              </div>
              <div className="text-right">
                <div className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-mono font-bold rounded">
                  {selectedOrcamento.codigoIdentificacao}
                </div>
                <p className="text-xs text-slate-500 mt-1">Data: {selectedOrcamento.dataEmissao}</p>
                <p className="text-xs font-semibold text-amber-700">Validade: {selectedOrcamento.dataValidade} ({selectedOrcamento.validadeDias} dias)</p>
              </div>
            </div>

            {/* Dados do Cliente */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="font-semibold text-slate-500 uppercase text-[10px] block">CLIENTE PROPONENTE</span>
                <span className="font-bold text-slate-900 text-sm block mt-0.5">{selectedOrcamento.clienteNome}</span>
                <span className="text-slate-600 block mt-0.5">CNPJ/CPF: {selectedOrcamento.clienteCnpj}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 uppercase text-[10px] block">CONTATO & ENGENHARIA</span>
                <span className="font-medium text-slate-800 block mt-0.5">{selectedOrcamento.contatoNome || selectedOrcamento.contatoEmail}</span>
                <span className="text-slate-600 block">Vendedor Resp: {selectedOrcamento.vendedorNome}</span>
              </div>
            </div>

            {/* Objeto da Proposta */}
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Objeto do Fornecimento:</span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">{selectedOrcamento.tituloProjeto}</h2>
            </div>

            {/* Tabela de Itens */}
            <div>
              <table className="w-full text-left text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700">
                    <th className="p-2.5 border-r border-slate-300">Item</th>
                    <th className="p-2.5 border-r border-slate-300">Descrição Técnica / Especificação</th>
                    <th className="p-2.5 border-r border-slate-300 text-center">NCM</th>
                    <th className="p-2.5 border-r border-slate-300 text-center">Qtd</th>
                    <th className="p-2.5 border-r border-slate-300 text-right">Preço Unit. (R$)</th>
                    <th className="p-2.5 text-right">Total (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedOrcamento.itens.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="p-2.5 font-mono text-center border-r border-slate-200">{idx + 1}</td>
                      <td className="p-2.5 border-r border-slate-200">
                        <div className="font-semibold text-slate-900">{it.descricao}</div>
                        {it.detalhesTecnicos && <div className="text-[11px] text-slate-500 mt-0.5">{it.detalhesTecnicos}</div>}
                        {it.desenhoReferencia && <div className="text-[10px] text-slate-400 font-mono mt-0.5">Ref Desenho: {it.desenhoReferencia}</div>}
                      </td>
                      <td className="p-2.5 text-center font-mono border-r border-slate-200">{it.ncm}</td>
                      <td className="p-2.5 text-center font-semibold border-r border-slate-200">{it.quantidade} {it.unidadeMedida}</td>
                      <td className="p-2.5 text-right font-mono border-r border-slate-200">
                        {it.precoUnitarioFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        {it.subtotalFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-400">
                    <td colSpan={5} className="p-2.5 text-right uppercase border-r border-slate-300">
                      VALOR TOTAL DA PROPOSTA ({selectedOrcamento.tipoFrete}):
                    </td>
                    <td className="p-2.5 text-right font-mono text-sm">
                      R$ {selectedOrcamento.precoFinalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Condições Comerciais e Fiscais */}
            <div className="grid grid-cols-2 gap-4 text-xs border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="space-y-1.5">
                <div><span className="font-bold text-slate-700">Prazo de Entrega:</span> {selectedOrcamento.prazoEntregaDias} dias úteis a contar da aprovação.</div>
                <div><span className="font-bold text-slate-700">Condição de Pagamento:</span> {selectedOrcamento.condicaoPagamento}</div>
                <div><span className="font-bold text-slate-700">Modalidade de Frete:</span> {selectedOrcamento.tipoFrete} {selectedOrcamento.valorFrete > 0 && `(R$ ${selectedOrcamento.valorFrete.toFixed(2)})`}</div>
                <div><span className="font-bold text-slate-700">Local de Entrega:</span> {selectedOrcamento.localEntregaCidade || 'Fábrica'} - {selectedOrcamento.localEntregaUf || 'GO'}</div>
              </div>
              <div className="space-y-1.5">
                <div><span className="font-bold text-slate-700">Tributos Estimados:</span> Inclusos conforme legislação vigente (ICMS, IPI, PIS/COFINS ou ISSQN).</div>
                <div><span className="font-bold text-slate-700">Garantia:</span> {selectedOrcamento.garantiaMeses} meses contra defeitos de fabricação e corte.</div>
                <div><span className="font-bold text-slate-700">Emissor:</span> {empresaAtiva.razaoSocial} ({empresaAtiva.cnpj})</div>
              </div>
            </div>

            {/* Cláusula e Termo de Aceite */}
            <div className="text-xs text-slate-600 space-y-2 border-t border-slate-200 pt-4">
              <p>
                <strong>Observações Gerais:</strong> {selectedOrcamento.observacoesGerais}
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                O aceite desta proposta comercial formaliza a contratação dos serviços e produtos discriminados e autoriza a emissão do Pedido de Venda e início da fabricação no PCP.
              </p>
            </div>

            {/* Campos de Assinatura */}
            <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
              <div>
                <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
                  {empresaAtiva.razaoSocial}
                </div>
                <div className="text-[11px] text-slate-500">Depto Comercial / Engenharia de Aplicação</div>
              </div>
              <div>
                <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
                  {selectedOrcamento.clienteNome}
                </div>
                <div className="text-[11px] text-slate-500">Depto de Suprimentos / Compras (De Acordo)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONSTRUTOR DE ITEM INDUSTRIAL */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Configurar Item Industrial para Orçamento</h3>
              </div>
              <button onClick={() => setItemModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Seleção do Tipo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['PRODUTO_FABRICADO', 'SERVICO', 'PRODUTO_PRONTO', 'PRODUTO_SERVICO'] as TipoItemOrcamento[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setItemTipo(t)}
                    className={`p-2 rounded-lg text-xs font-semibold border text-center transition ${
                      itemTipo === t ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Dados Básicos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="md:col-span-2">
                  <label className="font-semibold text-slate-700">Descrição do Item *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Suporte Angular em Aço A36 Dobrado e Furado"
                    value={itemDescricao}
                    onChange={(e) => setItemDescricao(e.target.value)}
                    className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Código Interno</label>
                  <input
                    type="text"
                    placeholder="SUP-ANG-01"
                    value={itemCodigo}
                    onChange={(e) => setItemCodigo(e.target.value)}
                    className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    value={itemQtd}
                    onChange={(e) => setItemQtd(Number(e.target.value))}
                    className="w-full mt-1 p-2 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Unidade</label>
                  <select
                    value={itemUnidade}
                    onChange={(e: any) => setItemUnidade(e.target.value)}
                    className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="UN">UN (Unidade)</option>
                    <option value="PC">PC (Peça)</option>
                    <option value="KG">KG (Quilograma)</option>
                    <option value="M">M (Metro)</option>
                    <option value="M2">M2 (Metro Quadrado)</option>
                    <option value="CJ">CJ (Conjunto)</option>
                    <option value="SERVICO">SERVIÇO</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">NCM</label>
                  <input
                    type="text"
                    value={itemNcm}
                    onChange={(e) => setItemNcm(e.target.value)}
                    className="w-full mt-1 p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Parâmetros do Motor Industrial */}
              {(itemTipo === 'PRODUTO_FABRICADO' || itemTipo === 'PRODUTO_SERVICO') && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="font-bold text-slate-800">Parâmetros de Matéria-Prima:</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-slate-500">Material</label>
                      <select
                        value={itemMatTipo}
                        onChange={(e) => setItemMatTipo(e.target.value)}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded"
                      >
                        {parametrosCusto &&
                          Object.keys(parametrosCusto.precosMateriaisKg).map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-500">Espessura (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={itemMatEspessura}
                        onChange={(e) => setItemMatEspessura(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500">Comp. Corte (m)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={itemCorteComprimentoM}
                        onChange={(e) => setItemCorteComprimentoM(Number(e.target.value))}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Resultado Imediato da Formação de Preço */}
              {itemSimuladoComposicao && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between font-medium text-emerald-900">
                    <span>Custo Unitário Total:</span>
                    <span className="font-mono font-bold">R$ {itemSimuladoComposicao.custoUnitarioTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-emerald-900">
                    <span>Preço Sugerido (com Margem Alvo):</span>
                    <span className="font-mono font-bold">R$ {itemSimuladoComposicao.precoUnitarioSugerido.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-950 border-t border-emerald-200 pt-1">
                    <span>Preço Final Unitário:</span>
                    <span className="font-mono text-sm">R$ {itemSimuladoComposicao.precoUnitarioFinal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setItemModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAdicionarItemAoOrcamento}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition"
              >
                Adicionar ao Orçamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AVALIAÇÃO DE ALÇADA DE APROVAÇÃO */}
      {aprovacaoModalOpen && selectedOrcamento && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-base border-b border-slate-100 pb-3">
              <ShieldAlert className="w-5 h-5" /> Alçada de Aprovação Comercial / Industrial
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs space-y-1 text-amber-900">
              <div><strong>Proposta:</strong> {selectedOrcamento.codigoIdentificacao}</div>
              <div><strong>Cliente:</strong> {selectedOrcamento.clienteNome}</div>
              <div><strong>Margem Atual:</strong> {selectedOrcamento.margemLucroEstimadaPercentual}%</div>
              <div><strong>Motivo Alçada:</strong> {selectedOrcamento.motivoExigenciaAprovacao || 'Desconto ou Margem fora da alçada padrão.'}</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Decisão de Alçada</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAprovacaoAcao('APROVAR')}
                    className={`p-2 rounded-lg font-bold border transition ${
                      aprovacaoAcao === 'APROVAR' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    ✓ APROVAR PROPOSTA
                  </button>
                  <button
                    type="button"
                    onClick={() => setAprovacaoAcao('REJEITAR')}
                    className={`p-2 rounded-lg font-bold border transition ${
                      aprovacaoAcao === 'REJEITAR' ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    ✕ REJEITAR
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Justificativa Formal *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Informe a justificativa da decisão para registro na trilha de auditoria..."
                  value={aprovacaoJustificativa}
                  onChange={(e) => setAprovacaoJustificativa(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setAprovacaoModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAprovarRejeitar}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Confirmar Decisão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
