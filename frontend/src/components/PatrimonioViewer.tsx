// frontend/src/components/PatrimonioViewer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Wrench,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Plus,
  ArrowRight,
  RefreshCw,
  Search,
  Sliders,
  ShieldAlert,
  SlidersHorizontal,
  FileCheck,
  UserX,
  X,
  Eye,
  Check,
  History,
  Archive,
  ArrowLeftRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import {
  AtivoPatrimonial,
  FerramentaControle,
  InstrumentoCalibracao,
  AlertaPatrimonioCalibracao,
  IndicadoresPatrimonioCalibracao,
  CategoriaPatrimonio,
  CondicaoFerramenta,
  MotivoBaixaPatrimonio,
  CategoriaFerramenta,
  TipoInstrumentoCalibracao,
} from '@/backend/modules/patrimonio/patrimonio-types';
import { Empresa } from '@/backend/core/types/company';
import { safeFetchJson } from '../api/safe-fetch';

interface PatrimonioViewerProps {
  empresaAtiva: Empresa;
}

export function PatrimonioViewer({ empresaAtiva }: PatrimonioViewerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'alertas' | 'patrimonio' | 'ferramentas' | 'calibracao'>('alertas');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ tipo: 'success' | 'error' | 'info'; texto: string } | null>(null);

  // Estados dos dados
  const [indicadores, setIndicadores] = useState<IndicadoresPatrimonioCalibracao | null>(null);
  const [ativos, setAtivos] = useState<AtivoPatrimonial[]>([]);
  const [ferramentas, setFerramentas] = useState<FerramentaControle[]>([]);
  const [instrumentos, setInstrumentos] = useState<InstrumentoCalibracao[]>([]);

  // Estados de seleção
  const [ativoSelecionado, setAtivoSelecionado] = useState<AtivoPatrimonial | null>(null);
  const [ferramentaSelecionada, setFerramentaSelecionada] = useState<FerramentaControle | null>(null);
  const [instrumentoSelecionado, setInstrumentoSelecionado] = useState<InstrumentoCalibracao | null>(null);

  // Modais
  const [showModalNovoAtivo, setShowModalNovoAtivo] = useState(false);
  const [showModalTransferirAtivo, setShowModalTransferirAtivo] = useState(false);
  const [showModalBaixarAtivo, setShowModalBaixarAtivo] = useState(false);
  const [showModalNovaFerramenta, setShowModalNovaFerramenta] = useState(false);
  const [showModalMovFerramenta, setShowModalMovFerramenta] = useState(false);
  const [showModalManutFerramenta, setShowModalManutFerramenta] = useState(false);
  const [showModalNovoInstrumento, setShowModalNovoInstrumento] = useState(false);
  const [showModalCalibrar, setShowModalCalibrar] = useState(false);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODOS');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');

  // Forms
  const [formAtivo, setFormAtivo] = useState({
    codigoPatrimonio: '',
    nome: '',
    categoria: 'MAQUINAS_EQUIPAMENTOS' as CategoriaPatrimonio,
    localizacao: '',
    responsavel: '',
    departamento: 'Produção / Chão de Fábrica',
    valorAquisicao: 0,
    dataAquisicao: new Date().toISOString().split('T')[0],
    numeroNotaFiscal: '',
    fornecedor: '',
    numeroSerie: '',
    especificacoesTecnicas: '',
    vidaUtilMeses: 120,
    taxaAnualPercentual: 10,
  });

  const [formTransferir, setFormTransferir] = useState({
    novaLocalizacao: '',
    novoResponsavel: '',
    novoDepartamento: '',
    motivoTransferencia: '',
    usuarioResponsavel: 'Gestor Patrimonial',
  });

  const [formBaixa, setFormBaixa] = useState({
    dataBaixa: new Date().toISOString().split('T')[0],
    motivo: 'OBSOLESCENCIA_TECNOLOGICA' as MotivoBaixaPatrimonio,
    justificativa: '',
    responsavelBaixa: 'Comitê de Auditoria Interna',
    valorRecuperadoVendaOuSucata: 0,
    documentoReferencia: '',
  });

  const [formFerramenta, setFormFerramenta] = useState({
    codigo: '',
    nome: '',
    categoria: 'PUNCAO_MATRIZ_DOBRA' as CategoriaFerramenta,
    localizacao: 'Armário Ferramentaria Gaveta A1',
    responsavel: 'Marcio Silva (Ferramenteiro)',
    condicao: 'EXCELENTE' as CondicaoFerramenta,
    ciclosUsoAtual: 0,
    limiteCiclosAfiacao: 50000,
    motivoCondicaoInadequada: '',
  });

  const [formMovFerramenta, setFormMovFerramenta] = useState({
    tipo: 'CHECKOUT_CHAO_FABRICA' as const,
    maquinaOuSetorDestino: 'Dobradeira CNC Trumpf 01',
    responsavelRetirada: 'Operador Turno',
    condicaoNoMomento: 'EXCELENTE' as CondicaoFerramenta,
    ciclosAdicionados: 500,
    observacoes: '',
  });

  const [formManutFerramenta, setFormManutFerramenta] = useState({
    tipo: 'AFIACAO' as const,
    descricao: 'Retífica de precisão e afiação da aresta de corte',
    responsavel: 'Oficina de Ferramentaria Especializada',
    custo: 350.0,
    zerarCiclosAposAfiacao: true,
  });

  const [formInstrumento, setFormInstrumento] = useState({
    codigoInstrumento: '',
    nomeInstrumento: '',
    tipoInstrumento: 'PAQUIMETRO' as TipoInstrumentoCalibracao,
    localizacao: 'Controle de Qualidade',
    responsavel: 'Juliana Paes (Qualidade)',
    faixaMedicao: '0 - 150 mm (Resolução: 0.01 mm)',
    toleranciaAdmissivel: '± 0.02 mm',
    frequenciaMeses: 12,
    dataUltimaCalibracao: new Date().toISOString().split('T')[0],
    numeroCertificado: 'CERT-RBC-2026-',
    laboratorioCalibrador: 'Laboratório Metrológico RBC/Inmetro',
    resultadoInicial: 'APROVADO' as const,
  });

  const [formCalibrar, setFormCalibrar] = useState({
    dataCalibracao: new Date().toISOString().split('T')[0],
    numeroCertificado: '',
    laboratorioRbc: 'Laboratório RBC Acreditado CGCRE',
    resultado: 'APROVADO' as const,
    erroMaximoEncontrado: '+0.004 mm',
    incertezaMedicao: '0.003 mm (k=2)',
    responsavelHomologacao: 'Juliana Paes',
    observacoes: 'Calibrado conforme procedimento padrão RBC.',
  });

  // Carregar dados
  const carregarDados = async () => {
    setLoading(true);
    try {
      const res = await safeFetchJson<{
        indicadores: IndicadoresPatrimonioCalibracao;
        ativos: AtivoPatrimonial[];
        ferramentas: FerramentaControle[];
        instrumentos: InstrumentoCalibracao[];
      }>(`/api/v1/patrimonio?empresaId=${empresaAtiva.id}`);

      if (res.success && res.data) {
        if (res.data.indicadores) setIndicadores(res.data.indicadores);
        setAtivos(res.data.ativos || []);
        setFerramentas(res.data.ferramentas || []);
        setInstrumentos(res.data.instrumentos || []);

        if (res.data.ativos?.length > 0 && !ativoSelecionado) {
          setAtivoSelecionado(res.data.ativos[0]);
        }
        if (res.data.ferramentas?.length > 0 && !ferramentaSelecionada) {
          setFerramentaSelecionada(res.data.ferramentas[0]);
        }
        if (res.data.instrumentos?.length > 0 && !instrumentoSelecionado) {
          setInstrumentoSelecionado(res.data.instrumentos[0]);
        }
      } else if (res.error) {
        setFeedback({ tipo: 'error', texto: res.error });
      }
    } catch (e: any) {
      setFeedback({ tipo: 'error', texto: `Erro ao carregar dados: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      try {
        const res = await safeFetchJson<{
          indicadores: IndicadoresPatrimonioCalibracao;
          ativos: AtivoPatrimonial[];
          ferramentas: FerramentaControle[];
          instrumentos: InstrumentoCalibracao[];
        }>(`/api/v1/patrimonio?empresaId=${empresaAtiva.id}`);

        if (!ignore && res.success && res.data) {
          if (res.data.indicadores) setIndicadores(res.data.indicadores);
          setAtivos(res.data.ativos || []);
          setFerramentas(res.data.ferramentas || []);
          setInstrumentos(res.data.instrumentos || []);
          if (res.data.ativos?.length > 0) setAtivoSelecionado((prev) => prev || res.data!.ativos[0]);
          if (res.data.ferramentas?.length > 0) setFerramentaSelecionada((prev) => prev || res.data!.ferramentas[0]);
          if (res.data.instrumentos?.length > 0) setInstrumentoSelecionado((prev) => prev || res.data!.instrumentos[0]);
        } else if (!ignore && res.error) {
          // Silent fallback or non-disruptive feedback
        }
      } catch (e: any) {
        if (!ignore) setFeedback({ tipo: 'error', texto: e.message });
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [empresaAtiva.id]);

  const handleApiAction = async (acao: string, payload: any, successMsg: string, closeModal?: () => void) => {
    try {
      const res = await safeFetchJson('/api/v1/patrimonio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao, empresaId: empresaAtiva.id, payload }),
      });
      if (res.success) {
        setFeedback({ tipo: 'success', texto: successMsg });
        if (closeModal) closeModal();
        carregarDados();
      } else {
        setFeedback({ tipo: 'error', texto: res.error || 'Erro na operação.' });
      }
    } catch (e: any) {
      setFeedback({ tipo: 'error', texto: e.message });
    }
  };

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
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-xs font-semibold">{feedback.texto}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Principal */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Gestão de Patrimônio, Ferramentas & Calibração</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                Ativos & Metrologia
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Controle patrimonial com histórico e baixas, rastreabilidade de ferramental e metrologia com certificados RBC.
            </p>
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
          {activeSubTab === 'patrimonio' && (
            <button
              onClick={() => {
                setFormAtivo({
                  codigoPatrimonio: `PAT-TRI-${String(ativos.length + 105).padStart(5, '0')}`,
                  nome: '',
                  categoria: 'MAQUINAS_EQUIPAMENTOS',
                  localizacao: 'Galpão 1 - Produção',
                  responsavel: '',
                  departamento: 'Usinagem CNC',
                  valorAquisicao: 150000,
                  dataAquisicao: new Date().toISOString().split('T')[0],
                  numeroNotaFiscal: 'NF-e ',
                  fornecedor: '',
                  numeroSerie: '',
                  especificacoesTecnicas: '',
                  vidaUtilMeses: 120,
                  taxaAnualPercentual: 10,
                });
                setShowModalNovoAtivo(true);
              }}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Ativo Patrimonial
            </button>
          )}
          {activeSubTab === 'ferramentas' && (
            <button
              onClick={() => {
                setFormFerramenta({
                  codigo: `FER-MAT-${String(ferramentas.length + 10).padStart(3, '0')}`,
                  nome: '',
                  categoria: 'PUNCAO_MATRIZ_DOBRA',
                  localizacao: 'Armário Ferramentaria Gaveta A2',
                  responsavel: 'Marcio Silva (Ferramenteiro)',
                  condicao: 'EXCELENTE',
                  ciclosUsoAtual: 0,
                  limiteCiclosAfiacao: 50000,
                  motivoCondicaoInadequada: '',
                });
                setShowModalNovaFerramenta(true);
              }}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Ferramenta
            </button>
          )}
          {activeSubTab === 'calibracao' && (
            <button
              onClick={() => {
                setFormInstrumento({
                  codigoInstrumento: `CAL-INST-${String(instrumentos.length + 15).padStart(3, '0')}`,
                  nomeInstrumento: '',
                  tipoInstrumento: 'PAQUIMETRO',
                  localizacao: 'Sala Limpa / Metrologia',
                  responsavel: 'Juliana Paes (Qualidade)',
                  faixaMedicao: '0 - 150 mm (0.01 mm)',
                  toleranciaAdmissivel: '± 0.02 mm',
                  frequenciaMeses: 12,
                  dataUltimaCalibracao: new Date().toISOString().split('T')[0],
                  numeroCertificado: `CERT-RBC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                  laboratorioCalibrador: 'Laboratório Metrológico RBC/Inmetro',
                  resultadoInicial: 'APROVADO',
                });
                setShowModalNovoInstrumento(true);
              }}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Instrumento de Medição
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="border-b border-slate-200 bg-white px-4 rounded-xl shadow-xs">
        <div className="flex overflow-x-auto gap-2 py-2">
          {[
            {
              id: 'alertas',
              label: 'Alertas & Auditoria Metrológica',
              icon: ShieldAlert,
              badge: indicadores?.alertasAtivos.length,
              badgeColor: 'bg-rose-500 text-white',
            },
            {
              id: 'patrimonio',
              label: 'Patrimônio & Ativos Fixos',
              icon: Building2,
              badge: ativos.length,
            },
            {
              id: 'ferramentas',
              label: 'Controle de Ferramentas & Matrizes',
              icon: Wrench,
              badge: ferramentas.length,
            },
            {
              id: 'calibracao',
              label: 'Calibração & Instrumentos (RBC)',
              icon: Gauge,
              badge: instrumentos.length,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      tab.badgeColor ? tab.badgeColor : isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
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

      {/* 1. ABA: PAINEL DE ALERTAS & KPIS */}
      {activeSubTab === 'alertas' && indicadores && (
        <div className="space-y-6">
          {/* Métricas Topo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Valor Imobilizado Ativo</span>
                <DollarSign className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                R$ {indicadores.valorTotalImobilizado.toLocaleString('pt-BR')}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">
                {indicadores.totalAtivosAtivos} ativos em operação ({indicadores.totalAtivosBaixados} baixados)
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Conformidade Metrológica</span>
                <Gauge className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {indicadores.indiceConformidadeMetrologicaPercentual}%
              </div>
              <div className="text-[11px] text-teal-600 font-semibold mt-1">
                {indicadores.instrumentosCalibradosEmDia} calibrados | {indicadores.instrumentosVencidosOuBloqueados} vencidos/bloqueados
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Ferramental em Operação</span>
                <Wrench className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{indicadores.totalFerramentasEmOperacao}</div>
              <div className="text-[11px] text-orange-600 font-semibold mt-1">
                {indicadores.totalFerramentasInadequadas} inadequadas | {indicadores.totalFerramentasAguardandoAfiacao} necessitam afiação
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Ativos sem Responsável</span>
                <UserX className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-600">{indicadores.totalAtivosSemResponsavel}</div>
              <div className="text-[11px] text-rose-700 font-semibold mt-1">Pendência de custódia patrimonial</div>
            </div>
          </div>

          {/* Lista de Alertas Inteligentes */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Painel de Alertas Automatizados ({indicadores.alertasAtivos.length})
                </h3>
              </div>
              <span className="text-xs text-slate-500">Monitoramento Contínuo de Risco Fabril</span>
            </div>

            {indicadores.alertasAtivos.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                Nenhum alerta crítico ativo. Todos os instrumentos estão calibrados, ferramentas em conformidade e ativos com responsáveis atribuídos.
              </div>
            ) : (
              <div className="space-y-3">
                {indicadores.alertasAtivos.map((alerta) => (
                  <div
                    key={alerta.id}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                      alerta.gravidade === 'CRITICA'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : alerta.gravidade === 'ALTA'
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-blue-50 border-blue-200 text-blue-900'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                            alerta.gravidade === 'CRITICA'
                              ? 'bg-rose-600 text-white'
                              : alerta.gravidade === 'ALTA'
                              ? 'bg-amber-500 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {alerta.tipo.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-bold">{alerta.titulo}</span>
                      </div>
                      <p className="text-xs text-slate-700">{alerta.descricao}</p>
                      <div className="text-[11px] font-semibold text-slate-900 flex items-center gap-1.5 mt-1">
                        <Info className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ação Recomendada: {alerta.acaoRecomendada}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {alerta.tipo.includes('CALIBRACAO') && (
                        <button
                          onClick={() => {
                            const inst = instrumentos.find((i) => i.id === alerta.referenciaId);
                            if (inst) setInstrumentoSelecionado(inst);
                            setActiveSubTab('calibracao');
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold flex items-center gap-1"
                        >
                          Ver Instrumento <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      {alerta.tipo.includes('FERRAMENTA') && (
                        <button
                          onClick={() => {
                            const fer = ferramentas.find((f) => f.id === alerta.referenciaId);
                            if (fer) setFerramentaSelecionada(fer);
                            setActiveSubTab('ferramentas');
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold flex items-center gap-1"
                        >
                          Ver Ferramenta <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      {alerta.tipo.includes('ATIVO') && (
                        <button
                          onClick={() => {
                            const atv = ativos.find((a) => a.id === alerta.referenciaId);
                            if (atv) setAtivoSelecionado(atv);
                            setActiveSubTab('patrimonio');
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold flex items-center gap-1"
                        >
                          Atribuir Responsável <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ABA: PATRIMÔNIO */}
      {activeSubTab === 'patrimonio' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Filtros */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por código, nome, local ou responsável..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium"
                >
                  <option value="TODOS">Todos Status</option>
                  <option value="ATIVO">Ativo</option>
                  <option value="EM_MANUTENCAO">Em Manutenção</option>
                  <option value="BAIXADO">Baixado</option>
                </select>
              </div>
            </div>

            {/* Lista Cards */}
            <div className="space-y-3">
              {ativos
                .filter((a) => {
                  const matchBusca =
                    a.codigoPatrimonio.toLowerCase().includes(busca.toLowerCase()) ||
                    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
                    a.localizacao.toLowerCase().includes(busca.toLowerCase()) ||
                    (a.responsavel && a.responsavel.toLowerCase().includes(busca.toLowerCase()));
                  const matchStatus = filtroStatus === 'TODOS' || a.status === filtroStatus;
                  return matchBusca && matchStatus;
                })
                .map((atv) => {
                  const isSelected = ativoSelecionado?.id === atv.id;
                  return (
                    <div
                      key={atv.id}
                      onClick={() => setAtivoSelecionado(atv)}
                      className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
                        isSelected ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">{atv.codigoPatrimonio}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {atv.categoria.replace(/_/g, ' ')}
                            </span>
                            {!atv.responsavel && atv.status !== 'BAIXADO' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 flex items-center gap-1">
                                <UserX className="w-3 h-3" /> Sem Responsável
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-semibold text-slate-800">{atv.nome}</h4>
                          <p className="text-[11px] text-slate-500">
                            Local: <span className="font-medium text-slate-700">{atv.localizacao}</span> | Responsável:{' '}
                            <span className="font-medium text-slate-700">{atv.responsavel || 'NÃO ATRIBUÍDO'}</span>
                          </p>
                        </div>

                        <div className="text-right space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              atv.status === 'ATIVO'
                                ? 'bg-emerald-100 text-emerald-800'
                                : atv.status === 'BAIXADO'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {atv.status}
                          </span>
                          <div className="text-xs font-bold text-slate-900">
                            R$ {atv.valorAquisicao.toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Detalhes do Ativo */}
          <div className="space-y-4">
            {ativoSelecionado ? (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Ficha Patrimonial
                    </span>
                    <h3 className="text-base font-black text-slate-900">{ativoSelecionado.codigoPatrimonio}</h3>
                    <p className="text-xs text-slate-600">{ativoSelecionado.nome}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ativoSelecionado.status === 'ATIVO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {ativoSelecionado.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Empresa Proprietária:</span>
                    <span className="font-bold text-slate-800">{ativoSelecionado.empresaNome}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Data Aquisição:</span>
                    <span className="font-bold text-slate-800">{ativoSelecionado.dataAquisicao}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Localização Atual:</span>
                    <span className="font-bold text-slate-800">{ativoSelecionado.localizacao}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Responsável Custodiante:</span>
                    <span className={`font-bold ${ativoSelecionado.responsavel ? 'text-slate-800' : 'text-rose-600'}`}>
                      {ativoSelecionado.responsavel || 'SEM RESPONSÁVEL'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Nota Fiscal / Fornecedor:</span>
                    <span className="font-medium text-slate-700">
                      {ativoSelecionado.numeroNotaFiscal} ({ativoSelecionado.fornecedor})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Valor Aquisição:</span>
                    <span className="font-bold text-slate-900">
                      R$ {ativoSelecionado.valorAquisicao.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Estrutura de Depreciação Futura */}
                <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-indigo-900 font-bold text-[11px]">
                    <span className="flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" /> Estrutura Contábil / Depreciação Projetada
                    </span>
                    <span className="text-[10px] bg-indigo-200 px-1.5 py-0.5 rounded text-indigo-900">
                      Futura Integração
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                    <div>
                      Vida Útil: <span className="font-bold">{ativoSelecionado.estruturaDepreciacaoFutura.vidaUtilMeses} meses</span>
                    </div>
                    <div>
                      Taxa Anual: <span className="font-bold">{ativoSelecionado.estruturaDepreciacaoFutura.taxaAnualPercentual}% a.a.</span>
                    </div>
                    <div>
                      Deprec. Acumulada: <span className="font-bold">R$ {ativoSelecionado.estruturaDepreciacaoFutura.depreciacaoAcumuladaEstimada.toLocaleString('pt-BR')}</span>
                    </div>
                    <div>
                      Valor Contábil: <span className="font-bold">R$ {ativoSelecionado.estruturaDepreciacaoFutura.valorContabilProjetado.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-indigo-700 italic">
                    {ativoSelecionado.estruturaDepreciacaoFutura.observacaoIntegracao}
                  </p>
                </div>

                {/* Dados da Baixa (se houver) */}
                {ativoSelecionado.baixa && (
                  <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-rose-900 flex items-center gap-1.5">
                      <Archive className="w-3.5 h-3.5 text-rose-600" />
                      Baixa Patrimonial Efetivada ({ativoSelecionado.baixa.dataBaixa})
                    </div>
                    <p className="text-slate-700">
                      Motivo: <span className="font-bold">{ativoSelecionado.baixa.motivo}</span>
                    </p>
                    <p className="text-slate-700 italic">{ativoSelecionado.baixa.justificativa}</p>
                    <div className="text-[11px] text-rose-800 font-semibold">
                      Valor Recuperado: R$ {(ativoSelecionado.baixa.valorRecuperadoVendaOuSucata || 0).toLocaleString('pt-BR')} | Aprovador: {ativoSelecionado.baixa.responsavelBaixa}
                    </div>
                  </div>
                )}

                {/* Histórico de Eventos */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    Histórico de Movimentações ({ativoSelecionado.historico.length})
                  </span>
                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto text-xs">
                    {ativoSelecionado.historico.map((h) => (
                      <div key={h.id} className="py-2 space-y-0.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-bold text-slate-800">{h.tipo}</span>
                          <span className="text-slate-400">{h.data}</span>
                        </div>
                        <p className="text-slate-600">{h.descricao}</p>
                        <span className="text-[10px] text-slate-400 block">Registrado por: {h.usuario}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ações */}
                {ativoSelecionado.status !== 'BAIXADO' && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setFormTransferir({
                          novaLocalizacao: ativoSelecionado.localizacao,
                          novoResponsavel: ativoSelecionado.responsavel || '',
                          novoDepartamento: ativoSelecionado.departamento,
                          motivoTransferencia: '',
                          usuarioResponsavel: 'Gestor Patrimonial',
                        });
                        setShowModalTransferirAtivo(true);
                      }}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" /> Transferir / Trocar Resp.
                    </button>
                    <button
                      onClick={() => {
                        setFormBaixa({
                          dataBaixa: new Date().toISOString().split('T')[0],
                          motivo: 'OBSOLESCENCIA_TECNOLOGICA',
                          justificativa: '',
                          responsavelBaixa: 'Auditoria de Patrimônio',
                          valorRecuperadoVendaOuSucata: 0,
                          documentoReferencia: '',
                        });
                        setShowModalBaixarAtivo(true);
                      }}
                      className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Archive className="w-3.5 h-3.5" /> Baixar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                Selecione um ativo para visualizar detalhes e histórico.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. ABA: FERRAMENTAS & MATRIZES */}
      {activeSubTab === 'ferramentas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-3">
              {ferramentas.map((fer) => {
                const isSelected = ferramentaSelecionada?.id === fer.id;
                const isInadequada = fer.condicao === 'INADEQUADA_AVARIADA' || fer.necessitaManutencaoOuAfiacao;
                return (
                  <div
                    key={fer.id}
                    onClick={() => setFerramentaSelecionada(fer)}
                    className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
                      isSelected
                        ? 'border-orange-600 ring-2 ring-orange-100'
                        : isInadequada
                        ? 'border-rose-300 ring-1 ring-rose-100'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{fer.codigo}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              fer.condicao === 'EXCELENTE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : fer.condicao === 'BOA'
                                ? 'bg-blue-100 text-blue-800'
                                : fer.condicao === 'DESGASTADA'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {fer.condicao}
                          </span>
                          {isInadequada && (
                            <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Condição Inadequada
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-semibold text-slate-800">{fer.nome}</h4>
                        <p className="text-[11px] text-slate-500">
                          Local: {fer.localizacao} | Responsável: {fer.responsavel}
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="text-xs font-bold text-slate-900">
                          {fer.ciclosUsoAtual.toLocaleString('pt-BR')} / {fer.limiteCiclosAfiacao.toLocaleString('pt-BR')} ciclos
                        </div>
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden ml-auto">
                          <div
                            className={`h-full ${
                              fer.ciclosUsoAtual >= fer.limiteCiclosAfiacao ? 'bg-rose-600' : 'bg-orange-600'
                            }`}
                            style={{
                              width: `${Math.min(100, (fer.ciclosUsoAtual / fer.limiteCiclosAfiacao) * 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detalhes da Ferramenta */}
          <div className="space-y-4">
            {ferramentaSelecionada ? (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                      Ficha da Ferramenta
                    </span>
                    <h3 className="text-base font-black text-slate-900">{ferramentaSelecionada.codigo}</h3>
                    <p className="text-xs text-slate-600">{ferramentaSelecionada.nome}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Localização:</span>
                      <span className="font-bold text-slate-800">{ferramentaSelecionada.localizacao}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Responsável:</span>
                      <span className="font-bold text-slate-800">{ferramentaSelecionada.responsavel}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Ciclos Acumulados:</span>
                      <span className="font-bold text-slate-900">
                        {ferramentaSelecionada.ciclosUsoAtual.toLocaleString('pt-BR')} ciclos
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Limite para Afiação:</span>
                      <span className="font-bold text-slate-900">
                        {ferramentaSelecionada.limiteCiclosAfiacao.toLocaleString('pt-BR')} ciclos
                      </span>
                    </div>
                  </div>

                  {ferramentaSelecionada.motivoCondicaoInadequada && (
                    <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-lg text-rose-900 text-xs">
                      <span className="font-bold block">Diagnóstico de Avaria:</span>
                      {ferramentaSelecionada.motivoCondicaoInadequada}
                    </div>
                  )}

                  {/* Movimentações Recentes */}
                  <div className="space-y-1.5 pt-2">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                      <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" /> Movimentações / Checkout ({ferramentaSelecionada.movimentacoes.length})
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {ferramentaSelecionada.movimentacoes.map((m) => (
                        <div key={m.id} className="bg-slate-50 p-2 rounded text-[11px]">
                          <div className="flex justify-between font-semibold">
                            <span>{m.tipo}</span>
                            <span className="text-slate-400">{m.data}</span>
                          </div>
                          <div className="text-slate-600">Destino: {m.maquinaOuSetorDestino} | Resp: {m.responsavelRetirada}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ações de Ferramenta */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => setShowModalMovFerramenta(true)}
                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" /> Movimentar
                    </button>
                    <button
                      onClick={() => setShowModalManutFerramenta(true)}
                      className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Wrench className="w-3.5 h-3.5" /> Afiar / Manutenção
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* 4. ABA: CALIBRAÇÃO & METROLOGIA */}
      {activeSubTab === 'calibracao' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-3">
              {instrumentos.map((inst) => {
                const isSelected = instrumentoSelecionado?.id === inst.id;
                const isVencido = inst.status === 'VENCIDO' || inst.bloqueadoParaUso;
                const isProximo = inst.status === 'PROXIMO_VENCER';

                return (
                  <div
                    key={inst.id}
                    onClick={() => setInstrumentoSelecionado(inst)}
                    className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
                      isSelected
                        ? 'border-teal-600 ring-2 ring-teal-100'
                        : isVencido
                        ? 'border-rose-300 ring-1 ring-rose-100'
                        : isProximo
                        ? 'border-amber-300'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{inst.codigoInstrumento}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {inst.tipoInstrumento}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              inst.status === 'CALIBRADO'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inst.status === 'PROXIMO_VENCER'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {inst.status.replace(/_/g, ' ')}
                          </span>
                          {inst.bloqueadoParaUso && (
                            <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" /> Bloqueado para Uso
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-semibold text-slate-800">{inst.nomeInstrumento}</h4>
                        <p className="text-[11px] text-slate-500">
                          Faixa: {inst.faixaMedicao} | Tol: {inst.toleranciaAdmissivel} | Resp: {inst.responsavel}
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="text-[11px] text-slate-400">Próxima Calibração:</div>
                        <div className="text-xs font-bold text-slate-900">{inst.dataProximaCalibracao}</div>
                        <span
                          className={`text-[10px] font-bold block ${
                            inst.diasParaVencer < 0
                              ? 'text-rose-600'
                              : inst.diasParaVencer <= 30
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {inst.diasParaVencer < 0
                            ? `Vencido há ${Math.abs(inst.diasParaVencer)} dias`
                            : `Vence em ${inst.diasParaVencer} dias`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detalhes da Calibração */}
          <div className="space-y-4">
            {instrumentoSelecionado ? (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                      Ficha Metrológica
                    </span>
                    <h3 className="text-base font-black text-slate-900">{instrumentoSelecionado.codigoInstrumento}</h3>
                    <p className="text-xs text-slate-600">{instrumentoSelecionado.nomeInstrumento}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      instrumentoSelecionado.status === 'CALIBRADO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {instrumentoSelecionado.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Última Calibração:</span>
                      <span className="font-bold text-slate-800">{instrumentoSelecionado.dataUltimaCalibracao}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Próxima Calibração:</span>
                      <span className="font-bold text-slate-800">{instrumentoSelecionado.dataProximaCalibracao}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Certificado Atual:</span>
                      <span className="font-bold text-teal-700">{instrumentoSelecionado.numeroCertificado}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Laboratório RBC:</span>
                      <span className="font-medium text-slate-800">{instrumentoSelecionado.laboratorioCalibrador}</span>
                    </div>
                  </div>
                </div>

                {/* Histórico de Calibrações */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                    Histórico de Certificados RBC ({instrumentoSelecionado.historicoCalibracoes.length})
                  </span>
                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto text-xs">
                    {instrumentoSelecionado.historicoCalibracoes.map((c) => (
                      <div key={c.id} className="py-2 space-y-0.5">
                        <div className="flex justify-between font-bold">
                          <span className="text-teal-700">{c.numeroCertificado}</span>
                          <span className="text-slate-400 text-[11px]">{c.dataCalibracao}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          {c.laboratorioRbc} | Resultado: <span className="font-bold">{c.resultado}</span>
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Erro Máx: {c.erroMaximoEncontrado} | Incerteza: {c.incertezaMedicao}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setFormCalibrar({
                        dataCalibracao: new Date().toISOString().split('T')[0],
                        numeroCertificado: `CERT-RBC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                        laboratorioRbc: 'Laboratório Metrológico Acreditado CGCRE',
                        resultado: 'APROVADO',
                        erroMaximoEncontrado: '+0.003 mm',
                        incertezaMedicao: '0.002 mm (k=2)',
                        responsavelHomologacao: instrumentoSelecionado.responsavel,
                        observacoes: 'Homologado sem desvios.',
                      });
                      setShowModalCalibrar(true);
                    }}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <FileCheck className="w-3.5 h-3.5" /> Registrar Nova Calibração (Certificado RBC)
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* MODAL: NOVO ATIVO PATRIMONIAL */}
      {showModalNovoAtivo && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Cadastrar Novo Ativo Patrimonial</h3>
              <button onClick={() => setShowModalNovoAtivo(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApiAction(
                  'cadastrar_ativo',
                  { ...formAtivo, usuarioCriador: 'Gestor Patrimonial' },
                  'Ativo cadastrado com sucesso!',
                  () => setShowModalNovoAtivo(false)
                );
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Código Patrimônio</label>
                  <input
                    type="text"
                    required
                    value={formAtivo.codigoPatrimonio}
                    onChange={(e) => setFormAtivo({ ...formAtivo, codigoPatrimonio: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Categoria</label>
                  <select
                    value={formAtivo.categoria}
                    onChange={(e) => setFormAtivo({ ...formAtivo, categoria: e.target.value as any })}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  >
                    <option value="MAQUINAS_EQUIPAMENTOS">Máquinas & Equipamentos</option>
                    <option value="FERRAMENTAL_MATRIZES">Ferramental & Matrizes</option>
                    <option value="INSTRUMENTOS_MEDICAO">Instrumentos de Medição</option>
                    <option value="VEICULOS_LOGISTICA">Veículos & Logística</option>
                    <option value="TI_INFRAESTRUTURA">TI & Infraestrutura</option>
                    <option value="MOVEIS_UTENSILIOS">Móveis & Utensílios</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nome do Ativo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Torno CNC Romi Centur 30D"
                  value={formAtivo.nome}
                  onChange={(e) => setFormAtivo({ ...formAtivo, nome: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Localização</label>
                  <input
                    type="text"
                    required
                    placeholder="Galpão 1 - Setor de Usinagem"
                    value={formAtivo.localizacao}
                    onChange={(e) => setFormAtivo({ ...formAtivo, localizacao: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Responsável Custodiante</label>
                  <input
                    type="text"
                    placeholder="Deixe em branco para testar alerta"
                    value={formAtivo.responsavel}
                    onChange={(e) => setFormAtivo({ ...formAtivo, responsavel: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Valor Aquisição (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formAtivo.valorAquisicao}
                    onChange={(e) => setFormAtivo({ ...formAtivo, valorAquisicao: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Data Aquisição</label>
                  <input
                    type="date"
                    required
                    value={formAtivo.dataAquisicao}
                    onChange={(e) => setFormAtivo({ ...formAtivo, dataAquisicao: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nota Fiscal</label>
                  <input
                    type="text"
                    value={formAtivo.numeroNotaFiscal}
                    onChange={(e) => setFormAtivo({ ...formAtivo, numeroNotaFiscal: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModalNovoAtivo(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  Cadastrar Ativo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFERÊNCIA / RESPONSÁVEL */}
      {showModalTransferirAtivo && ativoSelecionado && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900">Transferência / Alteração de Custódia</h3>
              <button onClick={() => setShowModalTransferirAtivo(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApiAction(
                  'transferir_ativo',
                  { id: ativoSelecionado.id, ...formTransferir },
                  'Transferência registrada no histórico patrimonial!',
                  () => setShowModalTransferirAtivo(false)
                );
              }}
              className="space-y-3"
            >
              <div>
                <label className="font-semibold block mb-1">Nova Localização</label>
                <input
                  type="text"
                  value={formTransferir.novaLocalizacao}
                  onChange={(e) => setFormTransferir({ ...formTransferir, novaLocalizacao: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Novo Responsável</label>
                <input
                  type="text"
                  value={formTransferir.novoResponsavel}
                  onChange={(e) => setFormTransferir({ ...formTransferir, novoResponsavel: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Motivo / Justificativa</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex: Realocação para atendimento ao aumento de demanda na célula 2..."
                  value={formTransferir.motivoTransferencia}
                  onChange={(e) => setFormTransferir({ ...formTransferir, motivoTransferencia: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModalTransferirAtivo(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  Salvar Transferência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BAIXA PATRIMONIAL */}
      {showModalBaixarAtivo && ativoSelecionado && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-rose-900 flex items-center gap-1.5">
                <Archive className="w-4 h-4 text-rose-600" /> Registrar Baixa Patrimonial
              </h3>
              <button onClick={() => setShowModalBaixarAtivo(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApiAction(
                  'baixar_ativo',
                  { id: ativoSelecionado.id, ...formBaixa },
                  'Baixa patrimonial efetuada com sucesso!',
                  () => setShowModalBaixarAtivo(false)
                );
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Data da Baixa</label>
                  <input
                    type="date"
                    required
                    value={formBaixa.dataBaixa}
                    onChange={(e) => setFormBaixa({ ...formBaixa, dataBaixa: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Motivo</label>
                  <select
                    value={formBaixa.motivo}
                    onChange={(e) => setFormBaixa({ ...formBaixa, motivo: e.target.value as any })}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  >
                    <option value="OBSOLESCENCIA_TECNOLOGICA">Obsolescência Tecnológica</option>
                    <option value="AVARIA_IRREPARAVEL">Avaria Irreparável</option>
                    <option value="SUCATA">Venda como Sucata</option>
                    <option value="VENDA">Venda do Ativo Usado</option>
                    <option value="FURTO_EXTRAVIO">Furto / Extravio</option>
                    <option value="DOACAO">Doação</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Valor Recuperado / Venda (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formBaixa.valorRecuperadoVendaOuSucata}
                  onChange={(e) => setFormBaixa({ ...formBaixa, valorRecuperadoVendaOuSucata: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Justificativa / Laudo Técnico</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Justifique o motivo do encerramento da vida útil do bem..."
                  value={formBaixa.justificativa}
                  onChange={(e) => setFormBaixa({ ...formBaixa, justificativa: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModalBaixarAtivo(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold"
                >
                  Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR NOVA CALIBRAÇÃO (CERTIFICADO RBC) */}
      {showModalCalibrar && instrumentoSelecionado && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-teal-900 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-teal-600" /> Homologar Certificado RBC ({instrumentoSelecionado.codigoInstrumento})
              </h3>
              <button onClick={() => setShowModalCalibrar(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApiAction(
                  'registrar_calibracao',
                  { id: instrumentoSelecionado.id, ...formCalibrar },
                  'Calibração homologada e instrumento liberado para uso!',
                  () => setShowModalCalibrar(false)
                );
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Data da Calibração</label>
                  <input
                    type="date"
                    required
                    value={formCalibrar.dataCalibracao}
                    onChange={(e) => setFormCalibrar({ ...formCalibrar, dataCalibracao: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Resultado</label>
                  <select
                    value={formCalibrar.resultado}
                    onChange={(e) => setFormCalibrar({ ...formCalibrar, resultado: e.target.value as any })}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  >
                    <option value="APROVADO">Aprovado</option>
                    <option value="APROVADO_COM_RESTRICAO">Aprovado c/ Restrição</option>
                    <option value="REPROVADO">Reprovado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Número do Certificado RBC</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: CERT-RBC-2026-8890"
                  value={formCalibrar.numeroCertificado}
                  onChange={(e) => setFormCalibrar({ ...formCalibrar, numeroCertificado: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Laboratório Calibrador RBC</label>
                <input
                  type="text"
                  required
                  value={formCalibrar.laboratorioRbc}
                  onChange={(e) => setFormCalibrar({ ...formCalibrar, laboratorioRbc: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Erro Máximo Encontrado</label>
                  <input
                    type="text"
                    value={formCalibrar.erroMaximoEncontrado}
                    onChange={(e) => setFormCalibrar({ ...formCalibrar, erroMaximoEncontrado: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Incerteza de Medição</label>
                  <input
                    type="text"
                    value={formCalibrar.incertezaMedicao}
                    onChange={(e) => setFormCalibrar({ ...formCalibrar, incertezaMedicao: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModalCalibrar(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold"
                >
                  Homologar Calibração
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOVIMENTAÇÃO DE FERRAMENTA */}
      {showModalMovFerramenta && ferramentaSelecionada && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900">Movimentar Ferramenta ({ferramentaSelecionada.codigo})</h3>
              <button onClick={() => setShowModalMovFerramenta(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApiAction(
                  'movimentar_ferramenta',
                  { id: ferramentaSelecionada.id, ...formMovFerramenta },
                  'Movimentação registrada com sucesso!',
                  () => setShowModalMovFerramenta(false)
                );
              }}
              className="space-y-3"
            >
              <div>
                <label className="font-semibold block mb-1">Tipo de Movimento</label>
                <select
                  value={formMovFerramenta.tipo}
                  onChange={(e) => setFormMovFerramenta({ ...formMovFerramenta, tipo: e.target.value as any })}
                  className="w-full p-2 border rounded-lg bg-slate-50"
                >
                  <option value="CHECKOUT_CHAO_FABRICA">Checkout para Máquina / Setup</option>
                  <option value="CHECKIN_DEVOLUCAO">Checkin / Devolução para Ferramentaria</option>
                  <option value="ENVIO_AFIACAO">Envio para Afiação Externa</option>
                  <option value="TRANSFERENCIA_SETOR">Transferência de Setor</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Destino (Máquina ou Setor)</label>
                <input
                  type="text"
                  required
                  value={formMovFerramenta.maquinaOuSetorDestino}
                  onChange={(e) => setFormMovFerramenta({ ...formMovFerramenta, maquinaOuSetorDestino: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Responsável Retirada</label>
                  <input
                    type="text"
                    required
                    value={formMovFerramenta.responsavelRetirada}
                    onChange={(e) => setFormMovFerramenta({ ...formMovFerramenta, responsavelRetirada: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Ciclos Realizados (+)</label>
                  <input
                    type="number"
                    value={formMovFerramenta.ciclosAdicionados}
                    onChange={(e) => setFormMovFerramenta({ ...formMovFerramenta, ciclosAdicionados: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModalMovFerramenta(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
                >
                  Registrar Movimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANUTENÇÃO / AFIAÇÃO DE FERRAMENTA */}
      {showModalManutFerramenta && ferramentaSelecionada && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-orange-900 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-orange-600" /> Registrar Afiação / Retífica ({ferramentaSelecionada.codigo})
              </h3>
              <button onClick={() => setShowModalManutFerramenta(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleApiAction(
                  'manutencao_ferramenta',
                  { id: ferramentaSelecionada.id, ...formManutFerramenta },
                  'Afiação registrada e condição da ferramenta restaurada!',
                  () => setShowModalManutFerramenta(false)
                );
              }}
              className="space-y-3"
            >
              <div>
                <label className="font-semibold block mb-1">Descrição do Serviço</label>
                <input
                  type="text"
                  required
                  value={formManutFerramenta.descricao}
                  onChange={(e) => setFormManutFerramenta({ ...formManutFerramenta, descricao: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Responsável / Oficina</label>
                  <input
                    type="text"
                    required
                    value={formManutFerramenta.responsavel}
                    onChange={(e) => setFormManutFerramenta({ ...formManutFerramenta, responsavel: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formManutFerramenta.custo}
                    onChange={(e) => setFormManutFerramenta({ ...formManutFerramenta, custo: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="zerarCiclos"
                  checked={formManutFerramenta.zerarCiclosAposAfiacao}
                  onChange={(e) => setFormManutFerramenta({ ...formManutFerramenta, zerarCiclosAposAfiacao: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <label htmlFor="zerarCiclos" className="text-slate-700 font-medium cursor-pointer">
                  Zerar contador de ciclos de afiação e restaurar condição para &quot;EXCELENTE&quot;
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModalManutFerramenta(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold"
                >
                  Confirmar Afiação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
