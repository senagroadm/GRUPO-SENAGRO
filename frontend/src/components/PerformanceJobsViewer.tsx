import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  RefreshCw,
  Database,
  CheckCircle2,
  Clock,
  Zap,
  Activity,
  Server,
  Play,
  Pause,
  AlertTriangle,
  ShieldCheck,
  HardDrive,
  FileSpreadsheet,
  ArrowRightLeft,
  Receipt,
  Bell,
  Trash2,
  Sparkles,
  Filter,
  Check,
  Terminal,
} from 'lucide-react';

interface JobItem {
  id: string;
  nome: string;
  categoria: string;
  fila: string;
  periodicidade: string;
  status: 'EM_EXECUCAO' | 'AGENDADO' | 'CONCLUIDO' | 'FALHA_RETRY';
  duracaoMedia: string;
  ultimoDisparo: string;
  proximoDisparo: string;
  tentativas: number;
  maxTentativas: number;
  idempotencyKey: string;
  empresaEscopo: string;
  descricao: string;
}

const JOBS_MOCKADOS: JobItem[] = [
  {
    id: 'JOB-ALERTAS-01',
    nome: 'Alertas do Sistema & Monitor de Estoque Mínimo',
    categoria: 'NOTIFICACOES',
    fila: 'queue_high_priority',
    periodicidade: 'A cada 5 minutos',
    status: 'EM_EXECUCAO',
    duracaoMedia: '320ms',
    ultimoDisparo: '27/08/2026 10:40:00',
    proximoDisparo: '27/08/2026 10:45:00',
    tentativas: 1,
    maxTentativas: 3,
    idempotencyKey: 'idemp-stock-alert-cycle-4412',
    empresaEscopo: 'Todas as 5 Empresas',
    descricao: 'Varredura de saldos críticos e disparo de notificações automáticas aos compradores.',
  },
  {
    id: 'JOB-INTERCOMPANY-02',
    nome: 'Sincronização Intercompany & Balanço de Movimentações',
    categoria: 'INTEGRACAO',
    fila: 'queue_intercompany_sync',
    periodicidade: 'A cada 15 minutos',
    status: 'AGENDADO',
    duracaoMedia: '840ms',
    ultimoDisparo: '27/08/2026 10:30:00',
    proximoDisparo: '27/08/2026 10:45:00',
    tentativas: 1,
    maxTentativas: 5,
    idempotencyKey: 'idemp-intercompany-xfer-8819',
    empresaEscopo: 'Consolidação Grupo TRITECH',
    descricao: 'Conciliação de faturamentos mútuos e compensações financeiras entre CNPJs.',
  },
  {
    id: 'JOB-COBRANCA-03',
    nome: 'Régua de Cobranças Automatizadas & Disparo de Boletos',
    categoria: 'FINANCEIRO',
    fila: 'queue_billing_engine',
    periodicidade: 'Diário (06:00)',
    status: 'CONCLUIDO',
    duracaoMedia: '2.1s',
    ultimoDisparo: '27/08/2026 06:00:00',
    proximoDisparo: '28/08/2026 06:00:00',
    tentativas: 1,
    maxTentativas: 3,
    idempotencyKey: 'idemp-billing-run-20260827',
    empresaEscopo: '5 CNPJs (Por Empresa)',
    descricao: 'Processamento de títulos vencidos a vencer em D-2, emissão de lembretes e pix híbrido.',
  },
  {
    id: 'JOB-CONCILIACAO-04',
    nome: 'Conciliação Bancária Noturna & Processamento OFX/CNAB',
    categoria: 'TESOURARIA',
    fila: 'queue_bank_reconciliation',
    periodicidade: 'A cada 1 hora',
    status: 'CONCLUIDO',
    duracaoMedia: '1.4s',
    ultimoDisparo: '27/08/2026 10:00:00',
    proximoDisparo: '27/08/2026 11:00:00',
    tentativas: 1,
    maxTentativas: 4,
    idempotencyKey: 'idemp-bank-reconcile-cycle-10',
    empresaEscopo: 'Todas as Contas Ativas',
    descricao: 'Casamento determinístico de extratos bancários com contas a pagar e receber.',
  },
  {
    id: 'JOB-RELATORIOS-05',
    nome: 'Geração Assíncrona de Relatórios Pesados (DRE / Kardex)',
    categoria: 'RELATORIOS',
    fila: 'queue_heavy_reports',
    periodicidade: 'Sob Demanda (Fila Worker)',
    status: 'EM_EXECUCAO',
    duracaoMedia: '4.8s',
    ultimoDisparo: '27/08/2026 10:41:15',
    proximoDisparo: 'Em processamento',
    tentativas: 1,
    maxTentativas: 2,
    idempotencyKey: 'idemp-report-kardex-consolidado-901',
    empresaEscopo: 'TRITECH Industrial Matriz',
    descricao: 'Consolidação de 45.000 movimentações para exportação em formato XLSX/PDF.',
  },
  {
    id: 'JOB-CLEANUP-06',
    nome: 'Manutenção, Limpeza de Dados Temporários e VACUUM',
    categoria: 'INFRAESTRUTURA',
    fila: 'queue_maintenance_daily',
    periodicidade: 'Diário (03:00)',
    status: 'CONCLUIDO',
    duracaoMedia: '3.2s',
    ultimoDisparo: '27/08/2026 03:00:00',
    proximoDisparo: '28/08/2026 03:00:00',
    tentativas: 1,
    maxTentativas: 2,
    idempotencyKey: 'idemp-db-vacuum-analyze-20260827',
    empresaEscopo: 'PostgreSQL Core Database',
    descricao: 'Reindexação periódica, limpeza de sessões expiradas e otimização do planner de consultas.',
  },
];

const METRICAS_PERFORMANCE = [
  { rotulo: 'Throughput de Fila', valor: '1.420 msgs/min', sub: 'Processamento assíncrono', status: 'normal' },
  { rotulo: 'Latência Média de Jobs', valor: '480 ms', sub: 'Workers paralelos ativos', status: 'otimo' },
  { rotulo: 'Taxa de Idempotência', valor: '100.0%', sub: 'Zero duplicidade em retries', status: 'seguro' },
  { rotulo: 'Hit Rate do Cache L2', valor: '94.2%', sub: 'Invalidação seletiva por empresa', status: 'otimo' },
];

export function PerformanceJobsViewer() {
  const [jobs, setJobs] = useState<JobItem[]>(JOBS_MOCKADOS);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODOS');
  const [jobSelecionado, setJobSelecionado] = useState<JobItem | null>(JOBS_MOCKADOS[0]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const jobsFiltrados = jobs.filter(
    (j) => filtroCategoria === 'TODOS' || j.categoria === filtroCategoria
  );

  const handleDispararManual = (jobId: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, status: 'EM_EXECUCAO', ultimoDisparo: '27/08/2026 10:44:30' } : j
      )
    );
    setFeedback(`Job [${jobId}] enfileirado com Idempotency-Key preservada.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleLimparCacheSeletivo = () => {
    setFeedback(`Cache seletivo de consultas L2 invalidado com sucesso. Índices preservados.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full min-h-[640px] overflow-hidden">
      
      {/* Header do Motor de Performance & Jobs */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-lg shadow-xs">
            <Cpu className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
                Motor de Desempenho, Cache & Jobs Assíncronos
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Fila Ativa & Idempotente
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestão de workers em background, processamento de relatórios pesados, retries controlados e estratégia de cache multiempresa.
            </p>
          </div>
        </div>

        {/* Botão de Ação Rápida */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLimparCacheSeletivo}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            Limpar Cache Seletivo
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div className="bg-slate-900 text-white px-4 py-2.5 text-xs flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Cards de Métricas de Performance */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/40">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {METRICAS_PERFORMANCE.map((m, idx) => (
            <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {m.rotulo}
              </span>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">{m.valor}</div>
              <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {m.sub}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Principal: Lista de Jobs + Detalhes Técnicos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        
        {/* Coluna Esquerda: Filas e Monitoramento de Jobs */}
        <div className="lg:col-span-7 border-r border-slate-200 p-4 overflow-y-auto max-h-[calc(100vh-270px)] space-y-3 bg-white">
          
          {/* Barra de Filtro de Categoria */}
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              Filas & Rotinas Agendadas ({jobsFiltrados.length})
            </span>
            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="text-[11px] border border-slate-200 rounded px-2 py-0.5 bg-white text-slate-700"
              >
                <option value="TODOS">Todas Categorias</option>
                <option value="NOTIFICACOES">Notificações</option>
                <option value="INTEGRACAO">Integração</option>
                <option value="FINANCEIRO">Financeiro</option>
                <option value="TESOURARIA">Tesouraria</option>
                <option value="RELATORIOS">Relatórios</option>
                <option value="INFRAESTRUTURA">Infraestrutura</option>
              </select>
            </div>
          </div>

          {/* Lista de Jobs */}
          <div className="space-y-2">
            {jobsFiltrados.map((job) => {
              const isSelected = jobSelecionado?.id === job.id;
              return (
                <div
                  key={job.id}
                  onClick={() => setJobSelecionado(job)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400 font-bold">{job.id}</span>
                        <span className="font-semibold text-xs text-slate-900">{job.nome}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{job.descricao}</p>
                    </div>

                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                        job.status === 'EM_EXECUCAO'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                          : job.status === 'CONCLUIDO'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : job.status === 'AGENDADO'
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {job.status === 'EM_EXECUCAO' ? 'Em Execução' : job.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-600">
                    <div>
                      <span className="text-slate-400 block">Periodicidade:</span>
                      <strong className="text-slate-700">{job.periodicidade}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Duração Média:</span>
                      <strong className="text-slate-700 font-mono">{job.duracaoMedia}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block">Fila Worker:</span>
                      <strong className="text-indigo-600 font-mono">{job.fila}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna Direita: Detalhes Técnicos, Políticas e Simulação */}
        <div className="lg:col-span-5 p-4 overflow-y-auto max-h-[calc(100vh-270px)] space-y-4 bg-slate-50/40">
          
          {jobSelecionado ? (
            <>
              {/* Card de Informações da Rotina */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Detalhes da Rotina
                    </h3>
                    <p className="text-xs font-semibold text-slate-900 mt-0.5">{jobSelecionado.nome}</p>
                  </div>
                  <button
                    onClick={() => handleDispararManual(jobSelecionado.id)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    Executar Agora
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Escopo Multiempresa:</span>
                    <span className="font-bold text-slate-800">{jobSelecionado.empresaEscopo}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Última Execução:</span>
                    <span className="font-mono text-slate-700">{jobSelecionado.ultimoDisparo}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Próximo Agendamento:</span>
                    <span className="font-mono text-slate-700">{jobSelecionado.proximoDisparo}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Política de Retries:</span>
                    <span className="font-bold text-slate-800">{jobSelecionado.tentativas} de {jobSelecionado.maxTentativas} tentativas (Backoff Exponencial)</span>
                  </div>
                </div>

                {/* Chave de Idempotência */}
                <div className="p-2.5 bg-slate-900 text-slate-200 rounded border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Idempotency-Key Ativa
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 break-all">
                    {jobSelecionado.idempotencyKey}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Previne execuções duplicadas caso ocorra retry ou reinício do container.
                  </div>
                </div>
              </div>

              {/* Pilares de Otimização & Cache */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2.5 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  Estratégia de Otimização & Índices
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Paginação Determinística via Cursor:</strong>
                      <p className="text-[11px] text-slate-500">Consultas utilizam índices B-Tree compostos `(empresa_id, created_at DESC)` evitando scans completos.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Invalidação de Cache por Namespace:</strong>
                      <p className="text-[11px] text-slate-500">Mutações em pedidos ou estoques invalidam apenas o cache da empresa proprietária.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Desacoplamento de Relatórios Pesados:</strong>
                      <p className="text-[11px] text-slate-500">Processamentos com mais de 5.000 linhas são automaticamente roteados para a fila assíncrona.</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
              Selecione um job para inspecionar os detalhes técnicos e políticas de fila.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
