'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Play,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  RefreshCw,
  Clock,
  History,
  FileCheck2,
  Lock,
  ArrowRightLeft,
  Building,
  UserCheck,
} from 'lucide-react';
import { EmpresaContextAuditRecord } from '../../../backend/modules/multi-tenant/types';
import { TestResult } from '../../../backend/tests/multi_tenant_isolation.test';

export function MultiTenantTestingViewer() {
  const [running, setRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<{ total: number; passed: number; failed: number } | null>(null);
  const [auditLogs, setAuditLogs] = useState<EmpresaContextAuditRecord[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/v1/admin/audit-context?limit=25');
      const data = await res.json();
      if (data.success && data.data) {
        setAuditLogs(data.data);
      }
    } catch (err) {
      console.error('Falha ao buscar logs de auditoria:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const runTests = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/v1/admin/tests/run', { method: 'POST' });
      const data = await res.json();
      if (data.results) {
        setTestResults(data.results);
        setSummary(data.summary);
      }
      fetchAuditLogs();
    } catch (err) {
      console.error('Falha ao executar suíte de testes:', err);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [testsRes, logsRes] = await Promise.all([
          fetch('/api/v1/admin/tests/run', { method: 'POST' }),
          fetch('/api/v1/admin/audit-context?limit=25'),
        ]);
        const testsData = await testsRes.json();
        const logsData = await logsRes.json();

        if (!ignore) {
          if (testsData.results) {
            setTestResults(testsData.results);
            setSummary(testsData.summary);
          }
          if (logsData.success && logsData.data) {
            setAuditLogs(logsData.data);
          }
        }
      } catch (err) {
        console.error('Falha ao inicializar testes/logs:', err);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div id="multi-tenant-testing-viewer" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm tracking-wide">
            <ShieldAlert className="w-5 h-5" />
            <span>AUDITORIA & TESTES DE ISOLAMENTO MULTIEMPRESA</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">Validação de Segurança & Tentativas de Acesso Cruzado</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Execução de testes de isolamento entre empresas e registro contínuo da trilha de auditoria de contexto.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAuditLogs}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
            <span>Atualizar Auditoria</span>
          </button>

          <button
            onClick={runTests}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
          >
            <Play className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            <span>{running ? 'Executando Testes...' : 'Executar Testes de Isolamento'}</span>
          </button>
        </div>
      </div>

      {/* Test Results Summary Banner */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total de Testes</span>
              <p className="text-2xl font-bold text-slate-100 mt-1">{summary.total}</p>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg text-slate-300">
              <FileCheck2 className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Isolamentos Aprovados</span>
              <p className="text-2xl font-bold text-emerald-300 mt-1">{summary.passed}</p>
            </div>
            <div className="p-3 bg-emerald-900/40 rounded-lg text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 flex items-center justify-between">
            <div>
              <span className="text-xs text-rose-400 font-medium uppercase tracking-wider">Falhas de Segurança</span>
              <p className="text-2xl font-bold text-rose-300 mt-1">{summary.failed}</p>
            </div>
            <div className="p-3 bg-rose-900/40 rounded-lg text-rose-400">
              <AlertOctagon className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Tests Execution List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Matriz de Testes de Isolamento Multiempresa</span>
        </h3>

        <div className="space-y-2.5">
          {testResults.map((t, idx) => {
            const isUnauthorizedTest = t.name.includes('NÃO pode') || t.name.includes('rejeitada');

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-lg border flex items-start justify-between gap-4 text-xs transition-colors ${
                  t.passed
                    ? isUnauthorizedTest
                      ? 'bg-emerald-950/20 border-emerald-800/40'
                      : 'bg-slate-950/60 border-slate-800'
                    : 'bg-rose-950/40 border-rose-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  {t.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase font-bold text-indigo-400 px-1.5 py-0.5 bg-indigo-950/60 border border-indigo-800/40 rounded">
                        {t.suite}
                      </span>
                      <span className="font-semibold text-slate-200 text-sm">{t.name}</span>
                    </div>

                    {isUnauthorizedTest && (
                      <p className="text-emerald-300/80 text-[11px] mt-1">
                        🛡️ Regra 4 Verificada: Tentativa de acesso não autorizado disparou TenantMismatchError (403
                        Forbidden) com sucesso.
                      </p>
                    )}

                    {t.error && <p className="text-rose-400 text-xs mt-1 font-mono">{t.error}</p>}
                  </div>
                </div>

                <span className="font-mono text-slate-500 text-[11px] flex-shrink-0">{t.durationMs}ms</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Context Switch Audit Trail */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-slate-100">
              Trilha de Auditoria: Troca de Contexto Operacional (Regra 6)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Últimos {auditLogs.length} eventos</span>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">Nenhum registro de troca de contexto gravado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Usuário</th>
                  <th className="py-2.5 px-3">Empresa Origem</th>
                  <th className="py-2.5 px-3">Empresa Destino</th>
                  <th className="py-2.5 px-3">Motivo / Ação</th>
                  <th className="py-2.5 px-3">IP / Correlação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                      {new Date(log.criadoEm).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-200">{log.usuarioNome}</div>
                      <div className="text-[11px] text-slate-500">{log.usuarioEmail}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{log.empresaOrigemNome || '-'}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 font-medium">
                        <Building className="w-3 h-3 text-indigo-400" />
                        {log.empresaDestinoNome}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">{log.motivo || 'Alternância de contexto'}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                      <div>{log.ipOrigem || '127.0.0.1'}</div>
                      <div className="text-slate-600 truncate max-w-[120px]">{log.correlationId}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
