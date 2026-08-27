// frontend/src/components/QualidadeViewer.tsx

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RotateCcw,
  Trash2,
  FileCheck,
  Search,
  Filter,
  Plus,
  Eye,
  ChevronRight,
  TrendingDown,
  Building2,
  Cpu,
  Layers,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  AlertOctagon,
  Calendar,
  User,
  ExternalLink,
  Camera,
  Check,
  BarChart3,
  Factory,
  RefreshCw,
} from 'lucide-react';
import {
  InspecaoQualidade,
  ModeloChecklist,
  NaoConformidade,
  RetrabalhoQualidade,
  RefugoQualidade,
  IndicadoresQualidade,
  TipoInspecao,
  DisposicaoQualidade,
  StatusNC,
  SeveridadeNC,
  CategoriaIshikawa,
} from '@/backend/modules/qualidade/qualidade-types';
import { Empresa } from '@/backend/core/types/company';
import { safeFetchJson } from '../api/safe-fetch';

interface QualidadeViewerProps {
  empresaAtiva: Empresa;
}

export function QualidadeViewer({ empresaAtiva }: QualidadeViewerProps) {
  const [activeTab, setActiveTab] = useState<'indicadores' | 'inspecoes' | 'rncs' | 'retrabalhos_refugos' | 'checklists'>('indicadores');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Dados carregados do backend
  const [indicadores, setIndicadores] = useState<IndicadoresQualidade | null>(null);
  const [inspecoes, setInspecoes] = useState<InspecaoQualidade[]>([]);
  const [rncs, setRncs] = useState<NaoConformidade[]>([]);
  const [retrabalhos, setRetrabalhos] = useState<RetrabalhoQualidade[]>([]);
  const [refugos, setRefugos] = useState<RefugoQualidade[]>([]);
  const [checklists, setChecklists] = useState<ModeloChecklist[]>([]);

  // Filtros
  const [filtroTipoInspecao, setFiltroTipoInspecao] = useState<string>('TODOS');
  const [filtroDisposicao, setFiltroDisposicao] = useState<string>('TODOS');
  const [filtroStatusNC, setFiltroStatusNC] = useState<string>('TODOS');
  const [filtroSeveridadeNC, setFiltroSeveridadeNC] = useState<string>('TODOS');
  const [buscaTexto, setBuscaTexto] = useState('');

  // Modais de Inspeção & RNC
  const [inspecaoSelecionada, setInspecaoSelecionada] = useState<InspecaoQualidade | null>(null);
  const [rncSelecionada, setRncSelecionada] = useState<NaoConformidade | null>(null);
  const [modalNovaInspecao, setModalNovaInspecao] = useState(false);
  const [modalNovaRnc, setModalNovaRnc] = useState(false);
  const [modalNovoRetrabalho, setModalNovoRetrabalho] = useState(false);
  const [modalNovoRefugo, setModalNovoRefugo] = useState(false);

  // Forms de Nova Inspeção
  const [novaInspTipo, setNovaInspTipo] = useState<TipoInspecao>('RECEBIMENTO');
  const [novaInspChecklistId, setNovaInspChecklistId] = useState<string>('mod-chk-01');
  const [novaInspProdutoCodigo, setNovaInspProdutoCodigo] = useState('MP-CHAPA-A36-6.35');
  const [novaInspProdutoDescricao, setNovaInspProdutoDescricao] = useState('Chapa de Aço Carbono ASTM A36 6.35 x 1500 x 6000 mm');
  const [novaInspFornecedorNome, setNovaInspFornecedorNome] = useState('Usiminas S/A');
  const [novaInspNotaFiscal, setNovaInspNotaFiscal] = useState('NF-e 009.412');
  const [novaInspOpNumero, setNovaInspOpNumero] = useState('OP-2026-001');
  const [novaInspMaquinaNome, setNovaInspMaquinaNome] = useState('Laser Fibra Óptica 6kW');
  const [novaInspSetor, setNovaInspSetor] = useState('RECEBIMENTO_MATERIA_PRIMA');
  const [novaInspTamanhoLote, setNovaInspTamanhoLote] = useState(25);
  const [novaInspTamanhoAmostra, setNovaInspTamanhoAmostra] = useState(3);
  const [novaInspDisposicao, setNovaInspDisposicao] = useState<DisposicaoQualidade>('APROVADO');
  const [novaInspObservacoes, setNovaInspObservacoes] = useState('Inspeção dimensional e visual de recebimento de lote.');
  const [respostasForm, setRespostasForm] = useState<Record<string, { conforme: boolean; valorMedido: number | string; obs: string }>>({});

  // Forms de Nova RNC
  const [novaRncTitulo, setNovaRncTitulo] = useState('');
  const [novaRncSeveridade, setNovaRncSeveridade] = useState<SeveridadeNC>('MEDIA');
  const [novaRncOrigem, setNovaRncOrigem] = useState<TipoInspecao | 'CHAO_DE_FABRICA'>('CHAO_DE_FABRICA');
  const [novaRncDescricao, setNovaRncDescricao] = useState('');
  const [novaRncProduto, setNovaRncProduto] = useState('');
  const [novaRncSetor, setNovaRncSetor] = useState('CORTE_LASER');
  const [novaRncQtd, setNovaRncQtd] = useState(1);
  const [novaRncPrejuizo, setNovaRncPrejuizo] = useState(350);
  const [novaRncDisposicao, setNovaRncDisposicao] = useState<DisposicaoQualidade>('RETRABALHO');

  // Form Ishikawa / 5 Porquês
  const [ishikawaCategoria, setIshikawaCategoria] = useState<CategoriaIshikawa>('METODO');
  const [ishikawaDescricao, setIshikawaDescricao] = useState('');
  const [why1, setWhy1] = useState('');
  const [why2, setWhy2] = useState('');
  const [why3, setWhy3] = useState('');
  const [why4, setWhy4] = useState('');
  const [why5Raiz, setWhy5Raiz] = useState('');

  // Form Ação Corretiva
  const [acaoDesc, setAcaoDesc] = useState('');
  const [acaoTipo, setAcaoTipo] = useState<'BLOQUEIO' | 'CORRECAO_PROCESSO' | 'TREINAMENTO' | 'MANUTENCAO_PREVENTIVA' | 'REVISAO_ENGENHARIA'>('CORRECAO_PROCESSO');
  const [acaoRespNome, setAcaoRespNome] = useState('Eng. Qualidade Roberto Mendes');
  const [acaoPrazo, setAcaoPrazo] = useState('2026-09-10');

  // Form Ação Preventiva
  const [prevDesc, setPrevDesc] = useState('');
  const [prevProc, setPrevProc] = useState('CORTE_LASER');
  const [prevLicao, setPrevLicao] = useState('');
  const [prevPrazo, setPrevPrazo] = useState('2026-09-20');

  const carregarDados = async () => {
    setLoading(true);
    try {
      const res = await safeFetchJson<{
        indicadores: IndicadoresQualidade;
        inspecoes: InspecaoQualidade[];
        naoConformidades: NaoConformidade[];
        retrabalhos: RetrabalhoQualidade[];
        refugos: RefugoQualidade[];
        modelosChecklist: ModeloChecklist[];
      }>(`/api/v1/qualidade?empresaId=${empresaAtiva.id}`);

      if (res.success && res.data) {
        if (res.data.indicadores) setIndicadores(res.data.indicadores);
        setInspecoes(res.data.inspecoes || []);
        setRncs(res.data.naoConformidades || []);
        setRetrabalhos(res.data.retrabalhos || []);
        setRefugos(res.data.refugos || []);
        setChecklists(res.data.modelosChecklist || []);

        if (res.data.inspecoes?.length > 0 && !inspecaoSelecionada) {
          setInspecaoSelecionada(res.data.inspecoes[0]);
        }
        if (res.data.naoConformidades?.length > 0 && !rncSelecionada) {
          setRncSelecionada(res.data.naoConformidades[0]);
        }
      } else if (res.error) {
        setFeedback({ tipo: 'error', texto: res.error });
      }
    } catch (e: any) {
      setFeedback({ tipo: 'error', texto: `Erro ao carregar módulo de qualidade: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [empresaAtiva.id]);

  const handleRegistrarInspecao = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const modeloAtual = checklists.find((c) => c.id === novaInspChecklistId) || checklists[0];

      const respostasPayload = (modeloAtual?.itens || []).map((it) => {
        const resp = respostasForm[it.id] || { conforme: true, valorMedido: it.valorNominal || '', obs: '' };
        return {
          itemChecklistId: it.id,
          sequencia: it.sequencia,
          tituloCriterio: it.tituloCriterio,
          metodoInspecao: it.metodoInspecao,
          instrumentoMedicao: it.instrumentoMedicao,
          tipoValor: it.tipoValor,
          valorNominal: it.valorNominal,
          toleranciaMin: it.toleranciaMin,
          toleranciaMax: it.toleranciaMax,
          unidadeMedida: it.unidadeMedida,
          nivelCriticidade: it.nivelCriticidade,
          conforme: resp.conforme,
          valorMedidoNumerico: typeof resp.valorMedido === 'number' ? resp.valorMedido : parseFloat(String(resp.valorMedido)) || undefined,
          valorMedidoTexto: typeof resp.valorMedido === 'string' ? resp.valorMedido : undefined,
          observacao: resp.obs,
          statusDisposicao: resp.conforme ? 'APROVADO' : 'REPROVADO',
        };
      });

      const res = await fetch('/api/v1/qualidade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'REGISTRAR_INSPECAO',
          empresaId: empresaAtiva.id,
          usuarioNome: 'Auditor Roberto Mendes (CQ)',
          usuarioEmail: 'roberto.qualidade@tritech.ind.br',
          payload: {
            tipoInspecao: novaInspTipo,
            modeloChecklistId: modeloAtual.id,
            modeloChecklistTitulo: modeloAtual.titulo,
            fornecedorNome: novaInspTipo === 'RECEBIMENTO' ? novaInspFornecedorNome : undefined,
            notaFiscalNumero: novaInspTipo === 'RECEBIMENTO' ? novaInspNotaFiscal : undefined,
            opNumero: novaInspTipo !== 'RECEBIMENTO' ? novaInspOpNumero : undefined,
            maquinaNome: novaInspTipo === 'PROCESSO' ? novaInspMaquinaNome : undefined,
            setor: novaInspSetor,
            produtoCodigo: novaInspProdutoCodigo,
            produtoDescricao: novaInspProdutoDescricao,
            tamanhoLote: novaInspTamanhoLote,
            tamanhoAmostra: novaInspTamanhoAmostra,
            disposicaoFinal: novaInspDisposicao,
            observacoesGerais: novaInspObservacoes,
            respostas: respostasPayload,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ tipo: 'success', texto: data.message });
        setModalNovaInspecao(false);
        carregarDados();
      } else {
        setFeedback({ tipo: 'error', texto: data.error?.message || 'Erro ao registrar inspeção' });
      }
    } catch (err: any) {
      setFeedback({ tipo: 'error', texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarIshikawa = async (rncId: string) => {
    if (!ishikawaDescricao) {
      setFeedback({ tipo: 'error', texto: 'Informe a descrição da causa.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/v1/qualidade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'ADICIONAR_CAUSA',
          empresaId: empresaAtiva.id,
          usuarioNome: 'Eng. Qualidade Roberto Mendes',
          payload: {
            rncId,
            causa: {
              categoriaIshikawa: ishikawaCategoria,
              descricaoCausa: ishikawaDescricao,
              metodo5Porques: {
                porQue1: why1 || 'Por que 1: Desvio de processo não detectado.',
                porQue2: why2 || 'Por que 2: Falha na conferência de setup inicial.',
                porQue3: why3 || 'Por que 3: Instrução de trabalho sem limite crítico.',
                porQue4: why4 || 'Por que 4: Revisão de engenharia pendente.',
                porQue5CausaRaiz: why5Raiz || 'Por que 5: Causa Raiz confirmada.',
              },
            },
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ tipo: 'success', texto: 'Análise de causa raiz Ishikawa 6M anexada à RNC.' });
        setIshikawaDescricao('');
        setWhy1('');
        setWhy2('');
        setWhy3('');
        setWhy4('');
        setWhy5Raiz('');
        carregarDados();
      }
    } catch (err: any) {
      setFeedback({ tipo: 'error', texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarAcaoCorretiva = async (rncId: string) => {
    if (!acaoDesc) {
      setFeedback({ tipo: 'error', texto: 'Informe a descrição da ação corretiva.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/v1/qualidade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'ADICIONAR_ACAO_CORRETIVA',
          empresaId: empresaAtiva.id,
          payload: {
            rncId,
            acaoCorretiva: {
              descricaoAcao: acaoDesc,
              tipoAcao: acaoTipo,
              responsavelNome: acaoRespNome,
              responsavelEmail: 'roberto.mendes@tritech.ind.br',
              setorResponsavel: 'PRODUCAO',
              prazoLimite: acaoPrazo,
            },
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ tipo: 'success', texto: 'Ação corretiva cadastrada com prazo e responsável.' });
        setAcaoDesc('');
        carregarDados();
      }
    } catch (err: any) {
      setFeedback({ tipo: 'error', texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarAcaoPreventiva = async (rncId: string) => {
    if (!prevDesc) {
      setFeedback({ tipo: 'error', texto: 'Informe a descrição da melhoria preventiva.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/v1/qualidade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'ADICIONAR_ACAO_PREVENTIVA',
          empresaId: empresaAtiva.id,
          payload: {
            rncId,
            acaoPreventiva: {
              descricaoOportunidadeMelhoria: prevDesc,
              processoAfetado: prevProc,
              responsavelNome: 'Roberto Mendes (Eng. Qualidade)',
              responsavelEmail: 'roberto.mendes@tritech.ind.br',
              prazoLimite: prevPrazo,
              licaoAprendida: prevLicao,
            },
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ tipo: 'success', texto: 'Ação preventiva e lição aprendida registradas.' });
        setPrevDesc('');
        setPrevLicao('');
        carregarDados();
      }
    } catch (err: any) {
      setFeedback({ tipo: 'error', texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleValidarEficacia = async (rncId: string, eficaz: boolean) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/qualidade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'VALIDAR_EFICACIA',
          empresaId: empresaAtiva.id,
          usuarioNome: 'Roberto Mendes (Auditor Líder CQ)',
          payload: {
            rncId,
            eficaz,
            descricao: eficaz
              ? 'Lote subsequente de 50 peças auditado no processo sem reincidência de defeito. Ações validadas com sucesso.'
              : 'Defeito reincidente em novo lote. RNC reaberta para reanálise da causa raiz.',
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ tipo: 'success', texto: data.message });
        carregarDados();
      }
    } catch (err: any) {
      setFeedback({ tipo: 'error', texto: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com Contexto Multiempresa */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gestão da Qualidade & RNC (ISO 9001 / IATF)</h1>
              <p className="text-xs text-slate-500">
                Inspeção de Recebimento, Em Processo & Final • Não Conformidades • Ishikawa 6M • Retrabalho & Refugo
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalNovaInspecao(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Inspeção
          </button>
          <button
            onClick={carregarDados}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Atualizar Dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between ${
            feedback.tipo === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedback.texto}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
            ×
          </button>
        </div>
      )}

      {/* Navegação Sub-Abas do Módulo de Qualidade */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('indicadores')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'indicadores'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Indicadores & Custo da Não Qualidade (CNQ)
        </button>
        <button
          onClick={() => setActiveTab('inspecoes')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'inspecoes'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Inspeções (Recebimento, Processo, Final) ({inspecoes.length})
        </button>
        <button
          onClick={() => setActiveTab('rncs')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'rncs'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          Não Conformidades (RNC & 8D) ({rncs.length})
        </button>
        <button
          onClick={() => setActiveTab('retrabalhos_refugos')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'retrabalhos_refugos'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          Retrabalhos ({retrabalhos.length}) & Sucatas ({refugos.length})
        </button>
        <button
          onClick={() => setActiveTab('checklists')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'checklists'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Modelos de Checklist ({checklists.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-ABA 1: INDICADORES ANALÍTICOS & CUSTO DA NÃO QUALIDADE               */}
      {/* ========================================================================= */}
      {activeTab === 'indicadores' && indicadores && (
        <div className="space-y-6">
          {/* Métricas Principais / Top KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Taxa de Aprovação */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Taxa de Aprovação</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{indicadores.taxaAprovacaoPercentual}%</div>
              <p className="text-[11px] text-slate-500 mt-1">
                {indicadores.totalAprovadas} lotes aprovados de {indicadores.totalInspecoes} inspecionados
              </p>
            </div>

            {/* KPI 2: Custo da Não Qualidade (CNQ) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Custo da Não Qualidade</span>
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-rose-600">
                R$ {indicadores.custoNaoQualidadeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Sucatas + Horas Retrabalho + Perdas Fornecedores
              </p>
            </div>

            {/* KPI 3: Refugo & Sucata */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Índice de Refugo / Sucata</span>
                <Trash2 className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{indicadores.indiceRefugoPercentual}%</div>
              <p className="text-[11px] text-slate-500 mt-1">
                {indicadores.pesoTotalRefugadoKg} kg segregados (R$ {indicadores.custoTotalRefugo.toFixed(2)})
              </p>
            </div>

            {/* KPI 4: Retrabalho */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Índice de Retrabalho</span>
                <RotateCcw className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{indicadores.indiceRetrabalhoPercentual}%</div>
              <p className="text-[11px] text-slate-500 mt-1">
                {indicadores.horasTotaisRetrabalho}h gastas (R$ {indicadores.custoTotalRetrabalho.toFixed(2)})
              </p>
            </div>
          </div>

          {/* Grid de Paretos: 1. NC por Fornecedor, 2. NC por Máquina, 3. NC por Processo */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PARETO 1: NC POR FORNECEDOR */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">NC por Fornecedor (Matéria-Prima)</h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                  Ranking
                </span>
              </div>

              <div className="space-y-3">
                {indicadores.ncPorFornecedor.map((forn, idx) => (
                  <div key={forn.fornecedorId || idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                      <span className="truncate max-w-[180px]">{forn.fornecedorNome}</span>
                      <span className="text-rose-600">{forn.taxaRejeicaoPercentual}% rejeição</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>{forn.totalNCs} NCs em {forn.totalInspecoes} lotes</span>
                      <span className="font-semibold text-slate-700">R$ {forn.custoPrejuizo.toFixed(2)}</span>
                    </div>
                    {forn.principaisDefeitos.length > 0 && (
                      <div className="mt-1 text-[10px] text-slate-400 truncate">
                        Defeitos: {forn.principaisDefeitos.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* PARETO 2: NC POR MÁQUINA */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900">NC por Máquina / Equipamento</h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                  Chão de Fábrica
                </span>
              </div>

              <div className="space-y-3">
                {indicadores.ncPorMaquina.map((maq, idx) => (
                  <div key={maq.maquinaId || idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                      <span className="truncate max-w-[170px]">{maq.maquinaNome}</span>
                      <span className="text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                        {maq.totalNCs} NCs
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>{maq.pecasAfetadas} peças • {maq.horasRetrabalho}h retrabalho</span>
                      <span className="font-semibold text-slate-700">R$ {maq.custoPerda.toFixed(2)}</span>
                    </div>
                    {maq.principaisDefeitos.length > 0 && (
                      <div className="mt-1 text-[10px] text-slate-400 truncate">
                        Motivos: {maq.principaisDefeitos.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* PARETO 3: NC POR PROCESSO / SETOR */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Factory className="w-4 h-4 text-cyan-600" />
                  <h3 className="text-sm font-bold text-slate-900">NC por Processo / Roteiro</h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                  Etapas
                </span>
              </div>

              <div className="space-y-3">
                {indicadores.ncPorProcesso.map((proc, idx) => (
                  <div key={proc.setor || idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                      <span>{proc.nomeSetor}</span>
                      <span className="text-slate-700 font-semibold">{proc.totalNCs} desvios</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden my-1.5">
                      <div
                        className="bg-cyan-600 h-full rounded-full"
                        style={{ width: `${Math.min(100, proc.taxaReprovacaoPercentual * 3)}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>{proc.taxaReprovacaoPercentual}% taxa rejeição</span>
                      <span className="font-bold text-rose-600">CNQ: R$ {proc.custoCNQ.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-ABA 2: INSPEÇÕES DE QUALIDADE (Recebimento, Processo, Final)          */}
      {/* ========================================================================= */}
      {activeTab === 'inspecoes' && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={buscaTexto}
                  onChange={(e) => setBuscaTexto(e.target.value)}
                  placeholder="Buscar inspeção, produto, lote..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-600 w-56"
                />
              </div>

              <select
                value={filtroTipoInspecao}
                onChange={(e) => setFiltroTipoInspecao(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-md px-2.5 py-1.5 font-semibold text-slate-700"
              >
                <option value="TODOS">Todos os Tipos</option>
                <option value="RECEBIMENTO">Inspeção de Recebimento</option>
                <option value="PROCESSO">Inspeção em Processo</option>
                <option value="FINAL">Inspeção Final</option>
              </select>

              <select
                value={filtroDisposicao}
                onChange={(e) => setFiltroDisposicao(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-md px-2.5 py-1.5 font-semibold text-slate-700"
              >
                <option value="TODOS">Todas as Disposições</option>
                <option value="APROVADO">Aprovado</option>
                <option value="QUARENTENA">Quarentena</option>
                <option value="RETRABALHO">Retrabalho</option>
                <option value="REPROVADO">Reprovado</option>
                <option value="SUCATA">Sucata</option>
              </select>
            </div>

            <button
              onClick={() => setModalNovaInspecao(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Nova Inspeção
            </button>
          </div>

          {/* Tabela de Inspeções */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-900 flex justify-between items-center">
                <span>Registros de Inspeção ({inspecoes.length})</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {inspecoes
                  .filter((i) => {
                    const matchTipo = filtroTipoInspecao === 'TODOS' || i.tipoInspecao === filtroTipoInspecao;
                    const matchDisp = filtroDisposicao === 'TODOS' || i.disposicaoFinal === filtroDisposicao;
                    const matchBusca =
                      !buscaTexto ||
                      i.numeroInspecao.toLowerCase().includes(buscaTexto.toLowerCase()) ||
                      i.produtoCodigo.toLowerCase().includes(buscaTexto.toLowerCase()) ||
                      (i.fornecedorNome && i.fornecedorNome.toLowerCase().includes(buscaTexto.toLowerCase()));
                    return matchTipo && matchDisp && matchBusca;
                  })
                  .map((insp) => {
                    const isSelected = inspecaoSelecionada?.id === insp.id;
                    return (
                      <div
                        key={insp.id}
                        onClick={() => setInspecaoSelecionada(insp)}
                        className={`p-4 transition-colors cursor-pointer text-xs ${
                          isSelected ? 'bg-emerald-50/50 border-l-4 border-emerald-600' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{insp.numeroInspecao}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                insp.tipoInspecao === 'RECEBIMENTO'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : insp.tipoInspecao === 'PROCESSO'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {insp.tipoInspecao === 'RECEBIMENTO'
                                ? 'Recebimento'
                                : insp.tipoInspecao === 'PROCESSO'
                                ? 'Processo'
                                : 'Final'}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              insp.disposicaoFinal === 'APROVADO'
                                ? 'bg-emerald-100 text-emerald-800'
                                : insp.disposicaoFinal === 'QUARENTENA'
                                ? 'bg-amber-100 text-amber-800'
                                : insp.disposicaoFinal === 'RETRABALHO'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {insp.disposicaoFinal}
                          </span>
                        </div>

                        <div className="font-semibold text-slate-800">{insp.produtoCodigo} — {insp.produtoDescricao}</div>

                        <div className="flex items-center justify-between text-slate-400 text-[11px] mt-2">
                          <span>
                            {insp.fornecedorNome ? `Forn: ${insp.fornecedorNome}` : `OP: ${insp.opNumero || 'S/N'}`}
                          </span>
                          <span>{new Date(insp.dataInspecao).toLocaleDateString('pt-BR')} • {insp.inspetorNome}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Painel Lateral de Detalhes da Inspeção */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              {inspecaoSelecionada ? (
                <div className="space-y-4 text-xs">
                  <div className="border-b border-slate-100 pb-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400 font-bold">DETALHES DA INSPEÇÃO</span>
                      <span className="font-bold text-emerald-700">{inspecaoSelecionada.disposicaoFinal}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{inspecaoSelecionada.numeroInspecao}</h3>
                    <p className="text-slate-500 text-[11px]">{inspecaoSelecionada.modeloChecklistTitulo}</p>
                  </div>

                  {/* Resumo de Rastreabilidade */}
                  <div className="bg-slate-50 p-3 rounded-lg space-y-1.5 border border-slate-200 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Produto:</span>
                      <span className="font-bold text-slate-800">{inspecaoSelecionada.produtoCodigo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Lote / Amostra:</span>
                      <span className="font-semibold text-slate-800">{inspecaoSelecionada.tamanhoLote} itens (Amostra: {inspecaoSelecionada.tamanhoAmostra})</span>
                    </div>
                    {inspecaoSelecionada.fornecedorNome && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fornecedor:</span>
                        <span className="font-semibold text-slate-800">{inspecaoSelecionada.fornecedorNome}</span>
                      </div>
                    )}
                    {inspecaoSelecionada.opNumero && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ordem de Produção:</span>
                        <span className="font-semibold text-slate-800">{inspecaoSelecionada.opNumero}</span>
                      </div>
                    )}
                    {inspecaoSelecionada.rncNumero && (
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>RNC Vinculada:</span>
                        <span>{inspecaoSelecionada.rncNumero}</span>
                      </div>
                    )}
                  </div>

                  {/* Checklist e Respostas da Inspeção */}
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs mb-2">Critérios & Tolerâncias Auditadas</h4>
                    <div className="space-y-2">
                      {inspecaoSelecionada.respostas?.map((resp, i) => (
                        <div key={resp.id || i} className="p-2.5 rounded bg-slate-50 border border-slate-200">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-slate-900">{resp.tituloCriterio}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                resp.conforme ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'
                              }`}
                            >
                              {resp.conforme ? 'Conforme' : 'Não Conforme'}
                            </span>
                          </div>
                          {resp.valorMedidoNumerico !== undefined && (
                            <div className="mt-1 text-[11px] text-slate-600 flex justify-between">
                              <span>Nominal: {resp.valorNominal} {resp.unidadeMedida}</span>
                              <span className="font-bold">Medido: {resp.valorMedidoNumerico} {resp.unidadeMedida}</span>
                            </div>
                          )}
                          {resp.observacao && (
                            <p className="mt-1 text-[10px] text-rose-600 font-medium">{resp.observacao}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Laudo Técnico */}
                  <div className="p-3 bg-slate-900 text-slate-100 rounded-lg">
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Laudo Técnico</span>
                    <p className="text-[11px] leading-relaxed">{inspecaoSelecionada.laudoTecnico}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Selecione uma inspeção para visualizar o checklist e o laudo.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-ABA 3: NÃO CONFORMIDADES (RNC, Ishikawa 6M, 5 Porquês, 8D)           */}
      {/* ========================================================================= */}
      {activeTab === 'rncs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de RNCs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-900 flex justify-between items-center">
                <span>Relatórios de Não Conformidade ({rncs.length})</span>
                <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold border border-rose-200">
                  Tratativa 8D
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-[650px] overflow-y-auto">
                {rncs.map((rnc) => {
                  const isSelected = rncSelecionada?.id === rnc.id;
                  return (
                    <div
                      key={rnc.id}
                      onClick={() => setRncSelecionada(rnc)}
                      className={`p-4 transition-colors cursor-pointer text-xs ${
                        isSelected ? 'bg-rose-50/50 border-l-4 border-rose-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-slate-900">{rnc.numeroRNC}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rnc.severidade === 'CRITICA'
                              ? 'bg-rose-600 text-white'
                              : rnc.severidade === 'ALTA'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rnc.severidade}
                        </span>
                      </div>
                      <div className="font-bold text-slate-800 line-clamp-1">{rnc.titulo}</div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{rnc.descricaoProblema}</p>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                        <span className="font-bold text-slate-600">{rnc.status}</span>
                        <span>Prejuízo: R$ {rnc.valorPrejuizoEstimado.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tratativa Completa da RNC (Ishikawa + 5 Porquês + Planos de Ação) */}
            <div className="lg:col-span-2 space-y-6">
              {rncSelecionada ? (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 text-xs">
                  {/* Cabeçalho da RNC */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {rncSelecionada.numeroRNC}
                        </span>
                        <span className="font-bold text-slate-500">Status: {rncSelecionada.status}</span>
                      </div>
                      <h2 className="text-base font-bold text-slate-900 mt-1">{rncSelecionada.titulo}</h2>
                    </div>

                    <div className="flex items-center gap-2">
                      {rncSelecionada.status !== 'EFICAZ_CONCLUIDA' && (
                        <button
                          onClick={() => handleValidarEficacia(rncSelecionada.id, true)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" /> Validar Eficácia
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Detalhamento do Problema & Disposição Imediata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 block">1. Problema & Detalhes Técnicos</span>
                      <p className="text-slate-600 leading-relaxed">{rncSelecionada.descricaoProblema}</p>
                      <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-200">
                        <div><strong>Item:</strong> {rncSelecionada.produtoCodigo} — {rncSelecionada.produtoDescricao}</div>
                        <div><strong>Setor / Origem:</strong> {rncSelecionada.setor} ({rncSelecionada.origem})</div>
                        <div><strong>Quantidade Não Conforme:</strong> {rncSelecionada.quantidadeNaoConforme} {rncSelecionada.unidadeMedida}</div>
                        <div><strong>Prejuízo Estimado:</strong> R$ {rncSelecionada.valorPrejuizoEstimado.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 block">2. Disposição Imediata & Bloqueio</span>
                      <p className="text-slate-600 leading-relaxed">{rncSelecionada.acaoDisposicaoImediata}</p>
                      <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-200">
                        <div><strong>Resultado da Disposição:</strong> <span className="font-bold text-amber-700">{rncSelecionada.resultadoDisposicao}</span></div>
                        <div><strong>Responsável:</strong> {rncSelecionada.responsavelDisposicao}</div>
                        <div><strong>Prazo Limite:</strong> {new Date(rncSelecionada.prazoLimiteConclusao).toLocaleDateString('pt-BR')}</div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Análise de Causa Raiz (Ishikawa 6M & 5 Porquês) */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">3. Análise de Causa Raiz (Ishikawa 6M & 5 Porquês)</span>
                    </div>

                    {rncSelecionada.causas && rncSelecionada.causas.length > 0 ? (
                      <div className="space-y-3">
                        {rncSelecionada.causas.map((causa, idx) => (
                          <div key={causa.id || idx} className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                Ishikawa: {causa.categoriaIshikawa}
                              </span>
                              <span className="text-[11px] text-slate-400">Por {causa.identificadaPor}</span>
                            </div>
                            <p className="font-semibold text-slate-800">{causa.descricaoCausa}</p>

                            {causa.metodo5Porques && (
                              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] space-y-1">
                                <div className="text-slate-600"><strong>1º Por quê:</strong> {causa.metodo5Porques.porQue1}</div>
                                <div className="text-slate-600"><strong>2º Por quê:</strong> {causa.metodo5Porques.porQue2}</div>
                                <div className="text-slate-600"><strong>3º Por quê:</strong> {causa.metodo5Porques.porQue3}</div>
                                <div className="text-slate-600"><strong>4º Por quê:</strong> {causa.metodo5Porques.porQue4}</div>
                                <div className="text-rose-700 font-bold"><strong>5º Por quê (Causa Raiz):</strong> {causa.metodo5Porques.porQue5CausaRaiz}</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                        <span className="text-[11px] text-slate-500 font-semibold block">Cadastrar Investigação de Causa Raiz:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Categoria Ishikawa</label>
                            <select
                              value={ishikawaCategoria}
                              onChange={(e) => setIshikawaCategoria(e.target.value as any)}
                              className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs font-semibold"
                            >
                              <option value="METODO">Método (Procedimento/Instrução)</option>
                              <option value="MATERIAL">Material (Matéria-Prima/Lote)</option>
                              <option value="MAQUINA">Máquina (Desgaste/Setup)</option>
                              <option value="MAO_DE_OBRA">Mão de Obra (Operação/Treinamento)</option>
                              <option value="MEDICAO">Medição (Instrumento/Calibração)</option>
                              <option value="MEIO_AMBIENTE">Meio Ambiente (Temperatura/Umidade)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Descrição da Falha</label>
                            <input
                              type="text"
                              value={ishikawaDescricao}
                              onChange={(e) => setIshikawaDescricao(e.target.value)}
                              placeholder="Ex: Desgaste do bico duplo de laser"
                              className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                          <input
                            type="text"
                            value={why1}
                            onChange={(e) => setWhy1(e.target.value)}
                            placeholder="1º Por quê (Por que a falha ocorreu?)"
                            className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs"
                          />
                          <input
                            type="text"
                            value={why5Raiz}
                            onChange={(e) => setWhy5Raiz(e.target.value)}
                            placeholder="5º Por quê (Causa Raiz definitiva)"
                            className="w-full bg-rose-50 border border-rose-200 rounded p-1.5 text-xs text-rose-900 font-semibold"
                          />
                        </div>

                        <button
                          onClick={() => handleSalvarIshikawa(rncSelecionada.id)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs"
                        >
                          Salvar Análise Ishikawa 6M
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 4. Planos de Ação (Corretivas & Preventivas) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ações Corretivas */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <span className="font-bold text-slate-900 block">4. Ações Corretivas (Eliminação da Causa)</span>
                      {rncSelecionada.acoesCorretivas?.map((ac, i) => (
                        <div key={ac.id || i} className="p-3 bg-white rounded-lg border border-slate-200 text-[11px] space-y-1">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>{ac.tipoAcao}</span>
                            <span className="text-emerald-600">{ac.status}</span>
                          </div>
                          <p className="text-slate-600">{ac.descricaoAcao}</p>
                          <div className="text-slate-400 flex justify-between pt-1">
                            <span>Resp: {ac.responsavelNome}</span>
                            <span>Prazo: {new Date(ac.prazoLimite).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      ))}

                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <input
                          type="text"
                          value={acaoDesc}
                          onChange={(e) => setAcaoDesc(e.target.value)}
                          placeholder="Nova ação corretiva..."
                          className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs"
                        />
                        <button
                          onClick={() => handleSalvarAcaoCorretiva(rncSelecionada.id)}
                          className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-xs"
                        >
                          Adicionar Ação Corretiva
                        </button>
                      </div>
                    </div>

                    {/* Ações Preventivas & Lições Aprendidas */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <span className="font-bold text-slate-900 block">5. Ações Preventivas & Lições Aprendidas</span>
                      {rncSelecionada.acoesPreventivas?.map((ap, i) => (
                        <div key={ap.id || i} className="p-3 bg-white rounded-lg border border-slate-200 text-[11px] space-y-1">
                          <div className="flex justify-between font-bold text-indigo-700">
                            <span>{ap.processoAfetado}</span>
                            <span className="text-emerald-600">{ap.status}</span>
                          </div>
                          <p className="text-slate-600">{ap.descricaoOportunidadeMelhoria}</p>
                          {ap.licaoAprendida && (
                            <p className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded">
                              <strong>Lição Aprendida:</strong> {ap.licaoAprendida}
                            </p>
                          )}
                        </div>
                      ))}

                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <input
                          type="text"
                          value={prevDesc}
                          onChange={(e) => setPrevDesc(e.target.value)}
                          placeholder="Melhoria preventiva nos processos..."
                          className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs"
                        />
                        <button
                          onClick={() => handleSalvarAcaoPreventiva(rncSelecionada.id)}
                          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs"
                        >
                          Registrar Ação Preventiva
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400">
                  <AlertOctagon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Selecione uma Não Conformidade para gerenciar a análise 8D e planos de ação.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-ABA 4: RETRABALHOS & REFUGOS / SUCATA                                */}
      {/* ========================================================================= */}
      {activeTab === 'retrabalhos_refugos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PAINEL DE RETRABALHOS */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Ordens de Retrabalho ({retrabalhos.length})</h3>
              </div>
              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                Horas & Custos de Ajuste
              </span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {retrabalhos.map((ret) => (
                <div key={ret.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="font-mono text-slate-900">{ret.numeroRetrabalho}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800">
                      {ret.status}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800">
                    {ret.produtoCodigo} — {ret.produtoDescricao} ({ret.quantidadeParaRetrabalhar} {ret.unidadeMedida})
                  </div>
                  <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100">
                    {ret.instrucaoRetrabalho}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Máquina: {ret.maquinaNome || 'Bancada'}</span>
                    <span className="font-bold text-blue-700">
                      {ret.horasReais || ret.horasEstimadas}h • R$ {ret.custoTotalRetrabalho.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PAINEL DE REFUGOS / SUCATAS */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Refugos & Descarte de Sucata ({refugos.length})</h3>
              </div>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                Pesagem & Prejuízo
              </span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {refugos.map((ref) => (
                <div key={ref.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="font-mono text-slate-900">{ref.numeroRefugo}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800">
                      {ref.status}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800">{ref.produtoCodigo} — {ref.descricaoMaterial}</div>
                  <div className="p-2 bg-white rounded border border-slate-100 text-[11px] text-slate-600">
                    <strong>Motivo:</strong> {ref.motivoCategoria} • {ref.detalheMotivo}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Peso: {ref.pesoTotalKg} kg ({ref.destinoMaterial})</span>
                    <span className="font-bold text-rose-600">Prejuízo: R$ {ref.custoTotalPrejuizo.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-ABA 5: MODELOS DE CHECKLIST                                           */}
      {/* ========================================================================= */}
      {activeTab === 'checklists' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Biblioteca de Modelos de Checklist</h3>
              <p className="text-xs text-slate-500">Planos de controle e critérios de aceitação para Recebimento, Processo e Final</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {checklists.map((chk) => (
              <div key={chk.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900">{chk.codigo}</span>
                  <span className="text-[10px] font-bold bg-slate-200 px-2 py-0.5 rounded text-slate-700">{chk.versao}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{chk.titulo}</h4>
                <p className="text-slate-500 text-[11px] line-clamp-2">{chk.descricao}</p>

                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                  <strong>Critérios Cadastrados ({chk.itens?.length || 0}):</strong>
                  <ul className="mt-1 space-y-1 list-disc pl-4 text-[10px] text-slate-500">
                    {chk.itens?.map((it, i) => (
                      <li key={it.id || i}>{it.tituloCriterio} ({it.instrumentoMedicao})</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVA INSPEÇÃO DE QUALIDADE                                         */}
      {/* ========================================================================= */}
      {modalNovaInspecao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Registrar Inspeção de Qualidade</h3>
              </div>
              <button onClick={() => setModalNovaInspecao(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ×
              </button>
            </div>

            <form onSubmit={handleRegistrarInspecao} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Inspeção</label>
                  <select
                    value={novaInspTipo}
                    onChange={(e) => {
                      const tipo = e.target.value as TipoInspecao;
                      setNovaInspTipo(tipo);
                      if (tipo === 'RECEBIMENTO') setNovaInspChecklistId('mod-chk-01');
                      else if (tipo === 'PROCESSO') setNovaInspChecklistId('mod-chk-02');
                      else setNovaInspChecklistId('mod-chk-03');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs font-semibold"
                  >
                    <option value="RECEBIMENTO">Inspeção de Recebimento</option>
                    <option value="PROCESSO">Inspeção em Processo</option>
                    <option value="FINAL">Inspeção Final</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código do Produto</label>
                  <input
                    type="text"
                    value={novaInspProdutoCodigo}
                    onChange={(e) => setNovaInspProdutoCodigo(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tamanho Lote / Amostra</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={novaInspTamanhoLote}
                      onChange={(e) => setNovaInspTamanhoLote(Number(e.target.value))}
                      className="w-1/2 bg-slate-50 border border-slate-200 rounded p-2 text-xs"
                      title="Tamanho do Lote"
                    />
                    <input
                      type="number"
                      value={novaInspTamanhoAmostra}
                      onChange={(e) => setNovaInspTamanhoAmostra(Number(e.target.value))}
                      className="w-1/2 bg-slate-50 border border-slate-200 rounded p-2 text-xs"
                      title="Tamanho da Amostra"
                    />
                  </div>
                </div>
              </div>

              {novaInspTipo === 'RECEBIMENTO' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fornecedor</label>
                    <input
                      type="text"
                      value={novaInspFornecedorNome}
                      onChange={(e) => setNovaInspFornecedorNome(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nota Fiscal</label>
                    <input
                      type="text"
                      value={novaInspNotaFiscal}
                      onChange={(e) => setNovaInspNotaFiscal(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs"
                    />
                  </div>
                </div>
              )}

              {novaInspTipo !== 'RECEBIMENTO' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ordem de Produção (OP)</label>
                    <input
                      type="text"
                      value={novaInspOpNumero}
                      onChange={(e) => setNovaInspOpNumero(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Máquina / Posto</label>
                    <input
                      type="text"
                      value={novaInspMaquinaNome}
                      onChange={(e) => setNovaInspMaquinaNome(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Critérios do Checklist Selecionado */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-900 block text-xs">Critérios de Medição & Tolerâncias</span>
                {(checklists.find((c) => c.id === novaInspChecklistId)?.itens || []).map((it) => (
                  <div key={it.id} className="p-2.5 bg-white rounded border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800 block">{it.tituloCriterio}</span>
                      <span className="text-[10px] text-slate-400">
                        {it.instrumentoMedicao} • Nominal: {it.valorNominal ?? 'Visual'} {it.unidadeMedida}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {it.tipoValor === 'NUMERICO_TOLERANCIA' ? (
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Medido"
                          onChange={(e) =>
                            setRespostasForm((prev) => ({
                              ...prev,
                              [it.id]: {
                                conforme: true,
                                valorMedido: parseFloat(e.target.value),
                                obs: '',
                              },
                            }))
                          }
                          className="w-20 bg-slate-50 border border-slate-200 rounded p-1 text-xs font-bold text-right"
                        />
                      ) : (
                        <select
                          onChange={(e) =>
                            setRespostasForm((prev) => ({
                              ...prev,
                              [it.id]: {
                                conforme: e.target.value === 'true',
                                valorMedido: e.target.value === 'true' ? 'Conforme' : 'Não Conforme',
                                obs: '',
                              },
                            }))
                          }
                          className="bg-slate-50 border border-slate-200 rounded p-1 text-xs font-bold"
                        >
                          <option value="true">Aprovado</option>
                          <option value="false">Reprovado</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Disposição / Decisão da Qualidade</label>
                <select
                  value={novaInspDisposicao}
                  onChange={(e) => setNovaInspDisposicao(e.target.value as DisposicaoQualidade)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs font-bold"
                >
                  <option value="APROVADO">Aprovado (Liberado sem restrições)</option>
                  <option value="QUARENTENA">Quarentena (Bloqueio Cautelar)</option>
                  <option value="RETRABALHO">Retrabalho (Gerar ordem de ajuste)</option>
                  <option value="REPROVADO">Reprovado (Rejeição Total)</option>
                  <option value="SUCATA">Sucata / Refugo (Descarte com perda)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações do Inspetor</label>
                <textarea
                  value={novaInspObservacoes}
                  onChange={(e) => setNovaInspObservacoes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNovaInspecao(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Salvar Inspeção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
