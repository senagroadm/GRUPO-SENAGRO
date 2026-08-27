'use client';

import React from 'react';
import { Activity, Database, Server, RefreshCw, Cpu, HardDrive } from 'lucide-react';
import { useHealth } from '../hooks/use-health';

export function HealthStatusCard() {
  const { data, loading, error, refetch } = useHealth(60000);

  const isHealthy = data?.status === 'pass';
  const isDbHealthy = data?.checks?.database?.status === 'healthy';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            Saúde da Infraestrutura (GET /api/v1/health)
          </h3>
        </div>
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Recarregar status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {error ? (
        <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-200">
          Erro ao conectar com API de Health Check: {error}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Server className="w-3 h-3 text-slate-500" /> Status Geral
            </span>
            <div className="mt-1 font-bold text-slate-900 flex items-center gap-1.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${isHealthy ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {data?.status?.toUpperCase() || 'OFFLINE'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Database className="w-3 h-3 text-slate-500" /> PostgreSQL 16
            </span>
            <div className="mt-1 font-bold text-slate-900 flex items-center gap-1.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${isDbHealthy ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                {isDbHealthy ? 'CONECTADO' : 'STANDBY'}
              </span>
              {data?.checks?.database?.latencyMs !== undefined && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {data.checks.database.latencyMs}ms
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Cpu className="w-3 h-3 text-slate-500" /> Runtime
            </span>
            <div className="mt-1 font-mono text-xs text-slate-800 font-semibold">
              Node {data?.system?.nodeVersion || 'v20'} ({data?.environment || 'dev'})
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-slate-500" /> Memória RSS
            </span>
            <div className="mt-1 font-mono text-xs text-slate-800 font-semibold">
              {data?.system?.memoryUsageMb?.rss || 0} MB
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
