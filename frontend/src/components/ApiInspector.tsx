'use client';

import React, { useState } from 'react';
import { Play, Code2, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';

interface EndpointConfig {
  name: string;
  method: 'GET' | 'POST';
  url: string;
  description: string;
}

const ENDPOINTS: EndpointConfig[] = [
  {
    name: 'Health Check',
    method: 'GET',
    url: '/api/v1/health',
    description: 'Status do sistema, PostgreSQL, uptime e memória',
  },
  {
    name: 'Sessão & Tenant Ativo',
    method: 'GET',
    url: '/api/v1/auth/me',
    description: 'Resolução do usuário e das empresas autorizadas (multi-tenant)',
  },
  {
    name: 'Listagem Paginada de Empresas',
    method: 'GET',
    url: '/api/v1/companies?page=1&limit=3',
    description: 'Padrão oficial de paginação, filtros e metadados',
  },
];

function generateTraceId(prefix: string): string {
  return `${prefix}-${Math.floor(Math.random() * 1000000).toString(36)}`;
}

export function ApiInspector() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointConfig>(ENDPOINTS[0]);
  const [response, setResponse] = useState<unknown>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const executeCall = async (endpoint: EndpointConfig) => {
    setLoading(true);
    setSelectedEndpoint(endpoint);
    try {
      const res = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'x-request-id': generateTraceId('test-inspector'),
          'x-correlation-id': generateTraceId('corr-manual-test'),
        },
      });

      setStatusCode(res.status);

      const headersObj: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        if (key.startsWith('x-') || key === 'content-type') {
          headersObj[key] = val;
        }
      });
      setResponseHeaders(headersObj);

      const json = await res.json();
      setResponse(json);
    } catch (err) {
      setStatusCode(500);
      setResponse({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  };

  const copyJson = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-600" />
            Testador & Inspetor da API v1 (/api/v1/*)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Execução em tempo real de endpoints versionados com request-id e cabeçalhos HTTP</p>
        </div>
      </div>

      {/* Endpoint Selector Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {ENDPOINTS.map((ep) => {
          const isSelected = selectedEndpoint.name === ep.name;
          return (
            <button
              key={ep.name}
              onClick={() => executeCall(ep)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white">
                  {ep.method}
                </span>
                <Play className="w-3 h-3 text-blue-600" />
              </div>
              <div className="text-xs font-bold text-slate-900">{ep.name}</div>
              <div className="text-[10px] text-slate-500 font-mono truncate">{ep.url}</div>
            </button>
          );
        })}
      </div>

      {/* Response Box */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-xs font-mono">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-300 font-semibold">{selectedEndpoint.method} {selectedEndpoint.url}</span>
            {statusCode !== null && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusCode >= 200 && statusCode < 300 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                HTTP {statusCode}
              </span>
            )}
          </div>
          {response !== null && (
            <button
              onClick={copyJson}
              className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copiado!' : 'Copiar JSON'}
            </button>
          )}
        </div>

        {/* Response Headers */}
        {Object.keys(responseHeaders).length > 0 && (
          <div className="mb-3 text-[10px] text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800 space-y-0.5">
            {Object.entries(responseHeaders).map(([k, v]) => (
              <div key={k}>
                <span className="text-blue-400">{k}:</span> {v}
              </div>
            ))}
          </div>
        )}

        {/* JSON Content */}
        <pre className="overflow-x-auto text-[11px] text-slate-200 leading-relaxed max-h-72 scrollbar-thin">
          {loading ? (
            <span className="text-slate-500">Executando requisição HTTP...</span>
          ) : response ? (
            JSON.stringify(response, null, 2)
          ) : (
            <span className="text-slate-500">Clique em um dos endpoints acima para disparar a requisição.</span>
          )}
        </pre>
      </div>
    </div>
  );
}
