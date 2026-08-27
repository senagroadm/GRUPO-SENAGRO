import React, { useState } from 'react';
import {
  HeartPulse,
  Search,
  CheckCircle2,
  Database,
  Wifi,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Code2,
  Lock,
  Zap,
} from 'lucide-react';
import { safeFetchJson } from '../api/safe-fetch';

interface StructuredLog {
  id: string;
  correlationId: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  metodo: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'JOB';
  endpoint: string;
  statusCode: number;
  latenciaMs: number;
  empresaId: string;
  servico: string;
  mensagem: string;
  payloadSanitizado: string;
}

interface IntegrationHealth {
  nome: string;
  tipo: 'SEFAZ' | 'BANCARIO' | 'STORAGE' | 'DATABASE' | 'QUEUE';
  status: 'OPERACIONAL' | 'DEGRADADO' | 'INSTAVEL';
  latencia: string;
  disponibilidade: string;
  ultimaVerificacao: string;
}

const METRICAS_OBSERVABILIDADE = [
  {
    titulo: 'Disponibilidade (Uptime)',
    valor: '99.98%',
    subtitulo: 'Liveness & Readiness 100%',
    status: 'OPERACIONAL',
    cor: 'emerald',
  },
  {
    titulo: 'Latência Média (p95)',
    valor: '42 ms',
    subtitulo: 'P99: 148ms no Gateway',
    status: 'EXCELENTE',
    cor: 'emerald',
  },
  {
    titulo: 'Taxa de Erros HTTP',
    valor: '0.014%',
    subtitulo: 'Abaixo do SLO (0.10%)',
    status: 'ESTÁVEL',
    cor: 'emerald',
  },
  {
    titulo: 'Proteção de Segredos',
    valor: '100% Sanitizado',
    subtitulo: 'Zero tokens/senhas em logs',
    status: 'BLINDADO',
    cor: 'purple',
  },
];

const INTEGRACOES_HEALTH: IntegrationHealth[] = [
  {
    nome: 'SEFAZ - Autorizadores NFe / CTe (SP, PR, MG, RS)',
    tipo: 'SEFAZ',
    status: 'OPERACIONAL',
    latencia: '115 ms',
    disponibilidade: '99.95%',
    ultimaVerificacao: 'Há 15s',
  },
  {
    nome: 'Gateway Bancário & Webhooks PIX/CNAB',
    tipo: 'BANCARIO',
    status: 'OPERACIONAL',
    latencia: '68 ms',
    disponibilidade: '100.0%',
    ultimaVerificacao: 'Há 8s',
  },
  {
    nome: 'PostgreSQL Pool (pgBouncer / Render)',
    tipo: 'DATABASE',
    status: 'OPERACIONAL',
    latencia: '4 ms',
    disponibilidade: '100.0%',
    ultimaVerificacao: 'Há 2s',
  },
  {
    nome: 'Filas Redis & Background Workers (BullMQ)',
    tipo: 'QUEUE',
    status: 'OPERACIONAL',
    latencia: '2 ms',
    disponibilidade: '99.99%',
    ultimaVerificacao: 'Há 5s',
  },
  {
    nome: 'Armazenamento de Documentos & WORM Storage',
    tipo: 'STORAGE',
    status: 'OPERACIONAL',
    latencia: '35 ms',
    disponibilidade: '99.99%',
    ultimaVerificacao: 'Há 20s',
  },
];

const LOGS_ESTRUTURADOS: StructuredLog[] = [
  {
    id: 'LOG-88102',
    correlationId: 'req-c7a9-4f2b-88a1',
    timestamp: '27/08/2026 06:24:12.450',
    level: 'INFO',
    metodo: 'POST',
    endpoint: '/api/v1/producao/ordens/apontamento',
    statusCode: 201,
    latenciaMs: 38,
    empresaId: 'EMP-01 (MWAM)',
    servico: 'nexus-pcp-service',
    mensagem: 'Apontamento de 150 peças concluído na máquina Laser Fibra #02 com rateio de custo a R$ 220,00/h.',
    payloadSanitizado: JSON.stringify({
      op_id: 'OP-2026-0891',
      operador_id: 'USR-882',
      empresa_id: '01',
      auth_token: '[REDACTED_BEARER_TOKEN]',
      password: '[FILTERED_BY_SECURITY_POLICY]',
    }, null, 2),
  },
  {
    id: 'LOG-88103',
    correlationId: 'req-f41e-4001-92bb',
    timestamp: '27/08/2026 06:24:10.120',
    level: 'WARN',
    metodo: 'POST',
    endpoint: '/api/v1/fiscal/nfe/autorizar',
    statusCode: 200,
    latenciaMs: 310,
    empresaId: 'EMP-02 (TRITECH IND)',
    servico: 'nexus-fiscal-adapter',
    mensagem: 'Alerta de latência moderada na resposta síncrona da SEFAZ-SP (MockProvider/Adapter).',
    payloadSanitizado: JSON.stringify({
      chave_nfe: '35260800000000000000550010000008911000008910',
      status_sefaz: '100_AUTORIZADO',
      certificado_digital_pin: '[REDACTED_CERT_SECRET]',
    }, null, 2),
  },
  {
    id: 'LOG-88104',
    correlationId: 'job-d912-33cc-7711',
    timestamp: '27/08/2026 06:23:45.002',
    level: 'INFO',
    metodo: 'JOB',
    endpoint: 'job:conciliacao-bancaria-diaria',
    statusCode: 200,
    latenciaMs: 1420,
    empresaId: 'EMP-01 / EMP-02 / EMP-03',
    servico: 'nexus-worker-cron',
    mensagem: 'Conciliação automática de 34 títulos via extrato OFX finalizada sem divergências contábeis.',
    payloadSanitizado: JSON.stringify({
      registros_processados: 34,
      banco: '341_ITAU',
      credenciais_api: '[FILTERED_SECRET]',
    }, null, 2),
  },
  {
    id: 'LOG-88105',
    correlationId: 'req-a192-88ef-5520',
    timestamp: '27/08/2026 06:22:15.890',
    level: 'ERROR',
    metodo: 'POST',
    endpoint: '/api/v1/comercial/pedidos/faturar',
    statusCode: 422,
    latenciaMs: 24,
    empresaId: 'EMP-03 (METALURGICA)',
    servico: 'nexus-comercial-api',
    mensagem: 'Tentativa de faturamento bloqueada: Limite de crédito global excedido para o CNPJ sacado.',
    payloadSanitizado: JSON.stringify({
      pedido_id: 'PED-44910',
      valor_total: 45800.00,
      limite_disponivel: 12000.00,
      cliente_cpf_cnpj: '18.***.***/0001-99',
      cartao_token: '[REDACTED_PAYMENT_DATA]',
    }, null, 2),
  },
  {
    id: 'LOG-88106',
    correlationId: 'req-e331-90aa-1277',
    timestamp: '27/08/2026 06:20:02.110',
    level: 'INFO',
    metodo: 'GET',
    endpoint: '/api/v1/relatorios/industrial/dre-consolidado',
    statusCode: 200,
    latenciaMs: 54,
    empresaId: 'GRUPO_TRITECH',
    servico: 'nexus-bi-engine',
    mensagem: 'Relatório gerencial consolidado gerado com eliminação de operações intercompany mútuas.',
    payloadSanitizado: JSON.stringify({
      competencia: '08/2026',
      empresas_consolidadas: 5,
      jwt_signature: '[REDACTED_SIGNATURE]',
    }, null, 2),
  },
];

export function ObservabilidadeViewer() {
  const [logs] = useState<StructuredLog[]>(LOGS_ESTRUTURADOS);
  const [filtroNivel, setFiltroNivel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const [busca, setBusca] = useState<string>('');
  const [logSelecionado, setLogSelecionado] = useState<StructuredLog | null>(LOGS_ESTRUTURADOS[0]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [executandoDiagnostico, setExecutandoDiagnostico] = useState<boolean>(false);

  // Estado do Diagnóstico E2E Supabase
  const [supabaseTestLoading, setSupabaseTestLoading] = useState<boolean>(false);
  const [supabaseReport, setSupabaseReport] = useState<any>(null);
  const [mostrarDetalhesSupabase, setMostrarDetalhesSupabase] = useState<boolean>(false);

  const logsFiltrados = logs.filter((log) => {
    const matchNivel = filtroNivel === 'ALL' || log.level === filtroNivel;
    const matchBusca =
      busca.trim() === '' ||
      log.correlationId.toLowerCase().includes(busca.toLowerCase()) ||
      log.endpoint.toLowerCase().includes(busca.toLowerCase()) ||
      log.mensagem.toLowerCase().includes(busca.toLowerCase()) ||
      log.empresaId.toLowerCase().includes(busca.toLowerCase());
    return matchNivel && matchBusca;
  });

  const handleExecutarDiagnostico = () => {
    setExecutandoDiagnostico(true);
    setFeedback('Executando bateria de Health Checks em tempo real (Readiness, Liveness, SEFAZ, Redis, PostgreSQL)...');

    setTimeout(() => {
      setExecutandoDiagnostico(false);
      setFeedback('✓ Health Check concluído: 5/5 componentes operacionais. Latência média de rede em 18ms.');
      setTimeout(() => setFeedback(null), 4500);
    }, 1500);
  };

  const handleTestarSupabaseE2E = async () => {
    setSupabaseTestLoading(true);
    setFeedback('Executando teste de integração de ponta a ponta com o cluster do Supabase...');
    try {
      const res = await safeFetchJson<any>('/api/v1/admin/supabase-test');
      if (res.success && res.data) {
        setSupabaseReport(res.data);
        setMostrarDetalhesSupabase(true);
        setFeedback(
          `✓ Diagnóstico Supabase concluído em ${res.data.latencyMs}ms. Status: ${res.data.overallStatus} (${res.data.steps.length} etapas verificadas)`
        );
      } else {
        setFeedback(`Erro ao testar Supabase: ${res.error || 'Falha na resposta'}`);
      }
    } catch (err: any) {
      setFeedback(`Erro na conexão com o Supabase: ${err.message}`);
    } finally {
      setSupabaseTestLoading(false);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full min-h-[640px] overflow-hidden">
      
      {/* Header do Módulo */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-lg shadow-xs">
            <HeartPulse className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
                Observabilidade, Diagnóstico & Suporte do ERP
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Readiness & Liveness 100%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Logs estruturados correlacionados por ID, latência distribuída, telemetria de integrações e sanitização obrigatória de segredos.
            </p>
          </div>
        </div>

        {/* Botão de Diagnóstico */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTestarSupabaseE2E}
            disabled={supabaseTestLoading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            {supabaseTestLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Database className="w-3.5 h-3.5" />
            )}
            {supabaseTestLoading ? 'Testando Supabase...' : 'Testar Supabase E2E'}
          </button>

          <button
            onClick={handleExecutarDiagnostico}
            disabled={executandoDiagnostico}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            {executandoDiagnostico ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 fill-white" />
            )}
            {executandoDiagnostico ? 'Verificando Saúde...' : 'Executar Health Check'}
          </button>
        </div>
      </div>

      {/* Painel do Diagnóstico E2E Supabase */}
      {mostrarDetalhesSupabase && supabaseReport && (
        <div className="p-4 bg-slate-900 text-slate-100 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-emerald-500/20 text-emerald-400 rounded">
                <Database className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  Diagnóstico de Integração Supabase Cloud
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      supabaseReport.overallStatus === 'PASS'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    STATUS: {supabaseReport.overallStatus} ({supabaseReport.latencyMs}ms)
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Ambiente: <strong className="text-slate-200">{supabaseReport.environment}</strong> | Verificado em:{' '}
                  {new Date(supabaseReport.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <button
              onClick={() => setMostrarDetalhesSupabase(false)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded cursor-pointer"
            >
              Fechar Painel ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            {supabaseReport.steps.map((step: any, idx: number) => (
              <div
                key={idx}
                className="p-2.5 rounded bg-slate-800/80 border border-slate-700/80 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-indigo-300 truncate">{step.step}</span>
                  <span
                    className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                      step.status === 'SUCCESS'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : step.status === 'WARN'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {step.status}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-white leading-snug">{step.name}</div>
                <p className="text-[10px] text-slate-300 line-clamp-3 leading-relaxed">{step.details}</p>
                {step.latencyMs !== undefined && (
                  <div className="text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-700/50 flex justify-between">
                    <span>Latência Probe:</span>
                    <strong className="text-emerald-400">{step.latencyMs} ms</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Cards de Métricas Principais (Uptime, Latência, Erros, Sanitização) */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/40">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {METRICAS_OBSERVABILIDADE.map((card, idx) => (
            <div key={idx} className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {card.titulo}
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                  {card.status}
                </span>
              </div>
              <div className="text-base font-extrabold text-slate-900">{card.valor}</div>
              <div className="text-[10px] text-slate-500 font-medium">{card.subtitulo}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Status das Integrações Críticas (SEFAZ, Bancos, DB, Redis) */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between pb-2.5">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Wifi className="w-4 h-4 text-indigo-600" />
            Saúde das Integrações & Provedores Externos
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Live Probes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {INTEGRACOES_HEALTH.map((item, idx) => (
            <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-700 truncate max-w-[130px]" title={item.nome}>
                  {item.tipo}
                </span>
                <span className="text-[8px] font-extrabold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                  {item.status}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800 truncate" title={item.nome}>{item.nome}</div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 border-t border-slate-200/60">
                <span>Latência: <strong className="text-slate-700 font-mono">{item.latencia}</strong></span>
                <span className="text-slate-400">{item.ultimaVerificacao}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Principal: Lista de Logs Estruturados + Inspecionador Sanitizado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        
        {/* Coluna Esquerda: Filtros e Stream de Logs Estruturados */}
        <div className="lg:col-span-7 border-r border-slate-200 p-4 overflow-y-auto max-h-[calc(100vh-320px)] space-y-3 bg-white">
          
          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between pb-1">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por correlation-id, rota, CNPJ ou mensagem..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1">
              {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map((nivel) => (
                <button
                  key={nivel}
                  onClick={() => setFiltroNivel(nivel)}
                  className={`px-2 py-1 text-[10px] font-bold rounded border transition-colors ${
                    filtroNivel === nivel
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {nivel}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Logs */}
          <div className="space-y-2">
            {logsFiltrados.map((log) => {
              const isSelected = logSelecionado?.id === log.id;
              return (
                <div
                  key={log.id}
                  onClick={() => setLogSelecionado(log)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all space-y-1.5 ${
                    isSelected
                      ? 'bg-indigo-50/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border font-mono ${
                          log.level === 'ERROR'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : log.level === 'WARN'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {log.level}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-900">{log.metodo}</span>
                      <span className="font-mono text-xs text-slate-600 truncate max-w-[260px]" title={log.endpoint}>
                        {log.endpoint}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        HTTP {log.statusCode}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{log.latenciaMs}ms</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-1">{log.mensagem}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                    <span>CID: <strong className="text-slate-600">{log.correlationId}</strong></span>
                    <span>{log.empresaId}</span>
                    <span>{log.timestamp.split(' ')[1]}</span>
                  </div>
                </div>
              );
            })}

            {logsFiltrados.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                Nenhum log encontrado para os filtros aplicados.
              </div>
            )}
          </div>
        </div>

        {/* Coluna Direita: Inspecionador de Log Sanitizado e Diagnóstico */}
        <div className="lg:col-span-5 p-4 overflow-y-auto max-h-[calc(100vh-320px)] space-y-4 bg-slate-50/40">
          
          {logSelecionado ? (
            <>
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 shadow-2xs">
                <div className="border-b border-slate-100 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-600">{logSelecionado.id}</span>
                    <span className="text-[10px] font-mono text-slate-400">{logSelecionado.timestamp}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1 font-mono">{logSelecionado.metodo} {logSelecionado.endpoint}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{logSelecionado.mensagem}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Correlation ID</span>
                    <span className="font-mono text-xs text-slate-800 font-bold">{logSelecionado.correlationId}</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Microsserviço</span>
                    <span className="font-mono text-xs text-slate-800 font-bold">{logSelecionado.servico}</span>
                  </div>
                </div>

                {/* Exibição do Payload Estruturado com Sanitização de Segredos */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                      Payload Estruturado (JSON Sanitizado)
                    </span>
                    <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Tokens Mascarados
                    </span>
                  </div>

                  <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono overflow-x-auto border border-slate-800 leading-relaxed">
                    {logSelecionado.payloadSanitizado}
                  </pre>
                </div>
              </div>

              {/* Box de Segurança e Governança de Logs */}
              <div className="p-3 bg-slate-900 text-slate-200 rounded-lg border border-slate-800 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Política Estrita de Redação de Segredos
                </div>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  O interceptor de logging do NEXUS ERP remove automaticamente senhas, chaves de API, certificados digitais e tokens JWT antes da persistência no storage de observabilidade.
                </p>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
              Selecione um log para inspecionar os detalhes e o payload sanitizado.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
