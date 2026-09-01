// frontend/src/components/ManutencaoViewer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Activity,
  AlertTriangle,
  Clock,
  DollarSign,
  CheckCircle2,
  Calendar,
  Layers,
  Plus,
  ArrowRight,
  RefreshCw,
  Search,
  Sliders,
  Sparkles,
  Zap,
  Radio,
  FileSpreadsheet,
  Cpu,
  Factory,
  ShieldAlert,
  ShoppingCart,
  Boxes,
  Check,
  X,
  Eye,
  AlertCircle,
  Truck,
  TrendingDown,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import {
  AtivoIndustrial,
  ComponenteAtivo,
  PlanoManutencao,
  OrdemManutencao,
  FalhaCatalogo,
  ParadaManutencao,
  ManutencaoItemRequisitado,
  ManutencaoServicoTerceiro,
  RegistroHorimetro,
  FerramentaIndustrial,
  MovimentoFerramenta,
  LeituraPreditivaSensor,
  IndicadoresPCM,
  TipoAtivo,
  StatusOperacionalAtivo,
  TipoManutencao,
  PrioridadeManutencao,
  StatusOrdemManutencao,
  TipoFerramenta,
} from '@/backend/modules/manutencao/manutencao-types';
import { Empresa } from '@/backend/core/types/company';

interface ManutencaoViewerProps {
  empresaAtiva: Empresa;
}

export function ManutencaoViewer({ empresaAtiva }: ManutencaoViewerProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    'dashboard' | 'ativos' | 'ordens' | 'pecas' | 'terceiros' | 'planos' | 'horimetros' | 'ferramentas' | 'preditiva'
  >('dashboard');

  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ tipo: 'success' | 'error' | 'info'; texto: string } | null>(null);

  // Dados do Módulo PCM
  const [indicadores, setIndicadores] = useState<IndicadoresPCM | null>(null);
  const [ativos, setAtivos] = useState<AtivoIndustrial[]>([]);
  const [componentes, setComponentes] = useState<ComponenteAtivo[]>([]);
  const [planos, setPlanos] = useState<PlanoManutencao[]>([]);
  const [ordens, setOrdens] = useState<OrdemManutencao[]>([]);
  const [ferramentas, setFerramentas] = useState<FerramentaIndustrial[]>([]);
  const [paradas, setParadas] = useState<ParadaManutencao[]>([]);
  const [horimetros, setHorimetros] = useState<RegistroHorimetro[]>([]);
  const [leiturasPreditivas, setLeiturasPreditivas] = useState<LeituraPreditivaSensor[]>([]);
  const [itensRequisitados, setItensRequisitados] = useState<ManutencaoItemRequisitado[]>([]);
  const [servicosTerceiros, setServicosTerceiros] = useState<ManutencaoServicoTerceiro[]>([]);

  // Estados de Seleção e Modais
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemManutencao | null>(null);
  const [ativoSelecionado, setAtivoSelecionado] = useState<AtivoIndustrial | null>(null);
  const [showModalNovaOM, setShowModalNovaOM] = useState(false);
  const [showModalRequisitarPeca, setShowModalRequisitarPeca] = useState(false);
  const [showModalHorimetro, setShowModalHorimetro] = useState(false);
  const [showModalNovoAtivo, setShowModalNovoAtivo] = useState(false);
  const [showModalServicoTerceiro, setShowModalServicoTerceiro] = useState(false);
  const [showModalMovFerramenta, setShowModalMovFerramenta] = useState(false);
  const [ferramentaSelecionada, setFerramentaSelecionada] = useState<FerramentaIndustrial | null>(null);
  const [showModalConcluirOM, setShowModalConcluirOM] = useState(false);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroStatusOM, setFiltroStatusOM] = useState<string>('TODOS');
  const [filtroTipoOM, setFiltroTipoOM] = useState<string>('TODOS');

  // Formulários States
  const [formNovaOM, setFormNovaOM] = useState<{
    ativoId: string;
    tipoManutencao: TipoManutencao;
    origem: OrdemManutencao['origem'];
    prioridade: PrioridadeManutencao;
    descricaoProblema: string;
    solicitanteNome: string;
    planoManutencaoId: string;
    bloquearProducaoImediatamente: boolean;
  }>({
    ativoId: '',
    tipoManutencao: 'CORRETIVA',
    origem: 'SOLICITACAO_CHAO_FABRICA',
    prioridade: 'ALTA',
    descricaoProblema: '',
    solicitanteNome: 'Operador / Chão de Fábrica',
    planoManutencaoId: '',
    bloquearProducaoImediatamente: true,
  });

  const [formRequisitarPeca, setFormRequisitarPeca] = useState<{
    ordemManutencaoId: string;
    produtoId: string;
    codigoProduto: string;
    descricao: string;
    quantidadeRequisitada: number;
    quantidadeEmEstoqueDisponivel: number;
    unidadeMedida: string;
    custoUnitario: number;
  }>({
    ordemManutencaoId: '',
    produtoId: 'prod-lente-01',
    codigoProduto: 'SOB-VIDRO-PROT-D30',
    descricao: 'Vidro Protetor de Lente D30 x 1.5mm',
    quantidadeRequisitada: 2,
    quantidadeEmEstoqueDisponivel: 0, // Inicia em 0 para demonstrar gatilho de compra
    unidadeMedida: 'UN',
    custoUnitario: 145.0,
  });

  const [formHorimetro, setFormHorimetro] = useState<{
    ativoId: string;
    horimetroAtual: number;
    origem: RegistroHorimetro['origem'];
    registradoPor: string;
  }>({
    ativoId: '',
    horimetroAtual: 0,
    origem: 'MANUAL',
    registradoPor: 'Técnico de Turno',
  });

  const [formConcluirOM, setFormConcluirOM] = useState<{
    causaRaizIdentificada: string;
    solucaoAplicada: string;
    tempoTrabalhoTecnicoHoras: number;
    tempoParadaHoras: number;
    observacoesFinais: string;
  }>({
    causaRaizIdentificada: '',
    solucaoAplicada: '',
    tempoTrabalhoTecnicoHoras: 1.5,
    tempoParadaHoras: 1.5,
    observacoesFinais: 'Teste de corte e conformação realizado com peças de amostra aprovadas.',
  });

  const [formServicoTerceiro, setFormServicoTerceiro] = useState<{
    ordemManutencaoId: string;
    fornecedorId: string;
    fornecedorNome: string;
    descricaoServico: string;
    horasTrabalhadas: number;
    valorHora: number;
  }>({
    ordemManutencaoId: '',
    fornecedorId: 'forn-trumpf',
    fornecedorNome: 'Trumpf Assistência Técnica Especializada',
    descricaoServico: 'Alinhamento e calibração de prisma óptico da fonte laser',
    horasTrabalhadas: 4,
    valorHora: 290.0,
  });

  const [formMovFerramenta, setFormMovFerramenta] = useState<{
    ferramentaId: string;
    tipoMovimento: MovimentoFerramenta['tipoMovimento'];
    ativoId: string;
    operadorNome: string;
    golpesNoSetup: number;
    observacoes: string;
  }>({
    ferramentaId: '',
    tipoMovimento: 'CHECKOUT_MONTAGEM',
    ativoId: '',
    operadorNome: 'Operador de Dobra / Setup',
    golpesNoSetup: 0,
    observacoes: '',
  });

  const [formNovoAtivo, setFormNovoAtivo] = useState<{
    tag: string;
    nome: string;
    tipo: TipoAtivo;
    marca: string;
    modelo: string;
    numeroSerie: string;
    anoFabricacao: number;
    criticidade: 'A' | 'B' | 'C';
    centroCusto: string;
    localizacaoSetor: string;
    statusOperacional: StatusOperacionalAtivo;
    dataAquisicao: string;
    valorAquisicao: number;
    custoHoraMaquina: number;
    horimetroAtual: number;
    horimetroUltimaPreventiva: number;
  }>({
    tag: 'LASER-02',
    nome: 'Máquina de Corte Laser Fibra 12kW Alta Velocidade',
    tipo: 'CORTE_LASER',
    marca: 'Bodor',
    modelo: 'Bodor P3 12kW Fiber',
    numeroSerie: 'BOD-2024-889',
    anoFabricacao: 2024,
    criticidade: 'A',
    centroCusto: 'CC-CORTE-LASER',
    localizacaoSetor: 'GALPAO_1_CORTE',
    statusOperacional: 'OPERACIONAL',
    dataAquisicao: '2024-05-10',
    valorAquisicao: 2400000.0,
    custoHoraMaquina: 320.0,
    horimetroAtual: 1200,
    horimetroUltimaPreventiva: 1000,
  });

  // Carregar Dados da API
  const carregarDados = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/manutencao?empresaId=${empresaAtiva.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setIndicadores(json.data.indicadores);
        setAtivos(json.data.ativos || []);
        setComponentes(json.data.componentes || []);
        setPlanos(json.data.planos || []);
        setOrdens(json.data.ordens || []);
        setFerramentas(json.data.ferramentas || []);
        setParadas(json.data.paradas || []);
        setHorimetros(json.data.horimetros || []);
        setLeiturasPreditivas(json.data.leiturasPreditivas || []);
        setItensRequisitados(json.data.itensRequisitados || []);
        setServicosTerceiros(json.data.servicosTerceiros || []);

        if (json.data.ordens?.length > 0 && !ordemSelecionada) {
          setOrdemSelecionada(json.data.ordens[0]);
        }
        if (json.data.ativos?.length > 0 && !ativoSelecionado) {
          setAtivoSelecionado(json.data.ativos[0]);
        }
      }
    } catch (e: any) {
      setFeedback({ tipo: 'error', texto: `Erro ao carregar dados do PCM: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/manutencao?empresaId=${empresaAtiva.id}`);
        const json = await res.json();
        if (!ignore && json.success && json.data) {
          setIndicadores(json.data.indicadores);
          setAtivos(json.data.ativos || []);
          setComponentes(json.data.componentes || []);
          setPlanos(json.data.planos || []);
          setOrdens(json.data.ordens || []);
          setFerramentas(json.data.ferramentas || []);
          setParadas(json.data.paradas || []);
          setHorimetros(json.data.horimetros || []);
          setLeiturasPreditivas(json.data.leiturasPreditivas || []);
          setItensRequisitados(json.data.itensRequisitados || []);
          setServicosTerceiros(json.data.servicosTerceiros || []);

          if (json.data.ordens?.length > 0) {
            setOrdemSelecionada((prev) => prev || json.data.ordens[0]);
          }
          if (json.data.ativos?.length > 0) {
            setAtivoSelecionado((prev) => prev || json.data.ativos[0]);
          }
        }
      } catch (e: any) {
        if (!ignore) {
          setFeedback({ tipo: 'error', texto: `Erro ao carregar dados do PCM: ${e.message}` });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [empresaAtiva.id]);

  // Handlers de Ações
  const handleAbrirOM = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/manutencao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'abrir_om',
          empresaId: empresaAtiva.id,
          payload: formNovaOM,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ tipo: 'success', texto: json.message });
        setShowModalNovaOM(false);
        carregarDados();
      } else {
        setFeedback({ tipo: 'error', texto: json.error || 'Erro ao abrir OM' });
      }
    } catch (e: any) {
      setFeedback({ tipo: 'error', texto: e.message });
    }
  };

  const handleRequisitarPeca = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/manutencao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'requisitar_peca',
          empresaId: empresaAtiva.id,
          payload: formRequisitarPeca,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ tipo: 'success', texto: json.message });
        setShowModalRequisitarPeca(false);
        carregarDados();
      } else {
        setFeedback({ tipo: 'error', texto: json.error || 'Erro ao requisitar peça' });
      }
    } catch (e: any) {
      setFeedback({ tipo: 'error', texto: e.message });
    }
  };

  const handleRegistrarHorimetro = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/manutencao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'registrar_horimetro',
          empresaId: empresaAtiva.id,
          payload: formHorimetro,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ tipo: 'success', texto: json.message });
        setShowModalHorimetro(false);
        carregarDados();
      } else {
        setFeedback({ tipo: 'error', texto: json.error || 'Erro ao registrar horímetro' });
      }
    } catch (e: any) {
      setFeedback({ tipo: 'error', texto: e.message });
    }
  };

  const handleConcluirOM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ordemSelecionada) return;
    try {
      const res = await fetch('/api/v1/manutencao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'concluir_om',
          empresaId: empresaAtiva.id,
          payload: {
            ordemId: ordemSelecionada.id,
            dados: formConcluirOM,
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ tipo: 'success', texto: json.message });
        setShowModalConcluirOM(false);
        carregarDados();
      } else {
        setFeedback({ tipo: 'error', texto: json.error || 'Erro ao concluir OM' });
      }
    } catch (e: any) {
      setFeedback({ tipo: 'error', texto: e.message });
    }
  };

  const handleAlterarStatusAtivo = async (ativoId: string, novoStatus: StatusOperacionalAtivo) => {
    try {
      const res = await fetch('/api/v1/manutencao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'atualizar_status_ativo',
          empresaId: empresaAtiva.id,
          payload: {
            ativoId,
            statusOperacional: novoStatus,
            motivo: `Alteração manual pelo PCM (${novoStatus})`,
            usuario: 'Engenheiro de Manutenção',
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ tipo: 'success', texto: json.message });
        carregarDados();
      } else {
        setFeedback({ tipo: 'error', texto: json.error });
      }
    } catch (e: any) {
      setFeedback({ tipo: 'error', texto: e.message });
    }
  };

  const handleToggleTarefa = async (omId: string, tarefaId: string, statusAtual: boolean) => {
    try {
      const res = await fetch('/api/v1/manutencao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'atualizar_tarefa_om',
          empresaId: empresaAtiva.id,
          payload: {
            ordemId: omId,
            tarefaId,
            dados: {
              concluido: !statusAtual,
              executadoPor: 'Técnico Responsável',
            },
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        carregarDados();
      }
    } catch (e: any) {
      setFeedback({ tipo: 'error', texto: e.message });
    }
  };

  const handleCadastrarNovoAtivo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/manutencao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'cadastrar_ativo',
          empresaId: empresaAtiva.id,
          payload: formNovoAtivo,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ tipo: 'success', texto: json.message || 'Equipamento cadastrado com sucesso!' });
        setShowModalNovoAtivo(false);
        setFormNovoAtivo({
          tag: '',
          nome: '',
          tipo: 'CORTE_LASER',
          marca: '',
          modelo: '',
          numeroSerie: '',
          anoFabricacao: new Date().getFullYear(),
          criticidade: 'A',
          centroCusto: 'CC-PRODUCAO',
          localizacaoSetor: 'GALPAO_1',
          statusOperacional: 'OPERACIONAL',
          dataAquisicao: new Date().toISOString().split('T')[0],
          valorAquisicao: 0,
          custoHoraMaquina: 150.0,
          horimetroAtual: 0,
          horimetroUltimaPreventiva: 0,
        });
        await carregarDados();
      } else {
        setFeedback({ tipo: 'error', texto: json.error || 'Erro ao cadastrar equipamento.' });
      }
    } catch (e: any) {
      setFeedback({ tipo: 'error', texto: e.message || 'Erro inesperado ao cadastrar equipamento.' });
    }
  };

  const handleMovimentarFerramenta = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/manutencao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'movimentar_ferramenta',
          empresaId: empresaAtiva.id,
          payload: formMovFerramenta,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ tipo: 'success', texto: json.message });
        setShowModalMovFerramenta(false);
        carregarDados();
      } else {
        setFeedback({ tipo: 'error', texto: json.error });
      }
    } catch (e: any) {
      setFeedback({ tipo: 'error', texto: e.message });
    }
  };

  const handleAdicionarServicoTerceiro = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/manutencao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'adicionar_servico_terceiro',
          empresaId: empresaAtiva.id,
          payload: {
            ...formServicoTerceiro,
            status: 'EM_EXECUCAO',
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ tipo: 'success', texto: json.message });
        setShowModalServicoTerceiro(false);
        carregarDados();
      } else {
        setFeedback({ tipo: 'error', texto: json.error });
      }
    } catch (e: any) {
      setFeedback({ tipo: 'error', texto: e.message });
    }
  };

  const handleSimularAlarmePreditivo = async (ativo: AtivoIndustrial) => {
    try {
      const res = await fetch('/api/v1/manutencao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'registrar_leitura_preditiva',
          empresaId: empresaAtiva.id,
          payload: {
            ativoId: ativo.id,
            ativoTag: ativo.tag,
            temperaturaFonteGrausC: 58.2,
            vibracaoEixoRmsMmS: 8.9,
            pressaoHidraulicaBar: 295.0,
            qualidadeOleoParticulasNas: 9,
            alertaDetectado: true,
            statusSensor: 'CRITICO',
            mensagemDiagnostico: `Anomalia de vibração e temperatura crítica no cabeçote da ${ativo.tag} (RMS 8.9 mm/s > limite 4.5 mm/s). Disparando OM Preditiva proativa!`,
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({
          tipo: 'info',
          texto: `Simulação Preditiva IoT: Alarme crítico gerou automaticamente uma Ordem de Manutenção Preditiva!`,
        });
        carregarDados();
      }
    } catch (e: any) {
      setFeedback({ tipo: 'error', texto: e.message });
    }
  };

  // Filtragem de Ordens
  const ordensFiltradas = ordens.filter((o) => {
    const matchBusca =
      o.numeroOM.toLowerCase().includes(busca.toLowerCase()) ||
      o.ativoTag.toLowerCase().includes(busca.toLowerCase()) ||
      o.descricaoProblema.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatusOM === 'TODOS' || o.status === filtroStatusOM;
    const matchTipo = filtroTipoOM === 'TODOS' || o.tipoManutencao === filtroTipoOM;
    return matchBusca && matchStatus && matchTipo;
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between shadow-xs border ${
            feedback.tipo === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : feedback.tipo === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.tipo === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : feedback.tipo === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <Zap className="w-5 h-5 text-blue-600 shrink-0" />
            )}
            <span className="text-xs font-semibold">{feedback.texto}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Principal do PCM */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Módulo 11: Gestão de Manutenção & Ativos (PCM)</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
                  TPM & Confiabilidade
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Parque de máquinas do Grupo TRITECH, planos preventivos/preditivos, horímetros, sobressalentes e integração direta com PCP e Compras.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => carregarDados()}
            disabled={loading}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={() => {
              if (ativos.length > 0) {
                setFormNovaOM((prev) => ({ ...prev, ativoId: ativos[0].id }));
              }
              setShowModalNovaOM(true);
            }}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Ordem de Manutenção (OM)
          </button>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="border-b border-slate-200 bg-white px-4 rounded-xl shadow-xs">
        <div className="flex overflow-x-auto gap-2 py-2">
          {[
            { id: 'dashboard', label: 'Painel & Indicadores PCM', icon: Activity },
            { id: 'ativos', label: 'Parque de Ativos & Máquinas', icon: Factory, badge: ativos.length },
            { id: 'ordens', label: 'Ordens de Manutenção (OM)', icon: Wrench, badge: ordens.filter(o => o.status !== 'CONCLUIDA').length },
            { id: 'pecas', label: 'Sobressalentes & Compras', icon: ShoppingCart, badge: itensRequisitados.length },
            { id: 'terceiros', label: 'Serviços de Terceiros', icon: Truck },
            { id: 'planos', label: 'Planos Preventivos (PMP)', icon: Calendar, badge: planos.length },
            { id: 'horimetros', label: 'Leituras de Horímetro', icon: Clock },
            { id: 'ferramentas', label: 'Ferramental & Matrizes', icon: Sliders, badge: ferramentas.length },
            { id: 'preditiva', label: 'Telemetria & Preditiva IoT', icon: Radio },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. ABA: PAINEL & INDICADORES PCM */}
      {activeSubTab === 'dashboard' && indicadores && (
        <div className="space-y-6">
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Disponibilidade Global</span>
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{indicadores.disponibilidadeGlobalPercentual}%</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Meta ≥ 95.0% (Confiabilidade Alta)
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">MTBF (Tempo Médio Falhas)</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{indicadores.mtbfGlobalHoras}h</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">Média horas operadas sem quebra</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">MTTR (Tempo Médio Reparo)</span>
                <Wrench className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{indicadores.mttrGlobalHoras}h</div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">Média horas de intervenção corretiva</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Preventivas no Prazo (SLA)</span>
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{indicadores.taxaPreventivasEmDiaPercentual}%</div>
              <div className="text-[11px] text-purple-600 font-semibold mt-1">Cumprimento do Plano Mestre PMP</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Custo de Manutenção / Hora</span>
                <DollarSign className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                R$ {indicadores.custoManutencaoPorHoraOperacional.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">Por hora operada no parque fabril</div>
            </div>
          </div>

          {/* Alertas de Máquinas com Bloqueio de PCP */}
          {ativos.some((a) => a.bloqueioPCP) && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl shadow-xs">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-sm mb-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Máquinas Indisponíveis com Bloqueio Ativo no PCP & Chão de Fábrica
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ativos
                  .filter((a) => a.bloqueioPCP)
                  .map((atv) => (
                    <div key={atv.id} className="bg-white p-3 rounded-lg border border-rose-200 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-rose-900">{atv.tag}</span>
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                          {atv.statusOperacional}
                        </span>
                      </div>
                      <div className="text-slate-600 font-medium">{atv.nome}</div>
                      <div className="text-[11px] text-rose-700 italic">{atv.motivoBloqueioPCP}</div>
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => handleAlterarStatusAtivo(atv.id, 'OPERACIONAL')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Check className="w-3 h-3" /> Desbloquear & Liberar PCP
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Pareto & Análise de Custos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pareto de Máquinas com Mais Falhas */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Factory className="w-4 h-4 text-orange-600" />
                  Ranking de Quebras & Horas Paradas por Ativo
                </h3>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Pareto Falhas</span>
              </div>
              <div className="divide-y divide-slate-100">
                {indicadores.maquinasComMaisFalhas.map((m, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">
                        {m.ativoTag} — <span className="font-normal text-slate-600">{m.nome}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {m.totalFalhas} falhas registradas | {m.horasParadas.toFixed(1)}h de downtime acumulado
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">R$ {m.custoTotal.toLocaleString('pt-BR')}</div>
                      <span className="text-[10px] text-rose-600 font-semibold">Custo Total OM</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Demonstração de Custos da Manutenção */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Composição do Custo de Manutenção ({indicadores.periodoMes})
                </h3>
                <span className="text-xs font-bold text-slate-900">
                  Total: R$ {indicadores.custoTotalManutencaoMes.toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Peças & Sobressalentes</span>
                    <span>R$ {indicadores.custoMateriaisPecas.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{
                        width: `${(indicadores.custoMateriaisPecas / Math.max(1, indicadores.custoTotalManutencaoMes)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Mão de Obra Interna (Técnicos)</span>
                    <span>R$ {indicadores.custoMaoDeObraInterna.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full"
                      style={{
                        width: `${(indicadores.custoMaoDeObraInterna / Math.max(1, indicadores.custoTotalManutencaoMes)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Serviços Especializados de Terceiros</span>
                    <span>R$ {indicadores.custoServicosTerceiros.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-orange-600 h-full rounded-full"
                      style={{
                        width: `${(indicadores.custoServicosTerceiros / Math.max(1, indicadores.custoTotalManutencaoMes)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Custo de Oportunidade (Horas Máquina Parada)</span>
                    <span>R$ {indicadores.custoOportunidadeParadas.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-600 h-full rounded-full"
                      style={{
                        width: `${(indicadores.custoOportunidadeParadas / Math.max(1, indicadores.custoTotalManutencaoMes)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ABA: PARQUE DE ATIVOS & MÁQUINAS */}
      {activeSubTab === 'ativos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-800">
                Ativos Cadastrados ({ativos.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowModalNovoAtivo(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Cadastrar Novo Equipamento
              </button>
            </div>
          </div>

          {ativos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
              <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Factory className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-base font-bold text-slate-900">Nenhum equipamento cadastrado nesta empresa</h4>
                <p className="text-xs text-slate-500">
                  Cadastre as máquinas, células de corte, dobras ou centros de usinagem para gerenciar planos preventivos, horímetros e OMs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModalNovoAtivo(true)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> Cadastrar Primeiro Equipamento
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ativos.map((atv) => {
              const isOperacional = atv.statusOperacional === 'OPERACIONAL';
              return (
                <div
                  key={atv.id}
                  className={`bg-white rounded-xl border p-5 shadow-xs space-y-3 transition-all ${
                    atv.bloqueioPCP ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{atv.tag}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            atv.criticidade === 'A'
                              ? 'bg-rose-100 text-rose-800'
                              : atv.criticidade === 'B'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Crit. {atv.criticidade}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-700 mt-0.5">{atv.nome}</h4>
                      <p className="text-[11px] text-slate-400">
                        {atv.marca} {atv.modelo} (Ano {atv.anoFabricacao})
                      </p>
                    </div>

                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isOperacional
                          ? 'bg-emerald-100 text-emerald-800'
                          : atv.statusOperacional === 'EM_MANUTENCAO_PREVENTIVA'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {atv.statusOperacional.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg text-[11px]">
                    <div>
                      <span className="text-slate-400 block font-medium">Horímetro Atual:</span>
                      <span className="font-bold text-slate-800">{atv.horimetroAtual} horas</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Próxima Preventiva:</span>
                      <span className="font-bold text-slate-800">
                        {atv.proximaPreventivaHorimetro ? `${atv.proximaPreventivaHorimetro}h` : 'N/D'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Disponibilidade:</span>
                      <span className="font-bold text-emerald-600">{atv.disponibilidadePercentual}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">MTBF / MTTR:</span>
                      <span className="font-bold text-slate-800">
                        {atv.mtbfHoras}h / {atv.mttrHoras}h
                      </span>
                    </div>
                  </div>

                  {atv.bloqueioPCP && (
                    <div className="bg-rose-50 border border-rose-200 p-2 rounded text-[11px] text-rose-800 font-semibold flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>{atv.motivoBloqueioPCP}</span>
                    </div>
                  )}

                  {/* Ações Rápidas no Ativo */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setFormHorimetro({
                          ativoId: atv.id,
                          horimetroAtual: atv.horimetroAtual + 10,
                          origem: 'MANUAL',
                          registradoPor: 'Técnico de Manutenção',
                        });
                        setShowModalHorimetro(true);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Clock className="w-3 h-3" /> + Horímetro
                    </button>

                    <button
                      onClick={() => handleSimularAlarmePreditivo(atv)}
                      title="Simular Telemetria IoT e Alarme"
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Radio className="w-3 h-3 text-amber-600" /> Teste Preditivo
                    </button>

                    {isOperacional ? (
                      <button
                        onClick={() => handleAlterarStatusAtivo(atv.id, 'INDISPONIVEL_DEFEITO')}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <AlertTriangle className="w-3 h-3" /> Parar Máquina
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAlterarStatusAtivo(atv.id, 'OPERACIONAL')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3 h-3" /> Liberar PCP
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* 3. ABA: ORDENS DE MANUTENÇÃO (OM) */}
      {activeSubTab === 'ordens' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda: Lista de OMs */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filtros */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por OM, máquina ou problema..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filtroStatusOM}
                  onChange={(e) => setFiltroStatusOM(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium"
                >
                  <option value="TODOS">Todos Status</option>
                  <option value="ABERTA">Aberta</option>
                  <option value="EM_EXECUCAO">Em Execução</option>
                  <option value="AGUARDANDO_PECA">Aguardando Peça</option>
                  <option value="AGUARDANDO_TERCEIRO">Aguardando Terceiro</option>
                  <option value="CONCLUIDA">Concluída</option>
                </select>

                <select
                  value={filtroTipoOM}
                  onChange={(e) => setFiltroTipoOM(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium"
                >
                  <option value="TODOS">Todos Tipos</option>
                  <option value="PREVENTIVA">Preventiva</option>
                  <option value="CORRETIVA">Corretiva</option>
                  <option value="PREDITIVA">Preditiva</option>
                </select>
              </div>
            </div>

            {/* Lista Cards de OM */}
            <div className="space-y-3">
              {ordensFiltradas.map((om) => {
                const isSelected = ordemSelecionada?.id === om.id;
                return (
                  <div
                    key={om.id}
                    onClick={() => setOrdemSelecionada(om)}
                    className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
                      isSelected
                        ? 'border-orange-600 ring-2 ring-orange-100'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{om.numeroOM}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              om.tipoManutencao === 'PREVENTIVA'
                                ? 'bg-purple-100 text-purple-800'
                                : om.tipoManutencao === 'CORRETIVA'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {om.tipoManutencao}
                          </span>
                          <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {om.ativoTag}
                          </span>
                          {om.bloqueouProducao && (
                            <span className="text-[10px] font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" /> PCP Bloqueado
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-semibold text-slate-800">{om.descricaoProblema}</h4>
                        <p className="text-[11px] text-slate-400">
                          Solicitante: {om.solicitanteNome} | Resp: {om.tecnicoResponsavelNome || 'A Definir'}
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            om.status === 'CONCLUIDA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : om.status === 'EM_EXECUCAO'
                              ? 'bg-amber-100 text-amber-800'
                              : om.status === 'AGUARDANDO_PECA'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {om.status.replace(/_/g, ' ')}
                        </span>
                        <div className="text-xs font-bold text-slate-900">
                          R$ {om.custoTotalOM.toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coluna Direita: Detalhes da OM Selecionada */}
          <div className="space-y-4">
            {ordemSelecionada ? (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                      Detalhes da Ordem
                    </span>
                    <h3 className="text-base font-black text-slate-900">{ordemSelecionada.numeroOM}</h3>
                    <p className="text-[11px] text-slate-500">{ordemSelecionada.ativoNome}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${
                      ordemSelecionada.status === 'CONCLUIDA'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {ordemSelecionada.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Checklist de Tarefas Técnicas */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>Tarefas do Checklist ({ordemSelecionada.tarefasExecutadas.length})</span>
                  </div>

                  {ordemSelecionada.tarefasExecutadas.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Nenhuma tarefa padrão vinculada.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {ordemSelecionada.tarefasExecutadas.map((tar) => (
                        <div
                          key={tar.tarefaId}
                          onClick={() =>
                            handleToggleTarefa(ordemSelecionada.id, tar.tarefaId, tar.concluido)
                          }
                          className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            tar.concluido
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border ${
                                tar.concluido
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {tar.concluido && <Check className="w-3 h-3" />}
                            </div>
                            <span className={tar.concluido ? 'line-through text-slate-500' : 'font-medium'}>
                              {tar.descricao}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Resumo Financeiro da OM */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Mão de Obra Interna:</span>
                    <span className="font-semibold">R$ {ordemSelecionada.custoMaoDeObraInterna.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Peças & Materiais:</span>
                    <span className="font-semibold">R$ {ordemSelecionada.custoMateriaisPecas.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Serviços de Terceiros:</span>
                    <span className="font-semibold">R$ {ordemSelecionada.custoServicosTerceiros.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Custo de Parada ({ordemSelecionada.tempoParadaHoras}h):</span>
                    <span className="font-semibold text-rose-600">
                      R$ {ordemSelecionada.custoOportunidadeParada.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-slate-900">
                    <span>Custo Total:</span>
                    <span>R$ {ordemSelecionada.custoTotalOM.toFixed(2)}</span>
                  </div>
                </div>

                {/* Ações da OM */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      setFormRequisitarPeca((prev) => ({
                        ...prev,
                        ordemManutencaoId: ordemSelecionada.id,
                      }));
                      setShowModalRequisitarPeca(true);
                    }}
                    className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Requisitar Peça / Sobressalente
                  </button>

                  <button
                    onClick={() => {
                      setFormServicoTerceiro((prev) => ({
                        ...prev,
                        ordemManutencaoId: ordemSelecionada.id,
                      }));
                      setShowModalServicoTerceiro(true);
                    }}
                    className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Truck className="w-3.5 h-3.5" /> Adicionar Serviço Terceiro
                  </button>

                  {ordemSelecionada.status !== 'CONCLUIDA' && (
                    <button
                      onClick={() => {
                        setShowModalConcluirOM(true);
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Concluir OM & Liberar Máquina
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                Selecione uma Ordem de Manutenção para ver os detalhes e executar apontamentos.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. ABA: SOBRESSALENTES & COMPRAS AUTOMÁTICAS */}
      {activeSubTab === 'pecas' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
            <ShoppingCart className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-blue-900">
                Integração Nativa PCM ➔ Compras & Suprimentos
              </h4>
              <p className="text-xs text-blue-700 mt-0.5">
                Toda requisição de peças sobressalentes sem saldo suficiente em estoque gera automaticamente uma
                <strong> Solicitação de Compra (SC)</strong> com prioridade emergencial no módulo de Compras do GRUPO SENAGRO.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="p-3">Ordem Manutenção</th>
                  <th className="p-3">Código & Descrição da Peça</th>
                  <th className="p-3 text-center">Qtd Requisitada</th>
                  <th className="p-3 text-center">Saldo Estoque</th>
                  <th className="p-3 text-right">Custo Total</th>
                  <th className="p-3 text-center">Status Atendimento</th>
                  <th className="p-3 text-center">Solicitação de Compra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itensRequisitados.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">{it.numeroOM}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{it.descricao}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{it.codigoProduto}</div>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-800">
                      {it.quantidadeRequisitada} {it.unidadeMedida}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          it.quantidadeEmEstoqueDisponivel >= it.quantidadeRequisitada
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {it.quantidadeEmEstoqueDisponivel} {it.unidadeMedida}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      R$ {it.custoTotal.toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                          it.statusAtendimento === 'RESERVADO_ESTOQUE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {it.statusAtendimento.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {it.solicitacaoCompraNumero ? (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[11px]">
                          {it.solicitacaoCompraNumero}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ABA: SERVIÇOS DE TERCEIROS */}
      {activeSubTab === 'terceiros' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-900">Contratos & Assistências Técnicas Externas</h3>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="p-3">OM Vinculada</th>
                  <th className="p-3">Fornecedor / Especialista</th>
                  <th className="p-3">Descrição do Serviço</th>
                  <th className="p-3 text-center">Horas</th>
                  <th className="p-3 text-right">Taxa / Hora</th>
                  <th className="p-3 text-right">Valor Total</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {servicosTerceiros.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">{s.numeroOM}</td>
                    <td className="p-3 font-semibold text-slate-800">{s.fornecedorNome}</td>
                    <td className="p-3 text-slate-600">{s.descricaoServico}</td>
                    <td className="p-3 text-center font-bold">{s.horasTrabalhadas}h</td>
                    <td className="p-3 text-right">R$ {s.valorHora.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-slate-900">R$ {s.valorTotal.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px]">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. ABA: PLANOS DE MANUTENÇÃO (PMP) */}
      {activeSubTab === 'planos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {planos.map((pln) => (
            <div key={pln.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                    {pln.codigo}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{pln.titulo}</h4>
                  <p className="text-[11px] text-slate-400">Qualificação: {pln.qualificacaoRequerida}</p>
                </div>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-[10px] font-bold">
                  {pln.gatilho}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Periodicidade:</span>
                  <span className="font-semibold">
                    {pln.intervaloHorimetro ? `${pln.intervaloHorimetro} horas` : `${pln.intervaloDias} dias`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tempo Estimado:</span>
                  <span className="font-semibold">{pln.tempoTotalEstimadoHoras} horas</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1">Checklist de Tarefas:</span>
                <ul className="text-xs space-y-1 text-slate-600">
                  {pln.tarefas.map((tar) => (
                    <li key={tar.id} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                      <span>{tar.descricao} ({tar.tempoEstimadoMinutos} min)</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 7. ABA: LEITURAS DE HORÍMETRO */}
      {activeSubTab === 'horimetros' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-900">Histórico de Apontamento de Horímetros</h3>
              <button
                onClick={() => {
                  if (ativos.length > 0) {
                    setFormHorimetro({
                      ativoId: ativos[0].id,
                      horimetroAtual: ativos[0].horimetroAtual + 50,
                      origem: 'MANUAL',
                      registradoPor: 'Técnico de Manutenção',
                    });
                  }
                  setShowModalHorimetro(true);
                }}
                className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Lançar Leitura
              </button>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="p-3">Data/Hora</th>
                  <th className="p-3">Máquina (TAG)</th>
                  <th className="p-3 text-center">Horímetro Anterior</th>
                  <th className="p-3 text-center">Horímetro Atual</th>
                  <th className="p-3 text-center">Horas Operadas</th>
                  <th className="p-3">Origem</th>
                  <th className="p-3 text-center">Gatilho Preventivo</th>
                  <th className="p-3">Registrado Por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {horimetros.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-slate-500">{new Date(h.dataLeitura).toLocaleString('pt-BR')}</td>
                    <td className="p-3 font-bold text-slate-900">{h.ativoTag}</td>
                    <td className="p-3 text-center">{h.horimetroAnterior}h</td>
                    <td className="p-3 text-center font-bold text-slate-900">{h.horimetroAtual}h</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">+{h.horasTrabalhadasPeriodo}h</td>
                    <td className="p-3 text-slate-600">{h.origem}</td>
                    <td className="p-3 text-center">
                      {h.disparouPreventiva ? (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px]">
                          {h.ordemManutencaoGeradaNumero || 'Preventiva Gerada'}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">{h.registradoPor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. ABA: FERRAMENTAL & MATRIZES */}
      {activeSubTab === 'ferramentas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ferramentas.map((fer) => (
              <div key={fer.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500">{fer.codigo}</span>
                    <h4 className="text-xs font-bold text-slate-900">{fer.nome}</h4>
                    <p className="text-[11px] text-slate-400">Armazém: {fer.localizacaoArmazem}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      fer.status === 'MONTADA_EM_MAQUINA'
                        ? 'bg-blue-100 text-blue-800'
                        : fer.status === 'DISPONIVEL_ESTOQUE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {fer.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Vida Útil Acumulada:</span>
                    <span className="font-bold text-slate-800">
                      {fer.acumuladoGolpesHoras.toLocaleString()} / {fer.vidaUtilEstimadaGolpesHoras.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{
                        width: `${(fer.acumuladoGolpesHoras / Math.max(1, fer.vidaUtilEstimadaGolpesHoras)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">
                    {fer.ativoAtualTag ? `Montada em: ${fer.ativoAtualTag}` : 'No Almoxarifado'}
                  </span>
                  <button
                    onClick={() => {
                      setFerramentaSelecionada(fer);
                      setFormMovFerramenta((prev) => ({
                        ...prev,
                        ferramentaId: fer.id,
                        ativoId: fer.ativoAtualId || (ativos[0]?.id || ''),
                      }));
                      setShowModalMovFerramenta(true);
                    }}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold flex items-center gap-1"
                  >
                    <Sliders className="w-3 h-3" /> Movimentar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. ABA: TELEMETRIA & PREDITIVA IOT */}
      {activeSubTab === 'preditiva' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Radio className="w-4 h-4 text-orange-600" />
              Sensores de Condição & Monitoramento Preditivo
            </h3>
            <p className="text-xs text-slate-500">
              Vibração dos fusos, temperatura de fontes laser e sensores de contaminação de óleo operando em tempo real.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {leiturasPreditivas.map((l) => (
                <div
                  key={l.id}
                  className={`p-4 rounded-xl border ${
                    l.statusSensor === 'CRITICO'
                      ? 'bg-rose-50 border-rose-200 text-rose-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm">{l.ativoTag}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        l.statusSensor === 'CRITICO' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {l.statusSensor}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div>Temperatura da Fonte: <strong>{l.temperaturaFonteGrausC}°C</strong></div>
                    <div>Nível de Vibração RMS: <strong>{l.vibracaoEixoRmsMmS} mm/s</strong></div>
                    <div>Pressão Hidráulica: <strong>{l.pressaoHidraulicaBar} bar</strong></div>
                    <p className="pt-2 text-[11px] italic font-medium">{l.mensagemDiagnostico}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVA ORDEM DE MANUTENÇÃO */}
      {showModalNovaOM && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-600" /> Abertura de Ordem de Manutenção
              </h3>
              <button onClick={() => setShowModalNovaOM(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAbrirOM} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Equipamento / Máquina:</label>
                <select
                  value={formNovaOM.ativoId}
                  onChange={(e) => setFormNovaOM({ ...formNovaOM, ativoId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  required
                >
                  {ativos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.tag} — {a.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Manutenção:</label>
                  <select
                    value={formNovaOM.tipoManutencao}
                    onChange={(e) => setFormNovaOM({ ...formNovaOM, tipoManutencao: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  >
                    <option value="CORRETIVA">Corretiva</option>
                    <option value="PREVENTIVA">Preventiva</option>
                    <option value="PREDITIVA">Preditiva</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prioridade:</label>
                  <select
                    value={formNovaOM.prioridade}
                    onChange={(e) => setFormNovaOM({ ...formNovaOM, prioridade: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  >
                    <option value="ALTA">Alta</option>
                    <option value="EMERGENCIAL_PARADA_PRODUCAO">Emergencial (Parada Imediata)</option>
                    <option value="MEDIA">Média</option>
                    <option value="BAIXA">Baixa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição do Problema / Sintoma:</label>
                <textarea
                  value={formNovaOM.descricaoProblema}
                  onChange={(e) => setFormNovaOM({ ...formNovaOM, descricaoProblema: e.target.value })}
                  placeholder="Ex: Aquecimento no motor do eixo Y e perda de alinhamento óptico..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium h-20"
                  required
                ></textarea>
              </div>

              <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bloquearPcpCheck"
                  checked={formNovaOM.bloquearProducaoImediatamente}
                  onChange={(e) =>
                    setFormNovaOM({ ...formNovaOM, bloquearProducaoImediatamente: e.target.checked })
                  }
                  className="rounded text-rose-600"
                />
                <label htmlFor="bloquearPcpCheck" className="text-[11px] font-bold text-rose-900 cursor-pointer">
                  Notificar PCP e Bloquear Alocação de Novas OPs Nesta Máquina
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalNovaOM(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Abrir Ordem de Manutenção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REQUISITAR PEÇA COM GERAÇÃO DE COMPRA */}
      {showModalRequisitarPeca && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" /> Requisição de Peça / Sobressalente
              </h3>
              <button onClick={() => setShowModalRequisitarPeca(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequisitarPeca} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Código do Item / Sobressalente:</label>
                <input
                  type="text"
                  value={formRequisitarPeca.codigoProduto}
                  onChange={(e) => setFormRequisitarPeca({ ...formRequisitarPeca, codigoProduto: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição:</label>
                <input
                  type="text"
                  value={formRequisitarPeca.descricao}
                  onChange={(e) => setFormRequisitarPeca({ ...formRequisitarPeca, descricao: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Qtd Requisitada:</label>
                  <input
                    type="number"
                    value={formRequisitarPeca.quantidadeRequisitada}
                    onChange={(e) =>
                      setFormRequisitarPeca({
                        ...formRequisitarPeca,
                        quantidadeRequisitada: parseFloat(e.target.value) || 1,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Saldo Atual em Estoque:</label>
                  <input
                    type="number"
                    value={formRequisitarPeca.quantidadeEmEstoqueDisponivel}
                    onChange={(e) =>
                      setFormRequisitarPeca({
                        ...formRequisitarPeca,
                        quantidadeEmEstoqueDisponivel: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  />
                </div>
              </div>

              {formRequisitarPeca.quantidadeRequisitada > formRequisitarPeca.quantidadeEmEstoqueDisponivel && (
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-amber-900 text-[11px] font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Estoque insuficiente! Uma Solicitação de Compra emergencial será gerada automaticamente.</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalRequisitarPeca(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Confirmar Requisição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONCLUIR ORDEM DE MANUTENÇÃO */}
      {showModalConcluirOM && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Fechamento & Conclusão de OM
              </h3>
              <button onClick={() => setShowModalConcluirOM(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConcluirOM} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Causa Raiz Identificada:</label>
                <input
                  type="text"
                  value={formConcluirOM.causaRaizIdentificada}
                  onChange={(e) => setFormConcluirOM({ ...formConcluirOM, causaRaizIdentificada: e.target.value })}
                  placeholder="Ex: Desgaste mecânico por contaminação de fluido..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Solução Aplicada:</label>
                <input
                  type="text"
                  value={formConcluirOM.solucaoAplicada}
                  onChange={(e) => setFormConcluirOM({ ...formConcluirOM, solucaoAplicada: e.target.value })}
                  placeholder="Ex: Substituição da vedação e sangria do circuito..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horas Trabalhadas Técnico:</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formConcluirOM.tempoTrabalhoTecnicoHoras}
                    onChange={(e) =>
                      setFormConcluirOM({
                        ...formConcluirOM,
                        tempoTrabalhoTecnicoHoras: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horas Totais Parada (Máquina):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formConcluirOM.tempoParadaHoras}
                    onChange={(e) =>
                      setFormConcluirOM({
                        ...formConcluirOM,
                        tempoParadaHoras: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-[11px] text-emerald-900 font-semibold">
                Ao concluir, a máquina voltará ao status <strong>OPERACIONAL</strong> e a restrição de capacidade no PCP será desbloqueada.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalConcluirOM(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Finalizar OM & Liberar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LANÇAMENTO DE HORÍMETRO */}
      {showModalHorimetro && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" /> Registro de Horímetro
              </h3>
              <button onClick={() => setShowModalHorimetro(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegistrarHorimetro} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Máquina / Equipamento:</label>
                <select
                  value={formHorimetro.ativoId}
                  onChange={(e) => setFormHorimetro({ ...formHorimetro, ativoId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                >
                  {ativos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.tag} ({a.horimetroAtual}h atuais)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nova Leitura (Horas):</label>
                <input
                  type="number"
                  value={formHorimetro.horimetroAtual}
                  onChange={(e) =>
                    setFormHorimetro({ ...formHorimetro, horimetroAtual: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-black text-sm"
                  required
                />
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Se a leitura ultrapassar o gatilho de 500h desde a última revisão, uma OM Preventiva será aberta automaticamente.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalHorimetro(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Salvar Leitura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOVIMENTAR FERRAMENTAL */}
      {showModalMovFerramenta && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" /> Movimentar Ferramental
              </h3>
              <button onClick={() => setShowModalMovFerramenta(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMovimentarFerramenta} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Movimento:</label>
                <select
                  value={formMovFerramenta.tipoMovimento}
                  onChange={(e) =>
                    setFormMovFerramenta({ ...formMovFerramenta, tipoMovimento: e.target.value as any })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                >
                  <option value="CHECKOUT_MONTAGEM">Checkout / Montar em Máquina</option>
                  <option value="CHECKIN_DESMONTAGEM">Checkin / Desmontar para Almoxarifado</option>
                  <option value="ENVIO_AFIACAO">Enviar para Afiação Externa</option>
                  <option value="RETORNO_AFIACAO">Retorno da Afiação (Calibrado)</option>
                  <option value="DESCARTE_SUCATA">Descarte por Fim de Vida Útil</option>
                </select>
              </div>

              {formMovFerramenta.tipoMovimento === 'CHECKOUT_MONTAGEM' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Máquina de Destino:</label>
                  <select
                    value={formMovFerramenta.ativoId}
                    onChange={(e) => setFormMovFerramenta({ ...formMovFerramenta, ativoId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                  >
                    {ativos.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.tag} — {a.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formMovFerramenta.tipoMovimento === 'CHECKIN_DESMONTAGEM' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Golpes Realizados no Setup:</label>
                  <input
                    type="number"
                    value={formMovFerramenta.golpesNoSetup}
                    onChange={(e) =>
                      setFormMovFerramenta({
                        ...formMovFerramenta,
                        golpesNoSetup: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalMovFerramenta(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg shadow-xs"
                >
                  Salvar Movimentação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DIALOG: CADASTRAR NOVO EQUIPAMENTO / ATIVO */}
      {showModalNovoAtivo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-xs">
                  <Factory className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cadastrar Novo Equipamento Industrial</h3>
                  <p className="text-xs text-slate-500">Cadastro de ativo no parque fabril e integração ao PCP / PCM</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModalNovoAtivo(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCadastrarNovoAtivo} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">TAG / Código do Ativo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: LASER-03, DOB-02"
                    value={formNovoAtivo.tag}
                    onChange={(e) => setFormNovoAtivo({ ...formNovoAtivo, tag: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nome do Ativo / Descrição *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Máquina de Corte Laser Fibra 15kW"
                    value={formNovoAtivo.nome}
                    onChange={(e) => setFormNovoAtivo({ ...formNovoAtivo, nome: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-900 focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Equipamento</label>
                  <select
                    value={formNovoAtivo.tipo}
                    onChange={(e) => setFormNovoAtivo({ ...formNovoAtivo, tipo: e.target.value as TipoAtivo })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="CORTE_LASER">Corte a Laser Fibra</option>
                    <option value="DOBRADEIRA_CNC">Dobradeira CNC</option>
                    <option value="PUNCIONADEIRA">Puncionadeira</option>
                    <option value="SOLDA_ROBOTICA">Célula de Solda Robótica</option>
                    <option value="CENTRO_USINAGEM">Centro de Usinagem</option>
                    <option value="PONTE_ROLANTE">Ponte Rolante / Içamento</option>
                    <option value="COMPRESSOR_AR">Compressor de Ar Industrial</option>
                    <option value="CABINE_PINTURA">Cabine de Pintura</option>
                    <option value="GUILHOTINA">Guilhotina Hidráulica</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fabricante / Marca</label>
                  <input
                    type="text"
                    placeholder="Ex: Trumpf, Bodor, Bystronic"
                    value={formNovoAtivo.marca}
                    onChange={(e) => setFormNovoAtivo({ ...formNovoAtivo, marca: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Modelo</label>
                  <input
                    type="text"
                    placeholder="Ex: TruLaser 5030"
                    value={formNovoAtivo.modelo}
                    onChange={(e) => setFormNovoAtivo({ ...formNovoAtivo, modelo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Setor / Localização *</label>
                  <input
                    type="text"
                    required
                    value={formNovoAtivo.localizacaoSetor}
                    onChange={(e) => setFormNovoAtivo({ ...formNovoAtivo, localizacaoSetor: e.target.value })}
                    placeholder="Ex: GALPAO_1_CORTE"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data de Aquisição *</label>
                  <input
                    type="date"
                    required
                    value={formNovoAtivo.dataAquisicao}
                    onChange={(e) => setFormNovoAtivo({ ...formNovoAtivo, dataAquisicao: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Criticidade Fabril</label>
                  <select
                    value={formNovoAtivo.criticidade}
                    onChange={(e) => setFormNovoAtivo({ ...formNovoAtivo, criticidade: e.target.value as 'A' | 'B' | 'C' })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="A">Classe A - Crítico (Gargalo de Produção)</option>
                    <option value="B">Classe B - Médio Impacto</option>
                    <option value="C">Classe C - Baixo Impacto</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Número de Série</label>
                  <input
                    type="text"
                    placeholder="Ex: SN-2024-8891"
                    value={formNovoAtivo.numeroSerie}
                    onChange={(e) => setFormNovoAtivo({ ...formNovoAtivo, numeroSerie: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Custo-Hora Máquina (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formNovoAtivo.custoHoraMaquina}
                    onChange={(e) => setFormNovoAtivo({ ...formNovoAtivo, custoHoraMaquina: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horímetro Inicial (Horas)</label>
                  <input
                    type="number"
                    value={formNovoAtivo.horimetroAtual}
                    onChange={(e) => setFormNovoAtivo({ ...formNovoAtivo, horimetroAtual: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModalNovoAtivo(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Salvar Equipamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
