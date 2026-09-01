// frontend/src/components/RhOperacionalViewer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  ShieldCheck,
  GraduationCap,
  HardHat,
  FileText,
  Clock,
  Clock3,
  UserCheck,
  UserX,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  RefreshCw,
  Search,
  Sliders,
  DollarSign,
  Briefcase,
  Layers,
  FileSpreadsheet,
  Cpu,
  Factory,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { Empresa } from '@/backend/core/types/company';
import {
  Funcionario,
  FuncionarioEmpresa,
  Cargo,
  Competencia,
  FuncionarioMaquina,
  FuncionarioTreinamento,
  DocumentoFuncionario,
  Epi,
  EntregaEpi,
  Turno,
  ApontamentoHoras,
  Vaga,
  Candidato,
  Onboarding,
  Desligamento,
  HistoricoCargoSalario,
  RhAuditoriaLog,
  RhDashboardData,
  ResultadoIntegracaoExterna,
  NivelHabilidade,
} from '@/backend/modules/rh/rh-types';
import { rhOperacionalService } from '@/backend/modules/rh/rh-service';

interface RhOperacionalViewerProps {
  empresaAtiva: Empresa;
}

export function RhOperacionalViewer({ empresaAtiva }: RhOperacionalViewerProps) {
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'colaboradores'
    | 'polivalencia'
    | 'maquinas'
    | 'treinamentos'
    | 'epis'
    | 'documentos'
    | 'turnos_escalas'
    | 'apontamentos'
    | 'recrutamento'
    | 'onboarding_offboarding'
    | 'integracoes'
    | 'auditoria'
  >('dashboard');

  const [dashboard, setDashboard] = useState<RhDashboardData | null>(null);
  const [colaboradores, setColaboradores] = useState<{ funcionario: Funcionario; vinculo: FuncionarioEmpresa }[]>([]);
  const [polivalencia, setPolivalencia] = useState<any>(null);
  const [autorizacoesMaquinas, setAutorizacoesMaquinas] = useState<FuncionarioMaquina[]>([]);
  const [treinamentos, setTreinamentos] = useState<FuncionarioTreinamento[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoFuncionario[]>([]);
  const [episCatalogo, setEpisCatalogo] = useState<Epi[]>([]);
  const [entregasEpi, setEntregasEpi] = useState<EntregaEpi[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [apontamentos, setApontamentos] = useState<ApontamentoHoras[]>([]);
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [desligamentos, setDesligamentos] = useState<Desligamento[]>([]);
  const [historicoCargos, setHistoricoCargos] = useState<HistoricoCargoSalario[]>([]);
  const [auditoriaLogs, setAuditoriaLogs] = useState<RhAuditoriaLog[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);

  // Modais & Form states
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [resultadoIntegracao, setResultadoIntegracao] = useState<ResultadoIntegracaoExterna | null>(null);

  // Forms Modals
  const [showAdmitirModal, setShowAdmitirModal] = useState(false);
  const [showPromocaoModal, setShowPromocaoModal] = useState(false);
  const [showEpiModal, setShowEpiModal] = useState(false);
  const [showApontamentoModal, setShowApontamentoModal] = useState(false);
  const [showTreinamentoModal, setShowTreinamentoModal] = useState(false);
  const [showDesligamentoModal, setShowDesligamentoModal] = useState(false);

  // Form selections
  const [selectedFuncId, setSelectedFuncId] = useState<string>('');
  const [formNovoCargoId, setFormNovoCargoId] = useState<string>('');
  const [formNovoSalario, setFormNovoSalario] = useState<number>(0);
  const [formJustificativa, setFormJustificativa] = useState<string>('');

  const [formEpiId, setFormEpiId] = useState<string>('');
  const [formEpiQtd, setFormEpiQtd] = useState<number>(1);
  const [formEpiTam, setFormEpiTam] = useState<string>('G');

  const [formHorasQtd, setFormHorasQtd] = useState<number>(8.8);
  const [formHorasTipo, setFormHorasTipo] = useState<ApontamentoHoras['tipoHora']>('NORMAL_PRODUTIVA');
  const [formHorasOp, setFormHorasOp] = useState<string>('OP-2026-0899');
  const [formHorasObs, setFormHorasObs] = useState<string>('');

  const [formTreinId, setFormTreinId] = useState<string>('');
  const [formTreinData, setFormTreinData] = useState<string>('2026-08-26');
  const [formTreinInst, setFormTreinInst] = useState<string>('SENAI Caxias do Sul');

  const [formDeslTipo, setFormDeslTipo] = useState<Desligamento['tipoRescisao']>('DISPENSA_SEM_JUSTA_CAUSA');
  const [formDeslData, setFormDeslData] = useState<string>('2026-09-26');

  // Admissao form
  const [admNome, setAdmNome] = useState('');
  const [admCpf, setAdmCpf] = useState('');
  const [admNasc, setAdmNasc] = useState('1995-05-10');
  const [admTel, setAdmTel] = useState('(54) 99888-7766');
  const [admCargoId, setAdmCargoId] = useState('');
  const [admSalario, setAdmSalario] = useState(3500);

  const carregarDados = React.useCallback(() => {
    try {
      setDashboard(rhOperacionalService.getDashboardData(empresaAtiva.id));
      setColaboradores(rhOperacionalService.getColaboradores(empresaAtiva.id));
      setPolivalencia(rhOperacionalService.getMatrizPolivalencia(empresaAtiva.id));
      setAutorizacoesMaquinas(rhOperacionalService.getAutorizacoesMaquinas(empresaAtiva.id));
      setTreinamentos(rhOperacionalService.getTreinamentosColaboradores(empresaAtiva.id));
      setDocumentos(rhOperacionalService.getDocumentos(empresaAtiva.id));
      setEpisCatalogo(rhOperacionalService.getEpisCatalogo());
      setEntregasEpi(rhOperacionalService.getEntregasEpi(empresaAtiva.id));
      setTurnos(rhOperacionalService.getTurnos(empresaAtiva.id));
      setApontamentos(rhOperacionalService.getApontamentosHoras(empresaAtiva.id));
      setVagas(rhOperacionalService.getVagas(empresaAtiva.id));
      setCandidatos(rhOperacionalService.getCandidatos(empresaAtiva.id));
      setOnboardings(rhOperacionalService.getOnboardings(empresaAtiva.id));
      setDesligamentos(rhOperacionalService.getDesligamentos(empresaAtiva.id));
      setHistoricoCargos(rhOperacionalService.getHistoricoCargos(empresaAtiva.id));
      setAuditoriaLogs(rhOperacionalService.getAuditoriaLogs(empresaAtiva.id));
      const crgs = rhOperacionalService.getCargos();
      setCargos(crgs);
      if (crgs.length > 0 && !admCargoId) setAdmCargoId(crgs[0].id);
    } catch (e: any) {
      console.error(e);
    }
  }, [empresaAtiva.id, admCargoId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarDados();
    }, 0);
    return () => clearTimeout(timer);
  }, [carregarDados]);

  const showMsg = (tipo: 'sucesso' | 'erro', msg: string) => {
    setFeedback({ tipo, msg });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Handlers
  const handleAdmitir = () => {
    if (!admNome || !admCpf) {
      showMsg('erro', 'Nome e CPF são obrigatórios.');
      return;
    }
    const setores = rhOperacionalService.getSetores(empresaAtiva.id);
    const turnos = rhOperacionalService.getTurnos(empresaAtiva.id);
    rhOperacionalService.admitirColaborador(empresaAtiva.id, {
      cpf: admCpf,
      nomeCompleto: admNome,
      dataNascimento: admNasc,
      telefoneCelular: admTel,
      cargoId: admCargoId || cargos[0].id,
      setorId: setores[0]?.id || 'set-1',
      turnoId: turnos[0]?.id || 'tur-1',
      salarioBase: admSalario,
      tipoContrato: 'CLT_INDETERMINADO',
      dataAdmissao: new Date().toISOString().substring(0, 10),
      usuarioId: 'usr-admin-01',
      usuarioNome: 'Administrador RH',
    });
    showMsg('sucesso', `Colaborador ${admNome} admitido com sucesso. Onboarding iniciado.`);
    setShowAdmitirModal(false);
    setAdmNome('');
    setAdmCpf('');
    carregarDados();
  };

  const handlePromover = () => {
    if (!selectedFuncId || !formNovoCargoId || formNovoSalario <= 0) {
      showMsg('erro', 'Preencha o novo cargo e salário.');
      return;
    }
    const setores = rhOperacionalService.getSetores(empresaAtiva.id);
    rhOperacionalService.alterarCargoOuSalario(empresaAtiva.id, {
      funcionarioId: selectedFuncId,
      novoCargoId: formNovoCargoId,
      novoSetorId: setores[0]?.id || 'set-1',
      novoSalario: formNovoSalario,
      dataMudanca: new Date().toISOString().substring(0, 10),
      motivo: 'PROMOCAO_MERITO',
      justificativa: formJustificativa || 'Promoção por mérito e capacitação técnica fabril.',
      usuarioId: 'usr-admin-01',
      usuarioNome: 'Gerente Industrial',
    });
    showMsg('sucesso', 'Cargo e salário atualizados. Trilha de auditoria registrada.');
    setShowPromocaoModal(false);
    carregarDados();
  };

  const handleEntregarEpi = () => {
    if (!selectedFuncId || !formEpiId) {
      showMsg('erro', 'Selecione o colaborador e o EPI.');
      return;
    }
    rhOperacionalService.entregarEpi(empresaAtiva.id, {
      funcionarioId: selectedFuncId,
      epiId: formEpiId,
      quantidade: formEpiQtd,
      tamanho: formEpiTam,
      dataEntrega: new Date().toISOString().substring(0, 10),
      motivoEntrega: 'SUBSTITUICAO_DESGASTE',
      observacoes: 'Entrega confirmada com termo assinado digitalmente.',
      usuarioId: 'usr-sesmt-01',
      usuarioNome: 'Técnico SESMT',
    });
    showMsg('sucesso', 'EPI entregue e termo assinado digitalmente registrado.');
    setShowEpiModal(false);
    carregarDados();
  };

  const handleApontarHoras = () => {
    if (!selectedFuncId || formHorasQtd <= 0) {
      showMsg('erro', 'Selecione o colaborador e informe as horas.');
      return;
    }
    rhOperacionalService.registrarApontamentoHoras(empresaAtiva.id, {
      funcionarioId: selectedFuncId,
      dataApontamento: new Date().toISOString().substring(0, 10),
      tipoHora: formHorasTipo,
      quantidadeHoras: formHorasQtd,
      ordemProducaoId: formHorasOp,
      justificativaObservacoes: formHorasObs || 'Apontamento operacional de chão de fábrica.',
      usuarioId: 'usr-lider-01',
      usuarioNome: 'Líder de Turno',
    });
    showMsg('sucesso', `Apontamento de ${formHorasQtd}h registrado com custo industrial conciliado.`);
    setShowApontamentoModal(false);
    carregarDados();
  };

  const handleRegistrarTreinamento = () => {
    if (!selectedFuncId || !formTreinId) {
      showMsg('erro', 'Selecione o colaborador e o treinamento.');
      return;
    }
    const cat = rhOperacionalService.getTreinamentosCatalogo().find((t) => t.id === formTreinId);
    rhOperacionalService.registrarConclusaoTreinamento(empresaAtiva.id, {
      funcionarioId: selectedFuncId,
      treinamentoId: formTreinId,
      dataRealizacao: formTreinData,
      entidadeInstrutor: formTreinInst,
      cargaHorariaCumprida: cat?.cargaHorariaHoras || 16,
      notaAproveitamento: 9.5,
      custoTreinamento: 350,
      usuarioId: 'usr-rh-01',
      usuarioNome: 'SESMT / RH',
    });
    showMsg('sucesso', 'Treinamento e validade de reciclagem registrados.');
    setShowTreinamentoModal(false);
    carregarDados();
  };

  const handleIniciarDesligamento = () => {
    if (!selectedFuncId) {
      showMsg('erro', 'Selecione o colaborador a ser desligado.');
      return;
    }
    rhOperacionalService.iniciarDesligamento(empresaAtiva.id, {
      funcionarioId: selectedFuncId,
      tipoRescisao: formDeslTipo,
      dataComunicacao: new Date().toISOString().substring(0, 10),
      dataDesligamentoEfetivo: formDeslData,
      cumpriuAvisoPrevio: true,
      tipoAvisoPrevio: 'TRABALHADO',
      usuarioId: 'usr-rh-01',
      usuarioNome: 'Coordenação RH',
    });
    showMsg('sucesso', 'Processo de desligamento e checklist rescisório iniciados.');
    setShowDesligamentoModal(false);
    carregarDados();
  };

  const handleExportarFolha = async (tipo: 'ADMISSOES' | 'RESCISOES' | 'HORAS_CUSTOS') => {
    setLoadingAction(true);
    try {
      const res = await rhOperacionalService.exportarLoteParaFolhaExterna(
        empresaAtiva.id,
        tipo,
        'usr-rh-01',
        'Administrador RH'
      );
      setResultadoIntegracao(res);
      showMsg('sucesso', `Lote transmitido com sucesso. Protocolo: ${res.protocoloTransmissao}`);
      carregarDados();
    } catch (err: any) {
      showMsg('erro', err.message || 'Falha na exportação.');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-6" id="rh-operacional-viewer-root">
      {/* Header com Identificação Multiempresa */}
      <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-md">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                RH Operacional & Gestão do Trabalho Fabril
              </h2>
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-admitir-colab"
            onClick={() => setShowAdmitirModal(true)}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Admitir Colaborador
          </button>
          <button
            id="btn-apontar-horas"
            onClick={() => setShowApontamentoModal(true)}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Clock className="w-4 h-4" />
            Apontar Horas Fabris
          </button>
          <button
            id="btn-entregar-epi"
            onClick={() => setShowEpiModal(true)}
            className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <HardHat className="w-4 h-4" />
            Entregar EPI
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-md text-xs font-medium flex items-center justify-between ${
            feedback.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.tipo === 'sucesso' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* Navegação de Abas */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-medium">
        {[
          { id: 'dashboard', label: 'Painel & KPIs', icon: Layers },
          { id: 'colaboradores', label: `Colaboradores (${colaboradores.length})`, icon: Users },
          { id: 'polivalencia', label: 'Matriz de Polivalência', icon: Award },
          { id: 'maquinas', label: `Máquinas & NR-12 (${autorizacoesMaquinas.length})`, icon: Factory },
          { id: 'treinamentos', label: `Treinamentos & NRs (${treinamentos.length})`, icon: GraduationCap },
          { id: 'epis', label: `Controle de EPIs (${entregasEpi.length})`, icon: HardHat },
          { id: 'documentos', label: `ASOs & Documentos (${documentos.length})`, icon: FileText },
          { id: 'turnos_escalas', label: `Turnos & Escalas (${turnos.length})`, icon: Clock3 },
          { id: 'apontamentos', label: `Apontamentos / Custo (${apontamentos.length})`, icon: DollarSign },
          { id: 'recrutamento', label: `Vagas & Seleção (${vagas.length})`, icon: Briefcase },
          { id: 'onboarding_offboarding', label: `Onboarding & Desligamento`, icon: UserCheck },
          { id: 'integracoes', label: 'Integração Folha/Ponto', icon: Send },
          { id: 'auditoria', label: `Auditoria (${auditoriaLogs.length})`, icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-rh-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2.5 rounded-md flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* CONTEÚDO DAS ABAS */}

      {/* 1. DASHBOARD & KPIS */}
      {activeTab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          {/* Grid de Métricas Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Colaboradores Ativos</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{dashboard.totalFuncionariosAtivos}</p>
              <span className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                100% alocados em postos fabris
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Custo Hora Médio Fabril</span>
              <p className="text-2xl font-bold text-indigo-600 mt-1">R$ {dashboard.custoHoraMedioFabril.toFixed(2)}/h</p>
              <span className="text-xs text-slate-500 mt-1">Encargos + Periculosidade inclusos</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Treinamentos Críticos</span>
              <div className="flex items-center gap-2 mt-1">
                <p className={`text-2xl font-bold ${dashboard.treinamentosVencidosQtd > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {dashboard.treinamentosVencidosQtd}
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold">Vencidos</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                  +{dashboard.treinamentosVencendo30dQtd} em 30d
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Horas Fabris Apontadas</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{dashboard.horasApontadasMesAtual.totalHoras}h</p>
              <span className="text-xs text-slate-500 mt-1">
                Custo: R$ {dashboard.horasApontadasMesAtual.custoTotalIndustrial.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Alertas de Criticidade Alta */}
          {dashboard.alertasCriticidadeAlta.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                Alertas Críticos de Segurança e Conformidade Ocupacional
              </div>
              <div className="space-y-2">
                {dashboard.alertasCriticidadeAlta.map((alerta, idx) => (
                  <div key={idx} className="bg-white p-3 rounded border border-amber-200 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-slate-900">{alerta.titulo}</strong>
                      <span className="text-slate-500 ml-2">Colaborador: {alerta.colaboradorNome} ({alerta.setorNome})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                      {alerta.urgencia}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Distribuição de Equipes por Setor */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Distribuição do Efetivo por Setor Industrial</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboard.distribuicaoPorSetor.map((setor, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-md border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>{setor.setor}</span>
                    <span>{setor.quantidade} ({setor.percentual}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${setor.percentual}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. COLABORADORES & VÍNCULOS */}
      {activeTab === 'colaboradores' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome, CPF ou matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => setShowAdmitirModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Nova Admissão
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Matrícula</th>
                  <th className="p-3">Colaborador</th>
                  <th className="p-3">Cargo & Setor</th>
                  <th className="p-3">Turno</th>
                  <th className="p-3">Salário / Custo Hora</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {colaboradores
                  .filter(
                    (c) =>
                      c.funcionario.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      c.vinculo.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      c.funcionario.cpf.includes(searchTerm)
                  )
                  .map(({ funcionario, vinculo }) => (
                    <tr key={vinculo.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-800">{vinculo.matricula}</td>
                      <td className="p-3">
                        <strong className="text-slate-900 block">{funcionario.nomeCompleto}</strong>
                        <span className="text-slate-400 text-[11px]">CPF: {funcionario.cpf} | Tel: {funcionario.telefoneCelular}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-800 block">{vinculo.cargoTitulo}</span>
                        <span className="text-slate-500 text-[11px]">{vinculo.setorNome}</span>
                      </td>
                      <td className="p-3 text-slate-700">{vinculo.turnoNome}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">R$ {vinculo.salarioBase.toFixed(2)}</span>
                        <span className="text-indigo-600 text-[11px]">Custo: R$ {vinculo.custoHoraIndustrialEstimado.toFixed(2)}/h</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          vinculo.status === 'ATIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {vinculo.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedFuncId(funcionario.id);
                            setFormNovoSalario(vinculo.salarioBase);
                            setShowPromocaoModal(true);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium"
                        >
                          Promoção / Salário
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFuncId(funcionario.id);
                            setShowDesligamentoModal(true);
                          }}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-medium"
                        >
                          Rescisão
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. MATRIZ DE POLIVALÊNCIA (1 a 4) */}
      {activeTab === 'polivalencia' && polivalencia && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Matriz de Polivalência & Nível de Competências Fabris</h3>
              <p className="text-xs text-slate-500">Escala de 1 a 4: 1-Aprendiz | 2-Autônomo | 3-Avançado/Multiplicador | 4-Especialista/Auditor</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-200 rounded"></span> Nível 1</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-300 rounded"></span> Nível 2</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-indigo-500 rounded text-white"></span> Nível 3</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-600 rounded text-white"></span> Nível 4</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3 sticky left-0 bg-slate-100">Colaborador / Cargo</th>
                  {polivalencia.competencias.map((comp: Competencia) => (
                    <th key={comp.id} className="p-3 text-center min-w-[130px]" title={comp.descricao}>
                      {comp.nome}
                    </th>
                  ))}
                  <th className="p-3 text-center">Score Médio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {polivalencia.colaboradores.map((colab: any) => (
                  <tr key={colab.funcionarioId} className="hover:bg-slate-50">
                    <td className="p-3 font-medium sticky left-0 bg-white shadow-xs">
                      <strong className="text-slate-900 block">{colab.funcionarioNome}</strong>
                      <span className="text-slate-500 text-[11px]">{colab.cargoTitulo}</span>
                    </td>
                    {polivalencia.competencias.map((comp: Competencia) => {
                      const lvl: NivelHabilidade = colab.avaliacoes[comp.id] || 1;
                      const corClass =
                        lvl === 4
                          ? 'bg-emerald-600 text-white'
                          : lvl === 3
                          ? 'bg-indigo-600 text-white'
                          : lvl === 2
                          ? 'bg-blue-200 text-blue-900 font-bold'
                          : 'bg-slate-100 text-slate-600';

                      return (
                        <td key={comp.id} className="p-2 text-center">
                          <button
                            onClick={() => {
                              const nextLvl = ((lvl % 4) + 1) as NivelHabilidade;
                              rhOperacionalService.salvarAvaliacaoCompetencia(empresaAtiva.id, {
                                funcionarioId: colab.funcionarioId,
                                competenciaId: comp.id,
                                nivel: nextLvl,
                                usuarioId: 'usr-lider-01',
                                usuarioNome: 'Líder de Produção',
                              });
                              carregarDados();
                            }}
                            className={`w-7 h-7 rounded text-xs font-bold transition-transform hover:scale-110 shadow-2xs ${corClass}`}
                            title={`Clique para alternar nível (Atual: ${lvl})`}
                          >
                            {lvl}
                          </button>
                        </td>
                      );
                    })}
                    <td className="p-3 text-center font-bold text-slate-900">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs">{colab.mediaGeral} / 4.0</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MÁQUINAS & AUTORIZAÇÃO NR-12 */}
      {activeTab === 'maquinas' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Matriz de Habilitação e Autorização para Operação de Máquinas</h3>
              <p className="text-xs text-slate-500">Conformidade obrigatória com a NR-12 e normas de segurança em postos fabris</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {autorizacoesMaquinas.map((aut) => (
              <div key={aut.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-900">{aut.maquinaNome}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      aut.status === 'LIBERADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {aut.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">Operador: <strong className="text-slate-900">{aut.funcionarioNome}</strong></p>
                  <p className="text-xs text-slate-500">Nível de Acesso: <strong className="text-indigo-700">{aut.nivelAutorizacao}</strong></p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-600">
                    <span>NR-12 Válida: {aut.nr12Valida ? '✅ Sim' : '❌ Não'}</span>
                    <span>Validade: {aut.validadeAutorizacao || 'Indeterminada'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Autorizado por: {aut.autorizadoPorNome}</span>
                  {aut.status === 'LIBERADO' ? (
                    <button
                      onClick={() => {
                        rhOperacionalService.bloquearOperadorMaquina(
                          empresaAtiva.id,
                          aut.id,
                          'Bloqueio preventivo de segurança aplicado pelo encarregado.',
                          'usr-sesmt-01',
                          'Técnico SESMT'
                        );
                        carregarDados();
                      }}
                      className="px-2.5 py-1 bg-rose-600 text-white rounded text-[11px] font-semibold hover:bg-rose-700"
                    >
                      Bloquear Operador
                    </button>
                  ) : (
                    <span className="text-rose-600 font-bold text-[11px]">Bloqueado / Restrito</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TREINAMENTOS & NRs */}
      {activeTab === 'treinamentos' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Gestão de Treinamentos, NRs e Reciclagem Periódica</h3>
              <p className="text-xs text-slate-500">Controle de vencimentos para NR-10, NR-12, NR-35, NR-06 e ISO 9001</p>
            </div>
            <button
              onClick={() => {
                if (colaboradores.length > 0) setSelectedFuncId(colaboradores[0].funcionario.id);
                setShowTreinamentoModal(true);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Conclusão / Reciclagem
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Colaborador</th>
                  <th className="p-3">Treinamento / Norma</th>
                  <th className="p-3">Data Realização</th>
                  <th className="p-3">Vencimento Reciclagem</th>
                  <th className="p-3">Entidade Instrutor</th>
                  <th className="p-3">Status Validade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {treinamentos.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{t.funcionarioNome}</td>
                    <td className="p-3">
                      <strong className="text-slate-800 block">{t.treinamentoTitulo}</strong>
                      <span className="text-indigo-600 font-mono text-[11px]">{t.normaRegulamentadora || 'Treinamento Técnico'}</span>
                    </td>
                    <td className="p-3 text-slate-700">{t.dataRealizacao}</td>
                    <td className="p-3">
                      <strong className="text-slate-900 block">{t.dataVencimento || 'Permanente'}</strong>
                      {t.diasAteVencimento !== undefined && (
                        <span className={`text-[11px] font-semibold ${t.diasAteVencimento < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                          {t.diasAteVencimento < 0 ? `Vencido há ${Math.abs(t.diasAteVencimento)} dias` : `Vence em ${t.diasAteVencimento} dias`}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">{t.entidadeInstrutor}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'VALIDO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'VENCENDO_30_DIAS'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. CONTROLE DE EPIS */}
      {activeTab === 'epis' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {episCatalogo.map((epi) => (
              <div key={epi.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900">{epi.nome}</span>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">
                    {epi.numeroCa}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Fabricante: {epi.fabricante || 'Nacional'}</p>
                <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">Estoque: {epi.estoqueAtual} un</span>
                  <span className="text-slate-900">R$ {epi.custoUnitario.toFixed(2)}/un</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Histórico de Entregas de EPIs & Termos Assinados</h3>
              <button
                onClick={() => {
                  if (colaboradores.length > 0) setSelectedFuncId(colaboradores[0].funcionario.id);
                  if (episCatalogo.length > 0) setFormEpiId(episCatalogo[0].id);
                  setShowEpiModal(true);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Nova Entrega de EPI
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Colaborador</th>
                    <th className="p-3">EPI / CA</th>
                    <th className="p-3">Quantidade / Tam</th>
                    <th className="p-3">Data Entrega</th>
                    <th className="p-3">Previsão Troca</th>
                    <th className="p-3">Termo Digital</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entregasEpi.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{e.funcionarioNome}</td>
                      <td className="p-3">
                        <strong className="text-slate-800 block">{e.epiNome}</strong>
                        <span className="text-slate-500 font-mono text-[11px]">{e.numeroCa}</span>
                      </td>
                      <td className="p-3">{e.quantidade} un ({e.tamanho || 'Único'})</td>
                      <td className="p-3 text-slate-700">{e.dataEntrega}</td>
                      <td className="p-3">
                        <span className={`font-semibold ${e.diasAteTroca && e.diasAteTroca < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                          {e.dataPrevisaoTroca}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Assinado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. ASOs & DOCUMENTOS */}
      {activeTab === 'documentos' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Exames Ocupacionais (ASOs) & Documentação Funcional</h3>
              <p className="text-xs text-slate-500">ASO Admissional, Periódico, Retorno, Mudança de Risco e Demissional</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Colaborador</th>
                  <th className="p-3">Tipo de Documento</th>
                  <th className="p-3">Emissão / Validade</th>
                  <th className="p-3">Médico / Clínica</th>
                  <th className="p-3">Parecer de Aptidão</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documentos.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{d.funcionarioNome}</td>
                    <td className="p-3 font-mono font-bold text-slate-800">{d.tipoDocumento}</td>
                    <td className="p-3">
                      <span>{d.dataEmissao} até {d.dataValidade || 'Permanente'}</span>
                    </td>
                    <td className="p-3 text-slate-600">{d.clinicaEmissora || 'Medicina do Trabalho'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {d.statusAptidao}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.statusValidade === 'VALIDO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {d.statusValidade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. TURNOS & ESCALAS */}
      {activeTab === 'turnos_escalas' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Grade de Turnos Fabris & Escalas de Trabalho</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {turnos.map((turno) => (
              <div key={turno.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <strong className="text-xs text-slate-900">{turno.nome}</strong>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-200 rounded">{turno.codigo}</span>
                </div>
                <div className="text-xs text-slate-700 space-y-1">
                  <p>Entrada: <strong>{turno.horarioEntrada}</strong> | Saída: <strong>{turno.horarioSaida}</strong></p>
                  <p>Intervalo: {turno.intervaloInicio} às {turno.intervaloFim}</p>
                  <p>Jornada: <strong>{turno.totalHorasDiarias}h/dia</strong></p>
                  <p className="text-[11px] text-indigo-700 font-semibold">
                    {turno.adicionalNoturnoAplica ? '🌙 Aplica Adicional Noturno' : '☀️ Diurno'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. APONTAMENTOS DE HORAS PARA CUSTEIO INDUSTRIAL */}
      {activeTab === 'apontamentos' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Apontamentos de Horas para Custeio Industrial & OPs</h3>
              <p className="text-xs text-slate-500">Conciliação com custo-hora da produção (Módulo 10)</p>
            </div>
            <button
              onClick={() => {
                if (colaboradores.length > 0) setSelectedFuncId(colaboradores[0].funcionario.id);
                setShowApontamentoModal(true);
              }}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Novo Apontamento
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Colaborador</th>
                  <th className="p-3">Tipo de Hora</th>
                  <th className="p-3">Quantidade</th>
                  <th className="p-3">Custo Hora / Total</th>
                  <th className="p-3">Ordem de Produção</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apontamentos.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-700">{a.dataApontamento}</td>
                    <td className="p-3 font-semibold text-slate-900">{a.funcionarioNome}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded font-semibold text-[10px]">
                        {a.tipoHora}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-800">{a.quantidadeHoras}h</td>
                    <td className="p-3">
                      <strong className="text-slate-900 block">R$ {a.custoTotalCalculado.toFixed(2)}</strong>
                      <span className="text-slate-400 text-[11px]">Taxa: R$ {a.custoHoraAplicado.toFixed(2)}/h</span>
                    </td>
                    <td className="p-3 font-mono font-semibold text-slate-700">{a.ordemProducaoId || 'Geral'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {a.statusAprovacao}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 10. RECRUTAMENTO & VAGAS */}
      {activeTab === 'recrutamento' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Vagas Operacionais em Aberto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vagas.map((v) => (
                <div key={v.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-xs text-slate-900">{v.titulo}</strong>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded">
                      {v.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">Setor: {v.setorNome} | Vagas: {v.quantidadeVagas}</p>
                  <p className="text-xs text-slate-800 font-semibold mt-1">
                    Faixa: R$ {v.salarioPropostoDe?.toFixed(2)} até R$ {v.salarioPropostoAte?.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Funil de Candidatos Fabris</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidatos.map((cand) => (
                <div key={cand.id} className="p-4 border border-slate-200 rounded-lg bg-white shadow-2xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs text-slate-900">{cand.nomeCompleto}</strong>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded text-[10px]">
                      Match {cand.scoreAderenciaPerc}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Etapa Atual: <strong className="text-indigo-800">{cand.etapaFunil}</strong></p>
                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded italic">&quot;{cand.parecerEntrevistador}&quot;</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 11. ONBOARDING & DESLIGAMENTO */}
      {activeTab === 'onboarding_offboarding' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Onboarding */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                Checklist de Admissão & Onboarding
              </h3>
            </div>
            {onboardings.map((onb) => (
              <div key={onb.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-slate-900">{onb.funcionarioNome}</strong>
                  <span className="text-xs font-bold text-indigo-600">{onb.progressoPercentual}% Concluído</span>
                </div>
                <div className="space-y-1.5">
                  {onb.checklistItens.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (!item.concluido) {
                          rhOperacionalService.concluirItemOnboarding(
                            empresaAtiva.id,
                            onb.id,
                            item.id,
                            'usr-rh-01',
                            'Mariana Duarte'
                          );
                          carregarDados();
                        }
                      }}
                      className={`p-2 rounded text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        item.concluido ? 'bg-emerald-50 text-emerald-800' : 'bg-white text-slate-700 hover:bg-indigo-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {item.concluido ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300"></div>}
                        {item.item}
                      </span>
                      <span className="text-[10px] text-slate-400">{item.categoria}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Desligamento */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserX className="w-4 h-4 text-rose-600" />
                Checklist de Desligamento & Rescisão
              </h3>
            </div>
            {desligamentos.map((desl) => (
              <div key={desl.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-slate-900">{desl.funcionarioNome}</strong>
                  <span className="text-xs font-bold text-rose-600">{desl.progressoPercentual}% Concluído</span>
                </div>
                <div className="space-y-1.5">
                  {desl.checklistItens.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (!item.concluido) {
                          rhOperacionalService.concluirItemDesligamento(
                            empresaAtiva.id,
                            desl.id,
                            item.id,
                            'usr-rh-01',
                            'Mariana Duarte'
                          );
                          carregarDados();
                        }
                      }}
                      className={`p-2 rounded text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        item.concluido ? 'bg-emerald-50 text-emerald-800' : 'bg-white text-slate-700 hover:bg-rose-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {item.concluido ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300"></div>}
                        {item.item}
                      </span>
                      <span className="text-[10px] text-slate-400">{item.categoria}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 12. INTEGRAÇÃO DESACOPLADA COM FOLHA & PONTO */}
      {activeTab === 'integracoes' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Camada de Integração Desacoplada (Folha & Ponto Eletrônico)</h3>
            <p className="text-xs text-slate-500">
              Padrão Adapter com MockProvider para exportação de eventos para TOTVS Protheus, Senior HCM, ADP e Secullum Ponto
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between">
              <div>
                <strong className="text-xs text-slate-900 block">Exportar Admissões (CLT/PJ)</strong>
                <p className="text-xs text-slate-500 mt-1">Transmite dados cadastrais e vínculos para geração de folha externa.</p>
              </div>
              <button
                disabled={loadingAction}
                onClick={() => handleExportarFolha('ADMISSOES')}
                className="mt-4 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Exportar Admissões
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between">
              <div>
                <strong className="text-xs text-slate-900 block">Exportar Apontamentos & Horas Extras</strong>
                <p className="text-xs text-slate-500 mt-1">Envia eventos de horas 50%, 100% e custo fabril para fechamento contábil.</p>
              </div>
              <button
                disabled={loadingAction}
                onClick={() => handleExportarFolha('HORAS_CUSTOS')}
                className="mt-4 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Exportar Horas & Custos
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between">
              <div>
                <strong className="text-xs text-slate-900 block">Exportar Pacote Rescisório</strong>
                <p className="text-xs text-slate-500 mt-1">Homologação de desligamentos e cálculo de verbas rescisórias externas.</p>
              </div>
              <button
                disabled={loadingAction}
                onClick={() => handleExportarFolha('RESCISOES')}
                className="mt-4 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Exportar Rescisões
              </button>
            </div>
          </div>

          {resultadoIntegracao && (
            <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span>Protocolo: {resultadoIntegracao.protocoloTransmissao}</span>
                <span>Sistema: {resultadoIntegracao.sistemaDestino}</span>
              </div>
              <pre className="overflow-x-auto text-[11px] text-slate-300 bg-slate-950 p-3 rounded">
                {JSON.stringify(resultadoIntegracao.payloadExportado, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* 13. AUDITORIA */}
      {activeTab === 'auditoria' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Trilha de Auditoria Append-Only de Recursos Humanos</h3>
          <div className="space-y-2">
            {auditoriaLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-500 mb-1">
                  <span>{log.dataHora}</span>
                  <span className="font-bold text-indigo-700">{log.acao}</span>
                  <span>Operador: {log.usuarioNome}</span>
                </div>
                <p className="text-slate-800 font-medium">{log.justificativa}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL ADMITIR */}
      {showAdmitirModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Nova Admissão de Colaborador</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={admNome}
                  onChange={(e) => setAdmNome(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                  placeholder="Ex: Carlos Eduardo Silveira"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">CPF</label>
                <input
                  type="text"
                  value={admCpf}
                  onChange={(e) => setAdmCpf(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Cargo</label>
                <select
                  value={admCargoId}
                  onChange={(e) => setAdmCargoId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                >
                  {cargos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.titulo} (Piso: R$ {c.pisoSalarial.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Salário Base (R$)</label>
                <input
                  type="number"
                  value={admSalario}
                  onChange={(e) => setAdmSalario(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setShowAdmitirModal(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded">
                Cancelar
              </button>
              <button onClick={handleAdmitir} className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded">
                Confirmar Admissão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PROMOÇÃO / SALÁRIO */}
      {showPromocaoModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Alteração de Cargo ou Salário</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Novo Cargo</label>
                <select
                  value={formNovoCargoId}
                  onChange={(e) => setFormNovoCargoId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                >
                  <option value="">Selecione o cargo...</option>
                  {cargos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.titulo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Novo Salário (R$)</label>
                <input
                  type="number"
                  value={formNovoSalario}
                  onChange={(e) => setFormNovoSalario(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Justificativa da Promoção</label>
                <textarea
                  value={formJustificativa}
                  onChange={(e) => setFormJustificativa(e.target.value)}
                  rows={2}
                  className="w-full p-2 border border-slate-300 rounded"
                  placeholder="Ex: Mérito por domínio da mesa de corte a laser..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setShowPromocaoModal(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded">
                Cancelar
              </button>
              <button onClick={handlePromover} className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded">
                Salvar Alteração
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL APONTAMENTO HORAS */}
      {showApontamentoModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Apontamento de Horas para Custeio Fabril</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Colaborador</label>
                <select
                  value={selectedFuncId}
                  onChange={(e) => setSelectedFuncId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                >
                  {colaboradores.map((c) => (
                    <option key={c.funcionario.id} value={c.funcionario.id}>
                      {c.funcionario.nomeCompleto} ({c.vinculo.cargoTitulo})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Tipo de Hora</label>
                <select
                  value={formHorasTipo}
                  onChange={(e) => setFormHorasTipo(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded"
                >
                  <option value="NORMAL_PRODUTIVA">Normal Produtiva (1.0x)</option>
                  <option value="EXTRA_50">Hora Extra 50% (1.5x)</option>
                  <option value="EXTRA_100">Hora Extra 100% (2.0x)</option>
                  <option value="PARADA_IMPRODUTIVA">Parada Improdutiva (1.0x)</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Quantidade de Horas</label>
                <input
                  type="number"
                  step="0.5"
                  value={formHorasQtd}
                  onChange={(e) => setFormHorasQtd(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Ordem de Produção (OP)</label>
                <input
                  type="text"
                  value={formHorasOp}
                  onChange={(e) => setFormHorasOp(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                  placeholder="Ex: OP-2026-0891"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setShowApontamentoModal(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded">
                Cancelar
              </button>
              <button onClick={handleApontarHoras} className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded">
                Registrar Apontamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ENTREGA EPI */}
      {showEpiModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Entrega de EPI com Termo Assinado Digitalmente</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Colaborador</label>
                <select
                  value={selectedFuncId}
                  onChange={(e) => setSelectedFuncId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                >
                  {colaboradores.map((c) => (
                    <option key={c.funcionario.id} value={c.funcionario.id}>
                      {c.funcionario.nomeCompleto}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Equipamento (EPI / CA)</label>
                <select
                  value={formEpiId}
                  onChange={(e) => setFormEpiId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                >
                  {episCatalogo.map((epi) => (
                    <option key={epi.id} value={epi.id}>
                      {epi.nome} ({epi.numeroCa}) - Disp: {epi.estoqueAtual}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Quantidade</label>
                  <input
                    type="number"
                    value={formEpiQtd}
                    onChange={(e) => setFormEpiQtd(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tamanho</label>
                  <input
                    type="text"
                    value={formEpiTam}
                    onChange={(e) => setFormEpiTam(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setShowEpiModal(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded">
                Cancelar
              </button>
              <button onClick={handleEntregarEpi} className="px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded">
                Confirmar Entrega
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TREINAMENTO */}
      {showTreinamentoModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Registrar Conclusão de Treinamento / Reciclagem NR</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Colaborador</label>
                <select
                  value={selectedFuncId}
                  onChange={(e) => setSelectedFuncId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                >
                  {colaboradores.map((c) => (
                    <option key={c.funcionario.id} value={c.funcionario.id}>
                      {c.funcionario.nomeCompleto}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Treinamento Normativo</label>
                <select
                  value={formTreinId}
                  onChange={(e) => setFormTreinId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                >
                  <option value="">Selecione o treinamento...</option>
                  {rhOperacionalService.getTreinamentosCatalogo().map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.titulo} ({t.cargaHorariaHoras}h)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Data da Realização</label>
                <input
                  type="date"
                  value={formTreinData}
                  onChange={(e) => setFormTreinData(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Entidade / Instrutor</label>
                <input
                  type="text"
                  value={formTreinInst}
                  onChange={(e) => setFormTreinInst(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setShowTreinamentoModal(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded">
                Cancelar
              </button>
              <button onClick={handleRegistrarTreinamento} className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded">
                Salvar Treinamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DESLIGAMENTO */}
      {showDesligamentoModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Iniciar Processo de Desligamento</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Motivo da Rescisão</label>
                <select
                  value={formDeslTipo}
                  onChange={(e) => setFormDeslTipo(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded"
                >
                  <option value="DISPENSA_SEM_JUSTA_CAUSA">Dispensa sem Justa Causa (Empregador)</option>
                  <option value="PEDIDO_DEMISSAO_FUNCIONARIO">Pedido de Demissão (Empregado)</option>
                  <option value="TERMINO_CONTRATO_EXPERIENCIA">Término de Contrato de Experiência</option>
                  <option value="ACORDO_MUTUO_ART484A">Acordo Mútuo (Art. 484-A CLT)</option>
                  <option value="DISPENSA_COM_JUSTA_CAUSA">Dispensa com Justa Causa (Art. 482 CLT)</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Data Efetiva de Saída</label>
                <input
                  type="date"
                  value={formDeslData}
                  onChange={(e) => setFormDeslData(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setShowDesligamentoModal(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded">
                Cancelar
              </button>
              <button onClick={handleIniciarDesligamento} className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded">
                Iniciar Rescisão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
